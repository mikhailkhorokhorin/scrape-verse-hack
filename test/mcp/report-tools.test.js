'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const protocol = require('../../mcp/protocol.js');
const registry = require('../../mcp/registry.js');
const reports = require('../../mcp/report-tools.js');
const evidence = require('../../tools/evidence-lib.js');
const numbers = require('../../tools/numbers-audit.js');

const ask = (message) => protocol.handleLine(JSON.stringify(message), registry);
const callTool = (name, args) =>
  ask({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const textOf = (response) => response.result.content[0].text;

const FIRST = evidence.readIncidents()[0];

test('the registry lists eight tools', () => {
  assert.equal(registry.schemas().length, 8);
});

test('evidence_report and numbers_audit are both registered by name', () => {
  const names = registry.schemas().map((tool) => tool.name);
  assert.ok(names.includes('evidence_report'));
  assert.ok(names.includes('numbers_audit'));
});

test('both new tools declare they read recorded data only', () => {
  for (const name of ['evidence_report', 'numbers_audit']) {
    const tool = registry.schemas().find((one) => one.name === name);
    assert.match(tool.description, /[Rr]eads recorded data only/);
  }
});

test('neither new tool warns about credits because neither spends any', () => {
  for (const name of ['evidence_report', 'numbers_audit']) {
    const tool = registry.schemas().find((one) => one.name === name);
    assert.ok(!tool.description.includes(registry.SPENDS_CREDITS));
  }
});

test('the two credit-spending tools are the only ones that carry the credit warning', () => {
  const warned = registry.schemas()
    .filter((tool) => tool.description.includes(registry.SPENDS_CREDITS))
    .map((tool) => tool.name);
  assert.deepEqual(warned, ['scan_fleet', 'heal_spider']);
});

test('evidence_report takes an optional incident id and rejects anything else', () => {
  const tool = registry.schemas().find((one) => one.name === 'evidence_report');
  assert.deepEqual(Object.keys(tool.inputSchema.properties), ['incident_id']);
  assert.equal(tool.inputSchema.required, undefined);
  assert.equal(tool.inputSchema.additionalProperties, false);
});

test('numbers_audit takes no arguments at all', () => {
  const tool = registry.schemas().find((one) => one.name === 'numbers_audit');
  assert.deepEqual(tool.inputSchema.properties, {});
  assert.equal(tool.inputSchema.additionalProperties, false);
});

test('evidence_report on one incident prints that incident and no other', () => {
  const text = textOf(callTool('evidence_report', { incident_id: FIRST.id }));
  assert.match(text, new RegExp(`EVIDENCE ${FIRST.id}`));
  assert.match(text, /1 incident,/);
});

test('evidence_report prints the collector id unchanged across the repair', () => {
  const text = textOf(callTool('evidence_report', { incident_id: FIRST.id }));
  assert.ok(text.includes(`${FIRST.collector_id} -> ${FIRST.collector_id}`));
  assert.match(text, /re-woven in place, not replaced/);
});

test('evidence_report prints a sha256 digest that matches the record on disk', () => {
  const text = textOf(callTool('evidence_report', { incident_id: FIRST.id }));
  assert.ok(text.includes(evidence.digestOfRecord(FIRST)));
});

test('evidence_report with no argument covers every recorded incident', () => {
  const text = textOf(callTool('evidence_report', {}));
  for (const incident of evidence.readIncidents()) {
    assert.ok(text.includes(`EVIDENCE ${incident.id}`));
  }
});

test('evidence_report names the known ids when asked for one that does not exist', () => {
  const response = callTool('evidence_report', { incident_id: 'inc_nope' });
  assert.equal(response.result.isError, true);
  assert.match(textOf(response), /unknown incident id: inc_nope/);
});

test('evidence_report rejects an empty incident id rather than reporting on everything', () => {
  const response = callTool('evidence_report', { incident_id: '  ' });
  assert.equal(response.result.isError, true);
  assert.match(textOf(response), /incident_id must be a non-empty string/);
});

test('evidence_report rejects a non-string incident id', () => {
  assert.throws(() => reports.requestedIds({ incident_id: 7 }), /non-empty string/);
});

test('an omitted incident id asks for every incident', () => {
  assert.deepEqual(reports.requestedIds({}), []);
});

test('numbers_audit prints the same scan count that numbers-audit.js computes', () => {
  const text = textOf(callTool('numbers_audit', {}));
  assert.ok(text.includes(String(numbers.truth().scans)));
  assert.match(text, /scans recorded in history\.json/);
});

test('numbers_audit prints a label for every key the audit returns', () => {
  const text = textOf(callTool('numbers_audit', {}));
  for (const key of Object.keys(numbers.truth())) {
    assert.ok(reports.LABEL[key], `missing label for ${key}`);
    assert.ok(text.includes(reports.LABEL[key]));
  }
});

test('numbers_audit tells the reader the command that recomputes the same table', () => {
  assert.match(textOf(callTool('numbers_audit', {})), /node tools\/numbers-audit\.js/);
});

test('a null value in the audit prints as none rather than as the word null', () => {
  const lines = reports.auditLines({ spanHours: null });
  assert.match(lines[0], /\bnone\b/);
});

test('every audit line puts the number before the sentence that explains it', () => {
  for (const line of reports.auditLines(numbers.truth())) {
    assert.match(line, /^ {2}\s*\S+ {2}\S/);
  }
});

test('evidence_report reaches the same text through the module as through the registry', () => {
  const direct = reports.evidenceReport({ incident_id: FIRST.id }).content[0].text;
  assert.equal(direct, textOf(callTool('evidence_report', { incident_id: FIRST.id })));
});

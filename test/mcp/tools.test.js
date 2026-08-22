'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const lib = require('../../scripts/lib.js');
const protocol = require('../../mcp/protocol.js');
const registry = require('../../mcp/registry.js');

const ask = (message) => protocol.handleLine(JSON.stringify(message), registry);
const callTool = (name, args) =>
  ask({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const textOf = (response) => response.result.content[0].text;

const COLLECTORS = [{
  codename: 'BODEGA',
  collector_id: 'c_test',
  universe: 'shop.test',
  url: 'https://shop.test/',
  rows_per_run: 2,
  fields: { title: { type: 'string', min: 3, max: 200 }, price: { type: 'number', min: 0.01 } }
}];

const BROKEN_RUN = {
  collector_id: 'c_test', spider: 'BODEGA', universe: 'shop.test',
  ts: '2026-08-21T05:00:00.000Z',
  fields_expected: ['title', 'price'], fields_live: ['title'],
  fields_infected: [], fields_dead: ['price'],
  integrity: 50, status: 'CRITICAL', rows: 2,
  sample: { title: 'Widget', price: null }
};

const INCIDENT = {
  id: 'inc_900', spider: 'BODEGA', collector_id: 'c_test', strain: 'RENAMED',
  opened_at: '2026-08-21T05:00:00.000Z', closed_at: '2026-08-21T05:10:00.000Z',
  integrity_before: 50, integrity_after: 100,
  anomalies: ['price'], recovered_fields: ['price'],
  summary: 'price came back.', rows_per_run: 2, heal_prompt: 'fix price', resolved: true,
  stages: [
    { stage: 'DETECTED', ts: '2026-08-21T05:00:00.000Z' },
    { stage: 'DIAGNOSED', ts: '2026-08-21T05:01:00.000Z' },
    { stage: 'REWEAVING', ts: '2026-08-21T05:02:00.000Z' },
    { stage: 'VERIFIED', ts: '2026-08-21T05:10:00.000Z' }
  ]
};


function withFixtures(fixtures, fn) {
  const real = {
    collectors: lib.collectors, history: lib.history, incidents: lib.incidents,
    bdata: lib.bdata, appendHistory: lib.appendHistory, appendIncident: lib.appendIncident
  };
  lib.collectors = () => fixtures.collectors || [];
  lib.history = () => fixtures.history || [];
  lib.incidents = () => fixtures.incidents || [];
  lib.appendHistory = fixtures.appendHistory || (() => {});
  lib.appendIncident = fixtures.appendIncident || (() => {});
  if (fixtures.bdata) lib.bdata = fixtures.bdata;
  try { return fn(); }
  finally { Object.assign(lib, real); }
}

test('fleet_status reports the latest run for each spider', () => {
  const text = withFixtures({ collectors: COLLECTORS, history: [BROKEN_RUN] },
    () => textOf(callTool('fleet_status', {})));
  assert.match(text, /BODEGA/);
  assert.match(text, /integrity 50%\s+CRITICAL/);
});

test('fleet_status names the fields that are dead', () => {
  const text = withFixtures({ collectors: COLLECTORS, history: [BROKEN_RUN] },
    () => textOf(callTool('fleet_status', {})));
  assert.match(text, /dead: price/);
});

test('fleet_status flags a spider that was never scanned', () => {
  const text = withFixtures({ collectors: COLLECTORS, history: [] },
    () => textOf(callTool('fleet_status', {})));
  assert.match(text, /never scanned/);
});

test('spider_history honours the limit argument', () => {
  const runs = [1, 2, 3].map((n) => ({ ...BROKEN_RUN, ts: `2026-08-2${n}T05:00:00.000Z` }));
  const text = withFixtures({ collectors: COLLECTORS, history: runs },
    () => textOf(callTool('spider_history', { spider: 'BODEGA', limit: 2 })));
  assert.match(text, /showing last 2/);
  assert.ok(!text.includes('2026-08-21T05:00:00.000Z'));
});

test('spider_history accepts a lowercase codename', () => {
  const text = withFixtures({ collectors: COLLECTORS, history: [BROKEN_RUN] },
    () => textOf(callTool('spider_history', { spider: 'bodega' })));
  assert.match(text, /BODEGA/);
});

test('spider_history rejects a non-positive limit', () => {
  const response = withFixtures({ collectors: COLLECTORS, history: [BROKEN_RUN] },
    () => callTool('spider_history', { spider: 'BODEGA', limit: 0 }));
  assert.equal(response.result.isError, true);
});

test('incident_log summarises strain and the integrity swing', () => {
  const text = withFixtures({ collectors: COLLECTORS, incidents: [INCIDENT] },
    () => textOf(callTool('incident_log', {})));
  assert.match(text, /inc_900/);
  assert.match(text, /strain=RENAMED/);
  assert.match(text, /integrity 50% -> 100%/);
});

test('incident_log filters to a single spider', () => {
  const other = { ...INCIDENT, id: 'inc_901', spider: 'ATLAS' };
  const text = withFixtures({
    collectors: [...COLLECTORS, { ...COLLECTORS[0], codename: 'ATLAS' }],
    incidents: [INCIDENT, other]
  }, () => textOf(callTool('incident_log', { spider: 'ATLAS' })));
  assert.match(text, /inc_901/);
  assert.ok(!text.includes('inc_900'));
});

test('heal_receipt lists every phase with its timestamp', () => {
  const text = withFixtures({ collectors: COLLECTORS, incidents: [INCIDENT] },
    () => textOf(callTool('heal_receipt', { incident_id: 'inc_900' })));
  for (const stage of ['DETECTED', 'DIAGNOSED', 'REWEAVING', 'VERIFIED']) {
    assert.match(text, new RegExp(stage));
  }
});

test('heal_receipt reports the gap between phases and the total repair time', () => {
  const text = withFixtures({ collectors: COLLECTORS, incidents: [INCIDENT] },
    () => textOf(callTool('heal_receipt', { incident_id: 'inc_900' })));
  assert.match(text, /\+60s/);
  assert.match(text, /total 600s/);
});

test('heal_receipt proves the collector_id never changed', () => {
  const text = withFixtures({ collectors: COLLECTORS, incidents: [INCIDENT] },
    () => textOf(callTool('heal_receipt', { incident_id: 'inc_900' })));
  assert.match(text, /collector_id never changed/);
  assert.match(text, /c_test/);
});

test('heal_receipt errors on an unknown incident id', () => {
  const response = withFixtures({ collectors: COLLECTORS, incidents: [INCIDENT] },
    () => callTool('heal_receipt', { incident_id: 'inc_nope' }));
  assert.equal(response.result.isError, true);
});

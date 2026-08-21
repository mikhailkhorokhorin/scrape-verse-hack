'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture } = require('./web-loader.js');

const web = loadWebModule(['config.js', 'format.js', 'issue.js']);
const {
  issueNumberOf, issueLabelOf, issueHashOf, parseIssueHash, findIssue, worstRunOf,
} = web;

test('issueNumberOf reads the issue number out of a real incident id', () => {
  assert.equal(issueNumberOf('inc_004'), 4);
  assert.equal(issueNumberOf('inc_001'), 1);
  assert.equal(issueNumberOf('inc_014'), 14);
});

test('issueNumberOf drops the zero padding rather than keeping it', () => {
  assert.equal(issueNumberOf('inc_007'), 7);
  assert.equal(issueNumberOf('inc_100'), 100);
});

test('issueNumberOf tolerates surrounding whitespace', () => {
  assert.equal(issueNumberOf('  inc_002  '), 2);
});

test('issueNumberOf rejects anything that is not an incident id', () => {
  assert.equal(issueNumberOf('inc_'), null);
  assert.equal(issueNumberOf('incident_4'), null);
  assert.equal(issueNumberOf('inc_4x'), null);
  assert.equal(issueNumberOf('4'), null);
  assert.equal(issueNumberOf(''), null);
  assert.equal(issueNumberOf(null), null);
  assert.equal(issueNumberOf(undefined), null);
});

test('issueNumberOf rejects inc_000 because there is no issue zero', () => {
  assert.equal(issueNumberOf('inc_000'), null);
});

test('issueLabelOf builds the cover line the feed prints', () => {
  assert.equal(issueLabelOf('inc_003'), 'ISSUE #3');
});

test('issueLabelOf degrades to a bare word for an unusable id', () => {
  assert.equal(issueLabelOf('nonsense'), 'ISSUE');
});

test('issueHashOf produces the permalink each card exposes', () => {
  assert.equal(issueHashOf('inc_002'), '#inc_002');
});

test('issueHashOf refuses to mint a link for a malformed id', () => {
  assert.equal(issueHashOf('inc_'), '');
  assert.equal(issueHashOf(''), '');
});

test('parseIssueHash reads an incident id out of the location hash', () => {
  assert.equal(parseIssueHash('#inc_002'), 'inc_002');
  assert.equal(parseIssueHash('inc_002'), 'inc_002');
});

test('parseIssueHash decodes a percent-encoded hash', () => {
  assert.equal(parseIssueHash('#inc%5F002'), 'inc_002');
});

test('parseIssueHash falls back to null for an absent hash', () => {
  assert.equal(parseIssueHash(''), null);
  assert.equal(parseIssueHash('#'), null);
  assert.equal(parseIssueHash(undefined), null);
  assert.equal(parseIssueHash(null), null);
});

test('parseIssueHash falls back to null for a garbage hash', () => {
  assert.equal(parseIssueHash('#nope'), null);
  assert.equal(parseIssueHash('#inc_'), null);
  assert.equal(parseIssueHash('#<script>'), null);
  assert.equal(parseIssueHash('#inc_002/../../etc'), null);
});

test('parseIssueHash survives an undecodable percent sequence', () => {
  assert.equal(parseIssueHash('#%E0%A4%A'), null);
});

test('findIssue locates the incident a hash names', () => {
  const incidents = readFixture('incidents.json');
  const found = findIssue(incidents, 'inc_002');
  assert.ok(found);
  assert.equal(found.id, 'inc_002');
});

test('findIssue returns null for an id no incident carries', () => {
  const incidents = readFixture('incidents.json');
  assert.equal(findIssue(incidents, 'inc_999'), null);
  assert.equal(findIssue(incidents, null), null);
  assert.equal(findIssue(null, 'inc_002'), null);
});

test('every id in the shipped incidents file yields an issue number', () => {
  const incidents = readFixture('incidents.json');
  assert.ok(incidents.length > 0);
  for (const inc of incidents) {
    assert.ok(issueNumberOf(inc.id) !== null, inc.id + ' has no issue number');
  }
});

test('worstRunOf returns the lowest-integrity run inside the incident window', () => {
  const history = readFixture('history.json');
  const incidents = readFixture('incidents.json');
  for (const inc of incidents) {
    const run = worstRunOf(history, inc);
    assert.ok(run, inc.id + ' has no run in its window');
    assert.equal(run.collector_id, inc.collector_id);
    const window = history.filter((r) =>
      r.collector_id === inc.collector_id &&
      Date.parse(r.ts) >= Date.parse(inc.opened_at) &&
      Date.parse(r.ts) <= Date.parse(inc.closed_at || inc.opened_at));
    const lowest = Math.min(...window.map((r) => Number(r.integrity)));
    assert.equal(Number(run.integrity), lowest);
  }
});

test('worstRunOf ignores runs belonging to another collector', () => {
  const incident = {
    collector_id: 'c_a', opened_at: '2026-01-01T00:00:00Z', closed_at: '2026-01-01T02:00:00Z',
  };
  const history = [
    { collector_id: 'c_b', ts: '2026-01-01T00:30:00Z', integrity: 0 },
    { collector_id: 'c_a', ts: '2026-01-01T00:30:00Z', integrity: 40 },
  ];
  assert.equal(worstRunOf(history, incident).integrity, 40);
});

test('worstRunOf ignores runs outside the open-to-closed window', () => {
  const incident = {
    collector_id: 'c_a', opened_at: '2026-01-01T00:00:00Z', closed_at: '2026-01-01T02:00:00Z',
  };
  const history = [
    { collector_id: 'c_a', ts: '2025-12-31T23:00:00Z', integrity: 5 },
    { collector_id: 'c_a', ts: '2026-01-01T01:00:00Z', integrity: 55 },
    { collector_id: 'c_a', ts: '2026-01-01T03:00:00Z', integrity: 1 },
  ];
  assert.equal(worstRunOf(history, incident).integrity, 55);
});

test('worstRunOf returns null rather than erroring on unusable input', () => {
  assert.equal(worstRunOf(null, { collector_id: 'c_a', opened_at: '2026-01-01T00:00:00Z' }), null);
  assert.equal(worstRunOf([], null), null);
  assert.equal(worstRunOf([], { collector_id: 'c_a', opened_at: 'not-a-date' }), null);
  assert.equal(worstRunOf([], { collector_id: 'c_a', opened_at: '2026-01-01T00:00:00Z' }), null);
});

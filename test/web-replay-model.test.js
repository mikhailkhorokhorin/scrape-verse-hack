'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('./web-loader.js');

const web = loadWebModule([
  'config.js',
  'format.js',
  'value.js',
  'infection.js',
  'adapter.js',
  'replay-data.js',
]);
const { buildReplay, pickReplay } = web;

const HISTORY = readFixture('history.json');
const INCIDENTS = readFixture('incidents.json');
const INCIDENT = INCIDENTS.find((inc) => inc.id === 'inc_002');

test('buildReplay rejects an incident that never closed', () => {
  assert.equal(buildReplay(Object.assign({}, INCIDENT, { closed_at: null }), HISTORY), null);
});

test('buildReplay rejects an incident whose final integrity is absent', () => {
  assert.equal(buildReplay(Object.assign({}, INCIDENT, { integrity_after: undefined }), HISTORY), null);
});

test('buildReplay rejects an incident whose final integrity is not a number', () => {
  assert.equal(buildReplay(Object.assign({}, INCIDENT, { integrity_after: 'lots' }), HISTORY), null);
});

test('buildReplay rejects a null final integrity instead of inventing zero', () => {
  assert.equal(buildReplay(Object.assign({}, INCIDENT, { integrity_after: null }), HISTORY), null);
});

test('buildReplay rejects a null incident', () => {
  assert.equal(buildReplay(null, HISTORY), null);
});

test('buildReplay rejects an incident with fewer than two usable stages', () => {
  const thin = Object.assign({}, INCIDENT, { stages: INCIDENT.stages.slice(0, 1) });
  assert.equal(buildReplay(thin, HISTORY), null);
});

test('buildReplay drops stages with unparseable timestamps before counting them', () => {
  const dirty = Object.assign({}, INCIDENT, {
    stages: [INCIDENT.stages[0], { stage: 'DIAGNOSED', ts: 'not-a-date' }],
  });
  assert.equal(buildReplay(dirty, HISTORY), null);
});

test('buildReplay rejects an incident whose stages all share one timestamp', () => {
  const flat = Object.assign({}, INCIDENT, {
    stages: INCIDENT.stages.map((st) => ({ stage: st.stage, ts: INCIDENT.stages[0].ts })),
  });
  assert.equal(buildReplay(flat, HISTORY), null);
});

test('buildReplay still builds a model when the history has no matching runs', () => {
  const solo = buildReplay(INCIDENT, []);
  assert.ok(solo);
  assert.equal(solo.pair, null);
  assert.equal(solo.blastRows, 0);
});

test('buildReplay falls back to the anomaly list for fields when there is no pair', () => {
  const solo = buildReplay(INCIDENT, []);
  assert.deepEqual(plain(solo.fields.map((f) => f.name)), INCIDENT.anomalies);
  assert.equal(solo.fields[0].before, 'live');
});

test('pickReplay returns the newest verified incident of the fixture set', () => {
  const picked = pickReplay(INCIDENTS, HISTORY);
  assert.ok(picked);
  assert.ok(picked.stages.some((st) => st.name === 'VERIFIED'));
  const newest = INCIDENTS
    .filter((inc) => inc.closed_at)
    .reduce((best, inc) => (Date.parse(inc.opened_at) > Date.parse(best.opened_at) ? inc : best));
  assert.equal(picked.id, newest.id);
});

test('pickReplay returns null when nothing is usable', () => {
  assert.equal(pickReplay([], HISTORY), null);
  assert.equal(pickReplay([Object.assign({}, INCIDENT, { closed_at: null })], HISTORY), null);
});

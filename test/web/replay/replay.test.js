'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('../../web-loader.js');

const web = loadWebModule([
  'config.js',
  'format.js',
  'value.js',
  'infection.js',
  'adapter.js',
  'replay-data.js',
]);
const { buildReplay, findInfectionPair, elapsedOf, stageRank, stageIntegrity } = web;

const HISTORY = readFixture('history.json');
const INCIDENTS = readFixture('incidents.json');
const INCIDENT = INCIDENTS.find((inc) => inc.id === 'inc_002');

test('the fixture incident used by these tests is present and closed', () => {
  assert.ok(INCIDENT, 'inc_002 must exist in data/incidents.json');
  assert.ok(INCIDENT.closed_at);
});

test('stageRank orders the four canonical stages', () => {
  assert.ok(stageRank('DETECTED') < stageRank('DIAGNOSED'));
  assert.ok(stageRank('DIAGNOSED') < stageRank('REWEAVING'));
  assert.ok(stageRank('REWEAVING') < stageRank('VERIFIED'));
});

test('stageRank is case-insensitive', () => {
  assert.equal(stageRank('detected'), stageRank('DETECTED'));
});

test('stageRank sends an unknown stage to the end', () => {
  assert.ok(stageRank('MYSTERY') > stageRank('VERIFIED'));
});

test('elapsedOf renders sub-minute spans in seconds', () => {
  assert.equal(elapsedOf(0), '0s');
  assert.equal(elapsedOf(45000), '45s');
});

test('elapsedOf renders minutes with zero-padded seconds', () => {
  assert.equal(elapsedOf(60000), '1m 00s');
  assert.equal(elapsedOf(605000), '10m 05s');
});

test('elapsedOf clamps a negative or non-finite span to zero', () => {
  assert.equal(elapsedOf(-1), '0s');
  assert.equal(elapsedOf(NaN), '0s');
  assert.equal(elapsedOf(undefined), '0s');
});

test('stageIntegrity holds the before value until the re-weave starts', () => {
  assert.equal(stageIntegrity('DETECTED', 40, 100), 40);
  assert.equal(stageIntegrity('DIAGNOSED', 40, 100), 40);
});

test('stageIntegrity nudges partway up during the re-weave', () => {
  assert.equal(stageIntegrity('REWEAVING', 40, 100), 52);
});

test('stageIntegrity lands on the after value once verified', () => {
  assert.equal(stageIntegrity('VERIFIED', 40, 100), 100);
});

const model = buildReplay(INCIDENT, HISTORY);

test('buildReplay produces a model for the real closed incident', () => {
  assert.ok(model);
  assert.equal(model.id, INCIDENT.id);
  assert.equal(model.spider, INCIDENT.spider);
  assert.equal(model.collector, INCIDENT.collector_id);
  assert.equal(model.strain, INCIDENT.strain);
});

test('buildReplay carries every stage of the incident in chronological order', () => {
  assert.deepEqual(
    plain(model.stages.map((st) => st.name)),
    INCIDENT.stages.map((st) => st.stage)
  );
  const at = model.stages.map((st) => st.at);
  assert.deepEqual(plain(at), plain(at).slice().sort((a, b) => a - b));
});

test('buildReplay zeroes the first stage offset and measures the rest from it', () => {
  const t0 = Date.parse(INCIDENT.stages[0].ts);
  assert.equal(model.stages[0].at, 0);
  assert.equal(model.stages[0].offset, '0s');
  for (let i = 0; i < model.stages.length; i += 1) {
    assert.equal(model.stages[i].at, Date.parse(INCIDENT.stages[i].ts) - t0);
  }
});

test('buildReplay spans from the first stage to the last', () => {
  const stages = INCIDENT.stages;
  const span = Date.parse(stages[stages.length - 1].ts) - Date.parse(stages[0].ts);
  assert.equal(model.span, span);
  assert.equal(model.spanText, elapsedOf(span));
});

test('buildReplay makes each stage hold until the next one begins', () => {
  for (let i = 0; i < model.stages.length - 1; i += 1) {
    assert.equal(model.stages[i].until, model.stages[i + 1].at);
    assert.equal(model.stages[i].held, model.stages[i + 1].at - model.stages[i].at);
  }
  const last = model.stages[model.stages.length - 1];
  assert.equal(last.until, model.span);
});

test('buildReplay stamps each stage with its UTC clock', () => {
  for (let i = 0; i < model.stages.length; i += 1) {
    assert.equal(model.stages[i].clock, web.clockOf(INCIDENT.stages[i].ts));
  }
});

test('buildReplay gives every stage its narration copy', () => {
  for (const st of model.stages) {
    assert.ok(st.word, 'stage ' + st.name + ' needs a word');
    assert.ok(st.line, 'stage ' + st.name + ' needs a line');
    assert.ok(st.color);
    assert.ok(st.panelState);
  }
});

test('buildReplay ends the stage integrity curve on the recorded after value', () => {
  const last = model.stages[model.stages.length - 1];
  assert.equal(last.integrity, web.clampPct(INCIDENT.integrity_after));
  assert.equal(model.after, web.clampPct(INCIDENT.integrity_after));
});

test('buildReplay never lets the stage integrity curve run backwards', () => {
  const values = model.stages.map((st) => st.integrity);
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(values[i] >= values[i - 1], 'integrity dipped at stage ' + model.stages[i].name);
  }
});

test('buildReplay finds a clean and dirty run pair straddling the incident', () => {
  assert.ok(model.pair);
  assert.ok(Date.parse(model.pair.clean.ts) < Date.parse(model.pair.dirty.ts));
  assert.ok(Date.parse(model.pair.dirty.ts) >= Date.parse(INCIDENT.opened_at));
  assert.ok(Date.parse(model.pair.clean.ts) < Date.parse(INCIDENT.opened_at));
});

test('buildReplay draws the same pair that findInfectionPair returns directly', () => {
  const direct = findInfectionPair(HISTORY, INCIDENT);
  assert.equal(model.pair.clean.ts, direct.clean.ts);
  assert.equal(model.pair.dirty.ts, direct.dirty.ts);
});

test('buildReplay pairs two runs of the incident collector only', () => {
  assert.equal(model.pair.clean.collector_id, INCIDENT.collector_id);
  assert.equal(model.pair.dirty.collector_id, INCIDENT.collector_id);
});

test('buildReplay lists every anomalous field as broken and recovered', () => {
  for (const name of INCIDENT.anomalies) {
    const field = model.fields.find((f) => f.name === name);
    assert.ok(field, 'anomaly ' + name + ' missing from the replay fields');
    assert.notEqual(field.broken, 'live');
    assert.equal(field.after, 'live');
    assert.equal(field.recovered, true);
  }
});

test('buildReplay leaves untouched fields live across all three phases', () => {
  const untouched = model.fields.filter((f) => !INCIDENT.anomalies.includes(f.name));
  assert.ok(untouched.length > 0);
  for (const field of untouched) {
    assert.equal(field.broken, 'live');
    assert.equal(field.after, 'live');
    assert.equal(field.recovered, false);
  }
});

test('buildReplay shows what the field was actually returning while broken', () => {
  const anomaly = model.fields.find((f) => f.name === INCIDENT.anomalies[0]);
  assert.equal(anomaly.dirtyValue, model.pair.dirty.sample[anomaly.name]);
});

test('a recovered field shows the value the verification run recorded, not the older sample', () => {
  const checks = (INCIDENT.verification && INCIDENT.verification.checks) || [];
  const passed = checks.find((c) => c && c.passed);
  if (!passed) return;
  const field = model.fields.find((f) => f.name === passed.field);
  assert.equal(field.cleanValue, passed.received_after);
});

test('with no verification to read, the clean value falls back to the earlier sample', () => {
  const bare = Object.assign({}, INCIDENT);
  delete bare.verification;
  const fallback = buildReplay(bare, HISTORY);
  const anomaly = fallback.fields.find((f) => f.name === bare.anomalies[0]);
  assert.equal(anomaly.cleanValue, fallback.pair.clean.sample[anomaly.name]);
});

test('buildReplay counts blast rows over the incident window', () => {
  assert.equal(typeof model.blastRows, 'number');
  assert.ok(model.blastRows > 0);
});

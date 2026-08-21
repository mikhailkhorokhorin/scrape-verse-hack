'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const repair = require('../scripts/repair.js');
const { CONSECUTIVE_BAD_RUNS, BROKEN_BELOW, isBroken, runsFor, lastHealAt } = repair;

const run = (integrity, spider = 'BODEGA') => ({ spider, integrity });

test('isBroken ignores a collector with no history at all', () => {
  assert.equal(isBroken([], null), false);
});

test('isBroken does not trigger on a single bad scan', () => {
  assert.equal(isBroken([run(10)], null), false);
});

test('isBroken triggers on two consecutive bad scans', () => {
  assert.equal(isBroken([run(10), run(20)], null), true);
});

test('isBroken does not trigger when the most recent scan recovered', () => {
  assert.equal(isBroken([run(10), run(95)], null), false);
});

test('isBroken does not trigger when only the older scan was bad', () => {
  assert.equal(isBroken([run(10), run(BROKEN_BELOW)], null), false);
});

test('isBroken treats integrity exactly at the threshold as healthy enough', () => {
  assert.equal(isBroken([run(BROKEN_BELOW), run(BROKEN_BELOW)], null), false);
});

test('isBroken triggers one point below the threshold on both scans', () => {
  assert.equal(isBroken([run(BROKEN_BELOW - 1), run(BROKEN_BELOW - 1)], null), true);
});

test('isBroken requires the full consecutive window before triggering', () => {
  assert.equal(isBroken(Array.from({ length: CONSECUTIVE_BAD_RUNS - 1 }, () => run(0)), null),
    false);
});

test('a forced heal triggers on a single bad scan', () => {
  assert.equal(isBroken([run(10)], 'c_forced'), true);
});

test('a forced heal still refuses to run on a healthy collector', () => {
  assert.equal(isBroken([run(95)], 'c_forced'), false);
});

test('a forced heal looks only at the most recent scan', () => {
  assert.equal(isBroken([run(95), run(10)], 'c_forced'), true);
});

test('runsFor selects only the runs belonging to the named spider', () => {
  const history = [run(10, 'ATLAS'), run(20, 'BODEGA'), run(30, 'ATLAS')];
  assert.deepEqual(runsFor(history, 'ATLAS').map((r) => r.integrity), [10, 30]);
});

test('runsFor returns an empty list for a spider with no runs', () => {
  assert.deepEqual(runsFor([run(10, 'ATLAS')], 'KESTREL'), []);
});

test('lastHealAt returns zero when the spider has never been healed', () => {
  assert.equal(lastHealAt([], 'BODEGA'), 0);
});

test('lastHealAt returns the most recent opening timestamp for the spider', () => {
  const incidents = [
    { spider: 'BODEGA', opened_at: '2026-01-01T00:00:00.000Z' },
    { spider: 'BODEGA', opened_at: '2026-06-01T00:00:00.000Z' }
  ];
  assert.equal(lastHealAt(incidents, 'BODEGA'), Date.parse('2026-06-01T00:00:00.000Z'));
});

test('lastHealAt ignores incidents belonging to a different spider', () => {
  const incidents = [{ spider: 'ATLAS', opened_at: '2026-06-01T00:00:00.000Z' }];
  assert.equal(lastHealAt(incidents, 'BODEGA'), 0);
});

test('lastHealAt skips null entries in the incident ledger', () => {
  const incidents = [null, { spider: 'BODEGA', opened_at: '2026-06-01T00:00:00.000Z' }];
  assert.equal(lastHealAt(incidents, 'BODEGA'), Date.parse('2026-06-01T00:00:00.000Z'));
});

test('lastHealAt ignores an incident with an unparseable timestamp', () => {
  const incidents = [{ spider: 'BODEGA', opened_at: 'not a date' }];
  assert.equal(lastHealAt(incidents, 'BODEGA'), 0);
});

test('a heal within the cooldown window is suppressed', () => {
  const opened = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const since = Date.now() - lastHealAt([{ spider: 'BODEGA', opened_at: opened }], 'BODEGA');
  assert.ok(since < repair.COOLDOWN_MS);
});

test('a heal after the cooldown window has elapsed is allowed', () => {
  const opened = new Date(Date.now() - 3 * repair.COOLDOWN_MS).toISOString();
  const since = Date.now() - lastHealAt([{ spider: 'BODEGA', opened_at: opened }], 'BODEGA');
  assert.ok(since >= repair.COOLDOWN_MS);
});

test('a spider that has never healed is never inside the cooldown window', () => {
  assert.ok(Date.now() - lastHealAt([], 'BODEGA') >= repair.COOLDOWN_MS);
});

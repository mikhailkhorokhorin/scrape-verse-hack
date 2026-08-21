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
  'haul-data.js',
]);
const { buildHaul, haulRuns, haulRowsOf, haulNumberOf, haulIdentityOf, adaptHistory } = web;

const HISTORY = readFixture('history.json');
const SPIDERS = adaptHistory(HISTORY);
const HAULS = buildHaul(HISTORY, SPIDERS);

test('haulNumberOf reads a plain number', () => {
  assert.equal(haulNumberOf(42), 42);
  assert.equal(haulNumberOf(0), 0);
});

test('haulNumberOf rejects a non-finite number', () => {
  assert.equal(haulNumberOf(NaN), null);
  assert.equal(haulNumberOf(Infinity), null);
});

test('haulNumberOf reads the money key out of a price object', () => {
  assert.equal(haulNumberOf({ value: 17.93, currency: 'GBP' }), 17.93);
  assert.equal(haulNumberOf({ amount: 5 }), 5);
});

test('haulNumberOf returns null for an object with no numeric money key', () => {
  assert.equal(haulNumberOf({ currency: 'GBP' }), null);
});

test('haulNumberOf digs a number out of a string', () => {
  assert.equal(haulNumberOf('£17.93'), 17.93);
  assert.equal(haulNumberOf('1,234 points'), 1234);
  assert.equal(haulNumberOf('-5'), -5);
});

test('haulNumberOf returns null for a string with no digits', () => {
  assert.equal(haulNumberOf('In stock'), null);
});

test('haulNumberOf returns null for null, undefined and booleans', () => {
  assert.equal(haulNumberOf(null), null);
  assert.equal(haulNumberOf(undefined), null);
  assert.equal(haulNumberOf(true), null);
});

test('haulIdentityOf picks the first non-empty identity key', () => {
  assert.equal(haulIdentityOf({ title: 'A Book' }), 'A Book');
  assert.equal(haulIdentityOf({ name: 'Thing' }), 'Thing');
});

test('haulIdentityOf trims surrounding whitespace', () => {
  assert.equal(haulIdentityOf({ title: '  spaced  ' }), 'spaced');
});

test('haulIdentityOf skips a blank title and falls through to the next key', () => {
  assert.equal(haulIdentityOf({ title: '   ', name: 'Fallback' }), 'Fallback');
});

test('haulIdentityOf returns null when nothing identifies the row', () => {
  assert.equal(haulIdentityOf({ price: 5 }), null);
  assert.equal(haulIdentityOf(null), null);
  assert.equal(haulIdentityOf('nope'), null);
});

test('haulRuns keeps only runs of the requested collector that carry a sample', () => {
  const cid = SPIDERS[0].cid;
  const runs = haulRuns(HISTORY, cid);
  assert.ok(runs.length > 0);
  for (const run of runs) {
    assert.equal(run.collector_id, cid);
    assert.equal(typeof run.sample, 'object');
  }
});

test('haulRuns returns runs oldest-first', () => {
  const runs = haulRuns(HISTORY, SPIDERS[0].cid);
  const stamps = runs.map((run) => Date.parse(run.ts));
  assert.deepEqual(plain(stamps), plain(stamps).slice().sort((a, b) => a - b));
});

test('haulRuns ignores an unknown collector', () => {
  assert.deepEqual(plain(haulRuns(HISTORY, 'c_nothing')), []);
});

test('haulRowsOf sums positive row counts only', () => {
  assert.equal(haulRowsOf([{ rows: 20 }, { rows: 10 }]), 30);
  assert.equal(haulRowsOf([{ rows: 20 }, { rows: -5 }, { rows: 'x' }, {}]), 20);
  assert.equal(haulRowsOf([]), 0);
});

test('buildHaul returns one entry per spider', () => {
  assert.equal(HAULS.length, SPIDERS.length);
  assert.deepEqual(plain(HAULS.map((h) => h.cid)), plain(SPIDERS.map((sp) => sp.cid)));
});

test('buildHaul returns an empty list for empty history', () => {
  assert.deepEqual(plain(buildHaul([], SPIDERS)), []);
});

test('buildHaul marks a spider with no matching runs as empty', () => {
  const orphan = buildHaul(HISTORY, [{ code: 'GHOST', universe: 'x', cid: 'c_none' }]);
  assert.equal(orphan[0].empty, true);
});

test('buildHaul counts scans as the number of runs of that collector', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    assert.equal(haul.scans, HISTORY.filter((r) => r.collector_id === haul.cid).length);
  }
});

test('buildHaul totals rows across every scan of the collector', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    const expected = HISTORY
      .filter((r) => r.collector_id === haul.cid)
      .reduce((sum, r) => sum + (Number(r.rows) > 0 ? Number(r.rows) : 0), 0);
    assert.equal(haul.rowsTotal, expected);
  }
});

test('buildHaul reports the row count of the latest scan separately', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    const runs = haulRuns(HISTORY, haul.cid);
    assert.equal(haul.rowsThisScan, Number(runs[runs.length - 1].rows) || 0);
    assert.ok(haul.rowsThisScan <= haul.rowsTotal);
  }
});

test('buildHaul takes its timestamp and integrity from the latest scan', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    const runs = haulRuns(HISTORY, haul.cid);
    const latest = runs[runs.length - 1];
    assert.equal(haul.ts, latest.ts);
    assert.equal(haul.integrity, web.clampPct(latest.integrity));
  }
});

test('buildHaul never lets carrying exceed the scan count', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    assert.ok(haul.carrying <= haul.scans);
  }
});

test('buildHaul caps the shown cells at the card limit', () => {
  for (const haul of HAULS.filter((h) => !h.empty)) {
    assert.ok(haul.cells.length <= web.HAUL_MAX_CARDS);
  }
});

test('buildHaul derives a status word when the run carries none', () => {
  const runs = [
    {
      collector_id: 'c_x',
      ts: '2026-08-21T01:00:00.000Z',
      integrity: 40,
      rows: 3,
      fields_expected: ['title'],
      fields_live: [],
      sample: { title: 'x' },
    },
  ];
  const haul = buildHaul(runs, [{ code: 'X', universe: 'u', cid: 'c_x' }])[0];
  assert.equal(haul.status, 'CRITICAL');
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('../web-loader.js');

const web = loadWebModule([
  'config.js',
  'format.js',
  'value.js',
  'infection.js',
  'adapter.js',
  'haul-data.js',
]);
const { buildHaul, haulTotals, haulRuns, haulIdentityOf, haulSpread, haulMovement, haulSchemaShift, haulCellsOf, adaptHistory } = web;

const HISTORY = readFixture('history.json');
const SPIDERS = adaptHistory(HISTORY);
const HAULS = buildHaul(HISTORY, SPIDERS);

test('haulCellsOf renders every sample key with a state and text', () => {
  const runs = haulRuns(HISTORY, SPIDERS[0].cid);
  const cells = haulCellsOf(runs[runs.length - 1]);
  assert.ok(cells.length > 0);
  for (const cell of cells) {
    assert.ok(['live', 'infected', 'dead'].includes(cell.state));
    assert.equal(typeof cell.text, 'string');
  }
});

test('haulCellsOf never renders an object price as [object Object]', () => {
  const run = HISTORY.find((r) => r.sample && typeof r.sample.price === 'object' && r.sample.price);
  if (run) {
    const cell = haulCellsOf(run).find((c) => c.key === 'price');
    assert.doesNotMatch(cell.text, /\[object Object\]/);
  }
});

test('haulCellsOf orders cells by the expected field order', () => {
  const run = {
    fields_expected: ['title', 'price'],
    fields_live: ['title', 'price'],
    sample: { price: 1, title: 'a' },
  };
  assert.deepEqual(plain(haulCellsOf(run).map((c) => c.key)), ['title', 'price']);
});

test('haulCellsOf appends unexpected sample keys after the expected ones', () => {
  const run = {
    fields_expected: ['title'],
    fields_live: ['title'],
    sample: { title: 'a', surprise: 'b' },
  };
  assert.deepEqual(plain(haulCellsOf(run).map((c) => c.key)), ['title', 'surprise']);
});

test('haulCellsOf flags an empty value', () => {
  const run = { fields_expected: ['a', 'b', 'c'], fields_live: [], sample: { a: null, b: '', c: 'x' } };
  const cells = haulCellsOf(run);
  assert.equal(cells.find((c) => c.key === 'a').empty, true);
  assert.equal(cells.find((c) => c.key === 'b').empty, true);
  assert.equal(cells.find((c) => c.key === 'c').empty, false);
});

test('haulCellsOf flags an absolute image URL as media', () => {
  const run = {
    fields_expected: ['image', 'title'],
    fields_live: ['image', 'title'],
    sample: { image: 'https://example.com/a.jpg', title: 'https://example.com/b.jpg' },
  };
  const cells = haulCellsOf(run);
  assert.equal(cells.find((c) => c.key === 'image').media, true);
  assert.equal(cells.find((c) => c.key === 'title').media, false);
});

test('haulSpread reads a price spread with its currency symbol off the real history', () => {
  const runs = haulRuns(HISTORY, SPIDERS.find((sp) => sp.code === 'ATLAS').cid)
    .filter((run) => haulIdentityOf(run.sample));
  const spread = haulSpread(runs);
  assert.ok(spread, 'ATLAS should have a readable price spread');
  assert.equal(spread.key, 'price');
  assert.equal(spread.unit.prefix, '£');
  assert.doesNotMatch(spread.unit.prefix, /Ã|Â/);
});

test('haulSpread orders low, median and high consistently', () => {
  const runs = haulRuns(HISTORY, SPIDERS.find((sp) => sp.code === 'ATLAS').cid)
    .filter((run) => haulIdentityOf(run.sample));
  const spread = haulSpread(runs);
  assert.ok(spread.lo <= spread.median);
  assert.ok(spread.median <= spread.hi);
  assert.equal(spread.lo, Math.min(...spread.values));
  assert.equal(spread.hi, Math.max(...spread.values));
});

test('haulSpread counts distinct identities, not scans', () => {
  const runs = haulRuns(HISTORY, SPIDERS.find((sp) => sp.code === 'ATLAS').cid)
    .filter((run) => haulIdentityOf(run.sample));
  const spread = haulSpread(runs);
  assert.ok(spread.distinct >= 3);
  assert.ok(spread.distinct <= runs.length);
});

test('haulSpread refuses a sample with fewer than three distinct rows', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'same', price: 1 } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'same', price: 2 } },
    { ts: '2026-08-21T03:00:00.000Z', sample: { title: 'same', price: 3 } },
  ];
  assert.equal(haulSpread(runs), null);
});

test('haulSpread takes an even-length median as the mean of the middle pair', () => {
  const runs = [10, 20, 30, 40].map((price, i) => ({
    ts: '2026-08-21T0' + (i + 1) + ':00:00.000Z',
    sample: { title: 'book ' + i, price: price },
  }));
  assert.equal(haulSpread(runs).median, 25);
});

test('haulSpread returns null when no numeric field has enough readings', () => {
  const runs = [{ ts: '2026-08-21T01:00:00.000Z', sample: { title: 'a' } }];
  assert.equal(haulSpread(runs), null);
});

test('haulMovement returns null when nothing repeats across scans', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'a', points: 1 } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'b', points: 2 } },
  ];
  assert.equal(haulMovement(runs), null);
});

test('haulMovement tracks a numeric field that moved between two scans of one row', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'same', points: 10 } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'same', points: 25 } },
  ];
  const moved = haulMovement(runs);
  assert.equal(moved.id, 'same');
  assert.equal(moved.scans, 2);
  const points = moved.metrics.find((m) => m.key === 'points');
  assert.equal(points.from, 10);
  assert.equal(points.to, 25);
  assert.equal(points.delta, 15);
});

test('haulMovement ignores a field that ended where it started', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'same', points: 10 } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'same', points: 10 } },
  ];
  assert.equal(haulMovement(runs), null);
});

test('haulSchemaShift reports keys gained and lost between first and last scan', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'a', old: 1 } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'a', fresh: 2 } },
  ];
  const shift = haulSchemaShift(runs);
  assert.deepEqual(plain(shift.gone), ['old']);
  assert.deepEqual(plain(shift.gained), ['fresh']);
});

test('haulSchemaShift returns null when the shape held steady', () => {
  const runs = [
    { ts: '2026-08-21T01:00:00.000Z', sample: { title: 'a' } },
    { ts: '2026-08-21T02:00:00.000Z', sample: { title: 'b' } },
  ];
  assert.equal(haulSchemaShift(runs), null);
});

test('haulSchemaShift returns null for a single scan', () => {
  assert.equal(haulSchemaShift([{ sample: { title: 'a' } }]), null);
});

test('haulTotals sums rows and scans across the non-empty hauls', () => {
  const totals = haulTotals(HAULS);
  const live = HAULS.filter((h) => !h.empty);
  assert.equal(totals.spiders, live.length);
  assert.equal(totals.rows, live.reduce((a, h) => a + h.rowsTotal, 0));
  assert.equal(totals.scans, live.reduce((a, h) => a + h.scans, 0));
});

test('haulTotals matches the raw fixture row and scan counts', () => {
  const totals = haulTotals(HAULS);
  assert.equal(totals.scans, HISTORY.length);
  assert.equal(
    totals.rows,
    HISTORY.reduce((sum, r) => sum + (Number(r.rows) > 0 ? Number(r.rows) : 0), 0)
  );
});

test('haulTotals ignores empty hauls entirely', () => {
  const totals = haulTotals([{ empty: true }, { empty: true }]);
  assert.deepEqual(plain(totals), { spiders: 0, rows: 0, scans: 0, fields: 0 });
});

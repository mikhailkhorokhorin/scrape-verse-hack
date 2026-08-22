'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runRecord } = require('../scripts/lib/score.js');
const { verification } = require('../scripts/verify.js');
const { RESOLVED_AT, recoveredFields, describe } = require('../scripts/repair.js');

const BODEGA = {
  codename: 'BODEGA',
  collector_id: 'c_mt2lkwxa1bb5uz223s',
  universe: 'shop.test',
  rows_per_run: 4,
  fields: {
    title: { type: 'string', min: 3, max: 200 },
    price: { type: 'number', min: 0.01 },
    rating: { type: 'number', min: 0, max: 5 },
    image: { type: 'url' }
  }
};

const rowsFrom = (row) => Array.from({ length: 4 }, (_, index) => ({
  ...row,
  title: `${row.title} ${index + 1}`
}));

const scan = (row) => runRecord(BODEGA, rowsFrom(row));

const HEALTHY_ROW = {
  title: 'Bodega Sandwich',
  price: '4.50',
  rating: '4',
  image: 'https://shop.test/img/sandwich.jpg'
};

const BROKEN_ROW = { ...HEALTHY_ROW, price: null, rating: null };

const before = scan(BROKEN_ROW);

const resolvedFrom = (after) => after !== null && after.integrity >= RESOLVED_AT;

test('the run that opens the incident has two fields dead and integrity under the resolve bar', () => {
  assert.deepEqual(before.fields_dead, ['price', 'rating']);
  assert.deepEqual(before.fields_live, ['title', 'image']);
  assert.ok(before.integrity < RESOLVED_AT);
});

test('a heal that returns nothing at all is verdict NOTHING_CAME_BACK and leaves the incident open', () => {
  const after = scan(BROKEN_ROW);
  const result = verification(before, after);

  assert.equal(result.ran, true);
  assert.equal(result.checked, 2);
  assert.equal(result.passed, 0);
  assert.equal(result.verdict, 'NOTHING_CAME_BACK');
  assert.equal(resolvedFrom(after), false);
});

test('a heal whose every field comes back null is caught by the fresh scan, not by its own report', () => {
  const after = scan(BROKEN_ROW);

  assert.deepEqual(after.fields_dead, ['price', 'rating']);
  assert.deepEqual(recoveredFields(before, after), []);
  assert.equal(after.integrity, before.integrity);
});

test('a heal that returns populated garbage marks the fields INFECTED rather than live', () => {
  const after = scan({ ...HEALTHY_ROW, price: 'undefined', rating: '9000' });

  assert.deepEqual(after.fields_infected, ['price', 'rating']);
  assert.deepEqual(after.fields_dead, []);
  assert.deepEqual(after.fields_live, ['title', 'image']);
});

test('populated garbage scores below the resolve threshold and refuses to close the incident', () => {
  const after = scan({ ...HEALTHY_ROW, price: 'undefined', rating: '9000' });
  const result = verification(before, after);

  assert.equal(result.verdict, 'NOTHING_CAME_BACK');
  assert.ok(after.integrity < RESOLVED_AT);
  assert.equal(resolvedFrom(after), false);
});

test('a rating of nine thousand is populated, passes a schema, and still fails the range validator', () => {
  const after = scan({ ...HEALTHY_ROW, rating: '9000' });
  const check = verification(before, after).checks.find((one) => one.field === 'rating');

  assert.equal(check.received_after, '9000');
  assert.equal(check.to, 'infected');
  assert.equal(check.passed, false);
});

test('a price that reads back as the literal string undefined never counts as recovered', () => {
  const after = scan({ ...HEALTHY_ROW, price: 'undefined' });
  const check = verification(before, after).checks.find((one) => one.field === 'price');

  assert.equal(check.from, 'dead');
  assert.equal(check.to, 'infected');
  assert.equal(check.passed, false);
});

test('a heal that fixes one field of two is verdict PARTIAL and still leaves the incident open', () => {
  const after = scan({ ...HEALTHY_ROW, rating: null });
  const result = verification(before, after);

  assert.equal(result.passed, 1);
  assert.equal(result.checked, 2);
  assert.equal(result.verdict, 'PARTIAL');
  assert.equal(resolvedFrom(after), false);
});

test('a partial recovery names the field it brought back and the ones it did not', () => {
  const after = scan({ ...HEALTHY_ROW, rating: null });

  assert.deepEqual(recoveredFields(before, after), ['price']);
  assert.ok(describe(before, after, recoveredFields(before, after)).includes('still failing'));
});

test('a real recovery is verdict EVERY_FIELD_BACK and is the only case that closes the incident', () => {
  const after = scan(HEALTHY_ROW);
  const result = verification(before, after);

  assert.equal(result.passed, 2);
  assert.equal(result.verdict, 'EVERY_FIELD_BACK');
  assert.equal(after.integrity, 100);
  assert.equal(resolvedFrom(after), true);
});

test('a real recovery carries the actual values received on both sides of the heal', () => {
  const after = scan(HEALTHY_ROW);
  const checks = verification(before, after).checks;

  assert.deepEqual(checks.map((one) => one.received_before), [null, null]);
  assert.deepEqual(checks.map((one) => one.received_after), ['4.50', '4']);
});

test('a heal that never completed is NOT_RUN and cannot resolve anything', () => {
  const result = verification(before, null);

  assert.equal(result.ran, false);
  assert.equal(result.verdict, 'NOT_RUN');
  assert.equal(resolvedFrom(null), false);
});

test('the collector identifier is the same string before and after every one of the four heals', () => {
  const afters = [scan(BROKEN_ROW), scan({ ...HEALTHY_ROW, price: 'undefined', rating: '9000' }),
    scan({ ...HEALTHY_ROW, rating: null }), scan(HEALTHY_ROW)];

  for (const after of afters) assert.equal(after.collector_id, before.collector_id);
});

test('only the fourth of the four heals clears the resolve threshold', () => {
  const afters = [scan(BROKEN_ROW), scan({ ...HEALTHY_ROW, price: 'undefined', rating: '9000' }),
    scan({ ...HEALTHY_ROW, rating: null }), scan(HEALTHY_ROW)];

  assert.deepEqual(afters.map(resolvedFrom), [false, false, false, true]);
});

test('the four heals produce four distinct verdicts from the same broken starting run', () => {
  const verdicts = [scan(BROKEN_ROW), scan({ ...HEALTHY_ROW, price: 'undefined', rating: '9000' }),
    scan({ ...HEALTHY_ROW, rating: null }), scan(HEALTHY_ROW)]
    .map((after) => verification(before, after).verdict);

  assert.deepEqual(verdicts, ['NOTHING_CAME_BACK', 'NOTHING_CAME_BACK', 'PARTIAL', 'EVERY_FIELD_BACK']);
});

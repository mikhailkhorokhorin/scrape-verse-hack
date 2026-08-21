'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { verification, checkField, stateOf, verdictOf } = require('../scripts/verify.js');

function run(overrides) {
  return Object.assign({
    fields_expected: ['title', 'price', 'rating'],
    fields_live: ['title'],
    fields_infected: ['rating'],
    fields_dead: ['price'],
    integrity: 50,
    sample: { title: 'A book', price: null, rating: 'undefined' },
  }, overrides || {});
}

const HEALED = run({
  fields_live: ['title', 'price', 'rating'],
  fields_infected: [],
  fields_dead: [],
  integrity: 100,
  sample: { title: 'A book', price: 12.5, rating: 4 },
});

test('stateOf reads the three field states off a run', () => {
  assert.equal(stateOf(run(), 'title'), 'live');
  assert.equal(stateOf(run(), 'rating'), 'infected');
  assert.equal(stateOf(run(), 'price'), 'dead');
});

test('checkField carries the value actually received on both sides', () => {
  const check = checkField(run(), HEALED, 'price');
  assert.equal(check.received_before, null);
  assert.equal(check.received_after, 12.5);
});

test('a field only passes when it came back live', () => {
  assert.equal(checkField(run(), HEALED, 'rating').passed, true);
  assert.equal(checkField(run(), run(), 'rating').passed, false);
});

test('a field missing from the sample reads as null, not undefined', () => {
  const before = run({ sample: { title: 'A book' } });
  assert.equal(checkField(before, HEALED, 'price').received_before, null);
});

test('verification checks exactly the fields that were broken', () => {
  const result = verification(run(), HEALED);
  assert.equal(result.checked, 2);
  assert.deepEqual(result.checks.map((c) => c.field), ['price', 'rating']);
});

test('verification counts how many fields came back', () => {
  const result = verification(run(), HEALED);
  assert.equal(result.passed, 2);
  assert.equal(result.verdict, 'EVERY_FIELD_BACK');
});

test('a heal that fixed nothing is recorded as such, not as a success', () => {
  const result = verification(run(), run());
  assert.equal(result.passed, 0);
  assert.equal(result.verdict, 'NOTHING_CAME_BACK');
});

test('a partial heal is named partial', () => {
  const partial = run({
    fields_live: ['title', 'price'],
    fields_infected: ['rating'],
    fields_dead: [],
    sample: { title: 'A book', price: 12.5, rating: 'undefined' },
  });
  assert.equal(verification(run(), partial).verdict, 'PARTIAL');
});

test('a heal that never ran is NOT_RUN and never claims a pass', () => {
  const result = verification(run(), null);
  assert.equal(result.ran, false);
  assert.equal(result.verdict, 'NOT_RUN');
  assert.equal(result.passed, 0);
});

test('every check records the state it moved from and to', () => {
  const check = verification(run(), HEALED).checks[0];
  assert.equal(check.from, 'dead');
  assert.equal(check.to, 'live');
});

test('a verification with nothing broken says so rather than claiming success', () => {
  const clean = run({ fields_live: ['title', 'price', 'rating'], fields_infected: [], fields_dead: [] });
  assert.equal(verification(clean, HEALED).verdict, 'NOTHING_TO_CHECK');
});

test('verdictOf never reports a pass when the verification run is missing', () => {
  assert.equal(verdictOf([{ passed: true }], null), 'NOT_RUN');
});

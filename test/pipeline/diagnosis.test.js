'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { strainOf, buildPrompt, shiftedPairs, isNarrow, clause, recoveredFields, describe } =
  require('../../scripts/repair.js');

const COLLECTOR = {
  codename: 'BODEGA',
  universe: 'shop.test',
  fields: {
    title: { type: 'string', min: 3, max: 200 },
    price: { type: 'number', min: 0.01 },
    rating: { type: 'number', min: 0, max: 5 },
    image: { type: 'url' }
  }
};

const runOf = (over) => ({
  universe: 'shop.test',
  fields_expected: ['title', 'price', 'rating', 'image'],
  fields_live: [],
  fields_infected: [],
  fields_dead: [],
  sample: {},
  integrity: 0,
  ...over
});

test('isNarrow accepts a number rule', () => {
  assert.equal(isNarrow({ type: 'number' }), true);
});

test('isNarrow accepts a url rule', () => {
  assert.equal(isNarrow({ type: 'url' }), true);
});

test('isNarrow rejects a string rule as too permissive to prove a shift', () => {
  assert.equal(isNarrow({ type: 'string' }), false);
});

test('isNarrow rejects a missing rule', () => {
  assert.equal(isNarrow(undefined), false);
});

test('clause pluralises the verb for a single field', () => {
  assert.equal(clause(['price'], 'return'), "'price' returns");
});

test('clause keeps the bare verb for several fields', () => {
  assert.equal(clause(['price', 'rating'], 'return'), "'price' and 'rating' return");
});

test('strainOf reports THROTTLED when every expected field came back empty', () => {
  const run = runOf({ fields_dead: ['title', 'price', 'rating', 'image'] });
  assert.equal(strainOf(run, COLLECTOR), 'THROTTLED');
});

test('strainOf reports RENAMED when one field is dead and the rest still extract', () => {
  const run = runOf({ fields_dead: ['title'], fields_live: ['price', 'rating', 'image'] });
  assert.equal(strainOf(run, COLLECTOR), 'RENAMED');
});

test('strainOf reports DRIFTED when the failing fields return wrong values', () => {
  const run = runOf({ fields_infected: ['price', 'rating'], fields_live: ['title', 'image'] });
  assert.equal(strainOf(run, COLLECTOR), 'DRIFTED');
});

test('strainOf reports SHIFTED when a broken field holds a neighbouring field value', () => {
  const run = runOf({
    fields_infected: ['rating'],
    fields_live: ['title', 'price', 'image'],
    sample: { rating: 'https://shop.test/a.jpg' }
  });
  assert.equal(strainOf(run, COLLECTOR), 'SHIFTED');
});

test('strainOf prefers THROTTLED over SHIFTED when nothing extracted at all', () => {
  const run = runOf({
    fields_dead: ['title', 'price', 'rating', 'image'],
    sample: { rating: 'https://shop.test/a.jpg' }
  });
  assert.equal(strainOf(run, COLLECTOR), 'THROTTLED');
});

test('strainOf defaults to DRIFTED when no field is reported broken', () => {
  assert.equal(strainOf(runOf({ fields_live: ['title'] }), COLLECTOR), 'DRIFTED');
});

test('shiftedPairs finds no shift when the broken field is empty', () => {
  const run = runOf({ fields_dead: ['rating'], sample: { rating: null } });
  assert.deepEqual(shiftedPairs(run, COLLECTOR), []);
});

test('shiftedPairs pairs a broken field with the field its value belongs to', () => {
  const run = runOf({
    fields_infected: ['rating'],
    fields_live: ['title', 'price', 'image'],
    sample: { rating: 'https://shop.test/a.jpg' }
  });
  assert.deepEqual(shiftedPairs(run, COLLECTOR), [['rating', 'image']]);
});

test('shiftedPairs ignores a shift into another already broken field', () => {
  const run = runOf({
    fields_infected: ['rating', 'image'],
    sample: { rating: 'https://shop.test/a.jpg' }
  });
  assert.deepEqual(shiftedPairs(run, COLLECTOR), []);
});

test('buildPrompt names the dead fields it wants fixed', () => {
  const prompt = buildPrompt(runOf({ fields_dead: ['price'] }), 'RENAMED');
  assert.match(prompt, /'price' returns null/);
});

test('buildPrompt names the infected fields it wants fixed', () => {
  const prompt = buildPrompt(runOf({ fields_infected: ['rating'] }), 'DRIFTED');
  assert.match(prompt, /'rating' returns an invalid value/);
});

test('buildPrompt states the universe the collector targets', () => {
  assert.match(buildPrompt(runOf({ fields_dead: ['price'] }), 'RENAMED'), /^On shop\.test:/);
});

test('buildPrompt includes the diagnosed strain as a hint', () => {
  assert.match(buildPrompt(runOf({ fields_dead: ['price'] }), 'THROTTLED'), /Likely THROTTLED/);
});

test('buildPrompt omits the hint when the strain is unrecognised', () => {
  assert.doesNotMatch(buildPrompt(runOf({ fields_dead: ['price'] }), 'BOGUS'), /Likely/);
});

test('buildPrompt stays within the CLI prompt length ceiling', () => {
  const many = Array.from({ length: 200 }, (_, i) => `field_${i}`);
  const run = runOf({ fields_dead: many, fields_infected: many });
  assert.ok(buildPrompt(run, 'DRIFTED').length <= 990);
});

test('recoveredFields lists a broken field that came back live', () => {
  const before = runOf({ fields_dead: ['price'] });
  assert.deepEqual(recoveredFields(before, { fields_live: ['price', 'title'] }), ['price']);
});

test('recoveredFields excludes a field that is still failing', () => {
  const before = runOf({ fields_dead: ['price', 'rating'] });
  assert.deepEqual(recoveredFields(before, { fields_live: ['price'] }), ['price']);
});

test('describe reports an incomplete re-weave when the heal produced no result', () => {
  const before = runOf({ fields_dead: ['price'] });
  assert.match(describe(before, null, []), /did not complete/);
});

test('describe reports full restoration when every broken field recovered', () => {
  const before = runOf({ fields_dead: ['price'] });
  const after = { fields_live: ['price'], integrity: 100 };
  assert.match(describe(before, after, ['price']), /restored 'price'|restored price/);
});

test('describe reports a partial recovery when some fields are still failing', () => {
  const before = runOf({ fields_dead: ['price', 'rating'] });
  const after = { fields_live: ['price'], integrity: 75 };
  assert.match(describe(before, after, ['price']), /still failing at 75%/);
});

test('describe reports no restoration when the heal recovered nothing', () => {
  const before = runOf({ fields_dead: ['price'] });
  const after = { fields_live: [], integrity: 20 };
  assert.match(describe(before, after, []), /did not restore them/);
});

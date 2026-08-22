'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture } = require('../web-loader.js');

const web = loadWebModule(['config.js', 'format.js', 'value.js', 'received.js']);
const { truncateMiddle, receivedOf, expectedOf, stateOf, RECEIVED_MAX } = web;

const HISTORY = readFixture('history.json');

test('truncateMiddle leaves a string shorter than the limit untouched', () => {
  assert.equal(truncateMiddle('short', 10), 'short');
});

test('truncateMiddle leaves a string exactly at the limit untouched', () => {
  assert.equal(truncateMiddle('abcde', 5), 'abcde');
});

test('truncateMiddle cuts the middle out of an over-long string', () => {
  assert.equal(truncateMiddle('abcdefghij', 5), 'ab…ij');
});

test('truncateMiddle never exceeds the requested length', () => {
  for (const max of [3, 4, 5, 8, 20]) {
    assert.equal(truncateMiddle('x'.repeat(100), max).length, max);
  }
});

test('truncateMiddle keeps the head and the tail of the original', () => {
  const out = truncateMiddle('HEADmiddlemiddleTAIL', 9);
  assert.ok(out.startsWith('HEAD'));
  assert.ok(out.endsWith('TAIL'));
});

test('truncateMiddle gives the extra character to the head on an even budget', () => {
  assert.equal(truncateMiddle('abcdefghij', 6), 'abc…ij');
});

test('truncateMiddle marks the cut with a single ellipsis', () => {
  const out = truncateMiddle('abcdefghij', 5);
  assert.equal((out.match(/…/g) || []).length, 1);
});

test('receivedOf reports a null field as the word null, unquoted', () => {
  assert.equal(receivedOf({ sample: { price: null } }, 'price'), 'null');
});

test('receivedOf reports an absent key as missing', () => {
  assert.equal(receivedOf({ sample: { title: 'x' } }, 'price'), 'missing');
});

test('receivedOf reports a missing sample entirely as missing', () => {
  assert.equal(receivedOf({}, 'price'), 'missing');
  assert.equal(receivedOf({ sample: null }, 'price'), 'missing');
});

test('receivedOf quotes a string value', () => {
  assert.equal(receivedOf({ sample: { title: 'A Book' } }, 'title'), '"A Book"');
});

test('receivedOf quotes an empty string rather than calling it missing', () => {
  assert.equal(receivedOf({ sample: { title: '' } }, 'title'), '""');
});

test('receivedOf leaves a number unquoted', () => {
  assert.equal(receivedOf({ sample: { points: 42 } }, 'points'), '42');
});

test('receivedOf distinguishes an explicit undefined from a missing key', () => {
  assert.equal(receivedOf({ sample: { price: undefined } }, 'price'), 'missing');
});

test('receivedOf renders an object price as money, never [object Object]', () => {
  const sp = { sample: { price: { value: 17.93, currency: 'GBP', symbol: 'ÃÂ£' } } };
  const got = receivedOf(sp, 'price');
  assert.match(got, /17\.93/);
  assert.doesNotMatch(got, /\[object Object\]/);
});

test('receivedOf leaves an unwrapped object price unquoted', () => {
  const got = receivedOf({ sample: { price: { value: 17.93 } } }, 'price');
  assert.equal(got, '17.93');
});

test('receivedOf repairs a mojibaked currency symbol from the real fixture', () => {
  const run = HISTORY.find(
    (r) => r.sample && r.sample.price && typeof r.sample.price === 'object' && r.sample.price.symbol
  );
  if (run) {
    const got = receivedOf({ sample: run.sample }, 'price');
    assert.doesNotMatch(got, /Ã|Â/, 'the currency symbol should be demojibaked');
  }
});

test('receivedOf renders the real joined availability string from the fixture', () => {
  const run = HISTORY.find((r) => r.sample && typeof r.sample.availability === 'string');
  if (run) {
    const got = receivedOf({ sample: run.sample }, 'availability');
    assert.ok(got.startsWith('"'));
    assert.ok(got.endsWith('"'));
  }
});

test('receivedOf truncates an over-long value to the configured maximum', () => {
  const long = 'y'.repeat(500);
  const got = receivedOf({ sample: { title: long } }, 'title');
  assert.equal(got.length, RECEIVED_MAX + 2);
  assert.match(got, /…/);
});

test('receivedOf truncates the long real title from the fixture', () => {
  const run = HISTORY.find((r) => r.sample && typeof r.sample.title === 'string' && r.sample.title.length > RECEIVED_MAX);
  if (run) {
    const got = receivedOf({ sample: run.sample }, 'title');
    assert.equal(got.length, RECEIVED_MAX + 2);
  }
});

test('receivedOf renders an array value', () => {
  assert.equal(receivedOf({ sample: { tags: [] } }, 'tags'), '[]');
  assert.equal(receivedOf({ sample: { tags: [1, 2] } }, 'tags'), '[1, 2]');
});

test('receivedOf renders a boolean unquoted', () => {
  assert.equal(receivedOf({ sample: { ok: false } }, 'ok'), 'false');
});

test('expectedOf returns the configured expectation for a known field', () => {
  assert.equal(expectedOf('price'), 'a currency amount');
  assert.equal(expectedOf('rating'), 'a number 0-5');
});

test('expectedOf falls back to a generic expectation for an unknown field', () => {
  assert.equal(expectedOf('mystery'), 'a non-empty value');
});

test('stateOf reads a known field state', () => {
  assert.equal(stateOf({ fields: { title: 'live' } }, 'title'), 'live');
  assert.equal(stateOf({ fields: { title: 'infected' } }, 'title'), 'infected');
});

test('stateOf treats an unknown field as dead', () => {
  assert.equal(stateOf({ fields: {} }, 'title'), 'dead');
  assert.equal(stateOf({}, 'title'), 'dead');
});

test('stateOf normalises an unrecognised state word to dead', () => {
  assert.equal(stateOf({ fields: { title: 'wobbly' } }, 'title'), 'dead');
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');
const { unwrap } = require('../../../scripts/lib/classify.js');

const web = loadWebModule(['config.js', 'format.js', 'value.js']);
const { demojibake, valueText, valueLiteral, unwrapScalar, shapeOf, isPlainObject } = web;

const POUND_ONCE = 'Â£9.99';
const POUND_TWICE = 'ÃÂ£9.99';

test('demojibake repairs a single round of pound-sign corruption', () => {
  assert.equal(demojibake(POUND_ONCE), '£9.99');
});

test('demojibake repairs a double round of pound-sign corruption', () => {
  assert.equal(demojibake(POUND_TWICE), '£9.99');
});

test('demojibake repairs the corrupted symbol shipped in the real history fixture', () => {
  assert.equal(demojibake('ÃÂ£'), '£');
});

test('demojibake leaves an already-clean pound sign untouched', () => {
  assert.equal(demojibake('£9.99'), '£9.99');
});

test('demojibake leaves plain ASCII untouched', () => {
  assert.equal(demojibake('In stock'), 'In stock');
});

test('demojibake leaves an empty string untouched', () => {
  assert.equal(demojibake(''), '');
});

test('demojibake is idempotent on a once-corrupted string', () => {
  assert.equal(demojibake(demojibake(POUND_ONCE)), demojibake(POUND_ONCE));
});

test('demojibake is idempotent on a twice-corrupted string', () => {
  assert.equal(demojibake(demojibake(POUND_TWICE)), demojibake(POUND_TWICE));
});

test('demojibake leaves a legitimate accented word alone when it cannot decode', () => {
  assert.equal(demojibake('café'), 'café');
});

test('demojibake keeps a bare A-circumflex it cannot decode as UTF-8', () => {
  assert.equal(demojibake('Â'), 'Â');
});

test('valueText renders an object price as its money string, never [object Object]', () => {
  const price = { value: 17.93, currency: 'GBP', symbol: 'ÃÂ£' };
  assert.equal(valueText(price), '£17.93 GBP');
  assert.doesNotMatch(valueText(price), /\[object Object\]/);
});

test('valueText renders a price with a currency but no symbol', () => {
  assert.equal(valueText({ value: 17.93, currency: 'GBP' }), '17.93 GBP');
});

test('valueText renders a bare numeric price object', () => {
  assert.equal(valueText({ value: 17.93 }), '17.93');
});

test('valueText renders null and undefined as words', () => {
  assert.equal(valueText(null), 'null');
  assert.equal(valueText(undefined), 'missing');
});

test('valueText renders primitives verbatim', () => {
  assert.equal(valueText('hi'), 'hi');
  assert.equal(valueText(0), '0');
  assert.equal(valueText(false), 'false');
});

test('valueText demojibakes a corrupted plain string', () => {
  assert.equal(valueText(POUND_TWICE), '£9.99');
});

test('valueText renders an empty array as brackets', () => {
  assert.equal(valueText([]), '[]');
});

test('valueText renders array members recursively', () => {
  assert.equal(valueText([1, 'a', null]), '[1, a, null]');
});

test('valueText unwraps a text-keyed object', () => {
  assert.equal(valueText({ text: 'In stock' }), 'In stock');
});

test('valueText falls back to a key-value dump when nothing unwraps', () => {
  assert.equal(valueText({ meta: 1, other: 2 }), '{ meta: 1, other: 2 }');
});

test('valueLiteral quotes a string and leaves a number bare', () => {
  assert.equal(valueLiteral('hi'), '"hi"');
  assert.equal(valueLiteral(7), '7');
});

test('valueLiteral renders null as null and undefined as missing', () => {
  assert.equal(valueLiteral(null), 'null');
  assert.equal(valueLiteral(undefined), 'missing');
});

test('valueLiteral leaves an unwrapped money object unquoted', () => {
  assert.equal(valueLiteral({ value: 5, symbol: '£' }), '£5');
});

test('shapeOf distinguishes array, object and primitive shapes', () => {
  assert.equal(shapeOf([]), 'array');
  assert.equal(shapeOf({}), 'object');
  assert.equal(shapeOf(null), 'object');
  assert.equal(shapeOf('s'), 'string');
  assert.equal(shapeOf(1), 'number');
});

test('isPlainObject rejects arrays and null', () => {
  assert.equal(isPlainObject({}), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(null), false);
});

const SHARED_KEYS = [
  { value: 5 },
  { amount: 7 },
  { price: 9 },
  { text: 'hi' },
  { url: 'u' },
  { src: 's' },
  { href: 'h' },
  { value: null },
  { value: 0 },
  { value: false },
  { value: '' },
  { price: 17.93, currency: 'GBP' },
  { value: { deep: 1 }, text: 'fallback' },
  { amount: 1, value: 2 },
];

for (const input of SHARED_KEYS) {
  const label = JSON.stringify(input);
  test('unwrapScalar matches the backend unwrap for ' + label, () => {
    assert.deepEqual(unwrapScalar(input), unwrap(input));
  });
}

test('unwrapScalar honours the same scalar-key precedence as the backend', () => {
  assert.equal(unwrapScalar({ href: 'h', value: 'v' }), 'v');
  assert.equal(unwrap({ href: 'h', value: 'v' }), 'v');
});

test('unwrapScalar skips a nested object key and keeps scanning, like the backend', () => {
  const input = { value: { deep: 1 }, url: 'fallback' };
  assert.equal(unwrapScalar(input), 'fallback');
  assert.equal(unwrap(input), 'fallback');
});

const NO_SCALAR = [{ value: { deep: 1 } }, { meta: { a: 1 } }, {}];

for (const input of NO_SCALAR) {
  test('unwrapScalar signals "nothing unwrapped" with undefined for ' + JSON.stringify(input), () => {
    assert.equal(unwrapScalar(input), undefined);
    assert.deepEqual(unwrap(input), input);
  });
}

test('unwrapScalar returns undefined for non-object input where the backend returns it unchanged', () => {
  assert.equal(unwrapScalar('str'), undefined);
  assert.equal(unwrap('str'), 'str');
  assert.equal(unwrapScalar(42), undefined);
  assert.equal(unwrap(42), 42);
  assert.equal(unwrapScalar([1, 2]), undefined);
  assert.deepEqual(unwrap([1, 2]), [1, 2]);
});

test('unwrapScalar throws on null and undefined where the backend passes them through', () => {
  assert.throws(() => unwrapScalar(null), TypeError);
  assert.throws(() => unwrapScalar(undefined), TypeError);
  assert.equal(unwrap(null), null);
  assert.equal(unwrap(undefined), undefined);
});

test('valueText guards unwrapScalar so a null field never reaches it', () => {
  assert.doesNotThrow(() => valueText(null));
  assert.doesNotThrow(() => valueText(undefined));
});

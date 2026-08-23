'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { unwrap, rowsOf, parsePayload, MAX_ROWS, MAX_PAYLOAD_BYTES } = require('../../scripts/lib.js');

test('unwrap reads a scalar out of the value key', () => {
  assert.equal(unwrap({ value: 12 }), 12);
});

test('unwrap reads a scalar out of the amount key', () => {
  assert.equal(unwrap({ amount: 12 }), 12);
});

test('unwrap reads a scalar out of the price key', () => {
  assert.equal(unwrap({ price: '£4' }), '£4');
});

test('unwrap reads a scalar out of the text key', () => {
  assert.equal(unwrap({ text: 'hello' }), 'hello');
});

test('unwrap reads a scalar out of the url key', () => {
  assert.equal(unwrap({ url: 'https://x.test' }), 'https://x.test');
});

test('unwrap reads a scalar out of the src key', () => {
  assert.equal(unwrap({ src: 'https://x.test/a.png' }), 'https://x.test/a.png');
});

test('unwrap reads a scalar out of the href key', () => {
  assert.equal(unwrap({ href: 'https://x.test/p' }), 'https://x.test/p');
});

test('unwrap prefers the earliest scalar key when several are present', () => {
  assert.equal(unwrap({ href: 'h', value: 'v' }), 'v');
});

test('unwrap returns the object unchanged when it holds no scalar key', () => {
  const input = { foo: 1, bar: 2 };
  assert.deepEqual(unwrap(input), input);
});

test('unwrap returns the object unchanged when the scalar key holds an object', () => {
  const input = { value: { nested: 1 } };
  assert.deepEqual(unwrap(input), input);
});

test('unwrap returns an array unchanged', () => {
  assert.deepEqual(unwrap([1, 2]), [1, 2]);
});

test('unwrap returns null unchanged', () => {
  assert.equal(unwrap(null), null);
});

test('unwrap returns a primitive unchanged', () => {
  assert.equal(unwrap('plain'), 'plain');
});

test('unwrap passes through a null stored under a scalar key', () => {
  assert.equal(unwrap({ value: null }), null);
});

test('rowsOf returns a bare array as the rows', () => {
  assert.deepEqual(rowsOf([{ a: 1 }]), [{ a: 1 }]);
});

for (const key of ['data', 'records', 'results', 'items', 'rows', 'output']) {
  test(`rowsOf unwraps rows from the ${key} envelope key`, () => {
    assert.deepEqual(rowsOf({ [key]: [{ a: 1 }] }), [{ a: 1 }]);
  });
}

test('rowsOf prefers the data key when several envelope keys are present', () => {
  assert.deepEqual(rowsOf({ items: [{ b: 2 }], data: [{ a: 1 }] }), [{ a: 1 }]);
});

test('rowsOf finds an object array nested under an unknown key', () => {
  assert.deepEqual(rowsOf({ mystery: [{ a: 1 }] }), [{ a: 1 }]);
});

test('rowsOf ignores a nested array of primitives under an unknown key', () => {
  const payload = { tags: ['a', 'b'] };
  assert.deepEqual(rowsOf(payload), [payload]);
});

test('rowsOf wraps a single object as a one-row set', () => {
  assert.deepEqual(rowsOf({ a: 1 }), [{ a: 1 }]);
});

test('rowsOf caps an oversized array at the row limit', () => {
  const huge = Array.from({ length: MAX_ROWS + 500 }, (_, i) => ({ i }));
  assert.equal(rowsOf(huge).length, MAX_ROWS);
});

test('rowsOf keeps an array already inside the row limit intact', () => {
  assert.equal(rowsOf(Array.from({ length: 10 }, (_, i) => ({ i }))).length, 10);
});

test('rowsOf returns an empty array for an empty payload array', () => {
  assert.deepEqual(rowsOf([]), []);
});

test('parsePayload extracts a JSON array surrounded by progress noise', () => {
  assert.deepEqual(parsePayload('Fetching page...\n[{"a":1}]\nDone in 4s\n'), [{ a: 1 }]);
});

test('parsePayload extracts a JSON object surrounded by progress noise', () => {
  assert.deepEqual(parsePayload('starting\n{"a":1}\nfinished'), { a: 1 });
});

test('parsePayload ignores spinner frames before the JSON', () => {
  assert.deepEqual(parsePayload('⠋ work\r⠙ work\r{"a":1}\n'), { a: 1 });
});

test('parsePayload ignores trailing log lines after the JSON', () => {
  assert.deepEqual(parsePayload('[{"a":1}]\nwarning: rate limited'), [{ a: 1 }]);
});

test('parsePayload throws when the output contains no JSON at all', () => {
  assert.throws(() => parsePayload('nothing useful here'), /no JSON in CLI output/);
});

test('parsePayload throws when the JSON is truncated mid-document', () => {
  assert.throws(() => parsePayload('[{"a":1}'), /unterminated JSON in CLI output/);
});

test('parsePayload throws when the bracketed span is not valid JSON', () => {
  assert.throws(() => parsePayload('[{"a": oops}]'), /not valid JSON/);
});

test('parsePayload throws when handed a non-string', () => {
  assert.throws(() => parsePayload(null), /CLI output is not text/);
});

test('parsePayload throws when handed a buffer instead of text', () => {
  assert.throws(() => parsePayload(Buffer.from('[]')), /CLI output is not text/);
});

test('parsePayload throws when the output exceeds the size ceiling', () => {
  const oversized = '['.padEnd(MAX_PAYLOAD_BYTES + 1, 'x') + ']';
  assert.throws(() => parsePayload(oversized), /too large/);
});

test('parsePayload parses an empty array payload', () => {
  assert.deepEqual(parsePayload('[]'), []);
});

test('rowsOf concatenates several wrapper rows that each hold one array', () => {
  const rows = rowsOf([
    { products: [{ title: 'a' }, { title: 'b' }], page: 'one' },
    { products: [{ title: 'c' }], page: 'two' },
  ]);
  assert.deepEqual(rows.map((r) => r.title), ['a', 'b', 'c']);
});

test('rowsOf leaves a mixed array of wrappers and plain rows untouched', () => {
  const payload = [{ products: [{ title: 'a' }] }, { title: 'plain' }];
  assert.deepEqual(rowsOf(payload), payload);
});

test('rowsOf keeps only the wrappers for the page that was asked for', () => {
  const rows = rowsOf([
    { products: [{ title: 'real' }], page: 'https://site.test/shop/index.html?v=a' },
    { products: [{ title: 'stray' }], page: 'https://site.test/shop/other.html' },
  ], 'https://site.test/shop/');
  assert.deepEqual(rows.map((r) => r.title), ['real']);
});

test('rowsOf drops empty padding rows but keeps a fully empty payload visible', () => {
  const padded = rowsOf([
    { stories: [{ title: 'a' }, {}, {}] },
    { stories: [{ title: 'b' }, {}] },
  ]);
  assert.deepEqual(padded.map((r) => r.title), ['a', 'b']);
  const empty = rowsOf([{ stories: [{}, {}] }, { stories: [{}] }]);
  assert.equal(empty.length, 3);
});

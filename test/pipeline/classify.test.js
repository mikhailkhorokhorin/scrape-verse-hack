'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classify } = require('../../scripts/lib.js');

const NUMBER = { type: 'number' };
const URL_RULE = { type: 'url' };
const STRING = { type: 'string' };
const RATING = { type: 'number', min: 1, max: 5, words: true };

test('classify marks null as dead', () => {
  assert.equal(classify(null, NUMBER), 'dead');
});

test('classify marks undefined as dead', () => {
  assert.equal(classify(undefined, NUMBER), 'dead');
});

test('classify marks an empty string as dead', () => {
  assert.equal(classify('', STRING), 'dead');
});

test('classify marks an empty array as dead', () => {
  assert.equal(classify([], NUMBER), 'dead');
});

test('classify marks the literal string "undefined" as infected', () => {
  assert.equal(classify('undefined', STRING), 'infected');
});

test('classify marks the literal string "NaN" as infected', () => {
  assert.equal(classify('NaN', NUMBER), 'infected');
});

test('classify marks the literal string "null" as infected', () => {
  assert.equal(classify('null', STRING), 'infected');
});

test('classify marks a whitespace-only string as dead once trimmed', () => {
  assert.equal(classify('   ', STRING), 'infected');
});

test('classify marks a nested object with no scalar key as infected', () => {
  assert.equal(classify({ meta: { deep: 1 } }, NUMBER), 'infected');
});

test('classify accepts a plain numeric string as live', () => {
  assert.equal(classify('42', NUMBER), 'live');
});

test('classify accepts a real number as live', () => {
  assert.equal(classify(19.99, NUMBER), 'live');
});

test('classify strips a currency symbol before reading a number', () => {
  assert.equal(classify('£51.77', NUMBER), 'live');
});

test('classify strips a trailing unit before reading a number', () => {
  assert.equal(classify('124 points', NUMBER), 'live');
});

test('classify reads the number out of the object form {value,currency,symbol}', () => {
  assert.equal(classify({ value: 51.77, currency: 'GBP', symbol: '£' }, NUMBER), 'live');
});

test('classify reads a worded rating when the rule enables words', () => {
  assert.equal(classify('Three', RATING), 'live');
});

test('classify reads the last token of a worded rating class name', () => {
  assert.equal(classify('star-rating Three', RATING), 'live');
});

test('classify marks a worded rating above max as infected', () => {
  assert.equal(classify('Three', { type: 'number', min: 1, max: 2, words: true }), 'infected');
});

test('classify marks a number below min as infected', () => {
  assert.equal(classify('0', { type: 'number', min: 0.01 }), 'infected');
});

test('classify marks a number above max as infected', () => {
  assert.equal(classify('9', { type: 'number', min: 0, max: 5 }), 'infected');
});

test('classify treats a number exactly at min as live', () => {
  assert.equal(classify('0.01', { type: 'number', min: 0.01 }), 'live');
});

test('classify treats a number exactly at max as live', () => {
  assert.equal(classify('5', { type: 'number', min: 0, max: 5 }), 'live');
});

test('classify marks non-numeric text under a number rule as infected', () => {
  assert.equal(classify('Sold out', NUMBER), 'infected');
});

test('classify accepts a negative number when no min is set', () => {
  assert.equal(classify('-3', NUMBER), 'live');
});

test('classify accepts an absolute https url as live', () => {
  assert.equal(classify('https://example.com/a.jpg', URL_RULE), 'live');
});

test('classify accepts an absolute http url as live', () => {
  assert.equal(classify('http://example.com/a.jpg', URL_RULE), 'live');
});

test('classify marks a relative url as infected', () => {
  assert.equal(classify('/media/cover.jpg', URL_RULE), 'infected');
});

test('classify marks a protocol-relative url as infected', () => {
  assert.equal(classify('//cdn.example.com/a.jpg', URL_RULE), 'infected');
});

test('classify marks a javascript: url as infected', () => {
  assert.equal(classify('javascript:void(0)', URL_RULE), 'infected');
});

test('classify marks a data: url as infected', () => {
  assert.equal(classify('data:image/png;base64,iVBORw0KGgo=', URL_RULE), 'infected');
});

test('classify reads a url out of the src wrapper object', () => {
  assert.equal(classify({ src: 'https://example.com/a.jpg' }, URL_RULE), 'live');
});

test('classify accepts a string inside the length bounds as live', () => {
  assert.equal(classify('Dune', { type: 'string', min: 3, max: 200 }), 'live');
});

test('classify marks a string shorter than min as infected', () => {
  assert.equal(classify('ab', { type: 'string', min: 3 }), 'infected');
});

test('classify marks a string longer than max as infected', () => {
  assert.equal(classify('abcdef', { type: 'string', max: 5 }), 'infected');
});

test('classify marks a string failing the pattern as infected', () => {
  assert.equal(classify('Maybe', { type: 'string', pattern: '^(In stock|Out of stock)$' }),
    'infected');
});

test('classify accepts a string matching the pattern as live', () => {
  assert.equal(classify('In stock', { type: 'string', pattern: '^(In stock|Out of stock)$' }),
    'live');
});

test('classify falls back to string rules when the type is unknown', () => {
  assert.equal(classify('anything', { type: 'mystery' }), 'live');
});

test('classify trims surrounding whitespace before applying string bounds', () => {
  assert.equal(classify('  ok  ', { type: 'string', min: 2, max: 2 }), 'live');
});

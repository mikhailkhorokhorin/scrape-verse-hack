'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const context = loadWebModule(
  ['config.js', 'format.js', 'value.js', 'received.js', 'replay-view.js'],
  { document: { querySelectorAll: () => [], querySelector: () => null } }
);
const { replayValue, replayDuration, REPLAY_MIN_MS, REPLAY_MAX_MS } = context;

test('a real string is quoted, so it reads as data the scraper returned', () => {
  assert.equal(replayValue('Sharp Objects'), '"Sharp Objects"');
});

test('a poison word is called out as literal text, not quoted like real data', () => {
  ['undefined', 'NaN', '[object Object]'].forEach((word) => {
    const out = replayValue(word);
    assert.ok(out.startsWith(word), word + ' is shown as itself');
    assert.match(out, /literal text/, word + ' is named as the failure it is');
    assert.doesNotMatch(out, /^"/, word + ' is never dressed up in quotes');
  });
});

test('an absent field is named rather than rendered as an empty string', () => {
  assert.equal(replayValue(null), 'null');
  assert.equal(replayValue(undefined), 'missing');
});

test('numbers and booleans arrive unquoted', () => {
  assert.equal(replayValue(62), '62');
  assert.equal(replayValue(true), 'true');
});

test('a long value is clipped so the ledger row cannot be pushed out of shape', () => {
  const out = replayValue('x'.repeat(200));
  assert.ok(out.length < 60, 'clipped to something a row can hold');
  assert.match(out, /…/);
});

test('an object is flattened to JSON rather than printed as [object Object]', () => {
  const out = replayValue({ a: 1 });
  assert.match(out, /\{&quot;a&quot;:1\}|\{"a":1\}/);
});

test('a value carrying markup is escaped', () => {
  assert.doesNotMatch(replayValue('<b>x</b>'), /<b>/);
});

test('a replay is never shorter than the floor nor longer than the ceiling', () => {
  assert.equal(replayDuration(0), REPLAY_MIN_MS);
  assert.equal(replayDuration(60 * 60 * 1000 * 24), REPLAY_MAX_MS);
  const middle = replayDuration(15 * 60 * 1000);
  assert.ok(middle >= REPLAY_MIN_MS && middle <= REPLAY_MAX_MS);
});

test('a longer incident replays for longer, up to the ceiling', () => {
  const short = replayDuration(14 * 60 * 1000);
  const long = replayDuration(30 * 60 * 1000);
  assert.ok(long >= short, 'a longer break does not replay faster than a short one');
});

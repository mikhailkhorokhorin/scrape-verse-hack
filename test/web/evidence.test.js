'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('../web-loader.js');

const web = loadWebModule(['config.js', 'format.js', 'masthead.js']);
const { evidenceParts, shortCid, newestCid } = web;

const HISTORY = readFixture('history.json');
const META = readFixture('meta.json');

function spider(cid, ts) {
  return { cid, ts };
}

test('shortCid truncates a long collector id to a prefix and an ellipsis', () => {
  assert.equal(shortCid('c_mt2fnqqngikv29od5'), 'c_mt2f…');
});

test('shortCid leaves an id at the cutoff length untouched', () => {
  assert.equal(shortCid('c_mt2f'), 'c_mt2f');
});

test('shortCid leaves a shorter id untouched', () => {
  assert.equal(shortCid('c_ab'), 'c_ab');
});

test('shortCid renders a missing id as an empty string', () => {
  assert.equal(shortCid(null), '');
});

test('newestCid picks the collector with the latest timestamp', () => {
  const spiders = [
    spider('c_old', '2026-01-01T00:00:00Z'),
    spider('c_new', '2026-06-01T00:00:00Z'),
    spider('c_mid', '2026-03-01T00:00:00Z'),
  ];
  assert.equal(newestCid(spiders), 'c_new');
});

test('newestCid ignores a spider with no collector id', () => {
  const spiders = [spider(null, '2026-09-01T00:00:00Z'), spider('c_real', '2026-01-01T00:00:00Z')];
  assert.equal(newestCid(spiders), 'c_real');
});

test('newestCid returns null when no spider carries an id', () => {
  assert.equal(newestCid([]), null);
});

test('newestCid still returns an id when every timestamp is unparseable', () => {
  const spiders = [spider('c_a', 'not-a-date'), spider('c_b', 'also-not')];
  assert.equal(newestCid(spiders), 'c_b');
});

test('evidenceParts states collectors, healed incidents, rows, tests and a collector id', () => {
  const spiders = [spider('c_one', '2026-01-01T00:00:00Z'), spider('c_two', '2026-02-01T00:00:00Z')];
  const incidents = [{ verified: true }, { verified: false }, { verified: true }];
  const history = [{ rows: 10 }, { rows: 5 }];
  const parts = evidenceParts(spiders, incidents, history, { tests: 528 }, false);
  assert.deepEqual(plain(parts), ['2 collectors', '2 incidents healed', '15 rows', '528 tests', 'c_two']);
});

test('evidenceParts counts only verified incidents as healed', () => {
  const incidents = [{ verified: false }, { verified: false }];
  const parts = evidenceParts([], incidents, [], null, false);
  assert.equal(parts[1], '0 incidents healed');
});

test('evidenceParts uses singular nouns for a count of one', () => {
  const spiders = [spider('c_one', '2026-01-01T00:00:00Z')];
  const parts = evidenceParts(spiders, [{ verified: true }], [{ rows: 1 }], { tests: 1 }, false);
  assert.equal(parts[0], '1 collector');
  assert.equal(parts[1], '1 incident healed');
  assert.equal(parts[2], '1 row');
  assert.equal(parts[3], '1 test');
});

test('evidenceParts groups a four-figure row total with a comma', () => {
  const parts = evidenceParts([], [], [{ rows: 1200 }, { rows: 34 }], null, false);
  assert.equal(parts[2], '1,234 rows');
});

test('evidenceParts ignores runs with a missing or unusable row count', () => {
  const history = [{ rows: 10 }, {}, { rows: null }, { rows: 'x' }, { rows: -4 }];
  const parts = evidenceParts([], [], history, null, false);
  assert.equal(parts[2], '10 rows');
});

test('evidenceParts omits only the test segment when meta is missing', () => {
  const spiders = [spider('c_one', '2026-01-01T00:00:00Z')];
  const parts = evidenceParts(spiders, [{ verified: true }], [{ rows: 7 }], null, false);
  assert.deepEqual(plain(parts), ['1 collector', '1 incident healed', '7 rows', 'c_one']);
});

test('evidenceParts omits the test segment when meta carries no test count', () => {
  const parts = evidenceParts([], [], [], { sha: 'abc' }, false);
  assert.ok(!parts.some((p) => p.endsWith('tests') || p.endsWith('test')));
});

test('evidenceParts omits the test segment when the test count is zero', () => {
  const parts = evidenceParts([], [], [], { tests: 0 }, false);
  assert.ok(!parts.some((p) => p.endsWith('tests') || p.endsWith('test')));
});

test('evidenceParts omits the test segment when the test count is not a number', () => {
  const parts = evidenceParts([], [], [], { tests: 'many' }, false);
  assert.ok(!parts.some((p) => p.endsWith('tests') || p.endsWith('test')));
});

test('evidenceParts omits the collector id when no spider carries one', () => {
  const parts = evidenceParts([], [{ verified: true }], [{ rows: 3 }], { tests: 9 }, false);
  assert.deepEqual(plain(parts), ['0 collectors', '1 incident healed', '3 rows', '9 tests']);
});

test('evidenceParts shortens the collector and incident labels when terse', () => {
  const spiders = [spider('c_one', '2026-01-01T00:00:00Z')];
  const parts = evidenceParts(spiders, [{ verified: true }], [{ rows: 7 }], { tests: 9 }, true);
  assert.deepEqual(plain(parts), ['1 coll', '1 healed', '7 rows', '9 tests', 'c_one']);
});

test('the terse line is shorter than the full line for the same data', () => {
  const spiders = [spider('c_mt2fnqqngikv29od5', '2026-01-01T00:00:00Z')];
  const args = [spiders, [{ verified: true }], [{ rows: 884 }], { tests: 528 }];
  const full = evidenceParts(...args, false).join(' · ');
  const terse = evidenceParts(...args, true).join(' · ');
  assert.ok(terse.length < full.length);
});

test('evidenceParts reads the committed history fixture without throwing', () => {
  const parts = evidenceParts([], [], HISTORY, META, false);
  assert.equal(parts.length, 4);
  assert.match(parts[2], /^[\d,]+ rows$/);
});

test('the committed meta.json carries a positive whole test count', () => {
  assert.ok(Number.isInteger(META.tests) && META.tests > 0);
});

test('the committed meta.json carries a sha and a parseable timestamp', () => {
  assert.match(META.sha, /^[0-9a-f]{7,40}$/);
  assert.ok(Number.isFinite(Date.parse(META.generated_at)));
});

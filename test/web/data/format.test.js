'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

const web = loadWebModule(['config.js', 'format.js']);
const { esc, clampPct, gradeOf, integrityFromStates, agoOf, clockOf, groupNum, integrityOf, statusOf } = web;

test('esc escapes an ampersand', () => {
  assert.equal(esc('a & b'), 'a &amp; b');
});

test('esc escapes angle brackets', () => {
  assert.equal(esc('<script>'), '&lt;script&gt;');
});

test('esc escapes a double quote', () => {
  assert.equal(esc('say "hi"'), 'say &quot;hi&quot;');
});

test('esc escapes a single quote', () => {
  assert.equal(esc("it's"), 'it&#39;s');
});

test('esc escapes all five characters mixed into one string', () => {
  assert.equal(
    esc('<a href="x" title=\'y\'>a & b</a>'),
    '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;a &amp; b&lt;/a&gt;'
  );
});

test('esc escapes the ampersand of an already-escaped entity so it cannot double-decode', () => {
  assert.equal(esc('&amp;'), '&amp;amp;');
});

test('esc coerces a number to a string', () => {
  assert.equal(esc(42), '42');
});

test('esc coerces null rather than throwing', () => {
  assert.equal(esc(null), 'null');
});

test('esc leaves a string with no special characters untouched', () => {
  assert.equal(esc('plain text'), 'plain text');
});

test('clampPct returns 0 for NaN', () => {
  assert.equal(clampPct(NaN), 0);
});

test('clampPct returns 0 for a non-numeric string', () => {
  assert.equal(clampPct('abc'), 0);
});

test('clampPct returns 0 for undefined', () => {
  assert.equal(clampPct(undefined), 0);
});

test('clampPct returns 0 for Infinity', () => {
  assert.equal(clampPct(Infinity), 0);
});

test('clampPct floors negatives at 0', () => {
  assert.equal(clampPct(-5), 0);
});

test('clampPct caps values above 100', () => {
  assert.equal(clampPct(105), 100);
});

test('clampPct keeps the exact bounds 0 and 100', () => {
  assert.equal(clampPct(0), 0);
  assert.equal(clampPct(100), 100);
});

test('clampPct rounds a fractional percentage', () => {
  assert.equal(clampPct(49.5), 50);
  assert.equal(clampPct(49.4), 49);
});

test('clampPct parses a numeric string', () => {
  assert.equal(clampPct('80'), 80);
});

test('clampPct parses a padded numeric string', () => {
  assert.equal(clampPct('  12  '), 12);
});

test('gradeOf is healthy exactly at the healthy threshold', () => {
  assert.equal(gradeOf(90), 'healthy');
});

test('gradeOf is degraded one point below the healthy threshold', () => {
  assert.equal(gradeOf(89), 'degraded');
});

test('gradeOf is degraded exactly at the degraded threshold', () => {
  assert.equal(gradeOf(60), 'degraded');
});

test('gradeOf is critical one point below the degraded threshold', () => {
  assert.equal(gradeOf(59), 'critical');
});

test('gradeOf is healthy at a perfect score', () => {
  assert.equal(gradeOf(100), 'healthy');
});

test('gradeOf is critical at zero', () => {
  assert.equal(gradeOf(0), 'critical');
});

test('integrityFromStates returns 0 for an empty state map', () => {
  assert.equal(integrityFromStates({}), 0);
});

test('integrityFromStates returns 0 for a null state map', () => {
  assert.equal(integrityFromStates(null), 0);
});

test('integrityFromStates returns 0 for an undefined state map', () => {
  assert.equal(integrityFromStates(undefined), 0);
});

test('integrityFromStates scores an all-live map at 100', () => {
  assert.equal(integrityFromStates({ a: 'live', b: 'live' }), 100);
});

test('integrityFromStates scores an all-dead map at 0', () => {
  assert.equal(integrityFromStates({ a: 'dead', b: 'dead' }), 0);
});

test('integrityFromStates gives infected half credit', () => {
  assert.equal(integrityFromStates({ a: 'live', b: 'infected' }), 75);
  assert.equal(integrityFromStates({ a: 'infected', b: 'infected' }), 50);
});

test('integrityFromStates treats an unknown state word as dead', () => {
  assert.equal(integrityFromStates({ a: 'live', b: 'wobbly' }), 50);
});

test('integrityFromStates rounds a thirds-based score', () => {
  assert.equal(integrityFromStates({ a: 'live', b: 'dead', c: 'dead' }), 33);
});

test('agoOf returns unknown for an unparseable date', () => {
  assert.equal(agoOf('not-a-date'), 'unknown');
});

test('agoOf returns unknown for undefined', () => {
  assert.equal(agoOf(undefined), 'unknown');
});

test('agoOf reports a sub-minute gap as just now', () => {
  assert.equal(agoOf(new Date(Date.now() - 5000).toISOString()), 'just now');
});

test('agoOf reports minutes under an hour', () => {
  assert.equal(agoOf(new Date(Date.now() - 30 * 60000).toISOString()), '30m ago');
});

test('agoOf reports hours and minutes under two days', () => {
  assert.equal(agoOf(new Date(Date.now() - (3 * 3600000 + 15 * 60000)).toISOString()), '3h 15m ago');
});

test('agoOf switches to days past 48 hours', () => {
  assert.equal(agoOf(new Date(Date.now() - 72 * 3600000).toISOString()), '3d ago');
});

test('clockOf returns the placeholder for an unparseable date', () => {
  assert.equal(clockOf('not-a-date'), '--:--:--Z');
});

test('clockOf returns the placeholder for undefined', () => {
  assert.equal(clockOf(undefined), '--:--:--Z');
});

test('clockOf formats a UTC timestamp zero-padded', () => {
  assert.equal(clockOf('2026-08-21T04:03:07.951Z'), '04:03:07Z');
});

test('clockOf reads a real history timestamp in UTC regardless of local zone', () => {
  assert.equal(clockOf('2026-08-21T09:21:21.347Z'), '09:21:21Z');
});

test('clockOf treats null as the epoch rather than as unparseable', () => {
  assert.equal(clockOf(null), '--:--:--Z');
});

test('groupNum inserts thousands separators', () => {
  assert.equal(groupNum(1234567), '1,234,567');
});

test('groupNum leaves a three-digit number alone', () => {
  assert.equal(groupNum(999), '999');
});

test('groupNum rounds before grouping', () => {
  assert.equal(groupNum(1999.6), '2,000');
});

test('integrityOf prefers a numeric integrity over the field states', () => {
  assert.equal(integrityOf({ integrity: 42, fields: { a: 'live' } }), 42);
});

test('integrityOf clamps a stored integrity that is out of range', () => {
  assert.equal(integrityOf({ integrity: 250 }), 100);
});

test('integrityOf falls back to the field states when integrity is missing', () => {
  assert.equal(integrityOf({ fields: { a: 'live', b: 'dead' } }), 50);
});

test('statusOf reports unwatched ahead of every other state', () => {
  assert.equal(statusOf({ unwatched: true, reweaving: true, integrity: 100 }), 'unwatched');
});

test('statusOf reports reweaving ahead of the integrity grade', () => {
  assert.equal(statusOf({ reweaving: true, integrity: 10 }), 'reweaving');
});

test('statusOf falls through to the integrity grade', () => {
  assert.equal(statusOf({ integrity: 95 }), 'healthy');
  assert.equal(statusOf({ integrity: 20 }), 'critical');
});

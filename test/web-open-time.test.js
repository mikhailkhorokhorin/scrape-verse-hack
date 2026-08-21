'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const context = loadWebModule(['format.js', 'open.js'], {
  document: undefined,
  window: undefined,
  setInterval: () => 0,
  HEALTHY_MIN: 90,
  DEGRADED_MIN: 60,
  INFECTED_CREDIT: 0.5,
});

const { openGapOf, openHumanGap, openIsOvernight, openIsMorning } = context;

const NOW = Date.parse('2026-08-21T21:24:00Z');

test('openGapOf renders minutes under an hour', () => {
  assert.equal(openGapOf(NOW - 5 * 60000, NOW), '5m');
  assert.equal(openGapOf(NOW - 59 * 60000, NOW), '59m');
});

test('openGapOf renders hours and minutes under a day', () => {
  assert.equal(openGapOf(NOW - (4 * 3600000 + 12 * 60000), NOW), '4h 12m');
  assert.equal(openGapOf(NOW - 3600000, NOW), '1h 0m');
});

test('openGapOf renders days and hours past a day', () => {
  assert.equal(openGapOf(NOW - (25 * 3600000), NOW), '1d 1h');
  assert.equal(openGapOf(NOW - (49 * 3600000), NOW), '2d 1h');
});

test('openGapOf refuses a timestamp in the future', () => {
  assert.equal(openGapOf(NOW + 60000, NOW), null);
});

test('openGapOf refuses an unparseable timestamp', () => {
  assert.equal(openGapOf(Number.NaN, NOW), null);
});

test('openHumanGap returns null when the field is absent', () => {
  assert.equal(openHumanGap({ tests: 889 }, NOW), null);
  assert.equal(openHumanGap({}, NOW), null);
  assert.equal(openHumanGap(null, NOW), null);
});

test('openHumanGap returns null when the field is empty or unparseable', () => {
  assert.equal(openHumanGap({ last_human_ts: '' }, NOW), null);
  assert.equal(openHumanGap({ last_human_ts: 'not a date' }, NOW), null);
  assert.equal(openHumanGap({ last_human_ts: 12345 }, NOW), null);
});

test('openHumanGap computes the gap from a real timestamp', () => {
  assert.equal(openHumanGap({ last_human_ts: '2026-08-21T17:12:00Z' }, NOW), '4h 12m');
});

test('openIsOvernight accepts only 00:00-06:00 UTC', () => {
  assert.equal(openIsOvernight({ ts: '2026-08-21T00:00:00Z' }), true);
  assert.equal(openIsOvernight({ ts: '2026-08-21T05:59:59Z' }), true);
  assert.equal(openIsOvernight({ ts: '2026-08-21T06:00:00Z' }), false);
  assert.equal(openIsOvernight({ ts: '2026-08-21T23:00:00Z' }), false);
  assert.equal(openIsOvernight({ ts: 'nonsense' }), false);
});

test('openIsMorning is true only between 06:00 and 12:00 UTC', () => {
  assert.equal(openIsMorning(Date.parse('2026-08-21T06:00:00Z')), true);
  assert.equal(openIsMorning(Date.parse('2026-08-21T11:59:00Z')), true);
  assert.equal(openIsMorning(Date.parse('2026-08-21T12:00:00Z')), false);
  assert.equal(openIsMorning(Date.parse('2026-08-21T03:00:00Z')), false);
});

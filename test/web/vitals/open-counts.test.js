'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('../../web-loader.js');

const context = loadWebModule(['format.js', 'open.js'], {
  document: undefined,
  window: undefined,
  setInterval: () => 0,
  HEALTHY_MIN: 90,
  DEGRADED_MIN: 60,
  INFECTED_CREDIT: 0.5,
});

const {
  openCountersOf, openSpanOf, openThesisOf, openCounterLine, openWordFor, openDayOf,
} = context;

const NOW = Date.parse('2026-08-21T21:24:00Z');
const DOT = ' · ';

test('openCountersOf sums scans and rows across every run', () => {
  const history = [
    { ts: '2026-08-21T01:00:00Z', rows: 20 },
    { ts: '2026-08-21T09:00:00Z', rows: 30 },
  ];
  assert.deepEqual(plain(openCountersOf(history, [], false)), {
    scans: 2, rows: 50, breaks: 0, heals: 0,
  });
});

test('openCountersOf ignores rows that are missing or not positive', () => {
  const history = [
    { ts: '2026-08-21T01:00:00Z' },
    { ts: '2026-08-21T02:00:00Z', rows: -4 },
    { ts: '2026-08-21T03:00:00Z', rows: 7 },
  ];
  assert.equal(openCountersOf(history, [], false).rows, 7);
  assert.equal(openCountersOf(history, [], false).scans, 3);
});

test('openCountersOf skips runs with no timestamp', () => {
  assert.equal(openCountersOf([{ rows: 10 }, null], [], false).scans, 0);
});

test('openCountersOf counts breaks and only VERIFIED heals', () => {
  const incidents = [
    { opened_at: '2026-08-21T05:00:00Z', stages: [{ stage: 'VERIFIED' }] },
    { opened_at: '2026-08-21T09:00:00Z', stages: [{ stage: 'REWEAVING' }] },
  ];
  const counts = openCountersOf([], incidents, false);
  assert.equal(counts.breaks, 2);
  assert.equal(counts.heals, 1);
});

test('openCountersOf restricted to the night keeps only the 00:00-06:00 window', () => {
  const history = [
    { ts: '2026-08-21T03:00:00Z', rows: 20 },
    { ts: '2026-08-21T14:00:00Z', rows: 30 },
  ];
  const incidents = [
    { opened_at: '2026-08-21T05:00:00Z', stages: [{ stage: 'VERIFIED' }] },
    { opened_at: '2026-08-21T14:00:00Z', stages: [{ stage: 'VERIFIED' }] },
  ];
  assert.deepEqual(plain(openCountersOf(history, incidents, true)), {
    scans: 1, rows: 20, breaks: 1, heals: 1,
  });
});

test('openCountersOf tolerates non-array inputs', () => {
  assert.deepEqual(plain(openCountersOf(null, undefined, false)), {
    scans: 0, rows: 0, breaks: 0, heals: 0,
  });
});

test('openSpanOf measures the whole event, from first break to last heal', () => {
  const span = openSpanOf([
    { opened_at: '2026-08-21T05:00:00Z', closed_at: '2026-08-21T06:00:00Z' },
    { opened_at: '2026-08-21T07:00:00Z', closed_at: '2026-08-21T09:00:00Z' },
  ], NOW);
  assert.equal(span.count, 2);
  assert.equal(span.hours, 4);
  assert.equal(span.sameDay, true);
});

test('openSpanOf rounds the span rather than always climbing', () => {
  const span = openSpanOf([
    { opened_at: '2026-08-21T05:00:00Z', closed_at: '2026-08-21T09:00:47Z' },
  ], NOW);
  assert.equal(span.hours, 4);
});

test('openSpanOf never reports a span below one hour', () => {
  const span = openSpanOf([
    { opened_at: '2026-08-21T05:00:00Z', closed_at: '2026-08-21T05:02:00Z' },
  ], NOW);
  assert.equal(span.hours, 1);
});

test('openSpanOf runs an unclosed incident up to now', () => {
  const span = openSpanOf([
    { opened_at: '2026-08-21T19:24:00Z' },
  ], NOW);
  assert.equal(span.hours, 2);
});

test('openSpanOf clears sameDay when the breaks straddle two days', () => {
  const span = openSpanOf([
    { opened_at: '2026-08-21T23:00:00Z', closed_at: '2026-08-22T00:00:00Z' },
    { opened_at: '2026-08-22T01:00:00Z', closed_at: '2026-08-22T02:00:00Z' },
  ], NOW);
  assert.equal(span.sameDay, false);
});

test('openSpanOf returns null with no usable incident', () => {
  assert.equal(openSpanOf([], NOW), null);
  assert.equal(openSpanOf([{ opened_at: 'nope' }], NOW), null);
  assert.equal(openSpanOf(null, NOW), null);
});

test('openWordFor spells small counts and falls back to digits', () => {
  assert.equal(openWordFor(3), 'THREE');
  assert.equal(openWordFor(0), 'ZERO');
  assert.equal(openWordFor(12), 'TWELVE');
  assert.equal(openWordFor(13), '13');
});

test('openDayOf renders a UTC day and month', () => {
  assert.equal(openDayOf(Date.parse('2026-08-21T05:00:00Z')), '21 AUG');
});

test('openThesisOf says every Spider when the breaks cover the fleet', () => {
  const incidents = [
    { spider: 'ATLAS', opened_at: '2026-08-21T05:00:00Z', closed_at: '2026-08-21T06:00:00Z' },
    { spider: 'KESTREL', opened_at: '2026-08-21T05:30:00Z', closed_at: '2026-08-21T07:00:00Z' },
    { spider: 'BODEGA', opened_at: '2026-08-21T07:00:00Z', closed_at: '2026-08-21T09:00:00Z' },
  ];
  const thesis = openThesisOf(incidents, [1, 2, 3], NOW);
  assert.equal(thesis,
    'EVERY SPIDER ON THIS PAGE HAS BEEN TAKEN. ALL THREE, ON 21 AUG, INSIDE FOUR HOURS.');
});

test('openThesisOf counts the taken fraction when the fleet is not all hit', () => {
  const incidents = [
    { spider: 'ATLAS', opened_at: '2026-08-21T05:00:00Z', closed_at: '2026-08-21T06:00:00Z' },
  ];
  const thesis = openThesisOf(incidents, [1, 2, 3], NOW);
  assert.equal(thesis, 'ONE OF THREE SPIDERS HAVE BEEN TAKEN. ALL ONE, ON 21 AUG, INSIDE ONE HOUR.');
});

test('openThesisOf drops the day when the breaks straddle two days', () => {
  const incidents = [
    { spider: 'ATLAS', opened_at: '2026-08-21T23:00:00Z', closed_at: '2026-08-22T01:00:00Z' },
    { spider: 'KESTREL', opened_at: '2026-08-22T00:00:00Z', closed_at: '2026-08-22T01:00:00Z' },
  ];
  assert.ok(!openThesisOf(incidents, [1, 2], NOW).includes('ON 2'));
});

test('openThesisOf returns null with no incidents', () => {
  assert.equal(openThesisOf([], [1, 2, 3], NOW), null);
});

test('openCounterLine reads WHILE YOU WERE AWAY outside the morning', () => {
  const line = openCounterLine(
    [{ ts: '2026-08-21T01:00:00Z', rows: 20 }], [], Date.parse('2026-08-21T21:00:00Z'));
  assert.equal(line.head, 'WHILE YOU WERE AWAY');
  assert.equal(line.night, false);
  assert.equal(line.body, ['1 SCAN', '20 ROWS', '0 BREAKS', '0 HEALS'].join(DOT));
});

test('openCounterLine switches to the overnight window in the morning', () => {
  const history = [
    { ts: '2026-08-21T03:00:00Z', rows: 20 },
    { ts: '2026-08-21T14:00:00Z', rows: 30 },
  ];
  const line = openCounterLine(history, [], Date.parse('2026-08-21T09:00:00Z'));
  assert.equal(line.head, 'WHILE YOU SLEPT');
  assert.equal(line.night, true);
  assert.equal(line.body, ['1 SCAN', '20 ROWS', '0 BREAKS', '0 HEALS'].join(DOT));
});

test('openCounterLine returns null when there is nothing to report', () => {
  assert.equal(openCounterLine([], [], NOW), null);
});

test('the counters match the committed history and incidents exactly', () => {
  const history = readFixture('history.json');
  const incidents = readFixture('incidents.json');
  const counts = openCountersOf(history, incidents, false);
  const rows = history.reduce((total, run) => {
    const n = Number(run.rows);
    return total + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
  assert.equal(counts.scans, history.length);
  assert.equal(counts.rows, rows);
  assert.equal(counts.breaks, incidents.length);
  assert.equal(counts.heals,
    incidents.filter((inc) => (inc.stages || []).some((s) => s.stage === 'VERIFIED')).length);
});

test('the thesis over the committed incidents claims every spider, and means it', () => {
  const incidents = readFixture('incidents.json');
  const taken = new Set(incidents.map((inc) => inc.spider || inc.who));
  const thesis = openThesisOf(incidents, [1, 2, 3], NOW);
  assert.equal(taken.size, 3, 'all three spiders have been taken at least once');
  assert.match(thesis, /^EVERY SPIDER ON THIS PAGE HAS BEEN TAKEN\./);
  assert.match(thesis, /INSIDE \d+ HOURS\.$/);
});

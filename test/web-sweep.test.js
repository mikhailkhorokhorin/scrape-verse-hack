'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const context = loadWebModule(['sweep.js'], {
  document: { getElementById: () => null },
  setInterval: () => 1,
});
const {
  sweepFractionOf, sweepStateOf, sweepRemainingMs, sweepTitleOf, SWEEP_PERIOD_MS,
} = context;

const NOW = Date.parse('2026-08-22T12:00:00Z');
const HALF = SWEEP_PERIOD_MS / 2;

test('the lap is the cron cadence, thirty minutes, not a chosen number', () => {
  assert.equal(SWEEP_PERIOD_MS, 30 * 60 * 1000);
});

test('a scan that just landed leaves the hand at zero', () => {
  assert.equal(sweepFractionOf(NOW, NOW), 0);
});

test('halfway between scans the hand is halfway round', () => {
  assert.equal(sweepFractionOf(NOW - HALF, NOW), 0.5);
});

test('the fraction is the real elapsed interval, not an eased curve', () => {
  const tenMin = 10 * 60 * 1000;
  assert.equal(sweepFractionOf(NOW - tenMin, NOW), tenMin / SWEEP_PERIOD_MS);
});

test('a scan with no timestamp has no hand to draw', () => {
  assert.equal(sweepFractionOf(NaN, NOW), null);
  assert.equal(sweepFractionOf(0, NOW), null);
  assert.equal(sweepStateOf(NaN, NOW).known, false);
});

test('a timestamp from the future does not run the hand backwards', () => {
  assert.equal(sweepFractionOf(NOW + HALF, NOW), 0);
});

test('the drawn fraction never exceeds one full lap', () => {
  const state = sweepStateOf(NOW - SWEEP_PERIOD_MS * 3, NOW);
  assert.equal(state.fraction, 1);
});

test('a run past its window is overdue and says so', () => {
  const late = sweepStateOf(NOW - SWEEP_PERIOD_MS - 1000, NOW);
  assert.equal(late.overdue, true);
  assert.match(sweepTitleOf(late, 0), /overdue/);
});

test('a run inside its window is not overdue', () => {
  assert.equal(sweepStateOf(NOW - HALF, NOW).overdue, false);
});

test('the exact moment the window closes counts as overdue', () => {
  assert.equal(sweepStateOf(NOW - SWEEP_PERIOD_MS, NOW).overdue, true);
});

test('the remaining time is the real countdown to the next scan', () => {
  assert.equal(sweepRemainingMs(NOW - HALF, NOW), HALF);
  assert.equal(sweepRemainingMs(NOW, NOW), SWEEP_PERIOD_MS);
});

test('an overdue run has no time left rather than negative time', () => {
  assert.equal(sweepRemainingMs(NOW - SWEEP_PERIOD_MS * 2, NOW), 0);
});

test('an unknown timestamp has no countdown at all', () => {
  assert.equal(sweepRemainingMs(NaN, NOW), null);
});

test('the title names the real interval in minutes', () => {
  const state = sweepStateOf(NOW - HALF, NOW);
  assert.match(sweepTitleOf(state, HALF), /15 minutes/);
});

test('one minute left is said in the singular', () => {
  const state = sweepStateOf(NOW - HALF, NOW);
  assert.match(sweepTitleOf(state, 60000), /1 minute\b/);
});

test('a Spider with no scan on record says exactly that', () => {
  assert.match(sweepTitleOf(sweepStateOf(NaN, NOW), null), /no scan on record/);
});

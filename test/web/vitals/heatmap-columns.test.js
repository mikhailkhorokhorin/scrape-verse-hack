'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, setGlobal } = require('../../web-loader.js');

const context = loadWebModule(['config.js', 'heatmap.js'], { document: { querySelectorAll: () => [] } });
const { medianStep, heatColumns, heatRunsFor } = context;

function runAt(minutes, extra) {
  const base = Date.parse('2026-08-21T00:00:00Z');
  return Object.assign({ ts: new Date(base + minutes * 60000).toISOString() }, extra || {});
}

test('medianStep is zero when there is nothing to measure between', () => {
  assert.equal(medianStep([]), 0);
  assert.equal(medianStep([runAt(0)]), 0);
});

test('medianStep reads the usual gap, not the outlier', () => {
  const runs = [runAt(0), runAt(30), runAt(60), runAt(600)];
  assert.equal(medianStep(runs), 30 * 60000);
});

test('a run of steady scans produces one column each and no gaps', () => {
  const runs = [runAt(0), runAt(30), runAt(60)];
  const columns = heatColumns(runs);
  assert.equal(columns.length, 3);
  assert.equal(columns.every((c) => c.gap === false), true);
});

test('a missed scan becomes a gap column between the two real ones', () => {
  const runs = [runAt(0), runAt(30), runAt(60), runAt(150)];
  const columns = heatColumns(runs);
  const gaps = columns.filter((c) => c.gap);
  assert.equal(gaps.length, 2);
  assert.equal(columns.length, 6);
});

test('a long outage cannot flood the strip with more than twelve gap columns', () => {
  const runs = [runAt(0), runAt(30), runAt(60), runAt(90), runAt(90 + 30 * 400)];
  const gaps = heatColumns(runs).filter((c) => c.gap);
  assert.equal(gaps.length, 12);
});

test('the median step follows the majority when one interval is wild', () => {
  const runs = [runAt(0), runAt(30), runAt(60), runAt(90), runAt(90 + 30 * 400)];
  assert.equal(medianStep(runs), 30 * 60000);
});

test('a gap only counts when it is well past the usual step', () => {
  const runs = [runAt(0), runAt(30), runAt(60), runAt(105)];
  assert.equal(heatColumns(runs).filter((c) => c.gap).length, 0);
});

test('two scans alone cannot establish a rhythm, so nothing reads as missed', () => {
  const runs = [runAt(0), runAt(30), runAt(600)];
  assert.equal(heatColumns(runs).filter((c) => c.gap).length, 0);
});

test('heatRunsFor keeps one collector, in time order, newest kept', () => {
  setGlobal(context, 'RAW_HISTORY', [
    { collector_id: 'c_b', ts: '2026-08-21T02:00:00Z' },
    { collector_id: 'c_a', ts: '2026-08-21T03:00:00Z' },
    { collector_id: 'c_a', ts: '2026-08-21T01:00:00Z' },
    { collector_id: 'c_a', ts: null },
  ]);
  const runs = heatRunsFor('c_a');
  assert.equal(runs.length, 2);
  assert.equal(runs[0].ts, '2026-08-21T01:00:00Z');
  assert.equal(runs[1].ts, '2026-08-21T03:00:00Z');
});

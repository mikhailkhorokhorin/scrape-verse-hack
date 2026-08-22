'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../web-loader.js');

const context = loadWebModule(['config.js', 'replay.js'], {
  window: { matchMedia: () => ({ matches: false }) },
  setTimeout,
  clearTimeout,
});
const { stageIndexAt, isFinalStage, fieldStateAt, fieldValueAt, reducedMotion } = context;

const MODEL = {
  stages: [
    { name: 'DETECTED', at: 0 },
    { name: 'DIAGNOSED', at: 1000 },
    { name: 'REWEAVING', at: 2000 },
    { name: 'VERIFIED', at: 3000 },
  ],
  fields: [],
};

test('stageIndexAt holds the first stage before any time has passed', () => {
  assert.equal(stageIndexAt(MODEL, 0), 0);
});

test('stageIndexAt stays on a stage until the next one is due', () => {
  assert.equal(stageIndexAt(MODEL, 999), 0);
  assert.equal(stageIndexAt(MODEL, 1000), 1);
  assert.equal(stageIndexAt(MODEL, 1999), 1);
});

test('stageIndexAt lands on the last stage and stays there past the end', () => {
  assert.equal(stageIndexAt(MODEL, 3000), 3);
  assert.equal(stageIndexAt(MODEL, 99999), 3);
});

test('only VERIFIED counts as the final stage', () => {
  assert.equal(isFinalStage(MODEL, 0), false);
  assert.equal(isFinalStage(MODEL, 2), false);
  assert.equal(isFinalStage(MODEL, 3), true);
});

test('a field reads broken until VERIFIED, then reads its after state', () => {
  const field = { broken: 'dead', after: 'live' };
  assert.equal(fieldStateAt(MODEL, field, 0), 'dead');
  assert.equal(fieldStateAt(MODEL, field, 2), 'dead');
  assert.equal(fieldStateAt(MODEL, field, 3), 'live');
});

test('a field that never recovered keeps its dirty value at VERIFIED', () => {
  const field = { broken: 'dead', after: 'dead', recovered: false, dirtyValue: null, cleanValue: 'x' };
  assert.equal(fieldValueAt(MODEL, field, 3), null);
});

test('a recovered field shows the clean value only at VERIFIED', () => {
  const field = { broken: 'dead', after: 'live', recovered: true, dirtyValue: null, cleanValue: '62' };
  assert.equal(fieldValueAt(MODEL, field, 2), null);
  assert.equal(fieldValueAt(MODEL, field, 3), '62');
});

test('reducedMotion reads the media query rather than assuming', () => {
  assert.equal(reducedMotion(), false);
  const reduced = loadWebModule(['config.js', 'replay.js'], {
    window: { matchMedia: () => ({ matches: true }) },
    setTimeout,
    clearTimeout,
  });
  assert.equal(reduced.reducedMotion(), true);
});

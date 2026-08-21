'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const web = loadWebModule(['ground.js']);
const { groundLost, groundDot, groundDim, GROUND_DOT_MIN, GROUND_DOT_MAX, GROUND_DIM_MAX } = web;

test('groundLost passes through the fleet value setFleetSpread writes', () => {
  assert.equal(groundLost('0.42'), 0.42);
});

test('groundLost treats a missing custom property as a healthy fleet', () => {
  assert.equal(groundLost(''), 0);
  assert.equal(groundLost(undefined), 0);
  assert.equal(groundLost(null), 0);
});

test('groundLost clamps outside the 0..1 range setFleetSpread produces', () => {
  assert.equal(groundLost(-1), 0);
  assert.equal(groundLost(4), 1);
});

test('groundDot stays at the token baseline when the fleet is whole', () => {
  assert.equal(groundDot(0), GROUND_DOT_MIN);
});

test('groundDot reaches its coarsest size when the fleet is wholly lost', () => {
  assert.equal(groundDot(1), GROUND_DOT_MAX);
});

test('groundDot coarsens monotonically as integrity drops', () => {
  assert.ok(groundDot(0.25) < groundDot(0.5));
  assert.ok(groundDot(0.5) < groundDot(0.75));
});

test('groundDot never returns a size below the 4px halftone baseline', () => {
  assert.ok(groundDot(-2) >= GROUND_DOT_MIN);
});

test('groundDim is fully transparent for a healthy fleet so the ground is untouched', () => {
  assert.equal(groundDim(0), 0);
});

test('groundDim caps the darkening overlay at its maximum opacity', () => {
  assert.equal(groundDim(1), GROUND_DIM_MAX);
});

test('groundDim stays a low-opacity overlay rather than a ground swap', () => {
  assert.ok(GROUND_DIM_MAX < 0.5);
});

test('groundDim darkens monotonically as integrity drops', () => {
  assert.ok(groundDim(0.2) < groundDim(0.8));
});

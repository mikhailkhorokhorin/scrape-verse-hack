'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadWebModule, modulePath } = require('../../web-loader.js');

const web = loadWebModule(['rig-parts.js', 'rig-react.js']);
const {
  rigTurnToward,
  rigStepLegOf,
  cssEscape,
  RIG_TURN_MAX,
  RIG_TILT_MAX,
  SPARK_VIEW_W,
  SPARK_VIEW_H,
} = web;

function box(left, top, width, height) {
  return { left: left, top: top, width: width, height: height };
}

test('rigTurnToward turns right for a point right of the rig centre', () => {
  const aim = rigTurnToward(box(0, 0, 100, 100), { x: 200, y: 50 });
  assert.ok(aim.turn > 0);
  assert.equal(aim.side, 1);
});

test('rigTurnToward turns left for a point left of the rig centre', () => {
  const aim = rigTurnToward(box(100, 0, 100, 100), { x: 0, y: 50 });
  assert.ok(aim.turn < 0);
  assert.equal(aim.side, -1);
});

test('rigTurnToward reads no turn when the point sits on the rig centre', () => {
  const aim = rigTurnToward(box(0, 0, 100, 100), { x: 50, y: 50 });
  assert.equal(aim.turn, 0);
  assert.equal(aim.tilt, 0);
});

test('rigTurnToward clamps the turn to the stated maximum', () => {
  const aim = rigTurnToward(box(0, 0, 20, 20), { x: 9000, y: 9000 });
  assert.equal(aim.turn, RIG_TURN_MAX);
  assert.equal(aim.tilt, RIG_TILT_MAX);
});

test('rigTurnToward clamps a far-left, far-up point to the negative maximum', () => {
  const aim = rigTurnToward(box(500, 500, 20, 20), { x: -9000, y: -9000 });
  assert.equal(aim.turn, -RIG_TURN_MAX);
  assert.equal(aim.tilt, -RIG_TILT_MAX);
});

test('rigTurnToward tilts down for a point below the rig centre', () => {
  const aim = rigTurnToward(box(0, 0, 100, 100), { x: 50, y: 90 });
  assert.ok(aim.tilt > 0);
});

test('rigTurnToward scales the turn with distance short of the clamp', () => {
  const near = rigTurnToward(box(0, 0, 100, 100), { x: 60, y: 50 });
  const far = rigTurnToward(box(0, 0, 100, 100), { x: 90, y: 50 });
  assert.ok(far.turn > near.turn);
  assert.ok(far.turn <= RIG_TURN_MAX);
});

test('rigTurnToward returns nothing without a measurable rig box', () => {
  assert.equal(rigTurnToward(box(0, 0, 0, 0), { x: 10, y: 10 }), null);
  assert.equal(rigTurnToward(null, { x: 10, y: 10 }), null);
  assert.equal(rigTurnToward(box(0, 0, 10, 10), null), null);
});

test('rigStepLegOf steps the leg of the first field that changed state', () => {
  const change = { code: 'BODEGA', fields: [{ name: 'price', from: 'live', to: 'dead' }] };
  assert.equal(rigStepLegOf(change, 10), 'price');
});

test('rigStepLegOf falls back to a stable per-collector leg when no field moved', () => {
  const change = { code: 'BODEGA', fields: [] };
  const first = rigStepLegOf(change, 10);
  assert.equal(typeof first, 'number');
  assert.equal(rigStepLegOf(change, 10), first);
});

test('rigStepLegOf keeps the fallback leg inside the available legs', () => {
  for (const code of ['BODEGA', 'ATLAS', 'KESTREL', '']) {
    const at = rigStepLegOf({ code: code, fields: [] }, 10);
    assert.ok(at >= 0 && at < 10, code + ' should pick a real leg');
  }
});

test('rigStepLegOf gives different collectors different fallback legs', () => {
  const a = rigStepLegOf({ code: 'BODEGA', fields: [] }, 10);
  const b = rigStepLegOf({ code: 'ATLAS', fields: [] }, 10);
  assert.notEqual(a, b);
});

test('rigStepLegOf reports no leg when the rig has none', () => {
  assert.equal(rigStepLegOf({ code: 'BODEGA', fields: [] }, 0), -1);
});

test('rigStepLegOf tolerates a change with no fields array', () => {
  assert.equal(typeof rigStepLegOf({ code: 'BODEGA' }, 10), 'number');
  assert.equal(typeof rigStepLegOf(null, 10), 'number');
});

test('cssEscape neutralises quotes and backslashes in a field name', () => {
  assert.equal(cssEscape('pri"ce'), 'pri\\"ce');
  assert.equal(cssEscape('a\\b'), 'a\\\\b');
});

test('the spark viewBox constants match the sparkline the rig aims at', () => {
  const source = fs.readFileSync(modulePath('sparkline.js'), 'utf8');
  const declared = source.match(/const W = (\d+), H = (\d+)/);
  assert.ok(declared, 'sparkline.js should declare its viewBox size');
  assert.equal(SPARK_VIEW_W, Number(declared[1]));
  assert.equal(SPARK_VIEW_H, Number(declared[2]));
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

const context = loadWebModule(['webs.js'], {
  document: { querySelectorAll: () => [], querySelector: () => null },
  window: { matchMedia: () => ({ matches: false }), IntersectionObserver: function () {} },
});
const {
  websWobble, websSpokeAngles, websPoint, websRound, websSpokePath, websArcPath,
  WEBS_SIZE, WEBS_SPOKES,
} = context;

test('the wobble is deterministic — the same web is drawn every load', () => {
  assert.equal(websWobble(3, 5), websWobble(3, 5));
  assert.notEqual(websWobble(3, 5), websWobble(4, 5));
});

test('the wobble stays inside one unit, so it can only nudge geometry', () => {
  for (let seed = 0; seed < 8; seed += 1) {
    for (let i = 0; i < 8; i += 1) {
      const w = websWobble(seed, i);
      assert.ok(w >= 0 && w < 1, `wobble ${w} out of range at seed ${seed}, i ${i}`);
    }
  }
});

test('every web has the same number of spokes, whatever its seed', () => {
  assert.equal(websSpokeAngles(1).length, WEBS_SPOKES);
  assert.equal(websSpokeAngles(99).length, WEBS_SPOKES);
});

test('the spokes fan rightward and downward from the rule, never back over the title', () => {
  const angles = websSpokeAngles(7);
  angles.forEach((a) => {
    assert.ok(a > -5 && a < 95, `angle ${a} escapes the quadrant the web hangs in`);
  });
});

test('the spokes stay in order, so strands cannot cross each other', () => {
  const angles = websSpokeAngles(12);
  for (let i = 1; i < angles.length; i += 1) {
    assert.ok(angles[i] > angles[i - 1], 'each spoke sits further round than the last');
  }
});

test('a point at zero degrees sits on the horizontal, at the given radius', () => {
  const [x, y] = websPoint(0, 10);
  assert.equal(websRound(x), 10);
  assert.equal(websRound(y), 0);
});

test('coordinates are rounded to one decimal so the markup stays small', () => {
  assert.equal(websRound(1.2345), 1.2);
  assert.equal(websRound(-1.28), -1.3);
});

test('a spoke path starts at the origin and stays inside the web box', () => {
  const path = websSpokePath(5, 45, 0);
  assert.match(path, /^M0 0 Q/);
  const numbers = path.match(/-?\d+(\.\d+)?/g).map(Number).slice(2);
  numbers.forEach((n) => {
    assert.ok(Math.abs(n) <= WEBS_SIZE, `${n} reaches outside the ${WEBS_SIZE}px box`);
  });
});

test('an arc joins every spoke it is given', () => {
  const angles = websSpokeAngles(2);
  const d = websArcPath(2, angles, 1);
  assert.match(d, /^M/);
  assert.equal((d.match(/Q/g) || []).length, angles.length - 1);
});

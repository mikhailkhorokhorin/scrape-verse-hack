'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

function ctx() {
  return loadWebModule(['sheet-close.js', 'sheet-tear.js'], {
    document: { createElement: () => ({ style: {}, classList: { add() {} } }) },
  });
}

test('a torn seam is jagged: it changes direction many times down the page', () => {
  const { tearSeam } = ctx();
  const xs = tearSeam(22).map((p) => p.x);
  let turns = 0;
  for (let i = 2; i < xs.length; i += 1) {
    const a = xs[i - 1] - xs[i - 2];
    const b = xs[i] - xs[i - 1];
    if (a !== 0 && b !== 0 && Math.sign(a) !== Math.sign(b)) turns += 1;
  }
  assert.ok(turns >= 16, 'paper tears back and forth, it does not curve once (' + turns + ')');
});

test('the seam zigzags hard enough to read as torn, not as a slow curve', () => {
  const { tearSeam } = ctx();
  for (let run = 0; run < 30; run += 1) {
    const xs = tearSeam(26).map((p) => p.x);
    const steps = [];
    for (let i = 1; i < xs.length; i += 1) steps.push(Math.abs(xs[i] - xs[i - 1]));
    const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
    assert.ok(avg >= 8, 'a seam that moves ' + avg.toFixed(2) + '% per step is a straight cut');
  }
});

test('the seam spans a wide band, so the rip is visible at real sheet width', () => {
  const { tearSeam } = ctx();
  for (let run = 0; run < 30; run += 1) {
    const xs = tearSeam(26).map((p) => p.x);
    const spread = Math.max(...xs) - Math.min(...xs);
    assert.ok(spread >= 12, 'seam spread of ' + spread.toFixed(2) + '% is a handful of pixels');
  }
});

test('the seam alternates sides of the centre instead of wandering off', () => {
  const { tearSeam } = ctx();
  const xs = tearSeam(26).map((p) => p.x);
  let crossings = 0;
  for (let i = 1; i < xs.length; i += 1) {
    if (Math.sign(xs[i] - 50) !== Math.sign(xs[i - 1] - 50)) crossings += 1;
  }
  assert.ok(crossings >= 16, 'a real tear keeps crossing the middle (' + crossings + ')');
});

test('a torn seam is never a straight line', () => {
  const { tearSeam } = ctx();
  for (let run = 0; run < 40; run += 1) {
    const xs = tearSeam(22).map((p) => p.x);
    assert.ok(new Set(xs).size > 8, 'a seam with one x value is a guillotine cut');
  }
});

test('the seam runs the full height of the sheet, top edge to bottom edge', () => {
  const { tearSeam } = ctx();
  const pts = tearSeam(22);
  assert.equal(pts[0].y, 0, 'it must start at the top edge');
  assert.equal(pts[pts.length - 1].y, 100, 'and reach the bottom edge');
  assert.equal(pts.length, 23);
});

test('the seam stays near the middle, so neither half is a sliver', () => {
  const { tearSeam } = ctx();
  for (let run = 0; run < 40; run += 1) {
    tearSeam(22).forEach((p) => {
      assert.ok(p.x >= 34 && p.x <= 66, 'x drifted out of the middle band: ' + p.x);
    });
  }
});

test('two closes never tear along the same line', () => {
  const { tearSeam } = ctx();
  const seen = new Set();
  for (let run = 0; run < 25; run += 1) {
    seen.add(tearSeam(22).map((p) => p.x).join(','));
  }
  assert.ok(seen.size >= 24, 'a canned tear would repeat; got ' + seen.size + ' of 25');
});

test('the two halves are cut from the same edge, mirrored', () => {
  const { tearSeam, tearLeftClip, tearRightClip } = ctx();
  const seam = tearSeam(10);
  const left = tearLeftClip(seam);
  const right = tearRightClip(seam);
  seam.forEach((p) => {
    const point = p.x + '% ' + p.y + '%';
    assert.ok(left.includes(point), 'the left half must use the seam point ' + point);
    assert.ok(right.includes(point), 'and so must the right, or they would not interlock');
  });
});

test('each half keeps its own outer border, so together they are the whole sheet', () => {
  const { tearSeam, tearLeftClip, tearRightClip } = ctx();
  const seam = tearSeam(10);
  assert.match(tearLeftClip(seam), /^polygon\(0% 0%,/);
  assert.match(tearLeftClip(seam), /,0% 100%\)$/);
  assert.match(tearRightClip(seam), /^polygon\(100% 0%,100% 100%,/);
});

test('the right half walks the seam in the opposite direction', () => {
  const { tearSeam, tearRightClip } = ctx();
  const seam = tearSeam(10);
  const right = tearRightClip(seam);
  const first = seam[0].x + '% ' + seam[0].y + '%';
  const last = seam[seam.length - 1].x + '% ' + seam[seam.length - 1].y + '%';
  assert.ok(right.indexOf(last) < right.indexOf(first),
    'reversing is what makes the polygon wind correctly');
});

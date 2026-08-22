'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadWebModule, modulePath } = require('../../web-loader.js');

const context = loadWebModule(
  ['config.js', 'format.js', 'value.js', 'received.js',
    'web-geom.js', 'scratch-web.js', 'scratch-veil.js', 'scratch.js'],
  {
    document: { body: { classList: { add() {} }, dataset: {} }, getElementById: () => null,
      querySelectorAll: () => [], addEventListener() {}, documentElement: null,
      createElementNS: () => null },
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: false }),
    sessionStorage: { getItem: () => null, setItem() {} },
    setTimeout,
    clearTimeout,
  }
);
const {
  scratchBrokenFields, scratchLineFor, scratchLinesOf, scratchReduced,
  scratchStrands, scratchHitAt, scratchStrandHit, scratchTornShare, scratchAllTorn,
  scratchQuadPoints, scratchSegHit,
  SCRATCH_RADIUS, SCRATCH_SAMPLES,
} = context;

const BOX = { w: 380, h: 300 };

const SPIDER = {
  fieldOrder: ['title', 'price', 'rating', 'image'],
  fields: { title: 'live', price: 'dead', rating: 'infected', image: 'live' },
  sample: { title: 'A Light in the Attic', price: null, rating: 'undefined', image: 'x.jpg' },
};

test('only the broken fields are worth digging for', () => {
  assert.deepEqual(scratchBrokenFields(SPIDER), ['price', 'rating']);
});

test('a spider with nothing broken offers nothing to reveal', () => {
  const whole = { fieldOrder: ['title'], fields: { title: 'live' }, sample: { title: 'x' } };
  assert.deepEqual(scratchBrokenFields(whole), []);
  assert.deepEqual(scratchLinesOf(whole), []);
});

test('each line names the field, what it returned, and the state behind it', () => {
  assert.equal(scratchLineFor(SPIDER, 'price'), 'price: null');
  assert.match(scratchLineFor(SPIDER, 'rating'), /^rating: /);
  const lines = scratchLinesOf(SPIDER);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].state, 'dead');
  assert.equal(lines[1].state, 'infected');
});

test('reduced motion is read from the media query, not assumed', () => {
  assert.equal(scratchReduced(), false);
});

test('the web is spun from the shared logo geometry, not a fourth generator', () => {
  const source = fs.readFileSync(modulePath('scratch-web.js'), 'utf8');
  assert.match(source, /webPlan\(/, 'the strands come from the shared web plan');
  assert.match(source, /webQuadAt\(/, 'the samples come from the shared curve maths');
  assert.match(source, /webSeedRng\(/, 'the randomness is the shared seeded generator');
  assert.doesNotMatch(source, /Math\.sin\([^)]*12\.9898/,
    'a hand-rolled wobble here would be a fourth web generator');
});

test('the zone is plastered edge to edge, with strands from every corner', () => {
  const strands = scratchStrands(BOX, 3);
  assert.ok(strands.length >= 24, 'a handful of strands would leave the values readable');
  const anchors = new Set(strands.map((s) => s.anchor.map(Math.round).join(',')));
  assert.ok(anchors.size >= 4, 'strands hang from at least four anchors');
  const xs = strands.flatMap((s) => s.points.map((p) => p[0]));
  const ys = strands.flatMap((s) => s.points.map((p) => p[1]));
  assert.ok(Math.min(...xs) < BOX.w * 0.2 && Math.max(...xs) > BOX.w * 0.8,
    'the strands reach both side edges');
  assert.ok(Math.min(...ys) < BOX.h * 0.2 && Math.max(...ys) > BOX.h * 0.8,
    'the strands reach top and bottom');
});

test('the same panel spins the same web twice, so a resize is not a reshuffle', () => {
  assert.deepEqual(
    scratchStrands(BOX, 7).map((s) => s.d),
    scratchStrands(BOX, 7).map((s) => s.d)
  );
});

test('different panels get different webs', () => {
  assert.notDeepEqual(
    scratchStrands(BOX, 1).map((s) => s.d),
    scratchStrands(BOX, 2).map((s) => s.d)
  );
});

const STRAND_HALF_WIDTH = 0.7;

function bareShareOf(seed, step) {
  const strands = scratchStrands(BOX, seed);
  let bare = 0;
  let total = 0;
  for (let x = 10; x < BOX.w; x += step) {
    for (let y = 10; y < BOX.h; y += step) {
      total += 1;
      if (scratchHitAt(strands, x, y, STRAND_HALF_WIDTH).length === 0) bare += 1;
    }
  }
  return bare / total;
}

test('there are real gaps between the strands, it is a web and not a black slab', () => {
  [[5, 11], [1, 23], [9, 23]].forEach(([seed, step]) => {
    const bare = bareShareOf(seed, step);
    assert.ok(bare > 0.25, 'seed ' + seed + ' inked the panel into a slab, not a web');
    assert.ok(bare < 0.95, 'seed ' + seed + ' spun a web too sparse to hide anything');
  });
});

test('every strand is sampled into a polyline the hit test can walk', () => {
  const strands = scratchStrands(BOX, 4);
  strands.forEach((s) => {
    assert.equal(s.points.length, SCRATCH_SAMPLES + 1);
    s.points.forEach((p) => {
      assert.ok(Number.isFinite(p[0]) && Number.isFinite(p[1]));
    });
  });
});

test('a quadratic path is sampled from its start to its end', () => {
  const pts = scratchQuadPoints('M0 0 Q50 100 100 0');
  assert.deepEqual(Array.from(pts[0]), [0, 0]);
  assert.deepEqual(Array.from(pts[pts.length - 1]), [100, 0]);
  assert.ok(pts[Math.floor(pts.length / 2)][1] > 20, 'the curve bulges, it is not a chord');
});

test('a point beside a segment is measured to the segment, not just to its ends', () => {
  assert.equal(scratchSegHit([0, 0], [100, 0], 50, 5, 10), true);
  assert.equal(scratchSegHit([0, 0], [100, 0], 50, 40, 10), false);
  assert.equal(scratchSegHit([0, 0], [100, 0], 130, 0, 10), false,
    'past the end of the segment is a miss');
});

test('touching one strand anywhere tears that whole strand, end to end', () => {
  const strands = scratchStrands(BOX, 6);
  const target = strands.find((s) => s.points.length > 3);
  const near = target.points[1];
  const hits = scratchHitAt(strands, near[0], near[1], SCRATCH_RADIUS);
  assert.ok(hits.length > 0, 'a touch on the strand registers');
  hits.forEach((i) => { strands[i].torn = true; });
  const far = target.points[target.points.length - 1];
  assert.equal(target.torn, true,
    'a nick anywhere must take the whole strand, not carve a hole in it');
  assert.equal(scratchHitAt(strands, far[0], far[1], SCRATCH_RADIUS).includes(strands.indexOf(target)),
    false, 'the far end of a torn strand is gone too, it is not still there to catch');
});

test('a torn strand is never offered up a second time', () => {
  const strands = scratchStrands(BOX, 8);
  const p = strands[0].points[3];
  const first = scratchHitAt(strands, p[0], p[1], SCRATCH_RADIUS);
  first.forEach((i) => { strands[i].torn = true; });
  const again = scratchHitAt(strands, p[0], p[1], SCRATCH_RADIUS);
  assert.equal(again.length, 0);
});

test('the tearing radius is small, so a drag takes one strand at a time', () => {
  assert.ok(SCRATCH_RADIUS <= 24, 'a wide radius wipes whole quadrants in a single stroke');
  assert.ok(SCRATCH_RADIUS >= 12, 'too fine a radius makes the strands impossible to catch');
});

function dragAcross(strands, box, y) {
  for (let x = -SCRATCH_RADIUS; x <= box.w + SCRATCH_RADIUS; x += 6) {
    scratchHitAt(strands, x, y, SCRATCH_RADIUS).forEach((i) => { strands[i].torn = true; });
  }
}

function dragDown(strands, box, x) {
  for (let y = -SCRATCH_RADIUS; y <= box.h + SCRATCH_RADIUS; y += 6) {
    scratchHitAt(strands, x, y, SCRATCH_RADIUS).forEach((i) => { strands[i].torn = true; });
  }
}

test('a single drag takes a whole run of strands, not one nick at a time', () => {
  const strands = scratchStrands(BOX, 9, 0);
  const target = strands.find((s) => s.points.length > 3);
  target.points.forEach((p) => {
    scratchHitAt(strands, p[0], p[1], SCRATCH_RADIUS).forEach((i) => { strands[i].torn = true; });
  });
  const torn = strands.filter((s) => s.torn).length;
  assert.equal(target.torn, true);
  assert.ok(torn > 1, 'dragging along one strand must sweep what it crosses too');
});

test('a few sweeps across the zone strip the whole web', () => {
  const strands = scratchStrands(BOX, 9, 0);
  const step = SCRATCH_RADIUS;
  let sweeps = 0;
  for (let y = -step; y <= BOX.h + step && !scratchAllTorn(strands); y += step) {
    dragAcross(strands, BOX, y);
    sweeps += 1;
  }
  for (let x = -step; x <= BOX.w + step && !scratchAllTorn(strands); x += step) {
    dragDown(strands, BOX, x);
    sweeps += 1;
  }
  assert.equal(scratchAllTorn(strands), true, 'the zone can actually be cleared');
  assert.ok(sweeps <= Math.ceil((BOX.w + BOX.h) / step) + 4,
    'clearing the zone must be easier than the old pixel scrubbing');
});

test('progress is the share of torn strands, not a count of scrubbed pixels', () => {
  const strands = scratchStrands(BOX, 11);
  assert.equal(scratchTornShare(strands), 0);
  assert.equal(scratchAllTorn(strands), false);
  strands.slice(0, Math.floor(strands.length / 2)).forEach((s) => { s.torn = true; });
  const share = scratchTornShare(strands);
  assert.ok(share > 0.4 && share < 0.6);
  assert.equal(scratchAllTorn(strands), false, 'half torn is not bared');
  strands.forEach((s) => { s.torn = true; });
  assert.equal(scratchTornShare(strands), 1);
  assert.equal(scratchAllTorn(strands), true, 'every strand torn bares the values');
});

test('an empty web is not treated as an already-cleared one', () => {
  assert.equal(scratchAllTorn([]), false);
  assert.equal(scratchTornShare([]), 0);
});

test('a strand with a single sample is still catchable', () => {
  const dot = { points: [[10, 10]] };
  assert.equal(scratchStrandHit(dot, 12, 12, SCRATCH_RADIUS), true);
  assert.equal(scratchStrandHit(dot, 200, 200, SCRATCH_RADIUS), false);
  assert.equal(scratchStrandHit({ points: [] }, 10, 10, SCRATCH_RADIUS), false);
});

test('no text is drawn into the web layer, it hides values rather than restating them', () => {
  const geom = fs.readFileSync(modulePath('scratch-web.js'), 'utf8');
  const scratch = fs.readFileSync(modulePath('scratch.js'), 'utf8');
  assert.doesNotMatch(geom, /fillText|measureText|createTextNode/);
  assert.doesNotMatch(scratch, /fillText|measureText|createTextNode/);
});

test('the dead canvas painting is gone, nothing carves pixels any more', () => {
  const scratch = fs.readFileSync(modulePath('scratch.js'), 'utf8');
  const veil = fs.readFileSync(modulePath('scratch-veil.js'), 'utf8');
  const geom = fs.readFileSync(modulePath('scratch-web.js'), 'utf8');
  const all = scratch + veil + geom;
  assert.doesNotMatch(all, /destination-out|getContext|createRadialGradient|globalCompositeOperation/,
    'the canvas carving was replaced by strands and must not linger as dead weight');
});

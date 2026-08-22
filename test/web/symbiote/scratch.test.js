'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadWebModule, modulePath, plain } = require('../../web-loader.js');

const context = loadWebModule(
  ['config.js', 'format.js', 'value.js', 'received.js', 'scratch-paint.js', 'scratch.js'],
  {
    document: { body: { classList: { add() {} }, dataset: {} }, getElementById: () => null,
      querySelectorAll: () => [], addEventListener() {} },
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: false }),
    sessionStorage: { getItem: () => null, setItem() {} },
    setTimeout,
    clearTimeout,
  }
);
const {
  scratchBrokenFields, scratchLineFor, scratchLinesOf, scratchColorFor,
  scratchRowsTop, scratchReduced, scratchInterpolate,
  SCRATCH_ROW_H, SCRATCH_STEP, SCRATCH_RADIUS, SCRATCH_CLIP,
} = context;

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

test('the revealed line names the field and what it actually returned', () => {
  assert.equal(scratchLineFor(SPIDER, 'price'), 'price: null');
  assert.match(scratchLineFor(SPIDER, 'rating'), /^rating: /);
});

test('each line carries the state that decides its colour', () => {
  const lines = scratchLinesOf(SPIDER);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].state, 'dead');
  assert.equal(lines[1].state, 'infected');
});

test('dead reads critical red and infected reads violet, as the legend promises', () => {
  assert.equal(scratchColorFor('dead'), '#FF1E1E');
  assert.equal(scratchColorFor('infected'), '#C24BFF');
  assert.equal(scratchColorFor('live'), '#F4EFE4');
});

test('the rows sit inside the black, never above it', () => {
  const h = 500;
  const top = h * (1 - 0.8);
  const y = scratchRowsTop([{ text: 'a' }, { text: 'b' }], h, top);
  assert.ok(y > top, 'the first row starts below the top edge of the substance');
  assert.ok(y + 2 * SCRATCH_ROW_H < h, 'and the last row still fits above the base');
});

test('a single row is centred in the black rather than clinging to its top', () => {
  const h = 400;
  const top = 100;
  const y = scratchRowsTop([{ text: 'only' }], h, top);
  assert.ok(Math.abs(y - (top + (h - top) / 2)) < SCRATCH_ROW_H);
});

test('reduced motion is read from the media query, not assumed', () => {
  assert.equal(scratchReduced(), false);
});

test('two strokes in opposite corners stay two strokes, and never join up', () => {
  const state = { strokes: [] };
  const open = (s) => s.strokes.push([]);
  open(state);
  state.strokes[0] = state.strokes[0].concat(scratchInterpolate([], { x: 10, y: 10 }));
  open(state);
  const last = state.strokes[state.strokes.length - 1];
  state.strokes[1] = last.concat(scratchInterpolate(last, { x: 400, y: 300 }));
  assert.equal(state.strokes.length, 2);
  assert.deepEqual(plain(state.strokes[0]), [{ x: 10, y: 10 }]);
  assert.deepEqual(plain(state.strokes[1]), [{ x: 400, y: 300 }],
    'a fresh stroke does not interpolate back to where the last one ended');
});

test('a fast drag fills the gap, so the trail is a band and not a dotted line', () => {
  const filled = scratchInterpolate([{ x: 0, y: 0 }], { x: 120, y: 0 });
  assert.ok(filled.length > 1, 'the gap is filled');
  assert.equal(filled[filled.length - 1].x, 120, 'the last point is where the pointer is');
  const gaps = filled.slice(1).map((p, i) => p.x - filled[i].x);
  assert.ok(Math.max(...gaps) <= SCRATCH_STEP + 0.001, 'no gap is wider than one step');
});

test('a slow drag adds one point, not a run of them', () => {
  assert.deepEqual(plain(scratchInterpolate([{ x: 0, y: 0 }], { x: 4, y: 0 })), [{ x: 4, y: 0 }]);
});

test('the reveal is wide enough to read a line of values through', () => {
  assert.ok(SCRATCH_RADIUS >= 38, 'a 34px hole tore the values into fragments');
  assert.ok(SCRATCH_CLIP >= 0.8, 'the readable window must not be much smaller than the hole');
  assert.ok(SCRATCH_RADIUS * SCRATCH_CLIP * 2 > SCRATCH_ROW_H * 2,
    'the window clears two rows of text');
});

test('the scratch paints an under-layer rather than cutting through to the panel', () => {
  const source = fs.readFileSync(modulePath('scratch.js'), 'utf8');
  const reveal = source.slice(source.indexOf('function scratchReveal'));
  assert.match(reveal.slice(0, 400), /fillStyle = SCRATCH_UNDER/,
    'cutting a hole let the live panel content show through and collide with the values');
  assert.doesNotMatch(reveal.slice(0, 400), /destination-out/);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadWebModule, modulePath, cssPath } = require('../../web-loader.js');

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
  scratchSize, scratchPointIn, scratchTopOf,
  SCRATCH_ROW_H, SCRATCH_COVER, SCRATCH_CLEARANCE,
} = context;

function fakeState(cssW, cssH, left, top, spread, concealed) {
  const layer = {
    style: {},
    setAttribute() {},
    getBoundingClientRect: () => ({ left, top, width: cssW, height: cssH,
      right: left + cssW, bottom: top + cssH }),
    getClientRects: () => [{ left, top, width: cssW, height: cssH,
      right: left + cssW, bottom: top + cssH }],
  };
  const parts = (concealed || []).map((offset) => ({
    getBoundingClientRect: () => ({ top: top + offset, height: 20 }),
  }));
  return {
    layer,
    box: { w: 1, h: 1 },
    panel: {
      clientHeight: cssH,
      getBoundingClientRect: () => ({ width: cssW, height: cssH }),
      querySelectorAll: (sel) => (sel.indexOf('phead') === -1 ? parts : []),
    },
    spread: spread === undefined ? 0.85 : spread,
  };
}

test('the web layer spans the whole panel and matches the box it is displayed in', () => {
  const state = fakeState(755, 420, 42.5, 197.9);
  assert.equal(scratchSize(state), true);
  assert.equal(state.box.h, 420,
    'a short layer clipped the integrity readout and cut the legs off the spider');
  assert.ok(Math.abs(state.box.w - 755) <= 1,
    'a viewBox wider than its box shifted every strand sideways');
});

test('a pointer in the middle of the layer maps to the middle of the web', () => {
  const state = fakeState(755, 420, 42.5, 197.9);
  scratchSize(state);
  const box = state.layer.getBoundingClientRect();
  const point = scratchPointIn(state, box.left + box.width / 2, box.top + box.height / 2);
  assert.ok(point, 'a point inside the layer is accepted');
  assert.ok(Math.abs(point.x - state.box.w / 2) <= 1);
  assert.ok(Math.abs(point.y - state.box.h / 2) <= 1);
});

test('a pointer near a corner maps to that same corner, and the top is never dropped', () => {
  const state = fakeState(755, 420, 42.5, 197.9);
  scratchSize(state);
  const box = state.layer.getBoundingClientRect();
  const near = scratchPointIn(state, box.left + 20, box.top + 30);
  assert.ok(Math.abs(near.x - 20 * (state.box.w / box.width)) <= 1);
  assert.ok(Math.abs(near.y - 30 * (state.box.h / box.height)) <= 1);
  assert.ok(scratchPointIn(state, box.left + 100, box.top + 2));
});

test('the veil reaches up from the base in proportion to the spread', () => {
  const state = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(state);
  const top = scratchTopOf(state);
  assert.ok(top > 0, 'the veil never covers the whole panel');
  assert.ok(Math.abs(top - 400 * (1 - 0.85 * SCRATCH_COVER)) <= 1);
});

test('a shallow spread leaves most of the panel bare', () => {
  const state = fakeState(755, 400, 0, 0, 0.2);
  scratchSize(state);
  assert.ok(scratchTopOf(state) > 400 * 0.7);
});

test('the edge lifts clear of a readout it would otherwise slice through', () => {
  const bare = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(bare);
  const plainTop = scratchTopOf(bare);
  const sliced = fakeState(755, 400, 0, 0, 0.85, [plainTop - 8]);
  scratchSize(sliced);
  assert.ok(scratchTopOf(sliced) < plainTop,
    'an edge cutting across the readout clipped the 0% and cut the legs off the rig');
  assert.ok(scratchTopOf(sliced) <= plainTop - 8 - SCRATCH_CLEARANCE + 1,
    'the edge clears the readout by a real margin');
});

test('content already fully below the edge never drags the veil higher', () => {
  const bare = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(bare);
  const plainTop = scratchTopOf(bare);
  const low = fakeState(755, 400, 0, 0, 0.85, [plainTop + 120]);
  scratchSize(low);
  assert.equal(scratchTopOf(low), plainTop);
});

test('content entirely above the edge is left alone, not swallowed', () => {
  const bare = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(bare);
  const plainTop = scratchTopOf(bare);
  const high = fakeState(755, 400, 0, 0, 0.85, [plainTop - 90]);
  scratchSize(high);
  assert.equal(scratchTopOf(high), plainTop,
    'the header must stay readable rather than be dragged under the veil');
});

test('the lifted edge never rises over the panel header', () => {
  const state = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(state);
  const reach = scratchTopOf(state);
  const cutter = { getBoundingClientRect: () => ({ top: reach - 40, height: 80 }) };
  const head = { getBoundingClientRect: () => ({ top: 20, height: 60 }) };
  state.panel.querySelectorAll = (sel) => (sel.indexOf('phead') === -1 ? [cutter] : [head]);
  assert.equal(scratchTopOf(state), 80,
    'lifting to clear a readout must stop at the codename, not swallow it');
});

test('the veil never climbs above the top of the panel', () => {
  const tall = { getBoundingClientRect: () => ({ top: 2, height: 380 }) };
  const state = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(state);
  state.panel.querySelectorAll = (sel) => (sel.indexOf('phead') === -1 ? [tall] : []);
  assert.ok(scratchTopOf(state) >= 0,
    'a tall element straddling the edge must not push the veil off the panel');
});

test('a spread too shallow to hide even one row does not mount a web at all', () => {
  const state = fakeState(755, 400, 0, 0, 0.001);
  assert.equal(scratchSize(state), false);
  assert.ok(SCRATCH_ROW_H > 0);
});

test('the layer is sized from the panel layout box, never the rotated screen rect', () => {
  const source = fs.readFileSync(modulePath('scratch-veil.js'), 'utf8');
  const sized = source.slice(source.indexOf('function scratchSize'));
  assert.doesNotMatch(sized.slice(0, 500), /panel\.getBoundingClientRect/,
    'the cells are rotated, so the panel screen rect is taller than its layout box');
});

test('the web sits above the readouts it must conceal', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const rule = css.slice(css.indexOf('.panel > .scratch__web'));
  const z = /z-index:(\d+)/.exec(rule.slice(0, 260));
  assert.ok(z, 'the layer declares a stacking order');
  assert.ok(Number(z[1]) > 3,
    'below the panel content the web concealed nothing and the reveal was meaningless');
});

test('the web covers the panel edge to edge in CSS as well as in the viewBox', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const rule = css.slice(css.indexOf('.panel > .scratch__web'), css.indexOf('.scratch__veil'));
  assert.match(rule, /top:0/);
  assert.match(rule, /bottom:0/);
  assert.match(rule, /height:100%/);
});

test('a strand snaps back with transform and opacity only, never a paint property', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const snap = css.slice(css.indexOf('@keyframes scratch-snap'), css.indexOf('.panel.is-bared'));
  assert.doesNotMatch(snap, /stroke-dashoffset|stroke-dasharray/,
    'animating stroke-dashoffset on dozens of paths already cost the web its frame rate once');
  assert.doesNotMatch(snap, /filter|box-shadow|mask-position|background-position/);
  assert.match(snap, /transform:/);
  assert.match(snap, /opacity:/);
});

test('nothing in the whole sheet animates or transitions a paint property', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  assert.doesNotMatch(css, /transition:[^;}]*stroke-dashoffset/);
  assert.doesNotMatch(css, /animation:[^;}]*dash/);
  const veil = css.slice(css.indexOf('.scratch__veil'), css.indexOf('.scratch__g'));
  assert.match(veil, /transition:opacity/,
    'the veil fades on opacity, its fill stays a static paint');
});

test('the torn strand retracts toward the anchor it hangs from', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const strand = css.slice(css.indexOf('.scratch__strand{'), css.indexOf('.scratch__strand--spoke'));
  assert.match(strand, /transform-origin:var\(--ox/, 'the strand collapses to its own anchor');
  const snap = css.slice(css.indexOf('@keyframes scratch-snap'));
  assert.match(snap.slice(0, 200), /scale\(\.?0?\.\d+\)/, 'the strand shrinks as it lets go');
});

test('reduced motion drops the retraction rather than playing it fast', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const reduced = css.slice(css.indexOf('@media(prefers-reduced-motion:reduce)'));
  assert.match(reduced, /\.scratch__strand\.is-torn\{animation-name:none/,
    'a torn strand must vanish outright when motion is not wanted');
  assert.match(reduced, /opacity:0/);
});

test('the whole zone is bared only through the is-bared class, not by deleting the layer', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  assert.match(css, /\.panel\.is-bared > \.scratch__web \.scratch__veil\{opacity:0/);
  const scratch = fs.readFileSync(modulePath('scratch.js'), 'utf8');
  assert.match(scratch, /scratchAllTorn\(state\.strands\)/);
  assert.match(scratch, /classList\.add\("is-bared"\)/);
});

test('the child selector keeps a cloned panel inside a sheet from being bared too', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  assert.match(css, /\.panel > \.scratch__web\{/,
    'a descendant selector here would reach clones nested inside the panel');
});

test('the strand weight and hint stay readable on a narrow screen', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  assert.match(css, /font-size:clamp\(/, 'the hint scales between a floor and a ceiling');
  assert.match(css, /@media\(max-width:767px\)/, 'the web answers the 767px breakpoint');
  assert.match(css, /@media\(max-width:600px\)/, 'the hint answers the 600px breakpoint');
});

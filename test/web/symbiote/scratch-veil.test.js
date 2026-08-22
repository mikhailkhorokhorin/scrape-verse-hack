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
  SCRATCH_ROW_H, SCRATCH_COVER,
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

test('the web starts at the very top of the panel, it is not a band across the base', () => {
  [0.85, 0.2, 1, 0.5].forEach((spread) => {
    const state = fakeState(755, 400, 0, 0, spread);
    scratchSize(state);
    assert.equal(scratchTopOf(state), 0,
      'a spread of ' + spread + ' left a bare strip the scraped values could be read through');
  });
});

test('no readout on the panel can push the web down off the content it hides', () => {
  const state = fakeState(755, 400, 0, 0, 0.85, [10, 120, 260, 380]);
  scratchSize(state);
  assert.equal(scratchTopOf(state), 0,
    'the web covers the panel outright, nothing may carve an opening in it');
});

test('the panel header is covered like everything else, it earns no exemption', () => {
  const head = { getBoundingClientRect: () => ({ top: 20, height: 60 }) };
  const state = fakeState(755, 400, 0, 0, 0.85);
  scratchSize(state);
  state.panel.querySelectorAll = (sel) => (sel.indexOf('phead') === -1 ? [] : [head]);
  assert.equal(scratchTopOf(state), 0,
    'sparing the header would leave a readable gap at the top of the zone');
});

test('the cover reaches the whole panel however tall it is', () => {
  [200, 400, 900].forEach((h) => {
    const state = fakeState(755, h, 0, 0, 0.85);
    scratchSize(state);
    assert.equal(scratchTopOf(state), 0);
    assert.equal(state.box.h, h, 'the web box must span the panel it covers');
  });
});

test('a spread too shallow to hide even one row does not mount a web at all', () => {
  const state = fakeState(755, 400, 0, 0, 0.001);
  assert.equal(scratchSize(state), false);
  assert.ok(SCRATCH_ROW_H > 0);
  assert.ok(SCRATCH_COVER > 0 && SCRATCH_COVER <= 1,
    'the mount threshold is a share of the panel, a web is worth spinning or it is not');
  const worth = fakeState(755, 400, 0, 0, 1);
  assert.equal(scratchSize(worth), true, 'a full spread always earns a web');
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
  assert.doesNotMatch(css, /transition:[^;}]*\bfill\b/,
    'transitioning fill repaints the whole rect every frame');
});

test('the veil paints nothing, the strands alone are what conceal the readouts', () => {
  const css = fs.readFileSync(cssPath('scratch.css'), 'utf8');
  const veil = css.slice(css.indexOf('.scratch__veil{'));
  const rule = veil.slice(0, veil.indexOf('}'));
  assert.match(rule, /fill:none/,
    'a painted rect is the old slab, the reveal is meant to be earned strand by strand');
  assert.match(rule, /fill-opacity:0/, 'the rect stays invisible whatever the fill resolves to');
});

test('what the panel hides is carried by the strand count, not by a slab of ink', () => {
  const web = fs.readFileSync(modulePath('scratch-web.js'), 'utf8');
  const cell = /SCRATCH_CELL\s*=\s*(\d+)/.exec(web);
  assert.ok(cell, 'the weave declares a cell size');
  assert.ok(Number(cell[1]) > 0 && Number(cell[1]) < 140,
    'a coarse cell leaves the readouts legible between the hubs');
  const spokes = /minSpokes:\s*(\d+)/.exec(web);
  const rings = /minRings:\s*(\d+)/.exec(web);
  assert.ok(spokes && Number(spokes[1]) >= 6, 'each hub needs enough spokes to obscure its cell');
  assert.ok(rings && Number(rings[1]) >= 4, 'the rings are what close the gaps between spokes');
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

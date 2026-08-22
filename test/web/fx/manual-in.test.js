'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath, loadWebModule, plain } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('manual-in.css'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const MANUAL = fs.readFileSync(path.join(ROOT, 'web', 'manual.html'), 'utf8');
const JS_SRC = fs.readFileSync(path.join(ROOT, 'web', 'js', 'fx', 'manual-in.js'), 'utf8');

const context = loadWebModule(['manual-in.js'], {
  document: null, location: { search: '' }, URLSearchParams: global.URLSearchParams, matchMedia: undefined,
});
const {
  manualInDecision, manualInDelay, manualInLastBeat,
  MANUAL_IN_STAGES, MANUAL_IN_STAGGER_MAX,
} = context;

test('the manual plays its entrance on every visit, unlike the watch', () => {
  const decision = manualInDecision({ reducedMotion: false, capture: false });
  assert.deepEqual(plain(decision), { play: true, why: 'every-visit' });
});

test('it keeps no seen flag at all, which is what makes it replay', () => {
  assert.doesNotMatch(JS_SRC, /localStorage|getItem|setItem/,
    'a stored flag is exactly the thing that would make it play only once');
});

test('the stages run head, ad, sections, foot — the order a back page is read in', () => {
  assert.deepEqual(plain(MANUAL_IN_STAGES).map((s) => s.name),
    ['head', 'ad', 'sections', 'foot']);
});

test('every stage the plan names actually exists on the page', () => {
  plain(MANUAL_IN_STAGES).forEach((stage) => {
    const cls = stage.selector.replace(/^[.#]/, '');
    assert.ok(MANUAL.includes(cls), stage.selector + ' must be on the manual');
  });
});

test('the stagger is capped, so a long list cannot push the last item off the end', () => {
  const stage = plain(MANUAL_IN_STAGES)[2];
  const capped = manualInDelay(stage, MANUAL_IN_STAGGER_MAX + 40);
  const atCap = manualInDelay(stage, MANUAL_IN_STAGGER_MAX);
  assert.equal(capped, atCap, 'past the cap the delay stops growing');
});

test('the whole entrance is over in about a second', () => {
  assert.ok(manualInLastBeat() < 1000, 'a slow entrance on a short page is a toll booth');
});

test('it is an ink stamp, not the watch settle — a different character', () => {
  assert.match(CSS, /@keyframes manual-stamp/);
  assert.match(CSS, /@keyframes manual-ink/);
  const intro = fs.readFileSync(cssPath('intro.css'), 'utf8');
  assert.match(intro, /@keyframes intro-settle/);
  assert.doesNotMatch(CSS, /blur\(/,
    'the watch settles out of a blur; the manual should not copy it');
});

test('the ink beat only tightens the plate offsets, it never fades text below readable', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes manual-ink'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  const opacities = (body.match(/opacity:([\d.]+)/g) || [])
    .map((d) => Number(d.split(':')[1]));
  assert.ok(opacities.every((o) => o === 0.15 || o === 1),
    'it starts nearly out and ends fully on, with nothing lingering half-legible');
});

test('the animated stage is promoted and moves only transform and opacity', () => {
  const rule = CSS.slice(CSS.indexOf('.manual-in{'), CSS.indexOf('@keyframes manual-stamp'));
  assert.match(rule, /will-change:transform,opacity/);
  const frames = CSS.slice(CSS.indexOf('@keyframes manual-stamp'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.doesNotMatch(body, /(?:width|height|margin|padding|top|left):/,
    'a reflowing entrance would jank the whole page');
});

test('nothing loops, because an entrance that repeats is a distraction', () => {
  assert.doesNotMatch(CSS, /infinite/);
});

test('reduced motion and capture each suppress it outright', () => {
  assert.equal(manualInDecision({ reducedMotion: true, capture: false }).why, 'reduced-motion');
  assert.equal(manualInDecision({ reducedMotion: false, capture: true }).why, 'capture');
  assert.equal(manualInDecision({ reducedMotion: true, capture: true }).why, 'reduced-motion',
    'reduced motion outranks capture');
});

test('the three suppressions are all present in the stylesheet too', () => {
  assert.match(CSS, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?animation:none !important/);
  assert.match(CSS, /@media print[\s\S]*?animation:none !important/);
  assert.match(CSS, /\.is-capture \.manual-in/);
});

test('the entrance settles itself, so no element is left stuck invisible', () => {
  assert.match(JS_SRC, /function manualInSettle/);
  const settle = JS_SRC.slice(JS_SRC.indexOf('function manualInSettle'));
  const body = settle.slice(0, settle.indexOf('\n}'));
  assert.match(body, /classList\.remove\("manual-in"\)/,
    'the class must come back off or the page keeps a fill-mode opacity forever');
  assert.match(JS_SRC, /setTimeout\(manualInSettle/, 'and it must be scheduled');
});

test('content is never gated on the entrance class — the page is complete without it', () => {
  assert.doesNotMatch(CSS, /\.man\{[^}]*opacity:0/);
  assert.doesNotMatch(CSS, /visibility:hidden/,
    'a headless renderer that never runs the script must still show everything');
});

test('the manual page loads both halves of the entrance', () => {
  assert.match(MANUAL, /css\/fx\/manual-in\.css/);
  assert.match(MANUAL, /js\/fx\/manual-in\.js/);
});

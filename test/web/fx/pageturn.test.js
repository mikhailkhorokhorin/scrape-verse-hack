'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath, loadWebModule, plain } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('pageturn.css'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');
const MANUAL = fs.readFileSync(path.join(ROOT, 'web', 'manual.html'), 'utf8');

function ctx(extra) {
  return loadWebModule(['pageturn.js'], Object.assign({
    document: null, location: { search: '' }, URLSearchParams: global.URLSearchParams,
  }, extra || {}));
}

const { pageturnDecision } = ctx();

test('the transition is declared for cross-document navigation, the MPA form', () => {
  assert.match(CSS, /@view-transition\{navigation:auto;\}/,
    'this is what makes a plain link between two html files animate');
});

test('it is a panel wipe, not a crossfade', () => {
  assert.match(CSS, /@keyframes pageturn-out[\s\S]*?clip-path:inset\(0 0 0 100%\)/,
    'the old page is wiped away edge to edge');
  assert.match(CSS, /@keyframes pageturn-in[\s\S]*?clip-path:inset\(0 100% 0 0\)/,
    'the new page is uncovered from the opposite edge');
  const out = CSS.slice(CSS.indexOf('@keyframes pageturn-out'));
  assert.doesNotMatch(out.slice(0, out.indexOf('}\n\n')), /opacity:0/,
    'fading would make it the generic crossfade the brief rejected');
});

test('the whole turn is quick enough not to feel like a page load', () => {
  const dur = Number((CSS.match(/::view-transition-group\(root\)\{\s*animation-duration:(\d+)ms/) || [])[1]);
  assert.ok(dur > 0 && dur <= 400, 'a slow page turn reads as latency, not style');
});

test('a browser without the API still navigates, it just does not animate', () => {
  const decision = pageturnDecision({ reducedMotion: false, capture: false, supported: false });
  assert.deepEqual(plain(decision), { play: false, why: 'unsupported' });
});

test('nothing about navigation is gated on the API existing', () => {
  const js = fs.readFileSync(path.join(ROOT, 'web', 'js', 'fx', 'pageturn.js'), 'utf8');
  assert.doesNotMatch(js, /preventDefault|addEventListener\(\s*["']click/,
    'intercepting the click is what would break navigation on an unsupported browser');
  assert.doesNotMatch(js, /location\.(?:href|assign|replace)\s*=/,
    'the script must never drive navigation itself');
});

test('the links between the pages stay ordinary hrefs', () => {
  assert.match(MANUAL, /<a class="pagenav__link" href="index\.html">/,
    'the manual links back with a plain anchor');
  const nav = fs.readFileSync(path.join(ROOT, 'web', 'js', 'sheets', 'front', 'pagenav.js'), 'utf8');
  assert.match(nav, /href="' \+ page\.href/,
    'the watch builds its link as an href too, so navigation never depends on script behaviour');
  assert.match(nav, /\{ href: "manual\.html"/);
});

test('reduced motion, capture and print each suppress the turn', () => {
  assert.equal(pageturnDecision({ reducedMotion: true, capture: false, supported: true }).why,
    'reduced-motion');
  assert.equal(pageturnDecision({ reducedMotion: false, capture: true, supported: true }).why,
    'capture');
  assert.match(CSS, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?animation:none !important/);
  assert.match(CSS, /@media print[\s\S]*?animation:none !important/);
  assert.match(CSS, /\.no-pageturn::view-transition-old\(root\)/);
});

test('reduced motion outranks every other reason', () => {
  assert.equal(
    pageturnDecision({ reducedMotion: true, capture: true, supported: false }).why,
    'reduced-motion');
});

test('a suppressed decision stamps the root, which is what the css hangs off', () => {
  const js = fs.readFileSync(path.join(ROOT, 'web', 'js', 'fx', 'pageturn.js'), 'utf8');
  assert.match(js, /classList\.add\("no-pageturn"\)/);
});

test('both pages carry the transition, or only one side of the turn would animate', () => {
  assert.match(INDEX, /css\/fx\/pageturn\.css/);
  assert.match(MANUAL, /css\/fx\/pageturn\.css/);
  assert.match(INDEX, /js\/fx\/pageturn\.js/);
  assert.match(MANUAL, /js\/fx\/pageturn\.js/);
});

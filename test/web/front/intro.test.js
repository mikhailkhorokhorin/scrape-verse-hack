'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWebModule, modulePath, cssPath, plain } = require('../../web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'intro-plan.js']);
const {
  introDecision, introSeen, introMarkSeen, introStageAt, introStageDelay,
  introLastBeat, INTRO_FLAG, INTRO_STAGES, INTRO_STAGGER_MS, INTRO_STAGGER_MAX,
} = context;

const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');
const INTRO_JS = fs.readFileSync(modulePath('intro.js'), 'utf8');
const INTRO_CSS = fs.readFileSync(cssPath('intro.css'), 'utf8');

function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('the replay control is gone from the page entirely', () => {
  assert.doesNotMatch(INDEX, /intro-replay/,
    'the button the visitor never asked for must not exist');
  assert.doesNotMatch(INDEX, /REPLAY INTRO/);
});

test('nothing in the scripts or styles still reaches for the replay control', () => {
  assert.doesNotMatch(INTRO_JS, /intro-replay|introReplay|introSyncButton|mountIntroControl/);
  assert.doesNotMatch(INTRO_CSS, /intro-replay/);
  const app = fs.readFileSync(modulePath('app.js'), 'utf8');
  assert.doesNotMatch(app, /mountIntroControl/,
    'the removed handler must not be mounted');
});

test('a first ever visit plays the intro', () => {
  const decision = introDecision({ reducedMotion: false, capture: false, seen: false });
  assert.deepEqual(plain(decision), { play: true, why: 'first-visit' });
});

test('every later visit skips it, because the flag persists across loads', () => {
  const decision = introDecision({ reducedMotion: false, capture: false, seen: true });
  assert.equal(decision.play, false);
  assert.equal(decision.why, 'seen-before');
});

test('reduced motion suppresses the intro outright, first visit or not', () => {
  assert.equal(introDecision({ reducedMotion: true, capture: false, seen: false }).play, false);
  assert.equal(introDecision({ reducedMotion: true, capture: false, seen: false }).why,
    'reduced-motion');
});

test('a capture run never plays the intro, so a screenshot catches the settled page', () => {
  const decision = introDecision({ reducedMotion: false, capture: true, seen: false });
  assert.equal(decision.play, false);
  assert.equal(decision.why, 'capture');
});

test('reduced motion outranks every other reason', () => {
  assert.equal(introDecision({ reducedMotion: true, capture: true, seen: true }).why,
    'reduced-motion');
});

test('the flag round-trips through storage', () => {
  const store = memoryStore();
  assert.equal(introSeen(store), false);
  introMarkSeen(store);
  assert.equal(introSeen(store), true);
  assert.equal(store.getItem(INTRO_FLAG), '1');
});

test('the flag lives in localStorage, so the intro is once ever and not once per tab', () => {
  assert.match(INTRO_JS, /localStorage/);
  assert.doesNotMatch(INTRO_JS, /sessionStorage/,
    'a session flag replayed the intro in every new tab');
});

test('storage that throws is treated as already seen, so the page never breaks', () => {
  const blocked = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
  };
  assert.equal(introSeen(blocked), true);
  assert.doesNotThrow(() => introMarkSeen(blocked));
});

test('every reach for storage in the intro is wrapped in a catch', () => {
  const reads = INTRO_JS.split('localStorage').length - 1;
  assert.ok(reads > 0);
  assert.match(INTRO_JS, /try\s*\{[\s\S]*localStorage[\s\S]*\}\s*catch/,
    'a private window throws on the property access itself');
});

test('the stages run masthead first, then the panels, then the feed', () => {
  const names = INTRO_STAGES.map((s) => s.name);
  assert.deepEqual(plain(names), ['masthead', 'readouts', 'open', 'panels', 'feed']);
  const times = INTRO_STAGES.map((s) => s.at);
  for (let i = 1; i < times.length; i += 1) {
    assert.ok(times[i] > times[i - 1], 'each stage begins after the one before it');
  }
});

test('the masthead settles first, at no delay at all', () => {
  assert.equal(introStageAt('masthead').at, 0);
});

test('items inside a stage stagger, but the stagger is capped so nothing lags', () => {
  const stage = introStageAt('panels');
  assert.equal(introStageDelay(stage, 0), stage.at);
  assert.equal(introStageDelay(stage, 1), stage.at + INTRO_STAGGER_MS);
  assert.equal(introStageDelay(stage, 50), introStageDelay(stage, INTRO_STAGGER_MAX),
    'a long feed must not push the last item minutes into the future');
});

test('an unknown stage name yields nothing rather than throwing', () => {
  assert.equal(introStageAt('nonsense'), null);
});

test('the whole intro is over in a couple of seconds', () => {
  assert.ok(introLastBeat() < 2000, 'the visitor is not made to wait');
});

test('the intro animates over content, never gating its visibility', () => {
  assert.doesNotMatch(INTRO_CSS, /visibility\s*:\s*hidden/,
    'a headless renderer or background tab would ship a blank page');
  assert.doesNotMatch(INTRO_CSS, /display\s*:\s*none(?![^{]*is-capture)/);
  assert.doesNotMatch(INTRO_JS, /visibility|display\s*=/,
    'the intro must not hide anything from script either');
});

test('no stylesheet hides page furniture while the intro runs', () => {
  ['open.css', 'pagenav.css'].forEach((name) => {
    const css = fs.readFileSync(cssPath(name), 'utf8');
    assert.doesNotMatch(css, /\.intro-running[^{]*\{[^}]*(visibility\s*:\s*hidden|display\s*:\s*none)/,
      name + ' made the interface vanish when the intro started');
  });
});

test('the reveal is built from transform, opacity and filter only', () => {
  const frames = INTRO_CSS.slice(INTRO_CSS.indexOf('@keyframes intro-settle'));
  const body = frames.slice(0, frames.indexOf('}\n}') + 3);
  assert.match(body, /opacity/);
  assert.match(body, /transform/);
  assert.doesNotMatch(body, /width|height|margin|top:|left:/,
    'animating layout would jank and reflow the page');
});

test('the curve eases out and never overshoots into a bounce', () => {
  assert.match(INTRO_CSS, /cubic-bezier\(\.22,1,\.36,1\)/);
  assert.doesNotMatch(INTRO_CSS, /cubic-bezier\([^)]*,\s*-/,
    'a negative control point is a bounce');
});

test('reduced motion kills the animation in the stylesheet as well', () => {
  const at = INTRO_CSS.indexOf('prefers-reduced-motion');
  assert.ok(at > -1, 'the stylesheet honours the preference');
  assert.match(INTRO_CSS.slice(at, at + 260), /animation:none/);
});

test('print and capture both land on the settled page, with no animation', () => {
  const print = INTRO_CSS.indexOf('@media print');
  assert.ok(print > -1);
  assert.match(INTRO_CSS.slice(print, print + 220), /animation:none/);
  const capture = INTRO_CSS.indexOf('.is-capture');
  assert.ok(capture > -1, 'the capture convention is honoured');
  assert.match(INTRO_CSS.slice(capture, capture + 220), /animation:none/);
});

test('the running class is set only when the intro actually plays', () => {
  const play = INTRO_JS.slice(INTRO_JS.indexOf('function introPlay'));
  assert.match(play.slice(0, 400), /classList\.add\("intro-running"\)/);
  const maybe = INTRO_JS.slice(INTRO_JS.indexOf('function introMaybePlay'));
  assert.doesNotMatch(maybe, /classList\.add\("intro-running"\)/,
    'setting it on the skip path would leave the bubbles dead on the common visit');
});

test('the decision is taken once, so a repeated poll cannot restart the intro', () => {
  assert.match(INTRO_JS, /INTRO\.decided/);
});

test('finishing removes the running class and every stage mark it added', () => {
  const finish = INTRO_JS.slice(INTRO_JS.indexOf('function introFinish'));
  assert.match(finish.slice(0, 300), /classList\.remove\("intro-running"\)/);
  assert.match(INTRO_JS, /classList\.remove\("intro-stage"\)/,
    'a stage mark left behind would freeze that element mid-animation');
});

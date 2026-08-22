'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath, modulePath } = require('../../web-loader.js');

const CORE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const TEAR = fs.readFileSync(modulePath('sheet-tear.js'), 'utf8');
const CRUMPLE = fs.readFileSync(modulePath('sheet-crumple.js'), 'utf8');
const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8')
  + '\n' + fs.readFileSync(cssPath('sheet-toss.css'), 'utf8');
const PANELCUT = fs.readFileSync(modulePath('panelcut.js'), 'utf8');
const SHEET = fs.readFileSync(modulePath('sheet.js'), 'utf8');

test('each spider claims its own close, and no two spiders share one', () => {
  assert.match(TEAR, /sheetCloseRegister\("ATLAS", sheetTearClose\)/,
    'the map tears in half');
  assert.match(CRUMPLE, /sheetCloseRegister\("BODEGA", sheetCrumpleClose\)/,
    'the receipt gets binned');
  const codes = [TEAR, CRUMPLE]
    .map((src) => (src.match(/sheetCloseRegister\("([A-Z]+)"/) || [])[1]);
  assert.equal(new Set(codes).size, codes.length, 'a shared code silently overwrites a close');
});

test('an unknown spider falls back to the old lift rather than failing to close', () => {
  const run = CORE.slice(CORE.indexOf('function sheetCloseRun'));
  assert.match(run.slice(0, run.indexOf('\n}')), /if \(!run\) return false;/,
    'returning false is what lets panelcutClose fall through');
  const close = PANELCUT.slice(PANELCUT.indexOf('function panelcutClose'));
  const body = close.slice(0, close.indexOf('\n}'));
  assert.ok(body.indexOf('sheetCloseRun') < body.indexOf('is-closing'),
    'the registry is consulted first, the generic lift is the default');
});

test('the registration point is additive, so a third close needs no edit here', () => {
  assert.match(CORE, /function sheetCloseRegister\(code, run\)/);
  assert.match(CORE, /SHEET_CLOSERS\[code\.toUpperCase\(\)\] = run/,
    'registering is one call, not a change to a hard-coded list');
});

test('the sheet arms the close with the spider it is showing', () => {
  const open = SHEET.slice(SHEET.indexOf('function openSheet'));
  const body = open.slice(0, open.indexOf('\n}'));
  assert.match(body, /sheetCloseArm\(sp\.code\)/);
});

test('the tear edge is ragged, never the straight line down the middle', () => {
  const seam = TEAR.slice(TEAR.indexOf('function tearSeam'));
  const body = seam.slice(0, seam.indexOf('\n}'));
  assert.match(body, /sheetCloseRand\(/, 'every step is jittered');
  assert.match(body, /Math\.random\(\) < 0\.34/, 'and some steps spike, the way paper gives');
  assert.doesNotMatch(body, /x = 50;\s*\n\s*for[\s\S]*points\.push\(\{ x: 50/,
    'a constant x would be a guillotine cut, not a tear');
});

test('the tear wanders but never leaves the middle of the sheet', () => {
  const seam = TEAR.slice(TEAR.indexOf('function tearSeam'));
  const body = seam.slice(0, seam.indexOf('\n}'));
  assert.match(body, /Math\.max\(34, Math\.min\(66/,
    'a seam that reaches the edge would tear off a sliver, not a half');
});

test('both halves are cut from one seam, so they read as one sheet that split', () => {
  const fn = TEAR.slice(TEAR.indexOf('function sheetTearClose'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /const seam = tearSeam\(TEAR_STEPS\)/, 'one seam');
  assert.match(body, /tearLeftClip\(seam\)/);
  assert.match(body, /tearRightClip\(seam\)/, 'and both clips are built from it');
  assert.match(TEAR, /seam\.slice\(\)\.reverse\(\)/,
    'the right half walks the same edge backwards, so the two interlock');
});

test('the two clips are complementary halves of the whole sheet', () => {
  assert.match(TEAR, /return "polygon\(0% 0%," \+ edge \+ ",0% 100%\)"/,
    'the left half keeps the left border');
  assert.match(TEAR, /return "polygon\(100% 0%,100% 100%," \+ edge \+ "\)"/,
    'the right half keeps the right border');
});

test('the seam is redrawn per close, so the tear is never the same twice', () => {
  const seam = TEAR.slice(TEAR.indexOf('function sheetTearClose'));
  assert.match(seam.slice(0, seam.indexOf('\n}')), /tearSeam\(/,
    'generated at close time, not once at load');
  assert.match(CORE, /function sheetCloseRand[\s\S]*?Math\.random\(\)/);
});

test('the halves drift apart, spin and dissipate rather than just vanishing', () => {
  ['tear-drift-left', 'tear-drift-right'].forEach((name) => {
    const frames = CSS.slice(CSS.indexOf('@keyframes ' + name));
    const body = frames.slice(0, frames.indexOf('}\n\n'));
    assert.match(body, /opacity:0/, name + ' must fade out');
    assert.match(body, /var\(--tear-spin\)/, name + ' must rotate as it goes');
    assert.match(body, /translate3d/, name + ' must travel');
  });
  assert.match(TEAR, /--tear-spin/, 'and the spin is randomised per half');
});

test('the crumple crushes before it flies, so it reads as paper not as a shrink', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes toss-crush'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.match(body, /skew\(/, 'skew is what sells the crush');
  const scales = body.match(/scale\(([^)]*)\)/g) || [];
  assert.ok(scales.length >= 4, 'a single scale step is a shrink, not a crumple');
  assert.match(CSS, /\.toss__crease\{/, 'and creases are drawn over the crushed paper');
});

test('the ball flies out at size and shrinks away into the basket', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes toss-fly'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  const named = { end: Number(CRUMPLE.match(/CRUMPLE_END = ([\d.]+)/)[1]),
    mid: Number(CRUMPLE.match(/CRUMPLE_MID = ([\d.]+)/)[1]) };
  const steps = [...body.matchAll(/var\(--sc-fit\) \* (?:(\.\d+)|var\(--toss-(end|mid)\))\)/g)]
    .map((m) => (m[1] ? Number(m[1]) : named[m[2]]));
  assert.ok(steps.length >= 2, 'the ball must change size on the way');
  assert.ok(steps[0] > steps[steps.length - 1],
    'it must still be big when it leaves and small when it lands');
  assert.ok(steps[steps.length - 1] < 0.15, 'it has to end small enough to be inside the can');
  assert.match(body, /var\(--toss-arc\)/, 'and it arcs rather than sliding flat');
});

test('the basket is drawn in the house line-art register, on the right', () => {
  assert.match(CRUMPLE, /function basketSVG/);
  assert.match(CRUMPLE, /<svg class="toss__basket"/);
  assert.match(CSS, /\.toss__can,\s*\n\.toss__rim\{stroke:var\(--paper\);stroke-width:5;\}/,
    'thick paper strokes, not a filled shape');
  assert.match(CSS, /\.toss__rib\{stroke:var\(--dim\)/, 'ribs in the dim ink');
  const rule = CSS.slice(CSS.indexOf('.toss__basket{'), CSS.indexOf('.toss__can'));
  assert.match(rule, /right:clamp/, 'it stands on the right of the frame');
});

test('the basket arrives with the toss and reacts when the ball lands', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes toss-basket-in'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.match(body, /0%\{opacity:0/, 'it is not on the page until the toss');
  assert.match(body, /90%\{[^}]*scale\(1\.06,\.94\)/, 'it takes the hit just after touchdown');
  assert.match(body, /100%\{opacity:1/, 'it must still be there when the ball drops in');
  assert.doesNotMatch(body, /100%\{opacity:0/,
    'fading at 100% would empty the scene before the landing reads');
});

test('the ball is clipped to a randomised wad, never a tidy rectangle or circle', () => {
  const rule = CSS.slice(CSS.indexOf('.toss__ball{'), CSS.indexOf('@keyframes toss-crush'));
  assert.match(rule, /clip-path:polygon\(/, 'a crumple needs a silhouette');
  assert.doesNotMatch(rule, /border-radius:50%/, 'a perfect circle reads as a toy ball, not paper');
  const points = rule.match(/var\(--tc\d+/g) || [];
  assert.ok(points.length >= 8, 'the silhouette needs enough points to look crushed');
  assert.match(CRUMPLE, /--tc/, 'and the points are jittered from js per close');
});

test('the ball sinks behind the basket front wall instead of fading mid-air', () => {
  assert.match(CRUMPLE, /class="toss__front"/, 'the front wall is its own element');
  const front = CSS.slice(CSS.indexOf('.toss__front{'), CSS.indexOf('.toss__can'));
  const ballRule = CSS.slice(CSS.indexOf('.toss__ball{'), CSS.indexOf('@keyframes toss-crush'));
  const frontZ = Number((front.match(/z-index:(\d+)/) || [])[1]);
  const ballZ = Number((ballRule.match(/z-index:(\d+)/) || [])[1]);
  assert.ok(frontZ > ballZ, 'the wall must paint over the ball');
  assert.match(CSS, /var\(--toss-dip\)/, 'and the ball dips below the rim at the very end');
  assert.match(CRUMPLE, /--toss-dip/, 'with the dip measured from the real basket box');
});

test('the creases flash in with the crush instead of easing in linearly', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes toss-crease'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.match(body, /14%\{opacity:0/, 'unlit until the paper actually buckles');
  assert.match(body, /22%\{opacity:1/, 'then a hard flash, the way a fold catches light');
  assert.doesNotMatch(body, /100%\{opacity:1;\}/, 'and it settles with the wad, not at full glare');
});

test('both closes take the props away again, so nothing is left on the page', () => {
  [['tear', TEAR], ['toss', CRUMPLE]].forEach(([name, src]) => {
    const at = src.indexOf('cleanup:');
    assert.ok(at > -1, name + ' must hand back a cleanup');
    const body = src.slice(at, src.indexOf('},', at));
    assert.match(body, /removeChild\(stage\)/, name + ' must remove its stage');
    assert.match(body, /classList\.remove/, name + ' must drop its modal class');
  });
});

test('a close that is interrupted by a reopen tidies up first', () => {
  assert.match(CORE, /function sheetCloseReset/);
  const open = PANELCUT.slice(PANELCUT.indexOf('function panelcutOpen'));
  assert.match(open.slice(0, open.indexOf('\n}')), /sheetCloseReset\(\)/,
    'reopening mid-close must not leave a torn copy behind');
  const reset = CORE.slice(CORE.indexOf('function sheetCloseReset'));
  const body = reset.slice(0, reset.indexOf('\n}\n'));
  assert.match(body, /clearTimeout/, 'the pending hide must be cancelled too');
});

test('the clones are inert to assistive tech and cannot take a tab stop', () => {
  [['tear', TEAR], ['toss', CRUMPLE]].forEach(([name, src]) => {
    assert.match(src + CORE, /setAttribute\("aria-hidden", "true"\)/, name + ' is decoration');
    assert.match(src + CORE, /tabindex", "-1"/, name + ' must not hold a focus ring');
    assert.match(src + CORE, /removeAttribute\("id"\)/, name + ' must not duplicate an id');
  });
});

test('the real sheet is hidden while its stunt double plays', () => {
  assert.match(CSS, /\.modal\.is-tearing > \.sheet,\s*\n\.modal\.is-tossing > \.sheet\{visibility:hidden;\}/,
    'a descendant selector would blank the clones too, leaving empty shapes to animate');
});

test('nothing in either close loops, so a close cannot cost steady frames', () => {
  assert.doesNotMatch(CSS, /infinite/);
});

test('everything that moves is promoted, and only transform and opacity move', () => {
  const rules = [...CSS.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)];
  ['.tear__half', '.toss__ball', '.toss__skin', '.toss__basket'].forEach((sel) => {
    const owned = rules
      .filter((m) => m[1].split(',').some((one) => one.trim() === sel))
      .map((m) => m[2]);
    assert.ok(owned.some((b) => /will-change:/.test(b)), sel + ' needs its own layer');
  });
  ['tear-drift-left', 'tear-drift-right', 'toss-fly', 'toss-crush'].forEach((name) => {
    const frames = CSS.slice(CSS.indexOf('@keyframes ' + name));
    const body = frames.slice(0, frames.indexOf('\n}'));
    assert.doesNotMatch(body, /(?:^|[^-])(?:width|height|margin|top|left):/,
      name + ' would reflow the page every frame');
  });
});

test('no close outlives the users patience', () => {
  const tearMs = Number(TEAR.match(/TEAR_MS = (\d+)/)[1]);
  const tossMs = Number(CRUMPLE.match(/CRUMPLE_MS = (\d+)/)[1]);
  assert.ok(tearMs <= 700, 'a slow close is a bad close');
  assert.ok(tossMs <= 1600, 'the crush needs room to read as paper, but not a beat longer');
});

test('the stages are fixed and clipped, so a flying ball cannot widen the page', () => {
  const rule = CSS.slice(CSS.indexOf('.tear,'), CSS.indexOf('.tear__half,'));
  assert.match(rule, /position:fixed/, 'fixed keeps it out of the flow');
  assert.match(rule, /overflow:hidden/, 'and clipping keeps the toss inside the viewport');
  assert.match(CSS, /\.modal\.is-tearing,\s*\n\.modal\.is-tossing\{pointer-events:none;overflow:hidden;\}/);
});

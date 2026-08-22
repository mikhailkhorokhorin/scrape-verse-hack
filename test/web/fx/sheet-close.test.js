'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath, modulePath } = require('../../web-loader.js');

const CORE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const TEAR = fs.readFileSync(modulePath('sheet-tear.js'), 'utf8');
const PORTAL = fs.readFileSync(modulePath('sheet-portal.js'), 'utf8');
const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8')
  + '\n' + fs.readFileSync(cssPath('sheet-portal.css'), 'utf8');
const PANELCUT = fs.readFileSync(modulePath('panelcut.js'), 'utf8');
const SHEET = fs.readFileSync(modulePath('sheet.js'), 'utf8');

test('each spider claims its own close, and no two spiders share one', () => {
  assert.match(TEAR, /sheetCloseRegister\("ATLAS", sheetTearClose\)/,
    'the map tears in half');
  assert.match(PORTAL, /sheetCloseRegister\("BODEGA", sheetPortalClose\)/,
    'the receipt is swallowed by a portal');
  const codes = [TEAR, PORTAL]
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

test('the sheet is pulled into the portal, not merely faded out', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes portal-suck'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.match(body, /perspective\(/, 'the pull needs depth, or it reads as a flat shrink');
  assert.match(body, /translate3d\(0,0,-\d+px\)/, 'it must travel away from the viewer');
  assert.match(body, /var\(--portal-spin/, 'and turn as it goes');
  assert.match(body, /opacity:0/, 'and be gone by the end');
});

test('the sheet shrinks all the way to nothing rather than stopping short', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes portal-suck'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  const steps = [...body.matchAll(/var\(--sc-fit\) \* ([\d.]+)\)/g)].map((m) => Number(m[1]));
  assert.ok(steps.length >= 3, 'a single scale step is a cut, not a pull');
  assert.ok(steps[0] > steps[steps.length - 1], 'it must start big and end small');
  assert.ok(steps[steps.length - 1] <= 0.02, 'it has to vanish into the mouth, not hover near it');
});

test('the ring is drawn in the house palette, never in invented colours', () => {
  assert.match(PORTAL, /function portalRingSVG/);
  assert.match(PORTAL, /<svg class="portal__ring"/);
  ['.portal__glow', '.portal__edge', '.portal__core'].forEach((sel) => {
    const at = CSS.indexOf(sel + '{');
    assert.ok(at > -1, sel + ' needs a rule');
    assert.match(CSS.slice(at, CSS.indexOf('}', at)), /stroke:var\(--(purple|cyan|pink)\)/,
      sel + ' must take its colour from a token');
  });
  const hexes = CSS.slice(CSS.indexOf('.portal__glow')).match(/#[0-9a-fA-F]{3,8}/g) || [];
  assert.equal(hexes.length, 0, 'a raw hex here would drift from the rest of the site');
});

test('the ring opens before the pull and collapses only after it', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes portal-open'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.match(body, /0%\{opacity:0/, 'there is no ring on the page until the close');
  assert.match(body, /100%\{opacity:0/, 'and none left when it is over');
  const open = Number((body.match(/\n\s*(\d+)%\{opacity:1/) || [])[1]);
  assert.ok(open > 0 && open <= 20, 'the mouth must be open early, before the sheet arrives');
  const shut = [...body.matchAll(/\n\s*(\d+)%\{[^}]*scale\(([\d.]+),([\d.]+)\)/g)]
    .filter((m) => Number(m[3]) < Number(m[2]) / 2)
    .map((m) => Number(m[1]))
    .filter((at) => at > 0);
  assert.ok(shut.length > 0 && Math.min(...shut) >= 80,
    'the collapse must wait until the sheet is already inside');
});

test('the collapse squeezes the ring to a line, it does not just fade', () => {
  const frames = CSS.slice(CSS.indexOf('@keyframes portal-open'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  const last = [...body.matchAll(/scale\((\.\d+),(\.\d+)\)/g)].pop();
  assert.ok(last, 'the ring needs a final squeeze');
  assert.ok(Number(last[2]) < Number(last[1]) / 2,
    'height must close much faster than width, or it reads as a shrink not a slit');
});

test('both closes take the props away again, so nothing is left on the page', () => {
  [['tear', TEAR], ['portal', PORTAL]].forEach(([name, src]) => {
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
  [['tear', TEAR], ['portal', PORTAL]].forEach(([name, src]) => {
    assert.match(src + CORE, /setAttribute\("aria-hidden", "true"\)/, name + ' is decoration');
    assert.match(src + CORE, /tabindex", "-1"/, name + ' must not hold a focus ring');
    assert.match(src + CORE, /removeAttribute\("id"\)/, name + ' must not duplicate an id');
  });
});

test('the real sheet is hidden while its stunt double plays', () => {
  assert.match(CSS, /\.modal\.is-tearing > \.sheet,\s*\n\.modal\.is-porting > \.sheet\{visibility:hidden;\}/,
    'a descendant selector would blank the clones too, leaving empty shapes to animate');
});

test('nothing in either close loops, so a close cannot cost steady frames', () => {
  assert.doesNotMatch(CSS, /infinite/);
});

test('everything that moves is promoted, and only transform and opacity move', () => {
  const rules = [...CSS.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)];
  ['.tear__half', '.portal__skin', '.portal__mouth'].forEach((sel) => {
    const owned = rules
      .filter((m) => m[1].split(',').some((one) => one.trim() === sel))
      .map((m) => m[2]);
    assert.ok(owned.some((b) => /will-change:/.test(b)), sel + ' needs its own layer');
  });
  ['tear-drift-left', 'tear-drift-right', 'portal-suck', 'portal-open'].forEach((name) => {
    const frames = CSS.slice(CSS.indexOf('@keyframes ' + name));
    const body = frames.slice(0, frames.indexOf('\n}'));
    assert.doesNotMatch(body, /(?:^|[^-])(?:width|height|margin|top|left):/,
      name + ' would reflow the page every frame');
  });
});

test('no close outlives the users patience', () => {
  const tearMs = Number(TEAR.match(/TEAR_MS = (\d+)/)[1]);
  const portalMs = Number(PORTAL.match(/PORTAL_MS = (\d+)/)[1]);
  assert.ok(tearMs <= 700, 'a slow close is a bad close');
  assert.ok(portalMs <= 1300, 'the pull needs room to read, but not a beat longer');
});

test('the stages are fixed and clipped, so the pull cannot widen the page', () => {
  const rule = CSS.slice(CSS.indexOf('.tear,'), CSS.indexOf('.tear__half,'));
  assert.match(rule, /position:fixed/, 'fixed keeps it out of the flow');
  assert.match(rule, /overflow:hidden/, 'and clipping keeps the pull inside the viewport');
  assert.match(CSS, /\.modal\.is-tearing,\s*\n\.modal\.is-porting\{pointer-events:none;overflow:hidden;\}/);
});

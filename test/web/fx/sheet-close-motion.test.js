'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath, modulePath } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8')
  + '\n' + fs.readFileSync(cssPath('sheet-toss.css'), 'utf8');
const CORE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const TEAR = fs.readFileSync(modulePath('sheet-tear.js'), 'utf8');
const CRUMPLE = fs.readFileSync(modulePath('sheet-crumple.js'), 'utf8');

function keyframes(name) {
  const at = CSS.indexOf('@keyframes ' + name + '{');
  assert.ok(at > -1, 'missing @keyframes ' + name);
  const body = CSS.slice(at);
  return body.slice(0, body.indexOf('\n}\n'));
}

function translatePercents(block) {
  return [...block.matchAll(/translate3d\(\s*(-?[\d.]+)%/g)].map((m) => Math.abs(Number(m[1])));
}

test('the open animation is silenced with a class, never with inline styles', () => {
  assert.match(CORE, /function sheetCloseSilence/);
  assert.match(CORE, /classList\.add\("sheet--silenced"\)/,
    'a class can be taken back; an inline style would outlive the close');
  assert.doesNotMatch(CORE, /style\.animation = /,
    'an inline animation:none would freeze the next open of the shared modal');
  assert.doesNotMatch(CORE, /style\.opacity = /);
  [TEAR, CRUMPLE].forEach((src) => {
    assert.match(src, /sheetCloseSilence\(sheet\)/,
      'every close must silence the original sheet');
  });
});

test('a clone never inherits the silence, or it would sit still', () => {
  const fn = CORE.slice(CORE.indexOf('function sheetCloseFlatten'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /classList\.remove\("sheet--silenced"\)/,
    'a silenced clone would play the whole close invisible');
  assert.match(body, /removeProperty\("animation"\)/,
    'an inline animation on the clone outranks the class rule and freezes it');
  assert.match(body, /removeProperty\("opacity"\)/);
  const tear = TEAR.slice(TEAR.indexOf('function sheetTearClose'));
  assert.ok(tear.indexOf('tearHalf(sheet') < tear.indexOf('sheetCloseSilence(sheet)'),
    'clones must be taken before the original is silenced');
});

test('each tear half travels most of the screen, not a few pixels', () => {
  ['tear-drift-left', 'tear-drift-right'].forEach((name) => {
    const far = Math.max(...translatePercents(keyframes(name)));
    assert.ok(far >= 90, name + ' only moves ' + far + '%, which reads as a nudge');
  });
});

test('the halves are already moving early, so the rip is not back-loaded', () => {
  ['tear-drift-left', 'tear-drift-right'].forEach((name) => {
    const block = keyframes(name);
    const mid = block.match(/\n\s*55%\{[^}]*translate3d\(\s*(-?[\d.]+)%/);
    assert.ok(mid, name + ' needs a mid keyframe');
    assert.ok(Math.abs(Number(mid[1])) >= 40,
      name + ' is only ' + mid[1] + '% along at the halfway point');
  });
});

test('the tear halves visibly rotate apart as well as slide', () => {
  assert.match(TEAR, /--tear-spin/);
  const spins = [...TEAR.matchAll(/sheetCloseRand\((-?\d+), (-?\d+)\)\.toFixed\(2\) \+ "deg"/g)];
  assert.equal(spins.length, 2, 'both halves need their own spin');
  spins.forEach(([, lo, hi]) => {
    assert.ok(Math.min(Math.abs(Number(lo)), Math.abs(Number(hi))) >= 10,
      'a spin under 10deg is invisible against a 660ms slide');
  });
});

test('the crumpled ball shrinks to a ball and flies to the basket', () => {
  const fly = keyframes('toss-fly');
  const named = {
    end: Number(CRUMPLE.match(/CRUMPLE_END = ([\d.]+)/)[1]),
    mid: Number(CRUMPLE.match(/CRUMPLE_MID = ([\d.]+)/)[1]),
  };
  const scales = [...fly.matchAll(/var\(--sc-fit\) \* (?:\.(\d+)|var\(--toss-(end|mid)\))\)/g)]
    .map((m) => (m[1] ? Number('.' + m[1]) : named[m[2]]));
  assert.ok(Math.min(...scales) <= 0.1, 'it must end up a small ball');
  assert.ok(scales.some((s) => s <= 0.35), 'it must crush early, before it flies');
  assert.match(fly, /translate3d\(var\(--toss-x\),var\(--toss-y\),0\)/,
    'the last frame must land on the measured basket position');
  assert.match(fly, /var\(--toss-arc\)/, 'and arc on the way, not slide flat');
});

test('the paper is actually crushed, not just scaled down uniformly', () => {
  const crush = keyframes('toss-crush');
  const pairs = [...crush.matchAll(/scale\(([\d.]+),([\d.]+)\)/g)];
  assert.ok(pairs.length >= 4, 'a crumple needs several crush beats');
  assert.ok(pairs.some(([, x, y]) => Math.abs(Number(x) - Number(y)) >= 0.08),
    'x and y must differ, or it is a shrink and not a crumple');
  assert.match(crush, /skew\(-?[\d.]+deg,-?[\d.]+deg\)/, 'and skew, so the sheet buckles');
});

test('an oversized sheet is scaled down so the whole close fits the viewport', () => {
  assert.match(CORE, /function sheetCloseFit/);
  assert.match(CORE, /--sc-fit/, 'the fit must reach the CSS');
  assert.match(CSS, /scale\(var\(--sc-fit\)\)/, 'and the keyframes must honour it');
  assert.match(CORE, /SHEET_CLOSE_MAX_H/,
    'a sheet taller than the viewport must be cropped, not cloned whole');
});

test('the stage is centred on the viewport, not left at the sheet scroll offset', () => {
  const fn = CORE.slice(CORE.indexOf('function sheetCloseFrame'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /\(view\.w - w\) \/ 2/, 'centre it horizontally');
  assert.match(body, /\(view\.h - h\) \/ 2/, 'and vertically, so it is on screen');
});

test('both closes stay inside the fast budget', () => {
  assert.match(TEAR, /const TEAR_MS = (\d+)/);
  assert.match(CRUMPLE, /const CRUMPLE_MS = (\d+)/);
  const tearMs = Number(TEAR.match(/const TEAR_MS = (\d+)/)[1]);
  const tossMs = Number(CRUMPLE.match(/const CRUMPLE_MS = (\d+)/)[1]);
  assert.ok(tearMs >= 400 && tearMs <= 760, tearMs + 'ms is outside the 500-700ms feel');
  assert.ok(tossMs >= 400 && tossMs <= 1600, tossMs + 'ms leaves no room to read the crush');
});

test('every animated part is promoted and animates transform or opacity only', () => {
  const rules = [...CSS.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)];
  ['.tear__half', '.toss__ball', '.toss__skin', '.toss__basket'].forEach((sel) => {
    const blocks = rules
      .filter((m) => m[1].split(',').some((one) => one.trim() === sel))
      .map((m) => m[2]);
    assert.ok(blocks.length > 0, 'missing rule for ' + sel);
    assert.ok(blocks.some((b) => /will-change:(transform|opacity|transform,opacity)/.test(b)),
      sel + ' must be promoted');
  });
  ['tear-drift-left', 'tear-drift-right', 'toss-fly', 'toss-crush'].forEach((name) => {
    const block = keyframes(name);
    assert.doesNotMatch(block, /\n\s*(top|left|width|height|margin):/,
      name + ' must not animate layout properties');
  });
});

test('the toss offset is divided by the scale it will be multiplied by', () => {
  const fn = CRUMPLE.slice(CRUMPLE.indexOf('function tossPath'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /const end = fit \* CRUMPLE_END/,
    'scale() precedes translate3d(), so the browser scales the offset too');
  assert.match(body, /dx \/ end/, 'undo that scaling or the ball stops short of the basket');
  assert.match(body, /dy \/ end/);
  assert.match(body, /--toss-mx/, 'the mid keyframe has its own scale and needs its own offset');
  const fly = keyframes('toss-fly');
  assert.match(fly, /var\(--sc-fit\) \* var\(--toss-end\)/,
    'the final scale in toss-fly must come from the shared constant');
  assert.match(fly, /var\(--sc-fit\) \* var\(--toss-mid\)/,
    'the mid scale in toss-fly must come from the shared constant');
  assert.match(CRUMPLE, /"--toss-end", String\(CRUMPLE_END\)/,
    'the css reads the same CRUMPLE_END the js divides by');
  assert.match(CRUMPLE, /"--toss-mid", String\(CRUMPLE_MID\)/);
});

test('every class the crumple builds has a rule, so no layer is born invisible', () => {
  const built = [...CRUMPLE.matchAll(/className = "([^"]+)"/g)]
    .flatMap((m) => m[1].split(' '))
    .filter((c) => c.startsWith('toss__'))
    .map((c) => c.replace(/--\d*$/, ''));
  assert.ok(built.length > 0, 'the crumple must build something');
  [...new Set(built)].forEach((cls) => {
    const at = CSS.indexOf('.' + cls + '{');
    assert.ok(at > -1,
      '.' + cls + ' is created in js but owns no css rule, so it hangs in the dom invisible');
    const block = CSS.slice(at, CSS.indexOf('}', at));
    assert.match(block, /position|animation|background/,
      '.' + cls + ' has a rule but nothing that makes it show or move');
  });
});

test('the corners fold in one at a time rather than all at once', () => {
  const delays = [0, 1, 2, 3].map((i) => {
    const at = CSS.indexOf('.toss__fold--' + i + '{');
    assert.ok(at > -1, 'missing rule for fold ' + i);
    const block = CSS.slice(at, CSS.indexOf('}', at));
    const ms = block.match(/animation-delay:calc\((\d+)ms/);
    assert.ok(ms, 'fold ' + i + ' needs its own delay, or the corners move together');
    return Number(ms[1]);
  });
  delays.slice(1).forEach((d, i) => {
    assert.ok(d > delays[i], 'fold ' + (i + 1) + ' must start after fold ' + i);
  });
  assert.ok(delays[3] < 640, 'the last corner must still land inside the 46% crush window');
});

test('each fold is a quarter of the sheet hinged toward the middle', () => {
  const base = CSS.slice(CSS.indexOf('.toss__fold{'), CSS.indexOf('}', CSS.indexOf('.toss__fold{')));
  assert.match(base, /width:50%;height:50%/, 'a fold is one corner quarter, not the whole sheet');
  assert.match(base, /position:absolute/);
  const origins = [0, 1, 2, 3].map((i) => {
    const at = CSS.indexOf('.toss__fold--' + i + '{');
    return (CSS.slice(at, CSS.indexOf('}', at)).match(/transform-origin:([^;]+)/) || [])[1];
  });
  assert.equal(new Set(origins).size, 4, 'each corner hinges on its own inward edge');
  const fold = keyframes('toss-fold-in');
  assert.match(fold, /rotate3d\(/, 'the corner turns over in 3d, it does not just fade');
  assert.match(fold, /var\(--fr/, 'and the angle is jittered per close from js');
  assert.match(CRUMPLE, /"--fr"/);
});

test('the folds and the facet shading move only transform and opacity', () => {
  ['toss-fold-in', 'toss-facet', 'toss-back'].forEach((name) => {
    const block = keyframes(name);
    assert.doesNotMatch(block, /\n\s*(top|left|width|height|margin|background):/,
      name + ' must not animate a paint or layout property');
  });
  const base = CSS.slice(CSS.indexOf('.toss__fold{'), CSS.indexOf('}', CSS.indexOf('.toss__fold{')));
  assert.match(base, /will-change:transform,opacity/, 'the folds need their own layer');
});

test('the wad silhouette has sharp dents, not an even rounded blob', () => {
  const fn = CRUMPLE.slice(CRUMPLE.indexOf('function tossClip'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.match(body, /dents\.has\(i\)/, 'some points must pull in much closer than the rest');
  const radii = [...body.matchAll(/sheetCloseRand\((\d+), (\d+)\)/g)]
    .map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(radii.length, 2, 'a dent radius and a hull radius');
  const [dent, hull] = radii[0][0] < radii[1][0] ? [radii[0], radii[1]] : [radii[1], radii[0]];
  assert.ok(hull[0] - dent[1] >= 10,
    'the dent must bite well inside the hull, or the outline still reads round');
});

test('the basket is on screen, anchored to the viewport corner', () => {
  const at = CSS.indexOf('.toss__basket{');
  const block = CSS.slice(at, CSS.indexOf('}', at));
  assert.match(block, /position:absolute/);
  assert.match(block, /right:clamp\(/, 'pinned to the right edge');
  assert.match(block, /bottom:clamp\(/, 'and the bottom, so it never falls below the fold');
});

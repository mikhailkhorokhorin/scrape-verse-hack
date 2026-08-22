'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath, modulePath } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8')
  + '\n' + fs.readFileSync(cssPath('sheet-portal.css'), 'utf8');
const CORE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const TEAR = fs.readFileSync(modulePath('sheet-tear.js'), 'utf8');
const PORTAL = fs.readFileSync(modulePath('sheet-portal.js'), 'utf8');

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
  [TEAR, PORTAL].forEach((src) => {
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
  const portal = PORTAL.slice(PORTAL.indexOf('function sheetPortalClose'));
  assert.ok(portal.indexOf('sheetCloseSkin(sheet') < portal.indexOf('sheetCloseSilence(sheet)'),
    'the portal must take its clone before the original goes quiet too');
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

test('the sheet is drawn inward and away, not just faded where it stands', () => {
  const suck = keyframes('portal-suck');
  const scales = [...suck.matchAll(/var\(--sc-fit\) \* ([\d.]+)\)/g)].map((m) => Number(m[1]));
  assert.ok(scales.length >= 3, 'the pull needs several beats to read');
  assert.ok(Math.min(...scales) <= 0.02, 'it must end as a point inside the mouth');
  assert.ok(scales.some((s) => s > 0.05 && s < 0.8), 'and pass through the middle on the way');
  assert.match(suck, /translate3d\(0,0,-\d+px\)/, 'it must recede in z, or it is a plain shrink');
  assert.match(suck, /perspective\(\d+px\)/, 'depth without perspective renders flat');
});

test('the pull turns the sheet as it goes, by an angle drawn per close', () => {
  const suck = keyframes('portal-suck');
  assert.match(suck, /rotate\(var\(--portal-spin/, 'the sheet must twist into the mouth');
  assert.match(PORTAL, /--portal-spin/, 'and the angle comes from js');
  assert.match(PORTAL, /sheetCloseRand\(PORTAL_SPIN_LO, PORTAL_SPIN_HI\)/,
    'a fixed angle would make every close identical');
  const lo = Number(PORTAL.match(/PORTAL_SPIN_LO = (\d+)/)[1]);
  assert.ok(lo >= 10, 'a spin under 10deg is invisible against a second of motion');
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
  assert.match(PORTAL, /const PORTAL_MS = (\d+)/);
  const tearMs = Number(TEAR.match(/const TEAR_MS = (\d+)/)[1]);
  const portalMs = Number(PORTAL.match(/const PORTAL_MS = (\d+)/)[1]);
  assert.ok(tearMs >= 400 && tearMs <= 760, tearMs + 'ms is outside the 500-700ms feel');
  assert.ok(portalMs >= 1100 && portalMs <= 1300,
    portalMs + 'ms is outside the 1100-1300ms the pull and the collapse need');
});

test('every animated part is promoted and animates transform or opacity only', () => {
  const rules = [...CSS.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)];
  ['.tear__half', '.portal__skin', '.portal__mouth'].forEach((sel) => {
    const blocks = rules
      .filter((m) => m[1].split(',').some((one) => one.trim() === sel))
      .map((m) => m[2]);
    assert.ok(blocks.length > 0, 'missing rule for ' + sel);
    assert.ok(blocks.some((b) => /will-change:(transform|opacity|transform,opacity)/.test(b)),
      sel + ' must be promoted');
  });
  ['tear-drift-left', 'tear-drift-right', 'portal-suck', 'portal-open'].forEach((name) => {
    const block = keyframes(name);
    assert.doesNotMatch(block, /\n\s*(top|left|width|height|margin):/,
      name + ' must not animate layout properties');
  });
});

test('every class the portal builds has a rule, so no layer is born invisible', () => {
  const built = [...PORTAL.matchAll(/class(?:Name = |=)"([^"]+)"/g)]
    .flatMap((m) => m[1].split(' '))
    .filter((c) => c.startsWith('portal__'));
  assert.ok(built.length > 0, 'the portal must build something');
  [...new Set(built)].forEach((cls) => {
    const at = CSS.indexOf('.' + cls + '{');
    assert.ok(at > -1,
      '.' + cls + ' is created in js but owns no css rule, so it hangs in the dom invisible');
    const block = CSS.slice(at, CSS.indexOf('}', at));
    assert.match(block, /position|animation|stroke/,
      '.' + cls + ' has a rule but nothing that makes it show or move');
  });
});

test('the mouth is a real ring in front of nothing, not a filled disc', () => {
  ['portal__glow', 'portal__edge', 'portal__core'].forEach((cls) => {
    assert.match(PORTAL, new RegExp('class="' + cls + '"[^>]*fill="none"'),
      cls + ' must be a stroked outline, or the portal reads as a solid blob');
  });
  const at = CSS.indexOf('.portal__mouth{');
  const block = CSS.slice(at, CSS.indexOf('}', at));
  assert.match(block, /top:50%;left:50%/, 'the mouth sits where the sheet is pulled to');
  assert.match(block, /transform-origin:50% 50%/, 'so the collapse closes on its own centre');
});

test('the mouth and the sheet share one clock, so the pull lands as the ring shuts', () => {
  const at = CSS.indexOf('.portal__mouth{');
  const mouth = CSS.slice(at, CSS.indexOf('}', at));
  const skinAt = CSS.indexOf('.portal__skin{');
  const skin = CSS.slice(skinAt, CSS.indexOf('}', skinAt));
  const ms = (block) => Number((block.match(/animation:[^;]*?(\d+)ms/) || [])[1]);
  assert.equal(ms(mouth), ms(skin),
    'a mismatch would leave a ring hanging after the sheet is gone');
  assert.equal(ms(mouth), Number(PORTAL.match(/PORTAL_MS = (\d+)/)[1]),
    'and the js timeout must match, or cleanup cuts the animation short');
});

test('the sheet paints over the ring while it is still outside the mouth', () => {
  const skinAt = CSS.indexOf('.portal__skin{');
  const skin = CSS.slice(skinAt, CSS.indexOf('}', skinAt));
  assert.match(skin, /z-index:\d+/, 'without a z-index the ring could cover the sheet');
  assert.match(skin, /backface-visibility:hidden/, 'the 3d pull needs the back face suppressed');
});

test('the ring is one shape only, so the close stays cheap to paint', () => {
  const built = [...PORTAL.matchAll(/<ellipse class="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(built.length <= 3, 'a portal is a ring, not a particle system');
  assert.equal(new Set(built).size, built.length, 'each band of the ring is its own class');
});

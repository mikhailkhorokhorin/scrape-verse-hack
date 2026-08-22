'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath, modulePath } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('sheet-wrap.css'), 'utf8');
const JS = fs.readFileSync(modulePath('sheet-wrap.js'), 'utf8');
const GEOM = fs.readFileSync(modulePath('web-geom.js'), 'utf8');
const CLOSE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');
const APP = fs.readFileSync(modulePath('sheet.js'), 'utf8');

function frames(name) {
  const at = CSS.indexOf('@keyframes ' + name);
  assert.ok(at > -1, name + ' exists');
  return CSS.slice(at, CSS.indexOf('}\n\n', at));
}

test('the wrap is built from the shared web geometry, not a fourth web generator', () => {
  ['webPlan', 'webPathEl', 'webSvgEl', 'webCross', 'webRand', 'webRound'].forEach((fn) => {
    assert.match(JS, new RegExp('\\b' + fn + '\\('), fn + ' comes from web-geom');
  });
  assert.doesNotMatch(JS, /function wrapSpoke|function wrapRing/,
    'a private spoke or ring builder would be a duplicate web generator');
});

test('every geometry helper the wrap calls is actually exported by web-geom', () => {
  ['webPlan', 'webPathEl', 'webSvgEl', 'webCross', 'webRand', 'webRound', 'webPick', 'webPickInt']
    .forEach((fn) => {
      assert.match(GEOM, new RegExp('function ' + fn + '\\('), fn + ' is defined in web-geom');
    });
  assert.match(JS, /WEBGEOM_NS/, 'the svg namespace is the shared one');
});

test('the silk is randomised between closes, so no two wraps are the same', () => {
  assert.match(JS, /WRAP_STRANDS\s*=\s*\[5,\s*8\]/, 'strand count is a range, not a constant');
  assert.match(JS, /wrapPickIntSafe\(rng, WRAP_STRANDS\[0\], WRAP_STRANDS\[1\]\)/);
  ['wrapHub', 'wrapTether'].forEach((fn) => {
    const at = JS.indexOf('function ' + fn + '(');
    const body = JS.slice(at, JS.indexOf('\n}', at));
    assert.match(body, /wrapPickSafe\(rng/, fn + ' varies per close');
  });
  assert.match(JS, /webRand\(rng\) < 0\.5 \? -1 : 1/, 'the sway direction flips at random');
});

test('the three phases are staged in order: lash, cinch, haul', () => {
  const body = frames('webwrap-bundle');
  const lash = body.match(/16%\{[^}]*scale\(1,\s*1\)/);
  assert.ok(lash, 'the sheet is still whole while the silk flies in');
  assert.match(body, /45%\{[^}]*scale\(\.82,\.96\)/, 'the cinch squeezes the horizontal axis');
  assert.match(body, /100%\{[^}]*translateY\(var\(--webwrap-rise/, 'the haul leaves along the tether');
  assert.match(body, /rotate\(var\(--webwrap-sway/, 'and it sways as it goes');
});

test('the cinch narrows the sheet more than it shortens it, so it reads as bound', () => {
  const body = frames('webwrap-bundle');
  const at = body.match(/45%\{[^}]*scale\((\.\d+),(\.\d+)\)/);
  assert.ok(at, 'the cinch keyframe carries a two-axis scale');
  assert.ok(Number(at[1]) < Number(at[2]), 'x must compress harder than y');
});

test('the whole close fits the budget a user will wait through', () => {
  const ms = Number((JS.match(/WRAP_MS = (\d+)/) || [])[1]);
  assert.ok(ms > 0 && ms <= 700, 'a close longer than 700ms is a close that annoys');
  assert.match(CSS, new RegExp('animation:webwrap-bundle ' + ms + 'ms'), 'css and js agree');
  assert.match(CSS, new RegExp('animation:webwrap-silk-go ' + ms + 'ms'));
});

test('the haul starts before the silk has finished drawing, so the phases overlap', () => {
  const lash = Number((JS.match(/WRAP_LASH_MS = (\d+)/) || [])[1]);
  const haul = Number((JS.match(/WRAP_HAUL_AT = (\d+)/) || [])[1]);
  const cinch = Number((JS.match(/WRAP_CINCH_AT = (\d+)/) || [])[1]);
  assert.ok(cinch < haul, 'it cinches before it lifts');
  assert.ok(haul < lash * 2, 'a wrap that waits for every strand reads as slow');
});

test('the close registers itself into the shared routing without editing it', () => {
  assert.match(JS, /sheetCloseRegister\("KESTREL", sheetWrapClose\)/);
  assert.match(JS, /typeof sheetCloseRegister === "function"/, 'it must not throw if load order shifts');
  assert.match(CLOSE, /function sheetCloseRegister/, 'the routing is the other module, untouched');
});

test('the routing keeps a fallback, so an unregistered spider still closes', () => {
  assert.match(CLOSE, /function sheetCloserFor/);
  assert.match(CLOSE, /if \(!run\) return false/, 'no closer means the default close runs');
});

test('closing releases inert and focus first and only defers the visual hide', () => {
  const at = APP.indexOf('function closeSheet()');
  const body = APP.slice(at, APP.indexOf('\n}', at));
  const inert = body.indexOf('removeAttribute("inert")');
  const focus = body.indexOf('SHEET_OPENER.focus()');
  const hide = body.indexOf('modal.hidden = true');
  assert.ok(inert > -1 && focus > -1 && hide > -1);
  assert.ok(inert < hide && focus < hide, 'a11y must not wait on the animation');
  assert.match(body, /const hide = \(\) => \{ modal\.hidden = true; \}/,
    'only the hide is handed to the animation');
});

test('the wrap never gates content visibility on a class the animation removes', () => {
  assert.doesNotMatch(CSS, /\.is-webwrapping[^{]*\{[^}]*display:block/);
  assert.doesNotMatch(CSS, /\.modal:not\(\.is-webwrapping\)/,
    'hiding content unless a transient class is present would blank the sheet');
});

test('reduced motion makes the close fully synchronous, with nothing to wait for', () => {
  assert.match(JS, /function wrapQuiet\(\)/);
  assert.match(JS, /if \(wrapQuiet\(\)\) return null/,
    'returning null makes sheetCloseRun fall through to the instant hide');
  const at = CLOSE.indexOf('function sheetCloseRun');
  const body = CLOSE.slice(at, CLOSE.indexOf('\n}', at));
  assert.match(body,
    /if \(!staged \|\| typeof staged\.cleanup !== "function"\) \{\s*sheetCloseUnsilence\(\);\s*return false;/,
    'a null stage means no timer is ever armed, and the sheet is freed on the way out');
});

test('the wrap is suppressed under reduced motion, capture and print alike', () => {
  assert.match(CSS, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?\.webwrap\{display:none !important;\}/);
  assert.match(CSS, /\.is-capture \.webwrap\{display:none !important;\}/);
  assert.match(CSS, /@media print\{[\s\S]*?\.webwrap\{display:none !important;\}/);
  ['prefers-reduced-motion', 'is-capture', 'print'].forEach((guard) => {
    assert.ok(CSS.indexOf(guard) > -1, guard + ' guards the sheet animation too');
  });
  assert.match(JS, /is-capture/, 'js refuses to build the stage during a capture');
});

test('the animated parts are promoted and move only transform and opacity', () => {
  const rule = CSS.slice(CSS.indexOf('.modal.is-webwrapping .sheet{'));
  assert.match(rule.slice(0, rule.indexOf('}')), /will-change:transform,opacity/);
  assert.match(CSS.slice(CSS.indexOf('.webwrap--fire{')), /will-change:opacity,transform/);
  [frames('webwrap-bundle'), frames('webwrap-silk-go')].forEach((body) => {
    assert.doesNotMatch(body, /(?:^|[^-])(?:width|height|margin|top|left):/,
      'laying out per frame would jank the close');
  });
});

test('the draw-on animates transform and opacity, never a paint property', () => {
  const fire = CSS.slice(CSS.indexOf('.webwrap--fire .webwrap__bundle{'));
  const body = fire.slice(0, fire.indexOf('}'));
  assert.match(body, /transition:transform [\d]+ms[^;]*,opacity [\d]+ms/,
    'the reveal must ride transform and opacity, the two compositor properties');
  assert.doesNotMatch(CSS, /transition:stroke-dashoffset/,
    'stroke-dashoffset repaints the whole svg every frame on the main thread');
  assert.doesNotMatch(CSS, /will-change:stroke-dashoffset/,
    'will-change on a paint property promotes nothing and pins a repaint');
  assert.doesNotMatch(CSS, /stroke-dashoffset:/, 'no dash draw-on survives anywhere');
});

test('the reveal is promoted on the bundle, not on every strand', () => {
  const rule = CSS.slice(CSS.indexOf('.webwrap__bundle{'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.match(body, /will-change:transform,opacity/, 'the bundle is the promoted layer');
  assert.doesNotMatch(JS, /--len/, 'path length is only needed by a dash draw-on');
  assert.match(JS, /wrapBundleEl/, 'strands are grouped so one node animates per strand');
});

test('a close can never build more paths than the paint budget allows', () => {
  const cap = Number((JS.match(/WRAP_MAX_PATHS = (\d+)/) || [])[1]);
  assert.ok(cap > 0 && cap <= 30, 'a wrap over 30 paths is the jank the user reported');
  assert.match(JS, /if \(budget\.left <= 0\) return null/,
    'the budget must hard-stop path creation, not merely aim low');
  assert.match(JS, /budget\.left -= 1/, 'every path spends from the same budget');
  const spokes = JS.match(/minSpokes: (\d+), maxSpokes: (\d+)/);
  assert.ok(Number(spokes[2]) <= 3, 'a strand fans no wider than three spokes');
});

test('the strand stagger lands inside the lash, not past the end of the close', () => {
  const step = Number((JS.match(/WRAP_STEP = (\d+)/) || [])[1]);
  const lash = Number((JS.match(/WRAP_LASH_MS = (\d+)/) || [])[1]);
  const max = Number((JS.match(/WRAP_STRANDS = \[\d+, (\d+)\]/) || [])[1]);
  assert.ok(step * max <= lash, 'the last strand must start before the lash window closes');
});

test('strokes stay hairline when the stage stretches the viewbox', () => {
  assert.match(CSS, /vector-effect:non-scaling-stroke/,
    'preserveAspectRatio none would smear stroke width across the two axes');
});

test('nothing in the wrap loops, because a close happens once', () => {
  assert.doesNotMatch(CSS, /infinite/, 'a one-shot close must never repeat');
});

test('the stage is fixed and contained, so a hauled bundle cannot widen the page', () => {
  const rule = CSS.slice(CSS.indexOf('.webwrap{'), CSS.indexOf('.webwrap__silk-svg'));
  assert.match(rule, /position:fixed/, 'absolute would extend the scroll box');
  assert.match(rule, /pointer-events:none/);
  assert.match(rule, /contain:strict/, 'containment keeps the overflowing silk out of layout');
});

test('the stage is torn down completely, leaving no inline state on the sheet', () => {
  const at = JS.indexOf('cleanup: () =>');
  const body = JS.slice(at, JS.indexOf('},', at));
  assert.match(body, /modal\.classList\.remove\("is-webwrapping"\)/);
  assert.match(body, /stage\.parentNode\.removeChild\(stage\)/);
  ['--webwrap-sway', '--webwrap-rise', '--webwrap-lash'].forEach((prop) => {
    assert.ok(body.indexOf(prop) > -1, prop + ' is removed, so a reopen starts clean');
  });
});

test('the stage carries no focusable node and is hidden from the tree', () => {
  assert.match(JS, /stage\.setAttribute\("aria-hidden", "true"\)/);
  assert.doesNotMatch(JS, /createElement\("(?:button|a|input)"/, 'the silk is decoration only');
  assert.match(GEOM, /svg\.setAttribute\("aria-hidden", "true"\)/, 'shared svgs are hidden too');
});

test('the wrap is wired into the page in dependency order', () => {
  assert.match(INDEX, /<link rel="stylesheet" href="css\/fx\/sheet-wrap\.css">/);
  assert.match(INDEX, /<script src="js\/fx\/sheet-wrap\.js"><\/script>/);
  assert.ok(INDEX.indexOf('js/sheets/front/web-geom.js') < INDEX.indexOf('js/fx/sheet-wrap.js'),
    'the geometry must be defined before the wrap that uses it');
  assert.ok(INDEX.indexOf('js/fx/sheet-close.js') < INDEX.indexOf('js/fx/sheet-wrap.js'),
    'the routing must exist before the wrap registers into it');
});

test('the stage class cannot shadow the page layout wrapper closeSheet un-inerts', () => {
  assert.doesNotMatch(JS, /className = "wrap"/,
    'closeSheet calls document.querySelector(".wrap") to release inert');
  assert.match(JS, /className = "webwrap"/);
  assert.match(APP, /querySelector\("\.wrap"\)\.removeAttribute\("inert"\)/,
    'this is the selector the stage must never match first');
});

test('the wrap source carries no comments', () => {
  [JS, CSS].forEach((src) => {
    assert.doesNotMatch(src, /\/\*/, 'no block comments');
  });
  JS.split('\n').forEach((line) => {
    assert.doesNotMatch(line, /^\s*\/\//, 'no line comments');
  });
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath, modulePath, CSS_DIR } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('panelcut.css'), 'utf8');
const JS = fs.readFileSync(modulePath('panelcut.js'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');
const SHEET = fs.readFileSync(modulePath('sheet.js'), 'utf8');

test('the backdrop is a screentone gutter, not a flat dim wash', () => {
  const block = CSS.slice(CSS.indexOf('.modal{'), CSS.indexOf('.modal::before'));
  assert.match(block, /repeating-linear-gradient/, 'the hatching is what makes it a gutter');
  assert.match(block, /radial-gradient\(rgba\(255,46,136/, 'a halftone dot field, the house texture');
});

test('the sheet lands with a hard paper-and-ink frame, so the panel edge is visible', () => {
  const rule = CSS.slice(CSS.indexOf('.sheet{'), CSS.indexOf('@keyframes panelcut-drop'));
  assert.match(rule, /0 0 0 3px var\(--paper\)/, 'the white gutter edge cuts it out of the page');
  assert.match(rule, /0 0 0 9px var\(--ink\)/, 'the ink keyline outside the paper');
});

test('the panel drops straight in, with no rotation to read as a spin', () => {
  ['panelcut-drop', 'panelcut-lift'].forEach((name) => {
    const frames = CSS.slice(CSS.indexOf('@keyframes ' + name));
    const body = frames.slice(0, frames.indexOf('}\n\n'));
    assert.doesNotMatch(body, /rotate\(/,
      name + ' with a sign-flipping rotate reads as a twirl, not a stamp');
  });
  const drop = CSS.slice(CSS.indexOf('@keyframes panelcut-drop'));
  const body = drop.slice(0, drop.indexOf('}\n\n'));
  assert.match(body, /translateY\(-14px\)/, 'it still settles in from above');
  const scales = [...body.matchAll(/scale\(([\d.]+)\)/g)].map((m) => Number(m[1]));
  assert.ok(scales.length > 0);
  assert.ok(Math.max(...scales) <= 1.005,
    'a zoom overshoot reads as flying in from depth, not appearing in place');
});

test('exactly one stylesheet rule animates the bare sheet, so no link order race', () => {
  const owners = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) {
        const src = fs.readFileSync(full, 'utf8');
        [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)].forEach((m) => {
          const bare = m[1].split(',').some((one) => one.trim() === '.sheet');
          if (bare && /animation:(?!none)/.test(m[2])) owners.push(entry.name);
        });
      }
    });
  };
  walk(CSS_DIR);
  assert.deepEqual(owners, ['panelcut.css'],
    'competing .sheet animations are decided by <link> order, not intent: ' + owners.join(', '));
});

test('the drop is promoted and animates only transform and opacity', () => {
  const rule = CSS.slice(CSS.indexOf('.sheet{'), CSS.indexOf('@keyframes panelcut-drop'));
  assert.match(rule, /will-change:transform,opacity/, 'the compositor must own the panel');
  const frames = CSS.slice(CSS.indexOf('@keyframes panelcut-drop'));
  const body = frames.slice(0, frames.indexOf('}\n\n'));
  assert.doesNotMatch(body, /(?:^|[^-])(?:width|height|margin|top|left):/,
    'a reflowing keyframe would repaint the whole sheet every frame');
});

test('the close is a matching exit, not an instant disappearance', () => {
  assert.match(CSS, /@keyframes panelcut-lift/, 'the panel lifts back off the page');
  assert.match(JS, /PANELCUT_EXIT_MS = 180/, 'and it is quick, because a slow close is a bad close');
});

test('the whole open is well under 500ms to interactive', () => {
  const cut = Number((CSS.match(/--cut-ms:(\d+)ms/) || [])[1]);
  assert.ok(cut > 0 && cut < 500, 'a modal that takes half a second to arrive is a worse modal');
});

test('the sheet is layered above the backdrop treatment, so nothing paints over the numbers', () => {
  const rule = CSS.slice(CSS.indexOf('.sheet{'), CSS.indexOf('@keyframes panelcut-drop'));
  const vignette = CSS.slice(CSS.indexOf('.modal::before'), CSS.indexOf('.sheet{'));
  const sheetZ = Number((rule.match(/z-index:(\d+)/) || [])[1]);
  const backZ = Number((vignette.match(/z-index:(\d+)/) || [])[1]);
  assert.ok(sheetZ > backZ, 'the gutter vignette must stay under the panel it frames');
});

test('nothing in the treatment loops, so an open modal costs no steady frames', () => {
  assert.doesNotMatch(CSS, /infinite/);
});

test('reduced motion, capture and print each kill every part of the treatment', () => {
  const reduced = CSS.slice(CSS.indexOf('@media(prefers-reduced-motion:reduce)'));
  assert.match(reduced.slice(0, reduced.indexOf('}\n\n')), /animation:none !important/);
  assert.match(CSS, /@media print\{[\s\S]*?animation:none !important/);
  assert.match(CSS, /@media print\{[\s\S]*?\.modal::before\{display:none/);
  assert.match(CSS, /\.is-capture \.sheet[\s\S]*?animation:none !important/);
});

test('the javascript refuses to play under reduced motion or capture', () => {
  assert.match(JS, /function panelcutQuiet/);
  assert.match(JS, /prefersReducedMotion\(\)\) return true/);
  assert.match(JS, /CAPTURE\) return true/);
});

test('a suppressed close still hides the modal, so quiet mode cannot strand it open', () => {
  const close = JS.slice(JS.indexOf('function panelcutClose'));
  assert.match(close.slice(0, close.indexOf('\n}')), /panelcutQuiet\(\)\)\s*\{\s*done\(\);/,
    'skipping the animation must still run the hide');
});

test('closing releases focus and inert before the exit plays, so a11y never waits on animation', () => {
  const close = SHEET.slice(SHEET.indexOf('function closeSheet'));
  const body = close.slice(0, close.indexOf('\n}'));
  const inertAt = body.indexOf('removeAttribute("inert")');
  const focusAt = body.indexOf('SHEET_OPENER.focus()');
  const animAt = body.indexOf('panelcutClose');
  assert.ok(inertAt > -1 && focusAt > -1 && animAt > -1);
  assert.ok(inertAt < animAt, 'inert must lift immediately');
  assert.ok(focusAt < animAt, 'focus must return immediately, not 180ms later');
});

test('the sheet is still hidden at the end, so it cannot trap a tab ring', () => {
  const close = SHEET.slice(SHEET.indexOf('function closeSheet'));
  assert.match(close.slice(0, close.indexOf('\n}')), /modal\.hidden = true/);
});

test('the page loads the treatment on both its stylesheet and its script', () => {
  assert.match(INDEX, /css\/fx\/panelcut\.css/);
  assert.match(INDEX, /js\/fx\/panelcut\.js/);
});

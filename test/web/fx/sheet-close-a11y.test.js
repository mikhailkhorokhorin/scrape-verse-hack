'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath, modulePath } = require('../../web-loader.js');

const CORE = fs.readFileSync(modulePath('sheet-close.js'), 'utf8');
const TEAR = fs.readFileSync(modulePath('sheet-tear.js'), 'utf8');
const CRUMPLE = fs.readFileSync(modulePath('sheet-crumple.js'), 'utf8');
const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8')
  + '\n' + fs.readFileSync(cssPath('sheet-toss.css'), 'utf8');
const PANELCUT = fs.readFileSync(modulePath('panelcut.js'), 'utf8');
const SHEET = fs.readFileSync(modulePath('sheet.js'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');

test('reduced motion, capture and print each kill both closes outright', () => {
  ['@media(prefers-reduced-motion:reduce)', '@media print'].forEach((guard) => {
    const blocks = [...CSS.matchAll(new RegExp(guard.replace(/[(){}]/g, '\\$&') + '\\{', 'g'))]
      .map((m) => CSS.slice(m.index).slice(0, CSS.slice(m.index).indexOf('\n}\n')));
    assert.equal(blocks.length, 2, guard + ' must guard the tear file and the toss file');
    blocks.forEach((body) => {
      assert.match(body, /animation:none !important/, guard + ' must stop the motion');
      assert.match(body, /display:none/, guard + ' must hide the props entirely');
    });
    const covered = blocks.join('\n');
    ['.tear', '.toss'].forEach((prop) => {
      assert.ok(new RegExp('\\' + prop + '\\{display:none;\\}').test(covered),
        prop + ' must not even appear under ' + guard);
    });
  });
  assert.match(CSS, /\.is-capture \.tear\{display:none;\}/);
  assert.match(CSS, /\.is-capture \.toss\{display:none;\}/);
});

test('a quiet close still hides the modal, because the guard runs before the routing', () => {
  const close = PANELCUT.slice(PANELCUT.indexOf('function panelcutClose'));
  const body = close.slice(0, close.indexOf('\n}'));
  assert.ok(body.indexOf('panelcutQuiet()') < body.indexOf('sheetCloseRun'),
    'reduced motion must short-circuit to a synchronous hide, never into an animation');
  assert.match(body, /panelcutQuiet\(\)\)\s*\{\s*done\(\);/);
});

test('closing still frees focus and inert before any of this plays', () => {
  const close = SHEET.slice(SHEET.indexOf('function closeSheet'));
  const body = close.slice(0, close.indexOf('\n}'));
  const inertAt = body.indexOf('removeAttribute("inert")');
  const focusAt = body.indexOf('SHEET_OPENER.focus()');
  const animAt = body.indexOf('panelcutClose');
  assert.ok(inertAt > -1 && focusAt > -1 && animAt > -1);
  assert.ok(inertAt < animAt, 'inert must lift immediately, not 700ms later');
  assert.ok(focusAt < animAt, 'focus must return immediately');
  assert.match(body, /modal\.hidden = true/, 'and the modal still ends up hidden');
});

test('the page loads every part of the treatment', () => {
  assert.match(INDEX, /css\/fx\/sheet-close\.css/);
  assert.match(INDEX, /css\/fx\/sheet-toss\.css/,
    'the toss half of the close lives in its own sheet and must be linked too');
  assert.match(INDEX, /js\/fx\/sheet-close\.js/);
  assert.match(INDEX, /js\/fx\/sheet-tear\.js/);
  assert.match(INDEX, /js\/fx\/sheet-crumple\.js/);
  const core = INDEX.indexOf('js/fx/sheet-close.js');
  ['sheet-tear.js', 'sheet-crumple.js'].forEach((f) => {
    assert.ok(core < INDEX.indexOf('js/fx/' + f),
      f + ' calls sheetCloseRegister, so the registry must exist first');
  });
});

test('the close sources carry no comments, the way the rest of the codebase does not', () => {
  [CORE, TEAR, CRUMPLE].forEach((src) => {
    src.split('\n').forEach((line) => {
      assert.doesNotMatch(line, /(^|\s)\/\//, 'no line comments');
    });
    assert.doesNotMatch(src, /\/\*/, 'no block comments');
  });
});

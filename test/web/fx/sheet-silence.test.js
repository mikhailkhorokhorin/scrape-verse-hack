'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath, modulePath, loadWebModule } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('sheet-close.css'), 'utf8');
const SOURCES = ['sheet-close.js', 'sheet-tear.js', 'sheet-wrap.js', 'sheet-portal.js']
  .map((name) => fs.readFileSync(modulePath(name), 'utf8'));

function fakeEl() {
  const classes = new Set();
  const styles = new Map();
  return {
    classList: {
      add: (c) => { classes.add(c); },
      remove: (c) => { classes.delete(c); },
      contains: (c) => classes.has(c),
    },
    style: {
      setProperty: (k, v) => { styles.set(k, v); },
      removeProperty: (k) => { styles.delete(k); },
      getPropertyValue: (k) => (styles.has(k) ? styles.get(k) : ''),
    },
  };
}

function harness() {
  const sheet = fakeEl();
  const modal = fakeEl();
  modal.querySelector = (sel) => (sel === '.sheet' ? sheet : null);
  const timers = [];
  const ctx = loadWebModule(['sheet-close.js', 'panelcut.js'], {
    document: {
      querySelectorAll: (sel) =>
        (sel === '.sheet--silenced' && sheet.classList.contains('sheet--silenced')
          ? [sheet]
          : []),
    },
    setTimeout: (fn) => timers.push(fn),
    clearTimeout: () => {},
    window: {},
  });
  return { ctx, sheet, modal, timers };
}

function armed(kind) {
  const h = harness();
  h.ctx.sheetCloseRegister('PROBE', (modal, sheet) => {
    h.ctx.sheetCloseSilence(sheet);
    if (kind === 'broken') return null;
    if (kind === 'throwing') throw new Error('closer died mid-measure');
    return { ms: 50, cleanup: () => {} };
  });
  h.ctx.sheetCloseArm('PROBE');
  return h;
}

test('closing silences the live sheet with a class, never with inline styles', () => {
  const { ctx, sheet, modal } = armed('ok');
  ctx.panelcutClose(modal, () => {});
  assert.equal(sheet.classList.contains('sheet--silenced'), true);
  assert.equal(sheet.style.animation, undefined, 'inline animation would outlive the close');
  assert.equal(sheet.style.opacity, undefined, 'inline opacity would stick at 0 forever');
});

test('open, close and open again hands back a sheet that can animate', () => {
  const { ctx, sheet, modal, timers } = armed('ok');
  ctx.panelcutOpen(modal);
  let hidden = false;
  ctx.panelcutClose(modal, () => { hidden = true; });
  timers.splice(0).forEach((fn) => fn());
  assert.equal(hidden, true, 'the close must still hide the modal');
  ctx.panelcutOpen(modal);
  assert.equal(sheet.classList.contains('sheet--silenced'), false);
  assert.equal(sheet.style.animation, undefined);
  assert.equal(sheet.style.opacity, undefined);
});

test('a reopen that interrupts a running close lifts the silence at once', () => {
  const { ctx, sheet, modal } = armed('ok');
  ctx.panelcutClose(modal, () => {});
  assert.equal(sheet.classList.contains('sheet--silenced'), true);
  ctx.panelcutOpen(modal);
  assert.equal(sheet.classList.contains('sheet--silenced'), false);
});

test('a closer that silences the sheet and then returns garbage cannot strand it', () => {
  const { ctx, sheet, modal, timers } = armed('broken');
  let hidden = false;
  ctx.panelcutClose(modal, () => { hidden = true; });
  assert.equal(sheet.classList.contains('sheet--silenced'), false,
    'the fallback close runs with no cleanup registered, so recovery must be immediate');
  timers.splice(0).forEach((fn) => fn());
  assert.equal(hidden, true, 'the generic lift must still hide the modal');
});

test('a closer that throws mid-measure cannot strand the sheet either', () => {
  const { ctx, sheet, modal, timers } = armed('throwing');
  let hidden = false;
  ctx.panelcutClose(modal, () => { hidden = true; });
  assert.equal(sheet.classList.contains('sheet--silenced'), false);
  timers.splice(0).forEach((fn) => fn());
  assert.equal(hidden, true);
});

test('the silence class is declared in css and kills both animation and opacity', () => {
  assert.match(CSS, /\.sheet\.sheet--silenced\{animation:none;opacity:0;\}/,
    'the compound selector must outrank the bare .sheet rule in panelcut.css');
});

test('no close writes an inline animation or opacity onto the live sheet', () => {
  SOURCES.forEach((src) => {
    assert.doesNotMatch(src, /style\.animation = /);
    assert.doesNotMatch(src, /style\.opacity = /);
  });
});

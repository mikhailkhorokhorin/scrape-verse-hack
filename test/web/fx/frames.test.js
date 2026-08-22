'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cssPath } = require('../../web-loader.js');

const CSS = fs.readFileSync(cssPath('frames.css'), 'utf8');
const ROOT = path.join(__dirname, '..', '..', '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'web', 'index.html'), 'utf8');
const MANUAL = fs.readFileSync(path.join(ROOT, 'web', 'manual.html'), 'utf8');

test('the frame depths are tokens, so the offsets are a system and not guesses', () => {
  const root = CSS.slice(0, CSS.indexOf('}'));
  assert.match(root, /--frame-1:4px 4px 0 var\(--ink\)/);
  assert.match(root, /--frame-2:6px 6px 0 var\(--ink\)/);
  assert.match(root, /--frame-3:10px 10px 0 var\(--ink\)/);
  assert.match(root, /--frame-cyan:4px 4px 0 var\(--cyan\)/);
  assert.match(root, /--frame-pink:4px 4px 0 var\(--pink\)/);
});

test('the depths step in one consistent direction, so depth reads as hierarchy', () => {
  const root = CSS.slice(0, CSS.indexOf('}'));
  const steps = (root.match(/--frame-[123]:(\d+)px/g) || [])
    .map((decl) => Number(decl.split(':')[1].replace('px', '')));
  assert.deepEqual(steps, [4, 6, 10]);
  assert.ok(steps[0] < steps[1] && steps[1] < steps[2], 'each tier is deeper than the last');
});

test('every frame shadow is hard — no blur anywhere, because comics have no soft shadows', () => {
  const shadows = CSS.match(/box-shadow:[^;]+;/g) || [];
  assert.ok(shadows.length > 0);
  shadows.forEach((decl) => {
    const parts = decl.replace(/box-shadow:|;/g, '').split(',');
    parts.forEach((part) => {
      const lengths = part.trim().match(/-?\d+px/g) || [];
      if (lengths.length >= 3) {
        assert.equal(lengths[2], '0px',
          'a non-zero blur radius would break the flat-ink language: ' + part.trim());
      }
    });
  });
});

test('a section head now carries colour and ink, so the plate has real depth', () => {
  assert.match(CSS, /\.sechead h2\{box-shadow:var\(--frame-pink\),7px 7px 0 var\(--ink\)/,
    'the pink plate sits over an ink plate, the misregistered-print look');
});

test('the frames that were bare lines now carry the house shadow', () => {
  ['.sheet__facts', '.sample', '.sechead__count', '.dip__title'].forEach((sel) => {
    const at = CSS.indexOf(sel + '{');
    assert.ok(at > -1, sel + ' must be in the frame system');
    assert.match(CSS.slice(at, CSS.indexOf('}', at)), /box-shadow:var\(--frame-/,
      sel + ' must use a system token rather than a one-off value');
  });
});

test('the section rule is a printed dash rather than a plain hairline', () => {
  const at = CSS.indexOf('.sechead .rule{');
  const rule = CSS.slice(at, CSS.indexOf('}', at));
  assert.match(rule, /repeating-linear-gradient/, 'it reads as a comic rule, not a border');
  assert.match(rule, /var\(--ink\)/, 'and it stays in ink');
});

test('nothing in the frame system animates, so it costs no frames at all', () => {
  assert.doesNotMatch(CSS, /animation|transition/,
    'a frame language is static — the motion budget must not pay for it');
});

test('nothing in the frame system touches text colour or opacity', () => {
  assert.doesNotMatch(CSS, /(?:^|[^-])color:/m,
    'the numbers must stay exactly as readable as they were');
  assert.doesNotMatch(CSS, /opacity:/,
    'dimming anything would trade credibility for decoration');
});

test('the offsets shrink on a small screen, so a phone is not shoved sideways', () => {
  const block = CSS.slice(CSS.indexOf('@media(max-width:767px)'));
  const body = block.slice(0, block.indexOf('}\n\n'));
  assert.match(body, /\.sechead h2\{box-shadow:3px 3px/);
  assert.match(body, /\.sheet__facts,\.sample\{box-shadow:4px 4px/);
});

test('print drops every shadow, because paper has no offset ink', () => {
  const block = CSS.slice(CSS.indexOf('@media print'));
  assert.match(block, /box-shadow:none/);
  assert.match(block, /\.sechead \.rule\{background:var\(--ink\)/,
    'and the dashed rule becomes a solid one on paper');
});

test('both pages share the one frame system, so the two never drift apart', () => {
  assert.match(INDEX, /css\/fx\/frames\.css/);
  assert.match(MANUAL, /css\/fx\/frames\.css/);
});

test('the frame system loads after the sheets it refines, or it would not win', () => {
  const frames = INDEX.indexOf('css/fx/frames.css');
  ['css/base/layout.css', 'css/sheets/sheet.css', 'css/sheets/diptych.css'].forEach((sheet) => {
    assert.ok(INDEX.indexOf(sheet) < frames, sheet + ' must load before the frame system');
  });
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cssPath } = require('../../web-loader.js');

const states = fs.readFileSync(cssPath('states.css'), 'utf8');
const rig = fs.readFileSync(cssPath('rig.css'), 'utf8');
const panel = fs.readFileSync(cssPath('panel.css'), 'utf8');
const print = fs.readFileSync(cssPath('print.css'), 'utf8');
const capture = fs.readFileSync(cssPath('capture.css'), 'utf8');

function durationsIn(css) {
  return (css.match(/animation:[^;]*?(\d+(?:\.\d+)?)s[^;]*infinite/g) || [])
    .map((decl) => Number((decl.match(/(\d+(?:\.\d+)?)s/) || [])[1]));
}

test('a damaged panel glitches rarely, the way a bad frame is rare', () => {
  const critical = states.match(/\.is-critical::after\{animation:glitch-slice (\d+)s/);
  const degraded = states.match(/\.is-degraded::after\{animation:glitch-slice (\d+)s/);
  assert.ok(critical && Number(critical[1]) >= 12, 'a glitch every few seconds reads as a fault');
  assert.ok(degraded && Number(degraded[1]) >= 30, 'a degraded panel is calmer than a critical one');
});

test('the glitch never moves the panel, so it cannot force a whole-panel repaint', () => {
  const block = states.slice(states.indexOf('@keyframes glitch-slice'));
  const frames = block.slice(0, block.indexOf('}\n'));
  assert.doesNotMatch(frames, /transform:translate/,
    'translating the panel repainted its character and sparkline every frame');
});

test('damage is shown by colour, not by draining it away', () => {
  const critical = states.match(/\.is-critical\{filter:saturate\((\.\d+)\)/);
  assert.ok(critical && Number(critical[1]) >= 0.7,
    'saturate(.45) washed the red out of the very number it was flagging');
});

test('no looping animation on a spider runs faster than every four seconds', () => {
  durationsIn(rig).forEach((d) => {
    assert.ok(d >= 4, 'a two-second loop on fourteen elements reads as a stutter');
  });
});

test('the animated parts of a spider are promoted, so the compositor owns them', () => {
  ['rig-plant', 'rig-twitch', 'rig-blink', 'rig-weight'].forEach((name) => {
    const at = rig.indexOf('animation:' + name);
    assert.ok(at > -1, name + ' still exists');
    const rule = rig.slice(rig.lastIndexOf('{', at), rig.indexOf('}', at));
    assert.match(rule, /will-change:transform/, name + ' needs its own layer');
  });
});

test('an infected chip breathes slowly and never fades below readable', () => {
  const decl = panel.match(/chip-pulse (\d+(?:\.\d+)?)s/);
  assert.ok(decl && Number(decl[1]) >= 4);
  const frames = panel.slice(panel.indexOf('@keyframes chip-pulse'));
  const dip = Number((frames.match(/opacity:(\.\d+)/) || [])[1]);
  assert.ok(dip >= 0.6, 'a chip that fades to .45 is unreadable half the time');
});

test('the glitch is absent from print and from a capture', () => {
  assert.match(print, /\.is-critical::after[^{]*\{[^}]*display:none/);
  assert.match(capture, /\.is-capture \.is-critical::after/);
});

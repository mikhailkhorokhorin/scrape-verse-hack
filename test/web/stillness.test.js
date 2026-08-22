'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'rig-parts.js', 'rig.js']);
const { rigRestless, rigSVG } = context;

const CSS = fs.readFileSync(
  path.join(__dirname, '..', '..', 'web', 'css', 'rig.css'), 'utf8'
);

const SPIDER = {
  code: 'ATLAS',
  fieldOrder: ['title', 'price'],
  fields: { title: 'live', price: 'live' },
};

test('a healthy Spider is still — it does not step or shift its weight', () => {
  assert.equal(rigRestless('healthy'), false);
});

test('an unwatched Spider is still too, because nothing is happening to it', () => {
  assert.equal(rigRestless('unwatched'), false);
});

test('every damaged state is restless, and that is the whole signal', () => {
  assert.equal(rigRestless('degraded'), true);
  assert.equal(rigRestless('critical'), true);
  assert.equal(rigRestless('reweaving'), true);
});

test('the healthy rig ships without the restless class', () => {
  const svg = rigSVG(SPIDER, 'healthy');
  assert.ok(!svg.includes('rig--restless'));
  assert.ok(svg.includes('class="rig"'));
});

test('the damaged rig ships with it', () => {
  assert.ok(rigSVG(SPIDER, 'critical').includes('rig--restless'));
});

test('steps and weight-shift are reachable only behind the restless gate', () => {
  assert.ok(/\.rig--restless[^{}]*\{[^{}]*animation:rig-plant/.test(CSS),
    'rig-plant must be gated');
  assert.ok(/\.rig--restless[^{}]*\{[^{}]*animation:rig-weight/.test(CSS),
    'rig-weight must be gated');
});

test('breath and blink survive the budget — they are the health signal', () => {
  assert.ok(/animation:rig-blink/.test(CSS));
  assert.ok(!/\.rig--restless[^{}]*\{[^{}]*animation:rig-blink/.test(CSS),
    'blink must stay unconditional');
});

test('the twitch stays with the infected leg that earns it', () => {
  assert.ok(/data-state="infected"[^{}]*\{[^{}]*animation:rig-twitch/s.test(CSS));
});

test('reduced motion still stops every rig animation', () => {
  const block = CSS.slice(CSS.indexOf('prefers-reduced-motion'));
  assert.ok(block.includes('.rig__leg'));
  assert.ok(block.includes('.rig__body'));
  assert.ok(block.includes('animation:none'));
});

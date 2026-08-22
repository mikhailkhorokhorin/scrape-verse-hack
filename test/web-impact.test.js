'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('./web-loader.js');

let reduced = false;
const classes = new Set();

const context = loadWebModule(['config.js', 'impact.js'], {
  document: { body: { classList: {
    add: (c) => classes.add(c),
    remove: (c) => classes.delete(c),
    contains: (c) => classes.has(c),
  } } },
  matchMedia: (q) => ({ matches: reduced && /reduce/.test(q) }),
  setTimeout: () => 1,
  prefersReducedMotion: () => reduced,
});
const { impactWorthyOf, impactCodesOf, impactFire, IMPACT_MS } = context;

function change(from, to, extra) {
  return Object.assign({ code: 'ATLAS', newRun: true, integrityFrom: from, integrityTo: to }, extra || {});
}

test('the frame lasts sixty milliseconds, one frame of force', () => {
  assert.equal(IMPACT_MS, 60);
});

test('a genuine fall through the critical threshold earns the frame', () => {
  assert.equal(impactWorthyOf(change(88, 41)), true);
});

test('a fall that stops short of critical does not', () => {
  assert.equal(impactWorthyOf(change(88, 63)), false);
});

test('a Spider already critical that drops further does not re-fire', () => {
  assert.equal(impactWorthyOf(change(41, 12)), false);
});

test('a recovery out of critical is not an impact', () => {
  assert.equal(impactWorthyOf(change(41, 92)), false);
});

test('the boundary is the threshold itself, not a value near it', () => {
  assert.equal(impactWorthyOf(change(60, 59)), true);
  assert.equal(impactWorthyOf(change(61, 60)), false);
});

test('a field change with no new run is decoration, not a hit', () => {
  assert.equal(impactWorthyOf(change(88, 41, { newRun: false })), false);
});

test('a change with no readings either side cannot be judged and never fires', () => {
  assert.equal(impactWorthyOf(change(null, 41)), false);
  assert.equal(impactWorthyOf(change(88, null)), false);
  assert.equal(impactWorthyOf(null), false);
});

test('only the Spiders that actually crossed are named', () => {
  const delta = { changes: [
    change(88, 41),
    change(63, 62, { code: 'BODEGA' }),
    change(95, 20, { code: 'KESTREL' }),
  ] };
  assert.deepEqual(plain(impactCodesOf(delta)), ['ATLAS', 'KESTREL']);
});

test('a first render, which reports no changes, fires nothing', () => {
  assert.deepEqual(plain(impactCodesOf({ changes: [] })), []);
  assert.deepEqual(plain(impactCodesOf(null)), []);
});

test('a quiet poll leaves the page alone', () => {
  classes.clear();
  reduced = false;
  assert.equal(impactFire({ changes: [change(88, 63)] }), null);
  assert.equal(classes.has('impact'), false);
});

test('a real hit inverts the page once', () => {
  classes.clear();
  reduced = false;
  assert.equal(impactFire({ changes: [change(88, 41)] }), 'ATLAS');
  assert.equal(classes.has('impact'), true);
});

test('the inversion never stacks twice inside one render', () => {
  classes.clear();
  reduced = false;
  impactFire({ changes: [change(88, 41)] });
  assert.equal(impactFire({ changes: [change(88, 41)] }), null);
});

test('reduced motion kills the frame outright, hit or no hit', () => {
  classes.clear();
  reduced = true;
  assert.equal(impactFire({ changes: [change(88, 41)] }), null);
  assert.equal(classes.has('impact'), false);
  reduced = false;
});

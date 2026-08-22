'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('../../web-loader.js');

const context = loadWebModule(['rig-parts.js']);
const { rigBuildOf, legPath, eyeRow, litRankFor, seedOf, RIG_BUILD, LEG_SLOTS } = context;

test('every collector has its own build', () => {
  assert.deepEqual(plain(Object.keys(RIG_BUILD).sort()), ['ATLAS', 'BODEGA', 'KESTREL']);
});

test('the three silhouettes differ in leg span, not only in size', () => {
  const spans = ['BODEGA', 'ATLAS', 'KESTREL'].map((code) => rigBuildOf(code).legSpan);
  assert.equal(new Set(spans).size, 3);
});

test('an unknown collector still returns a usable build', () => {
  const build = rigBuildOf('NOBODY');
  assert.ok(build.body && build.legSpan > 0);
});

test('four leg slots run down the body, one per expected field', () => {
  assert.equal(LEG_SLOTS.length, 4);
  assert.equal(new Set(LEG_SLOTS).size, 4);
});

test('leg roots step down the body so the legs do not fan out as wings', () => {
  const build = rigBuildOf('ATLAS');
  const rootY = (d) => Number(d.split(' ')[1]);
  const roots = LEG_SLOTS.map((slot) => rootY(legPath(build, slot, 1, 'live')));
  for (let i = 1; i < roots.length; i += 1) assert.ok(roots[i] > roots[i - 1]);
});

test('a live foot always lands below its own root', () => {
  const build = rigBuildOf('KESTREL');
  for (const slot of LEG_SLOTS) {
    const d = legPath(build, slot, 1, 'live');
    const rootY = Number(d.split(' ')[1]);
    const footY = Number(d.split(' ').pop());
    assert.ok(footY > rootY);
  }
});

test('a dead leg hangs lower than a live one', () => {
  const build = rigBuildOf('ATLAS');
  const live = legPath(build, LEG_SLOTS[0], 1, 'live');
  const dead = legPath(build, LEG_SLOTS[0], 1, 'dead');
  const footY = (d) => Number(d.split(' ').pop());
  assert.ok(footY(dead) > footY(live));
});

test('a dead leg reaches less far than a live one', () => {
  const build = rigBuildOf('ATLAS');
  const footX = (d) => Number(d.split('Q')[1].split(' ')[2]);
  assert.ok(footX(legPath(build, LEG_SLOTS[0], 1, 'dead')) <
    footX(legPath(build, LEG_SLOTS[0], 1, 'live')));
});

test('legs mirror across the body', () => {
  const build = rigBuildOf('BODEGA');
  const right = legPath(build, LEG_SLOTS[1], 1, 'live');
  const left = legPath(build, LEG_SLOTS[1], -1, 'live');
  assert.notEqual(right, left);
});

test('an infected leg keeps the live posture and only changes colour', () => {
  const build = rigBuildOf('KESTREL');
  assert.equal(legPath(build, LEG_SLOTS[2], 1, 'infected'), legPath(build, LEG_SLOTS[2], 1, 'live'));
});

test('every character has exactly eight eyes', () => {
  for (const code of ['BODEGA', 'ATLAS', 'KESTREL']) {
    assert.equal(eyeRow(rigBuildOf(code)).length, 8);
  }
});

test('eyes carry a lit rank so dimming is ordered, not random', () => {
  const ranks = eyeRow(rigBuildOf('ATLAS')).map((eye) => eye.rank);
  assert.deepEqual(plain(ranks.slice().sort()), [1, 1, 2, 2, 3, 3, 4, 4]);
});

test('lit rank follows the status band', () => {
  assert.equal(litRankFor('unwatched'), 0);
  assert.equal(litRankFor('critical'), 1);
  assert.equal(litRankFor('degraded'), 2);
  assert.equal(litRankFor('healthy'), 4);
});

test('a healthy spider lights every eye and an unwatched one lights none', () => {
  const eyes = eyeRow(rigBuildOf('BODEGA'));
  const litFor = (status) => eyes.filter((eye) => litRankFor(status) > 0 && eye.rank <= litRankFor(status)).length;
  assert.equal(litFor('healthy'), 8);
  assert.equal(litFor('unwatched'), 0);
});

test('a critical spider keeps only the innermost pair lit', () => {
  const eyes = eyeRow(rigBuildOf('BODEGA'));
  assert.equal(eyes.filter((eye) => eye.rank <= litRankFor('critical')).length, 2);
});

test('degraded lights strictly more eyes than critical and fewer than healthy', () => {
  const eyes = eyeRow(rigBuildOf('KESTREL'));
  const count = (status) => eyes.filter((eye) => eye.rank <= litRankFor(status)).length;
  assert.ok(count('critical') < count('degraded'));
  assert.ok(count('degraded') < count('healthy'));
});

test('the blink seed is stable for a given collector', () => {
  assert.equal(seedOf('ATLAS'), seedOf('ATLAS'));
});

test('the blink seed differs across the fleet so nothing blinks in unison', () => {
  const seeds = ['BODEGA', 'ATLAS', 'KESTREL'].map(seedOf);
  assert.equal(new Set(seeds).size, 3);
});

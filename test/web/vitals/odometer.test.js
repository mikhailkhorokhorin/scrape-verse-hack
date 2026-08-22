'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

const context = loadWebModule(['format.js', 'odometer.js'], {
  document: { getElementById: () => null, createElement: () => ({}) },
});
const { odoCellsOf, odoIsDigit, odoHTML, ODO_DIGITS } = context;

function reels(html) {
  return (html.match(/--odo:(\d+)/g) || []).map((m) => Number(m.split(':')[1]));
}

test('every digit is a slot and every other character stays fixed', () => {
  assert.equal(odoIsDigit('7'), true);
  assert.equal(odoIsDigit('%'), false);
  assert.equal(odoIsDigit(' '), false);
});

test('the readout is split character by character', () => {
  assert.equal(odoCellsOf('84%').length, 3);
  assert.equal(odoCellsOf('').length, 0);
  assert.equal(odoCellsOf(null).length, 0);
});

test('a two-digit reading rolls two reels and leaves the unit alone', () => {
  const html = odoHTML('84%');
  assert.equal((html.match(/odo__slot/g) || []).length, 2);
  assert.equal((html.match(/odo__fixed/g) || []).length, 1);
});

test('each reel is offset to the digit it currently shows', () => {
  assert.deepEqual(reels(odoHTML('84%')), [8, 4]);
  assert.deepEqual(reels(odoHTML('100%')), [1, 0, 0]);
});

test('every reel carries all ten digits so any roll is possible', () => {
  const html = odoHTML('7');
  ODO_DIGITS.split('').forEach((d) => {
    assert.ok(html.includes('>' + d + '</span>'), 'reel is missing ' + d);
  });
});

test('a dash reading has nothing to roll and stays fixed', () => {
  const html = odoHTML('--');
  assert.equal((html.match(/odo__slot/g) || []).length, 0);
  assert.equal((html.match(/odo__fixed/g) || []).length, 2);
});

test('the fixed characters are escaped rather than injected', () => {
  assert.ok(odoHTML('<b>').includes('&lt;'));
  assert.ok(!odoHTML('<b>').includes('<b>'));
});

test('a zero reading is a real reel at position zero, not an absent one', () => {
  assert.deepEqual(reels(odoHTML('0%')), [0]);
});

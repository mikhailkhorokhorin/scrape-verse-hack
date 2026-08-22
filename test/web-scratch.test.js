'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const context = loadWebModule(
  ['config.js', 'format.js', 'value.js', 'received.js', 'scratch.js'],
  {
    document: { body: { classList: { add() {} }, dataset: {} }, getElementById: () => null,
      querySelectorAll: () => [], addEventListener() {} },
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: false }),
    sessionStorage: { getItem: () => null, setItem() {} },
    setTimeout,
    clearTimeout,
  }
);
const {
  scratchBrokenFields, scratchLineFor, scratchLinesOf, scratchColorFor,
  scratchRowsTop, scratchReduced, SCRATCH_ROW_H,
} = context;

const SPIDER = {
  fieldOrder: ['title', 'price', 'rating', 'image'],
  fields: { title: 'live', price: 'dead', rating: 'infected', image: 'live' },
  sample: { title: 'A Light in the Attic', price: null, rating: 'undefined', image: 'x.jpg' },
};

test('only the broken fields are worth digging for', () => {
  assert.deepEqual(scratchBrokenFields(SPIDER), ['price', 'rating']);
});

test('a spider with nothing broken offers nothing to reveal', () => {
  const whole = { fieldOrder: ['title'], fields: { title: 'live' }, sample: { title: 'x' } };
  assert.deepEqual(scratchBrokenFields(whole), []);
  assert.deepEqual(scratchLinesOf(whole), []);
});

test('the revealed line names the field and what it actually returned', () => {
  assert.equal(scratchLineFor(SPIDER, 'price'), 'price: null');
  assert.match(scratchLineFor(SPIDER, 'rating'), /^rating: /);
});

test('each line carries the state that decides its colour', () => {
  const lines = scratchLinesOf(SPIDER);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].state, 'dead');
  assert.equal(lines[1].state, 'infected');
});

test('dead reads critical red and infected reads violet, as the legend promises', () => {
  assert.equal(scratchColorFor('dead'), '#FF1E1E');
  assert.equal(scratchColorFor('infected'), '#C24BFF');
  assert.equal(scratchColorFor('live'), '#F4EFE4');
});

test('the rows sit inside the black, never above it', () => {
  const h = 500;
  const top = h * (1 - 0.8);
  const y = scratchRowsTop([{ text: 'a' }, { text: 'b' }], h, top);
  assert.ok(y > top, 'the first row starts below the top edge of the substance');
  assert.ok(y + 2 * SCRATCH_ROW_H < h, 'and the last row still fits above the base');
});

test('a single row is centred in the black rather than clinging to its top', () => {
  const h = 400;
  const top = 100;
  const y = scratchRowsTop([{ text: 'only' }], h, top);
  assert.ok(Math.abs(y - (top + (h - top) / 2)) < SCRATCH_ROW_H);
});

test('reduced motion is read from the media query, not assumed', () => {
  assert.equal(scratchReduced(), false);
});

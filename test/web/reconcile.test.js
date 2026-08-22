'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('../web-loader.js');

const context = loadWebModule(['reconcile.js']);
const { cellKeyOf, cellEntriesOf, reconcilePlan } = context;

function cell(cid, body) {
  return '<div class="cell cell--healthy" data-cid="' + cid + '">' + (body || '') + '</div>';
}

test('the key is read off the data-cid the cell wrapper carries', () => {
  assert.equal(cellKeyOf(cell('c_atlas')), 'c_atlas');
});

test('a cell with no stamp has no key', () => {
  assert.equal(cellKeyOf('<div class="cell cell--healthy">x</div>'), null);
});

test('a fail plate or any foreign markup has no key', () => {
  assert.equal(cellKeyOf('<div class="plate">history unreadable</div>'), null);
  assert.equal(cellKeyOf(''), null);
  assert.equal(cellKeyOf(null), null);
});

test('the status class may change without disturbing the key', () => {
  assert.equal(cellKeyOf('<div class="cell cell--critical" data-cid="c_atlas">x</div>'), 'c_atlas');
});

test('entries pair every cell with the key it was stamped with', () => {
  const entries = cellEntriesOf([cell('a'), cell('b')]);
  assert.deepEqual(plain(entries.map((e) => e.key)), ['a', 'b']);
  assert.equal(entries[0].html, cell('a'));
});

test('the first render has nothing to reconcile against and goes wholesale', () => {
  const plan = reconcilePlan([], cellEntriesOf([cell('a'), cell('b')]));
  assert.equal(plan.mode, 'wholesale');
  assert.deepEqual(plain(plan.writes), ['a', 'b']);
});

test('an unchanged fleet writes nothing at all', () => {
  const current = [{ key: 'a', html: cell('a', '1') }, { key: 'b', html: cell('b', '2') }];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a', '1'), cell('b', '2')]));
  assert.equal(plan.mode, 'reconcile');
  assert.deepEqual(plain(plan.writes), []);
});

test('one changed spider writes exactly its own cell and no other', () => {
  const current = [
    { key: 'a', html: cell('a', '1') },
    { key: 'b', html: cell('b', '2') },
    { key: 'c', html: cell('c', '3') },
  ];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a', '1'), cell('b', 'CHANGED'), cell('c', '3')]));
  assert.equal(plan.mode, 'reconcile');
  assert.deepEqual(plain(plan.writes), ['b']);
});

test('two changed spiders write two cells and still spare the third', () => {
  const current = [
    { key: 'a', html: cell('a', '1') },
    { key: 'b', html: cell('b', '2') },
    { key: 'c', html: cell('c', '3') },
  ];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a', 'X'), cell('b', '2'), cell('c', 'Y')]));
  assert.deepEqual(plain(plan.writes), ['a', 'c']);
});

test('a fleet that grew falls back to a wholesale write', () => {
  const current = [{ key: 'a', html: cell('a') }];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a'), cell('b')]));
  assert.equal(plan.mode, 'wholesale');
});

test('a fleet that shrank falls back to a wholesale write', () => {
  const current = [{ key: 'a', html: cell('a') }, { key: 'b', html: cell('b') }];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a')]));
  assert.equal(plan.mode, 'wholesale');
});

test('a reordered fleet goes wholesale rather than writing every cell in place', () => {
  const current = [{ key: 'a', html: cell('a') }, { key: 'b', html: cell('b') }];
  const plan = reconcilePlan(current, cellEntriesOf([cell('b'), cell('a')]));
  assert.equal(plan.mode, 'wholesale');
});

test('the empty state goes wholesale, because there is nothing keyed to keep', () => {
  assert.equal(reconcilePlan([{ key: 'a', html: cell('a') }], []).mode, 'wholesale');
  assert.equal(reconcilePlan([], []).mode, 'wholesale');
});

test('an unkeyed cell in the incoming markup forces wholesale', () => {
  const current = [{ key: 'a', html: cell('a') }];
  const plan = reconcilePlan(current, cellEntriesOf(['<div class="cell">no key</div>']));
  assert.equal(plan.mode, 'wholesale');
});

test('a cell the DOM never recorded markup for is treated as changed', () => {
  const current = [{ key: 'a', html: null }, { key: 'b', html: cell('b') }];
  const plan = reconcilePlan(current, cellEntriesOf([cell('a'), cell('b')]));
  assert.equal(plan.mode, 'reconcile');
  assert.deepEqual(plain(plan.writes), ['a']);
});

test('null inputs never throw and never claim a steady state', () => {
  assert.equal(reconcilePlan(null, null).mode, 'wholesale');
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../web-loader.js');

function withStore(store) {
  return loadWebModule(['config.js', 'heal.js'], {
    sessionStorage: store,
    document: { querySelectorAll: () => [], querySelector: () => null },
  });
}

function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

function refusingStore() {
  return {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
}

test('a collector never healed has no cooldown standing against it', () => {
  const ctx = withStore(memoryStore());
  assert.equal(ctx.healSentAt('c_a'), 0);
  assert.equal(ctx.healCooldownLeft('c_a'), 0);
});

test('sending a heal starts a two-hour cooldown for that collector alone', () => {
  const ctx = withStore(memoryStore());
  ctx.markHealSent('c_a');
  const left = ctx.healCooldownLeft('c_a');
  assert.ok(left > 0, 'the collector that was healed is cooling down');
  assert.ok(left <= ctx.HEAL_COOLDOWN_MS, 'and never longer than the full window');
  assert.equal(ctx.healCooldownLeft('c_b'), 0, 'another collector is untouched');
});

test('the cooldown has expired once the full window has passed', () => {
  const store = memoryStore();
  const ctx = withStore(store);
  store.setItem('thwip.heal.c_a', String(Date.now() - ctx.HEAL_COOLDOWN_MS - 1));
  assert.equal(ctx.healCooldownLeft('c_a'), 0);
});

test('storage that refuses to answer is read as no cooldown, not as a crash', () => {
  const ctx = withStore(refusingStore());
  assert.equal(ctx.healSentAt('c_a'), 0);
  assert.equal(ctx.healCooldownLeft('c_a'), 0);
  assert.doesNotThrow(() => ctx.markHealSent('c_a'));
});

test('a stored value that is not a number reads as never sent', () => {
  const store = memoryStore();
  store.setItem('thwip.heal.c_a', 'yesterday');
  const ctx = withStore(store);
  assert.equal(ctx.healSentAt('c_a'), 0);
});

test('with no endpoint configured the button does not render at all', () => {
  const ctx = withStore(memoryStore());
  assert.equal(ctx.HEAL_ENDPOINT, '');
  assert.equal(ctx.healButtonHTML({ cid: 'c_a', status: 'CRITICAL' }), '');
});

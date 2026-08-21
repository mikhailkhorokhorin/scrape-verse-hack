'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const lib = require('../scripts/lib.js');
const { heal } = require('../scripts/repair.js');

const COLLECTOR = {
  codename: 'BODEGA',
  collector_id: 'c_test',
  universe: 'shop.test',
  url: 'https://shop.test/',
  fields: {
    title: { type: 'string', min: 3, max: 200 },
    price: { type: 'number', min: 0.01 }
  }
};

const RUN = {
  universe: 'shop.test',
  fields_expected: ['title', 'price'],
  fields_live: ['title'],
  fields_infected: [],
  fields_dead: ['price'],
  sample: { title: 'Widget', price: null },
  integrity: 50
};

const GOOD_ROWS = JSON.stringify([{ title: 'Widget', price: '9.99' }]);
const DEAD_ROWS = JSON.stringify([{ title: 'Widget', price: null }]);

function withStubs({ bdata, onHistory = () => {} }, fn) {
  const realBdata = lib.bdata;
  const realAppend = lib.appendHistory;
  const realLog = console.log;
  const realError = console.error;
  lib.bdata = bdata;
  lib.appendHistory = onHistory;
  console.log = () => {};
  console.error = () => {};
  try { return fn(); }
  finally {
    lib.bdata = realBdata;
    lib.appendHistory = realAppend;
    console.log = realLog;
    console.error = realError;
  }
}

test('heal invokes the CLI twice: once to re-weave and once to verify', () => {
  const calls = [];
  withStubs({ bdata: (args) => { calls.push(args[1]); return GOOD_ROWS; } },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.deepEqual(calls, ['heal', 'run']);
});

test('heal passes the collector id to the re-weave command', () => {
  let healArgs = null;
  withStubs({ bdata: (args) => { if (args[1] === 'heal') healArgs = args; return GOOD_ROWS; } },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(healArgs[2], 'c_test');
});

test('heal sends the generated prompt to the re-weave command', () => {
  let healArgs = null;
  withStubs({ bdata: (args) => { if (args[1] === 'heal') healArgs = args; return GOOD_ROWS; } },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.match(healArgs[3], /'price' returns null/);
});

test('heal runs the re-weave unattended so no operator prompt can block it', () => {
  let healArgs = null;
  withStubs({ bdata: (args) => { if (args[1] === 'heal') healArgs = args; return GOOD_ROWS; } },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.ok(healArgs.includes('--auto-approve') && healArgs.includes('--auto-save'));
});

test('heal returns the verification record when the re-weave succeeds', () => {
  const after = withStubs({ bdata: () => GOOD_ROWS },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after.integrity, 100);
});

test('heal records the DIAGNOSED, REWEAVING and VERIFIED stages in order', () => {
  const stages = [];
  withStubs({ bdata: () => GOOD_ROWS }, () => heal(COLLECTOR, RUN, stages, 'RENAMED'));
  assert.deepEqual(stages.map((s) => s.stage), ['DIAGNOSED', 'REWEAVING', 'VERIFIED']);
});

test('heal appends the verification run to history flagged as post-heal', () => {
  let appended = null;
  withStubs({ bdata: () => GOOD_ROWS, onHistory: (r) => { appended = r; } },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(appended.after_heal, true);
});

test('heal returns null when the re-weave command itself fails', () => {
  const after = withStubs({
    bdata: (args) => {
      if (args[1] === 'heal') throw new Error('cli exploded');
      return GOOD_ROWS;
    }
  }, () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after, null);
});

test('heal does not reach the verification run when the re-weave fails', () => {
  const calls = [];
  withStubs({
    bdata: (args) => {
      calls.push(args[1]);
      throw new Error('cli exploded');
    }
  }, () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.deepEqual(calls, ['heal']);
});

test('heal marks no VERIFIED stage when the re-weave fails', () => {
  const stages = [];
  withStubs({
    bdata: (args) => {
      if (args[1] === 'heal') throw new Error('cli exploded');
      return GOOD_ROWS;
    }
  }, () => heal(COLLECTOR, RUN, stages, 'RENAMED'));
  assert.ok(!stages.some((s) => s.stage === 'VERIFIED'));
});

test('heal returns null when the verification run fails', () => {
  const after = withStubs({
    bdata: (args) => {
      if (args[1] === 'run') throw new Error('run failed');
      return '';
    }
  }, () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after, null);
});

test('heal returns null when the verification output has no parseable rows', () => {
  const after = withStubs({
    bdata: (args) => (args[1] === 'run' ? 'progress only, no json' : '')
  }, () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after, null);
});

test('heal returns null when the verification run yields an empty row set', () => {
  const after = withStubs({ bdata: (args) => (args[1] === 'run' ? '[]' : '') },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after, null);
});

test('heal reports the still-broken integrity when the re-weave did not fix the field', () => {
  const after = withStubs({ bdata: (args) => (args[1] === 'run' ? DEAD_ROWS : '') },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after.integrity, 50);
});

test('heal parses a verification payload wrapped in CLI progress noise', () => {
  const noisy = `⠋ running\r${GOOD_ROWS}\ndone`;
  const after = withStubs({ bdata: (args) => (args[1] === 'run' ? noisy : '') },
    () => heal(COLLECTOR, RUN, [], 'RENAMED'));
  assert.equal(after.integrity, 100);
});

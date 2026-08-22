'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const lib = require('../../scripts/lib.js');
const protocol = require('../../mcp/protocol.js');
const registry = require('../../mcp/registry.js');
const read = require('../../mcp/read-tools.js');
const actions = require('../../mcp/action-tools.js');
const server = require('../../mcp/server.js');

const ask = (message) => protocol.handleLine(JSON.stringify(message), registry);
const callTool = (name, args) =>
  ask({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const textOf = (response) => response.result.content[0].text;

const COLLECTORS = [{
  codename: 'BODEGA',
  collector_id: 'c_test',
  universe: 'shop.test',
  url: 'https://shop.test/',
  rows_per_run: 2,
  fields: { title: { type: 'string', min: 3, max: 200 }, price: { type: 'number', min: 0.01 } }
}];

const BROKEN_RUN = {
  collector_id: 'c_test', spider: 'BODEGA', universe: 'shop.test',
  ts: '2026-08-21T05:00:00.000Z',
  fields_expected: ['title', 'price'], fields_live: ['title'],
  fields_infected: [], fields_dead: ['price'],
  integrity: 50, status: 'CRITICAL', rows: 2,
  sample: { title: 'Widget', price: null }
};

const GOOD_ROWS = JSON.stringify([{ title: 'Widget', price: '9.99' }]);

function withFixtures(fixtures, fn) {
  const real = {
    collectors: lib.collectors, history: lib.history, incidents: lib.incidents,
    bdata: lib.bdata, appendHistory: lib.appendHistory, appendIncident: lib.appendIncident
  };
  lib.collectors = () => fixtures.collectors || [];
  lib.history = () => fixtures.history || [];
  lib.incidents = () => fixtures.incidents || [];
  lib.appendHistory = fixtures.appendHistory || (() => {});
  lib.appendIncident = fixtures.appendIncident || (() => {});
  if (fixtures.bdata) lib.bdata = fixtures.bdata;
  try { return fn(); }
  finally { Object.assign(lib, real); }
}

test('scan_fleet records a run from the mocked CLI payload', () => {
  const appended = [];
  const text = withFixtures({
    collectors: COLLECTORS, history: [], bdata: () => GOOD_ROWS,
    appendHistory: (r) => appended.push(r)
  }, () => textOf(callTool('scan_fleet', {})));
  assert.equal(appended.length, 1);
  assert.equal(appended[0].integrity, 100);
  assert.match(text, /1 runs recorded/);
});

test('scan_fleet sends a run command for the configured collector', () => {
  const calls = [];
  withFixtures({
    collectors: COLLECTORS, history: [],
    bdata: (args) => { calls.push(args); return GOOD_ROWS; }
  }, () => callTool('scan_fleet', {}));
  assert.equal(calls[0][1], 'run');
  assert.equal(calls[0][2], 'c_test');
});

test('scan_fleet reports a transport failure without throwing', () => {
  const response = withFixtures({
    collectors: COLLECTORS, history: [],
    bdata: () => { throw new Error('network down'); }
  }, () => callTool('scan_fleet', {}));
  assert.equal(response.result.isError, true);
  assert.match(textOf(response), /every scan failed/);
});

test('scan_fleet rejects an unknown spider before spending anything', () => {
  let called = false;
  const response = withFixtures({
    collectors: COLLECTORS, bdata: () => { called = true; return GOOD_ROWS; }
  }, () => callTool('scan_fleet', { spider: 'GHOST' }));
  assert.equal(response.result.isError, true);
  assert.equal(called, false);
});

test('heal_spider re-weaves a broken spider and opens an incident', () => {
  let opened = null;
  const text = withFixtures({
    collectors: COLLECTORS, history: [BROKEN_RUN], incidents: [],
    bdata: () => GOOD_ROWS, appendIncident: (i) => { opened = i; }
  }, () => textOf(callTool('heal_spider', { spider: 'BODEGA' })));
  assert.equal(opened.integrity_before, 50);
  assert.equal(opened.integrity_after, 100);
  assert.equal(opened.resolved, true);
  assert.match(text, /50% -> 100%/);
});

test('heal_spider keeps the collector_id stable across the repair', () => {
  let opened = null;
  withFixtures({
    collectors: COLLECTORS, history: [BROKEN_RUN], incidents: [],
    bdata: () => GOOD_ROWS, appendIncident: (i) => { opened = i; }
  }, () => callTool('heal_spider', { spider: 'BODEGA' }));
  assert.equal(opened.collector_id, 'c_test');
});

test('heal_spider issues the heal command before the verification run', () => {
  const calls = [];
  withFixtures({
    collectors: COLLECTORS, history: [BROKEN_RUN], incidents: [],
    bdata: (args) => { calls.push(args[1]); return GOOD_ROWS; }
  }, () => callTool('heal_spider', { spider: 'BODEGA' }));
  assert.deepEqual(calls, ['heal', 'run']);
});

test('heal_spider records all four stages in order', () => {
  let opened = null;
  withFixtures({
    collectors: COLLECTORS, history: [BROKEN_RUN], incidents: [],
    bdata: () => GOOD_ROWS, appendIncident: (i) => { opened = i; }
  }, () => callTool('heal_spider', { spider: 'BODEGA' }));
  assert.deepEqual(opened.stages.map((s) => s.stage),
    ['DETECTED', 'DIAGNOSED', 'REWEAVING', 'VERIFIED']);
});

test('heal_spider refuses a healthy spider unless forced', () => {
  let called = false;
  const healthy = { ...BROKEN_RUN, integrity: 100, status: 'HEALTHY', fields_dead: [] };
  const text = withFixtures({
    collectors: COLLECTORS, history: [healthy], incidents: [],
    bdata: () => { called = true; return GOOD_ROWS; }
  }, () => textOf(callTool('heal_spider', { spider: 'BODEGA' })));
  assert.equal(called, false);
  assert.match(text, /nothing to heal/);
});

test('heal_spider proceeds on a healthy spider when force is true', () => {
  let called = false;
  const healthy = { ...BROKEN_RUN, integrity: 100, status: 'HEALTHY', fields_dead: [] };
  withFixtures({
    collectors: COLLECTORS, history: [healthy], incidents: [],
    bdata: () => { called = true; return GOOD_ROWS; }
  }, () => callTool('heal_spider', { spider: 'BODEGA', force: true }));
  assert.equal(called, true);
});

test('heal_spider records an unresolved incident when the re-weave fails', () => {
  let opened = null;
  withFixtures({
    collectors: COLLECTORS, history: [BROKEN_RUN], incidents: [],
    bdata: () => { throw new Error('cli exploded'); },
    appendIncident: (i) => { opened = i; }
  }, () => callTool('heal_spider', { spider: 'BODEGA' }));
  assert.equal(opened.integrity_after, null);
  assert.equal(opened.resolved, false);
});

test('heal_spider refuses a spider that has never been scanned', () => {
  const response = withFixtures({ collectors: COLLECTORS, history: [], incidents: [] },
    () => callTool('heal_spider', { spider: 'BODEGA' }));
  assert.equal(response.result.isError, true);
  assert.match(textOf(response), /no recorded runs/);
});

test('the reader splits stdin into whole lines', () => {
  const seen = [];
  const read = server.createReader((line) => seen.push(line), () => {});
  read('{"a":1}\n{"b":');
  read('2}\n');
  assert.deepEqual(seen, ['{"a":1}', '{"b":2}']);
});

test('the reader tolerates several messages arriving in one chunk', () => {
  const seen = [];
  const read = server.createReader((line) => seen.push(line), () => {});
  read('one\ntwo\nthree\n');
  assert.equal(seen.length, 3);
});

test('ago renders a fresh timestamp in seconds', () => {
  const now = Date.now();
  assert.match(read.ago(new Date(now - 5000).toISOString(), now), /^5s ago$/);
});

test('ago renders an old timestamp in days', () => {
  const now = Date.now();
  assert.match(read.ago(new Date(now - 3 * 86400000).toISOString(), now), /^3d ago$/);
});

test('latestRunFor picks the newest run for the codename', () => {
  const runs = [BROKEN_RUN, { ...BROKEN_RUN, ts: '2026-08-22T05:00:00.000Z', integrity: 70 }];
  const found = withFixtures({ history: runs }, () => actions.latestRunFor('BODEGA'));
  assert.equal(found.integrity, 70);
});

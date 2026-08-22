'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const lib = require('../../scripts/lib.js');
const protocol = require('../../mcp/protocol.js');
const registry = require('../../mcp/registry.js');

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

test('initialize returns the protocol version and server info', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.equal(response.result.protocolVersion, protocol.PROTOCOL_VERSION);
  assert.equal(response.result.serverInfo.name, 'thwip');
});

test('initialize advertises the tools capability', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.ok(response.result.capabilities.tools);
});

test('initialize falls back to the newest supported version for an unknown one', () => {
  const response = ask({
    jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1.0.0' }
  });
  assert.equal(response.result.protocolVersion, protocol.PROTOCOL_VERSION);
});

test('initialize survives params with no protocolVersion at all', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.equal(response.result.protocolVersion, protocol.PROTOCOL_VERSION);
});

test('initialize survives a request with no params member', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.equal(response.result.serverInfo.name, 'thwip');
});

test('every advertised protocol version negotiates to itself', () => {
  for (const version of protocol.SUPPORTED_VERSIONS) {
    assert.equal(protocol.negotiateVersion(version), version, `${version} must round-trip`);
  }
});

test('every response carries the jsonrpc version and the request id', () => {
  const response = ask({ jsonrpc: '2.0', id: 'abc', method: 'ping' });
  assert.equal(response.jsonrpc, '2.0');
  assert.equal(response.id, 'abc');
});

test('notifications produce no response', () => {
  assert.equal(ask({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('tools/list exposes all eight fleet tools', () => {
  const names = ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools
    .map((tool) => tool.name);
  assert.deepEqual(names.sort(), ['evidence_report', 'fleet_status', 'heal_receipt',
    'heal_spider', 'incident_log', 'numbers_audit', 'scan_fleet', 'spider_history']);
});

test('every listed tool carries a description and an object input schema', () => {
  for (const tool of ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools) {
    assert.ok(tool.description.length > 20, `${tool.name} needs a real description`);
    assert.equal(tool.inputSchema.type, 'object', `${tool.name} schema must be an object`);
  }
});

test('spider_history and heal_receipt mark their required arguments', () => {
  const byName = Object.fromEntries(
    ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools
      .map((tool) => [tool.name, tool.inputSchema]));
  assert.deepEqual(byName.spider_history.required, ['spider']);
  assert.deepEqual(byName.heal_receipt.required, ['incident_id']);
});

test('the credit-spending tools warn about real cost in their descriptions', () => {
  const byName = Object.fromEntries(
    ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools
      .map((tool) => [tool.name, tool.description]));
  assert.match(byName.scan_fleet, /real Bright Data credits/);
  assert.match(byName.heal_spider, /real Bright Data credits/);
});

test('the read-only tools do not claim to spend credits', () => {
  const byName = Object.fromEntries(
    ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' }).result.tools
      .map((tool) => [tool.name, tool.description]));
  for (const name of ['fleet_status', 'spider_history', 'incident_log', 'heal_receipt']) {
    assert.doesNotMatch(byName[name], /credits/, `${name} must read as free`);
  }
});

test('malformed JSON gets a parse error rather than a crash', () => {
  const response = protocol.handleLine('{not json', registry);
  assert.equal(response.error.code, protocol.PARSE_ERROR);
});

test('a missing jsonrpc version is an invalid request', () => {
  const response = ask({ id: 1, method: 'ping' });
  assert.equal(response.error.code, protocol.INVALID_REQUEST);
});

test('an unknown method returns method not found', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'resources/list' });
  assert.equal(response.error.code, protocol.METHOD_NOT_FOUND);
});

test('calling an unknown tool is an invalid params error', () => {
  const response = callTool('teleport_spider', {});
  assert.equal(response.error.code, protocol.INVALID_PARAMS);
});

test('batch requests are rejected without crashing', () => {
  const response = protocol.handleLine('[{"jsonrpc":"2.0","id":1,"method":"ping"}]', registry);
  assert.equal(response.error.code, protocol.INVALID_REQUEST);
});

test('blank input lines are ignored', () => {
  assert.equal(protocol.handleLine('   ', registry), null);
});

test('a failing tool reports isError instead of a transport error', () => {
  const response = withFixtures({ collectors: COLLECTORS },
    () => callTool('spider_history', { spider: 'GHOST' }));
  assert.equal(response.result.isError, true);
  assert.match(textOf(response), /unknown spider/i);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const protocol = require('../mcp/protocol.js');
const registry = require('../mcp/registry.js');
const server = require('../mcp/server.js');

const APP = path.join(__dirname, '..');
const SERVER = path.join(APP, 'mcp', 'server.js');
const TIMEOUT = 15000;

const ask = (message) => protocol.handleLine(JSON.stringify(message), registry);

function client() {
  const child = spawn(process.execPath, [SERVER], { cwd: APP, stdio: 'pipe' });
  const lines = [];
  const waiters = [];
  let stderr = '';
  let buffer = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let index = buffer.indexOf('\n');
    while (index !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (line.trim()) {
        lines.push(line);
        const waiter = waiters.shift();
        if (waiter) waiter(line);
      }
      index = buffer.indexOf('\n');
    }
  });

  let received = 0;

  const next = () => new Promise((resolve, reject) => {
    if (lines.length > received) return resolve(lines[received++]);
    let settled = false;
    setTimeout(() => {
      if (!settled) reject(new Error('timed out waiting for a response'));
    }, TIMEOUT).unref();
    waiters.push((line) => { settled = true; received++; resolve(line); });
  });

  return {
    raw: (text) => child.stdin.write(text),
    send: (message) => child.stdin.write(JSON.stringify(message) + '\n'),
    nextMessage: async () => JSON.parse(await next()),
    stderr: () => stderr,
    allLines: () => lines.slice(),
    close: () => new Promise((resolve) => {
      child.on('close', resolve);
      child.stdin.end();
    })
  };
}

const INIT = (version) => ({
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: version,
    capabilities: { roots: { listChanged: true }, sampling: {} },
    clientInfo: { name: 'claude-code', version: '2.0.0' }
  }
});

test('initialize echoes back the 2025-06-18 version a modern client asks for', async () => {
  const mcp = client();
  mcp.send(INIT('2025-06-18'));
  const response = await mcp.nextMessage();
  assert.equal(response.result.protocolVersion, '2025-06-18');
  await mcp.close();
});

test('initialize echoes the legacy 2024-11-05 version rather than forcing a newer one', async () => {
  const mcp = client();
  mcp.send(INIT('2024-11-05'));
  assert.equal((await mcp.nextMessage()).result.protocolVersion, '2024-11-05');
  await mcp.close();
});

test('the notifications/initialized notification draws no response and no crash', async () => {
  const mcp = client();
  mcp.send(INIT('2025-06-18'));
  await mcp.nextMessage();
  mcp.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  mcp.send({ jsonrpc: '2.0', id: 7, method: 'ping' });
  const response = await mcp.nextMessage();
  assert.equal(response.id, 7, 'the ping reply must not be preceded by a notification reply');
  await mcp.close();
});

test('an unknown notification is also answered with silence', () => {
  assert.equal(ask({ jsonrpc: '2.0', method: 'notifications/cancelled' }), null);
});

test('a notifications/ method carrying an id still gets a reply so the client never hangs', () => {
  const response = ask({ jsonrpc: '2.0', id: 4, method: 'notifications/cancelled' });
  assert.equal(response.id, 4);
  assert.equal(response.error.code, protocol.METHOD_NOT_FOUND);
});

test('tools/list tolerates a cursor parameter it does not paginate on', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { cursor: 'abc' } });
  assert.equal(response.result.tools.length, 6);
});

test('tools/list works with no params member', () => {
  const response = ask({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.equal(response.result.tools.length, 6);
});

test('resources/list and prompts/list report method-not-found, matching the capabilities', () => {
  for (const method of ['resources/list', 'prompts/list', 'resources/templates/list']) {
    const response = ask({ jsonrpc: '2.0', id: 1, method });
    assert.equal(response.error.code, protocol.METHOD_NOT_FOUND, `${method} must be -32601`);
  }
});

test('the server declares no resources or prompts capability it cannot serve', () => {
  const capabilities = protocol.initializeResult({}).capabilities;
  assert.ok(capabilities.tools);
  assert.equal(capabilities.resources, undefined);
  assert.equal(capabilities.prompts, undefined);
});

test('ping answers with an empty result', () => {
  const response = ask({ jsonrpc: '2.0', id: 'p', method: 'ping' });
  assert.deepEqual(response.result, {});
});

test('three requests written as one chunk all get answered in order', async () => {
  const mcp = client();
  mcp.raw(
    JSON.stringify(INIT('2025-06-18')) + '\n' +
    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n' +
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }) + '\n');
  const ids = [
    (await mcp.nextMessage()).id,
    (await mcp.nextMessage()).id,
    (await mcp.nextMessage()).id
  ];
  assert.deepEqual(ids, [0, 1, 2]);
  await mcp.close();
});

test('a chunk split mid-message loses nothing', async () => {
  const mcp = client();
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 11, method: 'ping' }) + '\n';
  mcp.raw(payload.slice(0, 12));
  mcp.raw(payload.slice(12));
  assert.equal((await mcp.nextMessage()).id, 11);
  await mcp.close();
});

test('a megabyte of junk gets one parse error and does not kill the server', async () => {
  const mcp = client();
  mcp.raw('x'.repeat(1024 * 1024 + 64) + '\n');
  const bad = await mcp.nextMessage();
  assert.equal(bad.error.code, protocol.PARSE_ERROR);
  mcp.send({ jsonrpc: '2.0', id: 5, method: 'ping' });
  assert.equal((await mcp.nextMessage()).id, 5, 'the server must still answer afterwards');
  await mcp.close();
});

test('a line past the hard cap is discarded whole rather than parsed as fragments', () => {
  const seen = [];
  let overflows = 0;
  const read = server.createReader((line) => seen.push(line), () => { overflows++; });
  read('x'.repeat(server.MAX_LINE_BYTES + 1024));
  read('trailing-garbage\n');
  read('{"jsonrpc":"2.0","id":1,"method":"ping"}\n');
  assert.equal(overflows, 1, 'exactly one overflow report');
  assert.deepEqual(seen, ['{"jsonrpc":"2.0","id":1,"method":"ping"}']);
});

test('an oversized line spanning many chunks reports overflow only once', () => {
  const seen = [];
  let overflows = 0;
  const read = server.createReader((line) => seen.push(line), () => { overflows++; });
  for (let i = 0; i < 4; i++) read('y'.repeat(server.MAX_LINE_BYTES));
  read('\n{"ok":1}\n');
  assert.equal(overflows, 1);
  assert.deepEqual(seen, ['{"ok":1}']);
});

test('tools/call with no arguments member works for the zero-argument tool', async () => {
  const mcp = client();
  mcp.send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'fleet_status' } });
  const response = await mcp.nextMessage();
  assert.equal(response.id, 3);
  assert.equal(response.result.content[0].type, 'text');
  assert.ok(!response.error);
  await mcp.close();
});

test('two tools/call requests come back matched to their own ids', async () => {
  const mcp = client();
  mcp.send({ jsonrpc: '2.0', id: 'a', method: 'tools/call', params: { name: 'fleet_status' } });
  mcp.send({ jsonrpc: '2.0', id: 'b', method: 'tools/list' });
  const first = await mcp.nextMessage();
  const second = await mcp.nextMessage();
  assert.equal(first.id, 'a');
  assert.ok(first.result.content, 'id a is the fleet_status reply');
  assert.equal(second.id, 'b');
  assert.ok(second.result.tools, 'id b is the tools/list reply');
  await mcp.close();
});

test('a full handshake writes nothing but JSON-RPC to stdout and nothing to stderr', async () => {
  const mcp = client();
  mcp.send(INIT('2025-06-18'));
  await mcp.nextMessage();
  mcp.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  mcp.send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  await mcp.nextMessage();
  mcp.send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'fleet_status' } });
  await mcp.nextMessage();
  await mcp.close();
  for (const line of mcp.allLines()) {
    const parsed = JSON.parse(line);
    assert.equal(parsed.jsonrpc, '2.0', 'every stdout line is a JSON-RPC message');
  }
  assert.equal(mcp.stderr(), '', 'a clean handshake must leave stderr silent');
});

test('the server exits cleanly when the client closes stdin', async () => {
  const mcp = client();
  mcp.send({ jsonrpc: '2.0', id: 1, method: 'ping' });
  await mcp.nextMessage();
  assert.equal(await mcp.close(), 0);
});

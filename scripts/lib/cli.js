'use strict';

const { execFileSync } = require('child_process');

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const MAX_ROWS = 5000;
const MAX_PAYLOAD_BYTES = 24 * 1024 * 1024;

const WINDOWS = process.platform === 'win32';
const CLI = ['-y', '-p', '@brightdata/cli', 'bdata'];

function bdata(args, { timeout = 20 * 60 * 1000 } = {}) {
  const command = WINDOWS ? 'cmd' : 'npx';
  const argv = WINDOWS ? ['/c', 'npx', ...CLI, ...args] : [...CLI, ...args];
  return execFileSync(command, argv, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 32 * 1024 * 1024,
    env: process.env
  });
}

function nestedRows(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const arrays = Object.values(row)
    .filter((v) => Array.isArray(v) && v.length && v.every((e) => e && typeof e === 'object' && !Array.isArray(e)));
  return arrays.length === 1 ? arrays[0] : null;
}

function pageOf(row) {
  for (const v of Object.values(row)) {
    if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
  }
  return null;
}

function samePage(a, b) {
  const norm = (u) => u.split(/[?#]/)[0].replace(/index\.html$/, '').replace(/\/+$/, '');
  return norm(a) === norm(b);
}

function rowsOf(payload, url) {
  const cap = (a) => a.slice(0, MAX_ROWS);
  if (Array.isArray(payload)) {
    let batch = payload;
    if (url && batch.length > 1 && batch.every(nestedRows)) {
      const own = batch.filter((row) => {
        const page = pageOf(row);
        return page !== null && samePage(page, url);
      });
      if (own.length) batch = own;
    }
    if (batch.length === 1) {
      const inner = nestedRows(batch[0]);
      if (inner) return cap(inner);
    }
    if (batch.length > 1) {
      const unwrapped = batch.map(nestedRows);
      if (unwrapped.every(Boolean)) {
        const joined = [].concat(...unwrapped);
        const solid = joined.filter((r) => r && typeof r === 'object' && Object.keys(r).length);
        return cap(solid.length && solid.length < joined.length ? solid : joined);
      }
    }
    return cap(batch);
  }
  if (payload && typeof payload === 'object') {
    for (const key of ['data', 'records', 'results', 'items', 'rows', 'output']) {
      if (has(payload, key) && Array.isArray(payload[key])) return cap(payload[key]);
    }
    const nested = Object.values(payload)
      .find((v) => Array.isArray(v) && v.length && v.every((e) => e && typeof e === 'object'));
    if (nested) return cap(nested);
  }
  return [payload];
}

function parsePayload(raw) {
  if (typeof raw !== 'string') throw new Error('CLI output is not text');
  if (raw.length > MAX_PAYLOAD_BYTES) {
    throw new Error(`CLI output too large (${raw.length} bytes) — refusing to parse`);
  }
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('no JSON in CLI output');
  const open = raw[start];
  const close = open === '[' ? ']' : '}';
  const end = raw.lastIndexOf(close);
  if (end <= start) throw new Error('unterminated JSON in CLI output');
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    throw new Error(`CLI output is not valid JSON: ${err.message}`);
  }
}

module.exports = { MAX_ROWS, MAX_PAYLOAD_BYTES, bdata, rowsOf, parsePayload };

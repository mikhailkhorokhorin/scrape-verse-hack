'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HISTORY = path.join(ROOT, 'data', 'history.json');
const INCIDENTS = path.join(ROOT, 'data', 'incidents.json');
const CONFIG = path.join(ROOT, 'collectors.json');

const MAX_HISTORY = 2000;
const MAX_ROWS = 5000;
const MAX_PAYLOAD_BYTES = 24 * 1024 * 1024;
const HEALTHY_MIN = 90;
const DEGRADED_MIN = 60;
const INFECTED_CREDIT = 0.5;

const readJSON = (p, fallback) => {
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); }
  catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
  try { return JSON.parse(raw); }
  catch (err) {
    throw new Error(`${p} exists but is not valid JSON — refusing to overwrite it: ${err.message}`);
  }
};

const writeJSON = (p, data) => {
  const tmp = `${p}.${process.pid}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, JSON.stringify(data, null, 2) + '\n');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, p);
};

const collectors = () => readJSON(CONFIG, { collectors: [] }).collectors;
const history = () => readJSON(HISTORY, []);
const incidents = () => readJSON(INCIDENTS, []);

const appendHistory = (record) => {
  const all = history();
  all.push(record);
  writeJSON(HISTORY, all.slice(-MAX_HISTORY));
};

const nextIncidentId = (existing) => {
  const used = new Set(existing.map((inc) => inc && inc.id));
  let n = existing.length + 1;
  while (used.has(`inc_${String(n).padStart(3, '0')}`)) n += 1;
  return `inc_${String(n).padStart(3, '0')}`;
};

const appendIncident = (record) => {
  const all = incidents();
  all.push({ ...record, id: record.id || nextIncidentId(all) });
  writeJSON(INCIDENTS, all);
};

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

function classify(value, rule) {
  if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) return 'dead';

  const s = String(value).trim();
  if (!s || /^(null|undefined|NaN)$/i.test(s)) return 'infected';

  switch (rule.type) {
    case 'number': {
      const n = rule.words && WORDS[s.split(/\s+/).pop().toLowerCase()] !== undefined
        ? WORDS[s.split(/\s+/).pop().toLowerCase()]
        : Number(s.replace(/[^0-9.\-]/g, ''));
      if (!Number.isFinite(n)) return 'infected';
      if (rule.min !== undefined && n < rule.min) return 'infected';
      if (rule.max !== undefined && n > rule.max) return 'infected';
      return 'live';
    }
    case 'url': {
      try {
        const u = new URL(s, 'https://example.invalid');
        if (!/^https?:$/.test(u.protocol)) return 'infected';
        if (!/^https?:\/\//i.test(s)) return 'infected';
        return 'live';
      } catch { return 'infected'; }
    }
    case 'string':
    default: {
      if (rule.min !== undefined && s.length < rule.min) return 'infected';
      if (rule.max !== undefined && s.length > rule.max) return 'infected';
      return 'live';
    }
  }
}

function integrityOf(states) {
  const values = Object.values(states);
  if (!values.length) return 0;
  const live = values.filter((state) => state === 'live').length;
  const infected = values.filter((state) => state === 'infected').length;
  return Math.round(((live + INFECTED_CREDIT * infected) / values.length) * 100);
}

const statusOf = (integrity) =>
  integrity >= HEALTHY_MIN ? 'HEALTHY' : integrity >= DEGRADED_MIN ? 'DEGRADED' : 'CRITICAL';

function dominantState(rows, field, rule) {
  const tally = { live: 0, infected: 0, dead: 0 };
  for (const row of rows) tally[classify(row?.[field], rule)]++;
  return Object.keys(tally).reduce((a, b) => (tally[a] >= tally[b] ? a : b));
}

function fieldStates(rows, fields) {
  const states = {};
  for (const field of Object.keys(fields)) {
    states[field] = dominantState(rows, field, fields[field]);
  }
  return states;
}

function partitionByState(states) {
  const of = (wanted) => Object.keys(states).filter((field) => states[field] === wanted);
  return { fields_live: of('live'), fields_infected: of('infected'), fields_dead: of('dead') };
}

function runRecord(collector, rows) {
  const states = fieldStates(rows, collector.fields);
  const integrity = integrityOf(states);
  return {
    collector_id: collector.collector_id,
    spider: collector.codename,
    universe: collector.universe,
    ts: new Date().toISOString(),
    fields_expected: Object.keys(collector.fields),
    ...partitionByState(states),
    integrity,
    status: statusOf(integrity),
    rows: rows.length,
    sample: Object.fromEntries(
      Object.keys(collector.fields).map((field) => [field, rows[0]?.[field] ?? null]))
  };
}

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

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function rowsOf(payload) {
  const cap = (a) => a.slice(0, MAX_ROWS);
  if (Array.isArray(payload)) return cap(payload);
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

module.exports = {
  ROOT, HISTORY, INCIDENTS, CONFIG,
  HEALTHY_MIN, DEGRADED_MIN,
  readJSON, writeJSON, collectors, history, incidents,
  appendHistory, appendIncident,
  classify, integrityOf, statusOf,
  fieldStates, partitionByState, runRecord,
  bdata, parsePayload, rowsOf
};

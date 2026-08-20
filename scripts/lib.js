'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HISTORY = path.join(ROOT, 'data', 'history.json');
const INCIDENTS = path.join(ROOT, 'data', 'incidents.json');
const CONFIG = path.join(ROOT, 'collectors.json');

// Keep history bounded. 3 collectors x 48 scans/day fills up faster than it looks,
// and the console fetches the whole file on every load.
const MAX_HISTORY = 2000;

const readJSON = (p, fallback) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
};

const writeJSON = (p, data) =>
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');

const collectors = () => readJSON(CONFIG, { collectors: [] }).collectors;
const history = () => readJSON(HISTORY, []);
const incidents = () => readJSON(INCIDENTS, []);

const appendHistory = (record) => {
  const all = history();
  all.push(record);
  writeJSON(HISTORY, all.slice(-MAX_HISTORY));
};

const appendIncident = (record) => {
  const all = incidents();
  all.push(record);
  writeJSON(INCIDENTS, all);
};

// books.toscrape spells its rating in the CSS class: "star-rating Three".
// The field is populated and correct; only its notation is not a numeral.
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

/**
 * Classify one field value against its declared validator.
 * Three states, because two is not enough: a field that returns a wrong value
 * passes every null check and still poisons the pipeline.
 */
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
        // a relative path that resolved against the dummy base is a placeholder,
        // not a real image URL
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

/** Integrity weights infection at half credit: garbage is worse than correct,
 *  better than nothing — nothing at least fails loudly. */
function integrityOf(states) {
  const vals = Object.values(states);
  if (!vals.length) return 0;
  const live = vals.filter((s) => s === 'live').length;
  const inf = vals.filter((s) => s === 'infected').length;
  return Math.round(((live + 0.5 * inf) / vals.length) * 100);
}

const statusOf = (i) => (i >= 90 ? 'HEALTHY' : i >= 60 ? 'DEGRADED' : 'CRITICAL');

/** Run the CLI. Long by nature — create is 5-25 min, heal up to 15. Never retry here. */
function bdata(args, { timeout = 20 * 60 * 1000 } = {}) {
  return execFileSync('npx', ['-p', '@brightdata/cli', 'bdata', ...args], {
    encoding: 'utf8',
    timeout,
    maxBuffer: 32 * 1024 * 1024,
    env: process.env
  });
}

/** The CLI prints progress around the JSON; take the outermost array or object. */
function parsePayload(raw) {
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('no JSON in CLI output');
  const open = raw[start];
  const close = open === '[' ? ']' : '}';
  const end = raw.lastIndexOf(close);
  if (end <= start) throw new Error('unterminated JSON in CLI output');
  return JSON.parse(raw.slice(start, end + 1));
}

module.exports = {
  ROOT, HISTORY, INCIDENTS, CONFIG,
  readJSON, writeJSON, collectors, history, incidents,
  appendHistory, appendIncident,
  classify, integrityOf, statusOf, bdata, parsePayload
};

'use strict';

const { classify, unwrap } = require('./classify');
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const HEALTHY_MIN = 90;
const DEGRADED_MIN = 60;
const INFECTED_CREDIT = 0.5;


function integrityOf(states) {
  const values = Object.values(states);
  if (!values.length) return 0;
  const live = values.filter((state) => state === 'live').length;
  const infected = values.filter((state) => state === 'infected').length;
  return Math.round(((live + INFECTED_CREDIT * infected) / values.length) * 100);
}

const statusOf = (integrity) =>
  integrity >= HEALTHY_MIN ? 'HEALTHY' : integrity >= DEGRADED_MIN ? 'DEGRADED' : 'CRITICAL';

const FLATLINE_MIN_ROWS = 8;

const EMPTY_MARKERS = new Set(['0', '""', '"0"', '"-"', '"n/a"', '"none"']);

function isFlatlined(rows, field) {
  if (rows.length < FLATLINE_MIN_ROWS) return false;
  if (!has(rows[0] || {}, field)) return false;
  const first = JSON.stringify(unwrap(rows[0][field]));
  if (first === undefined || !EMPTY_MARKERS.has(first.toLowerCase())) return false;
  return rows.every((row) => JSON.stringify(unwrap(row?.[field])) === first);
}

function dominantState(rows, field, rule) {
  if (!rows.length) return 'dead';
  const tally = { live: 0, infected: 0, dead: 0 };
  for (const row of rows) tally[classify(row?.[field], rule)]++;
  const dominant = Object.keys(tally).reduce((a, b) => (tally[a] >= tally[b] ? a : b));
  if (dominant === 'live' && !rule.enumerated && isFlatlined(rows, field)) return 'infected';
  return dominant;
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
    rows_expected: collector.rows_per_run ?? null,
    sample: Object.fromEntries(
      Object.keys(collector.fields).map((field) => [field, rows[0]?.[field] ?? null]))
  };
}

module.exports = { HEALTHY_MIN, DEGRADED_MIN, INFECTED_CREDIT, integrityOf, statusOf, isFlatlined, dominantState, fieldStates, partitionByState, runRecord };

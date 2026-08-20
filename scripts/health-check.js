#!/usr/bin/env node
'use strict';

/**
 * Scan every collector, score it, append to data/history.json.
 *
 * Exit code is 0 even when Integrity is 0. A broken scraper is the thing this
 * project exists to observe — reporting it is success, not failure. Only a
 * transport or config problem is an error.
 */

const L = require('./lib.js');

function scan(c) {
  const expected = Object.keys(c.fields);
  const ts = new Date().toISOString();

  if (!c.collector_id) {
    console.log(`skip ${c.codename}: no collector_id yet (create it first)`);
    return null;
  }
  if (!c.url) {
    console.log(`skip ${c.codename}: no url in collectors.json`);
    return null;
  }

  let rows;
  try {
    rows = L.parsePayload(L.bdata(['scraper', 'run', c.collector_id, c.url, '--pretty']));
  } catch (err) {
    console.error(`${c.codename}: run failed — ${err.message.split('\n')[0]}`);
    return { transportError: true };
  }

  const list = L.rowsOf(rows);
  if (!list.length) {
    console.error(`${c.codename}: run returned no rows`);
    return { transportError: true };
  }

  // Score field by field across every row, then take the majority state.
  // One bad row out of twenty is noise; twelve out of twenty is a break.
  const states = {};
  for (const field of expected) {
    const tally = { live: 0, infected: 0, dead: 0 };
    for (const row of list) tally[L.classify(row?.[field], c.fields[field])]++;
    states[field] = Object.keys(tally).reduce((a, b) => (tally[a] >= tally[b] ? a : b));
  }

  const integrity = L.integrityOf(states);
  const pick = (s) => expected.filter((f) => states[f] === s);

  return {
    collector_id: c.collector_id,
    spider: c.codename,
    universe: c.universe,
    ts,
    fields_expected: expected,
    fields_live: pick('live'),
    fields_infected: pick('infected'),
    fields_dead: pick('dead'),
    integrity,
    status: L.statusOf(integrity),
    rows: list.length,
    sample: Object.fromEntries(expected.map((f) => [f, list[0]?.[f] ?? null]))
  };
}

function main() {
  const all = L.collectors();
  if (!all.length) {
    console.error('collectors.json is empty');
    process.exit(1);
  }

  let transportFailures = 0;

  for (const c of all) {
    const record = scan(c);
    if (!record) continue;
    if (record.transportError) { transportFailures++; continue; }

    L.appendHistory(record);
    const bad = [...record.fields_infected.map((f) => `${f}!`),
                 ...record.fields_dead.map((f) => `${f}x`)];
    console.log(
      `${record.spider.padEnd(9)} ${String(record.integrity).padStart(3)}%  ` +
      `${record.status.padEnd(8)} ${bad.length ? bad.join(' ') : 'all fields live'}`
    );
  }

  // Every collector unreachable means the CLI or the network is broken, not the sites.
  if (transportFailures && transportFailures === all.filter((c) => c.collector_id).length) {
    console.error('every collector failed to run — check auth and network');
    process.exit(1);
  }
}

main();

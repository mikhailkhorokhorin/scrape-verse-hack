#!/usr/bin/env node
'use strict';

const lib = require('./lib.js');

const TRANSPORT_ERROR = { transportError: true };

function firstLine(err) {
  return err.message.split('\n')[0];
}

function scan(collector) {
  if (!collector.collector_id) {
    console.log(`skip ${collector.codename}: no collector_id yet (create it first)`);
    return null;
  }
  if (!collector.url) {
    console.log(`skip ${collector.codename}: no url in collectors.json`);
    return null;
  }

  let payload;
  try {
    payload = lib.parsePayload(
      lib.bdata(['scraper', 'run', collector.collector_id, collector.url, '--pretty']));
  } catch (err) {
    console.error(`${collector.codename}: run failed — ${firstLine(err)}`);
    return TRANSPORT_ERROR;
  }

  const rows = lib.rowsOf(payload);
  if (!rows.length) {
    console.error(`${collector.codename}: run returned no rows`);
    return TRANSPORT_ERROR;
  }

  return lib.runRecord(collector, rows);
}

function summarise(record) {
  const failing = [
    ...record.fields_infected.map((field) => `${field}!`),
    ...record.fields_dead.map((field) => `${field}x`)
  ];
  return `${record.spider.padEnd(9)} ${String(record.integrity).padStart(3)}%  ` +
    `${record.status.padEnd(8)} ${failing.length ? failing.join(' ') : 'all fields live'}`;
}

function main() {
  const all = lib.collectors();
  if (!all.length) {
    console.error('collectors.json is empty');
    process.exit(1);
  }

  let transportFailures = 0;

  for (const collector of all) {
    const record = scan(collector);
    if (!record) continue;
    if (record === TRANSPORT_ERROR) {
      transportFailures++;
      continue;
    }

    lib.appendHistory(record);
    console.log(summarise(record));
  }

  const runnable = all.filter((collector) => collector.collector_id).length;
  if (transportFailures && transportFailures === runnable) {
    console.error('every collector failed to run — check auth and network');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { TRANSPORT_ERROR, firstLine, scan, summarise, main };

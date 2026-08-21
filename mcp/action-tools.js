'use strict';

const lib = require('../scripts/lib.js');
const healthCheck = require('../scripts/health-check.js');
const repair = require('../scripts/repair.js');
const { textContent } = require('./protocol.js');
const { requireCodename } = require('./read-tools.js');

function quiet(fn) {
  const realLog = console.log;
  const realError = console.error;
  console.log = () => {};
  console.error = () => {};
  try { return fn(); }
  finally {
    console.log = realLog;
    console.error = realError;
  }
}

function selectCollectors(args) {
  const all = lib.collectors();
  if (args.spider === undefined || args.spider === null) {
    return { chosen: all, codename: null };
  }
  const codename = requireCodename(args);
  const chosen = all.filter((collector) => collector.codename === codename);
  if (!chosen.length) {
    throw new Error(`unknown spider: ${codename}. ` +
      `Known spiders: ${all.map((c) => c.codename).join(', ')}`);
  }
  return { chosen, codename };
}

function scanFleet(args) {
  const { chosen, codename } = selectCollectors(args);
  if (!chosen.length) throw new Error('no collectors configured');

  const scanned = [];
  const skipped = [];
  const failed = [];

  quiet(() => {
    for (const collector of chosen) {
      const record = healthCheck.scan(collector);
      if (!record) {
        skipped.push(collector.codename);
        continue;
      }
      if (record === healthCheck.TRANSPORT_ERROR) {
        failed.push(collector.codename);
        continue;
      }
      lib.appendHistory(record);
      scanned.push(record);
    }
  });

  if (!scanned.length && !skipped.length && failed.length) {
    throw new Error(`every scan failed to run: ${failed.join(', ')}. Check auth and network.`);
  }

  const target = codename ? codename : 'the whole fleet';
  const lines = [`Scanned ${target}: ${scanned.length} runs recorded.`, ''];
  for (const record of scanned) lines.push(healthCheck.summarise(record));
  if (skipped.length) lines.push('', `skipped (not configured): ${skipped.join(', ')}`);
  if (failed.length) lines.push('', `failed to run: ${failed.join(', ')}`);
  lines.push('', 'These runs are now in history — call fleet_status for the current picture.');
  return textContent(lines.join('\n'));
}

function latestRunFor(codename) {
  const runs = lib.history().filter((run) => run && run.spider === codename);
  return runs.length ? runs[runs.length - 1] : null;
}

function healSpider(args) {
  const codename = requireCodename(args);
  const collector = lib.collectors().find((c) => c.codename === codename);
  if (!collector) {
    throw new Error(`unknown spider: ${codename}. ` +
      `Known spiders: ${lib.collectors().map((c) => c.codename).join(', ')}`);
  }
  if (!collector.collector_id) {
    throw new Error(`${codename} has no collector_id yet — it cannot be healed.`);
  }

  const run = latestRunFor(codename);
  if (!run) {
    throw new Error(`${codename} has no recorded runs — scan it before healing.`);
  }
  if (run.integrity >= repair.RESOLVED_AT && args.force !== true) {
    return textContent(
      `${codename} is at ${run.integrity}% (${run.status}) — nothing to heal.\n` +
      'Pass force=true to re-weave it anyway.');
  }

  const stages = [{ stage: 'DETECTED', ts: run.ts }];
  const openedAt = new Date().toISOString();
  const strain = repair.strainOf(run, collector);
  const after = quiet(() => repair.heal(collector, run, stages, strain));
  const recovered = after ? repair.recoveredFields(run, after) : [];

  const incidents = lib.incidents();
  const id = lib.nextIncidentId(incidents);

  lib.appendIncident({
    id,
    spider: collector.codename,
    collector_id: collector.collector_id,
    opened_at: openedAt,
    closed_at: after === null ? null : new Date().toISOString(),
    integrity_before: run.integrity,
    integrity_after: after === null ? null : after.integrity,
    anomalies: [...run.fields_dead, ...run.fields_infected],
    recovered_fields: recovered,
    summary: repair.describe(run, after, recovered),
    rows_per_run: collector.rows_per_run,
    strain,
    heal_prompt: repair.buildPrompt(run, strain),
    resolved: after !== null && after.integrity >= repair.RESOLVED_AT,
    stages
  });

  const lines = [
    `${codename} heal attempt recorded as ${id}.`,
    `strain        ${strain}`,
    `collector_id  ${collector.collector_id} (unchanged)`,
    `integrity     ${run.integrity}% -> ` +
      `${after === null ? 'heal failed' : after.integrity + '%'}`
  ];
  if (recovered.length) lines.push(`recovered     ${recovered.join(', ')}`);
  lines.push('', repair.describe(run, after, recovered));
  lines.push('', `Call heal_receipt with incident_id=${id} for the timestamped proof.`);
  return textContent(lines.join('\n'));
}

module.exports = { quiet, selectCollectors, latestRunFor, scanFleet, healSpider };

'use strict';

const lib = require('../scripts/lib.js');
const { textContent } = require('./protocol.js');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function ago(ts, now) {
  const then = new Date(ts).getTime();
  if (!Number.isFinite(then)) return 'unknown';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 90) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function lastRunOf(history, codename) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i].spider === codename) return history[i];
  }
  return null;
}

function limitOf(args) {
  const raw = args.limit;
  if (raw === undefined || raw === null) return DEFAULT_LIMIT;
  const n = typeof raw === 'string' && raw.trim() ? Number(raw) : raw;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
    throw new Error('limit must be a positive integer');
  }
  return Math.min(n, MAX_LIMIT);
}

function requireCodename(args) {
  const raw = args.spider;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('spider is required and must be a codename string');
  }
  return raw.trim().toUpperCase();
}

function knownCodenames() {
  return lib.collectors().map((c) => c.codename);
}

function fieldLine(label, fields) {
  return fields.length ? `${label}: ${fields.join(', ')}` : null;
}

function statusBlock(collector, run, now) {
  if (!run) {
    return `${collector.codename} (${collector.universe})\n  never scanned`;
  }
  const lines = [
    `${collector.codename} (${collector.universe})`,
    `  integrity ${run.integrity}%  ${run.status}`,
    `  scanned ${ago(run.ts, now)} at ${run.ts}`,
    `  rows ${run.rows}`,
    `  collector_id ${run.collector_id}`
  ];
  const live = fieldLine('  live', run.fields_live || []);
  const infected = fieldLine('  infected', run.fields_infected || []);
  const dead = fieldLine('  dead', run.fields_dead || []);
  for (const line of [live, infected, dead]) if (line) lines.push(line);
  if (run.after_heal) lines.push('  this run was a post-heal verification');
  return lines.join('\n');
}

function fleetStatus() {
  const collectors = lib.collectors();
  if (!collectors.length) return textContent('No collectors configured.');
  const history = lib.history();
  const now = Date.now();
  const blocks = collectors.map((c) => statusBlock(c, lastRunOf(history, c.codename), now));
  const scanned = collectors
    .map((c) => lastRunOf(history, c.codename))
    .filter(Boolean);
  const critical = scanned.filter((r) => r.status === 'CRITICAL').length;
  const degraded = scanned.filter((r) => r.status === 'DEGRADED').length;
  const header = `THWIP fleet — ${collectors.length} spiders, ` +
    `${degraded} degraded, ${critical} critical`;
  return textContent(`${header}\n\n${blocks.join('\n\n')}`);
}

function runLine(run, now) {
  const failing = [
    ...(run.fields_infected || []).map((f) => `${f}!`),
    ...(run.fields_dead || []).map((f) => `${f}x`)
  ];
  return `${run.ts}  ${String(run.integrity).padStart(3)}%  ` +
    `${String(run.status).padEnd(8)} rows=${run.rows}  ` +
    `${failing.length ? failing.join(' ') : 'all fields live'}` +
    `${run.after_heal ? '  [post-heal]' : ''}` +
    `  (${ago(run.ts, now)})`;
}

function spiderHistory(args) {
  const codename = requireCodename(args);
  const known = knownCodenames();
  if (!known.includes(codename)) {
    throw new Error(`unknown spider: ${codename}. Known spiders: ${known.join(', ')}`);
  }
  const limit = limitOf(args);
  const runs = lib.history().filter((run) => run && run.spider === codename);
  if (!runs.length) return textContent(`${codename} has no recorded runs.`);
  const now = Date.now();
  const shown = runs.slice(-limit);
  const header = `${codename} — ${runs.length} runs recorded, showing last ${shown.length}`;
  return textContent(`${header}\n\n${shown.map((r) => runLine(r, now)).join('\n')}`);
}

function incidentBlock(incident) {
  const before = incident.integrity_before;
  const after = incident.integrity_after === null ? 'heal failed' : `${incident.integrity_after}%`;
  const lines = [
    `${incident.id}  ${incident.spider}  strain=${incident.strain}`,
    `  integrity ${before}% -> ${after}`,
    `  resolved: ${incident.resolved ? 'yes' : 'no'}`,
    `  opened ${incident.opened_at}`,
    `  closed ${incident.closed_at || 'still open'}`,
    `  stages: ${(incident.stages || []).map((s) => s.stage).join(' -> ') || 'none'}`
  ];
  if ((incident.anomalies || []).length) {
    lines.push(`  anomalies: ${incident.anomalies.join(', ')}`);
  }
  if ((incident.recovered_fields || []).length) {
    lines.push(`  recovered: ${incident.recovered_fields.join(', ')}`);
  }
  if (incident.summary) lines.push(`  ${incident.summary}`);
  return lines.join('\n');
}

function incidentLog(args) {
  let all = lib.incidents().filter(Boolean);
  if (args.spider !== undefined && args.spider !== null) {
    const codename = requireCodename(args);
    all = all.filter((incident) => incident.spider === codename);
    if (!all.length) return textContent(`No incidents recorded for ${codename}.`);
  }
  if (!all.length) return textContent('No incidents recorded.');
  const shown = all.slice(-limitOf(args));
  const header = `${all.length} incidents recorded, showing last ${shown.length}`;
  return textContent(`${header}\n\n${shown.map(incidentBlock).join('\n\n')}`);
}

function phaseRows(incident) {
  const stages = incident.stages || [];
  const rows = [];
  let previous = null;
  for (const stage of stages) {
    const at = new Date(stage.ts).getTime();
    const delta = previous !== null && Number.isFinite(at) && Number.isFinite(previous)
      ? `+${Math.round((at - previous) / 1000)}s`
      : '--';
    rows.push(`  ${String(stage.stage).padEnd(10)} ${stage.ts}  ${delta}`);
    if (Number.isFinite(at)) previous = at;
  }
  return rows;
}

function totalSeconds(incident) {
  const stages = incident.stages || [];
  if (stages.length < 2) return null;
  const first = new Date(stages[0].ts).getTime();
  const last = new Date(stages[stages.length - 1].ts).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  return Math.round((last - first) / 1000);
}

function healReceipt(args) {
  const id = typeof args.incident_id === 'string' ? args.incident_id.trim() : '';
  if (!id) throw new Error('incident_id is required and must be a string');
  const incident = lib.incidents().filter(Boolean).find((inc) => inc.id === id);
  if (!incident) {
    const known = lib.incidents().filter(Boolean).map((inc) => inc.id);
    throw new Error(`unknown incident_id: ${id}. Known ids: ${known.join(', ') || 'none'}`);
  }

  const seconds = totalSeconds(incident);
  const lines = [
    `HEAL RECEIPT ${incident.id}`,
    `spider        ${incident.spider}`,
    `collector_id  ${incident.collector_id}`,
    `strain        ${incident.strain}`,
    `integrity     ${incident.integrity_before}% -> ` +
      `${incident.integrity_after === null ? 'heal failed' : incident.integrity_after + '%'}`,
    `resolved      ${incident.resolved ? 'yes' : 'no'}`,
    '',
    'phases:',
    ...phaseRows(incident)
  ];
  if (seconds !== null) lines.push('', `total ${seconds}s from detection to verification`);
  lines.push('',
    `The collector_id never changed: ${incident.collector_id} was re-woven in place, ` +
    'not replaced. Downstream consumers kept the same endpoint throughout.');
  if (incident.heal_prompt) lines.push('', `heal prompt sent:\n  ${incident.heal_prompt}`);
  return textContent(lines.join('\n'));
}

module.exports = {
  DEFAULT_LIMIT, MAX_LIMIT,
  ago, lastRunOf, limitOf, requireCodename, statusBlock, runLine,
  incidentBlock, phaseRows, totalSeconds,
  fleetStatus, spiderHistory, incidentLog, healReceipt
};

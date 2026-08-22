'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(ROOT, 'evidence');

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function digestOfRecord(record) {
  return sha256(JSON.stringify(record));
}

function digestOfFile(file) {
  return sha256(fs.readFileSync(file, 'utf8'));
}

function readIncidents() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'incidents.json'), 'utf8'))
    .filter(Boolean);
}

function evidenceFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function mentionsCollector(file, collectorId) {
  try {
    return fs.readFileSync(file, 'utf8').includes(collectorId);
  } catch {
    return false;
  }
}

function evidenceFor(incident, dir) {
  const prefix = String(incident.spider || '').toLowerCase() + '-';
  return evidenceFiles(dir)
    .filter((name) => name.startsWith(prefix) ||
      mentionsCollector(path.join(dir, name), incident.collector_id))
    .map((name) => ({
      file: path.posix.join('evidence', name),
      bytes: fs.statSync(path.join(dir, name)).size,
      sha256: digestOfFile(path.join(dir, name))
    }));
}

function timeline(incident) {
  const stages = Array.isArray(incident.stages) ? incident.stages : [];
  let previous = null;
  const rows = stages.map((stage) => {
    const at = Date.parse(stage.ts);
    const valid = Number.isFinite(at);
    const seconds = valid && previous !== null ? Math.round((at - previous) / 1000) : null;
    if (valid) previous = at;
    return { stage: stage.stage, ts: stage.ts, since_previous_seconds: seconds };
  });
  const first = stages.length ? Date.parse(stages[0].ts) : NaN;
  const last = stages.length ? Date.parse(stages[stages.length - 1].ts) : NaN;
  const total = Number.isFinite(first) && Number.isFinite(last)
    ? Math.round((last - first) / 1000)
    : null;
  return { rows, total_seconds: total };
}

function fieldRows(incident) {
  const checks = incident.verification && Array.isArray(incident.verification.checks)
    ? incident.verification.checks
    : [];
  return checks.map((check) => ({
    field: check.field,
    state_before: check.from,
    state_after: check.to === null || check.to === undefined ? 'not checked' : check.to,
    value_before: check.received_before === undefined ? null : check.received_before,
    value_after: check.received_after === undefined ? null : check.received_after,
    passed: check.passed === true
  }));
}

function assertIdUnchanged(incident) {
  const before = incident.collector_id;
  const after = incident.verification && incident.verification.collector_id_after !== undefined
    ? incident.verification.collector_id_after
    : before;
  if (typeof before !== 'string' || !before) {
    throw new Error(`${incident.id}: collector_id is missing — cannot prove the scraper was re-woven in place`);
  }
  if (before !== after) {
    throw new Error(`${incident.id}: collector_id changed ${before} -> ${after} — the scraper was replaced, not re-woven`);
  }
  return before;
}

function reportFor(incident, dir) {
  const collectorId = assertIdUnchanged(incident);
  const verification = incident.verification || {};
  return {
    id: incident.id,
    spider: incident.spider,
    strain: incident.strain || null,
    collector_id_before: collectorId,
    collector_id_after: collectorId,
    collector_id_unchanged: true,
    integrity_before: incident.integrity_before,
    integrity_after: incident.integrity_after === undefined ? null : incident.integrity_after,
    opened_at: incident.opened_at,
    closed_at: incident.closed_at || null,
    timeline: timeline(incident),
    fields: fieldRows(incident),
    verdict: verification.verdict || 'NOT_RUN',
    checked: verification.checked === undefined ? 0 : verification.checked,
    passed: verification.passed === undefined ? 0 : verification.passed,
    resolved: incident.resolved === true,
    backfilled: verification.backfilled === true,
    record_sha256: digestOfRecord(incident),
    evidence_files: evidenceFor(incident, dir || EVIDENCE_DIR)
  };
}

function reports(ids, incidents, dir) {
  const all = incidents || readIncidents();
  const wanted = ids && ids.length ? ids : all.map((incident) => incident.id);
  return wanted.map((id) => {
    const incident = all.find((one) => one.id === id);
    if (!incident) {
      const known = all.map((one) => one.id).join(', ') || 'none';
      throw new Error(`unknown incident id: ${id}. Known ids: ${known}`);
    }
    return reportFor(incident, dir);
  });
}

module.exports = {
  ROOT, EVIDENCE_DIR,
  sha256, digestOfRecord, digestOfFile, readIncidents, evidenceFiles,
  mentionsCollector, evidenceFor, timeline, fieldRows, assertIdUnchanged,
  reportFor, reports
};

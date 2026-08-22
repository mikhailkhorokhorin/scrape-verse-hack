'use strict';

const { textContent } = require('./protocol.js');
const evidence = require('../tools/evidence-lib.js');
const report = require('../tools/evidence-report.js');
const numbers = require('../tools/numbers-audit.js');

function requestedIds(args) {
  const raw = args.incident_id;
  if (raw === undefined || raw === null) return [];
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('incident_id must be a non-empty string');
  }
  return [raw.trim()];
}

function evidenceReport(args) {
  const list = evidence.reports(requestedIds(args || {}));
  if (!list.length) return textContent('No incidents recorded.');
  const header = `EVIDENCE TRAIL — ${list.length} incident${list.length === 1 ? '' : 's'}, ` +
    'every digest recomputed from the committed files at call time';
  return textContent(`${header}\n\n${report.renderAll(list)}`);
}

const LABEL = {
  scans: 'scans recorded in history.json',
  rows: 'rows extracted across every scan',
  collectors: 'distinct collector_ids scanned',
  incidents: 'incidents recorded in incidents.json',
  spidersBroken: 'distinct spiders that have broken',
  heals: 'incidents whose verification resolved them',
  unchangedIds: 'every incident kept its collector_id',
  mttrMinutes: 'mean minutes from detection to verification',
  spanHours: 'hours between the first break and the last close',
  firstBreakDay: 'day of the first recorded break',
  overnightScans: 'scans that ran before 06:00 UTC, unattended',
  overnightRows: 'rows extracted before 06:00 UTC, unattended',
  metaTests: 'tests recorded in meta.json',
  metaHasHumanGap: 'meta.json records the last human touch',
  verificationsPresent: 'incidents carrying a per-field verification'
};

function auditLines(truth) {
  return Object.keys(truth).map((key) => {
    const value = truth[key] === null ? 'none' : String(truth[key]);
    return `  ${value.padStart(12)}  ${LABEL[key] || key}`;
  });
}

function numbersAudit() {
  const truth = numbers.truth();
  const lines = [
    'NUMBERS AUDIT — every number the THWIP console shows, recomputed here from the',
    'committed JSON in data/. Nothing is cached and nothing is hand-written.',
    '',
    ...auditLines(truth),
    '',
    'Recompute the same table yourself with: node tools/numbers-audit.js'
  ];
  return textContent(lines.join('\n'));
}

module.exports = { requestedIds, evidenceReport, LABEL, auditLines, numbersAudit };

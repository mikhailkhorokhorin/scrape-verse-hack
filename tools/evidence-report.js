#!/usr/bin/env node
'use strict';

const evidence = require('./evidence-lib.js');

const VALUE_WIDTH = 34;

function displayValue(value) {
  if (value === null || value === undefined) return 'null';
  if (value === '') return '""';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > VALUE_WIDTH ? text.slice(0, VALUE_WIDTH - 3) + '...' : text;
}

function duration(seconds) {
  if (seconds === null) return '--';
  if (seconds < 120) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 120) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function pad(text, width) {
  const value = String(text);
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

function columnWidths(rows) {
  return {
    field: Math.max(5, ...rows.map((row) => row.field.length)),
    state: Math.max(11, ...rows.map((row) =>
      `${row.state_before} -> ${row.state_after}`.length)),
    value: Math.max(11, ...rows.map((row) => displayValue(row.value_before).length))
  };
}

function fieldTable(rows) {
  if (!rows.length) return ['  (no per-field verification recorded)'];
  const width = columnWidths(rows);
  const header = '  ' + pad('FIELD', width.field) + '  ' + pad('STATE', width.state) +
    '  ' + pad('VALUE BEFORE', width.value) + '  VALUE AFTER';
  const lines = rows.map((row) =>
    `  ${pad(row.field, width.field)}  ` +
    `${pad(`${row.state_before} -> ${row.state_after}`, width.state)}  ` +
    `${pad(displayValue(row.value_before), width.value)}  ` +
    `${displayValue(row.value_after)}${row.passed ? '' : '   [FAIL]'}`);
  return [header, ...lines];
}

function timelineLines(timeline) {
  const rows = timeline.rows.map((row) =>
    `  ${pad(row.stage, 10)} ${row.ts}  ${row.since_previous_seconds === null
      ? '--' : '+' + duration(row.since_previous_seconds)}`);
  if (!rows.length) return ['  (no stages recorded)'];
  return [...rows, `  ${pad('TOTAL', 10)} ${duration(timeline.total_seconds)} ` +
    'from detection to verification'];
}

function digestLines(report) {
  const lines = [`  ${pad('incident record', 33)} sha256 ${report.record_sha256}`];
  for (const file of report.evidence_files) {
    lines.push(`  ${pad(file.file, 33)} sha256 ${file.sha256}  (${file.bytes} bytes)`);
  }
  if (report.evidence_files.length === 0) {
    lines.push('  (no payload files committed for this incident)');
  }
  return lines;
}

function render(report) {
  const after = report.integrity_after === null ? 'heal failed' : `${report.integrity_after}%`;
  const lines = [
    `EVIDENCE ${report.id} — ${report.spider} (${report.strain})`,
    '',
    `  collector_id  ${report.collector_id_before} -> ${report.collector_id_after}  ` +
      '(identical: re-woven in place, not replaced)',
    `  integrity     ${report.integrity_before}% -> ${after}`,
    `  verdict       ${report.verdict}  (${report.passed}/${report.checked} fields back)`,
    `  resolved      ${report.resolved ? 'yes' : 'no'}`,
    '',
    'TIMELINE',
    ...timelineLines(report.timeline),
    '',
    'FIELDS',
    ...fieldTable(report.fields),
    '',
    'DIGESTS (sha256, recompute with: node tools/evidence-report.js --json)',
    ...digestLines(report)
  ];
  if (report.backfilled) {
    lines.push('', '  note: this record was reconstructed after the fact from the scan log.');
  }
  return lines.join('\n');
}

function renderAll(list) {
  return list.map(render).join('\n\n' + '-'.repeat(72) + '\n\n');
}

function parseArgs(argv) {
  const ids = [];
  let json = false;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else ids.push(arg);
  }
  return { ids, json };
}

function run(argv) {
  const { ids, json } = parseArgs(argv);
  const list = evidence.reports(ids);
  return json ? JSON.stringify(list, null, 2) : renderAll(list);
}

function main() {
  try {
    console.log(run(process.argv.slice(2)));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  VALUE_WIDTH, displayValue, duration, pad, columnWidths, fieldTable,
  timelineLines, digestLines, render, renderAll, parseArgs, run, main
};

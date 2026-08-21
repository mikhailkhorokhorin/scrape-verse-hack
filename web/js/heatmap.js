"use strict";

const HEAT_MAX_COLUMNS = 96;
const HEAT_GAP_FACTOR = 1.8;
const HEAT_MIN_RUNS = 12;

function heatRunsFor(cid) {
  return RAW_HISTORY
    .filter((run) => run && run.collector_id === cid && run.ts)
    .slice()
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))
    .slice(-HEAT_MAX_COLUMNS);
}

function medianStep(runs) {
  const steps = [];
  for (let i = 1; i < runs.length; i += 1) {
    const step = Date.parse(runs[i].ts) - Date.parse(runs[i - 1].ts);
    if (Number.isFinite(step) && step > 0) steps.push(step);
  }
  if (!steps.length) return 0;
  steps.sort((a, b) => a - b);
  return steps[Math.floor(steps.length / 2)];
}

function heatColumns(runs) {
  const step = medianStep(runs);
  const columns = [];
  runs.forEach((run, i) => {
    if (i > 0 && step > 0) {
      const delta = Date.parse(run.ts) - Date.parse(runs[i - 1].ts);
      const missed = Math.round(delta / step) - 1;
      if (missed > 0 && delta > step * HEAT_GAP_FACTOR) {
        for (let g = 0; g < Math.min(missed, 12); g += 1) columns.push({ gap: true });
      }
    }
    columns.push({ gap: false, run: run });
  });
  return columns;
}

function heatCellHTML(column, field) {
  if (column.gap) {
    return '<i class="heat__cell heat__cell--gap" title="no scan recorded"></i>';
  }
  const run = column.run;
  const state = stateWord(run, field);
  const label = field + " · " + state + " · " + clockOf(run.ts) +
    " · Integrity " + clampPct(run.integrity) + "%";
  return '<i class="heat__cell" data-s="' + state + '" title="' + esc(label) + '"></i>';
}

function heatHTML(sp) {
  const runs = heatRunsFor(sp.cid);
  const fields = sp.fieldOrder || FIELDS;
  if (runs.length < HEAT_MIN_RUNS || !fields.length) return "";

  const columns = heatColumns(runs);
  const gaps = columns.filter((c) => c.gap).length;
  const rows = fields.map((field) =>
    '<div class="heat__row">' +
      '<span class="heat__label" style="color:' + FIELD_COLOR[stateOf(sp, field)] + '">' +
        esc(field) + "</span>" +
      '<span class="heat__cells" role="img" aria-label="' + esc(field) +
        ' across ' + runs.length + ' runs">' +
        columns.map((c) => heatCellHTML(c, field)).join("") +
      "</span>" +
    "</div>"
  ).join("");

  const note = gaps
    ? " · " + gaps + " missed scan" + (gaps === 1 ? "" : "s") + " left as gaps"
    : "";

  return (
    '<div class="sechead sheet__sec"><h2>Field heatmap</h2><span class="rule"></span></div>' +
    '<p class="sheet__lede">Fields down, scans across, oldest on the left. Aggregate ' +
      "Integrity hides a single field rotting quietly — here a violet or red streak on one " +
      "row is visible without reading a number.</p>" +
    '<div class="heat">' + rows + "</div>" +
    '<p class="heat__scale"><span>' + esc(clockOf(runs[0].ts)) + "</span>" +
      "<span>" + runs.length + " run" + (runs.length === 1 ? "" : "s") + note + "</span>" +
      "<span>" + esc(clockOf(runs[runs.length - 1].ts)) + "</span></p>"
  );
}

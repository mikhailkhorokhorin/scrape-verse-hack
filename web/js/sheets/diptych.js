"use strict";

const DIPTYCH_HURT_MAX = DEGRADED_MIN;
const DIPTYCH_WELL_MIN = HEALTHY_MIN;

function diptychDated(history) {
  if (!Array.isArray(history)) return [];
  return history.filter((run) =>
    run && run.collector_id && run.spider &&
    Number.isFinite(Date.parse(run.ts)) &&
    typeof run.integrity === "number" && Number.isFinite(run.integrity));
}

function diptychWellFor(runs, hurt) {
  const at = Date.parse(hurt.ts);
  const well = runs.filter((run) =>
    run !== hurt && clampPct(run.integrity) >= DIPTYCH_WELL_MIN);
  if (well.length === 0) return null;
  const after = well
    .filter((run) => Date.parse(run.ts) > at)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  if (after.length) return after[0];
  return well.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))[0];
}

function diptychRank(record, incidents) {
  return incidentAt(incidents, record) ? 0 : 1;
}

function diptychHurtFor(runs, incidents) {
  return runs
    .filter((run) => clampPct(run.integrity) < DIPTYCH_HURT_MAX)
    .sort((a, b) =>
      clampPct(a.integrity) - clampPct(b.integrity) ||
      diptychRank(a, incidents) - diptychRank(b, incidents) ||
      Date.parse(a.ts) - Date.parse(b.ts))[0];
}

function pickDiptych(history, incidents) {
  const rows = diptychDated(history);
  if (rows.length === 0) return null;

  const byCollector = new Map();
  for (const run of rows) {
    if (!byCollector.has(run.collector_id)) byCollector.set(run.collector_id, []);
    byCollector.get(run.collector_id).push(run);
  }

  const pairs = [];
  for (const runs of byCollector.values()) {
    runs.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const hurt = diptychHurtFor(runs, incidents);
    if (!hurt) continue;
    const well = diptychWellFor(runs, hurt);
    if (!well) continue;
    pairs.push({ hurt: hurt, well: well });
  }

  if (pairs.length === 0) return null;
  pairs.sort((a, b) =>
    clampPct(a.hurt.integrity) - clampPct(b.hurt.integrity) ||
    diptychRank(a.hurt, incidents) - diptychRank(b.hurt, incidents) ||
    Date.parse(a.hurt.ts) - Date.parse(b.hurt.ts));
  return pairs[0];
}

function diptychDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "date unknown";
  const p = (n) => String(n).padStart(2, "0");
  return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) +
    " " + clockOf(iso);
}

function diptychCaption(record, incidents, word) {
  const id = incidentAt(incidents, record);
  return (
    '<p class="dip__cap mono">' +
      '<span class="dip__word">' + esc(word) + "</span>" +
      '<span class="dip__when">' + esc(diptychDate(record.ts)) + "</span>" +
      (id ? '<span class="dip__inc">' + esc(id) + "</span>" : "") +
    "</p>"
  );
}

function diptychHalfHTML(record, history, incidents, word, idx) {
  const sp = spiderFromRecord(record, history);
  if (!sp) return "";
  return (
    '<div class="dip__half">' +
      '<div class="dip__panel">' + panelHTML(sp, idx) + "</div>" +
      diptychCaption(record, incidents, word) +
    "</div>"
  );
}

function diptychHTML(history, incidents) {
  const pair = pickDiptych(history, incidents);
  if (!pair) return "";
  return (
    '<div class="dip__row">' +
      diptychHalfHTML(pair.well, history, incidents, "held", 0) +
      diptychHalfHTML(pair.hurt, history, incidents, "taken", 1) +
    "</div>"
  );
}

function diptychInert(body) {
  body.querySelectorAll(".panel").forEach((panel) => {
    panel.disabled = true;
    panel.removeAttribute("data-idx");
  });
  body.querySelectorAll(".chip--reveals").forEach((chip) => {
    chip.removeAttribute("tabindex");
    chip.removeAttribute("role");
  });
}

function renderDiptych() {
  const section = document.getElementById("diptych");
  const body = document.getElementById("diptych-body");
  if (!section || !body) return;
  const html = diptychHTML(RAW_HISTORY, RAW_INCIDENTS);
  body.innerHTML = html;
  section.hidden = html === "";
  if (html !== "") diptychInert(body);
}

"use strict";

function findInfectionPair(history, incident) {
  const runs = history
    .filter((r) => r && r.collector_id === incident.collector_id)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  if (runs.length < 2) return null;

  const opened = Date.parse(incident.opened_at);
  let dirty = null;
  for (const run of runs) {
    if (Date.parse(run.ts) >= opened) { dirty = run; break; }
  }
  if (!dirty) dirty = runs[runs.length - 1];

  const idx = runs.indexOf(dirty);
  const clean = idx > 0 ? runs[idx - 1] : null;
  if (!clean) return null;

  return { clean: clean, dirty: dirty };
}

function fieldVerdict(clean, dirty, field) {
  const wasLive = (clean.fields_live || []).includes(field);
  const nowDead = !(dirty.fields_live || []).includes(field) &&
                  !(dirty.fields_infected || []).includes(field);
  const nowInfected = (dirty.fields_infected || []).includes(field);

  if (nowDead) return "dead";
  if (nowInfected) return "infected";
  const before = clean.sample ? clean.sample[field] : undefined;
  const after = dirty.sample ? dirty.sample[field] : undefined;
  if (wasLive && String(before) !== String(after)) return "changed";
  return "same";
}

function sampleColumn(run, verdicts, fields) {
  const rows = fields.map((f) => {
    const raw = run.sample ? run.sample[f] : undefined;
    const val = raw === null || raw === undefined ? "null" : '"' + esc(raw) + '"';
    return '<div class="diffrow diffrow--' + verdicts[f] + '">' +
      '<span class="diffrow__key">' + esc(f) + "</span>" +
      '<span class="diffrow__val">' + val + "</span>" +
    "</div>";
  }).join("");

  return (
    '<div class="diffcol">' +
      '<p class="diffcol__stamp mono">' + clockOf(run.ts) + "</p>" +
      '<p class="diffcol__meta label">Integrity ' + esc(run.integrity) + "%</p>" +
      rows +
    "</div>"
  );
}

function infectionHTML(pair) {
  if (!pair) return "";
  const fields = pair.dirty.fields_expected || Object.keys(pair.dirty.sample || {});
  const verdicts = {};
  for (const f of fields) verdicts[f] = fieldVerdict(pair.clean, pair.dirty, f);

  return (
    '<div class="infection">' +
      '<div class="infection__cols">' +
        sampleColumn(pair.clean, verdicts, fields) +
        sampleColumn(pair.dirty, verdicts, fields) +
      "</div>" +
    "</div>"
  );
}

"use strict";

function recordRuns(history, record) {
  if (!Array.isArray(history) || !record) return [];
  const at = Date.parse(record.ts);
  return history
    .filter((run) => run && run.collector_id === record.collector_id)
    .filter((run) => {
      const ts = Date.parse(run.ts);
      return Number.isFinite(ts) && (!Number.isFinite(at) || ts <= at);
    })
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
}

function spiderFromRecord(record, history) {
  if (!record) return null;
  const runs = recordRuns(history, record);
  const order = record.fields_expected || [];

  const fields = {};
  const fillRates = {};
  const tracks = {};
  for (const field of order) {
    fields[field] = stateWord(record, field);
    fillRates[field] = fillRate(runs, field);
    tracks[field] = fieldTrack(runs, field);
  }

  const series = runs.slice(-SERIES_MAX_POINTS).map((run) => clampPct(run.integrity));

  return {
    code: record.spider,
    universe: record.universe,
    cid: record.collector_id,
    ts: record.ts,
    integrity: record.integrity,
    status: record.status,
    fields: fields,
    fieldOrder: order,
    fillRates: fillRates,
    tracks: tracks,
    scars: [],
    sample: record.sample || {},
    series: series,
    seriesTs: runs.slice(-SERIES_MAX_POINTS).map((run) => run.ts),
    runs: runs.length,
    blast: blastOf(runs),
    streak: cleanStreak(runs),
    best: bestStreak(runs),
    reweaving: record.status === "REWEAVING",
    afterHeal: record.after_heal === true,
    unwatched: false,
    healed: 0,
  };
}

function incidentAt(incidents, record) {
  if (!Array.isArray(incidents) || !record) return null;
  const at = Date.parse(record.ts);
  if (!Number.isFinite(at)) return null;
  const found = incidents.find((inc) =>
    inc && inc.spider === record.spider && Date.parse(inc.opened_at) === at);
  return found ? found.id : null;
}

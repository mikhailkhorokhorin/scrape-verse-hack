"use strict";

function stateWord(run, field) {
  if ((run.fields_live || []).includes(field)) return "live";
  if ((run.fields_infected || []).includes(field)) return "infected";
  return "dead";
}

function isCleanRun(run) {
  if (run.status) return String(run.status).toUpperCase() === "HEALTHY";
  return clampPct(run.integrity) >= HEALTHY_MIN;
}

function cleanStreak(runs) {
  let n = 0;
  for (let i = runs.length - 1; i >= 0; i -= 1) {
    if (!isCleanRun(runs[i])) break;
    n += 1;
  }
  return n;
}

function bestStreak(runs) {
  let best = 0;
  let n = 0;
  for (const run of runs) {
    if (isCleanRun(run)) { n += 1; best = Math.max(best, n); } else n = 0;
  }
  return best;
}

function fieldTrack(runs, field) {
  return runs.slice(-FIELD_TRACK_MAX).map((run) => stateWord(run, field));
}

function fillRate(runs, field) {
  if (runs.length === 0) return 0;
  const live = runs.filter((run) => (run.fields_live || []).includes(field)).length;
  const infected = runs.filter((run) => (run.fields_infected || []).includes(field)).length;
  return Math.round(((live + INFECTED_CREDIT * infected) / runs.length) * 100);
}

function adaptHistory(history) {
  const byCollector = new Map();
  for (const run of history) {
    if (!run || !run.collector_id) continue;
    if (!byCollector.has(run.collector_id)) byCollector.set(run.collector_id, []);
    byCollector.get(run.collector_id).push(run);
  }

  const spiders = [];
  for (const runs of byCollector.values()) {
    runs.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const latest = runs[runs.length - 1];
    const order = latest.fields_expected || [];

    const fields = {};
    for (const field of order) fields[field] = stateWord(latest, field);

    const fillRates = {};
    const tracks = {};
    for (const field of order) {
      fillRates[field] = fillRate(runs, field);
      tracks[field] = fieldTrack(runs, field);
    }

    spiders.push({
      code: latest.spider,
      universe: latest.universe,
      cid: latest.collector_id,
      ts: latest.ts,
      integrity: latest.integrity,
      status: latest.status,
      fields: fields,
      fieldOrder: order,
      fillRates: fillRates,
      tracks: tracks,
      scars: [],
      sample: latest.sample || {},
      series: runs.slice(-SERIES_MAX_POINTS).map((run) => clampPct(run.integrity)),
      runs: runs.length,
      streak: cleanStreak(runs),
      best: bestStreak(runs),
      reweaving: latest.status === "REWEAVING",
      unwatched: Date.now() - Date.parse(latest.ts) > UNWATCHED_MS,
    });
  }

  spiders.sort((a, b) => integrityOf(a) - integrityOf(b));
  return spiders;
}

function adaptIncidents(incidents) {
  if (!Array.isArray(RAW_HISTORY)) RAW_HISTORY = [];
  return incidents
    .slice()
    .sort((a, b) => Date.parse(b.opened_at) - Date.parse(a.opened_at))
    .map((inc) => {
      const anomalies = (inc.anomalies || []).join(" and ") || "no fields";
      const recovered = inc.recovered_fields || [];
      const what =
        "Extraction kept succeeding while " + anomalies + " stopped returning usable values. " +
        (recovered.length
          ? "The re-weave brought back " + recovered.join(" and ") + "."
          : "The re-weave did not restore the affected fields.");

      const opened = Date.parse(inc.opened_at);
      const closed = inc.closed_at ? Date.parse(inc.closed_at) : NaN;
      const mttrMs = Number.isFinite(opened) && Number.isFinite(closed) && closed > opened
        ? closed - opened
        : null;

      const stages = inc.stages || [];
      const verified = stages.some((st) => st.stage === "VERIFIED");

      return {
        id: inc.id,
        who: inc.spider,
        openedAt: inc.opened_at,
        strain: inc.strain || null,
        verified: verified,
        collector_id: inc.collector_id,
        infection: infectionHTML(findInfectionPair(RAW_HISTORY, inc)),
        opened: clockOf(inc.opened_at) + " · " + agoOf(inc.opened_at),
        before: inc.integrity_before,
        after: inc.integrity_after,
        what: inc.summary || what,
        mttrMs: mttrMs,
        stages: stages.map((st) => [st.stage, clockOf(st.ts)]),
      };
    });
}

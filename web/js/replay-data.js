"use strict";

const STAGE_ORDER = ["DETECTED", "DIAGNOSED", "REWEAVING", "VERIFIED"];

const STAGE_COPY = {
  DETECTED: {
    word: "SNAP!",
    color: "critical",
    state: "critical",
    line: "The scan came back populated and wrong. Nothing errored — the run reported success.",
  },
  DIAGNOSED: {
    word: "CREEP...",
    color: "infected",
    state: "critical",
    line: "The break is named from the field states. That description is what the healer is handed.",
  },
  REWEAVING: {
    word: "WEAVE...",
    color: "reweaving",
    state: "reweaving",
    line: "Scraper Studio re-derives the selectors and re-runs against the live page.",
  },
  VERIFIED: {
    word: "THWIP!",
    color: "healthy",
    state: "healthy",
    line: "The re-run is checked field by field. The incident closes only when the values come back.",
  },
};

function stageRank(name) {
  const i = STAGE_ORDER.indexOf(String(name).toUpperCase());
  return i === -1 ? STAGE_ORDER.length : i;
}

function elapsedOf(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  const total = Math.round(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins === 0) return secs + "s";
  return mins + "m " + String(secs).padStart(2, "0") + "s";
}

function replayFieldsOf(incident, pair) {
  const order = pair
    ? pair.dirty.fields_expected || Object.keys(pair.dirty.sample || {})
    : (incident.anomalies || []).slice();
  const anomalies = incident.anomalies || [];
  const recovered = incident.recovered_fields || anomalies;

  return order.map((field) => {
    const broken = anomalies.includes(field);
    const back = recovered.includes(field);
    return {
      name: field,
      before: pair ? stateWord(pair.clean, field) : "live",
      broken: broken ? (pair ? stateWord(pair.dirty, field) : "dead") : "live",
      after: !broken || back ? "live" : (pair ? stateWord(pair.dirty, field) : "dead"),
      cleanValue: pair && pair.clean.sample ? pair.clean.sample[field] : undefined,
      dirtyValue: pair && pair.dirty.sample ? pair.dirty.sample[field] : undefined,
      recovered: broken && back,
    };
  });
}

function stageIntegrity(name, before, after) {
  if (name === "VERIFIED") return after;
  if (name === "REWEAVING") return Math.round(before + (after - before) * 0.25);
  return before;
}

function buildReplay(incident, history) {
  if (!incident) return null;

  const raw = (incident.stages || [])
    .filter((st) => st && st.ts && Number.isFinite(Date.parse(st.ts)))
    .slice()
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts) || stageRank(a.stage) - stageRank(b.stage));
  if (raw.length < 2) return null;

  const t0 = Date.parse(raw[0].ts);
  const span = Date.parse(raw[raw.length - 1].ts) - t0;
  if (!(span > 0)) return null;

  const pair = findInfectionPair(Array.isArray(history) ? history : [], incident);
  const before = clampPct(incident.integrity_before);
  const after = clampPct(incident.integrity_after);

  const stages = raw.map((st, i) => {
    const name = String(st.stage).toUpperCase();
    const copy = STAGE_COPY[name] || STAGE_COPY.DETECTED;
    const at = Date.parse(st.ts) - t0;
    const next = i + 1 < raw.length ? Date.parse(raw[i + 1].ts) - t0 : span;
    return {
      name: name,
      ts: st.ts,
      clock: clockOf(st.ts),
      at: at,
      until: next,
      held: next - at,
      offset: elapsedOf(at),
      word: copy.word,
      color: copy.color,
      panelState: copy.state,
      line: copy.line,
      integrity: stageIntegrity(name, before, after),
    };
  });

  return {
    id: incident.id,
    spider: incident.spider,
    collector: incident.collector_id || "",
    strain: incident.strain || "",
    prompt: incident.heal_prompt || "",
    summary: incident.summary || "",
    openedAt: incident.opened_at,
    span: span,
    spanText: elapsedOf(span),
    before: before,
    after: after,
    stages: stages,
    fields: replayFieldsOf(incident, pair),
    pair: pair,
  };
}

function pickReplay(incidents, history) {
  const usable = (incidents || [])
    .map((inc) => buildReplay(inc, history))
    .filter((r) => r !== null);
  if (usable.length === 0) return null;
  const closed = usable.filter((r) => r.stages.some((s) => s.name === "VERIFIED"));
  const pool = closed.length ? closed : usable;
  return pool.reduce((best, r) => (Date.parse(r.openedAt) > Date.parse(best.openedAt) ? r : best));
}

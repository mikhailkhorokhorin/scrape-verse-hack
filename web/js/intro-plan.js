"use strict";

const INTRO_FLAG = "thwip.intro.seen";
const INTRO_SPAN_MS = 6000;
const INTRO_INCIDENT_ID = "inc_003";

function introIncidentOf(records) {
  const rows = Array.isArray(records) ? records.filter((r) => r && r.spider) : [];
  if (rows.length === 0) return null;
  const named = rows.find((r) => r.id === INTRO_INCIDENT_ID);
  if (named) return named;
  const worst = rows.slice().sort((a, b) => {
    const drop = clampPct(a.integrity_before) - clampPct(b.integrity_before);
    if (drop !== 0) return drop;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
  return worst[0];
}

function introBeats(inc) {
  const before = clampPct(inc.integrity_before);
  const after = clampPct(inc.integrity_after);
  const broken = (inc.anomalies || []).length;
  const healthy = 100;

  return [
    { at: 0, name: "healthy", integrity: healthy, word: null, color: null, hold: false },
    { at: 800, name: "snap", integrity: Math.round((healthy + before) / 2), word: "SNAP!", color: "critical", hold: false },
    { at: 1600, name: "crack", integrity: before, word: "CRACK!", color: "critical", hold: false },
    { at: 2600, name: "hold", integrity: before, word: null, color: null, hold: true },
    { at: 3400, name: "weave", integrity: before, word: "WEAVE…", color: "reweaving", hold: false },
    { at: 4600, name: "purge", integrity: Math.round((before + after) / 2), word: "PURGE!", color: "reweaving", hold: false },
    { at: 5400, name: "thwip", integrity: after, word: "THWIP!", color: "healthy", hold: false },
    { at: INTRO_SPAN_MS, name: "live", integrity: after, word: null, color: null, hold: false, broken: broken },
  ];
}

function introHoldMs(beats) {
  const i = beats.findIndex((b) => b.hold);
  if (i < 0) return 0;
  const crack = beats.slice(0, i).reverse().find((b) => b.word);
  const next = beats.slice(i + 1).find((b) => b.word);
  if (!crack || !next) return 0;
  return next.at - crack.at;
}

function introSpreadOf(integrity) {
  const lost = Math.max(0, (100 - clampPct(integrity)) / 100);
  return Math.min(MAX_VISIBLE_SPREAD, lost).toFixed(2);
}

function introDecision(input) {
  if (input.reducedMotion) return { play: false, why: "reduced-motion" };
  if (input.forced) return { play: true, why: "forced" };
  if (input.seen) return { play: false, why: "seen-this-session" };
  if (!input.hasIncident) return { play: false, why: "no-incident" };
  return { play: true, why: "first-load" };
}

function introSeen(store) {
  try {
    return store.getItem(INTRO_FLAG) === "1";
  } catch (err) {
    return true;
  }
}

function introMarkSeen(store) {
  try {
    store.setItem(INTRO_FLAG, "1");
  } catch (err) {
    return;
  }
}

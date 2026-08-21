"use strict";

const HAUL_MAX_CARDS = 8;
const HAUL_IDENTITY_KEYS = ["title", "name", "headline", "id", "sku"];
const HAUL_NUMERIC_KEYS = ["points", "comments", "score", "votes", "value", "amount", "price", "rating", "stock"];
const HAUL_MEDIA_KEYS = ["image", "image_url", "thumbnail", "img", "photo"];

function haulNumberOf(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (isPlainObject(raw)) {
    const key = MONEY_KEYS.find((k) => typeof raw[k] === "number");
    if (key) return raw[key];
    return null;
  }
  if (typeof raw !== "string") return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function haulIdentityOf(sample) {
  if (!isPlainObject(sample)) return null;
  for (const key of HAUL_IDENTITY_KEYS) {
    const raw = sample[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}

function haulIsMedia(key) {
  return HAUL_MEDIA_KEYS.includes(key);
}

function haulIsNumeric(key) {
  return HAUL_NUMERIC_KEYS.includes(key);
}

function haulRuns(history, collectorId) {
  return history
    .filter((run) => run && run.collector_id === collectorId && isPlainObject(run.sample))
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
}

function haulCellsOf(run) {
  const order = run.fields_expected && run.fields_expected.length
    ? run.fields_expected
    : Object.keys(run.sample || {});
  const seen = Object.keys(run.sample || {});
  const keys = order.filter((k) => seen.includes(k)).concat(seen.filter((k) => !order.includes(k)));

  return keys.map((key) => {
    const raw = run.sample[key];
    return {
      key: key,
      raw: raw,
      state: stateWord(run, key),
      text: valueText(raw),
      empty: raw === null || raw === undefined || raw === "",
      media: haulIsMedia(key) && typeof raw === "string" && /^https?:\/\//.test(raw),
    };
  });
}

function haulMovement(runs) {
  const named = runs.map((run) => ({ run: run, id: haulIdentityOf(run.sample) })).filter((r) => r.id);
  if (named.length < 2) return null;

  const groups = new Map();
  for (const entry of named) {
    if (!groups.has(entry.id)) groups.set(entry.id, []);
    groups.get(entry.id).push(entry.run);
  }

  let best = null;
  for (const [id, group] of groups) {
    if (group.length < 2) continue;
    if (!best || group.length > best.runs.length) best = { id: id, runs: group };
  }
  if (!best) return null;

  const keys = Object.keys(best.runs[0].sample || {}).filter((key) => {
    if (!haulIsNumeric(key)) return false;
    const values = best.runs.map((run) => haulNumberOf(run.sample[key]));
    if (values.some((v) => v === null)) return false;
    return values[values.length - 1] !== values[0];
  });
  if (!keys.length) return null;

  const metrics = keys.map((key) => {
    const values = best.runs.map((run) => haulNumberOf(run.sample[key]));
    return {
      key: key,
      values: values,
      from: values[0],
      to: values[values.length - 1],
      delta: values[values.length - 1] - values[0],
    };
  });

  return {
    id: best.id,
    scans: best.runs.length,
    firstTs: best.runs[0].ts,
    lastTs: best.runs[best.runs.length - 1].ts,
    metrics: metrics,
  };
}

function haulUnitOf(runs, key) {
  for (const run of runs) {
    const raw = (run.sample || {})[key];
    if (!isPlainObject(raw)) continue;
    if (typeof raw.symbol === "string" && raw.symbol) return { prefix: demojibake(raw.symbol), suffix: "" };

    if (typeof raw.currency === "string" && raw.currency) return { prefix: "", suffix: " " + raw.currency };
  }
  return { prefix: "", suffix: "" };
}

function haulSpreadKey(runs) {
  const keys = new Set();
  for (const run of runs) for (const key of Object.keys(run.sample || {})) keys.add(key);
  for (const key of keys) {
    if (!haulIsNumeric(key)) continue;
    const values = runs.map((run) => haulNumberOf(run.sample[key])).filter((v) => v !== null);
    if (values.length >= 3) return { key: key, values: values, unit: haulUnitOf(runs, key) };
  }
  return null;
}

function haulSpread(runs) {
  const found = haulSpreadKey(runs);
  if (!found) return null;
  const ids = runs.map((run) => haulIdentityOf(run.sample));
  const distinct = new Set(ids.filter(Boolean)).size;
  if (distinct < 3) return null;

  const values = found.values;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    key: found.key,
    values: values,
    unit: found.unit,
    distinct: distinct,
    lo: sorted[0],
    hi: sorted[sorted.length - 1],
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
  };
}

function haulSchemaShift(runs) {
  if (runs.length < 2) return null;
  const first = new Set(Object.keys(runs[0].sample || {}));
  const last = new Set(Object.keys(runs[runs.length - 1].sample || {}));
  const gone = [...first].filter((k) => !last.has(k));
  const gained = [...last].filter((k) => !first.has(k));
  if (!gone.length && !gained.length) return null;
  return { gone: gone, gained: gained };
}

function haulRowsOf(runs) {
  return runs.reduce((total, run) => {
    const n = Number(run.rows);
    return total + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

function buildHaul(history, spiders) {
  if (!Array.isArray(history) || !history.length) return [];

  return spiders.map((sp) => {
    const runs = haulRuns(history, sp.cid);
    if (!runs.length) return { code: sp.code, universe: sp.universe, cid: sp.cid, empty: true };

    const latest = runs[runs.length - 1];
    const carrying = runs.filter((run) => haulIdentityOf(run.sample));

    return {
      code: sp.code,
      universe: sp.universe,
      cid: sp.cid,
      empty: false,
      ts: latest.ts,
      integrity: clampPct(latest.integrity),
      status: latest.status || gradeOf(clampPct(latest.integrity)).toUpperCase(),
      rowsThisScan: Number(latest.rows) || 0,
      rowsTotal: haulRowsOf(runs),
      scans: runs.length,
      carrying: carrying.length,
      cells: haulCellsOf(latest).slice(0, HAUL_MAX_CARDS),
      movement: haulMovement(runs),
      spread: haulSpread(carrying),
      shift: haulSchemaShift(carrying.length >= 2 ? carrying : runs),
    };
  });
}

function haulTotals(hauls) {
  const live = hauls.filter((h) => !h.empty);
  return {
    spiders: live.length,
    rows: live.reduce((a, h) => a + h.rowsTotal, 0),
    scans: live.reduce((a, h) => a + h.scans, 0),
    fields: live.reduce((a, h) => a + h.cells.length, 0),
  };
}

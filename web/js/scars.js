"use strict";

const SCAR_RESIDUE = 0.04;

function scarsFor(code, series) {
  const runs = RAW_HISTORY
    .filter((run) => run && run.spider === code)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))
    .slice(-SERIES_MAX_POINTS);
  if (runs.length < 2 || !series || series.length < 2) return [];

  const marks = [];
  for (const inc of INCIDENTS) {
    if (inc.who !== code) continue;
    const at = Date.parse(inc.openedAt);
    if (!Number.isFinite(at)) continue;
    let idx = runs.findIndex((run) => Date.parse(run.ts) >= at);
    if (idx < 0) idx = runs.length - 1;
    marks.push(idx / (runs.length - 1));
  }
  return marks;
}

function healedCount(code) {
  return INCIDENTS.filter((inc) => inc.who === code && inc.verified).length;
}

function scarSVG(fractions, W, H, P) {
  if (!fractions.length) return "";
  return fractions.map((f) => {
    const x = (P + f * (W - 2 * P)).toFixed(1);
    return '<line class="scar" x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '"/>';
  }).join("");
}

function attachScars(spiders) {
  for (const sp of spiders) {
    sp.scars = scarsFor(sp.code, sp.series);
    sp.healed = healedCount(sp.code);
  }
}

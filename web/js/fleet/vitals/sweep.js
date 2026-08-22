"use strict";

const SWEEP_PERIOD_MS = 30 * 60 * 1000;
const SWEEP_TICK_MS = 1000;

let SWEEP_TIMER = null;

function sweepFractionOf(tsMs, nowMs) {
  if (!Number.isFinite(tsMs) || tsMs <= 0) return null;
  const elapsed = nowMs - tsMs;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  return elapsed / SWEEP_PERIOD_MS;
}

function sweepStateOf(tsMs, nowMs) {
  const raw = sweepFractionOf(tsMs, nowMs);
  if (raw === null) return { fraction: 0, overdue: false, due: false, known: false };
  return {
    fraction: Math.min(1, raw),
    overdue: raw >= 1,
    due: raw >= 1,
    known: true,
  };
}

function sweepRemainingMs(tsMs, nowMs) {
  if (!Number.isFinite(tsMs) || tsMs <= 0) return null;
  return Math.max(0, tsMs + SWEEP_PERIOD_MS - nowMs);
}

function sweepTitleOf(state, remainingMs) {
  if (!state.known) return "no scan on record for this Spider yet";
  if (state.overdue) return "this run is overdue — the cron should have landed by now";
  const mins = Math.ceil(remainingMs / 60000);
  return "next scan due in about " + mins + " minute" + (mins === 1 ? "" : "s") +
    " — the arc is that interval, not a chosen duration";
}

function sweepPerimeterOf(hand) {
  if (typeof hand.getTotalLength !== "function") return 0;
  const lap = hand.getTotalLength();
  return Number.isFinite(lap) && lap > 0 ? lap : 0;
}

function sweepPaintPanel(panel, nowMs) {
  const tsMs = Number(panel.dataset.sweepTs);
  const state = sweepStateOf(tsMs, nowMs);
  const arc = panel.querySelector(".sweep");
  const hand = arc && arc.querySelector(".sweep__hand");
  if (!arc || !hand) return state;
  const lap = sweepPerimeterOf(hand);
  if (lap > 0) {
    hand.setAttribute("stroke-dasharray",
      (lap * state.fraction).toFixed(1) + " " + lap.toFixed(1));
  }
  arc.style.setProperty("--sweep", state.fraction.toFixed(4));
  panel.classList.toggle("is-overdue", state.overdue);
  arc.title = sweepTitleOf(state, sweepRemainingMs(tsMs, nowMs));
  return state;
}

function sweepPaint() {
  const grid = document.getElementById("grid");
  if (!grid) return 0;
  const now = Date.now();
  let painted = 0;
  grid.querySelectorAll(".panel[data-sweep-ts]").forEach((panel) => {
    sweepPaintPanel(panel, now);
    painted += 1;
  });
  return painted;
}

function sweepStart() {
  if (SWEEP_TIMER !== null) return;
  SWEEP_TIMER = setInterval(sweepPaint, SWEEP_TICK_MS);
}

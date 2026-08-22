"use strict";

const SPARK_VIEW_W = 240;
const SPARK_VIEW_H = 44;
const RIG_REACT_MS = 1100;
const RIG_TURN_MAX = 9;
const RIG_TILT_MAX = 4;

function rigTurnToward(rigBox, pointBox) {
  if (!rigBox || !pointBox || !rigBox.width || !rigBox.height) return null;
  const from = { x: rigBox.left + rigBox.width / 2, y: rigBox.top + rigBox.height / 2 };
  const dx = pointBox.x - from.x;
  const dy = pointBox.y - from.y;
  const reachX = rigBox.width / 2 || 1;
  const reachY = rigBox.height / 2 || 1;
  const turn = Math.max(-1, Math.min(1, dx / reachX)) * RIG_TURN_MAX;
  const tilt = Math.max(-1, Math.min(1, dy / reachY)) * RIG_TILT_MAX;
  return {
    turn: Number(turn.toFixed(2)),
    tilt: Number(tilt.toFixed(2)),
    side: dx < 0 ? -1 : 1,
  };
}

function rigStepLegOf(change, legCount) {
  const count = legCount > 0 ? legCount : 0;
  if (count === 0) return -1;
  const named = (change && change.fields ? change.fields : [])
    .map((f) => f.name)
    .filter((name) => typeof name === "string");
  if (named.length) return named[0];
  return seedOf((change && change.code) || "") % count;
}

function rigLastPointOf(panel) {
  if (!panel) return null;
  const svg = panel.querySelector(".spark");
  if (!svg) return null;
  const hits = svg.querySelectorAll(".spark__hit");
  const last = hits.length ? hits[hits.length - 1] : null;
  if (!last) return null;
  const box = svg.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  const x = Number(last.dataset.x);
  const y = Number(last.dataset.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: box.left + (x / SPARK_VIEW_W) * box.width,
    y: box.top + (y / SPARK_VIEW_H) * box.height,
  };
}

function rigStepTarget(rig, pick) {
  const legs = rig.querySelectorAll(".rig__leg");
  if (!legs.length) return null;
  if (typeof pick === "string") {
    const named = rig.querySelector('.rig__leg[data-field="' + cssEscape(pick) + '"]');
    if (named) return named;
  }
  const at = typeof pick === "number" && pick >= 0 ? pick % legs.length : 0;
  return legs[at];
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}

function rigClearReaction(rig) {
  rig.classList.remove("rig--reacts");
  rig.style.removeProperty("--rig-turn");
  rig.style.removeProperty("--rig-tilt");
  rig.style.removeProperty("--rig-side");
  const stepped = rig.querySelectorAll(".rig__leg--steps");
  for (const leg of stepped) leg.classList.remove("rig__leg--steps");
}

function rigReact(panel, change) {
  if (!panel) return null;
  const rig = panel.querySelector(".rig-slot .rig") || panel.querySelector(".rig");
  if (!rig) return null;
  const aim = rigTurnToward(rig.getBoundingClientRect(), rigLastPointOf(panel));
  rigClearReaction(rig);
  void rig.getBoundingClientRect().width;
  if (aim) {
    rig.style.setProperty("--rig-turn", aim.turn + "deg");
    rig.style.setProperty("--rig-tilt", aim.tilt + "px");
    rig.style.setProperty("--rig-side", String(aim.side));
  }
  const leg = rigStepTarget(rig, rigStepLegOf(change, rig.querySelectorAll(".rig__leg").length));
  if (leg) leg.classList.add("rig__leg--steps");
  rig.classList.add("rig--reacts");
  setTimeout(() => rigClearReaction(rig), RIG_REACT_MS);
  return rig;
}

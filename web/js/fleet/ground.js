"use strict";

const GROUND_DOT_MIN = 4;
const GROUND_DOT_MAX = 9;
const GROUND_DIM_MAX = 0.34;

function groundLost(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function groundDot(lost) {
  return GROUND_DOT_MIN + (GROUND_DOT_MAX - GROUND_DOT_MIN) * groundLost(lost);
}

function groundDim(lost) {
  return GROUND_DIM_MAX * groundLost(lost);
}

function applyGround(raw) {
  if (typeof document === "undefined" || !document.body) return;
  const lost = groundLost(raw);
  const style = document.body.style;
  style.setProperty("--fleet-dot", groundDot(lost).toFixed(2) + "px");
  style.setProperty("--fleet-dim", groundDim(lost).toFixed(3));
}

function readFleetLost() {
  const el = document.getElementById("fleet-sym");
  if (!el) return 0;
  return groundLost(el.style.getPropertyValue("--fleet"));
}

function mountGround() {
  if (typeof document === "undefined" || !document.getElementById) return;
  const el = document.getElementById("fleet-sym");
  if (!el) return;
  applyGround(readFleetLost());
  if (typeof MutationObserver === "undefined") return;
  const observer = new MutationObserver(() => applyGround(readFleetLost()));
  observer.observe(el, { attributes: true, attributeFilter: ["style"] });
}

if (typeof document !== "undefined" && document.getElementById) {
  mountGround();
}

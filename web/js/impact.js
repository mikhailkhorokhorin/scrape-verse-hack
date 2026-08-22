"use strict";

const IMPACT_MS = 60;

function impactWorthyOf(change) {
  if (!change || !change.newRun) return false;
  const from = change.integrityFrom;
  const to = change.integrityTo;
  if (typeof from !== "number" || typeof to !== "number") return false;
  return from >= DEGRADED_MIN && to < DEGRADED_MIN;
}

function impactCodesOf(delta) {
  return (delta && delta.changes ? delta.changes : [])
    .filter(impactWorthyOf)
    .map((change) => change.code);
}

function impactFire(delta) {
  if (prefersReducedMotion()) return null;
  const codes = impactCodesOf(delta);
  if (codes.length === 0) return null;
  const root = document.body;
  if (root.classList.contains("impact")) return null;
  root.classList.add("impact");
  setTimeout(() => root.classList.remove("impact"), IMPACT_MS);
  return codes[0];
}

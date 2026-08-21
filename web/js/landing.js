"use strict";

let LAST_SNAPSHOT = null;

function landingLineOf(change) {
  const dead = change.fields.filter((f) => f.to === "dead");
  const infected = change.fields.filter((f) => f.to === "infected");
  const back = change.fields.filter((f) => f.from !== "live" && f.to === "live");
  if (dead.length) return dead.map((f) => f.name).join(" and ") + " stopped returning";
  if (infected.length) return infected.map((f) => f.name).join(" and ") + " came back wrong";
  if (back.length) return back.map((f) => f.name).join(" and ") + " came back";
  return "new scan";
}

function markLanded(change) {
  const panel = panelOf(change.code);
  if (!panel) return;
  panel.classList.remove("panel--landed");
  void panel.offsetWidth;
  panel.classList.add("panel--landed");
  panel.dataset.landed = landingLineOf(change);
  setTimeout(() => {
    panel.classList.remove("panel--landed");
    delete panel.dataset.landed;
  }, LANDED_MS);
  rigReact(panel, change);
  if (change.afterHeal) burst(panel, "THWIP!", COLOR.healthy);
}

function announceLandings(spiders) {
  const delta = deltaBetween(LAST_SNAPSHOT, spiders);
  LAST_SNAPSHOT = delta.snapshot;
  if (!delta.changes.length) return delta;
  speak(delta, spiders);
  if (prefersReducedMotion()) return delta;
  delta.changes.filter((change) => change.newRun).forEach(markLanded);
  return delta;
}

function prefersReducedMotion() {
  return typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
}

"use strict";

const RIG_REST_CLASS = "rig-rest";
const RIG_REST_MARGIN = "220px 0px 220px 0px";

let rigRestObserver = null;

function rigRestCells() {
  return Array.from(document.querySelectorAll(".cell"));
}

function rigRestApply(cell, visible) {
  cell.classList.toggle(RIG_REST_CLASS, !visible);
}

function rigRestFallback(cells) {
  cells.forEach((cell) => rigRestApply(cell, true));
}

function rigRestObserve() {
  const cells = rigRestCells();
  if (cells.length === 0) return null;
  if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    rigRestFallback(cells);
    return null;
  }
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => rigRestApply(entry.target, entry.isIntersecting));
  }, { rootMargin: RIG_REST_MARGIN });
  cells.forEach((cell) => {
    const rect = cell.getBoundingClientRect();
    rigRestApply(cell, rect.top < (window.innerHeight || 0) && rect.bottom > 0);
    observer.observe(cell);
  });
  return observer;
}

function mountRigRest() {
  if (typeof document === "undefined") return null;
  if (rigRestObserver) {
    rigRestObserver.disconnect();
    rigRestObserver = null;
  }
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches) return null;
  rigRestObserver = rigRestObserve();
  return rigRestObserver;
}

if (typeof window !== "undefined") {
  window.mountRigRest = mountRigRest;
}

"use strict";

const MANUAL_IN_SPAN_MS = 560;
const MANUAL_IN_STAGGER_MS = 46;
const MANUAL_IN_STAGGER_MAX = 4;
const MANUAL_IN_STAGES = [
  { name: "head", at: 0, selector: ".manual-head" },
  { name: "ad", at: 90, selector: "#ad-slot" },
  { name: "sections", at: 170, selector: ".man" },
  { name: "foot", at: 290, selector: ".manfoot" },
];
const MANUAL_IN = { marked: [], timer: null, decided: false };

function manualInDelay(stage, index) {
  return stage.at + Math.min(index, MANUAL_IN_STAGGER_MAX) * MANUAL_IN_STAGGER_MS;
}

function manualInLastBeat() {
  return MANUAL_IN_STAGES.reduce((latest, stage) => {
    const end = manualInDelay(stage, MANUAL_IN_STAGGER_MAX);
    return end > latest ? end : latest;
  }, 0);
}

function manualInDecision(input) {
  if (input.reducedMotion) return { play: false, why: "reduced-motion" };
  if (input.capture) return { play: false, why: "capture" };
  return { play: true, why: "every-visit" };
}

function manualInCapture() {
  if (typeof CAPTURE === "boolean") return CAPTURE;
  if (typeof location === "undefined") return false;
  try {
    return new URLSearchParams(location.search).get("capture") === "1";
  } catch (err) {
    return false;
  }
}

function manualInReduced() {
  return typeof prefersReducedMotion === "function"
    ? prefersReducedMotion()
    : typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function manualInMarkCapture(capture) {
  if (!capture) return false;
  if (typeof document !== "object" || document === null) return false;
  if (!document.documentElement) return false;
  document.documentElement.classList.add("is-capture");
  return true;
}

function manualInSettle() {
  if (MANUAL_IN.timer !== null) {
    clearTimeout(MANUAL_IN.timer);
    MANUAL_IN.timer = null;
  }
  MANUAL_IN.marked.forEach((el) => {
    el.classList.remove("manual-in");
    el.style.removeProperty("--manual-delay");
  });
  MANUAL_IN.marked = [];
  document.documentElement.classList.remove("manual-running");
}

function manualInWatchFinish() {
  if (typeof document.getAnimations !== "function") return;
  const running = document.getAnimations().filter((anim) => {
    const name = anim.animationName;
    return name === "manual-stamp" || name === "manual-ink";
  });
  if (running.length === 0) return;
  Promise.all(running.map((anim) => anim.finished))
    .then(manualInSettle)
    .catch(() => {});
}

function manualInArm() {
  MANUAL_IN_STAGES.forEach((stage) => {
    const nodes = Array.prototype.slice.call(document.querySelectorAll(stage.selector));
    nodes.forEach((el, index) => {
      el.style.setProperty("--manual-delay", manualInDelay(stage, index) + "ms");
      el.classList.add("manual-in");
      MANUAL_IN.marked.push(el);
    });
  });
  return MANUAL_IN.marked.length > 0;
}

function manualInPlay() {
  document.documentElement.classList.add("manual-running");
  if (!manualInArm()) {
    document.documentElement.classList.remove("manual-running");
    return false;
  }
  MANUAL_IN.timer = setTimeout(manualInSettle, manualInLastBeat() + MANUAL_IN_SPAN_MS);
  manualInWatchFinish();
  return true;
}

function manualInMaybePlay() {
  if (MANUAL_IN.decided) return { play: false, why: "already-decided" };
  MANUAL_IN.decided = true;
  const capture = manualInCapture();
  manualInMarkCapture(capture);
  const decision = manualInDecision({
    reducedMotion: manualInReduced(),
    capture: capture,
  });
  if (decision.play) manualInPlay();
  return decision;
}

if (typeof document === "object" && document !== null && document.querySelector) manualInMaybePlay();

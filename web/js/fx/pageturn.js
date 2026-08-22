"use strict";

function pageturnSupported() {
  return typeof document === "object" && document !== null &&
    typeof document.startViewTransition === "function";
}

function pageturnCaptureFlag() {
  if (typeof CAPTURE === "boolean") return CAPTURE;
  if (typeof location === "undefined") return false;
  try {
    return new URLSearchParams(location.search).get("capture") === "1";
  } catch (err) {
    return false;
  }
}

function pageturnReduced() {
  return typeof prefersReducedMotion === "function"
    ? prefersReducedMotion()
    : typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pageturnDecision(input) {
  if (input.reducedMotion) return { play: false, why: "reduced-motion" };
  if (input.capture) return { play: false, why: "capture" };
  if (!input.supported) return { play: false, why: "unsupported" };
  return { play: true, why: "ok" };
}

function pageturnSuppress() {
  if (typeof document !== "object" || document === null) return false;
  if (!document.documentElement) return false;
  document.documentElement.classList.add("no-pageturn");
  return true;
}

function pageturnInit() {
  const decision = pageturnDecision({
    reducedMotion: pageturnReduced(),
    capture: pageturnCaptureFlag(),
    supported: pageturnSupported(),
  });
  if (!decision.play) pageturnSuppress();
  return decision;
}

if (typeof document === "object" && document !== null && document.documentElement) pageturnInit();

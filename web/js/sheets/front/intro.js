"use strict";

const INTRO = { running: false, timers: [], marked: [], decided: false };

function introStore() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch (err) {
    return null;
  }
}

function introSeenNow() {
  const store = introStore();
  return store === null ? true : introSeen(store);
}

function introRemember() {
  const store = introStore();
  if (store !== null) introMarkSeen(store);
}

function introClear() {
  INTRO.timers.forEach(clearTimeout);
  INTRO.timers = [];
}

function introSettle() {
  INTRO.marked.forEach((el) => {
    el.classList.remove("intro-stage");
    el.style.removeProperty("--intro-delay");
  });
  INTRO.marked = [];
}

function introFinish() {
  if (!INTRO.running) return;
  INTRO.running = false;
  introClear();
  introSettle();
  document.documentElement.classList.remove("intro-running");
}

function introStageNodes(stage) {
  return Array.prototype.slice.call(document.querySelectorAll(stage.selector));
}

function introArm() {
  INTRO_STAGES.forEach((stage) => {
    introStageNodes(stage).forEach((el, index) => {
      el.style.setProperty("--intro-delay", introStageDelay(stage, index) + "ms");
      el.classList.add("intro-stage");
      INTRO.marked.push(el);
    });
  });
  return INTRO.marked.length > 0;
}

function introPlay() {
  if (INTRO.running) return false;
  document.documentElement.classList.add("intro-running");
  if (!introArm()) {
    document.documentElement.classList.remove("intro-running");
    return false;
  }
  INTRO.running = true;
  INTRO.timers.push(setTimeout(introFinish, introLastBeat() + INTRO_SPAN_MS));
  return true;
}

function introMaybePlay() {
  if (INTRO.decided) return { play: false, why: "already-decided" };
  INTRO.decided = true;
  const decision = introDecision({
    reducedMotion: prefersReducedMotion(),
    capture: typeof CAPTURE === "boolean" ? CAPTURE : false,
    seen: introSeenNow(),
  });
  if (!decision.play) return decision;
  introRemember();
  introPlay();
  return decision;
}

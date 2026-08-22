"use strict";

const INTRO_FLAG = "thwip.intro.seen";
const INTRO_SPAN_MS = 620;
const INTRO_STAGES = [
  { name: "masthead", at: 0, selector: ".masthead" },
  { name: "readouts", at: 220, selector: ".readouts .readout" },
  { name: "open", at: 460, selector: ".open" },
  { name: "panels", at: 700, selector: "#grid .cell" },
  { name: "feed", at: 1180, selector: ".feed .incident" },
];
const INTRO_STAGGER_MS = 90;
const INTRO_STAGGER_MAX = 6;

function introStageAt(name) {
  return INTRO_STAGES.find((stage) => stage.name === name) || null;
}

function introStageDelay(stage, index) {
  const step = Math.min(index, INTRO_STAGGER_MAX) * INTRO_STAGGER_MS;
  return stage.at + step;
}

function introLastBeat() {
  return INTRO_STAGES.reduce((latest, stage) => {
    const end = introStageDelay(stage, INTRO_STAGGER_MAX);
    return end > latest ? end : latest;
  }, 0);
}

function introDecision(input) {
  if (input.reducedMotion) return { play: false, why: "reduced-motion" };
  if (input.capture) return { play: false, why: "capture" };
  if (input.seen) return { play: false, why: "seen-before" };
  return { play: true, why: "first-visit" };
}

function introSeen(store) {
  try {
    return store.getItem(INTRO_FLAG) === "1";
  } catch (err) {
    return true;
  }
}

function introMarkSeen(store) {
  try {
    store.setItem(INTRO_FLAG, "1");
  } catch (err) {
    return;
  }
}

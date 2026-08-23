"use strict";

function scratchBoxOf(el) {
  const rects = el.getClientRects();
  const box = rects.length ? rects[0] : el.getBoundingClientRect();
  return { width: box.width, height: box.height };
}

function scratchPanelHeight(panel) {
  const inner = panel.clientHeight;
  if (inner > 0) return inner;
  return panel.getBoundingClientRect().height;
}

function scratchSeenOf(state) {
  const seen = state.layer.getBoundingClientRect();
  if (seen.height === 0) return null;
  return { rect: seen, scale: state.box.h / seen.height };
}

function scratchTopOf(state) {
  return 0;
}

function scratchSize(state) {
  const height = Math.round(scratchPanelHeight(state.panel));
  if (height * Math.min(1, Math.max(0, state.spread)) * SCRATCH_COVER < SCRATCH_ROW_H) {
    return false;
  }
  const box = scratchBoxOf(state.layer);
  if (box.width === 0 || box.height === 0) return false;
  state.box = { w: Math.max(1, Math.round(box.width)), h: Math.max(1, Math.round(box.height)) };
  return true;
}

function scratchRectOf(state) {
  if (!state.rect) state.rect = state.layer.getBoundingClientRect();
  return state.rect;
}

function scratchRectDrop() {
  document.querySelectorAll(".panel.has-scratch").forEach((panel) => {
    if (panel.__scratch) panel.__scratch.rect = null;
  });
}

function scratchPointIn(state, clientX, clientY) {
  const box = scratchRectOf(state);
  if (box.width === 0 || box.height === 0) return null;
  return {
    x: ((clientX - box.left) / box.width) * state.box.w,
    y: ((clientY - box.top) / box.height) * state.box.h,
  };
}

function scratchFlushMove() {
  SCRATCH_IDS.tick = 0;
  const move = SCRATCH_IDS.move;
  SCRATCH_IDS.move = null;
  if (move) scratchTouch(move.panel, move, true);
}

function scratchSnipStop() {
  if (SCRATCH_IDS.snip) {
    clearInterval(SCRATCH_IDS.snip);
    SCRATCH_IDS.snip = 0;
  }
  document.querySelectorAll(".panel.is-snip").forEach((panel) => {
    panel.classList.remove("is-snip");
  });
}

function scratchSnipStart(panel) {
  scratchSnipStop();
  if (typeof scratchReduced === "function" && scratchReduced()) return;
  SCRATCH_IDS.snip = setInterval(() => panel.classList.toggle("is-snip"), 130);
}

function scratchOnSnapEnd(e) {
  const el = e.target;
  if (el && el.classList && el.classList.contains("is-torn")) {
    el.classList.add("is-gone");
  }
}

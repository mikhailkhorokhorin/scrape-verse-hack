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

function scratchReachTop(state) {
  const reach = Math.min(1, Math.max(0, state.spread)) * SCRATCH_COVER;
  return state.box.h * (1 - reach);
}

function scratchSeenOf(state) {
  const seen = state.layer.getBoundingClientRect();
  if (seen.height === 0) return null;
  return { rect: seen, scale: state.box.h / seen.height };
}

function scratchStraddler(state, reach) {
  const seen = scratchSeenOf(state);
  if (!seen) return null;
  let top = null;
  state.panel.querySelectorAll(SCRATCH_CONCEALS).forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.height === 0) return;
    const y = (box.top - seen.rect.top) * seen.scale;
    const bottom = y + box.height * seen.scale;
    if (bottom <= reach || y >= reach) return;
    if (top === null || y < top) top = y;
  });
  return top;
}

function scratchFloorOf(state) {
  const seen = scratchSeenOf(state);
  if (!seen) return 0;
  let floor = 0;
  state.panel.querySelectorAll(SCRATCH_KEEPS).forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.height === 0) return;
    const bottom = (box.top - seen.rect.top + box.height) * seen.scale;
    if (bottom > floor) floor = bottom;
  });
  return floor;
}

function scratchTopOf(state) {
  const reach = scratchReachTop(state);
  const cut = scratchStraddler(state, reach);
  if (cut === null) return Math.round(reach);
  const lifted = cut - SCRATCH_CLEARANCE;
  return Math.round(Math.max(0, Math.max(scratchFloorOf(state), lifted)));
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

function scratchPointIn(state, clientX, clientY) {
  const box = state.layer.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  return {
    x: ((clientX - box.left) / box.width) * state.box.w,
    y: ((clientY - box.top) / box.height) * state.box.h,
  };
}

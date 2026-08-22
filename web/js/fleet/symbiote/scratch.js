"use strict";

const SCRATCH_REGROW_MS = 4200;
const SCRATCH_HINT_KEY = "thwip.scratch.found";

function scratchReduced() {
  return typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scratchBrokenFields(sp) {
  const order = sp.fieldOrder || FIELDS || [];
  return order.filter((field) => stateOf(sp, field) !== "live");
}

function scratchLineFor(sp, field) {
  return field + ": " + receivedOf(sp, field);
}

function scratchLinesOf(sp) {
  return scratchBrokenFields(sp).map((field) => ({
    text: scratchLineFor(sp, field),
    state: stateOf(sp, field),
  }));
}


function scratchSpreadOf(panel) {
  const raw = panel.style.getPropertyValue("--spread");
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : 0;
}





function scratchReveal(state, strokes) {
  const ctx = state.ctx;
  const w = state.canvas.width;
  const h = state.canvas.height;
  const top = 0;
  ctx.save();
  scratchClipTo(ctx, strokes);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = SCRATCH_UNDER;
  ctx.fillRect(0, top, w, h - top);
  scratchPaintValues(ctx, state.lines, w, h, top);
  ctx.restore();
}

function scratchRepaint(state) {
  const ctx = state.ctx;
  const w = state.canvas.width;
  const h = state.canvas.height;
  const top = 0;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  symbioteFillBody(ctx, w, h, top, SCRATCH_INK);
  scratchPaintGhost(ctx, state.lines, w, h, top);
  if (!state.strokes.some((s) => s.length)) return;
  scratchReveal(state, state.strokes);
}

function scratchSize(state) {
  const box = state.panel.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return false;
  const shown = Math.min(1, Math.max(0, state.spread));
  const height = Math.round(box.height * shown);
  if (height < SCRATCH_ROW_H) return false;
  state.canvas.width = Math.round(box.width);
  state.canvas.height = height;
  state.canvas.style.top = "auto";
  state.canvas.style.bottom = "0";
  state.canvas.style.height = Math.round(box.height * shown) + "px";
  return true;
}

function scratchStateFor(panel) {
  if (panel.__scratch) return panel.__scratch;
  const canvas = document.createElement("canvas");
  canvas.className = "scratch__canvas";
  canvas.setAttribute("aria-hidden", "true");
  panel.appendChild(canvas);
  panel.__scratch = {
    panel: panel,
    canvas: canvas,
    ctx: canvas.getContext("2d"),
    strokes: [],
    lines: [],
    spread: 0,
    timer: null,
    dragged: false,
  };
  return panel.__scratch;
}

function scratchSet(state, point) {
  if (!point) {
    state.strokes = [];
    state.timer = null;
    scratchRepaint(state);
    state.panel.classList.remove("is-scratched");
    return;
  }
  const current = state.strokes[state.strokes.length - 1] || [];
  const added = scratchInterpolate(current, point);
  const from = current.length ? [current[current.length - 1]] : [];
  if (!state.strokes.length) state.strokes.push([]);
  state.strokes[state.strokes.length - 1] = current.concat(added);
  scratchReveal(state, [from.concat(added)]);
  state.panel.classList.add("is-scratched");
}

function scratchOpen(state) {
  state.strokes.push([]);
}

function scratchRegrow(state) {
  if (state.timer) clearTimeout(state.timer);
  state.timer = scratchReduced()
    ? null
    : setTimeout(() => scratchSet(state, null), SCRATCH_REGROW_MS);
}

function scratchMarkFound() {
  document.body.classList.add("scratch-found");
  try {
    sessionStorage.setItem(SCRATCH_HINT_KEY, "1");
  } catch (err) {
    return;
  }
}

function scratchWasFound() {
  try {
    return sessionStorage.getItem(SCRATCH_HINT_KEY) === "1";
  } catch (err) {
    return false;
  }
}

function scratchPointIn(state, clientX, clientY) {
  const box = state.panel.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  return {
    x: ((clientX - box.left) / box.width) * state.canvas.width,
    y: ((clientY - box.top) / box.height) * state.canvas.height,
  };
}

function scratchTouch(panel, e, dragging) {
  const state = panel.__scratch;
  if (!state) return;
  const point = scratchPointIn(state, e.clientX, e.clientY);
  if (!point) return;
  if (dragging) state.dragged = true;
  const off = !dragging && scratchReduced() && state.strokes.some((k) => k.length);
  scratchSet(state, off ? null : point);
  scratchMarkFound();
  scratchRegrow(state);
}

function scratchOnDown(e) {
  const panel = e.target.closest && e.target.closest(".panel.has-scratch");
  if (!panel) return;
  panel.classList.add("is-scratching");
  if (panel.__scratch) scratchOpen(panel.__scratch);
  scratchTouch(panel, e, false);
}

function scratchOnMove(e) {
  const panel = e.target.closest && e.target.closest(".panel.has-scratch");
  if (!panel || !panel.classList.contains("is-scratching")) return;
  scratchTouch(panel, e, true);
}

function scratchOnUp() {
  document.querySelectorAll(".panel.is-scratching")
    .forEach((panel) => panel.classList.remove("is-scratching"));
}

function scratchSwallowsClick(panel) {
  const state = panel.__scratch;
  if (!state || !state.dragged) return false;
  state.dragged = false;
  return true;
}

function scratchMountPanel(panel, sp) {
  const lines = scratchLinesOf(sp);
  const spread = scratchSpreadOf(panel);
  if (lines.length === 0 || spread <= MIN_VISIBLE_SPREAD) return;
  if (!panel.querySelector(".symbiote")) return;
  panel.classList.add("has-scratch");
  const state = scratchStateFor(panel);
  state.lines = lines;
  state.spread = spread;
  state.strokes = [];
  if (scratchSize(state)) scratchRepaint(state);
}

function scratchHint(panel) {
  if (scratchWasFound()) return;
  if (panel.querySelector(".scratch-hint")) return;
  panel.insertAdjacentHTML("beforeend",
    '<span class="scratch-hint">Something is under there</span>');
}

function scratchMount() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  let hinted = false;
  grid.querySelectorAll(".panel").forEach((panel) => {
    const sp = SPIDERS[Number(panel.dataset.idx)];
    if (!sp) return;
    scratchMountPanel(panel, sp);
    if (!hinted && panel.classList.contains("has-scratch")) {
      scratchHint(panel);
      hinted = true;
    }
  });
  if (scratchWasFound()) document.body.classList.add("scratch-found");
}

function scratchBind() {
  if (document.body.dataset.scratchBound === "1") return;
  document.body.dataset.scratchBound = "1";
  document.addEventListener("pointerdown", scratchOnDown);
  document.addEventListener("pointermove", scratchOnMove);
  document.addEventListener("pointerup", scratchOnUp);
  document.addEventListener("pointercancel", scratchOnUp);
  window.addEventListener("resize", scratchMount);
}

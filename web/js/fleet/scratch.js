"use strict";

const SCRATCH_RADIUS = 34;
const SCRATCH_REGROW_MS = 4200;
const SCRATCH_HINT_KEY = "thwip.scratch.found";
const SCRATCH_INK = "#050408";
const SCRATCH_ROW_H = 22;

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

function scratchColorFor(state) {
  if (state === "dead") return "#FF1E1E";
  if (state === "infected") return "#C24BFF";
  return "#F4EFE4";
}

function scratchSpreadOf(panel) {
  const raw = panel.style.getPropertyValue("--spread");
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : 0;
}

function scratchRowsTop(lines, h, top) {
  const block = lines.length * SCRATCH_ROW_H;
  return top + (h - top) / 2 - block / 2 + SCRATCH_ROW_H / 2;
}

function scratchPaintUnder(ctx, lines, w, h, top) {
  ctx.textBaseline = "middle";
  ctx.font = "600 13px 'IBM Plex Mono',monospace";
  let y = scratchRowsTop(lines, h, top);
  lines.forEach((line) => {
    ctx.fillStyle = scratchColorFor(line.state);
    ctx.fillText(line.text, 18, y, w - 36);
    y += SCRATCH_ROW_H;
  });
}

function scratchCarve(ctx, holes) {
  ctx.globalCompositeOperation = "destination-out";
  holes.forEach((hole) => {
    const g = ctx.createRadialGradient(hole.x, hole.y, 0, hole.x, hole.y, SCRATCH_RADIUS);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.62, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";
}

function scratchClip(ctx, holes) {
  ctx.beginPath();
  holes.forEach((hole) => {
    ctx.moveTo(hole.x + SCRATCH_RADIUS * 0.68, hole.y);
    ctx.arc(hole.x, hole.y, SCRATCH_RADIUS * 0.68, 0, Math.PI * 2);
  });
  ctx.clip();
}

function scratchRepaint(state) {
  const ctx = state.ctx;
  const w = state.canvas.width;
  const h = state.canvas.height;
  const top = h * (1 - state.spread);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = SCRATCH_INK;
  ctx.fillRect(0, top, w, h - top);
  scratchCarve(ctx, state.holes);
  if (state.holes.length === 0) return;
  ctx.save();
  scratchClip(ctx, state.holes);
  ctx.fillStyle = SCRATCH_INK;
  ctx.fillRect(0, top, w, h - top);
  scratchPaintUnder(ctx, state.lines, w, h, top);
  ctx.restore();
}

function scratchSize(state) {
  const box = state.panel.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return false;
  state.canvas.width = Math.round(box.width);
  state.canvas.height = Math.round(box.height);
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
    holes: [],
    lines: [],
    spread: 0,
    timer: null,
    dragged: false,
  };
  return panel.__scratch;
}

function scratchSet(state, point) {
  if (point) state.holes.push(point);
  else state.holes = [];
  if (!point) state.timer = null;
  scratchRepaint(state);
  state.panel.classList.toggle("is-scratched", state.holes.length > 0);
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
  const off = !dragging && scratchReduced() && state.holes.length > 0;
  scratchSet(state, off ? null : point);
  scratchMarkFound();
  scratchRegrow(state);
}

function scratchOnDown(e) {
  const panel = e.target.closest && e.target.closest(".panel.has-scratch");
  if (!panel) return;
  panel.classList.add("is-scratching");
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
  state.holes = [];
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

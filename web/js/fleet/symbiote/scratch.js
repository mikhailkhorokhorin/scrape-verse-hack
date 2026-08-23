"use strict";

const SCRATCH_HINT_KEY = "thwip.scratch.found";
const SCRATCH_NS = "http://www.w3.org/2000/svg";
const SCRATCH_IDS = { n: 0, frame: 0, tick: 0, move: null, snip: 0 };

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

function scratchStateFor(panel) {
  if (panel.__scratch) return panel.__scratch;
  const layer = document.createElementNS(SCRATCH_NS, "svg");
  layer.setAttribute("class", "scratch__web");
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("focusable", "false");
  layer.setAttribute("preserveAspectRatio", "none");
  const veil = document.createElementNS(SCRATCH_NS, "rect");
  veil.setAttribute("class", "scratch__veil");
  const id = "scratch-band-" + (SCRATCH_IDS.n += 1);
  const defs = document.createElementNS(SCRATCH_NS, "defs");
  const clip = document.createElementNS(SCRATCH_NS, "clipPath");
  clip.setAttribute("id", id);
  const band = document.createElementNS(SCRATCH_NS, "rect");
  clip.appendChild(band);
  defs.appendChild(clip);
  const g = document.createElementNS(SCRATCH_NS, "g");
  g.setAttribute("class", "scratch__g");
  g.setAttribute("clip-path", "url(#" + id + ")");
  layer.appendChild(defs);
  layer.appendChild(veil);
  layer.appendChild(g);
  panel.appendChild(layer);
  panel.__scratch = {
    panel: panel, layer: layer, veil: veil, band: band, g: g,
    strands: [], nodes: [], lines: [], box: { w: 1, h: 1 },
    spread: 0, seed: 1, dragged: false,
  };
  return panel.__scratch;
}

function scratchPathEl(strand) {
  const path = document.createElementNS(SCRATCH_NS, "path");
  path.setAttribute("class", "scratch__strand scratch__strand--" + strand.kind);
  path.setAttribute("d", strand.d);
  path.setAttribute("stroke-width", strand.weight + "");
  path.style.setProperty("--ox", strand.anchor[0] + "px");
  path.style.setProperty("--oy", strand.anchor[1] + "px");
  return path;
}

function scratchBandRect(el, box, top) {
  el.setAttribute("x", "0");
  el.setAttribute("y", top + "");
  el.setAttribute("width", box.w + "");
  el.setAttribute("height", Math.max(0, box.h - top) + "");
}

function scratchDrawWeb(state) {
  const box = state.box;
  const top = scratchTopOf(state);
  state.top = top;
  state.rect = null;
  state.layer.setAttribute("viewBox", "0 0 " + box.w + " " + box.h);
  scratchBandRect(state.veil, box, top);
  scratchBandRect(state.band, box, top);
  state.g.textContent = "";
  state.strands = scratchStrands({ w: box.w, h: box.h }, state.seed, top);
  const frag = document.createDocumentFragment();
  state.nodes = state.strands.map((strand) => {
    const el = scratchPathEl(strand);
    frag.appendChild(el);
    return el;
  });
  state.g.appendChild(frag);
  state.panel.classList.remove("is-bared");
  state.panel.classList.remove("is-scratched");
}

function scratchTearAt(state, px, py) {
  const hits = scratchHitAt(state.strands, px, py, SCRATCH_RADIUS);
  if (hits.length === 0) return false;
  hits.forEach((i) => {
    state.strands[i].torn = true;
    if (state.nodes[i]) state.nodes[i].classList.add("is-torn");
  });
  state.panel.classList.add("is-scratched");
  if (scratchAllTorn(state.strands)) state.panel.classList.add("is-bared");
  return true;
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

function scratchTouch(panel, e, dragging) {
  const state = panel.__scratch;
  if (!state) return;
  const point = scratchPointIn(state, e.clientX, e.clientY);
  if (!point) return;
  if (dragging) state.dragged = true;
  scratchTearAt(state, point.x, point.y);
  scratchMarkFound();
}

function scratchOnDown(e) {
  const panel = e.target.closest && e.target.closest(".panel.has-scratch");
  if (!panel) return;
  if (panel.__scratch) panel.__scratch.rect = null;
  panel.classList.add("is-scratching");
  scratchSnipStart(panel);
  scratchTouch(panel, e, false);
}

function scratchOnMove(e) {
  const panel = e.target.closest && e.target.closest(".panel.has-scratch");
  if (!panel || !panel.classList.contains("is-scratching")) return;
  SCRATCH_IDS.move = { panel: panel, clientX: e.clientX, clientY: e.clientY };
  if (SCRATCH_IDS.tick) return;
  SCRATCH_IDS.tick = requestAnimationFrame(scratchFlushMove);
}

function scratchOnUp() {
  scratchSnipStop();
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
  state.seed = (Number(panel.dataset.idx) || 0) + 1;
  if (scratchSize(state)) scratchDrawWeb(state);
}

function scratchHint(panel) {
  if (scratchWasFound()) return;
  if (panel.querySelector(".scratch-hint")) return;
  panel.insertAdjacentHTML("beforeend",
    '<span class="scratch-hint">Something is under there</span>');
}

function scratchRemount() {
  document.querySelectorAll(".panel.has-scratch").forEach((panel) => {
    const state = panel.__scratch;
    if (!state) return;
    const was = state.box;
    if (!scratchSize(state)) return;
    if (was && was.w === state.box.w && was.h === state.box.h) return;
    scratchDrawWeb(state);
  });
}

function scratchOnResize() {
  if (SCRATCH_IDS.frame) return;
  SCRATCH_IDS.frame = requestAnimationFrame(() => {
    SCRATCH_IDS.frame = 0;
    scratchMount();
    scratchRemount();
  });
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
  document.addEventListener("animationend", scratchOnSnapEnd);
  window.addEventListener("resize", scratchOnResize);
  window.addEventListener("scroll", scratchRectDrop, { passive: true });
}

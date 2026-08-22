"use strict";

const WRAP_MS = 660;
const WRAP_LASH_MS = 200;
const WRAP_CINCH_AT = 150;
const WRAP_HAUL_AT = 300;
const WRAP_STEP = 16;
const WRAP_STRANDS = [5, 8];
const WRAP_MAX_PATHS = 26;
const WRAP_BOX = { w: 100, h: 100 };

function wrapRng() {
  return Math.random;
}

function wrapHub(rng, index, total) {
  const t = total > 1 ? index / (total - 1) : 0.5;
  const left = index % 2 === 0;
  const y = (0.16 + t * 0.68 + wrapPickSafe(rng, -0.06, 0.06)) * WRAP_BOX.h;
  return {
    x: (left ? wrapPickSafe(rng, -0.14, 0.02) : wrapPickSafe(rng, 0.98, 1.14)) * WRAP_BOX.w,
    y: Math.max(4, Math.min(WRAP_BOX.h - 4, y)),
    aim: left ? wrapPickSafe(rng, -26, 26) : 180 + wrapPickSafe(rng, -26, 26),
    reach: WRAP_BOX.w * wrapPickSafe(rng, 0.92, 1.34),
    left: left,
  };
}

function wrapPickSafe(rng, lo, hi) {
  if (typeof webPick === "function") return webPick(rng, lo, hi);
  return lo + (typeof rng === "function" ? rng() : Math.random()) * (hi - lo);
}

function wrapPickIntSafe(rng, lo, hi) {
  if (typeof webPickInt === "function") return webPickInt(rng, lo, hi);
  return Math.floor(wrapPickSafe(rng, lo, hi + 1 - 1e-9));
}

function wrapPlanFor(rng, hub) {
  return webPlan(rng, hub, {
    minSpokes: 2, maxSpokes: 3,
    minRings: 1, maxRings: 1,
    minSpread: 8, maxSpread: 22,
  });
}

function wrapCrosses(rng, plan) {
  const out = [];
  const angles = plan.angles;
  for (let i = 1; i < angles.length; i += 1) {
    if (webRand(rng) < 0.6) continue;
    out.push(webCross(rng, plan.hub, angles[i - 1], angles[i], plan.hub.reach));
  }
  return out;
}

function wrapBundleEl(hub, order) {
  const g = document.createElementNS(WEBGEOM_NS, "g");
  g.setAttribute("class", "webwrap__bundle");
  g.style.setProperty("--d", Math.round(order * WRAP_STEP) + "ms");
  g.style.setProperty("--ox", webRound(hub.x) + "px");
  g.style.setProperty("--oy", webRound(hub.y) + "px");
  return g;
}

function wrapSegEl(seg, cls, weight, budget) {
  if (budget.left <= 0) return null;
  budget.left -= 1;
  const path = webPathEl(seg, cls, 0, weight);
  path.style.removeProperty("--d");
  return path;
}

function wrapDrawPlan(g, plan, rng, budget) {
  const weight = wrapPickSafe(rng, 1.1, 2.2);
  plan.spokes.forEach((seg) => {
    const el = wrapSegEl(seg, "webwrap__silk", weight, budget);
    if (el) g.appendChild(el);
  });
  plan.rings.forEach((seg) => {
    const el = wrapSegEl(seg, "webwrap__cinch", weight * 0.7, budget);
    if (el) g.appendChild(el);
  });
  wrapCrosses(rng, plan).forEach((seg) => {
    const el = wrapSegEl(seg, "webwrap__cinch", weight * 0.55, budget);
    if (el) g.appendChild(el);
  });
}

function wrapSilkSvg(rng) {
  const svg = webSvgEl("webwrap__silk-svg", "0 0 " + WRAP_BOX.w + " " + WRAP_BOX.h);
  svg.setAttribute("preserveAspectRatio", "none");
  const root = document.createElementNS(WEBGEOM_NS, "g");
  root.setAttribute("class", "webwrap__g");
  const total = wrapPickIntSafe(rng, WRAP_STRANDS[0], WRAP_STRANDS[1]);
  const budget = { left: WRAP_MAX_PATHS };
  let made = 0;
  for (let i = 0; i < total; i += 1) {
    if (budget.left <= 0) break;
    const hub = wrapHub(rng, i, total);
    const g = wrapBundleEl(hub, made);
    wrapDrawPlan(g, wrapPlanFor(rng, hub), rng, budget);
    if (!g.childNodes.length) continue;
    root.appendChild(g);
    made += 1;
  }
  svg.appendChild(root);
  svg.dataset.strands = made + "";
  return svg;
}

function wrapTether(rng, box) {
  const svg = webSvgEl("webwrap__tether-svg", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const g = document.createElementNS(WEBGEOM_NS, "g");
  g.setAttribute("class", "webwrap__bundle webwrap__bundle--tether");
  g.style.setProperty("--d", "0ms");
  const path = document.createElementNS(WEBGEOM_NS, "path");
  path.setAttribute("class", "webwrap__tether");
  const x = 50 + wrapPickSafe(rng, -9, 9);
  const bow = 50 + wrapPickSafe(rng, -14, 14);
  path.setAttribute("d", "M" + webRound(x) + " 0 Q" + webRound(bow) + " 52 50 100");
  path.setAttribute("stroke-width", "0.9");
  g.appendChild(path);
  svg.appendChild(g);
  svg.style.setProperty("--webwrap-tether-h", Math.max(0, Math.round(box.top)) + "px");
  return svg;
}

function wrapStage(sheet, box) {
  const stage = document.createElement("div");
  stage.className = "webwrap";
  stage.setAttribute("aria-hidden", "true");
  stage.style.setProperty("--webwrap-top", Math.round(box.top) + "px");
  stage.style.setProperty("--webwrap-left", Math.round(box.left) + "px");
  stage.style.setProperty("--webwrap-w", Math.round(box.width) + "px");
  stage.style.setProperty("--webwrap-h", Math.round(box.height) + "px");
  return stage;
}

function wrapReduced() {
  if (typeof webReduced === "function") return webReduced();
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion:reduce)").matches;
}

function wrapQuiet() {
  if (wrapReduced()) return true;
  if (typeof document !== "undefined" && document.documentElement) {
    if (document.documentElement.classList.contains("is-capture")) return true;
  }
  return false;
}

function sheetWrapClose(modal, sheet) {
  if (wrapQuiet()) return null;
  const rng = wrapRng();
  const box = sheet.getBoundingClientRect();
  const stage = wrapStage(sheet, box);
  const silk = wrapSilkSvg(rng);
  const tether = wrapTether(rng, box);
  stage.appendChild(tether);
  stage.appendChild(silk);
  modal.appendChild(stage);
  const sway = wrapPickSafe(rng, 3.2, 7.4) * (webRand(rng) < 0.5 ? -1 : 1);
  const rise = Math.round(box.top + box.height + wrapPickSafe(rng, 60, 130));
  sheet.style.setProperty("--webwrap-sway", sway.toFixed(2) + "deg");
  sheet.style.setProperty("--webwrap-rise", "-" + rise + "px");
  sheet.style.setProperty("--webwrap-lash", WRAP_LASH_MS + "ms");
  sheet.style.setProperty("--webwrap-cinch-at", WRAP_CINCH_AT + "ms");
  sheet.style.setProperty("--webwrap-haul-at", WRAP_HAUL_AT + "ms");
  modal.classList.add("is-webwrapping");
  requestAnimationFrame(() => stage.classList.add("webwrap--fire"));
  return {
    ms: WRAP_MS,
    cleanup: () => {
      modal.classList.remove("is-webwrapping");
      sheet.style.removeProperty("--webwrap-sway");
      sheet.style.removeProperty("--webwrap-rise");
      sheet.style.removeProperty("--webwrap-lash");
      sheet.style.removeProperty("--webwrap-cinch-at");
      sheet.style.removeProperty("--webwrap-haul-at");
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    },
  };
}

if (typeof sheetCloseRegister === "function") sheetCloseRegister("KESTREL", sheetWrapClose);

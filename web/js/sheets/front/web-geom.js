"use strict";

const WEBGEOM_NS = "http://www.w3.org/2000/svg";
const WEBGEOM_PULL = 0.86;

function webRound(n) {
  return Math.round(n * 10) / 10;
}

function webRand(rng) {
  return typeof rng === "function" ? rng() : Math.random();
}

function webPick(rng, lo, hi) {
  return lo + webRand(rng) * (hi - lo);
}

function webPickInt(rng, lo, hi) {
  return Math.floor(webPick(rng, lo, hi + 1 - 1e-9));
}

function webSeedRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function webPoint(hub, angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return [hub.x + Math.cos(rad) * radius, hub.y + Math.sin(rad) * radius];
}

function webSpokeAngles(rng, aim, spread, count) {
  const out = [];
  const step = count > 1 ? (spread * 2) / (count - 1) : 0;
  for (let i = 0; i < count; i += 1) {
    const base = aim - spread + step * i;
    out.push(base + webPick(rng, -step * 0.32, step * 0.32));
  }
  return out.sort((a, b) => a - b);
}

function webSpoke(rng, hub, angle, reach) {
  const end = webPoint(hub, angle, reach);
  const mid = webPoint(hub, angle + webPick(rng, -4, 4), reach * 0.55);
  return {
    kind: "spoke",
    angle: angle,
    reach: reach,
    end: end,
    d: "M" + webRound(hub.x) + " " + webRound(hub.y) +
      " Q" + webRound(mid[0]) + " " + webRound(mid[1]) +
      " " + webRound(end[0]) + " " + webRound(end[1]),
    len: reach,
  };
}

function webRing(hub, a, b, ra, rb, sag) {
  const pa = webPoint(hub, a, ra);
  const pb = webPoint(hub, b, rb);
  const mx = (pa[0] + pb[0]) / 2;
  const my = (pa[1] + pb[1]) / 2;
  const pull = WEBGEOM_PULL - sag;
  const cx = hub.x + (mx - hub.x) * pull;
  const cy = hub.y + (my - hub.y) * pull;
  const span = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
  return {
    kind: "ring",
    d: "M" + webRound(pa[0]) + " " + webRound(pa[1]) +
      " Q" + webRound(cx) + " " + webRound(cy) +
      " " + webRound(pb[0]) + " " + webRound(pb[1]),
    len: span * (1 + sag),
  };
}

function webRingRadii(rng, rings, reach) {
  const out = [];
  const lo = 0.28;
  const hi = 1.02;
  for (let r = 0; r < rings; r += 1) {
    const t = rings > 1 ? r / (rings - 1) : 0.5;
    out.push(reach * (lo + t * (hi - lo) + webPick(rng, -0.03, 0.03)));
  }
  return out;
}

function webPlan(rng, hub, opts) {
  const cfg = opts || {};
  const count = webPickInt(rng, cfg.minSpokes || 5, cfg.maxSpokes || 8);
  const spread = webPick(rng, cfg.minSpread || 34, cfg.maxSpread || 58);
  const reach = hub.reach;
  const angles = webSpokeAngles(rng, hub.aim, spread, count);
  const spokes = angles.map((a) => webSpoke(rng, hub, a, reach * webPick(rng, 0.82, 1.12)));
  const radii = webRingRadii(rng, webPickInt(rng, cfg.minRings || 2, cfg.maxRings || 4), reach);
  const rings = [];
  for (let r = 0; r < radii.length; r += 1) {
    const sag = webPick(rng, 0.1, 0.2);
    for (let i = 1; i < angles.length; i += 1) {
      if (r > 0 && webRand(rng) < 0.16) continue;
      const wob = 1 + webPick(rng, -0.07, 0.07);
      rings.push(webRing(hub, angles[i - 1], angles[i], radii[r], radii[r] * wob, sag));
    }
  }
  return { hub: hub, spokes: spokes, rings: rings, radii: radii, angles: angles };
}

function webTaper(seg, hub, near, far) {
  if (seg.kind === "spoke") return near;
  const t = Math.min(1, Math.hypot(seg.len, 0) / (hub.reach * 1.6));
  return near + (far - near) * t;
}

function webPathEl(seg, cls, delay, width) {
  const path = document.createElementNS(WEBGEOM_NS, "path");
  path.setAttribute("class", cls);
  path.setAttribute("d", seg.d);
  path.setAttribute("stroke-width", webRound(width) + "");
  path.style.setProperty("--len", Math.ceil(seg.len * 1.3) + "");
  path.style.setProperty("--d", Math.round(delay) + "ms");
  return path;
}

function webSvgEl(cls, viewBox) {
  const svg = document.createElementNS(WEBGEOM_NS, "svg");
  svg.setAttribute("class", cls);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

function webReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion:reduce)").matches;
}

function webCapture() {
  if (typeof document === "undefined" || !document.documentElement) return false;
  return document.documentElement.classList.contains("is-capture");
}

function webStill() {
  return webReduced() || webCapture();
}

function webInBox(point, box) {
  return point[0] >= box.x && point[0] <= box.x + box.w &&
    point[1] >= box.y && point[1] <= box.y + box.h;
}

function webQuadAt(p0, c, p1, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
}

function webClearOf(seg, box) {
  if (!box) return true;
  const n = (seg.d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  if (n.length < 6) {
    for (let i = 0; i + 1 < n.length; i += 2) {
      if (webInBox([n[i], n[i + 1]], box)) return false;
    }
    return true;
  }
  const p0 = [n[0], n[1]];
  const c = [n[2], n[3]];
  const p1 = [n[4], n[5]];
  for (let i = 0; i <= 12; i += 1) {
    if (webInBox(webQuadAt(p0, c, p1, i / 12), box)) return false;
  }
  return true;
}

function webKeepOut(plan, box) {
  if (!box) return plan;
  return {
    hub: plan.hub,
    spokes: plan.spokes.filter((s) => webClearOf(s, box)),
    rings: plan.rings.filter((s) => webClearOf(s, box)),
    radii: plan.radii,
    angles: plan.angles,
  };
}

function webCross(rng, hub, a, b, radius) {
  const pa = webPoint(hub, a, radius * webPick(rng, 0.5, 0.82));
  const pb = webPoint(hub, b, radius * webPick(rng, 0.86, 1.06));
  const mx = (pa[0] + pb[0]) / 2;
  const my = (pa[1] + pb[1]) / 2;
  const pull = webPick(rng, 0.9, 1.06);
  return {
    kind: "cross",
    d: "M" + webRound(pa[0]) + " " + webRound(pa[1]) +
      " Q" + webRound(hub.x + (mx - hub.x) * pull) + " " + webRound(hub.y + (my - hub.y) * pull) +
      " " + webRound(pb[0]) + " " + webRound(pb[1]),
    len: Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 1.1,
  };
}

function webObserve(nodes, onEnter, margin) {
  if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    nodes.forEach(onEnter);
    return null;
  }
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      onEnter(entry.target);
    });
  }, { rootMargin: margin || "0px 0px -10% 0px" });
  nodes.forEach((node) => observer.observe(node));
  return observer;
}

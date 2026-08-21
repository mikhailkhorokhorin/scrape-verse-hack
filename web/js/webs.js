"use strict";

const WEBS_SIZE = 40;
const WEBS_SPOKES = 6;
const WEBS_ARCS = 3;
const WEBS_STEP = 28;

function websWobble(seed, i) {
  const n = Math.sin((seed + 1) * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function websSpokeAngles(seed) {
  const out = [];
  const span = 84;
  const start = 2;
  for (let i = 0; i < WEBS_SPOKES; i += 1) {
    const base = start + (span * i) / (WEBS_SPOKES - 1);
    out.push(base + (websWobble(seed, i) - 0.5) * 9);
  }
  return out;
}

function websPoint(angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return [Math.cos(rad) * radius, Math.sin(rad) * radius];
}

function websRound(n) {
  return Math.round(n * 10) / 10;
}

function websSpokePath(seed, angle, i) {
  const r = WEBS_SIZE * (0.72 + websWobble(seed, i + 40) * 0.26);
  const end = websPoint(angle, r);
  const mid = websPoint(angle + (websWobble(seed, i + 80) - 0.5) * 7, r * 0.55);
  return "M0 0 Q" + websRound(mid[0]) + " " + websRound(mid[1]) +
    " " + websRound(end[0]) + " " + websRound(end[1]);
}

function websArcPath(seed, angles, ring) {
  const r = WEBS_SIZE * (0.2 + ring * 0.22);
  let d = "";
  for (let i = 0; i < angles.length; i += 1) {
    const jitter = 1 + (websWobble(seed, i + ring * 20 + 120) - 0.5) * 0.2;
    const p = websPoint(angles[i], r * jitter);
    if (i === 0) {
      d = "M" + websRound(p[0]) + " " + websRound(p[1]);
    } else {
      const prev = websPoint(angles[i - 1], r * jitter);
      const mx = (prev[0] + p[0]) / 2;
      const my = (prev[1] + p[1]) / 2;
      const pull = 0.86;
      d += " Q" + websRound(mx * pull) + " " + websRound(my * pull) +
        " " + websRound(p[0]) + " " + websRound(p[1]);
    }
  }
  return d;
}

function websPaths(seed) {
  const angles = websSpokeAngles(seed);
  const out = angles.map((a, i) => websSpokePath(seed, a, i));
  for (let ring = 1; ring <= WEBS_ARCS; ring += 1) {
    out.push(websArcPath(seed, angles, ring));
  }
  return out;
}

function websSvg(seed) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "webnode webnode--wait");
  svg.setAttribute("viewBox", "-3 -6 40 40");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "webnode__g");
  const paths = websPaths(seed);
  for (let i = 0; i < paths.length; i += 1) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", paths[i]);
    path.style.setProperty("--d", i * WEBS_STEP + "ms");
    g.appendChild(path);
  }
  svg.appendChild(g);
  return svg;
}

function websMeasure(svg) {
  const paths = svg.querySelectorAll("path");
  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    let len = 0;
    if (typeof path.getTotalLength === "function") {
      try { len = path.getTotalLength(); } catch (err) { len = 0; }
    }
    path.style.setProperty("--len", (len > 0 ? Math.ceil(len) : 120) + "");
  }
}

function websReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion:reduce)").matches;
}

function websDraw(svg) {
  if (svg.dataset.drawn === "1") return;
  svg.dataset.drawn = "1";
  svg.classList.remove("webnode--wait");
  svg.classList.add("webnode--draw");
}

function websSettle(svg) {
  if (svg.dataset.drawn === "1") return;
  svg.dataset.drawn = "1";
  svg.classList.remove("webnode--wait");
}

function websObserve(nodes) {
  if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    nodes.forEach(websSettle);
    return;
  }
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      websDraw(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  nodes.forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    const visible = rect.top < (window.innerHeight || 0) && rect.bottom > 0;
    if (visible) websSettle(svg);
    else observer.observe(svg);
  });
}

function websMountRules() {
  const rules = document.querySelectorAll(".sechead .rule");
  const made = [];
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (rule.querySelector(".webnode")) continue;
    const svg = websSvg(i);
    rule.appendChild(svg);
    websMeasure(svg);
    made.push(svg);
  }
  return made;
}

function mountWebs() {
  if (typeof document === "undefined" || !document.querySelectorAll) return;
  const made = websMountRules();
  if (made.length === 0) return;
  if (websReduced()) {
    made.forEach(websSettle);
    return;
  }
  websObserve(made);
}

if (typeof document !== "undefined" && document.querySelectorAll) {
  mountWebs();
}

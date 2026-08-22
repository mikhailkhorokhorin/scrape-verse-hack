"use strict";

const RAYS_MIN = 22;
const RAYS_MAX = 30;
const RAYS_NS = "http://www.w3.org/2000/svg";
const RAYS_MS = 460;
const RAYS_DELAY = 260;
const RAYS_SIDES = [
  { nx: 0, ny: -1, tx: 1, ty: 0 },
  { nx: 1, ny: 0, tx: 0, ty: 1 },
  { nx: 0, ny: 1, tx: -1, ty: 0 },
  { nx: -1, ny: 0, tx: 0, ty: -1 }
];

function raysRand() {
  return Math.random();
}

function raysPick(lo, hi) {
  return lo + raysRand() * (hi - lo);
}

function raysRound(n) {
  return Math.round(n * 10) / 10;
}

function raysEdge(box) {
  const top = Math.max(box.top, 0);
  const bottom = Math.min(box.bottom, window.innerHeight);
  if (box.width <= 0 || bottom - top <= 0) return null;
  return {
    left: box.left,
    right: box.right,
    top: top,
    bottom: bottom,
    width: box.width,
    height: bottom - top
  };
}

function raysAnchor(edge, side, at) {
  if (side.ny === -1) return { x: edge.left + edge.width * at, y: edge.top };
  if (side.ny === 1) return { x: edge.left + edge.width * at, y: edge.bottom };
  if (side.nx === 1) return { x: edge.right, y: edge.top + edge.height * at };
  return { x: edge.left, y: edge.top + edge.height * at };
}

function raysSpan(edge, side) {
  return side.nx === 0 ? edge.width : edge.height;
}

function raysPath(base, side, reach, half, skew) {
  const x1 = base.x - side.tx * half;
  const y1 = base.y - side.ty * half;
  const x2 = base.x + side.tx * half;
  const y2 = base.y + side.ty * half;
  const tipX = base.x + side.nx * reach + side.tx * skew;
  const tipY = base.y + side.ny * reach + side.ty * skew;
  return "M" + raysRound(x1) + " " + raysRound(y1) +
    "L" + raysRound(x2) + " " + raysRound(y2) +
    "L" + raysRound(tipX) + " " + raysRound(tipY) + "Z";
}

function raysTone(i) {
  if (i % 7 === 0) return " panelrays__ray--cyan";
  if (i % 5 === 0) return " panelrays__ray--pink";
  return "";
}

function raysOrigin(base, side, reach) {
  const ox = base.x - side.nx * reach * 0.12;
  const oy = base.y - side.ny * reach * 0.12;
  return raysRound(ox) + "px " + raysRound(oy) + "px";
}

function raysBuild(edge) {
  const svg = document.createElementNS(RAYS_NS, "svg");
  svg.setAttribute("class", "panelrays");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const count = Math.round(raysPick(RAYS_MIN, RAYS_MAX));
  const perSide = Math.max(2, Math.round(count / 4));
  let i = 0;
  RAYS_SIDES.forEach((side) => {
    const span = raysSpan(edge, side);
    const step = 1 / perSide;
    for (let k = 0; k < perSide; k += 1) {
      const at = step * (k + raysPick(0.18, 0.82));
      const base = raysAnchor(edge, side, at);
      const reach = raysPick(46, 132);
      const half = span * raysPick(0.018, 0.055);
      const skew = raysPick(-half, half);
      const path = document.createElementNS(RAYS_NS, "path");
      path.setAttribute("class", "panelrays__ray" + raysTone(i));
      path.setAttribute("d", raysPath(base, side, reach, half, skew));
      path.style.setProperty("--o", raysOrigin(base, side, reach));
      path.style.setProperty("--d", Math.round(raysPick(0, 90)) + "ms");
      svg.appendChild(path);
      i += 1;
    }
  });
  return svg;
}

function raysClear(modal) {
  const old = modal.querySelector(".panelrays");
  if (old) old.remove();
}

function panelRaysFire(modal) {
  if (!modal) return null;
  const sheet = modal.querySelector(".sheet");
  if (!sheet) return null;
  const edge = raysEdge(sheet.getBoundingClientRect());
  if (!edge) return null;
  raysClear(modal);
  const svg = raysBuild(edge);
  modal.insertBefore(svg, modal.firstChild);
  setTimeout(() => {
    if (svg.parentNode) svg.remove();
  }, RAYS_MS + 160);
  return svg;
}

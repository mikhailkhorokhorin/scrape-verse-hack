"use strict";

const SCRATCH_RADIUS = 22;
const SCRATCH_ROW_H = 26;
const SCRATCH_COVER = 0.82;
const SCRATCH_CLEARANCE = 18;
const SCRATCH_SAMPLES = 14;
const SCRATCH_CELL = 190;
const SCRATCH_CONCEALS = ".integrity,.sparkframe,.spark__note,.bar,.chips";
const SCRATCH_KEEPS = ".phead";
const SCRATCH_AIMS = [30, 78, 126, 174, -138, -84, -30, 12];

function scratchRng(seed) {
  return webSeedRng((((seed >>> 0) || 1) * 2654435761) >>> 0);
}

function scratchGrid(box) {
  const cols = Math.max(2, Math.round(box.w / SCRATCH_CELL));
  const rows = Math.max(2, Math.round(box.h / SCRATCH_CELL));
  return { cols: cols, rows: rows, dx: box.w / cols, dy: box.h / rows };
}

function scratchHubAt(rng, grid, col, row, band) {
  const stagger = row % 2 === 0 ? 0 : grid.dx * 0.5;
  const jx = webPick(rng, -0.18, 0.18) * grid.dx;
  const jy = webPick(rng, -0.14, 0.14) * grid.dy;
  const aim = SCRATCH_AIMS[(col * 3 + row * 5) % SCRATCH_AIMS.length];
  return {
    x: col * grid.dx + stagger + jx,
    y: band.top + row * grid.dy + jy,
    aim: aim + webPick(rng, -22, 22),
    reach: Math.max(grid.dx, grid.dy) * webPick(rng, 0.9, 1.25),
  };
}

function scratchQuadPoints(d) {
  const n = (String(d).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  if (n.length < 6) return n.length >= 2 ? [[n[0], n[1]]] : [];
  const p0 = [n[0], n[1]];
  const c = [n[2], n[3]];
  const p1 = [n[4], n[5]];
  const out = [];
  for (let i = 0; i <= SCRATCH_SAMPLES; i += 1) {
    out.push(webQuadAt(p0, c, p1, i / SCRATCH_SAMPLES));
  }
  return out;
}

function scratchStrand(seg, hub, kind, weight) {
  return {
    d: seg.d,
    kind: kind,
    weight: weight,
    anchor: [webRound(hub.x), webRound(hub.y)],
    points: scratchQuadPoints(seg.d),
  };
}

function scratchPlanFor(rng, hub) {
  const plan = webPlan(rng, hub, {
    minSpokes: 5, maxSpokes: 6,
    minRings: 4, maxRings: 5,
    minSpread: 52, maxSpread: 72,
  });
  const out = plan.spokes.map((seg) => scratchStrand(seg, hub, "spoke", 1.4));
  plan.rings.forEach((seg, i) => {
    const t = i / Math.max(1, plan.rings.length - 1);
    out.push(scratchStrand(seg, hub, "ring", 1.15 - t * 0.3));
  });
  return out;
}

function scratchInBand(strand, box, band) {
  const pts = strand.points;
  const pad = SCRATCH_RADIUS;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    if (p[0] >= -pad && p[0] <= box.w + pad &&
      p[1] >= band.top - pad && p[1] <= box.h + pad) return true;
  }
  return false;
}

function scratchStrands(box, seed, top) {
  if (typeof webPlan !== "function") return [];
  const band = { top: Math.max(0, Math.min(box.h, Number(top) || 0)) };
  const inner = { w: box.w, h: box.h - band.top };
  if (inner.h <= 0) return [];
  const grid = scratchGrid(inner);
  const rng = scratchRng(seed);
  const out = [];
  for (let row = 0; row <= grid.rows; row += 1) {
    for (let col = 0; col <= grid.cols; col += 1) {
      scratchPlanFor(rng, scratchHubAt(rng, grid, col, row, band)).forEach((strand) => {
        if (scratchInBand(strand, box, band)) out.push(strand);
      });
    }
  }
  return out;
}

function scratchSegHit(a, b, px, py, r) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = ((px - a[0]) * dx + (py - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = a[0] + dx * t;
  const cy = a[1] + dy * t;
  return Math.hypot(px - cx, py - cy) <= r;
}

function scratchStrandHit(strand, px, py, r) {
  const pts = strand.points;
  if (pts.length === 0) return false;
  if (pts.length === 1) return Math.hypot(px - pts[0][0], py - pts[0][1]) <= r;
  for (let i = 1; i < pts.length; i += 1) {
    if (scratchSegHit(pts[i - 1], pts[i], px, py, r)) return true;
  }
  return false;
}

function scratchHitAt(strands, px, py, r) {
  const out = [];
  for (let i = 0; i < strands.length; i += 1) {
    if (strands[i].torn) continue;
    if (scratchStrandHit(strands[i], px, py, r)) out.push(i);
  }
  return out;
}

function scratchTornShare(strands) {
  if (!strands.length) return 0;
  let torn = 0;
  for (let i = 0; i < strands.length; i += 1) {
    if (strands[i].torn) torn += 1;
  }
  return torn / strands.length;
}

function scratchAllTorn(strands) {
  return strands.length > 0 && scratchTornShare(strands) >= 1;
}

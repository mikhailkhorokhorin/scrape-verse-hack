"use strict";

const RIG_BUILD = {
  BODEGA: {
    body: { rx: 30, ry: 20, cy: 58 },
    head: { rx: 17, ry: 13, cy: 34 },
    legSpan: 40,
    legDrop: 26,
    legBend: 10,
    legWidth: 5,
    mark: "M-9 30 L0 24 L9 30 L0 27 Z",
    plate: "M-13 44 L0 38 L13 44 L8 58 L-8 58 Z",
  },
  ATLAS: {
    body: { rx: 17, ry: 24, cy: 58 },
    head: { rx: 12, ry: 12, cy: 31 },
    legSpan: 64,
    legDrop: 12,
    legBend: 34,
    legWidth: 2.8,
    mark: "M-8 27 L0 22 L8 27 L4 34 L-4 34 Z",
    plate: "M-11 44 L0 36 L11 44 L11 60 L0 66 L-11 60 Z",
  },
  KESTREL: {
    body: { rx: 21, ry: 15, cy: 53 },
    head: { rx: 13, ry: 10, cy: 33 },
    legSpan: 56,
    legDrop: 4,
    legBend: 40,
    legWidth: 3.2,
    angular: true,
    mark: "M-10 26 L0 33 L10 26 L0 30 Z",
    plate: "M0 36 L12 46 L6 60 L-6 60 L-12 46 Z",
  },
};

const RIG_FALLBACK = RIG_BUILD.KESTREL;

const LEG_SLOTS = [0, 1, 2, 3];
const PEDIPALP_SLOT = -0.9;

function rigBuildOf(code) {
  return RIG_BUILD[code] || RIG_FALLBACK;
}

function legPath(build, slot, side, state) {
  const rootX = side * build.body.rx * 0.72;
  const rootY = build.body.cy + (slot - 1.5) * build.body.ry * 0.44;
  const reach = state === "dead" ? build.legSpan * 0.58 : build.legSpan;
  const spread = 1 - slot * 0.12;
  const kneeX = rootX + side * reach * 0.52 * spread;
  const kneeY = state === "dead" ? rootY + build.legBend * 0.5 : rootY - build.legBend;
  const footX = rootX + side * reach * spread;
  const footY = state === "dead"
    ? rootY + build.legDrop + build.legBend * 1.6
    : rootY + build.legDrop + slot * 4;
  const head = "M" + rootX.toFixed(1) + " " + rootY.toFixed(1);
  if (build.angular) {
    return head + " L" + kneeX.toFixed(1) + " " + kneeY.toFixed(1) +
      " L" + footX.toFixed(1) + " " + footY.toFixed(1);
  }
  return head + " Q" + kneeX.toFixed(1) + " " + kneeY.toFixed(1) +
    " " + footX.toFixed(1) + " " + footY.toFixed(1);
}

function eyeRow(build) {
  const y = build.head.cy - build.head.ry * 0.25;
  const wide = build.head.rx * 0.62;
  return [
    { cx: -wide, cy: y + 3, r: 2.1, rank: 3 },
    { cx: -wide * 0.45, cy: y, r: 2.7, rank: 1 },
    { cx: wide * 0.45, cy: y, r: 2.7, rank: 1 },
    { cx: wide, cy: y + 3, r: 2.1, rank: 3 },
    { cx: -wide * 0.72, cy: y + 6.5, r: 1.7, rank: 2 },
    { cx: -wide * 0.24, cy: y + 7.5, r: 1.5, rank: 4 },
    { cx: wide * 0.24, cy: y + 7.5, r: 1.5, rank: 4 },
    { cx: wide * 0.72, cy: y + 6.5, r: 1.7, rank: 2 },
  ];
}

function litRankFor(status) {
  if (status === "unwatched") return 0;
  if (status === "critical") return 1;
  if (status === "degraded") return 2;
  if (status === "reweaving") return 3;
  return 4;
}

function seedOf(code) {
  let seed = 0;
  for (let i = 0; i < code.length; i += 1) seed = (seed * 31 + code.charCodeAt(i)) % 997;
  return seed;
}

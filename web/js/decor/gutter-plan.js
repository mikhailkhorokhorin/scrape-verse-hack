"use strict";

const GUTTER_SIDES = ["left", "right"];

const GUTTER_SPOTS = ["tl", "tr", "bl", "br"];

const GUTTER_TONES = ["dim", "dim", "cyan", "pink"];

const GUTTER_MOTIFS = ["torn", "climber", "bead", "dewline", "sac", "bundle"];

const GUTTER_MIX = {
  watch: {
    corners: { tl: "cyan", br: "pink", tr: "dim", bl: "dim" },
    sure: [
      { kind: "spider", side: "right", band: [0, 0] },
      { kind: "bugle", side: "right", band: [0.5, 0.5] },
    ],
    pool: ["torn", "climber", "bead", "sac"],
    minScatter: 5,
    maxScatter: 7,
    minMotif: 3,
    maxMotif: 4,
  },
  manual: {
    corners: { tr: "pink", bl: "cyan", tl: "dim", br: "dim" },
    sure: [
      { kind: "dew", side: "right", band: [0, 0] },
      { kind: "webhead", side: "left", band: [0.16, 0.28] },
    ],
    pool: ["dewline", "bundle", "torn", "bead"],
    minScatter: 4,
    maxScatter: 6,
    minMotif: 3,
    maxMotif: 4,
  },
};

function gutterBands(rng, count, lo, hi) {
  const out = [];
  const step = (hi - lo) / count;
  for (let i = 0; i < count; i += 1) {
    out.push(lo + step * i + webPick(rng, step * 0.12, step * 0.78));
  }
  return out;
}

function gutterCornerPlan(rng, mix) {
  return GUTTER_SPOTS.filter(() => true).map((spot) => ({
    spot: spot,
    tone: mix.corners[spot] || "dim",
    scale: webPick(rng, 0.66, 1),
    fade: webPick(rng, 0.08, 0.2),
    turn: 0,
  }));
}

function gutterScatterPlan(rng, mix) {
  const total = webPickInt(rng, mix.minScatter, mix.maxScatter);
  const perSide = Math.ceil(total / 2);
  const out = [];
  GUTTER_SIDES.forEach((side, s) => {
    const take = s === 0 ? total - perSide : perSide;
    if (take < 1) return;
    gutterBands(rng, take, 0.1, 0.92).forEach((top) => {
      out.push({
        side: side,
        top: top,
        scale: webPick(rng, 0.36, 0.82),
        turn: webPick(rng, -52, 52),
        fade: webPick(rng, 0.05, 0.13),
        tone: GUTTER_TONES[webPickInt(rng, 0, GUTTER_TONES.length - 1)],
        aim: webPick(rng, 0, 360),
        nudge: webPick(rng, 0, 26),
      });
    });
  });
  return out;
}

function gutterMotifPlan(rng, mix) {
  const out = mix.sure.map((s) => ({
    kind: s.kind,
    side: s.side,
    top: webPick(rng, s.band[0], s.band[1]),
    scale: webPick(rng, 0.92, 1.08),
    fade: webPick(rng, 0.3, 0.4),
    turn: 0,
    nudge: webPick(rng, 0, 10),
    tone: "dim",
  }));
  const pool = mix.pool.slice();
  const count = Math.min(pool.length, webPickInt(rng, mix.minMotif, mix.maxMotif));
  const bands = gutterBands(rng, count, 0.2, 0.86);
  for (let i = 0; i < count; i += 1) {
    const at = webPickInt(rng, 0, pool.length - 1);
    const kind = pool.splice(at, 1)[0];
    out.push({
      kind: kind,
      side: GUTTER_SIDES[webPickInt(rng, 0, 1)],
      top: bands[i],
      scale: webPick(rng, 0.62, 1.0),
      fade: webPick(rng, 0.06, 0.14),
      turn: webPick(rng, -4, 4),
      nudge: webPick(rng, 0, 18),
      tone: GUTTER_TONES[webPickInt(rng, 0, GUTTER_TONES.length - 1)],
    });
  }
  return out;
}

function gutterPlan(rng, page) {
  const mix = GUTTER_MIX[page] || GUTTER_MIX.watch;
  return {
    page: page,
    corners: gutterCornerPlan(rng, mix),
    scatter: gutterScatterPlan(rng, mix),
    motifs: gutterMotifPlan(rng, mix),
  };
}

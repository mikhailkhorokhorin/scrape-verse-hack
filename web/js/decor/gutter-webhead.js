"use strict";

const GUTTER_WEBHEAD_MASK = [
  "M0 -4 L0 22",
  "M-10 3 q10 -5 20 0",
  "M-11 10 q11 5 22 0",
  "M-8 17 q8 4 16 0",
];

const GUTTER_WEBHEAD_EYES = [
  "M-9.5 7 q4 -6 8.5 -2.5 q0.5 4 -3 6 q-4.5 1.5 -5.5 -3.5z",
  "M9.5 7 q-4 -6 -8.5 -2.5 q-0.5 4 3 6 q4.5 1.5 5.5 -3.5z",
];

const GUTTER_WEBHEAD_TORSO = [
  "M-10 24 q10 -6 20 0 q4 15 1 30 q-11 5 -22 0 q-3 -15 1 -30z",
];

const GUTTER_WEBHEAD_CHEST = [
  "M0 26 L0 52", "M-9 32 q9 4 18 0", "M-8 42 q8 4 16 0",
  "M-5 25 q-3 14 -2 27", "M5 25 q3 14 2 27",
];

const GUTTER_WEBHEAD_ARMS = [
  "M-10 28 q-11 -6 -15 -18 q-3 -10 -1 -19",
  "M10 28 q12 -4 17 -15 q4 -9 3 -19",
];

const GUTTER_WEBHEAD_HANDS = [
  { cx: -26, cy: -10, r: 4.2 },
  { cx: 30, cy: -6, r: 4.2 },
];

const GUTTER_WEBHEAD_LEGS = [
  "M-8 52 q-10 12 -8 26 q2 12 8 18",
  "M8 52 q11 11 10 25 q-1 12 -8 19",
];

const GUTTER_WEBHEAD_SPIDER = "M0 34 l0 9 M-4.5 36 l9 5 M-4.5 41 l9 -5";

function gutterWebheadThread(rng, ink, hang) {
  ink.appendChild(gutterPath(
    "gutter__thread",
    "M30 0 Q" + webRound(webPick(rng, 26, 34)) + " " + Math.round(hang * 0.55) +
      " 30 " + hang
  ));
}

function gutterWebheadLimbs(g) {
  GUTTER_WEBHEAD_LEGS.forEach((d) => g.appendChild(gutterPath("gutter__limb", d)));
  GUTTER_WEBHEAD_ARMS.forEach((d) => g.appendChild(gutterPath("gutter__limb", d)));
  GUTTER_WEBHEAD_HANDS.forEach((h) => {
    g.appendChild(gutterEl("circle", {
      class: "gutter__fist", cx: h.cx, cy: h.cy, r: h.r,
    }));
  });
}

function gutterWebheadTrunk(g) {
  GUTTER_WEBHEAD_TORSO.forEach((d) => g.appendChild(gutterPath("gutter__suit", d)));
  GUTTER_WEBHEAD_CHEST.forEach((d) => g.appendChild(gutterPath("gutter__weave", d)));
  g.appendChild(gutterPath("gutter__emblem", GUTTER_WEBHEAD_SPIDER));
}

function gutterWebheadSkull(g) {
  g.appendChild(gutterEl("ellipse", {
    class: "gutter__mask", cx: 0, cy: 9, rx: 11.5, ry: 13.5,
  }));
  GUTTER_WEBHEAD_MASK.forEach((d) => g.appendChild(gutterPath("gutter__weave", d)));
  GUTTER_WEBHEAD_EYES.forEach((d) => g.appendChild(gutterPath("gutter__lens", d)));
}

function gutterWebheadBody(hang) {
  const body = gutterEl("g", {
    class: "gutter__hero",
    transform: "translate(30 " + (hang + 96) + ") rotate(180)",
  });
  gutterWebheadLimbs(body);
  gutterWebheadTrunk(body);
  gutterWebheadSkull(body);
  return body;
}

function gutterWebheadSvg(rng) {
  const svg = gutterMotifSvg("gutter__webhead", "0 0 60 300");
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const ink = gutterInk(svg);
  const hang = 120 + Math.round(webPick(rng, -14, 22));
  const g = gutterEl("g", { class: "gutter__swing gutter__swing--webhead" });
  gutterWebheadThread(rng, g, hang);
  g.appendChild(gutterWebheadBody(hang));
  ink.appendChild(g);
  return svg;
}

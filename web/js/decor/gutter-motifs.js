"use strict";

const GUTTER_TORN = [
  "M6 4 L52 20", "M6 4 L44 52", "M6 4 L18 58",
  "M20 11 q13 9 21 22", "M14 24 q11 12 15 25",
];

const GUTTER_TORN_LOOSE = [
  "M52 20 q9 6 6 15", "M44 52 q7 8 2 15", "M18 58 q-4 9 -11 11",
];

const GUTTER_BUNDLE_WRAPS = [
  "M12 22 q14 -7 26 2", "M11 30 q15 -6 28 3",
  "M12 38 q14 -6 26 3", "M15 46 q12 -5 21 3",
];

function gutterMotifSvg(cls, box) {
  const svg = webSvgEl("gutter__motif " + cls, box);
  svg.appendChild(gutterEl("g", { class: "gutter__ink" }));
  return svg;
}

function gutterInk(svg) {
  return svg.firstChild;
}

function gutterTornSvg(rng) {
  const svg = gutterMotifSvg("gutter__torn", "0 0 70 80");
  const ink = gutterInk(svg);
  GUTTER_TORN.forEach((d) => ink.appendChild(gutterPath("gutter__strand", d)));
  GUTTER_TORN_LOOSE.forEach((d, i) => {
    const loose = gutterPath("gutter__loose", d);
    loose.style.setProperty("--d", i * 900 + webRound(webPick(rng, 0, 700)) + "ms");
    ink.appendChild(loose);
  });
  return svg;
}

function gutterClimberSvg(rng) {
  const svg = gutterMotifSvg("gutter__climber", "0 0 44 130");
  const ink = gutterInk(svg);
  ink.appendChild(gutterPath("gutter__thread", "M22 0 L22 130"));
  const at = webRound(webPick(rng, 52, 84));
  const bug = gutterEl("g", { class: "gutter__crawl", transform: "translate(22 " + at + ")" });
  [-1, 1].forEach((s) => {
    bug.appendChild(gutterPath("gutter__hair", "M" + s * 3 + " -3 q" + s * 8 + " -4 " + s * 10 + " -9"));
    bug.appendChild(gutterPath("gutter__hair", "M" + s * 3 + " 0 q" + s * 9 + " 0 " + s * 11 + " -2"));
    bug.appendChild(gutterPath("gutter__hair", "M" + s * 3 + " 3 q" + s * 8 + " 4 " + s * 10 + " 9"));
  });
  bug.appendChild(gutterEl("ellipse", { class: "gutter__nub", cx: 0, cy: 3, rx: 4, ry: 5 }));
  bug.appendChild(gutterEl("ellipse", { class: "gutter__nub", cx: 0, cy: -4, rx: 3, ry: 2.6 }));
  ink.appendChild(bug);
  return svg;
}

function gutterBeadSvg(rng) {
  const svg = gutterMotifSvg("gutter__bead", "0 0 96 96");
  const ink = gutterInk(svg);
  const sag = webRound(webPick(rng, 54, 68));
  ink.appendChild(gutterPath("gutter__thread", "M2 6 Q48 " + sag + " 94 90"));
  const g = gutterEl("g", { class: "gutter__slide" });
  g.appendChild(gutterEl("circle", {
    class: "gutter__drop", cx: webRound(webPick(rng, 38, 56)),
    cy: webRound(sag * 0.72 + 8), r: webRound(webPick(rng, 3.2, 5)),
  }));
  ink.appendChild(g);
  return svg;
}

function gutterDewlineSvg(rng) {
  const svg = gutterMotifSvg("gutter__dewline", "0 0 60 120");
  const ink = gutterInk(svg);
  const bow = webRound(webPick(rng, 38, 50));
  ink.appendChild(gutterPath("gutter__thread", "M8 2 Q" + bow + " 60 14 118"));
  const count = webPickInt(rng, 4, 6);
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    const x = 8 + (bow - 8) * 2 * t * (1 - t) + 6 * t;
    ink.appendChild(gutterEl("circle", {
      class: "gutter__drop", cx: webRound(x), cy: webRound(t * 116 + 2),
      r: webRound(webPick(rng, 2, 3.6)),
    }));
  }
  return svg;
}

function gutterSacSvg(rng) {
  const svg = gutterMotifSvg("gutter__sac", "0 0 56 120");
  const ink = gutterInk(svg);
  const drop = webRound(webPick(rng, 48, 66));
  ink.appendChild(gutterPath("gutter__thread", "M28 0 L28 " + drop));
  const g = gutterEl("g", { class: "gutter__swing gutter__swing--sac" });
  g.appendChild(gutterEl("ellipse", {
    class: "gutter__pod", cx: 28, cy: drop + 17, rx: webRound(webPick(rng, 12, 16)), ry: 18,
  }));
  [-5, 0, 5].forEach((o) => {
    g.appendChild(gutterPath("gutter__strand",
      "M" + (28 + o) + " " + (drop + 3) + " q" + o + " 14 " + o * 1.4 + " 28"));
  });
  ink.appendChild(g);
  return svg;
}

function gutterBundleSvg(rng) {
  const svg = gutterMotifSvg("gutter__bundle", "0 0 56 110");
  const ink = gutterInk(svg);
  const drop = webRound(webPick(rng, 12, 22));
  ink.appendChild(gutterPath("gutter__thread", "M8 0 L18 " + drop));
  ink.appendChild(gutterPath("gutter__thread", "M46 0 L36 " + drop));
  const g = gutterEl("g", { class: "gutter__swing gutter__swing--bundle" });
  g.appendChild(gutterPath("gutter__pod",
    "M25 " + drop + " q16 4 14 22 q-2 20 -12 32 q-10 -12 -13 -32 q-2 -18 11 -22z"));
  GUTTER_BUNDLE_WRAPS.forEach((d) => g.appendChild(gutterPath("gutter__strand", d)));
  ink.appendChild(g);
  return svg;
}

const GUTTER_MOTIF_MAKERS = {
  torn: gutterTornSvg,
  climber: gutterClimberSvg,
  bead: gutterBeadSvg,
  dewline: gutterDewlineSvg,
  sac: gutterSacSvg,
  bundle: gutterBundleSvg,
  bugle: gutterBugleSvg,
  webhead: gutterWebheadSvg,
};

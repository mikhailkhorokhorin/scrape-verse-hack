"use strict";

const GUTTER_CORNER = 260;
const GUTTER_AIM = { tl: 45, tr: 135, bl: -45, br: -135 };
const GUTTER_SWAYS = [11, 13, 14, 16, 17, 19, 21, 23];

function gutterSway(rng, node) {
  const secs = GUTTER_SWAYS[webPickInt(rng, 0, GUTTER_SWAYS.length - 1)];
  node.style.setProperty("--sway", secs + "s");
  node.style.setProperty("--phase", "-" + webRound(webPick(rng, 0, secs)) + "s");
}

function gutterCorner(rng, item) {
  const spot = item.spot;
  const svg = webSvgEl(
    "gutter__web gutter__web--" + spot + " gutter__web--" + item.tone,
    "0 0 " + GUTTER_CORNER + " " + GUTTER_CORNER
  );
  const g = gutterEl("g", { class: "gutter__g" });
  const hub = {
    x: spot === "tl" || spot === "bl" ? 0 : GUTTER_CORNER,
    y: spot === "tl" || spot === "tr" ? 0 : GUTTER_CORNER,
    aim: GUTTER_AIM[spot],
    reach: GUTTER_CORNER * webPick(rng, 0.86, 1.04),
  };
  const plan = webPlan(rng, hub, {
    minSpokes: 6, maxSpokes: 9, minRings: 4, maxRings: 6,
    minSpread: 40, maxSpread: 46,
  });
  plan.spokes.forEach((seg) => g.appendChild(webPathEl(seg, "gutter__spoke", 0, 1.2)));
  plan.rings.forEach((seg, i) => {
    const t = i / Math.max(1, plan.rings.length - 1);
    g.appendChild(webPathEl(seg, "gutter__ring", 0, 1.05 - t * 0.4));
  });
  svg.appendChild(g);
  svg.style.setProperty("--scale", webRound(item.scale) + "");
  svg.style.setProperty("--turn", webRound(item.turn) + "deg");
  svg.style.opacity = webRound(item.fade) + "";
  return svg;
}

function gutterScatterSvg(rng, item) {
  const svg = webSvgEl("gutter__flake gutter__flake--" + item.tone, "0 0 120 120");
  const g = gutterEl("g", { class: "gutter__g" });
  const hub = { x: 60, y: 60, aim: item.aim, reach: webPick(rng, 34, 50) };
  const plan = webPlan(rng, hub, {
    minSpokes: 4, maxSpokes: 7, minRings: 2, maxRings: 4,
    minSpread: 52, maxSpread: 88,
  });
  plan.spokes.forEach((seg) => g.appendChild(webPathEl(seg, "gutter__spoke", 0, 0.9)));
  plan.rings.forEach((seg) => g.appendChild(webPathEl(seg, "gutter__ring", 0, 0.75)));
  svg.appendChild(g);
  return svg;
}

function gutterPlace(item, node, extra) {
  const hold = document.createElement("div");
  hold.className = "gutter__slot gutter__slot--" + item.side + (extra ? " " + extra : "");
  hold.style.top = webRound(item.top * 100) + "%";
  hold.style.setProperty("--scale", webRound(item.scale) + "");
  hold.style.setProperty("--turn", webRound(item.turn) + "deg");
  hold.style.setProperty("--nudge", webRound(item.nudge) + "px");
  if (item.fade) hold.style.opacity = webRound(item.fade) + "";
  hold.appendChild(node);
  return hold;
}

function gutterSpiderSvg(rng) {
  const svg = webSvgEl("gutter__spider", "0 0 60 300");
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const drop = 210 + Math.round(webPick(rng, -30, 40));
  const g = gutterEl("g", { class: "gutter__swing" });
  g.appendChild(gutterPath("gutter__thread", "M30 0 L30 " + drop));
  g.appendChild(gutterSpiderBody(drop));
  svg.appendChild(g);
  return svg;
}

function gutterDewSvg(rng) {
  const svg = webSvgEl("gutter__dew", "0 0 40 320");
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const g = gutterEl("g", { class: "gutter__swing gutter__swing--slow" });
  const fall = 250 + Math.round(webPick(rng, -30, 40));
  g.appendChild(gutterPath(
    "gutter__thread",
    "M20 0 Q" + webRound(webPick(rng, 15, 25)) + " " + Math.round(fall * 0.5) +
      " 20 " + fall
  ));
  g.appendChild(gutterPath(
    "gutter__drop",
    "M20 " + fall + " q-7 9 -7 15 a7 7 0 0 0 14 0 q0 -6 -7 -15z"
  ));
  svg.appendChild(g);
  return svg;
}

function gutterMotifNode(rng, kind) {
  if (kind === "spider") return gutterSpiderSvg(rng);
  if (kind === "dew") return gutterDewSvg(rng);
  const make = GUTTER_MOTIF_MAKERS[kind];
  return make ? make(rng) : null;
}

function gutterLayer(page, rng) {
  const plan = gutterPlan(rng, page);
  const layer = document.createElement("div");
  layer.className = "gutter gutter--" + page;
  layer.setAttribute("aria-hidden", "true");
  plan.corners.forEach((c) => layer.appendChild(gutterCorner(rng, c)));
  plan.scatter.forEach((s) => {
    layer.appendChild(gutterPlace(s, gutterScatterSvg(rng, s), "gutter__slot--flake"));
  });
  plan.motifs.forEach((m) => {
    const node = gutterMotifNode(rng, m.kind);
    if (!node) return;
    const slot = gutterPlace(m, node, "gutter__slot--" + m.kind);
    if (m.kind === "bugle" || m.kind === "webhead") slot.style.opacity = "";
    layer.appendChild(slot);
    Array.prototype.forEach.call(node.querySelectorAll(".gutter__swing"), (sw) => gutterSway(rng, sw));
  });
  return layer;
}

function mountGutter() {
  if (typeof document === "undefined" || !document.body) return null;
  if (document.querySelector(".gutter")) return null;
  const page = document.body.classList.contains("manual-page") ? "manual" : "watch";
  const layer = gutterLayer(page, Math.random);
  document.body.insertBefore(layer, document.body.firstChild);
  return layer;
}

if (typeof document !== "undefined" && document.body) {
  mountGutter();
}

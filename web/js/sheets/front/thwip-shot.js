"use strict";

const THWIP_STEP = 13;
const THWIP_HOLD = 1000;
const THWIP_BOX = { w: 520, h: 200 };
const THWIP_SAFE = { x: 176, y: 132, w: 368, h: 68 };
const THWIP_TONES = ["cyan", "pink", ""];
const THWIP_UP_CHANCE = 0.16;
const THWIP_DOWN_CHANCE = 0.3;
const THWIP_MIN_HUBS = 2;
const THWIP_MAX_HUBS = 3;
const THWIP_EXTRA_HUB = 0.45;
const THWIP_BAND = [0.16, 0.72];
const THWIP_HUB_TRIES = 4;

const THWIP_CHARACTERS = [
  {
    name: "spray",
    hubs: 2,
    sides: ["left", "right"],
    reach: [0.34, 0.46],
    spokes: [12, 15],
    rings: [6, 9],
    spread: [30, 44],
    weight: [1.3, 1.9],
    cross: 0.35,
    splat: 0.55,
    tones: ["cyan", "pink"],
  },
  {
    name: "dense",
    hubs: 2,
    sides: ["left", "right"],
    reach: [0.48, 0.62],
    spokes: [18, 22],
    rings: [12, 14],
    spread: [34, 48],
    weight: [1.5, 2.2],
    cross: 0.7,
    splat: 0.75,
    tones: ["cyan", ""],
  },
  {
    name: "sweep",
    hubs: 2,
    sides: ["right", "right"],
    reach: [0.5, 0.66],
    spokes: [9, 14],
    rings: [4, 6],
    spread: [16, 26],
    weight: [1.1, 1.6],
    cross: 0.2,
    splat: 0.3,
    tones: ["pink", ""],
  },
  {
    name: "volley",
    hubs: 3,
    sides: ["left", "right", "left"],
    reach: [0.3, 0.4],
    spokes: [9, 14],
    rings: [4, 6],
    spread: [24, 38],
    weight: [1.0, 1.5],
    cross: 0.15,
    splat: 0.85,
    tones: ["cyan", "pink", ""],
  },
  {
    name: "anchor",
    hubs: 2,
    sides: ["left", "right"],
    reach: [0.42, 0.56],
    spokes: [14, 18],
    rings: [9, 12],
    spread: [40, 56],
    weight: [1.6, 2.4],
    cross: 0.5,
    splat: 0.4,
    tones: ["", "cyan"],
  },
];

function thwipCharacter(rng) {
  return THWIP_CHARACTERS[webPickInt(rng, 0, THWIP_CHARACTERS.length - 1)];
}

function thwipAim(rng, left, spread) {
  const roll = webRand(rng);
  const half = spread / 2;
  let off;
  if (roll < THWIP_UP_CHANCE) off = webPick(rng, -10, 2);
  else if (roll < THWIP_UP_CHANCE + THWIP_DOWN_CHANCE) off = webPick(rng, 52, 84);
  else off = half * 0.72 + webPick(rng, 2, 18);
  return left ? off : 180 - off;
}

function thwipHubs(rng, character) {
  const out = [];
  const spread = (character.spread[0] + character.spread[1]) / 2;
  const count = Math.max(THWIP_MIN_HUBS, Math.min(THWIP_MAX_HUBS, character.hubs));
  const total = count < THWIP_MAX_HUBS && webRand(rng) < THWIP_EXTRA_HUB ? count + 1 : count;
  const lane = (THWIP_BAND[1] - THWIP_BAND[0]) / total;
  for (let i = 0; i < total; i += 1) {
    const left = i % 2 === 0
      ? character.sides[0] === "left"
      : character.sides[0] !== "left";
    const tone = character.tones[i % character.tones.length];
    const band = THWIP_BAND[0] + lane * i;
    out.push({
      x: (left ? webPick(rng, 0.02, 0.12) : webPick(rng, 0.88, 0.98)) * THWIP_BOX.w,
      y: webPick(rng, band, band + lane * 0.86) * THWIP_BOX.h,
      aim: thwipAim(rng, left, spread),
      reach: THWIP_BOX.w * webPick(rng, character.reach[0], character.reach[1]),
      tone: tone === undefined ? THWIP_TONES[i % THWIP_TONES.length] : tone,
    });
  }
  return out;
}

function thwipAnchor(rng, hub, tip, order) {
  const dot = document.createElementNS(WEBGEOM_NS, "circle");
  dot.setAttribute("class", "thwip__hit" + (hub.tone ? " thwip__hit--" + hub.tone : ""));
  dot.setAttribute("cx", webRound(tip[0]) + "");
  dot.setAttribute("cy", webRound(tip[1]) + "");
  dot.setAttribute("r", webRound(webPick(rng, 1.8, 3.6)) + "");
  dot.style.setProperty("--d", Math.round(order * THWIP_STEP + 150) + "ms");
  return dot;
}

function thwipCrosses(rng, plan, character) {
  const out = [];
  if (webRand(rng) > character.cross) return out;
  const angles = plan.angles;
  const radius = plan.hub.reach;
  for (let i = 1; i < angles.length; i += 1) {
    if (webRand(rng) < 0.45) continue;
    const seg = webCross(rng, plan.hub, angles[i - 1], angles[i], radius);
    if (webClearOf(seg, THWIP_SAFE)) out.push(seg);
  }
  return out;
}

function thwipDrawPlan(g, plan, rng, order, character) {
  const hub = plan.hub;
  const tone = hub.tone ? " thwip__strand--" + hub.tone : "";
  const ringTone = hub.tone ? " thwip__ring--" + hub.tone : "";
  const weight = webPick(rng, character.weight[0], character.weight[1]);
  let n = order;
  plan.spokes.forEach((seg) => {
    g.appendChild(webPathEl(seg, "thwip__strand" + tone, n * THWIP_STEP, weight));
    n += 1;
  });
  plan.rings.forEach((seg, i) => {
    const t = i / Math.max(1, plan.rings.length - 1);
    const width = weight * (0.72 - t * 0.34);
    g.appendChild(webPathEl(seg, "thwip__ring" + ringTone, (n + i * 0.6) * THWIP_STEP + 70, width));
  });
  n += Math.ceil(plan.rings.length * 0.6);
  thwipCrosses(rng, plan, character).forEach((seg, i) => {
    g.appendChild(webPathEl(seg, "thwip__cross" + ringTone, (n + i * 0.5) * THWIP_STEP + 110, weight * 0.5));
  });
  plan.spokes.forEach((seg, i) => {
    if (webRand(rng) > character.splat) return;
    g.appendChild(thwipAnchor(rng, hub, seg.end, order + i));
  });
  return n;
}

function thwipSvg(rng) {
  const character = thwipCharacter(rng);
  const svg = webSvgEl("thwip thwip--" + character.name, "0 0 " + THWIP_BOX.w + " " + THWIP_BOX.h);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.dataset.shot = character.name;
  const g = document.createElementNS(WEBGEOM_NS, "g");
  g.setAttribute("class", "thwip__g");
  let order = 0;
  let live = 0;
  let tries = 0;
  while (live < THWIP_MIN_HUBS && tries < THWIP_HUB_TRIES) {
    thwipHubs(rng, character).forEach((hub) => {
      if (live >= THWIP_MAX_HUBS) return;
      const plan = webPlan(rng, hub, {
        minSpokes: character.spokes[0], maxSpokes: character.spokes[1],
        minRings: character.rings[0], maxRings: character.rings[1],
        minSpread: character.spread[0], maxSpread: character.spread[1],
      });
      const kept = webKeepOut(plan, THWIP_SAFE);
      if (kept.spokes.length === 0) return;
      order = thwipDrawPlan(g, kept, rng, order, character);
      live += 1;
    });
    tries += 1;
  }
  svg.appendChild(g);
  return svg;
}

function thwipReduced() {
  return webReduced();
}

function thwipFire(mark, svg) {
  if (thwipReduced()) return;
  if (mark.dataset.firing === "1") return;
  mark.dataset.firing = "1";
  svg.classList.remove("thwip--fire");
  mark.classList.remove("wordmark--fire");
  void svg.getBoundingClientRect();
  svg.classList.add("thwip--fire");
  mark.classList.add("wordmark--fire");
  setTimeout(() => {
    svg.classList.remove("thwip--fire");
    mark.classList.remove("wordmark--fire");
    mark.dataset.firing = "0";
  }, THWIP_HOLD);
}

function thwipReshoot(word, mark) {
  const old = word.querySelector(".thwip");
  if (old) old.remove();
  const svg = thwipSvg(Math.random);
  word.appendChild(svg);
  thwipFire(mark, svg);
  return svg;
}

function mountThwipShot() {
  if (typeof document === "undefined" || !document.querySelector) return null;
  const word = document.querySelector(".wordmark__word");
  if (!word || word.querySelector(".thwip")) return null;
  const mark = word.closest(".wordmark") || word;
  const svg = thwipSvg(Math.random);
  word.appendChild(svg);
  if (thwipReduced()) return svg;
  word.addEventListener("click", () => thwipReshoot(word, mark));
  hoverReplay(word, () => thwipReshoot(word, mark), THWIP_HOLD);
  requestAnimationFrame(() => thwipFire(mark, svg));
  return svg;
}

if (typeof document !== "undefined" && document.querySelector) {
  mountThwipShot();
}

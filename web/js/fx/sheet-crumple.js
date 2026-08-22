"use strict";

const CRUMPLE_MS = 1600;
const CRUMPLE_LIFT = 120;
const CRUMPLE_END = 0.1;
const CRUMPLE_MID = 0.2;
const CRUMPLE_CLIP_POINTS = 10;
const CRUMPLE_FOLDS = 4;
const CRUMPLE_DIP = 0.4;

function basketSVG() {
  return (
    '<svg class="toss__basket" viewBox="0 0 120 130" width="120" height="130" ' +
      'aria-hidden="true" focusable="false">' +
      '<path class="toss__can" d="M14 34 L26 122 Q27 127 32 127 L88 127 Q93 127 94 122 L106 34" ' +
        'fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="toss__rim" d="M8 30 Q60 22 112 30 Q60 40 8 30 Z" ' +
        'fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="toss__rib" d="M40 44 L46 118" fill="none" stroke-linecap="round"/>' +
      '<path class="toss__rib" d="M60 45 L60 119" fill="none" stroke-linecap="round"/>' +
      '<path class="toss__rib" d="M80 44 L74 118" fill="none" stroke-linecap="round"/>' +
    "</svg>"
  );
}

function basketFrontSVG() {
  return (
    '<svg class="toss__front" viewBox="0 0 120 130" width="120" height="130" ' +
      'aria-hidden="true" focusable="false">' +
      '<path class="toss__wall" d="M10 32 Q60 42 110 32 L94 122 Q93 127 88 127 L32 127 ' +
        'Q27 127 26 122 Z" stroke-linejoin="round"/>' +
      '<path class="toss__rib" d="M40 44 L46 118" fill="none" stroke-linecap="round"/>' +
      '<path class="toss__rib" d="M60 45 L60 119" fill="none" stroke-linecap="round"/>' +
      '<path class="toss__rib" d="M80 44 L74 118" fill="none" stroke-linecap="round"/>' +
    "</svg>"
  );
}

function tossDents() {
  const dents = new Set();
  const count = 2 + Math.floor(Math.random() * 2);
  while (dents.size < count) {
    dents.add(Math.floor(Math.random() * CRUMPLE_CLIP_POINTS));
  }
  return dents;
}

function tossClip(ball) {
  const dents = tossDents();
  for (let i = 0; i < CRUMPLE_CLIP_POINTS; i += 1) {
    const a = (i / CRUMPLE_CLIP_POINTS) * Math.PI * 2;
    const r = dents.has(i) ? sheetCloseRand(20, 30) : sheetCloseRand(45, 50);
    const x = 50 + Math.cos(a) * r;
    const y = 50 + Math.sin(a) * r;
    ball.style.setProperty("--tc" + i, x.toFixed(1) + "% " + y.toFixed(1) + "%");
  }
}

function tossBall() {
  const ball = document.createElement("div");
  ball.className = "toss__ball";
  ball.setAttribute("aria-hidden", "true");
  tossClip(ball);
  return ball;
}

function tossPath(stage, ball, fit) {
  const basket = stage.querySelector(".toss__basket");
  if (!basket) return null;
  const from = ball.getBoundingClientRect();
  const to = basket.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height * 0.12 - (from.top + from.height / 2);
  const end = fit * CRUMPLE_END;
  const mid = fit * CRUMPLE_MID;
  ball.style.setProperty("--toss-end", String(CRUMPLE_END));
  ball.style.setProperty("--toss-mid", String(CRUMPLE_MID));
  ball.style.setProperty("--toss-x", Math.round(dx / end) + "px");
  ball.style.setProperty("--toss-y", Math.round(dy / end) + "px");
  ball.style.setProperty("--toss-dip", Math.round((dy + to.height * CRUMPLE_DIP) / end) + "px");
  ball.style.setProperty("--toss-mx", Math.round(dx * 0.62 / mid) + "px");
  ball.style.setProperty("--toss-arc", Math.round((dy * 0.72 - CRUMPLE_LIFT) / mid) + "px");
  ball.style.setProperty("--toss-spin", sheetCloseRand(120, 190).toFixed(0) + "deg");
  return { dx: Math.round(dx), dy: Math.round(dy) };
}

function tossFolds(skin) {
  for (let i = 0; i < CRUMPLE_FOLDS; i += 1) {
    const fold = document.createElement("div");
    fold.className = "toss__fold toss__fold--" + i;
    fold.setAttribute("aria-hidden", "true");
    fold.style.setProperty("--fd", sheetCloseRand(-1, 1).toFixed(2));
    fold.style.setProperty("--fr", sheetCloseRand(52, 104).toFixed(0) + "deg");
    skin.appendChild(fold);
  }
}

function sheetCrumpleClose(modal, sheet) {
  const built = sheetCloseStage(modal, sheet, "toss");
  const stage = built.stage;
  stage.innerHTML = basketSVG();
  const ball = tossBall();
  const skin = sheetCloseSkin(sheet, "toss__skin");
  const back = document.createElement("div");
  back.className = "toss__back";
  back.setAttribute("aria-hidden", "true");
  skin.appendChild(back);
  tossFolds(skin);
  const crease = document.createElement("div");
  crease.className = "toss__crease";
  crease.setAttribute("aria-hidden", "true");
  skin.appendChild(crease);
  const facet = document.createElement("div");
  facet.className = "toss__facet";
  facet.setAttribute("aria-hidden", "true");
  skin.appendChild(facet);
  ball.appendChild(skin);
  stage.appendChild(ball);
  stage.insertAdjacentHTML("beforeend", basketFrontSVG());
  sheetCloseSilence(sheet);
  modal.appendChild(stage);
  tossPath(stage, ball, built.frame.scale);
  modal.classList.add("is-tossing");
  return {
    ms: CRUMPLE_MS,
    cleanup: () => {
      modal.classList.remove("is-tossing");
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    },
  };
}

if (typeof sheetCloseRegister === "function") sheetCloseRegister("BODEGA", sheetCrumpleClose);

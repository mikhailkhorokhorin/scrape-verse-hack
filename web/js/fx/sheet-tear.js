"use strict";

const TEAR_STEPS = 26;
const TEAR_MS = 660;
const TEAR_BAND = 7.5;
const TEAR_SPIKE = 4.5;

function tearSeam(steps) {
  const n = typeof steps === "number" && steps > 2 ? steps : TEAR_STEPS;
  const points = [];
  let side = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i <= n; i += 1) {
    const y = (i / n) * 100;
    const bite = sheetCloseRand(TEAR_BAND * 0.45, TEAR_BAND);
    const spike = Math.random() < 0.34 ? sheetCloseRand(0, TEAR_SPIKE) : 0;
    const wander = sheetCloseRand(-1.2, 1.2);
    const x = 50 + side * (bite + spike) + wander;
    points.push({
      x: Number(Math.max(34, Math.min(66, x)).toFixed(2)),
      y: Number(y.toFixed(2)),
    });
    side = -side;
  }
  return points;
}

function tearLeftClip(seam) {
  const edge = seam.map((p) => p.x + "% " + p.y + "%").join(",");
  return "polygon(0% 0%," + edge + ",0% 100%)";
}

function tearRightClip(seam) {
  const edge = seam.slice().reverse().map((p) => p.x + "% " + p.y + "%").join(",");
  return "polygon(100% 0%,100% 100%," + edge + ")";
}

function tearHalf(sheet, side, clip) {
  const half = sheetCloseSkin(sheet, "tear__half tear__half--" + side);
  half.style.clipPath = clip;
  return half;
}

function sheetTearClose(modal, sheet) {
  const built = sheetCloseStage(modal, sheet, "tear");
  const stage = built.stage;
  const seam = tearSeam(TEAR_STEPS);
  const left = tearHalf(sheet, "left", tearLeftClip(seam));
  const right = tearHalf(sheet, "right", tearRightClip(seam));
  left.style.setProperty("--tear-spin", sheetCloseRand(-16, -10).toFixed(2) + "deg");
  right.style.setProperty("--tear-spin", sheetCloseRand(10, 16).toFixed(2) + "deg");
  stage.appendChild(left);
  stage.appendChild(right);
  sheetCloseSilence(sheet);
  modal.appendChild(stage);
  modal.classList.add("is-tearing");
  return {
    ms: TEAR_MS,
    cleanup: () => {
      modal.classList.remove("is-tearing");
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    },
  };
}

if (typeof sheetCloseRegister === "function") sheetCloseRegister("ATLAS", sheetTearClose);

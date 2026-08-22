"use strict";

const CATCH_BOX = 130;
const CATCH_STEP = 26;
const CATCH_AIM = { tl: 42, tr: 138, bl: -42, br: -138 };

function catchHub(spot, rng) {
  return {
    x: spot === "tl" || spot === "bl" ? 0 : CATCH_BOX,
    y: spot === "tl" || spot === "tr" ? 0 : CATCH_BOX,
    aim: CATCH_AIM[spot],
    reach: CATCH_BOX * webPick(rng, 0.82, 1.02),
  };
}

function catchSvg(spot, tone, seed) {
  const rng = webSeedRng(seed);
  const svg = webSvgEl(
    "webcatch webcatch--" + spot + (tone ? " webcatch--" + tone : ""),
    "0 0 " + CATCH_BOX + " " + CATCH_BOX
  );
  const g = document.createElementNS(WEBGEOM_NS, "g");
  g.setAttribute("class", "webcatch__g");
  const plan = webPlan(rng, catchHub(spot, rng), {
    minSpokes: 4, maxSpokes: 6, minRings: 3, maxRings: 4, minSpread: 30, maxSpread: 42,
  });
  let n = 0;
  plan.spokes.forEach((seg) => {
    g.appendChild(webPathEl(seg, "webcatch__strand", n * CATCH_STEP, 1.25));
    n += 1;
  });
  plan.rings.forEach((seg, i) => {
    g.appendChild(webPathEl(seg, "webcatch__ring", (n + i * 0.5) * CATCH_STEP + 60, 0.95));
  });
  svg.appendChild(g);
  return svg;
}

function catchDraw(svg) {
  if (svg.dataset.drawn === "1") return;
  svg.dataset.drawn = "1";
  svg.classList.add("webcatch--draw");
}

function catchSettle(svg) {
  svg.dataset.drawn = "1";
  svg.classList.add("webcatch--still");
}

function catchClearHealed() {
  const stale = document.querySelectorAll(".cell:not(.cell--critical):not(.cell--reweaving) .webcatch");
  for (let i = 0; i < stale.length; i += 1) stale[i].remove();
}

function catchMountCells() {
  catchClearHealed();
  const cells = document.querySelectorAll(".cell--critical,.cell--reweaving");
  const made = [];
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    if (cell.querySelector(".webcatch")) continue;
    const critical = cell.classList.contains("cell--critical");
    const svg = catchSvg(critical ? "tr" : "tl", critical ? "pink" : "cyan", i * 7 + 3);
    cell.appendChild(svg);
    made.push(svg);
  }
  return made;
}

function catchMountPoster() {
  const made = [];
  const poster = document.querySelector(".poster");
  if (!poster || poster.querySelector(".webcatch")) return made;
  const svg = catchSvg("tr", "pink", 21);
  svg.classList.add("webcatch--poster");
  poster.appendChild(svg);
  made.push(svg);
  return made;
}

function mountWebCatch() {
  if (typeof document === "undefined" || !document.querySelectorAll) return [];
  if (typeof webPlan !== "function") return [];
  const made = catchMountCells().concat(catchMountPoster());
  if (made.length === 0) return made;
  if (webStill()) {
    made.forEach(catchSettle);
    return made;
  }
  webObserve(made, catchDraw, "0px 0px -12% 0px");
  return made;
}

function catchWatchGrid() {
  const grid = document.getElementById("grid");
  if (!grid || typeof window === "undefined") return null;
  if (typeof window.MutationObserver !== "function") return null;
  let queued = false;
  const observer = new window.MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      mountWebCatch();
    });
  });
  observer.observe(grid, { childList: true, subtree: true, attributeFilter: ["class"] });
  return observer;
}

function startWebCatch() {
  mountWebCatch();
  catchWatchGrid();
}

if (typeof document !== "undefined" && document.querySelectorAll) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWebCatch);
  } else {
    startWebCatch();
  }
}

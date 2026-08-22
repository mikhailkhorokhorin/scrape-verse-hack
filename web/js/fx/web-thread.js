"use strict";

const THREAD_W = 600;
const THREAD_H = 26;

function threadPath(rng) {
  const y = THREAD_H / 2;
  const sag = webPick(rng, 3, 7);
  const midX = THREAD_W * webPick(rng, 0.42, 0.58);
  return {
    kind: "thread",
    d: "M0 " + webRound(y + webPick(rng, -2, 2)) +
      " Q" + webRound(midX) + " " + webRound(y + sag) +
      " " + THREAD_W + " " + webRound(y + webPick(rng, -2, 2)),
    len: THREAD_W * 1.05,
  };
}

function threadSvg(seed) {
  const rng = webSeedRng(seed);
  const svg = webSvgEl("webthread", "0 0 " + THREAD_W + " " + THREAD_H);
  svg.setAttribute("preserveAspectRatio", "none");
  const g = document.createElementNS(WEBGEOM_NS, "g");
  g.setAttribute("class", "webthread__g");
  g.appendChild(webPathEl(threadPath(rng), "webthread__line", 0, 1.1));
  svg.appendChild(g);
  return svg;
}

function threadDraw(svg) {
  if (svg.dataset.drawn === "1") return;
  svg.dataset.drawn = "1";
  svg.classList.add("webthread--draw");
}

function threadSettle(svg) {
  svg.dataset.drawn = "1";
  svg.classList.add("webthread--still");
}

function threadMount() {
  const rules = document.querySelectorAll(".sechead .rule");
  const made = [];
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (rule.querySelector(".webthread")) continue;
    const svg = threadSvg(i * 13 + 5);
    rule.appendChild(svg);
    made.push(svg);
  }
  return made;
}

function mountWebThread() {
  if (typeof document === "undefined" || !document.querySelectorAll) return [];
  if (typeof webPlan !== "function") return [];
  const made = threadMount();
  if (made.length === 0) return made;
  if (webStill()) {
    made.forEach(threadSettle);
    return made;
  }
  webObserve(made, threadDraw, "0px 0px -10% 0px");
  return made;
}

if (typeof document !== "undefined" && document.querySelectorAll) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountWebThread());
  } else {
    mountWebThread();
  }
}

"use strict";

const GUTTER_WEBHEAD_SRC = "assets/webhead.png";
const GUTTER_WEBHEAD_ART = { w: 484, h: 515 };
const GUTTER_WEBHEAD_GRIP = { x: 0.386, y: 0.033 };
const GUTTER_WEBHEAD_DROP = 150;

function gutterWebheadSvg(rng) {
  const art = GUTTER_WEBHEAD_ART;
  const wide = 104;
  const tall = Math.round(wide * art.h / art.w);
  const drop = GUTTER_WEBHEAD_DROP + Math.round(webPick(rng, -12, 16));
  const svg = gutterMotifSvg("gutter__webhead", "0 0 " + wide + " " + (drop + tall));
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const ink = gutterInk(svg);
  const g = gutterEl("g", { class: "gutter__swing gutter__swing--webhead" });
  const drift = webRound(webPick(rng, -1.4, 1.4));
  const gripX = webRound(drift + wide * GUTTER_WEBHEAD_GRIP.x);
  const gripY = webRound(drop + tall * GUTTER_WEBHEAD_GRIP.y);
  g.appendChild(gutterPath("gutter__thread",
    "M" + webRound(wide * GUTTER_WEBHEAD_GRIP.x) + " 0 Q" +
      webRound(gripX + drift * 2) + " " + Math.round(gripY * 0.55) + " " +
      gripX + " " + gripY));
  g.appendChild(gutterEl("image", {
    class: "gutter__hero",
    href: GUTTER_WEBHEAD_SRC,
    x: webRound(drift), y: drop,
    width: wide, height: tall,
    preserveAspectRatio: "xMidYMin meet",
  }));
  ink.appendChild(g);
  return svg;
}

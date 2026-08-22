"use strict";

const GUTTER_BUGLE_ROWS = [72, 104, 136, 168, 200, 232, 264];

const GUTTER_BUGLE_COLS = [12, 32, 52, 72, 92];

const GUTTER_BUGLE_PERIODS = [4.3, 5.1, 6.4, 7.2, 8.1, 9];

const GUTTER_BUGLE_D = "M6 2 L6 -44 M30 2 L30 -44 M54 2 L54 -44 M78 2 L78 -44 " +
  "M102 2 L102 -44 M0 -2 L108 -2 M0 -16 L108 -16 M0 -30 L108 -30 M0 -42 L108 -42";

function gutterBugleFrame(ink) {
  ink.appendChild(gutterEl("g", { class: "gutter__rig" }))
    .appendChild(gutterPath("gutter__rigline", GUTTER_BUGLE_D));
}

function gutterBugleHorn(x, y) {
  const g = gutterEl("g", { class: "gutter__horn", transform: "translate(" + x + " " + y + ")" });
  g.appendChild(gutterPath("gutter__hornline",
    "M0 0 L5 0 q6 0 6 5 q0 5 -6 5 L4 10 q-6 0 -6 -5 q0 -5 6 -5"));
  g.appendChild(gutterPath("gutter__hornline", "M11 4 L17 4"));
  g.appendChild(gutterPath("gutter__bell", "M17 -3 L17 11 L25 15 L25 -7z"));
  return g;
}

function gutterBugleWord(text, x, y, size) {
  const t = gutterEl("text", {
    class: "gutter__sign", x: x, y: y, "font-size": size,
    "text-anchor": "middle", "dominant-baseline": "alphabetic",
  });
  t.textContent = text;
  return t;
}

function gutterBugleSign(ink) {
  const sign = gutterEl("g", { class: "gutter__signrig", transform: "translate(0 50)" });
  gutterBugleFrame(sign);
  sign.appendChild(gutterBugleWord("DAILY", 34, -24, 17));
  sign.appendChild(gutterBugleHorn(60, -30));
  sign.appendChild(gutterBugleWord("BUGLE", 56, -6, 17));
  ink.appendChild(sign);
}

function gutterBugleWindow(rng, x, y, arch, lit, seat) {
  const cls = "gutter__pane" + (lit ? " gutter__pane--lit" : "");
  const node = arch
    ? gutterPath(cls, "M" + x + " " + (y + 13) + " L" + x + " " + (y + 5) +
      " q0 -5 5 -5 q5 0 5 5 L" + (x + 10) + " " + (y + 13) + "z")
    : gutterEl("rect", { class: cls, x: x, y: y, width: 10, height: 13, rx: 1 });
  if (lit) {
    const p = GUTTER_BUGLE_PERIODS[seat % GUTTER_BUGLE_PERIODS.length];
    node.style.setProperty("--lit", p + "s");
    node.style.setProperty("--d", "-" + webRound(webPick(rng, 0, p)) + "s");
  }
  return node;
}

function gutterBugleFacade(rng, ink) {
  const wall = gutterEl("g", { class: "gutter__wall" });
  wall.appendChild(gutterEl("rect", {
    class: "gutter__block", x: 4, y: 56, width: 104, height: 244,
  }));
  wall.appendChild(gutterPath("gutter__cornice", "M0 56 L112 56 M2 62 L110 62"));
  [26, 58, 90].forEach((x) => {
    wall.appendChild(gutterPath("gutter__pilaster", "M" + x + " 62 L" + x + " 300"));
  });
  ink.appendChild(wall);
  return wall;
}

function gutterBugleLit(rng, total) {
  const want = webPickInt(rng, 3, 4);
  const pick = {};
  let guard = 0;
  while (Object.keys(pick).length < want && guard < 60) {
    pick[webPickInt(rng, 0, total - 1)] = true;
    guard += 1;
  }
  return pick;
}

function gutterBugleSvg(rng) {
  const svg = gutterMotifSvg("gutter__bugle", "0 0 112 300");
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const ink = gutterInk(svg);
  gutterBugleFacade(rng, ink);
  const total = GUTTER_BUGLE_ROWS.length * GUTTER_BUGLE_COLS.length;
  const lit = gutterBugleLit(rng, total);
  let seat = 0;
  GUTTER_BUGLE_ROWS.forEach((y, r) => {
    if (r > 0) ink.appendChild(gutterPath("gutter__ledge", "M6 " + (y - 6) + " L106 " + (y - 6)));
    GUTTER_BUGLE_COLS.forEach((x, c) => {
      const at = r * GUTTER_BUGLE_COLS.length + c;
      const on = !!lit[at];
      ink.appendChild(gutterBugleWindow(rng, x, y, r === 0, on, seat));
      if (on) seat += 1;
    });
  });
  gutterBugleSign(ink);
  return svg;
}

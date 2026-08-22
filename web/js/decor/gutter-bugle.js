"use strict";

const GUTTER_BUGLE_CYCLE = [11, 27];
const GUTTER_BUGLE_ROWS = [150, 196, 240, 284, 328, 372, 416];

const GUTTER_BUGLE_COLS = [4, 27, 50, 74, 97, 120];


const GUTTER_BUGLE_D = "M-18 2 L-18 -56 M11 2 L11 -56 M40 2 L40 -56 M69 2 L69 -56 " +
  "M98 2 L98 -56 M127 2 L127 -56 M156 2 L156 -56 " +
  "M-20 -2 L158 -2 M-20 -28 L158 -28 M-20 -54 L158 -54";

const GUTTER_BUGLE_BRACE = "M-18 -2 L11 -28 M11 -2 L-18 -28 M127 -2 L156 -28 M156 -2 L127 -28 " +
  "M40 -28 L69 -54 M69 -28 L40 -54";

function gutterBugleFrame(ink) {
  const rig = gutterEl("g", { class: "gutter__rig" });
  rig.appendChild(gutterPath("gutter__rigline", GUTTER_BUGLE_D));
  rig.appendChild(gutterPath("gutter__rigbrace", GUTTER_BUGLE_BRACE));
  ink.appendChild(rig);
}

function gutterBugleSign(ink) {
  const sign = gutterEl("g", { class: "gutter__signrig", transform: "translate(0 62)" });
  gutterBugleFrame(sign);
  sign.appendChild(gutterTypeWord("DAILY", 15, -16, 22));
  sign.appendChild(gutterBugleHorn(54.4, -37.2, 20));
  sign.appendChild(gutterTypeWord("BUGLE", 121, -16, 22));
  ink.appendChild(sign);
}

function gutterBugleShape(cls, x, y, arch) {
  return arch
    ? gutterPath(cls, "M" + x + " " + (y + 26) + " L" + x + " " + (y + 9) +
      " q0 -9 7 -9 q7 0 7 9 L" + (x + 14) + " " + (y + 26) + "z")
    : gutterEl("rect", { class: cls, x: x, y: y, width: 14, height: 20, rx: 1 });
}

function gutterBugleWindow(rng, x, y, arch) {
  const cell = gutterEl("g", { class: "gutter__cell" });
  cell.appendChild(gutterBugleShape("gutter__pane", x, y, arch));
  const glow = gutterBugleShape("gutter__glow", x, y, arch);
  const span = webPick(rng, GUTTER_BUGLE_CYCLE[0], GUTTER_BUGLE_CYCLE[1]);
  glow.style.setProperty("--lit", webRound(span) + "s");
  glow.style.setProperty("--d", "-" + webRound(webPick(rng, 0, span)) + "s");
  cell.appendChild(glow);
  return cell;
}

function gutterBugleCrown(wall) {
  wall.appendChild(gutterEl("rect", {
    class: "gutter__capstone", x: -11, y: 62, width: 160, height: 12,
  }));
  wall.appendChild(gutterPath("gutter__cornice", "M-13 62 L151 62 M-11 74 L149 74 M-9 82 L147 82"));
  const teeth = gutterEl("g", { class: "gutter__dentils" });
  for (let x = -5; x <= 139; x += 8) {
    teeth.appendChild(gutterEl("rect", {
      class: "gutter__tooth", x: x, y: 75, width: 4, height: 6,
    }));
  }
  wall.appendChild(teeth);
}

function gutterBugleFacade(ink) {
  const wall = gutterEl("g", { class: "gutter__wall" });
  wall.appendChild(gutterEl("rect", {
    class: "gutter__block", x: -9, y: 74, width: 156, height: 386,
  }));
  gutterBugleCrown(wall);
  [-9, 17, 43, 69, 95, 121, 147].forEach((x) => {
    wall.appendChild(gutterPath("gutter__pilaster", "M" + x + " 84 L" + x + " 460"));
  });
  wall.appendChild(gutterEl("rect", {
    class: "gutter__shade", x: 125, y: 84, width: 22, height: 376,
  }));
  ink.appendChild(wall);
  return wall;
}

function gutterBugleSvg(rng) {
  const svg = gutterMotifSvg("gutter__bugle", "-22 0 184 460");
  svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
  const ink = gutterInk(svg);
  gutterBugleFacade(ink);
  GUTTER_BUGLE_ROWS.forEach((y, r) => {
    if (r > 0) {
      ink.appendChild(gutterPath("gutter__ledge", "M-7 " + (y - 9) + " L145 " + (y - 9)));
    }
    GUTTER_BUGLE_COLS.forEach((x) => {
      ink.appendChild(gutterBugleWindow(rng, x, y, r === 0));
    });
  });
  gutterBugleSign(ink);
  return svg;
}

"use strict";

const GUTTER_TYPE_W = 15;

const GUTTER_TYPE_GLYPHS = {
  D: "M1 0 H9 Q15 0 15 11 V17 Q15 28 9 28 H1 Z M5.4 4.2 V23.8 H8.2 Q10.6 23.8 10.6 17.4 " +
    "V10.6 Q10.6 4.2 8.2 4.2 Z",
  A: "M0 28 L5.6 0 H9.8 L15.4 28 H10.6 L9.7 22.4 H5.5 L4.6 28 Z M6.2 18.2 H9 L7.6 9.1 Z",
  I: "M0.6 0 H10.6 V4.2 H7.9 V23.8 H10.6 V28 H0.6 V23.8 H3.3 V4.2 H0.6 Z",
  L: "M1 0 H5.4 V23.8 H13.4 V28 H1 Z",
  Y: "M0 0 H4.8 L7.6 10.5 L10.4 0 H15.2 L10 18.2 V28 H5.2 V18.2 Z",
  B: "M1 0 H9.2 Q14.6 0 14.6 7 Q14.6 12.6 11 13.6 Q15 14.4 15 20.6 Q15 28 9.4 28 H1 Z " +
    "M5.4 4.2 V11.6 H8.2 Q10.2 11.6 10.2 7.9 Q10.2 4.2 8.2 4.2 Z " +
    "M5.4 15.8 V23.8 H8.4 Q10.6 23.8 10.6 19.8 Q10.6 15.8 8.4 15.8 Z",
  U: "M0.8 0 H5.2 V21.4 Q5.2 23.9 7.5 23.9 Q9.8 23.9 9.8 21.4 V0 H14.2 V21.8 " +
    "Q14.2 28.4 7.5 28.4 Q0.8 28.4 0.8 21.8 Z",
  G: "M14.4 9.4 H10.1 V8 Q10.1 4.1 7.6 4.1 Q5.2 4.1 5.2 8 V20 Q5.2 23.9 7.6 23.9 " +
    "Q10.1 23.9 10.1 20 V17.2 H7.4 V13.2 H14.4 V20.4 Q14.4 28.4 7.6 28.4 " +
    "Q0.8 28.4 0.8 20.4 V7.6 Q0.8 -0.4 7.6 -0.4 Q14.4 -0.4 14.4 7.6 Z",
  E: "M1 0 H13.6 V4.2 H5.4 V11.6 H12.4 V15.8 H5.4 V23.8 H13.8 V28 H1 Z",
};

const GUTTER_TYPE_KERN = { I: -3.4, L: -1.4, A: -0.6, Y: -0.8, J: -1 };

function gutterTypeWord(text, x, y, size) {
  const g = gutterEl("g", { class: "gutter__word" });
  const unit = size / 28;
  let pen = 0;
  const spans = [];
  for (const ch of text) {
    const d = GUTTER_TYPE_GLYPHS[ch];
    if (!d) continue;
    spans.push({ d: d, at: pen });
    pen += (GUTTER_TYPE_W + (GUTTER_TYPE_KERN[ch] || 0)) + 1.6;
  }
  const total = pen - 1.6;
  spans.forEach((sp) => {
    const put = gutterEl("g", {
      transform: "translate(" + webRound(x - total * unit / 2 + sp.at * unit) + " " +
        webRound(y - size) + ") scale(" + webRound(unit) + ")",
    });
    put.appendChild(gutterPath("gutter__sign", sp.d));
    g.appendChild(put);
  });
  return g;
}

function gutterBugleHorn(x, y, size) {
  const unit = (size || 26) / 22;
  const g = gutterEl("g", {
    class: "gutter__horn",
    transform: "translate(" + x + " " + y + ") scale(" + webRound(unit) + ")",
  });
  g.appendChild(gutterPath("gutter__bell",
    "M16 6.2 Q22 5 25.4 2.2 Q28.4 -0.4 29.6 -3.4 L29.6 25.8 " +
    "Q28.4 22.8 25.4 20.2 Q22 17.4 16 16.2 Z"));
  g.appendChild(gutterPath("gutter__bore",
    "M5 9.2 H13.4 Q15.4 9.2 17 8 L17 14.4 Q15.4 13.2 13.4 13.2 H5 Z"));
  g.appendChild(gutterPath("gutter__loop",
    "M6.4 9.6 Q-1.6 9.6 -1.6 14.6 Q-1.6 19.4 6.4 19.4 H14.4"));
  g.appendChild(gutterEl("rect", {
    class: "gutter__mouth", x: 1.4, y: 6.4, width: 4, height: 9.6, rx: 1.5,
  }));
  [8.4, 12.4].forEach((vx) => {
    g.appendChild(gutterEl("rect", {
      class: "gutter__valve", x: vx, y: 2.6, width: 2.8, height: 7, rx: 1,
    }));
  });
  return g;
}

"use strict";

const GUTTER_LEGS = [
  "M-8 18 q-13 -5 -18 -14", "M-8 22 q-15 1 -21 -5",
  "M-8 26 q-14 6 -18 15", "M-8 30 q-12 10 -13 20",
  "M8 18 q13 -5 18 -14", "M8 22 q15 1 21 -5",
  "M8 26 q14 6 18 15", "M8 30 q12 10 13 20",
];

const GUTTER_EYES = [
  "M-4.6 12.5 q2.6 -4 5.2 0 q-2.6 3.2 -5.2 0z",
  "M1.4 12.5 q2.6 -4 5.2 0 q-2.6 3.2 -5.2 0z",
];

function gutterEl(name, attrs) {
  const el = document.createElementNS(WEBGEOM_NS, name);
  Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k] + ""));
  return el;
}

function gutterPath(cls, d) {
  return gutterEl("path", { class: cls, d: d });
}

function gutterSpiderBody(drop) {
  const body = gutterEl("g", {
    class: "gutter__body",
    transform: "translate(30 " + drop + ")",
  });
  const legs = gutterEl("g", { class: "gutter__legs" });
  GUTTER_LEGS.forEach((d) => legs.appendChild(gutterPath("", d)));
  body.appendChild(legs);
  body.appendChild(gutterEl("ellipse", {
    class: "gutter__abdomen", cx: 0, cy: 30, rx: 12, ry: 15,
  }));
  body.appendChild(gutterEl("ellipse", {
    class: "gutter__head", cx: 0, cy: 13, rx: 9, ry: 8,
  }));
  GUTTER_EYES.forEach((d) => body.appendChild(gutterPath("gutter__eye", d)));
  return body;
}

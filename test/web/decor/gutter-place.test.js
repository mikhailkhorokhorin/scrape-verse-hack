"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { modulePath, cssPath } = require("../../web-loader.js");

const planJs = fs.readFileSync(modulePath("gutter-plan.js"), "utf8");
const gutterCss = fs.readFileSync(cssPath("gutter.css"), "utf8");

test("nothing is drawn until the gutters are genuinely wide enough", () => {
  assert.match(gutterCss, /\.gutter\{[^}]*display:none;/);
  const gate = gutterCss.match(/@media\(min-width:(\d+)px\)\{\s*\.gutter\{display:block;\}/);
  assert.ok(gate, "the layer is never switched on");
  assert.ok(Number(gate[1]) >= 1560,
    "a floor at 1200px put the motifs on top of a 1440px column");
});

test("a motif is placed from the column edge, never from the screen edge", () => {
  assert.match(gutterCss, /--col:720px;/);
  assert.match(gutterCss, /--clear:\d+px;/);
  ["--out,0px", "50% + var(--col) + var(--clear)"].forEach((frag) => {
    assert.ok(gutterCss.includes(frag), frag + " is missing from the placement");
  });
  assert.ok(!/max\(12px/.test(gutterCss),
    "the old max(12px, ...) floor slammed the motif against the text");
});

test("a nudge only ever pushes a motif further from the text", () => {
  const nudges = planJs.match(/nudge: webPick\(rng, (-?[\d.]+), (-?[\d.]+)\)/g) || [];
  assert.ok(nudges.length >= 3, "the motifs are not nudged at all");
  nudges.forEach((decl) => {
    const lo = Number((decl.match(/rng, (-?[\d.]+)/) || [])[1]);
    assert.ok(lo >= 0, "a negative nudge pulls the motif back over the column: " + decl);
  });
});

test("the corner web is sized to the gutter, so it cannot reach the text", () => {
  const at = gutterCss.indexOf(".gutter__web{");
  const rule = gutterCss.slice(at, gutterCss.indexOf("}", at));
  assert.match(rule, /width:var\(--gut\)/, "a fixed 300px web overhung a narrow gutter");
  assert.match(rule, /overflow:hidden/, "the web must be clipped to its own band");
  assert.match(gutterCss, /--gut:calc\(50% - var\(--col\) - var\(--clear\)\)/);
});

test("the manual keeps its own narrower column in the placement maths", () => {
  assert.match(gutterCss, /\.gutter--manual\{--col:\d+px;/,
    "the manual column is 1000px wide, not 1440px");
});

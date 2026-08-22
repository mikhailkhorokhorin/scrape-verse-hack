"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const { modulePath, cssPath } = require("../../web-loader.js");

const JS = fs.readFileSync(modulePath("panelrays.js"), "utf8");
const CSS = fs.readFileSync(cssPath("panelrays.css"), "utf8");
const CUT = fs.readFileSync(modulePath("panelcut.js"), "utf8");

test("rays sit below the sheet so they cannot cover a value", () => {
  const rays = CSS.match(/\.panelrays\{[^}]*z-index:(\d+)/);
  assert.ok(rays, "panelrays needs an explicit z-index");
  assert.strictEqual(Number(rays[1]), 1);
});

test("the sheet stays above the rays", () => {
  const cut = fs.readFileSync(cssPath("panelcut.css"), "utf8");
  const sheet = cut.match(/\.sheet\{[^}]*z-index:(\d+)/);
  assert.ok(sheet, "sheet needs an explicit z-index");
  assert.ok(Number(sheet[1]) > 1);
});

test("rays never take pointer events", () => {
  assert.match(CSS, /\.panelrays\{[^}]*pointer-events:none/);
});

test("rays are hidden from assistive tech", () => {
  assert.match(JS, /setAttribute\("aria-hidden", "true"\)/);
});

test("rays are a one-shot, never a loop", () => {
  assert.ok(!/infinite/.test(CSS));
});

test("rays animate only compositor-friendly properties", () => {
  const frames = CSS.match(/@keyframes panelrays-hit\{[\s\S]*?\n\}/);
  assert.ok(frames);
  const body = frames[0];
  assert.ok(!/(width|height|top|left|margin|padding):/.test(body));
  assert.match(CSS, /will-change:transform,opacity/);
});

test("rays are suppressed for reduced motion, capture and print", () => {
  assert.match(CSS, /prefers-reduced-motion:reduce\)\{\s*\.panelrays\{display:none/);
  assert.match(CSS, /@media print\{\s*\.panelrays\{display:none/);
  assert.match(CSS, /\.is-capture \.panelrays\{display:none/);
});

test("the open fires the rays and the quiet path does not", () => {
  assert.match(CUT, /panelRaysFire/);
  const open = CUT.match(/function panelcutOpen[\s\S]*?\n\}/)[0];
  const quietFirst = open.indexOf("panelcutQuiet");
  const fireAt = open.indexOf("panelRaysFire");
  assert.ok(quietFirst !== -1 && fireAt > quietFirst);
});

test("the rays wait for the sheet to land before they leave its edges", () => {
  const cut = fs.readFileSync(cssPath("panelcut.css"), "utf8");
  const drop = Number(cut.match(/--cut-ms:(\d+)ms/)[1]);
  const wait = Number(CUT.match(/PANELCUT_RAYS_MS = (\d+)/)[1]);
  assert.ok(wait >= drop * 0.8, "firing mid-drop reads as the page throwing them, not shedding them");
  assert.ok(wait <= drop + 120, "a long gap breaks the open into two unrelated events");
  const open = CUT.match(/function panelcutOpen[\s\S]*?\n\}/)[0];
  assert.match(open, /setTimeout\([\s\S]*?panelRaysFire/);
});

test("a close cancels a pending volley, so it cannot fire into a shut modal", () => {
  const close = CUT.slice(CUT.indexOf("function panelcutClose"));
  assert.match(close.slice(0, close.indexOf("\n}")), /clearTimeout\(PANELCUT\.rays\)/);
});

test("every ray starts on an edge of the sheet, not at its centre", () => {
  assert.ok(!/Math\.cos|Math\.sin|\bspot\.c[xy]\b/.test(JS),
    "a polar fan from one point is the radial burst the sheet is not supposed to emit");
  assert.match(JS, /RAYS_SIDES/);
  const sides = JS.match(/RAYS_SIDES = \[[\s\S]*?\];/)[0];
  assert.strictEqual((sides.match(/\{ nx:/g) || []).length, 4, "top, right, bottom and left");
});

test("each ray travels out along the normal of its own side", () => {
  const path = JS.match(/function raysPath[\s\S]*?\n\}/)[0];
  assert.match(path, /side\.nx \* reach/);
  assert.match(path, /side\.ny \* reach/);
  const anchor = JS.match(/function raysAnchor[\s\S]*?\n\}/)[0];
  assert.match(anchor, /edge\.top/);
  assert.match(anchor, /edge\.bottom/);
  assert.match(anchor, /edge\.left/);
  assert.match(anchor, /edge\.right/);
});

test("a sheet taller than the viewport still seeds rays only where an edge is visible", () => {
  const edge = JS.match(/function raysEdge[\s\S]*?\n\}/)[0];
  assert.match(edge, /Math\.max\(box\.top, 0\)/);
  assert.match(edge, /Math\.min\(box\.bottom, window\.innerHeight\)/);
});

test("a ray grows out of its own base, so the scale never pulls it off the edge", () => {
  assert.match(CSS, /transform-origin:var\(--o,center\)/);
  assert.match(CSS, /transform-box:view-box/);
  assert.match(JS, /setProperty\("--o"/);
});

test("the rays never animate a paint-bound property", () => {
  assert.ok(!/stroke-dashoffset/.test(CSS));
  assert.ok(!/stroke-dashoffset/.test(JS));
});

test("every ray is removed after it plays", () => {
  assert.match(JS, /svg\.remove\(\)/);
});

test("ray count stays in a controlled range", () => {
  const lo = Number(JS.match(/RAYS_MIN = (\d+)/)[1]);
  const hi = Number(JS.match(/RAYS_MAX = (\d+)/)[1]);
  assert.ok(lo >= 8 && hi <= 48 && lo < hi);
});

test("panelrays carries no comments", () => {
  assert.ok(!/^\s*\/\//m.test(JS.replace(/"use strict";/, "")));
  assert.ok(!/\/\*/.test(JS));
});

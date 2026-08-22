"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { cssPath, modulePath } = require("../../web-loader.js");

const FLOOR = 0.5;

function startOpacities(css, name) {
  const block = css.match(new RegExp("@keyframes " + name + "\\{[\\s\\S]*?\\n\\}"));
  if (!block) return [];
  const first = block[0].match(/0%\{[^}]*\}/);
  if (!first) return [];
  const found = first[0].match(/opacity:\s*([\d.]+)/);
  return found ? [Number(found[1])] : [];
}

test("scroll-driven section reveal never hides its own content", () => {
  const css = fs.readFileSync(cssPath("press.css"), "utf8");
  const start = startOpacities(css, "press-register");
  assert.strictEqual(start.length, 1);
  assert.ok(
    start[0] >= FLOOR,
    "press-register starts at " + start[0] + "; a section must stay readable if the timeline never advances"
  );
});

test("scroll timelines start at cover so on-load elements are not negative", () => {
  const css = fs.readFileSync(cssPath("press.css"), "utf8");
  const ranges = [...css.matchAll(/animation-range:\s*([a-z]+) (-?[\d.]+)%/g)];
  assert.ok(ranges.length > 0);
  ranges.forEach((m) => {
    assert.ok(
      m[1] === "cover" || Number(m[2]) >= 0,
      "range starts at " + m[1] + " " + m[2] + "%, which can be negative for elements already in view"
    );
  });
});

test("the manual entrance never starts fully transparent", () => {
  const css = fs.readFileSync(cssPath("manual-in.css"), "utf8");
  const start = startOpacities(css, "manual-stamp");
  assert.strictEqual(start.length, 1);
  assert.ok(start[0] >= FLOOR, "manual-stamp starts at " + start[0]);
});

test("the manual entrance holds nothing invisible for long", () => {
  const js = fs.readFileSync(modulePath("manual-in.js"), "utf8");
  const at = [...js.matchAll(/at: (\d+)/g)].map((m) => Number(m[1]));
  const step = Number(js.match(/MANUAL_IN_STAGGER_MS = (\d+)/)[1]);
  const max = Number(js.match(/MANUAL_IN_STAGGER_MAX = (\d+)/)[1]);
  const worst = Math.max(...at) + max * step;
  assert.ok(worst <= 600, "worst stagger delay is " + worst + "ms");
});

test("no entrance keyframe anywhere starts at zero opacity", () => {
  const dirs = [cssPath("press.css"), cssPath("manual-in.css"), cssPath("intro.css")];
  dirs.forEach((file) => {
    if (!fs.existsSync(file)) return;
    const css = fs.readFileSync(file, "utf8");
    const zero = css.match(/0%\{opacity:0[;,}]/g);
    assert.strictEqual(
      zero,
      null,
      path.basename(file) + " has a keyframe starting at opacity 0; content must survive a skipped animation"
    );
  });
});

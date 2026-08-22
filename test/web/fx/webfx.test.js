"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { modulePath, cssPath } = require("../../web-loader.js");

const ROOT = path.join(__dirname, "..", "..", "..");
const WEB = path.join(ROOT, "web");
const index = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
const manual = fs.readFileSync(path.join(WEB, "manual.html"), "utf8");
const catchJs = fs.readFileSync(modulePath("web-catch.js"), "utf8");
const threadJs = fs.readFileSync(modulePath("web-thread.js"), "utf8");
const geomJs = fs.readFileSync(modulePath("web-geom.js"), "utf8");
const css = fs.readFileSync(cssPath("webfx.css"), "utf8");

const SOURCES = [["web-catch.js", catchJs], ["web-thread.js", threadJs]];

test("both pages load the web effects after the geometry the effects call", () => {
  [index, manual].forEach((page) => {
    assert.match(page, /<link rel="stylesheet" href="css\/fx\/webfx\.css">/);
    const geom = page.indexOf("js/sheets/front/web-geom.js");
    assert.ok(geom > -1, "web-geom.js is not loaded");
    ["js/fx/web-thread.js", "js/fx/web-catch.js"].forEach((src) => {
      const at = page.indexOf(src);
      assert.ok(at > geom, src + " must load after the geometry it calls");
    });
  });
});

test("a corner web is hung only where a Spider is actually in trouble", () => {
  assert.match(catchJs, /querySelectorAll\("\.cell--critical,\.cell--reweaving"\)/,
    "a web on every panel is decoration; a web on a broken one is a reading");
});

test("a Spider that heals loses its web, so no web outlives its meaning", () => {
  assert.match(catchJs, /function catchClearHealed/);
  assert.match(catchJs, /\.cell:not\(\.cell--critical\):not\(\.cell--reweaving\) \.webcatch/);
  const mount = catchJs.slice(catchJs.indexOf("function catchMountCells"));
  assert.match(mount.slice(0, mount.indexOf("return made")), /catchClearHealed\(\)/,
    "the sweep must run before new webs are hung");
});

test("a panel that breaks after load still catches a web", () => {
  assert.match(catchJs, /MutationObserver/,
    "the grid re-renders as Spiders change state; a one-shot mount would miss the break");
  assert.match(catchJs, /observer\.observe\(grid, \{ childList: true, subtree: true/);
  assert.match(catchJs, /requestAnimationFrame\(\(\) => \{/,
    "the re-scan must be coalesced, not run once per mutation");
});

test("every scroll-triggered web waits on an IntersectionObserver", () => {
  assert.match(geomJs, /new window\.IntersectionObserver/);
  SOURCES.forEach(([name, src]) => {
    assert.match(src, /webObserve\(/, name + " must draw on entering view");
  });
});

test("no effect gates content: a web draws over a page that is already whole", () => {
  assert.doesNotMatch(css, /opacity:0[;\s]*\}[^]*?content-visibility/);
  ["webcatch", "webthread"].forEach((cls) => {
    const at = css.indexOf("." + cls + "{");
    assert.ok(at > -1, cls + " has no base rule");
    const rule = css.slice(at, css.indexOf("}", at));
    assert.match(rule, /position:absolute/, cls + " must not take part in layout");
    assert.match(rule, /pointer-events:none/, cls + " must not take the pointer");
  });
  assert.doesNotMatch(css, /\.cell[^{]*\{[^}]*opacity:0/,
    "a panel must never wait on a web to become visible");
});

test("a web without a script still leaves the page complete", () => {
  SOURCES.forEach(([name, src]) => {
    assert.match(src, /if \(typeof webPlan !== "function"\) return \[\];/,
      name + " must give up quietly when the geometry never loaded");
  });
});

test("the webs draw once and never loop", () => {
  assert.doesNotMatch(css, /infinite/, "an ambient loop is not an entrance");
  assert.doesNotMatch(css, /animation:/, "a draw-on is a transition, not a keyframe loop");
  SOURCES.forEach(([name, src]) => {
    assert.match(src, /dataset\.drawn = "1"/, name + " must draw each web only once");
  });
});

test("the animated webs own their own layer, as the fps collapse taught", () => {
  ["webcatch--draw", "webthread--draw"].forEach((cls) => {
    const at = css.indexOf("." + cls + "{");
    assert.ok(at > -1, cls + " missing");
    const rule = css.slice(at, css.indexOf("}", at));
    assert.match(rule, /will-change:/, cls + " needs its own layer");
  });
});

test("the webs move nothing but opacity and a dash offset", () => {
  const moves = css.match(/transition:[^;]+;/g) || [];
  assert.ok(moves.length > 0);
  moves.forEach((decl) => {
    assert.ok(/opacity|stroke-dashoffset|none/.test(decl),
      decl + " animates a property that forces layout");
  });
});

test("the webs stay far below the ink of the text they sit behind", () => {
  const shades = (css.match(/opacity:\.(\d+)/g) || []).map((s) => Number("0." + s.slice(9)));
  assert.ok(shades.length > 0, "no opacity declared");
  shades.forEach((o) => {
    assert.ok(o <= 0.22, "a web at " + o + " competes with the readouts");
  });
});

test("reduced motion, capture and print all take the webs off", () => {
  const reduce = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
  assert.match(reduce.slice(0, reduce.indexOf("}\n}")), /\.webcatch,\.webthread\{display:none !important;\}/);
  assert.match(css, /\.is-capture \.webcatch,\n\.is-capture \.webthread\{display:none !important;\}/);
  const print = css.slice(css.indexOf("@media print"));
  assert.match(print, /\.webcatch,\.webthread\{display:none !important;\}/);
  SOURCES.forEach(([name, src]) => {
    assert.match(src, /if \(webStill\(\)\)/, name + " must settle rather than animate when stilled");
  });
});

test("webStill covers both a stated preference and a capture", () => {
  assert.match(geomJs, /function webStill\(\)\s*\{\s*return webReduced\(\) \|\| webCapture\(\);/);
  assert.match(geomJs, /classList\.contains\("is-capture"\)/);
});

test("the existing section-rule webs keep their mount", () => {
  const webs = fs.readFileSync(modulePath("webs.js"), "utf8");
  assert.match(webs, /querySelectorAll\("\.sechead \.rule"\)/);
  assert.match(threadJs, /querySelectorAll\("\.sechead \.rule"\)/);
  assert.match(threadJs, /if \(rule\.querySelector\("\.webthread"\)\) continue;/,
    "the thread must not stack on a rule that already carries one");
});

test("neither module nor the sheet carries a single comment", () => {
  SOURCES.concat([["webfx.css", css]]).forEach(([name, text]) => {
    assert.ok(!text.includes("/*"), name + " has a block comment");
    text.split(String.fromCharCode(10)).forEach((line, n) => {
      const at = line.indexOf("//");
      const url = at > 0 && line.charAt(at - 1) === ":";
      assert.ok(at === -1 || url, name + " has a line comment on line " + (n + 1));
    });
  });
});

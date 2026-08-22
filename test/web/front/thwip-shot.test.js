"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { modulePath, cssPath } = require("../../web-loader.js");
const { makeGeom } = require("./web-geom-harness.js");

const ROOT = path.join(__dirname, "..", "..", "..");
const WEB = path.join(ROOT, "web");
const index = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
const manual = fs.readFileSync(path.join(WEB, "manual.html"), "utf8");
const shotJs = fs.readFileSync(modulePath("thwip-shot.js"), "utf8");
const geomJs = fs.readFileSync(modulePath("web-geom.js"), "utf8");
const shotCss = fs.readFileSync(cssPath("masthead.css"), "utf8");

function shotCharacters() {
  const start = shotJs.indexOf("const THWIP_CHARACTERS = [");
  const end = shotJs.indexOf("];", start);
  const body = shotJs.slice(start, end + 2);
  const names = (body.match(/name: "(\w+)"/g) || []).map((s) => s.slice(7, -1));
  const hubs = (body.match(/hubs: (\d+)/g) || []).map((s) => Number(s.slice(6)));
  const weights = (body.match(/weight: \[([\d.]+), ([\d.]+)\]/g) || [])
    .map((s) => s.match(/[\d.]+/g).map(Number));
  const crosses = (body.match(/cross: ([\d.]+)/g) || []).map((s) => Number(s.slice(7)));
  const splats = (body.match(/splat: ([\d.]+)/g) || []).map((s) => Number(s.slice(7)));
  return names.map((name, i) => ({
    name: name, hubs: hubs[i], weight: weights[i], cross: crosses[i], splat: splats[i],
  }));
}

const CHARACTERS = shotCharacters();

test("the wordmark wraps its letters in a span so the shot anchors to the glyphs", () => {
  assert.match(index, /<h1 class="wordmark"><span class="wordmark__word">THWIP<\/span><\/h1>/);
  assert.match(manual, /<span class="wordmark__word">THWIP<\/span>/);
  assert.match(shotCss, /\.wordmark__word\{position:relative;display:inline-block;\}/);
});

test("both pages load the masthead sheet, the geometry, then the shot", () => {
  [index, manual].forEach((page) => {
    assert.match(page, /<link rel="stylesheet" href="css\/sheets\/masthead\.css">/);
    const geom = page.indexOf("js/sheets/front/web-geom.js");
    const shot = page.indexOf("js/sheets/front/thwip-shot.js");
    assert.ok(geom > -1, "web-geom.js is not loaded");
    assert.ok(shot > geom, "the shot must load after the geometry it calls");
  });
});

test("a web is spokes from a hub plus rings strung between neighbouring spokes", () => {
  const geom = makeGeom();
  const plan = geom.webPlan(geom.webSeedRng(7), { x: 40, y: 60, aim: 0, reach: 90 });
  assert.ok(plan.spokes.length >= 5, "a web needs a fan of spokes");
  assert.ok(plan.rings.length >= plan.spokes.length - 1, "rings must connect the spokes");
  plan.spokes.forEach((s) => assert.equal(s.kind, "spoke"));
  plan.rings.forEach((r) => assert.equal(r.kind, "ring"));
});

test("every ring sags toward the hub, a curve and never a straight chord", () => {
  const geom = makeGeom();
  const plan = geom.webPlan(geom.webSeedRng(11), { x: 0, y: 0, aim: 0, reach: 100 });
  assert.ok(plan.rings.length > 0);
  plan.rings.forEach((seg) => {
    assert.match(seg.d, /Q/, "a ring drawn with L is a straight chord, not a thread");
    const n = seg.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const mid = [(n[0] + n[4]) / 2, (n[1] + n[5]) / 2];
    const ctrl = Math.hypot(n[2], n[3]);
    const midHub = Math.hypot(mid[0], mid[1]);
    assert.ok(ctrl < midHub, "the control point must be pulled hubward so the thread sags in");
  });
});

test("the threads taper: a spoke is drawn heavier than the outermost ring", () => {
  assert.match(shotJs, /webPathEl\(seg, "thwip__strand"/);
  assert.match(shotJs, /const width = weight \* \(0\.72 - t \* 0\.34\);/);
  assert.match(geomJs, /path\.setAttribute\("stroke-width"/);
});

test("stroke weight is drawn per shot, so one shot lands heavier than the next", () => {
  assert.match(shotJs, /const weight = webPick\(rng, character\.weight\[0\], character\.weight\[1\]\);/);
  const heavy = CHARACTERS.map((c) => c.weight[1]);
  assert.ok(Math.max.apply(null, heavy) > Math.min.apply(null, heavy),
    "every character drawing the same weight is one shot with jitter, not ten shots");
});

test("the geometry is randomised: two draws of the same hub differ", () => {
  const geom = makeGeom();
  const hub = { x: 30, y: 50, aim: 10, reach: 80 };
  const sig = (p) => p.spokes.concat(p.rings).map((s) => s.d).join("|");
  const a = sig(geom.webPlan(Math.random, hub));
  const b = sig(geom.webPlan(Math.random, hub));
  assert.notEqual(a, b, "two reloads must not draw the same web");
});

test("the shot seeds itself from Math.random at load, not from a fixed index", () => {
  assert.match(shotJs, /thwipSvg\(Math\.random\)/);
  assert.match(shotJs, /thwipCharacter\(rng\)/, "the character of the shot must be drawn too");
  const hubs = shotJs.slice(shotJs.indexOf("function thwipHubs"), shotJs.indexOf("function thwipAnchor"));
  assert.match(hubs, /webPick\(rng,/, "origin, aim and reach must all be drawn at random");
});

test("a shot has a character, and the characters differ in kind and not only in degree", () => {
  assert.ok(CHARACTERS.length >= 4, "a handful of characters is what makes ten reloads differ");
  const names = CHARACTERS.map((c) => c.name);
  assert.equal(new Set(names).size, names.length, "every character needs its own name");
  const hubs = new Set(CHARACTERS.map((c) => c.hubs));
  assert.ok(hubs.size >= 2, "some shots are a single hit, others a spray from several origins");
  assert.ok(CHARACTERS.some((c) => c.cross >= 0.5), "some shots string cross-threads");
  assert.ok(CHARACTERS.some((c) => c.cross <= 0.25), "and some never do");
  assert.ok(CHARACTERS.some((c) => c.splat >= 0.7), "some shots splat anchors at the landings");
  assert.ok(CHARACTERS.some((c) => c.splat <= 0.4), "and some land clean");
});

test("the shot reaches well beyond the letters rather than hiding behind them", () => {
  const box = shotJs.match(/const THWIP_BOX = \{ w: (\d+), h: (\d+) \};/);
  assert.ok(box, "the shot has no box");
  assert.ok(Number(box[1]) >= 480, "a 300-wide box is a flourish, not a THWIP");
  assert.ok(Number(box[2]) >= 180, "the shot needs vertical reach too");
  const width = shotCss.match(/\.thwip\{[^}]*width:(\d+)%/);
  assert.ok(width && Number(width[1]) >= 350, "the shot must be scaled up over the masthead");
});

test("the strands stagger out of the letters rather than arriving all at once", () => {
  assert.match(shotJs, /const THWIP_STEP = \d+;/);
  assert.match(geomJs, /setProperty\("--d", Math\.round\(delay\) \+ "ms"\)/);
  assert.match(shotCss, /animation-delay:var\(--d,0ms\)/);
});

test("the strands land: an anchor splats where a spoke meets the letters", () => {
  assert.match(shotJs, /function thwipAnchor/);
  assert.match(shotCss, /@keyframes thwip-splat\{/);
  assert.match(shotCss, /\.thwip--fire \.thwip__hit\{/);
});

test("the whole shot stays inside its budget and never loops", () => {
  assert.doesNotMatch(shotCss, /infinite/);
  const flash = shotCss.match(/animation:thwip-flash (\d+)ms linear both;/);
  assert.ok(flash, "the shot has no bounding flash");
  assert.ok(Number(flash[1]) <= 1000, "an entrance that outstays a second is a loop");
  assert.match(shotJs, /const THWIP_HOLD = \d+;/);
});

test("the tagline is never crossed: the shot keeps out of the band the text sits in", () => {
  assert.match(shotJs, /const THWIP_SAFE = \{ x: \d+, y: \d+, w: \d+, h: \d+ \};/);
  assert.match(shotJs, /webKeepOut\(plan, THWIP_SAFE\)/,
    "spokes and rings must be filtered out of the text band");
  assert.match(shotJs, /webClearOf\(seg, THWIP_SAFE\)/,
    "cross-threads are drawn after the plan, so they need the same keep-out");
  assert.match(shotCss, /\.tagline\{position:relative;z-index:2;\}/,
    "the tagline must sit above the strands as a second defence");
});

test("the keep-out samples along a curve, not merely at its ends", () => {
  const geom = makeGeom();
  const box = { x: 40, y: 40, w: 40, h: 40 };
  const through = { kind: "spoke", d: "M0 60 Q60 60 120 60", len: 120 };
  assert.equal(geom.webClearOf(through, box), false,
    "a thread whose ends miss the box but whose belly crosses it still crosses the text");
  const clear = { kind: "spoke", d: "M0 10 Q60 10 120 10", len: 120 };
  assert.equal(geom.webClearOf(clear, box), true);
});

test("the strands are drawn in the page ink, and never in a colour of their own", () => {
  const colours = shotCss.match(/stroke:[^;]+;/g) || [];
  assert.ok(colours.length > 0, "no strokes declared");
  colours.forEach((decl) => {
    if (/stroke:none/.test(decl)) return;
    assert.match(decl, /var\(--(paper|cyan|pink|ink|dim)\)/, decl + " is not a token colour");
  });
});

test("the wordmark takes a recoil kick, and it moves nothing but transform", () => {
  assert.match(shotCss, /@keyframes thwip-recoil\{/);
  const recoil = shotCss.slice(shotCss.indexOf("@keyframes thwip-recoil"));
  const kick = recoil.slice(0, recoil.indexOf("}\n}") + 3);
  assert.match(kick, /translate3d/);
  assert.doesNotMatch(kick, /(^|[^-])(margin|width|height|top|left|padding):/);
});

test("the shot fires on load and re-weaves a fresh web on click", () => {
  assert.match(shotJs, /requestAnimationFrame\(\(\) => thwipFire\(mark, svg\)\)/);
  assert.match(shotJs, /addEventListener\("click", \(\) => thwipReshoot\(word, mark\)\)/);
  assert.match(shotJs, /if \(mark\.dataset\.firing === "1"\) return;/);
  const re = shotJs.slice(shotJs.indexOf("function thwipReshoot"), shotJs.indexOf("function mountThwipShot"));
  assert.match(re, /thwipSvg\(Math\.random\)/, "a click must draw a new web, not replay the old one");
});

test("reduced motion kills the shot outright: no strands, no kick, no listener", () => {
  const block = shotCss.slice(shotCss.indexOf("@media(prefers-reduced-motion:reduce)"));
  const reduce = block.slice(0, block.indexOf(".is-capture"));
  assert.match(reduce, /\.thwip\{display:none !important;\}/);
  assert.match(reduce, /animation:none !important/);
  assert.match(reduce, /\.wordmark--fire\{transform:none !important;\}/);
  assert.match(geomJs, /matchMedia\("\(prefers-reduced-motion:reduce\)"\)\.matches/);
  const fire = shotJs.slice(shotJs.indexOf("function thwipFire"));
  assert.match(fire, /if \(thwipReduced\(\)\) return;/);
  assert.match(shotJs, /if \(thwipReduced\(\)\) return svg;/);
});

test("capture and print carry no strands and no kick", () => {
  assert.match(shotCss, /\.is-capture \.thwip\{display:none !important;\}/);
  assert.match(shotCss, /\.is-capture \.wordmark--fire\{animation:none !important;transform:none !important;\}/);
  const print = shotCss.slice(shotCss.indexOf("@media print"));
  assert.match(print, /\.thwip\{display:none !important;\}/);
  assert.match(print, /\.wordmark--fire\{animation:none !important;transform:none !important;\}/);
});

test("the shot never takes the pointer or the layout from the page beneath it", () => {
  const thwip = shotCss.slice(shotCss.indexOf(".thwip{"), shotCss.indexOf(".thwip__g{"));
  assert.match(thwip, /position:absolute/);
  assert.match(thwip, /pointer-events:none/);
  assert.match(thwip, /z-index:-1/);
  assert.match(geomJs, /setAttribute\("aria-hidden", "true"\)/);
  assert.match(geomJs, /setAttribute\("focusable", "false"\)/);
});

test("neither the modules nor the sheet carries a single comment", () => {
  [["thwip-shot.js", shotJs], ["web-geom.js", geomJs], ["masthead.css", shotCss]].forEach(([name, text]) => {
    assert.ok(!text.includes("/*"), name + " has a block comment");
    text.split(String.fromCharCode(10)).forEach((line, n) => {
      const at = line.indexOf("//");
      const url = at > 0 && line.charAt(at - 1) === ":";
      assert.ok(at === -1 || url, name + " has a line comment on line " + (n + 1));
    });
  });
});

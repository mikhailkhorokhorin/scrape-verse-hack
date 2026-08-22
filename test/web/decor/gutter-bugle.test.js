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
const bugleJs = fs.readFileSync(modulePath("gutter-bugle.js"), "utf8");
const typeJs = fs.readFileSync(modulePath("gutter-bugle-type.js"), "utf8");
const webheadJs = fs.readFileSync(modulePath("gutter-webhead.js"), "utf8");
const motifsJs = fs.readFileSync(modulePath("gutter-motifs.js"), "utf8");
const planJs = fs.readFileSync(modulePath("gutter-plan.js"), "utf8");
const bugleCss = fs.readFileSync(cssPath("bugle.css"), "utf8");
const gutterCss = fs.readFileSync(cssPath("gutter.css"), "utf8");

test("both hero motifs load before the registry that names them", () => {
  [index, manual].forEach((page) => {
    const parts = page.indexOf("js/decor/gutter-parts.js");
    const bugle = page.indexOf("js/decor/gutter-bugle.js");
    const webhead = page.indexOf("js/decor/gutter-webhead.js");
    const motifs = page.indexOf("js/decor/gutter-motifs.js");
    assert.ok(bugle > parts, "the building is built out of the shared parts");
    assert.ok(webhead > parts, "the figure is built out of the shared parts");
    assert.ok(motifs > bugle && motifs > webhead,
      "the registry names both makers, so it must load after them");
    assert.match(page, /<link rel="stylesheet" href="css\/decor\/bugle\.css">/);
  });
});

test("the registry carries the building and the figure", () => {
  const makers = motifsJs.match(/GUTTER_MOTIF_MAKERS = \{([^}]*)\}/);
  assert.ok(makers, "the motifs are not registered");
  assert.match(makers[1], /bugle: gutterBugleSvg/);
  assert.match(makers[1], /webhead: gutterWebheadSvg/);
});

test("the building is pinned right on the watch, the figure left on the manual", () => {
  const watch = planJs.slice(planJs.indexOf("watch: {"), planJs.indexOf("manual: {"));
  const man = planJs.slice(planJs.indexOf("manual: {"));
  assert.match(watch, /kind: "bugle", side: "right"/,
    "the building belongs in the watch right gutter");
  assert.ok(!/kind: "webhead"/.test(watch), "the figure belongs to the manual");
  assert.match(man, /kind: "webhead", side: "left"/,
    "the figure belongs in the manual left gutter");
  assert.ok(!/kind: "bugle"/.test(man), "the building belongs to the watch");
});

test("the sign stands on its own lattice rig, above the roof", () => {
  assert.match(bugleJs, /function gutterBugleFrame/);
  assert.match(bugleJs, /gutter__rigline/);
  const decl = bugleJs.slice(bugleJs.indexOf("GUTTER_BUGLE_D ="));
  const rig = decl.slice(0, decl.indexOf(";")).match(/"[^"]*"/g).join(" ").replace(/"/g, "");
  const segs = rig.match(/M-?\d+ -?\d+ L-?\d+ -?\d+/g) || [];
  const parts = segs.map((seg) => seg.match(/M(-?\d+) (-?\d+) L(-?\d+) (-?\d+)/));
  const uprights = parts.filter((m) => m[1] === m[3]).length;
  const rails = parts.filter((m) => m[2] === m[4]).length;
  assert.ok(uprights >= 4, "the rig needs vertical posts showing through the letters");
  assert.ok(rails >= 3, "the rig needs horizontal rails showing through the letters");
});

test("a bugle sits between the two words of the sign", () => {
  assert.match(typeJs, /function gutterBugleHorn/);
  assert.match(typeJs, /gutter__bell/);
  const sign = bugleJs.slice(bugleJs.indexOf("function gutterBugleSign"));
  const body = sign.slice(0, sign.indexOf("\n}"));
  const daily = body.indexOf('"DAILY"');
  const horn = body.indexOf("gutterBugleHorn");
  const bugle = body.indexOf('"BUGLE"');
  assert.ok(daily > -1 && bugle > -1, "both words must be set");
  assert.ok(horn > daily && horn < bugle, "the horn belongs between the words");
});

test("the sign is heavy red display type, not body copy", () => {
  const rule = bugleCss.slice(bugleCss.indexOf(".gutter__sign{"));
  const body = rule.slice(0, rule.indexOf("}"));
  assert.match(body, /fill:var\(--critical\)/, "the sign must be red");
  assert.match(body, /font-family:Anton/, "the sign must be set in the display face");
});

test("the top row is arched and the rows below are square", () => {
  assert.match(bugleJs, /arch\s*\?/, "the window maker must branch on the arch");
  assert.match(bugleJs, /r === 0/, "only the top row is arched");
  assert.match(bugleJs, /gutterEl\("rect", \{ class: cls/, "the lower rows are plain rects");
});

test("every window blinks on its own clock, so the light stays sparse", () => {
  assert.match(bugleJs, /"--lit"/, "each window needs its own period");
  assert.match(bugleJs, /"--d"/, "each window needs its own phase");
  const win = bugleJs.slice(bugleJs.indexOf("function gutterBugleWindow"));
  const body = win.slice(0, win.indexOf("\n}"));
  assert.match(body, /webPick\(rng, GUTTER_BUGLE_CYCLE\[0\], GUTTER_BUGLE_CYCLE\[1\]\)/,
    "the period must be drawn per window, not shared by a fixed set");
  assert.match(body, /webPick\(rng, 0, span\)/,
    "the phase must be drawn per window, or every window blinks in unison");
  const cycle = (bugleJs.match(/GUTTER_BUGLE_CYCLE = \[([^\]]+)\]/) || [])[1];
  const [lo, hi] = cycle.split(",").map((n) => Number(n.trim()));
  assert.ok(hi > lo, "the cycle needs a real spread, or the periods collapse");
  assert.ok(lo >= 10, lo + "s is too short a cycle to keep the building calm");
  const frames = bugleCss.slice(bugleCss.indexOf("@keyframes gutter-blink"));
  const on = frames.match(/(\d+)%,(\d+)%\{opacity:1;\}/);
  assert.ok(on, "the keyframes must hold the window lit for a slice of the cycle");
  assert.ok(Number(on[2]) - Number(on[1]) <= 12,
    "a window lit most of its cycle turns the facade into a garland");
});

test("the window light snaps and only ever animates opacity", () => {
  const rule = bugleCss.slice(bugleCss.indexOf(".gutter__glow{"));
  const body = rule.slice(0, rule.indexOf("}"));
  assert.match(body, /steps\(1/, "the light must snap, not fade");
  assert.match(body, /will-change:opacity/);
  const at = bugleCss.indexOf("@keyframes gutter-blink");
  assert.ok(at > -1, "the blink keyframes are missing");
  const frames = bugleCss.slice(at);
  assert.match(frames, /opacity:/);
  assert.doesNotMatch(frames, /(transform|filter|box-shadow|background-position|stroke-dashoffset):/,
    "the blink must not touch a paint or layout property");
});

test("the figure is one transparent artwork, sized from its own aspect", () => {
  assert.match(webheadJs, /GUTTER_WEBHEAD_SRC = "assets\/webhead\.png"/,
    "the artwork must be a png, the only format here that carries transparency");
  const art = (webheadJs.match(/GUTTER_WEBHEAD_ART = \{ w: (\d+), h: (\d+) \}/) || []);
  assert.ok(art.length === 3, "the artwork needs its intrinsic size recorded");
  assert.match(webheadJs, /Math\.round\(wide \* art\.h \/ art\.w\)/,
    "height must follow the artwork aspect, or the figure stretches");
  assert.doesNotMatch(webheadJs, /feColorMatrix|feComposite/,
    "a transparent png needs no background key");
});

test("the figure swings on the shared sway, and rests under reduced motion", () => {
  assert.match(webheadJs, /gutter__swing gutter__swing--webhead/,
    "the figure must reuse the shared swing");
  assert.match(bugleCss, /\.gutter__swing--webhead\{transform-origin:/,
    "the swing modifier needs its own origin");
  const reduce = gutterCss.slice(gutterCss.indexOf("@media(prefers-reduced-motion:reduce)"));
  assert.match(reduce, /\.gutter__glow\{animation:none !important/,
    "the windows must stop blinking under reduced motion");
  assert.ok(reduce.includes("gutter__swing"), "the swing must stop under reduced motion");
});

test("every class the two makers create has a real rule to draw it", () => {
  const sheet = bugleCss + gutterCss;
  const used = new Set();
  [bugleJs, webheadJs].forEach((src) => {
    (src.match(/gutter__[a-z-]+/g) || []).forEach((c) => used.add(c));
  });
  used.forEach((cls) => {
    assert.ok(sheet.includes("." + cls), cls + " is created in JS but has no CSS rule");
  });
});

test("the decoration only ever draws in token colours", () => {
  const colours = (bugleCss.match(/(?:stroke|fill|color):[^;]+;/g) || [])
    .filter((d) => !/(none|currentColor)/.test(d));
  assert.ok(colours.length > 0);
  colours.forEach((decl) => {
    assert.match(decl, /var\(--(paper|cyan|pink|ink|dim|void|void-2|critical|degraded)\)/,
      decl + " is not a token colour");
  });
});

test("the manual gutter lights up on a laptop, and both sheets stay under the cap", () => {
  const gate = gutterCss.match(/@media\(min-width:(\d+)px\)\{\s*\.gutter--manual\{display:block;\}/);
  assert.ok(gate, "the manual layer never switches on separately");
  assert.ok(Number(gate[1]) <= 1320,
    "a 1600px floor hid every motif on a typical laptop");
  assert.match(gutterCss, /\.gutter\{[^}]*display:none;/,
    "below the floor the decoration must be hidden outright, not squeezed");
  [["bugle.css", bugleCss], ["gutter.css", gutterCss]].forEach(([name, text]) => {
    assert.ok(text.split("\n").length <= 250, name + " is over the 250-line cap");
  });
});

test("a motif never shrinks below the width at which it stops reading", () => {
  ["--bugle", "--webhead"].forEach((kind) => {
    const at = bugleCss.indexOf(".gutter .gutter__slot" + kind + "{");
    assert.ok(at > -1, kind + " has no sizing rule");
    const rule = bugleCss.slice(at, bugleCss.indexOf("}", at));
    const floor = Number((rule.match(/clamp\((\d+)px/) || [])[1]);
    assert.ok(floor >= 56, kind + " may shrink to " + floor + "px, which is unreadable");
  });
});

test("every brace in the decoration sheets closes, so no rule is swallowed", () => {
  [["bugle.css", bugleCss], ["gutter.css", gutterCss]].forEach(([name, text]) => {
    let depth = 0;
    text.split(String.fromCharCode(10)).forEach((line, n) => {
      for (const ch of line) {
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
      }
      assert.ok(depth >= 0,
        name + " closes a brace it never opened on line " + (n + 1) +
        ", which silently eats the rules that follow");
    });
    assert.equal(depth, 0, name + " leaves " + depth + " brace(s) open");
  });
});

test("neither new module nor the new sheet carries a single comment", () => {
  [["gutter-bugle.js", bugleJs], ["gutter-webhead.js", webheadJs],
    ["bugle.css", bugleCss]].forEach(([name, text]) => {
    assert.ok(!text.includes("/*"), name + " has a block comment");
    text.split(String.fromCharCode(10)).forEach((line, n) => {
      const at = line.indexOf("//");
      const url = at > 0 && line.charAt(at - 1) === ":";
      assert.ok(at === -1 || url, name + " has a line comment on line " + (n + 1));
    });
  });
});

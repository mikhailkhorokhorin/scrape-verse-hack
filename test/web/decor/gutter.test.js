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
const gutterJs = fs.readFileSync(modulePath("gutter.js"), "utf8");
const partsJs = fs.readFileSync(modulePath("gutter-parts.js"), "utf8");
const planJs = fs.readFileSync(modulePath("gutter-plan.js"), "utf8");
const motifsJs = fs.readFileSync(modulePath("gutter-motifs.js"), "utf8");
const gutterCss = fs.readFileSync(cssPath("gutter.css"), "utf8");

function setOf(name) {
  const at = planJs.indexOf(name + ": {");
  assert.ok(at > -1, "no decoration set named " + name);
  return planJs.slice(at, planJs.indexOf("\n  },", at));
}

test("both pages carry the decoration layer, geometry first", () => {
  [index, manual].forEach((page) => {
    assert.match(page, /<link rel="stylesheet" href="css\/decor\/gutter\.css">/);
    const geom = page.indexOf("js/sheets/front/web-geom.js");
    const parts = page.indexOf("js/decor/gutter-parts.js");
    const motifs = page.indexOf("js/decor/gutter-motifs.js");
    const plan = page.indexOf("js/decor/gutter-plan.js");
    const gut = page.indexOf("js/decor/gutter.js");
    assert.ok(geom > -1 && parts > geom, "the parts need the shared geometry first");
    assert.ok(motifs > parts, "the motifs are built out of the parts");
    assert.ok(plan > geom, "the plan picks with the shared random helpers");
    assert.ok(gut > motifs && gut > plan, "gutter.js draws the plan, so it loads last");
  });
});

test("the gutters are drawn with the same spoke-and-ring web as the shot", () => {
  assert.match(gutterJs, /webPlan\(rng, hub, \{/);
  assert.match(gutterJs, /plan\.spokes\.forEach/);
  assert.match(gutterJs, /plan\.rings\.forEach/);
  assert.match(gutterJs, /webPathEl\(seg, "gutter__spoke"/);
  assert.match(gutterJs, /webPathEl\(seg, "gutter__ring"/);
});

test("the watch and the manual get visibly different arrangements", () => {
  const watch = setOf("watch");
  const man = setOf("manual");
  assert.notEqual(watch, man, "both pages would be decorated identically");
  assert.match(watch, /tl: "cyan"/);
  assert.match(watch, /br: "pink"/);
  assert.match(man, /tr: "pink"/);
  assert.match(man, /bl: "cyan"/);
  const wPool = (watch.match(/pool: \[([^\]]*)\]/) || [])[1];
  const mPool = (man.match(/pool: \[([^\]]*)\]/) || [])[1];
  assert.ok(wPool && mPool && wPool !== mPool,
    "the two pages must draw their extra motifs from different pools");
});

test("only the watch hangs a spider, and only the manual hangs a dew drop", () => {
  const watch = setOf("watch");
  const man = setOf("manual");
  assert.match(watch, /kind: "spider"/);
  assert.ok(!/kind: "dew"/.test(watch), "the dew drop belongs to the manual");
  assert.match(man, /kind: "dew"/);
  assert.ok(!/kind: "spider"/.test(man), "the spider belongs to the watch");
  assert.match(gutterJs, /function gutterSpiderSvg/);
  assert.match(gutterJs, /function gutterDewSvg/);
});

test("the watch spider hangs in the right gutter, clear of the tagline", () => {
  const sure = (setOf("watch").match(/sure: \[[^\]]*\]/) || [])[0];
  assert.ok(sure, "the watch has no guaranteed motif");
  assert.match(sure, /kind: "spider", side: "right"/,
    "the spider overlapped the readouts while it hung on the left");
});

test("the population is many faint marks, not two lone objects", () => {
  const watch = setOf("watch");
  const man = setOf("manual");
  [["watch", watch], ["manual", man]].forEach(([name, set]) => {
    const lo = Number((set.match(/minScatter: (\d+)/) || [])[1]);
    const hi = Number((set.match(/maxScatter: (\d+)/) || [])[1]);
    const mLo = Number((set.match(/minMotif: (\d+)/) || [])[1]);
    const mHi = Number((set.match(/maxMotif: (\d+)/) || [])[1]);
    assert.ok(lo >= 4, name + " can roll a bare gutter");
    assert.ok(hi <= 8, name + " can roll a cluttered gutter");
    assert.ok(hi >= lo && mHi >= mLo, name + " has an inverted count range");
    assert.ok(mLo >= 3, name + " needs more than the one guaranteed motif");
    assert.ok(4 + lo + mLo >= 11, name + " draws too few marks to read as texture");
  });
});

test("there are more motifs than the spider and the dew drop", () => {
  ["torn", "climber", "bead", "dewline", "sac", "bundle"].forEach((kind) => {
    assert.ok(motifsJs.includes("gutter__" + kind), kind + " has no shape");
    assert.match(planJs, new RegExp('"' + kind + '"'), kind + " is never placed");
  });
  const makers = motifsJs.match(/GUTTER_MOTIF_MAKERS = \{([^}]*)\}/);
  assert.ok(makers, "the motifs are not registered");
  assert.ok(makers[1].split(",").filter((l) => l.trim()).length >= 5,
    "at least five motifs beyond the spider and the dew drop");
});

test("all four corners can carry a web, at varying size and opacity", () => {
  assert.match(planJs, /GUTTER_SPOTS = \["tl", "tr", "bl", "br"\]/);
  assert.match(planJs, /scale: webPick\(rng, [\d.]+, [\d.]+\)/);
  assert.match(planJs, /fade: webPick\(rng, [\d.]+, [\d.]+\)/);
});

test("the scatter webs are the same spoke-and-ring geometry, shrunk", () => {
  const fn = gutterJs.slice(gutterJs.indexOf("function gutterScatterSvg"));
  const body = fn.slice(0, fn.indexOf("\n}"));
  assert.match(body, /webPlan\(rng, hub/, "a scatter web must be real web geometry");
  assert.match(body, /gutter__spoke/);
  assert.match(body, /gutter__ring/);
});

test("every placement is rolled fresh, so two loads never match", () => {
  ["gutterCornerPlan", "gutterScatterPlan", "gutterMotifPlan"].forEach((fn) => {
    assert.ok(planJs.includes("function " + fn), fn + " is missing");
  });
  ["corners", "scatter", "motifs"].forEach((part) => {
    assert.ok(planJs.includes(part + ":"), part + " is not in the plan");
  });
  assert.match(gutterJs, /gutterPlan\(rng, page\)/);
  assert.match(gutterJs, /gutterLayer\(page, Math\.random\)/,
    "the layer must be seeded from Math.random at mount");
});

test("the spider hangs upside down: the body sits below the top of its thread", () => {
  assert.match(gutterJs, /"M30 0 L30 " \+ drop/);
  assert.match(partsJs, /transform: "translate\(30 " \+ drop \+ "\)"/);
  assert.match(partsJs, /gutter__abdomen/);
  assert.match(partsJs, /gutter__head/);
  assert.ok(/cy: 30/.test(partsJs) && /cy: 13/.test(partsJs),
    "the abdomen must hang further down the thread than the head");
  assert.equal((partsJs.match(/"M-?\d/g) || []).length >= 8, true, "a spider needs eight legs");
});

test("the layer never takes the pointer and never sits over the content", () => {
  const layer = gutterCss.slice(gutterCss.indexOf(".gutter{"), gutterCss.indexOf("@media(min-width:1200px)"));
  assert.match(layer, /position:fixed/);
  assert.match(layer, /pointer-events:none/);
  const layerZ = Number((layer.match(/z-index:(-?\d+)/) || [])[1]);
  const wrapCss = fs.readFileSync(cssPath("base/layout.css"), "utf8");
  const wrapZ = Number((wrapCss.match(/\.wrap\{[^}]*z-index:(-?\d+)/) || [])[1]);
  assert.ok(Number.isFinite(layerZ), "the layer needs an explicit stacking order");
  assert.ok(Number.isFinite(wrapZ), "the content needs an explicit stacking order");
  assert.ok(layerZ < wrapZ,
    "decoration at z-index " + layerZ + " would sit over content at " + wrapZ);
  assert.match(layer, /overflow:hidden/);
  assert.match(gutterJs, /setAttribute\("aria-hidden", "true"\)/);
});

test("an overflow-hidden fixed layer cannot widen the page or scroll it sideways", () => {
  const layer = gutterCss.slice(gutterCss.indexOf(".gutter{"), gutterCss.indexOf("@media(min-width:1200px)"));
  assert.match(layer, /overflow:hidden/,
    "corner webs hang past the edge, so the layer must clip them");
  assert.match(layer, /position:fixed/,
    "a fixed layer is out of flow and cannot extend the document box");
});

test("every idle loop stays inside the motion budget and owns its own layer", () => {
  const loops = gutterCss.match(/animation:[a-z-]+ (?:var\(--sway,)?(\d+(?:\.\d+)?)s[^;]*infinite/g) || [];
  assert.ok(loops.length >= 4, "the new motifs declare no loops of their own");
  loops.forEach((decl) => {
    const secs = Number((decl.match(/(\d+(?:\.\d+)?)s/) || [])[1]);
    assert.ok(secs >= 10, "background texture must drift, not pulse: " + decl);
  });
  ["gutter__swing", "gutter__swing--slow", "gutter__loose", "gutter__crawl", "gutter__slide"]
    .forEach((cls) => {
      const at = gutterCss.indexOf("." + cls + "{");
      assert.ok(at > -1, cls + " is missing");
      const rule = gutterCss.slice(at, gutterCss.indexOf("}", at));
      assert.match(rule, /will-change:transform/, cls + " needs its own layer");
    });
});

test("the sway periods are staggered so the motifs never pulse in unison", () => {
  const list = gutterJs.match(/GUTTER_SWAYS = \[([^\]]+)\]/);
  assert.ok(list, "there is no pool of sway periods");
  const secs = list[1].split(",").map((n) => Number(n.trim()));
  assert.ok(secs.length >= 5, "too few periods to break up the rhythm");
  secs.forEach((n) => assert.ok(n >= 10, n + "s is too brisk for background texture"));
  assert.equal(new Set(secs).size, secs.length, "the periods repeat");
  assert.match(gutterJs, /"--phase"/, "without a phase offset they all start together");
});

test("every added loop moves transform only, so nothing reflows", () => {
  ["gutter-drift", "gutter-creep", "gutter-glide"].forEach((name) => {
    const at = gutterCss.indexOf("@keyframes " + name);
    assert.ok(at > -1, name + " is missing");
    const body = gutterCss.slice(at, gutterCss.indexOf("}\n}", at) + 3);
    assert.match(body, /transform:/, name + " animates nothing");
    assert.doesNotMatch(body, /(margin|width|height|top|left|padding):/,
      name + " would reflow the page every frame");
  });
});

test("the sway moves nothing but transform, so it cannot reflow the page", () => {
  const frames = gutterCss.slice(gutterCss.indexOf("@keyframes gutter-sway"));
  const body = frames.slice(0, frames.indexOf("}\n}") + 3);
  assert.match(body, /transform:rotate/);
  assert.doesNotMatch(body, /(margin|width|height|top|left|padding):/);
});

test("reduced motion, capture and print all take the decoration off", () => {
  const reduce = gutterCss.slice(gutterCss.indexOf("@media(prefers-reduced-motion:reduce)"));
  ["gutter__swing", "gutter__loose", "gutter__crawl", "gutter__slide"].forEach((cls) => {
    assert.ok(reduce.includes("." + cls), cls + " still moves under reduced motion");
  });
  assert.match(reduce, /animation:none !important;transform:none !important;/);
  assert.match(gutterCss, /\.is-capture \.gutter\{display:none !important;\}/);
  const print = gutterCss.slice(gutterCss.indexOf("@media print"));
  assert.match(print, /\.gutter\{display:none !important;\}/);
});

test("the decoration is drawn only in token colours", () => {
  const colours = (gutterCss.match(/(?:stroke|fill|color):[^;]+;/g) || [])
    .filter((d) => !/(none|currentColor)/.test(d));
  assert.ok(colours.length > 0);
  colours.forEach((decl) => {
    assert.match(decl, /var\(--(paper|cyan|pink|ink|dim|void-2)\)/, decl + " is not a token colour");
  });
});

test("neither decoration module nor its sheet carries a single comment", () => {
  [["gutter.js", gutterJs], ["gutter-parts.js", partsJs], ["gutter-plan.js", planJs],
    ["gutter-motifs.js", motifsJs], ["gutter.css", gutterCss]].forEach(([name, text]) => {
    assert.ok(!text.includes("/*"), name + " has a block comment");
    text.split(String.fromCharCode(10)).forEach((line, n) => {
      const at = line.indexOf("//");
      const url = at > 0 && line.charAt(at - 1) === ":";
      assert.ok(at === -1 || url, name + " has a line comment on line " + (n + 1));
    });
  });
});

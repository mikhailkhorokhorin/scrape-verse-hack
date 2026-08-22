"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { modulePath, cssPath } = require("../../web-loader.js");

const ROOT = path.join(__dirname, "..", "..", "..");
const WEB = path.join(ROOT, "web");
const JS = fs.readFileSync(modulePath("hover-replay.js"), "utf8");
const SHOT = fs.readFileSync(modulePath("thwip-shot.js"), "utf8");
const PULSE_CSS = fs.readFileSync(cssPath("pulse.css"), "utf8");
const SPARK_CSS = fs.readFileSync(cssPath("sparkhover.css"), "utf8");
const index = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
const manual = fs.readFileSync(path.join(WEB, "manual.html"), "utf8");

test("a hover replay is refused while the last one is still on screen", () => {
  assert.match(JS, /const HOVER_TAIL = 200;/,
    "the cooldown must outlast the animation, or a twitching mouse restarts it mid-flight");
  assert.match(JS, /Number\(cooldownMs\) > 0 \? Number\(cooldownMs\) \+ HOVER_TAIL : HOVER_TAIL/);
  assert.match(JS, /if \(last && now - last < cooldownMs\) return false;/);
});

test("reduced motion silences every hover trigger, click stays the way in", () => {
  assert.match(JS, /matchMedia\("\(prefers-reduced-motion:reduce\)"\)\.matches/);
  const enter = JS.slice(JS.indexOf("function hoverReplay"), JS.indexOf("function hoverClear"));
  assert.match(enter, /if \(hoverReduced\(\)\) return;/,
    "the hover listener must check reduced motion at fire time, not only at bind time");
  const del = JS.slice(JS.indexOf("function hoverDelegate"));
  assert.match(del, /if \(hoverReduced\(\)\) return;/);
});

test("a replay restarts the animation by reflow, never by an inline style", () => {
  const restart = JS.slice(JS.indexOf("function hoverRestart"), JS.indexOf("function hoverDelegate"));
  assert.match(restart, /classList\.remove\(className\);/);
  assert.match(restart, /void el\.offsetWidth;/,
    "without a forced reflow the browser coalesces remove+add and nothing replays");
  assert.match(restart, /classList\.add\(className\);/);
  assert.doesNotMatch(JS, /style\.animation\s*=/,
    "an inline animation beats the class and silently kills it");
});

test("the cleanup listens for its own animation, not for a neighbouring loop", () => {
  const restart = JS.slice(JS.indexOf("function hoverRestart"), JS.indexOf("function hoverDelegate"));
  assert.match(restart, /if \(name && event\.animationName !== name\) return;/,
    "the pulse also runs an infinite blink: an unfiltered animationend ends the kick in one frame");
  assert.match(restart, /removeEventListener\("animationend", off\)/,
    "a listener left behind on every hover is a leak");
  assert.match(JS, /hoverRestart\(dot, "pulse--kick", "pulse-kick"\)/);
  assert.match(JS, /hoverRestart\(spark, "spark--replay", "spark-replay"\)/);
});

test("hover on repainted nodes is delegated, so a re-render cannot double-bind", () => {
  assert.match(JS, /root\.addEventListener\("mouseover", on\)/);
  assert.match(JS, /if \(root\.dataset\.hoverDelegate === selector\) return null;/,
    "mounting twice must not stack a second listener");
  assert.match(JS, /if \(el\.dataset\.hoverBound === "1"\) return null;/);
  const pulse = JS.slice(JS.indexOf("function mountHoverPulse"), JS.indexOf("function mountHoverSparks"));
  assert.match(pulse, /querySelector\("\.readouts"\)/,
    "the dot itself is rebuilt by renderWatch, so the readouts row must own the listener");
  const spark = JS.slice(JS.indexOf("function mountHoverSparks"), JS.indexOf("function mountHoverReplay"));
  assert.match(spark, /getElementById\("grid"\)/);
});

test("the logo replays the shot on hover through the same path a click takes", () => {
  assert.match(SHOT, /hoverReplay\(word, \(\) => thwipReshoot\(word, mark\), THWIP_HOLD\)/,
    "hover must reuse thwipReshoot, not grow a second copy of the firing logic");
  assert.match(SHOT, /addEventListener\("click", \(\) => thwipReshoot\(word, mark\)\)/,
    "the click must survive the change");
  const mount = SHOT.slice(SHOT.indexOf("function mountThwipShot"));
  assert.ok(mount.indexOf("thwipReduced()") < mount.indexOf("hoverReplay"),
    "reduced motion must return before the hover is ever bound");
});

test("the shot keeps one guard, and the hover does not grow a second", () => {
  assert.match(SHOT, /if \(mark\.dataset\.firing === "1"\) return;/);
  assert.equal((SHOT.match(/dataset\.firing/g) || []).length, 3,
    "thwipFire already owns the re-entry guard: set, cleared and checked, nothing more");
});

test("the pulse kick is a real keyframe that outranks the resting blink", () => {
  assert.match(PULSE_CSS, /@keyframes pulse-kick\{/);
  assert.match(PULSE_CSS, /\.pulse--kick\{animation:pulse-kick 640ms/);
  const kick = PULSE_CSS.slice(PULSE_CSS.indexOf("@keyframes pulse-kick"));
  const body = kick.slice(0, kick.indexOf("}\n}") + 3);
  assert.doesNotMatch(body, /box-shadow|filter|background-position/,
    "a paint property in a hover loop is what took this page from 121 to 36 fps");
});

test("the sparkline replay animates opacity only, never the dash it draws with", () => {
  assert.match(SPARK_CSS, /@keyframes spark-replay\{/);
  const body = SPARK_CSS.slice(SPARK_CSS.indexOf("@keyframes spark-replay"));
  const frames = body.slice(0, body.indexOf("}\n}") + 3);
  assert.doesNotMatch(frames, /stroke-dashoffset/,
    "stroke-dashoffset is a paint property and must not be replayed on hover");
  assert.match(frames, /opacity/);
});

test("every hover effect is switched off for reduced motion, capture and print", () => {
  [["pulse.css", PULSE_CSS, "pulse--kick"], ["sparkhover.css", SPARK_CSS, "spark--replay"]]
    .forEach(([name, css, cls]) => {
      const reduce = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
      assert.match(reduce, new RegExp("\." + cls + "\{animation:none"), name + " still animates for reduced motion");
      assert.match(css, new RegExp("\.is-capture \." + cls + "\{animation:none"), name + " animates during capture");
      assert.match(css, new RegExp("@media print\{\." + cls + "\{animation:none"), name + " animates in print");
    });
});

test("the helper loads before the modules that call it, on both pages", () => {
  [["index.html", index], ["manual.html", manual]].forEach(([name, page]) => {
    const helper = page.indexOf("js/fx/hover-replay.js");
    const shot = page.indexOf("js/sheets/front/thwip-shot.js");
    assert.ok(helper > -1, name + " does not load hover-replay.js");
    assert.ok(shot > -1, name + " does not load thwip-shot.js");
    assert.ok(helper < shot, name + " loads the helper after the shot that calls hoverReplay");
  });
});

test("the helper carries no comment", () => {
  assert.ok(!JS.includes("/*"), "hover-replay.js has a block comment");
  JS.split(String.fromCharCode(10)).forEach((line, n) => {
    const at = line.indexOf("//");
    const url = at > 0 && line.charAt(at - 1) === ":";
    assert.ok(at === -1 || url, "hover-replay.js has a line comment on line " + (n + 1));
  });
});

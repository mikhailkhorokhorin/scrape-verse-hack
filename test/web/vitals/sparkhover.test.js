'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture } = require('../../web-loader.js');

const web = loadWebModule(['config.js', 'format.js', 'sparkhover.js']);
const { sparkHitsSVG, sparkTipHTML, sparkCursorSVG, SPARK_HIT_W } = web;

const adapterWeb = loadWebModule(['config.js', 'format.js', 'adapter.js'], {
  RAW_HISTORY: [],
});
const HISTORY = readFixture('history.json');

test('sparkHitsSVG emits one hit target per point', () => {
  const pts = [[3, 10], [120, 20], [237, 30]];
  const svg = sparkHitsSVG(pts, 240, 44);
  assert.equal((svg.match(/<rect/g) || []).length, 3);
});

test('sparkHitsSVG indexes every hit target in series order', () => {
  const pts = [[3, 10], [120, 20], [237, 30]];
  const svg = sparkHitsSVG(pts, 240, 44);
  assert.match(svg, /data-i="0"/);
  assert.match(svg, /data-i="1"/);
  assert.match(svg, /data-i="2"/);
});

test('sparkHitsSVG carries each point y so the cursor dot can sit on the line', () => {
  const svg = sparkHitsSVG([[120, 21.5]], 240, 44);
  assert.match(svg, /data-y="21\.5"/);
});

test('sparkHitsSVG keeps every hit target inside the viewBox', () => {
  const pts = [[3, 10], [120, 20], [237, 30]];
  const svg = sparkHitsSVG(pts, 240, 44);
  const rects = [...svg.matchAll(/x="([\d.]+)" y="0" width="([\d.]+)"/g)];
  assert.equal(rects.length, 3);
  for (const [, x, w] of rects) {
    assert.ok(Number(x) >= 0, 'x should not be negative');
    assert.ok(Number(x) + Number(w) <= 240, 'hit target should not overflow the viewBox');
  }
});

test('sparkHitsSVG spans the full height so a stretched chart stays hittable', () => {
  const svg = sparkHitsSVG([[120, 20]], 240, 44);
  assert.match(svg, /height="44"/);
});

test('sparkHitsSVG gives an interior point the configured hit width', () => {
  const svg = sparkHitsSVG([[3, 10], [120, 20], [237, 30]], 240, 44);
  const widths = [...svg.matchAll(/width="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.equal(widths[1], SPARK_HIT_W);
});

test('sparkHitsSVG widens a lone point to the whole chart so it stays hittable', () => {
  const svg = sparkHitsSVG([[120, 20]], 240, 44);
  assert.equal(Number(svg.match(/width="([\d.]+)"/)[1]), 240);
});

test('sparkHitsSVG records the true point x, not the clamped rect centre', () => {
  const pts = [[3, 10], [120, 20], [237, 30]];
  const svg = sparkHitsSVG(pts, 240, 44);
  const xs = [...svg.matchAll(/data-x="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(xs, [3, 120, 237]);
});

test('sparkHitsSVG keeps the edge point x exact even though its rect is clamped', () => {
  const svg = sparkHitsSVG([[3, 10], [120, 20], [237, 30]], 240, 44);
  const first = svg.match(/<rect[^>]*data-i="0"[^>]*>/)[0];
  const rectX = Number(first.match(/ x="([\d.]+)"/)[1]);
  const rectW = Number(first.match(/width="([\d.]+)"/)[1]);
  const dataX = Number(first.match(/data-x="([\d.]+)"/)[1]);
  assert.equal(rectX, 0, 'the rect should be clamped into the viewBox');
  assert.notEqual(rectX + rectW / 2, dataX, 'the clamped centre drifts off the point');
  assert.equal(dataX, 3, 'the recorded x should still be the real point');
});

test('sparkHitsSVG returns nothing for an empty series', () => {
  assert.equal(sparkHitsSVG([], 240, 44), '');
  assert.equal(sparkHitsSVG(null, 240, 44), '');
});

test('sparkHitsSVG paints transparent targets, never a visible fill', () => {
  const svg = sparkHitsSVG([[120, 20]], 240, 44);
  assert.match(svg, /fill="transparent"/);
});

test('sparkCursorSVG never uses the hidden attribute, which SVG ignores', () => {
  const svg = sparkCursorSVG([[3, 10], [120, 20]], '#B6FF3C', 44);
  assert.doesNotMatch(svg, /hidden/,
    'SVG elements have no hidden IDL attribute — visibility must be class-driven');
  assert.match(svg, /class="spark__cursor"/);
});

test('sparkCursorSVG spans the chart height so the marker reads at any stretch', () => {
  const svg = sparkCursorSVG([[3, 10]], '#B6FF3C', 44);
  assert.match(svg, /y2="44"/);
});

test('sparkCursorSVG returns nothing for an empty series', () => {
  assert.equal(sparkCursorSVG([], '#B6FF3C', 44), '');
  assert.equal(sparkCursorSVG(null, '#B6FF3C', 44), '');
});

test('sparkTipHTML shows the scan clock and the integrity', () => {
  const html = sparkTipHTML({ series: [91], seriesTs: ['2026-08-21T09:30:00Z'] }, 0);
  assert.match(html, /09:30:00Z/);
  assert.match(html, /91%/);
});

test('sparkTipHTML rounds a raw float integrity to a whole percent', () => {
  const html = sparkTipHTML({ series: [98.45960396748482], seriesTs: [null] }, 0);
  assert.match(html, /98%/);
  assert.doesNotMatch(html, /98\.45/);
});

test('sparkTipHTML says the time is not recorded rather than inventing one', () => {
  const html = sparkTipHTML({ series: [91], seriesTs: [] }, 0);
  assert.match(html, /time not recorded/);
});

test('sparkTipHTML returns nothing for a point outside the series', () => {
  assert.equal(sparkTipHTML({ series: [91], seriesTs: [] }, 7), '');
  assert.equal(sparkTipHTML({}, 0), '');
});

test('sparkTipHTML reuses the shared reveal tooltip markup', () => {
  const html = sparkTipHTML({ series: [91], seriesTs: ['2026-08-21T09:30:00Z'] }, 0);
  assert.match(html, /class="reveal reveal--spark"/);
  assert.match(html, /role="tooltip"/);
  assert.match(html, /reveal__row/);
});

test('adaptHistory threads a real timestamp for every series point', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  assert.ok(spiders.length > 0, 'fixture should yield at least one spider');
  for (const sp of spiders) {
    assert.equal(sp.seriesTs.length, sp.series.length,
      sp.code + ' should have one timestamp per plotted point');
  }
});

test('adaptHistory series timestamps are real parseable instants, not interpolated', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  for (const sp of spiders) {
    for (const ts of sp.seriesTs) {
      assert.ok(Number.isFinite(Date.parse(ts)), 'expected a parseable ts, got ' + ts);
    }
  }
});

test('adaptHistory series timestamps come from the run rows themselves', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  const known = new Set(HISTORY.map((run) => run.ts));
  for (const sp of spiders) {
    for (const ts of sp.seriesTs) {
      assert.ok(known.has(ts), ts + ' should be a timestamp present in the history rows');
    }
  }
});

test('adaptHistory series timestamps run oldest to newest', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  for (const sp of spiders) {
    const times = sp.seriesTs.map((ts) => Date.parse(ts));
    for (let i = 1; i < times.length; i += 1) {
      assert.ok(times[i] >= times[i - 1], sp.code + ' series should not travel backwards');
    }
  }
});

test('adaptHistory pairs the last series point with the spider last scan', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  for (const sp of spiders) {
    assert.equal(sp.seriesTs[sp.seriesTs.length - 1], sp.ts);
  }
});

test('adaptHistory caps the timestamp array at the series maximum', () => {
  const spiders = adapterWeb.adaptHistory(HISTORY);
  for (const sp of spiders) {
    assert.ok(sp.seriesTs.length <= web.SERIES_MAX_POINTS);
  }
});

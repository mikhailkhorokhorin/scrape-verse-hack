'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWebModule } = require('../web-loader.js');

const WEB = path.join(__dirname, '..', '..', 'web');
const fixtures = fs.readFileSync(path.join(WEB, 'js', 'fixtures.js'), 'utf8');
const mockCss = fs.readFileSync(path.join(WEB, 'css', 'mock.css'), 'utf8');
const adCss = fs.readFileSync(path.join(WEB, 'css', 'ad.css'), 'utf8');
const adJs = fs.readFileSync(path.join(WEB, 'js', 'ad.js'), 'utf8');

test('the demo bar is named CHAOS LAB, not an apology about prototypes', () => {
  assert.match(fixtures, /CHAOS LAB/);
  assert.doesNotMatch(fixtures, /Prototype controls/);
});

test('the chaos lab says the fleet is synthetic and the mechanics are real', () => {
  assert.match(fixtures, /Break it yourself\. The fleet below is synthetic;/);
  assert.match(fixtures, /the mechanics are the real code\./);
});

test('the chaos lab mounts above the watch so the break is visible when it happens', () => {
  assert.match(fixtures, /getElementById\("nav-watch"\)/);
  assert.match(fixtures, /head\.parentNode\.insertBefore\(bar, head\)/);
});

test('the chaos lab keeps every control the loop needs', () => {
  ['btn-break', 'btn-heal', 'btn-dark', 'btn-reset'].forEach((id) => {
    assert.match(fixtures, new RegExp('id="' + id + '"'), id + ' is missing');
  });
});

test('the chaos lab wears the comic vocabulary: paper, ink border, hard shadow', () => {
  const block = mockCss.slice(mockCss.indexOf('.demobar{'), mockCss.indexOf('.demobar::before'));
  assert.match(block, /background:var\(--paper\)/);
  assert.match(block, /border:4px solid var\(--ink\)/);
  assert.match(block, /box-shadow:10px 10px 0 var\(--infected\)/);
});

test('no shadow anywhere in the chaos lab is blurred', () => {
  const shadows = mockCss.match(/box-shadow:[^;]+/g) || [];
  assert.ok(shadows.length > 0);
  shadows.forEach((decl) => {
    const offsets = decl.replace('box-shadow:', '').trim().split(/\s+/);
    assert.equal(offsets[2], '0', 'blur radius must be 0 in ' + decl);
  });
});

test('the coupon carries a chaos lab tag pointing at the mock page', () => {
  assert.match(adJs, /class="ad__chaos" href="\?mock=1"/);
  assert.match(adJs, /CHAOS LAB &rarr;/);
});

test('the chaos lab tag carries the same ink border and hard shadow as the lab', () => {
  const block = mockCss.slice(mockCss.indexOf('.ad__chaos{'));
  assert.match(block, /border:2px solid var\(--ink\)/);
  assert.match(block, /box-shadow:3px 3px 0 var\(--ink\)/);
  assert.match(block, /background:var\(--infected\)/);
});

test('every stylesheet this task touched stays under the 250-line cap', () => {
  [['ad.css', adCss], ['mock.css', mockCss]].forEach(([name, css]) => {
    assert.ok(css.split('\n').length <= 250, name + ' is over the cap');
  });
});

test('the mock incident carries a verification block so the receipt can render', () => {
  const context = loadWebModule(['replay-fixtures.js'], {
    Date,
    clampPct: (n) => n,
  });
  const inc = context.MOCK_RAW_INCIDENTS[0];
  assert.ok(inc.verification, 'the receipt needs a verification block');
  assert.equal(inc.verification.checked, inc.verification.checks.length);
  assert.equal(inc.verification.passed, inc.verification.checks.filter((c) => c.passed).length);
  assert.equal(inc.verification.verdict, 'EVERY_FIELD_BACK');
});

test('every verified field names what came back before and after the heal', () => {
  const context = loadWebModule(['replay-fixtures.js'], { Date });
  context.MOCK_RAW_INCIDENTS[0].verification.checks.forEach((check) => {
    assert.ok(check.field, 'a check with no field');
    assert.notEqual(check.received_after, null, check.field + ' came back null');
    assert.ok(check.to === 'live', check.field + ' did not end live');
  });
});

test('the mock path seeds the landing snapshot so the first break has something to compare against', () => {
  const app = fs.readFileSync(path.join(WEB, 'js', 'app.js'), 'utf8');
  const mock = app.slice(app.indexOf('function loadMock'), app.indexOf('mountMockControls'));
  assert.match(mock, /announceLandings\(SPIDERS\)/);
});

test('the chaos lab announces its own changes, so the character reacts to a break it caused', () => {
  const start = fixtures.indexOf('getElementById("btn-break").addEventListener');
  const end = fixtures.indexOf('getElementById("btn-heal").addEventListener');
  assert.ok(start > 0 && end > start);
  assert.match(fixtures.slice(start, end), /if \(api\.announce\) api\.announce\(\);/);
});

test('the re-weave announces too, so the healed panel speaks as well as the broken one', () => {
  const start = fixtures.indexOf('getElementById("btn-heal").addEventListener');
  const end = fixtures.indexOf('getElementById("btn-dark").addEventListener');
  assert.ok(start > 0 && end > start);
  assert.match(fixtures.slice(start, end), /if \(api\.announce\) api\.announce\(\);/);
});

test('the chaos lab tag carries a full touch target on a coarse pointer', () => {
  const coarse = mockCss.slice(mockCss.indexOf('@media (pointer: coarse)'));
  assert.match(coarse, /\.ad__chaos::after/);
  assert.match(coarse, /height:44px/);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWebModule, modulePath } = require('../web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'ad.js']);
const {
  adHTML, adTestCount, adTestLine, adCouponHTML, adToolsHTML,
  AD_FREE_TOOLS, AD_PAID_TOOLS, AD_ORDERS, AD_REPO,
} = context;

const registry = require('../../mcp/registry.js');

test('the ad never advertises a tool the server does not actually register', () => {
  const advertised = Array.from(AD_FREE_TOOLS.concat(AD_PAID_TOOLS), (pair) => pair[0]);
  const real = registry.TOOLS.map((tool) => tool.name);
  advertised.forEach((name) => assert.ok(real.includes(name), name + ' is not a real tool'));
});

test('the headline count matches the number of tools the ad lists', () => {
  const advertised = AD_FREE_TOOLS.length + AD_PAID_TOOLS.length;
  const words = { 4: 'FOUR', 6: 'SIX', 7: 'SEVEN', 8: 'EIGHT' };
  assert.ok(adHTML().includes(words[advertised] + ' TOOLS.'),
    `the ad lists ${advertised} tools, so the headline must say ${words[advertised]} TOOLS`);
});

test('the free tools are the ones that never touch the network', () => {
  const free = AD_FREE_TOOLS.map((pair) => pair[0]);
  free.forEach((name) => {
    const tool = registry.TOOLS.find((t) => t.name === name);
    assert.ok(tool, name + ' is not a real tool');
    assert.doesNotMatch(tool.description, /spends real Bright Data credits/);
  });
});

test('the two paid tools are the ones whose own description warns about credit', () => {
  const paid = AD_PAID_TOOLS.map((pair) => pair[0]);
  assert.equal(paid.length, 2);
  paid.forEach((name) => {
    const tool = registry.TOOLS.find((t) => t.name === name);
    assert.ok(tool, name + ' is not a real tool');
    assert.match(tool.description, /spends real Bright Data credits/);
  });
});

test('the test count is read from meta, never baked into the markup', () => {
  assert.equal(adTestCount({ tests: 935 }), 935);
  assert.equal(adTestCount({ tests: 821 }), 821);
  const source = fs.readFileSync(modulePath('ad.js'), 'utf8');
  assert.doesNotMatch(source, /\b(821|935|889)\b/, 'a test count is hardcoded in ad.js');
});

test('a meta with no usable count degrades to a line that claims no number', () => {
  [null, undefined, {}, { tests: null }, { tests: 'many' }, { tests: NaN }].forEach((meta) => {
    assert.equal(adTestCount(meta), null);
    assert.doesNotMatch(adTestLine(meta), /TESTS/);
  });
});

test('a four-digit count is grouped the way the rest of the page groups numbers', () => {
  assert.match(adTestLine({ tests: 1234 }), /1,234 TESTS/);
});

test('the coupon carries the three real commands, in the order you run them', () => {
  const html = adCouponHTML({ tests: 935 });
  const wanted = [
    'git clone ' + AD_REPO,
    'npm test',
    'claude mcp add thwip -- node mcp/server.js',
  ];
  let cursor = -1;
  wanted.forEach((cmd) => {
    const at = html.indexOf(cmd);
    assert.notEqual(at, -1, cmd + ' is missing from the coupon');
    assert.ok(at > cursor, cmd + ' is out of order');
    cursor = at;
  });
  assert.deepEqual(Array.from(AD_ORDERS, (o) => o[1]), wanted);
});

test('the clone URL points at this repository and carries no shell decoration', () => {
  assert.match(AD_REPO, /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/);
  AD_ORDERS.forEach(([, cmd]) => {
    assert.doesNotMatch(cmd, /[$`;&|><]/, cmd + ' would not survive a copy-paste');
    assert.equal(cmd, cmd.trim());
  });
});

test('the mcp command names the server file that actually exists', () => {
  const cmd = AD_ORDERS[2][1];
  const file = cmd.slice(cmd.indexOf('node ') + 5);
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', file)), file + ' does not exist');
});

test('the coupon says to send no money', () => {
  assert.match(adCouponHTML({ tests: 935 }), /SEND NO MONEY NOW/);
});

test('decorative checkboxes are hidden from the accessibility tree', () => {
  const html = adCouponHTML({ tests: 935 });
  const boxes = html.match(/<span class="ad__box[^"]*"[^>]*>/g) || [];
  assert.ok(boxes.length >= 4);
  boxes.forEach((box) => assert.match(box, /aria-hidden="true"/));
});

test('nothing in the ad claims to be a form control that does not work', () => {
  const html = adHTML({ tests: 935 });
  ['<input', '<form', '<select', '<textarea', 'role="checkbox"', 'role="textbox"'].forEach((claim) => {
    assert.ok(!html.includes(claim), html.includes(claim) ? claim + ' is a lie' : '');
  });
});

test('the ad is one labelled region with a heading, not an anonymous div', () => {
  const html = adHTML({ tests: 935 });
  assert.match(html, /<section class="ad" id="ad" aria-labelledby="ad-title">/);
  assert.match(html, /<h3 class="ad__title" id="ad-title">/);
  assert.match(html, /<h4 class="ad__formhead" id="ad-formhead">/);
});

test('the tool names render as code, each beside what it actually answers', () => {
  const html = adToolsHTML();
  const escaped = (s) => s.replace(/'/g, '&#39;');
  AD_FREE_TOOLS.concat(AD_PAID_TOOLS).forEach(([name, what]) => {
    assert.match(html, new RegExp('<code class="ad__toolname">' + name + '</code>'));
    assert.ok(html.includes(escaped(what)), what + ' is missing');
    assert.ok(what.length > 20, name + ' is not actually described');
  });
});

test('the ad is suppressed on the fixture page, where there is no real count to claim', () => {
  const mocked = loadWebModule(['config.js', 'format.js', 'ad.js'], { MOCK: true });
  assert.equal(mocked.adSuppressed(), true);
  const live = loadWebModule(['config.js', 'format.js', 'ad.js'], { MOCK: false });
  assert.equal(live.adSuppressed(), false);
});

test('a hostile meta value is escaped rather than rendered', () => {
  const html = adHTML({ tests: '<img src=x onerror=alert(1)>' });
  assert.doesNotMatch(html, /<img/);
});

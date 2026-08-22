'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWebModule, modulePath, cssPath } = require('../../web-loader.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const WEB = path.join(ROOT, 'web');
const manual = fs.readFileSync(path.join(WEB, 'manual.html'), 'utf8');
const manualCss = fs.readFileSync(cssPath('manual.css'), 'utf8');
const manualJs = fs.readFileSync(modulePath('manual.js'), 'utf8');
const adCss = fs.readFileSync(cssPath('ad.css'), 'utf8');
const pagenavJs = fs.readFileSync(modulePath('pagenav.js'), 'utf8');
const pagenavCss = fs.readFileSync(cssPath('pagenav.css'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const submission = fs.readFileSync(path.join(ROOT, 'docs', 'SUBMISSION.md'), 'utf8');
const ad = loadWebModule(['config.js', 'format.js', 'ad.js']);
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'meta.json'), 'utf8'));
const adMarkup = ad.adHTML(meta);

test('the manual is a real second page, not a section of the console', () => {
  assert.match(manual, /<title>THWIP Manual<\/title>/);
  assert.match(manual, /<html lang="en">/);
});

test('the manual dresses itself from the console tokens rather than a second palette', () => {
  assert.match(manual, /href="css\/base\/tokens\.css"/);
  assert.match(manual, /href="css\/base\/layout\.css"/);
  assert.match(manual, /href="css\/sheets\/pagenav\.css"/);
});

test('the manual borrows the console type faces and adds none of its own', () => {
  const fonts = manual.match(/family=([A-Za-z+]+)/g) || [];
  assert.deepEqual(
    fonts.sort(),
    ['family=Anton', 'family=Bangers', 'family=IBM+Plex+Mono', 'family=Space+Grotesk']
  );
});

test('the manual wears the ad stylesheet, because the ad is now its centrepiece', () => {
  assert.match(manual, /href="css\/[a-z]*\/?ad\.css"/);
  assert.match(manual, /href="css\/[a-z]*\/?manual\.css"/);
});

test('the manual mounts the ad through a slot rather than pasting a copy of it', () => {
  assert.match(manual, /<div id="ad-slot" class="manual-ad"><\/div>/);
  assert.doesNotMatch(manual, /class="ad__coupon"/);
  assert.doesNotMatch(manual, /class="ad__toolname"/);
});

test('the manual loads the ad builders and its own mount, in that order', () => {
  const scripts = manual.match(/<script src="([^"]+)"><\/script>/g) || [];
  assert.deepEqual(scripts, [
    '<script src="js/data/format.js"></script>',
    '<script src="js/sheets/ad.js"></script>',
    '<script src="js/manual.js"></script>',
  ]);
});

test('the mount reuses the ad builders instead of duplicating a word of the pitch', () => {
  assert.match(manualJs, /adHTML\(/);
  assert.match(manualJs, /adSetCount\(/);
  ['EIGHT TOOLS', 'SEND NO MONEY', 'fleet_status', 'IRON-CLAD'].forEach((copy) => {
    assert.ok(!manualJs.includes(copy), copy + ' is duplicated in manual.js');
  });
});

test('the mount fetches meta.json and still paints a readable ad if that fails', () => {
  assert.match(manualJs, /fetch\(MANUAL_META_URL/);
  assert.match(manualJs, /"data\/meta\.json"/);
  assert.match(manualJs, /manualMountAd\(MANUAL_FALLBACK_META\)/);
  assert.match(manualJs, /\.catch\(/);
  assert.match(manualJs, /manualUsableMeta/);
});

test('the committed fallback count is the count meta.json records right now', () => {
  const fallback = manualJs.match(/MANUAL_FALLBACK_META = \{ tests: (\d+) \}/);
  assert.ok(fallback, 'manual.js has no committed fallback count');
  assert.equal(Number(fallback[1]), meta.tests,
    'the fallback in manual.js has drifted from data/meta.json');
});

test('the test count on the page is the count the committed meta.json records', () => {
  const claimed = meta.tests.toLocaleString('en-US');
  assert.ok(adMarkup.includes(claimed + ' TESTS'), 'the ad drifted from meta.json');
  assert.ok(readme.includes(claimed + ' tests'), 'the README drifted from meta.json');
  assert.ok(submission.includes(claimed + ' tests'), 'SUBMISSION drifted from meta.json');
});

test('the install instructions the manual shows are the coupon, and they are the real ones', () => {
  const clone = 'git clone https://github.com/mikhailkhorokhorin/scrape-verse-hack';
  const add = 'claude mcp add thwip -- node mcp/server.js';
  assert.ok(readme.includes(clone), 'the README no longer carries this clone line');
  assert.ok(submission.includes(add), 'SUBMISSION no longer carries this install line');
  assert.ok(adMarkup.includes(clone), 'the coupon has drifted from the README clone line');
  assert.ok(adMarkup.includes('npm test'));
  assert.ok(adMarkup.includes(add), 'the coupon has drifted from the install line');
});

test('every command the manual prints is one the README or SUBMISSION also prints', () => {
  const sources = readme + submission;
  const commands = [
    'npm test',
    'node tools/evidence-report.js',
    'node tools/numbers-audit.js',
    'python3 -m http.server 8000',
    'git log --author="thwip watch" --oneline | wc -l',
  ];
  commands.forEach((cmd) => {
    assert.ok(manual.includes(cmd), cmd + ' is missing from the manual');
    assert.ok(sources.includes(cmd), cmd + ' is not backed by README or SUBMISSION');
  });
});

test('the no-key receipt one-liner is reproduced verbatim, quoting and all', () => {
  const call = '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":' +
    '{"name":"heal_receipt","arguments":{"incident_id":"inc_001"}}}';
  assert.ok(submission.includes(call), 'SUBMISSION no longer carries the receipt call');
  assert.ok(manual.includes(call), 'the manual has drifted from the receipt call');
  assert.ok(manual.includes('| node mcp/server.js'));
});

test('the judge path is one ordered list, and says how many steps it has', () => {
  const steps = (manual.match(/class="step(?: |")/g) || []).length;
  assert.ok(steps >= 4, 'the path is worth walking');
  assert.match(manual, /<ol class="steps">/);
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  assert.match(manual, new RegExp('These are the ' + words[steps] + ' things'),
    'the lead sentence counts the steps that are actually on the page');
});

test('the manual does not reprint the install commands the coupon already carries', () => {
  const body = manual.slice(manual.indexOf('<section class="man" id="judge"'));
  assert.doesNotMatch(body, /npm test/, 'npm test belongs to the coupon, not the judge path');
  assert.doesNotMatch(body, /git clone/, 'the clone belongs to the coupon');
  assert.doesNotMatch(body, /claude mcp add/, 'the mcp install belongs to the coupon');
});

test('no file this task touched carries a comment of any kind', () => {
  assert.doesNotMatch(manual, /<!--/);
  [manualCss, adCss].forEach((css) => {
    assert.doesNotMatch(css, /\/\*/);
  });
  assert.doesNotMatch(manualJs, /\/\//);
  assert.doesNotMatch(manualJs, /\/\*/);
});

test('every file this task touched stays under the 250-line cap', () => {
  [
    ['manual.html', manual],
    ['manual.css', manualCss],
    ['manual.js', manualJs],
    ['ad.css', adCss],
    ['pagenav.js', pagenavJs],
    ['pagenav.css', pagenavCss],
  ].forEach(([name, text]) => {
    assert.ok(text.split('\n').length <= 250, name + ' is over the cap');
  });
});

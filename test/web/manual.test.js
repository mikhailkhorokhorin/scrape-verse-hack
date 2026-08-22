'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWebModule, modulePath, cssPath } = require('../web-loader.js');

const ROOT = path.join(__dirname, '..', '..');
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
  assert.match(manual, /href="css\/ad\.css"/);
  assert.match(manual, /href="css\/manual\.css"/);
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

test('the judge path keeps all six steps from SUBMISSION, in one ordered list', () => {
  const steps = manual.match(/class="step"/g) || [];
  assert.equal(steps.length, 6);
  assert.match(manual, /<ol class="steps">/);
});

test('each step is a ticket: ink border, hard shadow, and its number as a plate', () => {
  const block = manualCss.slice(manualCss.indexOf('.step{'), manualCss.indexOf('.step__h{'));
  assert.match(block, /border:3px solid var\(--ink\)/);
  assert.match(block, /box-shadow:6px 6px 0 var\(--ink\)/);
  assert.match(block, /content:counter\(step\)/);
  assert.match(block, /background:var\(--pink\)/);
});

test('the chaos lab block is a poster, and the three clicks are its panels', () => {
  assert.match(manual, /<div class="poster">/);
  assert.match(manual, /class="poster__title">THE CHAOS LAB</);
  assert.match(manual, /class="chaos" href="index\.html\?mock=1"/);
  ['BREAK BODEGA', 'DRAG ACROSS IT', 'RE-WEAVE'].forEach((click) => {
    assert.ok(manual.includes(click), click + ' is missing from the manual');
  });
  assert.equal((manual.match(/class="click"/g) || []).length, 3);
  const poster = manualCss.slice(manualCss.indexOf('.poster{'), manualCss.indexOf('.poster::before'));
  assert.match(poster, /border:4px solid var\(--ink\)/);
  assert.match(poster, /box-shadow:10px 10px 0 var\(--infected\)/);
  assert.match(manual, /fleet in this mode is synthetic/);
  assert.match(manual, /the same code the live console uses/);
});

test('the manual stands on the console halftone ground, not a flat body', () => {
  assert.match(manualCss, /\.manual-page\{background:var\(--void\);\}/);
  const poster = manualCss.slice(manualCss.indexOf('.poster::before'));
  assert.match(poster, /radial-gradient\(var\(--void-dot\) 1px,transparent 1\.4px\)/);
});

test('the foot names the page as the back page and leads back to the console', () => {
  const foot = manual.slice(manual.indexOf('<footer'));
  assert.match(foot, /THE BACK PAGE OF THE ISSUE/);
  assert.match(foot, /href="index\.html"/);
  assert.match(manualCss, /\.manfoot__colophon\{/);
  const nav = manual.slice(manual.indexOf('<nav'), manual.indexOf('</nav>'));
  assert.match(nav, /href="index\.html"/);
});

test('the console nav gains one page link, drawn as a section link but never current', () => {
  assert.match(pagenavJs, /const PAGENAV_PAGES = /);
  assert.match(pagenavJs, /href: "manual\.html", label: "MANUAL"/);
  assert.equal((pagenavJs.match(/\{ href: /g) || []).length, 1);
  assert.match(pagenavJs, /class="pagenav__link pagenav__link--page"/);
  assert.match(pagenavCss, /\.pagenav__link--page/);
  const markup = pagenavJs.slice(
    pagenavJs.indexOf('const pages = '),
    pagenavJs.indexOf('return \'<span class="pagenav__mark"')
  );
  assert.doesNotMatch(markup, /data-nav/);
  assert.match(manual, /class="pagenav__link is-here" href="manual\.html" aria-current="page"/);
});

test('a reader with scripting off still gets the three install commands', () => {
  const noscript = manual.slice(manual.indexOf('<noscript>'), manual.indexOf('</noscript>'));
  assert.match(noscript, /git clone https:\/\/github\.com\/mikhailkhorokhorin\/scrape-verse-hack/);
  assert.match(noscript, /npm test/);
  assert.match(noscript, /claude mcp add thwip -- node mcp\/server\.js/);
});

test('nothing on the manual animates through a reduced-motion preference', () => {
  const transitions = manualCss.match(/transition:[^;]+/g) || [];
  assert.ok(transitions.length > 0, 'expected at least one transition to guard');
  const reduced = manualCss.slice(manualCss.indexOf('@media(prefers-reduced-motion:reduce)'));
  assert.match(reduced, /transition:none/);
  assert.match(reduced, /transform:none/);
  assert.equal((manualCss.match(/@keyframes/g) || []).length, 0);
});

test('a printed manual drops the chrome and keeps the ad in ink on paper', () => {
  assert.match(manualCss, /@media print/);
  const print = manualCss.slice(manualCss.indexOf('@media print'));
  assert.match(print, /\.pagenav\{display:none !important;\}/);
  assert.match(print, /white-space:pre-wrap/);
  assert.match(print, /page-break-inside:avoid/);
  assert.match(print, /\.ad\{[^}]*background:#fff/);
  assert.match(print, /\.ad__cmd\{[^}]*white-space:pre-wrap/);
  assert.doesNotMatch(print, /\.ad\{display:none/);
});

test('no shadow on the manual is blurred, the way the rest of the issue is drawn', () => {
  const shadows = manualCss.match(/box-shadow:(?!none)[^;]+/g) || [];
  assert.ok(shadows.length > 0);
  shadows.forEach((decl) => {
    const parts = decl.replace('box-shadow:', '').trim().split(/\s+/);
    assert.equal(parts[2], '0', 'blur radius must be 0 in ' + decl);
  });
});

test('corners stay square and body copy stays inside a readable measure', () => {
  (manualCss.match(/border-radius:([^;]+)/g) || []).forEach((decl) => {
    assert.equal(decl, 'border-radius:0', decl + ' is not a comic corner');
  });
  const measures = manualCss.match(/max-width:(\d+)ch/g) || [];
  assert.ok(measures.length > 0);
  measures.forEach((decl) => {
    assert.ok(Number(decl.match(/(\d+)/)[1]) <= 75, decl + ' is wider than 75ch');
  });
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

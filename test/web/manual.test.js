'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const WEB = path.join(ROOT, 'web');
const manual = fs.readFileSync(path.join(WEB, 'manual.html'), 'utf8');
const manualCss = fs.readFileSync(path.join(WEB, 'css', 'manual.css'), 'utf8');
const pagenavJs = fs.readFileSync(path.join(WEB, 'js', 'pagenav.js'), 'utf8');
const pagenavCss = fs.readFileSync(path.join(WEB, 'css', 'pagenav.css'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const submission = fs.readFileSync(path.join(ROOT, 'docs', 'SUBMISSION.md'), 'utf8');

test('the manual is a real second page, not a section of the console', () => {
  assert.match(manual, /<title>THWIP Manual<\/title>/);
  assert.match(manual, /<html lang="en">/);
});

test('the manual dresses itself from the console tokens rather than a second palette', () => {
  assert.match(manual, /href="css\/tokens\.css"/);
  assert.match(manual, /href="css\/layout\.css"/);
  assert.match(manual, /href="css\/pagenav\.css"/);
});

test('the manual borrows the console type faces and adds none of its own', () => {
  const fonts = manual.match(/family=([A-Za-z+]+)/g) || [];
  assert.deepEqual(fonts.sort(), ['family=Anton', 'family=IBM+Plex+Mono', 'family=Space+Grotesk']);
});

test('the manual carries its own stylesheet and only that one new file', () => {
  assert.match(manual, /href="css\/manual\.css"/);
  const sheets = manual.match(/href="css\/([a-z-]+)\.css"/g) || [];
  assert.equal(sheets.length, 5);
});

test('the manual prints the clone command exactly as the README gives it', () => {
  const clone = 'git clone https://github.com/mikhailkhorokhorin/scrape-verse-hack.git';
  assert.ok(readme.includes(clone), 'the README no longer carries this clone line');
  assert.ok(manual.includes(clone), 'the manual has drifted from the README clone line');
});

test('the manual installs the MCP server with the line the README and SUBMISSION both use', () => {
  const add = 'claude mcp add thwip -- node mcp/server.js';
  assert.ok(readme.includes(add), 'the README no longer carries this install line');
  assert.ok(submission.includes(add), 'SUBMISSION no longer carries this install line');
  assert.ok(manual.includes(add), 'the manual has drifted from the install line');
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

test('the test count on the page is the count the committed meta.json records', () => {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'meta.json'), 'utf8'));
  const claimed = meta.tests.toLocaleString('en-US');
  assert.match(manual, new RegExp(claimed + ' tests'), 'the manual drifted from meta.json');
  assert.ok(readme.includes(claimed + ' tests'), 'the README drifted from meta.json');
  assert.ok(submission.includes(claimed + ' tests'), 'SUBMISSION drifted from meta.json');
});

test('all eight MCP tools are listed, each exactly once', () => {
  const tools = [
    'fleet_status', 'spider_history', 'incident_log', 'heal_receipt',
    'evidence_report', 'numbers_audit', 'scan_fleet', 'heal_spider',
  ];
  tools.forEach((name) => {
    const hits = manual.match(new RegExp('class="tool__name mono">' + name + '<', 'g')) || [];
    assert.equal(hits.length, 1, name + ' is not listed exactly once');
  });
});

test('six tools are marked free and only scan_fleet and heal_spider spend credit', () => {
  const free = manual.match(/tool tool--free/g) || [];
  const paid = manual.match(/tool tool--paid/g) || [];
  assert.equal(free.length, 6);
  assert.equal(paid.length, 2);
  const paidBlock = manual.slice(manual.indexOf('tool tool--paid'), manual.indexOf('</ul>'));
  assert.match(paidBlock, /scan_fleet/);
  assert.match(paidBlock, /heal_spider/);
  assert.equal((paidBlock.match(/SPENDS CREDIT/g) || []).length, 2);
});

test('the judge path keeps all six steps from SUBMISSION, in one ordered list', () => {
  const steps = manual.match(/class="step"/g) || [];
  assert.equal(steps.length, 6);
  assert.match(manual, /<ol class="steps">/);
});

test('the chaos lab link points at the mock route and names the three clicks', () => {
  assert.match(manual, /class="chaos" href="index\.html\?mock=1"/);
  ['BREAK BODEGA', 'DRAG ACROSS IT', 'RE-WEAVE'].forEach((click) => {
    assert.ok(manual.includes(click), click + ' is missing from the manual');
  });
  assert.equal((manual.match(/class="click"/g) || []).length, 3);
});

test('the manual says the mock fleet is synthetic, as the chaos lab itself does', () => {
  assert.match(manual, /fleet in this mode is synthetic/);
  assert.match(manual, /the same code the live console uses/);
});

test('the manual leads back to the console from the nav and from the foot', () => {
  const nav = manual.slice(manual.indexOf('<nav'), manual.indexOf('</nav>'));
  assert.match(nav, /href="index\.html"/);
  const foot = manual.slice(manual.indexOf('<footer'));
  assert.match(foot, /href="index\.html"/);
});

test('the console nav gains one page link, and it points at the manual', () => {
  assert.match(pagenavJs, /const PAGENAV_PAGES = /);
  assert.match(pagenavJs, /href: "manual\.html", label: "MANUAL"/);
  const pages = pagenavJs.match(/\{ href: /g) || [];
  assert.equal(pages.length, 1, 'the nav should gain exactly one cross-page link');
});

test('the page link is rendered by the same nav markup the sections use', () => {
  assert.match(pagenavJs, /class="pagenav__link pagenav__link--page"/);
  assert.match(pagenavCss, /\.pagenav__link--page/);
});

test('the cross-page link carries no data-nav, so scroll-spy never marks it current', () => {
  const markup = pagenavJs.slice(
    pagenavJs.indexOf('const pages = '),
    pagenavJs.indexOf('return \'<span class="pagenav__mark"')
  );
  assert.doesNotMatch(markup, /data-nav/);
});

test('the manual nav marks the manual as the current page for a screen reader', () => {
  assert.match(manual, /class="pagenav__link is-here" href="manual\.html" aria-current="page"/);
});

test('nothing on the manual animates through a reduced-motion preference', () => {
  const transitions = manualCss.match(/transition:[^;]+/g) || [];
  assert.ok(transitions.length > 0, 'expected at least one transition to guard');
  const reduced = manualCss.slice(manualCss.indexOf('@media(prefers-reduced-motion:reduce)'));
  assert.match(reduced, /transition:none/);
  assert.match(reduced, /transform:none/);
  assert.equal((manualCss.match(/@keyframes/g) || []).length, 0);
});

test('the manual carries a print block, because a judge may print it', () => {
  assert.match(manualCss, /@media print/);
  const print = manualCss.slice(manualCss.indexOf('@media print'));
  assert.match(print, /\.pagenav\{display:none !important;\}/);
  assert.match(print, /white-space:pre-wrap/);
  assert.match(print, /page-break-inside:avoid/);
});

test('no shadow on the manual is blurred, the way the rest of the issue is drawn', () => {
  const shadows = manualCss.match(/box-shadow:(?!none)[^;]+/g) || [];
  assert.ok(shadows.length > 0);
  shadows.forEach((decl) => {
    const parts = decl.replace('box-shadow:', '').trim().split(/\s+/);
    assert.equal(parts[2], '0', 'blur radius must be 0 in ' + decl);
  });
});

test('the manual keeps every corner square, as the design spec requires', () => {
  const radii = manualCss.match(/border-radius:([^;]+)/g) || [];
  radii.forEach((decl) => {
    assert.equal(decl, 'border-radius:0', decl + ' is not a comic corner');
  });
});

test('neither new file carries a comment of any kind', () => {
  assert.doesNotMatch(manual, /<!--/);
  assert.doesNotMatch(manualCss, /\/\*/);
  assert.doesNotMatch(manualCss, /\/\//);
});

test('every file this task touched stays under the 250-line cap', () => {
  [
    ['manual.html', manual],
    ['manual.css', manualCss],
    ['pagenav.js', pagenavJs],
    ['pagenav.css', pagenavCss],
  ].forEach(([name, text]) => {
    assert.ok(text.split('\n').length <= 250, name + ' is over the cap');
  });
});

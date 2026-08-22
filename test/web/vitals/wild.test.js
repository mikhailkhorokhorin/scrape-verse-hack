'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, setGlobal, plain, modulePath, cssPath } = require('../../web-loader.js');

function load(spiders, incidents) {
  const context = loadWebModule(['config.js', 'format.js', 'wild.js']);
  setGlobal(context, 'SPIDERS', spiders || []);
  setGlobal(context, 'INCIDENTS', incidents || []);
  setGlobal(context, 'RAW_HISTORY', []);
  return context;
}

const FLEET = [
  { code: 'BODEGA', universe: 'mikhailkhorokhorin.github.io' },
  { code: 'ATLAS', universe: 'books.toscrape.com' },
  { code: 'KESTREL', universe: 'news.ycombinator.com' },
];

test('a collector on our own page is not wild', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.collectorIsOurs('mikhailkhorokhorin.github.io'), true);
});

test('the GitLab mirror counts as ours too', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.collectorIsOurs('hackathons6943133.gitlab.io'), true);
});

test('a third-party site is not ours', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.collectorIsOurs('books.toscrape.com'), false);
  assert.equal(ctx.collectorIsOurs('news.ycombinator.com'), false);
});

test('an incident on a third-party site is wild', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.isWildIncident({ who: 'KESTREL' }), true);
});

test('an incident on our demo target is not wild', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.isWildIncident({ who: 'BODEGA' }), false);
});

test('a missing incident is never wild', () => {
  const ctx = load(FLEET);
  assert.equal(ctx.isWildIncident(null), false);
});

test('an unknown collector falls back to reading history', () => {
  const ctx = load([]);
  setGlobal(ctx, 'RAW_HISTORY', [{ spider: 'GHOST', universe: 'example.org' }]);
  assert.equal(ctx.isWildIncident({ who: 'GHOST' }), true);
});

test('the note counts only wild incidents and names their sites', () => {
  const incidents = [{ who: 'ATLAS' }, { who: 'KESTREL' }, { who: 'BODEGA' }];
  const html = load(FLEET, incidents).wildCountHTML();
  assert.ok(html.includes('>2<'));
  assert.ok(html.includes('books.toscrape.com'));
  assert.ok(html.includes('news.ycombinator.com'));
  assert.ok(!html.includes('mikhailkhorokhorin'));
});

test('one wild incident still takes the partitive plural on the noun', () => {
  const html = load(FLEET, [{ who: 'ATLAS' }, { who: 'BODEGA' }]).wildCountHTML();
  assert.match(html, /1<\/b> of these breaks happened/);
  assert.ok(!html.includes('of these break '));
});

test('the note disappears when every incident was on our own page', () => {
  assert.equal(load(FLEET, [{ who: 'BODEGA' }]).wildCountHTML(), '');
});

test('the note disappears when there are no incidents at all', () => {
  assert.equal(load(FLEET, []).wildCountHTML(), '');
});

test('a site is named once even when it broke repeatedly', () => {
  const html = load(FLEET, [{ who: 'ATLAS' }, { who: 'ATLAS' }]).wildCountHTML();
  assert.equal(plain(html.match(/books\.toscrape\.com/g)).length, 1);
});

test('one wild break reads in the singular all the way through the sentence', () => {
  const ctx = load(FLEET, [{ who: 'KESTREL' }]);
  const html = ctx.wildCountHTML();
  assert.match(html, /1<\/b> of these breaks happened on a site we do not control/);
  assert.match(html, /Nobody staged it, and the re-weave closed it the same way\./);
  assert.doesNotMatch(html, /of these break /);
  assert.doesNotMatch(html, /staged them/);
});

test('several wild breaks keep the plural pronouns', () => {
  const ctx = load(FLEET, [{ who: 'KESTREL' }, { who: 'ATLAS' }]);
  const html = ctx.wildCountHTML();
  assert.match(html, /2<\/b> of these breaks happened on a site we do not control/);
  assert.match(html, /Nobody staged them, and the re-weave closed them the same way\./);
  assert.doesNotMatch(html, /staged it,/);
});

test('the wild note names each site once and says nothing when nothing is wild', () => {
  const ctx = load(FLEET, [{ who: 'KESTREL' }, { who: 'KESTREL' }]);
  const html = ctx.wildCountHTML();
  assert.equal(html.match(/news\.ycombinator\.com/g).length, 1);
  assert.equal(load(FLEET, [{ who: 'BODEGA' }]).wildCountHTML(), '');
});

test('a break on somebody else s site is badged IN THE WILD', () => {
  const context = load(FLEET, []);
  const html = context.wildBadgeHTML({ who: 'KESTREL' });
  assert.match(html, /IN THE WILD/);
  assert.match(html, /class="wild"/);
});

test('a break on a page we control carries no badge at all', () => {
  const context = load(FLEET, []);
  assert.equal(context.wildBadgeHTML({ who: 'BODEGA' }), '');
});

test('the incident cover asks for the badge, so the claim on the page is rendered not written', () => {
  const fs = require('node:fs');
  const issue = fs.readFileSync(modulePath('issue.js'), 'utf8');
  assert.match(issue, /wildBadgeHTML\(inc\)/);
});

test('the press effect reaches the incident headline the page actually renders', () => {
  const fs = require('node:fs');
  const press = fs.readFileSync(
    cssPath('press.css'), 'utf8');
  assert.match(press, /\.incident \.issue__who/);
  assert.doesNotMatch(press, /\.incident \.issue__name/);
});

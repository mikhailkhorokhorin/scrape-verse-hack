'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, setGlobal, plain } = require('./web-loader.js');

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

test('the badge renders only for a wild incident', () => {
  const ctx = load(FLEET);
  assert.ok(ctx.wildBadgeHTML({ who: 'ATLAS' }).includes('IN THE WILD'));
  assert.equal(ctx.wildBadgeHTML({ who: 'BODEGA' }), '');
});

test('the note counts only wild incidents and names their sites', () => {
  const incidents = [{ who: 'ATLAS' }, { who: 'KESTREL' }, { who: 'BODEGA' }];
  const html = load(FLEET, incidents).wildCountHTML();
  assert.ok(html.includes('>2<'));
  assert.ok(html.includes('books.toscrape.com'));
  assert.ok(html.includes('news.ycombinator.com'));
  assert.ok(!html.includes('mikhailkhorokhorin'));
});

test('the note says break in the singular for one wild incident', () => {
  const html = load(FLEET, [{ who: 'ATLAS' }, { who: 'BODEGA' }]).wildCountHTML();
  assert.ok(html.includes('break '));
  assert.ok(!html.includes('breaks'));
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

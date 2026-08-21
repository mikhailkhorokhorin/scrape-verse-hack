'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('./web-loader.js');

const web = loadWebModule(['config.js', 'format.js', 'caption.js']);
const { captionCount, captionFor, captionHTML } = web;

test('captionCount reads a plain integer out of a badge string', () => {
  assert.equal(captionCount('3 spiders'), 3);
});

test('captionCount strips thousands separators', () => {
  assert.equal(captionCount('1,234 rows delivered'), 1234);
});

test('captionCount returns null when the badge is empty', () => {
  assert.equal(captionCount(''), null);
});

test('captionCount returns null for undefined and null', () => {
  assert.equal(captionCount(undefined), null);
  assert.equal(captionCount(null), null);
});

test('captionCount returns null when there is no digit at all', () => {
  assert.equal(captionCount('nothing in the bag'), null);
});

test('captionCount reads a zero badge as zero, not as missing', () => {
  assert.equal(captionCount('0 incidents'), 0);
});

test('watch caption carries the fleet count and pluralises', () => {
  assert.deepEqual(plain(captionFor('watch', '3 spiders')), {
    title: 'THE WATCH', num: '3', lede: 'SPIDERS UNDER WATCH',
  });
});

test('watch caption uses the singular for a lone spider', () => {
  assert.equal(captionFor('watch', '1 spider').lede, 'SPIDER UNDER WATCH');
});

test('watch caption falls back to the existing empty-state voice at zero', () => {
  const cap = captionFor('watch', '');
  assert.equal(cap.lede, 'NOBODY IS WATCHING YET');
  assert.equal(cap.num, undefined);
});

test('haul caption leads with the row count in the comic caption voice', () => {
  assert.deepEqual(plain(captionFor('haul', '698')), {
    title: 'MEANWHILE', num: '698', lede: 'ROWS SHIPPED CLEAN',
  });
});

test('haul caption groups thousands in the number it shows', () => {
  assert.equal(captionFor('haul', '12345').num, '12,345');
});

test('haul caption uses the existing nothing-in-the-bag voice at zero', () => {
  const cap = captionFor('haul', '0');
  assert.equal(cap.lede, 'NOTHING IN THE BAG YET');
  assert.equal(cap.num, undefined);
});

test('feed caption carries the incident count', () => {
  assert.deepEqual(plain(captionFor('feed', '2 incidents')), {
    title: 'INCIDENT FEED', num: '2', lede: 'BREAKS ON RECORD',
  });
});

test('feed caption uses the singular for one incident', () => {
  assert.equal(captionFor('feed', '1 incident').lede, 'BREAK ON RECORD');
});

test('feed caption falls back to the existing ALL QUIET voice at zero', () => {
  const cap = captionFor('feed', '0 incidents');
  assert.equal(cap.lede, 'ALL QUIET');
  assert.equal(cap.num, undefined);
});

test('replay caption carries the span text with the badge suffix removed', () => {
  assert.deepEqual(plain(captionFor('replay', '14m 20s replayed')), {
    title: 'INCIDENT REPLAY', num: '14m 20s', lede: 'FROM BREAK TO REPAIR',
  });
});

test('replay caption falls back when there is no incident to replay', () => {
  const cap = captionFor('replay', '');
  assert.equal(cap.lede, 'NO BREAK TO REPLAY');
  assert.equal(cap.num, undefined);
});

test('captionHTML omits the number span entirely for a zero-count caption', () => {
  const html = captionHTML(captionFor('feed', ''));
  assert.ok(!html.includes('caption__num'));
  assert.ok(html.includes('ALL QUIET'));
});

test('captionHTML puts the number before the flavour text', () => {
  const html = captionHTML(captionFor('haul', '698'));
  assert.ok(html.indexOf('caption__num') < html.indexOf('caption__lede'));
});

test('captionHTML escapes a hostile span string rather than injecting markup', () => {
  const html = captionHTML(captionFor('replay', '<img src=x onerror=1> replayed'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
});

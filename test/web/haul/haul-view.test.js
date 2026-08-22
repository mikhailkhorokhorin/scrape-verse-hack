'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

const context = loadWebModule(
  ['config.js', 'format.js', 'value.js', 'received.js', 'haul-view.js'],
  { URL, document: { querySelectorAll: () => [], querySelector: () => null } }
);
const { haulHostOf, haulValueHTML, HAUL_VALUE_MAX } = context;

test('a URL gives up its host, and anything else gives up nothing', () => {
  assert.equal(haulHostOf('https://books.toscrape.com/media/x.jpg'), 'books.toscrape.com');
  assert.equal(haulHostOf('not a url'), null);
  assert.equal(haulHostOf(null), null);
  assert.equal(haulHostOf(''), null);
});

test('a missing field and a null field are named differently', () => {
  assert.match(haulValueHTML({ empty: true, raw: undefined }), />missing</);
  assert.match(haulValueHTML({ empty: true, raw: null }), />null</);
});

test('an empty value carries the void class, so the eye finds the hole', () => {
  assert.match(haulValueHTML({ empty: true, raw: null }), /haul__val--void/);
});

test('a media value shows its host beside the path, not one long unreadable URL', () => {
  const html = haulValueHTML({
    empty: false, state: 'live', media: true,
    raw: 'https://books.toscrape.com/media/cache/a0/7e/cover.jpg',
    text: 'https://books.toscrape.com/media/cache/a0/7e/cover.jpg',
  });
  assert.match(html, /haul__host">books\.toscrape\.com</);
  assert.match(html, /haul__val--media/);
  assert.doesNotMatch(html, /haul__host">books\.toscrape\.com<\/span>https/);
});

test('a long plain value is truncated rather than allowed to run off the card', () => {
  const long = 'x'.repeat(HAUL_VALUE_MAX + 60);
  const html = haulValueHTML({ empty: false, state: 'live', media: false, raw: long, text: long });
  assert.ok(html.length < long.length + 60, 'the rendered value is shorter than the raw one');
  assert.match(html, /…/);
});

test('the field state travels onto the value, so infected data reads as infected', () => {
  const cell = { empty: false, state: 'infected', media: false, raw: 'undefined', text: 'undefined' };
  assert.match(haulValueHTML(cell), /haul__val--infected/);
});

test('a value carrying markup is escaped, not rendered', () => {
  const bad = '<script>alert(1)</script>';
  const html = haulValueHTML({ empty: false, state: 'live', media: false, raw: bad, text: bad });
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /&lt;script/);
});

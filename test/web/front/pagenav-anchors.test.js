'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('../../web-loader.js');

const context = loadWebModule(['config.js', 'issue.js', 'pagenav.js'], {
  document: { querySelectorAll: () => [], querySelector: () => null, createElement: () => ({}) },
  window: { matchMedia: () => ({ matches: false }) },
  decodeURIComponent,
});
const { PAGENAV_SECTIONS, pagenavMarkup, parseIssueHash } = context;

test('every nav anchor falls through the issue router untouched', () => {
  PAGENAV_SECTIONS.forEach((section) => {
    assert.equal(
      parseIssueHash('#' + section.target),
      null,
      section.target + ' must not be read as an incident id'
    );
  });
});

test('the four sections of the page each get one link', () => {
  assert.equal(PAGENAV_SECTIONS.length, 4);
  const markup = pagenavMarkup();
  PAGENAV_SECTIONS.forEach((section) => {
    assert.ok(markup.includes('href="#' + section.target + '"'), section.label + ' is linked');
    assert.ok(markup.includes('>' + section.label + '<'), section.label + ' is labelled');
  });
});

test('no two sections point at the same anchor or watch the same element', () => {
  const targets = new Set(PAGENAV_SECTIONS.map((s) => s.target));
  const watched = new Set(PAGENAV_SECTIONS.map((s) => s.watch));
  assert.equal(targets.size, 4);
  assert.equal(watched.size, 4);
});

test('the wordmark in the nav is hidden from screen readers, which already have the h1', () => {
  assert.match(pagenavMarkup(), /pagenav__mark" aria-hidden="true"/);
});

test('a real incident hash is still recognised, so the two schemes stay distinct', () => {
  assert.equal(parseIssueHash('#inc_003'), 'inc_003');
  assert.equal(parseIssueHash('#nav-feed'), null);
});

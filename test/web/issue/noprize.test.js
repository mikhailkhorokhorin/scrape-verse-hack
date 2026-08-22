'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture } = require('../../web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'noprize.js']);
const {
  noPrizeRecord, noPrizeDay, noPrizeHeldFor, noPrizeHTML, noPrizeLetterHTML, NOPRIZE_ID,
} = context;

const ROWS = readFixture('incidents.json');
const INC = ROWS.find((row) => row.id === 'inc_003');

test('the award is drawn from inc_003 and from nothing else', () => {
  assert.equal(NOPRIZE_ID, 'inc_003');
  assert.equal(noPrizeRecord(ROWS).id, 'inc_003');
});

test('an incident list without inc_003 yields no award rather than a blank envelope', () => {
  assert.equal(noPrizeRecord([]), null);
  assert.equal(noPrizeRecord(null), null);
  assert.equal(noPrizeRecord([{ id: 'inc_001', summary: 'other' }]), null);
  assert.equal(noPrizeHTML(null), '');
});

test('an inc_003 with no written summary yields no award', () => {
  assert.equal(noPrizeRecord([{ id: 'inc_003' }]), null);
  assert.equal(noPrizeRecord([{ id: 'inc_003', summary: '' }]), null);
});

test('the summary is rendered verbatim from the committed record', () => {
  const html = noPrizeLetterHTML(INC);
  assert.ok(html.includes(INC.summary.replace(/'/g, '&#39;')));
});

test('the rendered summary decodes back to the committed string byte for byte', () => {
  const html = noPrizeLetterHTML(INC);
  const quote = html.match(/<blockquote class="noprize__quote"><p>([\s\S]*?)<\/p><\/blockquote>/);
  assert.ok(quote, 'the letter carries no quote');
  const decoded = quote[1]
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  assert.equal(decoded, INC.summary);
});

test('both real timestamps are printed as committed, not reformatted', () => {
  const html = noPrizeLetterHTML(INC);
  assert.ok(html.includes(INC.opened_at));
  assert.ok(html.includes(INC.closed_at));
});

test('the envelope names the award and the recipient', () => {
  const html = noPrizeHTML(INC);
  assert.match(html, /AWARDED TO: THE WATCH/);
  assert.match(html, /FOR CATCHING ITS OWN MISTAKE/);
});

test('the disclosure is a real button wired to the panel it controls', () => {
  const html = noPrizeHTML(INC);
  assert.match(html, /<button class="noprize__seal" type="button"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="noprize-panel"/);
  assert.match(html, /id="noprize-panel" hidden/);
});

test('values taken from the record are escaped rather than injected', () => {
  const nasty = Object.assign({}, INC, {
    spider: '<img src=x onerror=alert(1)>',
    summary: 'a "quoted" <b>tag</b> & an ampersand',
  });
  const html = noPrizeHTML(nasty);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>tag<\/b>/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /&amp; an ampersand/);
});

test('the date stamp reads as a printed day in UTC', () => {
  assert.equal(noPrizeDay('2026-08-21T07:48:20.779Z'), '21 AUG');
  assert.equal(noPrizeDay('2026-01-05T00:00:00.000Z'), '05 JAN');
  assert.equal(noPrizeDay('not a date'), '');
});

test('the span the false alarm was believed for is computed, not asserted', () => {
  assert.equal(noPrizeHeldFor('2026-08-21T07:48:20.779Z', '2026-08-21T09:13:59.565Z'), '1h 26m');
  assert.equal(noPrizeHeldFor('2026-08-21T07:00:00.000Z', '2026-08-21T07:42:00.000Z'), '42m');
  assert.equal(noPrizeHeldFor('2026-08-21T07:00:00.000Z', '2026-08-21T09:00:00.000Z'), '2h 0m');
});

test('an unusable or reversed pair of timestamps yields no span rather than a wrong one', () => {
  assert.equal(noPrizeHeldFor(null, null), '');
  assert.equal(noPrizeHeldFor('nope', '2026-08-21T09:13:59.565Z'), '');
  assert.equal(noPrizeHeldFor('2026-08-21T09:13:59.565Z', '2026-08-21T07:48:20.779Z'), '');
});

test('the real record produces the real span', () => {
  assert.match(noPrizeHTML(INC), /FALSE ALARM HELD FOR 1h 26m/);
  assert.match(noPrizeHTML(INC), /21 AUG/);
});

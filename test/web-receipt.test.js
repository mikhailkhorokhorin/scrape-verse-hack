'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule } = require('./web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'value.js', 'receipt.js']);
const { receiptHTML, receiptRowHTML, VERDICT_WORD } = context;

const INC = {
  verification: {
    ran: true,
    checked: 2,
    passed: 2,
    verdict: 'EVERY_FIELD_BACK',
    checks: [
      { field: 'title', from: 'dead', to: 'live', received_before: null, received_after: 'Codex on AWS', passed: true },
      { field: 'points', from: 'dead', to: 'live', received_before: null, received_after: '62', passed: true },
    ],
  },
};

test('an incident with no verification renders nothing rather than an empty table', () => {
  assert.equal(receiptHTML(null), '');
  assert.equal(receiptHTML({}), '');
  assert.equal(receiptHTML({ verification: { checks: [] } }), '');
});

test('the receipt names how many fields were re-checked, and against what', () => {
  const html = receiptHTML(INC);
  assert.match(html, /<b>2 of 2<\/b> broken fields re-checked/);
  assert.match(html, /against the run after the heal/);
});

test('one broken field is described in the singular', () => {
  const one = { verification: Object.assign({}, INC.verification, { checked: 1, passed: 1, checks: [INC.verification.checks[0]] }) };
  assert.match(receiptHTML(one), /1 of 1<\/b> broken field re-checked/);
  assert.doesNotMatch(receiptHTML(one), /broken fields re-checked/);
});

test('every verdict the verifier can write has a sentence to render', () => {
  ['EVERY_FIELD_BACK', 'PARTIAL', 'NOTHING_CAME_BACK', 'NOTHING_TO_CHECK', 'NOT_RUN'].forEach((v) => {
    assert.ok(VERDICT_WORD[v], v + ' has no wording');
  });
});

test('a failed check is marked as failed, not quietly rendered as a pass', () => {
  const row = receiptRowHTML({ field: 'price', received_before: null, received_after: null, passed: false });
  assert.match(row, /receipt__row--fail/);
  assert.match(row, /✗/);
});

test('the table shows the value before beside the value after', () => {
  const html = receiptHTML(INC);
  assert.match(html, /Received before/);
  assert.match(html, /Received after/);
  assert.match(html, /Codex on AWS/);
});

test('the table sits in its own scroll region so a narrow screen scrolls it, not the page', () => {
  const html = receiptHTML(INC);
  assert.match(html, /<div class="receipt__scroll" tabindex="0" role="region"/);
  assert.match(html, /aria-label="Verification receipt, scrolls sideways"/);
  assert.ok(html.indexOf('receipt__scroll') < html.indexOf('receipt__table'));
});

test('a field name carrying markup is escaped, not rendered', () => {
  const row = receiptRowHTML({ field: '<img src=x onerror=alert(1)>', received_before: null, received_after: null, passed: false });
  assert.doesNotMatch(row, /<img/);
  assert.match(row, /&lt;img/);
});

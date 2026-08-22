'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { verificationRows, shortValue } = require('../../mcp/read-tools.js');

const INCIDENT = {
  id: 'inc_009',
  verification: {
    ran: true,
    checked: 2,
    passed: 1,
    verdict: 'PARTIAL',
    checks: [
      { field: 'price', from: 'dead', to: 'live', received_before: null, received_after: 12.5, passed: true },
      { field: 'rating', from: 'infected', to: 'infected', received_before: 'undefined', received_after: 'undefined', passed: false },
    ],
  },
};

test('an incident with no verification prints no verification block', () => {
  assert.deepEqual(verificationRows({ id: 'inc_001' }), []);
});

test('an incident whose verification has no checks prints nothing', () => {
  assert.deepEqual(verificationRows({ verification: { checks: [] } }), []);
});

test('the header states how many fields passed out of how many', () => {
  const rows = verificationRows(INCIDENT);
  assert.ok(rows[1].includes('1/2 fields re-checked'));
});

test('the verdict is printed in words a reader can parse', () => {
  assert.ok(verificationRows(INCIDENT)[1].includes('partial'));
});

test('a passing field is marked ok and a failing one is marked FAIL', () => {
  const rows = verificationRows(INCIDENT);
  assert.ok(rows[2].startsWith('  ok  '));
  assert.ok(rows[3].startsWith('  FAIL'));
});

test('each row carries the state move and both received values', () => {
  const row = verificationRows(INCIDENT)[2];
  assert.ok(row.includes('dead -> live'));
  assert.ok(row.includes('was null'));
  assert.ok(row.includes('now 12.5'));
});

test('a field never re-checked says so rather than claiming a state', () => {
  const rows = verificationRows({
    verification: { passed: 0, checked: 1, verdict: 'NOT_RUN', checks: [
      { field: 'price', from: 'dead', to: null, received_before: null, received_after: null, passed: false },
    ] },
  });
  assert.ok(rows[2].includes('not checked'));
});

test('shortValue prints null for a missing value, not undefined', () => {
  assert.equal(shortValue(null), 'null');
  assert.equal(shortValue(undefined), 'null');
});

test('shortValue quotes a string so an empty one is visible', () => {
  assert.equal(shortValue(''), '""');
});

test('shortValue truncates a long value so one row cannot flood the receipt', () => {
  const long = shortValue('x'.repeat(200));
  assert.equal(long.length, 48);
  assert.ok(long.endsWith('...'));
});

test('shortValue keeps a short value intact', () => {
  assert.equal(shortValue(62), '62');
});

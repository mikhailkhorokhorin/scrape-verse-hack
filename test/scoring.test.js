'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  integrityOf, statusOf, dominantState, isFlatlined,
  fieldStates, partitionByState, runRecord, HEALTHY_MIN, DEGRADED_MIN
} = require('../scripts/lib.js');

const STRING = { type: 'string' };
const NUMBER = { type: 'number', min: 0 };
const ENUM = { type: 'string', pattern: '^(In stock|Out of stock)$', enumerated: true };

const repeat = (n, row) => Array.from({ length: n }, () => ({ ...row }));

test('integrityOf returns 0 for an empty state map', () => {
  assert.equal(integrityOf({}), 0);
});

test('integrityOf returns 100 when every field is live', () => {
  assert.equal(integrityOf({ a: 'live', b: 'live', c: 'live' }), 100);
});

test('integrityOf returns 0 when every field is dead', () => {
  assert.equal(integrityOf({ a: 'dead', b: 'dead' }), 0);
});

test('integrityOf gives an infected field half the credit of a live one', () => {
  assert.equal(integrityOf({ a: 'infected', b: 'infected' }), 50);
});

test('integrityOf counts one live and one infected field as 75 percent', () => {
  assert.equal(integrityOf({ a: 'live', b: 'infected' }), 75);
});

test('integrityOf counts three live of four fields as 75 percent', () => {
  assert.equal(integrityOf({ a: 'live', b: 'live', c: 'live', d: 'dead' }), 75);
});

test('integrityOf rounds a repeating fraction to the nearest whole percent', () => {
  assert.equal(integrityOf({ a: 'live', b: 'live', c: 'dead' }), 67);
});

test('statusOf reports HEALTHY at exactly the healthy threshold', () => {
  assert.equal(statusOf(HEALTHY_MIN), 'HEALTHY');
});

test('statusOf reports DEGRADED one point below the healthy threshold', () => {
  assert.equal(statusOf(HEALTHY_MIN - 1), 'DEGRADED');
});

test('statusOf reports DEGRADED at exactly the degraded threshold', () => {
  assert.equal(statusOf(DEGRADED_MIN), 'DEGRADED');
});

test('statusOf reports CRITICAL one point below the degraded threshold', () => {
  assert.equal(statusOf(DEGRADED_MIN - 1), 'CRITICAL');
});

test('statusOf reports HEALTHY at full integrity', () => {
  assert.equal(statusOf(100), 'HEALTHY');
});

test('statusOf reports CRITICAL at zero integrity', () => {
  assert.equal(statusOf(0), 'CRITICAL');
});

test('dominantState returns dead for an empty row set rather than live', () => {
  assert.equal(dominantState([], 'title', STRING), 'dead');
});

test('dominantState returns live when most rows carry a usable value', () => {
  const rows = [{ t: 'a' }, { t: 'b' }, { t: null }];
  assert.equal(dominantState(rows, 't', STRING), 'live');
});

test('dominantState returns dead when most rows are missing the field', () => {
  const rows = [{ t: 'a' }, { t: null }, { t: null }];
  assert.equal(dominantState(rows, 't', STRING), 'dead');
});

test('dominantState returns infected when most rows hold an invalid value', () => {
  const rows = [{ n: 'x' }, { n: 'y' }, { n: '5' }];
  assert.equal(dominantState(rows, 'n', NUMBER), 'infected');
});

test('dominantState breaks a live-versus-dead tie in favour of live', () => {
  assert.equal(dominantState([{ t: 'a' }, { t: null }], 't', STRING), 'live');
});

test('dominantState treats a row set with an absent field as dead', () => {
  assert.equal(dominantState([{ other: 1 }, { other: 2 }], 't', STRING), 'dead');
});

test('dominantState flags thirty identical zeroes as an infected flatline', () => {
  assert.equal(dominantState(repeat(30, { points: 0 }), 'points', NUMBER), 'infected');
});

test('dominantState leaves a legitimately repeated enumerated value live', () => {
  const rows = repeat(20, { availability: 'In stock' });
  assert.equal(dominantState(rows, 'availability', ENUM), 'live');
});

test('dominantState does not flatline a repeated value that is not an empty marker', () => {
  assert.equal(dominantState(repeat(20, { n: 7 }), 'n', NUMBER), 'live');
});

test('isFlatlined ignores a row set shorter than the minimum sample', () => {
  assert.equal(isFlatlined(repeat(4, { points: 0 }), 'points'), false);
});

test('isFlatlined detects a long run of identical zeroes', () => {
  assert.equal(isFlatlined(repeat(12, { points: 0 }), 'points'), true);
});

test('isFlatlined detects a long run of identical empty strings', () => {
  assert.equal(isFlatlined(repeat(12, { t: '' }), 't'), true);
});

test('isFlatlined detects a long run of identical dash placeholders', () => {
  assert.equal(isFlatlined(repeat(12, { t: '-' }), 't'), true);
});

test('isFlatlined ignores a run broken by one differing row', () => {
  const rows = repeat(12, { points: 0 });
  rows[5].points = 3;
  assert.equal(isFlatlined(rows, 'points'), false);
});

test('isFlatlined ignores a field missing from the first row', () => {
  assert.equal(isFlatlined(repeat(12, { other: 0 }), 'points'), false);
});

test('fieldStates reports one state per configured field', () => {
  const states = fieldStates([{ a: 'x', b: null }], { a: STRING, b: STRING });
  assert.deepEqual(states, { a: 'live', b: 'dead' });
});

test('partitionByState splits field names into live, infected and dead lists', () => {
  const parts = partitionByState({ a: 'live', b: 'infected', c: 'dead' });
  assert.deepEqual(parts, { fields_live: ['a'], fields_infected: ['b'], fields_dead: ['c'] });
});

test('runRecord reports the row count it was given', () => {
  const collector = { codename: 'X', universe: 'u', fields: { a: STRING } };
  assert.equal(runRecord(collector, [{ a: 'v' }, { a: 'w' }]).rows, 2);
});

test('runRecord derives status from the integrity it computed', () => {
  const collector = { codename: 'X', universe: 'u', fields: { a: STRING, b: STRING } };
  const record = runRecord(collector, [{ a: 'v', b: null }]);
  assert.equal(record.status, statusOf(record.integrity));
});

test('runRecord samples the first row for every expected field', () => {
  const collector = { codename: 'X', universe: 'u', fields: { a: STRING, b: STRING } };
  assert.deepEqual(runRecord(collector, [{ a: 'v' }]).sample, { a: 'v', b: null });
});

test('runRecord lists every configured field as expected', () => {
  const collector = { codename: 'X', universe: 'u', fields: { a: STRING, b: STRING } };
  assert.deepEqual(runRecord(collector, [{ a: 'v' }]).fields_expected, ['a', 'b']);
});

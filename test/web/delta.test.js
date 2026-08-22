'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('../web-loader.js');

const context = loadWebModule(['delta.js']);
const { snapshotOf, fieldChangesBetween, deltaBetween } = context;

function spider(overrides) {
  return Object.assign({
    code: 'BODEGA',
    ts: '2026-08-21T12:00:00Z',
    integrity: 100,
    fieldOrder: ['title', 'price'],
    fields: { title: 'live', price: 'live' },
  }, overrides || {});
}

test('snapshotOf keys spiders by code', () => {
  const snap = snapshotOf([spider(), spider({ code: 'ATLAS' })]);
  assert.deepEqual(plain(Object.keys(snap).sort()), ['ATLAS', 'BODEGA']);
});

test('snapshotOf records every expected field, defaulting a missing one to dead', () => {
  const snap = snapshotOf([spider({ fields: { title: 'live' } })]);
  assert.deepEqual(plain(snap.BODEGA.fields), { title: 'live', price: 'dead' });
});

test('snapshotOf skips entries with no code', () => {
  assert.deepEqual(plain(snapshotOf([{ ts: 'x' }, null])), {});
});

test('snapshotOf reads afterHeal as a strict boolean', () => {
  assert.equal(snapshotOf([spider()]).BODEGA.afterHeal, false);
  assert.equal(snapshotOf([spider({ afterHeal: true })]).BODEGA.afterHeal, true);
});

test('fieldChangesBetween reports only fields whose state moved', () => {
  const changes = fieldChangesBetween(
    { title: 'live', price: 'live' },
    { title: 'live', price: 'dead' }
  );
  assert.deepEqual(plain(changes), [{ name: 'price', from: 'live', to: 'dead' }]);
});

test('fieldChangesBetween ignores a field that did not exist before', () => {
  const changes = fieldChangesBetween({ title: 'live' }, { title: 'live', rating: 'dead' });
  assert.deepEqual(plain(changes), []);
});

test('deltaBetween reports nothing on the first render', () => {
  const delta = deltaBetween(null, [spider()]);
  assert.deepEqual(plain(delta.changes), []);
  assert.equal(delta.snapshot.BODEGA.integrity, 100);
});

test('deltaBetween reports nothing when the timestamp and fields are unchanged', () => {
  const first = deltaBetween(null, [spider()]);
  assert.deepEqual(plain(deltaBetween(first.snapshot, [spider()]).changes), []);
});

test('deltaBetween flags a new run when the timestamp moves', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider({ ts: '2026-08-21T12:30:00Z' })]);
  assert.equal(next.changes.length, 1);
  assert.equal(next.changes[0].newRun, true);
  assert.deepEqual(plain(next.changes[0].fields), []);
});

test('deltaBetween carries the integrity move across a new run', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider({ ts: '2026-08-21T12:30:00Z', integrity: 50 })]);
  assert.equal(next.changes[0].integrityFrom, 100);
  assert.equal(next.changes[0].integrityTo, 50);
});

test('deltaBetween names each field that changed state', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider({
    ts: '2026-08-21T12:30:00Z',
    fields: { title: 'live', price: 'dead' },
  })]);
  assert.deepEqual(plain(next.changes[0].fields), [{ name: 'price', from: 'live', to: 'dead' }]);
});

test('deltaBetween marks afterHeal only when a new run carries it', () => {
  const first = deltaBetween(null, [spider()]);
  const stale = deltaBetween(first.snapshot, [spider({ afterHeal: true })]);
  assert.deepEqual(plain(stale.changes), []);
  const landed = deltaBetween(first.snapshot, [spider({ ts: '2026-08-21T12:30:00Z', afterHeal: true })]);
  assert.equal(landed.changes[0].afterHeal, true);
});

test('deltaBetween ignores a collector that was not present before', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider(), spider({ code: 'KESTREL' })]);
  assert.deepEqual(plain(next.changes), []);
  assert.ok(next.snapshot.KESTREL);
});

test('deltaBetween reports each changed collector separately', () => {
  const first = deltaBetween(null, [spider(), spider({ code: 'ATLAS' })]);
  const next = deltaBetween(first.snapshot, [
    spider({ ts: '2026-08-21T12:30:00Z' }),
    spider({ code: 'ATLAS', ts: '2026-08-21T12:30:00Z' }),
  ]);
  assert.deepEqual(plain(next.changes.map((c) => c.code).sort()), ['ATLAS', 'BODEGA']);
});

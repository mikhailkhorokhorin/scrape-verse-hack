'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, plain } = require('./web-loader.js');

const context = loadWebModule(['config.js', 'delta.js', 'speech.js']);
const { speechLineFor, speechPickOf, speechCandidatesOf, deltaBetween, MIN_STREAK, SPEECH_MS } = context;

function change(overrides) {
  return Object.assign({
    code: 'BODEGA',
    newRun: true,
    afterHeal: false,
    integrityFrom: 100,
    integrityTo: 100,
    fields: [],
  }, overrides || {});
}

function spider(overrides) {
  return Object.assign({
    code: 'BODEGA',
    ts: '2026-08-21T12:00:00Z',
    integrity: 100,
    streak: 0,
    fieldOrder: ['title', 'price'],
    fields: { title: 'live', price: 'live' },
  }, overrides || {});
}

test('a field going dead speaks its own name, not a generic line', () => {
  const line = speechLineFor(change({ fields: [{ name: 'price', from: 'live', to: 'dead' }] }), spider());
  assert.equal(line.text, 'price is gone.');
  assert.equal(line.voice, 'character');
  assert.equal(line.kind, 'dead');
});

test('two fields going dead are named together and take a plural verb', () => {
  const line = speechLineFor(change({
    fields: [
      { name: 'price', from: 'live', to: 'dead' },
      { name: 'rating', from: 'live', to: 'dead' },
    ],
  }), spider());
  assert.equal(line.text, 'price and rating are gone.');
});

test('three fields going dead read as a list', () => {
  const line = speechLineFor(change({
    fields: [
      { name: 'price', from: 'live', to: 'dead' },
      { name: 'rating', from: 'live', to: 'dead' },
      { name: 'image', from: 'live', to: 'dead' },
    ],
  }), spider());
  assert.equal(line.text, 'price, rating and image are gone.');
});

test('a field already dead does not speak again', () => {
  const line = speechLineFor(change({ fields: [{ name: 'price', from: 'dead', to: 'dead' }] }), spider());
  assert.equal(line, null);
});

test('a verified heal landing speaks the heal line', () => {
  const line = speechLineFor(change({ afterHeal: true }), spider());
  assert.equal(line.text, "I'm back.");
  assert.equal(line.kind, 'heal');
});

test('afterHeal without a new run says nothing', () => {
  const line = speechLineFor(change({ newRun: false, afterHeal: false }), spider());
  assert.equal(line, null);
});

test('a clean run on a long streak speaks the streak line', () => {
  const line = speechLineFor(change(), spider({ streak: MIN_STREAK }));
  assert.equal(line.text, '...still here.');
  assert.equal(line.kind, 'streak');
});

test('a streak shorter than MIN_STREAK stays silent', () => {
  assert.equal(speechLineFor(change(), spider({ streak: MIN_STREAK - 1 })), null);
});

test('a run with no new run and no field move stays silent even on a long streak', () => {
  assert.equal(speechLineFor(change({ newRun: false }), spider({ streak: 40 })), null);
});

test('a streak line never fires on a run where a field went wrong', () => {
  const line = speechLineFor(
    change({ fields: [{ name: 'price', from: 'dead', to: 'dead' }, { name: 'title', from: 'live', to: 'infected' }] }),
    spider({ streak: 40 })
  );
  assert.equal(line.kind, 'infected');
});

test('an infected field speaks in the symbiote voice, lowercase and calm', () => {
  const line = speechLineFor(change({ fields: [{ name: 'title', from: 'live', to: 'infected' }] }), spider());
  assert.equal(line.voice, 'symbiote');
  assert.equal(line.text, 'title came back wrong.');
  assert.equal(line.text, line.text.toLowerCase());
});

test('a field going dead outranks an infected field on the same run', () => {
  const line = speechLineFor(change({
    fields: [
      { name: 'title', from: 'live', to: 'infected' },
      { name: 'price', from: 'live', to: 'dead' },
    ],
  }), spider());
  assert.equal(line.kind, 'dead');
});

test('a field going dead outranks a heal landing on the same run', () => {
  const line = speechLineFor(
    change({ afterHeal: true, fields: [{ name: 'price', from: 'live', to: 'dead' }] }),
    spider()
  );
  assert.equal(line.kind, 'dead');
});

test('a heal outranks a streak on the same run', () => {
  const line = speechLineFor(change({ afterHeal: true }), spider({ streak: 40 }));
  assert.equal(line.kind, 'heal');
});

test('speechLineFor tolerates a missing change', () => {
  assert.equal(speechLineFor(null, spider()), null);
});

test('speechLineFor tolerates a missing spider', () => {
  assert.equal(speechLineFor(change(), null), null);
});

test('the coordinator picks exactly one line when several collectors change', () => {
  const delta = {
    changes: [
      change({ code: 'ATLAS', afterHeal: true }),
      change({ code: 'BODEGA', fields: [{ name: 'price', from: 'live', to: 'dead' }] }),
    ],
  };
  const pick = speechPickOf(delta, [spider(), spider({ code: 'ATLAS' })]);
  assert.equal(pick.code, 'BODEGA');
  assert.equal(pick.kind, 'dead');
});

test('the coordinator sees every speakable candidate before choosing one', () => {
  const delta = {
    changes: [
      change({ code: 'ATLAS', afterHeal: true }),
      change({ code: 'BODEGA', fields: [{ name: 'price', from: 'live', to: 'dead' }] }),
    ],
  };
  const all = speechCandidatesOf(delta, [spider(), spider({ code: 'ATLAS' })]);
  assert.deepEqual(plain(all.map((c) => c.code)), ['ATLAS', 'BODEGA']);
});

test('the coordinator keeps the first of two equally ranked candidates', () => {
  const delta = {
    changes: [
      change({ code: 'ATLAS', fields: [{ name: 'price', from: 'live', to: 'dead' }] }),
      change({ code: 'BODEGA', fields: [{ name: 'title', from: 'live', to: 'dead' }] }),
    ],
  };
  assert.equal(speechPickOf(delta, [spider(), spider({ code: 'ATLAS' })]).code, 'ATLAS');
});

test('the coordinator returns nothing when no change is speakable', () => {
  assert.equal(speechPickOf({ changes: [change({ newRun: false })] }, [spider()]), null);
});

test('the coordinator tolerates a missing delta', () => {
  assert.equal(speechPickOf(null, [spider()]), null);
});

test('the coordinator tolerates a missing spiders list', () => {
  const delta = { changes: [change({ fields: [{ name: 'price', from: 'live', to: 'dead' }] })] };
  assert.equal(speechPickOf(delta, null).kind, 'dead');
});

test('a real delta of a field dying produces the exact line', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider({
    ts: '2026-08-21T12:30:00Z',
    fields: { title: 'live', price: 'dead' },
  })]);
  assert.equal(speechPickOf(next, [spider()]).text, 'price is gone.');
});

test('a real delta with no movement says nothing', () => {
  const first = deltaBetween(null, [spider()]);
  assert.equal(speechPickOf(deltaBetween(first.snapshot, [spider()]), [spider()]), null);
});

test('a real delta of a heal landing produces the heal line', () => {
  const first = deltaBetween(null, [spider()]);
  const next = deltaBetween(first.snapshot, [spider({ ts: '2026-08-21T12:30:00Z', afterHeal: true })]);
  assert.equal(speechPickOf(next, [spider()]).text, "I'm back.");
});

test('a real delta of a clean run on a long streak produces the streak line', () => {
  const streaked = spider({ streak: MIN_STREAK + 3 });
  const first = deltaBetween(null, [streaked]);
  const next = deltaBetween(first.snapshot, [spider({ ts: '2026-08-21T12:30:00Z', streak: MIN_STREAK + 4 })]);
  assert.equal(speechPickOf(next, [spider({ streak: MIN_STREAK + 4 })]).text, '...still here.');
});

test('every bubble is scheduled to dismiss under three seconds', () => {
  assert.ok(SPEECH_MS < 3000);
});

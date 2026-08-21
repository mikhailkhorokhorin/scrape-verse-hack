'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, setGlobal, plain } = require('./web-loader.js');

const WEB_FILES = ['config.js', 'format.js', 'value.js', 'infection.js', 'adapter.js'];
const HISTORY = readFixture('history.json');

function freshWeb() {
  const web = loadWebModule(WEB_FILES);
  setGlobal(web, 'RAW_HISTORY', HISTORY);
  return web;
}

const web = freshWeb();
const { stateWord, fillRate, adaptHistory } = web;

function run(overrides) {
  return Object.assign(
    {
      collector_id: 'c_a',
      spider: 'ALPHA',
      universe: 'example.com',
      ts: '2026-08-21T05:00:00.000Z',
      fields_expected: ['title', 'price'],
      fields_live: ['title'],
      fields_infected: ['price'],
      fields_dead: [],
      integrity: 75,
      status: 'DEGRADED',
      rows: 10,
      sample: { title: 'a', price: 1 },
    },
    overrides
  );
}

test('stateWord reads live from fields_live', () => {
  assert.equal(stateWord(run({}), 'title'), 'live');
});

test('stateWord reads infected from fields_infected', () => {
  assert.equal(stateWord(run({}), 'price'), 'infected');
});

test('stateWord defaults an unlisted field to dead', () => {
  assert.equal(stateWord(run({}), 'rating'), 'dead');
});

test('stateWord defaults to dead when the state arrays are missing entirely', () => {
  assert.equal(stateWord({}, 'title'), 'dead');
});

test('stateWord prefers live when a field is listed in both arrays', () => {
  assert.equal(stateWord(run({ fields_infected: ['title'] }), 'title'), 'live');
});

test('fillRate returns 0 for no runs', () => {
  assert.equal(fillRate([], 'title'), 0);
});

test('fillRate scores an always-live field at 100', () => {
  assert.equal(fillRate([run({}), run({})], 'title'), 100);
});

test('fillRate scores an always-dead field at 0', () => {
  assert.equal(fillRate([run({}), run({})], 'rating'), 0);
});

test('fillRate gives an infected run half credit', () => {
  assert.equal(fillRate([run({}), run({})], 'price'), 50);
});

test('fillRate mixes live and infected runs', () => {
  const runs = [run({}), run({ fields_live: ['title', 'price'], fields_infected: [] })];
  assert.equal(fillRate(runs, 'price'), 75);
});

test('adaptHistory groups the real fixture into one spider per collector', () => {
  const spiders = adaptHistory(HISTORY);
  const cids = spiders.map((sp) => sp.cid);
  assert.equal(spiders.length, new Set(HISTORY.map((r) => r.collector_id)).size);
  assert.equal(new Set(cids).size, cids.length);
});

test('adaptHistory counts every run of each collector', () => {
  const spiders = adaptHistory(HISTORY);
  for (const sp of spiders) {
    const expected = HISTORY.filter((r) => r.collector_id === sp.cid).length;
    assert.equal(sp.runs, expected);
  }
});

test('adaptHistory takes its headline values from the newest run of the group', () => {
  const spiders = adaptHistory(HISTORY);
  for (const sp of spiders) {
    const newest = HISTORY.filter((r) => r.collector_id === sp.cid)
      .map((r) => Date.parse(r.ts))
      .reduce((a, b) => Math.max(a, b));
    assert.equal(Date.parse(sp.ts), newest);
  }
});

test('adaptHistory sorts runs oldest-first so the series ends on the latest integrity', () => {
  const spiders = adaptHistory(HISTORY);
  for (const sp of spiders) {
    assert.equal(sp.series[sp.series.length - 1], web.clampPct(sp.integrity));
  }
});

test('adaptHistory builds its series from clamped integrity values', () => {
  const runs = [
    run({ ts: '2026-08-21T01:00:00.000Z', integrity: -20 }),
    run({ ts: '2026-08-21T02:00:00.000Z', integrity: 250 }),
    run({ ts: '2026-08-21T03:00:00.000Z', integrity: 61.4 }),
  ];
  assert.deepEqual(plain(adaptHistory(runs)[0].series), [0, 100, 61]);
});

test('adaptHistory orders the series by timestamp, not by input order', () => {
  const runs = [
    run({ ts: '2026-08-21T03:00:00.000Z', integrity: 30 }),
    run({ ts: '2026-08-21T01:00:00.000Z', integrity: 10 }),
    run({ ts: '2026-08-21T02:00:00.000Z', integrity: 20 }),
  ];
  assert.deepEqual(plain(adaptHistory(runs)[0].series), [10, 20, 30]);
});

test('adaptHistory caps the series at the configured point limit', () => {
  const runs = [];
  for (let i = 0; i < web.SERIES_MAX_POINTS + 10; i += 1) {
    runs.push(run({ ts: new Date(Date.UTC(2026, 7, 21, 0, i)).toISOString(), integrity: 50 }));
  }
  assert.equal(adaptHistory(runs)[0].series.length, web.SERIES_MAX_POINTS);
});

test('adaptHistory derives field states from the latest run in expected order', () => {
  const runs = [
    run({ ts: '2026-08-21T01:00:00.000Z', fields_live: ['title', 'price'], fields_infected: [] }),
    run({ ts: '2026-08-21T02:00:00.000Z' }),
  ];
  const sp = adaptHistory(runs)[0];
  assert.deepEqual(plain(sp.fieldOrder), ['title', 'price']);
  assert.deepEqual(plain(sp.fields), { title: 'live', price: 'infected' });
});

test('adaptHistory skips null entries and runs with no collector id', () => {
  const runs = [null, { ts: '2026-08-21T01:00:00.000Z' }, run({})];
  assert.equal(adaptHistory(runs).length, 1);
});

test('adaptHistory returns an empty list for empty history', () => {
  assert.deepEqual(plain(adaptHistory([])), []);
});

test('adaptHistory sorts spiders worst-integrity first', () => {
  const runs = [
    run({ collector_id: 'c_hi', integrity: 100 }),
    run({ collector_id: 'c_lo', integrity: 10 }),
    run({ collector_id: 'c_mid', integrity: 55 }),
  ];
  assert.deepEqual(plain(adaptHistory(runs).map((sp) => sp.cid)), ['c_lo', 'c_mid', 'c_hi']);
});

test('adaptHistory marks a stale run as unwatched', () => {
  const stale = new Date(Date.now() - web.UNWATCHED_MS - 60000).toISOString();
  assert.equal(adaptHistory([run({ ts: stale })])[0].unwatched, true);
});

test('adaptHistory does not mark a recent run as unwatched', () => {
  const recent = new Date(Date.now() - 60000).toISOString();
  assert.equal(adaptHistory([run({ ts: recent })])[0].unwatched, false);
});

test('adaptHistory degrades to unwatched when the timestamp is unparseable', () => {
  assert.equal(adaptHistory([run({ ts: 'not-a-date' })])[0].unwatched, true);
});

test('adaptHistory survives a broken timestamp without throwing', () => {
  const runs = [run({ ts: 'garbage' }), run({ ts: '2026-08-21T02:00:00.000Z' })];
  assert.doesNotThrow(() => adaptHistory(runs));
  assert.equal(adaptHistory(runs)[0].runs, 2);
});

test('adaptHistory flags a reweaving status', () => {
  assert.equal(adaptHistory([run({ status: 'REWEAVING' })])[0].reweaving, true);
  assert.equal(adaptHistory([run({ status: 'HEALTHY' })])[0].reweaving, false);
});

test('adaptHistory defaults a missing sample to an empty object', () => {
  assert.deepEqual(plain(adaptHistory([run({ sample: undefined })])[0].sample), {});
});

test('adaptHistory computes a clean streak from the tail of the run list', () => {
  const runs = [
    run({ ts: '2026-08-21T01:00:00.000Z', status: 'DEGRADED' }),
    run({ ts: '2026-08-21T02:00:00.000Z', status: 'HEALTHY' }),
    run({ ts: '2026-08-21T03:00:00.000Z', status: 'HEALTHY' }),
  ];
  assert.equal(adaptHistory(runs)[0].streak, 2);
});

test('adaptHistory tracks the best streak separately from the current one', () => {
  const runs = ['HEALTHY', 'HEALTHY', 'HEALTHY', 'DEGRADED', 'HEALTHY'].map((status, i) =>
    run({ ts: new Date(Date.UTC(2026, 7, 21, i)).toISOString(), status: status })
  );
  const sp = adaptHistory(runs)[0];
  assert.equal(sp.best, 3);
  assert.equal(sp.streak, 1);
});

test('adaptHistory sums blast rows only over runs with broken fields', () => {
  const runs = [
    run({ ts: '2026-08-21T01:00:00.000Z', rows: 20, fields_live: ['title', 'price'], fields_infected: [] }),
    run({ ts: '2026-08-21T02:00:00.000Z', rows: 20 }),
  ];
  const blast = adaptHistory(runs)[0].blast;
  assert.equal(blast.rows, 20);
  assert.equal(blast.scans, 1);
  assert.deepEqual(plain(blast.fields), ['price']);
});

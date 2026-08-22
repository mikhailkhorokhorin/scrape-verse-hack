'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, setGlobal, plain } = require('../../web-loader.js');

const WEB_FILES = ['config.js', 'format.js', 'value.js', 'infection.js', 'adapter.js', 'from-record.js'];
const HISTORY = readFixture('history.json');
const INCIDENTS = readFixture('incidents.json');

function freshWeb() {
  const web = loadWebModule(WEB_FILES);
  setGlobal(web, 'RAW_HISTORY', HISTORY);
  return web;
}

const web = freshWeb();
const { spiderFromRecord, recordRuns, incidentAt, adaptHistory } = web;

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

test('spiderFromRecord returns null for a missing record', () => {
  assert.equal(spiderFromRecord(null, HISTORY), null);
  assert.equal(spiderFromRecord(undefined, []), null);
});

test('spiderFromRecord carries the record identity onto the display object', () => {
  const record = run({});
  const sp = spiderFromRecord(record, [record]);
  assert.equal(sp.code, 'ALPHA');
  assert.equal(sp.universe, 'example.com');
  assert.equal(sp.cid, 'c_a');
  assert.equal(sp.ts, record.ts);
  assert.equal(sp.integrity, 75);
  assert.equal(sp.status, 'DEGRADED');
});

test('spiderFromRecord reads field states off the chosen record, not the latest run', () => {
  const early = run({ ts: '2026-08-21T05:00:00.000Z', integrity: 0, fields_live: [], fields_infected: [], fields_dead: ['title', 'price'] });
  const later = run({ ts: '2026-08-21T06:00:00.000Z', integrity: 100, fields_live: ['title', 'price'], fields_infected: [], fields_dead: [] });
  const sp = spiderFromRecord(early, [early, later]);
  assert.deepEqual(plain(sp.fields), { title: 'dead', price: 'dead' });
  assert.equal(sp.integrity, 0);
});

test('spiderFromRecord orders fields by the record fields_expected', () => {
  const record = run({ fields_expected: ['price', 'title'] });
  assert.deepEqual(plain(spiderFromRecord(record, [record]).fieldOrder), ['price', 'title']);
});

test('spiderFromRecord tolerates a record with no fields_expected', () => {
  const record = run({ fields_expected: undefined });
  const sp = spiderFromRecord(record, [record]);
  assert.deepEqual(plain(sp.fieldOrder), []);
  assert.deepEqual(plain(sp.fields), {});
});

test('spiderFromRecord is never unwatched, so an old record still reads as a panel', () => {
  const record = run({ ts: '2020-01-01T00:00:00.000Z' });
  assert.equal(spiderFromRecord(record, [record]).unwatched, false);
});

test('spiderFromRecord defaults sample to an empty object', () => {
  const record = run({ sample: undefined });
  assert.deepEqual(plain(spiderFromRecord(record, [record]).sample), {});
});

test('spiderFromRecord produces the same keys adaptHistory produces', () => {
  const latest = HISTORY[HISTORY.length - 1];
  const live = adaptHistory(HISTORY).find((sp) => sp.cid === latest.collector_id);
  const made = spiderFromRecord(latest, HISTORY);
  for (const key of Object.keys(live)) {
    assert.ok(Object.prototype.hasOwnProperty.call(made, key), 'missing key ' + key);
  }
});

test('spiderFromRecord matches adaptHistory field-for-field on the latest record', () => {
  const latest = HISTORY[HISTORY.length - 1];
  const live = adaptHistory(HISTORY).find((sp) => sp.cid === latest.collector_id);
  const made = spiderFromRecord(latest, HISTORY);
  assert.deepEqual(plain(made.fields), plain(live.fields));
  assert.deepEqual(plain(made.fieldOrder), plain(live.fieldOrder));
  assert.deepEqual(plain(made.series), plain(live.series));
  assert.deepEqual(plain(made.fillRates), plain(live.fillRates));
  assert.deepEqual(plain(made.tracks), plain(live.tracks));
  assert.equal(made.runs, live.runs);
  assert.equal(made.streak, live.streak);
  assert.equal(made.best, live.best);
});

test('spiderFromRecord series ends on the chosen record, never on a later run', () => {
  const hurt = HISTORY.find((r) => r.integrity === 0);
  const sp = spiderFromRecord(hurt, HISTORY);
  assert.equal(sp.series[sp.series.length - 1], 0);
  assert.equal(sp.seriesTs[sp.seriesTs.length - 1], hurt.ts);
});

test('recordRuns keeps only the same collector', () => {
  const a = run({ collector_id: 'c_a' });
  const b = run({ collector_id: 'c_b', ts: '2026-08-21T04:00:00.000Z' });
  assert.deepEqual(plain(recordRuns([a, b], a).map((r) => r.collector_id)), ['c_a']);
});

test('recordRuns drops runs after the chosen record so the past is not spoiled', () => {
  const early = run({ ts: '2026-08-21T05:00:00.000Z' });
  const later = run({ ts: '2026-08-21T06:00:00.000Z' });
  assert.deepEqual(plain(recordRuns([early, later], early).map((r) => r.ts)), [early.ts]);
});

test('recordRuns sorts oldest first regardless of file order', () => {
  const early = run({ ts: '2026-08-21T05:00:00.000Z' });
  const later = run({ ts: '2026-08-21T06:00:00.000Z' });
  assert.deepEqual(plain(recordRuns([later, early], later).map((r) => r.ts)), [early.ts, later.ts]);
});

test('recordRuns drops runs with an unparseable timestamp', () => {
  const good = run({});
  const bad = run({ ts: 'not-a-date' });
  assert.equal(recordRuns([good, bad], good).length, 1);
});

test('recordRuns returns nothing for a missing history', () => {
  assert.equal(recordRuns(null, run({})).length, 0);
  assert.equal(recordRuns([run({})], null).length, 0);
});

test('incidentAt finds the incident opened on the record itself', () => {
  const opened = INCIDENTS[0];
  const record = HISTORY.find((r) => r.spider === opened.spider && r.ts === opened.opened_at);
  assert.equal(incidentAt(INCIDENTS, record), opened.id);
});

test('incidentAt returns null when no incident opened on that run', () => {
  const record = HISTORY[HISTORY.length - 1];
  assert.equal(incidentAt(INCIDENTS, record), null);
});

test('incidentAt does not match an incident belonging to another spider', () => {
  const opened = INCIDENTS[0];
  const record = { spider: 'SOMEONE_ELSE', ts: opened.opened_at };
  assert.equal(incidentAt(INCIDENTS, record), null);
});

test('incidentAt is safe with no incidents loaded', () => {
  assert.equal(incidentAt([], HISTORY[0]), null);
  assert.equal(incidentAt(null, HISTORY[0]), null);
  assert.equal(incidentAt(INCIDENTS, null), null);
});

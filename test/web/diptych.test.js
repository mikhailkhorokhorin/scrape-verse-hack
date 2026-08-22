'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, setGlobal, plain } = require('../web-loader.js');

const WEB_FILES = [
  'config.js', 'format.js', 'value.js', 'infection.js', 'adapter.js',
  'from-record.js', 'sparkhover.js', 'sparkline.js', 'received.js',
  'scars.js', 'symbiote.js', 'rig-parts.js', 'rig.js', 'panel.js', 'diptych.js',
];
const HISTORY = readFixture('history.json');
const INCIDENTS = readFixture('incidents.json');

function freshWeb() {
  const web = loadWebModule(WEB_FILES);
  setGlobal(web, 'RAW_HISTORY', HISTORY);
  setGlobal(web, 'INCIDENTS', []);
  return web;
}

const web = freshWeb();
const { pickDiptych, diptychHTML, diptychDate, diptychCaption, diptychWellFor } = web;

function run(overrides) {
  return Object.assign(
    {
      collector_id: 'c_a',
      spider: 'ALPHA',
      universe: 'example.com',
      ts: '2026-08-21T05:00:00.000Z',
      fields_expected: ['title', 'price'],
      fields_live: ['title', 'price'],
      fields_infected: [],
      fields_dead: [],
      integrity: 100,
      status: 'HEALTHY',
      rows: 10,
      sample: { title: 'a', price: 1 },
    },
    overrides
  );
}

function broken(ts) {
  return run({ ts: ts, integrity: 0, status: 'CRITICAL', fields_live: [], fields_dead: ['title', 'price'] });
}

test('pickDiptych returns null when history is empty or missing', () => {
  assert.equal(pickDiptych([], INCIDENTS), null);
  assert.equal(pickDiptych(null, INCIDENTS), null);
});

test('pickDiptych returns null when every recorded run is healthy', () => {
  const rows = [run({ ts: '2026-08-21T05:00:00.000Z' }), run({ ts: '2026-08-21T06:00:00.000Z' })];
  assert.equal(pickDiptych(rows, INCIDENTS), null);
});

test('pickDiptych returns null when a broken run has no healthy partner on its collector', () => {
  const rows = [broken('2026-08-21T05:00:00.000Z'), broken('2026-08-21T06:00:00.000Z')];
  assert.equal(pickDiptych(rows, INCIDENTS), null);
});

test('pickDiptych pairs the broken run with a healthy run from the same collector', () => {
  const hurt = broken('2026-08-21T05:00:00.000Z');
  const well = run({ ts: '2026-08-21T06:00:00.000Z' });
  const other = run({ collector_id: 'c_b', spider: 'BETA', ts: '2026-08-21T06:00:00.000Z' });
  const pair = pickDiptych([hurt, well, other], INCIDENTS);
  assert.equal(pair.hurt.ts, hurt.ts);
  assert.equal(pair.well.collector_id, hurt.collector_id);
});

test('pickDiptych prefers the recovery run right after the break', () => {
  const hurt = broken('2026-08-21T05:00:00.000Z');
  const before = run({ ts: '2026-08-21T04:00:00.000Z' });
  const soon = run({ ts: '2026-08-21T05:30:00.000Z' });
  const later = run({ ts: '2026-08-21T09:00:00.000Z' });
  const pair = pickDiptych([before, hurt, later, soon], INCIDENTS);
  assert.equal(pair.well.ts, soon.ts);
});

test('pickDiptych falls back to the healthy run before the break when none follows', () => {
  const hurt = broken('2026-08-21T09:00:00.000Z');
  const before = run({ ts: '2026-08-21T04:00:00.000Z' });
  const nearer = run({ ts: '2026-08-21T08:00:00.000Z' });
  const pair = pickDiptych([before, nearer, hurt], INCIDENTS);
  assert.equal(pair.well.ts, nearer.ts);
});

test('pickDiptych takes the lowest integrity on record across collectors', () => {
  const dip = run({ collector_id: 'c_a', ts: '2026-08-21T05:00:00.000Z', integrity: 40, status: 'CRITICAL' });
  const wellA = run({ collector_id: 'c_a', ts: '2026-08-21T06:00:00.000Z' });
  const floor = run({ collector_id: 'c_b', spider: 'BETA', ts: '2026-08-21T05:00:00.000Z', integrity: 0, status: 'CRITICAL' });
  const wellB = run({ collector_id: 'c_b', spider: 'BETA', ts: '2026-08-21T06:00:00.000Z' });
  const pair = pickDiptych([dip, wellA, floor, wellB], INCIDENTS);
  assert.equal(pair.hurt.spider, 'BETA');
});

test('pickDiptych ignores a merely degraded run when nothing is critical', () => {
  const soft = run({ ts: '2026-08-21T05:00:00.000Z', integrity: 75, status: 'DEGRADED' });
  const well = run({ ts: '2026-08-21T06:00:00.000Z' });
  assert.equal(pickDiptych([soft, well], INCIDENTS), null);
});

test('pickDiptych breaks a tie towards the run an incident was opened on', () => {
  const opened = INCIDENTS.find((inc) => inc.integrity_before === 0);
  const plainHurt = run({ collector_id: 'c_z', spider: 'ZULU', ts: '2026-08-21T05:00:00.000Z', integrity: 0, status: 'CRITICAL' });
  const plainWell = run({ collector_id: 'c_z', spider: 'ZULU', ts: '2026-08-21T06:00:00.000Z' });
  const marked = run({ collector_id: opened.collector_id, spider: opened.spider, ts: opened.opened_at, integrity: 0, status: 'CRITICAL' });
  const markedWell = run({ collector_id: opened.collector_id, spider: opened.spider, ts: '2026-08-21T23:00:00.000Z' });
  const pair = pickDiptych([plainHurt, plainWell, marked, markedWell], INCIDENTS);
  assert.equal(pair.hurt.spider, opened.spider);
});

test('pickDiptych prefers the incident-marked break when one collector broke twice', () => {
  const opened = INCIDENTS.find((inc) => inc.integrity_before === 0);
  const earlier = run({ collector_id: opened.collector_id, spider: opened.spider, ts: '2026-08-21T01:00:00.000Z', integrity: 0, status: 'CRITICAL' });
  const marked = run({ collector_id: opened.collector_id, spider: opened.spider, ts: opened.opened_at, integrity: 0, status: 'CRITICAL' });
  const well = run({ collector_id: opened.collector_id, spider: opened.spider, ts: '2026-08-21T23:00:00.000Z' });
  const pair = pickDiptych([earlier, marked, well], INCIDENTS);
  assert.equal(pair.hurt.ts, opened.opened_at);
});

test('pickDiptych on the committed history lands on a run the incident feed names', () => {
  const pair = pickDiptych(HISTORY, INCIDENTS);
  const named = INCIDENTS.some((inc) => inc.spider === pair.hurt.spider && inc.opened_at === pair.hurt.ts);
  assert.ok(named, 'expected the chosen break to carry an incident id');
});

test('pickDiptych skips runs with an unusable timestamp or integrity', () => {
  const rows = [
    run({ ts: 'nope', integrity: 0 }),
    run({ ts: '2026-08-21T05:00:00.000Z', integrity: null }),
    run({ ts: '2026-08-21T06:00:00.000Z' }),
  ];
  assert.equal(pickDiptych(rows, INCIDENTS), null);
});

test('pickDiptych on the committed history finds a real zero-integrity run', () => {
  const pair = pickDiptych(HISTORY, INCIDENTS);
  assert.ok(pair, 'expected a pair from the committed history');
  assert.equal(pair.hurt.integrity, 0);
  assert.ok(HISTORY.includes(pair.hurt));
  assert.ok(HISTORY.includes(pair.well));
  assert.equal(pair.hurt.collector_id, pair.well.collector_id);
  assert.ok(pair.well.integrity >= 90);
});

test('diptychWellFor never returns the broken run itself', () => {
  const hurt = broken('2026-08-21T05:00:00.000Z');
  assert.equal(diptychWellFor([hurt], hurt), null);
});

test('diptychDate renders a UTC date and clock from the record timestamp', () => {
  assert.equal(diptychDate('2026-08-21T05:13:45.636Z'), '2026-08-21 05:13:45Z');
});

test('diptychDate degrades honestly on an unusable timestamp', () => {
  assert.equal(diptychDate('nope'), 'date unknown');
});

test('diptychCaption names the incident opened on that record', () => {
  const opened = INCIDENTS[0];
  const record = HISTORY.find((r) => r.spider === opened.spider && r.ts === opened.opened_at);
  const html = diptychCaption(record, INCIDENTS, 'taken');
  assert.ok(html.includes(opened.id));
  assert.ok(html.includes('taken'));
});

test('diptychCaption omits the incident slot when no incident opened there', () => {
  const record = HISTORY[HISTORY.length - 1];
  const html = diptychCaption(record, INCIDENTS, 'held');
  assert.ok(!html.includes('dip__inc'));
});

test('diptychHTML renders nothing when no low-integrity record exists', () => {
  const rows = [run({ ts: '2026-08-21T05:00:00.000Z' }), run({ ts: '2026-08-21T06:00:00.000Z' })];
  assert.equal(diptychHTML(rows, INCIDENTS), '');
});

test('diptychHTML renders two panels through the live panelHTML path', () => {
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(html.includes('dip__row'));
  assert.equal(html.split('<button class="panel').length - 1, 2);
  assert.equal(html.split('dip__half').length - 1, 2);
});

test('diptychHTML shows the healthy half first and the taken half second', () => {
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(html.indexOf('held') < html.indexOf('taken'));
});

test('diptychHTML carries the real integrity readings of both records', () => {
  const pair = pickDiptych(HISTORY, INCIDENTS);
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(html.includes('>' + pair.hurt.integrity + '%<'));
  assert.ok(html.includes('>' + pair.well.integrity + '%<'));
});

test('diptychHTML never marks either half unwatched, however old the record', () => {
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(!html.includes('is-unwatched'));
  assert.ok(!html.includes('badge--unwatched'));
});

test('diptychHTML names both real record dates in its captions', () => {
  const pair = pickDiptych(HISTORY, INCIDENTS);
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(html.includes(diptychDate(pair.hurt.ts)));
  assert.ok(html.includes(diptychDate(pair.well.ts)));
});

test('diptychHTML gives the two halves distinct panel indexes', () => {
  const html = diptychHTML(HISTORY, INCIDENTS);
  assert.ok(html.includes('data-idx="0"'));
  assert.ok(html.includes('data-idx="1"'));
});

test('diptychHTML is safe when no incidents have been recorded', () => {
  const html = diptychHTML(HISTORY, []);
  assert.ok(html.includes('dip__row'));
  assert.ok(!html.includes('dip__inc'));
});

test('the diptych reads its records straight out of the committed history', () => {
  const pair = pickDiptych(HISTORY, INCIDENTS);
  const hurt = plain(pair.hurt);
  const found = HISTORY.find((r) => r.ts === hurt.ts && r.spider === hurt.spider);
  assert.deepEqual(plain(found), hurt);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, setGlobal, plain } = require('./web-loader.js');

const WEB_FILES = ['config.js', 'format.js', 'value.js', 'infection.js', 'adapter.js'];
const HISTORY = readFixture('history.json');
const INCIDENTS = readFixture('incidents.json');

function freshWeb() {
  const web = loadWebModule(WEB_FILES);
  setGlobal(web, 'RAW_HISTORY', HISTORY);
  return web;
}

const web = freshWeb();
const { adaptIncidents, blastRadius } = web;

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

test('adaptIncidents sorts incidents newest-opened first', () => {
  const list = adaptIncidents(INCIDENTS);
  const opened = list.map((inc) => Date.parse(inc.openedAt));
  assert.deepEqual(plain(opened), plain(opened).slice().sort((a, b) => b - a));
});

test('adaptIncidents preserves every incident in the fixture', () => {
  assert.equal(adaptIncidents(INCIDENTS).length, INCIDENTS.length);
});

test('adaptIncidents computes mttrMs for a closed incident', () => {
  const inc = INCIDENTS.find((i) => i.closed_at);
  const got = adaptIncidents([inc])[0];
  assert.equal(got.mttrMs, Date.parse(inc.closed_at) - Date.parse(inc.opened_at));
});

test('adaptIncidents leaves mttrMs null for an open incident', () => {
  const inc = Object.assign({}, INCIDENTS[0], { closed_at: null });
  assert.equal(adaptIncidents([inc])[0].mttrMs, null);
});

test('adaptIncidents leaves mttrMs null when closed_at is unparseable', () => {
  const inc = Object.assign({}, INCIDENTS[0], { closed_at: 'nope' });
  assert.equal(adaptIncidents([inc])[0].mttrMs, null);
});

test('adaptIncidents leaves mttrMs null when the close precedes the open', () => {
  const inc = Object.assign({}, INCIDENTS[0], {
    opened_at: '2026-08-21T06:00:00.000Z',
    closed_at: '2026-08-21T05:00:00.000Z',
  });
  assert.equal(adaptIncidents([inc])[0].mttrMs, null);
});

test('adaptIncidents marks an incident verified only when a VERIFIED stage exists', () => {
  const inc = INCIDENTS[0];
  assert.equal(adaptIncidents([inc])[0].verified, true);
  const trimmed = Object.assign({}, inc, {
    stages: inc.stages.filter((st) => st.stage !== 'VERIFIED'),
  });
  assert.equal(adaptIncidents([trimmed])[0].verified, false);
});

test('adaptIncidents prefers the authored summary over the generated sentence', () => {
  const inc = INCIDENTS.find((i) => i.summary);
  assert.equal(adaptIncidents([inc])[0].what, inc.summary);
});

test('adaptIncidents generates a sentence naming the anomalies when no summary is given', () => {
  const inc = Object.assign({}, INCIDENTS[0], { summary: '', anomalies: ['price', 'rating'] });
  const what = adaptIncidents([inc])[0].what;
  assert.match(what, /price and rating/);
});

test('adaptIncidents says the re-weave failed when nothing was recovered', () => {
  const inc = Object.assign({}, INCIDENTS[0], { summary: '', recovered_fields: [] });
  assert.match(adaptIncidents([inc])[0].what, /did not restore/);
});

test('adaptIncidents renders stages as name and clock pairs in order', () => {
  const inc = INCIDENTS[0];
  const stages = adaptIncidents([inc])[0].stages;
  assert.deepEqual(plain(stages.map((s) => s[0])), inc.stages.map((s) => s.stage));
  assert.equal(stages[0][1], web.clockOf(inc.stages[0].ts));
});

test('blastRadius counts only broken runs inside the incident window', () => {
  const inc = INCIDENTS.find((i) => i.closed_at);
  const blast = blastRadius(HISTORY, inc);
  if (blast) {
    assert.ok(blast.rows > 0);
    assert.equal(blast.open, false);
  }
});

test('blastRadius returns null for an unparseable open timestamp', () => {
  assert.equal(blastRadius(HISTORY, { opened_at: 'nope', spider: 'ATLAS' }), null);
});

test('blastRadius returns null when no broken run falls in the window', () => {
  const inc = Object.assign({}, INCIDENTS[0], {
    opened_at: '2020-01-01T00:00:00.000Z',
    closed_at: '2020-01-02T00:00:00.000Z',
  });
  assert.equal(blastRadius(HISTORY, inc), null);
});

test('blastRadius falls back to rows_per_run when a run reports no row count', () => {
  const inc = {
    spider: 'ALPHA',
    collector_id: 'c_a',
    opened_at: '2026-08-21T00:00:00.000Z',
    closed_at: '2026-08-21T23:00:00.000Z',
    rows_per_run: 7,
  };
  const blast = blastRadius([run({ rows: 0 })], inc);
  assert.equal(blast.rows, 7);
  assert.equal(blast.runs, 1);
});

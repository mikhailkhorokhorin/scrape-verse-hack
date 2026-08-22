'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lib = require('../tools/evidence-lib.js');
const report = require('../tools/evidence-report.js');

const FIXTURE = {
  id: 'inc_900',
  spider: 'BODEGA',
  collector_id: 'c_fixture',
  strain: 'RENAMED',
  opened_at: '2026-08-21T05:00:00.000Z',
  closed_at: '2026-08-21T05:10:00.000Z',
  integrity_before: 50,
  integrity_after: 100,
  anomalies: ['price'],
  recovered_fields: ['price'],
  resolved: true,
  stages: [
    { stage: 'DETECTED', ts: '2026-08-21T05:00:00.000Z' },
    { stage: 'DIAGNOSED', ts: '2026-08-21T05:01:30.000Z' },
    { stage: 'REWEAVING', ts: '2026-08-21T05:02:00.000Z' },
    { stage: 'VERIFIED', ts: '2026-08-21T05:10:00.000Z' }
  ],
  verification: {
    ran: true, checked: 1, passed: 1, verdict: 'EVERY_FIELD_BACK',
    checks: [{
      field: 'price', from: 'dead', to: 'live',
      received_before: null, received_after: '9.99', passed: true
    }]
  }
};

const EMPTY_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thwip-evidence-'));

const reportOf = (incident) => lib.reportFor(incident || FIXTURE, EMPTY_DIR);

test('the digest of a fixture record is stable across repeated runs', () => {
  assert.equal(lib.digestOfRecord(FIXTURE), lib.digestOfRecord(FIXTURE));
});

test('the digest of a known fixture is exactly the sha256 of its committed JSON', () => {
  assert.equal(lib.digestOfRecord(FIXTURE), lib.sha256(JSON.stringify(FIXTURE)));
});

test('a digest is sixty-four lowercase hex characters', () => {
  assert.match(lib.digestOfRecord(FIXTURE), /^[0-9a-f]{64}$/);
});

test('changing a single field of the record changes its digest', () => {
  const tampered = { ...FIXTURE, integrity_after: 99 };
  assert.notEqual(lib.digestOfRecord(tampered), lib.digestOfRecord(FIXTURE));
});

test('the digest of a file is the sha256 of the bytes on disk', () => {
  const file = path.join(EMPTY_DIR, 'sample.txt');
  fs.writeFileSync(file, 'thwip');
  assert.equal(lib.digestOfFile(file), lib.sha256('thwip'));
  fs.unlinkSync(file);
});

test('the first stage has no elapsed time because nothing preceded it', () => {
  assert.equal(lib.timeline(FIXTURE).rows[0].since_previous_seconds, null);
});

test('each stage records the seconds elapsed since the stage before it', () => {
  const rows = lib.timeline(FIXTURE).rows;
  assert.deepEqual(rows.map((row) => row.since_previous_seconds), [null, 90, 30, 480]);
});

test('the total is the span from the first stage to the last, not the sum of gaps', () => {
  assert.equal(lib.timeline(FIXTURE).total_seconds, 600);
});

test('an incident with no stages reports no total rather than zero', () => {
  const empty = lib.timeline({ stages: [] });
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.total_seconds, null);
});

test('an unparseable stage timestamp yields no duration instead of NaN', () => {
  const rows = lib.timeline({ stages: [
    { stage: 'DETECTED', ts: 'not a date' },
    { stage: 'VERIFIED', ts: '2026-08-21T05:10:00.000Z' }
  ] }).rows;
  assert.equal(rows[1].since_previous_seconds, null);
});

test('the per-field table carries the state and the value on both sides', () => {
  const row = lib.fieldRows(FIXTURE)[0];
  assert.equal(row.state_before, 'dead');
  assert.equal(row.state_after, 'live');
  assert.equal(row.value_before, null);
  assert.equal(row.value_after, '9.99');
});

test('a field that was never re-checked prints not checked rather than a state', () => {
  const rows = lib.fieldRows({ verification: { checks: [
    { field: 'price', from: 'dead', to: null, passed: false }
  ] } });
  assert.equal(rows[0].state_after, 'not checked');
});

test('an incident with no verification produces an empty field table', () => {
  assert.deepEqual(lib.fieldRows({ id: 'inc_901' }), []);
});

test('the report states the collector id was identical before and after', () => {
  const result = reportOf();
  assert.equal(result.collector_id_before, result.collector_id_after);
  assert.equal(result.collector_id_unchanged, true);
});

test('the unchanged-id assertion fails loudly when the collector id changed', () => {
  const swapped = { ...FIXTURE, verification: { ...FIXTURE.verification, collector_id_after: 'c_other' } };
  assert.throws(() => lib.assertIdUnchanged(swapped), /collector_id changed/);
});

test('the unchanged-id assertion fails loudly when the collector id is missing', () => {
  assert.throws(() => lib.assertIdUnchanged({ id: 'inc_902' }), /collector_id is missing/);
});

test('a report refuses to render an incident whose collector id changed', () => {
  const swapped = { ...FIXTURE, verification: { ...FIXTURE.verification, collector_id_after: 'c_other' } };
  assert.throws(() => lib.reportFor(swapped, EMPTY_DIR), /re-woven/);
});

test('asking for an unknown incident id names the ids that do exist', () => {
  assert.throws(() => lib.reports(['inc_nope'], [FIXTURE], EMPTY_DIR),
    /unknown incident id: inc_nope\. Known ids: inc_900/);
});

test('asking for no incident reports on every one of them', () => {
  const list = lib.reports([], [FIXTURE], EMPTY_DIR);
  assert.deepEqual(list.map((one) => one.id), ['inc_900']);
});

test('an evidence directory that does not exist yields no files rather than throwing', () => {
  assert.deepEqual(lib.evidenceFiles(path.join(EMPTY_DIR, 'absent')), []);
});

test('durations under two minutes print in seconds', () => {
  assert.equal(report.duration(90), '90s');
});

test('durations over two minutes print in minutes and seconds', () => {
  assert.equal(report.duration(600), '10m 0s');
});

test('durations over two hours print in hours and minutes', () => {
  assert.equal(report.duration(7800), '2h 10m');
});

test('a missing duration prints as a dash rather than as zero', () => {
  assert.equal(report.duration(null), '--');
});

test('a long value is truncated so one row cannot flood the table', () => {
  const shown = report.displayValue('x'.repeat(200));
  assert.equal(shown.length, report.VALUE_WIDTH);
  assert.ok(shown.endsWith('...'));
});

test('a null value prints as null and an empty string prints as quotes', () => {
  assert.equal(report.displayValue(null), 'null');
  assert.equal(report.displayValue(''), '""');
});

test('the rendered report shows the collector id on both sides of the arrow', () => {
  const text = report.render(reportOf());
  assert.ok(text.includes('c_fixture -> c_fixture'));
  assert.ok(text.includes('re-woven in place'));
});

test('the rendered report carries the record digest', () => {
  assert.ok(report.render(reportOf()).includes(lib.digestOfRecord(FIXTURE)));
});

test('an incident with no committed payload files says so rather than printing nothing', () => {
  assert.ok(report.render(reportOf()).includes('no payload files committed'));
});

test('the json flag is recognised and the remaining arguments are incident ids', () => {
  assert.deepEqual(report.parseArgs(['inc_001', '--json']), { ids: ['inc_001'], json: true });
});

test('no arguments means every incident and human-readable output', () => {
  assert.deepEqual(report.parseArgs([]), { ids: [], json: false });
});

test('an unknown flag is rejected rather than silently treated as an incident id', () => {
  assert.throws(() => report.parseArgs(['--wat']), /unknown flag: --wat/);
});

test('every committed incident renders without tripping the unchanged-id assertion', () => {
  const list = lib.reports([]);
  assert.ok(list.length >= 1);
  for (const one of list) assert.equal(one.collector_id_unchanged, true);
});

test('every committed incident carries a digest of the record as committed', () => {
  for (const one of lib.reports([])) assert.match(one.record_sha256, /^[0-9a-f]{64}$/);
});

test('the digests of the committed incidents are all different from each other', () => {
  const digests = lib.reports([]).map((one) => one.record_sha256);
  assert.equal(new Set(digests).size, digests.length);
});

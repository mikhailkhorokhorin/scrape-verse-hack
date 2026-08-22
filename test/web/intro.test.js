'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, readFixture, plain } = require('../web-loader.js');

const context = loadWebModule(['config.js', 'format.js', 'intro-plan.js']);
const {
  introIncidentOf, introBeats, introHoldMs, introSpreadOf, introDecision,
  introSeen, introMarkSeen, INTRO_SPAN_MS, INTRO_FLAG, MAX_VISIBLE_SPREAD,
} = context;

const INCIDENTS = readFixture('incidents.json');

function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('the named incident inc_003 is the one the sequence plays', () => {
  const inc = introIncidentOf(INCIDENTS);
  assert.equal(inc.id, 'inc_003');
});

test('inc_003 is a real record with the before and after the sequence needs', () => {
  const inc = introIncidentOf(INCIDENTS);
  assert.equal(inc.spider, 'BODEGA');
  assert.equal(inc.integrity_before, 0);
  assert.equal(inc.integrity_after, 100);
  assert.equal(inc.strain, 'THROTTLED');
});

test('with inc_003 absent it falls back to the most severe real incident', () => {
  const without = INCIDENTS.filter((inc) => inc.id !== 'inc_003');
  const inc = introIncidentOf(without);
  assert.ok(inc);
  assert.notEqual(inc.id, 'inc_003');
  const worst = Math.min(...without.map((r) => r.integrity_before));
  assert.equal(inc.integrity_before, worst);
});

test('the fallback is deterministic when two incidents tie on severity', () => {
  const tied = [
    { id: 'inc_b', spider: 'B', integrity_before: 5, integrity_after: 100 },
    { id: 'inc_a', spider: 'A', integrity_before: 5, integrity_after: 100 },
  ];
  assert.equal(introIncidentOf(tied).id, introIncidentOf(tied.slice().reverse()).id);
});

test('no incidents at all means nothing to play back', () => {
  assert.equal(introIncidentOf([]), null);
  assert.equal(introIncidentOf(null), null);
});

test('the schedule is the six beats of the brief, in order, ending live at 6s', () => {
  const beats = introBeats(introIncidentOf(INCIDENTS));
  assert.deepEqual(plain(beats.map((b) => b.at)), [0, 800, 1600, 2600, 3400, 4600, 5400, 6000]);
  assert.deepEqual(plain(beats.map((b) => b.name)),
    ['healthy', 'snap', 'crack', 'hold', 'weave', 'purge', 'thwip', 'live']);
  assert.equal(beats[beats.length - 1].at, INTRO_SPAN_MS);
});

test('every onomatopoeia the brief names is fired exactly once', () => {
  const words = introBeats(introIncidentOf(INCIDENTS)).map((b) => b.word).filter(Boolean);
  assert.deepEqual(plain(words), ['SNAP!', 'CRACK!', 'WEAVE…', 'PURGE!', 'THWIP!']);
});

test('the hold is the longest stretch of silence between two spoken beats', () => {
  const beats = introBeats(introIncidentOf(INCIDENTS));
  const hold = introHoldMs(beats);
  assert.equal(hold, 1800);

  const spoken = beats.filter((b) => b.word);
  const gaps = spoken.slice(1).map((b, i) => b.at - spoken[i].at);
  assert.equal(Math.max(...gaps), hold);
  assert.equal(gaps.filter((g) => g === hold).length, 1);
});

test('the hold outlasts every other beat-to-beat step, so it reads as a pause', () => {
  const beats = introBeats(introIncidentOf(INCIDENTS));
  const hold = introHoldMs(beats);
  const holdIndex = beats.findIndex((b) => b.hold);
  for (let i = 1; i < beats.length; i += 1) {
    if (i === holdIndex || i === holdIndex + 1) continue;
    assert.ok(beats[i].at - beats[i - 1].at < hold);
  }
});

test('nothing is painted or spoken during the hold — it is a genuine pause', () => {
  const beats = introBeats(introIncidentOf(INCIDENTS));
  const crack = beats.find((b) => b.name === 'crack');
  const hold = beats.find((b) => b.name === 'hold');
  assert.equal(hold.word, null);
  assert.equal(hold.integrity, crack.integrity);
});

test('the sequence runs the real before and after integrity, not synthetic numbers', () => {
  const inc = introIncidentOf(INCIDENTS);
  const beats = introBeats(inc);
  assert.equal(beats.find((b) => b.name === 'crack').integrity, inc.integrity_before);
  assert.equal(beats.find((b) => b.name === 'thwip').integrity, inc.integrity_after);
  assert.equal(beats.find((b) => b.name === 'live').integrity, inc.integrity_after);
});

test('integrity falls to the break then climbs back, never wandering', () => {
  const beats = introBeats(introIncidentOf(INCIDENTS));
  const values = beats.map((b) => b.integrity);
  const low = values.indexOf(Math.min(...values));
  for (let i = 1; i <= low; i += 1) assert.ok(values[i] <= values[i - 1]);
  for (let i = low + 1; i < values.length; i += 1) assert.ok(values[i] >= values[i - 1]);
});

test('the last beat is exactly the state a plain load reaches', () => {
  const inc = introIncidentOf(INCIDENTS);
  const beats = introBeats(inc);
  const live = beats[beats.length - 1];
  assert.equal(live.word, null);
  assert.equal(live.integrity, inc.integrity_after);
});

test('spread is the missing integrity, clamped to what a panel can show', () => {
  assert.equal(Number(introSpreadOf(100)), 0);
  assert.equal(Number(introSpreadOf(70)), 0.3);
  assert.equal(Number(introSpreadOf(0)), MAX_VISIBLE_SPREAD);
});

test('spread never exceeds the clamp at any beat', () => {
  for (const beat of introBeats(introIncidentOf(INCIDENTS))) {
    assert.ok(Number(introSpreadOf(beat.integrity)) <= MAX_VISIBLE_SPREAD);
  }
});

test('a fresh tab plays the sequence', () => {
  const decision = introDecision({ reducedMotion: false, forced: false, seen: false, hasIncident: true });
  assert.deepEqual(plain(decision), { play: true, why: 'first-load' });
});

test('a second load in the same tab does not replay', () => {
  assert.equal(introDecision({ reducedMotion: false, forced: false, seen: true, hasIncident: true }).play, false);
});

test('reduced motion skips straight to the live end state', () => {
  const decision = introDecision({ reducedMotion: true, forced: true, seen: false, hasIncident: true });
  assert.equal(decision.play, false);
  assert.equal(decision.why, 'reduced-motion');
});

test('an explicit request beats the session flag but never reduced motion', () => {
  assert.equal(introDecision({ reducedMotion: false, forced: true, seen: true, hasIncident: true }).play, true);
  assert.equal(introDecision({ reducedMotion: true, forced: true, seen: true, hasIncident: true }).play, false);
});

test('with no real incident on record there is nothing to demonstrate', () => {
  const decision = introDecision({ reducedMotion: false, forced: false, seen: false, hasIncident: false });
  assert.equal(decision.play, false);
  assert.equal(decision.why, 'no-incident');
});

test('the session flag round-trips through storage', () => {
  const store = memoryStore();
  assert.equal(introSeen(store), false);
  introMarkSeen(store);
  assert.equal(introSeen(store), true);
  assert.equal(store.getItem(INTRO_FLAG), '1');
});

test('storage that throws is treated as already seen rather than replaying forever', () => {
  const blocked = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
  };
  assert.equal(introSeen(blocked), true);
  assert.doesNotThrow(() => introMarkSeen(blocked));
});

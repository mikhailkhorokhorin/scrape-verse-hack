#!/usr/bin/env node
'use strict';

/**
 * Heal collectors that have been broken for two consecutive scans.
 *
 * Two scans, not one: a single bad run is usually a transient network failure,
 * and healing on it burns credit for nothing.
 *
 * Never exits non-zero on a failed heal. A heal that did not work is data about
 * the target, not a broken pipeline.
 */

const L = require('./lib.js');

const THRESHOLD = 60;                       // integrity below this counts as broken
const COOLDOWN_MS = 2 * 60 * 60 * 1000;     // never heal the same collector twice in 2h

const runsFor = (hist, code) => hist.filter((r) => r.spider === code);

function lastHealAt(incs, code) {
  const mine = incs.filter((i) => i.spider === code);
  return mine.length ? new Date(mine[mine.length - 1].opened_at).getTime() : 0;
}

/**
 * Build the prompt from what actually broke. Never from user input — a prompt
 * that can be supplied externally is an injection into the healer.
 */
function buildPrompt(run) {
  const parts = [];
  if (run.fields_dead.length)
    parts.push(`${run.fields_dead.map((f) => `'${f}'`).join(' and ')} ` +
               `${run.fields_dead.length > 1 ? 'return' : 'returns'} null after a layout change`);
  if (run.fields_infected.length)
    parts.push(`${run.fields_infected.map((f) => `'${f}'`).join(' and ')} ` +
               `${run.fields_infected.length > 1 ? 'return' : 'returns'} an invalid value`);
  return `On ${run.universe}: ${parts.join('; ')}. Fix the extraction for those fields.`
    .slice(0, 990);
}

function heal(c, run, stages) {
  stages.push({ stage: 'DIAGNOSED', ts: new Date().toISOString() });
  const prompt = buildPrompt(run);
  console.log(`${c.codename}: healing — ${prompt}`);

  stages.push({ stage: 'REWEAVING', ts: new Date().toISOString() });
  try {
    // --timeout is explicit: the CLI defaults to 600s and a heal runs up to 15
    // minutes, so the default aborts a working heal and burns the credit anyway.
    L.bdata(['scraper', 'heal', c.collector_id, prompt, '--url', c.url,
             '--auto-approve', '--auto-save', '--timeout', '900']);
  } catch (err) {
    console.error(`${c.codename}: heal failed — ${err.message.split('\n')[0]}`);
    return null;
  }

  // Verify rather than trust. A heal that reports success and still returns
  // nulls is exactly the silent failure this product is about.
  try {
    const list = L.rowsOf(L.parsePayload(
      L.bdata(['scraper', 'run', c.collector_id, c.url, '--pretty'])));
    // Vote across every row, exactly as the scan does. Judging the heal on row
    // zero lets one unlucky row report a working heal as a failed one.
    const states = {};
    for (const f of Object.keys(c.fields)) {
      const tally = { live: 0, infected: 0, dead: 0 };
      for (const row of list) tally[L.classify(row?.[f], c.fields[f])]++;
      states[f] = Object.keys(tally).reduce((a, b) => (tally[a] >= tally[b] ? a : b));
    }
    stages.push({ stage: 'VERIFIED', ts: new Date().toISOString() });
    const integrity = L.integrityOf(states);
    const pick = (st) => Object.keys(states).filter((f) => states[f] === st);
    // The console reads history, not incidents. Without this the recovery is
    // invisible on the sparkline until the next scheduled scan.
    L.appendHistory({
      collector_id: c.collector_id,
      spider: c.codename,
      universe: c.universe,
      ts: new Date().toISOString(),
      fields_expected: Object.keys(c.fields),
      fields_live: pick('live'),
      fields_infected: pick('infected'),
      fields_dead: pick('dead'),
      integrity,
      status: L.statusOf(integrity),
      rows: list.length,
      after_heal: true,
      sample: Object.fromEntries(
        Object.keys(c.fields).map((f) => [f, list[0]?.[f] ?? null]))
    });
    return integrity;
  } catch (err) {
    console.error(`${c.codename}: verification run failed — ${err.message.split('\n')[0]}`);
    return null;
  }
}

function main() {
  const hist = L.history();
  const incs = L.incidents();
  const now = Date.now();

  // A single collector can be forced from outside via the T-38 trigger endpoint.
  // Allowlist it against collectors.json — server-side checks are not a substitute
  // for validating at the point of use.
  const forced = process.env.HEAL_COLLECTOR || null;

  for (const c of L.collectors()) {
    if (!c.collector_id) continue;
    if (forced && c.collector_id !== forced) continue;

    const runs = runsFor(hist, c.codename);
    const last2 = runs.slice(-2);

    const broken = forced
      ? last2.length && last2[last2.length - 1].integrity < THRESHOLD
      : last2.length === 2 && last2.every((r) => r.integrity < THRESHOLD);

    if (!broken) continue;

    if (now - lastHealAt(incs, c.codename) < COOLDOWN_MS) {
      console.log(`${c.codename}: within cooldown, skipping`);
      continue;
    }

    const run = last2[last2.length - 1];
    const stages = [{ stage: 'DETECTED', ts: run.ts }];
    const opened = new Date().toISOString();
    const after = heal(c, run, stages);

    L.appendIncident({
      id: `inc_${String(incs.length + 1).padStart(3, '0')}`,
      spider: c.codename,
      collector_id: c.collector_id,
      opened_at: opened,
      closed_at: after === null ? null : new Date().toISOString(),
      integrity_before: run.integrity,
      integrity_after: after,
      anomalies: [...run.fields_dead, ...run.fields_infected],
      rows_per_run: c.rows_per_run,
      heal_prompt: buildPrompt(run),
      resolved: after !== null && after >= 90,
      stages
    });

    console.log(`${c.codename}: ${run.integrity}% -> ${after === null ? 'heal failed' : after + '%'}`);
  }
}

main();

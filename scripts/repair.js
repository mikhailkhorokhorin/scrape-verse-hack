#!/usr/bin/env node
'use strict';

const lib = require('./lib.js');
const { verification } = require('./verify.js');

const BROKEN_BELOW = lib.DEGRADED_MIN;
const RESOLVED_AT = lib.HEALTHY_MIN;
const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const CONSECUTIVE_BAD_RUNS = 2;
const HEAL_TIMEOUT_SECONDS = '900';
const MAX_PROMPT_CHARS = 990;

const runsFor = (history, codename) => history.filter((run) => run.spider === codename);

function firstLine(err) {
  return err.message.split('\n')[0];
}

function lastHealAt(incidents, codename) {
  return incidents
    .filter((incident) => incident && incident.spider === codename)
    .reduce((latest, incident) => {
      const at = new Date(incident.opened_at).getTime();
      return Number.isFinite(at) && at > latest ? at : latest;
    }, 0);
}

function clause(fields, verb) {
  const quoted = fields.map((field) => `'${field}'`).join(' and ');
  return `${quoted} ${fields.length > 1 ? verb : verb + 's'}`;
}

const NARROW_TYPES = new Set(['number', 'url']);

function isNarrow(rule) {
  return !!rule && NARROW_TYPES.has(rule.type);
}

function shiftedPairs(run, collector) {
  const pairs = [];
  const broken = [...run.fields_dead, ...run.fields_infected];
  for (const field of broken) {
    const value = run.sample ? run.sample[field] : undefined;
    if (value === null || value === undefined || value === '') continue;
    if (!isNarrow(collector.fields[field])) continue;
    for (const other of run.fields_expected) {
      if (other === field || broken.includes(other)) continue;
      if (!isNarrow(collector.fields[other])) continue;
      if (lib.classify(value, collector.fields[other]) === 'live') {
        pairs.push([field, other]);
        break;
      }
    }
  }
  return pairs;
}

function strainOf(run, collector) {
  const dead = run.fields_dead.length;
  const infected = run.fields_infected.length;
  const expected = run.fields_expected.length;

  if (dead === expected && expected > 0) return 'THROTTLED';
  if (shiftedPairs(run, collector).length) return 'SHIFTED';
  if (infected > dead) return 'DRIFTED';
  if (dead) return 'RENAMED';
  return 'DRIFTED';
}

const STRAIN_HINT = {
  THROTTLED: 'every field came back empty, so the request itself is likely being blocked ' +
    'or served a different page',
  RENAMED: 'the other fields still extract correctly, so a selector moved rather than the ' +
    'page changing wholesale',
  DRIFTED: 'the fields still return values and the values are wrong, so the selectors ' +
    'match the wrong nodes rather than nothing',
  SHIFTED: 'the columns appear to have slid — a broken field is returning a value that ' +
    'belongs to a neighbouring field'
};

function buildPrompt(run, strain) {
  const parts = [];
  if (run.fields_dead.length) {
    parts.push(`${clause(run.fields_dead, 'return')} null after a layout change`);
  }
  if (run.fields_infected.length) {
    parts.push(`${clause(run.fields_infected, 'return')} an invalid value`);
  }
  const hint = strain && STRAIN_HINT[strain] ? ` Likely ${strain}: ${STRAIN_HINT[strain]}.` : '';
  return `On ${run.universe}: ${parts.join('; ')}.${hint} Fix the extraction for those fields.`
    .slice(0, MAX_PROMPT_CHARS);
}

function heal(collector, run, stages, strain) {
  stages.push({ stage: 'DIAGNOSED', ts: new Date().toISOString() });
  const prompt = buildPrompt(run, strain);
  console.log(`${collector.codename}: healing [${strain}] — ${prompt}`);

  stages.push({ stage: 'REWEAVING', ts: new Date().toISOString() });
  try {
    lib.bdata(['scraper', 'heal', collector.collector_id, prompt, '--url', collector.url,
      '--auto-approve', '--auto-save', '--timeout', HEAL_TIMEOUT_SECONDS]);
  } catch (err) {
    console.error(`${collector.codename}: heal failed — ${firstLine(err)}`);
    return null;
  }

  try {
    const rows = lib.rowsOf(lib.parsePayload(
      lib.bdata(['scraper', 'run', collector.collector_id, collector.url, '--pretty'])), collector.url);
    if (!rows.length) {
      console.error(`${collector.codename}: verification run returned no rows`);
      return null;
    }
    stages.push({ stage: 'VERIFIED', ts: new Date().toISOString() });
    const record = lib.runRecord(collector, rows);
    lib.appendHistory({ ...record, after_heal: true });
    return record;
  } catch (err) {
    console.error(`${collector.codename}: verification run failed — ${firstLine(err)}`);
    return null;
  }
}

function recoveredFields(run, after) {
  const broken = [...run.fields_dead, ...run.fields_infected];
  return broken.filter((field) => after.fields_live.includes(field));
}

function describe(run, after, recovered) {
  const broken = [...run.fields_dead, ...run.fields_infected];
  const listed = broken.join(' and ');
  if (!after) {
    return `Extraction kept succeeding while ${listed} stopped returning usable values. ` +
      'The re-weave did not complete.';
  }
  if (recovered.length === broken.length) {
    return `Extraction kept succeeding while ${listed} stopped returning usable values. ` +
      `The re-weave restored ${recovered.join(' and ')} and Integrity returned to ${after.integrity}%.`;
  }
  if (recovered.length) {
    return `Extraction kept succeeding while ${listed} stopped returning usable values. ` +
      `The re-weave brought back ${recovered.join(' and ')}; the rest is still failing at ${after.integrity}%.`;
  }
  return `Extraction kept succeeding while ${listed} stopped returning usable values. ` +
    `The re-weave did not restore them — Integrity is ${after.integrity}%.`;
}

function isBroken(recent, forced) {
  if (!recent.length) return false;
  if (forced) return recent[recent.length - 1].integrity < BROKEN_BELOW;
  return recent.length === CONSECUTIVE_BAD_RUNS &&
    recent.every((run) => run.integrity < BROKEN_BELOW);
}

function main() {
  const history = lib.history();
  const incidents = lib.incidents();
  const now = Date.now();
  const forced = process.env.HEAL_COLLECTOR || null;
  const known = lib.collectors().filter((c) => c.collector_id).map((c) => c.collector_id);

  if (forced && !known.includes(forced)) {
    console.error('HEAL_COLLECTOR is not a known collector, refusing to heal');
    process.exit(1);
  }

  let healed = 0;
  let failed = 0;

  for (const collector of lib.collectors()) {
    if (!collector.collector_id) continue;
    if (forced && collector.collector_id !== forced) continue;

    const recent = runsFor(history, collector.codename).slice(-CONSECUTIVE_BAD_RUNS);
    if (!isBroken(recent, forced)) continue;

    if (now - lastHealAt(incidents, collector.codename) < COOLDOWN_MS) {
      console.log(`${collector.codename}: within cooldown, skipping`);
      continue;
    }

    const run = recent[recent.length - 1];
    const stages = [{ stage: 'DETECTED', ts: run.ts }];
    const openedAt = new Date().toISOString();
    const strain = strainOf(run, collector);
    const after = heal(collector, run, stages, strain);
    const recovered = after ? recoveredFields(run, after) : [];

    lib.appendIncident({
      spider: collector.codename,
      collector_id: collector.collector_id,
      opened_at: openedAt,
      closed_at: after === null ? null : new Date().toISOString(),
      integrity_before: run.integrity,
      integrity_after: after === null ? null : after.integrity,
      anomalies: [...run.fields_dead, ...run.fields_infected],
      recovered_fields: recovered,
      verification: verification(run, after),
      summary: describe(run, after, recovered),
      rows_per_run: collector.rows_per_run,
      strain: strain,
      heal_prompt: buildPrompt(run, strain),
      resolved: after !== null && after.integrity >= RESOLVED_AT,
      stages
    });

    if (after === null) failed++;
    else healed++;

    console.log(`${collector.codename}: ${run.integrity}% -> ` +
      (after === null ? 'heal failed' : after.integrity + '%'));
  }

  if (failed && !healed) {
    console.error('every attempted heal failed');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  BROKEN_BELOW, RESOLVED_AT, COOLDOWN_MS, CONSECUTIVE_BAD_RUNS,
  runsFor, lastHealAt, clause, isNarrow, shiftedPairs, strainOf,
  buildPrompt, heal, recoveredFields, describe, isBroken, main
};

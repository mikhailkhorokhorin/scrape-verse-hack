'use strict';

function stateOf(run, field) {
  if (run.fields_live.includes(field)) return 'live';
  if (run.fields_infected.includes(field)) return 'infected';
  return 'dead';
}

function sampleOf(run, field) {
  const sample = run.sample || {};
  return Object.prototype.hasOwnProperty.call(sample, field) ? sample[field] : null;
}

function checkField(before, after, field) {
  const from = stateOf(before, field);
  const to = after ? stateOf(after, field) : null;
  return {
    field,
    from,
    to,
    received_before: sampleOf(before, field),
    received_after: after ? sampleOf(after, field) : null,
    passed: to === 'live'
  };
}

function verification(before, after) {
  const broken = [...before.fields_dead, ...before.fields_infected];
  const checks = broken.map((field) => checkField(before, after, field));
  const passed = checks.filter((check) => check.passed).length;
  return {
    ran: after !== null && after !== undefined,
    checked: checks.length,
    passed,
    verdict: verdictOf(checks, after),
    checks
  };
}

function verdictOf(checks, after) {
  if (!after) return 'NOT_RUN';
  if (!checks.length) return 'NOTHING_TO_CHECK';
  const passed = checks.filter((check) => check.passed).length;
  if (passed === checks.length) return 'EVERY_FIELD_BACK';
  if (passed === 0) return 'NOTHING_CAME_BACK';
  return 'PARTIAL';
}

module.exports = { verification, checkField, stateOf, verdictOf };

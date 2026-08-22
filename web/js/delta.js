"use strict";

function fieldStatesOf(sp) {
  const order = (sp && sp.fieldOrder) || [];
  const fields = (sp && sp.fields) || {};
  const states = {};
  for (const field of order) states[field] = fields[field] || "dead";
  return states;
}

function snapshotOf(spiders) {
  const snapshot = {};
  for (const sp of spiders || []) {
    if (!sp || !sp.code) continue;
    snapshot[sp.code] = {
      ts: sp.ts || null,
      integrity: typeof sp.integrity === "number" ? sp.integrity : null,
      afterHeal: sp.afterHeal === true,
      fields: fieldStatesOf(sp),
    };
  }
  return snapshot;
}

function fieldChangesBetween(before, after) {
  const changes = [];
  const names = Object.keys(after || {});
  for (const name of names) {
    const from = before ? before[name] : undefined;
    const to = after[name];
    if (from === undefined || from === to) continue;
    changes.push({ name: name, from: from, to: to });
  }
  return changes;
}

function deltaBetween(previous, spiders) {
  const after = snapshotOf(spiders);
  const changes = [];
  for (const code of Object.keys(after)) {
    const was = previous ? previous[code] : null;
    const now = after[code];
    if (!was) continue;
    const newRun = was.ts !== now.ts;
    const fields = fieldChangesBetween(was.fields, now.fields);
    if (!newRun && fields.length === 0) continue;
    changes.push({
      code: code,
      newRun: newRun,
      afterHeal: newRun && now.afterHeal,
      integrityFrom: was.integrity,
      integrityTo: now.integrity,
      fields: fields,
    });
  }
  return { snapshot: after, changes: changes };
}

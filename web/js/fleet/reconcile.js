"use strict";

function cellKeyOf(html) {
  const match = /^<div class="cell[^"]*" data-cid="([^"]*)"/.exec(String(html || ""));
  return match ? match[1] : null;
}

function cellEntriesOf(htmls) {
  return (htmls || []).map((html) => ({ key: cellKeyOf(html), html: html }));
}

function reconcilePlan(current, next) {
  const have = current || [];
  const want = next || [];
  const keyed = want.every((entry) => entry.key !== null && entry.key !== undefined);
  const sameKeys = have.length === want.length &&
    have.every((entry, i) => entry.key === want[i].key);
  if (!keyed || have.length === 0 || want.length === 0 || !sameKeys) {
    return { mode: "wholesale", writes: want.map((entry) => entry.key) };
  }
  const writes = [];
  for (let i = 0; i < want.length; i += 1) {
    if (have[i].html !== want[i].html) writes.push(want[i].key);
  }
  return { mode: "reconcile", writes: writes };
}

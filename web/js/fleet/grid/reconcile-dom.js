"use strict";

function cellSnapshotOf(grid) {
  return Array.from(grid.children).map((node) => ({
    key: node.dataset ? node.dataset.cid || null : null,
    html: typeof node.__cellHTML === "string" ? node.__cellHTML : null,
  }));
}

function releaseScratch(node) {
  const panel = node.querySelector ? node.querySelector(".panel") : null;
  if (!panel || !panel.__scratch) return;
  const state = panel.__scratch;
  if (state.timer) clearTimeout(state.timer);
  if (state.canvas && state.canvas.parentNode) state.canvas.remove();
  state.ctx = null;
  state.canvas = null;
  panel.__scratch = null;
}

function buildCell(html) {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  const fresh = holder.firstElementChild;
  if (fresh) fresh.__cellHTML = html;
  return fresh;
}

function stampCells(grid, entries) {
  const nodes = Array.from(grid.children);
  let at = 0;
  for (const node of nodes) {
    if (!node.dataset || !node.dataset.cid) continue;
    if (entries[at]) node.__cellHTML = entries[at].html;
    at += 1;
  }
}

function writeWholesale(grid, entries, prefix) {
  grid.innerHTML = (prefix || "") + entries.map((entry) => entry.html).join("");
  stampCells(grid, entries);
}

function writeReconciled(grid, entries, writes) {
  const byKey = new Map();
  for (const node of Array.from(grid.children)) {
    const key = node.dataset ? node.dataset.cid : null;
    if (key) byKey.set(key, node);
  }
  for (const key of writes) {
    const node = byKey.get(key);
    const entry = entries.find((item) => item.key === key);
    if (!node || !entry) continue;
    const fresh = buildCell(entry.html);
    if (!fresh) continue;
    releaseScratch(node);
    node.replaceWith(fresh);
  }
}

function reconcileCells(grid, htmls, prefix) {
  const entries = cellEntriesOf(htmls);
  if (prefix) {
    writeWholesale(grid, entries, prefix);
    return { mode: "wholesale", writes: entries.map((entry) => entry.key) };
  }
  const plan = reconcilePlan(cellSnapshotOf(grid), entries);
  if (plan.mode === "wholesale") writeWholesale(grid, entries, "");
  else writeReconciled(grid, entries, plan.writes);
  return plan;
}

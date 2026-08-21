'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const HISTORY = path.join(ROOT, 'data', 'history.json');
const INCIDENTS = path.join(ROOT, 'data', 'incidents.json');
const CONFIG = path.join(ROOT, 'collectors.json');

const MAX_HISTORY = 2000;

const readJSON = (p, fallback) => {
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); }
  catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
  try { return JSON.parse(raw); }
  catch (err) {
    throw new Error(`${p} exists but is not valid JSON — refusing to overwrite it: ${err.message}`);
  }
};

const writeJSON = (p, data) => {
  const tmp = `${p}.${process.pid}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, JSON.stringify(data, null, 2) + '\n');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, p);
};

const collectors = () => readJSON(CONFIG, { collectors: [] }).collectors;
const history = () => readJSON(HISTORY, []);
const incidents = () => readJSON(INCIDENTS, []);

const appendHistory = (record) => {
  const all = history();
  all.push(record);
  writeJSON(HISTORY, all.slice(-MAX_HISTORY));
};

const nextIncidentId = (existing) => {
  const used = new Set(existing.map((inc) => inc && inc.id));
  let n = existing.length + 1;
  while (used.has(`inc_${String(n).padStart(3, '0')}`)) n += 1;
  return `inc_${String(n).padStart(3, '0')}`;
};

const appendIncident = (record) => {
  const all = incidents();
  all.push({ ...record, id: record.id || nextIncidentId(all) });
  writeJSON(INCIDENTS, all);
};

module.exports = {
  ROOT, HISTORY, INCIDENTS, CONFIG, MAX_HISTORY,
  readJSON, writeJSON, collectors, history, incidents,
  appendHistory, appendIncident, nextIncidentId
};

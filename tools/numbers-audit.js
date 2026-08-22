"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DATA = path.join(__dirname, "..", "data");

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

function runsOf(history) {
  return Array.isArray(history) ? history : history.rows || [];
}

function truth() {
  const runs = runsOf(read("history.json"));
  const incidents = read("incidents.json");
  const meta = read("meta.json");

  const closed = incidents.filter((i) => i.closed_at && i.opened_at);
  const mttrMs = closed.length
    ? closed.reduce((a, i) => a + (Date.parse(i.closed_at) - Date.parse(i.opened_at)), 0) / closed.length
    : 0;

  const opened = incidents.map((i) => Date.parse(i.opened_at)).filter(Number.isFinite);
  const shut = incidents.map((i) => Date.parse(i.closed_at)).filter(Number.isFinite);

  const overnight = runs.filter((r) => {
    const h = new Date(r.ts).getUTCHours();
    return h < 6;
  });

  return {
    scans: runs.length,
    rows: runs.reduce((a, r) => a + (r.rows || 0), 0),
    collectors: new Set(runs.map((r) => r.collector_id)).size,
    incidents: incidents.length,
    spidersBroken: new Set(incidents.map((i) => i.spider)).size,
    heals: incidents.filter((i) => i.resolved).length,
    unchangedIds: incidents.every((i) => typeof i.collector_id === "string" && i.collector_id.startsWith("c_")),
    mttrMinutes: Math.round(mttrMs / 60000),
    spanHours: opened.length && shut.length ? +((Math.max(...shut) - Math.min(...opened)) / 3600000).toFixed(2) : null,
    firstBreakDay: opened.length ? new Date(Math.min(...opened)).toISOString().slice(0, 10) : null,
    overnightScans: overnight.length,
    overnightRows: overnight.reduce((a, r) => a + (r.rows || 0), 0),
    metaTests: meta.tests,
    metaHasHumanGap: Object.prototype.hasOwnProperty.call(meta, "last_human_ts"),
    verificationsPresent: incidents.filter((i) => i.verification && i.verification.checks).length,
  };
}

if (require.main === module) {
  const t = truth();
  Object.keys(t).forEach((k) => console.log(String(k).padEnd(20), t[k]));
}

module.exports = { truth, runsOf };

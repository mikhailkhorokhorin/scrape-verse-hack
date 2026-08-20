"use strict";

/* THWIP — the watch console.
   Ported from docs/prototype.html per T-32. The rendering is the prototype's,
   verbatim where it was already proven; what is new is the adapter that turns
   data/history.json and data/incidents.json into the shape it renders.

   There is no synthetic fallback on the default route. If history is thin the
   console says so — a chart of invented numbers on a project about data
   integrity is the worst possible bug to ship. */

const DATA = { history: "data/history.json", incidents: "data/incidents.json" };
const REFRESH_MS = 60000;
const UNWATCHED_MS = 3 * 60 * 60 * 1000;

const COLOR = {
  healthy: "#B6FF3C",
  degraded: "#FFB800",
  critical: "#FF1E1E",
  reweaving: "#00E5FF",
  unwatched: "#6E6383",
};

const GLYPH = { live: "✓", infected: "⚠", dead: "✗" };

let SPIDERS = [];
let INCIDENTS = [];
let FIELDS = [];
const ERRORS = { history: null, incidents: null };

/* ---------- helpers ---------- */

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function clockOf(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--Z";
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "Z";
}

function agoOf(iso) {
  const diff = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diff)) return "unknown";
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 48) return hours + "h " + (mins % 60) + "m ago";
  return Math.round(hours / 24) + "d ago";
}

function integrityOf(sp) {
  if (typeof sp.integrity === "number") return sp.integrity;
  const v = Object.values(sp.fields);
  const live = v.filter((x) => x === "live").length;
  const inf = v.filter((x) => x === "infected").length;
  return Math.round(((live + 0.5 * inf) / v.length) * 100);
}

function statusOf(sp) {
  if (sp.unwatched) return "unwatched";
  if (sp.reweaving) return "reweaving";
  const i = integrityOf(sp);
  return i >= 90 ? "healthy" : i >= 60 ? "degraded" : "critical";
}

/* ---------- sparkline: area fill, faint baseline, emphasized endpoint ---------- */

/* Under-length history is labelled, never stretched. A six-point series drawn
   edge to edge silently claims to be 48 hours; the count says what it really is.
   Nothing between the real points is invented. */
const FULL_SERIES = 6;

function seriesNote(values) {
  const n = values ? values.length : 0;
  if (n === 0) return '<p class="spark__note spark__note--none">No history yet — first scan pending</p>';
  if (n >= FULL_SERIES) return "";
  return '<p class="spark__note">' + n + " run" + (n === 1 ? "" : "s") + " on record — real points only, nothing interpolated</p>";
}

function sparkline(values, color) {
  const W = 240, H = 44, P = 3;
  if (!values || values.length === 0) {
    return '<div class="spark spark--empty" aria-hidden="true"></div>';
  }
  const points = values.length === 1 ? [values[0], values[0]] : values;

  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  const span = max - min || 1;
  const pt = (v, i) => [P + (i * (W - 2 * P)) / (points.length - 1), H - P - ((v - min) / span) * (H - 2 * P)];
  const pts = points.map(pt);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = "0," + H + " " + line + " " + W + "," + H;
  const last = pts[pts.length - 1];

  return (
    '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<polygon points="' + area + '" fill="' + color + '" opacity="0.16"/>' +
    '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" ' +
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
    (values.length < FULL_SERIES
      ? pts.map((pp) => '<circle cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="2.5" fill="' + color + '"/>').join("")
      : "") +
    '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="' + color + '"/>' +
    "</svg>"
  );
}

/* ---------- empty and failed plates ---------- */

function plateHTML(word, body, kind) {
  return (
    '<div class="plate' + (kind ? " plate--" + kind : "") + '">' +
      '<span class="plate__word">' + word + "</span>" +
      "<p>" + body + "</p>" +
    "</div>"
  );
}

function failPlate(err) {
  return plateHTML(
    "SIGNAL LOST",
    "Could not read <span class=\"mono\">" + esc(err.file) + "</span> — " + esc(err.why) +
      ". This is a fault in the console's own feed, not a reading of the fleet. " +
      "Nothing below is current until it clears.",
    "fail"
  );
}

/* ---------- panel ---------- */

function panelHTML(sp, idx) {
  const integ = integrityOf(sp);
  const st = statusOf(sp);
  const color = COLOR[st];
  const spread = ((100 - integ) / 100).toFixed(2);
  const fields = sp.fieldOrder || FIELDS;

  const chips = fields
    .map((f) => '<span class="chip chip--' + sp.fields[f] + '">' + GLYPH[sp.fields[f]] + " " + esc(f) + "</span>")
    .join("");

  const showSym = !sp.unwatched && Number(spread) > 0.03;
  const scanText = sp.unwatched ? agoOf(sp.ts) : clockOf(sp.ts);
  const compact = st === "healthy" || st === "unwatched";
  const big = st === "critical" || st === "reweaving";
  const readout = sp.unwatched ? "--" : integ + "%";

  const head =
    '<div class="phead">' +
      "<div>" +
        '<h3 class="codename">' + esc(sp.code) + "</h3>" +
        '<p class="universe">' + esc(sp.universe) + "</p>" +
      "</div>" +
      '<span class="badge badge--' + st + '">' + st + "</span>" +
    "</div>";

  const bar = '<div class="bar"><div class="bar__fill" style="width:' + (sp.unwatched ? 0 : integ) + '%"></div></div>';

  const note = seriesNote(sp.series);

  const body = compact
    ? sparkline(sp.series, color) +
      note +
      '<div class="compact-foot">' +
        bar +
        '<span class="integrity__value">' + readout + "</span>" +
      "</div>"
    : '<div class="integrity">' +
        '<span class="integrity__value">' + readout + "</span>" +
        '<span class="label">Integrity</span>' +
      "</div>" +
      sparkline(sp.series, color) +
      note +
      bar +
      '<div class="chips">' + chips + "</div>" +
      '<div class="lastscan">' +
        '<span class="label">Last scan</span>' +
        '<span class="mono" style="font-size:.8125rem">' + scanText + "</span>" +
      "</div>";

  return (
    '<div class="cell cell--' + st + '">' +
    '<button class="panel' + (compact ? " panel--compact" : big ? " panel--big" : "") + ' is-' + st + '" data-idx="' + idx +
      '" style="--spread:' + (sp.unwatched ? 0 : spread) + '">' +
      (showSym ? '<div class="symbiote"><div class="symbiote__body"></div></div>' : "") +
      head +
      body +
    "</button>" +
    "</div>"
  );
}

function renderGrid() {
  const grid = document.getElementById("grid");

  if (SPIDERS.length === 0) {
    /* Neutral waiting state. Fleet integrity is unknown, not zero — a fleet of no
       Spiders has no health, and printing 0% would read as total failure. */
    grid.innerHTML = ERRORS.history
      ? failPlate(ERRORS.history)
      : plateHTML(
          "NO SCANS YET",
          "No runs on record. The watch begins the moment the cron commits its first scan to " +
            '<span class="mono">' + esc(DATA.history) + "</span>. " +
            "Every panel below stays dark until a Spider reports.",
          "wait"
        );
    setReadout("fleet", "--", null);
    setReadout("lastscan", "--", null);
    setReadout("mttr", "--", null);
    return;
  }

  const avg = Math.round(SPIDERS.reduce((a, s) => a + integrityOf(s), 0) / SPIDERS.length);

  grid.innerHTML =
    (ERRORS.history ? failPlate(ERRORS.history) : "") + SPIDERS.map(panelHTML).join("");

  setReadout("fleet", avg + "%", avg >= 90 ? COLOR.healthy : avg >= 60 ? COLOR.degraded : COLOR.critical);

  const newest = SPIDERS.reduce((max, s) => Math.max(max, Date.parse(s.ts) || 0), 0);
  setReadout("lastscan", newest ? clockOf(new Date(newest).toISOString()) : "--", null);
  renderMttr();
}

/* Mean time to re-weave. With no closed incident there is no mean — "--", never
   "0m 0s", which would claim an instant recovery that never happened. */
function renderMttr() {
  const spans = INCIDENTS.map((inc) => inc.mttrMs).filter((ms) => typeof ms === "number" && ms > 0);
  if (spans.length === 0) {
    setReadout("mttr", "--", null);
    return;
  }
  const mean = spans.reduce((a, b) => a + b, 0) / spans.length;
  const mins = Math.floor(mean / 60000);
  const secs = Math.round((mean % 60000) / 1000);
  setReadout("mttr", mins + "m " + secs + "s", COLOR.reweaving);
}

function setReadout(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = color || "";
}

function renderFeed() {
  const feed = document.getElementById("feed");

  if (INCIDENTS.length === 0) {
    /* Zero incidents is good news and the copy should say so plainly, rather than
       reading as a feed that failed to load. */
    feed.innerHTML = ERRORS.incidents
      ? failPlate(ERRORS.incidents)
      : plateHTML(
          "ALL QUIET",
          "No incidents recorded — nothing has dropped below the critical threshold. " +
            "This is the good outcome: every Spider has held.",
          "quiet"
        );
    renderMttr();
    return;
  }

  feed.innerHTML = INCIDENTS.map((inc) =>
    '<article class="incident">' +
      '<div class="incident__top">' +
        '<span class="incident__who">' + esc(inc.who) + "</span>" +
        '<span class="label mono">' + esc(inc.id) + " · " + esc(inc.opened) + "</span>" +
        '<span class="incident__delta"><b>' + inc.before + "% → " + inc.after + "%</b></span>" +
      "</div>" +
      "<p>" + esc(inc.what) + "</p>" +
      '<div class="stages">' +
        inc.stages.map((s) =>
          '<div class="stage"><div class="stage__name">' + esc(s[0]) + '</div><div class="stage__ts">' + esc(s[1]) + "</div></div>"
        ).join("") +
      "</div>" +
    "</article>"
  ).join("");
  renderMttr();
}

/* ---------- detail sheet ---------- */

function jsonHTML(sample, fields) {
  const rows = Object.entries(sample).map(([k, v]) => {
    const state = fields[k];
    const cls = state === "dead" ? "null" : state === "infected" ? "bad" : "s";
    const val = v === null || v === undefined ? "null" : '"' + esc(v) + '"';
    return '  <span class="k">"' + esc(k) + '"</span>: <span class="' + cls + '">' + val + "</span>";
  }).join(",\n");
  return "{\n" + rows + "\n}";
}

function openSheet(idx) {
  const sp = SPIDERS[idx];
  if (!sp) return;

  const fillCol = { live: COLOR.healthy, infected: "#C24BFF", dead: COLOR.critical };
  const fields = sp.fieldOrder || FIELDS;

  const rows = fields.map((f) => {
    const s = sp.fields[f];
    const pct = sp.fillRates && typeof sp.fillRates[f] === "number" ? sp.fillRates[f] : (s === "dead" ? 0 : 100);
    return (
      '<div class="fieldrow">' +
        '<span class="fieldrow__name">' + esc(f) + "</span>" +
        '<span class="fieldrow__fill"><span style="width:' + pct + "%;background:" + fillCol[s] + '"></span></span>' +
        '<span class="fieldrow__pct" style="color:' + fillCol[s] + '">' + s.toUpperCase() + "</span>" +
      "</div>"
    );
  }).join("");

  const runsNote = sp.runs
    ? '<p class="label" style="margin-top:12px">' + sp.runs + " run" + (sp.runs === 1 ? "" : "s") + " on record" +
      (sp.runs < 6 ? " — sparkline shows real points only, nothing interpolated" : "") + "</p>"
    : "";

  document.getElementById("sheet-body").innerHTML =
    '<h2 id="sheet-title" style="font-family:Anton,sans-serif;font-size:2rem;margin:0;letter-spacing:.03em;text-shadow:2px 0 var(--pink),-2px 0 var(--cyan)">' + esc(sp.code) + "</h2>" +
    '<p class="universe" style="margin-top:6px">' + esc(sp.universe) + "</p>" +
    '<p style="margin:16px 0"><span class="label">Collector</span><br><span class="cid">' + esc(sp.cid) + "</span></p>" +
    '<div class="sechead" style="margin:24px 0 8px"><h2>Field diagnosis</h2><span class="rule"></span></div>' +
    rows +
    runsNote +
    '<div class="sechead" style="margin:24px 0 8px"><h2>Last sample</h2><span class="rule"></span></div>' +
    '<pre class="sample">' + jsonHTML(sp.sample, sp.fields) + "</pre>";

  const m = document.getElementById("modal");
  m.hidden = false;
  document.getElementById("sheet-close").focus();
}

function closeSheet() {
  document.getElementById("modal").hidden = true;
}

/* ---------- burst ---------- */

function burst(panel, word, color) {
  const b = document.createElement("div");
  b.className = "burst";
  b.textContent = word;
  b.style.color = color;
  panel.appendChild(b);
  setTimeout(() => b.remove(), 1600);
}

function panelOf(code) {
  const i = SPIDERS.findIndex((s) => s.code === code);
  return document.querySelector('.panel[data-idx="' + i + '"]');
}

/* ---------- real data adapter ---------- */

function stateWord(run, field) {
  if ((run.fields_live || []).includes(field)) return "live";
  if ((run.fields_infected || []).includes(field)) return "infected";
  return "dead";
}

function fillRate(runs, field) {
  if (runs.length === 0) return 0;
  const live = runs.filter((r) => (r.fields_live || []).includes(field)).length;
  const inf = runs.filter((r) => (r.fields_infected || []).includes(field)).length;
  return Math.round(((live + 0.5 * inf) / runs.length) * 100);
}

function adaptHistory(history) {
  const byCollector = new Map();
  for (const run of history) {
    if (!run || !run.collector_id) continue;
    if (!byCollector.has(run.collector_id)) byCollector.set(run.collector_id, []);
    byCollector.get(run.collector_id).push(run);
  }

  const spiders = [];
  for (const runs of byCollector.values()) {
    runs.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const latest = runs[runs.length - 1];
    const order = latest.fields_expected || [];

    const fields = {};
    for (const f of order) fields[f] = stateWord(latest, f);

    const fillRates = {};
    for (const f of order) fillRates[f] = fillRate(runs, f);

    spiders.push({
      code: latest.spider,
      universe: latest.universe,
      cid: latest.collector_id,
      ts: latest.ts,
      integrity: latest.integrity,
      status: latest.status,
      fields: fields,
      fieldOrder: order,
      fillRates: fillRates,
      sample: latest.sample || {},
      series: runs.slice(-48).map((r) => r.integrity),
      runs: runs.length,
      reweaving: latest.status === "REWEAVING",
      unwatched: Date.now() - Date.parse(latest.ts) > UNWATCHED_MS,
    });
  }

  spiders.sort((a, b) => integrityOf(a) - integrityOf(b));
  return spiders;
}

function adaptIncidents(incidents) {
  return incidents
    .slice()
    .sort((a, b) => Date.parse(b.opened_at) - Date.parse(a.opened_at))
    .map((inc) => {
      const anomalies = (inc.anomalies || []).join(" and ") || "no fields";
      const recovered = inc.recovered_fields || [];
      const what =
        "Extraction kept succeeding while " + anomalies + " stopped returning usable values. " +
        (recovered.length
          ? "The re-weave brought back " + recovered.join(" and ") + "."
          : "The re-weave did not restore the affected fields.");

      /* Only a closed incident contributes to MTTR. One still open has no
         time-to-repair yet, and counting it as zero would flatter the number. */
      const opened = Date.parse(inc.opened_at);
      const closed = inc.closed_at ? Date.parse(inc.closed_at) : NaN;
      const mttrMs = Number.isFinite(opened) && Number.isFinite(closed) && closed > opened
        ? closed - opened
        : null;

      return {
        id: inc.id,
        who: inc.spider,
        opened: clockOf(inc.opened_at) + " · " + agoOf(inc.opened_at),
        before: inc.integrity_before,
        after: inc.integrity_after,
        what: inc.summary || what,
        mttrMs: mttrMs,
        stages: (inc.stages || []).map((s) => [s.stage, clockOf(s.ts)]),
      };
    });
}

/* ---------- mock route ---------- */

function loadMock() {
  FIELDS = MOCK_FIELDS;
  SPIDERS = MOCK_SPIDERS.map((sp) => ({
    code: sp.code,
    universe: sp.universe,
    cid: sp.cid,
    fields: sp.fields,
    sample: sp.sample,
    seed: sp.seed,
    ts: new Date().toISOString(),
    series: mockHistory(sp.seed, integrityOf(sp)),
    fieldOrder: MOCK_FIELDS,
    runs: 48,
  }));
  INCIDENTS = MOCK_INCIDENTS;

  renderGrid();
  renderFeed();

  mountMockControls({
    spiders: SPIDERS,
    renderGrid: () => {
      SPIDERS.forEach((sp) => { sp.series = mockHistory(sp.seed, integrityOf(sp)); });
      renderGrid();
    },
    panelOf: panelOf,
    burst: burst,
    COLOR: COLOR,
  });
}

/* ---------- live route ---------- */

/* A fetch that fails and a file that is legitimately empty are different facts and
   the console must not conflate them. Returning [] for both is how a missing file
   turns into a confident "no scans yet" — a lie on a project about data integrity.
   So every load reports which of the two happened, and the renderer says so. */

async function fetchJson(path) {
  try {
    const response = await fetch(path + "?t=" + Date.now(), { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, rows: [], error: "HTTP " + response.status + " " + response.statusText };
    }
    const parsed = await response.json();
    if (!Array.isArray(parsed)) return { ok: false, rows: [], error: "expected a JSON array" };
    return { ok: true, rows: parsed, error: null };
  } catch (error) {
    const cause = error instanceof SyntaxError ? "the file is not valid JSON" : "the file could not be reached";
    return { ok: false, rows: [], error: cause };
  }
}

async function loadLive() {
  const [history, incidents] = await Promise.all([fetchJson(DATA.history), fetchJson(DATA.incidents)]);

  ERRORS.history = history.ok ? null : { file: DATA.history, why: history.error };
  ERRORS.incidents = incidents.ok ? null : { file: DATA.incidents, why: incidents.error };

  SPIDERS = adaptHistory(history.rows);
  INCIDENTS = adaptIncidents(incidents.rows);
  FIELDS = SPIDERS.length ? SPIDERS[0].fieldOrder : [];
  renderGrid();
  renderFeed();
}

/* ---------- events ---------- */

document.getElementById("grid").addEventListener("click", (e) => {
  const p = e.target.closest(".panel");
  if (p) openSheet(Number(p.dataset.idx));
});
document.getElementById("sheet-close").addEventListener("click", closeSheet);
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeSheet();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

if (MOCK) {
  loadMock();
} else {
  loadLive();
  setInterval(loadLive, REFRESH_MS);
}

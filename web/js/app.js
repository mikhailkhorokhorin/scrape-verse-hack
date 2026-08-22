"use strict";

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

async function fetchMeta(path) {
  try {
    const response = await fetch(path + "?t=" + Date.now(), { cache: "no-store" });
    if (!response.ok) return null;
    const parsed = await response.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

let LAST_FINGERPRINT = "";

function fingerprintOf(history, incidents, meta) {
  const lastRun = history.rows[history.rows.length - 1] || {};
  const lastInc = incidents.rows[incidents.rows.length - 1] || {};
  return [history.ok, incidents.ok, history.rows.length, incidents.rows.length,
    lastRun.ts, lastInc.id, lastInc.closed_at, meta ? meta.tests : null].join("|");
}

async function loadLive() {
  const [history, incidents, meta] = await Promise.all([
    fetchJson(DATA.history),
    fetchJson(DATA.incidents),
    fetchMeta(DATA.meta),
  ]);

  const fingerprint = fingerprintOf(history, incidents, meta);
  if (fingerprint === LAST_FINGERPRINT) {
    const newest = SPIDERS.reduce((top, sp) => Math.max(top, Date.parse(sp.ts) || 0), 0);
    renderWatch(newest);
    return;
  }
  LAST_FINGERPRINT = fingerprint;

  ERRORS.history = history.ok ? null : { file: DATA.history, why: history.error };
  ERRORS.incidents = incidents.ok ? null : { file: DATA.incidents, why: incidents.error };

  META = meta;
  RAW_HISTORY = history.rows;
  RAW_INCIDENTS = incidents.rows;
  SPIDERS = adaptHistory(history.rows);
  INCIDENTS = adaptIncidents(incidents.rows);
  attachScars(SPIDERS);
  FIELDS = SPIDERS.length ? SPIDERS[0].fieldOrder : [];
  renderGrid();
  renderDiptych();
  announceLandings(SPIDERS);
  renderFeed();
  renderHaul();
  renderReplay();
  introMaybePlay();
}

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
    seriesTs: mockSeriesTs(MOCK_RUNS),
    fieldOrder: sp.order || MOCK_FIELDS,
    runs: MOCK_RUNS,
  }));
  SPIDERS.forEach((sp) => {
    const runs = sp.series.map((v) => ({ integrity: clampPct(v) }));
    sp.streak = cleanStreak(runs);
    sp.best = bestStreak(runs);
    sp.tracks = mockTracks(sp);
    sp.fillRates = mockFillRates(sp.tracks);
  });
  INCIDENTS = MOCK_INCIDENTS;
  RAW_HISTORY = mockRawHistory(SPIDERS).concat(mockIncidentRuns()).concat(mockHaulRuns());
  attachScars(SPIDERS);

  renderGrid();
  renderDiptych();
  announceLandings(SPIDERS);
  renderFeed();
  renderHaul();
  renderReplay();

  mountMockControls({
    spiders: SPIDERS,
    renderGrid: () => {
      SPIDERS.forEach((sp) => { sp.series = mockHistory(sp.seed, integrityOf(sp)); });
      RAW_HISTORY = mockRawHistory(SPIDERS);
      attachScars(SPIDERS);
      renderGrid();
    },
    panelOf: panelOf,
    burst: burst,
    COLOR: COLOR,
    announce: () => announceLandings(SPIDERS),
  });
}

applyCapture();

const grid = document.getElementById("grid");
bindReveals(grid);
bindSparkHover(grid);
if (typeof scratchBind === "function") scratchBind();
grid.addEventListener("click", (e) => {
  if (e.target.closest(".chip--reveals")) return;
  const p = e.target.closest(".panel");
  if (!p) return;
  if (typeof scratchSwallowsClick === "function" && scratchSwallowsClick(p)) return;
  openSheet(Number(p.dataset.idx));
});
grid.addEventListener("keydown", (e) => {
  if (e.target.closest(".chip--reveals")) return;
  const panel = e.target.closest(".panel");
  if (!panel || e.target !== panel) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    if (sparkStep(panel, e.key === "ArrowRight" ? 1 : -1)) e.preventDefault();
    return;
  }
  if (e.key === "Escape") {
    const frame = panel.querySelector(".sparkframe");
    if (frame) sparkHide(frame);
  }
});
document.getElementById("sheet-close").addEventListener("click", closeSheet);
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeSheet();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
  trapSheetFocus(e);
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    markTallCells(document.getElementById("grid"));
    renderPulse(RAW_HISTORY);
    renderEvidence();
  }, 120);
});

if (MOCK) {
  loadMock();
} else {
  loadLive();
  setInterval(loadLive, REFRESH_MS);
}

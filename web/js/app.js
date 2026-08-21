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

async function loadLive() {
  const [history, incidents] = await Promise.all([fetchJson(DATA.history), fetchJson(DATA.incidents)]);

  ERRORS.history = history.ok ? null : { file: DATA.history, why: history.error };
  ERRORS.incidents = incidents.ok ? null : { file: DATA.incidents, why: incidents.error };

  RAW_HISTORY = history.rows;
  RAW_INCIDENTS = incidents.rows;
  SPIDERS = adaptHistory(history.rows);
  INCIDENTS = adaptIncidents(incidents.rows);
  attachScars(SPIDERS);
  FIELDS = SPIDERS.length ? SPIDERS[0].fieldOrder : [];
  renderGrid();
  renderFeed();
  renderHaul();
  renderReplay();
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
  });
}

applyCapture();

const grid = document.getElementById("grid");
bindReveals(grid);
grid.addEventListener("click", (e) => {
  if (e.target.closest(".chip--reveals")) return;
  const p = e.target.closest(".panel");
  if (p) openSheet(Number(p.dataset.idx));
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
  }, 120);
});

if (MOCK) {
  loadMock();
} else {
  loadLive();
  setInterval(loadLive, REFRESH_MS);
}

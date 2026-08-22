"use strict";

function renderGrid() {
  const grid = document.getElementById("grid");

  if (SPIDERS.length === 0) {
    grid.innerHTML = ERRORS.history
      ? failPlate(ERRORS.history)
      : plateHTML(
          "NOBODY IS WATCHING YET",
          "<p>Three Spiders are out there and none of them has reported. That is not an " +
            "error state — it is the state this product exists to end. A scraper running " +
            "unobserved is the normal condition, and it is why decay lasts for days.</p>" +
            '<p>The watch begins the moment the cron commits its first scan to <span class="mono">' +
            esc(DATA.history) + "</span>. Panels appear one per Spider; the black climbs " +
            "each one by exactly as much Integrity as it has lost.</p>",
          "wait",
          "<span>Scan every <b>30 min</b></span>" +
            "<span>Integrity = <b>(live + &#189; infected) / expected</b></span>" +
            "<span>Repair at <b>&lt;60 twice</b></span>"
        );
    setFleetSpread(null);
    setReadout("fleet", "--", null);
    setReadout("lastscan", "--", null);
    setReadout("mttr", "--", null);
    setCount("fleetcount", 0, "spider");
    renderEvidence();
    renderWatch(0);
    renderPulse(RAW_HISTORY);
    return;
  }

  const avg = Math.round(SPIDERS.reduce((a, s) => a + integrityOf(s), 0) / SPIDERS.length);

  reconcileCells(
    grid,
    SPIDERS.map(panelHTML),
    ERRORS.history ? failPlate(ERRORS.history) : ""
  );

  markTallCells(grid);
  if (typeof scratchMount === "function") scratchMount();
  if (typeof mountRigRest === "function") mountRigRest();
  if (typeof sweepPaint === "function") { sweepPaint(); sweepStart(); }

  const allStale = SPIDERS.every((sp) => sp.unwatched);
  setFleetSpread(allStale ? null : avg);
  setOdometer("fleet", avg + "%", allStale ? COLOR.unwatched : COLOR[gradeOf(avg)]);
  setDelta("fleet", allStale ? null : fleetTrend(avg));
  setSample("fleet", 0);
  if (allStale) setStaleNote("fleet", SPIDERS[0].ts);
  setCount("fleetcount", SPIDERS.length, "spider");
  renderPulse(RAW_HISTORY);

  const bigs = SPIDERS.filter((sp) => {
    const st = statusOf(sp);
    return st === "critical" || st === "reweaving";
  }).length;
  grid.classList.toggle("grid--tight", bigs >= 2);

  const calm = SPIDERS.every((sp) => {
    const st = statusOf(sp);
    return st === "healthy" || st === "unwatched";
  });
  grid.classList.toggle("grid--calm", calm);

  syncTitle();

  const newest = SPIDERS.reduce((max, s) => Math.max(max, Date.parse(s.ts) || 0), 0);
  setReadout("lastscan", newest ? clockOf(new Date(newest).toISOString()) : "--", null);
  renderWatch(newest);
  renderMttr();
  renderEvidence();
}

function setFleetSpread(avg) {
  const el = document.getElementById("fleet-sym");
  if (!el) return;
  const lost = avg === null ? 0 : Math.max(0, (100 - clampPct(avg)) / 100);
  el.style.setProperty("--fleet", lost.toFixed(2));
}

function renderFeed() {
  const feed = document.getElementById("feed");

  if (INCIDENTS.length === 0) {
    feed.innerHTML = ERRORS.incidents
      ? failPlate(ERRORS.incidents)
      : plateHTML(
          "ALL QUIET",
          "<p>No incidents recorded — nothing has dropped below the critical threshold, " +
            "so no re-weave has been called. This is the good outcome, and an empty feed " +
            "is the only honest way to show it.</p>" +
            "<p>When one opens it lands here with the two runs either side of the break, " +
            "field by field, so the moment the values went wrong is on screen rather than " +
            "described.</p>",
          "quiet",
          "<span>Opens below <b>60</b></span>" +
            "<span>Closes on <b>verified</b></span>" +
            "<span>Heal takes <b>up to 15 min</b></span>"
        );
    setCount("feedcount", 0, "incident");
    feed.classList.remove("feed--many", "feed--one");
    renderMttr();
    return;
  }

  setCount("feedcount", INCIDENTS.length, "incident");
  feed.classList.toggle("feed--many", INCIDENTS.length > 1);
  feed.classList.toggle("feed--one", INCIDENTS.length === 1);
  feed.innerHTML = INCIDENTS.map((inc) =>
    '<article class="incident issue" data-inc="' + esc(inc.id) + '">' +
      issueCoverHTML(inc, RAW_HISTORY) +
      '<div class="issue__body">' +
        "<p>" + esc(inc.what) + "</p>" +
        incidentBlastHTML(inc) +
        (inc.infection || "") +
        '<div class="stages">' +
          inc.stages.map((s) =>
            '<div class="stage"><div class="stage__name">' + esc(s[0]) + '</div><div class="stage__ts">' + esc(s[1]) + "</div></div>"
          ).join("") +
        "</div>" +
      "</div>" +
    "</article>"
  ).join("");
  renderMttr();
  if (typeof routeRefresh === "function") routeRefresh();
}

function blastFieldList(fields) {
  if (!fields.length) return "a broken field";
  if (fields.length === 1) return "a broken <code>" + esc(fields[0]) + "</code>";
  const marked = fields.map((f) => "<code>" + esc(f) + "</code>");
  return "broken " + marked.slice(0, -1).join(", ") + " and " + marked[marked.length - 1];
}

function incidentBlastHTML(inc) {
  const blast = inc.blast;
  if (!blast) return "";
  if (blast.open) {
    return '<p class="blast"><b class="blast__n">counting…</b> rows have shipped with ' +
      blastFieldList(inc.anomalies || []) + " while this Spider stays infected.</p>";
  }
  return '<p class="blast"><b class="blast__n" data-rows="' + blast.rows + '">' +
    groupNum(blast.rows) + (blast.rows === 1 ? " row" : " rows") +
    "</b> shipped with " + blastFieldList(inc.anomalies || []) +
    " across " + blast.runs + " scan" + (blast.runs === 1 ? "" : "s") +
    " before the re-weave landed.</p>";
}

function markTallCells(grid) {
  const cells = Array.from(grid.children);
  cells.forEach((cell) => cell.classList.remove("cell--tall", "cell--even"));
  if (window.innerWidth < 768) return;

  const rows = new Map();
  for (const cell of cells) {
    if (!cell.querySelector(".panel")) continue;
    const top = cell.offsetTop;
    if (!rows.has(top)) rows.set(top, []);
    rows.get(top).push(cell);
  }

  for (const row of rows.values()) {
    if (row.length < 2) continue;
    const heights = row.map((c) => c.querySelector(".panel").offsetHeight);
    const tallest = Math.max(...heights);
    const rag = tallest - Math.min(...heights);
    for (const cell of row) {
      const panel = cell.querySelector(".panel");
      if (tallest - panel.offsetHeight >= 120) cell.classList.add("cell--tall");
    }
    if (rag > 0 && rag < 120) row.forEach((cell) => cell.classList.add("cell--even"));
  }
}

function fleetTrend(avg) {
  const previous = LAST_FLEET;
  LAST_FLEET = avg;
  if (previous === null) return null;
  return { value: avg - previous, why: "change since the previous refresh a minute ago" };
}


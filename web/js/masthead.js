"use strict";

function renderMttr() {
  const spans = INCIDENTS.map((inc) => inc.mttrMs).filter((ms) => typeof ms === "number" && ms > 0);
  if (spans.length === 0) {
    setReadout("mttr", "--", null);
    setSample("mttr", 0);
    return;
  }
  const mean = spans.reduce((a, b) => a + b, 0) / spans.length;
  const mins = Math.floor(mean / 60000);
  const secs = Math.round((mean % 60000) / 1000);
  setReadout("mttr", mins + "m " + secs + "s", COLOR.reweaving);
  setSample("mttr", spans.length);
}

function renderWatch(newest) {
  const el = document.querySelector(".readouts .readout:last-child .readout__value");
  if (!el) return;
  if (!Number.isFinite(newest) || newest <= 0) {
    el.className = "readout__value watch watch--lost";
    el.textContent = "NO SIGNAL";
    el.title = "no scan has ever landed in " + DATA.history;
    return;
  }
  const iso = new Date(newest).toISOString();
  if (Date.now() - newest > UNWATCHED_MS) {
    el.className = "readout__value watch watch--stale";
    el.textContent = "STALE · " + agoOf(iso);
    el.title = "the last scan is older than " + UNWATCHED_MS / 3600000 +
      "h — the cron has stopped and nothing on this page is current";
    return;
  }
  el.className = "readout__value watch watch--live";
  el.innerHTML = '<span class="pulse" aria-hidden="true"></span>LIVE';
  el.title = "last scan " + agoOf(iso) + ", inside the " +
    UNWATCHED_MS / 3600000 + "h watch window";
}

function shortCid(cid) {
  const text = String(cid || "");
  if (text.length <= CID_SHORT_LEN) return text;
  return text.slice(0, CID_SHORT_LEN) + "…";
}

function newestCid(spiders) {
  let best = null;
  let top = -Infinity;
  for (const sp of spiders) {
    if (!sp || !sp.cid) continue;
    const ts = Date.parse(sp.ts);
    const at = Number.isFinite(ts) ? ts : -Infinity;
    if (best === null || at >= top) { top = at; best = sp.cid; }
  }
  return best;
}

function evidenceParts(spiders, incidents, history, meta, terse) {
  const parts = [];
  parts.push(spiders.length + (terse ? " coll" : " collector" + (spiders.length === 1 ? "" : "s")));

  const healed = incidents.filter((inc) => inc.verified).length;
  parts.push(healed + (terse ? " healed" : " incident" + (healed === 1 ? "" : "s") + " healed"));

  const rows = history.reduce((total, run) => {
    const n = Number(run && run.rows);
    return total + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
  parts.push(groupNum(rows) + " row" + (rows === 1 ? "" : "s"));

  const tests = meta && Number(meta.tests);
  if (Number.isFinite(tests) && tests > 0) {
    parts.push(groupNum(tests) + " test" + (tests === 1 ? "" : "s"));
  }

  const cid = newestCid(spiders);
  if (cid) parts.push(shortCid(cid));

  return parts;
}

function renderEvidence() {
  const el = document.getElementById("evidence");
  if (!el) return;
  if (SPIDERS.length === 0) { el.hidden = true; return; }
  const terse = window.innerWidth <= EVIDENCE_TERSE_PX;
  const parts = evidenceParts(SPIDERS, INCIDENTS, RAW_HISTORY, META, terse);
  el.hidden = false;
  el.textContent = parts.join(" · ");
  el.title = META && Number(META.tests) > 0
    ? "every number is read from data/history.json, data/incidents.json and data/meta.json"
    : "every number is read from data/history.json and data/incidents.json — " +
      "the test count is missing because data/meta.json could not be read";
}

function setSample(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  const old = el.querySelector(".readout__n");
  if (old) old.remove();
  if (!n) return;
  const span = document.createElement("span");
  span.className = "readout__n";
  span.className = "readout__n";
  span.textContent = n === 1 ? "from 1 re-weave" : "mean of " + n + " re-weaves";
  span.title = n === 1
    ? "a single sample — this is that one span, not an average"
    : "arithmetic mean of " + n + " closed incidents";
  el.appendChild(span);
}

function setStaleNote(id, ts) {
  const el = document.getElementById(id);
  if (!el) return;
  const span = document.createElement("span");
  span.className = "readout__n";
  span.className = "readout__n";
  span.textContent = "as of " + agoOf(ts) + " — not current";
  span.title = "every Spider is past the " + UNWATCHED_MS / 3600000 +
    "h watch window, so this is the last value seen, not a live reading";
  el.appendChild(span);
}

function setDelta(id, trend) {
  const el = document.getElementById(id);
  if (!el) return;
  const old = el.querySelector(".readout__delta");
  if (old) old.remove();
  if (!trend || !Number.isFinite(trend.value) || trend.value === 0) return;
  const span = document.createElement("span");
  span.className = "readout__delta readout__delta--" + (trend.value > 0 ? "up" : "down");
  span.textContent = (trend.value > 0 ? "↑" : "↓") + Math.abs(trend.value);
  span.title = trend.why;
  el.appendChild(span);
}

function setCount(id, n, noun) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!n) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = n + " " + noun + (n === 1 ? "" : "s");
}

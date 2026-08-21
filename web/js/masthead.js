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

"use strict";

const OPEN_TICK_MS = 60000;
const OPEN_NIGHT_START_H = 0;
const OPEN_NIGHT_END_H = 6;
const OPEN_MORNING_END_H = 12;

function openGapOf(fromMs, nowMs) {
  const diff = nowMs - fromMs;
  if (!Number.isFinite(diff) || diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  if (days >= 1) {
    const hours = Math.floor((mins - days * 1440) / 60);
    return days + "d " + hours + "h";
  }
  const hours = Math.floor(mins / 60);
  if (hours >= 1) return hours + "h " + (mins % 60) + "m";
  return mins + "m";
}

function openHumanGap(meta, nowMs) {
  if (!meta || typeof meta !== "object") return null;
  const raw = meta.last_human_ts;
  if (typeof raw !== "string" || raw === "") return null;
  const at = Date.parse(raw);
  if (!Number.isFinite(at)) return null;
  return openGapOf(at, nowMs);
}

function openIsOvernight(run) {
  const at = Date.parse(run && run.ts);
  if (!Number.isFinite(at)) return false;
  const hour = new Date(at).getUTCHours();
  return hour >= OPEN_NIGHT_START_H && hour < OPEN_NIGHT_END_H;
}

function openRunRows(run) {
  const n = Number(run && run.rows);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function openCountersOf(history, incidents, nightOnly) {
  const runs = (Array.isArray(history) ? history : [])
    .filter((run) => run && run.ts && (!nightOnly || openIsOvernight(run)));
  const scans = runs.length;
  const rows = runs.reduce((total, run) => total + openRunRows(run), 0);

  const list = Array.isArray(incidents) ? incidents : [];
  const inWindow = nightOnly
    ? list.filter((inc) => openIsOvernight({ ts: inc && inc.opened_at }))
    : list;
  const breaks = inWindow.filter((inc) => inc && inc.opened_at).length;
  const heals = inWindow.filter((inc) =>
    inc && (inc.stages || []).some((st) => st && st.stage === "VERIFIED")).length;

  return { scans: scans, rows: rows, breaks: breaks, heals: heals };
}

function openIsMorning(nowMs) {
  const hour = new Date(nowMs).getUTCHours();
  return hour >= OPEN_NIGHT_END_H && hour < OPEN_MORNING_END_H;
}

function openSpanOf(incidents, nowMs) {
  const list = (Array.isArray(incidents) ? incidents : [])
    .filter((inc) => inc && Number.isFinite(Date.parse(inc.opened_at)));
  if (list.length === 0) return null;
  const opened = list.map((inc) => Date.parse(inc.opened_at)).sort((a, b) => a - b);
  const ends = list.map((inc) => {
    const closed = Date.parse(inc.closed_at);
    return Number.isFinite(closed) ? closed : nowMs;
  });
  const first = opened[0];
  const last = Math.max.apply(null, ends);
  const hours = Math.max(1, Math.round((last - first) / 3600000));
  const day = new Date(first).toISOString().slice(0, 10);
  const sameDay = opened.every((at) => new Date(at).toISOString().slice(0, 10) === day);
  return { count: opened.length, hours: hours, sameDay: sameDay, firstMs: first };
}

const OPEN_WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
  "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE"];

function openWordFor(n) {
  const i = Number(n);
  if (!Number.isFinite(i) || i < 0 || i >= OPEN_WORDS.length) return groupNum(i);
  return OPEN_WORDS[i];
}

const OPEN_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function openDayOf(ms) {
  const d = new Date(ms);
  return d.getUTCDate() + " " + OPEN_MONTHS[d.getUTCMonth()];
}

function openThesisOf(incidents, spiders, nowMs) {
  const span = openSpanOf(incidents, nowMs);
  if (!span) return null;
  const taken = new Set((Array.isArray(incidents) ? incidents : [])
    .map((inc) => inc && inc.spider).filter(Boolean));
  const fleet = Array.isArray(spiders) ? spiders.length : 0;
  const every = fleet > 0 && taken.size >= fleet;
  const lead = every
    ? "EVERY SPIDER ON THIS PAGE HAS BEEN TAKEN."
    : openWordFor(taken.size) + " OF " + openWordFor(fleet) + " SPIDERS HAVE BEEN TAKEN.";
  const where = openWordFor(span.count) + (span.sameDay ? ", ON " + openDayOf(span.firstMs) : "") +
    ", INSIDE " + openWordFor(span.hours) + (span.hours === 1 ? " HOUR" : " HOURS");
  return lead + " ALL " + where + ".";
}

function openCounterLine(history, incidents, nowMs) {
  const night = openIsMorning(nowMs);
  const counts = openCountersOf(history, incidents, night);
  if (counts.scans === 0 && counts.rows === 0 && counts.breaks === 0) return null;
  const head = night ? "WHILE YOU SLEPT" : "WHILE YOU WERE AWAY";
  const parts = [
    groupNum(counts.scans) + (counts.scans === 1 ? " SCAN" : " SCANS"),
    groupNum(counts.rows) + (counts.rows === 1 ? " ROW" : " ROWS"),
    groupNum(counts.breaks) + (counts.breaks === 1 ? " BREAK" : " BREAKS"),
    groupNum(counts.heals) + (counts.heals === 1 ? " HEAL" : " HEALS"),
  ];
  return { head: head, body: parts.join(" · "), night: night };
}

const OPEN_CLOSE = "YOU DO NOT PREVENT THE BREAK. YOU COME BACK FROM IT, AND YOU RECORD IT.";

function openGapHTML(gap) {
  return '<p class="open__line open__line--gap">' +
    '<span class="open__say">NOBODY HAS LOOKED AT THIS FLEET IN </span>' +
    '<span class="open__num mono" id="open-gap">' + esc(gap) + "</span>" +
    "</p>";
}

function openCountHTML(line) {
  return '<p class="open__line open__line--count">' +
    '<span class="open__head">' + esc(line.head) + "</span>" +
    '<span class="open__dash" aria-hidden="true"> — </span>' +
    '<span class="open__num mono">' + esc(line.body) + "</span>" +
    "</p>";
}

function openThesisHTML(thesis) {
  return '<p class="open__line open__line--thesis">' + esc(thesis) + "</p>" +
    '<p class="open__line open__line--close">' + esc(OPEN_CLOSE) + "</p>";
}

function openMarkup(state) {
  const blocks = [];
  if (state.gap) blocks.push(openGapHTML(state.gap));
  if (state.count) blocks.push(openCountHTML(state.count));
  if (state.thesis) blocks.push(openThesisHTML(state.thesis));
  return blocks.join("");
}

function openStateOf(meta, history, incidents, spiders, nowMs) {
  return {
    gap: openHumanGap(meta, nowMs),
    count: openCounterLine(history, incidents, nowMs),
    thesis: openThesisOf(incidents, spiders, nowMs),
  };
}

function renderOpen() {
  const root = document.getElementById("open");
  if (!root) return;
  const state = openStateOf(META, RAW_HISTORY, RAW_INCIDENTS, SPIDERS, Date.now());
  const html = openMarkup(state);
  if (!html) { root.hidden = true; root.innerHTML = ""; return; }
  root.hidden = false;
  if (root.dataset.open === html) return;
  root.dataset.open = html;
  root.innerHTML = html;
}

function openTick() {
  const root = document.getElementById("open");
  if (!root || root.hidden) return;
  const el = document.getElementById("open-gap");
  const gap = openHumanGap(META, Date.now());
  if (!el || !gap) { renderOpen(); return; }
  if (el.textContent !== gap) el.textContent = gap;
}

function openWatchData() {
  const main = document.getElementById("main");
  if (!main || typeof MutationObserver === "undefined") return;
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; renderOpen(); }, 0);
  });
  observer.observe(main, { childList: true, subtree: true });
}

function mountOpen() {
  if (typeof document === "undefined" || !document.getElementById) return;
  renderOpen();
  openWatchData();
  setInterval(openTick, OPEN_TICK_MS);
}

if (typeof document !== "undefined" && document.addEventListener) {
  mountOpen();
}

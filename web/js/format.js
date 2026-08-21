"use strict";

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

function clampPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function gradeOf(integrity) {
  if (integrity >= HEALTHY_MIN) return "healthy";
  if (integrity >= DEGRADED_MIN) return "degraded";
  return "critical";
}

function integrityFromStates(states) {
  const values = Object.values(states || {});
  if (!values.length) return 0;
  const live = values.filter((state) => state === "live").length;
  const infected = values.filter((state) => state === "infected").length;
  return clampPct(((live + INFECTED_CREDIT * infected) / values.length) * 100);
}

function integrityOf(spider) {
  if (typeof spider.integrity === "number") return clampPct(spider.integrity);
  return integrityFromStates(spider.fields);
}

function statusOf(spider) {
  if (spider.unwatched) return "unwatched";
  if (spider.reweaving) return "reweaving";
  return gradeOf(integrityOf(spider));
}

function setReadout(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = color || "";
}

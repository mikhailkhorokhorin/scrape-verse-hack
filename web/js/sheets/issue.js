"use strict";

const ISSUE_ID_RE = /^inc_(\d+)$/;

function issueNumberOf(id) {
  const match = ISSUE_ID_RE.exec(String(id === null || id === undefined ? "" : id).trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function issueLabelOf(id) {
  const n = issueNumberOf(id);
  return n === null ? "ISSUE" : "ISSUE #" + n;
}

function issueHashOf(id) {
  const n = issueNumberOf(id);
  return n === null ? "" : "#" + String(id).trim();
}

function parseIssueHash(hash) {
  if (typeof hash !== "string") return null;
  const raw = hash.charAt(0) === "#" ? hash.slice(1) : hash;
  if (raw === "") return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch (error) {
    return null;
  }
  return issueNumberOf(decoded) === null ? null : decoded.trim();
}

function findIssue(incidents, id) {
  if (!Array.isArray(incidents) || !id) return null;
  return incidents.find((inc) => inc && inc.id === id) || null;
}

function worstRunOf(history, incident) {
  if (!Array.isArray(history) || !incident) return null;
  const opened = Date.parse(incident.opened_at);
  if (!Number.isFinite(opened)) return null;
  const closed = incident.closed_at ? Date.parse(incident.closed_at) : Date.now();
  const inWindow = history.filter((run) => {
    if (!run || run.collector_id !== incident.collector_id) return false;
    const ts = Date.parse(run.ts);
    return Number.isFinite(ts) && ts >= opened && ts <= closed;
  });
  if (inWindow.length === 0) return null;
  return inWindow.reduce((worst, run) =>
    clampPct(run.integrity) < clampPct(worst.integrity) ? run : worst);
}

function issueDeltaHTML(inc) {
  const from = Number.isFinite(Number(inc.before)) && inc.before !== null
    ? clampPct(inc.before) + "%"
    : "—";
  const to = Number.isFinite(Number(inc.after)) && inc.after !== null
    ? clampPct(inc.after) + "%"
    : "still open";
  return (
    '<p class="issue__delta mono">' +
      '<span class="issue__from">' + esc(from) + "</span>" +
      '<span class="issue__arrow" aria-hidden="true">&rarr;</span>' +
      '<span class="issue__to">' + esc(to) + "</span>" +
    "</p>"
  );
}

function issueSubtitleHTML(strain) {
  if (!strain || !STRAIN_GLOSS[strain]) return "";
  return (
    '<p class="issue__sub">&ldquo;' + esc(STRAIN_GLOSS[strain]) + "&rdquo;</p>"
  );
}

function issueArtHTML(inc, history) {
  const record = worstRunOf(history, findIssue(RAW_INCIDENTS, inc.id));
  if (!record || typeof spiderFromRecord !== "function") return "";
  const sp = spiderFromRecord(record, history);
  if (!sp) return "";
  return (
    '<div class="issue__art" aria-hidden="true">' +
      '<div class="issue__rig">' + rigSVG(sp, statusOf(sp)) + "</div>" +
      '<p class="issue__at mono">' + esc(clampPct(record.integrity)) + "% &middot; " +
        esc(clockOf(record.ts)) + "</p>" +
    "</div>"
  );
}

function issueStampHTML(inc) {
  const strain = inc.strain ? esc(inc.strain) : "UNCLASSIFIED";
  const cls = inc.strain ? " issue__strain--" + esc(String(inc.strain).toLowerCase()) : "";
  return (
    '<p class="issue__stamp">' +
      '<span class="issue__strain' + cls + '">' + strain + "</span>" +
      '<span class="issue__when mono">' + esc(inc.opened) + "</span>" +
    "</p>"
  );
}

function issueLinkHTML(inc) {
  const hash = issueHashOf(inc.id);
  if (!hash) return "";
  return (
    '<a class="issue__link mono" href="' + esc(hash) + '" data-issue="' + esc(inc.id) + '">' +
      esc(inc.id) +
    "</a>"
  );
}

function issueCoverHTML(inc, history) {
  return (
    '<header class="issue__cover">' +
      '<p class="issue__no">' + esc(issueLabelOf(inc.id)) + "</p>" +
      '<h3 class="issue__who">' + esc(inc.who) + "</h3>" +
      wildBadgeHTML(inc) +
      issueSubtitleHTML(inc.strain) +
      issueArtHTML(inc, history) +
      issueStampHTML(inc) +
      issueDeltaHTML(inc) +
      issueLinkHTML(inc) +
    "</header>"
  );
}

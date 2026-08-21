"use strict";

const NOPRIZE_ID = "inc_003";
let NOPRIZE_OPEN = false;

function noPrizeRecord(rows) {
  const found = (rows || []).find((row) => row && row.id === NOPRIZE_ID);
  if (!found) return null;
  if (typeof found.summary !== "string" || found.summary === "") return null;
  return found;
}

function noPrizeDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return String(d.getUTCDate()).padStart(2, "0") + " " + months[d.getUTCMonth()];
}

function noPrizeHeldFor(openedAt, closedAt) {
  const open = Date.parse(openedAt);
  const close = Date.parse(closedAt);
  if (!Number.isFinite(open) || !Number.isFinite(close) || close < open) return "";
  const mins = Math.round((close - open) / 60000);
  if (mins < 60) return mins + "m";
  return Math.floor(mins / 60) + "h " + (mins % 60) + "m";
}

function noPrizeStampHTML(inc) {
  const held = noPrizeHeldFor(inc.opened_at, inc.closed_at);
  return (
    '<p class="noprize__stamp">' +
      '<span class="noprize__date">' + esc(noPrizeDay(inc.opened_at)) + "</span>" +
      '<span class="noprize__rule" aria-hidden="true"></span>' +
      '<span class="noprize__held">FALSE ALARM HELD FOR ' + esc(held) + "</span>" +
    "</p>"
  );
}

function noPrizeLetterHTML(inc) {
  return (
    '<div class="noprize__letter">' +
      '<p class="noprize__cite">THE WINNING EXPLANATION &mdash; ' +
        esc(inc.spider) + ", INCIDENT " + esc(inc.id) + "</p>" +
      '<blockquote class="noprize__quote"><p>' + esc(inc.summary) + "</p></blockquote>" +
      '<dl class="noprize__times">' +
        "<div><dt>OPENED</dt><dd>" + esc(inc.opened_at) + "</dd></div>" +
        "<div><dt>CLOSED</dt><dd>" + esc(inc.closed_at) + "</dd></div>" +
      "</dl>" +
      '<p class="noprize__foot">The diagnosis above is kept on disk exactly as the ' +
        "watcher wrote it. We did not edit the record after we understood it.</p>" +
    "</div>"
  );
}

function noPrizeHTML(inc) {
  if (!inc) return "";
  return (
    '<section class="noprize" aria-labelledby="noprize-title">' +
      '<div class="noprize__envelope">' +
        '<p class="noprize__kicker">NO-PRIZE</p>' +
        '<h3 class="noprize__title" id="noprize-title">AWARDED TO: THE WATCH' +
          '<span class="noprize__for">FOR CATCHING ITS OWN MISTAKE</span></h3>' +
        noPrizeStampHTML(inc) +
        '<button class="noprize__seal" type="button" id="noprize-seal" ' +
          'aria-expanded="false" aria-controls="noprize-panel">' +
          '<span class="noprize__sealword">OPEN</span>' +
          '<span class="noprize__sealhint">the envelope is empty. the letter is not.</span>' +
        "</button>" +
      "</div>" +
      '<div class="noprize__panel" id="noprize-panel" hidden>' +
        noPrizeLetterHTML(inc) +
      "</div>" +
    "</section>"
  );
}

function noPrizeToggle(seal, panel, open) {
  seal.setAttribute("aria-expanded", open ? "true" : "false");
  panel.hidden = !open;
  const word = seal.querySelector(".noprize__sealword");
  if (word) word.textContent = open ? "CLOSE" : "OPEN";
  seal.closest(".noprize").classList.toggle("is-open", open);
}

function noPrizeSlot() {
  const existing = document.getElementById("noprize-slot");
  if (existing) return existing;
  const feed = document.getElementById("feed");
  if (!feed || !feed.parentNode) return null;
  const slot = document.createElement("div");
  slot.id = "noprize-slot";
  feed.parentNode.insertBefore(slot, feed.nextSibling);
  return slot;
}

function mountNoPrize() {
  const slot = noPrizeSlot();
  if (!slot) return;
  const inc = noPrizeRecord(RAW_INCIDENTS);
  const wasOpen = NOPRIZE_OPEN;
  const html = noPrizeHTML(inc);
  if (slot.innerHTML === html && slot.firstChild) return;
  slot.innerHTML = html;
  const seal = document.getElementById("noprize-seal");
  const panel = document.getElementById("noprize-panel");
  if (!seal || !panel) return;
  noPrizeToggle(seal, panel, wasOpen);
  seal.addEventListener("click", () => {
    NOPRIZE_OPEN = seal.getAttribute("aria-expanded") !== "true";
    noPrizeToggle(seal, panel, NOPRIZE_OPEN);
  });
}

if (typeof document === "object" && document.getElementById) {
  const target = document.getElementById("feed");
  if (target) new MutationObserver(mountNoPrize).observe(target, { childList: true });
}

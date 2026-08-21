"use strict";

const CAPTION_SECTIONS = [
  { head: "watchhead", source: "fleetcount", kind: "watch" },
  { head: "haulcaption", source: "haulrows", kind: "haul" },
  { head: "replaycaption", source: "replayhead", kind: "replay" },
  { head: "feedcaption", source: "feedcount", kind: "feed" },
];

function captionCount(text) {
  const match = /-?\d[\d,]*/.exec(String(text === null || text === undefined ? "" : text));
  if (!match) return null;
  const n = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function captionWatch(n) {
  if (n === null) return { title: "THE WATCH", lede: "NOBODY IS WATCHING YET" };
  if (n === 0) return { title: "THE WATCH", lede: "NOBODY IS WATCHING YET" };
  return {
    title: "THE WATCH",
    num: groupNum(n),
    lede: n === 1 ? "SPIDER UNDER WATCH" : "SPIDERS UNDER WATCH",
  };
}

function captionHaul(n) {
  if (n === null || n === 0) return { title: "THE HAUL", lede: "NOTHING IN THE BAG YET" };
  return {
    title: "MEANWHILE",
    num: groupNum(n),
    lede: n === 1 ? "ROW SHIPPED CLEAN" : "ROWS SHIPPED CLEAN",
  };
}

function captionFeed(n) {
  if (n === null || n === 0) return { title: "INCIDENT FEED", lede: "ALL QUIET" };
  return {
    title: "INCIDENT FEED",
    num: groupNum(n),
    lede: n === 1 ? "BREAK ON RECORD" : "BREAKS ON RECORD",
  };
}

function captionReplay(text) {
  const span = String(text === null || text === undefined ? "" : text)
    .replace(/\s*replayed\s*$/i, "")
    .trim();
  if (!span) return { title: "INCIDENT REPLAY", lede: "NO BREAK TO REPLAY" };
  return { title: "INCIDENT REPLAY", num: span, lede: "FROM BREAK TO REPAIR" };
}

function captionFor(kind, raw) {
  if (kind === "replay") return captionReplay(raw);
  const n = captionCount(raw);
  if (kind === "watch") return captionWatch(n);
  if (kind === "haul") return captionHaul(n);
  return captionFeed(n);
}

function captionHTML(caption) {
  return (
    '<span class="caption__title">' + esc(caption.title) + "</span>" +
    (caption.num ? '<span class="caption__num">' + esc(caption.num) + "</span>" : "") +
    '<span class="caption__lede">' + esc(caption.lede) + "</span>"
  );
}

function captionSourceText(id) {
  if (id === "haulrows") {
    const cell = document.querySelector(".haultotals__item b");
    return cell ? cell.textContent : "";
  }
  const el = document.getElementById(id);
  if (!el || el.hidden) return "";
  return el.textContent;
}

function paintCaption(section) {
  const head = document.getElementById(section.head);
  if (!head) return;
  const caption = captionFor(section.kind, captionSourceText(section.source));
  const next = captionHTML(caption);
  if (head.dataset.caption === next) return;
  head.dataset.caption = next;
  head.innerHTML = next;
  head.classList.toggle("caption--quiet", !caption.num);
}

function paintCaptions() {
  CAPTION_SECTIONS.forEach(paintCaption);
}

function mountCaptions() {
  if (typeof document === "undefined" || !document.getElementById) return;
  const main = document.getElementById("main");
  if (!main) return;
  paintCaptions();
  if (typeof MutationObserver === "undefined") return;
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; paintCaptions(); }, 0);
  });
  observer.observe(main, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["hidden"],
  });
}

if (typeof document !== "undefined" && document.addEventListener) {
  mountCaptions();
}

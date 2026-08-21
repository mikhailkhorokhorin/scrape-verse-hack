"use strict";

const CAPTURE = new URLSearchParams(location.search).get("capture") === "1";
const BASE_TITLE = "THWIP Watch";

function applyCapture() {
  if (CAPTURE) document.documentElement.classList.add("is-capture");
}

const MASK_PATH = "M16 3 4 8v8c0 6 5 10 12 13 7-3 12-7 12-13V8z";

function faviconFor(integrity, open) {
  const pct = clampPct(integrity);
  const lit = COLOR[gradeOf(pct)];
  const frame = open ? COLOR.critical : "#0B0A10";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<rect width="32" height="32" fill="' + frame + '"/>' +
    '<clipPath id="m"><path d="' + MASK_PATH + '"/></clipPath>' +
    '<path d="' + MASK_PATH + '" fill="#050408" stroke="#F4EFE4" stroke-width="2"/>' +
    '<g clip-path="url(#m)">' +
    '<rect x="6" y="12" width="20" height="7" fill="#2C1140"/>' +
    '<rect x="6" y="12" width="' + Math.round((pct / 100) * 20) + '" height="7" fill="' + lit + '"/>' +
    "</g></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function fleetAverage() {
  if (!SPIDERS.length) return 0;
  return Math.round(SPIDERS.reduce((a, sp) => a + integrityOf(sp), 0) / SPIDERS.length);
}

function syncTitle() {
  const open = SPIDERS.filter((sp) => {
    const st = statusOf(sp);
    return st === "critical" || st === "reweaving";
  }).length;

  const base = (MOCK ? "[MOCK] " : "") + BASE_TITLE;
  document.title = open ? "(" + open + ") " + base + " — attention" : base;

  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = faviconFor(fleetAverage(), open);
}

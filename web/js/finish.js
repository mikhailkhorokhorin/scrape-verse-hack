"use strict";

const CAPTURE = new URLSearchParams(location.search).get("capture") === "1";
const BASE_TITLE = "THWIP Watch";

function applyCapture() {
  if (CAPTURE) document.documentElement.classList.add("is-capture");
}

function faviconFor(open) {
  const bg = open ? "#FF1E1E" : "#B6FF3C";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<rect width="32" height="32" fill="#0B0A10"/>' +
    '<rect x="4" y="4" width="24" height="24" fill="' + bg + '"/>' +
    (open
      ? '<rect x="4" y="18" width="24" height="10" fill="#050408"/>'
      : '<rect x="4" y="25" width="24" height="3" fill="#050408"/>') +
    "</svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
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
  link.href = faviconFor(open);
}

"use strict";

const MANUAL_META_URL = "data/meta.json";
const MANUAL_FALLBACK_META = { tests: 1149 };

function manualSlot() {
  return document.getElementById("ad-slot");
}

function manualMountAd(meta) {
  const slot = manualSlot();
  if (!slot) return false;
  slot.innerHTML = adHTML(meta);
  adSetCount(meta);
  return true;
}

function manualUsableMeta(meta) {
  return adTestCount(meta) === null ? MANUAL_FALLBACK_META : meta;
}

function manualLoad() {
  if (!manualMountAd(MANUAL_FALLBACK_META)) return Promise.resolve(null);
  return fetch(MANUAL_META_URL, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((meta) => {
      const usable = manualUsableMeta(meta);
      adSetCount(usable);
      manualMountAd(usable);
      return usable;
    })
    .catch(() => MANUAL_FALLBACK_META);
}

if (typeof document === "object" && document.getElementById) manualLoad();

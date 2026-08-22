"use strict";

const AD_REPO = "https://github.com/mikhailkhorokhorin/scrape-verse-hack";

const AD_FREE_TOOLS = [
  ["fleet_status", "every Spider's Integrity, live fields and how stale the scan is"],
  ["spider_history", "one Spider's whole decline, run by run, post-heal runs marked"],
  ["incident_log", "what broke, which strain, Integrity before and after the heal"],
  ["heal_receipt", "every phase of one repair, timestamped, on an unchanged collector id"],
  ["evidence_report", "the whole trail for one incident, with sha256 digests you can recompute"],
  ["numbers_audit", "every number on this page, recomputed from the committed JSON"],
];

const AD_PAID_TOOLS = [
  ["scan_fleet", "scrapes the fleet for real and scores what comes back"],
  ["heal_spider", "diagnoses a break, re-weaves it, verifies with a fresh scrape"],
];

const AD_ORDERS = [
  ["YES! Send me THE WATCH.", "git clone " + AD_REPO],
  ["Prove it runs before I believe a word.", "npm test"],
  ["Also send the MCP server.", "claude mcp add thwip -- node mcp/server.js"],
];

function adTestCount(meta) {
  const n = meta && meta.tests;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function adTestLine(meta) {
  const n = adTestCount(meta);
  if (n === null) return "0 DEPENDENCIES";
  return groupNum(n) + " TESTS &middot; 0 DEPENDENCIES";
}

function adToolRowHTML(pair, paid) {
  return (
    '<li class="ad__tool' + (paid ? " ad__tool--paid" : "") + '">' +
      '<code class="ad__toolname">' + esc(pair[0]) + "</code>" +
      '<span class="ad__toolwhat">' + esc(pair[1]) + "</span>" +
    "</li>"
  );
}

function adToolsHTML() {
  return (
    '<div class="ad__cols">' +
      '<section class="ad__col">' +
        '<h4 class="ad__colhead">SIX READ THE RECORD' +
          '<span class="ad__colnote">instant &middot; free &middot; never touches the network</span>' +
        "</h4>" +
        '<ul class="ad__tools">' + AD_FREE_TOOLS.map((p) => adToolRowHTML(p, false)).join("") + "</ul>" +
      "</section>" +
      '<section class="ad__col">' +
        '<h4 class="ad__colhead">TWO SPEND REAL CREDIT' +
          '<span class="ad__colnote">minutes &middot; billed &middot; says so in its own description</span>' +
        "</h4>" +
        '<ul class="ad__tools">' + AD_PAID_TOOLS.map((p) => adToolRowHTML(p, true)).join("") + "</ul>" +
      "</section>" +
    "</div>"
  );
}

function adOrderRowHTML(order, i) {
  return (
    '<li class="ad__order">' +
      '<span class="ad__box" aria-hidden="true">&#10003;</span>' +
      '<span class="ad__orderwrap">' +
        '<span class="ad__want">' + esc(order[0]) + "</span>" +
        '<code class="ad__cmd" tabindex="0" role="region" ' +
          'aria-label="Command ' + (i + 1) + ' of 3, scrolls sideways">' +
          '<span class="ad__prompt" aria-hidden="true">$</span>' +
          '<span class="ad__cmdtext">' + esc(order[1]) + "</span>" +
        "</code>" +
      "</span>" +
      '<span class="ad__no" aria-hidden="true">' + (i + 1) + "</span>" +
    "</li>"
  );
}

function adCouponHTML(meta) {
  return (
    '<div class="ad__coupon" role="group" aria-labelledby="ad-formhead">' +
      '<p class="ad__cut" aria-hidden="true"><span>&#9986; CUT ALONG THE DOTTED LINE</span></p>' +
      '<div class="ad__form">' +
        '<h4 class="ad__formhead" id="ad-formhead">SEND NO MONEY NOW' +
          '<span class="ad__formsub">Three lines. In this order. From any clean clone.</span>' +
        "</h4>" +
        '<ol class="ad__orders">' + AD_ORDERS.map(adOrderRowHTML).join("") + "</ol>" +
        '<p class="ad__lines">' +
          '<span class="ad__line">NAME <i></i></span>' +
          '<span class="ad__line">UNIVERSE <i></i></span>' +
          '<span class="ad__line ad__line--tick">MY SCRAPERS ARE FINE ' +
            '<span class="ad__box ad__box--empty" aria-hidden="true"></span></span>' +
        "</p>" +
        '<a class="ad__chaos" href="?mock=1">CHAOS LAB &rarr;' +
          '<span class="ad__chaosnote">break one yourself, no install</span></a>' +
        '<p class="ad__small">Offer void where scrapers do not rot. ' +
          "Node 20 or better required. Credentials sold separately and never by us. " +
          '<b>' + adTestLine(meta) + "</b> at the last commit; the number above is read from " +
          "<code>meta.json</code> at page load, so it is right now and not when this was typed. " +
          "Allow four to six seconds for delivery." +
        "</p>" +
      "</div>" +
    "</div>"
  );
}

function adHTML(meta) {
  return (
    '<section class="ad" id="ad" aria-labelledby="ad-title">' +
      '<p class="ad__eyebrow">A MESSAGE FROM THE WATCH &middot; NO. 6 OF 6</p>' +
      '<div class="ad__top">' +
        '<div class="ad__pitch">' +
          '<h3 class="ad__title" id="ad-title">' +
            '<span class="ad__titleword">EIGHT TOOLS.</span> ' +
            '<span class="ad__titleword">NO SDK.</span> ' +
            '<span class="ad__titleword ad__titleline">CONNECT IN ONE LINE.</span>' +
          "</h3>" +
          '<p class="ad__lede">Your agent already knows how to ask &ldquo;is anything broken?&rdquo; ' +
            "It has never had anything to ask. Bolt the fleet straight into Claude Code or Cursor " +
            "&mdash; plain JSON-RPC over stdio, written against the spec, <b>no SDK, no build step, " +
            "no dependencies at all</b>." +
          "</p>" +
        "</div>" +
        '<div class="ad__burst">' +
          '<span class="ad__burstn" id="ad-tests">&mdash;</span>' +
          '<span class="ad__burstword">TESTS</span>' +
          '<span class="ad__burstsub">GREEN AT THIS COMMIT</span>' +
        "</div>" +
      "</div>" +
      adToolsHTML() +
      '<div class="ad__guarantee">' +
        '<p class="ad__promise"><b>OUR IRON-CLAD GUARANTEE:</b> your scrapers ' +
          "<i>will</i> break. Every one of them. We do not prevent it &mdash; nobody can. " +
          "We notice within the hour, re-weave in place, and hand you the receipt.</p>" +
        '<span class="ad__actnow">ACT NOW</span>' +
      "</div>" +
      adCouponHTML(meta) +
    "</section>"
  );
}

function adSlot() {
  const existing = document.getElementById("ad-slot");
  if (existing) return existing;
  const replay = document.getElementById("replay");
  if (!replay || !replay.parentNode) return null;
  const slot = document.createElement("div");
  slot.id = "ad-slot";
  replay.parentNode.insertBefore(slot, replay.nextSibling);
  return slot;
}

function adSetCount(meta) {
  const burst = document.getElementById("ad-tests");
  if (!burst) return;
  const n = adTestCount(meta);
  burst.textContent = n === null ? "\u2014" : groupNum(n);
}

function adSuppressed() {
  return typeof MOCK !== "undefined" && MOCK;
}

function mountAd() {
  const slot = adSlot();
  if (!slot) return;
  if (adSuppressed()) {
    slot.innerHTML = "";
    return;
  }
  const html = adHTML(META);
  if (slot.innerHTML !== html || !slot.firstChild) slot.innerHTML = html;
  adSetCount(META);
}

if (typeof document === "object" && document.getElementById) {
  const anchor = document.getElementById("replay");
  if (anchor) {
    new MutationObserver(mountAd).observe(anchor, { childList: true });
    mountAd();
  }
}

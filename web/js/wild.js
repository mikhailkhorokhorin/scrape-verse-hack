"use strict";

function collectorIsOurs(universe) {
  return OUR_UNIVERSES.some((own) => String(universe || "").includes(own));
}

function universeOf(code) {
  const sp = (SPIDERS || []).find((s) => s.code === code);
  if (sp) return sp.universe;
  const run = (RAW_HISTORY || []).find((r) => r && r.spider === code);
  return run ? run.universe : "";
}

function isWildIncident(inc) {
  if (!inc) return false;
  return !collectorIsOurs(universeOf(inc.who || inc.spider));
}

function wildBadgeHTML(inc) {
  if (!isWildIncident(inc)) return "";
  return (
    '<span class="wild" title="This break happened on a third-party site we do not control">' +
      '<span class="wild__dot" aria-hidden="true"></span>IN THE WILD' +
    "</span>"
  );
}

function mountWildNote() {
  const slot = document.getElementById("wildnote");
  if (!slot) return;
  slot.innerHTML = wildCountHTML();
}

function wildCountHTML() {
  const wild = (INCIDENTS || []).filter(isWildIncident);
  if (!wild.length) return "";
  const sites = Array.from(new Set(wild.map((inc) => universeOf(inc.who)))).filter(Boolean);
  const noun = wild.length === 1 ? "break" : "breaks";
  return (
    '<p class="wild-note">' +
      '<b class="wild-note__n">' + wild.length + "</b> of these " + noun +
      " happened on a site we do not control &mdash; " + esc(sites.join(", ")) +
      ". Nobody staged them, and the re-weave closed them the same way." +
    "</p>"
  );
}

if (typeof document === "object" && document.getElementById) {
  const feed = document.getElementById("feed");
  if (feed) new MutationObserver(mountWildNote).observe(feed, { childList: true });
}

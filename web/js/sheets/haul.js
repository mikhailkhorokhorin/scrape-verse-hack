"use strict";

function renderHaul() {
  const root = document.getElementById("haul");
  if (!root) return;

  if (ERRORS.history) {
    root.innerHTML = failPlate(ERRORS.history);
    setCount("haulcount", 0, "source");
    return;
  }

  const hauls = buildHaul(RAW_HISTORY, SPIDERS);
  const live = hauls.filter((h) => !h.empty);

  if (!live.length) {
    root.innerHTML = plateHTML(
      "NOTHING IN THE BAG",
      "<p>The fleet is reporting health but no run has kept a row yet. There is no haul to " +
        "show, and inventing one would make this page a mockup instead of a console.</p>" +
        "<p>The moment a scan lands with a sample attached it appears here: the record itself, " +
        "the collector that caught it, and the Integrity of the Spider at the instant of capture.</p>",
      "wait",
      "<span>Source is <b>data/history.json</b></span>" +
        "<span>One sample kept <b>per scan</b></span>"
    );
    setCount("haulcount", 0, "source");
    return;
  }

  root.innerHTML = haulTotalsHTML(haulTotals(hauls)) + hauls.map(haulCardHTML).join("");
  setCount("haulcount", live.length, "source");
}

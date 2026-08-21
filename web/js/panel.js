"use strict";

function panelHTML(sp, idx) {
  const integ = integrityOf(sp);
  const st = statusOf(sp);
  const color = COLOR[st];
  const spread = Math.min(MAX_VISIBLE_SPREAD, (100 - integ) / 100).toFixed(2);
  const fields = sp.fieldOrder || FIELDS;

  const chips = fields.map((field) => chipHTML(sp, field)).join("");

  const residue = sp.healed && Number(spread) <= MIN_VISIBLE_SPREAD ? SCAR_RESIDUE : 0;
  const shown = residue || Number(spread);
  const showSymbiote = !sp.unwatched && shown > MIN_VISIBLE_SPREAD / 2;
  const scanText = sp.unwatched ? agoOf(sp.ts) : clockOf(sp.ts);
  const compact = st === "healthy" || st === "unwatched";
  const big = st === "critical" || st === "reweaving";
  const readout = sp.unwatched ? "--" : integ + "%";

  const head =
    '<div class="phead">' +
      "<div>" +
        '<h3 class="codename">' + esc(sp.code) + "</h3>" +
        '<p class="universe">' + esc(sp.universe) + "</p>" +
      "</div>" +
      '<span class="badge badge--' + st + '">' + st + "</span>" +
    "</div>";

  const bar = '<div class="bar"><div class="bar__fill" style="width:' + (sp.unwatched ? 0 : integ) + '%"></div></div>';
  const note = seriesNote(sp.series);

  const body = compact
    ? sparkline(sp.series, color, sp.scars) +
      note +
      streakHTML(sp, st) +
      '<div class="compact-foot">' +
        bar +
        '<span class="integrity__value">' + readout + "</span>" +
      "</div>"
    : '<div class="integrity">' +
        '<span class="integrity__value">' + readout + "</span>" +
        '<span class="label">Integrity</span>' +
      "</div>" +
      sparkline(sp.series, color, sp.scars) +
      note +
      bar +
      '<div class="chips">' + chips + "</div>" +
      '<div class="lastscan">' +
        '<span class="label">Last scan</span>' +
        '<span class="mono" style="font-size:.8125rem">' + scanText + "</span>" +
      "</div>";

  const rest = compact ? restHTML(sp, st) : "";

  return (
    '<div class="cell cell--' + st + '">' +
    '<button class="panel' + (compact ? " panel--compact" : big ? " panel--big" : "") + ' is-' + st + '" data-idx="' + idx +
      '"' + (sp.healed ? ' data-healed="' + (sp.healed > 9 ? "9+" : sp.healed) + '"' : "") +
      ' style="--spread:' + (sp.unwatched ? 0 : spread) + '"' + (!sp.unwatched && Number(spread) > PAPER_SPREAD ? ' data-drowned="1"' : '') + '>' +
      (showSymbiote ? '<div class="symbiote" style="--spread:' + (sp.unwatched ? 0 : shown) + '"><div class="symbiote__body"></div></div>' : "") +
      head +
      body +
    "</button>" +
    rest +
    "</div>"
  );
}

function streakHTML(sp, st) {
  if (st !== "healthy" || !(sp.streak >= MIN_STREAK)) return "";
  const best = sp.best > sp.streak ? "<em>best " + sp.best + "</em>" : "";
  return (
    '<p class="streak"><b>' + sp.streak + "</b><span>clean in a row</span>" + best + "</p>"
  );
}

function restHTML(sp, st) {
  const runs = typeof sp.runs === "number" ? sp.runs : (sp.series || []).length;
  const label = st === "unwatched" ? "Unwatched" : "Holding";
  const line = st === "unwatched"
    ? "No scan in over three hours. Nothing here is current, and nobody has noticed."
    : "Every expected field returned and passed its validator. Nothing to diagnose.";
  const fields = (sp.fieldOrder || FIELDS).length;
  const stat = st === "unwatched"
    ? agoOf(sp.ts) + " since the last reading"
    : fields + " field" + (fields === 1 ? "" : "s") + " checked every run";
  return (
    '<div class="rest" aria-hidden="true">' +
      '<span class="rest__label">' + label + "</span>" +
      '<span class="rest__line">' + line + "</span>" +
      '<span class="rest__runs mono">' + runs + " runs on record · " + stat + "</span>" +
    "</div>"
  );
}

function burst(panel, word, color) {
  if (!panel) return;
  const cell = panel.closest(".cell") || panel;
  const b = document.createElement("div");
  b.className = "burst";
  b.textContent = word;
  b.style.color = color;
  cell.classList.add("has-burst");
  cell.appendChild(b);
  setTimeout(() => {
    b.remove();
    cell.classList.remove("has-burst");
  }, 1600);
}

function panelOf(code) {
  const i = SPIDERS.findIndex((s) => s.code === code);
  return document.querySelector('.panel[data-idx="' + i + '"]');
}

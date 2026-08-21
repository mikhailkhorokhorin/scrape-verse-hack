"use strict";

function jsonHTML(sample, fields) {
  const rows = Object.entries(sample || {}).map(([k, v]) => {
    const state = Object.prototype.hasOwnProperty.call(fields || {}, k) ? fields[k] : undefined;
    const cls = state === "dead" ? "null" : state === "infected" ? "bad" : "s";
    const nested = shapeOf(v) === "object" || shapeOf(v) === "array";
    const raw = nested ? JSON.stringify(v) : valueLiteral(v);
    const reads = nested
      ? '\n      <span class="reads">reads as ' + esc(valueText(v)) + "</span>"
      : "";
    return '  <span class="k">"' + esc(k) + '"</span>: <span class="' + cls + '">' +
      esc(raw) + "</span>" + reads;
  }).join(",\n");
  return "{\n" + rows + "\n}";
}

function trackHTML(sp, field) {
  const track = (sp.tracks && sp.tracks[field]) || [];
  const now = stateOf(sp, field);
  const cells = track.length
    ? track.map((s) => '<span class="track__cell track__cell--' + s + '"></span>').join("")
    : '<span class="track__cell track__cell--' + now + '"></span>';
  const rate = sp.fillRates && typeof sp.fillRates[field] === "number"
    ? clampPct(sp.fillRates[field])
    : (now === "dead" ? 0 : 100);

  return (
    '<div class="track">' +
      '<span class="track__name" style="color:' + FIELD_COLOR[now] + '">' + esc(field) + "</span>" +
      '<span class="track__cells" role="img" aria-label="' + esc(field) + " over " +
        (track.length || 1) + ' runs">' + cells + "</span>" +
      '<span class="track__rate" style="color:' + FIELD_COLOR[now] + '">' + rate +
        "%<small>fill rate</small></span>" +
      '<span class="track__expect">expects ' + esc(expectedOf(field)) + "</span>" +
    "</div>"
  );
}

function spiderBlastHTML(sp) {
  const b = sp.blast;
  if (!b || b.cells === 0) return "";
  const names = b.fields.map((f) => '<span class="sblast__field">' + esc(f) + "</span>").join("");
  return (
    '<p class="sblast">' +
      '<b class="sblast__n">' + groupNum(b.cells) + "</b>" +
      '<span class="sblast__body">bad values shipped downstream — ' +
        groupNum(b.rows) + " rows across " + b.scans + " scan" + (b.scans === 1 ? "" : "s") +
        " carried a wrong or missing " + names + "</span>" +
    "</p>"
  );
}

function factsHTML(sp, integ) {
  const streak = sp.streak >= MIN_STREAK
    ? sp.streak + " clean" + (sp.best > sp.streak ? " · best " + sp.best : "")
    : "—";
  return (
    '<div class="sheet__facts">' +
      '<div class="sheet__fact"><span class="label">Collector</span>' +
        '<b><span class="cid">' + esc(sp.cid) + "</span></b></div>" +
      '<div class="sheet__fact"><span class="label">Runs on record</span><b>' +
        (sp.runs || 0) + "</b></div>" +
      '<div class="sheet__fact"><span class="label">Streak</span><b>' + streak + "</b></div>" +
      '<div class="sheet__fact"><span class="label">Times healed</span><b>' +
        (sp.healed || 0) + "</b></div>" +
      '<div class="sheet__fact"><span class="label">Last scan</span><b>' +
        clockOf(sp.ts) + "</b></div>" +
    "</div>"
  );
}

function openSheet(idx) {
  const sp = SPIDERS[idx];
  if (!sp) return;

  const integ = integrityOf(sp);
  const st = statusOf(sp);
  const fields = sp.fieldOrder || FIELDS;
  const span = Math.max(...fields.map((f) => ((sp.tracks && sp.tracks[f]) || []).length), 1);

  document.getElementById("sheet-body").innerHTML =
    '<div class="sheet__head">' +
      "<div>" +
        '<h2 id="sheet-title" class="sheet__name">' + esc(sp.code) + "</h2>" +
        '<p class="universe sheet__universe">' + esc(sp.universe) + "</p>" +
      "</div>" +
      '<div class="sheet__score"><b style="color:' + COLOR[st] + '">' + integ + "%</b>" +
        '<span class="label">Integrity · ' + st + "</span></div>" +
    "</div>" +
    factsHTML(sp, integ) +
    healButtonHTML(sp) +
    spiderBlastHTML(sp) +
    '<div class="sechead sheet__sec"><h2>Field diagnosis</h2><span class="rule"></span></div>' +
    '<p class="sheet__lede">One cell per run, oldest on the left. Lime returned and validated, ' +
      "violet returned something wrong, red returned nothing. A field that has been quietly " +
      "infected shows a violet streak long before its Integrity moved.</p>" +
    fields.map((f) => trackHTML(sp, f)).join("") +
    '<p class="track__scale"><span>' + span + " run" + (span === 1 ? "" : "s") +
      " on record</span><span>now</span></p>" +
    heatHTML(sp) +
    '<div class="sechead sheet__sec"><h2>Last sample</h2><span class="rule"></span></div>' +
    '<pre class="sample">' + jsonHTML(sp.sample, sp.fields) + "</pre>";

  document.getElementById("modal").hidden = false;
  bindHeal(document.getElementById("sheet-body"));
  document.getElementById("sheet-close").focus();
}

function closeSheet() {
  document.getElementById("modal").hidden = true;
}

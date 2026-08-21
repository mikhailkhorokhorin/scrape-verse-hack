"use strict";

const HAUL_VALUE_MAX = 108;

function haulHostOf(raw) {
  try {
    return new URL(raw).hostname || null;
  } catch (error) {
    return null;
  }
}

function haulValueHTML(cell) {
  if (cell.empty) {
    return '<span class="haul__val haul__val--void">' + esc(cell.raw === undefined ? "missing" : "null") + "</span>";
  }
  const text = truncateMiddle(cell.text, HAUL_VALUE_MAX);
  const cls = "haul__val haul__val--" + cell.state;
  const host = cell.media ? haulHostOf(cell.raw) : null;
  if (host) {
    return '<span class="' + cls + ' haul__val--media"><span class="haul__host">' +
      esc(host) + "</span>" + esc(truncateMiddle(cell.raw.replace(/^https?:\/\/[^/]+/, ""), 44)) + "</span>";
  }
  return '<span class="' + cls + '">' + esc(text) + "</span>";
}

function haulCellHTML(cell) {
  return (
    '<div class="haul__cell haul__cell--' + cell.state + '">' +
      '<span class="haul__key">' + esc(cell.key) + "</span>" +
      haulValueHTML(cell) +
    "</div>"
  );
}

function haulStampHTML(h) {
  const grade = gradeOf(h.integrity);
  return (
    '<div class="stamp stamp--' + grade + '">' +
      '<span class="stamp__ring">' +
        '<b class="stamp__pct">' + h.integrity + "%</b>" +
        '<span class="stamp__word">integrity<br>at capture</span>' +
      "</span>" +
      '<span class="stamp__lines">' +
        '<span class="stamp__line stamp__line--cid"><i>collector</i>' +
          '<span class="stamp__cid" title="' + esc(h.cid) + '">' + esc(h.cid) + "</span></span>" +
        '<span class="stamp__line"><i>captured</i>' + esc(clockOf(h.ts)) + " · " + esc(agoOf(h.ts)) + "</span>" +
        '<span class="stamp__line"><i>this scan</i>' + groupNum(h.rowsThisScan) + " rows · " +
          groupNum(h.rowsTotal) + " on record</span>" +
      "</span>" +
    "</div>"
  );
}

function haulMoveSVG(values) {
  const W = 132, H = 34, P = 3;
  if (values.length < 2) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [
    P + (i * (W - 2 * P)) / (values.length - 1),
    H - P - ((v - lo) / span) * (H - 2 * P),
  ]);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return (
    '<svg class="move__spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<polygon points="0,' + H + " " + line + " " + W + "," + H + '" fill="var(--cyan)" opacity="0.14"/>' +
      '<polyline points="' + line + '" fill="none" stroke="var(--cyan)" stroke-width="2" ' +
        'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      pts.map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) +
        '" r="2" fill="var(--cyan)"/>').join("") +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) +
        '" r="3.5" fill="var(--cyan)" stroke="var(--ink)" stroke-width="1.5"/>' +
    "</svg>"
  );
}

function haulMetricHTML(m) {
  const up = m.delta > 0;
  return (
    '<div class="move__metric">' +
      '<span class="move__key">' + esc(m.key) + "</span>" +
      haulMoveSVG(m.values) +
      '<span class="move__delta move__delta--' + (up ? "up" : "down") + '">' +
        '<b>' + esc(String(m.from)) + " → " + esc(String(m.to)) + "</b>" +
        "<i>" + (up ? "+" : "") + esc(String(Math.round(m.delta * 100) / 100)) + "</i>" +
      "</span>" +
    "</div>"
  );
}

function haulMovementHTML(h) {
  const mv = h.movement;
  if (!mv) return "";
  return (
    '<div class="move">' +
      '<span class="move__tag">Watched through time</span>' +
      '<p class="move__id">' + esc(truncateMiddle(mv.id, 84)) + "</p>" +
      '<p class="move__note">Same record, ' + mv.scans + " scans, " +
        '<span class="mono">' + esc(clockOf(mv.firstTs)) + '</span> to <span class="mono">' + esc(clockOf(mv.lastTs)) + '</span>' +
        ". One scrape is a row; a watch is a series.</p>" +
      mv.metrics.map(haulMetricHTML).join("") +
    "</div>"
  );
}

function haulSpreadHTML(h) {
  const sp = h.spread;
  if (!sp) return "";
  const unit = sp.unit || { prefix: "", suffix: "" };
  const fmt = (n) => unit.prefix + String(Math.round(n * 100) / 100) + unit.suffix;
  return (
    '<div class="spreadstat">' +
      '<span class="spreadstat__tag">Across the haul</span>' +
      '<div class="spreadstat__row">' +
        '<span class="spreadstat__item"><b>' + esc(fmt(sp.lo)) + "</b><i>lowest " + esc(sp.key) + "</i></span>" +
        '<span class="spreadstat__item"><b>' + esc(fmt(sp.median)) + "</b><i>median</i></span>" +
        '<span class="spreadstat__item"><b>' + esc(fmt(sp.hi)) + "</b><i>highest</i></span>" +
        '<span class="spreadstat__item"><b>' + sp.distinct + "</b><i>distinct records</i></span>" +
      "</div>" +
    "</div>"
  );
}

function haulShiftHTML(h) {
  const sh = h.shift;
  if (!sh) return "";
  const names = (list) => list.map((k) => "<code>" + esc(k) + "</code>").join(", ");
  const gone = sh.gone.length ? names(sh.gone) + " stopped arriving" : "";
  const gained = sh.gained.length ? names(sh.gained) + " started arriving" : "";
  const both = [gone, gained].filter(Boolean).join(" and ");
  return (
    '<p class="shift"><span class="shift__tag">Schema moved</span>' +
      "The target changed shape under the Spider — " + both +
      ". The rows kept flowing either way.</p>"
  );
}

function haulCardHTML(h) {
  if (h.empty) {
    return (
      '<article class="haulcard haulcard--empty">' +
        '<div class="haulcard__top"><h3 class="haulcard__code">' + esc(h.code) + "</h3>" +
          '<span class="universe">' + esc(h.universe) + "</span></div>" +
        '<p class="haulcard__none">No sample on record. This Spider has reported health but no ' +
          "row has been kept, so there is nothing honest to show here yet.</p>" +
      "</article>"
    );
  }

  return (
    '<article class="haulcard haulcard--' + esc(gradeOf(h.integrity)) + '">' +
      '<div class="haulcard__top">' +
        '<h3 class="haulcard__code">' + esc(h.code) + "</h3>" +
        '<span class="universe">' + esc(h.universe) + "</span>" +
        '<span class="haulcard__count mono">' + groupNum(h.rowsTotal) + " rows</span>" +
      "</div>" +
      '<div class="haulcard__body">' +
        '<div class="haul__record">' +
          '<span class="haul__recordtag">Last row off the wire</span>' +
          h.cells.map(haulCellHTML).join("") +
        "</div>" +
        haulStampHTML(h) +
      "</div>" +
      haulMovementHTML(h) +
      haulSpreadHTML(h) +
      haulShiftHTML(h) +
    "</article>"
  );
}

function haulTotalsHTML(t) {
  return (
    '<div class="haultotals">' +
      '<span class="haultotals__item"><b>' + groupNum(t.rows) + "</b><i>rows delivered</i></span>" +
      '<span class="haultotals__item"><b>' + groupNum(t.scans) + "</b><i>scans on record</i></span>" +
      '<span class="haultotals__item"><b>' + groupNum(t.spiders) + "</b><i>sources under watch</i></span>" +
      '<p class="haultotals__note">Every value below arrived through Bright Data and carries the ' +
        "stamp of the run that caught it. Nothing here is illustrative.</p>" +
    "</div>"
  );
}

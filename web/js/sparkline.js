"use strict";

function seriesNote(values) {
  const n = values ? values.length : 0;
  if (n === 0) return '<p class="spark__note spark__note--none">No history yet — first scan pending</p>';
  if (n >= FULL_SERIES) return "";
  return '<p class="spark__note">' + n + " run" + (n === 1 ? "" : "s") + " on record — real points only, nothing interpolated</p>";
}

function sparkline(values, color, scars) {
  const W = 240, H = 44, P = 3;
  if (!values || values.length === 0) {
    return '<div class="spark spark--empty" aria-hidden="true"></div>';
  }
  const points = values.length === 1 ? [values[0], values[0]] : values;

  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;
  const span = max - min || 1;
  const pt = (v, i) => [P + (i * (W - 2 * P)) / (points.length - 1), H - P - ((v - min) / span) * (H - 2 * P)];
  const pts = points.map(pt);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = "0," + H + " " + line + " " + W + "," + H;
  const last = pts[pts.length - 1];

  return (
    '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<polygon points="' + area + '" fill="' + color + '" opacity="0.16"/>' +
    scarSVG(scars || [], W, H, P) +
    '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" ' +
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
    (values.length < FULL_SERIES
      ? pts.map((pp) => '<circle cx="' + pp[0].toFixed(1) + '" cy="' + pp[1].toFixed(1) + '" r="2.5" fill="' + color + '"/>').join("")
      : "") +
    '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="' + color + '"/>' +
    "</svg>"
  );
}

function plateHTML(word, body, kind, meta) {
  return (
    '<div class="plate' + (kind ? " plate--" + kind : "") + '">' +
      '<div class="plate__specimen" aria-hidden="true"><span class="plate__cap">' +
        (kind === "quiet" ? "clean" : "the spread") + "</span></div>" +
      "<div>" +
        '<span class="plate__word">' + word + "</span>" +
        body +
        (meta ? '<p class="plate__meta">' + meta + "</p>" : "") +
      "</div>" +
    "</div>"
  );
}

function failPlate(err) {
  return plateHTML(
    "SIGNAL LOST",
    "<p>Could not read <span class=\"mono\">" + esc(err.file) + "</span> — " + esc(err.why) +
      ". This is a fault in the console's own feed, not a reading of the fleet. " +
      "Nothing below is current until it clears.</p>",
    "fail"
  );
}

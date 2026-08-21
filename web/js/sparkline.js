"use strict";

function seriesNote(values) {
  const n = values ? values.length : 0;
  if (n === 0) return '<p class="spark__note spark__note--none">No history yet — first scan pending</p>';

  const i = climbIndex(values);
  if (i > 0) {
    const healed = values[i - 1] < DEGRADED_MIN && values[i] >= HEALTHY_MIN;
    return (
      '<p class="spark__note spark__note--climb">' +
        '<b class="mono">' + values[i - 1] + "% → " + values[i] + "%</b>" +
        "<span>" + (healed ? "re-wove itself in one scan" : "recovered between scans") + "</span>" +
      "</p>"
    );
  }

  if (n >= FULL_SERIES) return "";
  return '<p class="spark__note">' + n + " run" + (n === 1 ? "" : "s") + " on record — real points only, nothing interpolated</p>";
}

function climbIndex(points) {
  let best = -1;
  let gain = 0;
  for (let i = 1; i < points.length; i += 1) {
    const step = points[i] - points[i - 1];
    if (step >= RECOVERY_MIN_GAIN && step > gain) { gain = step; best = i; }
  }
  return best;
}

function climbSVG(points, pts) {
  const i = climbIndex(points);
  if (i < 0) return "";
  const a = pts[i - 1];
  const b = pts[i];
  return (
    '<polyline points="' + a[0].toFixed(1) + "," + a[1].toFixed(1) + " " +
      b[0].toFixed(1) + "," + b[1].toFixed(1) + '" fill="none" stroke="' + COLOR.reweaving +
      '" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0.85"/>'
  );
}

function sparkline(values, color, scars) {
  const W = 240, H = 44, P = 3;
  if (!values || values.length === 0) {
    return '<div class="spark spark--empty" aria-hidden="true"></div>';
  }
  const points = values.length === 1 ? [values[0], values[0]] : values;

  const sparse = values.length < SPARSE_SERIES;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const wide = hi - lo >= ABSOLUTE_SCALE_SPAN;
  const min = wide ? 0 : lo - (hi - lo < 6 ? 6 : 2);
  const max = wide ? 100 : hi + (hi - lo < 6 ? 6 : 2);
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
    climbSVG(points, pts) +
    '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" ' +
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"' +
      (sparse ? ' stroke-dasharray="5 4" opacity="0.75"' : "") + "/>" +
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

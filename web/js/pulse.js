"use strict";

const PULSE_MIN_BEATS = 8;
const PULSE_MAX_BEATS = 64;

function pulseBeats(history) {
  const buckets = new Map();
  for (const run of history || []) {
    if (!run || !run.ts) continue;
    const at = Date.parse(run.ts);
    if (!Number.isFinite(at)) continue;
    const key = Math.round(at / 60000);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(clampPct(run.integrity));
  }
  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  if (keys.length < PULSE_MIN_BEATS) return null;

  const room = window.innerWidth < 700 ? 20 : window.innerWidth < 1100 ? 36 : PULSE_MAX_BEATS;
  const kept = keys.slice(-room);
  const gaps = [];
  for (let i = 1; i < kept.length; i += 1) gaps.push(kept[i] - kept[i - 1]);
  const typical = gaps.length
    ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || 1
    : 1;

  return kept.map((key, i) => {
    const values = buckets.get(key);
    return {
      integrity: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      worst: Math.min(...values),
      level: Math.round(Math.min(...values) * 0.55 + (values.reduce((a, b) => a + b, 0) / values.length) * 0.45),
      stretch: i === 0 ? 1 : Math.min(2.6, Math.max(0.45, (key - kept[i - 1]) / typical)),
    };
  });
}

function pulsePath(beats, W, H) {
  const mid = H / 2;
  const total = beats.reduce((sum, beat) => sum + beat.stretch, 0) || 1;
  const unit = W / total;
  let x = 0;
  let d = "M0 " + mid.toFixed(1);

  for (const beat of beats) {
    const step = unit * beat.stretch;
    const amp = (beat.level / 100) * (mid - 4);
    const spike = Math.min(step * 0.42, 9);
    const flat = Math.max(0, step - spike * 2.2);
    x += flat;
    d += " L" + x.toFixed(1) + " " + mid.toFixed(1);
    x += spike * 0.5;
    d += " L" + x.toFixed(1) + " " + (mid - amp).toFixed(1);
    x += spike * 0.7;
    d += " L" + x.toFixed(1) + " " + (mid + amp * 0.55).toFixed(1);
    x += spike;
    d += " L" + x.toFixed(1) + " " + mid.toFixed(1);
  }
  return d + " L" + W + " " + mid.toFixed(1);
}

function renderPulse(history) {
  const host = document.getElementById("pulse");
  if (!host) return;
  const beats = pulseBeats(history || []);
  if (!beats) { host.innerHTML = ""; host.hidden = true; return; }
  host.hidden = false;

  const W = 1200;
  const H = 60;
  const avg = Math.round(beats.reduce((sum, b) => sum + b.integrity, 0) / beats.length);
  const color = COLOR[gradeOf(avg)];
  const weakest = Math.min(...beats.slice(-6).map((b) => b.worst));
  const flat = weakest < DEGRADED_MIN;
  const d = pulsePath(beats, W, H);

  host.className = "pulseline" + (flat ? " pulseline--flat" : "");
  host.innerHTML =
    '<span class="pulseline__tag">Fleet pulse</span>' +
    '<span class="pulseline__read">' + beats.length + " beats · " +
      (flat ? "arrhythmic" : "steady") + "</span>" +
    '<svg class="pulseline__svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" ' +
      'aria-label="Fleet pulse: ' + beats.length + " scans, mean integrity " + avg + " percent, " +
      (flat ? "arrhythmic" : "steady") + '">' +
      '<line class="pulseline__base" x1="0" y1="' + H / 2 + '" x2="' + W + '" y2="' + H / 2 + '"/>' +
      '<path class="pulseline__trace" d="' + d + '" stroke="' + color + '" style="--len:' + Math.round(W * 2.4) + '"/>' +
    "</svg>";
}

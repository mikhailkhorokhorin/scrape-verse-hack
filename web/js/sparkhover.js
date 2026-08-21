"use strict";

const SPARK_HIT_W = 14;

function sparkHitsSVG(pts, W, H) {
  if (!pts || pts.length === 0) return "";
  const half = pts.length === 1 ? W / 2 : SPARK_HIT_W / 2;
  return pts.map((p, i) => {
    const x = Math.max(0, Math.min(W - 1, p[0] - half));
    const w = Math.min(W - x, half * 2);
    return '<rect class="spark__hit" data-i="' + i + '" data-x="' + p[0].toFixed(1) +
      '" data-y="' + p[1].toFixed(1) +
      '" x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="' + H +
      '" fill="transparent"/>';
  }).join("");
}

function sparkCursorSVG(pts, color, H) {
  if (!pts || pts.length === 0) return "";
  const p = pts[0];
  return (
    '<g class="spark__cursor">' +
      '<line class="spark__cursor-line" x1="' + p[0].toFixed(1) + '" y1="0" x2="' +
        p[0].toFixed(1) + '" y2="' + H + '" stroke="' + color +
        '" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0.55"/>' +
      '<circle class="spark__cursor-dot" cx="' + p[0].toFixed(1) + '" cy="' +
        p[1].toFixed(1) + '" r="4" fill="' + color +
        '" stroke="#14061F" stroke-width="1.5" vector-effect="non-scaling-stroke"/>' +
    "</g>"
  );
}

function sparkTipHTML(sp, i) {
  const series = (sp && sp.series) || [];
  const stamps = (sp && sp.seriesTs) || [];
  const value = series[i];
  const ts = stamps[i];
  if (value === undefined) return "";
  return (
    '<span class="reveal reveal--spark" role="tooltip">' +
      '<span class="reveal__row"><span class="reveal__key">scan</span>' +
        '<span class="reveal__val">' + esc(ts ? clockOf(ts) : "time not recorded") + "</span></span>" +
      '<span class="reveal__row"><span class="reveal__key">integrity</span>' +
        '<span class="reveal__val">' + esc(clampPct(value) + "%") + "</span></span>" +
    "</span>"
  );
}

function sparkFrameOf(el) {
  const frame = el.closest(".sparkframe");
  if (!frame) return null;
  const svg = frame.querySelector(".spark");
  const panel = frame.closest(".panel");
  if (!svg || !panel) return null;
  const sp = SPIDERS[Number(panel.dataset.idx)];
  if (!sp) return null;
  return { frame: frame, svg: svg, panel: panel, sp: sp };
}

function sparkShow(frame, i) {
  const ctx = sparkFrameOf(frame);
  if (!ctx) return;
  const hits = ctx.svg.querySelectorAll(".spark__hit");
  if (!hits.length) return;
  const at = Math.min(hits.length - 1, Math.max(0, i));
  const rect = hits[at];
  const cx = Number(rect.dataset.x);

  const cursor = ctx.svg.querySelector(".spark__cursor");
  const line = ctx.svg.querySelector(".spark__cursor-line");
  const dot = ctx.svg.querySelector(".spark__cursor-dot");
  if (!cursor || !line || !dot) return;
  const y = Number(rect.dataset.y);
  cursor.classList.add("is-on");
  line.setAttribute("x1", cx);
  line.setAttribute("x2", cx);
  dot.setAttribute("cx", cx);
  if (Number.isFinite(y)) dot.setAttribute("cy", y);

  ctx.frame.dataset.at = String(at);
  const tip = ctx.frame.querySelector(".spark__tip");
  if (tip) {
    tip.innerHTML = sparkTipHTML(ctx.sp, at);
    tip.style.left = ((cx / 240) * 100).toFixed(2) + "%";
    tip.hidden = false;
  }
  const live = ctx.frame.querySelector(".spark__say");
  const stamps = ctx.sp.seriesTs || [];
  if (live) {
    live.textContent = (stamps[at] ? clockOf(stamps[at]) : "time not recorded") +
      ", integrity " + clampPct((ctx.sp.series || [])[at]) + "%";
  }
}

function sparkHide(frame) {
  const cursor = frame.querySelector(".spark__cursor");
  if (cursor) cursor.classList.remove("is-on");
  const tip = frame.querySelector(".spark__tip");
  if (tip) { tip.hidden = true; tip.innerHTML = ""; }
  const live = frame.querySelector(".spark__say");
  if (live) live.textContent = "";
  delete frame.dataset.at;
}

function sparkStep(panel, delta) {
  const frame = panel.querySelector(".sparkframe");
  if (!frame) return false;
  const hits = frame.querySelectorAll(".spark__hit");
  if (!hits.length) return false;
  const current = frame.dataset.at === undefined ? null : Number(frame.dataset.at);
  const start = delta > 0 ? -1 : hits.length;
  const from = current === null ? start : current;
  sparkShow(frame, Math.min(hits.length - 1, Math.max(0, from + delta)));
  return true;
}

function bindSparkHover(root) {
  root.addEventListener("pointermove", (e) => {
    const frame = e.target.closest(".sparkframe");
    if (!frame) return;
    const hit = e.target.closest(".spark__hit");
    if (hit) sparkShow(frame, Number(hit.dataset.i));
  });

  root.addEventListener("pointerleave", (e) => {
    const frame = e.target.closest(".sparkframe");
    if (frame) sparkHide(frame);
  }, true);

  root.addEventListener("focusout", (e) => {
    const panel = e.target.closest(".panel");
    if (!panel) return;
    const frame = panel.querySelector(".sparkframe");
    if (frame) sparkHide(frame);
  });
}

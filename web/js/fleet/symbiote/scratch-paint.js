"use strict";

const SCRATCH_RADIUS = 40;
const SCRATCH_CLIP = 0.86;
const SCRATCH_STEP = 12;
const SCRATCH_INK = "#050408";
const SCRATCH_UNDER = "#1A0426";
const SCRATCH_ROW_H = 26;

function scratchColorFor(state) {
  if (state === "dead") return "#FF1E1E";
  if (state === "infected") return "#C24BFF";
  return "#F4EFE4";
}

function scratchRowsTop(lines, h, top) {
  const block = lines.length * SCRATCH_ROW_H;
  return top + (h - top) / 2 - block / 2 + SCRATCH_ROW_H / 2;
}

function scratchRows(ctx, lines, w, h, top, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = "middle";
  ctx.font = "600 15px 'IBM Plex Mono',monospace";
  let y = scratchRowsTop(lines, h, top);
  lines.forEach((line) => {
    ctx.fillStyle = scratchColorFor(line.state);
    ctx.fillText(line.text, 18, y, w - 36);
    y += SCRATCH_ROW_H;
  });
  ctx.restore();
}

function scratchPaintGhost(ctx, lines, w, h, top) {
  scratchRows(ctx, lines, w, h, top, 0.1);
}

function scratchPaintValues(ctx, lines, w, h, top) {
  scratchRows(ctx, lines, w, h, top, 1);
}

function scratchStroke(ctx, holes, radius) {
  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  holes.forEach((hole, i) => {
    if (i === 0) ctx.moveTo(hole.x, hole.y);
    else ctx.lineTo(hole.x, hole.y);
  });
  if (holes.length === 1) ctx.lineTo(holes[0].x + 0.01, holes[0].y);
  ctx.stroke();
}

function scratchClipTo(ctx, strokes) {
  const path = new Path2D();
  const r = SCRATCH_RADIUS * SCRATCH_CLIP;
  strokes.forEach((holes) => {
    holes.forEach((hole) => {
      path.moveTo(hole.x + r, hole.y);
      path.arc(hole.x, hole.y, r, 0, Math.PI * 2);
    });
    for (let i = 1; i < holes.length; i += 1) {
      const a = holes[i - 1];
      const b = holes[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = (-dy / len) * r;
      const ny = (dx / len) * r;
      path.moveTo(a.x + nx, a.y + ny);
      path.lineTo(b.x + nx, b.y + ny);
      path.lineTo(b.x - nx, b.y - ny);
      path.lineTo(a.x - nx, a.y - ny);
      path.closePath();
    }
  });
  ctx.clip(path);
}

function scratchInterpolate(holes, point) {
  const last = holes[holes.length - 1];
  if (!last) return [point];
  const dx = point.x - last.x;
  const dy = point.y - last.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= SCRATCH_STEP) return [point];
  const steps = Math.min(Math.ceil(dist / SCRATCH_STEP), 24);
  const filled = [];
  for (let i = 1; i <= steps; i += 1) {
    filled.push({ x: last.x + (dx * i) / steps, y: last.y + (dy * i) / steps });
  }
  return filled;
}

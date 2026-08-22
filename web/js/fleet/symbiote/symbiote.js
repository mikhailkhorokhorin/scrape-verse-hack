"use strict";

const SYMBIOTE_EDGE_STEP = 14;

function symbioteHTML(spread) {
  return (
    '<div class="symbiote" style="--spread:' + spread + '">' +
      '<div class="symbiote__body"></div>' +
      '<div class="symbiote__teeth"></div>' +
    "</div>"
  );
}

function symbioteEdgeAt(t) {
  return Math.sin(t * 23.7) * 0.55 + Math.sin(t * 11.3 + 1.7) * 0.3 +
    Math.sin(t * 47.1 + 0.4) * 0.15;
}

function symbioteEdgePath(ctx, w, h, top) {
  const amp = Math.min(16, Math.max(8, w * 0.03));
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += SYMBIOTE_EDGE_STEP) {
    ctx.lineTo(x, top + symbioteEdgeAt(x / w) * amp);
  }
  ctx.lineTo(w, top + symbioteEdgeAt(1) * amp);
  ctx.lineTo(w, h);
  ctx.closePath();
}

function symbioteFillBody(ctx, w, h, top, ink) {
  ctx.fillStyle = ink;
  symbioteEdgePath(ctx, w, h, top);
  ctx.fill();
}

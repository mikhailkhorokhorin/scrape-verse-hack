"use strict";

function legPairSVG(build, field, state, index, seed) {
  const pedipalp = index === 4;
  const slot = pedipalp ? PEDIPALP_SLOT : LEG_SLOTS[index];
  const scale = pedipalp ? 0.46 : 1;
  const delay = ((seed + index * 37) % 11) / 10 + 6;
  const shaped = pedipalp
    ? Object.assign({}, build, {
      legSpan: build.legSpan * scale,
      legDrop: build.legDrop * scale,
      legBend: build.legBend * scale,
    })
    : build;
  const width = pedipalp ? build.legWidth * 0.72 : build.legWidth;
  return [-1, 1].map((side) => {
    const d = legPath(shaped, slot, side, state);
    return '<path class="rig__leg' + (pedipalp ? " rig__leg--palp" : "") + '" d="' + d +
      '" data-state="' + state + '" data-field="' + esc(field) +
      '" style="--rig-delay:' + delay.toFixed(1) + 's;stroke-width:' + width.toFixed(1) + '"/>';
  }).join("");
}

function legsSVG(sp, build, seed) {
  const fields = (sp.fieldOrder || FIELDS || []).slice(0, 5);
  const states = sp.fields || {};
  return fields
    .map((field, i) => legPairSVG(build, field, states[field] || "dead", i, seed))
    .join("");
}

function eyesSVG(build, status) {
  const lit = litRankFor(status);
  return eyeRow(build)
    .map((eye) => {
      const on = lit > 0 && eye.rank <= lit;
      return '<circle class="rig__eye" cx="' + eye.cx + '" cy="' + eye.cy + '" r="' + eye.r +
        '" data-lit="' + (on ? "1" : "0") + '"/>';
    })
    .join("");
}

function rigSVG(sp, status) {
  const build = rigBuildOf(sp.code);
  const seed = seedOf(sp.code || "");
  const blink = (seed % 7) + 4;
  const sway = (seed % 5) + 9;
  return (
    '<svg class="rig" viewBox="-72 12 144 88" role="img" aria-hidden="true" ' +
      'data-status="' + status + '" data-code="' + esc(sp.code) + '" ' +
      'style="--rig-blink:' + blink + 's;--rig-sway:' + sway + 's">' +
      '<g class="rig__legs">' + legsSVG(sp, build, seed) + "</g>" +
      '<g class="rig__body">' +
        '<ellipse class="rig__abdomen" cx="0" cy="' + build.body.cy + '" rx="' + build.body.rx +
          '" ry="' + build.body.ry + '"/>' +
        '<path class="rig__plate" d="' + build.plate + '"/>' +
        '<ellipse class="rig__head" cx="0" cy="' + build.head.cy + '" rx="' + build.head.rx +
          '" ry="' + build.head.ry + '"/>' +
        '<path class="rig__mark" d="' + build.mark + '"/>' +
        '<g class="rig__eyes">' + eyesSVG(build, status) + "</g>" +
      "</g>" +
    "</svg>"
  );
}

function rigLabelsSVG(sp) {
  const build = rigBuildOf(sp.code);
  const fields = (sp.fieldOrder || FIELDS || []).slice(0, 5);
  return fields
    .map((field, i) => {
      const pedipalp = i === 4;
      const slot = pedipalp ? PEDIPALP_SLOT : LEG_SLOTS[i];
      const scale = pedipalp ? 0.46 : 1;
      const spread = 1 - slot * 0.12;
      const y = build.body.cy + (slot - 1.5) * build.body.ry * 0.44 +
        build.legDrop * scale + slot * 4 + 6;
      const x = build.body.rx * 0.72 + build.legSpan * scale * spread + 4;
      return '<text class="rig__label" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
        '">' + esc(field) + "</text>";
    })
    .join("");
}

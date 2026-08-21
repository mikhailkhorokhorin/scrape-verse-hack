"use strict";

const REPLAY = {
  model: null,
  root: null,
  slots: null,
  duration: 0,
  elapsed: 0,
  playing: false,
  frame: null,
  last: 0,
  stage: -1,
};

function reducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function replaySlots(root) {
  const slots = {};
  root.querySelectorAll("[data-slot]").forEach((el) => { slots[el.dataset.slot] = el; });
  return slots;
}

function stageIndexAt(model, ms) {
  let index = 0;
  model.stages.forEach((st, i) => { if (ms >= st.at) index = i; });
  return index;
}

function isFinalStage(model, stageIndex) {
  return model.stages[stageIndex].name === "VERIFIED";
}

function fieldStateAt(model, field, stageIndex) {
  return isFinalStage(model, stageIndex) ? field.after : field.broken;
}

function fieldValueAt(model, field, stageIndex) {
  if (!isFinalStage(model, stageIndex)) return field.dirtyValue;
  return field.recovered ? field.cleanValue : field.dirtyValue;
}

function paintLedger(model, slots, stageIndex) {
  const rows = slots.ledger.querySelectorAll(".rledger__row");
  model.fields.forEach((field, i) => {
    const row = rows[i];
    if (!row) return;
    const state = fieldStateAt(model, field, stageIndex);
    const was = row.dataset.state;
    row.dataset.state = state;
    row.className = "rledger__row rledger__row--" + state;
    if (was && was !== state) {
      row.classList.add("is-flip");
      setTimeout(() => row.classList.remove("is-flip"), 400);
    }
    row.querySelector('[data-slot="state"]').textContent = GLYPH[state] + " " + state;
    const valueSlot = row.querySelector('[data-slot="value"]');
    const rawValue = fieldValueAt(model, field, stageIndex);
    valueSlot.innerHTML = replayValue(rawValue);
    valueSlot.title = valueLiteral(rawValue);
  });
}

function paintStage(model, slots, stageIndex) {
  const stage = model.stages[stageIndex];
  const integ = stage.integrity;
  const grade = stage.panelState;

  const wordColor = COLOR[stage.color] || FIELD_COLOR[stage.color] || COLOR.critical;
  slots.word.textContent = stage.word;
  slots.word.style.color = wordColor;
  slots.clock.textContent = stage.clock;
  slots.index.textContent = stageIndex + 1 + " of " + model.stages.length;
  slots.name.textContent = stage.name;
  slots.line.textContent = stage.line;
  slots.pct.textContent = integ + "%";
  slots.pct.style.color = COLOR[grade] || COLOR.critical;
  slots.fill.style.width = integ + "%";
  slots.fill.style.background = COLOR[grade] || COLOR.critical;

  slots.badge.textContent = grade;
  slots.badge.className = "badge badge--" + grade;
  slots.panelpct.textContent = integ + "%";
  slots.panelpct.style.color = COLOR[grade] || COLOR.critical;

  const panel = slots.panel;
  panel.className = "rpanel is-" + grade;
  const spread = ((100 - integ) / 100).toFixed(2);
  slots.symbiote.style.setProperty("--spread", spread);
  slots.symbiote.hidden = Number(spread) <= MIN_VISIBLE_SPREAD;

  paintLedger(model, slots, stageIndex);

  if (stageIndex !== REPLAY.stage) {
    if (REPLAY.playing && REPLAY.stage !== -1 && !reducedMotion()) {
      burst(panel, stage.word, wordColor);
    }
    REPLAY.stage = stageIndex;
  }

  REPLAY.root.querySelectorAll(".rtick").forEach((tick, i) => {
    tick.classList.toggle("is-past", i < stageIndex);
    tick.classList.toggle("is-now", i === stageIndex);
  });
}

function paintBlast(model, slots, ms) {
  if (!slots.blast || !model.blastRows) return;
  const verified = model.stages.find((st) => st.name === "VERIFIED");
  const stop = verified ? verified.at : model.span;
  const ratio = stop > 0 ? Math.min(1, ms / stop) : 1;
  slots.blast.textContent = groupNum(model.blastRows * ratio);
  slots.blast.classList.toggle("is-frozen", ratio >= 1);
}

function paintScrub(model, slots, ms) {
  paintBlast(model, slots, ms);
  const ratio = model.span > 0 ? Math.min(1, ms / model.span) : 0;
  slots.done.style.width = (ratio * 100).toFixed(3) + "%";
  slots.head.style.left = (ratio * 100).toFixed(3) + "%";
  slots.elapsed.textContent = "+" + elapsedOf(ms);
  const input = document.getElementById("replay-scrub");
  if (input && document.activeElement !== input) input.value = String(Math.round(ratio * 1000));
  if (input) {
    input.setAttribute("aria-valuetext",
      model.stages[stageIndexAt(model, ms)].name + ", +" + elapsedOf(ms));
  }
}

function replaySeek(ms) {
  const model = REPLAY.model;
  if (!model) return;
  REPLAY.elapsed = Math.min(model.span, Math.max(0, ms));
  paintStage(model, REPLAY.slots, stageIndexAt(model, REPLAY.elapsed));
  paintScrub(model, REPLAY.slots, REPLAY.elapsed);
}

function replayStep(delta) {
  const model = REPLAY.model;
  if (!model) return;
  const next = Math.min(model.stages.length - 1,
    Math.max(0, stageIndexAt(model, REPLAY.elapsed) + delta));
  replayPause();
  replaySeek(model.stages[next].at);
}

function replayTick(now) {
  if (!REPLAY.playing) return;
  const model = REPLAY.model;
  const step = REPLAY.last ? now - REPLAY.last : 0;
  REPLAY.last = now;
  const next = REPLAY.elapsed + (step / REPLAY.duration) * model.span;
  if (next >= model.span) {
    replaySeek(model.span);
    replayPause();
    return;
  }
  replaySeek(next);
  REPLAY.frame = requestAnimationFrame(replayTick);
}

function replayPause() {
  REPLAY.playing = false;
  REPLAY.last = 0;
  if (REPLAY.frame) cancelAnimationFrame(REPLAY.frame);
  REPLAY.frame = null;
  if (REPLAY.slots) REPLAY.slots.toggle.textContent = "Play";
  if (REPLAY.root) REPLAY.root.classList.remove("is-playing");
}

function replayPlay() {
  const model = REPLAY.model;
  if (!model) return;
  if (REPLAY.elapsed >= model.span) { REPLAY.stage = -1; replaySeek(0); }
  REPLAY.playing = true;
  REPLAY.last = 0;
  REPLAY.slots.toggle.textContent = "Pause";
  REPLAY.root.classList.add("is-playing");
  REPLAY.frame = requestAnimationFrame(replayTick);
}

function replayToggle() {
  if (REPLAY.playing) replayPause(); else replayPlay();
}

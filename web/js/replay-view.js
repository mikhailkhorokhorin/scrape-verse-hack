"use strict";

const REPLAY_SPEED = 90;
const REPLAY_MIN_MS = 9000;
const REPLAY_MAX_MS = 26000;

function replayDuration(span) {
  return Math.min(REPLAY_MAX_MS, Math.max(REPLAY_MIN_MS, span / REPLAY_SPEED));
}

function replayValue(raw) {
  if (raw === null || raw === undefined) return "null";
  const text = String(raw);
  return '"' + esc(text.length > 34 ? text.slice(0, 33) + "…" : text) + '"';
}

function ledgerRowHTML(field) {
  return (
    '<div class="rledger__row" data-field="' + esc(field.name) + '">' +
      '<span class="rledger__name mono">' + esc(field.name) + "</span>" +
      '<span class="rledger__state" data-slot="state"></span>' +
      '<span class="rledger__val mono" data-slot="value"></span>' +
    "</div>"
  );
}

function tickHTML(stage, i, span) {
  const at = span > 0 ? (stage.at / span) * 100 : 0;
  return (
    '<button class="rtick" type="button" data-stage="' + i + '"' +
      ' style="left:' + at.toFixed(3) + '%"' +
      ' aria-label="Jump to ' + esc(stage.name) + " at " + esc(stage.clock) + '">' +
      '<span class="rtick__pip"></span>' +
      '<span class="rtick__name">' + esc(stage.name) + "</span>" +
      '<span class="rtick__at mono">+' + esc(stage.offset) + "</span>" +
    "</button>"
  );
}

function replayHeadHTML(model) {
  const strain = model.strain
    ? '<span class="rstrain">' + esc(model.strain) + "</span>"
    : "";
  const cid = model.collector
    ? '<span class="cid">' + esc(model.collector) + "</span>"
    : "";
  return (
    '<div class="replay__head">' +
      "<div>" +
        '<span class="incident__who">' + esc(model.spider) + "</span>" +
        strain +
        '<p class="replay__id mono">' + esc(model.id) + " · opened " +
          esc(clockOf(model.openedAt)) + " · " + esc(model.spanText) + " to close</p>" +
      "</div>" +
      '<div class="replay__delta">' + cid +
        '<span class="incident__delta"><b>' + model.before + "% → </b><i>" +
          model.after + "%</i></span>" +
      "</div>" +
    "</div>"
  );
}

function replayStageHTML(model) {
  return (
    '<div class="rstage" data-slot="stage">' +
      '<div class="rstage__mark">' +
        '<span class="rstage__word" data-slot="word"></span>' +
        '<span class="rstage__clock mono" data-slot="clock"></span>' +
      "</div>" +
      '<div class="rstage__read">' +
        '<span class="label">Stage <b data-slot="index"></b></span>' +
        '<h4 class="rstage__name" data-slot="name"></h4>' +
        '<p class="rstage__line" data-slot="line"></p>' +
      "</div>" +
      '<div class="rstage__meter">' +
        '<span class="rstage__pct mono" data-slot="pct"></span>' +
        '<span class="label">Integrity</span>' +
        '<div class="bar"><div class="bar__fill" data-slot="fill"></div></div>' +
      "</div>" +
    "</div>"
  );
}

function replayTransportHTML(model) {
  return (
    '<div class="rtransport">' +
      '<button class="btn btn--fix rplay" id="replay-toggle" type="button" aria-label="Play the incident timeline">' +
        '<span data-slot="toggle">Play</span>' +
      "</button>" +
      '<div class="rscrub">' +
        '<div class="rscrub__rail">' +
          '<div class="rscrub__done" data-slot="done"></div>' +
          '<div class="rscrub__head" data-slot="head"></div>' +
          model.stages.map((st, i) => tickHTML(st, i, model.span)).join("") +
        "</div>" +
        '<input class="rscrub__input" id="replay-scrub" type="range" min="0" max="1000" value="0" step="1"' +
          ' aria-label="Scrub the incident timeline" aria-valuetext="' +
          esc(model.stages[0].name) + ', +0s">' +
      "</div>" +
      '<span class="rclock mono" data-slot="elapsed">+0s</span>' +
    "</div>"
  );
}

function replayPanelHTML(model) {
  return (
    '<div class="rpanel" data-slot="panel">' +
      '<div class="symbiote rpanel__symbiote" data-slot="symbiote"><div class="symbiote__body"></div></div>' +
      '<div class="rpanel__head">' +
        '<h4 class="codename">' + esc(model.spider) + "</h4>" +
        '<span class="badge" data-slot="badge"></span>' +
      "</div>" +
      '<span class="rpanel__pct mono" data-slot="panelpct"></span>' +
      '<div class="rledger" data-slot="ledger">' +
        model.fields.map(ledgerRowHTML).join("") +
      "</div>" +
    "</div>"
  );
}

function replayNoteHTML(model) {
  const prompt = model.prompt
    ? '<p class="replay__prompt"><span class="label">Prompt handed to the healer</span>' +
      '<span class="mono">' + esc(model.prompt) + "</span></p>"
    : "";
  return (
    '<div class="replay__note">' +
      "<p>Every timestamp below is recorded, not generated. A re-weave takes up to fifteen " +
        "minutes, so it cannot be filmed live — this plays the real <b>" + esc(model.spanText) +
        "</b> back at a watchable pace.</p>" +
      prompt +
    "</div>"
  );
}

function replayHTML(model) {
  return (
    replayHeadHTML(model) +
    replayNoteHTML(model) +
    '<div class="replay__stagerow">' +
      replayPanelHTML(model) +
      '<div class="replay__col">' +
        replayStageHTML(model) +
        replayTransportHTML(model) +
      "</div>" +
    "</div>"
  );
}

function replayEmptyHTML() {
  return plateHTML(
    "NOTHING TO REPLAY YET",
    "<p>Replay needs a closed incident: a break the watch caught, described, handed to " +
      "the healer, and verified. None has been recorded, so there is no timeline to play " +
      "and nothing here is invented to fill the gap.</p>" +
      "<p>The moment one closes, its four stages land on this rail with their real " +
        "timestamps — the intervals you see are the intervals that happened.</p>",
    "quiet",
    "<span>Stages <b>detected → diagnosed → re-weaving → verified</b></span>" +
      "<span>Played from <b>recorded time</b></span>"
  );
}

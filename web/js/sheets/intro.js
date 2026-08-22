"use strict";

const INTRO = { running: false, timers: [], panel: null, end: null, beats: null };

function introForced() {
  return new URLSearchParams(location.search).get("intro") === "1";
}

function introPanelFor(inc) {
  return panelOf(inc.spider) || document.querySelector(".panel");
}

function introSnapshot(panel) {
  return {
    spread: panel.style.getPropertyValue("--spread"),
    drowned: panel.dataset.drowned || null,
    className: panel.className,
    cellClass: panel.closest(".cell") ? panel.closest(".cell").className : null,
    readout: panel.querySelector(".integrity__value")
      ? panel.querySelector(".integrity__value").textContent
      : null,
    fill: panel.querySelector(".bar__fill")
      ? panel.querySelector(".bar__fill").style.width
      : null,
  };
}

function introRestore(panel, shot) {
  if (!panel || !shot) return;
  panel.className = shot.className;
  const cell = panel.closest(".cell");
  if (cell && shot.cellClass !== null) cell.className = shot.cellClass;
  if (shot.spread) panel.style.setProperty("--spread", shot.spread);
  else panel.style.removeProperty("--spread");
  if (shot.drowned === null) delete panel.dataset.drowned;
  else panel.dataset.drowned = shot.drowned;
  const readout = panel.querySelector(".integrity__value");
  if (readout && shot.readout !== null) readout.textContent = shot.readout;
  const fill = panel.querySelector(".bar__fill");
  if (fill && shot.fill !== null) fill.style.width = shot.fill;
}

function introPaint(panel, beat) {
  const spread = introSpreadOf(beat.integrity);
  const grade = beat.name === "weave" || beat.name === "purge"
    ? "reweaving"
    : gradeOf(beat.integrity);

  panel.style.setProperty("--spread", spread);
  if (Number(spread) > PAPER_SPREAD) panel.dataset.drowned = "1";
  else delete panel.dataset.drowned;

  panel.className = panel.className.replace(/\bis-\w+/g, "").trim() + " is-" + grade;
  const cell = panel.closest(".cell");
  if (cell) cell.className = cell.className.replace(/\bcell--\w+/g, "").trim() + " cell--" + grade;

  const readout = panel.querySelector(".integrity__value");
  if (readout) readout.textContent = beat.integrity + "%";
  const fill = panel.querySelector(".bar__fill");
  if (fill) fill.style.width = beat.integrity + "%";

  if (beat.word) burst(panel, beat.word, COLOR[beat.color] || COLOR.critical);
  if (beat.word === "SNAP!" || beat.word === "THWIP!") {
    panel.classList.remove("is-hit");
    void panel.offsetWidth;
    panel.classList.add("is-hit");
    setTimeout(() => panel.classList.remove("is-hit"), 240);
  }
}

function introClear() {
  INTRO.timers.forEach(clearTimeout);
  INTRO.timers = [];
}

function introFinish() {
  if (!INTRO.running) return;
  INTRO.running = false;
  introClear();
  document.documentElement.classList.remove("intro-running");
  introUnbindSkip();
  introRestore(INTRO.panel, INTRO.end);
  if (INTRO.panel) INTRO.panel.classList.remove("is-hit");
  document.querySelectorAll(".burst").forEach((b) => b.remove());
  document.querySelectorAll(".has-burst").forEach((c) => c.classList.remove("has-burst"));
  introMarkSeen(sessionStorage);
  INTRO.panel = null;
  INTRO.end = null;
  introSyncButton();
}

function introSkip() {
  introFinish();
}

const INTRO_SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];

function introBindSkip() {
  INTRO_SKIP_EVENTS.forEach((name) => {
    window.addEventListener(name, introSkip, { passive: true, capture: true });
  });
}

function introUnbindSkip() {
  INTRO_SKIP_EVENTS.forEach((name) => {
    window.removeEventListener(name, introSkip, { capture: true });
  });
}

function introSyncButton() {
  const btn = document.getElementById("intro-replay");
  if (!btn) return;
  btn.disabled = INTRO.running;
  btn.textContent = INTRO.running ? "PLAYING…" : "REPLAY INTRO";
}

function introPlay(inc) {
  if (INTRO.running) return false;
  const panel = introPanelFor(inc);
  if (!panel) return false;

  INTRO.running = true;
  INTRO.panel = panel;
  INTRO.end = introSnapshot(panel);
  INTRO.beats = introBeats(inc);
  document.documentElement.classList.add("intro-running");
  introSyncButton();
  introBindSkip();

  INTRO.beats.forEach((beat) => {
    if (beat.name === "live") return;
    INTRO.timers.push(setTimeout(() => {
      if (INTRO.running) introPaint(panel, beat);
    }, beat.at));
  });
  INTRO.timers.push(setTimeout(introFinish, INTRO_SPAN_MS));
  return true;
}

function introMaybePlay() {
  const inc = introIncidentOf(RAW_INCIDENTS);
  const decision = introDecision({
    reducedMotion: prefersReducedMotion(),
    forced: introForced(),
    seen: introSeen(sessionStorage),
    hasIncident: Boolean(inc),
  });
  if (!decision.play) {
    if (decision.why !== "forced") introMarkSeen(sessionStorage);
    return decision;
  }
  introPlay(inc);
  return decision;
}

function introReplay() {
  if (INTRO.running) return;
  const inc = introIncidentOf(RAW_INCIDENTS);
  if (!inc) return;
  introPlay(inc);
}

function mountIntroControl() {
  const btn = document.getElementById("intro-replay");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    introReplay();
  });
  introSyncButton();
}

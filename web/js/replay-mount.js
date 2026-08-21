"use strict";

function bindReplayKeys(root) {
  root.addEventListener("keydown", (e) => {
    const onControl = e.target.closest("button,input");
    if (e.key === " " || e.key === "k") {
      if (onControl && e.key === " ") return;
      e.preventDefault();
      replayToggle();
      return;
    }
    if (e.target.matches("input")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); replayStep(1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); replayStep(-1); return; }
    if (e.key === "Home") { e.preventDefault(); replayPause(); replaySeek(0); return; }
    if (e.key === "End") {
      e.preventDefault();
      replayPause();
      replaySeek(REPLAY.model ? REPLAY.model.span : 0);
    }
  });
}

function bindReplay(root, model) {
  document.getElementById("replay-toggle").addEventListener("click", replayToggle);

  const input = document.getElementById("replay-scrub");
  input.addEventListener("input", () => {
    replayPause();
    replaySeek((Number(input.value) / 1000) * model.span);
  });

  root.querySelectorAll(".rtick").forEach((tick) => {
    tick.addEventListener("click", () => {
      replayPause();
      replaySeek(model.stages[Number(tick.dataset.stage)].at);
    });
  });

  bindReplayKeys(root);
}

function renderReplay() {
  const root = document.getElementById("replay");
  const head = document.getElementById("replayhead");
  if (!root) return;

  replayPause();
  REPLAY.model = null;
  REPLAY.stage = -1;
  REPLAY.elapsed = 0;

  const source = MOCK ? MOCK_RAW_INCIDENTS : RAW_INCIDENTS;
  const model = pickReplay(source, RAW_HISTORY);

  if (!model) {
    root.innerHTML = replayEmptyHTML();
    root.classList.remove("replay--live");
    if (head) head.hidden = true;
    return;
  }

  root.innerHTML = replayHTML(model);
  root.classList.add("replay--live");
  if (head) { head.hidden = false; head.textContent = model.spanText + " replayed"; }

  REPLAY.model = model;
  REPLAY.root = root;
  REPLAY.slots = replaySlots(root);
  REPLAY.duration = replayDuration(model.span);

  bindReplay(root, model);
  replaySeek(0);
}

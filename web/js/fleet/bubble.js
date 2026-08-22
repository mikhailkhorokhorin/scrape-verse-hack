"use strict";

const BUBBLE = { node: null, cell: null, timer: null };

function bubbleBlocked() {
  return document.documentElement.classList.contains("intro-running");
}

function bubbleClear() {
  if (BUBBLE.timer !== null) {
    clearTimeout(BUBBLE.timer);
    BUBBLE.timer = null;
  }
  if (BUBBLE.node) BUBBLE.node.remove();
  if (BUBBLE.cell) BUBBLE.cell.classList.remove("has-bubble");
  BUBBLE.node = null;
  BUBBLE.cell = null;
}

function bubbleMount(panel, line) {
  if (!panel || !line) return null;
  const cell = panel.closest(".cell") || panel;
  bubbleClear();
  const node = document.createElement("div");
  node.className = "bubble bubble--" + line.voice;
  node.setAttribute("role", "status");
  node.textContent = line.text;
  cell.classList.add("has-bubble");
  cell.appendChild(node);
  BUBBLE.node = node;
  BUBBLE.cell = cell;
  BUBBLE.timer = setTimeout(bubbleClear, SPEECH_MS);
  return node;
}

function speak(delta, spiders) {
  if (bubbleBlocked()) return null;
  const pick = speechPickOf(delta, spiders);
  if (!pick) return null;
  return bubbleMount(panelOf(pick.code), pick) ? pick : null;
}

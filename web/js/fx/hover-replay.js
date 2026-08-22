"use strict";

const HOVER_TAIL = 200;
const HOVER_KEY = "hoverAt";

function hoverReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion:reduce)").matches;
}

function hoverReady(el, cooldownMs) {
  const last = Number(el.dataset[HOVER_KEY] || 0);
  const now = Date.now();
  if (last && now - last < cooldownMs) return false;
  el.dataset[HOVER_KEY] = String(now);
  return true;
}

function hoverReplay(el, fire, cooldownMs) {
  if (!el || typeof fire !== "function") return null;
  if (el.dataset.hoverBound === "1") return null;
  el.dataset.hoverBound = "1";
  const wait = Number(cooldownMs) > 0 ? Number(cooldownMs) + HOVER_TAIL : HOVER_TAIL;
  const on = () => {
    if (hoverReduced()) return;
    if (!hoverReady(el, wait)) return;
    fire();
  };
  el.addEventListener("mouseenter", on);
  return on;
}

function hoverClear(el, className) {
  el.classList.remove(className);
}

function hoverRestart(el, className, animName) {
  if (!el || !className) return false;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  const name = animName || getComputedStyle(el).animationName;
  const off = (event) => {
    if (event.target !== el) return;
    if (name && event.animationName !== name) return;
    el.removeEventListener("animationend", off);
    el.removeEventListener("animationcancel", off);
    hoverClear(el, className);
  };
  el.addEventListener("animationend", off);
  el.addEventListener("animationcancel", off);
  return true;
}

function hoverDelegate(root, selector, fire, cooldownMs) {
  if (!root || !selector || typeof fire !== "function") return null;
  if (root.dataset.hoverDelegate === selector) return null;
  root.dataset.hoverDelegate = selector;
  const wait = Number(cooldownMs) > 0 ? Number(cooldownMs) + HOVER_TAIL : HOVER_TAIL;
  const on = (event) => {
    if (hoverReduced()) return;
    const target = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (!target || !root.contains(target)) return;
    if (!hoverReady(target, wait)) return;
    fire(target);
  };
  root.addEventListener("mouseover", on);
  return on;
}

const HOVER_PULSE_MS = 640;
const HOVER_SPARK_MS = 420;

function mountHoverPulse() {
  if (typeof document === "undefined" || !document.querySelector) return null;
  const host = document.querySelector(".readouts");
  if (!host) return null;
  return hoverDelegate(host, ".pulse", (dot) => hoverRestart(dot, "pulse--kick", "pulse-kick"), HOVER_PULSE_MS);
}

function mountHoverSparks() {
  if (typeof document === "undefined" || !document.querySelector) return null;
  const grid = document.getElementById("grid");
  if (!grid) return null;
  return hoverDelegate(grid, ".spark", (spark) => hoverRestart(spark, "spark--replay", "spark-replay"), HOVER_SPARK_MS);
}

function mountHoverReplay() {
  mountHoverPulse();
  mountHoverSparks();
}

if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("DOMContentLoaded", mountHoverReplay);
  if (document.readyState !== "loading") mountHoverReplay();
}

"use strict";

const SHEET_CLOSE_MS = 620;
const SHEET_CLOSE_PAD = 24;
const SHEET_CLOSE_MIN_FIT = 0.34;
const SHEET_CLOSE_MAX_H = 1.35;
const SHEET_CLOSERS = {};
const SHEET_CLOSE = { code: null, timer: null, cleanup: null };

function sheetCloseRegister(code, run) {
  if (typeof code !== "string" || typeof run !== "function") return false;
  SHEET_CLOSERS[code.toUpperCase()] = run;
  return true;
}

function sheetCloseArm(code) {
  SHEET_CLOSE.code = typeof code === "string" ? code.toUpperCase() : null;
}

function sheetCloserFor(code) {
  const key = typeof code === "string" ? code.toUpperCase() : "";
  return Object.prototype.hasOwnProperty.call(SHEET_CLOSERS, key) ? SHEET_CLOSERS[key] : null;
}

function sheetCloseReset() {
  if (SHEET_CLOSE.timer !== null) {
    clearTimeout(SHEET_CLOSE.timer);
    SHEET_CLOSE.timer = null;
  }
  if (typeof SHEET_CLOSE.cleanup === "function") {
    const undo = SHEET_CLOSE.cleanup;
    SHEET_CLOSE.cleanup = null;
    undo();
  }
  sheetCloseUnsilence();
}

function sheetCloseUnsilence() {
  if (typeof document === "undefined" || !document.querySelectorAll) return;
  document.querySelectorAll(".sheet--silenced").forEach((el) => {
    el.classList.remove("sheet--silenced");
  });
}

function sheetCloseSilence(sheet) {
  if (!sheet || !sheet.classList) return;
  sheet.classList.add("sheet--silenced");
}

function sheetCloseFit(box, view) {
  const h = box && box.height > 0 ? box.height : 1;
  const w = box && box.width > 0 ? box.width : 1;
  const room = Math.max(1, (view && view.h ? view.h : 1) - SHEET_CLOSE_PAD * 2);
  const wide = Math.max(1, (view && view.w ? view.w : 1) - SHEET_CLOSE_PAD * 2);
  const fit = Math.min(1, room / h, wide / w);
  return Number(Math.max(SHEET_CLOSE_MIN_FIT, fit).toFixed(4));
}

function sheetCloseFrame(sheet, view) {
  const box = sheet.getBoundingClientRect();
  const cap = Math.round(view.h * SHEET_CLOSE_MAX_H);
  const h = Math.min(Math.round(box.height), cap);
  const w = Math.round(box.width);
  const crop = Math.max(0, Math.round(-box.top));
  const scale = sheetCloseFit({ width: w, height: h }, view);
  return {
    box: box,
    w: w,
    h: h,
    crop: crop,
    scale: scale,
    left: Math.round((view.w - w) / 2),
    top: Math.round((view.h - h) / 2),
  };
}

function sheetCloseStage(modal, sheet, className) {
  const view = { w: window.innerWidth, h: window.innerHeight };
  const frame = sheetCloseFrame(sheet, view);
  const stage = document.createElement("div");
  stage.className = className;
  stage.setAttribute("aria-hidden", "true");
  stage.style.setProperty("--sc-top", frame.top + "px");
  stage.style.setProperty("--sc-left", frame.left + "px");
  stage.style.setProperty("--sc-w", frame.w + "px");
  stage.style.setProperty("--sc-h", frame.h + "px");
  stage.style.setProperty("--sc-crop", "-" + frame.crop + "px");
  stage.style.setProperty("--sc-fit", String(frame.scale));
  return { stage: stage, frame: frame, view: view };
}

function sheetCloseSkin(sheet, cls) {
  const wrap = document.createElement("div");
  wrap.className = cls;
  wrap.setAttribute("aria-hidden", "true");
  wrap.appendChild(sheetCloseFlatten(sheet.cloneNode(true)));
  return wrap;
}

function sheetCloseFlatten(node) {
  node.classList.remove("sheet--silenced");
  node.style.removeProperty("animation");
  node.style.removeProperty("opacity");
  node.removeAttribute("id");
  node.removeAttribute("role");
  node.removeAttribute("aria-modal");
  node.removeAttribute("aria-labelledby");
  node.setAttribute("aria-hidden", "true");
  node.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  node.querySelectorAll("button,a,input,select,textarea").forEach((el) => {
    el.setAttribute("tabindex", "-1");
  });
  return node;
}

function sheetCloseRun(modal, done) {
  const run = sheetCloserFor(SHEET_CLOSE.code);
  if (!run) return false;
  const sheet = modal.querySelector(".sheet");
  if (!sheet) return false;
  sheetCloseReset();
  let staged = null;
  try {
    staged = run(modal, sheet);
  } catch (err) {
    console.error(err);
    staged = null;
  }
  if (!staged || typeof staged.cleanup !== "function") {
    sheetCloseUnsilence();
    return false;
  }
  const ms = typeof staged.ms === "number" && staged.ms > 0 ? staged.ms : SHEET_CLOSE_MS;
  SHEET_CLOSE.cleanup = staged.cleanup;
  SHEET_CLOSE.timer = setTimeout(() => {
    SHEET_CLOSE.timer = null;
    sheetCloseReset();
    done();
  }, ms);
  return true;
}

function sheetCloseRand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

"use strict";

const PANELCUT_EXIT_MS = 180;
const PANELCUT_RAYS_MS = 260;
const PANELCUT = { exit: null, rays: null };

function panelcutQuiet() {
  if (typeof prefersReducedMotion === "function" && prefersReducedMotion()) return true;
  if (typeof CAPTURE === "boolean" && CAPTURE) return true;
  return false;
}

function panelcutOpen(modal) {
  if (!modal) return false;
  modal.classList.remove("is-closing");
  if (typeof sheetCloseReset === "function") sheetCloseReset();
  if (PANELCUT.exit !== null) {
    clearTimeout(PANELCUT.exit);
    PANELCUT.exit = null;
  }
  if (PANELCUT.rays !== null) {
    clearTimeout(PANELCUT.rays);
    PANELCUT.rays = null;
  }
  if (panelcutQuiet()) return false;
  if (typeof panelRaysFire === "function") {
    PANELCUT.rays = setTimeout(() => {
      PANELCUT.rays = null;
      panelRaysFire(modal);
    }, PANELCUT_RAYS_MS);
  }
  return true;
}

function panelcutClose(modal, done) {
  if (!modal) return false;
  if (PANELCUT.rays !== null) {
    clearTimeout(PANELCUT.rays);
    PANELCUT.rays = null;
  }
  if (panelcutQuiet()) {
    done();
    return false;
  }
  if (typeof sheetCloseRun === "function" && sheetCloseRun(modal, done)) return true;
  modal.classList.add("is-closing");
  PANELCUT.exit = setTimeout(() => {
    modal.classList.remove("is-closing");
    PANELCUT.exit = null;
    done();
  }, PANELCUT_EXIT_MS);
  return true;
}

"use strict";

const PORTAL_MS = 1200;
const PORTAL_SPIN_LO = 16;
const PORTAL_SPIN_HI = 34;

function portalRingSVG() {
  return (
    '<svg class="portal__ring" viewBox="0 0 200 200" width="200" height="200" ' +
      'aria-hidden="true" focusable="false">' +
      '<ellipse class="portal__glow" cx="100" cy="100" rx="86" ry="86" fill="none"/>' +
      '<ellipse class="portal__edge" cx="100" cy="100" rx="86" ry="86" fill="none"/>' +
      '<ellipse class="portal__core" cx="100" cy="100" rx="62" ry="62" fill="none"/>' +
    "</svg>"
  );
}

function portalMouth() {
  const mouth = document.createElement("div");
  mouth.className = "portal__mouth";
  mouth.setAttribute("aria-hidden", "true");
  mouth.innerHTML = portalRingSVG();
  return mouth;
}

function portalAim(skin, frame) {
  const box = frame.box;
  skin.style.setProperty("--portal-from-x", Math.round(box.left - frame.left) + "px");
  skin.style.setProperty("--portal-from-y", Math.round(box.top + frame.crop - frame.top) + "px");
}

function sheetPortalClose(modal, sheet) {
  const built = sheetCloseStage(modal, sheet, "portal");
  const stage = built.stage;
  const skin = sheetCloseSkin(sheet, "portal__skin");
  const spin = sheetCloseRand(PORTAL_SPIN_LO, PORTAL_SPIN_HI).toFixed(2);
  skin.style.setProperty("--portal-spin", spin + "deg");
  portalAim(skin, built.frame);
  stage.appendChild(portalMouth());
  stage.appendChild(skin);
  sheetCloseSilence(sheet);
  modal.appendChild(stage);
  modal.classList.add("is-porting");
  return {
    ms: PORTAL_MS,
    cleanup: () => {
      modal.classList.remove("is-porting");
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    },
  };
}

if (typeof sheetCloseRegister === "function") sheetCloseRegister("BODEGA", sheetPortalClose);

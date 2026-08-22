"use strict";

const ODO_DIGITS = "0123456789";

function odoCellsOf(text) {
  return String(text === null || text === undefined ? "" : text).split("");
}

function odoIsDigit(ch) {
  return ODO_DIGITS.indexOf(ch) >= 0;
}

function odoStripHTML(ch) {
  const at = ODO_DIGITS.indexOf(ch);
  const strip = ODO_DIGITS.split("")
    .map((d) => '<span class="odo__d">' + d + "</span>")
    .join("");
  return '<span class="odo__reel" style="--odo:' + at + '">' + strip + "</span>";
}

function odoHTML(text) {
  return odoCellsOf(text)
    .map((ch) => (odoIsDigit(ch)
      ? '<span class="odo__slot">' + odoStripHTML(ch) + "</span>"
      : '<span class="odo__fixed">' + esc(ch) + "</span>"))
    .join("");
}

function odoSameShape(el, text) {
  const cells = odoCellsOf(text);
  const slots = el.querySelectorAll(".odo__slot,.odo__fixed");
  if (slots.length !== cells.length) return false;
  for (let i = 0; i < cells.length; i += 1) {
    const isDigit = slots[i].classList.contains("odo__slot");
    if (isDigit !== odoIsDigit(cells[i])) return false;
    if (!isDigit && slots[i].textContent !== cells[i]) return false;
  }
  return true;
}

function odoRoll(el, text) {
  const cells = odoCellsOf(text);
  const slots = el.querySelectorAll(".odo__slot,.odo__fixed");
  cells.forEach((ch, i) => {
    if (!odoIsDigit(ch)) return;
    const reel = slots[i].querySelector(".odo__reel");
    if (reel) reel.style.setProperty("--odo", ODO_DIGITS.indexOf(ch));
  });
}

function setOdometer(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return false;
  const extras = Array.from(el.querySelectorAll(".readout__n,.readout__delta"));
  const body = el.querySelector(".odo");
  if (body && odoSameShape(body, text)) {
    odoRoll(body, text);
    const said = el.querySelector(".odo__said");
    if (said) said.textContent = text;
    el.style.color = color || "";
    return true;
  }
  el.textContent = "";
  const said = document.createElement("span");
  said.className = "odo__said";
  said.textContent = text;
  const fresh = document.createElement("span");
  fresh.className = "odo";
  fresh.setAttribute("aria-hidden", "true");
  fresh.innerHTML = odoHTML(text);
  el.appendChild(said);
  el.appendChild(fresh);
  extras.forEach((node) => el.appendChild(node));
  el.style.color = color || "";
  return true;
}

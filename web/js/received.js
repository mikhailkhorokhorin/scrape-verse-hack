"use strict";

const RECEIVED_MAX = 60;

function truncateMiddle(text, max) {
  if (text.length <= max) return text;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return text.slice(0, head) + "…" + text.slice(text.length - tail);
}

function receivedOf(sp, field) {
  const has = sp.sample && Object.prototype.hasOwnProperty.call(sp.sample, field);
  const raw = has ? sp.sample[field] : undefined;
  if (raw === null) return "null";
  if (raw === undefined) return "missing";
  if (typeof raw === "string") return '"' + truncateMiddle(raw, RECEIVED_MAX) + '"';
  return truncateMiddle(String(raw), RECEIVED_MAX);
}

function expectedOf(field) {
  return (Object.prototype.hasOwnProperty.call(EXPECTED, field) && EXPECTED[field]) || "a non-empty value";
}

function revealHTML(sp, field, state) {
  return (
    '<span class="reveal" role="tooltip">' +
      '<span class="reveal__row"><span class="reveal__key">expected</span>' +
      '<span class="reveal__val">' + esc(expectedOf(field)) + "</span></span>" +
      '<span class="reveal__row"><span class="reveal__key">received</span>' +
      '<span class="reveal__val reveal__val--' + state + '">' + esc(receivedOf(sp, field)) + "</span></span>" +
    "</span>"
  );
}

function stateOf(sp, field) {
  const raw = Object.prototype.hasOwnProperty.call(sp.fields || {}, field) ? sp.fields[field] : "dead";
  return raw === "live" || raw === "infected" ? raw : "dead";
}

function chipHTML(sp, field) {
  const state = stateOf(sp, field);
  const glyph = GLYPH[state];
  const label = glyph + " " + esc(field);
  if (state === "live") return '<span class="chip chip--live">' + label + "</span>";
  return (
    '<span class="chip chip--' + state + ' chip--reveals" tabindex="0" role="button"' +
      ' aria-label="' + esc(field) + " " + state + ', show received value">' +
      label + revealHTML(sp, field, state) +
    "</span>"
  );
}

function bindReveals(root) {
  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip--reveals");
    if (!chip) return;
    e.stopPropagation();
    e.preventDefault();
    const open = chip.classList.contains("is-open");
    root.querySelectorAll(".chip--reveals.is-open").forEach((c) => c.classList.remove("is-open"));
    if (!open) chip.classList.add("is-open");
  });

  root.addEventListener("keydown", (e) => {
    const chip = e.target.closest(".chip--reveals");
    if (!chip) return;
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      e.preventDefault();
      chip.classList.toggle("is-open");
    }
    if (e.key === "Escape") chip.classList.remove("is-open");
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest(".chip--reveals")) return;
    root.querySelectorAll(".chip--reveals.is-open").forEach((c) => c.classList.remove("is-open"));
  });
}

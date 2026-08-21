"use strict";

const SYMBIOTE_EYES =
  '<svg class="symbiote__eyes" viewBox="0 0 64 26" aria-hidden="true">' +
    '<path d="M1 6 C10 2 24 6 29 15 C20 20 6 16 1 6 Z"/>' +
    '<path d="M63 6 C54 2 40 6 35 15 C44 20 58 16 63 6 Z"/>' +
  "</svg>";

function symbioteHTML(spread) {
  return (
    '<div class="symbiote" style="--spread:' + spread + '">' +
      '<div class="symbiote__body"></div>' +
      '<div class="symbiote__teeth"></div>' +
    "</div>" +
    '<div class="symbiote-face" style="--spread:' + spread + '">' + SYMBIOTE_EYES + "</div>"
  );
}

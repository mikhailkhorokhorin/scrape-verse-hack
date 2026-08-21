"use strict";

const SYMBIOTE_EYES =
  '<svg class="symbiote__eyes" viewBox="0 0 74 26" aria-hidden="true">' +
    '<path d="M2 14 Q14 2 30 9 Q20 22 4 20 Z"/>' +
    '<path d="M72 14 Q60 2 44 9 Q54 22 70 20 Z"/>' +
  "</svg>";

function symbioteHTML(spread) {
  return (
    '<div class="symbiote" style="--spread:' + spread + '">' +
      '<div class="symbiote__body"></div>' +
      '<div class="symbiote__teeth"></div>' +
      SYMBIOTE_EYES +
    "</div>"
  );
}

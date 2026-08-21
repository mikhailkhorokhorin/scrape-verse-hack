"use strict";

function symbioteHTML(spread) {
  return (
    '<div class="symbiote" style="--spread:' + spread + '">' +
      '<div class="symbiote__body"></div>' +
      '<div class="symbiote__teeth"></div>' +
    "</div>"
  );
}

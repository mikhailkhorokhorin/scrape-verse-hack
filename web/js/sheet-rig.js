"use strict";

function sheetRigHTML(sp, st) {
  const fields = (sp.fieldOrder || FIELDS || []).slice(0, 5);
  const legend = fields
    .map((field) => {
      const state = (sp.fields && sp.fields[field]) || "dead";
      return '<li class="sheet-rig__key sheet-rig__key--' + state + '">' +
        '<span class="sheet-rig__field">' + esc(field) + "</span>" +
        '<span class="sheet-rig__state">' + state + "</span></li>";
    })
    .join("");

  return (
    '<div class="sheet-rig">' +
      '<div class="sheet-rig__art">' + rigSVG(sp, st) + "</div>" +
      "<div>" +
        '<p class="sheet-rig__lede">One mirrored pair of legs per expected field, in the order ' +
          "the collector returns them. A planted leg is a field that arrived and validated, a " +
          "twitching one arrived wrong, and a leg hanging in symbiote ink returned nothing" +
          (fields.length > 4
            ? ". The fifth pair renders as pedipalps, so the count still reads as a spider."
            : ".") +
        "</p>" +
        '<ul class="sheet-rig__keys">' + legend + "</ul>" +
      "</div>" +
    "</div>"
  );
}

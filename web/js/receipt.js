"use strict";

const VERDICT_WORD = {
  EVERY_FIELD_BACK: "every field checked came back",
  PARTIAL: "some fields came back, some did not",
  NOTHING_CAME_BACK: "the re-weave restored nothing",
  NOTHING_TO_CHECK: "no broken field to check",
  NOT_RUN: "no verification run completed",
};

function receiptRowHTML(check) {
  const mark = check.passed ? "✓" : "✗";
  const cls = check.passed ? "pass" : "fail";
  return (
    '<tr class="receipt__row receipt__row--' + cls + '">' +
      '<td class="receipt__mark">' + mark + "</td>" +
      '<td class="receipt__field">' + esc(check.field) + "</td>" +
      '<td class="receipt__was">' + esc(valueText(check.received_before)) + "</td>" +
      '<td class="receipt__now">' + esc(valueText(check.received_after)) + "</td>" +
    "</tr>"
  );
}

function receiptHTML(inc) {
  const v = inc && inc.verification;
  if (!v || !v.checks || !v.checks.length) return "";
  return (
    '<div class="receipt">' +
      '<p class="receipt__head">' +
        '<b>' + v.passed + " of " + v.checked + "</b> broken field" +
        (v.checked === 1 ? "" : "s") + " re-checked against the run after the heal &mdash; " +
        esc(VERDICT_WORD[v.verdict] || "") +
      "</p>" +
      '<table class="receipt__table">' +
        "<thead><tr>" +
          '<th class="receipt__mark"><span class="receipt__hidden">Result</span></th>' +
          "<th>Field</th><th>Received before</th><th>Received after</th>" +
        "</tr></thead>" +
        "<tbody>" + v.checks.map(receiptRowHTML).join("") + "</tbody>" +
      "</table>" +
    "</div>"
  );
}

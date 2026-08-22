"use strict";

const ROUTE = { wanted: null, applied: null };

function routeIncidentSource() {
  return MOCK ? MOCK_RAW_INCIDENTS : RAW_INCIDENTS;
}

function routedReplay() {
  if (!ROUTE.wanted) return null;
  const incident = findIssue(routeIncidentSource(), ROUTE.wanted);
  if (!incident) return null;
  return buildReplay(incident, RAW_HISTORY);
}

function routeMark(id) {
  document.querySelectorAll(".issue.is-open").forEach((el) => el.classList.remove("is-open"));
  document.body.classList.toggle("has-issue", Boolean(id));
  if (!id) return;
  const card = document.querySelector('.issue[data-inc="' + id + '"]');
  if (card) card.classList.add("is-open");
}

function routeScrollTo() {
  const section = document.getElementById("replay");
  if (!section) return;
  section.scrollIntoView({ block: "start", behavior: "smooth" });
}

function applyRoute(scroll) {
  const model = routedReplay();
  const landed = model ? ROUTE.wanted : null;
  const changed = landed !== ROUTE.applied;
  ROUTE.applied = landed;
  routeMark(landed);
  if (changed) renderReplay();
  if (landed && scroll) routeScrollTo();
}

function readRoute() {
  ROUTE.wanted = parseIssueHash(location.hash);
}

function routeRefresh() {
  readRoute();
  applyRoute(false);
}

function onHashChange() {
  readRoute();
  applyRoute(true);
}

window.addEventListener("hashchange", onHashChange);
readRoute();

"use strict";

const ROUTE = { wanted: null, applied: null };

function routeIncidentSource() {
  return MOCK ? MOCK_RAW_INCIDENTS : RAW_INCIDENTS;
}

function routeReplayFor(id) {
  const incident = findIssue(routeIncidentSource(), id);
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

function routeScrollTo(id) {
  const section = document.getElementById("replay");
  if (!section || !id) return;
  section.scrollIntoView({ block: "start", behavior: "smooth" });
}

function applyRoute(scroll) {
  const id = ROUTE.wanted;
  if (!id) {
    if (ROUTE.applied !== null) {
      ROUTE.applied = null;
      routeMark(null);
      renderReplay();
    }
    return;
  }

  const model = routeReplayFor(id);
  if (!model) {
    if (ROUTE.applied !== null) {
      ROUTE.applied = null;
      renderReplay();
    }
    routeMark(null);
    return;
  }

  ROUTE.applied = id;
  mountReplay(model);
  routeMark(id);
  if (scroll) routeScrollTo(id);
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

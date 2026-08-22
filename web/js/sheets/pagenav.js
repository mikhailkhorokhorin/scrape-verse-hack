"use strict";

const PAGENAV_SECTIONS = [
  { target: "nav-watch", watch: "grid", label: "THE WATCH" },
  { target: "haulhead", watch: "haul", label: "THE HAUL" },
  { target: "nav-replay", watch: "replay", label: "REPLAY" },
  { target: "nav-feed", watch: "feed", label: "FEED" },
];

const PAGENAV_PAGES = [{ href: "manual.html", label: "MANUAL" }];

const PAGENAV = { root: null, links: new Map(), seen: new Map(), current: null };

function pagenavMarkup() {
  const links = PAGENAV_SECTIONS.map((section) =>
    '<a class="pagenav__link" href="#' + section.target +
    '" data-nav="' + section.target + '">' + section.label + "</a>"
  ).join("");
  const pages = PAGENAV_PAGES.map((page) =>
    '<a class="pagenav__link pagenav__link--page" href="' + page.href +
    '">' + page.label + "</a>"
  ).join("");
  return '<span class="pagenav__mark" aria-hidden="true">THWIP</span>' +
    '<span class="pagenav__links">' + links + "</span>" +
    '<span class="pagenav__pages">' + pages + "</span>";
}

function pagenavBuild() {
  const nav = document.createElement("nav");
  nav.className = "pagenav";
  nav.id = "pagenav";
  nav.setAttribute("aria-label", "Sections");
  nav.innerHTML = pagenavMarkup();
  document.body.appendChild(nav);
  nav.querySelectorAll(".pagenav__link").forEach((link) => {
    PAGENAV.links.set(link.dataset.nav, link);
  });
  return nav;
}

function pagenavShow(on) {
  if (!PAGENAV.root) return;
  PAGENAV.root.classList.toggle("is-up", Boolean(on));
}

function pagenavMark(target) {
  if (PAGENAV.current === target) return;
  PAGENAV.current = target;
  PAGENAV.links.forEach((link, key) => {
    const on = key === target;
    link.classList.toggle("is-here", on);
    if (on) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

function pagenavPick() {
  let best = null;
  let bestRatio = 0;
  PAGENAV_SECTIONS.forEach((section) => {
    const ratio = PAGENAV.seen.get(section.target) || 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = section.target;
    }
  });
  if (best) pagenavMark(best);
}

function pagenavWatchMasthead() {
  const masthead = document.querySelector(".masthead");
  if (!masthead) {
    pagenavShow(true);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => pagenavShow(!entry.isIntersecting));
  }, { threshold: 0 });
  observer.observe(masthead);
}

function pagenavWatchSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const key = entry.target.dataset.navWatch;
      if (key) PAGENAV.seen.set(key, entry.isIntersecting ? entry.intersectionRatio : 0);
    });
    pagenavPick();
  }, { threshold: [0, 0.02, 0.15, 0.4, 0.75, 1] });

  PAGENAV_SECTIONS.forEach((section) => {
    const el = document.getElementById(section.watch);
    if (!el) return;
    el.dataset.navWatch = section.target;
    observer.observe(el);
  });
}

function mountPagenav() {
  if (typeof document === "undefined" || !document.body) return null;
  if (document.getElementById("pagenav")) return null;
  if (typeof IntersectionObserver === "undefined") return null;
  PAGENAV.root = pagenavBuild();
  pagenavWatchMasthead();
  pagenavWatchSections();
  return PAGENAV.root;
}

if (typeof document !== "undefined" && document.body) mountPagenav();

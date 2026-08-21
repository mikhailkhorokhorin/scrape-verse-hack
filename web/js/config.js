"use strict";

const DATA = { history: "data/history.json", incidents: "data/incidents.json" };
const REFRESH_MS = 60000;
const UNWATCHED_MS = 3 * 60 * 60 * 1000;
const FULL_SERIES = 6;
const SERIES_MAX_POINTS = 48;
const FIELD_TRACK_MAX = 40;
const MIN_STREAK = 5;

const HEALTHY_MIN = 90;
const DEGRADED_MIN = 60;
const INFECTED_CREDIT = 0.5;
const MIN_VISIBLE_SPREAD = 0.03;

const COLOR = {
  healthy: "#B6FF3C",
  degraded: "#FFB800",
  critical: "#FF1E1E",
  reweaving: "#00E5FF",
  unwatched: "#6E6383",
};

const FIELD_COLOR = { live: "#B6FF3C", infected: "#C24BFF", dead: "#FF1E1E" };

const GLYPH = { live: "✓", infected: "⚠", dead: "✗" };

const STRAIN_GLOSS = {
  THROTTLED: "every field came back empty — the request itself was blocked or redirected",
  RENAMED: "a selector moved; the rest of the page still extracted correctly",
  DRIFTED: "values kept arriving and kept being wrong — the selectors matched the wrong nodes",
  SHIFTED: "the columns slid — a field returned a value belonging to its neighbour",
};

const EXPECTED = {
  title: "non-empty text",
  price: "a currency amount",
  rating: "a number 0-5",
  image: "an absolute image URL",
  image_url: "an absolute image URL",
  availability: "In stock or Out of stock",
  points: "a whole number, 0 or more",
  comments: "a whole number, 0 or more",
  author: "a username, no whitespace",
};

let SPIDERS = [];
let INCIDENTS = [];
let FIELDS = [];
let RAW_HISTORY = [];
let RAW_INCIDENTS = [];
let LAST_FLEET = null;
const ERRORS = { history: null, incidents: null };

"use strict";

const DATA = {
  history: "data/history.json",
  incidents: "data/incidents.json",
  meta: "data/meta.json",
};
const CID_SHORT_LEN = 6;
const EVIDENCE_TERSE_PX = 480;
const HEAL_ENDPOINT = "";
const HEAL_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const REFRESH_MS = 60000;
const UNWATCHED_MS = 9 * 60 * 60 * 1000;
const FULL_SERIES = 6;
const SPARSE_SERIES = 4;
const SERIES_MAX_POINTS = 48;
const FIELD_TRACK_MAX = 40;
const MIN_STREAK = 5;
const ABSOLUTE_SCALE_SPAN = 25;
const RECOVERY_MIN_GAIN = 25;
const LANDED_MS = 2400;
const OUR_UNIVERSES = ["mikhailkhorokhorin.github.io", "hackathons6943133.gitlab.io"];

const HEALTHY_MIN = 90;
const DEGRADED_MIN = 60;
const INFECTED_CREDIT = 0.5;
const MIN_VISIBLE_SPREAD = 0.03;
const MAX_VISIBLE_SPREAD = 0.85;
const PAPER_SPREAD = 0.5;

const COLOR = {
  healthy: "#B6FF3C",
  degraded: "#FFB800",
  critical: "#FF1E1E",
  reweaving: "#00E5FF",
  unwatched: "#8E82A8",
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
let META = null;
let LAST_FLEET = null;
const ERRORS = { history: null, incidents: null };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
let SHEET_OPENER = null;

"use strict";

const HAUL_MOCK_STEP = 30 * 60 * 1000;

const HAUL_MOCK_ATLAS = [
  { title: "A Light in the Attic", price: 51.77, rating: "Three" },
  { title: "Tipping the Velvet", price: 53.74, rating: "One" },
  { title: "Sharp Objects", price: 47.82, rating: "Four" },
  { title: "The Requiem Red", price: 22.65, rating: "One" },
  { title: "Set Me Free", price: 17.46, rating: "Five" },
  { title: "The Black Maria", price: 45.29, rating: "Two" },
];

const HAUL_MOCK_KESTREL = [
  { points: 62, comments: 17 },
  { points: 69, comments: 18 },
  { points: 78, comments: 21 },
  { points: 93, comments: 27 },
  { points: 107, comments: 31 },
  { points: 124, comments: 38 },
];

const HAUL_MOCK_STORY = "Codex on AWS bedrock bug causing 10x charges";

function haulMockAtlasRun(entry, index, total, now) {
  return {
    collector_id: "c_mock_atlas",
    spider: "ATLAS",
    universe: "books.toscrape.com",
    ts: new Date(now - (total - 1 - index) * HAUL_MOCK_STEP).toISOString(),
    fields_expected: ["title", "price", "rating", "image_url", "availability"],
    fields_live: ["title", "price", "rating", "image_url", "availability"],
    fields_infected: [],
    fields_dead: [],
    integrity: 100,
    status: "HEALTHY",
    rows: 20,
    sample: {
      title: entry.title,
      price: { value: entry.price, currency: "GBP", symbol: "£" },
      rating: entry.rating,
      image_url: "https://books.toscrape.com/media/cache/fe/72/" + (index + 10) + "c05972805aa72.jpg",
      availability: "In stock",
    },
  };
}

function haulMockKestrelRun(entry, index, total, now) {
  return {
    collector_id: "c_mock_kestrel",
    spider: "KESTREL",
    universe: "news.ycombinator.com",
    ts: new Date(now - (total - 1 - index) * HAUL_MOCK_STEP).toISOString(),
    fields_expected: ["title", "points", "comments", "author"],
    fields_live: ["title", "points", "comments"],
    fields_infected: ["author"],
    fields_dead: [],
    integrity: 88,
    status: "DEGRADED",
    rows: 30,
    sample: {
      title: HAUL_MOCK_STORY,
      points: entry.points,
      comments: entry.comments,
      author: index === total - 1 ? "undefined" : "TheP1000",
    },
  };
}

function mockHaulRuns() {
  const now = Date.now();
  const atlas = HAUL_MOCK_ATLAS.map((entry, i) =>
    haulMockAtlasRun(entry, i, HAUL_MOCK_ATLAS.length, now));
  const kestrel = HAUL_MOCK_KESTREL.map((entry, i) =>
    haulMockKestrelRun(entry, i, HAUL_MOCK_KESTREL.length, now));
  return atlas.concat(kestrel);
}

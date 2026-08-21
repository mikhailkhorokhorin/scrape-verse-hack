"use strict";

const MOCK_INC_BASE = Date.now() - 26 * 3600 * 1000;

function mockStamp(offsetMs) {
  return new Date(MOCK_INC_BASE + offsetMs).toISOString();
}

const MOCK_RAW_INCIDENTS = [
  {
    id: "inc_014",
    spider: "BODEGA",
    collector_id: "c_mock_bodega",
    opened_at: mockStamp(0),
    closed_at: mockStamp(884000),
    integrity_before: 98,
    integrity_after: 100,
    anomalies: ["price", "rating"],
    recovered_fields: ["price", "rating"],
    strain: "RENAMED",
    heal_prompt: "the price selector was renamed to .price-tag and rating moved into a data attribute; price returns null and rating returns the string undefined",
    summary: "Target renamed .product-price to .price-tag and moved rating into a data attribute. Extraction kept succeeding — it returned rows with a null price and the literal string \"undefined\" for rating.",
    stages: [
      { stage: "DETECTED", ts: mockStamp(0) },
      { stage: "DIAGNOSED", ts: mockStamp(27000) },
      { stage: "REWEAVING", ts: mockStamp(58000) },
      { stage: "VERIFIED", ts: mockStamp(884000) },
    ],
  },
];

const MOCK_INC_FIELDS = ["title", "price", "rating", "image"];

function mockIncidentRuns() {
  const clean = {
    collector_id: "c_mock_bodega",
    spider: "BODEGA",
    universe: "hackathons6943133.gitlab.io",
    ts: mockStamp(-1800000),
    fields_expected: MOCK_INC_FIELDS,
    fields_live: MOCK_INC_FIELDS,
    fields_infected: [],
    fields_dead: [],
    integrity: 98,
    status: "HEALTHY",
    sample: {
      title: "Ceramic pour-over dripper",
      price: "$38.00",
      rating: "4.6",
      image: "img/01.svg",
    },
  };
  const dirty = {
    collector_id: "c_mock_bodega",
    spider: "BODEGA",
    universe: "hackathons6943133.gitlab.io",
    ts: mockStamp(0),
    fields_expected: MOCK_INC_FIELDS,
    fields_live: ["title", "image"],
    fields_infected: ["rating"],
    fields_dead: ["price"],
    integrity: 62,
    status: "CRITICAL",
    sample: {
      title: "Ceramic pour-over dripper",
      price: null,
      rating: "undefined",
      image: "img/01.svg",
    },
  };
  return [clean, dirty];
}

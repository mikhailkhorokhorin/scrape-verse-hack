"use strict";

const MOCK = new URLSearchParams(location.search).get("mock") === "1";

const MOCK_FIELDS = ["title", "price", "rating", "image"];

const MOCK_SPIDERS = [
  { code:"ATLAS", universe:"books.toscrape.com", cid:"c_mock_atlas",
    order:["title","price","rating","image","availability"],
    fields:{title:"live",price:"live",rating:"live",image:"live",availability:"live"},
    sample:{title:"A Light in the Attic",price:"£51.77",rating:"star-rating Three",image:"https://books.toscrape.com/media/cache/2c/da/x.jpg",availability:"In stock"},
    seed:11 },
  { code:"BODEGA", universe:"mikhailkhorokhorin.github.io", cid:"c_mock_bodega",
    order:["title","price","rating","image"],
    fields:{title:"live",price:"dead",rating:"infected",image:"live"},
    sample:{title:"Ceramic pour-over dripper",price:null,rating:"undefined",image:"img/01.svg"},
    seed:29 },
  { code:"KESTREL", universe:"news.ycombinator.com", cid:"c_mock_kestrel",
    order:["title","points","comments","author"],
    fields:{title:"live",points:"live",comments:"live",author:"infected"},
    sample:{title:"The August 17 outage, and the work ahead",points:"124",comments:"129",author:"undefined"},
    seed:47 }
];

const MOCK_INCIDENTS = [
  { id:"inc_014", who:"BODEGA", opened:"Aug 20 · 09:12Z", before:98, after:42, verified:true, strain:"RENAMED",
    openedAt:new Date(Date.now() - 26 * 3600 * 1000).toISOString(), mttrMs:884000,
    anomalies:["price","rating"], blast:{rows:24,runs:2,open:false},
    what:"Target renamed .product-price to .price-tag and moved rating into a data attribute. Extraction kept succeeding — it returned rows with a null price and the literal string \"undefined\" for rating.",
    stages:[["DETECTED","09:12:04"],["DIAGNOSED","09:12:31"],["REWEAVING","09:13:02"],["VERIFIED","09:26:48"]] },
  { id:"inc_013", who:"KESTREL", opened:"Aug 19 · 22:40Z", before:96, after:78, verified:true, strain:"DRIFTED",
    openedAt:new Date(Date.now() - 12 * 3600 * 1000).toISOString(), mttrMs:728000,
    anomalies:["image"], blast:{rows:30,runs:1,open:false},
    what:"Lazy-loaded images began resolving to a placeholder SVG. The image field stayed populated the whole time — it just stopped being true.",
    stages:[["DETECTED","22:40:11"],["DIAGNOSED","22:40:39"],["REWEAVING","22:41:07"],["VERIFIED","22:52:19"]] }
];

function mockRng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

const MOCK_RUNS = 48;
const MOCK_DECLINE_RUNS = 6;

function mockHistory(seed, endValue) {
  const random = mockRng(seed);
  const series = [];
  let value = 96 + random() * 4;
  for (let i = 0; i < MOCK_RUNS; i++) {
    value += (random() - 0.45) * 2.2;
    value = Math.max(88, Math.min(100, value));
    series.push(value);
  }

  const declineStart = MOCK_RUNS - MOCK_DECLINE_RUNS;
  for (let i = 0; i < MOCK_DECLINE_RUNS; i++) {
    const blend = (i + 1) / MOCK_DECLINE_RUNS;
    series[declineStart + i] = series[declineStart + i] * (1 - blend) + endValue * blend;
  }
  return series;
}

function mountMockBanner() {
  if (document.querySelector(".mockflag")) return;
  const flag = document.createElement("div");
  flag.className = "mockflag";
  flag.setAttribute("role", "status");
  flag.textContent =
    "Synthetic data — ?mock=1 fixtures, not a live fleet. Drop the query string for the real watch.";
  document.body.insertBefore(flag, document.body.firstChild);
}

function mountMockControls(api) {
  mountMockBanner();
  const bar = document.createElement("section");
  bar.className = "demobar";
  bar.setAttribute("aria-labelledby", "chaos-title");
  bar.innerHTML =
    '<div class="demobar__head">' +
      '<h2 class="demobar__title" id="chaos-title">CHAOS LAB</h2>' +
      '<span class="demobar__flag">?mock=1 only</span>' +
    "</div>" +
    '<p class="demobar__copy">Break it yourself. The fleet below is synthetic; ' +
      "<b>the mechanics are the real code.</b></p>" +
    '<div class="demobar__row">' +
      '<span class="demobar__step">1</span>' +
      '<button class="btn btn--go" id="btn-break" type="button">Break BODEGA</button>' +
      '<span class="demobar__step">2</span>' +
      '<button class="btn btn--fix" id="btn-heal" type="button" disabled>Re-weave</button>' +
      '<span class="demobar__step">3</span>' +
      '<button class="btn" id="btn-dark" type="button">Toggle unwatched</button>' +
      '<button class="btn" id="btn-reset" type="button">Reset</button>' +
    "</div>";

  const note = document.createElement("p");
  note.className = "note";
  note.textContent =
    "Mock data, ?mock=1. Three Spiders, 48 hours of synthetic history. The symbiote " +
    "spread is the primary health signal — it covers (100 − Integrity)% of each panel. " +
    "Field chips carry three states: live, infected, dead. Click any panel for the diagnostic view.";

  const head = document.getElementById("nav-watch");
  head.parentNode.insertBefore(bar, head);

  const feed = document.getElementById("feed");
  feed.parentNode.insertBefore(note, feed.nextSibling);

  const bodega = api.spiders[1];
  const pristine = JSON.parse(JSON.stringify(api.spiders.map((s) => ({ fields: s.fields, sample: s.sample }))));

  document.getElementById("btn-break").addEventListener("click", () => {
    const p = api.panelOf("BODEGA");
    p.classList.add("is-hit");
    api.burst(p, "CRACK!", api.COLOR.critical);
    setTimeout(() => {
      bodega.fields = { title:"live", price:"dead", rating:"infected", image:"dead" };
      bodega.sample = { title:"Danforth Anchor, 8 kg Galvanised", price:null, rating:"undefined", image:null };
      bodega.reweaving = false;
      api.renderGrid();
      if (api.announce) api.announce();
      setTimeout(() => api.burst(api.panelOf("BODEGA"), "CREEP...", "#C24BFF"), 300);
    }, 240);
    document.getElementById("btn-heal").disabled = false;
  });

  document.getElementById("btn-heal").addEventListener("click", () => {
    bodega.reweaving = true;
    api.renderGrid();
    api.burst(api.panelOf("BODEGA"), "WEAVE...", api.COLOR.reweaving);
    setTimeout(() => {
      bodega.reweaving = false;
      bodega.fields = { title:"live", price:"live", rating:"live", image:"live" };
      bodega.sample = { title:"Danforth Anchor, 8 kg Galvanised", price:"$84.50", rating:"4.6", image:"https://picsum.photos/seed/harbor-anchor/480/320" };
      api.renderGrid();
      if (api.announce) api.announce();
      const q = api.panelOf("BODEGA");
      q.classList.add("is-purging");
      api.burst(q, "PURGE!", api.COLOR.reweaving);
      setTimeout(() => api.burst(api.panelOf("BODEGA"), "THWIP!", api.COLOR.healthy), 1000);
    }, 2200);
    document.getElementById("btn-heal").disabled = true;
  });

  document.getElementById("btn-dark").addEventListener("click", () => {
    api.spiders[0].unwatched = !api.spiders[0].unwatched;
    api.renderGrid();
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    api.spiders.forEach((s, i) => {
      s.fields = { ...pristine[i].fields };
      s.sample = { ...pristine[i].sample };
      s.unwatched = false;
      s.reweaving = false;
    });
    api.renderGrid();
    document.getElementById("btn-heal").disabled = true;
  });
}

function mockSeriesTs(count) {
  const step = 30 * 60 * 1000;
  const now = Date.now();
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(new Date(now - (count - 1 - i) * step).toISOString());
  }
  return out;
}

function mockRawHistory(spiders) {
  const rows = [];
  const step = 30 * 60 * 1000;
  const now = Date.now();
  for (const sp of spiders) {
    const series = sp.series || [];
    series.forEach((value, i) => {
      rows.push({
        collector_id: sp.cid,
        spider: sp.code,
        ts: new Date(now - (series.length - 1 - i) * step).toISOString(),
        integrity: clampPct(value),
      });
    });
  }
  return rows;
}

function mockTracks(sp) {
  const tracks = {};
  const fields = sp.fieldOrder || MOCK_FIELDS;
  const series = sp.series || [];
  const rng = mockRng((sp.seed || 3) * 7 + 1);
  for (const field of fields) {
    const now = sp.fields[field];
    tracks[field] = series.slice(-FIELD_TRACK_MAX).map((value, i, all) => {
      if (i >= all.length - MOCK_DECLINE_RUNS && now !== "live") return now;
      return value < HEALTHY_MIN && rng() < 0.35 ? "infected" : "live";
    });
  }
  return tracks;
}

function mockFillRates(tracks) {
  const rates = {};
  for (const [field, track] of Object.entries(tracks)) {
    const live = track.filter((s) => s === "live").length;
    const infected = track.filter((s) => s === "infected").length;
    rates[field] = Math.round(((live + INFECTED_CREDIT * infected) / track.length) * 100);
  }
  return rates;
}

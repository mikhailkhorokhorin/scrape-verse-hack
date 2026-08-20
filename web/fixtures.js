"use strict";

/* Mock fleet — only reachable behind ?mock=1.
   It exists so every Spider state stays testable while real history is thin.
   The default route never touches this file's data. */

const MOCK = new URLSearchParams(location.search).get("mock") === "1";

const MOCK_FIELDS = ["title", "price", "rating", "image"];

const MOCK_SPIDERS = [
  { code:"ATLAS", universe:"books.toscrape.com", cid:"c_mock_atlas",
    fields:{title:"live",price:"live",rating:"live",image:"live"},
    sample:{title:"A Light in the Attic",price:"£51.77",rating:"star-rating Three",image:"https://books.toscrape.com/media/cache/2c/da/x.jpg"},
    seed:11 },
  { code:"BODEGA", universe:"bodega-demo.github.io", cid:"c_mock_bodega",
    fields:{title:"live",price:"dead",rating:"infected",image:"live"},
    sample:{title:"Danforth Anchor, 8 kg Galvanised",price:null,rating:"undefined",image:"https://picsum.photos/seed/harbor-anchor/480/320"},
    seed:29 },
  { code:"KESTREL", universe:"news.ycombinator.com", cid:"c_mock_kestrel",
    fields:{title:"live",price:"live",rating:"live",image:"infected"},
    sample:{title:"The August 17 outage, and the work ahead",price:"124 points",rating:"129 comments",image:"/assets/placeholder-missing.svg"},
    seed:47 }
];

const MOCK_INCIDENTS = [
  { id:"inc_014", who:"BODEGA", opened:"Aug 20 · 09:12Z", before:98, after:42,
    what:"Target renamed .product-price to .price-tag and moved rating into a data attribute. Extraction kept succeeding — it returned rows with a null price and the literal string \"undefined\" for rating.",
    stages:[["DETECTED","09:12:04"],["DIAGNOSED","09:12:31"],["REWEAVING","09:13:02"],["VERIFIED","09:26:48"]] },
  { id:"inc_013", who:"KESTREL", opened:"Aug 19 · 22:40Z", before:96, after:78,
    what:"Lazy-loaded images began resolving to a placeholder SVG. The image field stayed populated the whole time — it just stopped being true.",
    stages:[["DETECTED","22:40:11"],["DIAGNOSED","22:40:39"],["REWEAVING","22:41:07"],["VERIFIED","22:52:19"]] }
];

/* Deterministic pseudo-random so mock history is stable across reloads.
   Real history is never generated — see the note in app.js. */
function mockRng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

function mockHistory(seed, endValue) {
  const r = mockRng(seed);
  const out = [];
  let v = 96 + r() * 4;
  for (let i = 0; i < 48; i++) {
    v += (r() - 0.45) * 2.2;
    v = Math.max(88, Math.min(100, v));
    out.push(v);
  }
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 6;
    out[42 + i] = out[42 + i] * (1 - t) + endValue * t;
  }
  return out;
}

/* The prototype's demo control bar. Injected only under ?mock=1 so it can
   never ship on the live URL. */
function mountMockControls(api) {
  const bar = document.createElement("div");
  bar.className = "demobar";
  bar.innerHTML =
    '<span class="label">Prototype controls — ?mock=1 only, not in the shipped build</span>' +
    '<button class="btn btn--go" id="btn-break">Break BODEGA</button>' +
    '<button class="btn btn--fix" id="btn-heal" disabled>Re-weave</button>' +
    '<button class="btn" id="btn-dark">Toggle unwatched</button>' +
    '<button class="btn" id="btn-reset">Reset</button>';

  const note = document.createElement("p");
  note.className = "note";
  note.textContent =
    "Mock data, ?mock=1. Three Spiders, 48 hours of synthetic history. The symbiote " +
    "spread is the primary health signal — it covers (100 − Integrity)% of each panel. " +
    "Field chips carry three states: live, infected, dead. Click any panel for the diagnostic view.";

  const feed = document.getElementById("feed");
  feed.parentNode.insertBefore(bar, feed.nextSibling);
  bar.parentNode.insertBefore(note, bar.nextSibling);

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

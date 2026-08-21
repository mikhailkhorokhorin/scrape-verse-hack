# THWIP

A self-healing watch console for web scrapers. Built for
[Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse)
(WeMakeDevs × Bright Data).

**Live console → https://mikhailkhorokhorin.github.io/scrape-verse-hack/**

![THE WATCH — three Spiders, live Integrity, and a healed incident](assets/the-watch.png)

Scrapers do not crash. They decay — a target site changes, extraction starts returning
nulls and wrong values, and the pipeline stays green while the data quietly rots. THWIP
watches for that, shows it, and repairs it.

**Source repository → https://github.com/mikhailkhorokhorin/scrape-verse-hack**
(branches `main` and `develop`; the GitLab project is a mirror.)

**Specs, backlog and plan live in the docs repository, cloned into `docs/`.**

<!-- TODO before submitting: demo video link -->

## It already caught a real one

Not a staged break. This happened to us during the build, on a real site, and it is the
short version of what the whole project is for.

`KESTREL` scrapes the Hacker News front page. A scan came back with **30 rows and an
Integrity of 0**. Rows were being found, so from the outside nothing looked broken — but
the generated scraper had drifted onto its own invented keys, emitting `story_points` and
`comment_count` instead of the fields we contracted for, with **every value `0`**. No
titles, no authors. Thirty rows of confident nothing, and no error anywhere.

One command repaired it — `bdata scraper heal --auto-approve --auto-save`, unattended,
no human in the loop:

| | Before | After |
|---|---|---|
| **Collector ID** | `c_mt2fnt3p2k4n644701` | `c_mt2fnt3p2k4n644701` — **identical** |
| Integrity | 0 | 100 |
| Status | `CRITICAL` | `HEALTHY` |
| Rows | 30 | 30 |
| Fields | all four `dead` | all four `live` |
| Payload | `story_points` / `comment_count`, all `0` | real `title`, `points`, `author`, `comments` |

The Collector ID is the row that matters. **It did not change.** The collector was
repaired, not recreated — the same one that broke is the one that came back.

Check it yourself: the broken and healed payloads are committed as `kestrel-probe.json`
and `kestrel-after.json`, the scans are in `data/history.json` (`04:43:39Z` and
`05:13:45Z` broken, `05:40:09Z` healed), and the heal is logged in `docs/COLLECTORS.md`.

## Layout

```
scripts/                    health-check and repair, Node
web/                        the console — no build step, no framework
mcp/                        MCP server — the fleet, answering a coding agent
test/                       238 tests, node:test, no dependencies
data/                       history.json, incidents.json, committed by CI
demo-target/                the Chaos Lab — three variants of the same shop page
collectors.json             targets and per-field validators
.github/workflows/watch.yml scan every 30 min, heal, publish Pages
```

## Look at it first

The console is the product. Seeing it needs no account, no key and no credit:

```bash
git clone https://github.com/mikhailkhorokhorin/scrape-verse-hack.git
cd scrape-verse-hack
python3 -m http.server 8000          # any static server will do
```

Then open:

- **<http://localhost:8000/web/?mock=1>** — the full console with three Spiders and 48
  hours of synthetic history, including a break and a completed re-weave. Start here
- **<http://localhost:8000/web/>** — the real console, reading `data/*.json`. It shows
  honest empty states until the cron has committed a scan; it never falls back to
  synthetic data

It must be served over HTTP. Opening `web/index.html` from the filesystem shows an error
plate instead of the console — the page fetches its two JSON files, and browsers block
`fetch` on `file://` origins.

`?mock=1` also mounts a small control bar that can break a Spider and re-weave it on
demand, which is the fastest way to see the three field states and the symbiote move.
Add `?capture=1` to hide every control for a clean screenshot.

## Chaos Lab — break the site yourself

BODEGA scrapes a shop page we control, and that page ships in three variants so the break
does not have to be taken on trust. Switch between them from the header of the page
itself, or open them directly:

| Variant | URL | What the collector sees |
|---|---|---|
| **Healthy** | [`demo-target/`](https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/) | Every selector resolves. This is the contract BODEGA was built against |
| **Renamed** | [`demo-target/broken-renamed.html`](https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/broken-renamed.html) | A redesign moved the class names. `price` and `image` match nothing, `rating` moved into a data attribute — fields go **DEAD** |
| **Drifted** | [`demo-target/broken-drifted.html`](https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/broken-drifted.html) | Markup untouched, values rotted. Price is an em dash, rating is the literal string `"undefined"`, image is a placeholder — fields stay full and **LIE** |

The third one is the point of the whole project. Nothing is null, nothing throws, row
count is unchanged, and every value is wrong — the failure a green pipeline hides. Point
a scraper at `broken-drifted.html` and watch it succeed at collecting nothing.

All three are generated from one source of truth: `demo-target/build-data.js` holds the
12 products and the variant definitions, `build-page.js` renders them, and
`node demo-target/build.js` rewrites all three HTML files. Edit the data, not the markup.

## THE HAUL — the data itself

The console does not stop at a health score. **The Haul** is a section on the main page
showing what the fleet actually brought back: the real rows, card by card, each stamped
with the collector that fetched it, the timestamp of the scan, and the Integrity the
Spider was at when that row was captured.

It is built from the `sample` on every history record, so it is the committed data and not
a fixture — the same JSON the pipeline wrote. A row captured at 90% Integrity carries that
number, which is the point: provenance travels with the data. `web/js/haul-data.js`
resolves the rows, `haul-view.js` renders them.

## MCP server — the fleet, in your agent

The whole loop — *is anything broken? what broke? fix it. prove it* — also runs inside a
coding agent. `mcp/` is an MCP server speaking JSON-RPC 2.0 over stdio, implemented
straight against the spec with **no SDK and no dependencies**. Connect it in one line:

```bash
claude mcp add thwip -- node mcp/server.js
```

Cursor and any other MCP client work the same way — it is a plain stdio process
(`npm run mcp`). Full setup and a worked conversation are in
[`mcp/README.md`](mcp/README.md).

Six tools. Four read the committed data — instant, free, no network:

| Tool | What it answers |
|---|---|
| `fleet_status` | How is every Spider right now — Integrity, status, which fields are live / infected / dead, how stale the scan is |
| `spider_history` | How has one Spider behaved over time, with post-heal runs marked |
| `incident_log` | What broke, and did the repair hold |
| `heal_receipt` | Prove one repair — every phase with timestamps and gaps, beside the `collector_id` that did not change |

Two drive Bright Data for real and **spend credit**: `scan_fleet` scrapes and scores the
fleet, `heal_spider` diagnoses, re-weaves, verifies and opens an incident. Their tool
descriptions say so in the text the agent reads, so a well-behaved agent asks first.

`heal_receipt` exists because the judged claim is that the Collector ID survives healing.
It prints the phases and the unchanged ID side by side, so the evidence is one tool call
away rather than a file to go and read.

## Running it for real

Only needed to produce new data. This calls Bright Data and costs credit:

```bash
npm i -g @brightdata/cli
bdata login                      # opens a browser, needs a human
node scripts/health-check.js     # one scan of every collector with an ID
node scripts/repair.js           # heals anything below 60% on two consecutive scans
```

`health-check.js` skips collectors that have no `collector_id` and exits 0, so it is safe
to run before anything is created. `repair.js` does nothing unless a collector has been
failing for two consecutive scans and is outside its 2-hour cooldown; force one with
`HEAL_COLLECTOR=c_xxx node scripts/repair.js`.

## Running the tests

238 tests, `node:test`, no dependencies and no test framework to install:

```bash
npm test
```

They cover the parts that decide whether the pipeline is telling the truth: field
classification and its exact boundaries, Integrity scoring, payload shapes, strain
diagnosis, the heal decision (two consecutive bad scans, 2-hour cooldown), atomic
JSON storage, and the MCP server's protocol handling and tool output. No network and no
`bdata` calls — the credit-spending paths run against a mocked `lib.bdata`, so the suite
runs offline in well under a second and never spends anything.

## CI

Everything runs on **GitHub Actions**, in `.github/workflows/watch.yml`:

| Job | When | What it does |
|---|---|---|
| `scan` | `*/30 * * * *` cron, or manually | `health-check.js`, then `repair.js`, then commits `data/` back |
| `build` | push to `main`, or the cron | Assembles `public/` from `web/`, `data/` and `demo-target/` |
| `deploy` | `main` only | Publishes to GitHub Pages |

**One secret, no second token** — Settings → Secrets and variables → Actions:

| Secret | What it is |
|---|---|
| `BRIGHTDATA_API_KEY` | Bright Data CLI auth |

The scan commits with the built-in `GITHUB_TOKEN`, which the workflow requests through
`permissions: contents: write`. Pages must be set to **Source: GitHub Actions**, not
"Deploy from a branch" — the workflow uploads the artifact itself.

The cron is in the file, so the schedule needs no setup in the UI. `concurrency: watch`
keeps two scans from writing `data/` at once. The `scan` job runs only on the cron or on
a manual dispatch, so pushing code never spends credit.

## Targets

Three, already chosen and checked against `robots.txt`. See `collectors.json`.

| Codename | Universe | Why |
|---|---|---|
| BODEGA | our own demo page | breakable on purpose, so the demo is reproducible |
| ATLAS | books.toscrape.com | no robots.txt, built for scraping, server-rendered |
| KESTREL | news.ycombinator.com | real site; robots allows the front page, `Crawl-delay: 30` |

Do not substitute a target. Each was verified as public, login-free and outside Bright
Data's pre-built scraper library — swapping one silently breaks a hackathon rule.

## Collector IDs

All three are real Scraper Studio collectors, created with `bdata scraper create`. The
registry with creation dates and the full heal log is in `docs/COLLECTORS.md`.

| Codename | Collector ID |
|---|---|
| BODEGA | `c_mt2lkwxa1bb5uz223s` |
| ATLAS | `c_mt2fnqqngikv29od5` |
| KESTREL | `c_mt2fnt3p2k4n644701` |

**These IDs do not change when a collector heals.** That is the point of the self-healing
loop and the thing worth checking: the same collector that broke is the one that came
back, repaired rather than replaced. The KESTREL heal at the top of this file is the
worked example — same `c_mt2fnt3p2k4n644701` before and after. Every heal is logged
against its ID in `docs/COLLECTORS.md`.

### What is not finished

Stated plainly rather than left for you to find:

- **Three heals happened; `data/incidents.json` holds two records, one of them open.**
  KESTREL 0% → 100% is the complete one (`inc_001`, all four stages, resolved). `inc_002`
  is BODEGA, opened by `repair.js` at `07:48:20Z` and **never closed** — it stops at
  `REWEAVING` with `resolved: false`. BODEGA did recover to 100% at `09:13:59Z`, which is
  in `data/history.json`, but the record was not written back, so the incident stays open
  on screen. The ATLAS 90% → 100% heal has **no incident record at all**; it is evidenced
  by the step in `data/history.json` (`06:39:48Z` at 90, `06:59:24Z` at 100) and by
  `docs/COLLECTORS.md`. We did not hand-write the missing records after the fact —
  manufacturing that evidence is precisely the failure this project exists to expose
- **The automated repair path is untested end to end.** `scripts/repair.js` is written,
  unit-tested and wired into CI, but both heals that actually happened were invoked by
  hand. The decision logic is covered by tests; the unattended round trip is not
- **MTTR is currently a mean of one sample.** `renderMttr()` averages `closed_at −
  opened_at` across incidents that have both; `inc_002` has no `closed_at`, so the mean is
  `inc_001`'s 26m 24s alone. It reads `--` when there are none

## The data

Two committed JSON files, no database:

| File | What is in it |
|---|---|
| `data/history.json` | One record per collector per scan: field states, Integrity, status, row count and the first row as a sample. Capped at 2000 records |
| `data/incidents.json` | One record per heal: what broke, the strain, the prompt sent to Scraper Studio, what came back, and the four stage timestamps |

Both are written by the scheduled pipeline and read directly by the console. The full
field-by-field contract is in `docs/CLAUDE.md`.

## Architecture

Four moving parts, one of which is the product. There is no backend: the scheduled
pipeline *is* the backend, and two committed JSON files are the database.

```
GitHub Actions — .github/workflows/watch.yml (cron */30, every 30 min)
  └─> scripts/health-check.js
        ├─ bdata scraper run <c_*> <url> --pretty
        ├─ classify every field on every row: live / infected / dead
        ├─ Integrity = (live + 0.5 x infected) / expected x 100
        └─ append to data/history.json
              │
              ├─ if Integrity < 60 on two consecutive scans
              │     └─> scripts/repair.js
              │           ├─ bdata scraper heal ... --auto-approve --auto-save --timeout 900
              │           ├─ re-run and verify rather than trust the heal
              │           └─ append to data/incidents.json
              │
              └─> web/ (static console, fetches both JSON files)
```

Infection is weighted at half credit on purpose. A field returning garbage is worse than
a correct one and better than nothing — nothing at least fails loudly.

## The three field states

The reason this project exists. A scraper that breaks does not crash; it keeps returning
rows, and the rows go quietly wrong.

| State | Meaning | Why it matters |
|---|---|---|
| `LIVE` | Present and passes its validator | Working |
| `INFECTED` | Present and wrong — `"undefined"`, a placeholder URL, a rating out of range | **Passes every null check.** This is the failure a green pipeline hides |
| `DEAD` | `null`, `""`, or `[]` | At least it is obvious |

## How self-healing works

1. A scan drops below 60% Integrity. One bad scan is not enough — a single failure is
   usually transient, and healing on it burns credit for nothing
2. A second consecutive bad scan opens an incident, stamped `DETECTED`
3. `repair.js` classifies the **strain** of the break from the field states, then builds a
   heal prompt from the fields that actually broke — never from scraped content, which
   would be an injection into the healer

   | Strain | What it means |
   |---|---|
   | `THROTTLED` | every field came back empty — the request was blocked or redirected |
   | `RENAMED` | a selector moved; the rest of the page still extracts |
   | `DRIFTED` | values keep arriving and keep being wrong — the selectors match the wrong nodes |
   | `SHIFTED` | the columns slid — a field returned a value belonging to its neighbour |

   The strain goes into the prompt with a one-line rationale, because _"a selector moved
   and the rest of the page still extracts correctly"_ gets a better fix out of Scraper
   Studio than _"price is null"_. It is also printed on the incident card, so the
   diagnosis is visible rather than buried in a log
4. `bdata scraper heal --auto-approve --auto-save` re-derives the selectors. The Collector
   ID does not change, which is the point: the same collector survives the break
5. The result is **verified with a fresh run**, not trusted. A heal that reports success
   and still returns nulls is exactly the silent failure this product is about
6. The incident closes with `VERIFIED` and the recovery is appended to history, so the
   sparkline shows it without waiting for the next scheduled scan

A 2-hour cooldown per collector prevents a heal loop against a site that is simply down.

### The one that actually ran

Steps 4 through 6 above are not theory. On KESTREL, `heal` ran the full chain unattended
— `planner → code_fixer → step_preview_runner → request_fulfillment_validator →
css_selector_extractor → user_approval → save_new_template` — in roughly **9 minutes**,
with `--auto-approve --auto-save` and nobody watching. A verification run afterwards
returned 30 rows carrying real titles, points, comments and authors where every field had
been `null`, on the same Collector ID. Full log in `docs/COLLECTORS.md`.

## Roadmap

**None of the following is built.** They are listed because they are the honest next
steps, not because they exist.

- **Quarantine** — an infected Spider detaches itself from downstream consumers, so bad
  rows stop flowing while the re-weave runs. The natural sequel to blast radius
- **Field contracts** — subscribe to a field rather than to a scraper: *wake me if the
  `price` fill rate drops below 95%*
- **Transferable cures** — a heal prompt that worked on one site is offered for a similar
  break on another. A fleet that learns
- **Pre-emptive healing** — fingerprint the target's DOM and detect drift before fields
  start failing
- **Cost per clean row** — what one correct row actually costs, counting runs and heals

## If you are an agent

Read `docs/CLAUDE.md` first — it puts you in autonomous mode. Then `docs/PLAN.md` for what
is being built, then take the first unchecked item in `docs/PROGRESS.md` and work down the
queue. Do not ask what to do next; the queue is the answer.

## Deploying the console anywhere

The `build` job in `.github/workflows/watch.yml` assembles the site, but the same bundle
can be built by hand in one command — useful if CI runners are unavailable:

```bash
mkdir -p public && cp -r web/* public/ && cp -r data public/ && cp -r demo-target public/
```

`public/` is then a self-contained static site: no build step, no server-side code, and
the console reads `data/history.json` and `data/incidents.json` relative to itself. Drop
it on any static host. To check it locally before publishing:

```bash
cd public && python -m http.server 8080
```

Serve `public/`, not `web/` — the console fetches `data/` as a sibling, which is how the
deployed layout is arranged.

## Rules

- Real `bdata` calls, never mocked. A judge checks the Collector ID
- `create` takes 5-25 minutes and `heal` up to 15, and both cost credit. **Never recreate a
  collector that already has an ID** in `docs/COLLECTORS.md` — if `run` fails, `heal` it
- Run `npm test` before changing anything in `scripts/` — the suite is the contract
  between what the pipeline writes and what the console reads
- No secrets in the repo, in CI logs, or in any frame of the demo video

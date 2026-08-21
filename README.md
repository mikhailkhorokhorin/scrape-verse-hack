# THWIP

A self-healing watch console for web scrapers. Built for
[Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse)
(WeMakeDevs × Bright Data).

Scrapers do not crash. They decay — a target site changes, extraction starts returning
nulls and wrong values, and the pipeline stays green while the data quietly rots. THWIP
watches for that, shows it, and repairs it.

**Specs, backlog and plan live in the [docs repository](https://gitlab.com/hackathons6943133/scrape-verse/docs).**

<!-- TODO before submitting: header screenshot of THE WATCH, taken with ?capture=1 at 1440px+ -->
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
scripts/        health-check and repair, Node
web/            the console — no build step, no framework
data/           history.json, incidents.json, committed by CI
demo-target/    the page we break on purpose during the demo
collectors.json targets and per-field validators
.gitlab-ci.yml  scan every 30 min, publish Pages
```

## Look at it first

The console is the product. Seeing it needs no account, no key and no credit:

```bash
git clone <this repo> && cd thwip
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

CI needs two masked variables under **Settings → CI/CD → Variables**:

| Variable | What it is |
|---|---|
| `BRIGHTDATA_API_KEY` | Bright Data CLI auth |
| `DATA_TOKEN` | Project Access Token, scope `write_repository`, **role Maintainer** |

`main` is a protected branch with push restricted to Maintainers. A Project Access Token
created with the Developer role will be rejected on push and every scan will fail at the
commit step — the pipeline goes green up to that point, so it fails quietly. Create the
token with **Maintainer**. `CI_JOB_TOKEN` cannot push at all, which is why this token
exists.

And a pipeline schedule at `*/30 * * * *` under **Settings → CI/CD → Pipeline schedules**.
GitLab has no in-file cron — this step is manual and the project does nothing without it.

## Targets

Three, already chosen and checked against `robots.txt`. See `collectors.json`.

| Codename | Universe | Why |
|---|---|---|
| BODEGA | our own demo page | broken on purpose, so the demo is reproducible — **not yet created**, see below |
| ATLAS | books.toscrape.com | no robots.txt, built for scraping, server-rendered |
| KESTREL | news.ycombinator.com | real site; robots allows the front page, `Crawl-delay: 30` |

Do not substitute a target. Each was verified as public, login-free and outside Bright
Data's pre-built scraper library — swapping one silently breaks a hackathon rule.

## Collector IDs

Real Scraper Studio collectors, created with `bdata scraper create`. The registry with
creation dates and the full heal log is in
[`docs/COLLECTORS.md`](https://gitlab.com/hackathons6943133/scrape-verse/docs).

| Codename | Collector ID |
|---|---|
| ATLAS | `c_mt2fnqqngikv29od5` |
| KESTREL | `c_mt2fnt3p2k4n644701` |
| BODEGA | _pending — created last, against the demo page_ |

**These IDs do not change when a collector heals.** That is the point of the self-healing
loop and the thing worth checking: the same collector that broke is the one that came
back, repaired rather than replaced. The KESTREL heal at the top of this file is the
worked example — same `c_mt2fnt3p2k4n644701` before and after. Every heal is logged
against its ID in `docs/COLLECTORS.md`.

### What is not finished

Stated plainly rather than left for you to find:

- **BODEGA is not created.** It targets our own demo page and needs that page's public
  URL first. Two collectors exist, not three
- **`data/incidents.json` is empty.** The KESTREL heal above was run manually, before the
  automated incident loop was wired in, so it is logged in `docs/COLLECTORS.md` rather
  than as an incident record. Incident Replay and MTTR therefore render empty on the live
  route — use `?mock=1` to see them
- **The automated repair path is untested end to end.** `scripts/repair.js` is written and
  wired into CI, but the heal that actually happened was invoked by hand
- **ATLAS sits at 90%, not 100%.** Its `price` comes back as
  `{value, currency, symbol}` rather than a scalar and reads `infected`. Real extraction
  is imperfect; the number on screen is the honest one

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
GitLab CI (scheduled pipeline, every 30 min)
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

The `pages` job in `.gitlab-ci.yml` assembles the site, but the same bundle can be built
by hand in one command — useful if CI runners are unavailable:

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
- No secrets in the repo, in CI logs, or in any frame of the demo video

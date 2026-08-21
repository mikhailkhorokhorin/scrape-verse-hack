# THWIP

A self-healing watch console for web scrapers. Built for
[Into the Scrape-Verse](https://www.wemakedevs.org/hackathons/scrape-verse)
(WeMakeDevs × Bright Data).

Scrapers do not crash. They decay — a target site changes, extraction starts returning
nulls and wrong values, and the pipeline stays green while the data quietly rots. THWIP
watches for that, shows it, and repairs it.

**Specs, backlog and plan live in the [docs repository](https://gitlab.com/hackathons6943133/scrape-verse/docs).**

## If you are an agent

Read `docs/CLAUDE.md` first — it puts you in autonomous mode. Then `docs/PLAN.md` for what
is being built, then take the first unchecked item in `docs/PROGRESS.md` and work down the
queue. Do not ask what to do next; the queue is the answer.

## Layout

```
scripts/        health-check and repair, Node
web/            the console — no build step, no framework
data/           history.json, incidents.json, committed by CI
demo-target/    the page we break on purpose during the demo
collectors.json targets and per-field validators
.gitlab-ci.yml  scan every 30 min, publish Pages
```

## Setup

```bash
npm i -g @brightdata/cli
bdata login                      # opens a browser, needs a human
node scripts/health-check.js
```

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
| BODEGA | our own demo page | broken on purpose, so the demo is reproducible |
| ATLAS | books.toscrape.com | no robots.txt, built for scraping, server-rendered |
| KESTREL | news.ycombinator.com | real site; robots allows the front page, `Crawl-delay: 30` |

Do not substitute a target. Each was verified as public, login-free and outside Bright
Data's pre-built scraper library — swapping one silently breaks a hackathon rule.

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
3. `repair.js` builds a heal prompt from the fields that actually broke — never from
   scraped content, which would be an injection into the healer
4. `bdata scraper heal --auto-approve --auto-save` re-derives the selectors. The Collector
   ID does not change, which is the point: the same collector survives the break
5. The result is **verified with a fresh run**, not trusted. A heal that reports success
   and still returns nulls is exactly the silent failure this product is about
6. The incident closes with `VERIFIED` and the recovery is appended to history, so the
   sparkline shows it without waiting for the next scheduled scan

A 2-hour cooldown per collector prevents a heal loop against a site that is simply down.

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

## Rules

- Real `bdata` calls, never mocked. A judge checks the Collector ID
- `create` takes 5-25 minutes and `heal` up to 15, and both cost credit. **Never recreate a
  collector that already has an ID** in `docs/COLLECTORS.md` — if `run` fails, `heal` it
- No secrets in the repo, in CI logs, or in any frame of the demo video

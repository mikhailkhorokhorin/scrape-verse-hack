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

## Rules

- Real `bdata` calls, never mocked. A judge checks the Collector ID
- `create` takes 5-25 minutes and `heal` up to 15, and both cost credit. **Never recreate a
  collector that already has an ID** in `docs/COLLECTORS.md` — if `run` fails, `heal` it
- No secrets in the repo, in CI logs, or in any frame of the demo video

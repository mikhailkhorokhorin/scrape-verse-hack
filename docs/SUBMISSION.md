# Submission checklist

**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data)
**Deadline:** Aug 23, 2026
**Categories:** all four — Best Use of Bright Data · Best UI · Best Clean Code ·
Best LinkedIn Post. See `AUDIT-PIPELINE.md` for what each one is judged on.

Status as of Aug 21, after audits A15 and A18. Re-check every box on the morning of the
23rd — several of these depend on a cron that may have stopped.

**Where it stands:** everything technical is done and evidenced. Three collectors, three
heals, three complete incident records, 238 tests, ESLint in CI, an MCP server, a deployed
console and a cron that commits its own scans. **Two things are outstanding and both are
recording tasks, not engineering:** the demo video and the LinkedIn post.

**The one rule that governs this file:** submit before polishing is finished. A submitted
good project beats an unsubmitted great one, and there is no partial credit for a
repository nobody looked at.

---

## Hard requirements

The things a submission is rejected or discounted for missing.

| # | Requirement | Status | Where it lives |
|---|---|---|---|
| 1 | Public repository, anonymously cloneable | **done** | app repo + docs repo, both public, anonymous clone verified Aug 21 |
| 2 | Bright Data Scraper Studio used for real — real `create` / `run` / `heal`, never mocked | **done** | `scripts/health-check.js`, `scripts/repair.js`; real runs recorded in `data/history.json` |
| 3 | Collector IDs listed openly in the submission | **done** | `app/README.md`, `docs/COLLECTORS.md` — `c_mt2lkwxa1bb5uz223s` (BODEGA), `c_mt2fnqqngikv29od5` (ATLAS), `c_mt2fnt3p2k4n644701` (KESTREL) |
| 4 | **Collector ID unchanged across a heal** | **done and evidenced ×3** | All three collectors healed on their own unchanged ID — KESTREL 0→100, ATLAS 90→100, BODEGA 0→100; see below |
| 5 | Public data only, no login or paywall, not in Bright Data's pre-built library | **done** | books.toscrape.com and news.ycombinator.com, both robots-checked Aug 21; see `docs/COLLECTORS.md` |
| 6 | Demo video, 2–3 minutes | **not recorded** | script ready in `docs/VIDEO-SCRIPT.md` |
| 7 | Written project description | **done** | `app/README.md` |
| 8 | No secrets in the repo, in CI logs, or in any video frame | **done in repo, unverified in video** | `.gitignore` covers `.env*`, `credentials.json`, `config.json` |
| 9 | Live URL for the console (the Best UI track effectively needs one) | **done** | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ — published by the `deploy` job in `.github/workflows/watch.yml` |

### Requirement 4 — the evidence, in one place

This is the requirement most likely to be checked by hand, so it is written out rather
than referenced. **Three heals, three incidents, all resolved, every Collector ID
unchanged.**

| Incident | Spider | Collector ID before → after | Strain | Integrity | Opened by |
|---|---|---|---|---|---|
| `inc_001` | KESTREL | `c_mt2fnt3p2k4n644701` → **identical** | RENAMED | 0 → 100 | hand |
| `inc_002` | ATLAS | `c_mt2fnqqngikv29od5` → **identical** | DRIFTED | 90 → 100 | hand |
| `inc_003` | BODEGA | `c_mt2lkwxa1bb5uz223s` → **identical** | THROTTLED | 0 → 100 | **the cron, unattended** |

Source: `app/data/incidents.json`, all three with `resolved: true`, `closed_at` set, and
four stage timestamps each. Verify in one command: `node mcp/server.js` then call
`heal_receipt` with any incident id — it prints every phase beside the unchanged
`collector_id`.

**KESTREL, the deepest-evidenced one:**

| | Before | After |
|---|---|---|
| Collector ID | `c_mt2fnt3p2k4n644701` | `c_mt2fnt3p2k4n644701` — **identical** |
| Integrity | 0 | 100 |
| Status | `CRITICAL` | `HEALTHY` |
| Rows | 30 | 30 |
| Fields | all four `dead` | all four `live` |
| Payload | `story_points` / `comment_count`, every value `0` | real `title`, `points`, `author`, `comments` |

Timestamps in `data/history.json`: `04:43:39Z` and `05:13:45Z` broken, `05:40:09Z`
healed. Raw payloads in `app/kestrel-probe.json` and `app/kestrel-after.json`. The heal
ran with `--auto-approve --auto-save`, unattended, no human in the loop.

**`inc_003` is the one to point a judge at.** The cron detected BODEGA at 0% twice and
ran a heal on its own overnight — and the heal did not fix it, because nothing on the
target had broken. The scraper was returning one wrapped row holding a products array and
our own payload parser (`rowsOf` in `scripts/lib/cli.js`) was scoring the envelope
instead of the rows, so every scan read `rows 1`, all fields dead. The fix landed in
`rowsOf`; the next scan read 12 rows at 100%. **The wrong diagnosis is still on disk**, in
the `inc_003` summary, written as the system believed it at the time. We did not edit it
out. A monitor that rewrites its own history to look smarter is exactly what this project
exists to catch, and it does not get an exemption for being ours.

---

## Deliverables

| Deliverable | Status | Notes |
|---|---|---|
| App repository | **done** | public, MIT licensed — https://github.com/mikhailkhorokhorin/scrape-verse-hack |
| Docs repository | **done** | public, on GitLab |
| `README.md` | **done** | pitch, setup, tests, CI, Chaos Lab, architecture, Collector IDs, healing walkthrough, roadmap |
| Test suite | **done** | 238 tests, `npm test`, `node:test`, no dependencies |
| MCP server | **done** | `app/mcp/` — six tools over stdio JSON-RPC, no SDK. `claude mcp add thwip -- node mcp/server.js` |
| Demo video | **not recorded** | script rewritten for three incidents and the four Bright Data questions — `docs/VIDEO-SCRIPT.md` |
| Video link in README | **not done** | `app/README.md` line 20 carries the `<!-- TODO -->` marker; add the moment the video is uploaded |
| Header screenshot in README | **done, may want refreshing** | `assets/the-watch.png` — predates THE HAUL section; retake with `?capture=1` if time allows |
| LinkedIn post | **written, not posted** | `docs/LINKEDIN-POST.md`, two versions, both rewritten around all three incidents |
| Deployed console URL | **done** | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ |
| Incident evidence | **done** | three records in `data/incidents.json`, all `resolved: true` |
| Chaos Lab | **done** | `app/demo-target/` — three variants and a switcher, a judge breaks it themselves |

---

## Outstanding, in priority order

Everything below is what stands between the current state and a submission. Ordered by
what costs the most if skipped.

### P0 — must land before submitting

1. **Record the demo video.** Script is ready and rehearsable — `docs/VIDEO-SCRIPT.md`,
   seven sections, 2:50. Rehearse once with a timer before the real take
2. **Video link into `app/README.md` (line 20) and into this file**
3. **Final secrets sweep.** Scrub the exported video frame by frame wherever a terminal
   or editor is visible

### P1 — materially improves the submission

1. **Post to LinkedIn.** Separate prize, costs no developer time. Text is written in
   `docs/LINKEDIN-POST.md`; tag **WeMakeDevs** and **Bright Data** as accounts, not only
   as hashtags
2. **Refresh the README header screenshot** with `?capture=1` at 1440px+ so THE HAUL is
   in frame. Ten minutes; skip it if the morning is tight

### Known doc drift to fix before submitting

`docs/COLLECTORS.md` still describes the pre-`inc_003` world: its heal table calls
`inc_002` a BODEGA incident that is "**open**", and its "Incident records" section claims
*three heals, two records, one complete*. All three of those statements are now false —
`incidents.json` holds three complete records, `inc_002` is ATLAS, and every one is
`resolved: true`. This contradicts the corrected table above and is the single highest-cost
remaining inconsistency, because `COLLECTORS.md` is the file the requirement-4 evidence
points at. Fix it before a judge opens both files.

### Landed since this list was written

- **The console is deployed.** https://mikhailkhorokhorin.github.io/scrape-verse-hack/,
  published by GitHub Actions on every push to `main`
- **BODEGA is created** — `c_mt2lkwxa1bb5uz223s`, against our own demo page. Three
  collectors exist, not two. Its first clean scan landed at `09:13:59Z`
- **`data/incidents.json` has three complete records, all resolved.** `inc_001` KESTREL
  RENAMED 0→100, `inc_002` ATLAS DRIFTED 90→100, `inc_003` BODEGA THROTTLED 0→100 — each
  with four stage timestamps, the heal prompt, the recovered fields and `resolved: true`.
  Incident Replay, MTTR, blast radius and the scars all render on the live route rather
  than only under `?mock=1`. **`inc_003` was opened by the cron with nobody watching**,
  which closes the "unattended round trip" gap this file used to state
- **The header screenshot is in the README** — `assets/the-watch.png`
- **238 tests** covering classification, scoring, payload shapes, strain diagnosis, the
  heal decision, atomic storage, and the MCP server's protocol and tools. `npm test`, no
  dependencies
- **The cron has run unattended.** Two scheduled runs committed `data/` back on their own,
  authored by `thwip watch` rather than by a person: `data: scan 2026-08-21T07:49:43Z` and
  `data: scan 2026-08-21T08:44:18Z`. The automation is evidenced by the git log, not
  claimed
- **Chaos Lab** — the demo page ships in three variants (healthy, renamed, drifted) with
  a switcher, so a judge can break the target themselves
- **An MCP server** — `app/mcp/`, six tools over stdio JSON-RPC with no SDK, so the whole
  loop (is anything broken → what broke → fix it → prove it) runs inside Claude Code or
  Cursor. `heal_receipt` prints the phases beside the unchanged Collector ID, which makes
  requirement 4 a single tool call
- **THE HAUL** — the main page now shows the rows the fleet actually brought back, each
  stamped with its collector, scan timestamp and the Integrity at capture

### P2 — resolved

1. ATLAS `price` returning `{value, currency, symbol}` and `availability` concatenating
   rows together capped ATLAS at 90% Integrity. The `availability` selector was fixed by
   the DRIFTED heal (`inc_002`) and ATLAS has scanned at **100%** since `06:59:24Z`. The
   90% period is still in `data/history.json` and is worth pointing at — the sparkline
   shows a real recovery rather than a flat line
2. BODEGA reading `rows 1` at 0% on four consecutive scans was **our** `rowsOf` parser
   scoring the response envelope instead of the rows inside it, not a broken target. Fixed
   in `scripts/lib/cli.js`; the next scan read 12 rows at 100% at `09:13:59Z`. The false
   diagnosis stays in `inc_003` on purpose — see Known gaps

---

## Known gaps, stated honestly

Write these into the submission description rather than hoping nobody notices. A judge
who finds an unstated gap discounts everything else; a stated one costs nothing.

- **One of the three heals did not work, and we kept the failure.** `inc_003` was opened
  autonomously by the cron, diagnosed THROTTLED, and healed — and the heal changed
  nothing, because the target had never broken. The bug was in `rowsOf`, our own payload
  parser, which scored the response envelope instead of the rows inside it. The recorded
  diagnosis is wrong and is still on disk unedited. We are stating it here rather than
  waiting to be asked: a monitoring tool that rewrites its own history to look smarter is
  the failure this project exists to expose, and it does not get an exemption for being
  ours. **This is offered as evidence, not as an apology** — an autonomously-opened
  incident with an honest post-mortem is a stronger claim about the system than a third
  clean success would have been
- **Two of the three heals were invoked by hand.** `inc_001` (KESTREL) and `inc_002`
  (ATLAS) were run by a human calling `bdata scraper heal --auto-approve --auto-save`. The
  *heal itself* was unattended in every case — no human in the planner/fixer/validator
  chain — but only `inc_003` was also **triggered** unattended
- **MTTR is a mean of three samples**, all from one day. It is a real number over a real
  population, and the population is small
- **ATLAS `price` returns `{value, currency, symbol}`** rather than a bare number. It read
  `infected` and capped ATLAS at 90% before the DRIFTED heal; it now scans at 100%. The
  90% period is still in `data/history.json` — an imperfect real history is more credible
  than a suspiciously flat one
- **The README header screenshot predates THE HAUL.** `assets/the-watch.png` shows the
  grid without the data section beneath it. Accurate but not current

None of these touch requirement 4, which is the one that matters most: three heals, three
unchanged Collector IDs, all three verifiable from the committed JSON.

---

## Final morning sequence — Aug 23

Do these in order and do not reorder them. Times are realistic, not optimistic. Total to
the **Submit** step: about 2h 15m, of which the video is 90 minutes.

| # | Step | Time | Where |
|---|---|---|---|
| 1 | **Cron check.** Newest `ts` in `data/history.json` under an hour old. If the cron stopped, run `npm run health` once by hand and say so in the description | 5 min | `app/data/history.json` |
| 2 | **Fix the `COLLECTORS.md` drift** — the open-`inc_002` claim and the "two records" section. See "Known doc drift" above | 15 min | `docs/COLLECTORS.md` |
| 3 | **Record the video.** Rehearse once with a timer, then take it section by section | 90 min | `docs/VIDEO-SCRIPT.md` |
| 4 | **Scrub the export** frame by frame wherever a terminal or editor is visible. Zero keys, zero tokens | 10 min | the exported file |
| 5 | **Upload, paste the link** into `app/README.md` line 20 and the Deliverables table above | 5 min | `app/README.md` |
| 6 | **`npm test`** — 238 green. **`npm run lint`** — clean | 2 min | `app/` |
| 7 | **Deployed console, incognito.** Loads, real data, no console errors, no `?mock=1` on the default route | 5 min | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ |
| 8 | **Anonymous clone**, both repos, incognito, no credentials | 5 min | https://github.com/mikhailkhorokhorin/scrape-verse-hack |
| 9 | **Read `app/README.md` top to bottom as a stranger.** Time the four Bright Data questions — each must answer in under 60s | 10 min | `app/README.md` |
| 10 | **SUBMIT.** Paste the Known-gaps section into the submission description verbatim | 10 min | the hackathon portal |
| 11 | **Post to LinkedIn**, tagging **WeMakeDevs** and **Bright Data** as accounts. Attach the `?capture=1` screenshot | 10 min | `docs/LINKEDIN-POST.md` |
| 12 | Only then, keep polishing | — | — |

**If the morning runs short, cut in this order:** step 2 (state the drift in the
description instead), then step 11's screenshot (post without it), then step 9. **Never
cut steps 1, 4, 7, 10 or 11** — step 4 is a disqualification risk and step 11 is a whole
category that costs ten minutes.

### The four Bright Data questions, and where each is answered

Step 9 is timing these. If any takes over 60 seconds, that is a finding.

| The question | Answer in | Artifact |
|---|---|---|
| How was the scraper designed in Scraper Studio? | `app/README.md` "Collectors" | `app/collectors.json` — three collectors, per-field validators |
| How is it controlled from a coding agent? | `app/README.md` "MCP server" | `app/mcp/` — six tools, `mcp/README.md` worked conversation |
| What happened when the site changed under it? | `app/README.md` "It already caught a real one" | `data/incidents.json` ×3, `docs/COLLECTORS.md`, Chaos Lab |
| What did the structured output become? | the live console | THE HAUL section + `data/history.json` |

Note: `collectors.json` records IDs and validators, **not** Scraper Studio `view_url`s.
If a judge asks for the Studio links, they come from the Bright Data console — do not
claim they are in the repo.

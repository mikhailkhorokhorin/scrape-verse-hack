# Submission checklist

**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data)
**Deadline:** Aug 23, 2026
**Categories:** all four — Best Use of Bright Data · Best UI · Best Clean Code ·
Best LinkedIn Post. See `AUDIT-PIPELINE.md` for what each one is judged on.

Status as of Aug 21, evening. Re-check every box on the morning of the 23rd — several
depend on a cron that may have stopped.

**Where it stands:** everything technical is done and evidenced. Three collectors, three
incidents, three complete records each carrying a per-field verification object, 959
tests, zero dependencies, ESLint in CI, an MCP server, a deployed console and a cron that
commits its own scans. **Two things are outstanding and both are recording tasks, not
engineering:** the demo video and the LinkedIn post.

**The one rule that governs this file:** submit before polishing is finished. A submitted
good project beats an unsubmitted great one, and there is no partial credit for a
repository nobody looked at.

---

## What a judge should do first

Seven things, in this order. The first three take under two minutes each; the last three
are one command apiece.

1. **Open the console** — https://mikhailkhorokhorin.github.io/scrape-verse-hack/. The
   opening sequence replays `inc_003`, a real recorded incident, not a mock. Scroll to
   **Incident Feed**: three cards, each a comic issue with its own permalink. The note
   above the feed counts the breaks that happened on sites we do not control.
2. **Check requirement 4 in one command.** Clone, then:
   `printf '%s\n%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"x","version":"1"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"heal_receipt","arguments":{"incident_id":"inc_001"}}}' | node mcp/server.js`
   It prints every phase beside the unchanged `collector_id`, then the per-field
   verification table. No API key, no network, no credit.
3. **`npm test`** — 1,152 tests, `node:test`, zero dependencies, offline, spends nothing.
4. **Or read the back page instead of this file.**
   <https://mikhailkhorokhorin.github.io/scrape-verse-hack/manual.html> carries the same
   six steps as numbered tickets, all eight MCP tools with the free/paid split, and a
   cut-out coupon whose three lines are the install. Its test count is read from
   `data/meta.json` at page load rather than typed, and it prints cleanly if you would
   rather hold it on paper.
5. **Break one yourself, in the browser, in ten seconds.**
   https://mikhailkhorokhorin.github.io/scrape-verse-hack/?mock=1 opens the **CHAOS LAB**:
   press **BREAK BODEGA** and the substance climbs the panel; drag across it and the black
   tears away, showing the values that actually came back; press **RE-WEAVE** and the
   receipt prints. The fleet in that mode is synthetic and the page says so at the top —
   the mechanics running it are the same code the live console uses.
6. **Print the evidence trail** — `node tools/evidence-report.js` prints, for each
   incident, the collector id on both sides of the repair (asserted identical), the stage
   durations, the value every field held before and after, the verdict, and SHA-256
   digests recomputed from the committed files at call time.
7. **Count what no human did** — `git log --author="thwip watch" --oneline | wc -l`, and
   `node tools/numbers-audit.js` to recompute every number the console shows from the
   committed JSON, by a second implementation that shares no code with the console.

---

## Hard requirements

The things a submission is rejected or discounted for missing.

| # | Requirement | Status | Where it lives |
|---|---|---|---|
| 1 | Public repository, anonymously cloneable | **done** | https://github.com/mikhailkhorokhorin/scrape-verse-hack — public, MIT |
| 2 | Bright Data Scraper Studio used for real — real `create` / `run` / `heal`, never mocked | **done** | `scripts/health-check.js`, `scripts/repair.js`; every scan recorded in `data/history.json`, which the cron appends to every 30 minutes — count it with `node tools/numbers-audit.js` rather than trusting a number written here |
| 3 | Collector IDs listed openly in the submission | **done** | `collectors.json`, `docs/COLLECTORS.md` — `c_mt2lkwxa1bb5uz223s` (BODEGA), `c_mt2fnqqngikv29od5` (ATLAS), `c_mt2fnt3p2k4n644701` (KESTREL) |
| 4 | **Collector ID unchanged across a heal** | **done and evidenced ×3** | All three healed on their own unchanged ID; see below |
| 5 | Public data only, no login or paywall, not in Bright Data's pre-built library | **done** | books.toscrape.com and news.ycombinator.com, both robots-checked Aug 21; see `docs/COLLECTORS.md` |
| 6 | Demo video, 2–3 minutes | **not recorded** | script ready in `docs/VIDEO-SCRIPT.md` |
| 7 | Written project description | **done** | `README.md` |
| 8 | No secrets in the repo, in CI logs, or in any video frame | **done in repo, unverified in video** | `.gitignore` covers `.env*`, `credentials.json`, `config.json`. The evidence files under `docs/evidence/` are deliberately tracked and carry no key — collector ids, names and public console URLs only. The only `BRIGHTDATA_API_KEY` in the tree is `${{ secrets.* }}` in the workflow |
| 9 | Live URL for the console | **done** | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ — published by the `deploy` job in `.github/workflows/watch.yml` |

### Requirement 4 — the evidence, in one place

This is the requirement most likely to be checked by hand, so it is written out rather
than referenced. **Four heals, four incidents, all resolved, every Collector ID
unchanged.**

| Incident | Spider | Collector ID before → after | Strain | Integrity | Site is ours? | Opened by |
|---|---|---|---|---|---|---|
| `inc_001` | KESTREL | `c_mt2fnt3p2k4n644701` → **identical** | RENAMED | 0 → 100 | **no** — news.ycombinator.com | hand |
| `inc_002` | ATLAS | `c_mt2fnqqngikv29od5` → **identical** | DRIFTED | 90 → 100 | **no** — books.toscrape.com | hand |
| `inc_003` | BODEGA | `c_mt2lkwxa1bb5uz223s` → **identical** | THROTTLED | 0 → 100 | yes — our demo page | **the cron, unattended** |
| `inc_004` | BODEGA | `c_mt2lkwxa1bb5uz223s` → **identical** | RENAMED | 50 → 100 | yes — our demo page | **the cron, and no phase was human** |

`inc_004` is the one to check first. On 22 Aug we committed a redesign of our own demo
page — the class names moved, exactly as a real site's redesign moves them — and then
touched nothing. The cron saw Integrity fall to 50% at 07:28, waited for a second
consecutive bad scan rather than reacting to one, opened the incident at 07:56,
diagnosed the strain as `RENAMED`, re-wove the collector, and verified against a fresh
scrape at 08:08. **Eleven minutes and fifty-six seconds from detection to verification,
with `price: null → £18.00` and `rating: null → 4.4` on an unchanged Collector ID.** No
human ran a command, approved a repair, or edited a record. Print it yourself:
`node tools/evidence-report.js inc_004`.

Source: `data/incidents.json`, all four with `resolved: true`, `closed_at` set, four
stage timestamps and a `verification` object each. Verify with `heal_receipt` on any
incident id — it prints every phase beside the unchanged `collector_id`.

**Two of the three breaks happened on sites we do not control.** KESTREL broke against
the live Hacker News front page and ATLAS against books.toscrape.com. Only BODEGA is our
own page. Most of the field can only demonstrate self-healing against a fixture they
break themselves; two thirds of our evidence is on somebody else's HTML. The console
states this itself — `web/js/fleet/vitals/wild.js` computes it from `collectors.json` and renders an
**IN THE WILD** badge on those two cards plus a counted note above the feed.


**A heal that lies cannot close an incident.** `resolved` is computed from a fresh scrape
taken *after* the repair, never from the heal's own report; populated-but-wrong values are
caught by the per-field validators in `collectors.json` and scored `INFECTED` at half
credit. The four failure modes — nothing back, garbage back, partial, real — are walked in
the README under *"What happens when the heal itself lies"* and asserted in
`test/pipeline/heal-that-lies.test.js`. One command prints the whole trail for any incident, with
SHA-256 digests recomputed from disk at call time:
`node tools/evidence-report.js inc_003`.

**A note on the platform's own success rate.** Bright Data's dashboard reports ATLAS at
6.67% (2,450 pages, 34,300 errors) while our console reports it at 100% Integrity, 20 rows
of 20, scan after scan. Both are right. ATLAS follows each product link, so the platform
counts fourteen failed child fetches per catalogue page — one page in fifteen is 6.67%. But
every contracted field is already on the catalogue page (20 `price_color`, 20
`instock availability`, 20 `thumbnail`, 20 `star-rating` — check the HTML yourself), so
every row comes back complete and passes its validators. A platform success rate measures
how many requests completed; Integrity measures how much of what you promised came back
real. The gap between those two numbers is the entire argument for this product.

### The verification object — per-field proof, not a status flag

Every incident carries a `verification` object: a field-by-field re-check of the run
**after** the heal, naming the value received before and the value received after.
`scripts/verify.js` computes it, `web/js/sheets/issue/receipt.js` renders it as a two-column
was/now table in the issue sheet and on the printed page, and the MCP `heal_receipt`
tool prints it. `inc_001` reads:

```
verification: 4/4 fields re-checked against the run after the heal (every field back)
  ok   title: dead -> live | was null | now Codex on AWS bedrock bug causing 10x charges
  ok   points: dead -> live | was null | now 62
  ok   comments: dead -> live | was null | now 17
  ok   author: dead -> live | was null | now TheP1000
```

**All three existing verification objects carry `backfilled: true`, and that is stated on
purpose.** They were computed from each incident's own already-committed runs in
`data/history.json` — no new scrape was made, no credit was spent, and no value was
invented. The before/after values are the ones those recorded runs actually returned. Any
incident opened from here on gets its verification computed live at heal time by the same
code path; the flag is what tells the two apart.

### `inc_003` — the one to point a judge at

The cron detected BODEGA at 0% twice and ran a heal on its own overnight — and the heal
did not fix it, because nothing on the target had broken. The scraper was returning one
wrapped row holding a products array, and our own payload parser (`rowsOf` in
`scripts/lib/cli.js`) was scoring the envelope instead of the rows, so every scan read
`rows 1`, all fields dead. The fix landed in `rowsOf`; the next scan read 12 rows at 100%.

**The wrong diagnosis is still on disk**, in the `inc_003` summary, written as the system
believed it at the time. We did not edit it out. A monitor that rewrites its own history
to look smarter is exactly what this project exists to catch, and it does not get an
exemption for being ours.

---

## The four Bright Data questions, answered

### 1. How was the scraper designed in Scraper Studio?

Three collectors created with `bdata scraper create`, IDs pinned in `collectors.json` and
`docs/COLLECTORS.md` the moment `create` returned them — `create` takes 5–25 minutes and
costs credit, so a lost ID means paying twice.

| Codename | Target | Collector ID | Fields | Rows/run |
|---|---|---|---|---|
| BODEGA | our own demo page | `c_mt2lkwxa1bb5uz223s` | title, price, rating, image | 12 |
| ATLAS | books.toscrape.com | `c_mt2fnqqngikv29od5` | title, price, rating, image_url, availability | 20 |
| KESTREL | news.ycombinator.com | `c_mt2fnt3p2k4n644701` | title, points, comments, author | 30 |

**The part that matters is underneath each field.** Every field in `collectors.json`
carries a validator, not just a name: `price` is a number with `min: 0.01`, KESTREL's
`points` has `min: 1` because a front-page story always has at least one, ATLAS's
`availability` carries `pattern: "^(In stock|Out of stock)$"`. That contract is what makes
decay measurable — the question is not whether a field came back, it is whether what came
back is still allowed to be there. A field that returns a populated, wrong value scores
`infected` and costs half credit; one that returns nothing scores `dead`.

Artifact: `collectors.json`. Note that it records IDs and validators, **not** Scraper
Studio `view_url`s — if a judge asks for Studio links they come from the Bright Data
console, and we do not claim they are in the repo.

### 2. How is it driven from a coding agent?

`mcp/` is an MCP server: **eight tools over stdio JSON-RPC, hand-written, no SDK**, so the
whole loop — is anything broken → what broke → fix it → prove it — runs inside Claude Code
or Cursor. Install with `claude mcp add thwip -- node mcp/server.js`.

| Tool | What it does | Cost |
|---|---|---|
| `fleet_status` | latest run for every Spider: integrity, status, rows, live fields, collector_id | free, offline |
| `spider_history` | run history for one Spider, oldest first | free, offline |
| `incident_log` | every recorded break with strain, integrity delta and resolution | free, offline |
| `heal_receipt` | full timestamped receipt for one incident, plus the per-field verification table | free, offline |
| `evidence_report` | the whole trail for one incident: unchanged collector id, stage durations, per-field before/after, SHA-256 digests recomputed from disk | free, offline |
| `numbers_audit` | every number the console shows, recomputed from the committed JSON by a second implementation | free, offline |
| `scan_fleet` | live scrape through Bright Data, scored field by field | **spends credit** |
| `heal_spider` | diagnose, re-weave, verify with a fresh scrape, open an incident | **spends credit** |

**Six of the eight read recorded data — instant, free, no network.** The other two declare
`SPENDS_CREDITS` in their own tool descriptions, so the agent has to tell the user before
it bills them. The model cannot quietly spend money.

Worked conversation in `mcp/README.md`. Exercise it without an API key:

```
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"x","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"heal_receipt","arguments":{"incident_id":"inc_001"}}}' \
  | node mcp/server.js
```

### 3. What happened when the site changed under it?

Three times, and two of those were on sites we do not control.

**KESTREL, RENAMED, 0 → 100.** Thirty rows came back, so the row selector was fine — but
the generated scraper had invented its own keys, `story_points` and `comment_count`
instead of the contracted `points` and `comments`, and every value was `0`. Thirty rows of
confident nothing. `bdata scraper heal --auto-approve --auto-save` ran the full chain
(`planner → code_fixer → step_preview_runner → request_fulfillment_validator →
css_selector_extractor → user_approval → save_new_template`) with no human in the loop.
Same collector ID out. 26m 24s detection to verified recovery.

**ATLAS, DRIFTED, 90 → 100.** The subtle one. The `availability` selector matched every
`p.instock.availability` on the page and joined them, so every row read
`"In stock (19 available) In stock In stock…"` — populated on every scan, wrong on every
scan. It passes every null check ever written. The `pattern` validator is what caught it.
106m 12s.

**BODEGA, THROTTLED, 0 → 100, opened by the cron with nobody watching.** See above — the
heal failed, the bug was ours, and the false diagnosis stays on disk.

Artifacts: `data/incidents.json` (three complete records), `data/history.json` (81 real
scans across 3 collectors), `docs/COLLECTORS.md` (heal history table), and the **Chaos
Lab** at `demo-target/` — the page ships as three separate files (`index.html`,
`broken-renamed.html`, `broken-drifted.html`) with a switcher, so a judge can break the
target themselves and watch a scan score it.

### 4. What did the structured output go on to power?

**THE HAUL**, on the live console. Not a health score — the rows themselves. Every card
is real data the fleet brought back, stamped with the collector that fetched it, the scan
timestamp, and the Integrity that Spider was at when the row was captured. Provenance
travels with the data, so a row pulled at 90% tells you it was pulled at 90%.

The same structured output also drives the fleet grid, the sparklines, the incident feed,
Incident Replay, blast radius and MTTR (72m 45s, mean of three) — all from
`data/history.json` and `data/incidents.json`, on the real route, not under `?mock=1`.

---

## The console

Built for the Best UI track. No framework, no build step, no dependencies — plain modules
in `web/js/`, assembled by the `build` job in `.github/workflows/watch.yml`.

- **A character per collector, drawn as inline SVG** (`web/js/fleet/rig/rig.js`, `rig-parts.js`) —
  no trademarked art anywhere. The design is load-bearing rather than decorative: **the
  legs are the expected fields**, one pair per field, and a leg for a dead field draws
  short and collapsed; **the eyes are the integrity band**, lighting rank by rank as
  health climbs; **the symbiote covers exactly what was lost** — its spread is the
  integrity deficit, so the black is the number, not an effect.
- **The opening sequence replays a real incident** — `web/js/sheets/front/intro-plan.js` pins
  `INTRO_INCIDENT_ID = "inc_003"` and beats out its actual integrity drop. It falls back
  to the worst real incident on record, never to a fixture.
- **The incident feed reads as comic issues**, each with a permalink
  (`web/js/data/issue-route.js` routes off `location.hash`) and a print stylesheet
  (`web/css/print/print.css`) so an issue prints as a page, verification table included.
- **THE HAUL** shows the actual scraped rows with provenance stamps.
- **Incident Replay** plays the recorded stage timestamps. The panel says so on screen:
  *"Every timestamp below is recorded, not generated. A re-weave takes up to fifteen
  minutes"* — and the footer reads **Played from recorded time**. Nothing is accelerated
  and nothing is simulated; the playback is stretched to a watchable minimum so a 26-minute
  span is scrubable.

---

## Deliverables

| Deliverable | Status | Notes |
|---|---|---|
| App repository | **done** | public, MIT — https://github.com/mikhailkhorokhorin/scrape-verse-hack |
| Docs repository | **done** | public, on GitLab |
| `README.md` | **done** | pitch, setup, tests, CI, Chaos Lab, architecture, Collector IDs, healing walkthrough |
| Test suite | **done** | 1,152 tests, `npm test`, `node:test`, zero dependencies, offline |
| MCP server | **done** | `mcp/` — eight tools over stdio JSON-RPC, no SDK |
| Demo video | **not recorded** | `docs/VIDEO-SCRIPT.md` |
| Video link in README | **not done** | add the moment the video is uploaded |
| Header screenshot in README | **done, may want refreshing** | `assets/the-watch.png` — predates THE HAUL and the characters; retake with `?capture=1` if time allows |
| LinkedIn post | **written, not posted** | `docs/LINKEDIN-POST.md` |
| Deployed console URL | **done** | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ |
| Incident evidence | **done** | three records in `data/incidents.json`, all `resolved: true`, all carrying `verification` |
| Chaos Lab | **done** | `demo-target/` — three variants and a switcher |

---

## The pipeline runs itself, and the commit history proves it

`.github/workflows/watch.yml` runs on `cron: '*/30 * * * *'`. The `scan` job scrapes every
collector, `repair.js` heals anything broken twice, and the job commits `data/` back to the
repo as `thwip watch <ci@thwip.local>`.

**The public commit history is the evidence.** `git log --author="thwip watch"` returns
nineteen commits authored by the workflow, not by a person. The seven most recent:

```
ce73398 data: scan 2026-08-22T03:53:07Z
6bfb0ee data: scan 2026-08-22T02:41:52Z
57c3614 data: scan 2026-08-22T01:09:26Z
7723284 data: scan 2026-08-21T23:55:30Z
bbbde2b data: scan 2026-08-21T23:27:00Z
eaca911 data: scan 2026-08-21T22:58:15Z
023956c data: scan 2026-08-21T22:28:00Z
```

The automation is not claimed, it is in the log. `inc_003` was opened inside one of those
runs.

---

## Outstanding, in priority order

### P0 — must land before submitting

1. **Record the demo video.** Script is ready and rehearsable — `docs/VIDEO-SCRIPT.md`
2. **Video link into `README.md` and into this file**
3. **Final secrets sweep.** Scrub the exported video frame by frame wherever a terminal or
   editor is visible

### P1 — materially improves the submission

1. **Post to LinkedIn.** Separate prize, costs no developer time. Text is in
   `docs/LINKEDIN-POST.md`; tag **WeMakeDevs** and **Bright Data** as accounts, not only
   as hashtags
2. **Refresh the README header screenshot** with `?capture=1` at 1440px+ so THE HAUL and
   the characters are in frame

---

## Known gaps, stated honestly

Write these into the submission description rather than hoping nobody notices. A judge who
finds an unstated gap discounts everything else; a stated one costs nothing.

- **One of the three heals did not work, and we kept the failure.** `inc_003` was opened
  autonomously by the cron, diagnosed THROTTLED, and healed — and the heal changed nothing,
  because the target had never broken. The bug was in `rowsOf`, our own payload parser. The
  recorded diagnosis is wrong and is still on disk unedited. **This is offered as evidence,
  not as an apology** — an autonomously-opened incident with an honest post-mortem is a
  stronger claim about the system than a third clean success would have been
- **Two of the three heals were invoked by hand.** `inc_001` (KESTREL) and `inc_002`
  (ATLAS) were run by a human calling `bdata scraper heal --auto-approve --auto-save`. The
  *heal itself* was unattended in every case — no human in the planner/fixer/validator
  chain — but only `inc_003` was also **triggered** unattended
- **All three verification objects were backfilled.** They are `backfilled: true` in the
  JSON. Every value in them comes from that incident's own already-committed runs in
  `data/history.json`; nothing was re-scraped and nothing was invented. Live-computed
  verification is wired into the heal path for any incident from here on
- **`inc_002` (ATLAS) was reconstructed after the fact.** The heal ran by hand before the
  incident loop existed. Every timestamp in the record is a real scan timestamp from
  `history.json`, and the record says so in its own `summary` field
- **MTTR is a mean of three samples**, all from one day. It is a real number over a real
  population, and the population is small
- **`data/meta.json` is regenerated by CI on each build**, so between a local change and
  the next CI run it can lag the working tree. Run `npm test` for the live number
- **The heal-trigger endpoint was never built.** The console reads and explains; it has no
  button that spends credit. Healing runs from the cron or from the two MCP action tools,
  which is the honest surface and the one under test
- **The no-hash print is four pages, not three.** Three incident covers, one per page, plus
  the No-Prize letter on a fourth. The No-Prize carries `break-inside:avoid` and is printed
  open by design, so it takes a page of its own rather than being split across the third
  cover. Each `#inc_XXX` deep link still prints as exactly one page carrying its receipt
- **The scratch has no keyboard affordance, by design.** It is a pointer-only reveal over a
  decorative canvas that is `aria-hidden`. Every value it uncovers is already in the
  accessibility tree through the per-field chips and the detail sheet, both fully keyboard
  reachable, so the canvas adds no information a keyboard user cannot otherwise get
- **The sticky section nav is last in the tab order.** It is appended to `<body>` after the
  content it links to, so a keyboard user reaches the sections themselves before the
  shortcut list. Correct for a skip-style nav that appears on scroll, but it does mean the
  visually-first element is not the first tab stop

None of these touch requirement 4, which is the one that matters most: three heals, three
unchanged Collector IDs, all three verifiable from the committed JSON with no API key.

---

## Final morning sequence — Aug 23

Do these in order. Times are realistic, not optimistic. Total to **Submit**: about 2h 15m,
of which the video is 90 minutes.

| # | Step | Time | Where |
|---|---|---|---|
| 1 | **Cron check.** Newest `ts` in `data/history.json` under an hour old. If the cron stopped, run `npm run health` once by hand and say so in the description | 5 min | `data/history.json` |
| 2 | **Record the video.** Rehearse once with a timer, then take it section by section | 90 min | `docs/VIDEO-SCRIPT.md` |
| 3 | **Scrub the export** frame by frame wherever a terminal or editor is visible. Zero keys, zero tokens | 10 min | the exported file |
| 4 | **Upload, paste the link** into `README.md` and the Deliverables table above | 5 min | `README.md` |
| 5 | **`npm test`** — green, and use the number it prints. **`npx eslint .`** — clean | 3 min | repo root |
| 6 | **Deployed console, incognito.** Loads, real data, no console errors, no `?mock=1` on the default route | 5 min | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ |
| 7 | **Anonymous clone**, incognito, no credentials. Then run the `heal_receipt` one-liner from a clean clone to confirm it works with no key | 8 min | https://github.com/mikhailkhorokhorin/scrape-verse-hack |
| 8 | **Read `README.md` top to bottom as a stranger.** Time the four Bright Data questions — each must answer in under 60s | 10 min | `README.md` |
| 9 | **SUBMIT.** Paste the Known-gaps section into the submission description verbatim | 10 min | the hackathon portal |
| 10 | **Post to LinkedIn**, tagging **WeMakeDevs** and **Bright Data** as accounts | 10 min | `docs/LINKEDIN-POST.md` |
| 11 | Only then, keep polishing | — | — |

**If the morning runs short, cut in this order:** step 8, then step 10's screenshot (post
without it). **Never cut steps 1, 3, 6, 9 or 10** — step 3 is a disqualification risk and
step 10 is a whole category that costs ten minutes.

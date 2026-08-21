# THWIP — Backlog

Deadline: **Aug 23, 2026**. Capacity: **1 developer**. Written: Aug 20.

Tasks are ordered by blocking dependency, not by importance. Implementation lives in
`scrape-verse/`. Read `CLAUDE.md` and `DESIGN-SPEC.md` first.

**Rule:** if a task is not in this file, it is not in the build. Ideas go to the Parking
lot at the bottom.

## Order of work

Two things drive this order and neither is negotiable. The repo must exist before code
can land, and **the cron must be running before any UI work starts** — the console is
built on 48 hours of real history, and history cannot be backfilled on the last day.

| # | Task | Phase | Priority |
|---|---|---|---|
| T-32 | Port the prototype into `web/` | frontend | P0 — starts immediately |
| T-24 | Create the implementation repository | -1 | blocking |
| T-25 | Secrets hygiene | -1 | blocking |
| T-01 | Controlled demo universe | 0 | blocking |
| T-02 | Create the three collectors | 0 | blocking |
| T-03 | Health-check script | 0 | blocking |
| T-04 | ~~GitLab CI cron~~ → GitHub Actions | 0 | done — see the note at T-04 |
| T-05 | Repair script | 1 | P0 |
| T-38 | Heal trigger endpoint | 1b | P1 — the only backend |
| T-06 | Wire repair into the cron | 1 | P0 |
| T-07 | Design system foundation | 2 | P0 |
| T-08 | Spider panel component | 2 | P0 |
| T-09 | THE WATCH — main view | 2 | P0 |
| T-10 | Incident Replay | 2 | P0 — needed for the video |
| T-11 | Spider Detail view | 2 | P1 |
| T-16 | Panel size encodes state | 2b | P1 |
| T-17 | Symbiote on the page | 2b | P1 |
| T-18 | Bursts break the frame | 2b | P1 |
| T-20 | Moment of infection | 2c | P0 |
| T-21 | Mean time to recovery | 2c | P0 |
| T-19 | History playback on load | 2c | P1 |
| T-22 | Blast radius | 2c | P1 |
| T-23 | Clean streak | 2c | P2 |
| T-33 | Field heatmap | 2d | P1 — highest information density |
| T-36 | Reveal what arrived | 2d | P1 — cheapest credibility |
| T-34 | Fleet pulse | 2d | P2 |
| T-35 | Scars | 2d | P2 |
| T-37 | Small finishers | 2d | P2 |
| T-26 | Deploy the console | 3 | P0 — the track needs a URL |
| T-27 | Empty and degraded states | 3 | P0 |
| T-28 | Legend | 3 | P0 |
| T-29 | Names and on-screen copy | 3 | P1 |
| T-31 | Accessibility and performance | 3 | P1 |
| T-30 | Link to a single incident | 3 | P2 |
| T-12 | Break rehearsal | 3 | P0 |
| T-13 | Demo video | 3 | P0 |
| T-14 | README | 3 | P0 |
| T-15 | LinkedIn post | — | free prize, do it while the cron runs |

Thirty-one tasks, one developer, two and a half days. That does not fit, and pretending
otherwise is how a submission ends up with nine half-finished features. The P2 items are
already marked for cutting; cut them early and without discussion rather than late and
with regret.

---

## Frontend track — start here, do not wait for the cron

The console is the prize, and it is **not blocked by the backend**. The data contract is
fixed in `CLAUDE.md` and `docs/prototype.html` already renders against mock data shaped
exactly like the real thing. Everything below can be built and finished before a single
real scan exists.

Two rules that save most of a day:

**Start from the prototype, not from an empty file.** T-07 and T-08 are already done in
`docs/prototype.html` — design tokens, the five signature effects, the panel with all its
states, the sparkline, the chips, the detail sheet. Porting it is T-32. Rewriting it from
the spec is a wasted day and will land somewhere worse, because the prototype has already
been rendered and the spec has not.

**Keep the mock fleet behind a flag.** Real data will be thin for a while and broken
states are rare by design. A `?mock=1` switch that loads the prototype's fixtures instead
of the JSON files is how every state stays reachable while building, and how T-27 gets
tested without deleting production data.

| Order | Task | Needs real data? |
|---|---|---|
| 1 | T-32 Port the prototype into `web/` | no |
| 2 | T-16 Panel size encodes state | no |
| 3 | T-18 Bursts break the frame | no |
| 4 | T-17 Symbiote on the page | no |
| 5 | T-28 Legend | no |
| 6 | T-27 Empty and degraded states | no — build against empty fixtures |
| 7 | T-09 Wire to real JSON | **yes** |
| 8 | T-26 Deploy the console | **yes** |
| 9 | T-21 Mean time to recovery | yes — needs one incident |
| 10 | T-20 Moment of infection | yes — needs one incident |
| 11 | T-10 Incident Replay | yes — needs one incident |
| 12 | T-11 Spider Detail (full version) | yes |
| 13 | T-31 Accessibility and performance | no |
| 14 | T-29 On-screen copy | no |
| 15 | T-19 History playback | yes — needs ~24h |
| — | T-23, T-30 | cut candidates |

Items 1-6 are a full day of work that needs nothing from the backend. By the time they
are done the cron will have history, and items 7-12 become unblocked in order.

---

### T-32 · Port the prototype into the app
**Blocks:** the entire frontend track · **Replaces the from-scratch part of T-07 and T-08**

`docs/prototype.html` is a single verified file. Move it into the real app without losing
what has already been proven to render.

- Split into `web/index.html`, `web/styles.css`, `web/app.js`. No build step, no framework,
  no bundler — this is a constraint, not an oversight
- Keep the inline `<svg>` turbulence filter in `index.html`. It must exist in the document
  before any element references it
- Keep `<meta charset="utf-8">`. Without it every ✓ ⚠ ✗ and every em dash renders as
  mojibake — this already happened once
- Move the mock fleet into `web/fixtures.js` behind `?mock=1`; the default path fetches
  `data/history.json` and `data/incidents.json` by **relative** URL so local and deployed
  behave identically
- Keep the demo control bar, but only under `?mock=1`. It must not ship on the live URL
- The prototype's `history()` generator is synthetic — delete it once real data flows,
  and never let it fall back to synthetic silently. A chart of invented numbers on a
  project about data integrity is the worst possible bug to ship

**Done when:** `web/` renders exactly what the prototype renders, `?mock=1` reaches every
state, and the default path reads the real JSON files.

---

## Phase -1 — Groundwork (Aug 20, before anything else)

Two tasks. Neither is interesting and both block every other task in this file.

### T-24 · Create the implementation repository
**Blocks:** everything

`docs/` is a git repository. `scrape-verse/` is a bare directory. There is nowhere to put
code yet.

- `git init` in `scrape-verse/`, push to the same GitLab group as `docs`
- Layout, fixed now so no task has to invent one:
  ```
  scrape-verse/
    scripts/       health-check, repair, shared config
    web/           the console — index.html, styles.css, app.js
    data/          history.json, incidents.json (committed by CI)
    demo-target/   the controlled page we break on purpose
    collectors.json
    .gitlab-ci.yml
    .env.example
    .gitignore
    README.md
  ```
- Pick one language for `scripts/` — Node or Python — and never mix. Node is the
  lower-friction choice: the Bright Data CLI is npm-distributed and CI needs no extra
  runtime setup
- `data/history.json` and `data/incidents.json` start as `[]`, committed, so the console
  has something to fetch on day one

**Done when:** the repo is pushed, the tree above exists, and both JSON files are valid
empty arrays.

---

### T-25 · Secrets hygiene
**Blocked by:** T-24 · **Blocks:** T-04

A leaked key is the one mistake here that cannot be undone by working harder.

- `.gitignore` covers `.env`, `.env.local`, `credentials.json`, `config.json`
  (the last two are where `bdata login` stores its state)
- `.env.example` lists `BRIGHTDATA_API_KEY=` with no value
- `BRIGHTDATA_API_KEY` lives in the GitHub Actions secret store, never in a workflow file.
  **There is no `DATA_TOKEN`** — that was the GitLab plan; GitHub Actions commits with the
  built-in `GITHUB_TOKEN`
- CI must never echo the key. Check that no step prints env, and that `bdata` output
  is not logged verbatim if it can contain the token
- Before recording anything: confirm no terminal frame will show the key, and clear
  shell history of any command containing it

**Done when:** `git log -p | grep -i "api[_-]key"` returns nothing but the example file,
and CI runs green without a key anywhere in the repo.

---

## Phase 0 — Get the cron running (Aug 20, tonight)

Nothing visual starts until this phase is done. The console needs 48 hours of real
history to look like a product instead of a prototype, and that history cannot be
backfilled later. This is the only genuinely irreversible deadline in the project.

### T-01 · Controlled demo universe
**Blocks:** T-02, T-12

Static product-listing page hosted on GitLab Pages. This is the page we deliberately
break during the demo, so the break is reproducible instead of left to a third party.

- Simple listing: 8-12 products, each with title, price, rating, image
- Semantic, stable class names (`.product-title`, `.product-price`, `.product-rating`)
- Plain HTML/CSS, no JS rendering — extraction must not depend on client-side hydration
- Deployed and publicly reachable
- Second branch or commented-out block with **renamed classes**, ready to swap in for
  the live break

**Done when:** URL is public, loads without JS, and a class-rename swap takes under 30s.

---

### T-02 · Create the three collectors
**Blocked by:** T-01 · **Blocks:** T-03

Each `bdata scraper create` takes 5-25 minutes and costs credit. Run all three, then
**pin every Collector ID in `COLLECTORS.md` immediately**. A lost ID means paying the
cost twice.

```bash
bdata scraper create <url> "<field description>"
```

- 1 collector against the T-01 demo page
- 2 collectors against public niche sites — **not** in Bright Data's 800+ pre-built
  library, no login wall, no paywall. Pick long-tail: regional marketplaces, small
  catalogs, job boards, docs sites
- Same four-field shape across all three where possible: title, price, rating, image.
  Uniform shape keeps the Integrity math and the UI simple
- Verify each with `bdata scraper run <c_*> <url> --pretty` before moving on

**Done when:** three `c_*` IDs pinned in `COLLECTORS.md`, each returning clean JSON.

---

### T-03 · Health-check script
**Blocked by:** T-02 · **Blocks:** T-04

`scrape-verse/scripts/health-check.js` (or `.py` — pick one language and stay in it).

- Reads collector config from a single source of truth (`collectors.json`)
- For each: `bdata scraper run <c_*> <url> --pretty`, parse JSON
- Classify every field as `LIVE` / `INFECTED` / `DEAD`:
  - `DEAD` — `null`, `""`, or `[]`
  - `INFECTED` — present but fails its validator
  - `LIVE` — present and valid
- Validators, one per field type, kept deliberately simple:
  - `price` — parses to a number greater than 0
  - `rating` — parses to a number inside the declared range
  - `title` — non-empty string, 3-200 chars, does not contain `undefined` / `null` / `NaN`
  - `image` — parses as a URL with an `http(s)` scheme
- `integrity = round((live + 0.5 * infected) / expected * 100)`
- Derive `status`: `HEALTHY` >= 90, `DEGRADED` 60-89, `CRITICAL` < 60
- Append a run record to `data/history.json` per the schema in `CLAUDE.md`
- Non-zero exit on transport failure, but **never** on low Integrity — low Integrity is
  a normal, expected reading, not a script error

**Done when:** running it locally appends three valid records and prints an Integrity
summary.

---

### T-04 · GitLab CI cron  ← **SUPERSEDED**
**Blocked by:** T-03

> **Migrated to GitHub Actions.** GitLab runners never came up — sixteen consecutive
> pipelines failed before creating a single job — so the pipeline, the `*/30` cron, Pages
> and the data commits all live in `.github/workflows/watch.yml`. The cron is in the file,
> there is no UI schedule, and there is **no `DATA_TOKEN`**: GitHub Actions commits with
> the built-in `GITHUB_TOKEN` via `permissions: contents: write`. One secret only,
> `BRIGHTDATA_API_KEY`. See `docs/runbooks/GITHUB-SETUP.md`. Everything below is the original GitLab
> plan, kept as the record of why the move happened — do not work from it.

`.gitlab-ci.yml` in the implementation repo. **GitLab differs from GitHub Actions in three
ways that all bite here** — none of this is a syntax translation.

**1. The schedule is not in the file.** GitLab has no `on: schedule:`. Cron lives in the
project UI under **Settings → CI/CD → Pipeline schedules**, created by a human, once. The
YAML only reacts to it via `$CI_PIPELINE_SOURCE == "schedule"`.

**2. Committing back needs a real token.** `CI_JOB_TOKEN` cannot push to the repository.
Create a **Project Access Token** with the `write_repository` scope and store it as a
masked CI/CD variable (`DATA_TOKEN`), then push over HTTPS with it.

**3. Variables live in Settings → CI/CD → Variables**, and must be marked **masked** and
**protected** as appropriate.

```yaml
stages: [watch]

watch:
  stage: watch
  image: node:20
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
    - if: '$CI_PIPELINE_SOURCE == "web"'          # manual run button
  resource_group: watch                            # serializes runs, protects the JSON
  script:
    - npm i -g @brightdata/cli
    - node scripts/health-check.js
    - node scripts/repair.js || true               # never fail the pipeline on a heal
    - |
      git config user.email "ci@thwip.local"
      git config user.name  "thwip watch"
      git add data/
      git diff --staged --quiet || git commit -m "data: scan $(date -u +%FT%TZ)"
      git push "https://oauth2:${DATA_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git" HEAD:main
  variables:
    GIT_STRATEGY: clone
```

- `resource_group: watch` is the GitLab equivalent of a concurrency group — without it two
  overlapping runs can corrupt `data/history.json`
- `repair.js` is suffixed with `|| true` deliberately: a failed heal is data, not a broken
  pipeline
- Never echo `$DATA_TOKEN` or `$BRIGHTDATA_API_KEY`. Masked variables still leak if you
  print them yourself

**Human setup, once, before this can run:** create the Project Access Token, add
`DATA_TOKEN` and `BRIGHTDATA_API_KEY` as masked CI/CD variables, and create the pipeline
schedule at `*/30 * * * *`.

**Done when:** two consecutive scheduled pipelines have committed real records with no
manual intervention.

**Watch the budget.** 3 collectors x 48 runs/day x 3 days is ~430 runs. Confirm the
per-run cost against the $50 credit before leaving it unattended overnight. Drop to hourly
if the math is tight.

---

## Phase 1 — Close the loop (Aug 21)

### T-05 · Repair script
**Blocked by:** T-04

`scrape-verse/scripts/repair.js`

- Trigger: Integrity < 60 on **two consecutive runs** for the same collector. Single-run
  triggers cause thrash on transient network failures
- Build the heal prompt from the actual dead fields, e.g.
  `"fields 'price' and 'rating' return null after a layout change"` — keep under 1000 chars
- ```bash
  bdata scraper heal <c_*> "<prompt>" --url <url> --auto-approve --auto-save
  ```
- Poll to completion (up to 15 min), then re-run and verify Integrity recovered
- Write a full incident record to `data/incidents.json` per the schema in `CLAUDE.md`,
  including every stage timestamp — Incident Replay is driven entirely by these
- Cooldown: never heal the same collector twice within 2 hours

**Done when:** one real incident is recorded end to end with all four stages and a
genuine before/after Integrity delta.

---

### T-06 · Wire repair into the cron
**Blocked by:** T-05

Extend `watch.yml` to call `repair.js` after the health check when the trigger condition
is met. Commit `data/incidents.json` alongside history.

**Done when:** the loop runs unattended — detect, heal, verify, log — with no human in
the path.

---

## Phase 2 — The console (Aug 21 evening → Aug 22)

This is the prize. Roughly 60% of remaining hours belong here.

`DESIGN-SPEC.md` is a contract. Section 8 (Banned) is non-negotiable — check every
task against it before calling it done.

### T-07 · Design system foundation
**Blocked by:** T-04 (needs real data shape)

`scrape-verse/web/` — `index.html`, `styles.css`, `app.js`. No build step, no framework.

- All CSS custom properties from spec section 2
- Google Fonts link from section 3
- The five signature effects from section 4 as reusable classes: `.halftone`, `.chroma*`,
  `.panel`, glitch keyframes, `.burst`
- 8px-base spacing scale
- `prefers-reduced-motion` block

**Done when:** a static page renders one hardcoded panel that already looks like the
comic direction, with zero banned-list violations.

---

### T-08 · Spider panel component
**Blocked by:** T-07

Build the panel exactly per spec section 5, in the order given.

- Codename, universe domain, status badge
- Large Integrity readout, monospace, colored by state
- 24h sparkline — **hand-rolled inline SVG**, no chart library
- Integrity bar with the transition behavior from section 5
- **Symbiote spread layer** per spec 4.6 — SVG turbulence filter, masked, driven by a
  single `--spread` custom property. This is the primary health signal, not the bar.
  If the edge is a smooth gradient instead of torn, it is not done
- Field chip row with three states — `LIVE` / `INFECTED` / `DEAD`. Infected chips pulse.
  This is the credibility element, do not cut it
- `UNWATCHED` treatment per spec 4.7 when the last scan is over 3 hours old
- Last scan timestamp
- All five states render correctly: `HEALTHY`, `DEGRADED`, `CRITICAL`, `REWEAVING`,
  `RECOVERED`

**Done when:** all states are distinguishable at 50% zoom with no text readable, and
panel content is still legible at `--spread: 0.85`.

---

### T-09 · THE WATCH — main view
**Blocked by:** T-08

- Masthead: THWIP wordmark, global average Integrity, last scan time, live pulse
- Spider grid, responsive per spec section 7, alternating panel tilt
- Incident feed below — vertical comic strip, newest first, one panel per incident
  showing what broke, when, re-weave duration, before/after Integrity
- Reads `data/history.json` and `data/incidents.json` via `fetch`
- Staggered panel entrance on load

**Done when:** a single 800px-wide screenshot of this view is legible and striking. This
is the README header image and the video thumbnail — it has to carry the whole project.

---

### T-10 · Incident Replay
**Blocked by:** T-09 · **Required for the demo video**

Timeline playback of one real incident: `DETECTED → DIAGNOSED → REWEAVING → VERIFIED`.

- Play / pause / scrub
- Integrity animates along the recorded timeline
- Panel glitches and recovers in sync with the stages
- Before/after field diff — which anomalies came back
- Real elapsed durations shown as data, replayed at watchable speed

This exists because `heal` takes up to 15 minutes and cannot be filmed live. Everything
shown is genuine recorded data — no acceleration tricks in the video itself.

**Done when:** a real recorded incident plays back start to finish and reads clearly
without narration.

---

### T-11 · Spider Detail view
**Blocked by:** T-08 · **Priority: after T-10**

- Per-field breakdown with fill rate over time — the feature that stops a judge reading
  this as a gimmick
- Full-history Integrity chart
- Last raw JSON sample, syntax-highlighted, `null`s visually marked
- **Collector ID displayed on screen** — this is submission proof, put it in the UI
- `RE-WEAVE` action button — POSTs the collector ID to the T-38 endpoint, then moves the
  Spider to `REWEAVING` and disables itself for the cooldown window. It does not wait for
  a result: healing runs up to 15 minutes and the cron completes it. Say so in the UI —
  a spinner that never resolves is worse than a clear "handed off, this takes minutes"

**Done when:** clicking any panel opens it and every value shown is real.

---

### T-26 · Deploy the console
**Blocked by:** T-09 · **P0 — the Best UI track needs a URL**

A judge will not clone a repository to look at a UI. Without a live URL the console
effectively does not exist for the track we are competing in.

- GitLab Pages: a job named exactly `pages` that copies `web/` and `data/` into `public/`
  and declares `artifacts: paths: [public]`. The name and the directory are both fixed by
  GitLab — nothing else publishes
  ```yaml
  pages:
    stage: deploy
    script: [mkdir -p public, cp -r web/* public/, cp -r data public/]
    artifacts: { paths: [public] }
    rules: [{ if: '$CI_COMMIT_BRANCH == "main"' }]
  ```
- `data/` must be copied into `public/` too, or the console fetches 404s
- The URL is `https://<group>.gitlab.io/<project>/` — note the trailing path segment;
  relative fetch paths handle it, absolute ones break
- The console fetches `data/*.json` by relative path so it works locally and deployed
  with no config switch
- URL goes in the README header, in the submission, and in the video description
- Check it on a phone once. A judge may well open it on one

**Done when:** the URL loads the console with real data, from a browser that has never
seen the repository.

---

### T-27 · Empty and degraded states
**Blocked by:** T-08 · **P0 — protects the whole visual**

Everything we designed assumes 48 hours of dense history. The cron starts the evening of
Aug 20, so by the morning of Aug 22 there will be roughly thirty hours — *if nothing
breaks*. If something does, the console must degrade honestly instead of rendering
`NaN%` over a broken layout.

Handle each of these explicitly:

| Situation | Behavior |
|---|---|
| `history.json` is `[]` | "No scans yet" plate, panels in a neutral waiting state — never 0% |
| A Spider has under 6 runs | Sparkline shows real points only, plus a label with the count. Do not interpolate |
| `incidents.json` is `[]` | Feed shows "No incidents recorded" — this is good news, say so |
| A fetch fails | Visible error state naming the file. Never fail silently to an empty page |
| MTTR with zero incidents | `--`, never `0m 0s` |

Under-length history is labelled, not hidden. "6 hours of history" is honest and reads as
a young system; a stretched sparkline pretending to be 48 hours is a lie a judge may well
catch.

**Done when:** deleting both JSON files still produces a readable, explained page.

---

### T-28 · Legend
**Blocked by:** T-09 · **P0 — without it the main visual idea is unreadable**

We know black means loss and a violet chip means the value arrived and is garbage. A judge
opening the console for the first time does not. Unexplained, the symbiote reads as a dark
gradient and the strongest idea in the project lands as decoration.

- Compact legend on THE WATCH, always visible — not behind a tooltip or a hover
- Covers: the five states, the three field chips, and what the black actually encodes
- One line for the symbiote, in product language: *the black is what the scraper lost*
- Styled as a comic character sheet — it belongs on the page, not bolted onto it
- Must survive T-16's compact panels — the legend explains the sizing too, since panel
  size now carries meaning

**Done when:** someone who has never seen the project can name what black, violet, and a
struck-through chip mean after five seconds on the page.

---

### T-29 · Names and on-screen copy
**Blocked by:** T-02 · **P1 — product work, not engineering**

Codenames and microcopy are in shot for the entire video and nobody owns them yet.

- Three codenames per the rules in `COLLECTORS.md`: short, uppercase, one word
- Every label on screen, written from the reader's side: what a person recognizes, not
  what the system calls it
- Empty-state copy for each case in T-27
- Buttons say what happens. `RE-WEAVE` acts, then the state says re-woven
- No lorem, no placeholder, nowhere, at any point

**Done when:** every string on screen was deliberately written, and nothing on screen is
a variable name in disguise.

---

### T-30 · Link to a single incident
**Blocked by:** T-10 · **P2**

`#inc_014` opens the console with that incident's replay ready.

The README and the video will both want to point at one real, specific case. Without this
we describe it in prose and the reader has to take our word for it.

- Hash routing, no framework
- Unknown id falls back to THE WATCH rather than erroring
- The incident panel exposes its own link

**Done when:** pasting a URL with an incident hash opens straight to that replay.

---

### T-31 · Accessibility and performance pass
**Blocked by:** T-09 · **P1**

Both are already acceptance criteria in `DESIGN-SPEC.md`, which means so far nobody is
going to do them. Making it a task fixes that.

- Contrast: every text/ground pair at AA. `--critical` on `--void` is 4.2:1 — large text
  and fills only, never small body copy
- Keyboard: every panel and control reachable and visibly focused. The detail sheet traps
  focus and returns it to the opening panel on close
- `prefers-reduced-motion`: all states still distinguishable with motion off — glitch and
  symbiote keep their static styling
- Load under 2s cold. The turbulence filter is the main risk; check it on a mid-range
  laptop, not only the dev machine
- Renders at 375, 768, and 1440

**Done when:** every box above is checked on a real device, not assumed.

---

## Phase 3 — Submission (Aug 22 evening → Aug 23)

### T-12 · Break rehearsal
**Blocked by:** T-09, T-01

Run the full break sequence twice before recording anything.

- Swap the T-01 class names, trigger a manual scan, confirm Integrity drops and the
  glitch fires
- Confirm an incident opens and the re-weave completes
- Back up `data/` before each rehearsal so a bad take is recoverable
- Time the whole sequence so the video script matches reality

**Done when:** two clean end-to-end rehearsals, `data/` backed up.

---

### T-13 · Demo video
**Blocked by:** T-12

Follow the script in `PRODUCT.md`. Target 2-3 minutes.

- Record at 1440px or wider so panel detail survives compression
- State plainly that the demo page is ours and that we break it on purpose
- State plainly that healing takes up to 15 minutes and that Replay is recorded, not
  accelerated. Honesty here costs nothing and protects against a judge assuming worse
- Show the Collector ID on screen at least once
- No secrets, no `.env`, no API keys visible in any terminal frame

**Done when:** exported, watched start to finish once, no visible secrets.

---

### T-14 · README
**Blocked by:** T-09

Written for a judge who will clone and run it.

- Header image: the THE WATCH screenshot from T-09
- One-paragraph problem statement from `PRODUCT.md`
- Setup: prerequisites, `BRIGHTDATA_API_KEY`, install, run
- Architecture diagram (the ASCII one in `CLAUDE.md` is fine)
- Collector IDs listed openly — this is the submission proof
- How self-healing works, with a real logged incident quoted
- Link to the demo video
- **Roadmap section.** A judge will ask what comes next; having the answer written costs
  no development time and scores on impact and vision. Mark every item plainly as not
  built:
  - **Quarantine** — an infected Spider detaches itself from downstream consumers so bad
    rows stop flowing while the re-weave runs. The natural sequel to blast radius
  - **Field contracts** — subscribe to a field rather than a scraper: *wake me if `price`
    fill rate drops below 95%*
  - **Transferable cures** — a heal prompt that worked on one site is offered for a
    similar break on another. A fleet that learns
  - **Pre-emptive healing** — fingerprint the target's DOM and detect drift before fields
    start failing
  - **Cost per clean row** — what one correct row actually costs, across runs and heals

Five honestly-labelled unbuilt items beat one of them half-finished in the code.

**Done when:** a stranger can clone, set the key, and get a scan on the first try.

---

### T-15 · LinkedIn post (Daily Bugle track)
**Not blocked. Do it while cron runs.**

Separate prize (Galaxy Watch), roughly an hour of work, zero competition with the build.

- The problem framing — scrapers decay, they do not crash
- One screenshot or short clip of THE WATCH
- What Scraper Studio self-healing actually did, with the real incident numbers
- Tag WeMakeDevs and Bright Data, use the hackathon hashtag

**Done when:** posted before the deadline.

---

## Phase 2b — Structure, not skin (Aug 22)

Do these **after** T-09 renders, and before the demo video.

Why they exist: the prototype proved the art direction works, and also showed the
weakness. We had painted a conventional dashboard in comic colors — equal cards in a
3×N grid, badge + big number + sparkline + progress bar, activity feed underneath. A
Best UI judge has seen that layout hundreds of times and reads the comic styling as a
skin over it.

These three tasks move the distinctiveness from the palette into the information
architecture. Each is small. Together they are the difference between "a themed
dashboard" and "a design".

Code below is written against `docs/prototype.html` and is known-good CSS/JS shape, but
it has **not been rendered and verified** — treat it as a strong starting point, not as
tested code.

---

### T-16 · Panel size encodes state
**Blocked by:** T-09 · **Highest value of the three**

A real comic page does not use equal frames. The big panel is the dramatic one, and size
carries meaning. Apply that literally: a sick Spider takes over the page, a healthy one
shrinks out of the way. The layout itself becomes a reading of fleet health — you do not
scan for the problem, the problem occupies half the screen.

```css
.grid{
  display:grid; grid-template-columns:repeat(3,1fr);
  grid-auto-rows:168px; grid-auto-flow:dense;
  column-gap:26px; row-gap:22px;
}
.cell--critical,.cell--reweaving{grid-column:span 2; grid-row:span 2;}
.cell--degraded{grid-column:span 1; grid-row:span 2;}
.cell--healthy,.cell--unwatched{grid-column:span 1; grid-row:span 1;}

@media(max-width:1199px){
  .grid{grid-template-columns:repeat(2,1fr);}
  .cell--critical,.cell--reweaving{grid-column:span 2;}
}
@media(max-width:767px){
  .grid{grid-template-columns:1fr; grid-auto-rows:auto;}
  .cell,.cell--critical,.cell--degraded,
  .cell--reweaving,.cell--healthy,.cell--unwatched{grid-column:span 1; grid-row:span 1;}
}
```

The panel must fill its cell — replace `min-height:352px` with `height:100%`.

A compact panel drops what a healthy Spider does not need. No diagnosis is required when
nothing is wrong, so chips and the large readout go; codename, badge, sparkline, bar and
a small percentage stay.

```css
.panel--compact{padding:var(--s2) var(--s3); gap:10px; justify-content:space-between;}
.panel--compact .chips{display:none;}
.panel--compact .lastscan{display:none;}
.panel--compact .integrity .label{display:none;}
.panel--compact .integrity__value{font-size:1.5rem; display:inline;}
.panel--compact .spark{height:30px;}
.compact-foot{display:flex; align-items:center; gap:var(--s2);}
.compact-foot .bar{flex:1;}
```

In the template, branch the body on `status`, and put the size class on the wrapper cell:
`<div class="cell cell--${status}">`.

**Carry it further if the grid holds.** If size already encodes state, equal columns stop
earning their place: let healthy Spiders collapse to a single row of strips at the bottom
and a critical one take the **full width**, like a comic splash page. The console in a
healthy state then becomes an almost empty page saying everything is clean — which is the
strongest frame available to us, because dashboards are never allowed to be empty. Same
`span` mechanics, different numbers, no extra hours.

**Watch for:** with three Spiders and mixed sizes, `dense` can leave a hole in the grid.
Check every combination — all healthy, one critical, two degraded — and confirm none of
them leaves an obviously broken gap. If a hole is unavoidable, fill it with the fleet
integrity readout rather than empty space.

**Done when:** a critical Spider visibly dominates the page, healthy ones read as strips,
and no layout combination leaves an unexplained gap.

---

### T-17 · The symbiote is not contained by one panel
**Blocked by:** T-09 · **Cheap, disproportionate effect**

Right now infection is trapped inside each card, so the fleet reads as three unrelated
widgets. Let the substance pool on the page itself, behind and between the panels. Fleet
health then needs no number at all — it is how much of the screen has gone black.

Add one fixed element, before `.wrap`:

```html
<div class="fleet-symbiote" id="fleet-sym"><div class="fleet-symbiote__body"></div></div>
```

```css
.fleet-symbiote{
  position:fixed; inset:-20px; z-index:0; pointer-events:none;
  filter:url(#symbiote-turbulence) drop-shadow(0 0 30px var(--symbiote-edge));
}
.fleet-symbiote__body{
  position:absolute; inset:0; background:var(--symbiote);
  -webkit-mask-image:radial-gradient(155% 120% at 50% 118%,
    #000 calc(var(--fleet,0) * 96%), transparent calc(var(--fleet,0) * 96% + 16%));
  mask-image:radial-gradient(155% 120% at 50% 118%,
    #000 calc(var(--fleet,0) * 96%), transparent calc(var(--fleet,0) * 96% + 16%));
  -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
  transition:-webkit-mask-image 1100ms cubic-bezier(.22,1,.36,1),
             mask-image 1100ms cubic-bezier(.22,1,.36,1);
  animation:symbiote-breathe 14s ease-in-out infinite;
}
```

```js
document.getElementById("fleet-sym")
  .style.setProperty("--fleet", Math.max(0,(100 - fleetAvg)/100).toFixed(2));
```

Same two-element rule as section 4.6 of `DESIGN-SPEC.md`: mask inside, filter on the
wrapper, or the edge comes out smooth.

**Watch for:** `.wrap` sits at `z-index:1` and panels are opaque, so the substance should
only ever show between and around them. If it washes over readable text, lower its
opacity — do not shrink the mask, the spread has to stay proportional to fleet health.

**Done when:** dropping one Spider to critical visibly darkens the page around the grid,
and all body text stays at AA contrast.

---

### T-18 · Bursts break the frame
**Blocked by:** T-08 · **Ten minutes of work**

In a comic the sound effect overruns the panel border and lands on whatever is next to
it. Sitting neatly inside the frame is the one thing it must not do — and a burst that
stays inside is what makes the page read as a grid of divs.

```css
.burst{
  position:absolute; top:-8%; left:64%; z-index:60; pointer-events:none;
  font-family:Bangers,Impact,cursive; font-size:clamp(2.75rem,6.5vw,4.5rem);
  -webkit-text-stroke:4px var(--ink); paint-order:stroke fill;
  filter:drop-shadow(4px 4px 0 var(--ink));
  transform:translate(-50%,-50%) rotate(-11deg);
  animation:burst-in 400ms cubic-bezier(.34,1.8,.64,1) both,
            burst-out 600ms ease-in 900ms both;
}
.cell{position:relative;}
.cell.has-burst{z-index:40;}
```

```js
function burst(panel, word, color){
  if (!panel) return;
  const cell = panel.closest(".cell");
  const b = document.createElement("div");
  b.className = "burst"; b.textContent = word; b.style.color = color;
  panel.appendChild(b);
  if (cell) cell.classList.add("has-burst");
  setTimeout(()=>{ b.remove(); if (cell) cell.classList.remove("has-burst"); }, 1600);
}
```

**Two things will silently defeat this.** `isolation:isolate` on `.panel` creates a
stacking context the burst cannot escape — remove it. And `transform` on `.cell` (the
comic tilt) creates one too, so the cell itself has to be lifted with `z-index` while
the burst is on screen. That is what `has-burst` is for.

**Done when:** a burst visibly overlaps the neighbouring panel and its own border, and
nothing is left raised after it fades.

---

## Phase 2c — Product features (Aug 22, if the console is standing)

Five features, chosen by the team. **This is more than the remaining capacity holds.**
One developer, ~2.5 days, eighteen tasks already open. Rather than guess later, the cut
line is written down now:

| Priority | Task | Cut when |
|---|---|---|
| **P0** | T-20 Moment of infection | Never — cheapest, and it is the proof a judge asks for |
| **P0** | T-21 Mean time to recovery | Never — one number, an hour of work |
| **P1** | T-19 History playback on load | Cut if the console is not finished by Aug 22 midday |
| **P1** | T-22 Blast radius | Late. It is the "so what" of the whole product |
| **P2** | T-23 Clean streak | Cut first. Cheap, but a healthy strip survives without it |

Work top down. Shipping three of these well beats five half-done — a half-finished
animation is worse than none, because it reads as a bug rather than as a missing feature.

---

### T-20 · Moment of infection
**Blocked by:** T-11 · **P0**

In every incident, show the last clean scan and the first dirty one side by side, with the
diff highlighted.

This is the frame where the Spider got replaced — the metaphor landing on real data
instead of on an animation. It also answers the question a judge will definitely ask:
*how do you know what broke?*

- Two JSON samples from `data/history.json`: the run before `opened_at`, and the run that
  opened the incident
- Per-field highlight: unchanged is dim, `→ null` in `--critical`, `→ invalid` in
  `--infected`, changed-but-valid in `--degraded`
- Side by side above 900px, stacked below
- Label the columns with their real timestamps, not "before" and "after"

**Done when:** a real incident shows both samples and the dead and infected fields are
identifiable without reading the values.

---

### T-21 · Mean time to recovery
**Blocked by:** T-06 · **P0**

One readout in the masthead: average time from `DETECTED` to `VERIFIED` across all
incidents.

Small, and it changes what the project is. A health bar is a visualization; MTTR is the
number on-call teams are actually measured by. Putting it on screen says this is an
operations tool that happens to look like a comic.

- Compute from `data/incidents.json`: mean of `closed_at - opened_at`
- Format as `13m 24s`, monospace, tabular figures
- Show incident count next to it — a mean over two incidents needs that context
- Empty state: `--` and the label `no incidents yet`, never `0m 0s`

**Done when:** the masthead shows a real mean over real incidents, with the count beside it.

---

### T-19 · History playback on load
**Blocked by:** T-09, T-16 · **P1**

On first open, the console plays the last 48 hours in about 6 seconds, then settles into
the present: sparklines draw left to right, incidents drop into the feed at their real
relative moments, the symbiote advances and retreats, panels resize as states change.

The first five seconds decide the Best UI track, and right now they are a static screen.
This turns them into the product's own history, told without a word — and it is a ready
made cold open for the demo video.

- Drive it from `data/history.json` in timestamp order, compressed to ~6s
- Panel size transitions come free from T-16 — make sure the grid animates rather than
  snapping
- **Skippable.** Any click, key, or scroll jumps to the present. A judge on their second
  visit must not sit through it again
- `prefers-reduced-motion: reduce` skips straight to the final state
- Remember completion in `sessionStorage` — play once per session, not per reload

**Watch for:** the page must be readable and interactive the whole time. If playback
blocks clicks or leaves elements mid-animation when skipped, it is a bug, not a feature.

**Done when:** it plays once, reads clearly, can be skipped at any point, and always ends
in exactly the state a plain load would produce.

---

### T-22 · Blast radius
**Blocked by:** T-05 · **P1 — replaces the old break-classification task**

One line on every incident card: *1,240 rows shipped with a null `price` during the
14 minutes this Spider was infected.*

This is the "so what" of the entire product. Blast radius answers the question a judge and
a real user both actually have — how much bad data got out. It makes the thesis measurable
instead of illustrative, and it moves the console from monitoring into incident response.

**Correction, Aug 21.** This task originally said the `RENAMED` / `SHIFTED` taxonomy was
being *replaced* by blast radius. That was wrong on two counts: `CLAUDE.md` documents
`strain` as part of the incident contract, and `web/js/replay-data.js` reads
`incident.strain`. The two features answer different questions — strain says *what kind of
break this was* and sharpens the heal prompt; blast radius says *how much bad data
escaped*. Strain is now implemented in `scripts/repair.js` and rendered on the incident
card. Blast radius remains unbuilt and is still worth building; it does not replace
anything.

```js
// everything needed is already in history.json
const runs = history.filter(r =>
  r.spider === inc.spider && r.ts >= inc.opened_at && r.ts <= inc.closed_at);
const affected = runs.length * collector.rows_per_run;
```

- Store `rows_per_run` per collector in `collectors.json` — measure it, never guess it
- Render as a sentence, not a stat tile. `1,240 rows` in `--critical`, the rest in body
  copy: it should read as a consequence, not as a metric
- During Incident Replay the count **ticks up as the timeline advances** and freezes the
  moment `VERIFIED` lands. That is the most persuasive four seconds available to us
- Still-open incidents show `counting…`, never `0`

**Done when:** a real incident states how many rows carried each broken field, and the
number ticks during replay.

### T-23 · Clean streak
**Blocked by:** T-08 · **P2 — replaces the old diurnal-rhythm task**

On a healthy Spider's panel: *47 clean scans in a row.*

T-16 shrinks healthy panels to strips, which leaves them nearly empty — a codename and a
bar. The streak gives that strip something to say, in the register the design already
speaks: comics count issues, and "47 issues without a miss" is the same sentence.

It also earns trust the health bar cannot. `100%` says nothing about yesterday. `47 in a
row` is a claim about durability.

```js
let streak = 0;
for (const run of runsFor(spider).slice().reverse()) {
  if (run.status !== "HEALTHY") break;
  streak++;
}
```

- Render only at `HEALTHY`. A streak beside a critical panel is noise
- Break on any non-healthy run, not on incidents — a `DEGRADED` scan that never opened an
  incident still ends it. Honesty over flattery
- Below 5 scans show nothing rather than "3 in a row"
- Keep the personal best beside it: `47 in a row · best 61`

Dropped for this: diurnal rhythm. It was atmosphere carrying zero information, and a
healthy strip needs information more than it needs mood.

## Phase 2d — Features with teeth

Four features chosen because the implementation itself is interesting, not because the
list needed to be longer. Each runs on data that already exists, none needs a library,
and none touches the backend beyond one config field.

Priorities are honest: **T-33 is the strongest thing in this whole file** and T-36 is a
cheap finisher. T-34 and T-35 are where the comic and the telemetry finally become the
same object.

---

### T-33 · Field heatmap
**Blocked by:** T-11 · **P1 — highest information density in the project**

A grid in Spider Detail: **fields down, scans across, 48 hours wide.** Every cell is one
field on one run, colored `LIVE` / `INFECTED` / `DEAD`.

```
        ← 48 hours →
title   ████████████████████████████████████████████████
price   ███████████████████████████░░░░░░░░░░░░░░░░░░░░░
rating  ██████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
image   ████████████████████████████████████████████████
```

Why this beats every other chart we have: aggregate Integrity **hides the pattern**. A
Spider sitting at 88% for two days looks stable, and the heatmap shows `rating` has been
infected the entire time while everything else is fine. Slow single-field decay is the
exact failure this product claims to catch, and right now nothing on screen actually
shows it.

Implementation is a CSS grid and nothing else:

```css
.heat{display:grid; grid-auto-flow:column; grid-template-rows:repeat(4,14px);
      gap:2px; overflow-x:auto;}
.heat i{width:8px; border:1px solid var(--ink);}
.heat i[data-s="live"]{background:var(--healthy);}
.heat i[data-s="infected"]{background:var(--infected);}
.heat i[data-s="dead"]{background:var(--void);}
```

- Column order is chronological, oldest left. Label both ends with real timestamps
- Gaps in scanning are **rendered as gaps**, not closed up — a missing run is information
- Hovering a column shows that run's timestamp and Integrity
- Horizontal scroll inside its own container; the page must never scroll sideways
- Below ~20 runs, render what exists and say so. Never pad

**Done when:** a field that has been quietly infected for a day is obvious at a glance,
without reading a single number.

---

### T-34 · Fleet pulse
**Blocked by:** T-09 · **P2**

One line across the masthead, full width, ~40px tall: the fleet's heartbeat. Each scan is
one beat. A healthy fleet beats evenly. A fleet with an infected Spider goes **arrhythmic**
— beats flatten, intervals stagger, amplitude drops.

This is where the organism metaphor stops being a decoration and starts carrying data.
Nobody builds a dashboard with a pulse line, because dashboards do not think of a fleet as
a body. Ours does — that is the whole premise.

```js
// amplitude from integrity, rhythm from scan spacing
const beat = (integrity, x) => {
  const amp = (integrity / 100) * 16;
  return `L${x} 20 L${x+3} ${20-amp} L${x+6} ${20+amp*0.6} L${x+9} 20`;
};
```

- Build one SVG `path`, stroke `--healthy` shifting toward `--critical` as the fleet
  average falls
- A `CRITICAL` Spider flattens its beats toward the baseline — a flatline reads instantly
  and needs no legend
- Animate with `stroke-dashoffset` so the trace draws left to right on load, then holds.
  **Do not loop it.** A permanently animating line is noise after ten seconds
- Skip drawing entirely below 8 scans — two beats is not a rhythm
- `prefers-reduced-motion`: draw it complete, no trace animation

**Done when:** the pulse visibly degrades when a Spider goes critical, and reads correctly
with motion disabled.

---

### T-35 · Scars
**Blocked by:** T-08, T-06 · **P2**

Two related marks, both permanent, both free.

**On the sparkline:** a vertical notch at every past incident. The line stops being a
pretty curve and becomes a record — *this Spider has been down four times this week.*

**On the panel:** a healed Spider keeps a faint residue of the symbiote along its bottom
edge — `--spread: 0.04`, never fully clean again, with a count: `healed 3×`.

The metaphor pays off here in a way pure recovery does not. Full restoration to pristine
would say breakage leaves no trace, which is false in every operational system anyone has
ever run. A scraper that has broken four times is more likely to break again, and the
panel should say so without a word.

```js
const scars = incidents.filter(i => i.spider === code)
  .map(i => xFor(i.opened_at));   // reuse the sparkline's x-scale
```

```css
.scar{stroke:var(--critical); stroke-width:2; opacity:.65;}
.panel[data-healed]::after{
  content:"healed " attr(data-healed) "×";
  position:absolute; right:10px; bottom:8px;
  font:600 .625rem "IBM Plex Mono",monospace; color:var(--infected); opacity:.7;
}
```

- Scars render under the sparkline stroke, never over it
- Residue applies only after a **verified** heal, not after a drop
- Cap the label at `9+`
- Never on a Spider that has never broken — an unscarred panel has to stay meaningful

**Done when:** a healed Spider is visually distinguishable from one that has never broken.

---

### T-36 · Reveal what arrived
**Blocked by:** T-08 · **P1 — cheapest credibility on the board**

Hover or focus an `INFECTED` chip and it shows what actually came back:

```
  rating   expected  number 0–5
           received  "undefined"
```

Twenty minutes of work, and it converts the single most abstract element in the design
into hard evidence. Right now a violet chip asks the viewer to take our word that the
value is wrong. This shows them.

- Popover, not `title=` — the native tooltip is slow, unstyled, and invisible on touch
- Keyboard reachable: chips get `tabindex="0"` and open on focus
- Tap-to-open on touch, tap-outside to dismiss
- `DEAD` chips get the same treatment: `received null`
- Truncate long values to 60 chars with a middle ellipsis; never let one blow out the panel

**Done when:** every infected and dead field can show its real received value by hover,
focus, or tap.

---

### T-37 · Small finishers
**Blocked by:** T-09 · **P2 — an hour for all four**

- **Tab title and favicon react.** An open incident makes the title `⚠ THWIP (1)` and
  swaps the favicon. The console stays useful in a background tab, which is where a
  monitoring tool actually lives
- **Direction, not just level.** A small delta beside Integrity: `63% ↓7`, computed over
  the last 3 scans. A number without a direction is half a reading
- **Capture mode.** `?capture=1` hides the demo bar and every control, leaving the page
  clean for README screenshots and video frames. We will want this at 2am on the 22nd
- **Incident count in the section header.** `INCIDENT FEED · 4` — cheap orientation

**Done when:** all four work and none of them appear on the deployed URL by default.

---

## Phase 1b — The one piece of backend

### T-38 · Heal trigger endpoint
**Blocked by:** T-06 · **P1 — closes a real hole in the design**

The console has a `RE-WEAVE` button and, as the architecture stands, nothing that could
execute it. A browser cannot run `bdata scraper heal`, and calling the GitLab API from
client JS would mean shipping a token in plain sight.

One serverless function fixes this without adding infrastructure to maintain: it accepts
a POST, holds the trigger token **on its own side**, and starts the existing pipeline.
Roughly thirty lines. Cloudflare Workers or Vercel Functions — either is fine, pick
whichever account already exists.

```js
export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("nope", { status: 405 });

    const { collector_id } = await req.json();
    if (!env.ALLOWED.split(",").includes(collector_id))
      return new Response("unknown collector", { status: 403 });

    const body = new URLSearchParams({
      token: env.TRIGGER_TOKEN,          // GitLab pipeline trigger token, server-side only
      ref: "main",
      "variables[HEAL_COLLECTOR]": collector_id
    });

    const r = await fetch(
      `https://gitlab.com/api/v4/projects/${env.PROJECT_ID}/trigger/pipeline`,
      { method: "POST", body });

    return new Response(null, { status: r.ok ? 202 : 502 });
  }
};
```

**This endpoint is public and it spends money.** Every heal costs Bright Data credit, so
treat it as an attack surface, not as a convenience:

- **Allowlist collector IDs.** Only the three in `COLLECTORS.md` are accepted. Never pass
  a client-supplied ID through to the CLI
- **The heal prompt is never accepted from the client.** It is built in `repair.js` from
  the actual dead and infected fields. A browser that can supply prompt text can inject
  arbitrary instructions into the healer
- **Cooldown enforced server-side**, not only in the UI — reuse the 2-hour rule from T-05.
  A disabled button is not a rate limit
- **CORS locked to the Pages origin.** No wildcard
- **Use a pipeline trigger token**, not a personal access token. Create it under
  Settings → CI/CD → Pipeline trigger tokens. It can start pipelines and nothing else,
  which is exactly the authority this endpoint should have
- The pipeline reads `$HEAL_COLLECTOR` and passes it to `repair.js`. Guard it there too —
  server-side allowlisting is not a substitute for validating at the point of use
- Return `202`, never the CLI output. Errors from the healer are not the caller's business

The button changes state, not reality: healing takes up to 15 minutes, so the Spider moves
to `REWEAVING` and the cron finishes the job. This buys honesty rather than speed — the
control does exactly what it says and nothing more.

**Done when:** pressing `RE-WEAVE` on the deployed console starts a real workflow run,
with no token anywhere in the client bundle.

---

## UI ideas — Suit-Up track (Aug 22-23)

Not numbered tasks. Each is a **brief**: one idea, one file, written to be picked up without
re-deriving anything. The narrative version, the merges, the rejections and the feasibility
audit stay in `docs/UI-IDEAS.md`; the briefs below are what you actually work from.

The problem all of them serve: the first screen is all green, and the strongest thing in the
design lives below the fold.

| Id | Idea | Status | Cost | Brief |
|---|---|---|---|---|
| UI-01 | Opening sequence | ACCEPTED | medium | `docs/ideas/UI-01-opening-sequence.md` |
| UI-02 | Every incident is an issue | ACCEPTED | medium | `docs/ideas/UI-02-issues.md` |
| UI-03 | Live polling | OPEN | small | `docs/ideas/UI-03-live-polling.md` |
| UI-04 | Evidence line in the masthead | ACCEPTED | trivial + CI | `docs/ideas/UI-04-evidence-line.md` |
| UI-05 | Sparkline hover, and the keyboard path | OPEN | small | `docs/ideas/UI-05-sparkline-hover.md` |
| UI-06 | Panel numbers | OPEN | trivial | `docs/ideas/UI-06-panel-numbers.md` |
| UI-08 | Caption-box section headers | OPEN | small | `docs/ideas/UI-08-caption-headers.md` |
| UI-09 | Phone pass — a gate, not a feature | OPEN | small | `docs/ideas/UI-09-phone-pass.md` |
| UI-10 | Diptych above the grid | ACCEPTED | small | `docs/ideas/UI-10-diptych.md` |
| UI-13 | Print artefacts | OPEN | small | `docs/ideas/UI-13-print-artefacts.md` |
| UI-16 | The page reacts to fleet health | OPEN | small | `docs/ideas/UI-16-page-reacts.md` |
| UI-18 | **The cast** — parent brief | ACCEPTED | — | `docs/ideas/UI-18-the-cast.md` |
| UI-18a | The rig | ACCEPTED | medium | `docs/ideas/UI-18a-the-rig.md` |
| UI-18b | Legs are fields | ACCEPTED | medium | `docs/ideas/UI-18b-legs-are-fields.md` |
| UI-18c | Eyes are integrity | ACCEPTED | small | `docs/ideas/UI-18c-eyes-are-integrity.md` |
| UI-18d | The symbiote gets a face | ACCEPTED | small | `docs/ideas/UI-18d-symbiote-face.md` |
| UI-18e | Idle life | ACCEPTED | small | `docs/ideas/UI-18e-idle-life.md` |
| UI-18f | The scan lands on screen | ACCEPTED | small | `docs/ideas/UI-18f-scan-lands.md` |
| UI-19 | The crawler | OPEN | small | `docs/ideas/UI-19-crawler.md` |
| UI-20 | Cover character in the masthead | OPEN | medium | `docs/ideas/UI-20-cover-character.md` |
| UI-21 | The character speaks | OPEN | medium | `docs/ideas/UI-21-character-speaks.md` |
| UI-22 | Mask favicon | OPEN | trivial | `docs/ideas/UI-22-mask-favicon.md` |
| UI-23 | The cast in the detail sheet | OPEN | small | `docs/ideas/UI-23-cast-in-detail-sheet.md` |

**Ids with no brief, deliberately.** UI-07 merged into UI-21, UI-11 into UI-05, UI-12 and
UI-17 into UI-02. UI-14 (history scrubber) and UI-15 (side-by-side Spiders) are rejected
with reasons in `docs/UI-IDEAS.md`. Ids are never reused.

**Build order.** UI-04 → UI-06 → UI-05 → UI-18a → UI-18b → UI-18c → UI-18e → UI-10 →
UI-01 → UI-02. UI-09 runs twice: once when the rig lands, once before submitting, and it is
the only item that can reject work already done.

---

## Parking lot

Explicitly deferred. Do not start these. Listed so they stop being re-proposed.

- GitHub PR bot that opens a PR per heal — strong for the Grand track, irrelevant to Suit-Up
- Slack / Discord alerting
- Predictive healing (DOM fingerprint drift detection before breakage)
- More than 3 collectors
- Real database, API server, auth
- Cost-per-heal tracking and budget dashboard
- Live polling — the console re-reading JSON every 30s. Considered and not taken; it is
  near-free, so revisit it if an hour appears
- Sound design. Autoplay is blocked and audio hurts more than helps during judging
- Threads drawn between infected Spiders. It would look good and would be a lie — our
  collectors are unrelated and no correlation exists
- Per-Spider "days unobserved" counter

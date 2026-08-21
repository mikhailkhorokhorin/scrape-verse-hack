# Queue

**The agent works this list top to bottom.** Take the first unchecked item, do it, check
it off, commit, move on. Do not ask what to do next — this file is the answer.

Task detail is in `TASKS.md` by number. What is cut and why is in `PLAN.md`.

Mark blocked items `[!]` with a one-line reason and skip to the next item that is not
waiting on them. Never stop the whole queue for one failure.

---

## Done

- [x] **T-01** (page built) Demo target — `demo-target/index.html`, 12 products, no JS.
      Breaking instructions are in an HTML comment: `.product-price` → `.price-tag` kills
      price, `.product-rating` → a data attribute infects rating, `.product-image` →
      `.thumb` kills image. The rating swap is the one worth showing — the field keeps
      returning a value and the value is wrong
- [x] **CI pipeline** — **moved to GitHub Actions**, `.github/workflows/watch.yml`.
      GitLab runners never came up (sixteen consecutive failures before a single job was
      created), so the pipeline, the cron, Pages and the data commits all live on GitHub
      now; `.gitlab-ci.yml` is kept only as history and the GitLab project is a mirror.
      Three jobs: `scan` (`*/30` cron in the file, health-check then repair, commits
      `data/` back with the built-in `GITHUB_TOKEN`), `build` (assembles `public/` from
      `web/`, `data/` and `demo-target/`) and `deploy` (Pages). One secret,
      `BRIGHTDATA_API_KEY` — no second token. Migration recorded in `docs/runbooks/GITHUB-SETUP.md`
- [x] **T-24** Implementation repository — layout, `.gitignore`, `.env.example`,
      `collectors.json` with all three targets chosen and robots-checked
- [x] **T-25** Secrets hygiene — gitignore covers `.env*`, `credentials.json`
      and `config.json`; `.env.example` carries an empty key. Workflow reads the key from
      the secret store only. `BRIGHTDATA_API_KEY` is set as a GitHub Actions repository
      secret and is the only one the pipeline needs

## Needs a decision — found in the first real scan, Aug 21

The first live scan landed and it is **not clean**. None of this is a code defect; all
three are extraction-vs-validator mismatches that only real data could expose. Do not
"fix" them by loosening validators until the extraction has been looked at.

- [x] **ATLAS `price` returns an object, not a number.** Scraper Studio is emitting
      `{"value": 17.93, "currency": "GBP", "symbol": "£"}`. The validator sees an object,
      stringifies it and marks it `infected`. `17.93` on its own classifies `live`, so the
      fix is either to extract the scalar or to teach `classify` to unwrap
      `{value}` — **the latter changes the data contract, so decide deliberately**
- [x] **ATLAS `availability` is concatenating rows.** — *healed, 90% → 100%, same
      collector id.* One cell came back as
      `"In stock (19 available) In stock In stock In stock…"`, 77 chars against a 60-char
      max, so it read `infected`. The selector was matching a container rather than the
      per-row element — classified `DRIFTED` and fixed by a manual heal. ATLAS has scanned
      at 100% since `06:59:24Z`. Logged in `COLLECTORS.md`; **no incident record**, the
      heal predates the incident loop
- [x] **KESTREL returned 30 rows with every field `null`** — *healed, 0% → 100%, same collector id.* — Integrity 0, `CRITICAL`. Rows
      are being found but no field extracts, which usually means the row selector matches
      and the field selectors do not. Confirm the collector finished creating before
      concluding anything; if it is finished, this is a `heal` candidate and a genuinely
      good first incident to record

**All three are now resolved** — two by real heals on unchanged Collector IDs, one by
teaching `classify` to unwrap `{value}`. A third heal followed later, on BODEGA. All three
collectors scan at 100%. The 60%, 90% and 0% periods stay in `data/history.json`: they are
the recovery the sparkline draws, and deleting them would be deleting the evidence.

Left alone deliberately: `data/*.json` is real committed history. Nothing in it was
edited by hand at any point.

## Blocked on a human

- [x] **Authentication** — done, balance $52. `bdata login`, or export `BRIGHTDATA_API_KEY`. Opens a browser,
      needs a person. Everything below marked *(no auth)* can be done before this happens

---

## Day 1 — Aug 21

- [x] **T-01** Demo target page — **now the Chaos Lab, three variants.**
      `demo-target/index.html` (healthy), `broken-renamed.html` (class names moved —
      `price` and `image` go DEAD, `rating` moves into a data attribute) and
      `broken-drifted.html` (markup untouched, values rotted — price an em dash, rating
      the literal string `"undefined"`, image a placeholder). A switcher in the page
      header moves between them and `?v=healthy|renamed|drifted` redirects, so a judge can
      break the target themselves without editing anything.
      All three are generated from one source: `build-data.js` holds the 12 products and
      the variant definitions, `build-page.js` renders, `node build.js` writes all three.
      Published with the console at
      `https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/`, which is
      pinned in `collectors.json` under BODEGA
- [x] **T-03** Health-check written — `scripts/health-check.js` + `scripts/lib.js`.
      Three-state classification, majority vote across rows, integrity with infection at
      half credit, history capped at 2000. Skips collectors without an ID and exits 0, so
      the pipeline is green before anything exists. Unit-checked against real sample rows
      from both live targets: validators cover the word-rating on books.toscrape
      (`star-rating Three`) and HN's points/comments/author shape. Integrity is computed
      off `Object.keys(fields)`, so both field schemas (5 fields and 4) work.
      **Untested against a live collector — needs auth**
- [x] **T-05** Repair written — `scripts/repair.js`. Two consecutive bad scans before
      healing, 2h cooldown, prompt built from real dead/infected fields, verifies with a
      fresh run rather than trusting the heal. **Untested against a live collector**
- [x] **Pipeline schedule** — superseded. The `*/30 * * * *` cron is declared in
      `.github/workflows/watch.yml` itself, so there is no UI schedule to create
- [x] **T-02** Create the three collectors — **all three exist**, pinned in both
      `COLLECTORS.md` and `collectors.json`, each with its `create` envelope committed:
      BODEGA `c_mt2lkwxa1bb5uz223s`, ATLAS `c_mt2fnqqngikv29od5`, KESTREL
      `c_mt2fnt3p2k4n644701`. All three have produced real scans, and all three are
      extracting cleanly — BODEGA 100%, ATLAS 100% after its heal, KESTREL 100% after
      its heal. `RUNBOOK-T02.md` is now a historical record, not work outstanding
- [x] **T-04** CI cron, every 30 min — **done on GitHub Actions, not GitLab.**
      `.github/workflows/watch.yml` carries the `*/30 * * * *` schedule in the file, so
      there is no UI step and no second token: the `scan` job commits `data/` back with
      the built-in `GITHUB_TOKEN` via `permissions: contents: write`, and
      `concurrency: watch` stops two scans writing at once. The GitLab route was abandoned
      after sixteen consecutive pipelines failed to start a runner — the `DATA_TOKEN`
      Maintainer-role trap documented here never became relevant
- [x] **Verify heal manually, once** — done Aug 21, KESTREL 0% → 100% in ~9 min, `c_mt2fnt3p2k4n644701` unchanged. Logged in `COLLECTORS.md`. Was: — needs auth
      One `bdata scraper heal` against BODEGA. Record the real duration in
      `COLLECTORS.md`. Do not automate healing before watching it work once
- [x] **T-32** Port `docs/prototype.html` into `web/` — split into `index.html` plus
      `web/css/` and `web/js/`, with `js/fixtures.js` holding the mock fleet behind
      `?mock=1`.
      Inline turbulence filter and `<meta charset>` kept. Default route fetches the real
      JSON by relative path and shows honest empty states — no synthetic fallback.
      Verified in a browser on both routes
- [x] **T-16** Panel size encodes state — `web/css/sizes.css`, `panel--compact` /
      `panel--big` / `cell--tall` in `web/js/panel.js` and `markTallCells`
- [x] **T-18** Bursts break the frame — `burst()` in `web/js/panel.js`, `.burst` in
      `web/css/states.css`

## Day 2 — Aug 22

- [x] **Break the demo page on purpose** — happened, though not as a rehearsal. BODEGA
      scanned `CRITICAL` at 0% four times from `07:02:55Z` (all four fields `dead`),
      `repair.js` opened `inc_002` unattended at `07:48:20Z` with strain `THROTTLED`, and
      the collector was back at 100% by `09:13:59Z` on the same
      `c_mt2lkwxa1bb5uz223s`. **The incident was never closed** — `inc_002` stops at
      `REWEAVING` with `resolved: false` and `closed_at: null`, so the console still shows
      it open. The recovery is in `data/history.json`; the closing write is what is
      missing. Not repaired by hand: writing that record after the fact would be
      manufacturing evidence
- [x] **T-06** Wire repair into the cron — `.github/workflows/watch.yml` runs
      `node scripts/repair.js` in the `scan` job, after the health check, guarded with
      `|| true` so a failed heal is recorded as data instead of reddening the pipeline.
      **Partially proven end to end** — it opened `inc_002` against BODEGA unattended,
      which is further than the tests alone go, but it never wrote the closing stage, so
      the full round trip has still not completed. The decision logic is covered by the
      test suite
- [x] **T-09** Console reads the real JSON — `web/js/app.js` `loadLive()` fetches both
      files by relative path with `cache: "no-store"`, refreshes every 60s, and routes
      parse/HTTP failures into honest error plates rather than fixtures. `?mock=1` is the
      only path that shows synthetic data
- [x] **T-26** Deploy the console to Pages — live at
      **https://mikhailkhorokhorin.github.io/scrape-verse-hack/**, published by the
      `build` and `deploy` jobs on every push to `main`. `build` assembles `public/` from
      `web/`, `data/` and `demo-target/`, so the console, its data and the Chaos Lab all
      ship together and the relative `data/*.json` fetches resolve
- [x] **T-27** Empty and degraded states — `plateHTML` / `failPlate` in
      `web/js/sparkline.js`, NO SCANS YET / ALL QUIET / SIGNAL LOST all render;
      `seriesNote` labels a short series instead of stretching it
- [x] **T-21** Mean time to recovery — `renderMttr()` in `web/js/render.js`, derived
      from `closed_at - opened_at`. Verified against synthetic incidents
- [x] **T-20** Moment of infection — `web/js/infection.js`, clean/dirty sample pair
      per incident. It resolves a pair for the real `inc_001`, but **both runs either
      side are integrity 0**: KESTREL was already broken at its very first scan
      (`04:43:39Z`), so there is no genuinely clean before-state on disk for it. The
      before/after contrast reads properly only under `?mock=1`. Not a code defect —
      the history simply starts after the break
- [x] **T-28** Legend — `web/css/legend.css` and the `.legend` block in `web/index.html`
- [x] **Strain classification** — `strainOf` in `scripts/repair.js` closes a contract that
      was documented but never implemented. Four strains (`THROTTLED` / `SHIFTED` /
      `DRIFTED` / `RENAMED`), each written onto the incident and appended to the heal
      prompt with a one-line rationale. Shown on the incident card (`strainHTML` in
      `render.js`, glosses in `config.js`, styling in `feed.css`) and already consumed by
      Incident Replay. All four branches unit-checked against the real classifier
- [x] **T-10** Incident Replay — `web/js/replay.js`, `replay-data.js`, `replay-view.js`,
      `replay-mount.js` and `web/css/replay.css`. Plays the recorded stage timestamps back
      at a watchable pace with the heal prompt and the before/after field table on screen.
      Reads `incident.strain` (`replay-data.js`), so it depended on the strain field being
      written — see T-22 note below. Verified on `?mock=1` and now against the real
      `inc_001`, which carries all four stage timestamps, the heal prompt and the
      recovered fields, so Replay plays on the live route
- [x] **T-36** Reveal what arrived — `web/js/received.js` + `web/css/reveal.css`,
      expected-vs-received on every infected and dead chip
- [ ] **T-12** Break rehearsal, twice, with `data/` backed up
- [ ] **T-13** Record the demo video

## Day 3 — Aug 23

- [x] **T-14** README with the roadmap section — `README.md` carries the pitch, layout,
      setup, the test suite, the GitHub Actions CI contract, the Chaos Lab, THE HAUL, the
      MCP server, targets, all three Collector IDs, an architecture diagram, the three
      field states, how healing works, an honest "what is not finished" section, and a
      five-item roadmap explicitly marked as not built. Header screenshot
      (`assets/the-watch.png`) is in. `LICENSE` (MIT) alongside it.
      **Remaining:** the demo video link
- [x] **Both repositories are public** — done Aug 21. Anonymous clone verified.
      The other hackathon subgroups (`hack.genesis`, `max-hack`, `ozon-tech`) were left
      private
- [ ] **Submit** — before polishing is finished. There is no partial credit for a
      repository nobody looked at

## Uncut — built ahead of schedule

These were on the cut list. They were built anyway, verified in the browser on `?mock=1`,
and they ship. Listed here so nobody re-cuts a feature that already exists.

- [x] **T-23** Clean streak — `cleanStreak` / `bestStreak` in `web/js/adapter.js`,
      rendered by `streakHTML` in `panel.js`. Healthy strips only, hidden below 5, keeps
      the personal best beside the current run
- [x] **T-34** Fleet pulse — `web/js/pulse.js` + `web/css/pulse.css`. One SVG path across
      the masthead, amplitude from integrity and rhythm from real scan spacing; goes
      arrhythmic and reads "arrhythmic" when any recent beat falls below 60. Hidden below
      8 scans, so it never fakes a rhythm out of three points
- [x] **T-35** Scars — `web/js/scars.js` + `web/css/scars.css`. A notch on the sparkline
      at every past incident, plus `healed N×` residue on a panel that has been repaired.
      Residue only after a **verified** heal, capped at `9+`
- [x] **T-37** Small finishers — all four: reactive tab title and generated favicon
      (`web/js/finish.js`), the `↓7` direction delta beside Integrity (`setDelta` in
      `render.js`), `?capture=1` clean-screenshot mode, and section counts
      (`INCIDENT FEED · 4`)
- [x] **T-11** Spider Detail — `web/js/sheet.js`. Per-field run tracks with fill rates,
      expectations, collector ID, streak, times healed and the last sample. Opens on
      panel click, closes on Escape or backdrop
- [x] **Refactor into modules** — the single ported file became 47 JS modules and 39
      stylesheets under `web/`, each small enough to read. No build step, no framework.
      The UI-ideas pass below is most of the growth from the original 19 and 17
- [x] **Test suite** — **886 tests, `npm test`, `node:test`, zero dependencies.**
      Thirty-seven files under `test/`: `classify` and its exact boundaries, integrity
      `scoring`, `payload` shapes, strain `diagnosis`, the `heal` decision, `repair` gating
      (two consecutive bad scans, 2h cooldown), atomic JSON `storage`, the MCP server —
      `mcp` (protocol), `mcp-tools` (the four read tools), `mcp-actions` (the two
      credit-spending ones, against a mocked `lib.bdata`), `mcp-handshake`, `mcp-injection`
      and `mcp-receipt` — and the console's own pure modules, which the UI-ideas pass
      brought under test: `web-rig`, `web-delta`, `web-speech`, `web-issue`, `web-intro`,
      `web-diptych`, `web-wild` and the rest. No network and no real `bdata` calls — the suite runs offline in well under a second and never spends
      credit. This is the Best-Clean-Code evidence that the pipeline's rules are pinned
      rather than asserted
- [x] **ESLint config** — `eslint.config.js`, flat config, explicit browser and node
      global lists so the no-build-step console still gets linted
- [x] **Chaos Lab** — the demo target became three generated variants with a switcher.
      See T-01 above. It turns "the site changed underneath us" from a claim into
      something a judge can trigger in one click
- [x] **MCP server** — `mcp/`, JSON-RPC 2.0 over stdio written straight against the spec
      with no SDK and no dependencies: `server.js`, `protocol.js`, `registry.js`,
      `read-tools.js`, `action-tools.js`. Six tools — `fleet_status`, `spider_history`,
      `incident_log` and `heal_receipt` read the committed data for free; `scan_fleet` and
      `heal_spider` drive Bright Data and say in their own descriptions that they spend
      credit. Connects in one line (`claude mcp add thwip -- node mcp/server.js`) or via
      `npm run mcp`. `heal_receipt` prints the phases beside the unchanged `collector_id`,
      which turns the judged claim into a single tool call. Setup and a worked
      conversation are in `mcp/README.md`
- [x] **THE HAUL** — the main page shows the rows the fleet actually brought back, each
      stamped with its collector, the scan timestamp and the Integrity at capture.
      `web/js/haul-data.js` resolves rows from the `sample` on every history record,
      `haul-view.js` renders, `haul.js` mounts. It answers the judged question of what the
      structured output went on to power, using the committed data rather than a fixture

## UI ideas — Suit-Up track

Twenty-three briefs in `docs/ideas/`, worked after the pipeline was proven. The problem
they all serve: the first screen was all green, and the strongest thing in the design lived
below the fold. Twenty shipped, one was cut after being built, one was rejected before it
was, and one is a gate that has not been run. Each brief carries its own status line at the
top; the table in `TASKS.md` is the index.

- [x] **UI-18 · The cast** — all six sub-ideas, and the largest single piece on the list.
      One inline-SVG spider is authored once and parameterised per collector
      (`web/js/rig.js`, geometry in `rig-parts.js`), so BODEGA, ATLAS and KESTREL are a
      cast rather than one sprite repeated. **The character is the readout, not a mascot
      beside it:** every expected field owns a mirrored pair of legs, so a Spider at half
      Integrity is standing on half its legs; eight eyes light by Integrity band, dimmed
      rather than removed so the socket still reads. The symbiote spread got teeth and
      eyes (`symbiote.js`, `css/symbiote-face.css`) so infection reads as something
      arriving. Idle motion is seeded per panel so nothing syncs — **one element short**:
      the mask-plate highlight in UI-18e was not built, and the brief says so. When a new
      record lands the Spider reacts (`rig-react.js`), with `THWIP!` reserved for records
      carrying `after_heal`. Covered by `test/web-rig.test.js` and
      `test/web-rig-react.test.js`
- [x] **One shared diff, not three** — `web/js/delta.js`, decided Aug 21 and held to.
      UI-03, UI-18f and UI-21 all needed a previous-render diff; it was built once, as a
      pure adapter-layer function with full per-field granularity, fed inside `loadLive()`
      before the new `SPIDERS` overwrites the old. `test/web-delta.test.js` pins it
- [x] **UI-03 · Live polling** — `landing.js` + `css/landing.css` mark the moment a new
      scan lands instead of re-rendering silently
- [x] **UI-21 · The character speaks** — `speech.js` picks the line, `bubble.js` mounts it
      and enforces one bubble at a time. Bubbles fire on **real transitions only**, off
      `delta.js`, so nothing speaks unless something actually changed
- [x] **UI-01 · Opening sequence** — `intro.js` + `intro-plan.js` replay a real incident on
      first load. `INTRO_INCIDENT_ID` is `inc_003`, the BODEGA break — recorded data, not a
      scripted animation. `REPLAY INTRO` in the masthead runs it again
- [x] **UI-02 · Every incident is an issue** — the feed became a shelf of comic-issue
      covers (`issue.js`), each with a hash permalink (`issue-route.js`) and a print
      stylesheet (`css/print.css`). Absorbs UI-12 (deep link) and UI-17 (print report)
- [x] **UI-10 · Diptych above the grid** — `diptych.js` puts a healthy Spider and a taken
      one side by side, **both picked out of real `history.json` records** via the shared
      `from-record.js` helper. Not two poses of the same drawing
- [x] **UI-04 · Evidence line in the masthead** — `evidenceParts()` / `renderEvidence()` in
      `masthead.js`, reading `data/meta.json`. The test count in that file is written by
      the `Count the tests` step in `.github/workflows/watch.yml`, which parses the real
      TAP pass count and fails the job if it cannot read one — the number on screen cannot
      drift from the suite
- [x] **The small ones, all shipped** — sparkline hover with a keyboard route
      (`sparkhover.js`, plus the grid `keydown` handler in `app.js`); caption-box section
      headers (`caption.js`); panel numbers (`.panel__no` in `panel.js`); the page ground
      darkening with fleet health (`ground.js`); print artefacts (`css/print-artefacts.css`);
      the graded mask favicon whose lit eye-band width is fleet Integrity (`faviconFor()` in
      `finish.js`)
- [x] **UI-23 · The cast in the detail sheet** — `sheet-rig.js`, mounted above the field
      diagnosis. **Shipped with one deliberate change of form:** the leg-to-field mapping
      is stated as a named chip per field beside the character, not as labels drawn on each
      leg. At the size the sheet renders the rig, 6px labels collided with each other and
      with the legs they annotate. Same `fieldOrder`, same per-field state — stated, just
      not as leader lines
- [x] **"IN THE WILD"** — `wild.js` marks an incident that happened on a site we do not
      control. Two of the three do: ATLAS on books.toscrape.com and KESTREL on
      news.ycombinator.com. Only BODEGA is our own page. The note counts them and names the
      sites, and it disappears entirely if every incident was on a page we own
- [x] **UI-19 · The crawler — CUT.** Built first, against a real rendered sparkline, then
      cut on look before it was committed. No crawler code and no partial implementation
      is left in the repository
- [x] **UI-20 · Cover character — REJECTED**, Aug 21, before any code. The tagline block
      carries the product thesis and UI-04 wins the contested masthead slot
- [ ] **UI-09 · Phone pass** — the one gate, and the only item that can reject work already
      done. Not run

## Only if everything above is done

- [x] **T-22** Blast radius — built, renders in the feed and the replay. Was: `rows_per_run` is already
      stored on every incident by `repair.js` and `rows` on every run by `lib.js`, so the
      count needs no new data — only the sentence on the incident card and the tick during
      replay
- [x] **T-33** Field heatmap — per-field tracks in the detail sheet (`css/track.css`)
- [x] **T-38** Heal trigger endpoint — Cloudflare Worker in `endpoint/`, token stays server-side, button hides itself until an endpoint is configured
- [x] **T-17** Page-level symbiote — fleet-wide treatment in `css/fleet.css`

## Cut

Not in the build. Listed so they stop being reconsidered:
`T-07` `T-08` (superseded by T-32) · `T-19` · `T-29` · `T-30` · `T-31`

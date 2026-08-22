# COUNTERPLAY — the last day, played against the field

Written 22 Aug, after the second reconnaissance (131 repositories, 93 hackathon-era,
four serious). Deadline 23 Aug. `COMPETITION.md` holds the recon; this file holds what
we do about it.

**The read in one paragraph.** Best UI is ours to lose: six live deployments in the
whole field and zero design directions. Best Clean Code is not catchable — 1,022 tests
against a best-elsewhere of 15 test files — but it is only ours if a judge can *see* it
in ninety seconds. Best Use of Bright Data is genuinely contested by two entries that
each tell one sharp story: Gatekeeper ("we reject the heal that lies") and MCP-Studio
("we fixed Bright Data's own MCP gap"). Neither has what we have — wild-site breaks, an
unattended cron committing evidence every 30 minutes, and an autonomous incident whose
wrong diagnosis we kept — but right now those facts are *findable*, not *told*. Today's
work is almost entirely narrative surface over machinery that already exists. That is
cheap, and it is exactly what moves a judge with twenty minutes per entry.

**What "worthy" means per rival, concretely:**

| Rival | Their one sentence | Our counter-sentence after today |
|---|---|---|
| Gatekeeper | "Bright Data's heal can lie; we reject it before it ships" | "A heal that lies cannot close an incident here: `resolved` is computed from a fresh scan, wrong-but-populated values are caught by per-field validators, and the receipt shows before/after values with digests — run one command and check" |
| MCP-Studio | "We gave Bright Data's official MCP server the Studio lifecycle it lacks" | "Our MCP is six-to-eight tools over raw stdio JSON-RPC with zero dependencies, wired to a product with a recorded incident history — and the receipt tool prints evidence, not status" |
| Patchwright | "Press the button, watch a repair in 25 seconds" | "Open `?mock=1`, press BREAK — the symbiote climbs, the character reacts, RE-WEAVE tears it off, the receipt prints. Ten seconds, in the judge's own browser, no backend" |
| sentinel-scrape-verse | "25 healing-log entries and a bot committing every 6 hours" | "21 bot commits at 30-minute cadence, 87+ scans, three incidents with per-field receipts — and the commands to count them yourself are in the README" |
| instax-dutta | "Three collectors, arbitrage, alerts" | breadth is not the axis; we answer with depth and let the receipts speak |

---

## Ground rules (unchanged, restated)

Everything stated must remain checkable-true — the honesty ledger is our differentiator
and one invented number destroys it. Zero comments in code · ≤250 lines/file · vanilla
globals, no build · tests green (1,022 baseline) and lint clean at every commit ·
DESIGN-SPEC §8 before any CSS · `prefers-reduced-motion` in the same commit · **no
`bdata` calls and no credit spent by any agent — ever; the one credit decision below is
the user's alone** · no behavioural edits to `scripts/` or `.github/` without the cron
ritual · pushes in safe windows with rebase. **Max 2 agents in parallel, disjoint
files, lead merges.**

---

## Front A — Bright Data: turn machinery into story

### A1 · "The heal that lies" — the direct answer to Gatekeeper *(agent, ~1h)*

The defence already exists in code and nobody can see it:
- `scripts/verify.js` computes the verification from a **fresh run after the heal**,
  never from the heal's own report.
- `scripts/repair.js:205` sets `resolved` only when that fresh run clears the HEALTHY
  threshold — a heal that returns nothing, or garbage, leaves the incident **open**.
- The per-field validators in `collectors.json` catch the exact failure in Gatekeeper's
  showcase incident: a value that is populated and wrong (their silently-nulled `units`
  is our `DEAD`; their schema-passing garbage is our `INFECTED` at half credit).

Work:
1. **Tests that tell the story end-to-end** (`test/heal-that-lies.test.js`): a
   simulated heal whose "after" run returns (a) all nulls → verdict
   `NOTHING_CAME_BACK`, `resolved:false`; (b) populated garbage failing validators →
   fields `INFECTED`, integrity below threshold, `resolved:false`; (c) partial
   recovery → `PARTIAL`, `resolved:false`; (d) real recovery → `EVERY_FIELD_BACK`,
   `resolved:true`. Pure functions, no API, no credit. Name the tests as sentences.
2. **README section** under the self-healing question: *"What happens when the heal
   itself lies"* — four short paragraphs walking those four cases, each ending with
   the command a judge can run. Explicitly state the design difference: *we do not
   gate the approve; we verify from reality and refuse to close* — and why that is
   honest for an unattended system (a gate needs a human taste for edge cases; a
   ledger does not).
3. One line in `SUBMISSION.md`'s requirement-4 block pointing at the section.

Done when: the four tests pass and read as prose; the README section exists with
runnable commands; nothing in `scripts/` changed behaviour.

### A2 · The evidence report — matching their artifact, honestly *(same agent, ~1.5h)*

Gatekeeper ships "Proof-of-Recovery" with SHA-256 digests; DriftWatch fingerprints
payloads. We hold more evidence than either — committed probe payloads, per-field
before/after, four stage timestamps — but a judge must open five files to see it.

Build `tools/evidence-report.js` (node, zero deps, ≤250 lines):
- input: incident id (default: all three);
- output: a terminal report per incident — collector id **before → after (identical)**,
  stage timeline with computed durations, per-field table (state before → after, value
  before → after), verification verdict, `resolved`, and **SHA-256 digests** of (a) the
  incident record as committed, (b) the relevant probe/after payload files in
  `docs/evidence/` where they exist for that incident;
- a `--json` flag for machine reading.

Then: wire a mention into README ("one command prints the full evidence trail") and
SUBMISSION; add `evidence_report` as a **seventh MCP read tool** wrapping the same
module (registry entry + tool + tests, following `mcp/read-tools.js` patterns).
Tests: digest stability against fixture files, duration math, unchanged-id assertion
fails loudly if ever violated.

Done when: `node tools/evidence-report.js inc_001` prints the trail; the MCP tool
returns it over stdio; tests cover both; README/SUBMISSION point at it.

### A3 · The unattended record, made countable *(lead, ~20min)*

sentinel-scrape-verse wins optics with a 25-entry log. Our record is denser and
invisible. README gains a short block — *"Count the unattended record yourself"* —
with three verbatim commands and their current outputs:
`git log --author="thwip watch" --oneline | wc -l` (bot commits),
`node tools/numbers-audit.js` (scans/rows/incidents recomputed from JSON),
and the GitHub commits-page link filtered by author. Add the same three lines to
SUBMISSION's judge-path section. No new code.

### A4 · MCP sharpening *(same agent as A1/A2, ~40min)*

Not chasing 92 tools — stating why six-to-eight beats a fork:
1. Add `numbers_audit` as the **eighth read tool** (wraps `tools/numbers-audit.js`
   truth — "every number the console shows, recomputed from the committed JSON").
2. Refresh `mcp/README.md`: a real transcript of the whole judge loop
   (initialize → fleet_status → incident_log → heal_receipt → evidence_report →
   numbers_audit), plus one paragraph on the design: spec-direct stdio JSON-RPC,
   zero dependencies, tools that print evidence rather than status, two
   credit-spending tools that say so in their own descriptions.
3. Tests for both new tools.

Done when: 8 tools listed by `tools/list`, transcript in mcp/README is real output,
tests green.

---

## Front B — the demo interaction: answer the button with a button

### B1 · Break-it-yourself in ten seconds *(agent, ~1.5h)*

Patchwright's threat is a judge pressing a button and watching a repair. We have had
that button since the prototype — the `?mock=1` demobar (BREAK BODEGA · RE-WEAVE ·
TOGGLE UNWATCHED · RESET) — styled as an apology and findable by nobody.

1. **Restyle the demobar as a feature**: comic vocabulary (paper, ink border, hard
   shadow), renamed **CHAOS LAB**, one line of copy: *"Break it yourself. The fleet
   below is synthetic; the mechanics are the real code."* Keep it `?mock=1`-only.
2. **Walk the loop and fix friction**: BREAK → symbiote climbs + character reacts +
   speech bubble; the broken panel must be **scratchable** (it is — verify after
   restyle); RE-WEAVE → THWIP burst + receipt renders; RESET clean. Reduced-motion
   pass. Console clean.
3. **Discoverability**: one link from the live page — a small `CHAOS LAB →` tag in
   the ad's coupon area (it already sells the repo; "try the break" belongs there),
   plus a README subsection *"Break it yourself (ten seconds, no install)"* with the
   exact URL and the three clicks.
4. Screenshot the loop at 1440/375 for the README and the video.

Done when: a stranger given only the README finds and completes BREAK→RE-WEAVE→receipt
in under a minute; capture/print/intro unaffected; tests+lint green.

### B2 · Motion in the README *(lead, ~45min, ffmpeg confirmed present)*

0xConsole's best-in-field README is screenshots + GIF. Ours is one static hero.
Record the scratch with Playwright video (script the drag on a mock-broken panel),
`ffmpeg` → a ≤3MB looping GIF (`assets/scratch.gif`), placed directly under the hero
with alt text. If the GIF exceeds 3MB at acceptable quality, ship a 6-frame filmstrip
PNG instead — a README that loads slow loses the judge it was for.

Done when: the gesture is visible in the README on GitHub at readable quality.

---

## Front C — Clean Code: make it legible in ninety seconds

### C1 · "Why this code is clean", stated *(lead, ~30min)*

The judges' phrase is "a repo a stranger could pick up on Monday". The stranger needs
the numbers and the reasons in one place, near the top of the Layout section:
- the counts as of today: 1,022 tests / 55 test files / zero dependencies **including
  dev** / 53 JS + 46 CSS files, every one ≤250 lines / zero comments as policy (names
  carry meaning) / ESLint + full suite in CI on every push;
- four decisions with one-line whys: verification from fresh runs; append-only atomic
  data writes; the vm-context test harness that lets plain browser globals be tested
  in node with no bundler; the grid reconciler keyed by collector id;
- the one-command self-check: `npm test && npx eslint . && node tools/numbers-audit.js`.

Done when: the section reads in under a minute and every number in it is current.

---

## Decisions that are the user's, not any agent's

- **D1 · T-12, the live break (~50-60 credits).** Commit the broken variant of our own
  demo page; the cron detects, diagnoses, heals, verifies and closes a **fourth
  incident with zero human phases** — the strongest possible Bright Data artifact, and
  it directly outguns both Gatekeeper's staged incident and sentinel's log volume.
  Cost: credits + an honest hour of BODEGA showing CRITICAL on the live page + it
  should start **early** so it closes before the video is recorded. Prepared in
  `docs/HANDOFF.md`; three commands. **Recommended, if the credit budget allows.**
- **D2 · npm-publish the MCP server** (`thwip-mcp`). Cheap counter to MCP-Studio's
  "published to npm" line; needs the user's npm account. Optional.
- **D3 · The video.** Deferred at the user's word — but note every rival at the top of
  the Bright Data category ships one, the form requires it, and after B1/B2 the script
  in `VIDEO-SCRIPT.md` (with §6b, the scratch) is fully current.

## Orchestration for today

Two agents, disjoint lanes, lead merges:

| Slot | Who | What |
|---|---|---|
| 1 | Agent A | A1 → A2 → A4 (tests, evidence tool, MCP) — all `test/`, `tools/`, `mcp/`, README sections handed to lead as text |
| 2 | Agent B | B1 (demobar/CHAOS LAB, ad link, screenshots) — `web/` only |
| lead | throughout | A3, C1, B2 (GIF), merges, safe-window pushes, and the running gate: tests+lint after every merge |

Order rationale: A1/A3/C1 are pure narrative over existing truth — highest judge-value
per hour and zero risk — so they land first even if the day collapses. A2/A4 second.
B1/B2 third. D1 should be decided **now** because its clock (cron cadence + honest
CRITICAL hour) runs in wall time, not work time.

**Done-when for the whole day:** a judge following only the README can, inside ten
minutes — see the fleet live; break a synthetic one and watch it re-woven; print one
command's evidence trail with digests; count the unattended commits; run 1,022 tests
offline — and at no point meet a claim the repository cannot prove.

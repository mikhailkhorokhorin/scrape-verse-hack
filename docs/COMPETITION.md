# Competitive position

Second reconnaissance run 2026-08-22, morning. 131 repositories checked via the GitHub
API (exact sizes, commit counts, full READMEs, git trees), 93 of them hackathon-era.
**Only 18 contain a real collector id**, and only three entries besides ours pair a
collector, a test suite and a working live URL. The first recon's "the real field is
three projects" undercounted: it is about four serious ones and eight real-but-narrow.

## The four that matter, and where we stand against each

### rycerzes/brightdata-gatekeeper — the Bright Data + Clean Code threat

An approval layer over Bright Data's own heal: golden rows recorded while healthy, a
proposed fix judged against them, bad heals **rejected**. 14 test files, an MCP server,
two live URLs, a generated demo video. Their documented incident — a heal that silently
nulled a field, which `--auto-approve` would have shipped — is the strongest single
artifact in the field, and it is aimed at the flag we use.

Our answer is already on disk: `scripts/verify.js` computes the receipt from a fresh
run **after** the heal, never from the heal's own report, and `inc_003` proves we keep
even a wrong diagnosis. They prevent; we verify and record — and unlike them, our cron
commits the evidence unattended every 30 minutes, and two of our three breaks happened
on sites nobody controls. They beat us on the elegance of the gate idea and on having a
video. We beat them on autonomy, on scale of tests (1,022 vs 14 files), on wild
incidents, and on every pixel of UI.

### Dinesh210805/brightdata-mcp-studio — npm-published breadth

A fork of Bright Data's official MCP server adding the Scraper Studio lifecycle it
lacks: 92 tools, 13 test files, three CI workflows, a real collector. Beats us on MCP
breadth and on the "we fixed Bright Data's own gap" pitch. It is a tool, not a product:
no UI, no recorded incident history, no fleet. Our six tools are zero-dependency and
sit inside a product a judge can watch.

### aThoughtfulSoul/patchwright — the demo-interaction threat

A live break room: press a button, watch a repair land in 10-25 seconds. That gesture
out-demos any replay. But the healing is **Gemini, not Bright Data heal** — a miss on
the heaviest criterion — a human approves every patch, and the README names a different
hackathon. Watch it, do not fear it.

### instax-dutta/scrapeverse-hakathon — the breadth product

Three collectors, heal-on-null-rate keeping the collector id, 7 tests including
`heal.test.ts`, a live fixture, arbitrage + alerts on top. More features than us;
every break staged on their own fixture, a standard Next dashboard, and two orders of
magnitude fewer tests.

## Real but narrower

- **allenasat044-prog/sentinel-scrape-verse** — the only other entry with bot commits
  (actions-user, ~6h) and a 25-entry healing log including an honest 409 recovery.
  Volume optics beat our three incidents; everything else — cadence (30min vs 6h),
  per-field receipts, tests (1,022 vs 0), UI — is ours.
- **vikramlingam/driftwatch** — yesterday's Suit-Up favourite, deflated on inspection:
  real collector and a Studio export, neon HUD — but **no live URL**, one test file, no
  cron, and the last day was README edits. The threat was concentrated in UI polish and
  they stopped building.
- **SmartLemur/visa-watch** — 42 Vitest tests (best after ours) and the sharpest thesis
  in the field: telling a policy change from a scraper break. Dev-only, human-approved
  healing, three commits.
- **sreecharan-desu/sentinel** — four collectors, a 6-hourly cron uploading artifacts,
  a live but generic Vercel page.
- **harisawan27/scrape_verse** — 15 test files + CI, weak story.
- **inusha-thathsara/ScrapeVerse-Pulse** — three collectors, in-place heal, 11 tests,
  no deploy.
- **siiddhantt/baahar** — still the best product story, still manual healing, and no
  commits in the last day.
- **Kanakpaswan27/ChaosVerse-Suite** — live, polished, real DCA trigger; the REPAIR
  stage is UI simulation and there are no tests.
- **0xConsole/scrape-verse-agent** — best static README presentation; data-quality
  analysis, no healing, no collector.

The rest: honest partials (heal works only on localhost; "healing" that is fallback
selectors; a live worker stuck on loading), 61 empty shells, 20 unreadable.

## Category verdicts, updated

- **Best Use of Bright Data** — the contested one. Gatekeeper and MCP-Studio are real.
  Nobody else combines wild-site breaks, an autonomous overnight incident with its
  false diagnosis preserved, and per-field before/after receipts.
- **Best UI** — the field has six live deployments and **zero design directions**. Ours
  is the strongest claim we hold.
- **Best Clean Code** — 1,022 tests, zero dependencies including dev. The nearest
  competitor has 15 test files. Not catchable in a day.
- **Best LinkedIn Post** — invisible on GitHub; effectively uncontested from here.

**The one visible gap on our side is the demo video.** Gatekeeper and DriftWatch have
one; the submission form requires one; ours is scripted but not recorded.

---

## First reconnaissance (2026-08-21), kept as the record


Reconnaissance run 2026-08-21. Every claim below was checked against the actual
repositories, not inferred from titles.

## The field

5,000+ registered developers. Most public repositories tagged for this hackathon are
empty or a single commit. Three are real.

### DriftWatch — `vikramlingam/driftwatch` · the one to watch

TypeScript + FastAPI + Next.js. Pushed within the hour. **"API Drift & Breaking Change
Intelligence Radar"** — monitors 29 documentation feeds for upstream API changes, scans
your codebase for exposure, and opens GitHub PRs with remediation via OpenRouter LLMs.

| Where it beats us | Where we beat it |
|---|---|
| Impact is broader — API drift affects every developer | It has four subsystems; ours does one thing completely |
| Auto-generates fix PRs, a full closed loop into the user's code | Healing is Bright Data's, not OpenRouter's — the hackathon scores *use of Scraper Studio* |
| "Proof-of-Recovery Evidence Report" with SHA-256 payload fingerprints | Our incidents are autonomous and recorded, not reported |
| Neon radar HUD, holographic shimmer — genuinely distinctive | Comic-page art direction is more unusual than another neon HUD |

**They are the direct threat in Suit-Up.** Radar sweep, telemetry terminal, live HUD.
Competent and well-executed.

### Baahar — `siiddhantt/baahar` · strongest product story

Go + React + Postgres, live at baahar.vercel.app. *"One place for the city plans hiding
across official calendars."* Aggregates city events from official sources.

Impact is the clearest of anyone's — a real user with a real need. But their self-healing
is **manual**: "engineers review and repair the specific worker." On the criterion that
carries the most weight for this hackathon, they are weaker than us, not stronger.

Worth stealing: **last-known-good fallback** — a failed run keeps serving the last
verified data instead of an empty feed.

### Anansi — `mdowis/anansi` · 110 stars, and not a competitor

Created 2026-05-14, last pushed 2026-07-19 — **before the hackathon started**. The stars
predate the event. If submitted it would be strong, but it is not hackathon work and most
rules exclude it. Do not benchmark against its star count.

### Everyone else

`sreecharan-desu/sentinel` is one commit old. The remaining two dozen `scrape-verse`
repositories are empty shells. The real field is three projects, not five thousand.

---

## Where we actually stand, category by category

### Spider-Sense (Best Code) — **our most winnable prize, and we are not showing it**

528 tests. Zero runtime dependencies. ESLint enforced in CI. A 250-line cap per file.
Zero comments, names carrying the meaning. Atomic append-only writes that raise rather
than silently replacing a corrupt file.

On a hackathon where most submissions are unreviewed vibecode, this is rare enough to win
on its own. DriftWatch has "an automated pytest suite" and no count. Baahar mentions none.

**The problem: none of it is visible.** A judge skimming the README sees a product, not an
engineering standard. This is the cheapest prize on the board and it costs documentation,
not code.

### Suit-Up (Best UI) — contested, and we are ahead

DriftWatch is the only real rival and it went neon-HUD — the same direction a dozen other
monitoring tools take. Our comic page is genuinely unusual, and the symbiote encodes data
rather than decorating it: the black covers exactly what was lost.

We also have something they do not: **the legend**. Their radar has to be interpreted.
Ours explains itself on the page.

### Web-Slinger (Grand) — the hard one

Judged across all six criteria equally. Our weakest is impact: scraper observability is
narrower than API drift or city events.

Our counterweight is that **we are the only one whose healing is autonomous end to end**.
Three real incidents, cron-opened, cron-closed, unchanged collector IDs. DriftWatch heals
with OpenRouter — not Scraper Studio. Baahar heals by hand. On *reliability and
self-healing* plus *use of Scraper Studio*, two of six criteria, we are alone.

### Daily Bugle (LinkedIn) — free, and unclaimed

Draft is written. Ten minutes. Nobody competes for this.

---

## What to take from them

**SHA-256 payload fingerprints (from DriftWatch).** Hash the extracted payload before and
after a heal, store both on the incident. Turns "we healed it" into something a judge can
verify rather than believe. Cheap: the payloads are already in `data/`.

**Last-known-good fallback (from Baahar).** When a scan fails at transport, keep serving
the last verified rows and label them with their age. Today an empty scan is simply
absent; showing stale-but-honest data is more useful than a gap, and it demonstrates a
product decision rather than a missing feature.

**Do not take:** the auto-PR loop. It is a second product, it belongs to the Grand track we
already chose not to chase, and it is two days of work we do not have.

---

## The strategic call

**Do not rewrite anything.** The instinct to rebuild for "best architecture" is the single
most dangerous move available right now. We have a working system with real autonomous
incidents and 528 green tests; a competitor with a half-finished rewrite loses to a
competitor with a finished product every time. Two days out, the value of shipped work is
higher than the value of better work.

Priorities, in order:

1. **T-12 — the autonomous break.** The one missing artifact. A fourth incident where no
   phase is human-touched is the proof that separates us from everyone healing by hand
2. **Make the engineering visible.** Best Code is winnable on documentation alone
3. **Payload fingerprints.** Small, and it beats DriftWatch at their own evidence claim
4. **Last-known-good fallback.** Only if the first three are done

Credit budget: ~3,500 of 5,000 remain. T-12 costs 50-60. Nothing else here spends any.

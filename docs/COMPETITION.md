# Competitive position

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

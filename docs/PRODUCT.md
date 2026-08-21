# THWIP — Product Definition

> Naming note: "THWIP" is comic onomatopoeia — the sound of a web being fired.
> It is not a Marvel trademark, but we avoid Marvel character names, logos, and
> the words "Spider-Man", "Web-Slinger", and "Spider-Sense" (the latter two are
> hackathon prize track names). If the name needs to change, `ARACHNE` is the
> fallback.

## One-liner

A watch console for web scrapers that shows you the moment they break — and repairs
them before you have to care.

## The problem

Scrapers fail silently. A target site ships a layout change on Tuesday, the selector
stops matching, and the scraper keeps running and keeps reporting success. It returns
rows. The rows just have holes in them.

Nobody notices, because nothing errored. The pipeline is green. The dashboard downstream
is quietly wrong. You find out days later, from a customer.

The failure mode isn't a crash. It's **decay**. And decay has no alarm.

And there is a second half to it. Scrapers run alone. They run at 3am, on a cron, in a
container nobody opens, against a site nobody is watching. There is no one there to
notice that something changed. The decay is silent *and* unobserved — those are two
different problems, and the second one is why the first one lasts for days.

## The insight

Bright Data's own documentation says that when extraction misses a field, it comes back
as `null` and you should treat it as such. That single line is the whole product:

**Fill rate is a health signal, and nobody watches it.**

If you measure, per run, what fraction of expected fields actually came back populated,
you get a continuous 0-100 health score per scraper. Not a binary up/down — a gradient.
You can see a scraper get sick before it dies.

There is a worse case underneath it. A field can come back *populated and wrong* — a
price that parsed as text, a rating outside its range, a title reading `undefined`. That
value passes every null check ever written and flows straight into the pipeline. The
scraper looks healthy. Its behavior has been quietly replaced.

And Scraper Studio can already fix itself given a plain-language description of what
broke. So the loop closes: measure decay, describe the decay, hand the description to
the healer, verify, log it.

## The metaphor

The hackathon is *Into the Scrape-Verse*. We take that literally.

Two threads from that world map onto our failure modes exactly.

**The symbiote.** Something gets inside a host without killing it. The host keeps
walking around looking like itself, and its behavior has been replaced. Nobody watching
from outside can tell. That is precisely what happens to a broken scraper: it keeps
running, keeps returning rows, and the rows are wrong. This is the *primary* metaphor,
because it describes the thing that makes scraper decay dangerous — its invisibility.

**Glitching.** Characters stutter and separate into color plates when they are in a
universe that isn't theirs. That is the acute moment of breakage, the instant a site
changes underneath a Spider. This is the *secondary* metaphor — a transient event, not a
condition.

They operate on different timescales and do not compete: the symbiote is what a Spider
*is* right now, the glitch is what just *happened* to it.

**And loneliness.** Every Spider works its own universe by itself, in the dark. If
nobody is watching, nothing is wrong until it is far too late. The console is the
answer to that, not to the breakage — the breakage was always going to happen. What
this product changes is that somebody is finally looking.

| System concept | Product term | Visual language |
|---|---|---|
| Scraper / collector | **Spider** | A comic panel with a character card |
| Target site | **Universe** | The panel's world, shown by domain |
| Field fill rate 0-100 | **Integrity** | Health bar across the panel base |
| Extraction degradation | **Glitch** | Chromatic aberration, shake, desaturation |
| An individual dead field | **Anomaly** | Struck-through field chip |
| Extraction returning wrong values | **Infection** | Black substance spreading up the panel |
| A field that returned a wrong value | **Infected field** | Pulsing violet chip |
| Nobody has scanned it recently | **Unwatched** | Panel dims, loses its shadow, sinks into the dark |
| `bdata scraper heal` | **Re-weave** | Web-stitching animation, staged progress |
| Recovery | **Snap-back** | Symbiote retracts, `PURGE!`, color floods in |

Every term maps to something a judge can see on screen. That is the point: the metaphor
is not decoration, it is the information design.

## Who it's for

A data or growth team running 10-100 scrapers against long-tail sources that no vendor
has a pre-built collector for. They are not a platform team. They have no observability
for this, because scraper health isn't a metric any APM tool models.

For the hackathon, this persona exists to make the pitch legible in one sentence. We
are not building for them beyond the demo — the Suit-Up track scores the console, not
the go-to-market.

## Screens

Three. No more — one developer, three days.

### 1. THE WATCH (main)

The landing view. Everything a judge needs to understand the product in five seconds.

- **Masthead** — THWIP wordmark, global integrity average, last scan timestamp, live pulse
- **Spider grid** — one comic panel per collector. Each shows: codename, universe domain,
  Integrity bar, 24h sparkline, status badge, anomaly count
- **Incident feed** — vertical strip of comic panels, newest first. Each incident is one
  panel: what broke, when, how long the re-weave took, before/after Integrity

The grid is the hero shot. It is what goes in the video thumbnail and the README header
image. It must be right.

### 2. SPIDER DETAIL

Opens when a panel is clicked. Turns the toy into a diagnostic tool.

- Per-field breakdown — every expected field, live or dead, with fill rate over time.
  This is the single feature that stops a judge from reading the project as a gimmick
- Integrity chart over full history
- Last raw JSON sample, syntax-highlighted, with `null`s visually marked
- Collector ID, plainly displayed — this is submission proof, put it on screen
- `RE-WEAVE` action button

### 3. INCIDENT REPLAY

Plays back one real incident on its timeline: `DETECTED → DIAGNOSED → REWEAVING → VERIFIED`.

This exists for a hard reason. `bdata scraper heal` takes up to 15 minutes, so a live
break-to-recovery cannot be filmed in real time. Replay lets the demo run on genuine
recorded data at a watchable pace, with no editing tricks and nothing staged.

The constraint produced a real feature: post-incident review is what an ops product
should have anyway.

## Spider states

The state machine is the animation spec. Five states, each visually distinct at a glance.

| State | Integrity | Read |
|---|---|---|
| `HEALTHY` | >= 90 | Full color, calm idle breathing, lime bar |
| `DEGRADED` | 60-89 | Mild chromatic offset, amber bar, occasional flicker |
| `CRITICAL` | < 60 | Heavy glitch, desaturated panel, red bar, shake |
| `REWEAVING` | n/a | Cyan pulse, staged progress, web-stitch motion |
| `RECOVERED` | back to >= 90 | Symbiote retracts, color floods back, `THWIP!`, bar overshoots then settles |
| `UNWATCHED` | any | Last scan > 3h old. Dimmed, desaturated, no shadow — receded into the dark |

Symbiote spread is continuous across all of these: it covers `(100 - Integrity)%` of the
panel at all times. It is the one signal readable at any zoom level, with no text and no
color vision required — how much of the panel is black.

A judge scrubbing the video without sound must be able to tell these apart. If two
states look similar at 50% scale, the design has failed.

## Demo script (target: 2-3 minutes)

1. **Cold open on THE WATCH.** Three Spiders, all healthy, real 48h history moving on the
   sparklines. Say what the product is in one sentence.
2. **The problem, stated over the live grid.** Scrapers don't crash, they decay, and
   nothing alarms on decay.
3. **Break the controlled universe.** Edit the demo page live — rename the price class,
   move an element. This is our own page, which we say out loud.
4. **Next scan lands.** The panel glitches once, then the symbiote starts climbing it as
   Integrity drops, and an incident opens in the feed. This is the money shot — hold on
   it. Note out loud that the scraper did not error: it returned rows, and the rows are
   wrong.
5. **Point at an infected field.** Not null — populated, and wrong. It would have passed
   every check downstream.
6. **Open Spider Detail.** Show exactly which fields died. Show the Collector ID on screen.
7. **Cut to Incident Replay** of a real earlier incident. Show the full re-weave timeline
   and the before/after. State plainly that healing takes up to 15 minutes and that this
   is recorded, not accelerated.
8. **Back to THE WATCH.** Symbiote gone, all clean. Close on the grid.

Rehearse the break twice before recording. Have `data/` backed up so a failed take is
recoverable.

## Explicitly out of scope

Cutting these is a decision, not an oversight. One developer, three days.

- No auth, no accounts, no multi-tenant
- No database — two JSON files
- No API server — the console reads static JSON
- No GitHub PR bot (strong for the Grand track, irrelevant to Suit-Up)
- No Slack or Discord alerting
- No mobile-native anything (the console must be responsive, that is all)
- No more than 3 collectors
- No predictive or pre-emptive healing

If a task is not in `TASKS.md`, it is not in the build.

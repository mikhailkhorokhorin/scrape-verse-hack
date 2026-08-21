# UI ideas — Suit-Up (Best UI)

Every idea has a stable id. Reference them by id in commits and prompts.

Status: **ACCEPTED** = going into the build · **OPEN** = candidate · **REJECTED** = decided
against, with a reason, so it stops resurfacing.

Cost is honest. A "small" that turns out to be a day gets re-labelled, not quietly
attempted.

---

## The problem all of this serves

**The first screen is all green, and the strongest thing in the design lives below the
fold.**

Three Spiders at 100%. No symbiote, no glitch, no infected chip. A judge decides in five
seconds and those five seconds show a healthy grid plus a legend describing states that
are not on screen.

The states are not unreachable — `?mock=1` works and is honestly labelled, Incident Replay
runs the real `inc_003`, and the feed holds three real incidents. They are just not where
the judge looks.

---

## ACCEPTED

### UI-01 · Opening sequence
On first load the console demonstrates its own mechanic on real `inc_003` data, ~6s, then
settles into the live present.

`0.0s` healthy · `0.8s` `SNAP!`, integrity drops · `1.6s` symbiote climbs, `CRACK!` ·
**`2.6s` hold** · `3.4s` `WEAVE...` · `4.6s` `PURGE!` · `5.4s` `THWIP!` · `6.0s` live.

The hold matters more than the motion around it. Infection slow, removal violent — that
asymmetry is the emotional argument of the product.

**Playback:** `sessionStorage`, once per tab. `REPLAY INTRO` button in the masthead.
`?intro=1` forces it. `prefers-reduced-motion` skips to the end state.

*(`cmd+shift+R` clears the resource cache but not Web Storage, and JS cannot distinguish a
hard refresh — `navigation.type` reads `"reload"` for both. The button covers that need.)*

**Constraints:** real data only · skippable at any point · never blocks interaction ·
always ends in exactly the state a plain load produces.

**Cost:** medium.

### UI-02 · Every incident is an issue
An incident is not a log entry, it is an **issue of a comic**. `inc_004` becomes
`ISSUE #4`. The feed becomes a shelf of covers.

```
        ISSUE #3
        BODEGA
   "THE SHOP SHIPS A REDESIGN"
      THROTTLED · 07:48Z
        100% → 0%
```

Not decoration: the issue number *is* the incident number, the subtitle *is* the strain
gloss we already write, the cover *is* the panel at its worst moment. Every element is a
field already stored.

Also fixes a real weakness — the incident feed is the least designed part of the console
and holds the best evidence we have.

**Cost:** medium.

---

## OPEN — ranked by impact per hour

### UI-03 · Live polling
Re-read `data/*.json` every 30s. A scan landing while the judge is on the page moves the
console on its own. Turns a screenshot into an instrument. **Cost:** small.

### UI-04 · Evidence line in the masthead
`3 collectors · 4 incidents healed · 698 rows · 528 tests · c_a628…`

The first screen currently carries **no proof at all** — no collector id, no incident
count, no test count. Cheapest credibility available. **Cost:** trivial.

### UI-05 · Sparkline hover
Hover a point, get that scan's timestamp and integrity. The charts are decorative right
now; this makes them readable. **Cost:** trivial.

### UI-06 · Panel numbers
A small `1` `2` `3` in the corner of each Spider panel, in ink. Real comic panels are
numbered. Stops the page reading as a CSS grid. **Cost:** trivial.

### UI-07 · Speech bubbles on state change
A tailed bubble, Bangers, one line: `"price is gone."` `"I'm back."`

The console narrates in labels; a comic narrates in voice. The most characteristic comic
device we are not using. One at a time, only on transition, never idle — it goes cutesy
fast. **Cost:** small.

### UI-08 · Caption-box section headers
`MEANWHILE — 698 ROWS SHIPPED CLEAN` instead of `THE HAUL`. Comics move between scenes
with a caption box; the temporal phrase comes from real data. **Cost:** small.

### UI-09 · Phone pass
Nobody has checked what the pulse, the heatmap or THE HAUL do at 375px. A judge may well
open the URL on a phone. Cheap to verify, embarrassing to lose on. **Cost:** small.

### UI-10 · Diptych above the grid
A healthy panel and an infected one side by side, both from real history, one line of
caption. Teaches the visual language in two seconds without motion. Partly redundant with
UI-01 — worth it only if UI-01 slips. **Cost:** small.

### UI-11 · Keyboard path
Tab through panels, Enter opens the sheet, Escape closes, arrows step the replay. Also the
accessible path, so it scores twice. **Cost:** small.

### UI-12 · Deep link to an incident
`#inc_003` opens with that replay ready. The README and the video both want to point at
one specific case. Pairs naturally with UI-02. **Cost:** small.

### UI-13 · Print artefacts
One-pixel plate misregistration on borders, faint wear at panel corners. Sub-perceptual
alone; together it is the difference between comic-styled and printed. Overdone, it reads
as a rendering bug. **Cost:** small.

### UI-14 · History scrubber
A drag handle spanning all recorded time. Pull back, the whole console renders that
moment; release, it snaps to now. Makes 48 hours explorable and reaches every past state.
**Cost:** medium.

### UI-15 · Side-by-side Spiders
Compare two collectors on one axis — whose fields fail more, who recovers faster.
**Cost:** medium.

### UI-16 · The page reacts to fleet health
The ground shifts as fleet integrity drops, so the whole page carries the state rather
than just the panels. **Cost:** medium.

### UI-17 · Print / PDF incident report
A one-page report per incident. Probably nobody prints it; it is a distinctive artifact.
**Cost:** medium.

---

## REJECTED

| Idea | Why |
|---|---|
| Sound design | Autoplay is blocked, and audio during judging hurts more than it helps |
| Threads between infected Spiders | Would look good and would be a lie — the collectors are unrelated, no correlation exists |
| Dark/light toggle | The design commits to one world. A light mode weakens it rather than broadening it |
| Registration / accounts to gate the intro | Needs a backend, and puts a form between the judge and the product |
| Rewriting the console | Two days out, finished beats better |

---

## If it comes to cutting

Ship in this order: **UI-04, UI-05, UI-06** first — all trivial, all visible. Then
**UI-01**, then **UI-02**. Everything below UI-09 is optional.

Two finished ideas beat five half-finished ones. A half-done animation reads as a bug, not
as a missing feature.

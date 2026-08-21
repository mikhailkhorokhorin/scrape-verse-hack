# UI ideas — Suit-Up (Best UI)

Every idea has a stable id. Reference them by id in commits and prompts. Ids are never
reused: a merged idea keeps its number and points at where it went.

This file is the argument: what is in, what is out, and why. **The working briefs live one
per file in `docs/ideas/`** — mechanism, risks and a done-when checklist for each idea,
indexed with paths in `docs/TASKS.md`. Decide here, build from there.

Status: **ACCEPTED** = going into the build · **OPEN** = candidate · **MERGED** = folded
into another id · **REJECTED** = decided against, with a reason, so it stops resurfacing.

Cost is honest. A "small" that turns out to be a day gets re-labelled, not quietly
attempted. **Every cost below has been checked against the code that would have to
change** — see the audit at the bottom for what that check moved.

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

One fact from the code sharpens all of this: a healthy panel renders **compact**, and the
compact body has no field chips at all — only sparkline, bar and readout. So the first
screen is not just green, it is the *emptiest* version of the panel we ship. That is a
problem and an opportunity: the space for a character is already there, on exactly the
panels a judge sees first.

## The rule everything here is measured against

**A drawing that is not driven by a field in `history.json` is decoration, and decoration
loses this track.**

The rival submission in Suit-Up is a neon radar HUD. Prettier motion will not beat it;
motion that *is* the data will. Every animation below names the field it reads. If an idea
cannot name one, it belongs in the print-artefact bucket (UI-13), where it is allowed to be
purely typographic and claims nothing.

---

## THE CAST — the headline work

The console currently draws states. It does not draw *characters*. A comic without a cast
is a page of diagrams with good typography.

**All art is original and authored as inline SVG in this repository.** No Marvel likeness,
no stock asset, no image file. Three reasons, in order of how much they matter:

1. It is stronger. A borrowed Spider-Man is someone else's design landing in a judge's
   memory as fan art. An original arachnid that *is* the telemetry is our design.
2. Inline SVG inherits the tokens — `--ink`, `--symbiote`, `--critical` — so a character
   recolours with the state instead of needing a second asset per state, takes the halftone
   overlay like every other surface, and animates in CSS with no build step.
3. Trademarked character art on a public hackathon repository is a risk with no upside.

The genre archetypes are the point, not the trademarks: an arachnid, a mask, a black
substance that takes you over. The project already owns its own vocabulary for all three —
Spiders, Integrity, the symbiote.

### UI-18 · The cast · **ACCEPTED**

Each collector gets a character. Not a mascot beside the data — the character *is* the
readout.

**UI-18a · The rig.** One SVG spider, authored once, parameterised: body, mask plate, eyes,
legs. Ink line art at `--ink` weight 3, flat fills, no gradient. Three silhouettes so the
fleet is a cast and not one sprite repeated: BODEGA squat and heavy, ATLAS long-limbed,
KESTREL angular and fast. Distinguished by leg curve, mask marking and accent plate, not by
hue alone — the health colours are semantic and cannot be spent on identity.

Lives in its own module (`web/js/rig.js`), because `panel.js` is already 118 lines of
string building and the repository holds a 250-line cap.
*Cost: medium. This is the one thing on the list worth a whole day.*

**UI-18b · Legs are fields.** Each expected field owns a **mirrored pair of legs**, in
`sp.fieldOrder` order — the panel already carries that array, so the mapping has a stable
source and is not re-derived per render.

Four fields, four pairs, eight legs. **ATLAS watches five fields**, and the fifth pair are
the **pedipalps** — the short front pair a real spider has anyway. That keeps every
character an eight-legged spider (a ten-legged one reads as a drawing mistake, not as a
signal) while still making ATLAS visibly a different creature that does more work.

| Field state | Leg |
|---|---|
| `LIVE` | planted, load-bearing, slow breathe |
| `INFECTED` | still planted, twitching off-rhythm at the infected-chip 2s cadence |
| `DEAD` | limp — the joint gives, the leg hangs, ink drains to `--symbiote` |

A Spider at 50% integrity is standing on half its legs and it *looks* like it. This is the
single strongest idea in the file: the mascot is a bar chart nobody has to be taught to
read.

**Placement, decided now so it cannot collide later.** On a compact (healthy) panel the rig
is the body of the panel — there is nothing else competing for that space. On a big
(degraded/critical) panel the panel is already full: integrity readout, sparkline, note,
bar, chips, last scan, symbiote. There the rig sits **behind** the content as an ink
watermark, below `.symbiote` in z-order. **The chips stay** — they carry the
expected-vs-received reveal from T-36, which is real evidence, and the legs are the
silhouette of the same truth, not a replacement for it.
*Cost: medium, and only after 18a.*

**UI-18c · Eyes are integrity.** Eight eyes, lit count from the integrity band, dimmed with
`--unwatched` rather than removed so the socket still reads. `HEALTHY` all lit;
`DEGRADED` the outer pairs go dark; `CRITICAL` one eye left. `UNWATCHED` (no scan in 3h)
closes them all — the Spider is asleep, which is exactly what that state means. Blink at
randomised intervals per panel; three characters blinking in unison reads as a loop and
kills the illusion instantly. *Cost: small.*

**UI-18d · The symbiote gets a face.** Today the black is a full-panel div masked by a
`linear-gradient(to top)` at `--spread`, displaced by `filter: url(#symbiote-turbulence)`.
That matters: teeth cannot be cut into that gradient without replacing the whole mask.

Do it as two additions instead, both cheap and both riding variables that already exist:

- **Teeth** — a thin strip pinned at `bottom: calc(var(--spread) * 100%)`, filled
  `--symbiote`, shaped by a repeating `clip-path` zigzag, inside `.symbiote` so it inherits
  the same turbulence displacement and reads as one substance.
- **Eyes** — an absolutely positioned SVG pair inside the black, revealed on the panel's
  existing `data-drowned="1"` attribute, which `panel.js` already sets above
  `PAPER_SPREAD`. No new threshold, no new maths, no CSS variable comparison (which CSS
  cannot do anyway).

Infection currently reads as a fill level. This makes it read as something *arriving*.
*Cost: small, now that the mechanism is known. Watch the turbulence filter — the teeth
must sit inside the filtered layer or the substance splits into two materials.*

**UI-18e · Idle life.** Healthy panels already breathe. Characters need more: a leg
re-plants every 6-11s, the body shifts weight, the mask plate catches a highlight. All
periods prime-ish and per-panel offset so nothing syncs. A still cast reads as a
screenshot; a synchronised cast reads as a GIF. *Cost: small.*

**UI-18f · The scan lands on screen.** When polling picks up a new record, that Spider
*reacts*: a step, a head turn toward the new sparkline point, `THWIP!` only if the record
carries `after_heal`. `app.js` already builds a change signature from
`lastRun.ts | lastInc.id | lastInc.closed_at`, so "something landed" is detectable today —
this is a hook into an existing line, not new plumbing. *Cost: small.*

**Cut order inside UI-18, if the day runs out:** 18a → 18b → 18c → 18e → 18d → 18f. A rig
with dead legs and no eyes still wins. Eyes without a rig are nothing.

### UI-19 · The crawler · **OPEN, re-scoped**

The animal, not the person. One small spider that walks the history and settles on the
newest point, pausing at a scar notch where a past incident sits.

**It cannot be drawn inside the sparkline.** That SVG is `preserveAspectRatio="none"`, so
anything placed in it is stretched by the panel's aspect ratio — a spider in there is a
smear that changes shape per panel width. The crawler has to be an overlay above the chart,
positioned from the same points array `sparkline()` already computes, converted to
percentages. Doable, but it is a positioning layer, not a path animation.

Still characterful, still cheap-ish, no longer free. *Cost: small, after the rig, and only
if UI-18a through UI-18c are all in.*

### UI-20 · Cover character in the masthead · **OPEN, contested space**

One large character drawn from **fleet** state rather than a single collector: standing and
inked when the fleet is clean, half-taken when anything is critical.

The honest problem: the masthead already carries the wordmark, the tagline, four readouts
(fleet integrity, last scan, mean re-weave, watch), the pulse line under it, and UI-04
wants a fifth line in the same block. A cover figure competes with all of it and the
loser will be the evidence line, which is worth more.

Decide the slot before drawing anything: either the figure replaces the tagline block, or
this stays unbuilt. *Cost: medium, and it is the first medium to cut.*

### UI-21 · The character speaks · **OPEN** *(absorbs UI-07)*

A tailed bubble in Bangers, one line, issued **by the character**: `"price is gone."` on a
field going dead, `"I'm back."` on a verified heal, `"...still here."` on a long clean
streak. The symbiote gets the opposite voice — lowercase and calm, which is worse.

**The prerequisite nobody costed:** the console re-renders wholesale, and the only
change-detection that exists is a fleet-level signature string. A line like "price is gone"
needs the **previous per-field state** to diff against the new one — a small module holding
last render's field map. Cheap, but it is a real dependency and it must exist before any
bubble can say anything specific. Without it, the bubbles can only say generic lines, and
generic lines are exactly the cutesy failure mode.

Rules that keep it honest: one bubble on screen at a time, transitions only, never idle,
auto-dismiss under 3s, no bubble during the intro. *Cost: small only after the diff module;
medium counted honestly from today.*

---

## ACCEPTED

### UI-01 · Opening sequence
On first load the console demonstrates its own mechanic on real `inc_003` data, ~6s, then
settles into the live present.

`0.0s` healthy · `0.8s` `SNAP!`, integrity drops · `1.6s` symbiote climbs, `CRACK!` ·
**`2.6s` hold** · `3.4s` `WEAVE...` · `4.6s` `PURGE!` · `5.4s` `THWIP!` · `6.0s` live.

The hold matters more than the motion around it. Infection slow, removal violent — that
asymmetry is the emotional argument of the product.

**With the cast** the sequence stops being a mask animation and becomes a character losing
its legs and getting them back. **But it must not depend on the cast**: build it against
`--spread`, which exists today, and re-time the hold against the leg collapse only if
UI-18a and UI-18b have already landed. An intro that is blocked on a rig is an intro that
does not ship.

**Playback:** `sessionStorage`, once per tab. `REPLAY INTRO` button in the masthead.
`?intro=1` forces it. `prefers-reduced-motion` skips to the end state.

*(`cmd+shift+R` clears the resource cache but not Web Storage, and JS cannot distinguish a
hard refresh — `navigation.type` reads `"reload"` for both. The button covers that need.)*

**Constraints:** real data only · **skippable by any click, key or scroll, not just by a
skip button** · never blocks interaction · always ends in exactly the state a plain load
produces.

**Cost:** medium. **Biggest single unbuilt risk on the list** — it is the only ACCEPTED
item with no part of it already standing.

### UI-02 · Every incident is an issue *(absorbs UI-12 and UI-17)*
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
gloss we already write, the cover *is* the panel at its worst moment — with UI-18, the
character at its worst moment, standing on one leg under the black.

Also fixes a real weakness — the incident feed is the least designed part of the console
and holds the best evidence we have.

**Absorbed:** `#inc_003` deep-links to that issue with its replay ready (was UI-12 — the
README and the video both need to point at one specific case). The cover is also the print
artefact (was UI-17): a `@media print` rule that renders one issue as a page needs no new
layout once the cover exists.

**Cost:** medium.

### UI-04 · Evidence line in the masthead
`3 collectors · 4 incidents healed · 698 rows · 528 tests · c_a628…`

The first screen currently carries **no proof at all** — no collector id, no incident
count, no test count. Cheapest credibility available, and the only idea here that also
scores in Best Code.

**One catch, and it decides how this is built:** collectors, incidents and rows are all
computable in the browser from the committed JSON. **The test count is not** — the browser
cannot run `node:test`. Hard-coding `528` into `config.js` creates a number that silently
goes stale and that a judge can catch by running `npm test`. Have the CI `build` job write
the real count into a small generated `data/meta.json` alongside the commit sha, and read
it like any other data file. Then every number on the first screen is measured rather than
asserted, which is the whole point of the line.

**Cost:** trivial in the browser, plus ~15 minutes in the workflow. **Do it first.**

### UI-10 · Diptych above the grid → **the two characters**
A healthy Spider and a taken one side by side, both from real history, one line of caption
naming the date and the incident so it is unmistakably the past and not the present.

The data is confirmed present: `data/history.json` holds KESTREL at 0%, ATLAS at 90% and
BODEGA at 0% on 21 Aug alongside the 100% runs, so both halves are real records and neither
has to be synthesised.

With the cast it is better than a fallback for UI-01: it is the legend, drawn — one
creature standing and one creature failing, which survives `prefers-reduced-motion`
untouched.

**Cost:** small once UI-18a exists.

---

## OPEN — ranked by impact per hour

### UI-05 · Sparkline hover, and the keyboard path *(absorbs UI-11)*
Hover a point, get that scan's timestamp and integrity. `sparkline()` already computes the
point array, so the hit targets are one `map` over numbers that exist. Same pass adds the
keyboard route — Tab through panels, Enter opens the sheet, Escape closes, arrows step the
replay and step the sparkline point by point. Merged because they are one handler and one
focus model.

Note for whoever builds it: the panel is a `<button>`, so focus already lands somewhere
sane — check what Tab does today before adding tabindex anywhere. **Cost:** small.

### UI-06 · Panel numbers
A small `1` `2` `3` in the corner of each Spider panel, in ink. Real comic panels are
numbered. `panelHTML(sp, idx)` already receives the index, so this is a span and a rule.
**Cost:** trivial.

### UI-03 · Live polling
**Already half-built:** `app.js` polls every 60s with `cache: "no-store"` and a
cache-busting timestamp, and derives a change signature. What is missing is the *visible*
part — a landing scan should animate the new point in and trigger UI-18f, not silently
re-render.

Honest caveat: the fleet sits at 100%, so during judging the most likely landing scan
changes nothing. Design the arrival, not the drama. **Cost:** small.

### UI-08 · Caption-box section headers
`MEANWHILE — 698 ROWS SHIPPED CLEAN` instead of `THE HAUL`. Comics move between scenes with
a caption box; the temporal phrase comes from real data. **Cost:** small.

### UI-09 · Phone pass — **a gate, not a feature**
Nobody has checked what the pulse, the heatmap or THE HAUL do at 375px. A judge may well
open the URL on a phone from a Discord link.

This is also the performance gate for the whole cast. `filter: url(#symbiote-turbulence)`
is the most expensive thing on the page and it is already running on every infected panel
plus the fleet layer; animated legs, blinking eyes and a crawler stack on top. Run this
after the rig lands and again before submitting. An 8-legged character at 375px is either a
strong silhouette or an ink smudge, and it is cheaper to find out early. **Cost:** small.

### UI-13 · Print artefacts
One-pixel plate misregistration on borders, faint wear at panel corners, a dry-brush web in
two page corners. The only bucket allowed to be pure decoration, because it asserts nothing
about the data — it is the paper, not the ink. Overdone, it reads as a rendering bug.
**Cost:** small.

### UI-23 · The cast in the detail sheet
Spider Detail already lists per-field tracks. Put that Spider's character at the top of the
sheet with each leg **labelled with its field name**, so the mapping from UI-18b is stated
once, explicitly, in the one place a curious judge goes to read detail. Turns a clever
visual into a documented one. **Cost:** small.

### UI-16 · The page reacts to fleet health
Partly built — `css/fleet.css` carries the fleet-wide symbiote layer from T-17. What is
left is the ground: page darkening and the halftone coarsening as fleet integrity drops.
Re-scope before starting, do not rebuild what exists. **Cost:** small, not medium.

### UI-22 · Mask favicon — **re-scoped down**
`finish.js` generates a 32×32 SVG favicon of flat rectangles per state. Eight eyes lit by
integrity **will not survive** there — browsers render it at 16px, where an eye is one
pixel and the whole idea disappears into noise.

What does survive: the mask silhouette, and a single **eye band** whose lit width is the
fleet integrity — one rectangle over another, readable at 16px, still data-driven. Same
function, same data, one shape instead of eight. **Cost:** trivial.

---

## MERGED

| Was | Now | Why |
|---|---|---|
| UI-07 speech bubbles | **UI-21** | A bubble belongs to a mouth. Without a character it was a floating label |
| UI-11 keyboard path | **UI-05** | One focus model, one key handler, one "which scan is this" question |
| UI-12 deep link | **UI-02** | A permalink to an issue is part of what makes it an issue |
| UI-17 print report | **UI-02** | The cover *is* the print artefact; a `@media print` rule, not a feature |

---

## REJECTED

| Idea | Why |
|---|---|
| Sound design | Autoplay is blocked, and audio during judging hurts more than it helps |
| Threads between infected Spiders | Would look good and would be a lie — the collectors are unrelated, no correlation exists |
| Dark/light toggle | The design commits to one world. A light mode weakens it rather than broadening it |
| Registration / accounts to gate the intro | Needs a backend, and puts a form between the judge and the product |
| Rewriting the console | Two days out, finished beats better |
| **UI-14 history scrubber** | Needs the whole console re-rendered at an arbitrary instant, but `pulse`, `scars`, `haul` and the streak all compute from *latest*. Three desyncs waiting, on the last two days. UI-02 reaches any past state through incidents instead |
| **UI-15 side-by-side Spiders** | An analyst's comparison view. It answers "who fails more", which no judge asked, and it is the most generic-dashboard thing on the list |
| **Marvel likenesses** | Someone else's design, on a public repo, with a legal tail and no upside. The archetype is free; the trademark is not |
| **Cursor as a web-shooter** | Every hit target on the page gets worse so one gag can land once |
| **Ten-legged ATLAS** | Was in this file for one commit. People count spider legs without noticing they are doing it; ten reads as a mistake, not as a signal. Replaced by the pedipalp pair in UI-18b |
| Character art as raster assets | Loses token recolouring, loses the halftone, adds files to load, and needs one asset per state |

---

## Feasibility audit — 21 Aug

Every claim above was checked against the code that would have to change. What the check
moved, so the same mistakes are not made twice:

| Finding in the code | What it changed |
|---|---|
| Healthy panels render **compact** and show **no chips** | The first screen has room for the rig. Placement rule written into UI-18b |
| Symbiote is a `linear-gradient` mask on a div under an SVG turbulence filter — not a shape | UI-18d rewritten as a clip-path tooth strip plus an SVG eye pair, instead of "cut teeth into the mask" |
| `panel.js` already sets `data-drowned="1"` above `PAPER_SPREAD` | The symbiote's eyes need no new threshold |
| Sparkline SVG is `preserveAspectRatio="none"` | UI-19 cannot live inside the chart. Re-scoped to an overlay positioned from the points array |
| Favicon is 32×32 flat rects, rendered at 16px | UI-22 cut from eight eyes to one eye band |
| `app.js` derives a change signature but keeps **no previous field state** | UI-21 gained a prerequisite: a per-field diff module. Cost raised |
| The browser cannot count `node:test` tests | UI-04 gained `data/meta.json`, written by CI, so the number cannot go stale |
| `panelHTML` receives `idx`; `sp.fieldOrder` exists per panel | UI-06 and UI-18b both confirmed cheap — the data they need is already passed in |
| `panel.js` is 118 lines against a 250-line repo cap | The rig is a new module, not an addition to `panel.js` |

**What the audit did not resolve, and someone should decide with their eyes open:**

- **UI-01 is the only ACCEPTED item with nothing already standing.** Everything else builds
  on a mechanism that exists. If one medium slips, it is this one, and the diptych (UI-10)
  is what covers for it.
- **The cast is a day.** UI-18a is not a two-hour SVG. Three silhouettes that read as
  distinct characters at panel size, with a leg rig that animates per field, is the single
  largest piece of work in this file — larger than UI-01 and UI-02 individually.
- **Performance is unmeasured.** Turbulence filter plus animated legs on three panels has
  never been run on a phone. UI-09 is the gate and it is not optional.

---

## Build order

Trivial first, because the first screen is the problem:

**UI-04** → **UI-06** → **UI-05** → then the cast, in its own cut order: **UI-18a** →
**UI-18b** → **UI-18c** → **UI-18e** → **UI-10** (the diptych, near-free once the rig
exists) → **UI-01** → **UI-02**.

**UI-09** runs twice: once when the rig lands, once before submitting. It is a check, not a
feature, and it is the only item here that can reject work already done.

Everything else is optional. Two finished ideas beat five half-finished ones. A half-done
animation reads as a bug, not as a missing feature — doubly true of a character: a mascot
that glitches wrongly looks broken in a way an abstract panel never does.

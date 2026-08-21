# UI ideas — Suit-Up (Best UI)

Every idea has a stable id. Reference them by id in commits and prompts. Ids are never
reused: a merged idea keeps its number and points at where it went.

Status: **ACCEPTED** = going into the build · **OPEN** = candidate · **MERGED** = folded
into another id · **REJECTED** = decided against, with a reason, so it stops resurfacing.

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
*Cost: medium. This is the one thing on the list worth a whole day.*

**UI-18b · Legs are fields.** Each expected field owns a mirrored pair of legs. BODEGA
watches 4 fields, so it has **8 legs**. KESTREL watches 4, so it has 8. **ATLAS watches 5,
so ATLAS has 10 legs** — a visibly different creature because it does more work. Anatomy is
read from `collectors.json`, not decided by the artist.

| Field state | Leg |
|---|---|
| `LIVE` | planted, load-bearing, slow breathe |
| `INFECTED` | still planted, twitching off-rhythm at the infected-chip 2s cadence |
| `DEAD` | limp — the joint gives, the leg hangs, ink drains to `--symbiote` |

A Spider at 50% integrity is standing on half its legs and it *looks* like it. This is the
single strongest idea in the file: the mascot is a bar chart nobody has to be taught to
read. *Cost: medium, and only after 18a.*

**UI-18c · Eyes are integrity.** Eight eyes, lit count from the integrity band, dimmed with
`--unwatched` rather than removed so the socket still reads. `HEALTHY` all lit;
`DEGRADED` the outer pairs go dark; `CRITICAL` one eye left. `UNWATCHED` (no scan in 3h)
closes them all — the Spider is asleep, which is exactly what that state means. Blink at
randomised intervals per panel; three characters blinking in unison reads as a loop and
kills the illusion instantly. *Cost: small.*

**UI-18d · The symbiote gets a face.** Today the black is a mask that climbs. Give its
leading edge a mouth: a jagged tear that widens with coverage, and above ~70% a pair of
white slit eyes opens inside the black and looks out of the panel. Infection currently
reads as a fill level; this makes it read as something *arriving*. The teeth are the same
mask geometry we already animate — no new coverage maths.
*Cost: small-to-medium.*

**UI-18e · Idle life.** Healthy panels already breathe. Characters need more: a leg
re-plants every 6-11s, the body shifts weight, the mask plate catches a highlight. All
periods prime-ish and per-panel offset so nothing syncs. A still cast reads as a
screenshot; a synchronised cast reads as a GIF. *Cost: small.*

**UI-18f · The scan lands on screen.** When polling picks up a new record, that Spider
*reacts*: a step, a head turn toward the new sparkline point, `THWIP!` only if the record
carries `after_heal`. This is the animation that proves the page is live rather than
rendered once — and it fires off a real event, not a timer. *Cost: small, needs UI-03.*

**Cut order inside UI-18, if the day runs out:** 18a → 18b → 18c → 18e → 18d → 18f. A rig
with dead legs and no eyes still wins. Eyes without a rig are nothing.

### UI-19 · The crawler · **OPEN**

The animal, not the person. One small spider, no mask, walks the sparkline left to right
along the actual path — the same SVG polyline the chart already draws, so it walks the
history — and settles on the newest point. On a panel with a scar (a past incident) it
pauses at the notch. When a new scan lands it drops in on a thread from the panel's top
edge.

Cheapest characterful motion available: it is one path-following animation on a path that
already exists. *Cost: small.*

### UI-20 · Cover character in the masthead · **OPEN**

One large character in the masthead, drawn from **fleet** state rather than a single
collector: standing and inked when the fleet is clean, half-taken and lettered `THE WATCH`
across the black when anything is critical. It is the cover figure of the issue, and it is
the thing a judge sees before scrolling.

Pairs with UI-04 — figure on the left, evidence line on the right, and the first screen
finally carries both a face and a proof. *Cost: medium.*

### UI-21 · The character speaks · **OPEN** *(absorbs UI-07)*

A tailed bubble in Bangers, one line, issued **by the character** rather than floating over
the panel: `"price is gone."` on a field going dead, `"I'm back."` on a verified heal,
`"...still here."` on a long clean streak. The symbiote gets the opposite voice — lowercase
and calm, which is worse.

Rules that keep it from going cutesy: one bubble on screen at a time, transitions only,
never idle, auto-dismiss under 3s, and no bubble at all during the intro. *Cost: small.*

---

## ACCEPTED

### UI-01 · Opening sequence
On first load the console demonstrates its own mechanic on real `inc_003` data, ~6s, then
settles into the live present.

`0.0s` healthy · `0.8s` `SNAP!`, integrity drops · `1.6s` symbiote climbs, `CRACK!` ·
**`2.6s` hold** · `3.4s` `WEAVE...` · `4.6s` `PURGE!` · `5.4s` `THWIP!` · `6.0s` live.

The hold matters more than the motion around it. Infection slow, removal violent — that
asymmetry is the emotional argument of the product.

**Now starring the cast.** With UI-18 in, the sequence stops being a mask animation and
becomes a character losing its legs and getting them back — the same six seconds carrying
far more. If UI-18a and UI-18b land, re-time the hold against the leg collapse rather than
the mask height.

**Playback:** `sessionStorage`, once per tab. `REPLAY INTRO` button in the masthead.
`?intro=1` forces it. `prefers-reduced-motion` skips to the end state.

*(`cmd+shift+R` clears the resource cache but not Web Storage, and JS cannot distinguish a
hard refresh — `navigation.type` reads `"reload"` for both. The button covers that need.)*

**Constraints:** real data only · **skippable by any click, key or scroll, not just by a
skip button** · never blocks interaction · always ends in exactly the state a plain load
produces.

**Cost:** medium.

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
layout once the cover exists, and it costs a stylesheet rather than a feature.

**Cost:** medium.

### UI-04 · Evidence line in the masthead
`3 collectors · 4 incidents healed · 698 rows · 528 tests · c_a628…`

The first screen currently carries **no proof at all** — no collector id, no incident
count, no test count. Cheapest credibility available, and it is the only idea here that
also scores in Best Code. Every number computed from the committed data; the test count is
the one constant, so it comes from a single named place, not a literal in the markup.

**Cost:** trivial. **Do it first.**

### UI-10 · Diptych above the grid → **the two characters**
A healthy Spider and a taken one side by side, both from real history, one line of caption
naming the date and the incident so it is unmistakably the past and not the present.

Originally justified as a still fallback for UI-01. With the cast it is better than a
fallback: it is the legend, drawn. `LIVE` / `INFECTED` / `DEAD` explained by one creature
standing and one creature failing, which is the entire product in one glance and survives
`prefers-reduced-motion` untouched.

**Cost:** small once UI-18a exists.

---

## OPEN — ranked by impact per hour

### UI-05 · Sparkline hover, and the keyboard path *(absorbs UI-11)*
Hover a point, get that scan's timestamp and integrity. The charts are decorative right
now; this makes them readable. Same pass adds the keyboard route — Tab through panels,
Enter opens the sheet, Escape closes, arrows step the replay and step the sparkline point
by point, which is the same "which scan is this" question answered by a different input.
Merged because they are one handler and one focus model, not two features.
**Cost:** small.

### UI-06 · Panel numbers
A small `1` `2` `3` in the corner of each Spider panel, in ink. Real comic panels are
numbered. Stops the page reading as a CSS grid. **Cost:** trivial.

### UI-03 · Live polling
**Verify before estimating:** `app.js` already refreshes every 60s, so part of this exists.
What is missing is the *visible* part — the console must show that it moved: a landing scan
should animate the new point in and trigger UI-18f, not silently re-render.

Honest caveat: the fleet sits at 100%, so during judging the most likely landing scan
changes nothing. Design the arrival, not the drama. **Cost:** small.

### UI-08 · Caption-box section headers
`MEANWHILE — 698 ROWS SHIPPED CLEAN` instead of `THE HAUL`. Comics move between scenes with
a caption box; the temporal phrase comes from real data. **Cost:** small.

### UI-09 · Phone pass
Nobody has checked what the pulse, the heatmap or THE HAUL do at 375px. A judge may well
open the URL on a phone from a Discord link. Cheap to verify, embarrassing to lose on.
Also the check on the cast: an 8-legged character at 375px is either a strong silhouette or
an ink smudge, and it is better to find out before it ships. **Cost:** small.

### UI-13 · Print artefacts
One-pixel plate misregistration on borders, faint wear at panel corners, a dry-brush web in
two page corners. The only bucket allowed to be pure decoration, because it asserts nothing
about the data — it is the paper, not the ink. Sub-perceptual alone; together it is the
difference between comic-styled and printed. Overdone, it reads as a rendering bug.
**Cost:** small.

### UI-22 · Eight-eye favicon
The generated favicon becomes the mask, with eyes lit by fleet integrity — a tab that
dims as the fleet degrades. `finish.js` already generates a favicon per state, so this is a
redraw inside an existing function, and the browser tab is on screen for the entire
judging. **Cost:** trivial once UI-18c settles the eye grid.

### UI-23 · The cast in the detail sheet
Spider Detail already lists per-field tracks. Put that Spider's character at the top of the
sheet with each leg **labelled with its field name**, so the mapping introduced by UI-18b is
stated once, explicitly, in the one place a curious judge goes to read detail. Turns a
clever visual into a documented one. **Cost:** small.

### UI-16 · The page reacts to fleet health
Partly built already — `css/fleet.css` carries the fleet-wide treatment from T-17. What is
left is the ground: page darkening and the halftone coarsening as fleet integrity drops.
Re-scope before starting, do not rebuild what exists. **Cost:** small, not medium.

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
| **Marvel likenesses** | Someone else's design, on a public repo, with a legal tail and no upside. The archetype is free; the trademark is not. See the note under THE CAST |
| **Cursor as a web-shooter** | Every hit target on the page gets worse so one gag can land once |
| Character art as raster assets | Loses token recolouring, loses the halftone, adds files to load, and needs one asset per state |

---

## Build order

Trivial first, because the first screen is the problem:

**UI-04** → **UI-06** → **UI-05** → then the cast, in its own cut order: **UI-18a** →
**UI-18b** → **UI-18c** → **UI-18e** → **UI-10** (the diptych, free once the rig exists) →
**UI-01** re-timed against the legs → **UI-02**.

Everything else is optional. **UI-09** is not optional, but it is a check, not a feature —
run it after the cast lands and again before submitting.

Two finished ideas beat five half-finished ones. A half-done animation reads as a bug, not
as a missing feature — and that is doubly true of a character: a mascot that glitches
wrongly looks broken in a way an abstract panel never does.

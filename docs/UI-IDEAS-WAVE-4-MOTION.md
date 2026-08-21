# UI ideas — wave four · motion

Ids continue from UI-68.

## Where motion actually stands

The design spec's motion table (`DESIGN-SPEC.md` §6) is **built** — twenty-three
`@keyframes` across `web/css/`, thirty-six `animation:` declarations, seventeen
transitions. Panel entrance, damage hit, glitch slice, re-weave pulse, burst in and out,
feed arrival, symbiote breathe and purge, infected chip pulse, the rig's plant, twitch,
blink and weight shift, the reaction set, the pulse trace, the ledger flip.

So this wave is not "add animation". Every animation the spec asked for exists. This is
what the spec's table never covered, and what an audit of the built page turns up:

**Every duration on the page is a number somebody chose.** 400ms, 800ms, 900ms, 9s. Not
one of them is a real interval. The page animates *about* a system that runs on a
thirty-minute clock and never once moves at that clock's speed.

**Nothing is driven by the reader.** No `IntersectionObserver`, no `animation-timeline`.
7,267 pixels of scroll and the only thing that changes is which part of a static page is
in front of you.

**Motion is spent evenly, so it is spent on the wrong thing.** Three healthy rigs plant,
blink and shift weight; the pulse traces; the `LIVE` dot blinks. When something is
finally wrong, it has to be louder than a page that is already busy.

**All numbers snap.** Integrity, rows, timestamps — every value on a page whose typeface
was chosen for tabular figures changes by replacement.

---

## Motion whose duration is real

The strongest category, because it is the only one where the animation is not a choice.

### UI-69 · The sweep hand
The cron is `*/30`. Trace a thin arc along the panel border that takes **one real lap
between sweeps** — `animation-duration` computed from `lastScan + 30min − now`, not
picked. When the scan lands the arc snaps to zero and starts again.

It is the only motion on the page whose length is a real interval, and it converts dead
waiting into the thing the reader is watching. When a run is late the arc completes and
starts pulsing at the border, and *overdue* reads without a word of copy.

*Data: newest `history.ts`, the cron cadence. Cost: small.*

### UI-70 · The substance creeps at the speed it actually crept
A degraded panel currently jumps to its spread on load and transitions over a chosen
800ms. Instead: climb from the previous scan's level to this one over a duration derived
from **the real gap between those two scans**, compressed by one fixed factor stated on
the page.

Forty points lost between two scans thirty minutes apart then looks nothing like forty
points lost over four hours. The creep rate becomes the data, which is the wave-one rule
applied to time instead of to shape.

*Data: consecutive `integrity` values and their timestamps. Cost: small.*

### UI-71 · Drift between scans
Nothing on this page changes between polls. Two things should, and neither invents data:
the sweep hand moves, and the paper ages continuously as the last scan gets older (the
yellowing in UI-57, driven by `now − ts` rather than by a three-hour band).

A judge who sits still for sixty seconds should see the page change on its own. Right now
they see a screenshot.

*Data: the clock. Cost: trivial once UI-57 or UI-69 exists.*

---

## Motion the reader drives

### UI-72 · The page prints as you read it
Scroll-driven, in CSS, no JavaScript: `animation-timeline: view()`. As each panel enters
the viewport it is *printed* — line art strokes itself in (`stroke-dashoffset`), the flat
fill floods, the halftone lands last. Three passes keyed to how far the panel has entered:
cyan, magenta, black, misregistered until the last one snaps them into register.

This is UI-59's press run, except it runs on every section instead of once at load, and
the reader turns the press by scrolling. The design's second principle —
*misregistration is intentional* — stops being a caption and becomes the thing your scroll
wheel is doing.

*Paper. Cost: medium. **Support:** scroll-driven animations are Chromium 115+ and Safari
26+; Firefox lags. Verify before relying on it — but the fallback is free, because an
unsupported browser shows the fully printed page, which is exactly the
`prefers-reduced-motion` end state the spec already requires.*

### UI-73 · The sparkline is drawn, not displayed
When a panel first enters view its sparkline strokes left to right over 600ms, and each
scar notch lands as the line reaches it. The stroke is time passing, and the incidents
arrive in the order they happened.

*Data: the points array `sparkline()` already computes, and `scars.js`. Cost: trivial
once UI-72's timeline exists.*

---

## Comic motion grammar

Motion borrowed from the medium rather than from UI convention. Nothing else in this
hackathon can use any of it, because none of them are comics.

### UI-74 · The impact frame
One frame. On a real transition into `CRITICAL`, the whole page inverts — white paper,
black ink — for 60 milliseconds, then returns. That is it.

The medium's oldest trick for a hit landing, and at sixty milliseconds it registers as
force rather than as a flash. Fires only off `delta.js` on a genuine state change, so it
can never be spent on decoration.

*Data: a real transition. Cost: trivial. **Guard:** hard-disabled under
`prefers-reduced-motion`, and it must never repeat inside one render — an inversion that
stutters is a seizure risk, not a style.*

### UI-75 · Speed lines
`delta.js` already computes per-field change. A large integrity delta draws motion lines
behind the readout, in the direction of travel: ragged and downward for a drop, clean and
upward for a recovery. Length from the magnitude of the delta.

Comics have had a vocabulary for velocity since before dashboards existed and we are not
using a word of it.

*Data: the integrity delta. Cost: small.*

### UI-76 · Ben-Day bloom
Instead of a bar filling, the **halftone dots grow** — dot radius carries the value, and
on a change they swell and settle. The texture becomes the chart.

The spec makes halftone the texture of every surface and then never lets it mean
anything. This is the most print-native way to animate a number that exists, and it
costs one animated `background-size`.

*Data: any value already bound to a panel. Cost: small.*

### UI-77 · The purge takes the whole page
`PURGE!` is per panel. When a record carrying `after_heal` lands, the **fleet** layer
should tear off the entire page in one 900ms motion.

The spec states the asymmetry — infection slow, removal violent — and then realises it
only at panel scale, where it is a detail. At page scale it is the moment the product
exists for.

*Data: `after_heal` on the landing record. Cost: small — `css/fleet.css` already carries
the layer.*

---

## Typographic motion

### UI-78 · The odometer
Integrity rolls digit by digit, each digit a vertical strip in IBM Plex Mono. Rows and
scan counts count up on first view.

Every number on this page changes by replacement, on a page whose typeface was chosen
for tabular figures precisely so that numbers could move without the layout jittering.
Rolling is thirty lines of CSS and it makes a value change feel mechanical — which is
what a cron is.

*Data: any readout. Cost: small.*

### UI-79 · The stamp
When a new record lands, the panel takes an ink stamp: 90ms press-in, a hair of ink
spread at the edges, release. It marks arrival physically, in one element, instead of
re-animating anything.

*Data: the landing scan. Cost: trivial — and it is the correct replacement for the defect
below.*

---

## Motion as a budget

### UI-80 · Stillness is the health signal
Everything loops at once right now: three rigs planting, blinking and shifting weight,
the pulse tracing, the `LIVE` dot blinking. A busy page has nothing left to spend when
something finally goes wrong, and it spends its attention on the Spiders that are fine.

The rule to adopt: **a healthy fleet holds micro-motion only — breath and blink. Narrative
motion (steps, twitches, speed lines, glitch, creep) is reserved for damage.**

Then a sick panel is the only thing moving on an otherwise still page, and that reads
harder than any animation we could add on top. It is the one idea in this file that
mostly *removes* animation, and it is the one most likely to win the track.

The spec's warning — a completely still dashboard reads as a screenshot in a video — is
answered by the breath and the blink staying, and by UI-69 and UI-71 keeping real time
visible.

*Cost: small, mostly deletion.*

### UI-81 · Weight and lag
One spring in the entire page: the rig's body lags its legs by roughly 80ms on any
movement, and settles. Everything else on this page is CSS easing, which is exactly why
the cast reads as looped drawings rather than as animals.

One physics term, applied in one place.

*Cost: small.*

---

## The defect

### UI-82 · The whole grid re-enters on every landing scan
`render.js` sets `grid.innerHTML` wholesale, so `panel-in` replays on **all three panels**
whenever any one of them gets a new record. A KESTREL scan re-animates BODEGA and ATLAS.

It reads as a page refresh, which is precisely what the live console is trying not to be —
and it makes UI-03's landing mark meaningless, because everything moved.

The arrival should be surgical: only the panel whose record changed moves, and what it
does is UI-79's stamp. Not an idea; a bug whose symptom is an animation.

*Cost: small. Fix before adding anything else in this file, or the additions land on top
of a full-page flash.*

---

## Ranked

1. **UI-82** — fix the flash first, everything else animates on top of it
2. **UI-80 · Stillness as the signal** — mostly deletion, biggest read
3. **UI-69 · The sweep hand** — the only real duration on the page
4. **UI-74 · The impact frame** — sixty milliseconds, unforgettable
5. **UI-72 · The page prints as you read it** — the whole art direction, demonstrated
6. **UI-78 · The odometer** · **UI-79 · The stamp** — cheap, and every number benefits
7. **UI-77 · The page-wide purge** · **UI-75 · Speed lines** · **UI-76 · Ben-Day bloom**
8. **UI-70** · **UI-71** · **UI-73** · **UI-81**

## Reduced motion is not an afterthought here

Reduced-motion blocks exist in five stylesheets, not globally. Three items in this wave —
the impact frame, the press run, the page-wide purge — are exactly the kind of motion that
hurts someone, and the spec already requires every state to stay legible with motion off.

Any of these lands with its reduced-motion end state written **in the same commit**, not
in a follow-up.

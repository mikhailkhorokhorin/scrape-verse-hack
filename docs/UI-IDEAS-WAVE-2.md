# UI ideas — wave two

Wave one (`UI-IDEAS.md`, twenty-three briefs in `docs/ideas/`) is built: twenty shipped,
one cut, one rejected, one gate unrun. This file is the second pass, written on 21 Aug
after opening the built console and looking at it as a judge would, and after a fresh
look at the field.

Ids continue from UI-23 and are never reused.

---

## Culled, 21 Aug, the day it was written

**Everything below except UI-29 is rejected.** Read the header of each idea, then the
reason, then stop reconsidering them.

The reason is one thing and it is worth writing down, because it is the difference
between wave two and wave three: **this wave proposed chrome, and chrome loses.** Crop
marks, a barcode, a countdown, a stamp, a link preview, page numbers — every one of them
decorates or services the console without adding anything to the world it is set in. They
were ranked by cost, which is how a list of chores gets written by accident.

The single item that landed, **UI-29 · the ad page**, is not chrome. It is an artifact
from inside the fiction that nobody expects to find on a monitoring console, it is funny
before it is useful, and the thing it jokes about is real. That is the test wave three is
written against, and it is the only test that matters here.

`UI-24` `UI-25` `UI-26` `UI-27` `UI-28` `UI-30` `UI-31` `UI-32` `UI-33` `UI-34` `UI-35`
`UI-36` `UI-37` `UI-38` `UI-39` `UI-40` `UI-41` `UI-42` `UI-43` `UI-44` `UI-45` `UI-46`
`UI-47` `UI-48` — **REJECTED, chrome.** The ideas are kept below in full so the same
ground is not re-walked.

Two notes so nothing useful is lost with them:

- **UI-30's letters page comes back in wave three as UI-52**, inverted. The version here
  reformatted the heal prompt as evidence; the version that survives makes it the punchline
  of a correspondence with the Spiders.
- **The missing `og:image` is a defect, not an idea.** `index.html` carries no `og:` or
  `twitter:` tags, so the link renders blank wherever it is pasted. It gets fixed as a
  chore, in the same commit as anything else in `<head>`, and it is not on any idea list.

**Alive:** UI-29 only. It belongs to wave three now — see `docs/UI-IDEAS-WAVE-3.md`.

The rule from wave one still holds and every idea below is measured against it:

> **A drawing that is not driven by a field in `history.json` is decoration, and
> decoration loses this track.**

Ideas that assert nothing about the data are marked **paper** — they are allowed to be
purely typographic, they claim nothing, and they are cut first.

---

## What the field looks like on 21 Aug

Thirty-odd public `scrape-verse` repositories, most pushed within the hour. The count is
not the story; three things about them are.

**Nobody has a deployed URL.** Not DriftWatch, not PRECOG, not Sentinel — no `homepage`
set on any rival repository checked. Ours is on Pages and has been since the 20th. A
judge who can open a link at all is already looking at more of our product than of
anyone else's.

**Every one of them is a dashboard.** DriftWatch is a neon radar HUD; PRECOG is a causal
graph; the market-intelligence and price-tracker submissions are cards and line charts.
The whole field converged on the same visual language, which is the language every
monitoring tool already speaks.

**So the axis nobody can follow us down is the printed object.** A rival can add a
character, a colour, an animation. What they cannot do two days out is turn their build
into a thing that reads as paper — crop marks, a barcode, an ad page, a letters column,
a cover date. That is not a skin over a dashboard; it is a different category of object,
and it is the one place where more effort compounds instead of converging.

Wave two therefore pushes on four fronts:

| Front | Question it answers |
|---|---|
| **A · The object** | Does this read as an issue of a comic, or as a themed dashboard? |
| **B · Alive** | In the sixty seconds a judge is on the page, does anything happen? |
| **C · The cast** | Is there a story on the page, or only characters standing in it? |
| **D · Off the page** | What does a judge see before and after the page itself? |

---

## A · The console is a printed object

### UI-24 · Cover furniture in the masthead
An issue number, a cover date and a price box in the top corner, set the way a comic
sets them. `THWIP · No. 4 · AUG 2026`. The number is the next incident, so it is
`incidents.length + 1` — the issue currently being written is the break that has not
happened yet, which is exactly what a watch console is for.

The price box is where a comic prints `25¢`. Ours prints `821 TESTS`.

*Data: `incidents.length`, `meta.generated_at`, `meta.tests`. Cost: trivial.*

### UI-25 · Approved by the Watch
The circular authority stamp, bottom-right of the masthead block:
`APPROVED BY THE WATCH · 821 TESTS GREEN · ac36ffd`. Reads as a period joke and as
credibility in the same glance, and it puts the Best-Code evidence on the Best-UI screen
without a paragraph of prose.

*Data: `meta.tests`, `meta.sha`. Cost: trivial.*

### UI-26 · The barcode is the commit
Comics print a barcode in the cover's bottom-left corner. Ours is drawn in SVG with bar
widths derived from the hex digits of `meta.sha`, with the short sha typeset under it in
mono. It is a real encoding of a real value — a judge who checks will find the commit it
names.

*Data: `meta.sha`. Cost: trivial.*

### UI-27 · Printer's marks in the margin — **paper**
Crop marks at the four page corners, a registration target, and a CMYK colour bar down
one outer gutter. This is the cheapest way to say *printed* without saying anything. Hide
below 768px, where margins do not exist.

*Cost: trivial. Risk: overdone it reads as a rendering fault — keep it faint and outside
the content column.*

### UI-28 · Page numbers, and a spine — **paper**
The page is 7,267px tall and has no sense of place. Every section header takes a
`PAGE 3` marker in the outer corner, and the left margin carries a thin rule with a tick
at every incident's position in the scroll. Navigation and history in one element: the
reader can see there are three breaks in this issue before scrolling to them.

*Cost: small.*

### UI-29 · The ad page
Vintage comics sold X-ray specs between the panels. One full-width in-world ad, set in
period style, selling our own MCP server: **SIX TOOLS. NO SDK. CONNECT IN ONE LINE**,
with `claude mcp add thwip -- node mcp/server.js` printed in the coupon box.

Nobody expects an ad, it is unmistakably comic, and the thing it advertises is real and
judged. It is not placeholder content — it is product copy in a period voice.

*Data: the six tool names from `mcp/registry.js`. Cost: small.*

### UI-30 · The letters page
`heal_prompt` is the single most under-shown artifact we hold: the exact English handed
to Bright Data when a Spider broke. Today it appears once, inside the replay. Set all
three as a letters column — dated from `opened_at`, signed by the cron, typeset in a
narrow two-column measure like a real letters page.

A judge reading that column is reading the autonomous system's own words.

*Data: `incident.heal_prompt`, `opened_at`, `spider`. Cost: small.*

### UI-31 · NEXT ISSUE
A teaser strip at the very bottom: `NEXT ISSUE — THE FOURTH BREAK`, then the README's
roadmap items, printed as coming attractions and explicitly marked unbuilt. Comics always
tease the next one. Being loud about what is not built reads as confidence, not as a gap.

*Cost: trivial.*

### UI-32 · The 404 is a taken page
`web/404.html` — GitHub Pages serves it. Full-page symbiote, `THIS PAGE WAS TAKEN`, one
link home. Judges poke at URLs, and a themed 404 is a signal that the whole surface was
authored rather than the one screen that was demoed.

*Cost: trivial.*

---

## B · Alive while a judge is on the page

### UI-33 · The next sweep, counting down
The cron is `*/30`. The `WATCH` readout says `LIVE` and then does nothing for the entire
visit. Make it `LIVE · NEXT SWEEP 08:24`, ticking every second from
`newest scan + 30 minutes`.

This is the cheapest possible proof that the thing is running rather than a static export
of a run that happened once, and it is the only element on the page that changes while a
judge sits still.

*Data: newest `history.ts` plus the cron cadence. Cost: trivial. Guard: when the clock
runs past zero the readout must read `SWEEPING…`, never a negative number — a late run is
normal and a negative countdown is a bug on screen.*

### UI-34 · The page notices it is being watched
The product's thesis is that nobody is watching. So the page registers when someone is:
one small readout that flips from `UNOBSERVED` to `WATCHED · 00:42` while the tab is
visible and the pointer has moved, and falls back when you leave.

Meta, but it lands the argument in a way no chart on this page does, and it is the only
idea here whose data source is the judge.

*Data: `document.visibilityState`, pointer activity. Cost: trivial. Risk: one line, no
second-person copy — a paragraph about "you" turns a good instinct cute.*

### UI-35 · Ink-in on scroll
**Nothing on the page uses `IntersectionObserver` today** — the entire 7,267px scroll is
motionless. Panels should arrive: halftone dissolve, ink line drawing itself via
`stroke-dashoffset`, 350ms, once per element.

This is the largest "feels expensive" upgrade available for the smallest amount of code,
and it is the difference between a long page and a page that is being printed as you go.

*Paper. Cost: small. Must respect `prefers-reduced-motion` — the spec already mandates
the end state stays readable with motion off.*

### UI-36 · The sparkline draws itself
When a panel enters view its sparkline strokes left to right over 600ms. Not decoration:
the stroke is time passing, and the scars (past incidents) land as the line reaches them.

*Data: the real points array `sparkline()` already computes. Cost: trivial once UI-35's
observer exists.*

### UI-37 · The landing scan gets an event
UI-03 marks a landing scan, but the fleet sits at 100% so the most likely scan during
judging changes nothing and the mark has nothing to mark. Give the *arrival* its own
motion regardless of change: the new point drops into the sparkline, the timestamp rolls
over digit by digit, `+30 rows` counts up beside the haul total.

Nothing is faked — the rows are real, the timestamp is real. Only the arrival is staged.

*Data: the new record. Cost: small.*

### UI-38 · The masthead takes damage
The wordmark is the biggest ink on the page and it is inert. Bind its chromatic offset to
fleet integrity: `chroma` at 100, `chroma-mid` through the degraded band, `chroma-hard`
and desaturating under 60. The logo becomes the readout, which is the most comic thing
this design could do with a logo.

*Data: fleet integrity. Cost: trivial — one class swap in `ground.js`.*

### UI-39 · The halftone coarsens as the fleet decays
Leftover from wave one's UI-16. Dot size and dot contrast scale with fleet integrity, so
a sick fleet literally prints worse. The page's own material degrades with the data.

*Data: fleet integrity. Cost: trivial.*

---

## C · The cast, deeper

### UI-40 · The rogues gallery — **the headline of this wave**
The classifier knows four strains: `THROTTLED`, `RENAMED`, `DRIFTED`, `SHIFTED`. Three
have been met in the wild — one each — and one never has. Print them as four wanted
posters: mugshot in ink, the existing gloss as the description, and a record line.

```
THROTTLED   ENCOUNTERED 1×  ·  BODEGA   ·  07:48Z 21 AUG  ·  HEALED
RENAMED     ENCOUNTERED 1×  ·  KESTREL  ·  05:13Z 21 AUG  ·  HEALED
DRIFTED     ENCOUNTERED 1×  ·  ATLAS    ·  05:13Z 21 AUG  ·  HEALED
SHIFTED     AT LARGE — NEVER SEEN
```

Three things at once: it turns a taxonomy into a cast of villains, it is entirely real
data, and it makes the classifier — which is Best-Code evidence buried in `scripts/` —
into a visual feature. The fourth poster is the honest one and it is also the most
dramatic: a failure mode the system knows how to name and has not yet had to face.

*Data: `incident.strain` counts and timestamps, `STRAIN_GLOSS` in `config.js`. Cost:
medium — four original mugshots is the work, and the same `rig.js` primitives can carry
them.*

### UI-41 · The cast roster
Comics print a roster page. Ours is a stat block: three Spiders at full height, each with
its universe, the fields it watches, its collector id, and its record — ATLAS today reads
`1 break · 1 heal · 20 clean in a row`. The detail sheet has this per-Spider;
the roster puts the fleet on one page and states the mapping from wave one's UI-18b once,
in the open.

*Data: adapter streaks, incidents per spider, `collectors.json`. Cost: small.*

### UI-42 · Every Spider has a record
The smallest version of UI-41, in case the roster does not fit: one line in the corner of
each panel — `1 BREAK · 1 HEAL · UNDEFEATED`. Every Spider on the fleet has taken a break
and come back from it, and that is a thing worth printing on the panel rather than
leaving in the feed.

*Data: incidents by spider, `resolved`. Cost: trivial.*

### UI-43 · The symbiote's origin panel
One panel in the legend showing where the black actually comes from, magnified: a field
that returned a value and was wrong. `rating: "Five"` where a number between 0 and 5 was
expected — that string is on the page right now, in THE HAUL, from ATLAS.

The legend currently explains the symbiote in words. This shows the four characters that
caused it.

*Data: a real infected sample from `history.json`. Cost: small.*

---

## D · Off the page

### UI-44 · The link preview — **do this first**
`index.html` has **no `og:image`, no `og:title`, no `twitter:card`**. The URL pasted into
a Discord channel — which is precisely how a judge receives it — renders as a bare grey
rectangle with a hostname.

`assets/the-watch.png` already exists for the README header. A 1200×630 card, four meta
tags, absolute URLs. This is the highest-leverage trivial item in either wave: it is the
first frame of our UI that a judge sees, and today it is blank.

*Cost: trivial.*

### UI-45 · Film mode
`?film=1` — the page plays itself: intro, then a scripted scroll on rails through
diptych → grid → rogues → haul → replay → issues, pausing where the script says, with
every control hidden.

**T-13 (the demo video) is still unrecorded.** This turns recording it into one take with
no mouse in frame and no operator timing the scroll, and it costs less than the second
attempt at filming it by hand would.

*Paper — it is choreography, not a claim. Cost: small, and it pays for itself in T-13.*

### UI-46 · Judge tour — **build UI-45 or this, not both**
`T` starts a forty-second guided pass, spotlight cutout moving region to region, one
caption per stop. Same instinct as film mode and it competes for the same slot.

Recommendation: build film mode. It serves a deliverable that is on the queue; the tour
serves a judge who may never press `T`.

*Cost: small. Status: keep unbuilt unless film mode lands early.*

### UI-47 · Per-issue link previews — **probably not**
Each `#inc_003` deep link deserves its own cover as the share image, but static hosting
cannot vary meta tags per hash route without prerendering three small HTML files.
Recorded so it stops being re-proposed: the cost is a build step we do not have and the
benefit lands only if someone shares a deep link rather than the root.

*Status: cut unless everything above is done.*

### UI-48 · The motion switch, in the open
`prefers-reduced-motion` is honoured in CSS and invisible on screen. A visible `MOTION`
toggle beside `REPLAY INTRO` is a small, legible statement that the reduced state was
designed rather than defaulted — and a judge who needs it should not have to change an OS
setting to get it.

*Cost: trivial.*

---

## Ranked — impact per hour

Trivial tier, all of it worth doing before anything medium starts:

1. **UI-44** link preview — the first frame of our UI, currently blank
2. **UI-33** next-sweep countdown — the only proof on screen that this is live
3. **UI-25** + **UI-26** the stamp and the barcode — Best-Code evidence, printed
4. **UI-38** the masthead takes damage — one class swap, biggest ink on the page
5. **UI-24** cover furniture — issue number, cover date, `821 TESTS` where the price goes
6. **UI-32** the taken 404

Then, in order:

7. **UI-35** ink-in on scroll, and **UI-36** the sparkline drawing with it
8. **UI-40** the rogues gallery — the headline, and the only medium worth starting
9. **UI-45** film mode — because T-13 has to be recorded either way
10. **UI-30** the letters page · **UI-29** the ad page · **UI-41** the roster

Everything else is optional and stays in this file so it stops being re-proposed.

## What this wave must not do

**It must not delay T-12 or the submission.** Two items on the queue need a human and one
of them is the autonomous break that is our strongest single claim. The trivial tier above
is about ninety minutes total; the rogues gallery is an afternoon. Nothing here is worth
an unsubmitted repository.

**It must not be started in parallel.** Wave one's lesson holds: two finished ideas beat
five half-finished ones, and a half-drawn villain looks broken in a way a missing villain
never does.

# UI-18c · Eyes are integrity

> Eight eyes, lit count from the integrity band, dimmed rather than removed so the socket still reads.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** small · **Depends on:** [UI-18a](UI-18a-the-rig.md) ("eyes without a rig are nothing")
**Touches:** `web/js/rig.js`, `web/css/panel.css` (or a rig-specific stylesheet)

## What it is

Each character has eight eyes. How many are lit is driven by the collector's integrity
band, using the same thresholds the rest of the console already uses:

- `HEALTHY` (≥90) — all eight lit
- `DEGRADED` (60-89) — the outer pairs go dark
- `CRITICAL` (<60) — one eye left lit
- `UNWATCHED` (no scan in 3h) — all closed; the Spider is asleep, which is exactly what
  that state means

A dimmed eye is dimmed with `--unwatched`, not removed from the DOM — the socket stays
visible even when dark, so the shape of "eight eyes, some dark" reads rather than "a
variable number of eyes," which would look like a rendering bug.

Eyes blink at randomised intervals, per panel. Three characters blinking in unison reads as
a loop and kills the illusion instantly — the master list is explicit about this being the
single fastest way to break the effect.

## Why it earns its place

It reads `statusOf(sp)` (`web/js/format.js` lines 57-61), the exact function that already
drives the badge colour, the integrity bar's fill colour, and the panel's `is-healthy` /
`is-degraded` / `is-critical` / `is-unwatched` class today (`panelHTML`, `web/js/panel.js`
line 5 and line 57). This is not a new metric — it is the same integrity-band grading the
console has used since before the cast existed, given a second, physical expression.
`UNWATCHED` in particular already has real meaning in the data contract (`web/js/
adapter.js` lines 103-104, derived when the newest run is over three hours old) — closed
eyes are a literal, not metaphorical, rendering of "nobody has noticed this in a while."

## Mechanism

The eye group is part of the rig template in `web/js/rig.js` (see UI-18a): eight small
shapes, positioned once as part of the base spider silhouette, each capable of a lit and a
dimmed state. `rigSVG(sp, st)` receives `st`, the same status word `panelHTML()` already
computes (`web/js/panel.js` line 5), and selects a lit-count from it using the same four
bands the badge and bar already key off — no new threshold, no new comparison, just a
mapping from the existing four-way status word to a lit-eye count (8 / partial / 1 / 0).

Dimming is CSS: a class or attribute per eye (`data-lit="0"` / `data-lit="1"`, or similar)
switches fill colour between the state colour and `--unwatched` (already defined in
`web/css/tokens.css` line 6), never `display:none` or removal — the socket outline stays so
the eye count still reads as eight sockets, some dark.

Blink timing: a CSS animation with a randomised `animation-delay` assigned per panel at
render time (e.g. seeded off `sp.code` or the panel index, so it is deterministic per
render but different per panel) — this is the same anti-synchronisation approach UI-18e
uses for idle motion, and the two should share one randomisation helper rather than each
inventing their own.

## Risks

- Small cost, but entirely blocked on UI-18a — there is no eye group without a rig to hold
  it.
- Randomised-but-deterministic blink timing needs a real per-panel seed, not
  `Math.random()` called fresh on every render, or the blink pattern will visibly reset
  every time the grid re-renders (which happens on every successful poll, per UI-03).
- Eight small shapes per character, times three characters, is a modest addition to
  render/paint cost on top of everything else the cast already asks for — worth folding
  into UI-09's phone pass rather than treating as free because it is "just CSS."

## Done when

- [ ] Lit-eye count matches `statusOf(sp)` exactly: 8 healthy, partial degraded, 1
      critical, 0 unwatched
- [ ] Dimmed eyes use `--unwatched` fill and stay in the DOM — the socket is visible even
      when dark
- [ ] Blink timing is randomised per panel and does not visibly synchronise across the
      three characters on screen at once
- [ ] Blink timing is stable across re-renders (does not visibly reset on every poll)
- [ ] Verified as part of UI-09's phone pass alongside the rest of the rig

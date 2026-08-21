# UI-19 · The crawler

> One small spider that walks the history and settles on the newest point, pausing at a scar notch where a past incident sits — the animal, not the person.

**Status:** OPEN, re-scoped · **Cost:** small, after the rig, and only if UI-18a through UI-18c are all in · **Depends on:** UI-18a, UI-18b, UI-18c
**Touches:** `web/js/sparkline.js`, a new small overlay module, `web/css/panel.css`

## What it is

A small spider figure that walks along a Spider's 24h sparkline, from oldest point to
newest, and settles at the current value — pausing visibly at any scar notch (an incident
marker) it crosses along the way. It is a second, tiny character distinct from the
collector's own rig: the animal crawling the data, not a stand-in for the character itself.

## Why it earns its place

It reads the same point array `sparkline()` already computes for the visible chart, so its
position at any moment corresponds to a real historical run, and its pauses correspond to
real scar marks (`scarsFor()`, `web/js/scars.js` lines 5-22, already computes incident
positions as fractions along the same series). It is not a generic loading-spinner
animation dressed as a spider — every position it occupies is a real point in
`history.json`.

## Mechanism

**The feasibility audit found a hard constraint that reshapes this idea entirely: it
cannot be drawn inside the sparkline SVG.** `sparkline()` (`web/js/sparkline.js` line 73)
renders with `preserveAspectRatio="none"`, meaning the `viewBox`'s fixed `240×44`
coordinate space is stretched non-uniformly to fill whatever width the panel actually
renders at. A shape placed inside that SVG — a spider drawn at, say, `240×44` scale — is
stretched by exactly the same distortion as the chart line itself, which changes per panel
width and is not proportional. The result is a smear, not a spider, and it changes shape as
the browser window resizes.

The corrected approach: the crawler is an **overlay**, positioned in real page coordinates
above the sparkline `<svg>`, not a shape drawn inside its `viewBox`. Its position is
computed from the same `pts` array `sparkline()` already builds internally (`web/js/
sparkline.js` lines 58-59), but the raw `[x, y]` pairs need to be converted from SVG
viewBox units to percentages of the rendered element's actual box (`x / W * 100%`, `y / H *
100%`), then positioned with `left`/`top` (or `transform: translate(...)`) on an absolutely
positioned sibling element, not a child of the `<svg>`. This is a real positioning layer to
build — a `getBoundingClientRect()`-aware overlay that tracks panel resize — not a path
animation along an SVG `<path>`, which is what the original framing of this idea assumed
was possible.

Scar pauses reuse `scarsFor()`'s existing fraction-of-series output (`web/js/scars.js`
line 19: `idx / (runs.length - 1)`) directly — the crawler's walk timing slows or pauses at
the same fractional positions the scar tick marks already render at (`scarSVG()`, `web/js/
scars.js` lines 28-34).

## Risks

- **Explicitly re-scoped from "free" to "small but not free"** by the feasibility audit,
  specifically because of the `preserveAspectRatio="none"` constraint above. Anyone
  picking this up should not assume it is a quick SVG path animation — it is a positioning
  layer with its own resize-tracking logic.
- Gated on UI-18a through UI-18c all landing first, which given UI-18a's own medium cost
  means this idea realistically only gets attention after the largest single piece of work
  in the whole list is already done. It is a reasonable candidate to cut if time is short,
  since nothing else in the cast depends on it.
- A second small character walking across the chart, next to a rig that already has legs,
  eyes and idle motion (UI-18e), risks visual clutter on an already-busy compact panel —
  worth checking against the reasoning behind T-16 in `docs/TASKS.md` (line 694: "A real
  comic page does not use equal frames") before committing to it — panel size is already
  carrying meaning, and a second small character competing inside a compact panel works
  against that.

## Done when

- [ ] The crawler's position at any moment corresponds to a real point in the collector's
      series, converted correctly from SVG viewBox coordinates to the rendered element's
      actual pixel box
- [ ] Position tracking survives panel resize without becoming a smear or drifting off the
      chart
- [ ] The crawler visibly pauses at scar positions, using the same fractional positions
      `scarsFor()` already computes
- [ ] Built only after UI-18a, UI-18b and UI-18c are in place, per the stated dependency

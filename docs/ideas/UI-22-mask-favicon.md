# UI-22 · Mask favicon

> A mask silhouette and a single lit eye-band whose width is the fleet integrity — re-scoped down from eight eyes to one shape, because a 16px favicon cannot render eight of anything.

**SHIPPED** — `faviconFor()` and `fleetAverage()` in `web/js/finish.js`.

**Status:** OPEN *(re-scoped down)* · **Cost:** trivial · **Depends on:** nothing
**Touches:** `web/js/finish.js`

## What it is

Today `finish.js` generates a 32×32 SVG favicon of two flat rectangles: an ink frame, a
colour fill that swaps between `#FF1E1E` (something is open — critical or re-weaving) and
`#B6FF3C` (nothing is), and a third strip whose height changes between the two states
(`faviconFor(open)`, `web/js/finish.js` lines 10-21). It is boolean, not graded — it
answers "is anything on fire," not "how healthy is the fleet."

This idea replaces that with a small mask silhouette in ink, and inside it a single
horizontal eye-band whose **lit width** is the fleet's average integrity — one rectangle
laid over another, the way the integrity bar already works elsewhere on the console.

## Why it earns its place

It reads real data — fleet average integrity, the same number `renderGrid()` already
computes and `setFleetSpread()` already writes to `#fleet-sym` (`web/js/render.js` lines
32 and 68-73) — into the one surface that is visible even when the tab itself is not in
focus: the browser tab icon. `syncTitle()` (`web/js/finish.js` lines 23-39) already updates
both the document title and the favicon on every render; this idea changes what the
favicon draws, not when it updates.

## Mechanism

**The feasibility audit is explicit about why this is scoped down, and the reason survives
into the file:** the original idea gave the favicon eight lit eyes, matching UI-18c's rig.
Browsers render a favicon at 16px. At that size a single eye is roughly one pixel — eight
of them collapse into noise, not a readable signal. What survives at 16px is a strong
silhouette (the mask shape itself, unchanging) and one continuous band whose *lit portion*
scales — the same "readout as proportion of a shape" idea as the integrity bar
(`.bar__fill`, `web/css/panel.css` lines 90-97), just applied to two rectangles instead of
eight ovals.

Concretely: `faviconFor()` changes signature from `faviconFor(open)` to
`faviconFor(fleetIntegrity)`. The SVG keeps its `--ink` frame (the mask outline) and
replaces the boolean colour-swap rectangle with two layered rectangles — a full-width dark
one (`--symbiote` or `--void`) and a foreground one clipped to `fleetIntegrity%` width,
coloured by the same `COLOR[gradeOf(fleetIntegrity)]` grading `gradeOf()`
(`web/js/format.js` line 38) already produces everywhere else on the console. `syncTitle()`
passes the fleet average instead of the open-incident count.

## Risks

- 16px is small enough that even a two-rectangle composition needs testing at actual
  favicon size, not just at the 32×32 the SVG is authored at — verify in a real browser tab,
  not just by eyeballing the SVG source.
- This idea trades away the current favicon's "something needs attention right now"
  boolean signal for a continuous health readout. The two are different, both useful,
  questions ("is anything broken" vs. "how healthy overall") — worth deciding whether the
  boolean urgency signal is worth preserving as a secondary cue (e.g. the frame colour)
  rather than dropped outright.

## Done when

- [ ] The favicon shows a mask silhouette with one eye-band whose lit width tracks fleet
      average integrity, not a boolean open/closed swap
- [ ] The band's colour matches the same health grading (`healthy`/`degraded`/`critical`)
      used elsewhere on the console
- [ ] Verified legible at actual 16px favicon size in a real browser tab, not just at
      32×32 in the SVG source
- [ ] `syncTitle()` still updates the favicon on every render, unchanged in timing

# UI-05 · Sparkline hover, and the keyboard path

> Hover a point on any sparkline and get that scan's timestamp and integrity; the same pass gives the whole console a keyboard route.

**SHIPPED** — `web/js/sparkhover.js`, `web/css/sparkhover.css`, the grid `keydown` handler in `web/js/app.js`, and the existing replay key handler in `web/js/replay-mount.js`; covered by `test/web-sparkhover.test.js`.

**Status:** OPEN *(absorbs UI-11 — keyboard path)* · **Cost:** small · **Depends on:** nothing
**Touches:** `web/js/sparkline.js`, `web/js/panel.js`, `web/js/sheet.js`, `web/js/replay.js`, `web/css/panel.css`

## What it is

Hovering (or focusing, for keyboard users) a point on a Spider's 24h sparkline shows that
scan's exact timestamp and integrity value in a small tooltip, instead of the chart being
a purely decorative shape. The same handler adds a keyboard route through the whole
console: Tab moves between panels, Enter opens the detail sheet, Escape closes it, and the
arrow keys step Incident Replay and step the sparkline point by point once a panel or the
replay strip has focus.

## Why it earns its place

It reads real data that already exists but is currently thrown away visually.
`sparkline(values, color, scars)` in `web/js/sparkline.js` (line 44) builds a `<polyline>`
and per-point `<circle>` elements from the exact same `sp.series` array `panel.js` passes
in — every point on screen already corresponds to one real run. Right now that
correspondence is implicit; hovering makes it explicit, which is the whole point of the
project's rule that a drawing earns its place by naming the field it reads.

It also closes an accessibility gap for free: the panel is already a `<button>`
(`web/js/panel.js` line 56-64), so it has *some* default focus behaviour today, but
nothing inside it — the sparkline points, the field chips — is independently reachable.
Merging the hover work with the keyboard work is not scope creep; it is one handler
(pointer and focus events resolve to the same "which point is this" question) and one
focus model.

## Mechanism

`sparkline()` (`web/js/sparkline.js` lines 44-87) already computes `pts`, the array of
`[x, y]` pixel coordinates for every value in `points` (line 59), inside a `viewBox` of
`240×44` with `preserveAspectRatio="none"` (line 73). Hit targets are a `map` over that
same array: an invisible `<circle>` or `<rect>` per point, sized generously (the visible
dots are radius 2.5-3, per lines 82 and 84 — the hit target should be larger, closer to
8-10px, since the chart stretches non-uniformly and a precise click is unreliable).

Each hit target carries `data-ts` and `data-integrity` read from the same `values` array
already threaded through, plus (via a small parallel array `panel.js` already has access
to, since `sp.series` is derived from `runs` in `web/js/adapter.js` line 97) the run's
real timestamp. A tooltip — reuse the `.reveal` pattern already built for field chips in
`web/js/received.js` (`revealHTML`, lines 25-34) rather than inventing new tooltip CSS —
shows `clockOf(ts)` and `integrity%` on hover or focus.

For the keyboard path: the panel `<button>` already receives focus by default; the task is
to check what Tab currently does (there is no explicit `tabindex` set anywhere in
`panelHTML`) before adding one, since an unnecessary `tabindex` can break the existing
order. Enter on a focused panel should call the same `openSheet(idx)` that the click
handler in `web/js/app.js` (lines 101-105) calls. Escape already closes the sheet
(`web/js/app.js` line 111, `closeSheet` in `web/js/sheet.js`). Arrow-key stepping for
Incident Replay has a home already: `web/js/replay.js` exposes `replayStep(delta)` (around
line 140-143) which the replay strip's own key handler can call; the sparkline's arrow-key
step is new, walking the same `pts` array index by index.

## Risks

- The sparkline SVG uses `preserveAspectRatio="none"` (confirmed at `sparkline.js` line
  73), so hit-target geometry has to be computed in the same distorted coordinate space as
  the visible points — a naive circular hit target will not match the rendered aspect
  ratio at every panel width. This is the same distortion the feasibility audit flags for
  UI-19; it is milder here because the target is a hover zone, not a drawn character, but
  it is not free.
- Panels resize on window resize (`web/js/app.js` lines 116-122 already debounce a
  resize handler for `markTallCells`), so point positions must be recomputed on resize,
  not just once at render.
- Adding keyboard handling to three semi-independent surfaces (grid, sheet, replay) in one
  pass risks scope creep back toward "medium" — worth timeboxing the replay arrow-key
  piece separately if it turns out to need its own state machine beyond `replayStep`.

## Done when

- [x] Hovering or focusing a sparkline point shows that run's real timestamp and integrity
      — `sparkTipHTML()` reads `sp.series[i]` and `sp.seriesTs[i]`, the same arrays the
      chart is drawn from, and says `time not recorded` rather than inventing a stamp
- [x] Tab reaches every panel in grid order; Enter opens the sheet; Escape closes it — the
      panel is a native `<button>`, so Tab and Enter are the browser's; the grid `click`
      handler in `web/js/app.js` opens the sheet (Enter on a button fires `click`), and the
      document `keydown` handler closes it. No `tabindex` was added to the panel
- [x] Arrow keys step the sparkline point by point when a panel has focus, and step
      Incident Replay when the replay strip has focus — `sparkStep()` from the grid
      handler, `replayStep()` from `web/js/replay-mount.js`. Escape on a focused panel
      clears the cursor without closing anything else
- [x] Hit targets remain accurate across panel resize and across
      `preserveAspectRatio="none"` distortion — the hit targets are `<rect>`s inside the
      same `viewBox`, so they stretch with the chart and need no recompute on resize; the
      tooltip is positioned as a percentage of the same 240-unit space
- [x] No existing Tab order regresses (verified against today's behaviour before adding
      tabindex) — nothing gained a `tabindex`; the only focusable things inside a panel are
      the ones that were already focusable (the panel itself and the reveal chips)

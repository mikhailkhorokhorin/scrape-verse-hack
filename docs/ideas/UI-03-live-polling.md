# UI-03 · Live polling

> The console already re-fetches every 60 seconds; it should show the moment a new scan lands, not just re-render silently.

**Status:** OPEN · **Cost:** small · **Depends on:** nothing (UI-18f rides on top of this once the cast exists)
**Touches:** `web/js/adapter.js`, `web/js/app.js`, `web/js/panel.js`

## What it is

**Already half-built.** `web/js/app.js` (line 128) calls `setInterval(loadLive,
REFRESH_MS)` with `REFRESH_MS = 60000` (`web/js/config.js` line 6), and `loadLive()` in
`web/js/adapter.js` (lines 27-51) already fetches both JSON files with `cache: "no-store"`
and a cache-busting `?t=Date.now()` query param (`fetchJson`, line 5). It already computes
a change signature — `fingerprintOf(history, incidents)` (lines 20-25) — and skips a full
re-render when nothing changed (lines 30-35).

What is missing is the visible part. When the fingerprint *does* change, the console
currently just calls `renderGrid()`, `renderFeed()`, `renderHaul()` and `renderReplay()`
again — a silent full re-render, indistinguishable from a page reload. This idea makes the
arrival of a new scan a small, legible event: the new sparkline point animates in rather
than appearing as if it had always been there.

## Why it earns its place

The change-detection this idea builds on is real, not decorative: `fingerprintOf` reads
`lastRun.ts`, `lastInc.id` and `lastInc.closed_at` directly off the newest records in
`history.json` and `incidents.json` — a genuine "did the data change" check, not a timer
dressed up as one. Animating on top of a signal that already exists is cheap precisely
because the signal is real; there is no new polling logic to build, only a new response to
an event the code already detects.

**Honest caveat, stated in the master list and worth repeating here:** the fleet sits at
100% integrity most of the time, so during judging the most likely landing scan changes
nothing visible in the data itself — same fields, same integrity, a new timestamp. Design
the arrival, not the drama: the payoff of this idea is a console that visibly *breathes*
with new data on a 30-minute cron cadence, not a guarantee that a judge will see a dramatic
state change land live.

## Mechanism

The hook point is `loadLive()` in `web/js/adapter.js`. Today, once the fingerprint differs
(line 36), it reassigns `SPIDERS`/`INCIDENTS`/`RAW_HISTORY` and calls the four render
functions with no distinction from a first load. The fix is to diff the *previous*
`SPIDERS` array against the newly adapted one before overwriting it — for each collector,
compare `sp.ts` (or the newest series value) old vs new — and pass the set of
changed-collector codes into `renderGrid()`.

`renderGrid()` (`web/js/render.js` line 3) rebuilds `grid.innerHTML` from
`SPIDERS.map(panelHTML)` wholesale every time — there is no per-panel patch today. The
minimal version of "animate the arrival" does not require line-level DOM diffing: after
the innerHTML swap, for each changed collector, add a short-lived class
(`.panel--landed`, or similar) to that specific panel via `panelOf(code)` (already exposed
in `web/js/panel.js` lines 118-121) and let CSS handle a brief highlight — a variant of the
existing `burst()` mechanism (`panel.js` lines 103-116) is a reasonable model, since it
already knows how to attach and clean up a transient element on a specific panel.

This is also the hook UI-18f names explicitly: once the rig exists, the same
changed-collector signal is what makes that Spider react instead of a generic panel flash.

## Risks

- Distinguishing "this collector's newest run changed" from "this collector is unchanged"
  requires keeping last-render state somewhere the diff module UI-21 also needs (a
  per-field previous-state map). Building this idea and UI-21's prerequisite module
  together would avoid duplicating that bookkeeping — worth deciding once, not twice.
  UI-21 already calls this out as a real, uncosted dependency.
- A 60-second poll interval against a 30-minute cron means the overwhelming majority of
  polls are no-ops (the fingerprint short-circuit already handles this efficiently) —
  worth confirming the fingerprint check is cheap enough that 1,440+ no-op checks a day is
  not itself a performance concern, though at this data volume it almost certainly is not.

## Done when

- [ ] A genuinely new run for a given collector triggers a visible, brief animation on
      that specific panel, not a silent full re-render
- [ ] An unchanged fingerprint still short-circuits to no visible change, as it does today
- [ ] The animation reads as "a new point landed," not as a state-change alarm (the fleet
      may be 100% before and after)
- [ ] Verified against a real poll cycle, not only by manually mutating `SPIDERS` in the console

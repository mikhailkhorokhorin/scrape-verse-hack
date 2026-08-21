# UI-01 · Opening sequence

> On first load the console demonstrates its own mechanic on real `inc_003` data, roughly six seconds, then settles into the live present.

**SHIPPED** — `web/js/intro.js`, `web/js/intro-plan.js`, `web/css/intro.css`, the `REPLAY INTRO` button in `web/index.html`, covered by `test/web-intro.test.js`.

**Status:** ACCEPTED · **Cost:** medium — the biggest single unbuilt risk on the whole list · **Depends on:** nothing required (build against `--spread`, which exists today); re-timed against the leg collapse only if UI-18a and UI-18b have already landed
**Touches:** `web/js/panel.js`, `web/css/panel.css`, a new small intro-sequencing module, `web/index.html` (masthead `REPLAY INTRO` control)

## What it is

On first load, before settling into the live fleet, the console plays back its own core
mechanic against one real, specific incident — `inc_003` — over roughly six seconds:

```
0.0s   healthy
0.8s   SNAP! — integrity drops
1.6s   symbiote climbs, CRACK!
2.6s   hold                      ← the beat that matters most
3.4s   WEAVE...
4.6s   PURGE!
5.4s   THWIP!
6.0s   live — settles into the real, current fleet state
```

**The hold at 2.6s matters more than the motion around it.** Infection is slow; removal is
violent. That asymmetry — a long, quiet, uncomfortable hold followed by a sudden, loud
recovery — is the emotional argument of the entire product: a scraper does not crash, it
sits broken and unnoticed, and the fix, once it comes, comes all at once. An opening
sequence that rushes past the hold to get to the satisfying burst sooner has missed the
point of building it at all.

## Why it earns its place

It is real data, not staged animation: `inc_003` is an actual incident already recorded in
`data/incidents.json`, with real `integrity_before`/`integrity_after` values and a real
strain classification. The sequence is a demonstration of the mechanic using the mechanic's
actual evidence, which is why the constraints below insist on real data only — a synthetic
break-and-heal would be decoration wearing the product's clothes.

**With the cast, this idea gets stronger without needing to be rebuilt for it.** Once
UI-18a and UI-18b exist, the sequence stops being an abstract mask animation and becomes a
character visibly losing its legs and getting them back — the same six beats, now happening
to something with a face. **But it must not depend on the cast to ship.** The sequence has
to be built today against `--spread`, the symbiote-height custom property that already
exists and already drives the black spread on every panel (`panelHTML()`, `web/js/panel.js`
line 60). Re-timing the hold against a literal leg collapse is a refinement to layer on
*after* UI-18a and UI-18b land, not a prerequisite for the intro to exist. An intro that is
blocked on a full day of rig work is an intro that does not ship — this is the reasoning
behind marking its dependency "nothing required."

## Mechanism

**Playback control:**

- `sessionStorage`, played once per tab — a flag set the first time the sequence completes,
  checked before playing again
- A `REPLAY INTRO` button lives in the masthead, letting a judge (or the developer, during
  a demo) trigger it again deliberately
- `?intro=1` in the URL forces playback regardless of the session flag
- `prefers-reduced-motion` skips straight to the end state — the live fleet, with no
  animated beats — per `docs/DESIGN-SPEC.md`'s global reduced-motion contract

**Why a stored flag and a button, not a smarter reload check:** `cmd+shift+R` clears the
browser's resource cache but not Web Storage, and JavaScript cannot tell the two apart —
`navigation.type` reports `"reload"` for both a soft and a hard refresh. There is no
reliable way to detect "the user wants to see it again" from the reload itself, so the
button exists specifically to cover that gap rather than trying to out-guess the browser.

**Animation building blocks that already exist and should be reused, not reinvented:**

- `--spread` already drives the black's height via the `.symbiote__body` mask
  (`web/css/panel.css` lines 36-44), transitioning over 800ms
  `cubic-bezier(.22,1,.36,1)` — the sequence's `1.6s` "symbiote climbs" beat is this
  transition, sequenced against a fixed value rather than a real integrity read
- `burst(panel, word, color)` (`web/js/panel.js` lines 103-116) already attaches and
  cleans up a transient onomatopoeia element on a specific panel — `SNAP!`, `CRACK!`,
  `WEAVE...`, `PURGE!` and `THWIP!` are all this function, called in sequence, not five
  separate new burst implementations
- The bar fill's existing recovery spring (`docs/DESIGN-SPEC.md` section 5: "On recovery
  the fill overshoots to +4% then settles") and its fast, no-overshoot damage drop are
  already specified timing this sequence should match rather than duplicate with new easing

The sequencing itself — six beats, fixed timings, driving `--spread` and firing `burst()`
calls on a schedule against one specific panel — is new code: a small module (e.g. an
`introSequence()` function) that runs once on load if playback is due, sets `--spread` and
calls `burst()` at the timestamps above, then hands off to the normal `renderGrid()` call
for the live fleet.

**Constraints, non-negotiable per the master list:**

- Real data only — the sequence plays back `inc_003`'s actual before/after integrity and
  strain, not synthetic numbers
- **Skippable by any click, key or scroll, not just a dedicated skip button** — a judge
  who starts interacting with the page mid-sequence should never be blocked by it
- Never blocks interaction — the rest of the page remains usable even while it plays
- Always ends in exactly the state a plain load produces — no divergent "post-intro" state
  that a plain reload does not also reach

## Risks

- **This is the biggest single unbuilt risk on the entire list.** Per the feasibility
  audit: it is the only ACCEPTED item with no part of it already standing — UI-02, UI-04
  and UI-10 all extend or reuse existing mechanisms; this one is new sequencing logic from
  a blank page, at medium cost, with a specific emotional beat (the 2.6s hold) that is easy
  to under-time or over-time without it landing.
- If this idea slips, the diptych (UI-10) is what covers for it — a static two-character
  comparison that demonstrates the same before/after mechanic without needing sequencing
  logic at all. Worth keeping UI-10 buildable independently rather than as a strict
  fallback contingent on this one failing.
- "Skippable by any click, key or scroll" is a real accessibility and UX requirement, not a
  nice-to-have — an intro that traps a judge for six seconds on first load, however good it
  looks, works against the product on the exact metric it is trying to win.
- Re-timing the hold against a literal leg collapse once the cast exists is an easy scope
  trap: it should be a small refinement to the existing timeline, not a rewrite of the
  sequencing logic to be rig-aware from the start.

## Done when

- [x] The full six-beat sequence plays against real `inc_003` data on first load in a
      fresh session — `introBeats()` reads `integrity_before` / `integrity_after` off the
      record `introIncidentOf()` resolves, `inc_003` by id with a worst-drop fallback
- [x] The 2.6s hold is visibly distinct from the surrounding motion — a genuine pause, not
      a blend. The `hold` beat at 2600ms carries no word and no integrity change, leaving
      800ms of silence after `CRACK!` and 800ms before `WEAVE…`
- [x] `sessionStorage` prevents replay within the same tab; `REPLAY INTRO` and `?intro=1`
      both force it regardless — `introDecision()` puts `forced` ahead of `seen`
- [x] `prefers-reduced-motion` skips straight to the live end state with no animated beats
      — the first branch of `introDecision()`, and the sequence is never started at all
- [x] Any click, key press, or scroll during playback ends the sequence immediately and
      leaves the page in the same state a plain load would reach — `INTRO_SKIP_EVENTS`
      binds five capture-phase listeners and `introRestore()` puts the panel back from the
      snapshot taken before the first beat
- [x] The sequence never blocks interaction with the rest of the page while it plays — no
      overlay and no `pointer-events` block; the skip listeners are `passive`, so the click
      that skips also does whatever it was going to do

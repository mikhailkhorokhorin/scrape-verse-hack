# UI-18f · The scan lands on screen

> When polling picks up a new record, that Spider reacts: a step, a head turn toward the new sparkline point, `THWIP!` only if the record carries `after_heal`.

**SHIPPED** — `web/js/rig-react.js`, `web/css/rig-react.css`, driven from `markLanded()` in `web/js/landing.js`; covered by `test/web-rig-react.test.js`.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** small · **Depends on:** [UI-18a](UI-18a-the-rig.md); rides on [UI-03](UI-03-live-polling.md)'s change detection
**Decision (Aug 21):** the per-collector diff this needs is the shared `web/js/delta.js` module, built by whichever of UI-03 / UI-18f / UI-21 enters work first — see the diff-module decision in `docs/TASKS.md`.
**Touches:** `web/js/rig.js`, `web/js/adapter.js`, `web/js/panel.js`

## What it is

When the console's poll picks up a genuinely new run for a given collector, that
collector's character reacts physically: a step, a head turn toward the new point on its
own sparkline, and a `THWIP!` burst — but only if the landing record carries
`after_heal: true`, i.e. only for a verified recovery, not every ordinary scan.

## Why it earns its place

The detection this idea hooks into already exists and is already a genuine data read, not
a timer. `app.js` builds a change signature every poll —
`fingerprintOf(history, incidents)` in `web/js/adapter.js` (lines 20-25) joins
`lastRun.ts`, `lastInc.id` and `lastInc.closed_at` from the newest records in both files —
so "something landed" is detectable today with no new plumbing, only a hook into a line
that already runs on every poll. This idea is that hook, not a new signal: it is UI-03's
"design the arrival, not the drama" made physical, once a character exists to react.

The `after_heal` gate matters for the same honesty reason `docs/CLAUDE.md`'s data contract
insists on: a normal scan and a post-heal verification run are different events, and only
the data contract distinguishes them (`after_heal` is set specifically by a verification
run, per `docs/CLAUDE.md`'s notes on `history.json`). Firing `THWIP!` on every ordinary scan
would cheapen the one it should mean something for.

## Mechanism

`fingerprintOf()` currently produces one fleet-wide string; this idea needs
**per-collector** change detection, not just "did anything change." The natural approach
is the same one UI-03 needs for its own "which panel animates" question and UI-21 needs for
its speech-bubble diff: keep the previous render's per-collector state (at minimum,
`sp.ts` and whether the newest run carried `after_heal`) and compare it against the newly
adapted `SPIDERS` array inside `loadLive()` (`web/js/adapter.js` lines 27-51), before the
existing `SPIDERS = adaptHistory(history.rows)` assignment overwrites it.

Once a specific collector is flagged as newly landed, `panelOf(code)` (already exposed,
`web/js/panel.js` lines 118-121) locates its DOM node, and the rig (via `web/js/rig.js`)
plays a short reaction: a step animation on one leg, a head-turn transform toward the
newest point on that panel's own sparkline (whose position `sparkline()` already computes,
`web/js/sparkline.js` line 84, the `last` point). If the landing record's `after_heal` is
true, additionally call the existing `burst(panel, word, color)` helper (`web/js/panel.js`
lines 103-116) with `"THWIP!"` — the exact mechanism already used elsewhere for
onomatopoeia, reused rather than reinvented.

## Risks

- This idea's per-collector diffing need overlaps directly with UI-03's own requirement
  and UI-21's prerequisite diff module. Building three separate ad-hoc diffs across three
  ideas is real duplicated risk — worth deciding once whether a single small "previous
  render state" module serves all three, rather than each idea inventing its own.
- Depends on UI-18a existing (there is no head to turn without a rig), and is meaningfully
  more useful once UI-03's visible-arrival work exists to trigger from — building this
  before either is built means shipping a reaction with nothing reliable to react to.
- Same honest caveat as UI-03: the fleet sits near 100% most of the time during judging, so
  the ordinary (non-`after_heal`) version of this reaction — a step and a head turn with no
  burst — is what a judge is most likely to actually see live, not the `THWIP!` case this
  idea is really designed around.

## Done when

- [x] A genuinely new run for one collector triggers a physical reaction (step, head turn)
      on that collector's character specifically, not the whole fleet — `markLanded()`
      resolves the one panel through `panelOf(change.code)` and `rigReact()` turns that
      rig toward its own newest sparkline point, converting the point out of viewBox units
      into page coordinates. The stepping leg is chosen by field name from the diff
      (`data-field`), falling back to a seeded index when nothing field-level changed
- [ ] **Half ticked: `THWIP!` fires only when the landing record's `after_heal` is `true`
      — but this has never been verified against real data.** The gate itself is correct
      and unit-tested: `snapshotOf()` carries `sp.afterHeal` from the record's `after_heal`,
      `deltaBetween()` only sets `afterHeal` on a new run, and `markLanded()` bursts on
      nothing else. **There is not one `after_heal: true` record in `data/history.json`.**
      `repair.js` writes the flag on its post-heal verification run, but all three committed
      heals were run outside that path, so the burst has only ever been seen in tests and
      under `?mock=1`
- [x] The reaction reuses the existing `burst()` helper rather than a parallel
      implementation — `burst(panel, "THWIP!", COLOR.healthy)` from `web/js/panel.js`
- [x] Per-collector change detection is shared with (or at least consistent with) UI-03's
      and UI-21's equivalent needs, not duplicated three separate ways — all three read one
      `deltaBetween()` call in `announceLandings()`: UI-21 through `speak()`, UI-03 and this
      idea through `markLanded()`. There is exactly one previous-render snapshot on the page

# UI-21 · The character speaks

> A tailed speech bubble, one line, issued by the character: `"price is gone."` on a field going dead, `"I'm back."` on a verified heal, `"...still here."` on a long clean streak.

**Status:** OPEN *(absorbs UI-07 — speech bubbles)* · **Cost:** small only after the diff module exists; medium counted honestly from today · **Depends on:** UI-18a (a bubble needs a mouth); a new per-field diff module (unbuilt)
**Touches:** `web/js/rig.js`, a new small diff-state module, `web/js/panel.js`, `web/css/panel.css`

## What it is

A tailed speech bubble, set in Bangers per `docs/DESIGN-SPEC.md`'s type scale (sound-FX and
character voice, never UI labels), issued by the character itself rather than floating free
on the panel. One line, tied to a specific state transition:

- `"price is gone."` — a field just went dead
- `"I'm back."` — a verified heal just landed
- `"...still here."` — a long clean streak continues

The symbiote gets the opposite voice when it speaks: lowercase, calm — which, per the
master list, is worse than shouting. Rules that keep this from becoming a mascot gimmick:
one bubble on screen at a time, transitions only (never idle chatter), auto-dismiss under
3 seconds, and no bubble during the opening sequence (UI-01).

This absorbs what was previously filed separately as UI-07 (speech bubbles); the merge
table in `docs/UI-IDEAS.md` states the reason plainly: "a bubble belongs to a mouth.
Without a character it was a floating label." UI-07 does not get its own file because it no
longer exists as an independent idea — everything about it lives here.

## Why it earns its place

Every line this idea can honestly say is a direct restatement of a real state transition:
a field's `stateOf()` result changing to `dead` (`web/js/received.js` lines 36-39), an
incident's `verified` flag becoming true (`adaptIncidents()`, `web/js/adapter.js` line 156),
or `sp.streak` crossing `MIN_STREAK` (`web/js/config.js` line 12, already used by
`streakHTML()` in `web/js/panel.js` lines 76-82). None of these are invented — the rule the
master list draws is exactly the one this idea is built to satisfy: specific lines, tied to
specific transitions, never a generic mascot aside.

## Mechanism

**The prerequisite nobody costed, stated plainly in the master list:** the console
re-renders wholesale on every poll (`renderGrid()` rebuilds `grid.innerHTML` from scratch,
`web/js/render.js` line 34), and the only change-detection that exists today is a
fleet-level signature string — `fingerprintOf()` (`web/js/adapter.js` lines 20-25) answers
"did *anything* change," not "what changed for this field, on this collector." A line like
`"price is gone."` needs the *previous* per-field state to diff against the new one. That
diff module does not exist and has to be built before any bubble can say anything specific
— without it, the only lines available are generic ones, which is exactly the cutesy
failure mode this idea is designed to avoid.

This same need — keeping a previous-render snapshot to diff against — is also named by
UI-18f (to detect which collector just landed a new scan) and implicitly by UI-03 (to
animate only the panel that actually changed). Building one small module that all three
read from, rather than three independent ad-hoc diffs, is the efficient path; this file
does not assume that module is shared, only flags that it should be considered once, since
whichever idea builds it first effectively unblocks the others.

Once the diff exists, the bubble itself mounts near the character's head (depends on
UI-18a existing, for there to be a head to mount near). **There is no tailed-bubble pattern
in the design system to reuse** — `docs/DESIGN-SPEC.md` specifies Bangers for onomatopoeia
bursts only, and the only implementation of that is `.burst` (`web/css/states.css` lines
22-32), a centred, rotated, scale-in/scale-out word with no bubble and no tail. So the
bubble body and its tail are new CSS. What *is* reusable is the lifecycle: `burst()`
(`web/js/panel.js` lines 103-116) already knows how to attach a transient element to a
specific panel and clean it up afterwards, and the Bangers face and the burst easing curves
carry over. Dismissal is a `setTimeout` under 3000ms, matching the stated rule.

## Risks

- **Cost is honestly medium from today, not small.** The master list is explicit about
  this: "small only after the diff module; medium counted honestly from today." Anyone
  scoping this as a quick bubble-CSS task is undercounting it by the diff module's real
  cost.
- Generic fallback lines are the named failure mode if the diff module is skipped or
  rushed — a bubble that can only say something vague defeats the entire justification
  above.
- "One bubble on screen at a time" across three independently-updating panels needs a
  small coordinator (a queue or a most-recent-wins rule) — easy to get wrong in a way that
  either drops real transitions silently or shows two bubbles at once, which reads as a bug.
- Depends on UI-18a for a character to speak from; building the bubble mechanism before the
  rig exists produces exactly the "floating label" problem UI-07 was merged away from.

## Done when

- [ ] A small diff module exists, tracking each field's previous state per collector
      across renders, independent of the fleet-level fingerprint
- [ ] Each of the three example lines fires only on its exact named transition, verified
      against real or realistically simulated data, never as an idle or generic aside
- [ ] At most one bubble is visible at any time across the whole grid
- [ ] Every bubble auto-dismisses under 3 seconds
- [ ] No bubble appears during the UI-01 opening sequence
- [ ] The symbiote's own lines render in the stated lowercase, calm register, distinct
      from the character's Bangers voice

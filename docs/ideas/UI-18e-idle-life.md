# UI-18e · Idle life

> Healthy panels already breathe. Characters need more — a leg re-plants, the body shifts weight, the mask plate catches a highlight, all offset per panel so nothing syncs.

**SHIPPED, one element short** — `rig-plant`, `rig-twitch` and `rig-weight` in `web/css/rig.css`, seeded per panel by `rigSVG()`. The mask-plate highlight was not built; see the last two boxes.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** small · **Depends on:** [UI-18a](UI-18a-the-rig.md), [UI-18b](UI-18b-legs-are-fields.md)
**Touches:** `web/js/rig.js`, `web/css/panel.css` (or a rig-specific stylesheet)

## What it is

Small, continuous idle motion layered onto an otherwise-static character: a leg re-plants
every 6-11 seconds, the body shifts weight slightly, the mask plate catches a highlight.
All periods are prime-ish (deliberately non-round, non-synchronising numbers) and offset
per panel, so no two characters ever move in visible lockstep.

`docs/DESIGN-SPEC.md` section 6 already establishes this principle for the console as a
whole: "Idle is not static. Healthy panels breathe — a 4s `scale(1) -> scale(1.004)` loop.
A completely still dashboard reads as a screenshot in a video." This idea is that same
requirement, extended to a character that now has legs, a body and a mask plate to move
instead of only a whole-panel scale.

## Why it earns its place

This idea itself reads no field in `history.json` — it is honestly closer to the print-
artefact bucket than to the data-driven core of the cast, and the file says so plainly
rather than stretching a justification. Its case rests on craft, not evidence: a rig built
by UI-18a and UI-18b that only ever moves when a field's state actually changes will spend
the overwhelming majority of screen time — every second the fleet sits at or near 100%,
which per UI-03's own honest caveat is most of judging — completely motionless. A still
character reads as a static illustration, undermining the very thing the cast exists to
prove (that this is a living readout, not decoration bolted onto one). Idle life is what
keeps the character legible as a character between the moments its data actually changes.

## Mechanism

Once UI-18a's rig exists with UI-18b's leg pairs attached, idle life is a set of small,
independent CSS animations on sub-parts of the rig, each on its own period and its own
per-panel offset:

- **Leg re-plant** — a small vertical lift-and-settle on one leg at a time, 6-11s period,
  applied via `animation-delay` randomised (deterministically, per panel — see the same
  seeding concern UI-18c raises for blink timing) so different panels' legs never move
  together
- **Body weight shift** — a subtle `transform` on the body group, longer period than the
  legs, small enough not to compete with the panel-level breathe animation already defined
  (`docs/DESIGN-SPEC.md` section 6, "Panel entrance" / breathe row)
- **Mask plate highlight** — a slow, low-opacity gradient or filter sweep across the mask
  plate, the character-scale equivalent of the whole-panel breathe

All of this should compose with, not duplicate, the panel's existing breathe animation —
the rig moves *inside* an already-breathing panel, on independent, non-synchronising
timers.

## Risks

- The single named failure mode, straight from the master list: "A still cast reads as a
  screenshot; a synchronised cast reads as a GIF." Both are real risks and pull in
  opposite directions — too little motion looks static, too-regular motion looks looped.
  The per-panel offset is what threads that needle, and it is easy to build without
  actually verifying the offsets are far enough apart to be visually distinct.
- Three characters, each with several independently-timed sub-animations, is more
  concurrent CSS animation than the console runs anywhere else today — worth folding into
  UI-09's performance pass rather than assuming small individual animations are free in
  aggregate.
- Because this idea carries no data justification, it is a reasonable early cut if UI-09
  finds performance headroom is tight — the cut order in `docs/UI-IDEAS.md` places it
  ahead of UI-18d and UI-18f but behind the data-bearing 18a-18c, which is the right
  ordering for the same reason.

## Done when

- [ ] **Partly done: at least one leg, the body, and the mask plate each carry independent
      idle motion with non-round periods.** Legs and body have it — every live leg runs
      `rig-plant` on the `--rig-sway` period with a per-leg `--rig-delay` in the 6.0-7.0s
      range, and `.rig__body` runs `rig-weight` on the same period. **The mask plate has no
      idle motion.** A slow highlight sweep across `.rig__plate` was left out: at panel
      size the plate is roughly 25px across, and every sweep tried either read as a flicker
      or was invisible. Left unbuilt rather than shipped as noise
- [ ] **Not ticked: no two of the three characters' idle motion visibly synchronises.** The
      blink periods are genuinely distinct (BODEGA 8s, KESTREL 9s, ATLAS 10s), but the
      leg and body rhythm is not. `--rig-sway` is `(seed % 5) + 9` and `--rig-delay` is
      `((seed + i*37) % 11)/10 + 6`; ATLAS (seed 825) and KESTREL (seed 880) collide on
      **both** — same 9s period and the same per-leg offsets 6.0 / 6.4 / 6.8 / 6.1 / 6.5.
      Two of the three characters re-plant their legs in lockstep. BODEGA (13s, different
      offsets) is clear of both. This is a real defect in the seeding, not a wording
      quibble; it is left unfixed here because this is a documentation pass, and the fix is
      a wider modulus on `seedOf`'s two consumers
- [x] Idle motion composes with the existing panel-level breathe animation without visual
      conflict — the rig animations are on SVG sub-groups with `transform-box:fill-box`
      inside the panel, so they compose with rather than override the panel's own transform
- [x] Included in UI-09's performance pass — pass 1 held 76fps with 82 animated rig parts
      on screen
- [x] Respects `prefers-reduced-motion` per `docs/DESIGN-SPEC.md`'s global reduced-motion
      rule — `web/css/rig.css` cancels `.rig__leg`, `.rig__eye` and `.rig__body` animations
      under the query

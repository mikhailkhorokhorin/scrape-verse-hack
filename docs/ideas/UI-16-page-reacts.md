# UI-16 · The page reacts to fleet health

> The symbiote does not stay inside the panels — it pools on the page itself, and the ground should darken and coarsen as fleet integrity drops.

**Status:** OPEN · **Cost:** small, not medium (re-scoped down from an earlier estimate) · **Depends on:** nothing (the fleet-wide symbiote layer already exists)
**Touches:** `web/css/fleet.css`, `web/js/render.js`, `web/css/tokens.css`

## What it is

Fleet-wide infection is already partly visible: a fixed, full-page symbiote layer sits
behind and between the panels, driven by average fleet integrity rather than any single
collector's state. What is not yet built is the rest of the page's reaction to that same
number — the void background growing darker and the halftone dot texture coarsening as the
fleet average degrades, so a bad day reads in the page itself, not only in the fixed
symbiote pool.

## Why it earns its place

The mechanism this idea extends is already a real data read, not a new one. `renderGrid()`
in `web/js/render.js` computes `avg`, the mean integrity across `SPIDERS` (line 32), and
`setFleetSpread(avg)` (lines 68-73) already converts it into a `--fleet` CSS custom
property on `#fleet-sym`, consumed by `.fleet-symbiote__body`'s mask in
`web/css/fleet.css` (lines 6-16). This idea reads the exact same number for two more
surfaces — ground darkness and halftone density — rather than inventing a second metric.
Per the project's central rule, that is what keeps it in the "reads a field" camp rather
than the decoration bucket.

## Mechanism

**Re-scope before starting: do not rebuild what exists.** `web/css/fleet.css` already
carries the fleet-wide symbiote layer from T-17, and it works — a `radial-gradient` mask
on `.fleet-symbiote__body`, sized by `--fleet` and transitioning over 1100ms
(`web/css/fleet.css` lines 6-15). This idea is additive, not a redesign of that layer.

Two remaining surfaces, both already token-driven:

- **Ground darkening.** `body` background is `--void` (`web/css/tokens.css` line 26); the
  design already reserves `--void` and `--void-2` for a diurnal (UTC-time-of-day) shift
  per `docs/DESIGN-SPEC.md`'s "Diurnal ground" section — that rule states explicitly "only
  `--void` and `--void-2` shift — no other token moves." Fleet-health darkening has to
  compose with that constraint, not fight it: rather than swapping the token itself,
  apply a separate, low-opacity dark overlay (a new fixed layer, sibling to `#fleet-sym`,
  or a `mix-blend-mode: multiply` layer) whose opacity is driven by the same `--fleet`
  value, so the diurnal shift and the health reaction are independent, composable layers
  instead of two writers fighting over the same two tokens.
- **Halftone coarsening.** The page's base halftone is `body::before`
  (`web/css/tokens.css` lines 35-39): `radial-gradient(var(--void-dot) 1px,transparent
  1.4px)` at `background-size: 4px 4px`. Coarsening as the fleet degrades means growing
  that `background-size` (and optionally the dot radius) toward a maximum as `--fleet`
  rises — set as a CSS custom property on `body` (`--fleet-dot`, e.g.) from the same
  `setFleetSpread()` call already touching `#fleet-sym`, consumed by a `background-size:
  var(--fleet-dot, 4px) var(--fleet-dot, 4px)` rule.

Both additions read the same `--fleet` value already computed once per render; no new
polling or computation is required.

## Risks

- The diurnal-ground rule and this idea both want to touch how dark the page reads, on two
  independent axes (time of day vs. fleet health). If they are not built as separate
  composable layers, one will silently override the other and the diurnal cycle — itself
  marked low-priority and optional in `docs/DESIGN-SPEC.md` — could break invisibly the
  day this idea ships.
- Coarsening halftone that far interacts with contrast: `docs/DESIGN-SPEC.md`'s diurnal
  section already requires AA contrast to be checked at both time extremes; adding a
  second darkening axis means contrast has to hold at the worst combination of both (deep
  night *and* critical fleet), not just each independently.
- Because the fleet sits near 100% most of the time (the same caveat UI-03 names), this
  effect will be nearly invisible during most of judging — worth the same honesty check as
  UI-03 about how much of the payoff a judge will actually see live.

## Done when

- [ ] Page ground darkens measurably as fleet average integrity drops, without
      overriding the existing diurnal `--void`/`--void-2` shift
- [ ] Halftone dot size/density visibly coarsens at low fleet integrity and returns to
      baseline at 100%
- [ ] Both effects read the same `--fleet` value `setFleetSpread()` already computes — no
      second, parallel calculation
- [ ] AA text contrast holds at the worst combination of time-of-day and fleet-health
      darkening
- [ ] No change to the existing `.fleet-symbiote` mask mechanics in `web/css/fleet.css`

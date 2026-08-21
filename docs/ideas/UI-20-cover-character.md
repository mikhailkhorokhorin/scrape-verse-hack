# UI-20 · Cover character in the masthead

> One large character drawn from fleet state rather than a single collector — standing and inked when the fleet is clean, half-taken when anything is critical.

**Status:** OPEN, contested space · **Cost:** medium, and it is the first medium to cut · **Depends on:** UI-18a (for a consistent art system); contests the masthead slot with UI-04
**Touches:** `web/index.html` (masthead), `web/js/rig.js`, `web/js/masthead.js`

## What it is

A single large character in the masthead, drawn not from one collector's telemetry but
from the fleet as a whole: standing and fully inked when every Spider is clean, visibly
half-taken by the symbiote when anything in the fleet is critical. Where the per-panel
rig (UI-18) makes each collector's own state legible, this idea would make the *fleet's*
state legible at a glance, before a judge has scrolled to a single panel.

## Why it earns its place

If built, it would read the same fleet-average signal `setFleetSpread()` already computes
(`web/js/render.js` lines 32 and 68-73) and the fleet-wide symbiote layer already consumes
(`web/css/fleet.css`) — the same number UI-16 proposes reading for page-ground darkening.
That is a real data source, not an invented one, and it is the reason this idea is filed as
OPEN rather than REJECTED.

## The honest problem, stated in the master list and unresolved

The masthead is already carrying a lot: the wordmark, the tagline, four readouts (fleet
integrity, last scan, mean re-weave, watch — confirmed in `web/index.html` lines 47-70),
the pulse line directly under it, and UI-04 wants a fifth line of evidence text in the same
block. A cover figure competes with all of that for the same limited space, and the most
likely loser is the evidence line, which — per UI-04's own justification — is the cheapest
credibility available on the whole list and the only idea that also scores in Best Code.
Adding a large character to a masthead already this dense risks winning a visual flourish
at the cost of the argument that this is a real, working product.

**This is explicitly undecided.** The master list states the choice has to be made before
any drawing starts: either the figure replaces the tagline block, or this stays unbuilt.
Nothing in `docs/UI-IDEAS.md` resolves which. This file inherits that as an open decision
rather than making it — see Risks.

## Mechanism

If pursued, this would most plausibly reuse the rig's per-part construction from UI-18a
(body, mask, eyes, legs, parameterised) at a larger scale, driven by fleet average
integrity through the same `gradeOf()` banding (`web/js/format.js` line 38) rather than a
single collector's `statusOf()`. It would need its own art direction pass, since "drawn
from three collectors at once" is a different design problem than "one collector, one
character" — there is no obvious single silhouette that represents an average of BODEGA,
ATLAS and KESTREL.

## Risks

- **The slot decision is the actual blocker, not the art.** Until someone decides whether
  this replaces the tagline block or does not get built, any time spent drawing the
  character risks being thrown away.
- It is explicitly named as the first medium-cost item to cut if time runs short — this is
  not a hedge, it is the master list's own prioritisation, and this file should not be read
  as advocating to build it ahead of anything ranked above it.
- Competing directly with UI-04 for the same masthead space, when UI-04 is both cheaper and
  more directly tied to the "prove this is real" argument the project is making, is a real
  argument for resolving this as "stays unbuilt" rather than searching for a way to fit
  both.

## Done when

*(Contingent on the slot decision being made first — none of the below should be started
until it is.)*

- [ ] A decision is recorded: either the figure replaces the tagline block, or this idea is
      marked cut, not left ambiguous
- [ ] If built: the character's state (inked vs. half-taken) is driven by fleet-average
      integrity via the same computation `setFleetSpread()` already performs, not a second,
      parallel calculation
- [ ] If built: it does not visually or spatially displace the evidence line from UI-04
- [ ] If built: verified at 375px as part of UI-09's phone pass

# UI-09 · Phone pass

> A gate, not a feature: nobody has checked what the pulse, the heatmap or THE HAUL do at 375px, and it is cheaper to find out early than to find out from a judge.

**Status:** OPEN · **Cost:** small · **Depends on:** run once after UI-18a lands, again before submitting

## What it is

A deliberate pass through the console at a 375px viewport (the narrowest common phone
width), checking every surface that has not been built with mobile in mind by
construction: the fleet pulse line, the field heatmap, THE HAUL section, and — once
built — the character rig with its animated legs, blinking eyes and turbulence-filtered
symbiote.

This is not a feature with its own UI. It is a checklist run against the live build, twice:
once as soon as UI-18a (the rig) lands, and again immediately before submission.

## Why it earns its place

`docs/DESIGN-SPEC.md` section 7 states responsiveness is required — "a judge may open it
on a phone" — and section 7 already specifies the responsive contract (single-column grid
below 768px, tilt disabled below 768px, panels collapse to full width). This idea does not
add new data-driven visuals; it verifies that everything else in this list still reads
correctly at the smallest size a judge might actually use, which is a precondition for
every other idea's claims about legibility.

It is also the only item on the list that can **reject work already done**. A judge
opening a Discord-shared link on a phone and seeing a broken layout costs more than any
individual animation gains — this is downside protection, not upside.

## Mechanism

This is a verification pass, not a build. Checklist, run in a real mobile viewport (375px,
via browser devtools device emulation or an actual phone, not just a narrowed desktop
window):

- Fleet pulse line (`web/css/pulse.css`) and field heatmap (`web/css/heat.css`) legible
  and not clipped at 375px
- THE HAUL section readable without horizontal scroll
- Every panel collapses to the single full-width row `web/css/sizes.css` and the `@media
  (max-width:767px)` rule in `web/css/panel.css` (line 13) already specify — confirm it
  actually does, not just that the CSS exists
- **Performance, not just layout.** `filter: url(#symbiote-turbulence)` (defined once in
  `web/index.html`, applied per-panel in `web/css/panel.css` line 34 and fleet-wide in
  `web/css/fleet.css` line 3) is, per the feasibility audit, the single most expensive
  effect on the page. It already runs on every infected panel plus the fleet-wide layer
  before any character work lands. Once UI-18a's animated legs, UI-18c's blinking eyes and
  (if built) UI-19's crawler stack on top, the same filter is doing more concurrent work on
  a much weaker GPU. Profile frame rate at 375px, not just visual correctness.
- An eight-legged character's silhouette at panel size, once UI-18a exists — the audit
  notes this is "either a strong silhouette or an ink smudge, and it is cheaper to find out
  early" than after the rest of the cast is built on top of it.

## Risks

- Skipping the first pass (right after UI-18a) and only running it before submission risks
  discovering a fundamental silhouette or performance problem too late to redesign the rig
  around it — the whole reason this is scheduled twice, not once.
- "Small" cost assumes the pass finds nothing requiring rework. If it finds the turbulence
  filter is unusable on mobile GPUs, the fix (a lighter-weight or conditionally-disabled
  filter below a viewport threshold) is a real, uncosted follow-up.

## Done when

- [x] Run once, immediately after UI-18a lands, against a real 375px viewport — **pass 1 done
      Aug 21**, Chromium at 375x812 against live data. No horizontal scroll
      (`scrollWidth` 360 against a 375 viewport). Rig silhouettes render 148-260px wide and
      read as spiders, not smudges. **76fps sustained** with six turbulence-filtered layers
      and 82 animated rig parts on screen, so the audit's performance worry did not
      materialise. The only elements extending past the viewport are `.fleet-symbiote` and
      its body, which are deliberately `inset:-20px` and `pointer-events:none`.
- [ ] Run again immediately before submission, against the final build
- [ ] Every surface in the checklist above confirmed legible with no horizontal scroll
- [ ] Frame rate at 375px with all animated symbiote layers active is acceptable (no
      visible stutter during a normal interaction pass)
- [ ] Any failure found is either fixed or explicitly logged as a known limitation before
      submission — not silently left broken

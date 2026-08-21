# UI-10 · Diptych above the grid

> A healthy Spider and a taken one side by side, both from real history — the two characters, and the legend, drawn.

**Status:** ACCEPTED · **Cost:** small once [UI-18a](UI-18a-the-rig.md) exists · **Depends on:** UI-18a (better with it; the idea can also render without a rig, as a plain two-panel comparison)
**Touches:** `web/js/render.js`, `web/index.html`, `web/js/panel.js`, `web/css/layout.css`

## What it is

A two-panel comparison placed above the grid: one Spider rendered at full health, one
rendered mid-incident, both drawn from real, already-recorded history rather than
synthesised for the purpose. One line of caption under each names the date and the
incident, so it reads unmistakably as the past, not a live state a judge might mistake for
the present fleet.

## Why it earns its place

**The data is confirmed present, not assumed.** `data/history.json` holds real runs on 21
Aug where KESTREL and BODEGA both dropped to 0% integrity and ATLAS dropped to 90%,
alongside their surrounding 100% runs — verified directly against the committed data:
KESTREL at 0% at `04:43:39Z` and `05:13:45Z`, ATLAS at 90% across a run of six consecutive
scans from `05:13Z` to `06:39Z`, and BODEGA at 0% across four scans from `07:02Z` to
`08:35Z`, all on 2026-08-21. Neither half of the diptych has to be staged or synthesised —
both are drawn straight from committed records.

**With the cast, this becomes more than a fallback for UI-01 — it becomes the legend,
drawn.** The existing `<aside class="legend">` in `web/index.html` (lines 55-99) already
explains the states in prose and colour swatches. Once UI-18a's rig exists, the diptych is
the same explanation made physical: one creature standing, one creature failing, side by
side, with no animation required to convey it. That also makes it the one idea on the list
that **survives `prefers-reduced-motion` untouched** — it needs no motion to make its
point, unlike UI-01's sequence or UI-18f's reactions.

## Mechanism

Placed above the grid, most naturally between the masthead's pulse line and the `THE
WATCH` section header (`web/index.html`, near line 74-78), or as a distinct new section
with its own heading in the same caption-box style UI-08 proposes for the rest of the page.

Both halves reuse `panelHTML()`'s own rendering (`web/js/panel.js` line 3) rather than a
parallel implementation: build two synthetic spider objects — one from the identified
healthy run, one from the identified 0%/90% run — shaped exactly like the objects
`adaptHistory()` produces (`web/js/adapter.js` lines 84-105: `code`, `universe`, `ts`,
`integrity`, `fields`, `fieldOrder`, `sample`, etc.), sourced from the specific real records
above rather than invented values, and pass each through the same `panelHTML()` call the
live grid uses. This guarantees the diptych visually matches the real panel styling exactly
— same badge, same bar, same symbiote mechanics — with no second rendering path to keep in
sync.

The one-line caption under each half is new: the record's real date and, where applicable,
the incident id it corresponds to (cross-referencing `data/incidents.json` for the matching
`opened_at`), styled as a small mono caption distinct from the panel's own chrome so it
reads as an external annotation, not part of the panel itself.

**Note the shared risk with UI-02:** both ideas need to build a synthetic spider object
from a fixed historical record and feed it through `panelHTML()`. Worth building one small
shared helper for "construct a display-only spider object from a specific history record"
rather than two independent implementations that could drift apart as `panelHTML()`'s
expected shape evolves.

## Risks

- Depends on `panelHTML()`'s expected input shape staying stable, or at least on the
  synthetic-object helper being updated alongside it — a silent mismatch would render a
  broken or misleading panel for what is supposed to be the clearest, most legible part of
  the page.
- The specific historical runs cited above are fixed, real records; if `data/history.json`
  is ever pruned or capped more aggressively (the data contract already caps history
  length per collector), the exact records this idea points at could roll off and need
  re-selecting. Worth picking records with some margin, or re-verifying at build time
  rather than hard-coding a specific timestamp with no fallback.
- Without UI-18a, this is a smaller idea — a real but plainer before/after panel
  comparison, still small cost, still worth building, just without the "creature standing
  vs. creature failing" framing the cast adds.

## Done when

- [ ] Two real historical records — one healthy, one at or near 0% integrity — render side
      by side using the exact same `panelHTML()` path the live grid uses
- [ ] Each half carries a caption naming its real date and, where applicable, the incident
      it corresponds to
- [ ] Neither half is synthesised data — both trace to specific, verifiable records in
      `data/history.json`
- [ ] Fully static — no animation required to convey the comparison, and it renders
      identically with `prefers-reduced-motion` set
- [ ] Placed above the grid, visually distinct from a live panel so it cannot be mistaken
      for the current fleet state

# UI-06 · Panel numbers

> A small `1` `2` `3` in the corner of each Spider panel, in ink.

**Status:** OPEN · **Cost:** trivial · **Depends on:** nothing
**Touches:** `web/js/panel.js`, `web/css/panel.css`

## What it is

Real comic panels are numbered in the gutter, usually small and unobtrusive. Each Spider
panel gets the same: a one-digit number in the top or bottom corner, `--t-micro` size, ink
colour, no border or background — a printer's mark, not a badge.

## Why it earns its place

It is not data-driven in the sense the project's central rule cares about — the number is
the panel's position in the grid, not a read of `history.json`. It earns its place on
craft grounds instead: it is a one-line cost that makes the grid read as a laid-out comic
page rather than a card grid with comic styling painted over it, which is exactly the
distinction `docs/DESIGN-SPEC.md` section 1 draws between "ink over glow" as a texture and
as a genuine print convention.

Because it costs almost nothing, it is one of the few ideas on the list worth doing even
though it does not pass the "reads a field" test — the print-artefact bucket (UI-13) is
where purely typographic ideas are supposed to live, and this is small enough to sit
alongside it without competing for the same budget.

## Mechanism

`panelHTML(sp, idx)` in `web/js/panel.js` (line 3) already receives `idx`, the panel's
position in the `SPIDERS` array, and already writes it into `data-idx` on the `<button
class="panel">` element (line 58). This idea reuses that same value for display: add a
`<span class="panel__no">` immediately inside the panel, before or after `.phead`,
containing `idx + 1`.

Styling is a handful of lines in `web/css/panel.css` alongside the other panel-chrome
rules (`.phead`, `.badge` etc. start at line 56): absolute-positioned in a free corner,
`font-family: "IBM Plex Mono"` to match the rest of the console's numerals, `opacity`
low enough to read as a mark rather than a label. On the compact panel (`.panel--compact`,
`web/css/sizes.css` line 4) there is little free space, so the number should sit inside
the existing padding rather than adding a new row.

## Risks

- Low risk. The only real failure mode is placing it somewhere it collides with the
  status badge or the symbiote overlay at small panel sizes — worth a quick check at the
  compact size and again under UI-09's phone pass.
- Because it carries no data, it is also the first thing to cut if time runs short and the
  corner is needed for a different indicator later (a scan-landed flash, for instance).

## Done when

- [ ] Every panel shows its 1-based grid position in a fixed corner
- [ ] The number does not overlap the badge, the symbiote, or (once built) the rig
- [ ] It survives the compact, big and mobile panel sizes without repositioning logic
- [ ] It reads as a print mark (small, ink, low-opacity) and not as a new UI label

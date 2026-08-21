# UI-18b · Legs are fields

> Each expected field owns a mirrored pair of legs. A Spider at 50% integrity is standing on half its legs, and it looks like it.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** medium, and only after [UI-18a](UI-18a-the-rig.md) · **Depends on:** UI-18a
**Touches:** `web/js/rig.js`, `web/js/panel.js`, `web/css/panel.css`

## What it is

Every field a collector is expected to return owns a mirrored pair of legs, in
`sp.fieldOrder` order. Four fields means four leg pairs, eight legs total. ATLAS watches
five fields, and rather than becoming a ten-legged mistake, its fifth pair renders as
pedipalps — the short front leg-like appendages a real spider has anyway — so every
character stays visibly an eight-legged spider while ATLAS is still legibly the collector
doing the most work.

Each leg's posture is driven directly by that field's current state:

| Field state | Leg |
|---|---|
| `LIVE` | planted, load-bearing, slow breathe |
| `INFECTED` | still planted, twitching off-rhythm at the infected-chip 2s cadence |
| `DEAD` | limp — the joint gives, the leg hangs, ink drains to `--symbiote` |

## Why it earns its place

This is, in the master list's own words, "the single strongest idea in the file: the
mascot is a bar chart nobody has to be taught to read." It reads `sp.fieldOrder` — the
array `adaptHistory()` already builds per collector from `latest.fields_expected`
(`web/js/adapter.js` line 72) — and each leg's state comes directly from `stateOf(sp,
field)` (`web/js/received.js` lines 36-39), the exact function `chipHTML()` already calls
to render the field chips a big panel shows today (`panel.js` line 10). The leg is not a
second, independently-computed signal; it is the same LIVE/INFECTED/DEAD classification
the chips already display, drawn as a limb instead of a badge.

This directly answers the project's own framing: a healthy compact panel has no chips at
all today, so the panels a judge sees first currently show *no* field-level diagnosis. The
rig gives that same diagnosis a body, on exactly the panels that were emptiest.

## Mechanism

**Placement, decided in the master list so it does not collide later:**

- On a **compact** (healthy) panel, the rig *is* the body of the panel — nothing else
  competes for that space, since `panelHTML()`'s compact branch (`web/js/panel.js` lines
  32-39) renders only sparkline, note, streak and a bar/readout footer.
- On a **big** (degraded/critical) panel, the panel is already full — integrity readout,
  sparkline, note, bar, chips, last scan, symbiote (`panel.js` lines 40-51). There the rig
  sits *behind* the content as an ink watermark, below `.symbiote` in z-order (`.symbiote`
  is already `z-index:1` and `.panel > *` is `z-index:2`, `web/css/panel.css` lines 25-26 —
  the rig watermark needs its own layer under both). **The chips stay.** They carry the
  expected-vs-received reveal built for T-36 (`revealHTML()`, `web/js/received.js` lines
  25-34) — real, specific evidence a leg's silhouette cannot replace, only echo.

Leg-to-field mapping: `sp.fieldOrder` is already a stable, ordered array per spider
(`adaptHistory()`, `web/js/adapter.js` line 72 sets it from `latest.fields_expected`) — the
rig assigns leg pair `i` to `fields[i]` in that order, so the mapping needs no re-derivation
per render and stays stable across scans as long as the expected-field set does not change.
ATLAS's fifth field maps to the pedipalp pair specifically, not a ninth/tenth leg — this is
the correction the feasibility audit made explicit after a ten-legged version briefly
existed in the doc and was rejected (see REJECTED table: "ten reads as a mistake, not as a
signal").

Each leg's posture is a small CSS state machine keyed by the same three words
`stateOf()` returns (`live` / `infected` / `dead`), driven by a `data-state` attribute or a
per-leg class the rig SVG sets when `rigSVG()` builds it — the infected twitch cadence
should literally reuse the existing `chip-pulse` 2s timing (`web/css/panel.css` line 109)
so a field's chip and its leg stay visually synchronised.

## Risks

- Medium cost, and explicitly gated on UI-18a landing first — there is no leg rig without
  a body to attach it to.
- The pedipalp special-case for ATLAS's fifth field is a one-off in the mapping logic;
  worth writing as an explicit, commented exception rather than a general "N > 4" rule that
  could silently misbehave if a fourth collector or a different field count is added later.
- The compact-panel-as-rig-body placement means the rig has to be legible at the smallest
  panel size the design specifies — this is exactly the case UI-09's phone pass exists to
  catch.

## Done when

- [ ] Each field in `sp.fieldOrder` maps to one mirrored leg pair, in order, with no
      re-derivation of the mapping outside what `fieldOrder` already provides
- [ ] Leg posture (planted / twitching / limp) matches that field's live/infected/dead
      state exactly, with the infected twitch on the same 2s cadence as the chip pulse
- [ ] ATLAS's fifth field renders as a pedipalp pair, not a ninth/tenth leg, on every
      character every time — never a generic "extra field" fallback
- [ ] On a compact panel the rig is the panel body; on a big panel it sits behind content,
      below `.symbiote` in z-order, with field chips still present and unreplaced
- [ ] Verified legible at 375px as part of UI-09's phone pass

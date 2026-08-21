# UI-23 · The cast in the detail sheet

> That Spider's character at the top of the detail sheet, each leg labelled with its field name — the leg-to-field mapping stated once, explicitly, where a curious judge actually goes to check it.

**SHIPPED, with one deliberate change of form** — `web/js/sheet-rig.js` and `web/css/sheet-rig.css`, mounted by `openSheet()` above the field-diagnosis section. The mapping is stated as a named chip per field beside the character rather than as `<text>` labels drawn on each leg: at the size the sheet renders the rig (200×122), ten 6px labels around eight-to-ten legs collided with each other and with the legs they annotate. The chips carry the same `sp.fieldOrder` order and each field's live / infected / dead state, so the fact is stated, just not as leader lines.

**Status:** SHIPPED · **Cost:** small, once [UI-18a](UI-18a-the-rig.md) exists · **Depends on:** UI-18a, UI-18b (for the leg-to-field mapping)
**Touches:** `web/js/sheet.js`, `web/css/sheet.css`

## What it is

Spider Detail (the modal sheet opened by clicking a panel — `openSheet(idx)`, `web/js/
sheet.js` lines 73-111) already lists a per-field track for every expected field. This idea
puts that Spider's character at the top of the sheet, with each leg explicitly labelled
with the name of the field it represents, so the mapping UI-18b establishes visually on the
grid is restated once, in words, in the one place a curious judge who wants to check their
own reading of the rig actually goes to look.

## Why it earns its place

It does not read any data the sheet does not already display — `trackHTML(sp, field)`
(`web/js/sheet.js` lines 18-38) already renders one row per field with its name, its
current state colour, its fill rate and its expected-value description, driven by
`sp.fieldOrder` and `sp.tracks`, the same data UI-18b's leg mapping uses. This idea's value
is documentary, not evidentiary: it turns a visual pattern a judge might notice but not be
certain of ("is that leg really tied to `price`?") into a stated fact, in the exact spot
someone goes to double-check a reading. Per the master list's own framing, it "turns a
clever visual into a documented one."

## Mechanism

`openSheet(idx)` builds the sheet body as one large `innerHTML` assignment (`web/js/
sheet.js` lines 82-103), starting with `.sheet__head` (name, universe, score) and
`factsHTML(sp, integ)` (collector id, runs, streak, healed count — lines 54-71). This idea
adds a rig render — the same `rigSVG(sp, st)` UI-18a's module exposes — near the top of
that block, sized for a detail view rather than a panel (larger, since the sheet has much
more room than a grid cell).

The label-per-leg addition is new: rather than (or in addition to) the rig's normal
render, the sheet-context version annotates each leg with the field name it maps to, using
the exact same `sp.fieldOrder`-to-leg-index mapping UI-18b establishes (in order, four
pairs for a four-field collector, ATLAS's fifth field to the pedipalp pair) — no separate
mapping logic, just a label pass over the same assignment. This could be literal `<text>`
elements in the SVG near each leg, or an HTML overlay positioned against the rendered SVG,
whichever the rig module's structure makes cleaner once UI-18a exists.

The existing `trackHTML()` field rows stay exactly as they are below the character — this
idea adds a labelled illustration above the existing detail, it does not replace the
detail itself.

## Risks

- Entirely blocked on UI-18a and UI-18b's leg-to-field mapping being final; building this
  before either exists means guessing at a mapping that might change.
- A rig detailed enough to read well at panel size might not automatically read well
  enlarged in a sheet — different failure mode than UI-09's phone-size concern, but a real
  one: check legibility at the sheet's actual rendered size, not just assume "bigger is
  easier."
- Labelling every leg adds text elements to an already-detailed SVG; keep label styling
  restrained (small, `--dim`, mono per the console's existing numeral convention) so it
  reads as an annotation, not competing UI.

## Done when

- [x] The Spider's character renders at the top of its detail sheet, above the existing
      field-diagnosis section — verified in a browser: the rig sits above all five `.track`
      rows in DOM order
- [x] Every leg is labelled with the exact field name it maps to, using the same mapping
      UI-18b establishes on the grid — no separate or inconsistent mapping — **as chips, not
      as labels on the legs themselves** (see the status note). `sheetRigHTML()` walks the
      same `sp.fieldOrder` the rig does, so there is no second mapping to drift
- [x] ATLAS's pedipalp pair is labelled correctly for its fifth field, not left unlabelled
      or mislabelled as a ninth leg — ATLAS renders ten leg paths and five named chips, and
      the copy names the pedipalp pair explicitly when a collector watches five fields
- [x] Existing `trackHTML()` per-field rows remain unchanged below the character — five
      tracks still render, untouched
- [x] Legible at the sheet's actual rendered size on both desktop and the 375px case UI-09
      checks — measured at 375, 768 and 1440: the rig renders 200x122 on desktop and 300x140
      in the single-column layout below 640px, the chip row wraps to two lines, and the rig
      contributes no horizontal overflow (removing it from the DOM leaves the sheet's 4px
      scroll unchanged — that belongs to the deliberately-offset `.sheet__close` button and
      predates this idea)

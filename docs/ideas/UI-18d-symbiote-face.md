# UI-18d · The symbiote gets a face

> Teeth and eyes added to the existing black-spread mechanism, so infection reads as something arriving, not just a fill level.

**SHIPPED** — `web/js/symbiote.js` (`symbioteHTML()`, called from `panelHTML()`) and `web/css/symbiote-face.css`.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** small, now that the mechanism is known · **Depends on:** nothing (rides the existing symbiote mechanism, independent of the rig)
**Touches:** `web/css/panel.css`, a small addition to `web/js/panel.js`

## What it is

Two additions to the existing black-spread ("symbiote") panel effect, both riding CSS
custom properties that already exist:

- **Teeth** — a thin strip pinned at the leading edge of the black, shaped by a repeating
  `clip-path` zigzag, filled `--symbiote`. It sits inside the same filtered layer as the
  rest of the substance, so it inherits the turbulence displacement and reads as one
  material rather than two.
- **Eyes** — a small SVG pair, absolutely positioned inside the black, revealed only once
  the substance has drowned enough of the panel to plausibly hide a face — which the panel
  already flags today via a `data-drowned="1"` attribute.

Infection currently reads purely as a fill level rising up a panel. This gives that fill a
face, so it reads as something *arriving* rather than a bar filling.

## Why it earns its place

This is a direct extension of a mechanism that already exists and already reads real data:
the black's height is `--spread`, computed from `(100 - integrity) / 100` and capped at
`MAX_VISIBLE_SPREAD` (`panelHTML`, `web/js/panel.js` line 7), and it is set as an inline
custom property on the panel button (`panel.js` line 60). The `data-drowned="1"` attribute
this idea reuses for the eyes is likewise already computed — `panel.js` line 60 sets it
whenever `spread > PAPER_SPREAD` (0.5, defined in `web/js/config.js` line 21) — so the eyes
appear exactly when the console already considers the panel "drowned," with no new
threshold and no new comparison. Both additions are decoration *of* a real signal, not
decoration instead of one.

## Mechanism

**What the feasibility audit corrected, and why it matters:** the symbiote is not a shape
that can have features cut into it directly. It is a full-panel `<div class="symbiote">`
(`web/js/panel.js` line 61) containing a `.symbiote__body`, masked by a `linear-gradient(to
top, ...)` sized by `--reach: calc(var(--spread,0) * 100%)` (`web/css/panel.css` lines
36-44), the whole thing displaced by `filter: url(#symbiote-turbulence)` applied to the
outer `.symbiote` wrapper (`web/css/panel.css` line 34, filter defined once in
`web/index.html`). You cannot cut teeth into a `linear-gradient` mask — there is no shape
to modify, only a threshold. The original framing of this idea ("cut teeth into the mask")
does not survive contact with the actual CSS, which is why it is rewritten as two additions
instead of one modification.

**Teeth**, correctly scoped: a new element inside `.symbiote` (so it inherits the parent's
`filter: url(#symbiote-turbulence)` and displaces along with everything else — *this is the
detail to watch*, per the master list: the teeth must sit inside the filtered layer or the
substance visibly splits into two materials, one turbulent and one not), positioned with
`bottom: calc(var(--spread) * 100%)`, filled `--symbiote`, its top edge shaped with a
repeating `clip-path` zigzag (a `polygon()` with a repeated sawtooth, or a CSS
`clip-path` built from a small repeating unit).

**Eyes**, correctly scoped: a small absolutely-positioned SVG pair, mounted inside
`.symbiote__body` or the `.symbiote` wrapper, shown only when the panel carries
`data-drowned="1"` — a plain CSS selector, `.panel[data-drowned] .symbiote-eyes { display:
block }` or similar, no JS branching needed since the attribute is already present or
absent in the markup `panelHTML()` emits.

## Risks

- The turbulence-filter detail is the one the audit flags explicitly: build the teeth
  outside `.symbiote` (for layering convenience, say) and the substance will visibly read
  as two different materials — the teeth crisp, the black underneath displaced. This is an
  easy mistake to make and an easy one to miss until it is on screen next to the real
  effect.
- Small cost is contingent on the mechanism already being correctly understood, which this
  file's Mechanism section exists to lock in — the original phrasing ("cut teeth into the
  mask") would have cost considerably more had someone tried to build it literally.
- Layered on top of an already-expensive turbulence filter (see UI-09), this is one more
  element inside that filtered region — worth including in the same performance pass
  rather than assuming "just a clip-path" is free under an SVG filter.

## Done when

- [x] Teeth render as a zigzag strip pinned to the black's leading edge, filled
      `--symbiote`, and visibly displace along with the rest of the substance under the
      turbulence filter (not a separate, static layer) — `.symbiote__teeth` is a child of
      `.symbiote`, which is where `filter:url(#symbiote-turbulence)` is applied, so it is
      inside the filtered region by construction. It is pinned with
      `bottom:calc(var(--spread) * 100%)` and rides the same 800ms curve as the body mask
- [x] Eyes appear only when `data-drowned="1"` is present, with no new JS threshold
      introduced beyond what `panel.js` already computes — one CSS rule,
      `.panel[data-drowned] .symbiote__eyes{opacity:.92}`; `symbioteHTML()` always emits
      the SVG and never branches on the threshold
- [x] The whole substance — body, teeth, eyes — reads as one material under turbulence, not
      two — all three are children of the single filtered `.symbiote` wrapper
- [x] Included in UI-09's performance pass — pass 1 measured 76fps at 375px with six
      turbulence-filtered layers on screen

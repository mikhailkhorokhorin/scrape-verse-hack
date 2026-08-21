# UI-13 · Print artefacts

> One-pixel plate misregistration on borders, faint wear at panel corners, a dry-brush web in two page corners — the paper, not the ink.

**Status:** OPEN · **Cost:** small · **Depends on:** nothing
**Touches:** `web/css/layout.css`, `web/css/tokens.css`, new small CSS additions to panel/page chrome

## What it is

Texture that mimics the physical wear of cheap comic printing: a one-pixel offset where
two colour plates did not quite register, faint desaturation or ink loss at panel corners,
and a small dry-brush cobweb motif tucked into two corners of the page. All of it static or
near-static — this is set dressing, not a data signal.

Not to be confused with UI-02's absorbed print artefact (formerly UI-17): that one is a
`@media print` stylesheet that renders an incident's comic-cover panel as an actual printed
page. This idea is the opposite direction — it makes the *live, on-screen* console look
like a printed object, all the time, regardless of what the data says.

## Why it earns its place

This is the one bucket in `docs/UI-IDEAS.md` explicitly allowed to be pure decoration,
because it asserts nothing about the data — "it is the paper, not the ink." Every other
idea in this file is measured against the project's central rule (a drawing that does not
read a field in `history.json` is decoration, and decoration loses this track); this idea
is exempted by name in the master list precisely because it never claims to be a signal.
Its job is atmosphere for `docs/DESIGN-SPEC.md` section 1's "cheap comic printing separated
the color plates" principle, which the console does not otherwise render literally anywhere
outside chromatic aberration on damage states.

## Mechanism

Small, additive CSS, layered onto existing chrome rather than new elements wherever
possible:

- **Misregistration** — a 1px `box-shadow` or duplicated border offset by a sub-pixel
  amount on panel and incident-card borders (`.panel` in `web/css/panel.css` line 4-5
  already has a 3px ink border and 6px hard shadow; this rides alongside, not instead of,
  that).
- **Corner wear** — a subtle radial fade or a faint texture mask at the four corners of
  `.panel` and `.incident`, applied as a `::after` pseudo-element so it costs no new
  markup, similar in spirit to the existing halftone `::before` layers (`web/css/panel.css`
  lines 20-24, `web/css/feed.css` lines 19-23).
- **Dry-brush web** — a small inline SVG or CSS-drawn motif fixed to two page corners
  (`web/css/layout.css`), low-opacity, `--ink` or `--dim` coloured, never covering
  interactive content.

All of it should sit at low opacity and small scale — this is the section of
`docs/DESIGN-SPEC.md` that the write-up in `docs/UI-IDEAS.md` itself warns about: "overdone,
it reads as a rendering bug."

## Risks

- The single biggest risk named in the master list itself: overdone, this reads as a
  rendering bug rather than an intentional print artefact — a judge unfamiliar with the
  comic-print reference could mistake corner wear or misregistration for a CSS bug report.
  Needs restraint more than craft.
- Because it carries no data, it is easy to over-invest time in here relative to its actual
  weight in the Best UI evaluation — it is atmosphere, not evidence.
- Interacts with UI-01's onomatopoeia bursts and UI-18d's symbiote teeth, both of which are
  meant to be loud; static print texture must not visually compete with either when they
  fire.

## Done when

- [ ] Panel and incident-card borders show a subtle plate-misregistration offset
- [ ] Panel corners show faint wear, visible on close inspection but not distracting at
      normal viewing distance
- [ ] A dry-brush web motif sits in exactly two page corners, low-opacity, `--ink`/`--dim`
- [ ] None of it reads as a layout bug to someone unfamiliar with the reference — checked
      against a second pair of eyes, not just the author's own judgement
- [ ] Survives `prefers-reduced-motion` untouched, since none of it should animate anyway

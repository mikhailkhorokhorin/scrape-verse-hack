# UI-18a · The rig

> One SVG spider, authored once and parameterised, so BODEGA, ATLAS and KESTREL are a cast and not one sprite repeated three times.

**Status:** ACCEPTED (part of [UI-18 · The cast](UI-18-the-cast.md)) · **Cost:** medium — "the one thing on the list worth a whole day" · **Depends on:** nothing; everything else in the cast depends on this
**Touches:** new `web/js/rig.js`; a new stylesheet for rig-specific rules; `web/js/panel.js` (mount point only)

## What it is

One spider is authored as inline SVG, once, built from parts that can be recombined per
collector: body, mask plate, eyes, legs. Ink line art at `--ink` weight 3, flat fills, no
gradients — matching `docs/DESIGN-SPEC.md`'s "ink over glow" principle exactly, so the rig
does not read as an illustration dropped onto a UI built from hard shadows and flat colour.

Three silhouettes come out of the same parameterised parts, distinguished by leg curve,
mask marking and accent plate — never by hue, since the health colours (`--healthy`,
`--degraded`, `--critical`, `--reweaving` in `web/css/tokens.css`) are semantic and already
spoken for by state, not identity:

- **BODEGA** — squat and heavy. Short, thick legs, a wide low body.
- **ATLAS** — long-limbed. The most fields watched (five, see UI-18b), so the most legwork
  visually as well as literally.
- **KESTREL** — angular and fast. Sharp joint angles, a narrower body.

## Why it earns its place

The rig itself does not read a field directly — it is the canvas the rest of the cast (18b
onward) draws on. Its justification is structural: without a convincing, distinct-per-
collector base shape, none of the data-driven sub-ideas (legs as fields, eyes as integrity)
have anywhere to attach. It earns its place the way a chart's axes do — not data itself,
but the precondition for every data mark that follows.

It is also the direct answer to the problem statement in `docs/UI-IDEAS.md`: a healthy,
compact panel today has no field chips and nothing but a sparkline, bar and readout
(`panelHTML`, `web/js/panel.js` lines 32-39) — the emptiest version of the panel, on the
panels a judge sees first. The rig is the thing that fills that space with something a
judge's eye actually stops on.

## Mechanism

New module, `web/js/rig.js` — does not exist yet. Reasoning for a new file rather than an
addition to `web/js/panel.js`: `panel.js` is 121 lines of string-building today (verified
by direct line count) against the repository's 250-line cap per file; a rig detailed enough
to carry three distinct silhouettes plus animated legs and eyes is easily its own module's
worth of code.

Suggested shape of the module: a function like `rigSVG(sp, st)` that takes a Spider object
and its status word (the same `sp` and `st` already computed in `panelHTML`, `web/js/
panel.js` lines 4-5) and returns an SVG string built from:

- A base body/leg/eye template, shared across all three collectors
- A per-collector parameter set (leg length/curve, body width, mask marking, accent plate)
  keyed by `sp.code` — `"BODEGA" | "ATLAS" | "KESTREL"` are the only three values `code`
  ever takes, so this can be a plain lookup object, not a general system
- Ink colour and fills read from the same CSS custom properties already in scope
  (`--ink`, and state colours via the `COLOR[st]` map already imported into `panel.js`),
  so the rig recolours with state for free rather than needing per-state art

Mount point: `panelHTML()` in `web/js/panel.js` calls `rigSVG(sp, st)` and inserts the
result, positioned per UI-18b's placement rule (body of a compact panel; a watermark layer
behind content on a big panel).

## Risks

- **This is not a two-hour SVG.** The feasibility audit is explicit: three silhouettes
  that read as distinct characters at panel size, with a leg rig that animates per field,
  is "the single largest piece of work in this file — larger than UI-01 and UI-02
  individually." Treat it as a full day, not a small task squeezed between others.
  Everything downstream in the cast (18b–18f) is blocked on this landing first.
- Distinguishing three silhouettes by leg curve and mask marking alone, without touching
  hue, is a real constraint-driven design problem — it is easy to end up with three
  spiders that only differ subtly, which defeats "a cast, not one sprite repeated."
- Performance is unmeasured until UI-09 runs — an SVG this detailed, multiplied by three
  panels, animated, under a turbulence filter on infected ones, has not been profiled on a
  weak device yet.

## Done when

- [ ] One spider template exists in `web/js/rig.js`, parameterised by collector
- [ ] BODEGA, ATLAS and KESTREL are visually distinguishable at actual panel size by
      silhouette alone (leg curve, mask marking, accent plate) — not by colour
- [ ] Ink line art at `--ink` weight 3, flat fills, no gradients, matching
      `docs/DESIGN-SPEC.md` section 1
- [ ] Recolours correctly with panel state using existing CSS custom properties, with no
      per-state art asset
- [ ] Renders inside both the compact and big panel layouts without layout breakage
- [ ] UI-18b, UI-18c and the rest of the cast can mount on top of it without touching the
      base template

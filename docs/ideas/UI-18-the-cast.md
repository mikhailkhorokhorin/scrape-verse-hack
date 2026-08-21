# UI-18 · The cast

> Each collector gets a character, and the character is not a mascot beside the data — it is the readout.

**SHIPPED — all six sub-ideas.** `web/js/rig.js`, `web/js/rig-parts.js`, `web/js/rig-react.js`, `web/js/symbiote.js`, `web/js/sheet-rig.js` and `web/css/rig.css`, `rig-slot.css`, `rig-react.css`, `symbiote-face.css`, `sheet-rig.css`; covered by `test/web-rig.test.js` and `test/web-rig-react.test.js`. Nothing in the cut order (18a → 18b → 18c → 18e → 18d → 18f) had to be cut.

**Status:** ACCEPTED · **Cost:** medium overall — the single largest piece of work on the list · **Depends on:** nothing (this is the foundation everything else in the cast, and several other ideas, build on)
**Touches:** new `web/js/rig.js`; `web/js/panel.js`; `web/css/panel.css` and a new rig stylesheet

## What it is

The console currently draws states — a percentage, a bar, a black spread. It does not draw
characters. This is the headline work of the Best UI push: each of the three Spiders
(BODEGA, ATLAS, KESTREL) gets an original arachnid character, authored as inline SVG,
whose body directly renders that collector's telemetry. Not an illustration placed next to
the integrity readout — the legs, eyes and body posture *are* the readout, in the same
way a bar chart is a readout, except nobody has to be taught how to read a spider losing
its legs.

The work splits into six sub-ideas, each with its own file:

- [UI-18a · The rig](UI-18a-the-rig.md) — the SVG itself: one spider, parameterised, three
  distinct silhouettes for the three collectors.
- [UI-18b · Legs are fields](UI-18b-legs-are-fields.md) — each expected field owns a
  mirrored pair of legs, and a field's state decides whether that leg stands, twitches, or
  hangs.
- [UI-18c · Eyes are integrity](UI-18c-eyes-are-integrity.md) — the eight-eye count lit is
  the integrity band.
- [UI-18d · The symbiote gets a face](UI-18d-symbiote-face.md) — teeth and eyes added to the
  existing black-spread mechanism, so infection reads as something arriving, not just a
  fill level.
- [UI-18e · Idle life](UI-18e-idle-life.md) — small per-panel-offset motion so a healthy
  cast reads as alive rather than as a screenshot.
- [UI-18f · The scan lands on screen](UI-18f-scan-lands.md) — a Spider reacts physically
  when a new record lands for its collector.

## The original-art decision

**All art is original and authored as inline SVG in this repository. No Marvel likeness,
no stock asset, no image file.** This was decided for three reasons, in order of how much
each matters:

1. **It is stronger design, not a weaker one.** A borrowed Spider-Man design lands in a
   judge's memory as someone else's work, however competently reused. An original arachnid
   that *is* the telemetry — legs that plant, twitch and hang; eyes that dim with an
   integrity band — is a design this project can claim as its own, and a comparison to the
   genre archetype (an arachnid hero, a mask, a black substance that takes you over) does
   the work of evoking the reference without borrowing its specific lines.
2. **Inline SVG inherits the design system for free.** Because the art lives in the DOM as
   SVG rather than as a raster or vector asset file, it inherits the existing colour tokens
   — `--ink`, `--symbiote`, `--critical`, `--healthy` and the rest defined in
   `web/css/tokens.css` — directly. A character recolours with state the same way the
   integrity bar or a badge does, with no second asset needed per state. It also takes the
   halftone overlay every other surface gets (`web/css/panel.css` lines 20-24) and animates
   in plain CSS with no build step, matching the "no framework, no build step" constraint
   in `docs/CLAUDE.md`.
3. **Trademarked character art on a public hackathon repository is a real legal and
   reputational risk with no offsetting upside.** The genre archetype — an arachnid, a
   mask, a symbiotic black substance — is free to use; the specific trademarked design is
   not, and copying it buys nothing this project needs.

This decision is also recorded as a rejection in `docs/UI-IDEAS.md`'s REJECTED table
("Marvel likenesses — someone else's design, on a public repo, with a legal tail and no
upside. The archetype is free; the trademark is not") and should not be revisited.

## Why it earns its place

Per the problem statement that opens `docs/UI-IDEAS.md`: a healthy panel today renders
**compact**, and the compact body has no field chips at all — sparkline, bar and readout
only (confirmed against `panelHTML` in `web/js/panel.js`, lines 32-39). The first screen a
judge sees is the emptiest version of the panel the console ships, on exactly the three
panels most likely to still be healthy during judging. The rig fills that empty space with
something that is still a real readout, on the panels where a judge's first five seconds
actually land.

## Mechanism

Lives in its own module, `web/js/rig.js` — new, not yet created. `web/js/panel.js` is 121
lines of string-building today against the repository's 250-line cap per file; the rig is
new surface area, not an addition squeezed into an already-dense file.

## Risks

- **This is the largest single piece of work in the file** — larger than UI-01 or UI-02
  individually, per the feasibility audit. Three silhouettes that read as distinct
  characters at panel size, with a leg rig that animates per field, is not a two-hour SVG.
- **Performance is unmeasured.** The turbulence filter behind the symbiote is already the
  most expensive effect on the page before any character work lands; animated legs,
  blinking eyes and (if built) a crawler stack on top of it. UI-09 exists specifically to
  catch this, and it is not optional.
- **Cut order, decided now so it does not get re-litigated under time pressure:** 18a →
  18b → 18c → 18e → 18d → 18f. A rig with dead legs and no eyes still wins; eyes without a
  rig are nothing. If the day runs out, cut from the end of that list first.

## Done when

- [x] Three distinct silhouettes exist, one per collector, recognisably different at panel
      size (see UI-18a) — `RIG_BUILD` in `web/js/rig-parts.js`
- [x] Each expected field maps to a leg pair whose state reflects that field's LIVE /
      INFECTED / DEAD status (see UI-18b) — `legsSVG()` over `sp.fieldOrder`
- [x] The rig lives in `web/js/rig.js`, not bolted onto `panel.js` — split further into
      `rig-parts.js` (geometry) and `rig-react.js` (the landing reaction) to stay inside the
      250-line cap; `panel.js` calls `rigSVG()` and nothing else
- [x] UI-09's phone pass has run at least once against the rig before it is considered done
      — pass 1 logged in `UI-09-phone-pass.md`, Chromium at 375×812, 76fps, no horizontal
      scroll. Pass 2 (pre-submission) is still outstanding, as that brief records
- [x] No character art references or resembles a trademarked design — every path is
      authored in this repository as inline SVG from ellipses and hand-written path data;
      no image file, no stock asset, no borrowed likeness

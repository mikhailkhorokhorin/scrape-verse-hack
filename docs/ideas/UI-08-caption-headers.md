# UI-08 · Caption-box section headers

> `MEANWHILE — 698 ROWS SHIPPED CLEAN` instead of `THE HAUL`.

**SHIPPED** — `web/js/caption.js` and `web/css/caption.css`, over the four `.sechead h2` elements in `web/index.html`; covered by `test/web-caption.test.js`.

**Status:** OPEN · **Cost:** small · **Depends on:** nothing
**Touches:** `web/index.html`, `web/js/render.js` (or a small new render function), `web/css/layout.css`

## What it is

Comics move between scenes with a caption box — a rectangle of narration text, distinct
from a speech bubble, that bridges one panel to the next. The console's four section
headers (`web/index.html` lines 78, 131, 134, 137: `<h2>The Watch</h2>`, `<h2>The
Haul</h2>`, `<h2>Incident Replay</h2>`, `<h2>Incident Feed</h2>`, each inside a
`.sechead`) are currently plain labels. This idea turns them into caption boxes whose text
is a real, current number rather than a static title — `THE HAUL` becomes something closer
to `MEANWHILE — 698 ROWS SHIPPED CLEAN`, computed from the data that section already
renders.

## Why it earns its place

Each of the four sections already has a real number attached to it by the time it renders:
`renderHaul()` knows total rows shipped, `renderFeed()` knows the incident count
(`setCount("feedcount", ...)`, `web/js/render.js`), `renderGrid()` knows the fleet count
(`setCount("fleetcount", ...)`). The caption text is a restatement of a number the page is
already computing for its `.sechead__count` badges — this idea does not invent a new
metric, it puts an existing one into the section's voice instead of a badge off to the
side.

## Mechanism

Each `<h2>` becomes a template string built at render time: `"MEANWHILE — " +
groupNum(totalRows) + " ROWS SHIPPED CLEAN"` for the haul section, in the same place
`renderHaul()` already has `totalRows` available. `groupNum` (`web/js/format.js` line 28)
already exists for the thousands-separator formatting. The other three headers get their
own comic-caption phrasing built from data already in scope at their render call:
fleet count for The Watch, incident count for Incident Feed, replay span or incident id
for Incident Replay.

Visually this is a CSS change more than a JS one: a caption box in comics is a filled
rectangle with a hard border, not a plain heading — reuse the `--ink` / hard-shadow
vocabulary already established for `.incident` (`web/css/feed.css` lines 10-15) rather
than inventing a new panel style.

## Risks

- Four headers, four different sentence templates — there is a real risk of these reading
  as cute rather than as data, especially if the phrasing leans on wordplay instead of the
  number doing the work. Keep the number first and the flavour text minimal.
- The haul and feed counts can be zero (`ALL QUIET`, `NOBODY IS WATCHING YET` empty
  states already exist in `web/js/render.js`) — the caption template needs a zero-safe
  variant, not just a happy path with a big number.

## Done when

- [x] All four section headers read as data-driven captions, not static titles — THE WATCH,
      MEANWHILE / n ROWS SHIPPED CLEAN, INCIDENT REPLAY and INCIDENT FEED, repainted by
      `paintCaptions()` on every mutation inside `#main`
- [x] Each number in a caption matches the count already shown elsewhere on the page for
      that section (no duplicate, independently-computed number) — `captionSourceText()`
      reads the rendered count node itself (`#fleetcount`, the haul totals cell,
      `#replayhead`, `#feedcount`) and `captionCount()` parses the number back out, so
      there is exactly one calculation per section
- [x] Zero-count states (no incidents, no rows yet) render a sane caption, not `0` dropped
      into the sentence awkwardly — `NOBODY IS WATCHING YET`, `NOTHING IN THE BAG YET`,
      `NO BREAK TO REPLAY`, `ALL QUIET`, each with no number and the `caption--quiet` class.
      Singular and plural are handled separately (`ROW` / `ROWS`, `BREAK` / `BREAKS`)
- [x] Visually distinct from a plain `<h2>` — reads as a caption box, ink border, no blur —
      the `.sechead h2` base already gives it a paper fill, a 3px ink border and a hard
      shadow; `.caption` adds the mono kicker line above the lede and a second hard shadow

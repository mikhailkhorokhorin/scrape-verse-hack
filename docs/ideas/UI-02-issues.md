# UI-02 · Every incident is an issue

> An incident is not a log entry — it is an issue of a comic. `inc_004` becomes `ISSUE #4`, and the feed becomes a shelf of covers.

**SHIPPED** — `web/js/issue.js`, `web/js/issue-route.js`, `web/css/issue.css`, `web/css/print.css`, mounted by `renderFeed()` in `web/js/render.js`; covered by `test/web-issue.test.js`.

**Status:** ACCEPTED *(absorbs UI-12 — deep link — and UI-17 — print report)* · **Cost:** medium · **Depends on:** [UI-18a](UI-18a-the-rig.md) for the character-at-its-worst version of the cover (the idea works without it, using the panel's own worst-moment styling)
**Touches:** `web/js/render.js`, `web/css/feed.css`, a new hash-routing module, `web/js/panel.js`

## What it is

Each incident in the feed becomes a comic-issue cover instead of a log-style card. The
incident number is styled as an issue number, the strain gloss already written for every
incident becomes its subtitle, and the visual centre of the card is the collector's panel
at its worst moment during that incident:

```
        ISSUE #3
        BODEGA
   "THE SHOP SHIPS A REDESIGN"
      THROTTLED · 07:48Z
        100% → 0%
```

None of this is invented copy layered over real data — the issue number *is* the incident
number, the subtitle *is* the strain gloss the console already writes
(`STRAIN_GLOSS`, `web/js/config.js` lines 35-40), and the cover *is* the panel rendered at
its worst integrity — with UI-18a's cast, the collector's own character at its worst
moment, standing on however few legs its integrity implied at the time.

This idea also fixes a real, independently-identified weakness: the incident feed is, per
the master list, "the least designed part of the console" today, despite holding some of
the strongest real evidence — recovered fields, blast radius, strain classification — the
console has.

## Why it earns its place

Every element of the redesigned card is a direct read of data the console already computes
per incident: `inc.id`, `inc.strain`, `inc.opened`, `inc.before`/`inc.after`, and the
existing `strainHTML()` rendering of the strain gloss (`web/js/render.js` lines 148-155),
all already assembled by `adaptIncidents()` (`web/js/adapter.js` lines 135-176). This idea
restyles the presentation of real fields the feed already carries; it does not add a new
metric or invent narrative text beyond what `inc.summary` (written server-side, per
`docs/CLAUDE.md`'s data contract) already supplies.

## What it absorbs, and why the merge holds

- **Was UI-12 (deep link to `inc_003`).** `#inc_003` now opens the console directly to that
  issue with its replay ready. The merge table's reasoning is direct: "a permalink to an
  issue is part of what makes it an issue" — a comic issue has a number precisely so it can
  be referenced individually, and a URL hash is the web's version of that reference. This
  also revives a task that was deliberately cut: `docs/TASKS.md`'s T-30 ("Link to a single
  incident") sits on the cut list in both `docs/PLAN.md` (line 144) and `docs/PROGRESS.md`
  (line 266). Folding it in here is a re-decision, not a rediscovery — it earns its place
  now only because the issue-cover redesign gives it a reason it did not have when it was
  cut. T-30 specifies exactly this behaviour — `#inc_014` opens the console with that
  incident's replay ready, unknown ids fall back to THE WATCH rather than erroring, and the
  incident panel exposes its own link. **This routing does not exist in the codebase yet**
  — no file currently reads `location.hash` — so it is genuinely new work folded into this
  idea's cost, not a rename of something already built.
- **Was UI-17 (print report).** A `@media print` rule renders one issue as a printable
  page. The merge reasoning: "the cover *is* the print artefact... a `@media print` rule,
  not a feature" — once the cover exists as a self-contained, well-composed visual, making
  it printable is a stylesheet addition, not new layout work. This is a different thing
  from UI-13's ambient print texture (misregistration, corner wear) — UI-13 makes the
  live screen look printed; this makes an actual browser print produce a usable page.

## Mechanism

**The card redesign.** `renderFeed()` (`web/js/render.js` lines 75-121) currently builds
each `.incident` article from `inc.who`, `inc.id`, `inc.opened`, `strainHTML(inc.strain)`,
`inc.what`, `incidentBlastHTML(inc)` and a stage timeline. The issue-cover version
restructures this same data into a cover layout: issue number derived from `inc.id`
(`"inc_004"` → `ISSUE #4`, a simple numeric-suffix extraction), the strain gloss promoted
to a quoted subtitle position instead of its current inline badge-plus-text row
(`strainHTML()`, `web/js/render.js` lines 148-155), and a visual centrepiece showing the
collector panel at `inc.before` integrity — reusing `panelHTML()`'s own rendering logic
(`web/js/panel.js` line 3) against a synthetic spider object built from the incident's
`before`/`after` values, the same technique UI-10 needs for its diptych.

**Deep linking.** A small new module reads `location.hash` on load and on `hashchange`,
looks up the matching incident by `id` in `INCIDENTS`, and — if found — opens Incident
Replay pre-seeded to that incident (the mechanism `web/js/replay-mount.js` and
`web/js/replay.js` already use to load a replay model, just triggered by hash instead of a
click). An unknown or absent hash falls back to the normal THE WATCH view, per T-30's own
stated requirement. Each rendered issue card gets its own `<a href="#inc_XXX">` so the
permalink is discoverable from the page itself, not just constructible by a reader who
already knows the id.

**Print.** A `@media print` block targets the issue-cover markup specifically — hiding the
rest of the page chrome (masthead readouts, grid, replay controls) and laying the single
cover out for a printed page. Because the cover is by this point a self-contained visual
(art, title, subtitle, delta), this is close to a pure CSS addition once the redesign
above exists, not new layout.

## Risks

- The deep-linking half of this is real, previously-unbuilt work — T-30 in `docs/TASKS.md`
  is currently unimplemented (no hash-reading code exists in `web/js/` today), so this
  idea's cost should not be counted as "just a rename of UI-12," it is genuine new routing
  logic with its own edge cases (unknown hash, hash present before data has loaded, hash
  changing while a different incident's replay is already open).
- Building a synthetic spider object at `inc.before` integrity to feed through
  `panelHTML()` for the cover art risks diverging from the real rendering path if
  `panelHTML()` changes later and the synthetic-object shape is not kept in sync — the
  same risk UI-10 carries independently for its diptych, and worth solving once if both
  ideas ship.
- The print stylesheet is easy to under-scope: "the cover is the print artefact" assumes
  the cover redesign is finished and print-worthy on its own; if the cover redesign is
  rushed, the print rule inherits whatever is unfinished about it.

## Done when

- [x] Every incident card in the feed renders as a comic-issue cover: issue number, strain
      gloss as subtitle, collector panel at its worst moment, integrity delta.
      **One deliberate deviation:** the cover art is `rigSVG()` on the collector's own
      character built from the worst run in the incident window (`worstRunOf()` +
      `spiderFromRecord()`), not the whole `panelHTML()` panel — the panel's chrome fought
      the cover layout, and the character carries the same field-state read
- [x] `#inc_XXX` in the URL opens the console directly to that issue with Incident Replay
      pre-seeded, for any real incident id — `issue-route.js` reads `location.hash` on load
      and on `hashchange`, builds the replay through `buildReplay()` and scrolls to it
- [x] An unknown or malformed hash falls back to the normal THE WATCH view without erroring
      — `parseIssueHash()` returns `null` for anything that is not `inc_<digits>`, including
      a hash that fails `decodeURIComponent`, and `routedReplay()` returns `null` for a
      well-formed id with no matching record
- [x] Each rendered issue exposes its own shareable link (a real `<a href>`, not just an
      implied convention) — `issueLinkHTML()`
- [x] A browser print of an open issue produces a single, readable page via `@media print`,
      with page chrome (masthead, grid, replay controls) hidden — `web/css/print.css`.
      With no issue open it prints every issue, one per page
- [x] No incident data is invented for display — every element on the cover traces to a
      field already in `data/incidents.json` (`id`, `strain`, `opened_at`,
      `integrity_before`/`after`) or, for the art, to a run in `data/history.json`

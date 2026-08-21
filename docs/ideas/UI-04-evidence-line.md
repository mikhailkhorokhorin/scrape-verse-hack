# UI-04 · Evidence line in the masthead

> A fifth line under the tagline that states, in numbers, that this is not a mockup.

**SHIPPED** — `evidenceParts()` / `renderEvidence()` in `web/js/masthead.js`, `web/css/evidence.css`, the `#evidence` line in `web/index.html`, and the `Count the tests` step in `.github/workflows/watch.yml`; covered by `test/web-evidence.test.js`.

**Status:** ACCEPTED · **Cost:** trivial in the browser, ~15 minutes in the CI workflow · **Depends on:** nothing
**Touches:** `web/index.html`, `web/js/masthead.js`, `web/js/render.js`, `.github/workflows/watch.yml`, `data/meta.json` (new, CI-generated)

## What it is

One line of monospace text under the tagline in the masthead:

```
3 collectors · 4 incidents healed · 698 rows · 528 tests · c_a628…
```

Every number is real and clickable-adjacent to its source: collector count from
`SPIDERS.length`, incidents healed from `INCIDENTS.filter(i => i.verified).length`, total
rows from summing `run.rows` across `data/history.json`, test count from a file CI writes,
and the last collector id truncated with an ellipsis so a judge can match it against
`docs/COLLECTORS.md` without the line wrapping.

It sits between `.tagline` and `.readouts` in `web/index.html` (lines 48-51 today carry
the wordmark and tagline; the line is a new `<p>` after them), styled as `--t-label` mono,
`--dim` colour, no border — a caption, not a card.

## Why it earns its place

Per the problem statement in `docs/UI-IDEAS.md`, **the first screen currently carries no
proof at all** — no collector id, no incident count, no test count. A judge lands on a
green grid and has to take the product's word for it. This line is the cheapest
credibility available on the whole list, and it is the only idea here that also scores in
Best Code: it is a live read of `data/history.json`, `data/incidents.json` and
`collectors.json`, not a claim.

It reads real data end to end except for one field, and that exception is the reason the
mechanism below matters.

## Mechanism

Collectors, incidents-healed and total rows are all computable client-side from data
already loaded by `loadLive()` in `web/js/adapter.js` (`SPIDERS`, `INCIDENTS`,
`RAW_HISTORY` are populated there) — no new fetch, just a new render function alongside
`renderMttr()` in `web/js/masthead.js` that fills the new `<p>` after `renderGrid()` runs.

**The test count cannot be computed the same way.** The feasibility audit in
`docs/UI-IDEAS.md` is explicit: the browser cannot run `node:test`. Hard-coding a number
like `528` into `web/js/config.js` creates a value that silently goes stale the next time
a test is added, and a judge who runs `npm test` themselves would catch the mismatch
immediately — the opposite of what this line is for.

The fix is to have CI measure it. The `build` job in `.github/workflows/watch.yml`
(currently just copies `web/`, `data/` and `demo-target/` into `public/`, lines 58-68)
gains one more step: run `npm test` (or parse its output — `node:test`'s default reporter
prints a pass count), write `{ "tests": <n>, "sha": "<commit sha>", "generated_at":
"<iso>" }` to `data/meta.json`, and let the existing `cp -r data public/` step pick it up.
The console fetches it exactly like `history.json` and `incidents.json` today
(`fetchJson` in `web/js/adapter.js`), so a fetch failure degrades the same way — the line
omits the test count rather than showing a stale one.

The trailing collector id is the newest `cid` seen in `SPIDERS`, truncated to a short
prefix with an ellipsis, matching the format already used for `sp.cid` display in
`web/js/sheet.js`.

## Risks

- `data/meta.json` is a new committed artefact with a build-time timestamp — if the
  `build` job's test-count step is skipped or fails silently, the number goes stale
  exactly the way this idea exists to prevent. The step needs its own failure to be loud,
  not swallowed like `repair.js || true` is for the `scan` job.
- Parsing `node:test`'s console output for a pass count is a text-scrape of a reporter
  that is not a stable API surface; a Node version bump could change the format. Prefer
  the TAP reporter (`--test-reporter=tap`) if available, since it is line-oriented and
  meant to be parsed.
- Five numbers in one line risks wrapping on narrow viewports before UI-09's phone pass
  has run; needs its own check at 375px.

## Done when

- [x] The masthead shows collector count, incidents-healed count, total rows, test count
      and a truncated collector id, all below the tagline — `evidenceParts()`, joined with
      `·` into `#evidence`
- [x] Every number changes when the underlying JSON changes on a real poll, with no
      hard-coded value in `web/js/config.js` — the parts are read from `SPIDERS`,
      `INCIDENTS`, `RAW_HISTORY` and `META`, and `META.tests` joins the poll fingerprint so
      a changed test count re-renders
- [x] `data/meta.json` is written by the `build` job in `.github/workflows/watch.yml` and
      committed to `public/` alongside `history.json` and `incidents.json` — the
      `Count the tests` step parses `# pass N` out of TAP and fails the job loudly if it
      cannot, and the existing `cp -r data public/` carries it. **Caveat:** only the copy in
      `public/` is regenerated per build. The `data/meta.json` committed in the repo is a
      hand-written snapshot and currently reads `594` against a suite of 821, so a local
      static server shows a stale test count until CI rebuilds
- [x] A `data/meta.json` fetch failure hides only the test-count segment, not the whole
      line — `fetchMeta()` returns `null` on any failure, `evidenceParts()` omits only that
      part, and the line's `title` says why the count is missing
- [x] The line does not wrap at 375px — `white-space:nowrap` with `text-overflow:ellipsis`,
      a smaller face below 420px, and `renderEvidence()` switches to terse wording
      (`coll` / `healed`) at or below `EVIDENCE_TERSE_PX` (480). Confirmed in the 375px pass
      logged on UI-09

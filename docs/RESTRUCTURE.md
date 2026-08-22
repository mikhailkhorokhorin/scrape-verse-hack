# RESTRUCTURE — architecture, dead code, and a second page

Written 22 Aug ~07:00 UTC. Video records ~11:20 UTC. D1 (the live break) is pushed and
running on the cron's wall clock — nothing below touches `demo-target/`, `scripts/` or
`.github/` except the one glob noted in R2.

**The shape of it.** Three flat piles — 59 test files, 58 `web/js` files, 50 `web/css`
files — pass every numeric gate and still read as a heap. The fix is folders that mirror
the product's own anatomy, a dead-code sweep before anything moves (no point relocating
corpses), and one new page for the material that never belonged inside the comic. The
console itself stays one page: it is drawn as a single comic issue, the intro, the
scroll-press effects and `?capture=1` all assume one continuous page, and no judge asked
us to shatter it. What reads as "все в кучу" is the *repo*, not the *site* — so the repo
is what gets the architecture.

Ground rules unchanged: zero comments · ≤250 lines · vanilla globals, ordered script
tags · every stage ends with `npm test` + `npx eslint .` green, console clean in the
browser, and a live-page check after each push · max 2 agents, disjoint lanes · pushes
in safe windows with rebase · **no `bdata`, no credits — the D1 cycle is the cron's**.

---

## R1 · Dead-code sweep — **DONE 22 Aug 07:33 UTC**

Method, not vibes:
1. Build the cross-reference: every top-level function/const in `web/js/*.js` grepped
   against all of `web/` (js + index.html); every CSS class in `web/css` against js/html
   use sites; every export in `scripts/lib`, `tools/`, `mcp/` against its requires.
2. Check the false-flag registry in `SECOND-PUSH.md` first — `.fleet-symbiote`, the
   odometer reel, rtick's ::before hit area and friends are *intentional* and stay.
3. Delete in small batches, full gate after each. A deleted function takes its tests
   with it; the suite count may go *down* and that is honest.
4. Also: stale doc references (`docs/NEXT-PROMPT.md`-era paths), `test/tap.txt`-style
   artifacts if any, unused fixtures.

Done when: zero provably-unreferenced functions/selectors remain, and the sweep's one
paragraph (what was removed, why it was safe) lands at the bottom of this file.


**R1 · The sweep, done — 22 Aug 07:33 UTC.** The cross-reference covered 567 top-level
symbols across 58 `web/js` files and 533 classes across 50 `web/css` files, resolved
against `web/js`, `index.html` and `test/`. It found the tree already lean: **three**
functions were provably dead — `wildBadgeHTML` (`wild.js`), `changedCodesOf` (`delta.js`)
and `introHoldMs` (`intro-plan.js`), each defined in the product but called only from its
own test. Everything that merely *looked* dead was not: all 57 selectors with no literal
match are built by concatenation (`"cell--" + status`, `" is-" + grade`), verified by
prefix and then in a live browser where `rledger__row`, `haulcard` and `rtick` resolve to
real nodes. No unused keyframes, no unused custom properties, no orphan files.

**Two of the three deletions stood; one was reversed, and that reversal is the finding.**
`changedCodesOf` and `introHoldMs` are gone with their tests. `wildBadgeHTML` was *not*
dead code — it was **unwired** code. README, `SUBMISSION.md` and `VIDEO-SCRIPT.md` all
state that the console renders an **IN THE WILD** badge on the two incidents that broke
on sites we do not control, and the badge existed, and nothing ever called it. Deleting
it would have made the documents quietly false; the honest repair was to call it. It is
now emitted from `issueCoverHTML`, and the live page renders exactly two badges — KESTREL
and ATLAS — with BODEGA, our own page, correctly bare.

The sweep's second gift was the same shape: `press.css` styled `.incident .issue__name`
in three blocks, but the headline has been `.issue__who` since a rename, so the incident
title was silently excluded from the scroll-press every other heading gets. Renamed; the
computed style now reports `press-plates` on `view()` for that element.

Both repairs carry tests: the badge's presence and absence by universe, the cover's call
site, and a guard asserting `press.css` names the class the page actually renders. Suite
1,136 passing, lint clean, zero console messages on `index.html` and `?mock=1`.

## R2 · `test/` grows an anatomy — **DONE 22 Aug 07:13 UTC**

```
test/
  pipeline/   scoring, classify, payload, storage, repair, verify, heal, diagnosis, heal-that-lies
  web/        every web-*.test.js, renamed to drop the web- prefix
  mcp/        mcp-*.test.js
  tools/      evidence-report, numbers-audit's tests
  web-loader.js stays at test/ root (both loaders' paths keep one '..')
```

Contracts to update in the same commit:
- `test/run.js` — readdirSync goes recursive (walk subdirs, keep the flat-file filter).
- `.github/workflows/watch.yml:71` — the glob is replaced by the runner itself,
  `node test/run.js --test-reporter=tap`. Two forms were tried and rejected first:
  `node --test test/` does **not** recurse into subdirectories, and the quoted glob
  `test/**/*.test.js` only expands on Node 22+, while CI pins Node 20. Teaching
  `run.js` to forward its argv makes local and CI take the identical path.
  **Cron ritual applies**: back up `data/`, edit in a safe window, watch
  the next scheduled run count 1112 before touching anything else.
- Each moved file's relative `require` paths (`./web-loader` → `../web-loader`).
- Doc references: README's test paths, `VIDEO-SCRIPT.md`'s
  `node --test test/heal-that-lies.test.js` line.

Done when: `npm test` prints the same total from the new tree, CI's next run agrees.

**Result.** 59 files moved with `git mv` (rename similarity 97-99%, history intact) into
`pipeline/ web/ mcp/ tools/`, the `web-` and `mcp-` prefixes dropped since the folder now
carries that meaning. Three path classes rewritten mechanically: `./web-loader.js` →
`../web-loader.js`, `../scripts|mcp|tools/` → `../../`, and five `path.join(__dirname,
'..')` → `'..', '..'`. `test/run.js` walks subdirectories and now forwards its argv, so
CI calls the same runner (`node test/run.js --test-reporter=tap`) instead of a glob —
Node 20 in CI does not expand `test/**/*.test.js`, and `node --test test/` does not
recurse, so the runner is the only form that works in both places. 1,112 tests before,
1,112 after, lint clean, `data/` backed up before the workflow edit.

## R3 · `web/js` mirrors the product — **DONE 22 Aug 07:44 UTC** (js only; css left flat)

Grouping principle: a folder per *surface*, not per *pattern* —

```
web/js/
  app.js            stays at root: the assembly point
  data/             config, format, adapter, from-record, value, delta, scars,
                    haul-data, replay-data, issue-route
  fleet/            render, panel, received, symbiote, infection, webs, ground,
                    heatmap, sparkline, sparkhover, pulse, reconcile, reconcile-dom,
                    scratch, rig*, landing, bubble, speech, caption, odometer,
                    sweep, impact, heal, open, wild
  sheets/           issue, sheet*, receipt, diptych, haul, haul-view, replay*,
                    noprize, masthead, pagenav, intro*, finish, ad
  mock/             fixtures, haul-fixtures, replay-fixtures
web/css/            mirrors: base/ (tokens, layout, sizes, states, scrollbar),
                    fleet/, sheets/, fx/ (press, reveal, landing, impact...),
                    print/ (print, print-artefacts, capture), mock/
```

The exact file-to-folder map is decided at execution time from the script-tag order in
`index.html` — the order *is* the dependency graph and **must not change**, only the
paths. One mechanical pass rewrites the 108 src/href attributes; the web-loader's
`WEB_DIR` gains the subdir in its file list, not its base.

Gate is stricter here: screenshot-diff the page at 1440 and 375 against before (pixel
churn = a path died silently), console clean, full suite, deployed check.

**Condition: start R3 only if ≥1.5h remain before the video and everything else is
green. It is the largest diff for the least judge-visible gain — legibility for the
Clean Code reviewer who opens the tree, nothing for the one watching the site.**


**Result — 22 Aug 07:44 UTC.** 57 modules moved with `git mv` into `data/ fleet/ sheets/
mock/`; `app.js` stayed at the root because it is the assembly point, not a part. The 57
`<script src>` attributes were rewritten mechanically and their **order was not touched** —
that order is the dependency graph. Three contracts needed following:

- `eslint.config.js` overrides `web/js/config.js` (globals are declared, not assigned
  there); the path had to follow the file to `web/js/data/config.js` or eight
  `prefer-const` errors fire on a file that is correct as written.
- Five tests read module source by hand-built path rather than through the loader.
  Rather than teach each one a folder, `web-loader.js` now exports `modulePath(name)`,
  the same recursive resolver `loadWebModule` uses — tests keep naming a file, not a
  location, so the next move costs nothing.
- Removing those `path.join` calls orphaned three imports, which ESLint caught.

Gate: 1,136 tests passing, lint clean, and in the browser both `index.html` and `?mock=1`
render with **zero console messages** — 3 panels, 3 incidents, 2 IN THE WILD badges, 8 ad
tools, 5 nav links, the Chaos Lab breaking BODEGA to `is-critical` with the scratch canvas
mounted. CI on the restructured test tree went green on the same commit range.


**CSS was deliberately left flat.** The 51 stylesheets are already named for what they
style (`panel.css`, `symbiote.css`, `receipt.css`), so a reader finds one by name without
a folder to guide them; moving them would rewrite 51 `<link>` hrefs and every path in the
CSS-reading tests for legibility the filenames already provide. The JS move earned its
risk — 58 files whose names alone do not say whether `open.js` is a sheet or a fleet part.
The CSS move does not, and shipping a half-moved tree an hour before a recording is the
worse outcome. Recorded as a decision, not an omission.

## R4 · The second page: THE MANUAL *(Agent B, ~45min)*

`web/manual.html` — the comic's back page, built from the same tokens and vocabulary
(paper, ink, one accent), no new design direction:
- **Get the watch** — clone → `npm test` → `claude mcp add thwip -- node mcp/server.js`,
  the three commands verbatim;
- **Drive it from an agent** — the eight tools, one line each, free/paid split;
- **Judge it in ten minutes** — the six-step path from `SUBMISSION.md`;
- **Break it yourself** — the CHAOS LAB link and the three clicks.

The console's nav gains one `MANUAL` link (pagenav vocabulary, verified at both
widths); README's install section points at the live page. `?capture=1`, print and the
intro are untouched — different document. Deploy already copies `web/` wholesale.

This answers "страницы на сайте" the honest way: the watch stays one issue; the manual
— which was only ever README material — becomes the site's second surface.

## R5 · Re-sync and the last gate *(lead, ~20min)*

Numbers re-counted from the tree into README/SUBMISSION (file counts change in R2/R3),
`meta.json` untouched (the cron owns it now), full suite + lint + live check, one push
in a safe window. If R3 moved files the video script references on screen, re-check
`VIDEO-SCRIPT.md`'s terminal moments against reality.

---

## Order and the clock

| When | Lane A (agent) | Lane B (agent) | Lead |
|---|---|---|---|
| now → ~08:00 | R1 sweep | R4 manual page | R2 test tree, merges |
| ~08:00 → ~08:30 | R1 gate + report | R4 browser pass | D1 watch: cron should open the incident |
| ~08:30 → ~10:00 | R3 (only if green + time) | — | R5, screenshots, safe-window pushes |
| ~10:00 → video | frozen | frozen | verify live page, D1 incident closed, receipts |

Priority if the day compresses: **R1 → R4 → R2 → R3.** R3 is cut first, whole, without
apology — a flat-but-alive tree beats a half-moved one.

Done-when for the whole file: a stranger opening the repo sees folders that name the
product's parts; every file still ≤250 lines, zero comments, suite green; the site
gained a manual and lost nothing; and no number anywhere describes a tree that no
longer exists.

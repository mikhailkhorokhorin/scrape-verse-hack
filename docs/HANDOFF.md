# Handoff — where this stands right now

Written 2026-08-21, mid-afternoon. Deadline is Aug 23. Everything below is verified
against the repository as of this commit, not from memory.

## State in one paragraph

Three real collectors, all 100% healthy. **Four** real incidents in `data/incidents.json`,
all resolved, all on unchanged collector ids. `inc_003` was opened by the cron
autonomously and records a heal that honestly failed, because the fault was in our own
payload parser rather than the target — the false diagnosis is still on disk. `inc_004`,
on 22 Aug, is the one with **no human in any phase**: a committed redesign of our own demo
page, then detection, a second confirming scan, diagnosis, re-weave and verification
against a fresh scrape, 11m 56s end to end, `price: null → £18.00`, `rating: null → 4.4`.
1,149 tests green via `npm test`, `npx eslint .` clean, both run in a dedicated `ci`
workflow on every push and pull request across Node 20 and 22. The console is live at
https://mikhailkhorokhorin.github.io/scrape-verse-hack/ with a second page at
`/manual.html`.

## T-12, the live break — **DONE 22 Aug 08:08 UTC**

The last missing artifact is no longer missing. The break was committed at 07:05, the
cron saw Integrity fall to 50% at 07:28, waited for a second consecutive bad scan rather
than reacting to one, opened `inc_004` at 07:56, diagnosed `RENAMED`, re-wove and verified
at 08:08. Cost: roughly 50-60 credits, as budgeted.

The redesigned markup stays as the permanent `demo-target/index.html` — the healed scraper
now matches it. **Do not revert it**, or the collector breaks against the old classes
again.

Print the trail with `node tools/evidence-report.js inc_004`.

## What the user still owns

| Step | Where | Time |
|---|---|---|
| Record the video | script: `docs/VIDEO-SCRIPT.md`, shot-checked, stills in `../video-stills/` | ~90 min |
| LinkedIn post | `docs/LINKEDIN-POST.md`, two versions ready | ~10 min |
| Submit | checklist + morning sequence: `docs/SUBMISSION.md` | ~15 min |

## Orientation for a stranger

- `README.md` answers the four judged questions in its first screen, each with an anchor.
- `docs/` holds every spec: `PRODUCT.md` (why), `DESIGN-SPEC.md` (visual contract, §8
  Banned is non-negotiable), `COLLECTORS.md` (heal registry — submission evidence),
  `AUDIT-PIPELINE.md` (the 18 audits and their verdicts), `STRATEGY.md`.
- `npm test` — 1,149 tests, zero dependencies, node:test. `npm run lint`.
- `node mcp/server.js` — the MCP server; `mcp/README.md` shows the wiring and a real
  conversation. The example output is captured from the real tools, do not invent.
- `demo-target/` — the Chaos Lab: `index.html` (healthy), `broken-renamed.html`,
  `broken-drifted.html`, regenerable via `node demo-target/build.js`.

## Infrastructure facts

- **Primary:** github.com/mikhailkhorokhorin/scrape-verse-hack. `main` = prod (Pages
  deploys from it), `develop` = mirror of main. CI: `.github/workflows/watch.yml` —
  `check` (lint+test) on push, `scan`+`heal` on cron/dispatch only, so pushing never
  spends credit.
- One secret: `BRIGHTDATA_API_KEY`. Commits from CI use the built-in token.
- **GitLab is a stale mirror** — its protected branch rejects the post-rebase history.
  Either unprotect `main` there and force-push once, or ignore it; the submission points
  at GitHub.
- Local Bright Data session is logged in; ~3900 of 5000 credits remain. `bdata scraper
  create` and `heal` spend credits irreversibly — never recreate a collector that has an
  id in `docs/COLLECTORS.md`; the fix is always `heal`.

## Conventions that held throughout

Zero comments in code — names carry the meaning. 250-line cap per file, enforced by
ESLint. CSS split by concern in `web/css/`, classic scripts in `web/js/` where the tag
order in `index.html` is the dependency graph. Data files are append-only logs written
atomically; a corrupt file raises rather than being silently replaced. Every number on
screen traces to a field in `data/*.json` — if you add one, keep it traceable.

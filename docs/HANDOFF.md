# Handoff — where this stands right now

Written 2026-08-21, mid-afternoon. Deadline is Aug 23. Everything below is verified
against the repository as of this commit, not from memory.

## State in one paragraph

Three real collectors, all 100% healthy. Three real incidents in `data/incidents.json`,
all resolved, all on unchanged collector ids — one of them (`inc_003`) was opened by the
cron **autonomously** and records a heal that honestly failed, because the fault was in
our own payload parser, not the target. 1,149 tests green via `npm test`, `npx eslint .`
clean, both run in CI on every push. The console is live and honest at
https://mikhailkhorokhorin.github.io/scrape-verse-hack/ — 18/18 audits from
`docs/AUDIT-PIPELINE.md` are done.

## The one thing left to DO: the live-break rehearsal (T-12)

This is the last missing artifact — a fourth incident where **no phase is touched by a
human**. It was prepared and blocked only on a human decision. Three commands:

```bash
cp demo-target/broken-renamed.html demo-target/index.html
git add demo-target/index.html
git commit -m "chaos: the shop ships a redesign under the fleet" && git push github main:main
```

Then wait. The cron (`*/30`, drifts to ~hourly) does everything: scan one sees the drop,
scan two confirms, `repair.js` heals in the same run, verifies with a fresh scan, and
closes the incident. Budget ~50-60 credits. The console will honestly show BODEGA as
CRITICAL for an hour or two — that is the product working, not a problem.

After the heal verifies, the redesigned markup stays as the permanent page (the healed
scraper now matches it). Do not revert `index.html` afterwards or the scraper breaks
against the old classes again.

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

# Winning strategy — all four tracks

Written Aug 21 after two reconnaissance passes over every competing repository that
could be found. This file is the plan of record; where it disagrees with older docs,
this file wins.

## The field

| Project | Stack | Strong | Weak |
|---|---|---|---|
| **HYDRA** (anikdascodes) | Fastify + SQLite + Next.js | Chaos store (3 layouts), event receipts, data verticals (GPU prices, travel rates) | **No tests**, no stated thresholds, no UI screenshots, DNS workaround hardcoded to one machine |
| **Sentinel** (sreecharan-desu) | TypeScript, Vercel | Degraded-state detection, targeted heal prompts | Dashboard is empty — Runs 0 / Heals 0 |
| **scrape-verse-radar** (JrKrishh) | Node + CF Workers | Documents two FAILED heals — honesty as proof | Thin UI |
| **scraper-health-mcp** (0xConsole) | Python + FastAPI | **MCP server** — drives the loop from a coding agent, which is a literal judging criterion | No license, no tests |
| **Web Radar** (harisawan27) | FastAPI + Neon | 41 pytest tests | Self-healing still in the roadmap |

## The decision: do not copy HYDRA's backend

A Fastify + SQLite + Next.js stack is not what the judges score. Read the Bright Data
track criteria as four questions:

1. *The scraper you designed in Scraper Studio* — we have three real collectors
2. *How you drove it from your coding agent* — **our gap**
3. *What it did when the site changed under it* — two real heals, same collector ids,
   and a chaos lab in flight
4. *What the structured output went on to power* — **our gap**

HYDRA's server answers none of those four better than a serverless design does; it just
costs them ops. Our architecture — **CI is the backend, two committed JSON files are the
database** — is a defensible thesis: zero infrastructure to babysit, atomic writes,
every scan is a signed commit in public history. We own that argument instead of
abandoning it. What we take from the field is not their stack but the four features
that score:

## The build list, ranked by judged value

| # | Build | Closes | Cost |
|---|---|---|---|
| 1 | **Chaos Lab** on BODEGA — 3 switchable layouts, judge breaks the site live | Q3, Best UI | in flight |
| 2 | **THWIP MCP server** — fleet health, incident history, and heal-trigger as MCP tools a coding agent calls | Q2 (nobody but 0xConsole has this, and theirs has no UI behind it) | ~3h |
| 3 | **THE HAUL** — a data-product view: the freshest structured rows themselves, with provenance (collector id, scan time, integrity at capture) | Q4 | ~2.5h |
| 4 | **Heal receipts** — machine-readable JSON per incident with phase timestamps, surfaced as "healed in 26m 24s" | Q3 proof | ~1h, stages already recorded |
| 5 | **Test suite** on node:test | Clean Code (HYDRA has zero tests) | in flight |
| 6 | **Failed-heals section** in README — radar proved honesty reads as credibility | Q3 | 30m |
| 7 | Accessibility pass | Best UI | in flight |

## Why this beats a rebuild

Two days remain. A backend rewrite spends them recreating what HYDRA already has,
finishing second on their turf while our lead — the strongest UI in the field and the
only fully-verified heal pipeline — decays unattended. The list above spends the same
hours making every judged question answerable in under a minute, in categories where
each direct competitor has a visible hole.

## Track-by-track closing state

- **Best Use of Bright Data**: 3 real collectors, 2+ real heals with unchanged ids,
  chaos lab for live breakage, MCP server for agent-driven control, THE HAUL for what
  the data powers, receipts as machine evidence
- **Best UI**: the console itself, plus chaos lab as an interactive exhibit; a11y and
  polish audits per AUDIT-PIPELINE.md
- **Best Clean Code**: tested (node:test, zero deps), modular (<250 lines/file, zero
  comments), atomic writes, honest error paths, LICENSE, docs that match the code
- **Best LinkedIn Post**: written in LINKEDIN-POST.md around the real KESTREL story

## Execution order

1. Finish in-flight: chaos lab, tests, a11y (3 agents)
2. Then: MCP server + THE HAUL + receipts (next wave, 3 lanes)
3. Then: AUDIT-PIPELINE.md waves 0-3 top to bottom
4. Then: rehearse the break, record, submit

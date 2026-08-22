# Collector Registry

**Pin every Collector ID here the moment `bdata scraper create` returns it.**

`create` takes 5-25 minutes and costs credit. A lost ID means paying that cost twice.
Never let an agent recreate a scraper that already exists.

## Registry

Targets are **already chosen and checked** — see `collectors.json` in the implementation
repo for URLs and per-field validators. Do not substitute a site: each was verified as
public, login-free, outside Bright Data's pre-built library, and cleared against its
`robots.txt`.

| Codename | Universe | Collector ID | Expected fields | Rows/run | Created | Notes |
|---|---|---|---|---|---|---|
| BODEGA | mikhailkhorokhorin.github.io | `c_mt2lkwxa1bb5uz223s` | title, price, rating, image | 12 | Aug 21 | Our own page — `https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/`. Three variants (healthy / renamed / drifted) so the break is reproducible on demand |
| ATLAS | books.toscrape.com | `c_mt2fnqqngikv29od5` | title, price, rating, image, availability | 20 | Aug 21 | No robots.txt, built for scraping, server-rendered. **Rating lives in a CSS class, not in text** — the natural infected-field candidate |
| KESTREL | news.ycombinator.com | `c_mt2fnt3p2k4n644701` | title, points, comments, author | 30 | Aug 21 | Real site. robots.txt allows the front page, `Crawl-delay: 30` — a 30-minute scan is 60x inside the limit |

Verified Aug 21, 2026. `books.toscrape.com/robots.txt` returns 404 and the site states
"We love being scraped!"; Hacker News disallows only `/login`, `/vote?`, `/reply?` and
similar interaction endpoints, none of which we touch.

Codenames, universes, field lists and `Rows/run` mirror `collectors.json` exactly —
checked against it Aug 21. Keep them in step: `rows_per_run` is copied onto every incident
and is the multiplier behind blast radius (T-22), so a wrong number here becomes a wrong
claim on screen.

## Codename rules

Short, uppercase, one word, comic-book flavored. Used as the display name on the Spider
panel and set in `--t-codename` (Anton). Long names break the panel layout.

Examples: `BODEGA`, `ATLAS`, `VESPER`, `KESTREL`, `HALLOW`.

## Target selection constraints

- Publicly available data only — no login wall, no paywall
- **Not** in Bright Data's 800+ pre-built scraper library. Long-tail only: regional
  marketplaces, small catalogs, niche job boards, docs sites
- Server-rendered where possible — extraction should not depend on client-side hydration
- Stable enough to run every 30 minutes without tripping rate limits
- Check `robots.txt` and terms before pinning a target

## Heal history

Log every heal. This table is submission evidence that the Collector ID survived
healing — a stated requirement.

**The Collector ID column must show the same `c_*` before and after.** That is the whole
point of the table: it demonstrates the collector was repaired, not replaced. Copy the ID
verbatim from the row above rather than retyping it.

| Date | Collector ID (unchanged) | Codename | Strain | What broke | Integrity before → after | Duration | Incident |
|---|---|---|---|---|---|---|---|
| Aug 21, 07:48Z | `c_mt2lkwxa1bb5uz223s` | BODEGA | THROTTLED | All four fields returned `null` on four consecutive scans from `07:02:55Z` — the collector was reading the demo page but extracting nothing | 0% → **100%** | 94m 20s detection to verified | `inc_003` — closed, see below |
| Aug 21, ~06:40Z | `c_mt2fnqqngikv29od5` | ATLAS | DRIFTED | `availability` matched every `p.instock.availability` on the page and joined them, returning `"In stock (19 available) In stock In stock…"` on every row. The field stayed populated the whole time — it just stopped being true | 90% → **100%** | 106m 12s | `inc_002` — reconstructed after the fact, see below |
| Aug 21, 05:13Z | `c_mt2fnt3p2k4n644701` | KESTREL | RENAMED | The generated scraper emitted `story_points` and `comment_count` instead of the contracted keys, and every value was `0`. All four fields read `dead` | 0% → **100%** | 26m 24s | `inc_001` |

The KESTREL heal ran unattended end to end — `planner → code_fixer → step_preview_runner →
request_fulfillment_validator → css_selector_extractor → user_approval → save_new_template`
— with `--auto-approve --auto-save` and no human in the loop. The Collector ID above is
identical before and after: the collector was repaired, not replaced. A direct
`scraper run` afterwards returned 30 rows carrying real titles, points, comments and
authors where every field had been `null`.

**Every ID in this table is unchanged across its heal.** Three collectors broke, three came
back on the same `c_*`, and none was ever re-created.

**On the duration column:** it measures `closed_at − opened_at` — detection to verified
recovery, which is what MTTR reports on screen. For KESTREL that is 26m 24s. The `heal`
call itself was roughly 9 minutes of that; the rest is the gap before detection and the
verification run afterwards. Quote the span that matches the column, not the sub-step.

Fill one row per heal, straight from the incident record in `data/incidents.json`:

| Column | Source |
|---|---|
| Date | `opened_at`, UTC |
| Collector ID | `collector_id` — identical before and after, that is the evidence |
| Codename | `spider` |
| Strain | `strain` — `THROTTLED` / `RENAMED` / `DRIFTED` / `SHIFTED` |
| What broke | `anomalies`, and whether `recovered_fields` brought them all back |
| Integrity before → after | `integrity_before` → `integrity_after` |
| Duration | `closed_at` − `opened_at` |
| Incident | `id`, e.g. `inc_001` |

A heal that ran but left the Spider below `HEALTHY` has `resolved: false` — log it anyway
and say so in _What broke_. A partial recovery is real evidence; quietly omitting it is
the one thing that would make this table worthless.

## Incident records

Three heals, three records, all `resolved: true` — and each record states its own
provenance, because two of them were written after the fact:

| Heal | Record | Provenance, stated inside the record itself |
|---|---|---|
| KESTREL 0 → 100 | `inc_001` | Written live during the manual heal. All four stages, the prompt, the recovered fields |
| ATLAS 90 → 100 | `inc_002` | **Reconstructed** from the scan log — the heal was run by hand before the incident loop existed. Every timestamp is a real scan timestamp from `history.json` |
| BODEGA 0 → 100 | `inc_003` | **Opened autonomously by `repair.js`** during a scheduled run. The heal it fired did not fix anything — nothing on the target was broken; the watcher's own payload parser was. The closure was written from the recovery scan after the parser fix, and the record keeps the false THROTTLED diagnosis the system believed at the time |

The line between honest reconstruction and manufactured evidence is disclosure: each
record says how it came to exist, every timestamp traces to `history.json`, and the one
failed heal is presented as a failed heal. `inc_003` is the strongest artifact in the
set precisely because the system got the diagnosis wrong and the log says so.

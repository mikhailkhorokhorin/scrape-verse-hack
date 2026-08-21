# THWIP — Self-Healing Scraper Watch

Built for the "Into the Scrape-Verse" hackathon by WeMakeDevs x Bright Data
(Aug 17-23, 2026).

> This file is the working context for coding agents. Product reasoning lives in
> `PRODUCT.md`, the visual contract in `DESIGN-SPEC.md`, the backlog in `TASKS.md`,
> and pinned collector IDs in `COLLECTORS.md`. Read `DESIGN-SPEC.md` before writing
> any UI code — it is a contract, not a suggestion.

## Autonomous mode — read this first

**You do not ask for permission. You read state, then work, and you keep working until
the queue is empty.**

Everything an agent would normally have to ask about has been decided and written down.
Asking again wastes a turn and the answer is already in a file.

### On session start, in this order

1. Read `PLAN.md` — what is being built, in what order, and what has been cut.
2. Read `PROGRESS.md` — the queue. Take the **first unchecked item** and do that one.
3. Read the task in `TASKS.md` by its number.
4. When it is done, check it off in `PROGRESS.md`, commit, and move to the next item.
   Do not stop to report between tasks. Do not ask what to do next — the queue says.
5. Stop only when the queue is empty, a gate in `PLAN.md` fails, or you hit one of the
   two hard stops below.

### Already decided — do not ask, do not re-choose

| Question | Answer | Where |
|---|---|---|
| Which target sites? | Chosen and checked against robots.txt | `collectors.json` |
| Which collector IDs exist? | All three, created and pinned: BODEGA, ATLAS, KESTREL | `COLLECTORS.md` |
| Which CI runs? | **GitHub Actions**, `.github/workflows/watch.yml`. GitLab runners never came up; that project is a mirror | `docs/runbooks/GITHUB-SETUP.md` |
| What are the field validators? | Per collector, already declared | `collectors.json` |
| What order do I work in? | The queue | `PROGRESS.md` |
| Which tasks are cut? | The cut list | `PLAN.md` |
| Language for scripts? | Node | this file |
| Framework for the console? | None. Vanilla, no build step | `DESIGN-SPEC.md` |
| Start the frontend from what? | Port `docs/prototype.html`, never rewrite from spec | T-32 |

### Two hard stops — the only reasons to come back to a human

1. **Not authenticated.** If `bdata` reports no credentials and `BRIGHTDATA_API_KEY` is
   unset, stop and say so. `bdata login` opens a browser and needs a person. Everything
   before authentication (repo, scripts, frontend, prototype port) can still be done —
   do all of it first, and only then stop.
2. **Credit exhausted.** If a `create` or `heal` fails for billing reasons, stop. Do not
   retry — a retry on a billing failure just fails again.

Anything else: decide it yourself using the files above and keep going.

### Rules that hold without asking

These are not confirmations to request. They are checks to perform.

- **Never recreate a collector that has an ID.** Before any `bdata scraper create`, read
  `COLLECTORS.md`. If the codename already has a `c_*`, that collector exists. If its
  `run` is failing, the fix is `heal` — never `create`. A recreated collector costs
  25 minutes and real credit for nothing.
- **Pin every new ID immediately.** The moment `create` returns, write it to
  `COLLECTORS.md` and `collectors.json` and commit. Not at the end of the task — the
  moment it returns.
- **`create` and `heal` are slow, not hung.** 5-25 minutes and up to 15 respectively. Do
  not retry, do not restart, do not treat silence as failure. Start them, work on the
  next queue item while they run, come back.
- **Never read, print, echo, or commit a key.** Not in logs, not in commit messages, not
  in CI output. `.env`, `credentials.json` and `config.json` are gitignored — keep it
  that way.
- **Never change a target site.** They were chosen against real constraints: public, no
  login, not in Bright Data's pre-built library, robots.txt checked. Substituting one
  silently breaks a hackathon rule.
- **One task at a time, committed separately.** A single commit spanning six tasks cannot
  be reviewed or reverted.

### When something fails

Do not stop the queue for a failure you can route around. Mark the item blocked in
`PROGRESS.md` with one line saying why, and move to the next item that is not blocked by
it. Come back at the end. Stopping the whole run because task four failed wastes the
hours that tasks five through twelve would have used.

---

## Locked decisions

These were decided by the team. Do not relitigate them mid-build.

| Decision | Value | Rationale |
|---|---|---|
| Prize track | **Suit-Up (Best UI)** | Narrow track, lower competition, prize per team member |
| Team capacity | 1 developer, full days | Scope must fit one person by Aug 23 |
| Art direction | **Spider-Verse comic** | On-theme, radically unlike the generic dashboards other teams will ship |
| Targets | 1 self-hosted page + 2 niche real sites | Controlled break for demo, real sites for credibility |
| Healing | Automatic, `--auto-approve --auto-save` | Closed loop, no human in the path |
| Repo split | `docs/` = specs and tasks, `scrape-verse/` = implementation | Set by the team |
| Core visual metaphor | **Symbiote spread** as the primary health signal | Silent corruption is the actual failure mode; a creeping substance depicts it better than a bar |
| Field states | Three: `LIVE` / `INFECTED` / `DEAD` | An infected field passes null checks and still poisons the pipeline |

## What it is

A live watch console for web scrapers that repairs itself.

Every scraper is a **Spider** with an **Integrity** score: the percentage of expected
fields it actually populated on its last run. When a target site changes its layout,
extraction starts returning `null`s, Integrity drops, and the Spider visibly **glitches**
on the console. The system then calls Bright Data's self-healing, re-runs, verifies, and
the Spider recovers — all recorded as an incident with a replayable timeline.

The console is styled as a comic page. Panels, halftone, chromatic aberration,
onomatopoeia. Integrity loss is drawn as a black substance — *the symbiote* — creeping up
the Spider's panel, covering exactly as much of it as the scraper has lost. Healing tears
it free.

The metaphor is load-bearing, not decorative. A broken scraper does not crash: it keeps
running while its behavior is quietly replaced, and that is what a symbiote is. See
`PRODUCT.md`.

## Why this shape

The hackathon scores six criteria equally: impact, creativity, technical excellence,
use of Scraper Studio, reliability and self-healing, presentation. We are optimizing
for the **Suit-Up (Best UI)** track, so the console is the product and everything
behind it is the data source that feeds it.

Field-fill-rate is not an invented metric. Bright Data's own docs state that missing
fields come back as `null` and should be treated as such — Integrity is a direct read
of the platform's native failure signal.

## Hard constraints — do not violate

- Bright Data Scraper Studio must be central: real `bdata scraper create` / `run` /
  `heal` / `approve` calls, never mocked. A judge will check the Collector ID.
- Scrape only publicly available data. No login-walled or paywalled sites.
- Do NOT target sites already in Bright Data's 800+ pre-built scraper library.
  Pick regional / niche / long-tail sites.
- Keep `.env` and API tokens out of the repo and out of any demo recording.
- Collector IDs (`c_*`) are pinned in `COLLECTORS.md`. **Never recreate a scraper that
  already exists** — `create` costs 5-25 minutes and burns credit.
- Never commit `history.json` secrets or raw tokens in CI logs.

## Platform facts that shape the design

Verified against Bright Data docs on Aug 20, 2026. These are the constraints the
whole plan is built around.

| Fact | Consequence |
|---|---|
| `bdata scraper create` takes **5-25 min** | All collectors are pre-built. Never created during a demo. |
| `bdata scraper heal` takes **up to 15 min** | A live break-to-heal cannot be shown in real time. This is why Incident Replay exists. |
| `heal --auto-approve --auto-save` exists | Full unattended closed loop is a one-liner, not a stretch goal. |
| Collector IDs are stable across heals | Satisfies the "same Collector ID before/after" submission requirement. |
| Missing fields return `null` | Integrity is computable directly from run output. |
| `BRIGHTDATA_API_KEY` env var works headless | The CI cron works without interactive login. |
| Budget: $50 credit per participant | Every `create` and `heal` costs. Do not loop them carelessly. |

## Command reference

```bash
bdata login                                              # or export BRIGHTDATA_API_KEY
bdata scraper create <url> "<field description>"         # returns c_* — pin it
bdata scraper run <collector_id> <url> --pretty          # returns JSON
bdata scraper heal <collector_id> "<what broke>" --url <url> --auto-approve --auto-save
bdata scraper approve <collector_id> [--reject]
```

## Architecture

Deliberately small. Four moving parts, one of which is the product.

```
GitHub Actions — .github/workflows/watch.yml (cron */30, every 30 min)
  └─> health-check
        ├─ bdata scraper run <c_*> <url> --pretty
        ├─ compute Integrity = (live + 0.5 * infected) / expected * 100
        └─ append to data/history.json
              │
              ├─ if Integrity < 60 for 2 consecutive runs
              │     └─> repair
              │           ├─ bdata scraper heal ... --auto-approve --auto-save
              │           ├─ re-run + verify
              │           └─ append to data/incidents.json
              │
              └─> Dashboard (static, reads both JSON files)
```

Plus exactly one serverless function (T-38), which exists only so the console's
`RE-WEAVE` button can start the pipeline without shipping a trigger token to the
browser. It holds no state and makes no decisions.

No database. No API server. No backend framework. Two JSON files committed by CI.
This is intentional: every hour not spent on the console is stolen from the prize.

Two consequences worth naming. The CI commits roughly 48 times a day, which is not noise
— it is evidence: an unbroken run of timestamped automated commits over two days cannot
be faked the night before. And `history.json` grows about 144 records a day across three
collectors, so cap its length in the health check rather than discovering the limit
later.

## Data contract

`data/history.json` — append-only array of run records:

```json
{
  "collector_id": "c_xxx",
  "spider": "BODEGA",
  "universe": "example.com",
  "ts": "2026-08-20T12:00:00Z",
  "fields_expected": ["title", "price", "rating", "image"],
  "fields_live": ["title", "image"],
  "fields_infected": ["rating"],
  "fields_dead": ["price"],
  "integrity": 63,
  "status": "DEGRADED",
  "rows": 12,
  "sample": { "title": "...", "price": null, "rating": "undefined", "image": "https://..." }
}
```

Written by `runRecord` in `scripts/lib.js`. Notes on the fields that are easy to get wrong:

- `rows` — how many rows the run returned, after the 5000-row cap. Blast radius (T-22)
  multiplies it; do not drop it.
- `sample` — the **first row**, keyed by every expected field, with `null` where the field
  was absent. It is what the console shows as the received value (T-36) and what the
  moment-of-infection diff reads (T-20), so it always carries every expected key even when
  the value is `null`.
- `status` is derived from `integrity` by the thresholds below — 63 is `DEGRADED`, not
  `CRITICAL`.
- Field state is decided by a **majority vote across all rows**, not by the first row. One
  malformed row in twenty does not mark a field infected.
- A run appended by a post-heal verification also carries `"after_heal": true`.

`data/incidents.json` — append-only array of incidents:

```json
{
  "id": "inc_001",
  "spider": "BODEGA",
  "collector_id": "c_xxx",
  "opened_at": "2026-08-20T12:00:00Z",
  "closed_at": "2026-08-20T12:14:00Z",
  "integrity_before": 50,
  "integrity_after": 100,
  "anomalies": ["price", "rating"],
  "recovered_fields": ["price", "rating"],
  "summary": "Extraction kept succeeding while price and rating stopped returning usable values. The re-weave restored price and rating and Integrity returned to 100%.",
  "rows_per_run": 12,
  "strain": "RENAMED",
  "heal_prompt": "On example.com: 'price' and 'rating' return null after a layout change. Likely RENAMED: the other fields still extract correctly, so a selector moved rather than the page changing wholesale. Fix the extraction for those fields.",
  "resolved": true,
  "stages": [
    { "stage": "DETECTED",  "ts": "2026-08-20T12:00:00Z" },
    { "stage": "DIAGNOSED", "ts": "2026-08-20T12:00:30Z" },
    { "stage": "REWEAVING", "ts": "2026-08-20T12:01:00Z" },
    { "stage": "VERIFIED",  "ts": "2026-08-20T12:14:00Z" }
  ]
}
```

Written by `scripts/repair.js`. The fields that are not self-evident:

- `collector_id` — the console joins incidents to runs on this, not on `spider`.
- `recovered_fields` — the subset of `anomalies` that came back `live` on the verification
  run. Empty when the heal ran but fixed nothing.
- `summary` — a written sentence, already phrased for display. The console prefers it over
  reconstructing prose from the field lists.
- `rows_per_run` — copied from `collectors.json` so blast radius (T-22) can be computed
  from the incident alone.
- `resolved` — `true` only when the verification run came back at or above the `HEALTHY`
  threshold. A heal that completed and left the Spider `DEGRADED` is `false`.
- `closed_at` and `integrity_after` are `null` when the heal or its verification run
  failed. `stages` then stops short of `VERIFIED`, which is how the console tells an open
  incident from a closed one.

Every field resolves to one of three states:

| State | Condition |
|---|---|
| `LIVE` | present and passes its validator |
| `INFECTED` | present but fails its validator — price parsing as text, rating out of range, title containing `undefined` |
| `DEAD` | `null`, `""`, or `[]` |

Integrity weights infection at half credit:

```
integrity = round((live + 0.5 * infected) / expected * 100)
```

A field that returns garbage is worth less than one that returns correctly and more than
one that returns nothing — nothing at least fails loudly.

`status` derives from Integrity, and the **stored** vocabulary is exactly three values:
`HEALTHY` >= 90, `DEGRADED` 60-89, `CRITICAL` < 60. `statusOf` in `scripts/lib.js` never
writes anything else.

Two further states exist **only in the console**, derived at render time — they are not
written to `history.json` and nothing should look for them there:

| State | Where it comes from |
|---|---|
| `UNWATCHED` | derived in `web/js/adapter.js` when the newest run is over 3 hours old |
| `REWEAVING` | read from `status` by `adapter.js`, for a heal in flight |

`REWEAVING` is currently unreachable: the console tests `status === "REWEAVING"` but no
writer emits it, because `repair.js` runs to completion inside one CI job and never
persists a mid-heal run. Either a heal must write an in-flight record or that branch stays
decorative — do not treat the check in `adapter.js` as evidence the state occurs. There is
no `RECOVERED` state anywhere in the system; recovery is visible as a normal `HEALTHY` run
carrying `after_heal: true`.

Each incident also carries a `strain` — what kind of break it was, derived from the same
field states by `strainOf` in `scripts/repair.js`. Tested in order; the first match wins:

| Strain | Heuristic |
|---|---|
| `THROTTLED` | every expected field is dead — the request was blocked or served another page |
| `SHIFTED` | a broken field's received value passes a **still-healthy** field's validator, and both validators are narrow (`number` or `url`) — the columns slid |
| `DRIFTED` | infected fields outnumber dead ones — values arrive and are wrong |
| `RENAMED` | anything else with a dead field — the rest still extract, so a selector moved |

Two details that are easy to get wrong when re-implementing this:

- **`SHIFTED` is tested before `DRIFTED`**, because a slid column is a more specific
  diagnosis than "values are wrong" and both conditions can hold at once.
- **`SHIFTED` only considers narrow validators.** A permissive `string` rule accepts
  almost any garbage, so matching against one produces constant false positives — an
  invalid price of `"free"` satisfies any 3-200 character `title` rule. Requiring both
  sides to be a `number` or `url`, and requiring the receiving field to still be healthy,
  is what makes the signal mean anything.

The strain sharpens the heal prompt: a prompt saying the selector was likely renamed and
the rest of the page still extracts gets a better fix out of Scraper Studio than "price is
null". `buildPrompt` appends the strain and its one-line rationale to every heal request,
and the console prints the strain on each incident card and in Incident Replay (T-10).

**Mean time to recovery** is derived, not stored: the mean of `closed_at - opened_at`
across `data/incidents.json`.

## The 48-hour rule

**The cron must be running before any UI work starts.**

A console with three data points on its chart looks like a prototype. A console with
two days of dense history looks like a product. The cron needs to sit and accumulate
while the developer builds the front end. Starting it late cannot be undone — there is
no way to backfill real history on the last day.

This makes T-01 through T-04 in `TASKS.md` blocking, in that order, ahead of everything
visual.

## Definition of done

- [ ] Repo with setup instructions a judge can clone and reproduce
- [ ] Real `bdata scraper create` + `run` flow, Collector IDs pinned in `COLLECTORS.md`
- [ ] `bdata scraper heal` demonstrated working, same Collector ID before and after
- [ ] Collector ID wired into the console (not just a terminal screenshot)
- [ ] At least 48 hours of real run history in `data/history.json`
- [ ] At least one real, unstaged incident recorded end to end
- [ ] Demo video showing break -> glitch -> re-weave -> recovery
- [ ] No secrets committed, `.env` gitignored
- [ ] Console matches `DESIGN-SPEC.md` — no generic dashboard defaults

## Reference docs

- Scraper Studio overview: https://docs.brightdata.com/datasets/scraper-studio/overview
- Build with the CLI: https://docs.brightdata.com/datasets/scraper-studio/build-with-the-cli
- Self-healing tool: https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool
- Coding-agent prompts: https://docs.brightdata.com/datasets/scraper-studio/coding-agent-prompts
- CLI command reference: https://github.com/brightdata/skills/blob/main/skills/brightdata-cli/references/commands.md
- Hackathon kick-off: https://www.wemakedevs.org/blogs/scrape-verse-kick-off
- Hackathon resources: https://www.wemakedevs.org/hackathons/scrape-verse/resources

# THWIP — agent entry point

Hackathon project. Deadline **Aug 23, 2026**. You are working autonomously.

## First, make sure the docs are here

Specs, plan and task queue live in a separate repository. It is gitignored here, so clone
it into this directory if it is missing:

```bash
[ -d docs ] || git clone git@gitlab.com:hackathons6943133/scrape-verse/docs.git docs
```

Then read `docs/CLAUDE.md` — it is the real operating manual and it supersedes nothing
here, it completes it.

## How you work

**You do not ask for permission. You read state, then work, until the queue is empty.**

1. `docs/PLAN.md` — what is being built, in what order, what is cut
2. `docs/PROGRESS.md` — the queue. Take the **first unchecked item**
3. `docs/TASKS.md` — the task detail, by number
4. Do it, check it off in `PROGRESS.md`, commit, move to the next item.
   Do not report between tasks. Do not ask what to do next — the queue is the answer

Commit each task separately. A single commit spanning six tasks cannot be reviewed.

## Already decided — do not re-choose

| Question | Answer |
|---|---|
| Target sites | `collectors.json`, chosen and robots-checked. **Never substitute one** |
| Collector IDs | `docs/COLLECTORS.md`. Empty means not yet created |
| Field validators | `collectors.json`, per collector |
| Scripts language | Node |
| Console framework | None. Vanilla, no build step |
| Frontend starting point | Port `docs/prototype.html`. Never rewrite it from the spec |
| CI | GitLab. There is no in-file cron; the schedule is created in the project UI |

## Two hard stops — the only reasons to come back to a human

1. **Not authenticated.** `bdata` has no credentials and `BRIGHTDATA_API_KEY` is unset.
   `bdata login` opens a browser and needs a person. Everything marked *(no auth)* in the
   queue can still be done — **do all of it first**, then stop
2. **Credit exhausted.** A `create` or `heal` fails for billing reasons. Do not retry

Anything else: decide it yourself from the files above and keep going.

## Rules that hold without asking

- **Never recreate a collector that has an ID** in `docs/COLLECTORS.md`. If its `run` is
  failing, the fix is `heal`, never `create`. A needless recreate costs 25 minutes and
  real credit
- **Pin a new ID the moment `create` returns** — into `docs/COLLECTORS.md` and
  `collectors.json`, then commit. Not at the end of the task
- **`create` (5-25 min) and `heal` (up to 15 min) are slow, not hung.** Never retry,
  restart, or treat silence as failure. Start them, work the next queue item, come back
- **Never read, print, echo or commit a key.** `.env`, `credentials.json` and
  `config.json` are gitignored — keep it that way
- **A failure does not stop the queue.** Mark the item `[!]` in `PROGRESS.md` with one
  line saying why, skip to the next item not blocked by it, come back at the end

## What this is

Scrapers do not crash, they decay. A site changes, extraction starts returning nulls and
wrong values, and the pipeline stays green while the data rots. Every scraper is a Spider
with an Integrity score; when it drops, a black substance climbs its panel covering
exactly what was lost, and the system heals it and records the incident.

Full reasoning in `docs/PRODUCT.md`. Visual contract in `docs/DESIGN-SPEC.md` — read it
before any UI work, its banned-patterns section is not optional.

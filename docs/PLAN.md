# THWIP — Delivery Plan

Written Aug 21. Deadline **Aug 23**. One developer plus one product/content lead.

`TASKS.md` is a menu of 38 tasks. This is the plan: what actually gets built, in what
order, and what gets dropped. Where the two disagree, this file wins.

---

## The situation, stated plainly

Two days remain. Thirty-eight tasks do not fit into two days for one developer — roughly
fifteen to eighteen will land. That is not a problem to solve, it is a constraint to plan
around, and the failure mode is not "we ran out of time" but "we ran out of time while
nine things were half-finished."

The single most valuable hour available is the one that starts the cron, because it is the
only work whose value **decays with delay**. Every visual feature in this project —
heatmap, pulse, scars, blast radius, MTTR, Replay — reads from history that cannot be
created retroactively. A console with six hours of data looks like a prototype no matter
how well it is built.

---

## Three rules that shape the schedule

**1. Start the slow things first, then work while they run.**
`bdata scraper create` takes 5-25 minutes per collector and `heal` up to 15. These are not
blocking waits — they are background jobs. Fire all three creates, then write the health
check while they cook. Never sit and watch a progress bar.

**2. Schedule the first break. Do not wait for one.**
Incident Replay, blast radius, MTTR and the scars all need at least one **completed**
incident. Real sites may not break on our timetable. So we break the demo page on purpose
on the morning of Aug 22 — early enough that the full detect → heal → verify cycle is
recorded and sitting in `incidents.json` by that evening, with hours to spare before the
video.

**3. Verify the riskiest assumption before building on it.**
We have never run `bdata scraper heal`. The 15-minute figure and the `--auto-approve`
behavior come from documentation, not observation. Run it manually, once, early on Aug 21.
If unattended healing does not work the way the docs say, every downstream decision
changes — and it is far cheaper to learn that on day one.

---

## Day 1 — Aug 21

### Block 1 · Foundations (~1h) — developer
`T-24` repo, `T-25` secrets, `T-01` demo target page deployed.

Order matters only in that nothing else can start first. The demo page needs a real,
public URL before the next block.

### Block 2 · Collectors, fired in parallel (~30min active, ~1h elapsed) — developer
`T-02` — run all three `bdata scraper create` calls back to back, then stop waiting.
**Pin every `c_*` in `COLLECTORS.md` the second it returns.**

While they generate: write `T-03`, the health check. The data shape is already fixed in
`CLAUDE.md`, so it can be written before a single collector exists.

### Block 3 · The cron — GO/NO-GO (~1h) — developer
`T-04`. This is the hard gate of the entire project.

**By the end of today the cron must have committed two consecutive scheduled runs
without intervention.** If it has not, everything else stops and this gets fixed. Nothing
built tonight matters if the history never starts.

**What actually happened:** GitLab runners never came up — sixteen consecutive pipelines
failed before creating a single job — so the pipeline moved to **GitHub Actions**
(`.github/workflows/watch.yml`), where the `*/30` cron lives in the file rather than in a
UI schedule. `T-04` as written against GitLab is superseded; `docs/runbooks/GITHUB-SETUP.md` is the
record of the migration.

### Block 4 · Prove the heal (~20min active) — developer
Run one manual `bdata scraper heal` against the demo collector. Record the actual duration
in `COLLECTORS.md`. Do not automate anything until you have watched it work once.

### Block 5 · Frontend, while the cron accumulates (~3h) — developer
`T-32` port the prototype, then `T-16` panel sizing and `T-18` bursts.

None of these need real data. By the time they are done the cron has a night's history.

### Parallel track — product lead
`T-29` codenames and on-screen copy. `T-15` LinkedIn post — it is a separate prize with no
competition for developer hours, and it is easiest to write while the work is fresh.

---

## Day 2 — Aug 22

### Block 1 · Break it on purpose (~30min) — both
Rename the classes on the demo page. Confirm the next scan drops Integrity and opens an
incident. Let the automated heal run to completion.

This is rule 2 in action: by evening we need a **finished** incident on disk, and it takes
hours to get there. Starting this in the afternoon is starting it too late.

### Block 2 · Close the loop (~2h) — developer
`T-05` repair script, `T-06` wire it into the cron. The incident from Block 1 is the test
case.

### Block 3 · Real data on screen (~2h) — developer
`T-09` fetch real JSON, `T-26` deploy, `T-27` empty and degraded states.

**GO/NO-GO at midday:** if the deployed console is not reading real data by now, cut every
remaining feature and spend what is left making the base console correct. A finished
simple console beats an unfinished ambitious one, and it is not close.

### Block 4 · The features that earn their place (~3h) — developer
In this order, stopping whenever time runs out:
1. `T-21` MTTR — one hour, one number, reframes the whole project
2. `T-20` moment of infection — the proof a judge asks for
3. `T-28` legend — without it the symbiote reads as decoration
4. `T-10` Incident Replay — needed for the video
5. `T-36` reveal what arrived — twenty minutes, turns the violet chip into evidence

### Block 5 · Rehearse and record (~2h) — both
`T-12` two clean rehearsals with `data/` backed up. `T-13` record the video.

Record tonight, not tomorrow. Tomorrow is for the take that goes wrong.

---

## Day 3 — Aug 23

### Morning — both
`T-14` README with the roadmap section. Final pass over the submission checklist. Submit.

**Submit before you are finished polishing.** A submitted good project beats an unsubmitted
great one, and there is no partial credit for a repository nobody looked at.

### If time remains, in this order
`T-33` field heatmap, `T-38` heal trigger endpoint, `T-22` blast radius, `T-11` full detail
view, `T-17` page-level symbiote.

---

## Cut list

Dropped unless everything above is finished early. Written down so the decision is made
once, calmly, instead of repeatedly at 2am:

`T-19` history playback · `T-29` names and on-screen copy · `T-30` incident deep link ·
`T-31` accessibility and performance pass

Each is a good idea. None of them is worth an unfinished console.

**Updated Aug 21 — four of the original cuts were built anyway.** `T-23` clean streak,
`T-34` fleet pulse, `T-35` scars and `T-37` small finishers all landed, along with `T-11`
Spider Detail and `T-10` Incident Replay from the stretch list. The base console was
finished early enough that cutting them stopped being the right call. `PROGRESS.md` has
the per-feature detail; treat that file, not this list, as the record of what exists.

---

## Go/no-go gates

| When | Gate | Outcome |
|---|---|---|
| End of Aug 21 | Cron has committed two scheduled runs unattended | **Passed, after moving to GitHub Actions.** GitLab runners never started |
| Aug 21, after Block 4 | A manual heal completed and its duration is recorded | **Passed three times.** KESTREL 0 → 100, ATLAS 90 → 100 and BODEGA 0 → 100, all logged in `COLLECTORS.md` |
| Midday Aug 22 | Deployed console reads real data | **Passed.** https://mikhailkhorokhorin.github.io/scrape-verse-hack/ reads `data/*.json` |
| Evening Aug 22 | One complete incident on disk, video recorded | **Half passed.** `inc_001` is complete on disk and `inc_002` is open; the video is still to record |

---

## Division of labor

**Developer:** everything in `TASKS.md` with code in it. Receives three tasks at a time,
never the whole file.

**Product lead:** codenames and copy, README, video script and recording, LinkedIn post,
the collector registry, and deciding what gets cut at each gate. Cutting is a job, and it
belongs to the person who is not writing the code.

---

## The one-sentence version

Start the cron today, break the demo page tomorrow morning, record the video tomorrow
night, submit on Sunday morning — and cut everything that threatens any of those four.

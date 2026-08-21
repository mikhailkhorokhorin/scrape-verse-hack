# Starting prompt for the next session

Paste the block below. Everything it needs is in the repository — keep it short so it
does not compete with the files it points at.

---

```
THWIP, Scrape-Verse hackathon. Deadline Aug 23. Read CLAUDE.md, then docs/PLAN.md,
then docs/COMPETITION.md — the last one is new and it changes the priorities.

Do not rewrite anything. The system works, 528 tests are green, three real
incidents are recorded. Two days out, finished beats better.

Work these four in order, committing each separately:

1. T-12, the autonomous break. Copy demo-target/broken-renamed.html over
   demo-target/index.html, commit, push, then leave the cron alone. Do not touch
   any phase by hand — the whole point is a fourth incident where no human
   intervened. Do NOT revert index.html afterwards.

2. Make the engineering visible in README.md. 528 tests, zero runtime
   dependencies, ESLint enforced in CI, 250-line cap, zero comments. It is all
   true and none of it is on the first screen. Best Code is the most winnable
   prize we have and it costs documentation, not code.

3. SHA-256 payload fingerprints on incidents, before and after the heal. The
   payloads are already in data/. Show both on the incident card so a heal can
   be verified instead of believed.

4. Last-known-good fallback: when a scan fails at transport, serve the last
   verified rows labelled with their age instead of showing nothing.

Budget: ~3500 Bright Data credits left. Only step 1 spends any, about 50-60.
Never recreate a collector that has an id in docs/COLLECTORS.md — heal it.

Before pushing: git pull --rebase, and avoid pushing near :00 and :30. The
workflow has concurrency group "watch" and push is a trigger, so a push during a
scan cancels it and that interval's data is lost.
```

---

## Why these four and not others

**T-12 is the only irreplaceable one.** Every competitor can claim self-healing; the
recording of a break that no human touched is what makes ours checkable. It also takes
wall-clock time — two scans plus a heal, an hour or two — so it must start first.

**Step 2 is free points.** The engineering standard already exists and is invisible.
Nothing else on the list has that ratio.

**Step 3 answers DriftWatch directly.** They advertise a "Proof-of-Recovery Evidence
Report" with SHA-256 fingerprints. We have the payloads already; hashing them costs an
hour and turns our incidents from a claim into an artifact.

**Step 4 is the only one that can be dropped** without losing anything a judge scores.

## What not to do, and why it will be tempting

Rewriting for "cleaner architecture" is the most dangerous available move. So is the
auto-PR loop DriftWatch built — it is a second product, it belongs to a track we chose not
to chase, and it does not fit in two days.

If time runs short, cut from the bottom. Four half-finished items lose to two finished
ones.

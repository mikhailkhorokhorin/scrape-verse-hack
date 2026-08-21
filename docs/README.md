# THWIP — documentation

Everything behind the console: why it is shaped this way, what was decided, what was
checked, and what actually happened to the collectors. The code is one directory up; the
[root README](../README.md) is the tour.

## If you are judging this, read three files

| Read this | It answers |
|---|---|
| [COLLECTORS.md](COLLECTORS.md) | Are the collectors real, and did the Collector ID survive healing? Every `c_*` with its creation date and a dated log of every heal — the KESTREL 0 → 100 repair included |
| [PRODUCT.md](PRODUCT.md) | Why a scraper watch console looks like a comic page. The metaphor, the screens, the reasoning |
| [DESIGN-SPEC.md](DESIGN-SPEC.md) | The visual contract the console was built against — palette, type, the five signature effects, and a banned-patterns list that rules out the generic dashboard |

## The rest

| File | What it is |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Operating manual for coding agents: locked decisions, platform facts, and the full `history.json` / `incidents.json` data contract |
| [PLAN.md](PLAN.md) | The two-day schedule, the go/no-go gates, and the cut list |
| [TASKS.md](TASKS.md) | 38 tasks with acceptance criteria. A menu, not a to-do list — `PLAN.md` says which were built |
| [PROGRESS.md](PROGRESS.md) | The queue, as it was actually worked. Checked items are shipped |
| [AUDIT-PIPELINE.md](AUDIT-PIPELINE.md) | Eighteen audits with a pass bar each, run before submitting |
| [SUBMISSION.md](SUBMISSION.md) | The submission checklist against all four categories, with where the evidence lives |
| [VIDEO-SCRIPT.md](VIDEO-SCRIPT.md) | The demo video, cut to answer the four Bright Data judging questions in under 60 seconds each |
| [LINKEDIN-POST.md](LINKEDIN-POST.md) | The Daily Bugle track post |
| [STRATEGY.md](STRATEGY.md) | Competitive read of the field and where this project chose to be different |
| [runbooks/](runbooks/) | Records of things already executed — the [GitHub migration](runbooks/GITHUB-SETUP.md) and the [three `create` calls](runbooks/RUNBOOK-T02.md). Kept so the setup can be reproduced or checked; nothing in them is outstanding |

## Ground rules these documents hold to

- Bright Data Scraper Studio is central — real `create` / `run` / `heal` calls, never
  mocked. A judge will check the Collector ID
- Public data only. No login walls, no paywalls, nothing already in Bright Data's
  pre-built library
- `create` takes 5-25 minutes and `heal` up to 15, and both cost credit. **Never recreate
  a collector that already exists** — every ID is pinned in `COLLECTORS.md`
- No secrets in the repo, in CI logs, or in any frame of the demo video

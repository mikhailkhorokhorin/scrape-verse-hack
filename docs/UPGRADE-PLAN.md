# UPGRADE PLAN — the final push

> **This is push one, and it is largely done.** The remaining pipeline — the leftover
> work here, the six moves from `BEST-UI-THE-PLAY.md`, and a twelve-audit battery — is
> **`SECOND-PUSH.md`**. Read that for what happens next; read this for what was decided
> and what was already verified.

Written Aug 21, evening. Deadline Aug 23. Goal: win every category. This plan covers
the last visual push, five sequential part-by-part audits, a final scored audit, and a
repository cleanup. Nothing here starts until the plan is approved; each phase gates on
the one before it.

Standing constraints for every task in this file: no comments in code, max 250 lines
per file, vanilla JS as plain globals loaded via `<script>` in order (no modules, no
build step), CSS split by meaning, `npm test` green (821 at the time of writing; 886
after the coverage pass) and `npx eslint .`
clean after every phase, `DESIGN-SPEC.md` section 8 (Banned) checked before any CSS
lands, `prefers-reduced-motion` honoured by every new animation, pushes never near
:00/:30 (cron), `git pull --rebase` + check the remote before pushing.

Orchestration: **at most 3 agents at a time.** Phase 1 runs its three tasks in
parallel (one agent each). Phase 2 runs its five audits **sequentially** (one agent at
a time — each audit fixes what it finds, and parallel fixes to the same surfaces would
collide). Phases 3-5 are done by the lead directly.

---

## Phase 0 — Decisions (made now, recorded so they stop being re-litigated)

**Do not split the site into pages.** One long page is the comic format: a judge opens
one URL and sees everything without navigation; `#inc_XXX` deep links already work;
splitting would bury half the evidence behind clicks nobody makes. The "one big pile"
feeling is treated instead by Phase 1: a sticky section index, doubled air between the
page's major acts, and web motifs that mark section boundaries.

**Web motifs and animation stay quiet.** Everything added is ink-coloured, low-opacity,
draws once, and goes still. The loud layer (bursts, symbiote, glitch) is reserved for
damage, per the spec: "Damage is loud" — so calm must stay calm.

**Already fixed, uncommitted, ships with Phase 1:** the `ISSUE #N` badge on incident
covers rendered dim lavender on cyan (1.21:1) because `.incident p` in `feed.css`
out-specifies `.issue__no`; the selector is now `.issue .issue__no` and the text is ink
(12.8:1). Found by the contrast sweep that seeded this plan.

**Confirmed non-bugs, so nobody re-fixes them:** `--critical` text on `--void` measures
5.07:1 (passes AA; the spec's own 4.2:1 note is stale) and the `.rest` block that
scored 1:1 is `display:none` — a hidden template branch, not invisible text.

---

## Phase 1 — Build: three improvements, three agents, parallel

**Status: done Aug 21, 19:48 UTC.** Three agents, three commits, pushed after a rebase
onto the cron's 19:30 scan. 826 tests green (1C added 5), `npx eslint .` clean, every
file under 250 lines, zero comments anywhere in `web/`.

Measured at the gate rather than taken on report:

- **Rhythm, the point of the whole phase:** act boundaries now 68-72px against 20-24px
  inside an act, off `getBoundingClientRect`. Before: 44-48 vs 20-24. Two tiers that
  close together were the actual reason the page read as a pile.
- **Headings:** all four now read as sentences — "THE WATCH: 3 SPIDERS UNDER WATCH".
- **Router safety:** `#nav-feed` navigates, console clean, and `#inc_003` still routes
  (`body.has-issue`, replay mounted) with the nav in place.
- **No horizontal scroll** at 375 or 640: `scrollWidth === clientWidth` at both.
  `.fleet-symbiote` sits outside the viewport by design and creates no scroll — two
  agents flagged it as overflow; both flags were false alarms, checked directly.
- **`?capture=1`:** nav hidden, all 8 web nodes present at opacity .13.

One flag left open on purpose: the impeccable hook reports `border-accent-on-rounded`
on `pagenav.css` L6. It is wrong — the rule sets `border-radius:0` and the border is a
`border-bottom` on a square strip, which is what the spec requires. Not suppressed.


### 1A · Sticky section index (`web/js/sheets/front/pagenav.js`, `web/css/sheets/pagenav.css`)

The answer to "split it into pages" that keeps one page.

- A compact fixed strip at the top of the viewport that appears only after the masthead
  scrolls out (IntersectionObserver; no scroll-handler thrash). Slides in ~200ms;
  appears instantly under reduced motion.
- Contents: small THWIP mark (Anton), then THE WATCH · THE HAUL · REPLAY · FEED as
  IBM Plex Mono uppercase links. Paper ground, 3px ink border, hard shadow, square
  corners. No blur, no glass.
- Current section highlighted via IntersectionObserver over `#grid` / `#haul` /
  `#replay` / `#feed`.
- Real `<a href="#...">` anchors. **Must not fight the issue router**: anchors target
  non-`inc_*` ids so `issue-route.js` treats them as fallthrough; verify no error and
  no replay remount on nav clicks.
- z-index below the modal (sheet covers it), above panels; must not overlap the fleet
  pulse, bursts (60), or bubbles (62) — verified by screenshot at all three widths.
- Hidden in `?capture=1`, hidden in print (one line in `print.css`'s blacklist),
  hidden while `body` carries the intro-running class.
- 375px: tighter padding, one line, no horizontal scroll.

Done when: appears after scroll and not before; highlights track scrolling through all
four sections; click navigates (instant under reduced motion); absent in capture,
print, and during the intro; no overlap anywhere; tests and lint green.

### 1B · Web motifs + quiet line animation (`web/css/fleet/webs.css`, `web/js/fleet/scene/webs.js`)

The "паутинки" pass — presence, not noise.

- Each `.sechead .rule` (the 4px ink line beside every section title) gains a small
  inline-SVG web node where the line meets the title box: ink stroke, opacity ≤ .25,
  8-12 strands. Drawn once via `stroke-dashoffset` when the header first enters the
  viewport (IntersectionObserver + a class); static when already visible on load;
  instant under reduced motion.
- One additional corner web in the feed area (bottom corner), matching the two
  `.wrap` corner webs UI-13 already ships — same dry-brush character, ≤ .07 opacity.
- The masthead's existing web stays as is.
- Markup for the rule nodes is injected by `webs.js` (not hand-edited into
  `index.html`) so the four secheads stay one source of truth.
- Nothing loops. Nothing moves after its first draw. Total added animation time on a
  full scroll: under 2 seconds.

Done when: every section rule carries its web node; the draw fires once per header per
load; reduced motion shows them complete with no animation; capture/print unaffected
(they are decoration — hidden in print with the existing artefact rules); no FPS drop
at 375px (spot-check against the 76fps baseline).

### 1C · Rhythm, holes, and heading a11y (`web/css/base/layout.css`, `web/js/fleet/grid/caption.js`)

The "все в куче / где-то пустоты" pass.

- Major act boundaries get real air: `.sechead` top margin `--s5`(48) → `--s6`(72) and
  the diptych/legend/wildnote blocks checked so every *between-acts* gap lands ~72-96px
  while *inside-act* gaps stay 20-24px. The measured state today is 44-48 vs 20-24 —
  too shallow a hierarchy to read as structure.
- Holes sweep: screenshot the full page at 1440/1024/768/375 and list every spot where
  emptiness reads as accident (a short grid row, a dangling half-column, the legend's
  right edge, masthead right side on tablet). Fix each with layout (span, alignment,
  max-width) — not with filler content.
- Screen-reader fix: the caption `<h2>`s read as one glued string
  ("THE WATCH3SPIDERS UNDER WATCH"). Give the number span an `aria-hidden` duplicate or
  join with a visually-hidden separator so the accessible name reads as a sentence;
  verify with the accessibility tree, not by eye.

Done when: the gap table (re-measured) shows two clearly distinct tiers; no accidental
hole at any of the four widths; the accessibility tree reads every heading as words
with spaces; tests and lint green.

**Phase 1 gate:** all three agents report; lead re-runs tests + lint, screenshots the
full page at 1440/375, commits (one commit per task, plus the Phase-0 contrast fix),
pushes in a safe window.

---

## Phase 2 — Five sequential audits, one part each

**Status, morning of 22 Aug:** Audits 1 and 2 are done and committed (masthead hole,
diptych alignment, scroll-padding for every anchor, grid fill rules, rig watermark,
36 state-by-width combinations measured). Audit 4's core ran early under the lead:
the routing matrix (3 real ids, garbage, empty), the sheet's focus trap and focus
return, and the print defect — an open incident now prints on one page. Audit 3 was
interrupted mid-fix by an API error; its work-in-progress sits in **`stash@{0}`**
("audit3 wip: replay + receipt, one test red") and is closed out as step S0 of the
second push below. Audit 5 never started — it is folded into the second push's
battery, which supersedes this phase for everything still open.

One agent at a time, in this order. Every audit has the same mandate: **screenshot
everything in its territory** (1440, 768, 375 — plus states only it can reach), find
every flaw, **fix what it finds**, verify the fix in the browser, keep tests+lint
green, and report what changed. Territory boundaries are strict so audits never fight
each other's fixes.

### Audit 1 — Above the fold: masthead, evidence line, pulse, diptych
- Wordmark, tagline, evidence line, REPLAY INTRO button, four readouts: alignment,
  wrapping, contrast, truncation at every width.
- Fleet pulse: legibility, the beats label, hidden-below-8-scans rule.
- Diptych: both halves aligned, captions read as archive (not live), disabled panels
  skip focus, HELD/TAKEN stamps legible, symbiote on the taken half.
- Nothing overlaps: pulse vs sticky nav, wordmark web vs tagline.

### Audit 2 — THE WATCH: grid, panels, every state, legend
- Via `?mock=1` drive every state: healthy compact, degraded, critical/drowned
  (spread .85), unwatched, healed-with-scars; check rig legibility, leg states, eye
  counts, badges, chips, streaks, panel numbers, teeth edge in each.
- Landing flash, speech bubble, rig reaction (drive `announceLandings` with a mutated
  array), one-bubble-at-a-time.
- Legend: survives compact panels, reads at 375, its swatches match the real colours.
- Grid holes at every width with every state mix (one critical + two healthy, etc.).

### Audit 3 — THE HAUL + Incident Replay
- Haul cards: real rows, provenance stamps, integrity-at-capture, overflow of long
  titles, empty state.
- Replay: play/pause/scrub/keyboard (Space, arrows), stage ticks, ledger, blast tick,
  the verification receipt table, deep-linked replay vs default pick.
- Receipt at 375 (table must scroll inside itself, never the page).

### Audit 4 — Incident Feed: covers, routing, print, detail sheet
- Three covers: issue numbers (now ink-on-cyan), strain subtitles, worst-moment
  character, deltas, permalinks, IN THE WILD note, open-state outline.
- Hash routing: each real id, garbage id, hash-before-data, hashchange loops, nav
  anchors from 1A pass through untouched.
- Print: one page per open issue with the receipt, chrome hidden — re-verify after 1A/1B
  added elements (their print-blacklist lines actually work).
- Detail sheet: rig + chips, facts, RE-WEAVE button state, tracks, heatmap, sample
  JSON, focus trap, Escape, scrollbar styling inside.

### Audit 5 — Intro, interactions, cross-page sweep
- Intro: plays once per tab, all six beats against real inc_003, the 2.6s hold, skip by
  click/key/scroll, REPLAY INTRO, `?intro=1`, reduced-motion path, state after skip
  byte-identical to a plain load, sticky nav hidden during it.
- Favicon reflects fleet integrity; tab title reacts; evidence line updates on poll.
- Full-page overlap sweep at 1440/1024/768/375: programmatically detect any two
  visible elements from different components intersecting wrongly (bursts and
  deliberate bleeds excluded); fix what it finds.
- Console must stay error-free through: default, `?mock=1`, `?capture=1`, `?intro=1`,
  every real hash, garbage hash, empty-data serve.

**Phase 2 gate:** after each audit — tests, lint, commit ("audit N: what it found and
fixed"). After all five: push in a safe window, verify the live deploy.

---

## Phase 3 — Final impeccable audit (lead, not an agent)

Run the full `/impeccable audit` scorecard over the finished surface: Accessibility,
Performance, Theming, Responsive, Anti-patterns — each 0-4, with the P0-P3 findings
list. Target: **≥18/20, zero P0, zero P1.** Anything P0/P1 found here gets fixed on
the spot; P2/P3 get logged in this file's appendix with an honest keep/cut call.
This is also UI-09 pass 2 (the phone gate): 375px, real frame-rate measurement, no
horizontal scroll — recorded in `docs/ideas/UI-09-phone-pass.md` as the brief demands.

**Status:** not run. Rescheduled as the final gate of the second push (S5), where it
belongs — after the moves land, not before.

---

## Phase 4 — Repository cleanup (lead — file moves touch judge-facing paths)

**Status: done Aug 21, except the README screenshot retake, which waits for Phase 3.**
Executed early, while Phase 1's three agents held the `web/` files. What was done, and
two things the plan did not anticipate:

- `HANDOFF.md` → `docs/HANDOFF.md`, and its "528 tests" corrected to 821 — the file was
  stale as well as misplaced.
- `nul` deleted (it held a duplicate of an existing probe payload).
- All six evidence files → `docs/evidence/`, the three `create-*.json` now **tracked**
  after a secret scan (ids, names, public console URLs only).
- References updated in `README.md` (three places), `docs/SUBMISSION.md`,
  `docs/AUDIT-PIPELINE.md`, `docs/runbooks/RUNBOOK-T02.md`. A link check across
  `README.md` and every file in `docs/` and `docs/runbooks/` resolves with zero misses.
- **Two stale claims removed from `SUBMISSION.md`'s honest-caveats list**, both of which
  would have read as sloppiness to a judge: it still warned that the probe files were
  gitignored (they are tracked now) and that `meta.json` reported 594 tests (it reports
  821). Its requirement-8 row also still listed `create-*.json` and `*-probe.json` as
  gitignored; it now states plainly that `docs/evidence/` is tracked on purpose and
  carries no key.
- `.gitignore` gained `.impeccable/`, `.playwright-mcp/` and `web/data` — the last is a
  local junction created so the verification server resolves the page's `data/` fetches;
  it is a dev artifact and must never be committed.
- Verified after the moves: `npm test` 821 green, `npx eslint .` clean, and the MCP
  server still answers `tools/list` over stdio.

Original inventory and table below, kept as the record.

Current root inventory (tracked): `.env.example`, `.gitignore`, `CLAUDE.md`,
`HANDOFF.md`, `LICENSE`, `README.md`, `atlas-probe.json`, `collectors.json`,
`eslint.config.js`, `kestrel-after.json`, `kestrel-probe.json`, `package.json`.
Untracked at root: `create-*.json` (×3), `nul`, `assets/`, `public/`, `.impeccable/`,
`.playwright-mcp/`.

| Item | Action | Why |
|---|---|---|
| `HANDOFF.md` | move → `docs/HANDOFF.md` | working doc, not judge-entry material |
| `nul` | delete | Windows shell artifact |
| `create-*.json` | **track** (secret-scanned already: clean — id/name/status/view_url/created_at only) and drop the `create-*.json` ignore rule | README states they are committed; today that claim is false — same failure the probe files had |
| `atlas-probe.json`, `kestrel-probe.json`, `kestrel-after.json`, `create-*.json` | move → `docs/evidence/` | evidence belongs beside the docs that cite it; root stays: README, LICENSE, CLAUDE.md, configs |
| every reference to moved files | update | `README.md`, `docs/SUBMISSION.md`, `docs/VIDEO-SCRIPT.md`, `docs/COLLECTORS.md` — grep for each filename, fix every path |
| `assets/the-watch.png` | **keep and retake** — and the retake is now specified: the **mid-scratch frame** from MOVE 2 of `BEST-UI-THE-PLAY.md` §3 | the README hero, the video thumbnail and the submission screenshot are one image, and the play names it: the substance torn open under a cursor, the concatenated availability string legible in the gap |
| `public/` | leave (gitignored build output) | CI artifact shape |
| `.impeccable/`, `.playwright-mcp/` | add to `.gitignore` | tool state, never committed |
| `docs/UPGRADE-PLAN.md` (this file) | keep, with phases marked done | it is the record of the push |

Verification after moves: `git status` clean of surprises; grep finds zero references
to old paths; `npm test` green (tests read `data/`, not root evidence — confirm);
the MCP one-liner from SUBMISSION still works; the deployed site untouched (it ships
`web/` + `data/` only).

---

## Phase 5 — Ship

1. Full `npm test` + `npx eslint .`.
2. Live-deploy check: console clean, evidence line correct, intro plays, one hash
   deep-link, print preview.
3. Commit sequence pushed in a safe window (not :00/:30; `git pull --rebase`; check
   the remote's last cron commit first).
4. `docs/PROGRESS.md` gains one line per phase; UI-09 brief carries pass 2.

What this plan deliberately does NOT do: no page split, no new features beyond 1A/1B,
no framework, no new dependencies, no touching `scripts/`/`mcp/` behaviour, no data
edits, no re-litigating decided cuts (crawler, cover character, symbiote eyes).

## Risks, named

- **`index.html` contention** in Phase 1 — three agents, one file. Mitigation: 1A and
  1B each make exactly two insertions; 1C does not touch it.
- **Sticky nav vs issue router** — nav hashes must fall through `parseIssueHash`;
  audit 4 re-verifies.
- **New animation on top of the turbulence budget** — 1B is once-only ink strokes;
  audit 5 re-measures FPS at 375.
- **Cleanup breaking judge paths** — every cited filename is grepped and updated in the
  same commit as the move; SUBMISSION's copy-paste commands re-run verbatim afterwards.
- **Cron collisions** — pushes stay out of the :00/:30 windows, same as the whole week.

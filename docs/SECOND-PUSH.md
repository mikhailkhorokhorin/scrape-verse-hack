# THE SECOND PUSH — 22 Aug

`UPGRADE-PLAN.md` is the first push and it is done through its audits 1, 2 and most of
4. Overnight the repository gained four waves of UI ideas (fifty-nine of them), an index
of every id's fate, and `BEST-UI-THE-PLAY.md` — the product decision that turns the menu
into **one spine, one image, one interaction and six moves**.

This file is the complete remaining pipeline: the leftover work from the first push, the
six moves, and the audit battery that makes the whole run checkable end to end. Work top
to bottom; every stage gates on the one before it.

**The spine, so nobody re-derives it:** *nobody has looked at this fleet in N hours; you
are the first; here is what happened while you were away.* Every stage below either
serves that sentence or it is maintenance that keeps the page true.

---

## Standing constraints (unchanged, restated once)

Zero comments in code · max 250 lines per file (the cap is an ESLint rule over JS;
`web/index.html` sits at 265 and is exempt by construction — it is 58 script tags and 49
stylesheets, one line per module, and the only way to shorten it is to merge files, which
would break the "CSS split by meaning" rule it exists to serve) · vanilla globals via ordered `<script>`,
no modules, no build · CSS split by meaning · `npm test` green and `npx eslint .` clean
at every commit · DESIGN-SPEC section 8 banned patterns checked before any CSS lands ·
every new animation ships its `prefers-reduced-motion` end state **in the same commit** ·
no `bdata` calls anywhere in this pipeline, audits read committed data only · pushes
never near :00/:30, `git pull --rebase` first, check the cron's last run · any edit to
`.github/workflows/watch.yml` backs up `data/` first and is verified against the next
scheduled run before anything else builds on it.

Orchestration: **at most 2 agents in parallel, disjoint file lanes, lead merges.** S0,
S2, S3 and S5 are sequential. Inside S1 the three moves run two-then-one. The battery
(S4) runs its three lanes two at a time, the third joining as a lane finishes.

Triage letters, same as `AUDIT-PIPELINE.md`, applied the moment a finding appears:
**F** fix now · **D** defer with a written reason · **A** accept and state it in
`SUBMISSION.md` under Known gaps. There is no fourth option.

---

## S0 · Close the first push (lead, sequential) — **DONE 22 Aug**

Nothing new builds on an open wound.

1. **Restore `stash@{0}`** — audit 3's replay and receipt work, interrupted by an API
   error mid-fix. Review before accepting. It teaches `cleanValue` to prefer the
   verification's `received_after` over the pair-derived sample (more honest: the
   ledger's VERIFIED column then shows what the re-check actually recorded), wraps the
   receipt table in a scroll region for 375px, and guards `bindReplayKeys` against
   double-binding. The **dirty values are untouched** — the concatenated ATLAS
   availability string stays canon, and MOVE 2 depends on it.
2. **Reconcile the one red test.** It asserts the old `cleanValue` source. Update the
   expectation to the verified value, and add one test stating the fallback: with no
   verification check present, the pair sample is used, so `?mock=1` still renders.
3. **Finish audit 3's unfinished sweep:** haul cards at 375 (long titles, long URLs,
   the empty state), the replay keyboard walk end to end (Space, arrows, Home, End),
   and proof that the receipt scrolls inside itself while the page does not.
4. **Chore UI-44, from the play's section 5: `og:` and `twitter:` tags.** `index.html` has
   none, so the URL renders blank wherever it is pasted — including the Discord thread
   a judge receives it in. Add `og:title`, `og:description`, `og:url`, `og:image`
   (absolute Pages URLs) and `twitter:card=summary_large_image`. The image points at
   the current hero and is swapped in S5 when the mid-scratch hero exists.
5. Tests, lint, commit, push in a safe window.

**Done when:** suite green, stash empty, a `curl` of the deployed head shows the og
block, and the receipt scrolls inside itself at 375 while the page does not.

**Done.** 889 tests green, lint clean. Receipt: 430px table scrolling inside a 289px
labelled region, page still. Replay keyboard walk verified end to end, handler bound
once. HAUL at 375: zero overflow. og/twitter tags added — and the deploy did not copy
`assets/`, so the card image would have 404'd; the workflow copies it now (`data/`
backed up first). The red test was asserting the old `cleanValue` source; replaced by
three covering broken value, verified value, and the no-verification fallback.

---

## S1 · The cheap moves — two agents, then a third pass — **DONE 22 Aug**

Three moves whose whole cost is typography over numbers already held. Each agent owns
its own files; none touches another's; `index.html` insertions are single-line and
reconciled by the lead at merge. **Two run in parallel (S1-A and S1-B), then S1-C.**

### S1-A · MOVE 1 — the open (UI-50 + UI-51 + UI-65)

The page opens on a thesis panel, not on a dashboard. Full width, Anton, between the
masthead and the pulse slot:

- Line 1 — `NOBODY HAS LOOKED AT THIS FLEET IN <gap>`, the gap computed live from
  `meta.last_human_ts`. **If the field is absent, the line is absent.** No invented
  number, ever.
- Line 2 — the while-you-were-away counters, every one derived client-side from
  `history.json` and `incidents.json`: scans, rows, breaks, heals. Plus the overnight
  variant (00:00–06:00 UTC) when the reader arrives in the morning.
- Line 3 — the canon-event thesis with the real span: three spiders taken on 21 Aug
  inside four hours, then `YOU DO NOT PREVENT THE BREAK. YOU COME BACK FROM IT, AND
  YOU RECORD IT.`

Files: `web/js/open.js`, `web/css/open.css`, one link and one script line in
`index.html`.

The CI half: `watch.yml`'s meta step also writes `last_human_ts` — the timestamp of the
newest commit **not** authored by `thwip watch`. **The cron-safety ritual applies:** back
up `data/`, land the workflow change on its own, watch the next scheduled run write valid
meta before anything in S1 merges.

**Done when:** every number on screen equals the number recomputed by hand from the JSON;
the gap climbs in front of you on the 60s tick; an absent field yields an absent line;
the panel is hidden in `?capture=1`, in print, and during the intro; the accessibility
tree reads it as one labelled region containing sentences.

### S1-B · MOVE 3 — the No-Prize (UI-49)

A closed envelope after the incident feed: `AWARDED TO: THE WATCH — FOR CATCHING ITS OWN
MISTAKE`. Click — a real `<button>` with `aria-expanded` — and it unfolds to the
post-mortem: `inc_003.summary` **verbatim from `incidents.json`**, never paraphrased,
with its timestamps. The empty envelope is the joke; the honest write-up inside is the
payoff, and it scores in Best Clean Code as well as Best UI.

Files: `web/js/noprize.js`, `web/css/noprize.css`, one line each in `index.html`.

**Done when:** the summary text on screen is byte-identical to the committed JSON string;
the keyboard opens it; Escape does not close it (it is disclosure, not a modal); it
prints in its open state on the no-hash print; DESIGN-SPEC section 8 clean.

### S1-C · MOVE 6 — the ad and the coupon (UI-29 + UI-55)

The period ad between Incident Replay and the feed: `SIX TOOLS. NO SDK. CONNECT IN ONE
LINE.` The coupon carries the real commands — `git clone`, `npm test`,
`claude mcp add thwip -- node mcp/server.js` — and the test count **read from
`meta.json`, never hardcoded**. The waves' own `821 TESTS` example is already stale
twice over, which is the argument for reading it live.

Files: `web/js/ad.js`, `web/css/ad.css`, one line each in `index.html`.

**Done when:** the commands copy-paste-run from a clean clone; the count is live; the ad
reads as a page of the comic at 1440/768/375; hidden in capture; and its print behaviour
is decided deliberately and recorded rather than left to chance.

**S1 done.** MOVE 1 opens on `NOBODY HAS LOOKED AT THIS FLEET IN 13M` with 57 scans /
1,194 rows / 3 breaks / 3 heals, every figure recomputed by hand and matched; the gap
line vanishes cleanly when `last_human_ts` is absent. MOVE 3's letter is byte-identical
to `inc_003.summary` (617 chars, checked in the browser). MOVE 6 reads its six tool
names from `mcp/registry.js` and its test count from `meta.json`, and suppresses itself
in mock mode rather than showing a fake number. The workflow's meta step now writes
`last_human_ts` additively, with the original printf as its else branch.

**S1 gate (lead):** merge, reconcile the `index.html` insertions, tests and lint,
screenshot all three moves at three widths, one commit per move, push in a safe window,
verify live.

---

## S2 · MOVE 2 — the scratch. The headline. (UI-61 + UI-62) — **DONE 22 Aug**

Drag the black off a taken panel and underneath is the value that actually came back.
This is the one image and the one interaction; everything else this weekend supports it.
The play says it is worth an afternoon, and it gets one.

**Mechanism, after one rejected approach.** The first attempt dug holes into the
symbiote's existing `mask-image` by stacking radial gradients on it — cheap, no second
layer, and the turbulence filter kept working. It is recorded here because it looked
right and is not: `.symbiote` carries `filter:url(#symbiote-turbulence)`, which creates
its own stacking context, so a hole in the mask reveals the panel background rather
than anything placed behind the layer. Verified in the browser — 8 holes present in the
computed mask, nothing visible through them. The canvas below is the way.

**Mechanism:** a `<canvas>` over the symbiote layer, `destination-out` under the pointer
(mouse **and** touch — a judge on a phone is the likely case, not the edge case), with
the received values rendered beneath from the same per-field expected-versus-received
resolution `received.js` already computes for the chips. Dead fields reveal `price: null`
in mono and nothing else — you dig and there is nothing there. Lift the pointer and the
black regrows over about four seconds, because one person cannot hold a whole fleet
uncovered at once.

The artifact the reveal exists for is ATLAS on 21 Aug:
`availability: "In stock (19 available) In stock In stock In stock In stock In stock In stock"`
— seven nodes concatenated by a selector that matched too much. A judge who scratches
that up understands the entire product in four seconds with no legend.

**Six sub-gates, each verified in the browser before this is called done:**

1. **Discoverable.** One hint on the diptych's taken half — `SOMETHING IS UNDER THERE` —
   and nothing else anywhere on the page. If a judge does not find it, it did not happen.
2. **Touch-first.** Pointer events, no hover dependency, works with a finger at 375.
3. **Survives the render loop.** `renderGrid` repaints panels; the canvas must rebind
   after every paint (the pattern `landing.js` already uses) and must never leak
   contexts across repaints.
4. **Performance.** Measured frame rate at 375 with turbulence and canvas both active.
   If it stutters, degrade to tap-to-reveal — never to jank. Under reduced motion there
   is no regrow animation: tap toggles, and both states stay legible.
5. **Honest underneath.** Revealed strings come from `sample` and the verification data,
   byte-identical. Nothing is invented for the reveal.
6. **Contained.** Hidden in `?capture=1` (the hint too), inert in print, canvas
   `aria-hidden` — the values remain available to the accessibility tree through the
   existing chips.

Files: `web/js/scratch.js`, `web/css/scratch.css`, and minimal hooks in `panel.js` or
`symbiote.js` only if unavoidable. UI-62's flinch — the substance recoiling a few percent
on hover — rides along if it is trivial, and is cut without discussion if it fights the
filter.

**S2 gate:** all six sub-gates screenshotted, tests and lint green, commit, push, live
check at a real phone-sized viewport. **The mid-scratch hero shot is taken here** and
parked for S5.

---

## S3 · Motion — MOVE 5, then MOVE 4 (one agent each, sequential)

### S3-A · MOVE 5 — stillness — **DONE 22 Aug** (UI-82 fix + UI-80 + UI-69 + UI-71 live half + UI-74 + UI-78/79)

The order inside this move is fixed.

1. **UI-82, the defect, first.** `render.js` rebuilds `#grid` wholesale, so one spider's
   scan re-animates all three panels — it reads as a page refresh, which is precisely
   what a live console must not read as, and it makes UI-03's landing mark meaningless.
   Reconcile instead: `delta.js` already names the changed collectors, so re-render only
   their cells and leave the rest of the DOM untouched. **Groundwork, checked 22 Aug:**
   `panel.js` line 57 emits `<div class="cell cell--STATUS">` with **no key**, so the
   first edit is to stamp `data-cid` on that wrapper; `renderGrid` then builds each
   cell's HTML as it does now but writes only where the markup for that cid differs,
   instead of assigning `grid.innerHTML` wholesale. Keep the wholesale path for the
   empty state and for a fleet-size change — reconciling is for the steady case. The stamp (UI-79, a 90ms
   press-in) becomes the arrival mark on the changed panel alone. **Verify:** mutate one
   spider and a `MutationObserver` on the other two cells records **zero** childList
   changes.
2. **UI-80, the budget.** Healthy panels keep breath and blink only; steps, twitch and
   weight-shift move behind the damaged and reacting states. A sick panel becomes the
   only narrative motion on an otherwise still page, which reads harder than anything
   that could be added on top.
3. **UI-69, the sweep hand — and with it UI-71's live half.** One thin arc along each
   panel border, duration computed as `lastScan + 30min − now` rather than chosen,
   snapping to zero on a landing scan and pulsing at the border when a run is overdue.
   It is the only duration on the page that is a real interval, and it is what makes
   UI-71 true: a judge sitting still for sixty seconds sees the page change on its own
   rather than seeing a screenshot. (UI-71's other half, the yellowing paper, died with
   UI-57 and is not built.)
4. **UI-74, the impact frame.** Sixty milliseconds of full-page inversion on a genuine
   transition into CRITICAL, fired from `delta.js` so it can never be spent on
   decoration. Hard-disabled under reduced motion, and it must never repeat inside one
   render. **UI-78, the odometer,** on the masthead integrity readout, in the same commit.

**Done when:** the healthy fleet is nearly still and the page still reads as live because
the sweep hand is moving; a staged single-spider mutation animates exactly one panel;
reduced motion kills the impact frame outright; and the reconciler has tests, because it
is a JS contract, not a style.

### S3-B · MOVE 4 — the press — **DONE 22 Aug** (UI-59 + UI-72)

Scroll-driven CMYK: each section prints as it enters the viewport — cyan, then magenta,
then black, misregistered until the last pass snaps them into register.
`animation-timeline: view()`, no JavaScript. The design's second principle is that
misregistration is intentional, and nothing currently demonstrates it in motion.

Support is Chromium 115+ and Safari 26+. The fallback is free: an unsupported browser
shows the fully printed page, which is the reduced-motion end state the spec already
requires. The two deferred riders — UI-60 (hold `P`, the plates come apart) and UI-73
(the sparkline strokes itself) — land only if this does, in the same afternoon, or they
die with it.

**Done when:** Chromium shows the passes; Firefox shows the printed page with zero
console noise; the 375 frame rate holds; capture and print are unaffected.

**Done.** Verified mid-print in Chromium — plates 5.49px apart and closing, section at
.48 opacity climbing. Reduced motion and `?capture=1` both render the fully printed page:
zero animations, zero shadows, opacity 1. A section's floor is .34 rather than 0, so a
timeline that fails to attach leaves a pale section rather than an invisible one. UI-60
and UI-73 stay unbuilt — the press argues on its own.

---

## S4 · The battery — twelve audits, three lanes, then the gate

Every audit: screenshot everything in its territory at 1440/768/375, fix what it finds,
verify each fix in the browser, keep tests and lint green, one commit. Lanes run in
parallel; audits inside a lane run in order.

### Lane I — surface truth

- **B1 · Move regression.** Every done-when from S1 to S3 re-verified *after* everything
  landed, because the moves share one page: the open against the intro and the sticky
  nav, the scratch against the stillness reconciler, the ad against the webs and the
  rhythm spacing, the envelope against feed routing.
- **B2 · Audit-5 inheritance.** The intro end to end — once per tab, all six beats
  against the real `inc_003`, every skip path, `?intro=1`, the reduced-motion path, and
  post-skip state identical to a plain load, with the nav and the open both hidden
  during it. Plus the favicon and tab-title reactions and the evidence line on poll.
- **B3 · Overlap sweep.** Programmatic: no two visible elements from different
  components intersect wrongly at 1440/1024/768/375. Bursts, deliberate bleeds and
  `.fleet-symbiote` are excluded — the last sits outside the viewport by design and has
  already produced two false flags that cost time.
- **B4 · Contrast, composited.** Every new surface — the open, the ad, the envelope, the
  scratch reveal text, the sweep hand, the odometer — measured against its true
  composited background. AA everywhere prose lives. The two deliberate exceptions
  (unwatched opacity, infected mid-pulse) stay stated rather than "fixed".

### Lane II — behaviour truth

- **B5 · Console matrix.** Zero errors through: default, `?mock=1`, `?capture=1`,
  `?intro=1`, all three real hashes, a garbage hash, the `#nav-*` anchors, an empty-data
  serve, and a full scroll with the press active.
- **B6 · Keyboard and accessibility tree.** Tab the whole page: nav, panels, the sheet's
  trap and its focus return, the replay keys (bound once — the stash fix), the envelope,
  the scratch fallback. Snapshot the tree: headings read as sentences, new regions are
  labelled, the canvas is hidden, and focus is never lost after an interaction.
- **B7 · Print matrix.** No hash gives three pages, one cover each, envelope open, and
  the new chrome (open, ad, scratch, sweep) either hidden or deliberately present — each
  recorded. Every `#inc_XXX` gives one page carrying the receipt. Regenerate actual PDFs
  and count the pages rather than trusting the stylesheet.
- **B8 · Routing and state.** The full hash matrix again **after** all the moves; scratch
  state must not survive navigation wrongly; the reconciler must not resurrect closed
  incidents; `?mock=1` must still reach every state the legend names.

### Lane III — data and repository truth

- **B9 · Numbers audit.** Every figure rendered anywhere — the open counters, the human
  gap, the haul totals, MTTR, streaks, the coupon's test count, the No-Prize timestamps —
  recomputed independently from `data/*.json` and `meta.json` and compared exactly. A
  monitoring console with one wrong number loses every category at once.
- **B10 · Docs truth sweep.** README, SUBMISSION, HANDOFF, PROGRESS, the play and the
  index: every count current (tests, cron commits, incidents), every path resolving,
  every claim a judge can check still checking out, and kill-list consistency — nothing
  built that the index calls dead, nothing dead quietly re-proposed.
- **B11 · Repository hygiene.** Zero comments, files under 250 lines, no orphans, no
  stray artifacts, `.gitignore` still honest, new modules placed in the script order
  their dependencies require, test files named after their subjects.
- **B12 · Live deploy.** After the S4 push: Pages serves the new head and the og tags
  render a real card; the console is clean on the live URL; one deep link works; print
  from live works; and the open's gap line shows a real climbing number fed by CI's
  `last_human_ts`.

**S4 gate:** all twelve reported, every F fixed and verified, every D and A written into
its register, suite green, pushed, live verified.

---

## S5 · The final gate and the ship

1. **Impeccable scorecard** over the finished surface — Accessibility, Performance,
   Theming, Responsive, Anti-patterns, each 0–4. Target **18/20 or better, zero P0, zero
   P1**. P2 and P3 go to an appendix here with an honest keep-or-cut call.
2. **UI-09 pass 2, the phone gate:** 375px, measured frame rate with turbulence, scratch
   and press all active, no horizontal scroll — recorded in
   `docs/ideas/UI-09-phone-pass.md` as that brief demands.
3. **The hero.** The mid-scratch frame from S2, retaken against the final page: README
   header, `og:image` swap, video thumbnail, submission screenshot. One image, four uses.
4. **Ship.** Full suite and lint; rebase; safe-window push; live re-check; one line per
   stage in `PROGRESS.md`; the `SUBMISSION.md` checklist re-walked top to bottom.

---

## Outside this pipeline — the human ledger

Named here so the pipeline never blocks on them silently:

- **T-12, the autonomous break.** The play calls it the strongest single claim we could
  add. Three commands, roughly 50–60 credits, and an honest hour or two of CRITICAL on
  the live console. **The user's call; no agent starts it.**
- **The demo video** — `docs/VIDEO-SCRIPT.md`, stills already in `../video-stills/`.
  Recorded by a human, **with the scratch in frame**, per the play's ordering.
- **The LinkedIn post** — `docs/LINKEDIN-POST.md`. Links are filled in; the `<VIDEO>`
  placeholder waits on the recording.
- **The submission form itself.** The play's last sentence stands: an unsubmitted
  repository wins no track at all.

## Risks, named

- **The scratch against the turbulence filter.** The page's two most expensive layers
  meet on the same panel. The degrade path — tap-to-reveal — is designed in rather than
  improvised at midnight.
- **The scratch against the render loop.** A canvas that dies on the next poll repaint
  reads as a broken toy. Sub-gate 3 exists for exactly this.
- **The `watch.yml` edit.** The one place this pipeline can destroy value that cannot be
  recreated. The ritual is written into S1-A and has no shortcut.
- **Move pile-up on `index.html`.** Five single-line insertion points, lead-merged;
  agents never reformat a neighbour's line.
- **MOVE 4 support drift.** Progressive enhancement only. The fallback is the contract.
- **The clock.** If S3 has not started by midday on 23 Aug: MOVE 4 dies first, then
  UI-78/79, then the flinch. The scratch, the open and the battery do not get cut — they
  are the difference between entered and remembered.

# THWIP — Audit Pipeline

Written Aug 21. Deadline **Aug 23**. This is the finishing plan: eighteen audits, in
order, with a pass bar for each that a second person could check without asking what was
meant.

`PLAN.md` says what gets built. `PROGRESS.md` says what exists. **This file says what
gets checked before we submit**, and where the two disagree about priority in the last
36 hours, this file wins.

---

## Why this file exists

The build is essentially done. Nineteen JS modules, twenty-one stylesheets, two real
heals on unchanged Collector IDs, a cron that commits its own history. What remains is
not features — it is the difference between a project that works and a project that
**wins four categories**, and that difference is almost entirely found by looking hard
at what already exists.

We are entering every category:

| Prize | Category | What the judge is actually looking for |
|---|---|---|
| NVIDIA DGX Spark | Best Use of Bright Data | Studio design, agent control, survived a real change, structured output that became something |
| iPad | Best UI | "Looks and feels finished." Data is only useful when it can be read |
| Keychron | Best Clean Code | "A repo a stranger could pick up on Monday" |
| Galaxy Watch | Best LinkedIn Post | A post about what you built, tagged WeMakeDevs |

Every audit below is tagged with the categories it serves. An audit that serves no
category is not on this list.

---

## Rules that govern every audit

**1. A pass bar is a number or a command, never an opinion.**
"Looks good" is not a result. "Zero axe-core violations at serious or critical" is. Each
audit below carries a **Verify** line that is runnable or countable. If you cannot state
how a finding would be disproved, it is not a finding.

**2. Findings are triaged the moment they are found, not later.**
Every audit produces a list, and every item on that list gets exactly one of three
letters written next to it before the next audit starts:

- **F — fix now.** Under 20 minutes, and it touches something a judge will see or run.
- **D — defer to the backlog.** Real, but the cost exceeds the payoff before Sunday.
  Goes to the **Deferred register** at the bottom of this file with a one-line reason.
- **A — accept and state it.** Not fixing it. Gets written into `SUBMISSION.md` under
  "Known gaps." A stated gap costs nothing; a found one discounts everything else.

There is no fourth option and no "revisit later." The register is the record.

**3. Never break the cron to fix a pixel.**
`data/history.json` and `data/incidents.json` accumulate value that cannot be recreated.
Any audit whose fix touches `scripts/`, `.github/workflows/watch.yml`, or `data/` must
back up `data/` first and confirm the next scheduled run lands green. A beautiful console
reading a dead feed loses every category at once.

**4. No `bdata` calls in any audit.** Every audit here reads committed data, static
files, or the deployed page. Healing costs credit and we have two real heals already
recorded — that evidence is sufficient and does not need repeating.

**5. Three agents maximum, and they never touch the same file.**
The parallel lanes below are drawn so that no two concurrent audits write to the same
directory. If a fix would cross lanes, it waits for the merge point.

---

## Dependency shape

Four waves. Everything inside a wave runs in parallel (max 3 at once); nothing in a wave
starts until the previous wave's fixes are committed.

```
WAVE 0 — TRUTH               A01 ──► A02 ──► A03
(serial, blocks everything)  data honesty, then state coverage, then IA

WAVE 1 — SURFACE             A04 ─┐
(3 lanes, parallel)          A05 ─┼─► merge
                             A06 ─┘
                             A07 ─┐
                             A08 ─┼─► merge
                             A09 ─┘

WAVE 2 — SUBSTANCE           A10 ─┐
(3 lanes, parallel)          A11 ─┼─► merge
                             A12 ─┘
                             A13 ─┐
                             A14 ─┴─► merge

WAVE 3 — SUBMISSION          A15 ──► A16 ──► A17 ──► A18
(serial, final morning)      narrative, docs, history, dress rehearsal
```

**Why Wave 0 is serial and first:** A01 can invalidate anything built on top of it. If
the console is making a claim the data does not support, every later audit would be
polishing a lie. Fix the truth, then fix the look.

**Why A18 is last and alone:** it is the only audit that runs against the *deployed*
artifact rather than the working tree. Anything it finds means a redeploy, so nothing may
be in flight when it runs.

---

## The frontend skills, and which audit uses which

Four design skills are available in the session. They are not interchangeable and using
the wrong one wastes a pass.

| Skill | What it is for here | Audits |
|---|---|---|
| **`impeccable`** | The workhorse. Interface critique, hierarchy, cognitive load, a11y, responsive behavior, motion, error and empty states, edge cases, UX copy. Use it when the question is *"is this interface right"* | A02, A03, A04, A08, A09, A10, A11 |
| **`frontend-design`** | Aesthetic direction and typography — whether the thing reads as intentional or as a template default. Use it when the question is *"does this look designed"*, not *"does this work"* | A05, A06 |
| **`ui-ux-pro-max`** | The reference corpus: 119 UX guidelines, 192 palettes, 74 font pairings, contrast and chart data. Use it as a **lookup**, to check our choices against known-good practice — never to redesign, because its defaults will fight `DESIGN-SPEC.md` | A05, A06, A07 (consult only) |
| **`dataviz`** | Every chart, sparkline, meter, heatmap, stat tile. Load it before touching `sparkline.js`, `pulse.js`, `heatmap.js`, or the Integrity readouts | A07 |
| **`artifact-design`** | Only if we publish an audit summary or the judge-facing one-pager as an Artifact. Not part of the console work | A15 (optional) |

**The hard rule on skills:** `DESIGN-SPEC.md` outranks every skill. Its banned-patterns
section exists specifically because a design skill's defaults are rounded slate cards,
Inter, and soft shadows — which is what two hundred other submissions will look like. If
a skill suggests softening a border, adding a blur radius to a shadow, or muting an
accent, the answer is no. Record the disagreement in the audit notes and move on.

---

## MCP tooling

**Playwright MCP** — every browser-facing audit runs through it rather than through
description. It gives us the accessibility tree, console errors, network waterfalls,
viewport resizing, keyboard driving, and screenshots. Load with
`ToolSearch` → `select:mcp__playwright__browser_navigate,...` before the audit that needs it.

The calls that matter, and what each audit uses them for:

| Call | Use |
|---|---|
| `browser_navigate` | Open live, `?mock=1`, `?capture=1`, and the empty-data route |
| `browser_snapshot` | The accessibility tree — this is the a11y audit's primary evidence, not a screenshot |
| `browser_console_messages` | Zero-error bar in A12. Any error at all is a finding |
| `browser_network_requests` | Payload weight, request count, font blocking, cache headers in A13 |
| `browser_resize` | 360, 390, 768, 1024, 1440, 1920 for A08 |
| `browser_press_key` | Tab-order and Escape-key walks in A04 |
| `browser_evaluate` | Measure computed contrast, CLS, element counts, token usage programmatically |
| `browser_take_screenshot` | Before/after pairs for every visual fix; the README header shot |

**context7** — documentation lookup, used to settle disputes rather than to browse. Three
specific questions it answers for us:

1. WCAG 2.2 AA success criteria wording for A04, so pass bars quote the criterion rather
   than paraphrase it.
2. `axe-core` rule IDs and severity levels, so the a11y pass bar names real rules.
3. GitHub Actions `schedule`/`concurrency`/`permissions` semantics for A14, where the
   workflow's correctness matters and we are working from memory.

Do not use context7 for general JS or CSS questions. It is for library and platform
contracts we would otherwise guess at.

**Note on local serving:** the console fetches `data/*.json` by relative path, so
`file://` will fail CORS. Serve with `npx --yes serve web` or point Playwright at the
deployed Pages URL. Several audits below assume a served origin.

---

# WAVE 0 — TRUTH

Serial. Nothing else starts until A01–A03 are committed.

---

## A01 · Data honesty — does the UI ever claim more than it knows?

**Serves:** Best Use of Bright Data, Best UI, Best Clean Code
**Depends on:** nothing. This is the first audit.
**Skill:** none — this is a reading audit, not a design one.

The highest-stakes audit in the file. This project's entire pitch is *"the pipeline stays
green while the data rots."* A console that itself displays a comforting number it cannot
justify commits the exact sin it was built to expose. One judge finding one invented
figure discounts everything else on the page.

**Scope.** For every number, label, and state on screen, trace it back to a field in
`data/history.json` or `data/incidents.json`. Specific known-risk sites:

- `renderMttr()` in `render.js` — with **one** incident on disk, does it say "mean"?
  A mean of one sample is not a mean. It must either say so or say `—`.
- Blast radius — `rows_per_run × runs` is a *capacity* figure, not a count of corrupted
  rows delivered. The on-screen sentence must not imply the latter.
- `cleanStreak` / `bestStreak` in `adapter.js` — a streak measured across a history that
  begins Aug 21 must not imply a longer record than exists.
- `pulse.js` — hidden below 8 scans by design. Confirm the threshold actually holds, and
  that amplitude maps to real integrity rather than to a smoothed curve.
- `scars.js` — residue only after a **verified** heal. Confirm `resolved: true` gates it.
- The `LIVE` readout in the masthead — if the last scan is 6 hours old, `LIVE` is a lie.
- ATLAS at 90% — confirm the console shows 90 and not a rounded 100 anywhere.

**Pass bar.** A written table, one row per on-screen figure: *figure → source field →
transform → what it would say with N=1 and N=0*. Zero rows where the transform cannot be
named. Zero figures that survive deletion of their source data without falling back to an
honest empty state.

**Verify.** Empty both data files into a scratch copy, serve, and screenshot every
section. Every panel must show NO SCANS YET / ALL QUIET / SIGNAL LOST — never a zero
presented as a measurement. Then restore, run with the real single incident, and confirm
the MTTR and streak strings read correctly at N=1.

**Findings policy:** **all F.** No deferrals. A dishonest figure is either fixed or the
element is removed before Wave 1 begins.

---

## A02 · State coverage — every state the console can enter

**Serves:** Best UI, Best Clean Code
**Depends on:** A01
**Skill:** `impeccable` (empty states, error states, edge cases)

The console has more states than any demo will show, and the judge will visit at least
one we did not plan for — most likely the day-old data state, because judging happens
after the cron may have stopped.

**The matrix.** Every cell gets a screenshot:

| Axis | Values |
|---|---|
| Data | absent (404) · empty array · malformed JSON · 1 scan · 8 scans · 2000 scans (cap) |
| Incidents | none · one open · one closed · one unresolved (`resolved: false`) |
| Spider state | healthy · degraded · critical · re-weaving · unwatched (>3h) |
| Route | live · `?mock=1` · `?capture=1` |
| Fields | all live · mixed · all dead · infected-only |

**Pass bar.** Zero cells rendering `undefined`, `NaN`, `null`, `[object Object]`,
`Invalid Date`, or an empty box with no explanation. Every failure state names what
failed and what the reader should conclude. `?mock=1` is visibly, unmistakably labeled as
synthetic — a judge must never mistake fixture data for real data, and `mock.css` exists
for exactly this reason. Confirm it cannot be missed at a glance.

**Verify.** Playwright against a scratch `data/` directory, cycling fixtures per row.
`browser_evaluate` a scan of `document.body.innerText` for the forbidden strings above —
that check is mechanical and must return zero hits in every cell.

**Findings policy:** empty/error states **F**. Exotic combinations (2000-scan cap,
unresolved incident) **D** unless they render garbage, in which case **F**.

---

## A03 · Information architecture — can a stranger read this in 30 seconds?

**Serves:** Best UI
**Depends on:** A02
**Skill:** `impeccable` (information architecture, visual hierarchy, cognitive load)

"Data is only useful when it can be read" is the category's own phrasing. A judge arrives
with no context, no video, and about thirty seconds of patience.

**Scope.** Reading order top to bottom: masthead → pulseline → The Watch → legend →
Incident Replay → Incident Feed. Ask, at each stop: what question does this answer, and
did the reader already have that question? Specific tensions to resolve:

- The legend sits *below* the grid. It explains the black symbiote — the single most
  novel encoding on the page. Is it discoverable before the reader needs it?
- Replay before Feed, or Feed before Replay? Replay is the more impressive artifact but
  the Feed is the one that establishes something happened.
- Four masthead readouts compete. Which single number is the headline? If all four are
  the same weight, none of them is.
- Section counts (`INCIDENT FEED · 4`) — do they clarify or add noise when the count is 0
  or 1?

**Pass bar.** A written answer to three questions, each in one sentence, each traceable to
something visible without scrolling: *What is this? Is anything wrong right now? What did
it do about it?* If any answer needs the video or the README, that is a finding.

**Verify.** Playwright screenshot at 1440×900, above the fold only. Show it to someone
who has not seen the project; three questions, sixty seconds, written answers. If the
symbiote is not correctly interpreted by a cold reader, the legend placement is a finding.

**Findings policy:** ordering and emphasis changes **F** (CSS order, no logic).
Structural rework **D** — this late, a restructure risks more than it gains.

---

# WAVE 1 — SURFACE

Three lanes, parallel, max 3 agents. Lane A is accessibility, Lane B is craft, Lane C is
reach. No two lanes write the same file.

---

## A04 · Accessibility — WCAG 2.2 AA, keyboard, screen reader

**Serves:** Best UI, Best Clean Code
**Depends on:** A03
**Skill:** `impeccable` (accessibility)
**Tools:** Playwright MCP (`browser_snapshot`, `browser_press_key`), context7 for WCAG wording

The category rewards "finished," and an interface a keyboard cannot drive is not
finished. This project has specific hazards: a modal sheet, a replay transport, decorative
SVG filters, and color-as-meaning throughout.

**Scope.**

- **Keyboard.** Tab from page load to the last element without a trap. Every panel opens
  its detail sheet on Enter/Space, not click-only. The sheet returns focus to the panel
  that opened it on Escape. The replay region (`tabindex="0"`) announces its Space/arrow
  controls to a screen reader, not only in the `aria-label`.
- **Focus visible.** A visible focus ring on every interactive element that survives the
  comic aesthetic — hard offset outline, not a removed one. Check no `outline: none`
  exists anywhere in `web/css/`.
- **Roles and names.** The modal has `role="dialog"` and `aria-modal` — confirm focus is
  actually trapped inside it, which the attribute does not do by itself. Chips, swatches
  and size keys are decorative spans; confirm they are not announced as meaningless text.
- **Color is never the only channel.** Live/infected/dead chips already carry ✓/⚠/✗
  glyphs — verify that holds everywhere, including the heatmap and the sparkline scars.
- **The symbiote** is `aria-hidden="true"`. That is correct for the visual, but the
  information it encodes (integrity lost) must be available in text elsewhere.
- **Motion.** `prefers-reduced-motion` is handled in `tokens.css` globally. Verify the
  replay transport still *functions* under it rather than becoming unusable.
- **Live regions.** The console refreshes every 60s. A silent DOM swap under a screen
  reader is disorienting; decide deliberately between `aria-live="polite"` on the fleet
  readout and nothing at all.

**Pass bar.** Zero axe-core violations at **serious** or **critical**. Full keyboard
traversal of every interactive element with no trap and no invisible focus. Every image,
icon and control has an accessible name. Contrast handled separately in A06.

**Verify.** `browser_evaluate` injecting axe-core from a local copy and dumping
violations by impact — that is the countable number. `browser_snapshot` for the a11y tree
on live, `?mock=1`, and with the sheet open. Scripted `browser_press_key` Tab walk
recording `document.activeElement` at each step.

**Findings policy:** serious/critical **F**. Moderate **F** if under 20 minutes, else
**D**. Minor **A** and listed.

---

## A05 · Typography — is the type doing work, or decorating?

**Serves:** Best UI
**Depends on:** A03
**Skill:** `frontend-design` (primary), `ui-ux-pro-max` (consult only)

Four families is a lot: Anton, Bangers, Space Grotesk, IBM Plex Mono. Four families used
with discipline reads as art direction; four used loosely reads as a font sampler.

**Scope.**

- Every face used only in its contracted role per `DESIGN-SPEC.md` §3. Bangers appears
  **only** in onomatopoeia bursts — one leaked UI label kills the joke.
- Every number on the page is IBM Plex Mono with `tabular-nums`. Find any figure that is
  not, particularly inside the replay, the sheet, and the feed cards.
- The scale is seven steps. Count the distinct computed `font-size` values actually
  rendered — if it is materially more than seven, the scale has been bypassed with
  one-off values.
- Line length: body copy between 45 and 80 characters at 1440px. The tagline and legend
  lede are the likely offenders.
- Anton at `clamp(3.5rem, 10vw, 7.5rem)` — confirm the masthead does not collide or
  overflow at 320px, and that `letter-spacing: 0.02em` holds.
- Uppercase + letter-spacing on labels: verify legibility at `--t-label` 0.75rem against
  `--dim` rather than assuming it.

**Pass bar.** Distinct computed font sizes ≤ 9 across the whole page (seven scale steps
plus at most two justified exceptions). Zero numeric values in a proportional face. Zero
Bangers outside `.burst`. Body measure within 45–80ch.

**Verify.**
```js
// browser_evaluate
[...document.querySelectorAll('*')].reduce((m,el)=>{
  const s=getComputedStyle(el);
  const k=s.fontFamily.split(',')[0]+' '+s.fontSize;
  m[k]=(m[k]||0)+1; return m;
},{})
```
Sort by count, read the tail — the tail is where the one-off values hide.

**Findings policy:** role leaks and non-mono numbers **F**. Scale consolidation **F** if
it is a token swap, **D** if it needs layout rework.

---

## A06 · Color and contrast — the semantics hold, the text is readable

**Serves:** Best UI
**Depends on:** A03
**Skill:** `frontend-design`, `ui-ux-pro-max` (contrast reference)
**Tools:** Playwright MCP (`browser_evaluate`)

`DESIGN-SPEC.md` §2 already states the contrast position, including the specific warning
that `--critical` (#FF1E1E on #14061F) is 4.2:1 and must never carry small body text.
This audit verifies the codebase actually obeys its own spec.

**Scope.**

- Measure real rendered contrast for every text/background pair, not the documented pairs.
  `--dim` (#9C8FB5) and `--dimmer` (#7E7296) on `--void` are the ones most likely to fail
  — `--dimmer` is used for de-emphasized text and is the prime suspect.
- `--critical` on `--void` used only for fills, bars, and large type. Grep for it in a
  text context.
- Health colors used **only** semantically. Any decorative use of `--healthy` green or
  `--critical` red is a spec violation and confuses the encoding.
- Chromatic aberration (`.chroma`, `.chroma-mid`, `.chroma-hard`) is bound to state, so
  it is a data channel. Verify hard chroma at 4px offset does not push effective contrast
  below readable on the critical panels — the damage signal must not destroy the data.
- The symbiote at `--symbiote` #050408 over `--void-2` #1F0A2E: confirm text beneath the
  black remains readable or is deliberately, completely covered. Half-covered text is the
  worst outcome.
- Simulate deuteranopia and protanopia. Healthy-green versus critical-red is the classic
  failure; the ✓/⚠/✗ glyphs are the mitigation — confirm they are sufficient alone.

**Pass bar.** All body and data text ≥ 4.5:1. All large text (≥24px or ≥19px bold)
≥ 3:1. Non-text UI indicators (chips, bars, swatch borders) ≥ 3:1. Zero decorative uses
of the four health colors. Under simulated color blindness, state remains determinable
from glyph and panel size alone.

**Verify.** `browser_evaluate` walking text nodes, computing effective foreground and
background from `getComputedStyle` and reporting every pair below threshold with its
selector. That list is the finding list.

**Findings policy:** below-threshold body text **F** (token adjustment, one file).
Chroma-versus-legibility trade **F** if a 1px reduction fixes it, otherwise **A** and
stated in the design notes — the aberration is the signature and we do not remove it.

---

## A07 · Data visualization — sparkline, pulse, heatmap, readouts

**Serves:** Best UI, Best Use of Bright Data
**Depends on:** A03
**Skill:** `dataviz` (load before touching any chart code), `ui-ux-pro-max` (chart types)

Four visualizations carry the analytical weight: `sparkline.js` (integrity over time),
`pulse.js` (fleet rhythm), `heatmap.js` (per-field fill rate), and the numeric readouts.
Under the comic treatment they must still be *correct* — a chart that lies for style is
worse than no chart.

**Scope.**

- **Baseline and scale.** Does the sparkline start at 0 or at the data minimum? A
  90→100 recovery drawn on a 88–100 axis looks like a resurrection. State the axis on
  screen or start at zero.
- **Short series.** `seriesNote` labels a short series rather than stretching it —
  confirm the threshold and that two points never render as a confident trend line.
- **Scars** on the sparkline must sit at the correct x-position for the incident's
  `opened_at`, not at an evenly spaced index.
- **Pulse amplitude** derives from integrity and rhythm from real scan spacing. Verify a
  missed scan produces a visible gap rather than a silently compressed beat — that gap is
  itself information.
- **Heatmap** cell color must map to fill rate monotonically. Check the legend states the
  range, and that a single-run field is distinguishable from a 100%-over-50-runs field.
- **Readouts.** `↓7` delta beside Integrity — confirm direction and sign are right when
  integrity *rises*, which is the less-tested path.

**Pass bar.** Every chart states or starts its axis. No chart renders below its minimum
sample threshold. Every encoded channel (length, color, position) maps to exactly one
variable. A reader can state what the sparkline's y-axis is without opening the code.

**Verify.** Feed each chart three crafted series — flat, single-drop-and-recover, and
sawtooth — via `?mock=1` fixtures and screenshot each. The recovery must be visually
distinguishable from the flat case, and the sawtooth must not alias into a straight line.

**Findings policy:** misleading axis or scale **F** — this is A01's rule applied to
pixels. Aesthetic refinements **D**.

---

## A08 · Responsive and mobile

**Serves:** Best UI
**Depends on:** A04 (focus/keyboard fixes land first to avoid file conflicts)
**Skill:** `impeccable` (responsive behavior)
**Tools:** Playwright MCP (`browser_resize`, `browser_take_screenshot`)

A judge will open this on a phone. Probably on the iPad they are giving away. The layout
is a comic page with rotated panels, hard offset shadows, and size-as-data — all of which
are exactly the things that break at 390px.

**Scope.** Breakpoints 360, 390, 768, 1024, 1440, 1920. Plus 390×844 landscape.

- **Size-as-data survives the collapse.** `panel--compact` / `panel--big` / `cell--tall`
  encode state through area. In a single-column mobile stack that encoding disappears
  unless height is preserved. Decide explicitly what replaces it and verify the reader can
  still tell a critical Spider from a healthy one at 390px.
- `overflow-x: hidden` on body (`tokens.css`) hides horizontal overflow rather than
  preventing it. Measure `scrollWidth > clientWidth` on inner containers — the tilted
  panels (`rotate(-0.6deg)`) and the 6px hard shadows are the likely culprits.
- The replay transport and its before/after field table at 390px — tables are the classic
  mobile failure. Either it scrolls in its own container or it restructures.
- The modal sheet at 390px must not exceed the viewport or hide its close button.
- Touch targets ≥ 44×44px: panels, chips with popovers, the sheet close, replay controls.
- The masthead at `10vw` versus the four readouts — confirm the readouts wrap rather than
  crush.
- Chip popovers (EXPECTED/RECEIVED) are hover-driven on desktop. On touch there is no
  hover. Confirm they open on tap and close on outside tap.

**Pass bar.** Zero horizontal page scroll at every listed width. Zero clipped or
overlapping text. All touch targets ≥ 44px. State remains readable at 390px without
zooming. The legend remains legible rather than collapsing into an unreadable column.

**Verify.** `browser_resize` through the list, `browser_take_screenshot` at each, plus
`browser_evaluate` returning every element where `scrollWidth > clientWidth + 1`.

**Findings policy:** overflow and clipping **F**. Touch targets **F**. Full mobile
redesign of the replay **D** — a scroll container is the acceptable fix.

---

## A09 · Cross-browser

**Serves:** Best UI
**Depends on:** A04
**Skill:** `impeccable`
**Tools:** Playwright MCP (Chromium, Firefox, WebKit)

Vanilla JS and CSS with no build step means no transpilation and no autoprefixing safety
net. Modern syntax that Chrome accepts is shipped exactly as written.

**Scope.**

- **The SVG turbulence filter** (`feTurbulence` + `feDisplacementMap`, scale 22) is the
  single highest-risk element. Firefox and WebKit render displacement maps differently and
  WebKit has historically been slow with them. Confirm the symbiote still reads as a
  spreading substance in all three, and that it does not tank frame rate in WebKit.
- CSS features to verify rather than assume: `clamp()`, `:has()` if used, nested
  selectors if used, `aspect-ratio`, `inset`, `gap` in flexbox, `text-wrap`, `@container`
  if used. Grep the CSS for each and check support rather than eyeballing.
- Font loading with `display=swap` across all three — confirm no invisible-text flash and
  that the fallback stack (`system-ui`, `ui-monospace`) does not break layout when the
  Google fonts are blocked entirely. A judge on a restricted network is a real case.
- `fetch` with `cache: "no-store"` in `app.js` behaves differently in Safari; confirm the
  60s refresh actually refreshes.
- Safari iOS: `100vh` versus the dynamic toolbar. Check any full-height element.

**Pass bar.** The console renders and functions in Chromium, Firefox and WebKit at 1440px
and 390px. Zero console errors in any of them. The symbiote is recognizable in all three
even if not pixel-identical. With Google Fonts blocked, the layout holds.

**Verify.** Playwright across all three engines, screenshot pairs, `browser_console_messages`
per engine. Block `fonts.googleapis.com` via route interception for the no-fonts case.

**Findings policy:** broken rendering or errors **F**. Cosmetic filter differences **A**
and noted — a slightly different turbulence in WebKit is acceptable; a missing symbiote is
not.

---

# WAVE 2 — SUBSTANCE

Three lanes, parallel. This wave is where the Best Clean Code and Best Use of Bright Data
cases are actually made.

---

## A10 · Micro-interactions and motion

**Serves:** Best UI
**Depends on:** Wave 1 merged
**Skill:** `impeccable` (motion, micro-interactions)

The difference between "works" and "feels finished" lives almost entirely here, and this
is the category's own phrasing. The project already has bursts, the symbiote climb, the
replay transport, panel resizing, and the pulse.

**Scope.**

- **Every state change is animated or deliberately instant — never accidentally either.**
  When the 60s refresh changes an Integrity value, does the number jump or transition? A
  jump is fine if chosen; a jump because nobody decided is a finding.
- **The symbiote climb** is the signature interaction. It should climb, not appear. Verify
  the transition on `height`/`transform` and that it eases rather than moving linearly.
- **Panel resize on state change** — a panel going critical grows to `panel--big`. That
  reflow must be visible as an event, which is the whole design thesis ("the problem takes
  the page"), not a silent layout jump between frames.
- **Bursts** (`burst()` in `panel.js`) — confirm they fire on real state transitions, not
  on every render, and that repeated renders do not stack them.
- **Hover and focus states** on every interactive element, distinct from each other.
- **The replay transport** — play, pause, step. Verify the timeline scrubs sensibly and
  that pausing mid-stage does not leave the view in an intermediate state.
- **Durations.** Everything between 120ms and 400ms except the deliberate slow ones
  (symbiote climb, replay). Anything over 400ms that is not deliberate is a finding.
- **Reduced motion** — verify the whole set again with the media query on. Under reduced
  motion the symbiote must still show *position* (the information) with the animation
  removed.

**Pass bar.** Every interactive element has a distinct hover and focus state. Zero
animations that fire on every refresh regardless of change. Zero layout jumps that are not
intentional events. All durations justified. Reduced motion preserves all information.

**Verify.** Playwright with slowed animations, recording state transitions. Force a state
change by swapping fixture data mid-session and screenshot the transition frames.

**Findings policy:** missing hover/focus **F**. New animations **D** — we are polishing,
not adding. Reduced-motion information loss **F**.

---

## A11 · Edge cases and defensive rendering

**Serves:** Best Clean Code, Best UI
**Depends on:** Wave 1 merged
**Skill:** `impeccable` (edge cases)

"Edge cases handled" is stated explicitly in the Best Clean Code criteria. This is A02
from the code side rather than the screen side.

**Scope.** Feed hostile input to every render path:

- A field name 80 characters long. A codename of 20 characters (`COLLECTORS.md` warns
  long names break the panel — verify the warning is enforced, not just documented).
- A collector with 0 fields. With 40 fields.
- Unicode, emoji, RTL text, and HTML-looking strings (`<img onerror=...>`) in scraped
  values — this overlaps the security audit and both must agree.
- Integrity of exactly 0, exactly 60, exactly 90, exactly 100. Boundary conditions in
  `classify` and in the panel-size mapping.
- An incident with `closed_at` before `opened_at`. With `resolved: false`. With no stages.
  With stages out of order.
- A timestamp in the future. A scan 30 days old.
- `rows: 0` with `integrity: 100` — the "found nothing successfully" case, which is a
  real scraper failure mode and arguably the most interesting one on this list.
- Two collectors with the same codename.

**Pass bar.** Zero uncaught exceptions across the whole set. Zero layout breaks. Every
degenerate input either renders sensibly or is visibly rejected with a reason. Boundary
values classify per the documented thresholds, verified at the exact boundary rather than
near it.

**Verify.** A scratch fixture file per case under `?mock=1`; `browser_console_messages`
must be empty for each. Boundary cases checked against the thresholds in `config.js` by
reading both and comparing.

**Findings policy:** exceptions **F**. Layout breaks **F**. Exotic inputs that render
ugly but safely **D**.

---

## A12 · Code quality — the Monday-morning stranger test

**Serves:** Best Clean Code
**Depends on:** Wave 1 merged
**Skill:** none — read the code.

The category's own bar is "a repository a stranger could pick up on Monday." The project
already claims 19 JS modules and 21 stylesheets each small enough to read. Verify the
claim, then find what a stranger would trip over.

**Scope.**

- **Module size and single responsibility.** Confirm every file under 250 lines
  (`render.js` at 219 and `replay-view.js` at 206 are the two to watch). More importantly:
  can each file's purpose be stated in one sentence from its name alone?
- **Dead code.** `app/nul` (10.9KB, an accidental Windows redirect artifact),
  `atlas-probe.json`, `create-*.json`, `public/` empty directory. A stranger opening the
  repo root sees these first. Anything not needed to run, understand, or evidence the
  project is deleted or moved into a clearly named directory.
- **Two CI systems.** Both `.gitlab-ci.yml` and `.github/workflows/watch.yml` exist. One
  of them is now vestigial. A stranger cannot tell which pipeline is real — this is
  actively confusing and must be resolved or explicitly documented.
- **Naming consistency** across the boundary: `scripts/lib.js` writes the data shape,
  `web/js/adapter.js` reads it. Confirm the field names match exactly and that the
  contract is documented in one place, not two drifting ones.
- **Duplication.** `fixtures.js` and `replay-fixtures.js`; `render.js` and
  `replay-view.js` likely share formatting helpers with `format.js`. Find copy-paste.
- **Error handling in `scripts/`.** `repair.js` is wired with `|| true` in the workflow so
  a failed heal is recorded as data. Confirm the script actually records the failure
  rather than exiting silently — the `|| true` is only defensible if something is written.
- **The house rules hold:** no comments in code, all imports at the top. This project's
  own convention, stated in `CLAUDE.md`.
- **Global namespace.** 22 scripts loaded as plain `<script>` tags with no modules. Every
  one attaches to `window`. Verify there are no collisions and that the load order in
  `index.html` is not a hidden dependency graph — if reordering two tags breaks the page,
  that dependency must be documented at minimum.

**Pass bar.** Zero files over 250 lines. Zero unreferenced files in the repo root. One
unambiguous CI pipeline. Every `window.*` global enumerated in one list with no
duplicates. Data contract documented in exactly one place. `node --check` clean on every
script.

**Verify.**
```bash
wc -l web/js/*.js web/css/*.css scripts/*.js | sort -rn | head -20
for f in scripts/*.js web/js/*.js; do node --check "$f" || echo "FAIL $f"; done
```
Plus `browser_evaluate` diffing `Object.keys(window)` against a blank page to enumerate
every global the console defines.

**Findings policy:** dead files **F** (deletion is free). CI ambiguity **F**. Duplication
**D** unless it is a genuine correctness risk. Module system rework **D** — introducing a
build step now would violate a locked decision and risk the deploy.

---

## A13 · Performance — weight, load, layout stability

**Serves:** Best UI
**Depends on:** Wave 1 merged
**Skill:** `impeccable` (performance)
**Tools:** Playwright MCP (`browser_network_requests`, `browser_evaluate`)

No build step means 22 unbundled scripts and 21 unbundled stylesheets — 43 render-blocking
requests before a single pixel. On HTTP/2 that is survivable; it still needs measuring
rather than assuming.

**Scope.**

- **Request count and waterfall.** 43 static requests plus 2 JSON fetches plus Google
  Fonts. Measure actual load, not theoretical.
- **`assets/the-watch.png` is 638KB.** If it ever lands on the page or in the README
  above the fold, that is the single largest line item. Compress it or confirm it is
  README-only.
- **Font blocking.** Four families with multiple weights from Google Fonts. `preconnect`
  is present; verify `display=swap` prevents blocking and measure the cost of the request
  itself. Consider whether Bangers — used only for bursts — needs to load at all before
  first paint.
- **Cumulative Layout Shift.** The high-risk one for this design: panels resize on state
  change *by design*, and fonts swap in. Measure CLS and separate intentional shifts
  (state changes, which are the product) from unintentional ones (font swap, image reflow,
  data arriving). Only the latter are findings.
- **The 60-second refresh.** Confirm it does not re-render the entire DOM each cycle. A
  full teardown every minute would break scroll position, close popovers, and burn battery
  on the judge's iPad.
- **The turbulence filter** is a continuous SVG displacement map. Measure its frame cost —
  it is the most expensive single element on the page.
- **History cap.** `history.json` is capped at 2000 entries but is already 12KB. Project
  the size at the cap and confirm the sparkline does not attempt to render 2000 points.

**Pass bar.** Total transferred under 1MB on first load, excluding the README image.
First Contentful Paint under 2.0s on a simulated Fast 3G. CLS under 0.1 excluding
deliberate state-change reflows. The 60s refresh mutates rather than replaces. No sustained
frame rate below 30fps with the symbiote active.

**Verify.** `browser_network_requests` for the waterfall and total bytes.
`browser_evaluate` with a `PerformanceObserver` on `layout-shift` and `paint`.
Repeat with CPU throttling at 4×.

**Findings policy:** image weight **F**. CLS from fonts **F** if a `size-adjust` fallback
fixes it, else **A**. Bundling **D** — it violates the no-build-step decision and the risk
before Sunday exceeds the gain.

---

## A14 · Security and secrets

**Serves:** Best Clean Code, Best Use of Bright Data
**Depends on:** Wave 1 merged
**Skill:** none
**Tools:** context7 for GitHub Actions semantics

A security audit already passed (XSS, secrets, atomic writes). This is the re-check
against everything added since, plus the two surfaces that did not exist then: the
Cloudflare Worker heal endpoint and the GitHub Actions workflow.

**Scope.**

- **XSS re-check on new render paths.** Scraped values from real websites are rendered
  directly into the console — `received.js` displays *received* values verbatim, which is
  the highest-risk path in the entire codebase by design. Confirm every insertion is
  `textContent` or escaped, never `innerHTML` with untrusted content. Audit
  `received.js`, `value.js`, `sheet.js`, `replay-view.js` specifically.
- **The heal endpoint** (`endpoint/worker.js`). The token stays server-side, which is
  right. Verify: is there rate limiting? Can an anonymous visitor trigger unlimited heals
  and burn our credit? Is there any origin check? A public button that spends money needs
  a bound on it, and the balance is $52.
- **Workflow permissions.** `contents: write`, `pages: write`, `id-token: write`. The
  `scan` job pushes to `main`. Confirm the token scope is minimal and that
  `push: branches: [main, develop]` on a workflow that also has `contents: write` cannot
  be triggered by an outside contributor's PR.
- **Secrets in output.** `BRIGHTDATA_API_KEY` is passed as env to both scripts. Confirm
  neither script ever prints it, including inside an error object or a stack trace, and
  that no `bdata` output containing a key is echoed into logs.
- **Committed data.** `data/*.json`, `kestrel-probe.json`, `kestrel-after.json`,
  `atlas-probe.json` are real scraped payloads committed to a public repo. Confirm none
  contains anything that should not be public.
- **Atomic writes.** Re-verify: two concurrent workflow runs cannot corrupt
  `history.json`. `concurrency: group: watch` guards it at the workflow level — verify the
  file-level write is still atomic in case the guard is ever removed.

**Pass bar.** Zero `innerHTML` assignments with data-derived content. The heal endpoint
has a rate limit or is disabled before submission. Zero secrets in any committed file, log
or output. Workflow permissions minimal. `git log -p` over `data/` shows no key-shaped
string.

**Verify.**
```bash
grep -rn "innerHTML" web/js/ scripts/
grep -rniE "api[_-]?key|secret|token|bearer" --include=*.js --include=*.json --include=*.yml .
```
Every hit triaged individually. Then a scripted POST to the heal endpoint from an
unauthenticated origin and observe what happens.

**Findings policy:** **all F.** A secret leak or an unbounded spend endpoint is
disqualifying in a way no other finding here is. If the heal endpoint cannot be bounded in
time, disable the button — the feature is worth less than the risk.

---

# WAVE 3 — SUBMISSION

Serial, final morning. These four are about how the work is *presented*, which is the
part most projects neglect and the part every category is actually judged on.

---

## A15 · The Bright Data narrative

**Serves:** Best Use of Bright Data (the main prize)
**Depends on:** Wave 2 merged
**Skill:** `artifact-design` if a judge-facing one-pager is published

The category asks four specific questions. This audit's only job is to make each one
answerable in under a minute, from artifacts a judge can open without asking us.

| The question | Our answer | Where it must be visible |
|---|---|---|
| How was the scraper designed in Scraper Studio? | Three collectors, per-field validators in `collectors.json`, targets robots-checked | README + `COLLECTORS.md` |
| How is it controlled from a coding agent? | `health-check.js` scans, `repair.js` decides and heals with `--auto-approve --auto-save`, cron every 30 min, no human | README architecture section + `watch.yml` |
| What happened when the site changed underneath? | KESTREL 0%→100% and ATLAS 90%→100%, **same Collector IDs**, unattended | README opening + `COLLECTORS.md` heal table |
| What did the structured output become? | This console — Integrity, symbiote, replay, MTTR, blast radius | The live URL |

**Scope.** Verify each answer is (a) present, (b) evidenced by a file a stranger can open,
and (c) findable within one scroll. The KESTREL story is the strongest asset this project
has — a *real, unplanned* break on a *real* site, healed on an *unchanged* Collector ID,
with before/after payloads committed. Confirm it is the first thing in the README, because
it currently is and that is correct.

**Pass bar.** All four questions answered above the fold in the README or one click away.
Every claim linked to a committed file with a line reference or a timestamp. Both heals in
the `COLLECTORS.md` table with identical before/after IDs. Zero claims that cannot be
checked from the public repo.

**Verify.** Hand the README to someone with no context and ask the four questions. Time
each answer. Anything over 60 seconds is a finding. Then verify every referenced file
actually exists at the referenced path from a fresh anonymous clone.

**Findings policy:** missing evidence **F**. Restructuring the README **F** — this is the
main prize and the README is its primary artifact.

---

## A16 · Documentation

**Serves:** Best Clean Code
**Depends on:** A15
**Skill:** none

Nine docs plus two READMEs. The risk is not absence, it is **drift** — documentation that
contradicts the code is worse than none, because it makes the stranger distrust everything.

**Scope.**

- **The known drift — swept Aug 21, re-check rather than assume.** The original findings
  (GitLab CI referenced where GitHub Actions runs, "BODEGA is not created" against a pinned
  `c_mt2lkwxa1bb5uz223s`, "`incidents.json` is empty" against `inc_001`, "first manual heal
  outstanding" above a table of completed heals) have all been corrected in `PLAN.md`,
  `SUBMISSION.md`, `COLLECTORS.md`, `PROGRESS.md`, `TASKS.md` and both `CLAUDE.md` files.
  The numbers to check on the next pass are the ones that move: **238 tests**, **three
  collectors**, **three heals**, **two incident records — `inc_001` closed, `inc_002`
  open**. Each of these is a stranger's first impression that the docs are stale.
- **Setup instructions actually work.** From a fresh clone: does the documented sequence
  produce a running console? Every command in the README run verbatim.
- **Every Collector ID in every document matches** `collectors.json` character for
  character.
- **The roadmap section** is explicitly marked as not built — verify nothing in it reads
  as shipped.
- **`docs/prototype.html`** (28KB) is superseded by `web/`. Either mark it as the historical
  prototype or remove it; an unmarked duplicate implementation confuses a code reviewer.
- **Architecture diagram** in the README matches the actual module layout after A12's
  deletions.

**Pass bar.** Zero contradictions between any two documents on: which CI runs, how many
collectors exist, how many incidents exist, which heals happened. Every command in every
README executes successfully from a fresh clone. Every Collector ID identical everywhere.

**Verify.** Fresh clone into a temp directory, follow the README literally, record every
divergence. Then grep every doc for each Collector ID and diff the result sets.
```bash
grep -rn "c_m" docs/ app/README.md app/collectors.json | sort -u
```

**Findings policy:** contradictions **F** — they are one-line edits with outsized cost.
Prose improvements **D**.

---

## A17 · Commit history

**Serves:** Best Clean Code
**Depends on:** A16
**Skill:** none

**This audit is read-only. Git is not to be touched — no rewriting, no amending, no
rebasing, no squashing.** History is evidence, and the cron's own commits are part of the
proof that the automation is real.

**Scope.** Read the log and assess what a reviewer sees:

- Are commits scoped to one task each, as `app/CLAUDE.md` requires? A single commit
  spanning six tasks cannot be reviewed and the project's own rules say so.
- Do messages say what changed and why?
- Are the CI commits (`data: scan <timestamp>`) distinguishable from human commits? They
  should be — they are the evidence of unattended operation, and their regular 30-minute
  cadence is itself a story worth pointing at.
- Any secret ever committed and later removed? A removed secret is still in the history
  and this is the one finding here that requires action beyond documentation.

**Pass bar.** A written assessment. If commits are clean, say so in the README's
contributing note and point a reviewer at the cron commits as evidence. If they are not,
that is an **A** — accepted and unchanged.

**Verify.**
```bash
git log --oneline -n 40
git log --format='%an %s' -n 40 | sort | uniq -c
```
Both read-only. Report to the owner; the owner decides whether anything is done.

**Findings policy:** **A** for everything except a leaked secret, which is escalated to
the owner immediately as a decision, not an action.

---

## A18 · Submission readiness — the dress rehearsal

**Serves:** all four
**Depends on:** everything. Runs last, alone, with nothing else in flight.
**Tools:** Playwright MCP, fresh anonymous clone

The final gate. Runs against the **deployed** artifact, not the working tree.

**Scope — the checklist, in order:**

1. **Anonymous clone.** Both repos, incognito, no credentials. Both must clone.
2. **Fresh-clone run.** Follow the README from scratch on the cloned copy.
3. **The deployed URL loads** in an incognito window with no console errors.
4. **The deployed console reads real data**, not fixtures. Confirm `?mock=1` is absent
   from the default route and that the data shown matches `data/history.json` in the repo.
5. **The cron ran overnight.** Check the newest timestamp in `history.json` is under an
   hour old. If the cron has stopped, the console shows stale data and A01's `LIVE`
   readout finding becomes urgent again.
6. **Both heals evidenced** — `COLLECTORS.md` table, identical Collector IDs, and the
   probe JSONs present.
7. **Video** recorded, uploaded, link resolves in incognito, and **no frame shows a key,
   a token, or a terminal with credentials.** Scrub frame by frame wherever a terminal or
   editor is visible.
8. **README header screenshot** present, taken with `?capture=1` at 1440px+.
9. **LinkedIn post** posted, tagged **WeMakeDevs**, links to the repo and the live
   console. This is a separate prize that costs zero developer hours — not posting it
   forfeits a category outright.
10. **Known gaps section** in `SUBMISSION.md` updated with every **A** from every audit
    above. A stated gap costs nothing.
11. **Deferred register** below is complete and honest.

**Pass bar.** All eleven items confirmed by direct observation on the deployed artifact —
not from memory and not from the working tree. Any single failure blocks submission of
that item, not of the submission itself: **submit before polishing is finished.**

**Verify.** Playwright against the public URL in a clean context: `browser_navigate`,
`browser_console_messages` (must be empty), `browser_network_requests` (confirm the JSON
fetches return 200 with fresh data), `browser_take_screenshot` at 1440 and 390.

**Findings policy:** items 1–5 **F**, they are blocking. Items 6–11 **F**, they are each
under 20 minutes. Nothing defers at this stage — either it is done or it is stated.

---

## Exit criteria

The audit pipeline is complete when all of the following hold. Not "mostly."

| # | Criterion |
|---|---|
| 1 | Every audit A01–A18 has been run and has a written result |
| 2 | Every finding carries **F**, **D**, or **A** — zero untriaged |
| 3 | Every **F** is fixed and committed |
| 4 | Every **D** is in the Deferred register with a reason |
| 5 | Every **A** appears in `SUBMISSION.md` under "Known gaps" |
| 6 | Zero axe-core violations at serious or critical (A04) |
| 7 | Zero browser console errors on the deployed URL in three engines (A09, A18) |
| 8 | Zero contradictions between any two documents (A16) |
| 9 | Zero on-screen figures that cannot be traced to a source field (A01) |
| 10 | The cron's newest scan is under an hour old at submission (A18) |
| 11 | Both heals evidenced with identical Collector IDs before and after (A15) |
| 12 | The LinkedIn post is live and tagged WeMakeDevs (A18) |

**The overriding rule, restated:** a submitted good project beats an unsubmitted great
one. If Sunday morning arrives with audits outstanding, submit with the gaps stated and
keep auditing afterward. Criteria 1–5 are process; criterion 12 is a whole category; and
an unsubmitted repository scores zero in all four.

---

## Time budget

Roughly 14 working hours across three parallel agents, which fits the remaining window
with margin for the video.

| Wave | Audits | Serial time | Wall clock at 3 agents |
|---|---|---|---|
| 0 — Truth | A01–A03 | 3.0h | 3.0h (serial by design) |
| 1 — Surface | A04–A09 | 6.5h | ~2.5h |
| 2 — Substance | A10–A14 | 5.5h | ~2.0h |
| 3 — Submission | A15–A18 | 3.0h | 3.0h (serial by design) |
| | | **18.0h** | **~10.5h** |

Plus fix time, which is not estimated here because it depends on what is found. Budget an
additional 40% and cut from Wave 2 first if the window closes — A10 and A13 are the two
whose absence costs least.

---

## Deferred register

Every **D** lands here with a one-line reason. Empty at the start; it is filled as the
pipeline runs. An empty register at the end means either a flawless project or an audit
that was not run honestly, and only one of those is likely.

| Audit | Finding | Why deferred | Would cost |
|---|---|---|---|
| | | | |

---

## Accepted-and-stated register

Every **A**. These are copied verbatim into `SUBMISSION.md` under "Known gaps" before
submitting. A judge who finds an unstated gap discounts everything else; a stated one
costs nothing.

| Audit | What we are not fixing | Why it is acceptable |
|---|---|---|
| | | |

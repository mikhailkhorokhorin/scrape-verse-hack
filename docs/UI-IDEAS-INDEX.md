# UI ideas — the whole index

Every id in the project, with what happened to it. Ids are never reused.

`UI-01` – `UI-23` are wave one and are **built** — see `PROGRESS.md`. `UI-24` – `UI-82` are
waves two, three and four, written on 21 Aug against the built console. Fifty-nine ideas.

The product decision that resolves them is `BEST-UI-THE-PLAY.md`: one spine, one image,
one interaction, six moves.

| Status | Meaning |
|---|---|
| **SHIPPED** | Built and live on the page. The move that carried it is done |
| **MOVE n** | Alive. Folded into that move of the play |
| **KILLED** | Dead with a reason. Do not re-propose |
| **DEFER** | Not dead, not scheduled. Rides on a move that is not committed yet |
| **CHORE** | Not an idea. A defect to fix in passing |

---

## Wave two — UI-24 to UI-48 · *chrome*

Twenty-five ideas, twenty-four rejected the day they were written. They decorated or
serviced the console without adding a page to the book, and they were ranked by cost —
which is how a list of chores gets written by accident.

| Id | Idea | Status |
|---|---|---|
| UI-24 | Cover furniture in the masthead — issue no., cover date, `821 TESTS` where the price goes | KILLED |
| UI-25 | `APPROVED BY THE WATCH` authority stamp | KILLED |
| UI-26 | The barcode is the commit sha | KILLED |
| UI-27 | Printer's crop marks and CMYK bar in the margin | KILLED |
| UI-28 | Page numbers and an incident spine down the margin | KILLED |
| **UI-29** | **The ad page — period ad selling our own MCP server** | **SHIPPED** · MOVE 6 |
| UI-30 | The letters page (heal prompts as a letters column) | KILLED — reworked as UI-52, also killed |
| UI-31 | `NEXT ISSUE` teaser carrying the roadmap | KILLED |
| UI-32 | The 404 is a taken page | KILLED |
| UI-33 | Countdown to the next sweep | KILLED — the live half survives as the sweep hand, UI-69 |
| UI-34 | The page notices it is being watched | KILLED — its idea survives as the spine of the play |
| UI-35 | Ink-in on scroll | KILLED — superseded by UI-72 |
| UI-36 | The sparkline draws itself | KILLED — reworked as UI-73 |
| UI-37 | The landing scan gets an event | KILLED — reworked as UI-79 |
| UI-38 | The masthead takes damage | KILLED |
| UI-39 | Halftone coarsens as the fleet decays | KILLED |
| UI-40 | The rogues gallery — four strains as wanted posters | KILLED |
| UI-41 | The cast roster | KILLED |
| UI-42 | Every Spider has a record | KILLED |
| UI-43 | The symbiote's origin panel | KILLED — its job is done physically by MOVE 2 |
| UI-44 | The link preview — `og:image` | **SHIPPED** · CHORE — the `og:`/`twitter:` block is in `<head>` |
| UI-45 | Film mode — the page plays itself for the video | KILLED |
| UI-46 | Judge tour | KILLED |
| UI-47 | Per-issue link previews | KILLED — needs a build step we do not have |
| UI-48 | A visible motion switch | KILLED |

---

## Wave three — UI-49 to UI-68 · *a page of the comic that happens to be true*

Written against the one test wave two passed. Twenty ideas.

| Id | Idea | Status |
|---|---|---|
| **UI-49** | **The No-Prize — inc_003, the heal that fixed nothing, framed as the award comics gave readers who caught a mistake and explained it** | **SHIPPED** · MOVE 3 |
| **UI-50** | **A break is a canon event — the thesis panel** | **SHIPPED** · MOVE 1 |
| **UI-51** | **The bullpen — the cron's editor page, `0 humans since`** | **SHIPPED** · MOVE 1 |
| UI-52 | Letters from the fleet — Spiders complaining, heal prompt as the editor's reply | KILLED — same trick as MOVE 1 and MOVE 3, and the third instance turns a device into a tic |
| UI-53 | In memoriam — obituaries for dead fields | KILLED — same reason |
| UI-54 | Continuity footnotes — `*see ISSUE #3 —ed.` | KILLED — same reason |
| **UI-55** | **The mail-in order form behind the ad** | **SHIPPED** · MOVE 6 |
| UI-56 | The slab — fleet Integrity as a collector's grade | KILLED — a collector joke for an audience of collectors |
| UI-57 | The paper ages with the data | KILLED — right idea, wrong deadline; it changes a shipped state and re-opens a contrast check |
| UI-58 | Variant covers | KILLED |
| UI-59 | The page comes off the press on load | **SHIPPED · MOVE 4** — folded into the scroll version |
| UI-60 | Hold a key and the CMYK plates come apart | **DEFER** — free once MOVE 4 exists, worthless before it |
| **UI-61** | **Scratch the symbiote off — the headline** | **SHIPPED** · MOVE 2 |
| **UI-62** | **It does not like being watched — the flinch** | **KILLED** — the optional rider on MOVE 2; cut because it fights the turbulence filter, as the play allowed |
| UI-63 | Konami | KILLED — an easter egg nobody finds in ninety seconds |
| UI-64 | The multiverse page | KILLED — more scroll is not more product |
| **UI-65** | **While you were asleep — the overnight numbers** | **SHIPPED** · MOVE 1 |
| UI-66 | Trading cards | KILLED — same |
| UI-67 | The Daily Bugle | KILLED — a second art direction inside one page |
| UI-68 | The origin, in four panels | KILLED — same |

---

## Wave four — UI-69 to UI-82 · *motion*

The spec's motion table is built — 23 keyframes, 36 `animation:` declarations. This wave
is what the table never covered. Fourteen ideas.

| Id | Idea | Status |
|---|---|---|
| **UI-69** | **SHIPPED · The sweep hand — one real lap between crons, duration computed not chosen** | **MOVE 5** |
| UI-70 | The substance creeps at the speed it actually crept | KILLED |
| UI-71 | SHIPPED IN PART · Drift between scans — the page changes while you sit still | **MOVE 5** in part; its yellowing half dies with UI-57 |
| **UI-72** | **SHIPPED · The page prints as you read it — scroll-driven CMYK passes** | **MOVE 4** |
| UI-73 | The sparkline is drawn, not displayed | **DEFER** — trivial once MOVE 4's timeline exists |
| **UI-74** | **SHIPPED · The impact frame — 60ms full-page inversion on a real break** | **MOVE 5** |
| UI-75 | Speed lines from the integrity delta | KILLED |
| UI-76 | Ben-Day bloom — halftone dots carry the value | KILLED |
| UI-77 | The purge takes the whole page | KILLED — it can only fire on a heal, which will not happen during judging |
| UI-78 | SHIPPED · The odometer — numbers roll digit by digit | **MOVE 5**, same commit or not at all |
| UI-79 | SHIPPED · The stamp — the landing scan presses into the panel | **MOVE 5**, same commit or not at all |
| **UI-80** | **SHIPPED · Stillness is the health signal — motion reserved for damage** | **MOVE 5** |
| UI-81 | Weight and lag — one spring in the rig | KILLED |
| **UI-82** | **FIXED · The whole grid re-enters on every landing scan** | **MOVE 5 — fix first.** A defect, not an idea |

---

## The tally

| | Count |
|---|---|
| Ideas written in waves two to four | 59 |
| Shipped — built and live on the page | 8 |
| Alive, folded into the moves not yet shipped | 9 |
| Deferred — ride on MOVE 4's timeline | 2 |
| Killed with a reason | 40 |

Of the eight shipped, seven are ideas (UI-29, UI-49, UI-50, UI-51, UI-55, UI-61, UI-65) and
one is the UI-44 chore. UI-62 joined the killed column when MOVE 2 shipped without it.

Forty of fifty-nine died, and that is the point of the exercise. The three waves are
kept in full because the reasoning is what stops the same ground being re-walked on the
last day.

## The six moves, and what each one is made of

| Move | What it is | Built from | State |
|---|---|---|---|
| **MOVE 1 · The open** | `NOBODY HAS LOOKED AT THIS FLEET IN 4h 12m`, the overnight numbers, the canon-event line | UI-50, UI-51, UI-65 | **SHIPPED** 22 Aug |
| **MOVE 2 · The scratch** | Drag the black off a panel, find the value that actually came back | UI-61, UI-62 | **SHIPPED** 22 Aug (UI-62 cut) |
| **MOVE 3 · The No-Prize** | Our own false positive, framed as the medium's award, in a closed envelope | UI-49 | **SHIPPED** 22 Aug |
| **MOVE 4 · The press** | The page prints as you scroll it, three plates, misregistered until they snap | UI-59, UI-72 | not started |
| **MOVE 5 · Stillness** | Only damage moves; one arc turns at the real cron rate; the flash gets fixed | UI-82, UI-80, UI-69, UI-74, UI-71, UI-78, UI-79 | in progress |
| **MOVE 6 · The ad** | The period ad and its order form | UI-29, UI-55 | **SHIPPED** 22 Aug |

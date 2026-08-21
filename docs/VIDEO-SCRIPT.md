# T-13 — Demo video script

Target length **2:50**, hard ceiling 3:00. Record at **1440px wide or more** so panel
detail survives compression. One take per section is fine — cut between sections, never
inside one.

## What this script is built to answer

Best Use of Bright Data is judged on four questions. Every section below is assigned to
one of them, and each answer lands in under 60 seconds with an artifact on screen.

| # | The judge's question | Section | Artifact on screen |
|---|---|---|---|
| 1 | How did you design the scraper in Scraper Studio? | 2 | `collectors.json` — three collectors, per-field validators |
| 2 | How did you control it from a coding agent? | 3 | the MCP server answering inside Claude Code |
| 3 | What happened when the site changed underneath it? | 4–6 | three incidents, Chaos Lab, `heal_receipt` |
| 4 | What did the structured output become? | 7 | THE HAUL and the live console |

## The facts this script stands on

Everything stated below is on disk and checkable. Nothing is invented for camera.

| Fact | Where it is |
|---|---|
| Three collectors, per-field validators | `app/collectors.json` |
| KESTREL `c_mt2fnt3p2k4n644701`, RENAMED, 0 → 100 | `data/incidents.json` `inc_001` |
| ATLAS `c_mt2fnqqngikv29od5`, DRIFTED, 90 → 100 | `data/incidents.json` `inc_002` |
| BODEGA `c_mt2lkwxa1bb5uz223s`, THROTTLED, 0 → 100, **opened by the cron itself** | `data/incidents.json` `inc_003` |
| KESTREL's broken and healed payloads | `app/kestrel-probe.json`, `app/kestrel-after.json` |
| Collector ID identical before and after, all three | same `c_*` in every record above |
| The cron committing its own scans | `git log` — `data: scan 2026-08-21T07:49:43Z`, `data: scan 2026-08-21T08:44:18Z` |
| Six MCP tools over stdio JSON-RPC, no SDK | `app/mcp/registry.js` |
| 528 tests, ESLint in CI | `npm test`, `.github/workflows/watch.yml` |

**The strongest asset in this list is `inc_003`, and it is the one that failed.** The
cron opened it alone, diagnosed THROTTLED, healed — and the heal did not work, because
nothing on the target had broken. Our own payload parser was scoring the envelope instead
of the rows. That is written into the incident summary and it stays in the video. A
system that only ever reports its successes is a system nobody can audit.

---

## What must appear on screen, non-negotiable

- [ ] A Collector ID legible **at least twice** — once before a heal, once after — so the
      viewer sees it is the same string
- [ ] The `inc_003` honesty line spoken plainly: *the heal did not fix it, and the record
      says so*
- [ ] The words spoken plainly: *the demo page is ours and we break it on purpose*
- [ ] The words spoken plainly: *healing takes up to 15 minutes; Replay is recorded, not
      accelerated*
- [ ] Zero secrets. No `.env`, no `BRIGHTDATA_API_KEY`, no token in any terminal frame.
      **Check the scrollback before you hit record** — a key from an earlier command
      sitting three screens up will end up in the export

## Before you press record

1. Close every other tab. Terminal scrollback cleared (`clear`, then check by scrolling up)
2. `data/` backed up — `cp -r data data.bak`
3. Browser at 1440px+, zoom 100%, bookmarks bar hidden
4. Four tabs / windows staged in this order:
   - Tab A: the live console (real data)
   - Tab B: `demo-target/broken-renamed.html` — the Chaos Lab, broken variant.
     **The variants are separate files, not query strings** — `demo-target/?v=renamed`
     serves the *healthy* page. Use `index.html`, `broken-renamed.html`,
     `broken-drifted.html`
   - Editor: `app/collectors.json`, `app/kestrel-probe.json`, `app/kestrel-after.json`
   - Terminal: Claude Code with the THWIP MCP server already connected (`/mcp` shows it)
5. In Claude Code, run the two read-tool calls once before recording so the responses are
   warm and you are not waiting on camera
6. Rehearse once with the timer running. If you land over 3:00, use the cut order at the
   bottom

---

## Section 1 — Cold open · 0:00–0:12

**Screen:** THE WATCH, live console, full grid. No cursor movement. Let the sparklines and
the fleet pulse move on their own for two seconds before speaking.

**Say:**

> This is THWIP. It watches web scrapers — not whether they're running, but whether what
> they're returning is still real. Scrapers don't crash. They decay: a selector stops
> matching, the rows keep arriving, and they arrive with holes in them.

**Direction:** Do not click. The grid is the hero shot and it has to be seen before it is
explained.

**Reality check:** the fleet is currently **all three green at 100%**, so there is no
black substance on any panel in this frame — the header reads `FLEET INTEGRITY 100%`,
`MEAN RE-WEAVE 72m 45s`, badge `LIVE`. That is the honest state and it is the right cold
open, but it means the symbiote cannot be pointed at until Section 2's cutaway and the
incident cards in Section 5. Do not gesture at "the black" over this shot.

---

## Section 2 — Question 1: how the scraper was designed · 0:12–0:45

**Screen:** Cut to `app/collectors.json` in the editor. Scroll from the top through all
three collector blocks.

**Say:**

> Three collectors, built in Bright Data's Scraper Studio with `bdata scraper create`.
> KESTREL on the Hacker News front page, ATLAS on books.toscrape.com, and BODEGA on a
> demo shop page that is ours.
>
> The part that matters is underneath each one. Every field carries a validator, not just
> a name — price is a number above zero, rating is a number between zero and five, ATLAS's
> availability has to match "In stock" or "Out of stock" exactly. That contract is what
> makes decay measurable: we don't ask whether a field came back, we ask whether what came
> back is still allowed to be there.

**Direction:** Pause with ATLAS's `availability` block on screen — the `pattern` line,
`"^(In stock|Out of stock)$"`, at line 60 of `collectors.json` — as you say "allowed to be
there". Then cut back to the console grid.

All three panels are healthy today, so each is a **strip with a 100% Integrity bar** and
no black on it. For the substance itself, cut to the **HOW TO READ A SPIDER** legend
directly under the grid — it shows the states side by side — or to the Section 5 incident
cards where BODEGA sits at 0% with four DEAD fields. Do not promise black on the grid.

**Say:**

> So each run scores one number: what fraction of the fields we contracted for actually
> came back real. That's Integrity. The black substance covering a panel is exactly what
> that scraper has lost — it's not decoration, it's the number.

---

## Section 3 — Question 2: controlling it from a coding agent · 0:45–1:20

**Screen:** Claude Code in the terminal, MCP server connected.

**Say:**

> The whole fleet is also an MCP server — six tools over stdio JSON-RPC, no SDK. So the
> loop runs in conversation.

**Type:** `Anything wrong with my scrapers?`

**Screen:** Claude calls `fleet_status`. The real response:

```
THWIP fleet — 3 spiders, 0 degraded, 0 critical

BODEGA (mikhailkhorokhorin.github.io)
  integrity 100%  HEALTHY
  scanned 75m ago at 2026-08-21T09:13:59.565Z
  rows 12
  collector_id c_mt2lkwxa1bb5uz223s
  live: title, price, rating, image
...
```

The `scanned Nm ago` figure grows with wall-clock time — do not read it aloud, and do
not be surprised when it differs from this block on the day.

**Type:** `What has broken so far?`

**Screen:** Claude calls `incident_log` — three incidents, all resolved.

**Say over it:**

> Four of the six tools read recorded data — instant, free, no network. The other two
> spend real Bright Data credits and say so in their own tool descriptions, so the agent
> asks before it runs a live scrape or a heal. That is the guardrail: the model can't
> quietly bill you.

**Direction:** Do not call `scan_fleet` or `heal_spider` on camera. Saying why you are not
calling them is stronger than calling them, and it is the truthful reason.

---

## Section 4 — Question 3, part one: the Chaos Lab · 1:20–1:40

**Screen:** Tab B — `demo-target/broken-renamed.html`.

**Say — this line is required:**

> To show a break on camera I'm using our own demo page. I'm saying that out loud so
> nobody has to wonder whether it was staged: this one is. The three real ones are next,
> and those weren't.

**Screen:** Click through the variant switcher — healthy, renamed, drifted.

**Say:**

> It ships in three variants. Healthy. Renamed, where fields go dead. And drifted, where
> the fields stay full and lie — that's the dangerous one, because a value comes back
> populated and wrong, and it passes every null check ever written. A judge can point a
> collector at any of these and break it themselves.

**Direction:** Land on the drifted variant as you say "populated and wrong". Hold two
seconds.

---

## Section 5 — Question 3, part two: the three real incidents · 1:40–2:20

**Screen:** Back to the console, incident feed. Three cards, newest first — the feed reads
**inc_003 (BODEGA), inc_001 (KESTREL), inc_002 (ATLAS)** in a two-column layout, *not* in
numeric order. Do not say "in order" over it. The narration below walks KESTREL → ATLAS →
BODEGA, so drive it from the editor files and the incident cards, not by reading the feed
top to bottom.

**Say:**

> Three real breaks, three real repairs.

**Screen:** Cut to `app/kestrel-probe.json`, scroll slowly.

**Say:**

> KESTREL, strain RENAMED. Thirty rows came back — so the row selector was fine — but the
> generated scraper had invented its own keys, `story_points` and `comment_count` instead
> of what we contracted for, and every value was zero. Thirty rows of confident nothing.
> Integrity zero. `bdata scraper heal --auto-approve --auto-save` fixed it unattended.

**Screen:** Cut to `app/kestrel-after.json`.

**Say:**

> Same collector afterwards. Real titles, real points, real authors. Zero to a hundred.
>
> ATLAS, strain DRIFTED, was subtler. The availability selector matched every availability
> element on the page and joined them together, so every row read "In stock, nineteen
> available, In stock, In stock" and on down the page — populated on every scan, wrong on
> every scan. Ninety to a hundred.

**Screen:** Cut to the BODEGA incident card, then to the `inc_003` summary text.

**Say — this is the section that makes the video worth watching, do not rush it:**

> And the third one nobody opened by hand. The cron caught BODEGA at zero percent twice
> and ran a heal on its own, overnight, with nobody watching — you can see its commits in
> the git log, authored by the workflow.
>
> The heal didn't fix it. And it didn't fix it because nothing on the target had broken.
> The scraper was returning one wrapped row holding a products array, and our own payload
> parser was scoring the envelope instead of the rows. The bug was ours.
>
> That diagnosis is still in the incident record, written exactly as the system believed
> it at the time — a false alarm, logged as a false alarm. We fixed the parser, the next
> scan read twelve rows at a hundred percent, and we left the wrong diagnosis on disk.
>
> A monitor that edits its own history to look smarter is the exact thing this project
> exists to catch.

**Direction:** Have the `summary` field of `inc_003` legible on screen for the last two
sentences. That text is the evidence.

---

## Section 6 — The receipt · 2:20–2:40

**Screen:** Back in Claude Code.

**Type:** `Prove the BODEGA repair — show me the receipt.`

**Screen:** Claude calls `heal_receipt` with `inc_003`. The real output:

```
HEAL RECEIPT inc_003
spider        BODEGA
collector_id  c_mt2lkwxa1bb5uz223s
strain        THROTTLED
integrity     0% -> 100%
resolved      yes

phases:
  DETECTED   2026-08-21T07:39:39.524Z  --
  DIAGNOSED  2026-08-21T07:48:20.779Z  +521s
  REWEAVING  2026-08-21T07:48:20.782Z  +0s
  VERIFIED   2026-08-21T09:13:59.565Z  +5139s

total 5660s from detection to verification

The collector_id never changed: c_mt2lkwxa1bb5uz223s was re-woven in place,
not replaced. Downstream consumers kept the same endpoint throughout.

heal prompt sent:
  On mikhailkhorokhorin.github.io: 'title' and 'price' and 'rating' and 'image'
  return null after a layout change. Likely THROTTLED: every field came back
  empty, so the request itself is likely being blocked or served a different
  page. Fix the extraction for those fields.
```

The output continues past the collector_id line — it ends with the heal prompt, not with
"not replaced". Scroll so the `collector_id` line is the frame you hold; the prompt block
below it is a bonus, not the point.

**Say:**

> Every phase, timestamped, with the gaps between them. And the line at the bottom is the
> hackathon requirement, answered in one tool call: the collector ID never changed. Same
> string going into the repair and coming out of it. All three collectors were repaired in
> place, not recreated — nothing downstream had to be re-pointed.
>
> Healing takes up to fifteen minutes, which is why the replay on the console is recorded
> rather than a live wait. Nothing there is accelerated — those are the real stage
> timestamps played back at a watchable pace.

**Direction:** This is the required Collector ID frame. Hold it with the cursor beside the
`collector_id` line. If you trim anything for time, trim elsewhere.

---

## Section 7 — Question 4: what the output became · 2:40–2:55

**Screen:** Console, scroll to THE HAUL.

**Say:**

> And this is what the structured output turns into. Not a health score — the rows
> themselves. Every card is real data the fleet brought back, stamped with the collector
> that fetched it, when it was scanned, and the Integrity that Spider was at the moment it
> was captured. Provenance travels with the data, so a row pulled at ninety percent tells
> you it was pulled at ninety percent.

**Screen:** Scroll back up to the full grid, clean.

**Say:**

> Scrapers decay silently, and they do it alone — at 3am, on a cron, in a container nobody
> opens. THWIP is the thing that's finally looking, it fixes what it finds, and it writes
> down what it got wrong.

**Direction:** Hold the grid for two seconds after the last word, then stop. No outro card,
no music sting.

---

## Cut order if you run long

Cut in this order and stop as soon as you are under 3:00:

1. Section 4's variant click-through — narrate over the drifted variant alone (−8s)
2. Section 5's ATLAS paragraph — the two-incident version still carries the argument (−12s)
3. Section 3's second prompt (`What has broken so far?`) — `fleet_status` alone shows the
   agent control (−10s)
4. Section 2's console cutaway — the Integrity explanation is repeated visually anyway (−8s)

**Never cut:** the `heal_receipt` collector-ID frame, the `inc_003` failed-heal paragraph,
the "our own page, broken on purpose" line, or the "up to fifteen minutes, recorded not
accelerated" line.

## After the export

- [ ] Watch it start to finish, once, at full size
- [ ] Scrub for secrets — pause on every frame containing a terminal or an editor
- [ ] Confirm the collector ID is legible at 1080p, not just at source resolution
- [ ] Confirm the `inc_003` summary text is readable, not just visible
- [ ] Upload, get the link, put it in `app/README.md` and in `docs/SUBMISSION.md`

---

## Shot check — 2026-08-21

Every section was opened on the staging build (`http://localhost:8081/`) and each claim
compared against what actually renders. Reference stills are in `video-stills/`, outside
both repositories. Animations were frozen (`*{animation:none!important}`) before capture.

| # | Section | Verdict | Still |
|---|---|---|---|
| 1 | Cold open · the grid | reproducible — note added: fleet is all-green, no symbiote in frame | `01-cold-open-grid.png` |
| 2 | `collectors.json` · validators | reproducible — direction corrected, `pattern` is line 60 | `02-collectors-json.png`, `02b-legend-how-to-read.png` |
| 3 | MCP · `fleet_status` | reproducible — quoted block corrected (`scanned … ago` line) | `03-mcp-fleet-status.png` |
| 4 | Chaos Lab · variants | **fixed** — `?v=` query strings do not switch variants | `04a-chaos-healthy.png`, `04b-chaos-renamed.png`, `04c-chaos-drifted.png` |
| 5 | Three real incidents | **fixed** — feed order is newest-first, not numeric | `05a-kestrel-probe-broken.png`, `05b-kestrel-after-healed.png`, `05c-inc003-summary.png` |
| 6 | `heal_receipt` · the receipt | reproducible — quoted block completed; every number matches | `06-incident-replay.png`, `06b-mcp-heal-receipt.png` |
| 7 | THE HAUL | reproducible — 636 rows, 30 scans, 3 sources, provenance stamps present | `07-the-haul.png` |

Raw tool output as captured, for word-for-word comparison on the day:
`video-stills/_mcp-fleet_status.txt`, `_mcp-heal_receipt-inc_003.txt`,
`_mcp-incident_log.txt`.

### What was corrected, and why

1. **Chaos Lab URLs** — the staging tab was listed as `demo-target/?v=renamed`. That query
   string is inert; the page serves the *healthy* build. The variants are separate files:
   `index.html`, `broken-renamed.html`, `broken-drifted.html`. This would have put a
   healthy page on camera under the word "broken".
2. **`fleet_status` block** — the real output carries a `scanned Nm ago at <ts>` line the
   script omitted. Added, with a note that the figure moves with wall-clock time.
3. **`heal_receipt` block** — the real output does not end at "not replaced". It continues
   with `total 5660s`, a second clause on the collector_id line, and the heal prompt.
   Completed, so the frame matches what the terminal prints.
4. **Incident feed order** — the feed renders newest-first (inc_003, inc_001, inc_002) in
   two columns. "Here they are in order" contradicted the screen; removed.
5. **Test count** — `npm test` now reports **528** tests, not 238.
6. **ATLAS drift string** — real value is `In stock (19 available) In stock In stock…`;
   narration reworded to match what is on screen.
7. **Sections 1–2 symbiote** — all three spiders are at 100%, so no black substance is on
   any panel. Both directions now say so and point at the legend and the incident cards
   instead.

### Verified unchanged

Collector IDs (all three), `inc_003` phase timestamps and `+521s / +0s / +5139s` gaps,
`0% -> 100%`, strain names, the two cron commits authored by `thwip watch`, six MCP tools
with exactly two carrying the credit warning, `MEAN RE-WEAVE 72m 45s / mean of 3
re-weaves`, badge `LIVE`, ATLAS blast radius 120 rows across 6 scans, and the full
`inc_003` summary text rendering legibly in the feed.

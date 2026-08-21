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
| 238 tests, ESLint in CI | `npm test`, `.github/workflows/watch.yml` |

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
   - Tab B: `demo-target/?v=renamed` — the Chaos Lab, broken variant
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

**Direction:** Pause with ATLAS's `availability` block on screen — the `pattern` line — as
you say "allowed to be there". Then cut back to the console grid and hover one panel so
the Integrity bar reads.

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
  rows 12
  collector_id c_mt2lkwxa1bb5uz223s
  live: title, price, rating, image
...
```

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

**Screen:** Tab B — `demo-target/?v=renamed`.

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

**Screen:** Back to the console, incident feed. Three cards.

**Say:**

> Three real breaks, three real repairs. Here they are in order.

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
> element on the page and joined them together, so every row read "In stock nineteen
> available In stock In stock" — populated on every scan, wrong on every scan. Ninety to a
> hundred.

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

The collector_id never changed: c_mt2lkwxa1bb5uz223s was re-woven in place,
not replaced.
```

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

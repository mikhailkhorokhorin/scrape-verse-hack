# Demo video script

Target length **2:50**, hard ceiling 3:00. Record at **1440px wide or more** so panel
detail survives compression. One take per section is fine — cut between sections, never
inside one.

## What this script is built to answer

Best Use of Bright Data is judged on four questions. Every section is assigned to one of
them, and each answer lands in under 60 seconds with an artifact on screen.

| # | The judge's question | Section | Artifact on screen |
|---|---|---|---|
| 1 | How did you design the scraper in Scraper Studio? | 2 | `collectors.json` — three collectors, per-field validators |
| 2 | How did you drive it from a coding agent? | 3 | the MCP server answering inside Claude Code |
| 3 | What happened when the site changed underneath it? | 4–6 | three incidents, Chaos Lab, `heal_receipt` |
| 4 | What did the structured output become? | 7 | THE HAUL on the live console |

## The facts this script stands on

Everything below is on disk and checkable. Nothing is invented for camera.

| Fact | Where it is |
|---|---|
| Three collectors, per-field validators | `collectors.json` |
| KESTREL `c_mt2fnt3p2k4n644701`, RENAMED, 0 → 100, news.ycombinator.com | `data/incidents.json` `inc_001` |
| ATLAS `c_mt2fnqqngikv29od5`, DRIFTED, 90 → 100, books.toscrape.com | `data/incidents.json` `inc_002` |
| BODEGA `c_mt2lkwxa1bb5uz223s`, THROTTLED, 0 → 100, **opened by the cron itself** | `data/incidents.json` `inc_003` |
| Collector ID identical before and after, all three | same `c_*` in every record above |
| A per-field `verification` object on every incident | `scripts/verify.js`, rendered by `web/js/receipt.js`, printed by `heal_receipt` |
| **Two of the three breaks were on sites we do not control** | `web/js/wild.js` computes it; the note renders above the feed |
| Nineteen cron commits authored by `thwip watch` | `git log --author="thwip watch"` |
| Six MCP tools over stdio JSON-RPC, no SDK | `mcp/registry.js` |
| 1,137 tests, zero dependencies, ESLint in CI | `npm test`, `.github/workflows/watch.yml` |

**The strongest asset in this list is `inc_003`, and it is the one that failed.** The cron
opened it alone, diagnosed THROTTLED, healed — and the heal did not work, because nothing
on the target had broken. Our own payload parser was scoring the envelope instead of the
rows. That is written into the incident summary and it stays in the video. A system that
only ever reports its successes is a system nobody can audit.

**The second strongest is the one nobody else can claim.** Most of the field demos
self-healing on a fixture page they broke themselves. Two of our three incidents are on
somebody else's HTML — Hacker News and books.toscrape.com. Section 5 says so out loud and
the console says so on screen.

---

## What must appear on screen, non-negotiable

- [ ] A Collector ID legible **at least twice** — once before a heal, once after — so the
      viewer sees it is the same string
- [ ] The words spoken plainly: *the demo page is ours and we break it on purpose*
- [ ] The words spoken plainly: *two of these three broke on sites we don't control —
      those weren't staged*
- [ ] The words spoken plainly: *healing takes up to fifteen minutes; the Replay is
      recorded, not accelerated*
- [ ] The `inc_003` honesty line spoken plainly: *the heal did not fix it, and the record
      says so*
- [ ] Zero secrets. No `.env`, no `BRIGHTDATA_API_KEY`, no token in any terminal frame.
      **Check the scrollback before you hit record** — a key from an earlier command
      sitting three screens up will end up in the export

## Before you press record

1. Close every other tab. Terminal scrollback cleared (`clear`, then scroll up and check)
2. `data/` backed up — `cp -r data data.bak`
3. Browser at 1440px+, zoom 100%, bookmarks bar hidden
4. Tabs and windows staged in this order:
   - **Tab A** — the live console, https://mikhailkhorokhorin.github.io/scrape-verse-hack/,
     hard-reloaded so the opening sequence plays
   - **Tab B** — `demo-target/broken-renamed.html`. **The variants are separate files, not
     query strings** — `demo-target/?v=renamed` serves the *healthy* page. Use
     `index.html`, `broken-renamed.html`, `broken-drifted.html`
   - **Editor** — `collectors.json` open, scrolled to the top
   - **Terminal** — Claude Code with the THWIP MCP server connected (`/mcp` shows it)
5. In Claude Code, run the two read-tool calls once before recording so the responses are
   warm and you are not waiting on camera
6. The opening sequence only auto-plays once per browser — it sets `thwip.intro.seen` in
   localStorage. Either clear site data before the take or use the **REPLAY INTRO** button
7. Rehearse once with the timer running. If you land over 3:00, use the cut order at the
   bottom

---

## Section 1 — Cold open · 0:00–0:14

**Screen:** Tab A, freshly loaded. Let the opening sequence play — it replays `inc_003`,
a real incident, beating out its actual integrity drop. Do not touch the mouse.

**Say:**

> This is THWIP. It watches web scrapers — not whether they're running, but whether what
> they're returning is still real. Scrapers don't crash. They decay: a selector stops
> matching, the rows keep arriving, and they arrive with holes in them.

**Direction:** Do not click. The opening sequence is the hero shot. What it is replaying
is a real recorded incident, not an animation someone drew — you say that in Section 5, so
do not spend the line here.

**Reality check:** the fleet is currently **all three green at 100%**, so once the intro
settles there is no black on any panel. That is the honest state and it is the right cold
open, but it means you cannot gesture at "the symbiote" over this shot. It arrives in
Section 5's incident cards.

**What the intro settles onto, added 22 Aug:** the page now opens on a thesis panel
rather than the grid — `NOBODY HAS LOOKED AT THIS FLEET IN <gap>`, then the
while-you-were-away counters, then `YOU DO NOT PREVENT THE BREAK. YOU COME BACK FROM IT,
AND YOU RECORD IT.` Every figure in it is computed from the committed JSON; the gap
climbs while the camera is on it. Hold the shot one extra beat so the number is legible —
it is the line the whole product argues, and it accuses the viewer, which is the point.

**One more thing on screen now:** each panel carries a thin arc along its top edge. That
is the sweep hand, and its duration is `lastScan + 30 min − now` — the only timing on the
page that is a real interval rather than a chosen one. If you sit still it visibly moves.
Do not narrate it; let someone notice.

---

## Section 2 — Question 1: how the scraper was designed · 0:14–0:48

**Screen:** Cut to `collectors.json` in the editor. Scroll from the top through all three
collector blocks.

**Say:**

> Three collectors, built in Bright Data's Scraper Studio with `bdata scraper create`.
> KESTREL on the Hacker News front page. ATLAS on books.toscrape.com. And BODEGA on a demo
> shop page that is ours.
>
> The part that matters is underneath each one. Every field carries a validator, not just a
> name — price is a number above zero, KESTREL's points has a minimum of one because a
> front-page story always has at least one, and ATLAS's availability has to match "In
> stock" or "Out of stock" exactly.

**Direction:** Pause with ATLAS's `availability` block on screen — the `pattern` line,
`"^(In stock|Out of stock)$"` — as you say "exactly".

**Say:**

> That contract is what makes decay measurable. We don't ask whether a field came back, we
> ask whether what came back is still allowed to be there. So every run scores one number:
> what fraction of the fields we contracted for actually came back real. That's Integrity.

**Screen:** Cut back to the console grid. Hover one Spider so the character is clearly in
frame.

**Say:**

> And every collector gets a character. That's not decoration — the legs are the fields we
> contracted for, so a dead field draws a collapsed leg. The eyes are the health band. And
> the black covering a Spider is exactly what that scraper has lost. It's not an effect,
> it's the number.

**Direction:** All three are healthy today, so there is no black on the grid. Cut to the
**HOW TO READ A SPIDER** legend directly under the grid as you say "exactly what it has
lost" — it shows the states side by side. Do not promise black on a live panel.

---

## Section 3 — Question 2: driving it from a coding agent · 0:48–1:22

**Screen:** Claude Code in the terminal, MCP server connected.

**Say:**

> The whole fleet is also an MCP server — eight tools over stdio JSON-RPC, hand-written,
> no SDK. So the loop runs in conversation.

**Type:** `Anything wrong with my scrapers?`

**Screen:** Claude calls `fleet_status`. Real shape of the response:

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

The `scanned Nm ago` figure moves with wall-clock time — do not read it aloud, and do not
be surprised when it differs on the day. **This is the first of the two required Collector
ID frames.** Hold it a beat.

**Type:** `What has broken so far?`

**Screen:** Claude calls `incident_log` — three incidents, all resolved.

**Say over it:**

> Six of the eight tools read recorded data — instant, free, no network, no API key. The
> other two spend real Bright Data credits and say so in their own tool descriptions, so
> the agent has to ask before it runs a live scrape or a heal. That's the guardrail: the
> model can't quietly bill you.

**Direction:** Do not call `scan_fleet` or `heal_spider` on camera. Saying why you are not
calling them is stronger than calling them, and it is the truthful reason.

---

## Section 4 — Question 3, part one: the demo target · 1:22–1:40

**Screen:** Tab B — `demo-target/broken-renamed.html`.

**Say — this line is required, do not paraphrase it away:**

> To show a break on camera I'm using our own demo page, and I'm saying that out loud so
> nobody has to wonder whether it was staged. This one is. The three real incidents are
> next, and two of those happened on sites I don't control.

**Screen:** Click through the variant switcher — healthy, renamed, drifted.

**Say:**

> It ships in three variants. Healthy. Renamed, where fields go dead. And drifted, where
> the fields stay full and lie — that's the dangerous one, because a value comes back
> populated and wrong, and it passes every null check ever written. A judge can point a
> collector at any of these and break it themselves.

**Direction:** Land on the drifted variant as you say "populated and wrong". Hold two
seconds.

---

## Section 5 — Question 3, part two: three real incidents, two in the wild · 1:40–2:22

**Screen:** Back to the console, Incident Feed. Three cards. **The note above the feed
counts the breaks on sites we do not control and names them** — get it in frame before you
speak, and let the **IN THE WILD** badges on the KESTREL and ATLAS cards be visible.

**Say — this is the competitive line, do not rush it:**

> Three real breaks, three real repairs. And two of the three happened on sites I don't
> own — Hacker News and books.toscrape.com. Nobody staged those. The page decides when it
> changes, not me.

**Screen:** Open the KESTREL issue — `inc_001`. Scroll to the verification table.

**Say:**

> KESTREL, strain RENAMED. Thirty rows came back, so the row selector was fine — but the
> generated scraper had invented its own keys, `story_points` and `comment_count` instead
> of what we contracted for, and every value was zero. Thirty rows of confident nothing.
> Integrity zero. `bdata scraper heal --auto-approve --auto-save` fixed it unattended.
>
> And this is the receipt. Every field that broke, re-checked against the run after the
> heal — what we received before, what we received after. Title was null, now it's a real
> headline. Points was null, now it's sixty-two. Zero to a hundred.

**Direction:** Hold the was/now table for a full two seconds. It is the strongest single
frame in the video after the collector ID.

**Say:**

> ATLAS, strain DRIFTED, was subtler. The availability selector matched every availability
> element on the page and joined them together, so every row read "In stock, nineteen
> available, In stock, In stock" and on down the page — populated on every scan, wrong on
> every scan. The pattern validator is the only reason we caught it. Ninety to a hundred.

**Screen:** Cut to the BODEGA card, then to the `inc_003` summary text.

**Say — this is the section that makes the video worth watching:**

> And the third one nobody opened by hand. The cron caught BODEGA at zero percent twice and
> ran a heal on its own, overnight, with nobody watching — you can see its commits in the
> git log, authored by the workflow rather than by me.
>
> The heal didn't fix it. And it didn't fix it because nothing on the target had broken.
> The scraper was returning one wrapped row holding a products array, and our own payload
> parser was scoring the envelope instead of the rows. The bug was ours.
>
> That diagnosis is still in the incident record, written exactly as the system believed it
> at the time — a false alarm, logged as a false alarm. We fixed the parser, the next scan
> read twelve rows at a hundred percent, and we left the wrong diagnosis on disk.
>
> A monitor that edits its own history to look smarter is the exact thing this project
> exists to catch.

**Direction:** Have the `summary` field of `inc_003` legible on screen for the last two
sentences. That text is the evidence.

---

## Section 6 — The receipt · 2:22–2:42

**Screen:** Back in Claude Code.

**Type:** `Prove the BODEGA repair — show me the receipt.`

**Screen:** Claude calls `heal_receipt` with `inc_003`. Real shape of the output:

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

verification: 4/4 fields re-checked against the run after the heal (every field back)
  ok   title: dead -> live | was null | now Ceramic pour-over dripper
  ...
```

The output continues past that into the heal prompt. Scroll so the `collector_id` line is
the frame you hold.

**Say:**

> Every phase, timestamped, with the gaps between them — and the line in the middle is the
> hackathon requirement answered in one tool call. The collector ID never changed. Same
> string going into the repair and coming out of it, and it's the same string you saw in
> `fleet_status` a minute ago. All three collectors were repaired in place, not recreated,
> so nothing downstream had to be re-pointed.
>
> One honest note about those three verification blocks: they were computed from each
> incident's own already-recorded runs. No re-scrape, no credit spent, nothing invented —
> and the records say `backfilled` so you can tell.
>
> And healing takes up to fifteen minutes, which is why the Replay on the console is
> recorded rather than a live wait. Nothing there is accelerated — those are the real stage
> timestamps played back at a watchable pace, and the panel says so on screen.

**Direction:** This is the required second Collector ID frame. Hold it with the cursor
beside the `collector_id` line. If you trim anything for time, trim elsewhere.

---

## Section 6c — What stops a heal from lying · insert after Section 6 if the runtime allows

This is the answer to the obvious objection, and the objection a judge who has seen other
entries will already have: *the healer reports its own success, so why believe it?* Worth
20 seconds if you have them; cut it before the scratch if you do not.

**Screen:** Terminal. Run it live, do not pre-record the output:

```
node tools/evidence-report.js inc_003
```

**Say over the output scrolling:**

> Nothing here trusts the repair's own report. After every re-weave the system runs a
> fresh scrape and scores what actually came back, field by field, against the validators.
> The incident closes only if that new run passes. If the heal returns nothing, the
> incident stays open. If it returns values that are populated and wrong — a rating of
> nine thousand — the validators catch it, it scores as infected at half credit, and the
> incident stays open.

**Direction:** Let the FIELDS table and the DIGESTS block be legible for two seconds each.
The `collector_id ... -> ... (identical)` line is the third Collector ID frame — if
Section 3's or Section 6's frame came out unreadable, this one is the backup.

**Say to close:**

> Those digests are recomputed from the files on disk every time the command runs. They
> are a check, not a claim.

---

## Section 6b — The scratch · insert before Section 7 if the runtime allows

**Screen:** Tab A, scrolled to any panel showing black. Press and drag across it.

**Say:**

> The black covers exactly what the scraper lost. You can drag it off.

**Direction:** One slow horizontal drag, then lift. The substance tears open under the
pointer and the values that actually came back are underneath — `price: null` in red,
a literal `"undefined"` in violet — and it closes over again after four seconds. Say
nothing else over it. This is the single image the project has, and the gesture explains
itself faster than any sentence.

**If the live fleet is at 100%** there is no black to scratch. Use `?mock=1` for this
shot and say "this is the mock fixture" once, or cut the section — an honest empty page
beats a staged one.

---

## Section 7 — Question 4: what the output became · 2:42–2:55

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
> opens. THWIP is the thing that's finally looking. It fixes what it finds, it proves the
> fix field by field, and it writes down what it got wrong.

**Direction:** Hold the grid for two seconds after the last word, then stop. No outro card,
no music sting.

---

## Cut order if you run long

Cut in this order and stop as soon as you are under 3:00:

1. Section 4's variant click-through — narrate over the drifted variant alone (−8s)
2. Section 5's ATLAS paragraph — but **keep the "two of three, in the wild" line**, it is
   the competitive point (−12s)
3. Section 3's second prompt (`What has broken so far?`) — `fleet_status` alone shows the
   agent control (−10s)
4. Section 2's character explanation — the legend is visible anyway (−10s)
5. Section 6's `backfilled` note — it is in `SUBMISSION.md` in writing (−9s)
6. Section 6c entirely — the evidence report is one command in the README (−20s)

**Never cut:** the `heal_receipt` collector-ID frame, the `inc_003` failed-heal paragraph,
the "our own page, broken on purpose" line, the "two of the three were not staged" line, or
the "up to fifteen minutes, recorded not accelerated" line.

## After the export

- [ ] Watch it start to finish, once, at full size
- [ ] Scrub for secrets — pause on every frame containing a terminal or an editor
- [ ] Confirm the collector ID is legible at 1080p, not just at source resolution, in both
      the `fleet_status` frame and the `heal_receipt` frame
- [ ] Confirm the `inc_003` summary text is readable, not just visible
- [ ] Confirm the verification was/now table is readable
- [ ] Upload, get the link, put it in `README.md` and in `docs/SUBMISSION.md`

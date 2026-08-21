# UI ideas — wave three

Wave two was culled the day it was written. One idea out of twenty-five survived, and the
reason it survived is the brief for this file.

## The test

**UI-29, the ad page, worked because it is a page of the comic that happens to be true.**

A vintage full-width ad, set in period voice, selling our own MCP server —
`SIX TOOLS. NO SDK. CONNECT IN ONE LINE` — with the real command printed in the coupon
box. Nobody expects to find an ad on a monitoring console. It is funny before it is
useful. And the thing it jokes about is real and judged.

Everything else in wave two was chrome: crop marks, a barcode, a countdown, a stamp, page
numbers. Chrome decorates the console. It does not add a page to the book.

So the test every idea below has to pass, and the reason the earlier list failed it:

| | Chrome | A page of the book |
|---|---|---|
| What it is | A widget wearing a costume | An artifact from inside the fiction |
| First reaction | "Nice touch" | "Wait, what *is* this" |
| What it adds | Polish | A thing that was not there before |
| If you removed it | The page looks slightly plainer | The world got smaller |

The wave-one rule still binds underneath — a drawing not driven by a field in
`history.json` is decoration. Wave three's ideas mostly satisfy it the hard way: the joke
*is* the data. The No-Prize is an incident summary. The obituary is a stage timestamp.
The grade is fleet Integrity.

Ids continue from UI-48. **UI-29 is alive and belongs to this wave.**

---

## The book has more pages than a cover

### UI-49 · The No-Prize — **the strongest thing in this file**
Marvel's No-Prize was an empty envelope, mailed to a reader who spotted a continuity
error in an issue *and then explained why it was not one*. You did not win it for catching
the mistake. You won it for the explanation.

`inc_003` is a No-Prize, and it is already written in our own data, unflinchingly:

> The cron detected BODEGA at 0% twice and ran a heal on its own — and the heal did not
> fix it, because nothing on the target had broken. The scraper was returning one wrapped
> row holding a products array, and the watcher's own payload parser scored the envelope
> instead of the rows.

Print it as the award page: the empty envelope, `AWARDED TO: THE WATCH · FOR CATCHING ITS
OWN MISTAKE`, and the explanation set as the winning letter, in the reader's-letter
measure.

Every other submission in this hackathon will hide its false positive. We frame ours as an
award, in the genre's own vocabulary, using text that is already committed. It is the most
disarming page we could possibly print, and it costs typography.

*Data: `inc_003.summary`, `opened_at`, `closed_at`. Cost: small.*

### UI-50 · A break is a canon event
One panel, full width, above the fleet. Not a legend, not a tooltip — a thesis panel, in
the voice the genre uses for its own rules:

```
A SCRAPER DOES NOT FAIL. IT DECAYS.

EVERY SPIDER ON THIS PAGE HAS BEEN TAKEN — ALL THREE, ON 21 AUG,
INSIDE FOUR HOURS.

YOU DO NOT PREVENT THE BREAK. YOU COME BACK FROM IT, AND YOU RECORD IT.
```

The genre's most famous idea is the event that must happen and cannot be prevented without
breaking everything. That is *exactly* what this product believes about scrapers, no
trademark attached, and the numbers in it are ours: three incidents, three Spiders, one
day, four hours end to end.

It reframes every incident further down the page from failure to canon. Right now the feed
reads as a list of times we broke. After this panel it reads as a list of times we came
back.

*Data: incident count, spiders touched, the span from first `opened_at` to last
`closed_at`. Cost: trivial — it is one panel of type, and it is the highest ratio on the
list.*

### UI-51 · The bullpen bulletin — the cron's own page
Comics ran an editor's page in the back: who is on staff this month, what shipped, an
in-joke, direct address to the reader. Ours is written by the machine that runs the fleet,
in the machine's voice.

```
THE BULLPEN                                    AUG 2026

ON DUTY      1 cron · 3 spiders · 0 humans since 19:34Z
THIS ISSUE   54 scans · 1,132 rows · 3 breaks · 3 heals
NO-PRIZE     awarded, see the back page

FROM THE DESK
"Nobody asked me to run at 03:00. I ran at 03:00."
```

The `0 humans since` line is the good one and it is computable: the cron commits as
`thwip watch <ci@thwip.local>` and people commit as themselves, so CI can write the gap
since the last human commit into `meta.json` the same way it already writes the test
count. A number that climbs while nobody touches the repository is the most literal
possible statement of what this project is.

*Data: history and incident counts, plus a `human_gap` written by the workflow. Cost:
small, plus a few lines in `watch.yml`.*

### UI-52 · Letters from the fleet *(replaces the rejected UI-30)*
The rejected version reformatted `heal_prompt` as evidence, which is a table with better
typography. Invert it: the letters are **from the Spiders**, in character, complaining —
and the healer's reply is the real prompt, printed as the editor's answer.

```
DEAR WATCH,
Everything I touched on the 21st came back empty. Twelve rows, every field
null, and the run reported success. I want it on the record that I did not
change — the shop did.
                                    — BODEGA, 07:39Z, c_mt2lkwxa1bb5uz223s

ED: On mikhailkhorokhorin.github.io: 'title' and 'price' and 'rating' and
'image' return null after a layout change. Likely THROTTLED: every field
came back empty, so the request itself is likely being blocked or served a
different page. Fix the extraction for those fields.
```

The prompt stops being an artifact on display and becomes the punchline of a
correspondence. The Spider's half is written from that incident's real numbers and signed
with its real collector id; the editor's half is copied verbatim and is not paraphrased,
ever — it is the exact text that went to Bright Data.

*Data: `heal_prompt`, `anomalies`, `rows_per_run`, `opened_at`, `collector_id`. Cost:
small.*

### UI-53 · In memoriam
Every field that died gets an obituary, in the small-type memorial column comics and
newspapers both use:

```
AVAILABILITY
05:13Z – 06:59Z · SURVIVED BY title, price, rating, image
"In stock or Out of stock"          RECOVERED
```

That one is `inc_002`, ATLAS, and it is the best obituary we have precisely because it is
the smallest break on record: one field out of five, dead for one hour forty-six, back
again. A whole memorial column for a single missing string is the joke, and the joke is
that this is what silent decay actually looks like — not a crash, one column quietly going
empty.

The expectation line is the validator's own words, already in `config.js`. `RECOVERED`
where the field came back, and nothing where it did not — which is the honest and the
darker of the two.

Dark, funny, and every character of it is a real timestamp.

*Data: `anomalies`, `recovered_fields`, stage timestamps, `EXPECTED`. Cost: small.*

### UI-54 · Continuity footnotes
The asterisk box, in the editor's voice, wherever the page refers to something that
happened earlier:

> `*BODEGA was taken on 21 AUG — see ISSUE #3. —ed.`

On a healed-residue badge, on a sparkline scar, on a streak that starts at a break. It is
two lines of CSS and a lookup, and it makes the console read as *edited* rather than as
rendered — which is a quality nothing else on the list buys.

*Data: incidents by spider and timestamp. Cost: trivial.*

### UI-55 · The order form *(pairs with UI-29)*
The back-page mail-in coupon, dotted cut line, `SEND NO MONEY NOW`: the real clone-and-run
instructions typeset as an order form, with checkboxes.

```
☐ YES! Send me THE WATCH.        git clone …  ·  npm test  ·  821 tests, 0 deps
☐ Also send the MCP server.      claude mcp add thwip -- node mcp/server.js
NAME ______________  UNIVERSE ______________  I AM OVER 13 ☐
```

An ad without an order form is half the gag, and the form is where the setup instructions
go so that a judge reads them by accident.

*Data: `meta.tests`, the tool list. Cost: trivial once UI-29 exists.*

---

## The object is a collectible

### UI-56 · The slab
Graded comics are sealed in a plastic case with a label across the top: title, date,
grade, cert number. **Fleet Integrity is a grade.** Frame the whole console in one:

```
THWIP #4 · AUG 2026 · UNIVERSAL          10.0
3 SPIDERS · 54 SCANS                     GEM MINT
CERT ac36ffd                             ●●●●●●●●●●
```

The grade falls with the fleet — `10.0 GEM MINT` at 100, down through `FINE`, `GOOD`,
`POOR` — and the cert number is the commit sha, so it is checkable. The label is at the
very top of the page, where a grader's label goes, and it doubles as the fleet readout
the masthead already needs.

Nobody in this hackathon is going to slab their dashboard.

*Data: fleet integrity, `meta.sha`, run and incident counts. Cost: small.*

### UI-57 · The paper ages with the data
`UNWATCHED` today is `opacity: 0.32` and grayscale, which reads as *disabled* — a UI
state, borrowed from every settings screen ever built. But the state does not mean
disabled. It means **time has passed and nobody looked**.

So age the paper instead. A fresh scan prints on white stock; as the last scan gets older
the panel yellows, picks up foxing at the corners, and the ink dulls toward brown. At the
three-hour threshold it is a brittle back issue nobody pulled off the shelf.

Same data, same threshold, entirely different sentence: the panel stops looking switched
off and starts looking *old*.

*Data: `now - ts`, continuous rather than banded. Cost: small. Replaces the wave-one
unwatched treatment rather than adding to it — check contrast at the yellow end.*

### UI-58 · Variant covers
Comics ship one issue behind several covers. Each incident already renders as a cover
(UI-02); give it two more renderings of the same real data — a sketch variant in ink line
only, and a black-and-white symbiote variant where the substance is the whole cover and
the codename is knocked out of it.

One control, three drawings, no new data. Collector behaviour applied to an incident log,
and three chances for the one screenshot a judge keeps.

*Data: the incident already on the cover. Cost: small.*

---

## The press

### UI-59 · The page comes off the press
The load sequence. Cyan plate prints first and lands a few pixels off. Then magenta, also
off, the two mis-aligned and readable as a mistake. Then black, and on the last pass all
three snap into register and the page is printed.

Two seconds, once per session, and it is the loading state — which the spec currently
fills with nothing, having banned shimmer skeletons outright.

The design's second principle is *misregistration is intentional*. Nothing on the page
demonstrates that in motion today; the chromatic offset is a static style you have to be
told about. This shows the reader why the whole design looks the way it looks, before
they have read a single number.

*Paper — it claims nothing. Cost: medium, and worth it. Skips entirely under
`prefers-reduced-motion` to the printed state.*

### UI-60 · Hold a key and the plates come apart
Hold `P`: the page separates into its cyan, magenta and black plates, which drift apart by
twenty pixels or so, hang there while the key is down, and reassemble when it is released.

A party trick, and also a proof: it demonstrates that the entire design is *built* on a
printing metaphor rather than styled to resemble one. Nothing else on the page can make
that argument.

*Paper. Cost: small if UI-59 lands first — same three layers.*

---

## You can touch it

### UI-61 · Scratch the symbiote off — **the one a judge shows to another judge**
The black covers exactly what the Spider lost. Today you read that in the legend.

Let the cursor scrape it away. Canvas over the panel, `destination-out` under the pointer,
and what is revealed underneath is the actual lost field — `price: null`, in mono, exactly
as it came back. Lift the pointer and the substance creeps back over three or four seconds,
because it is not gone, it is just not being looked at.

Four seconds of dragging teaches the metaphor better than the legend paragraph does, and
it is the only idea on either list that a judge will *play with* rather than read.

*Data: the dead and infected fields under the mask, from `sample`. Cost: medium. Risk: the
turbulence filter is already the most expensive thing on the page — this must be checked at
375px before it is called done, and it must degrade to nothing rather than to something
janky on touch.*

### UI-62 · It does not like being watched
Rest the pointer on a taken panel and the substance flinches — recoils a few percent, then
settles once you leave. No label, no copy, no tooltip.

The product's whole thesis is that nobody is looking. The page noticing when someone
finally is, and not saying a word about it, is worth more than any sentence in the legend.

*Data: the existing `--spread`. Cost: trivial.*

### UI-63 · Konami
Type it and the symbiote takes the entire page for three seconds — teeth, eyes, the fleet
layer at full spread — then purges with the full `PURGE!` and everything comes back.

One easter egg. No data claim. Ninety minutes, and half of that is the key handler.

*Paper. Cost: trivial.*

---

## More world

### UI-64 · The multiverse page
Three universes: `books.toscrape.com`, `news.ycombinator.com`,
`mikhailkhorokhorin.github.io`. Draw them as three worlds hanging in the dark, each with
its Spider and its health, and **explicitly not connected** — no threads, no lines, no
web between them, because they are unrelated sites and a connection would be a lie we
already rejected once.

The distance *is* the content. Three separate worlds, one watch, nobody in any of them
aware of the others.

*Data: `universe` per collector, integrity per spider. Cost: small.*

### UI-65 · While you were asleep
The product is about 3am. Say it with the fleet's own overnight numbers:

```
BETWEEN 00:00 AND 06:00 UTC
12 scans · 340 rows · 2 breaks · 2 heals · 0 humans awake
```

Filter `history.json` by UTC hour and count. It is the one page where the loneliness in
the tagline gets a figure attached to it, and the figure is real.

*Data: `history.ts` filtered by hour, incidents in the same window. Cost: small.*

### UI-66 · Trading cards
The cast as foil trading cards — front is the character, back is the stat block, flips on
click. Universe, fields watched, collector id, breaks, heals, best clean streak.

The roster idea from wave two was a table with a drawing next to it. This is an object a
kid would have traded, holding exactly the same numbers.

*Data: everything the adapter already computes per spider. Cost: small.*

### UI-67 · The Daily Bugle
One incident retold as a newspaper front page: masthead, a headline that is too loud for
what happened, a byline, body copy that is the incident summary we already write, and a
photo credit reading `PHOTO BY THE CRON · 07:48Z`.

A second in-world publication, reporting on the first. The hackathon literally names a
Daily Bugle prize.

*Data: `incident.summary`, `spider`, `opened_at`. Cost: medium. **Risk, stated plainly:**
this is a second art direction inside one page, and a newspaper set beside a comic can
read as a different site rather than as the same universe. Build it only after UI-49 and
UI-51 have established the in-world voice — and if it does not sit inside the comic's own
grid, cut it.*

### UI-68 · The origin
Issue #1 is always the origin. Ours is four panels and every timestamp in it is in git or
in `history.json`: the first commit, the first collector created, the first scan, the
first `null`.

The last panel is the one that matters — the first time a field came back empty is the
moment the product had a reason to exist.

*Data: git log, `COLLECTORS.md`, the first and first-broken records in `history.json`.
Cost: small.*

---

## Ranked

By how much the world grows per hour spent, which is the only ranking that would have
saved wave two:

1. **UI-49 · The No-Prize** — the most disarming page available, and the text is written
2. **UI-50 · A break is a canon event** — one panel of type, and it reframes the whole feed
3. **UI-61 · Scratch the symbiote off** — the only thing here a judge plays with
4. **UI-51 · The bullpen** — the cron gets a voice, and `0 humans since` is a real number
5. **UI-59 · The press run** — the load sequence explains the entire art direction
6. **UI-29 · The ad page** *(held over)* — plus **UI-55**, its order form
7. **UI-52 · Letters from the fleet** · **UI-53 · In memoriam** · **UI-54 · Footnotes**
8. **UI-56 · The slab** · **UI-57 · The paper ages**
9. **UI-62** · **UI-63** — trivial, do them while waiting on something slower
10. Everything else, if the day somehow allows it

## The same warning as wave two

Two items on the queue need a human, one of them is the autonomous break, and the deadline
is 23 Aug. Nothing in this file is worth an unsubmitted repository — and a half-drawn
No-Prize envelope reads as a bug, where a missing one reads as nothing at all.

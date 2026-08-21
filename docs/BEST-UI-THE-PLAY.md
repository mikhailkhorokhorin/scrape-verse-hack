# Best UI — the play

Four waves produced roughly seventy ideas. That is not a plan, it is a menu, and a menu
two days from a deadline is how six things get half-built.

This file is the product decision. It names one spine, one image, one interaction, and
six moves. Everything else in `UI-IDEAS*.md` is either folded into a move here or dead.

---

## 1 · What actually wins this track

Be honest about the mechanics, because they change what is worth building.

- **A judge gives this sixty to a hundred and twenty seconds.** Possibly less. Possibly
  they only ever see a screenshot in a Discord thread or a thumbnail on a submission form.
- **Best UI is won by one image and one interaction**, not by twenty-five good ideas. The
  winner is the submission people describe to each other afterward, and people describe
  exactly one thing.
- **Everything else is either supporting that one thing or it is noise**, and noise costs
  the same hours as signal.

So the question is not "what else could we add". It is **"what is the one thing, and does
every other thing feed it".**

---

## 2 · The spine

The product is about decay that happens while nobody is looking. Every idea that landed
in four waves turned out to be about the same thing, and none of us named it:

> **Nobody has looked at this fleet in four hours. You are the first. Here is what
> happened while you were away.**

That is not a tagline. It is a real number — the console knows when the last scan was, the
repository knows when a human last touched it, and the difference is computable and
climbing.

It reframes everything already built. The fleet was still because nobody was here. The
black is over those fields because nobody dug it off. The cron wrote three incidents at
five in the morning into a file nobody opened. The judge arriving is, literally and in the
fiction, the watcher arriving.

**Every move below serves that sentence. If an idea does not, it is cut.**

---

## 3 · The one image and the one interaction

Name them now, because they decide the README header, the video thumbnail and the
submission screenshot, and those are seen more than the site is.

### The interaction — **you scratch the black off**

The console's central claim is that the substance covers *exactly* what the Spider lost.
Today you read that in the legend. Instead: drag the cursor across the black and it
scrapes away under your hand, and what is underneath is the value that actually came back.

And the data has handed us the single best artifact in this repository to find under
there. ATLAS, 21 Aug, `availability` marked infected:

```
availability: "In stock (19 available) In stock In stock In stock In stock In stock In stock"
```

Not null. Not an error. Seven nodes concatenated because a selector matched too much — a
value that passes every null check ever written and flows straight down the pipeline. A
judge who scratches black off a panel and finds *that* string understands the entire
product in four seconds, with no legend, no tooltip and no explanation.

Dead fields reveal the honest version: `price: null`, in mono, and nothing else. You dig
and there is nothing there.

Lift the pointer and the black grows back over four seconds, because one person cannot
hold a whole fleet uncovered at once. That is the close, and it is the thesis.

### The image — **mid-scratch**

The hero shot is that panel with the substance torn open under a cursor, the concatenated
string legible in the gap, the Spider standing on half its legs. It goes in the README
header, on the video thumbnail, and in the submission.

It is a picture of a monitoring tool that could not be mistaken for any other monitoring
tool.

---

## 4 · The six moves

Each move absorbs ideas from earlier waves. The ids are kept so nothing gets re-proposed.

### MOVE 1 · The open
*absorbs UI-50 (canon event), UI-51 (bullpen), UI-65 (while you were asleep)*

The page does not open on a dashboard. It opens the way an issue opens — on a line, in
Anton, over the fleet, with real numbers in it:

```
NOBODY HAS LOOKED AT THIS FLEET IN 4h 12m.

WHILE YOU WERE AWAY — 54 SCANS · 1,132 ROWS · 3 BREAKS · 3 HEALS · 0 HUMANS AWAKE

EVERY SPIDER ON THIS PAGE HAS BEEN TAKEN. ALL THREE, ON 21 AUG, INSIDE FOUR HOURS.
YOU DO NOT PREVENT THE BREAK. YOU COME BACK FROM IT, AND YOU RECORD IT.
```

The first sentence a judge reads is a true number that implicates them, and the third is
the product thesis in the genre's own voice — the event that must happen and cannot be
prevented, which is exactly what this project believes about scrapers.

The `0 humans since` figure is real and cheap: the cron commits as
`thwip watch <ci@thwip.local>` and people commit as themselves, so the workflow can write
the gap into `meta.json` beside the test count it already writes.

*Cost: small, plus a few lines in `watch.yml`. **This is the highest ratio on the list** —
it is typography over numbers we already hold, and it reframes the entire page.*

### MOVE 2 · The scratch — **the headline**
*absorbs UI-61, UI-62 (the flinch), and gives UI-43's origin panel somewhere to live*

As described in §3. The mechanism: a canvas over the panel, `destination-out` under the
pointer, the received values rendered underneath in mono. `received.js` already resolves
expected-versus-received per field for the chips, so the data path exists — this is the
physical version of a feature that already ships.

Three rules that keep it from being a toy:

- **It must be discoverable.** A one-time hint on the taken half of the diptych —
  `SOMETHING IS UNDER THERE` — and nothing else. If a judge does not find it, it did not
  happen.
- **It must work with a finger.** Touch drag, not hover. A judge on a phone is the likely
  case, not the edge case.
- **It must not fight the turbulence filter.** That filter is already the most expensive
  thing on the page. Check at 375px before calling this done, and degrade to a tap-to-
  reveal rather than to something that stutters.

*Cost: medium. It is the one thing here worth an afternoon.*

### MOVE 3 · The No-Prize
*UI-49, unchanged except for one addition*

Marvel mailed an empty envelope to readers who caught a continuity error **and explained
it away**. `inc_003` is exactly that and it is already written in our own data: the cron
detected BODEGA at 0% twice, healed it on its own, and the heal fixed nothing — because
nothing on the target had broken. Our own payload parser was scoring the envelope instead
of the rows.

Print it as the award: the envelope, `AWARDED TO: THE WATCH · FOR CATCHING ITS OWN
MISTAKE`, and — the addition — **the envelope is closed until you open it.** Click and it
unfolds to the post-mortem we already wrote. An empty envelope that is actually empty is
the joke; the honest write-up inside is the payoff.

Every other submission will hide its false positive. We frame ours as an award, in the
genre's own vocabulary, using text that is already committed.

*Cost: small. Highest credibility-per-hour on the board, and it scores in Best Code too.*

### MOVE 4 · The press
*absorbs UI-59 (load) and UI-72 (scroll)*

The page prints as you read it. Cyan plate, magenta plate, black plate, misregistered
until the third pass snaps them into register — driven by scroll position via
`animation-timeline: view()`, so it runs on every section rather than once at load.

The design's second principle is *misregistration is intentional*. Nothing currently
demonstrates it in motion; it is a static style you have to be told about. This makes the
art direction explain itself, and it turns 7,267 pixels of scroll from long into authored.

*Cost: medium. Support is Chromium 115+ and Safari 26+; the fallback is free, because an
unsupported browser shows the fully printed page, which is the reduced-motion end state
the spec already requires.*

### MOVE 5 · Stillness
*absorbs UI-80, UI-69 (the sweep hand), and requires UI-82 (the defect) first*

**Fix first:** `render.js` rebuilds `grid.innerHTML` wholesale, so `panel-in` replays on
all three panels whenever any one gets a record. A KESTREL scan re-animates BODEGA and
ATLAS, which reads as a page refresh — precisely what a live console must not read as.

**Then the rule:** a healthy fleet holds micro-motion only, breath and blink. Narrative
motion — steps, twitches, glitch, creep — is reserved for damage. A sick panel becomes the
only moving thing on a still page, which reads harder than any animation we could add.

**And one thing always moves:** a thin arc along the panel border taking one real lap
between sweeps, its duration computed from `lastScan + 30min`, not chosen. It is the only
motion on the page whose length is a true interval, and it is what a judge sitting still
for sixty seconds sees change.

*Cost: small, and mostly deletion. It is the opposite of what every other submission is
doing tonight.*

### MOVE 6 · The ad and the coupon
*UI-29 + UI-55, held over unchanged*

The period ad selling our own MCP server, and the mail-in order form behind it carrying
the real clone-and-run instructions. It is the palate cleanser between sections, it is the
one thing that survived the wave-two cull on its own merit, and it puts the setup
instructions where a judge reads them by accident.

*Cost: small.*

---

## 5 · The kill list

Dead, with reasons, so they stop coming back.

| Idea | Why it dies |
|---|---|
| UI-52 letters · UI-53 in memoriam · UI-54 footnotes | All three are the same trick — real data in a period voice — and MOVE 1 and MOVE 3 already do it better. A third and fourth instance turns a device into a tic |
| UI-56 the slab · UI-58 variant covers | Collector jokes for an audience of collectors. The judge is not one, and neither reads in under two seconds |
| UI-64 multiverse · UI-66 trading cards · UI-68 origin | Extra pages on a page that is already 7,267px. More scroll is not more product |
| UI-67 Daily Bugle | A second art direction inside one page. It reads as a different site, and it competes with MOVE 1 for the same slot |
| UI-63 Konami | An easter egg nobody finds in ninety seconds |
| UI-57 paper ages | Good idea, wrong deadline — it changes a shipped state (`UNWATCHED`) and re-opens a contrast check. Revisit after |
| UI-70 · UI-73 · UI-75 · UI-76 · UI-77 · UI-81 | Motion refinements on top of motion that already works. MOVE 5 is worth more than all six, and it is subtraction |
| UI-78 odometer · UI-79 stamp | Nice, and they land only if MOVE 5's defect fix ships first. Do them in the same commit as MOVE 5 or not at all |
| All of wave two except UI-29 | Already culled — chrome |

**One item is not an idea and is not on any list:** `index.html` carries no `og:` or
`twitter:` tags, so the URL renders blank wherever it is pasted — including the Discord
thread a judge receives it in. That is a defect in `<head>` and it gets fixed as a chore.

---

## 6 · If there is only time for two

**MOVE 2 and MOVE 1.** In that order if the afternoon is free, in the reverse order if it
is not.

The scratch is the thing people will describe to each other. The open is the sentence that
tells them what they are looking at. Together they are a different product from what is
on the page tonight; the other four moves are polish on top of that difference.

If there is time for a third, it is **MOVE 3** — an hour of typography over text that is
already committed, and it is the only move that scores in two tracks.

---

## 7 · What this costs, against a deadline that has not moved

It is the evening of 21 Aug. The queue still holds **T-12** (the autonomous break, which is
our single strongest claim), **T-13** (the demo video, unrecorded), and the submission
itself. Two of those need a human.

Realistically that leaves about one working day for UI. One day buys MOVE 1, MOVE 2 and
MOVE 3 comfortably, or all six with nothing left over for the video.

**The ordering rule for the last two days:** ship T-12, then MOVE 1 and MOVE 2, then record
the video *with the scratch in it*, then submit, then keep building if the clock allows.
A half-scratched panel reads as a bug where a missing one reads as nothing at all — and an
unsubmitted repository wins no track at all.

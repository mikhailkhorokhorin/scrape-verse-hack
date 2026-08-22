# T-15 — LinkedIn post

Separate prize (Daily Bugle track). No competition for developer hours.

**Attach: the mid-scratch frame.** A taken panel with the black torn open under the
cursor and the received values legible in the gap — that is the one image this project
has, and it is what the post's second-to-last paragraph describes. A short screen
recording of the same gesture is better if the video exists; a plain full-grid shot
taken with `?capture=1` is the fallback.

**Before posting:** replace `<VIDEO>` with the real link. The repo and live-console
links are already filled in.

---

## Post — primary version

> Scrapers don't crash. They rot.
>
> That distinction cost me more debugging hours than I want to add up. A crash is easy:
> something errors, something alerts, you go fix it. Decay is the other thing. A target
> site ships a layout change on a Tuesday, a selector stops matching, and the scraper
> keeps running. It keeps returning rows. The rows just have holes in them.
>
> Nothing errored. The pipeline is green. The dashboard downstream is quietly wrong, and
> you find out days later from a customer.
>
> There's a worse version. A field comes back **populated and wrong** — a rating outside
> its range, a price that parsed as a string, a title reading "undefined". That value
> passes every null check ever written and flows straight into production. The scraper
> looks perfectly healthy. Its behaviour has just been replaced.
>
> So for Into the Scrape-Verse I built THWIP: a watch console that scores every scraper
> 0–100 on how much of what it promised actually came back real, and repairs the ones
> that slip.
>
> Then it happened to us for real. Three times, which is the only part of this worth
> reading.
>
> **One.** KESTREL, scraping the Hacker News front page, came back with 30 rows and an
> Integrity of 0. Rows were being found, so nothing looked broken from the outside. But
> the generated scraper had drifted onto its own invented keys — `story_points` and
> `comment_count` instead of the fields we'd contracted for — and every single value was
> 0. Thirty rows of confident nothing. One `bdata scraper heal --auto-approve
> --auto-save`, unattended, and the next scan came back with real titles, points and
> authors. 0 → 100.
>
> **Two.** ATLAS, on a book catalog, was subtler and worse. Its `availability` selector
> matched every availability element on the page and joined them, so every row read
> "In stock (19 available) In stock In stock…". Populated on every scan. Wrong on every
> scan. That is the failure mode that passes every null check you've ever written. 90 →
> 100 after the re-weave scoped the selector to the row.
>
> **Three, and this is the one I'd actually show you.** The cron caught our third
> collector at 0% overnight and ran a heal on its own — no human awake, its own commits
> in the git log. The heal didn't work. And it didn't work because nothing on the target
> had broken: the scraper was returning one wrapped row holding a products array, and our
> own payload parser was scoring the envelope instead of the rows. The bug was ours.
>
> The wrong diagnosis is still sitting in the incident record, written exactly as the
> system believed it at the time. We fixed the parser, the next scan read 12 rows at
> 100%, and we left the false alarm on disk rather than editing it out.
>
> A monitoring tool that quietly rewrites its own history to look smarter is precisely
> the thing this project exists to catch. It doesn't get an exemption for being ours.
>
> And the detail I care about most, across all three: the Collector ID was identical
> before and after every repair. `c_mt2fnt3p2k4n644701` going in, the same string coming
> out. The collectors weren't recreated. They were repaired. The one that broke is the
> one that came back.
>
> That's the part that makes it an ops tool rather than a demo. A system that fixes
> breakage by throwing away the broken thing and building a new one hasn't fixed
> anything — it's just moved the problem somewhere your IDs don't survive.
>
> It also runs inside a coding agent. There's an MCP server — eight tools over stdio
> JSON-RPC, no SDK — so the whole loop happens in conversation: *is anything broken? what
> broke? fix it. prove it.* The last one returns a timestamped receipt with the unchanged
> collector ID on it, and one more prints the whole evidence trail with SHA-256 digests
> recomputed from disk, so none of this has to be taken on my word.
>
> The console itself is drawn as a comic page, because the hackathon theme is
> Into the Scrape-Verse and the metaphor turned out to be load-bearing rather than
> decorative. Integrity loss renders as a black substance creeping up each scraper's
> panel, covering exactly the percentage it has lost. A symbiote is a thing that gets
> inside a host without killing it, so the host keeps walking around looking like
> itself while its behaviour is quietly replaced. That is precisely what a broken
> scraper is, and it turned out to be the clearest way to draw it: you can read fleet
> health across the whole page without reading a single number.
>
> And you can drag the black off. Hold the pointer down on a panel that has been taken
> and the substance tears away under it, showing the values that actually came back:
> `price: null` in red, `rating: "undefined"` in violet. Lift off and it closes over
> again. Nothing there is written for the reveal — it is the same data the field chips
> read, which is the only reason the gesture is worth anything.
>
> Live console: https://mikhailkhorokhorin.github.io/scrape-verse-hack/
> Code: https://github.com/mikhailkhorokhorin/scrape-verse-hack
> Demo: <VIDEO>
>
> Built for Into the Scrape-Verse by WeMakeDevs and Bright Data.
>
> #IntoTheScrapeVerse #WeMakeDevs #BrightData #WebScraping #DataEngineering

---

## Short version — if the primary reads long

Use this if you would rather not have a "see more" fold before the KESTREL story.

> Scrapers don't crash. They rot.
>
> A site changes, a selector stops matching, and the scraper keeps running — still
> returning rows, just with holes in them. Nothing errors. The pipeline stays green. You
> find out days later from a customer.
>
> Worse: a field can come back **populated and wrong**. A rating out of range, a title
> reading "undefined". It passes every null check you've ever written.
>
> I built THWIP for Into the Scrape-Verse: it scores every scraper 0–100 on how much of
> what it promised actually came back real, and heals the ones that slip.
>
> Then it caught three real ones. Our KESTREL collector returned 30 rows with Integrity 0
> — the generated scraper had drifted onto invented keys (`story_points`,
> `comment_count`) with every value at 0. Thirty rows of confident nothing. One `bdata
> scraper heal --auto-approve --auto-save`, no human in the loop, 0 → 100. ATLAS was
> joining every availability element on the page into one string — populated on every
> scan, wrong on every scan. 90 → 100.
>
> The third is the one I'd show you. The cron opened it overnight on its own, healed on
> its own, and the heal didn't work — because nothing on the target had broken. Our own
> payload parser was scoring the response envelope instead of the rows. The bug was ours.
> The wrong diagnosis is still in the incident record, exactly as the system believed it.
> We fixed the parser and left the false alarm on disk.
>
> A monitoring tool that rewrites its own history to look smarter is the thing this
> project exists to catch. It doesn't get an exemption for being mine.
>
> Same Collector ID before and after, every time: `c_mt2fnt3p2k4n644701`. Repaired, not
> recreated. That's the whole difference between a self-healing system and a system that
> quietly throws away the broken thing.
>
> Code: https://github.com/mikhailkhorokhorin/scrape-verse-hack · Live: https://mikhailkhorokhorin.github.io/scrape-verse-hack/ · Demo: <VIDEO>
>
> Thanks to WeMakeDevs and Bright Data for the hackathon.
>
> #IntoTheScrapeVerse #WeMakeDevs #BrightData #WebScraping #DataEngineering

---

## Notes on tone

Written deliberately without hype. No "excited to share", no "game-changer", no rocket
emoji. The post has genuinely interesting facts in it — a scraper returned thirty rows of
zeros and the platform repaired it unattended without changing its ID, and a monitor
diagnosed a break that turned out to be its own bug — and those facts are more persuasive
stated flatly than dressed up.

Three things to keep if you edit:

- **The concrete numbers.** 30 rows, Integrity 0 → 100, the literal collector ID. They
  are what separates this from every other hackathon post
- **The "populated and wrong" paragraph.** It is the idea most readers will not already
  have, and it is what makes the rest land
- **The third incident — the failed heal.** It is counterintuitive to lead with a failure
  and it is the single most credible paragraph in the post. Every other hackathon entry
  reports only wins. Do not soften it, do not move it to the end, and do not add a
  "but we fixed it" that lands before the admission does

Tag @WeMakeDevs and @Bright Data as accounts, not just as hashtags — the mention is
what gets it seen by the people running the track.

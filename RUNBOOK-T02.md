# T-02 — the three `create` calls, ready to paste

Run after `bdata login`. Each takes 5-25 minutes and spends credit — **they are
irreversible**. Fire all three back to back in three terminals; do not wait on one.

`--pretty -o` writes the full envelope to a file so the Collector ID survives a lost
terminal. That is the whole reason the flag is there.

---

## ATLAS — books.toscrape.com

```bash
npx -y -p @brightdata/cli bdata scraper create \
  "https://books.toscrape.com/" \
  "For each of the 20 book cards on the page extract: title (the link text), price including the currency symbol, the star rating written as an English word in the CSS class such as star-rating Three, the absolute image URL, and the availability text such as In stock." \
  --name thwip-atlas --pretty -o create-atlas.json
```

## KESTREL — news.ycombinator.com

```bash
npx -y -p @brightdata/cli bdata scraper create \
  "https://news.ycombinator.com/" \
  "For each of the 30 stories on the front page extract: the story title text, the points as a number, the number of comments as a number, and the author username. Stories with no points or no comments should return 0, not null." \
  --name thwip-kestrel --pretty -o create-kestrel.json
```

## BODEGA — our own demo page

**Blocked until Pages is live.** The URL below only exists after the `pages` job has run
on `main` at least once. Substitute the real host if it differs.

```bash
npx -y -p @brightdata/cli bdata scraper create \
  "https://hackathons6943133.gitlab.io/scrape-verse/app/demo-target/" \
  "For each of the 12 product cards extract: the product title, the price including the currency symbol, the rating text such as 4.4 out of 5, and the absolute image URL." \
  --name thwip-bodega --pretty -o create-bodega.json
```

---

## The moment each one returns

Take `collector_id` from the output and write it in **both** places, immediately:

1. `collectors.json` — the `collector_id` field of that collector
2. `docs/COLLECTORS.md` — the registry table, plus the created date

BODEGA also needs its `url` filled into `collectors.json`; it is empty until Pages exists.

Then confirm the pipeline sees it:

```bash
node scripts/health-check.js
```

It prints one line per collector. A collector with an ID that still prints `skip` means
the ID did not land in `collectors.json`.

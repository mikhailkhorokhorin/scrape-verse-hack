# THWIP MCP Server

Talk to a fleet of self-healing scrapers from your coding agent.

THWIP watches a fleet of Bright Data collectors ("Spiders"), scores every field
they return, notices when a site changes shape underneath them, and re-weaves
the broken ones in place. This MCP server puts that fleet inside Claude Code and
Cursor, so the whole loop — *is anything broken? what broke? fix it. prove it* —
happens in conversation.

It speaks JSON-RPC 2.0 over stdio, implemented directly against the Model
Context Protocol spec with no SDK: one JSON object per line, in and out.

## Connect

### Claude Code

```bash
claude mcp add thwip -- node mcp/server.js
```

Run it from the repo root so the server resolves `collectors.json` and `data/`.
To register it with an absolute path from anywhere:

```bash
claude mcp add thwip -- node /absolute/path/to/app/mcp/server.js
```

Confirm it connected with `/mcp` inside Claude Code.

### Cursor

Add to `.cursor/mcp.json` in the project (or `~/.cursor/mcp.json` for every
project):

```json
{
  "mcpServers": {
    "thwip": {
      "command": "node",
      "args": ["mcp/server.js"],
      "cwd": "/absolute/path/to/app"
    }
  }
}
```

Cursor picks it up from Settings → MCP.

### Anything else

Any MCP client works — the server is a plain stdio process:

```bash
npm run mcp
```

## Tools

Four tools read recorded data. They are instant and free.

| Tool | What it answers |
| --- | --- |
| `fleet_status` | How is every Spider doing right now? Integrity, status, which fields are live / infected / dead, how stale the scan is. |
| `spider_history` | How has one Spider behaved over time? Takes `spider`, optional `limit`. Post-heal runs are marked. |
| `incident_log` | What has broken, and did the repair hold? Ids, strain, integrity before and after, stages, resolution. Optional `spider` filter. |
| `heal_receipt` | Prove one repair. Takes `incident_id`. Every phase with timestamps and gaps, plus the `collector_id` — unchanged across the repair. |

Two tools drive Bright Data for real.

| Tool | What it does |
| --- | --- |
| `scan_fleet` | Live scrape of the fleet (or one `spider`), scored and appended to history. |
| `heal_spider` | Diagnose a broken Spider, re-weave it through Bright Data, verify with a fresh scrape, open an incident. Takes `spider`, optional `force`. |

**`scan_fleet` and `heal_spider` spend real Bright Data credits** and take
minutes. Their tool descriptions say so, so a well-behaved agent asks before
calling them. The read tools never touch the network.

### Field states

Each field in a run lands in one of three states, and integrity is the share of
fields still working (`infected` counts half):

- **live** — the value is there and passes its rule
- **infected** — a value came back, but it is wrong (a price of `0`, a rating of
  `47`, the same string on every row)
- **dead** — nothing came back at all

`infected` is the state that matters. A scraper returning garbage looks healthy
to a plain uptime check; THWIP scores the *data*, so silent decay surfaces.

## Example conversation

> **You:** Anything wrong with my scrapers?

Claude calls `fleet_status`:

```
THWIP fleet — 3 spiders, 0 degraded, 0 critical

BODEGA (mikhailkhorokhorin.github.io)
  integrity 100%  HEALTHY
  scanned 43m ago at 2026-08-21T09:13:59.565Z
  rows 12
  collector_id c_mt2lkwxa1bb5uz223s
  live: title, price, rating, image

ATLAS (books.toscrape.com)
  integrity 100%  HEALTHY
  scanned 35m ago at 2026-08-21T09:21:15.246Z
  rows 20
  collector_id c_mt2fnqqngikv29od5
  live: title, price, rating, image_url, availability

KESTREL (news.ycombinator.com)
  integrity 100%  HEALTHY
  scanned 35m ago at 2026-08-21T09:21:21.347Z
  rows 30
  collector_id c_mt2fnt3p2k4n644701
  live: title, points, comments, author
```

> **Claude:** All three Spiders are healthy right now — but BODEGA has a story.
> Earlier today the cron caught it at 0% twice and opened an incident on its
> own. Want the receipt?

> **You:** Show me.

Claude calls `heal_receipt` with `inc_003`:

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

The collector_id never changed: c_mt2lkwxa1bb5uz223s was re-woven in place, not replaced. Downstream consumers kept the same endpoint throughout.

heal prompt sent:
  On mikhailkhorokhorin.github.io: 'title' and 'price' and 'rating' and 'image' return null after a layout change. Likely THROTTLED: every field came back empty, so the request itself is likely being blocked or served a different page. Fix the extraction for those fields.
```

> **Claude:** Worth knowing: the heal itself did not fix this one. Nothing on
> the target had broken — the watcher's own payload parser was scoring a
> wrapped envelope instead of the rows. The parser was fixed, the next scan
> read 12 rows at 100%, and the record keeps the false diagnosis the system
> believed at the time. Every timestamp above is from the real incident log.

That last paragraph is the point. The scraper was repaired **in place** — same
collector id, same endpoint. Nothing downstream had to be reconfigured, and the
receipt is the evidence.

## Notes

- Requires Node 20+.
- Bright Data credentials come from the environment, same as the CLI scripts.
- Every error is a valid JSON-RPC error or a tool result flagged `isError` —
  bad input never takes the process down.
- Tests: `npm test` (see `test/mcp*.test.js`). The credit-spending paths are
  covered against a mocked `lib.bdata`, so the suite never spends anything.

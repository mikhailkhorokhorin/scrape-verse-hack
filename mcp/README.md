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
THWIP fleet — 3 spiders, 0 degraded, 1 critical

BODEGA (mikhailkhorokhorin.github.io)
  integrity 50%  CRITICAL
  scanned 4m ago at 2026-08-21T09:13:59.565Z
  rows 12
  collector_id c_mt2lkwxa1bb5uz223s
  live: title, rating
  dead: price, image
```

> **Claude:** BODEGA is critical at 50% — `price` and `image` stopped returning
> values, while `title` and `rating` still extract fine. That pattern usually
> means selectors moved rather than the page breaking. Want me to check when it
> started?

> **You:** Yes, and fix it.

Claude calls `spider_history` to find the last good run, then `heal_spider`:

```
BODEGA heal attempt recorded as inc_002.
strain        RENAMED
collector_id  c_mt2lkwxa1bb5uz223s (unchanged)
integrity     50% -> 100%
recovered     price, image
```

> **You:** Prove it actually got fixed.

Claude calls `heal_receipt` with `inc_002`:

```
HEAL RECEIPT inc_002
spider        BODEGA
collector_id  c_mt2lkwxa1bb5uz223s
strain        RENAMED
integrity     50% -> 100%
resolved      yes

phases:
  DETECTED   2026-08-21T09:13:59.565Z  --
  DIAGNOSED  2026-08-21T09:15:02.000Z  +63s
  REWEAVING  2026-08-21T09:15:20.000Z  +18s
  VERIFIED   2026-08-21T09:41:11.000Z  +1551s

total 1632s from detection to verification

The collector_id never changed: c_mt2lkwxa1bb5uz223s was re-woven in place,
not replaced. Downstream consumers kept the same endpoint throughout.
```

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

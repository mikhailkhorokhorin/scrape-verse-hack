# THWIP MCP Server

Talk to a fleet of self-healing scrapers from your coding agent.

THWIP watches a fleet of Bright Data collectors ("Spiders"), scores every field
they return, notices when a site changes shape underneath them, and re-weaves
the broken ones in place. This MCP server puts that fleet inside Claude Code and
Cursor, so the whole loop — *is anything broken? what broke? fix it. prove it* —
happens in conversation.

It speaks JSON-RPC 2.0 over stdio, implemented directly against the Model
Context Protocol spec with no SDK: one JSON object per line, in and out.

## The design, in one paragraph

Three choices define this server. **It is spec-direct**: `mcp/protocol.js` is a
hand-written implementation of the `2025-06-18` protocol against the
specification, not a wrapper over an SDK — 133 lines that negotiate the version,
validate every frame, and return a real JSON-RPC error for anything malformed.
**It has zero dependencies**, dev included; `npm install` fetches nothing and the
server starts in whatever Node 20+ you already have. And **the tools print
evidence rather than status**: `heal_receipt` returns four timestamps and the
value each field held on both sides of the repair, `evidence_report` returns
SHA-256 digests recomputed from disk at call time, and `numbers_audit`
recomputes every headline figure from the committed JSON so an agent can check a
claim instead of repeating it. Two of the eight tools spend real Bright Data
credits, and they say so in their own `description` — the text the model reads
before deciding to call — so a well-behaved agent asks first rather than
discovering the cost afterwards.

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

Six tools read recorded data. They are instant and free.

| Tool | What it answers |
| --- | --- |
| `fleet_status` | How is every Spider doing right now? Integrity, status, which fields are live / infected / dead, how stale the scan is. |
| `spider_history` | How has one Spider behaved over time? Takes `spider`, optional `limit`. Post-heal runs are marked. |
| `incident_log` | What has broken, and did the repair hold? Ids, strain, integrity before and after, stages, resolution. Optional `spider` filter. |
| `heal_receipt` | Prove one repair. Takes `incident_id`. Every phase with timestamps and gaps, the `collector_id` — unchanged across the repair — and a per-field check of the run taken after the heal, naming the value that arrived on each side. |
| `evidence_report` | The whole trail for one incident, or all of them. Stage timeline with computed durations, a per-field table of state and value before and after, the verdict, and SHA-256 digests of the incident record and every committed payload file behind it. Asserts the `collector_id` was identical before and after, and fails loudly if it ever is not. Optional `incident_id`. |
| `numbers_audit` | Every number the console shows, recomputed from the committed JSON in `data/`: scans, rows, incidents, resolved heals, mean time to repair, the overnight unattended totals. Takes no arguments. |

Two tools drive Bright Data for real.

| Tool | What it does |
| --- | --- |
| `scan_fleet` | Live scrape of the fleet (or one `spider`), scored and appended to history. |
| `heal_spider` | Diagnose a broken Spider, re-weave it through Bright Data, verify with a fresh scrape, open an incident. Takes `spider`, optional `force`. |

**`scan_fleet` and `heal_spider` spend real Bright Data credits** and take
minutes. Their tool descriptions say so, so a well-behaved agent asks before
calling them. The six read tools never touch the network.

### Field states

Each field in a run lands in one of three states, and integrity is the share of
fields still working (`infected` counts half):

- **live** — the value is there and passes its rule
- **infected** — a value came back, but it is wrong (a price of `0`, a rating of
  `47`, the same string on every row)
- **dead** — nothing came back at all

`infected` is the state that matters. A scraper returning garbage looks healthy
to a plain uptime check; THWIP scores the *data*, so silent decay surfaces.

## A real transcript

Piped into `node mcp/server.js` over stdio, captured verbatim. Reproduce it with the two
lines under [Connect](#connect), or with your own request file:

```bash
node mcp/server.js < your-requests.jsonl
```

**Handshake** — the version is negotiated, not assumed:

```text
--> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18",...}}
<-- {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18",
    "capabilities":{"tools":{"listChanged":false}},
    "serverInfo":{"name":"thwip","version":"1.0.0"}}}
```

**`heal_receipt` on the incident no human touched** — this is the whole product in one
call, and the text below is exactly what the tool returned:

```text
HEAL RECEIPT inc_004
spider        BODEGA
collector_id  c_mt5ib5a32sn4jpgag
strain        RENAMED
integrity     50% -> 100%
resolved      yes

phases:
  DETECTED   2026-08-22T07:56:22.427Z  --
  DIAGNOSED  2026-08-22T08:06:16.400Z  +594s
  REWEAVING  2026-08-22T08:06:16.402Z  +0s
  VERIFIED   2026-08-22T08:08:18.114Z  +122s

total 716s from detection to verification

The collector_id never changed: c_mt5ib5a32sn4jpgag was re-woven in place, not
replaced. Downstream consumers kept the same endpoint throughout.

verification: 2/2 fields re-checked against the run after the heal (every field back)
  ok   price: dead -> live | was null | now £18.00
  ok   rating: dead -> live | was null | now 4.4

heal prompt sent:
  On mikhailkhorokhorin.github.io: 'price' and 'rating' return null after a layout
  change. Likely RENAMED: the other fields still extract correctly, so a selector
  moved rather than the page changing wholesale. Fix the extraction for those fields.
```

Three things an agent can act on are in that one response: the Collector ID is identical
on both sides, the verification came from a **run after the heal** rather than from the
heal's own report, and the prompt that was sent is quoted so the diagnosis can be
challenged rather than trusted.

**Every other tool** answers in the same shape — plain text an agent can read aloud, with
the numbers derived from `data/` at call time. `evidence_report` adds SHA-256 digests
recomputed from disk; `numbers_audit` recomputes every headline figure from the committed
JSON by an implementation that shares no code with the console, so an agent can check a
claim instead of repeating it. Those numbers move — the cron appends every 30 minutes —
which is the point: the tool reads the ledger, not a cached answer.

## Notes

- Requires Node 20+.
- Bright Data credentials come from the environment, same as the CLI scripts.
- Every error is a valid JSON-RPC error or a tool result flagged `isError` —
  bad input never takes the process down.
- Tests: `npm test` (see `test/mcp/`). The credit-spending paths are
  covered against a mocked `lib.bdata`, so the suite never spends anything.

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

Everything below was produced by piping the requests into `node mcp/server.js`
over stdio and capturing what came back. Only the `tools/list` result is
abbreviated — it is one line holding all eight schemas — and the elision is
marked. Reproduce it yourself:

```bash
node mcp/server.js < your-requests.jsonl
```

```text
--> {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"transcript","version":"1.0.0"}}}
<-- {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{"listChanged":false}},"serverInfo":{"name":"thwip","version":"1.0.0"}}}

--> {"jsonrpc":"2.0","method":"notifications/initialized"}
(no response: notifications are one-way, per spec)

--> {"jsonrpc":"2.0","id":2,"method":"tools/list"}
<-- {"jsonrpc":"2.0","id":2,"result":{"tools":[
      {"name":"fleet_status","description":"Current health of every scraper in the THWIP fleet. ...","inputSchema":{"type":"object","properties":{},"additionalProperties":false}},
      {"name":"spider_history", ...},
      {"name":"incident_log", ...},
      {"name":"heal_receipt", ...},
      {"name":"evidence_report", ...},
      {"name":"numbers_audit","description":"Every number the THWIP console shows, recomputed from the committed JSON in data/ ...","inputSchema":{"type":"object","properties":{},"additionalProperties":false}},
      {"name":"scan_fleet","description":"... WARNING: this spends real Bright Data credits and takes minutes to finish. ...", ...},
      {"name":"heal_spider","description":"... WARNING: this spends real Bright Data credits and takes minutes to finish. ...", ...}
    ]}}
    (eight schemas, returned on one line; descriptions elided here for width)
```

`fleet_status` — the whole fleet, from recorded history, costing nothing:

```text
--> {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fleet_status","arguments":{}}}
<-- {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text": ... }]}}

THWIP fleet — 3 spiders, 0 degraded, 0 critical

BODEGA (mikhailkhorokhorin.github.io)
  integrity 100%  HEALTHY
  scanned 33m ago at 2026-08-22T05:52:17.115Z
  rows 12
  collector_id c_mt2lkwxa1bb5uz223s
  live: title, price, rating, image

ATLAS (books.toscrape.com)
  integrity 100%  HEALTHY
  scanned 25m ago at 2026-08-22T05:59:55.110Z
  rows 20
  collector_id c_mt2fnqqngikv29od5
  live: title, price, rating, image_url, availability

KESTREL (news.ycombinator.com)
  integrity 100%  HEALTHY
  scanned 25m ago at 2026-08-22T06:00:00.342Z
  rows 30
  collector_id c_mt2fnt3p2k4n644701
  live: title, points, comments, author
```

`incident_log` — the fleet is healthy now, but BODEGA has a history:

```text
--> {"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"incident_log","arguments":{"spider":"BODEGA"}}}
<-- {"jsonrpc":"2.0","id":4,"result":{"content":[{"type":"text","text": ... }]}}

1 incidents recorded, showing last 1

inc_003  BODEGA  strain=THROTTLED
  integrity 0% -> 100%
  resolved: yes
  opened 2026-08-21T07:48:20.779Z
  closed 2026-08-21T09:13:59.565Z
  stages: DETECTED -> DIAGNOSED -> REWEAVING -> VERIFIED
  anomalies: title, price, rating, image
  recovered: title, price, rating, image
  The cron detected BODEGA at 0% twice and ran a heal on its own — and the heal did not fix it, because nothing on the target had broken. The scraper was returning one wrapped row holding a products array, and the watcher's own payload parser scored the envelope instead of the rows. The fix landed in rowsOf, the next scan read 12 rows at 100%, and the diagnosis recorded here is the false alarm the system believed at the time. The VERIFIED stage and closure were written from the recovery scan's timestamp after the parser fix landed; the detection, diagnosis and re-weave rows are repair.js's own autonomous writes.
```

`heal_receipt` — the repair, phase by phase, with the value each field held:

```text
--> {"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"heal_receipt","arguments":{"incident_id":"inc_003"}}}
<-- {"jsonrpc":"2.0","id":5,"result":{"content":[{"type":"text","text": ... }]}}

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

verification: 4/4 fields re-checked against the run after the heal (every field back)
  ok   title: dead -> live | was null | now Ceramic pour-over dripper
  ok   price: dead -> live | was null | now £18.00
  ok   rating: dead -> live | was null | now 4.4 out of 5
  ok   image: dead -> live | was null | now https://mikhailkhorokhorin.github.io/scrape-v...

heal prompt sent:
  On mikhailkhorokhorin.github.io: 'title' and 'price' and 'rating' and 'image' return null after a layout change. Likely THROTTLED: every field came back empty, so the request itself is likely being blocked or served a different page. Fix the extraction for those fields.
```

`evidence_report` — the same incident with computed durations and digests an
auditor can recompute:

```text
--> {"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"evidence_report","arguments":{"incident_id":"inc_003"}}}
<-- {"jsonrpc":"2.0","id":6,"result":{"content":[{"type":"text","text": ... }]}}

EVIDENCE TRAIL — 1 incident, every digest recomputed from the committed files at call time

EVIDENCE inc_003 — BODEGA (THROTTLED)

  collector_id  c_mt2lkwxa1bb5uz223s -> c_mt2lkwxa1bb5uz223s  (identical: re-woven in place, not replaced)
  integrity     0% -> 100%
  verdict       EVERY_FIELD_BACK  (4/4 fields back)
  resolved      yes

TIMELINE
  DETECTED   2026-08-21T07:39:39.524Z  --
  DIAGNOSED  2026-08-21T07:48:20.779Z  +8m 41s
  REWEAVING  2026-08-21T07:48:20.782Z  +0s
  VERIFIED   2026-08-21T09:13:59.565Z  +85m 39s
  TOTAL      94m 20s from detection to verification

FIELDS
  FIELD   STATE         VALUE BEFORE  VALUE AFTER
  title   dead -> live  null         Ceramic pour-over dripper
  price   dead -> live  null         £18.00
  rating  dead -> live  null         4.4 out of 5
  image   dead -> live  null         https://mikhailkhorokhorin.gith...

DIGESTS (sha256, recompute with: node tools/evidence-report.js --json)
  incident record                   sha256 ebb1f63da705a389eeef6ee342b2888861b67a7c94661bca0d470cfc824a46dd
  docs/evidence/create-bodega.json  sha256 15370ee2eb4dc58f9b9e25867998006dda6220281a796e5f997738f916ece823  (379 bytes)

  note: this record was reconstructed after the fact from the scan log.
```

`numbers_audit` — every headline figure, recomputed rather than repeated:

```text
--> {"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"numbers_audit","arguments":{}}}
<-- {"jsonrpc":"2.0","id":7,"result":{"content":[{"type":"text","text": ... }]}}

NUMBERS AUDIT — every number the THWIP console shows, recomputed here from the
committed JSON in data/. Nothing is cached and nothing is hand-written.

            90  scans recorded in history.json
          1876  rows extracted across every scan
             3  distinct collector_ids scanned
             3  incidents recorded in incidents.json
             3  distinct spiders that have broken
             3  incidents whose verification resolved them
          true  every incident kept its collector_id
            73  mean minutes from detection to verification
          4.01  hours between the first break and the last close
    2026-08-21  day of the first recorded break
            25  scans that ran before 06:00 UTC, unattended
           542  rows extracted before 06:00 UTC, unattended
          1152  tests recorded in meta.json
          true  meta.json records the last human touch
             3  incidents carrying a per-field verification

Recompute the same table yourself with: node tools/numbers-audit.js
```

Those numbers move — the cron scans every 30 minutes and appends. The point is
not the figures in this file; it is that the tool derives them from `data/` on
every call, so an agent reading them is reading the ledger rather than a claim.

## Notes

- Requires Node 20+.
- Bright Data credentials come from the environment, same as the CLI scripts.
- Every error is a valid JSON-RPC error or a tool result flagged `isError` —
  bad input never takes the process down.
- Tests: `npm test` (see `test/mcp*.test.js`). The credit-spending paths are
  covered against a mocked `lib.bdata`, so the suite never spends anything.

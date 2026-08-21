# T-02 — the three `create` calls

> **Executed Aug 21, 2026. All three collectors exist.** This file is kept as a record of
> what was run, not as work outstanding. **Do not run these commands again** — `create`
> spends credit and a collector that already has an ID is healed, never recreated.

The Collector IDs and the heal history are in [`../COLLECTORS.md`](../COLLECTORS.md); the URLs and
per-field validators are in `collectors.json`.

| Codename | Collector ID | Target |
|---|---|---|
| BODEGA | `c_mt2lkwxa1bb5uz223s` | our own demo page, `demo-target/` |
| ATLAS | `c_mt2fnqqngikv29od5` | books.toscrape.com |
| KESTREL | `c_mt2fnt3p2k4n644701` | news.ycombinator.com |

The full `create` envelopes are committed as `create-atlas.json`, `create-kestrel.json`
and `create-bodega.json` — `--pretty -o` wrote them so the ID would survive a lost
terminal, and they are the evidence that each collector is real.

BODEGA was created last because it needed the demo page's public URL, which needed Pages
live. That sequence is recorded in [`GITHUB-SETUP.md`](GITHUB-SETUP.md), including the exact command.

To confirm the pipeline still sees all three:

```bash
node scripts/health-check.js
```

One line per collector. A collector with an ID that prints `skip` means the ID is missing
from `collectors.json`.

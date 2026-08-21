# Heal trigger endpoint (T-38)

The console has a `RE-WEAVE` button and a browser cannot run `bdata scraper heal`.
Calling the GitLab API from client JS would mean shipping a trigger token in plain
sight. This Worker holds the token on its own side and starts the existing pipeline.

It returns `202` and nothing else. Healing takes up to fifteen minutes and the cron
finishes the job — the button changes state, not reality.

## Deploy

```bash
cd endpoint
npx wrangler deploy
npx wrangler secret put TRIGGER_TOKEN
```

## Required values

| Name | Where | Notes |
|---|---|---|
| `TRIGGER_TOKEN` | Worker **secret**, never a var | Settings → CI/CD → Pipeline trigger tokens. A trigger token can start pipelines and nothing else, which is exactly the authority this endpoint should have. Do **not** use a personal access token |
| `PROJECT_ID` | `wrangler.toml` var, currently empty | The numeric id on the project's General settings page. Left blank deliberately rather than guessed |
| `ALLOWED` | `wrangler.toml` var | Comma-separated collector IDs. Only these are accepted |
| `ORIGIN` | `wrangler.toml` var | The Pages origin. CORS is locked to it — no wildcard |

Then point the console at it by setting `HEAL_ENDPOINT` in `web/js/config.js`.

## Why it is shaped this way

This endpoint is public and it spends Bright Data credit, so it is treated as an
attack surface rather than a convenience.

- **Collector IDs are allowlisted.** A client-supplied ID is never passed through to
  the CLI, and the format is validated before the allowlist is consulted
- **The heal prompt is never accepted from the client.** `repair.js` builds it from
  the actual dead and infected fields. A browser that can supply prompt text can
  inject arbitrary instructions into the healer
- **Cooldown is enforced server-side**, two hours per collector, mirroring the rule in
  `repair.js`. A disabled button is not a rate limit
- **CORS is locked to the Pages origin**, and a mismatched `Origin` header is rejected
  before any work happens
- **`202` is returned, never the CLI output.** Errors from the healer are not the
  caller's business

The pipeline reads `$HEAL_COLLECTOR` and passes it to `repair.js`, which validates it
against `collectors.json` again — server-side allowlisting is not a substitute for
validating at the point of use.

## Known limitation

The cooldown map lives in Worker memory, so it is per-isolate and resets on redeploy.
It raises the cost of hammering the endpoint but is not a hard guarantee. The real
guarantee is the same two-hour check inside `repair.js`, which runs against the
committed `incidents.json` and cannot be bypassed from outside.

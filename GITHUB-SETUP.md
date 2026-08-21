# Moving the pipeline to GitHub

GitLab runners are unavailable on this account — sixteen consecutive pipelines failed
before creating a single job — so CI, Pages and the cron live on GitHub. GitLab stays as
a mirror, because the submission asks for a GitHub repository anyway.

`.github/workflows/watch.yml` is already written and does three things: scans on a
`*/30` cron, heals what has been broken twice, and publishes the console to Pages.

## What you do

**1. Create the repository** — `thwip`, public. Do not initialise it with a README, the
history already exists here.

**2. Add the remote and push.**

```bash
cd app
git remote add github https://github.com/<you>/thwip.git
git push github main
```

`origin` still points at GitLab; `git push origin main` keeps the mirror current.

**3. Add one secret** — Settings → Secrets and variables → Actions → New repository
secret:

| Name | Value |
|---|---|
| `BRIGHTDATA_API_KEY` | a fresh key from the Bright Data dashboard |

**There is no second token.** GitLab needed `DATA_TOKEN` because its job token cannot
push; GitHub Actions commits with the built-in `GITHUB_TOKEN`, which the workflow already
requests via `permissions: contents: write`.

**4. Turn on Pages** — Settings → Pages → Source: **GitHub Actions**. Not "Deploy from a
branch"; the workflow uploads the artifact itself.

That is all. The first push runs `build` and `deploy`; the console appears at
`https://<you>.github.io/thwip/` within a couple of minutes. The `scan` job only runs on
the cron or when started by hand, so pushing code does not spend credit.

## Once Pages is live

The demo target is published alongside the console at
`https://<you>.github.io/thwip/demo-target/`. Put that URL into `collectors.json` under
BODEGA, then create the third collector:

```bash
npx -y -p @brightdata/cli bdata scraper create \
  "https://<you>.github.io/thwip/demo-target/" \
  "For each of the 12 product cards extract: the product title, the price including the currency symbol, the rating text such as 4.4 out of 5, and the absolute image URL." \
  --name thwip-bodega --pretty -o create-bodega.json
```

Pin the returned `c_*` in both `collectors.json` and `docs/COLLECTORS.md` straight away.

## Checking it worked

- Actions tab: `build` and `deploy` green on the first push
- `https://<you>.github.io/thwip/` renders the console against real data
- Actions → watch → Run workflow: a manual `scan` should append to `data/history.json`
  and commit it back within a few minutes

If the scan job fails on auth, the secret name is wrong or the key was revoked — the
Bright Data CLI reads `BRIGHTDATA_API_KEY` from the environment and nothing else.

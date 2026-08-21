# Moving the pipeline to GitHub

> **Executed Aug 21, 2026. This is the record of a migration that has already happened,
> kept so the setup can be reproduced or checked.** Nothing here is outstanding.
>
> | | |
> |---|---|
> | Repository | https://github.com/mikhailkhorokhorin/scrape-verse-hack (`main`, `develop`) |
> | Live console | https://mikhailkhorokhorin.github.io/scrape-verse-hack/ |
> | Secret set | `BRIGHTDATA_API_KEY` — the only one |
> | Pages source | GitHub Actions |
> | BODEGA | created, `c_mt2lkwxa1bb5uz223s` |

GitLab runners are unavailable on this account — sixteen consecutive pipelines failed
before creating a single job — so CI, Pages and the cron live on GitHub. GitLab stays as
a mirror, because the submission asks for a GitHub repository anyway.

`.github/workflows/watch.yml` scans on a `*/30` cron, heals what has been broken twice,
and publishes the console to Pages.

## What was done

**1. Create the repository** — `scrape-verse-hack`, public. Do not initialise it with a
README, the history already exists here.

**2. Add the remote and push.**

```bash
cd app
git remote add github https://github.com/mikhailkhorokhorin/scrape-verse-hack.git
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
https://mikhailkhorokhorin.github.io/scrape-verse-hack/ within a couple of minutes. The
`scan` job only runs on the cron or when started by hand, so pushing code does not spend
credit.

## Once Pages is live — done

The demo target is published alongside the console at
https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/. That URL went into
`collectors.json` under BODEGA, and the third collector was created with:

```bash
npx -y -p @brightdata/cli bdata scraper create \
  "https://mikhailkhorokhorin.github.io/scrape-verse-hack/demo-target/" \
  "For each of the 12 product cards extract: the product title, the price including the currency symbol, the rating text such as 4.4 out of 5, and the absolute image URL." \
  --name thwip-bodega --pretty -o create-bodega.json
```

It returned `c_mt2lkwxa1bb5uz223s`, pinned in both `collectors.json` and
`docs/COLLECTORS.md`. Its first clean scan landed at `09:13:59Z` — 12 rows, Integrity 100.

## Checking it worked

- Actions tab: `build` and `deploy` green on the first push
- https://mikhailkhorokhorin.github.io/scrape-verse-hack/ renders the console against real
  data
- Actions → watch → Run workflow: a manual `scan` should append to `data/history.json`
  and commit it back within a few minutes

If the scan job fails on auth, the secret name is wrong or the key was revoked — the
Bright Data CLI reads `BRIGHTDATA_API_KEY` from the environment and nothing else.

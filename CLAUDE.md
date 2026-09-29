# CLAUDE.md

## Architecture

This is an [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) documentation site, deployed to GitHub Pages via `.github/workflows/deploy.yml` (uses `withastro/action`), served at the custom domain `docs.bluedotseconomy.org`.

**Key files:**

- `astro.config.mjs` — single source of truth for the sidebar navigation (information architecture). Every page must have a matching `slug` entry here before it becomes reachable from the nav.
- `src/content.config.ts` — registers the `docs` collection using Starlight's loader/schema; no custom fields added yet.
- `src/styles/custom.css` — theme accent overrides only.
- `src/content/docs/` — all documentation as `.md` or `.mdx` with Starlight frontmatter (`title`, `description`, `sidebar.order`).

**Deployment config (`astro.config.mjs`):**

```js
site: 'https://docs.bluedotseconomy.org',
```

No `base` — the site is served from the domain root, so internal links are root-relative (`/guides/...`, not `/bluedots-docs/guides/...`). `public/CNAME` pins the custom domain across Pages deploys.

## Domains

- **Canonical host:** `docs.bluedotseconomy.org` — set in both `public/CNAME` and `site` (above). Keep the two in sync; `site` drives canonical tags and the sitemap.
- **`public/CNAME` does not change the domain here.** Pages on this repo uses the *GitHub Actions* source (`build_type: workflow`), and that source ignores the `CNAME` file in the artifact — the custom domain lives only in Settings → Pages (`gh api -X PUT repos/:owner/:repo/pages -f cname=…`). The committed file is documentation plus insurance if the repo is ever switched to a branch source. Changing a domain means changing **both**.
- **Legacy host:** `docs-signals-dpg.bluedotseconomy.org` redirects here. It is served by a separate redirect-only Pages repo, because GitHub Pages allows one custom domain per repository. Do **not** re-add the legacy host to this repo's `CNAME` — that would break the redirect and steal the domain claim.
- DNS for both hosts lives at GoDaddy (`ns55/ns56.domaincontrol.com`), each a CNAME to `blue-dots-economy.github.io`.
- Full switchover procedure and rollback: `docs/superpowers/plans/2026-07-30-dual-domain-docs-redirect.md`.

## Adding / editing content

- Drop `.md` or `.mdx` files under `src/content/docs/<section>/`.
- Add a matching `{ label, slug }` entry to the sidebar array in `astro.config.mjs`.
- MDX pages can import Starlight components: `Card`, `CardGrid`, `LinkCard`, `Tabs`, etc.
- The landing page (`src/content/docs/index.mdx`) uses `template: splash` — it is MDX, not plain Markdown.

### Local preview

```bash
pnpm install
pnpm dev        # local dev server (under /)
pnpm build      # production build to dist/
pnpm preview    # preview the production build
```

## Information architecture

The sidebar in `astro.config.mjs` is the authoritative list of sections and slugs.

Many sidebar slugs (especially in `overview/`, `core-concepts/architecture/`, `core-concepts/technical/`, `guides/installation/`) reference pages that do not yet exist as files — they need to be created before the site will build without 404s.

## Implementation plans are temporary

A plan markdown is scaffolding for work in flight, not documentation. **When the
work it describes has shipped, delete the plan in the same PR that completes it.**

- Plans live at the repo root as `*-PLAN.md` / `*-plan.md` while the work is open.
- Do not leave a shipped plan behind with a stale `Status:` line — every root plan
  in this repo's history said "not executed" long after it had, in fact, executed.
  A stale plan is worse than no plan: the next reader treats it as pending work.
- The content is the record. Anything worth keeping from a plan (a decision and
  its reasoning, a rollback procedure, a gotcha) belongs in the docs themselves,
  in `CLAUDE.md`, or in the PR description — not in a file that outlives its job.
- **Exception:** dated records under `docs/superpowers/plans/` and
  `docs/superpowers/specs/` are a deliberate point-in-time archive, and one of
  them is referenced above as the live dual-domain runbook. Leave them.

Before opening a PR, check: does this PR complete a plan? If so, `git rm` it.

## Writing register

Overview and Explore make the case for Blue Dots; Core Concepts, Guides and API Reference describe what exists. Keep advocacy out of pages a reader executes — a Guide should say what happens and what to do, not why the idea is good.

## Figures have one owning page

A headline figure is stated once and linked from everywhere else. Restating a number copies it and lets the copies drift.

| Figure | Owner |
|---|---|
| Pilot outcomes — jobs surfaced, discovery time, conversion, cost per interaction | `explore/pilots` |
| ₹87,500 crore and its derivation | `explore/economics` |
| Field observations — proximity, ratios, employer response, women's assurances | `explore/learnings` |
| Time to create a Blue Dot (2–3 minutes) | `overview/the-blue-dots-approach` |

Terminology: use **MSME**, not SMB, outside the Brown Dots sector naming.

## Guided paths

`Start Here` hubs list their steps as `PhaseTimeline` phases; member pages carry `Path N of M` labels in `prev`/`next` frontmatter.

Two constraints:

- **A page in two paths can only carry one chain.** `guides/installation/local-stack` is step 9 of Build and step 5 of Deploy; its frontmatter serves Build. Do not add a second chain — resolve it in the hub instead.
- **Inserting a step renumbers every label after it.** Keep the hub list and the labels in sync in the same commit.

`starlight-links-validator` cannot see `PhaseTimeline` hrefs (they sit in a JSX expression). Run `pnpm check:paths` after `pnpm build` when you change a hub.


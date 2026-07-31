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
- **Legacy host:** `docs-signals-dpg.bluedotseconomy.org` redirects here. It is served by a separate redirect-only Pages repo, because GitHub Pages allows one custom domain per repository. Do **not** re-add the legacy host to this repo's `CNAME` — that would break the redirect and steal the domain claim.
- DNS for both hosts lives at GoDaddy (`ns55/ns56.domaincontrol.com`), each a CNAME to `blue-dots-economy.github.io`.
- Full switchover procedure and rollback: `docs/superpowers/plans/2026-07-30-dual-domain-docs-redirect.md`.

## Adding / editing content

- Drop `.md` or `.mdx` files under `src/content/docs/<section>/`.
- Add a matching `{ label, slug }` entry to the sidebar array in `astro.config.mjs`.
- MDX pages can import Starlight components: `Card`, `CardGrid`, `LinkCard`, `Tabs`, etc.
- The landing page (`src/content/docs/index.mdx`) uses `template: splash` — it is MDX, not plain Markdown.

## Information architecture

The sidebar in `astro.config.mjs` is the authoritative list of sections and slugs.

Many sidebar slugs (especially in `overview/`, `core-concepts/architecture/`, `core-concepts/technical/`, `guides/installation/`) reference pages that do not yet exist as files — they need to be created before the site will build without 404s.

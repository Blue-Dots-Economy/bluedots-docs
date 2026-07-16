# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install      # install dependencies (Node ≥ 20 required)
pnpm dev          # dev server at http://localhost:4321
pnpm build        # production build to ./dist
pnpm preview      # serve the production build locally
pnpm check        # TypeScript / Astro type-check (astro check)
```

## Architecture

This is an [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) documentation site, deployed to GitHub Pages via `.github/workflows/deploy.yml` (uses `withastro/action`), served at the custom domain `docs-signals-dpg.bluedotseconomy.org`.

**Key files:**

- `astro.config.mjs` — single source of truth for the sidebar navigation (information architecture). Every page must have a matching `slug` entry here before it becomes reachable from the nav.
- `src/content.config.ts` — registers the `docs` collection using Starlight's loader/schema; no custom fields added yet.
- `src/styles/custom.css` — theme accent overrides only.
- `src/content/docs/` — all documentation as `.md` or `.mdx` with Starlight frontmatter (`title`, `description`, `sidebar.order`).

**Deployment config (`astro.config.mjs`):**

```js
site: 'https://docs-signals-dpg.bluedotseconomy.org',
```

No `base` — the site is served from the domain root, so internal links are root-relative (`/guides/...`, not `/bluedots-docs/guides/...`). `public/CNAME` pins the custom domain across Pages deploys.

## Adding / editing content

- Drop `.md` or `.mdx` files under `src/content/docs/<section>/`.
- Add a matching `{ label, slug }` entry to the sidebar array in `astro.config.mjs`.
- MDX pages can import Starlight components: `Card`, `CardGrid`, `LinkCard`, `Tabs`, etc.
- The landing page (`src/content/docs/index.mdx`) uses `template: splash` — it is MDX, not plain Markdown.

## Information architecture

| Section | Sub-sections |
|---|---|
| **Overview** | introduction · paradox-of-proximity · the-blue-dots-approach · blue-dots-as-a-dpg · who-is-this-for |
| **Core Concepts** | signals · aggregators · networks-domains-instances · items-actions-events · glossary |
| **— Architecture** | high-level-architecture · signals-dpg · aggregator-dpg · data-model · identity-and-auth |
| **— Technical** | overview · schema-driven-model · read-write-paths · tech-stack |
| **Guides** | Installation (prerequisites · local-stack · signals-dpg · aggregator-dpg) · adaptor-onboarding · configuration · api-reference · deployment |
| **Explore** | use-cases · pilots · beyond-livelihoods |
| **Community** | contributing · roadmap · release-notes |

Many sidebar slugs (especially in `overview/`, `core-concepts/architecture/`, `core-concepts/technical/`, `guides/installation/`) reference pages that do not yet exist as files — they need to be created before the site will build without 404s.

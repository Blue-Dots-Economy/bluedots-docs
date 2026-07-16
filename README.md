# Blue Dots Economy — Documentation

The documentation site for the **Blue Dots Economy** initiative — the open **Signals** and **Aggregator** Digital Public Goods (DPGs) that solve India's local discovery crisis.

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) and deployed to **GitHub Pages**.

## Quick start

```bash
pnpm install      # or npm install
pnpm dev          # local dev server at http://localhost:4321/bluedots-docs
pnpm build        # production build to ./dist
pnpm preview      # preview the production build
```

> Node ≥ 20 required. Works with `pnpm`, `npm` or `yarn` — a `pnpm-lock.yaml` makes the GitHub Action default to pnpm.

## Project structure

```text
bluedots-docs/
├── .github/workflows/deploy.yml   # GitHub Pages deploy (withastro/action)
├── astro.config.mjs               # site config + Starlight sidebar (the IA)
├── src/
│   ├── assets/                    # logos
│   ├── content/docs/              # all documentation pages (.md / .mdx)
│   │   ├── index.mdx              # landing (splash) page
│   │   ├── overview/
│   │   ├── core-concepts/
│   │   │   ├── architecture/
│   │   │   └── technical/
│   │   ├── guides/
│   │   │   └── installation/
│   │   ├── explore/
│   │   └── community/
│   ├── content.config.ts          # Starlight content collection
│   └── styles/custom.css          # theme accent overrides
└── public/favicon.svg
```

## Information architecture

| Section | Pages |
| --- | --- |
| **Overview** | Introduction · Paradox of Proximity · The Blue Dots Approach · Blue Dots as a DPG · Who Is This For |
| **Core Concepts** | Signals · Aggregators · Networks/Domains/Instances · Items/Actions/Events · Glossary |
| **— Architecture** | High-Level Architecture · Signals DPG · Aggregator DPG · Data Model · Identity & Auth |
| **— Technical** | Overview · Schema-Driven Model · Read & Write Paths · Tech Stack |
| **Guides** | Installation (Prerequisites · Local Stack · Signals · Aggregator) · Adaptor Onboarding · Configuration · API Reference · Deployment |
| **Explore** | Use Cases · Pilots · Beyond Livelihoods |
| **Community** | Contributing · Roadmap · Release Notes |

Edit the sidebar in `astro.config.mjs`; add pages under `src/content/docs/`.

## Deploying to GitHub Pages

1. Push this project to a repo (e.g. `Blue-Dots-Economy/bluedots-docs`).
2. **Settings → Pages → Source = GitHub Actions**.
3. Confirm `site` / `base` in `astro.config.mjs`:
   ```js
   site: 'https://blue-dots-economy.github.io',
   base: '/bluedots-docs',
   ```
   The site will be live at `https://blue-dots-economy.github.io/bluedots-docs/`.
4. Push to `main` — the workflow builds and deploys automatically.

### Custom domain

To serve from e.g. `docs.bluedotseconomy.org`: set `site` to that URL, remove `base` (or set `'/'`), add a `public/CNAME` file containing the domain, and configure the domain in **Settings → Pages**.

## Editing content

- Pages are Markdown (`.md`) or MDX (`.mdx`) with Starlight frontmatter (`title`, `description`, `sidebar.order`).
- MDX pages can use Starlight components (`Card`, `CardGrid`, `LinkCard`, etc.).
- Internal links include the `/bluedots-docs` base prefix to work on GitHub Pages.

## Content sources

Drafted from [bluedotseconomy.org](https://bluedotseconomy.org) and the Signals/Aggregator architecture notes.

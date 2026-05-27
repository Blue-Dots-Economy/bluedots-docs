# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the public documentation site for the **Blue Dots Economy** project — a network-aware backend system for federated trust networks. Built with [Astro Starlight](https://starlight.astro.build/). Deployed automatically to GitHub Pages at https://blue-dots-economy.github.io/bluedots-docs/.

## Commands

Use **pnpm** (v11.1.2, node ≥ 20 required):

```bash
pnpm dev        # Start dev server at http://localhost:4321
pnpm build      # Production build → dist/
pnpm preview    # Preview production build
pnpm typecheck  # Run astro check (TypeScript + component validation)
```

No test suite exists — `typecheck` is the primary validation step.

## Architecture

### Configuration

- **`astro.config.mjs`** — Central config: sidebar structure, Starlight options, integrations (sitemap, mermaid). The sidebar in this file is the source of truth for navigation order.
- **`src/content.config.ts`** — Extends Starlight's doc schema with custom frontmatter fields: `tags`, `audience` (developer | operator | integrator), `status` (stable | draft | deprecated), `lastReviewed`.
- **Site URL / base path** are set via env vars `DOCS_SITE_URL` and `DOCS_BASE` (see `.github/workflows/deploy.yml` for production values). `src/utils/withBase.ts` provides a helper to resolve links against the base path.

### Content (`src/content/docs/`)

All documentation lives here as `.md` or `.mdx` files. Sections map to sidebar groups defined in `astro.config.mjs`:

| Directory | Topic |
|-----------|-------|
| `concepts/` | Architecture overviews (includes Mermaid diagrams) |
| `hosting/` | Deployment guides (Docker, single/multi-domain, Dokploy) |
| `schemas/` | Network schema / contract authoring |
| `apps/api/` | Backend API routes and internals |
| `apps/ui/` | Frontend app documentation |
| `packages/` | Shared internal packages (auto-generated sidebar) |
| `services/` | Microservices (auto-generated sidebar) |

### Custom Components (`src/components/`)

Reusable Astro components for use in `.mdx` files:

- **`ApiEndpoint.astro`** — Documents an HTTP route; accepts `method`, `path`, `auth` (apikey | session | admin | public), and optional `description`.
- **`EnvVar.astro`** — Documents an environment variable; accepts `name`, `status` (required | optional), `default`, and `description`.
- **`GradientCard.astro`** / **`GradientCardGrid.astro`** — Feature cards for landing pages; card accepts `title`, `description`, `icon`, and `href`.

### Styling (`src/styles/custom.css`)

Overrides Starlight CSS variables for Blue Dots branding (Open Sans font, blue accent, dark navy background). Also defines sidebar icon masks (one SVG mask per sidebar section) and responsive card grid breakpoints. Avoid adding inline styles to components — extend `custom.css` instead.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys on every push to `main`. The production build sets:
- `DOCS_SITE_URL=https://blue-dots-economy.github.io`
- `DOCS_BASE=/bluedots-docs/`
- `DOCS_ROBOTS_INDEXABLE=true`

Any link within documentation should use `withBase()` from `src/utils/withBase.ts` rather than hard-coding `/bluedots-docs/` paths.

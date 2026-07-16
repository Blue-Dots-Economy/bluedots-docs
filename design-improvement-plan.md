# Design Improvement Plan — Blue Dots Docs

> Goal: move the docs from "plain text + tables" to a modern, brand-led visual
> system using trending documentation-UI patterns, without sacrificing the
> maintainability of markdown content. **Status: plan only, not executed.**

## Current state (review findings)

- **38 pages total: 37 plain `.md`, 1 `.mdx`.** Only `index.mdx` (the splash
  landing) uses components (`Card`, `CardGrid`, `LinkCard`).
- **Every other page is prose + markdown tables.** No `Steps`, `Tabs`, `Badge`,
  `Aside` (asides are used lightly), no diagrams, no metric callouts.
- **No Starlight plugins installed.** No Mermaid, no image zoom, no view
  transitions, no OpenAPI rendering (the API reference is hand-written prose).
- **Strong raw material that is currently wasted as tables/prose:**
  - ~12 standout statistics (₹87,500 cr, <50% placement, <35% women LFPR,
    ~100 M PwDs, $12 B crop loss, ~60 M SMBs, 10,000+ jobs, ₹10/interaction…).
  - Multiple **before/after** comparison tables (paradox, pilots).
  - **Phased processes** (district activation 3 stages, roadmap Now/Next/Later).
  - The **color-coded Dots family** (Blue/Pink/Purple/Orange/Green/Brown) —
    already has brand colours + dot SVGs, begging for a card/bento treatment.
  - **Architecture/technical** pages describe systems in prose with zero diagrams.
  - The **glossary** is a flat list — ideal for definition cards + search.
  - **Voice "journey" quotes** (before→after) — ideal for a chat/journey UI.

## Design direction

Anchor the whole theme on the product's own metaphor — **dots on a living map /
constellation** — with the brand dot palette already in `custom.css`.

Three candidate aesthetics (recommend **A**, can blend with B):

- **A. "Living map" (recommended).** Deep-navy dark mode + clean light mode;
  the dot palette as semantic sector accents; subtle map/constellation textures
  in heroes; bento-grid feature sections; big-number stat cards; soft elevation
  and rounded corners; hover-lift micro-interactions; page view-transitions.
- **B. "Editorial / civic-tech."** Calmer, document-forward, large display
  headings, generous whitespace, restrained accents, pull-quotes. Lower effort.
- **C. "Dashboard / data-rich."** Heavier on charts, metric tiles, comparison
  widgets. Highest effort; risks over-designing a docs site.

Foundations (all directions):
- **Type scale & display weights** on the existing Google Sans stack; tighter
  heading letter-spacing (already partially done on hero).
- **Token system**: extend `custom.css` with surface/elevation/border tokens and
  the dot palette (light + dark variants already added) so components theme
  cleanly in both modes.
- **Accessibility & perf budget**: WCAG-AA contrast in both themes; lazy/optimised
  images; respect `prefers-reduced-motion`; keep Pagefind search.

## Component system to adopt

**1. Starlight built-ins (currently unused) — zero new deps:**
`Steps`, `Tabs`/`TabItem`, `Badge`, `LinkButton`, `FileTree`, plus wider use of
`Card`/`CardGrid`/`LinkCard` and `Aside` variants.

**2. Community plugins to add:**
- `starlight-openapi` — render the real API reference from an OpenAPI spec
  (replaces the hand-written `guides/api-reference.md`).
- `astro-mermaid` (or `rehype-mermaid`) — diagrams for architecture, data model,
  read/write paths, signal lifecycle.
- `starlight-image-zoom` — zoomable diagrams/screenshots.
- `starlight-view-transitions` — smooth page transitions (trending, low-risk).
- `starlight-links-validator` — guard against broken internal links at build.
- (Optional) `starlight-sidebar-topics` — top-level topic switcher
  (Overview / Concepts / Guides / Explore) for a more app-like nav.

**3. Custom Astro components to build** (`src/components/`):
- **`StatCard` + `StatGrid`** — big-number metric cards. Highest-impact win;
  used on paradox, pilots, economics, use-cases, Dots family.
- **`BeforeAfter`** — side-by-side comparison panels with a center arrow,
  replacing the before/after tables (paradox, pilots).
- **`DotCard` / `DotGrid`** — colored persona cards (bento) for the Dots family,
  reusing the dot SVGs + palette.
- **`PhaseTimeline` / `Steps` styling** — district-activation stages and roadmap.
- **`JourneyQuote`** — the before→after voice quotes as a chat/journey bubble.
- **`GlossaryCard` / definition grid** — searchable, anchored glossary terms.
- **`SectionHero`** — colored section/landing banners (echo the paper's persona
  pages) for Explore/Overview entry pages.

## Page-by-page application

| Page(s) | Replace | With |
|---|---|---|
| `index.mdx` | Already cards | Add hero map texture, StatGrid band, bento polish |
| `overview/paradox-of-proximity` | 2 tables | StatGrid (cost indicators) + BeforeAfter |
| `overview/the-blue-dots-approach` | prose levers | 4 numbered feature cards + diagram |
| `explore/economics` | 31 table rows | StatCards for headline figures + retained derivation tables (collapsible) + a simple flow diagram |
| `explore/pilots` | 7-row table | BeforeAfter + StatGrid + quote |
| `explore/beyond-livelihoods` (Dots Family) | table | DotGrid bento + JourneyQuote per color |
| `explore/use-cases` | prose | Cards + JourneyQuote |
| `guides/district-activation` | table | PhaseTimeline / Steps |
| `guides/installation/*` | prose steps | `Steps` + `Tabs` (OS/runtime) + `FileTree` |
| `guides/api-reference` | hand-written | `starlight-openapi` generated reference |
| `core-concepts/architecture/*`, `technical/*` | prose | Mermaid diagrams + Tabs |
| `core-concepts/glossary` | flat list | GlossaryCard grid + anchors |
| `community/roadmap` | Now/Next/Later prose | PhaseTimeline / status badges |

## Implementation approach

- **Selective `.md` → `.mdx`.** Only convert pages that need components; keep
  simple pages as markdown. Components import cleanly in `.mdx`.
- **Keep content authorable.** Components take props/slots so writers still write
  prose; avoid turning every page into bespoke JSX.
- **CSS architecture.** Extend `custom.css` tokens; co-locate component styles in
  each `.astro` file. Honour light/dark via the existing `data-theme` variables.
- **Diagrams as code.** Author architecture diagrams in Mermaid (versionable,
  themable) rather than static images.
- **Guardrails.** Add `starlight-links-validator` and keep `pnpm build` green;
  test both themes; check Lighthouse/perf after adding transitions/zoom.

## Phased rollout

1. **Foundations** — token system, type scale, add view-transitions + links
   validator; build `StatCard`/`StatGrid` + `BeforeAfter`. (Biggest visual lift
   for least content churn.)
2. **Flagship pages** — paradox, pilots, economics, Dots family, use-cases,
   district-activation (convert to `.mdx`, apply components).
3. **Technical depth** — Mermaid diagrams across architecture/technical; `Steps`
   + `Tabs` + `FileTree` across installation; `starlight-openapi` for API.
4. **Polish** — glossary cards, roadmap timeline, image zoom, micro-interactions,
   accessibility + perf pass.

## Risks / considerations

- **Maintainability:** components add power but also surface area — scope them to
  high-value pages; keep a documented, small component set.
- **Build/deps:** each plugin is a dependency and a potential build break; add
  incrementally and keep CI (`pnpm build`) as the gate.
- **Over-design:** a docs site must stay readable and fast; favour clarity over
  spectacle, and gate motion behind `prefers-reduced-motion`.
- **Brand assets:** the persona glyph icons on bluedotseconomy.org have black
  backgrounds (bad in dark mode) — prefer the dot markers or recolour SVGs.

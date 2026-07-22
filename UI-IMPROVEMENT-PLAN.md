# Blue Dots Docs — UI Improvement Plan

A full-site audit of the documentation UI (all 40 pages, 9 custom components, theme CSS, and Starlight config) and a phased plan to lift it to a coherent, distinctive, production-quality design system.

**Design thesis:** a Blue Dot is a *signal on a map* — a point of light in "digital darkness." The site's visual language should make the **dot** the single signature motif (markers, timeline nodes, section accents), carried by one coherent type family and one canonical color palette, instead of today's three competing blues and per-component styling.

---

## 1. Current-state audit

### 1.1 Defects (broken today, fix regardless of redesign)

| # | Defect | Where | Impact |
|---|--------|-------|--------|
| D1 | `.sc--accent` has **no dark-mode override** — default StatCards keep their light pastel gradient in dark mode (the "glowing" first card on Economics, Pilots, Paradox pages) | `src/components/StatCard.astro` | Visual bug on 3 pages |
| D2 | `DotGrid` lacks the `not-content` class that `StatGrid` has — Starlight's prose `margin-top` rule leaks into DotCards (same first-item misalignment bug already fixed for StatGrid) | `src/components/DotGrid.astro` | Misaligned cards on Beyond Livelihoods |
| D3 | **Dead CSS:** `.sl-markdown-content h1` (DM Serif Display, brand blue) never applies — Starlight renders the page title *outside* `.sl-markdown-content`. Every page h1 is default bold sans, while h2s are serif. Titles and section heads are visibly mismatched | `src/styles/custom.css:56-63` | Site-wide typographic inconsistency |
| D4 | Body font stack declares **Google Sans, which is never loaded** (proprietary; the `@font-face` block is commented out). Real rendering is Roboto/system fallback — the declared design and the shipped design differ | `src/styles/custom.css:12-14` | Unpredictable body type across devices |
| D5 | `JourneyQuote` / `BeforeAfter` internals are also exposed to Starlight's prose-spacing rule (no `not-content`) — needs verification and likely the same fix as D2 | `src/components/JourneyQuote.astro`, `BeforeAfter.astro` | Potential spacing bugs |
| D6 | Config `logo` uses PNG while hero `image` uses SVG of the same mark | `astro.config.mjs`, `src/content/docs/index.mdx` | Asset drift; PNG scales poorly on retina |

### 1.2 System-level inconsistencies

**Three blues coexist:**

| Source | Blue | Used by |
|--------|------|---------|
| `--dot-blue` | `#1335b5` (light) / `#8aa6ff` (dark) | DotCard, h1/h2 color rule (dead), dot-name classes |
| Hardcoded | `#1d6cf2` | FeatureCard, StatCard, NavCard (pasted into each file) |
| `--sl-color-accent` | `#1d6cf2` dark / `#1554c9` light | PhaseTimeline, Starlight UI (links, sidebar highlight) |

Greens/oranges diverge the same way (`--dot-green #3a7739` vs cards' `#16a34a`).

**Per-component drift (no shared tokens):**

| Property | FeatureCard | StatCard | NavCard | DotCard | BeforeAfter/JourneyQuote |
|----------|------------|----------|---------|---------|--------------------------|
| Radius | 1rem | 1rem | 0.875rem | 0.875rem | 0.75rem |
| Hover lift | −6px | −5px | −3px | −2px | — |
| Hover shadow | colored glow | colored glow | colored glow | plain black | — |
| Background | gradient | gradient | flat | flat | flat |
| Color source | hardcoded hex | hardcoded hex | hardcoded hex | `--dot-*` vars | raw HSL literals |

**Other gaps:**

- Lucide icon SVG paths are copy-pasted into 4 components (drift risk, no single icon source).
- No `prefers-reduced-motion` guard on any spring/hover animation.
- No visible `:focus-visible` styling on NavCard (an `<a>`) beyond browser default.
- DM Serif Display loads only weight 400 — no italic, nothing else.
- Mermaid is hand-rolled via CDN `<script>` at runtime (flash of unrendered diagram, no build-time output, external dependency at page load).
- Zero Starlight plugins in use.

### 1.3 Content-presentation gap

Only **7 of ~40 pages** use any custom component (all MDX). The rest are plain Markdown, and 8 of those are pure wall-of-text with *no* structuring element at all:

- `core-concepts/signals.md`, `glossary.md`, `index.md`, `technical/overview.md`, `technical/schema-driven-model.md`
- `core-concepts/architecture/data-model.md`, `architecture/signals-dpg.md`
- `community/contributing.md`

Eight more are prose + code fences only (aggregators, high-level-architecture, identity-and-auth, items-actions-events, networks-domains-instances, read-write-paths, adaptor-onboarding, aggregator-dpg).

---

## 2. Design direction

### 2.1 Typography — the DM superfamily

Adopt the full **DM family** (same superfamily as the already-branded DM Serif Display), self-hosted via `@fontsource` instead of the Google Fonts CDN (faster, no third-party request, GDPR-clean):

| Role | Face | Why |
|------|------|-----|
| Display (h1, h2, hero) | **DM Serif Display** 400 + 400-italic | Already the brand voice; italic unlocks pull-quotes/emphasis |
| Body & UI | **DM Sans** (variable) | Designed to pair with DM Serif Display; geometric warmth close to the Google Sans intent, but actually loadable |
| Code | **DM Mono** 400/500 | Completes one coherent family across prose, UI, and code blocks |

This replaces the phantom Google Sans stack (D4) and gives the site a type system that is deliberate rather than fallback-driven.

Type scale fixes:

- Restore the page-title design by targeting the element Starlight actually renders (`.content-panel h1`, or a `<PageTitle>` component override) — serif, brand blue (D3).
- Add a `--sl-text-*`-aligned scale so h1 > h2 > h3 steps are visibly distinct (h3s currently near body size).

### 2.2 Color — one palette, tokenized

Make `--dot-*` (the brand colors from bluedotseconomy.org, already defined with light/dark pairs in `custom.css`) the **single source of truth**:

```css
:root {
  /* existing --dot-* palette stays canonical */
  --bd-radius-lg: 1rem;      /* cards */
  --bd-radius-md: 0.75rem;   /* inner elements, quotes, tables */
  --bd-lift: -4px;           /* one hover lift everywhere */
  --bd-shadow-rest: 0 1px 4px rgb(0 0 0 / 0.06);
  --bd-shadow-hover: 0 12px 28px var(--glow, rgb(0 0 0 / 0.12));
  --bd-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- Align `--sl-color-accent` with `--dot-blue` (or vice versa) so Starlight UI and brand components share one blue.
- Refactor FeatureCard / StatCard / NavCard to derive gradients from `--dot-*` (`color-mix()` for the pastel from/to stops) instead of six hardcoded hex blocks per component.
- Replace BeforeAfter/JourneyQuote raw HSLs with two new semantic tokens: `--bd-before` (warm red) and `--bd-after` (green tied to `--dot-green`).

### 2.3 Signature element — the dot thread

One motif, used with restraint, everywhere it encodes meaning:

- **Timeline nodes** (PhaseTimeline) become brand dots — filled circle in `--dot-blue`.
- **Section h2 markers**: a small dot before each h2 in brand blue (replaces nothing — adds a quiet, ownable rhythm down every page).
- **Hero**: the existing four floating circles become a subtle animated "signals appearing on a map" moment — dots fade/scale in on load, gentle ambient drift, `prefers-reduced-motion` → static. This is the one orchestrated animation on the site.
- **List markers** inside custom components (PhaseTimeline's `→` bullets) unify on the dot.

Everything else quiets down: hover lifts normalize to one value, glow shadows soften, and DotCard adopts the same shadow language as its siblings.

---

## 3. Frameworks & plugins to introduce

| Addition | What it does | Effort |
|----------|--------------|--------|
| `@fontsource/dm-sans`, `@fontsource/dm-mono`, `@fontsource/dm-serif-display` | Self-hosted fonts, replaces Google Fonts CDN `<link>` | S |
| `@lucide/astro` | Single icon source; delete 4 copies of pasted SVG paths; unlocks the full icon set for future components | S |
| `starlight-links-validator` | Build-time internal-link checking — catches the `/bluedots-docs` base-path mistakes this repo is prone to | S |
| `starlight-image-zoom` | Click-to-zoom on architecture diagrams | S |
| `rehype-mermaid` (build-time, replaces CDN script) | Diagrams render at build → no runtime flash, no jsDelivr dependency, themeable output | M |
| Expressive Code config (built into Starlight, currently untouched) | Brand-matched code theme, file-name titles, line highlighting, copy-button styling across all installation/API pages | S |
| *(optional)* `starlight-sidebar-topics` | Splits the long single sidebar into topic tabs (Docs / Guides / Explore / Community) if the nav keeps growing | M |

Explicitly **not** recommended: a component framework (React/Vue islands), Tailwind, or a design-system dependency — the site's 9 Astro components are the right weight; they need consolidation, not replacement.

---

## 4. Phased execution plan

### Phase 1 — Foundation (tokens + type) *[≈ half day]*

1. Add `@fontsource` packages; wire DM Sans (body), DM Mono (code), DM Serif Display + italic (display) into `custom.css`; delete Google Fonts `<link>` from `astro.config.mjs` and the phantom Google Sans stack (D4).
2. Add the `--bd-*` token block (radius, lift, shadows, spring, before/after semantics) to `custom.css`.
3. Fix the dead h1 rule by targeting Starlight's real title element (D3); verify on light + dark.
4. Reconcile the three blues: point `--sl-color-accent` at the `--dot-blue` pair (D5 root cause).
5. Fix logo asset drift — use the SVG everywhere (D6).

**Acceptance:** every page shows serif brand-blue titles; body renders DM Sans on a machine with no local fonts; one blue in devtools computed styles.

### Phase 2 — Component system consolidation *[≈ 1 day]*

1. Fix D1 (`.sc--accent` dark mode) and D2/D5 (`not-content` on DotGrid; audit JourneyQuote/BeforeAfter for the same leak).
2. Refactor FeatureCard, StatCard, NavCard to consume `--dot-*` + `--bd-*` tokens; delete per-component hex blocks. Derive gradient stops with `color-mix(in oklab, var(--dot-x) 12%, var(--sl-color-bg))` so light/dark come free.
3. Normalize: radius `--bd-radius-lg`, hover lift `--bd-lift`, one shadow pair, one spring curve. DotCard joins the family (keeps its left accent border as its distinguishing feature).
4. Swap pasted SVG paths for `@lucide/astro` imports in all 4 icon-bearing components.
5. Add `@media (prefers-reduced-motion: reduce)` guards and `:focus-visible` rings (2px `--dot-blue` offset ring) to every interactive component.
6. Merge StatGrid + DotGrid into one `Grid.astro` (props: `minWidth`, `cols`); both current names can re-export it to avoid touching content pages.
7. Delete the redundant `accent` StatCard variant (alias to `blue`).

**Acceptance:** components share computed radius/lift/shadow in devtools; dark-mode Economics/Pilots pages show no pastel card; keyboard Tab shows visible focus on every NavCard.

### Phase 3 — Starlight power-ups *[≈ half day]*

1. Expressive Code config: brand-tint the code-block frames, enable file-name titles and line-highlight markers; apply DM Mono. Sweep installation + API pages to add `title="..."` and highlight annotations to key fences.
2. Replace the CDN mermaid script with `rehype-mermaid` build-time rendering; restyle diagram palette to `--dot-*` colors.
3. Add `starlight-links-validator` (CI catches broken `/bluedots-docs/...` links) and `starlight-image-zoom`.

**Acceptance:** `pnpm build` fails on a deliberately broken internal link; diagrams render with no flash on a throttled connection.

### Phase 4 — Signature moments *[≈ half day]*

1. Hero: dots animate in on load (stagger + drift ≤ 6px amplitude), static under reduced motion; verify the near-black dot's contrast on light background.
2. h2 dot markers site-wide via `custom.css` (`h2::before` inside content, skipping `.not-content`).
3. PhaseTimeline: dot nodes + `--dot-blue` line; bullets switch from `→` to dots.

**Acceptance:** hero animation runs once, respects reduced-motion; markers render on .md and .mdx pages alike.

### Phase 5 — Content presentation upgrades *[≈ 1–2 days, can ship incrementally]*

Highest-leverage page conversions (`.md` → `.mdx` + components), in order:

| Page | Upgrade |
|------|---------|
| `core-concepts/glossary.md` | Definition-card grid grouped by Domain / Platform / Technical; each term gets a dot-colored eyebrow. The 65-line prose list becomes scannable |
| `core-concepts/index.md` | NavCard grid to the five concept pages (mirrors homepage pattern) |
| `core-concepts/signals.md` | StatGrid for the "two generated fields"; aside callout for the consent principle |
| `core-concepts/architecture/data-model.md` | Real table + mermaid ER-style diagram of item/action/event |
| `core-concepts/architecture/high-level-architecture.md` | Build-time mermaid architecture diagram (currently prose-only) |
| `core-concepts/technical/schema-driven-model.md` | Code-fence examples with Expressive Code titles; BeforeAfter for "freeform vs schema-typed" |
| `guides/adaptor-onboarding.md` | PhaseTimeline (it is literally a sequence of onboarding steps) |
| `community/contributing.md` | Steps component (Starlight built-in) for the PR workflow |

Also: add `description` frontmatter where missing (SEO + link previews), and Starlight `<Steps>` for installation pages.

### Phase 6 — QA sweep *[≈ half day]*

- Light/dark screenshot pass over every template type (splash, MDX component pages, plain prose, code-heavy guides).
- Mobile (375px) pass: card grids, BeforeAfter table overflow, sidebar behavior.
- Keyboard-only navigation pass; axe/Lighthouse a11y run (target ≥ 95).
- `pnpm build && pnpm preview` — verify all fixes survive the production build with the `/bluedots-docs` base path.

---

## 5. Risks & notes

- **Starlight internals:** D3's fix depends on Starlight's title markup (`.content-panel h1`); pin the selector with a comment and re-verify on Starlight upgrades. A `PageTitle` component override is the more durable option if the CSS feels fragile.
- **`color-mix()` support** is universal in evergreen browsers; the current hardcoded pastels can remain as fallback values if older-browser support matters.
- **Branch:** prior design work lives on `docs/paper-alignment`; this plan targets `main` — cherry-pick or rebase that branch first to avoid divergence.
- Everything in Phases 1–4 is CSS/component-internal — zero content-page edits, so it can ship as one PR without touching authors' Markdown.

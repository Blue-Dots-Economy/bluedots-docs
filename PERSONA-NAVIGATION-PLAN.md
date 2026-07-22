# Blue Dots Docs — Stakeholder Navigation Plan

A plan to add persona-based content navigation (developers, implementers, aggregator organisations, program/policy stakeholders) **without changing the existing design, sidebar structure, or any current page**. Grounded in a research pass across major docs ecosystems (Kubernetes, Microsoft Learn, Stripe, Temporal, GOV.UK/GDS), UX research (Nielsen Norman Group, Diátaxis), and Blue Dots' DPG peers (DHIS2, MOSIP, Sunbird, Beckn).

---

## 1. Research findings that shape this plan

### 1.1 What the evidence says

| Finding | Source | Consequence for this plan |
|---|---|---|
| Audience-based **primary** navigation fails: users identify with multiple/no groups, noun labels are ambiguous, forced self-identification breaks task mindset, and overlapping content forces duplication | [NN/g](https://www.nngroup.com/articles/audience-based-navigation/), [GDS](https://insidegovuk.blog.gov.uk/2014/07/15/improving-gov-uks-navigation/) (Directgov abandoned audience nav) | Personas become a **secondary, additive layer**; the existing topic sidebar stays primary and untouched |
| Entry points phrased as **activities/verbs**, not identity nouns, sidestep self-identification | Kubernetes home ("Try", "Set up", "Learn how to use"), DHIS2 ("Use / Implement / Develop / Manage") | Hub labels are jobs: *Build & integrate*, *Deploy for a district* — not "Developers", "Adaptors" |
| Persona pages must be **link hubs, not forked content** — duplication created maintenance debt at Temporal and content drift at DHIS2 | [Temporal IA blog](https://temporal.io/blog/docs-info-arch-2021), DHIS2 community complaints | Hubs contain zero duplicated content; every step links to an existing page |
| Ordered journeys over existing pages work best with numbered steps, a standalone journey page, and visible "step N of M" context | [GOV.UK step-by-step pattern](https://design-system.service.gov.uk/patterns/step-by-step-navigation/), [Microsoft Learn paths](https://learn.microsoft.com/en-us/training/support/learn-content-types) | Each hub shows a numbered path; member pages get path-aware prev/next |
| Audience splits only work when segments are **mutually exclusive and self-evident** — Stripe's code/no-code, Beckn's BAP/BPP network roles | [Stripe teardown](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/), [Beckn docs](https://developers.becknprotocol.io/) | Where possible, describe personas via Blue Dots' own architecture roles (run a DPG / onboard participants / evaluate outcomes) |
| Diátaxis: audience layering above a content-type IA is legitimate **only when audiences genuinely diverge** | [diataxis.fr](https://diataxis.fr/complex-hierarchies/) | Four hubs only; no per-persona sub-sites |

### 1.2 Starlight 0.36 mechanism audit

| Mechanism | Compatible? | Structural impact | Verdict |
|---|---|---|---|
| `starlight-sidebar-topics` plugin (persona sidebar tabs) | ❌ current releases need Starlight ≥ 0.38; only an old 0.6.2 line installs | **Yes** — splits the single sidebar into per-topic sidebars | **Rejected** (also violates the "structure unchanged" constraint) |
| `starlight-utils` multi-sidebar | Installs, but **officially deprecated** | Yes | Rejected |
| Frontmatter `prev`/`next` overrides (custom link + label per page) | ✅ core feature | **No** — pure frontmatter | **Adopted** for guided paths |
| Sidebar `badge` on entries (`badge: { text: 'Dev', class: ... }`) | ✅ core feature | No — additive property | Adopted (light touch, optional) |
| Hub pages as ordinary `.mdx` docs with component grids | ✅ proven pattern in this repo (13 pages already do it) | No | **Adopted** — reuses NavCard, PhaseTimeline |
| `hero` frontmatter on non-splash pages | ✅ schema-valid on any page | No | Optional per-hub header flourish |

**Conclusion: no plugins.** Everything ships with existing components + frontmatter.

---

## 2. The four stakeholder journeys

Personas come from the site's own [Who Is This For](src/content/docs/overview/who-is-this-for.md) page, re-labelled as activities. Every step links to an **existing** page — nothing is duplicated, nothing moves.

### 2.1 🔵 Build & integrate — *backend & platform engineers (Developers)*

Basic knowledge first, then technical depth — exactly the sequencing the goal asks for.

| Step | Page (existing) | Why here |
|---|---|---|
| 1 | `overview/introduction` | Minimum shared context |
| 2 | `core-concepts/signals` | The core object model in plain language |
| 3 | `core-concepts/architecture/high-level-architecture` | The two verticals + shared datastores |
| 4 | `core-concepts/technical/schema-driven-model` | The design idea everything hangs on |
| 5 | `core-concepts/architecture/data-model` | Entities + ER diagram |
| 6 | `core-concepts/technical/read-write-paths` | How data actually flows |
| 7 | `guides/installation/local-stack` | Hands on: run it locally |
| 8 | `guides/installation/signals-dpg` | Stand up the first DPG |
| 9 | `guides/api-reference` | Build against it |
| Extras | `identity-and-auth`, `tech-stack`, `cicd-and-builds`, `configuration` | Linked as a "go deeper" NavCard grid, not path steps |

### 2.2 🟢 Deploy for a district — *adaptors & implementers*

1. `overview/introduction` → 2. `overview/blue-dots-as-a-dpg` → 3. `guides/adaptor-onboarding` (already has the PhaseTimeline) → 4. `guides/installation/prerequisites` → 5. `guides/installation/local-stack` → 6. `guides/deployment` → 7. `guides/district-activation`.

### 2.3 🟣 Onboard participants — *aggregator organisations*

1. `overview/introduction` → 2. `core-concepts/aggregators` → 3. `core-concepts/architecture/aggregator-dpg` → 4. `guides/installation/aggregator-dpg` → 5. `guides/configuration`.

### 2.4 🟠 Evaluate impact — *program & policy stakeholders*

1. `overview/introduction` → 2. `overview/paradox-of-proximity` → 3. `explore/use-cases` → 4. `explore/pilots` → 5. `explore/economics` → 6. `explore/beyond-livelihoods`.

Persona → color mapping reuses the existing `--dot-*` palette (blue/green/purple/orange), so the visual language stays inside the current design system.

---

## 3. Implementation spec

### 3.1 Four hub pages (new files, additive only)

`src/content/docs/start/{build,deploy,onboard,evaluate}.mdx` — each ~1 screen:

1. One-paragraph "this path is for you if…" (verb-first, architecture-role phrasing).
2. **`PhaseTimeline`** rendering the numbered path (component already supports number/title/focus; `weeks` is optional). Each `focus` line ends with the link to the page — or steps become linked titles (small, optional PhaseTimeline enhancement: allow `href` per phase, rendered as a link on the title; ~10 lines, backward-compatible).
3. A **`NavCard`/`CardGrid`** "go deeper" section for the persona's non-path references.
4. Closing line: "Prefer browsing? The full sidebar covers everything" — the NN/g anti-lock-in requirement.

Frontmatter: `title`, `description`, `prev: false`, `next: {link: <step 1>, label: "Start the path"}`.

```
┌────────────────────────────────────────────┐
│ Build & integrate                          │
│ For engineers running, extending or       │
│ integrating the Signals & Aggregator DPGs │
│                                            │
│ ① Introduction ──────────── 5 min          │
│ │  Minimum shared context → read           │
│ ② Signals (Blue Dots) ─────────            │
│ │  ...                                     │
│ ⑨ API Reference                            │
│                                            │
│ Go deeper: [Identity&Auth] [Tech Stack]    │
│            [CI/CD] [Configuration]         │
└────────────────────────────────────────────┘
```

### 3.2 Sidebar: one additive group

CLAUDE.md requires every page to have a sidebar entry. Add **one** group at the top of the sidebar array in `astro.config.mjs`:

```js
{
  label: 'Start Here',
  items: [
    { label: 'Build & integrate', slug: 'start/build' },
    { label: 'Deploy for a district', slug: 'start/deploy' },
    { label: 'Onboard participants', slug: 'start/onboard' },
    { label: 'Evaluate impact', slug: 'start/evaluate' },
  ],
},
```

This is the only sidebar edit — purely additive; all existing groups, ordering, and slugs stay byte-identical.

### 3.3 Homepage entry cards

`index.mdx` already has a "Start here" NavCard section (Overview / Core Concepts / Guides / Explore). Add a second `CardGrid` above it titled **"Find your path"** with 4 NavCards (one per hub, persona colors). Existing cards remain. NavCard needs 2–3 new icons in its union (e.g. `code`, `rocket`, `users`, `bar-chart` from `@lucide/astro`) — additive prop values only.

### 3.4 Who Is This For — becomes the persona index

Keep the page (slug and sidebar position unchanged); each of its four sections gains a one-line "Follow the full path →" link to the matching hub. No removals.

### 3.5 Guided-path prev/next rewiring (frontmatter only)

`prev`/`next` is single-valued per page, so **only pages belonging to exactly one path** get rewired (GDS rule: sequence only where order genuinely helps):

- Developer path steps 4–9 (`schema-driven-model`, `data-model`, `read-write-paths`, `local-stack`, `signals-dpg`, `api-reference`): next-labels like `next: { link: …, label: "Path 5 of 9: Data Model" }`.
- Evaluate path steps 3–6 (`use-cases` → `pilots` → `economics` → `beyond-livelihoods`) — these already read as a sequence.
- **Shared pages** (`introduction`, `prerequisites`, `local-stack` is in two paths — resolve: keep it rewired for the Developer path only, Deploy path relies on its hub) keep default sidebar-derived prev/next.

### 3.6 Optional polish (phase 2, skippable)

- Sidebar `badge: { text: 'Dev', class: 'badge-dev' }` on 3–4 developer-only entries (API Reference, CI/CD, Read & Write Paths), styled from `--dot-*` tokens. Use sparingly — badges on everything = noise.
- A tiny `PathContext.astro` banner ("Part of the Build & integrate path — step 5 of 9") for path-member pages, driven by one shared array in `src/data/paths.ts`. This is the GOV.UK "journey visible on member pages" refinement; ship only if the frontmatter version proves insufficient.
- `hero` frontmatter block on hubs for a distinct header (works on non-splash pages, sidebar + TOC intact).

---

## 4. What this plan deliberately avoids (anti-patterns from research)

- **No sidebar restructuring / topic tabs** — plugin incompatible with Starlight 0.36, violates the constraint, and portal lock-in is NN/g failure mode #5.
- **No duplicated content per persona** — Temporal/DHIS2 maintenance-debt lesson; hubs are pure link layers.
- **No identity-noun labels** — "Developers" appears in descriptions, never as the navigation label.
- **No forced persona choice** — homepage keeps the topic cards; sidebar keeps every page reachable; hubs link back to browsing.

---

## 5. Execution phases

| Phase | Work | Files | Effort |
|---|---|---|---|
| 1 | Four hub pages + sidebar group + PhaseTimeline `href` prop | 4 new `.mdx`, `astro.config.mjs`, `PhaseTimeline.astro` | ~half day |
| 2 | Homepage "Find your path" cards + NavCard icon additions | `index.mdx`, `NavCard.astro` | ~1 hour |
| 3 | Who-is-this-for hub links + prev/next frontmatter on single-path pages (~10 pages) | frontmatter edits only | ~1 hour |
| 4 (optional) | Badges + PathContext banner | `custom.css`, 1 new component | ~2 hours |

**Acceptance criteria**
- `pnpm build` passes with links-validator green (all hub links verified at build time).
- Existing sidebar renders byte-identical except the one new "Start Here" group.
- No existing page moved, renamed, or content-changed beyond frontmatter/one-line hub links.
- Each hub reachable in one click from homepage and sidebar; each path walkable start→finish via next-links or hub.
- Light/dark/mobile pass on hub pages (components already responsive).

---

## 6. Sources

[NN/g — Audience-Based Navigation](https://www.nngroup.com/articles/audience-based-navigation/) · [Temporal docs IA](https://temporal.io/blog/docs-info-arch-2021) · [Diátaxis — complex hierarchies](https://diataxis.fr/complex-hierarchies/) · [GOV.UK step-by-step pattern](https://design-system.service.gov.uk/patterns/step-by-step-navigation/) · [GDS on navigation](https://insidegovuk.blog.gov.uk/2014/07/15/improving-gov-uks-navigation/) · [Microsoft Learn content types](https://learn.microsoft.com/en-us/training/support/learn-content-types) · [Kubernetes docs home](https://kubernetes.io/docs/home/) · [DHIS2](https://docs.dhis2.org/) · [MOSIP](https://docs.mosip.io/1.2.0) · [Beckn](https://developers.becknprotocol.io/) · [Sunbird](https://project-sunbird.github.io/developer-docs/) · [Stripe DX teardown](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/) · [Starlight frontmatter reference](https://starlight.astro.build/reference/frontmatter/) · [Starlight sidebar guide](https://starlight.astro.build/guides/sidebar/) · [starlight-sidebar-topics](https://github.com/HiDeoo/starlight-sidebar-topics) (evaluated, rejected)

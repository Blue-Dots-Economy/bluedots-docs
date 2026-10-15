# CLAUDE.md

## Architecture

This is an [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) documentation site, deployed to GitHub Pages via `.github/workflows/deploy.yml` (uses `withastro/action`), served at the custom domain `docs.bluedotseconomy.org`.

**Key files:**

- `astro.config.mjs` — single source of truth for the sidebar navigation (information architecture). Every page must have a matching `slug` entry here before it becomes reachable from the nav.
- `src/content.config.ts` — registers the `docs` collection using Starlight's loader/schema; no custom fields added yet.
- `src/styles/custom.css` — theme accent overrides plus the dot palette (`--dot-<colour>` for light and dark, `.dot-name--<colour>`). `DotCard.astro` holds the per-colour card rules; a new colour needs both files and a `public/dots/dot-<colour>.svg`.
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

Docker alternative (local dev only — Pages deploy is unaffected): `docker compose up --build` for the dev server on `127.0.0.1:4321`; `docker compose run --rm --build validate` for build + `check:links`. `pnpm check` (astro check) is not in `validate` yet — it has pre-existing type errors in `astro.config.mjs` and `src/components/ApiPageTitle.astro`.

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
| Time to create a blue dot (2–3 minutes) | `overview/the-blue-dots-approach` |
| PwD campaign — Feb 2026, 1 lakh+ needs in 10 days, ₹10 per interaction | `explore/beyond-livelihoods` (Purple Dot section) |
| Domains, their participant types and their status | `core-concepts/networks-domains-instances` |

Terminology: use **MSME**, not SMB, outside the Brown Dot sector naming.

## Naming: platform, blue dot, domain, colour

- **Blue Dots** (plural, capitalised) is the platform and programme.
- **a blue dot** (lower case) is the generic thing a person, organisation or service publishes: a short listing that says what they need or offer, placed where they are. Explain the name once where it is introduced: on a map app, your own location is shown as a blue dot; a listing does the same for you, so people nearby can find you. Never shorten it to "a dot".
- **domain** is a sector: jobs, education, disability, tourism and so on. Use "domain", not "network", in prose. The code calls a domain a *network* (`network.json`, `NETWORK_ID`, `network_id`, `/network/` API paths); keep those identifiers as they are and, on technical pages, say once that the code calls it a network.
- **participant type** is a role inside a domain (seeker, provider, student, tutor). The code calls these *domains* (the `domains` array in `network.json`, `SERVED_DOMAINS`); keep the identifiers and say once what they mean. Never call a participant type a "domain" in prose.
- **Colour names the domain.** Each domain gives its blue dots a colour: Yellow Dot (education), Purple Dot (disability) and the rest. Jobs keeps the original blue. Where jobs must be told apart from the generic term, write "the Blue Dot (jobs) domain" or "the jobs domain". Lifecycle states are colour-neutral ("Verified", "Live").
- **Minimum standard:** the profile schemas in a domain's `network.json` are the *minimum standard* for a dot of that colour. Link it wherever a domain's fields are described: `https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/<folder>/network.json` (folders `blue_dot`, `yellow_dot`, `purple_dot`, `orange_dot`). Pink, Green and Brown have none yet; say so.
- Product UI strings are per domain and are quoted as they appear.

Blue Dots is not a jobs product. Jobs (Blue) is the first live domain and the source of all pilot evidence; the pilot pages (`explore/pilots`, `explore/learnings`, `explore/economics`) stay as the factual record of it.

| Colour | Sector | Status (use these labels) |
|---|---|---|
| Blue | Livelihoods for youth (jobs) | Live, piloted |
| Yellow | Education avenues and services | Domain defined |
| Purple | Economic participation of persons with disabilities | Domain defined |
| Orange | Tourism | Domain defined |
| Pink | Women's labour-force participation | Possible |
| Green | Farming efficiency | Possible |
| Brown | Growth for SMBs | Possible |

"Domain defined" means a minimum standard (`network.json`) exists in Signals-DPG `examples/schemas/`. Scenarios for "Possible" dots use "could" or "for example"; make no outcome claims for any dot except Blue. On the public site, name domains by colour and sector only — no partner brand ids, internal ids or unpublished district names.

### Scenario bank

Generic pages (landing, Overview, top-level Core Concepts, Use Cases) name at least one non-Blue dot and draw examples from this table rather than inventing new ones. Pages that document the real `blue_dot` schema keep it and say other domains work the same way.

| Dot | Scenario | Who agrees before contact |
|---|---|---|
| Blue | A young person registers by phone call in their language. A nearby employer with a vacancy sees the profile and sends an interview invite. A skilling centre has verified the profile. | The young person accepts before their number is shared. |
| Yellow | A Class 12 commerce student asks for help with accounts. A tutor who teaches Class 12 commerce and will travel up to 5 km sends a connect request. A school or NGO helps students sign up. (Use subject tutoring or career counselling — tutors can't offer admission guidance in the schema.) | The student accepts. |
| Purple | A person with a locomotor disability asks for a wheelchair and for help finding work. Providers in the same city who serve that disability see the request: an NGO that gives devices, and a training centre. A disabled persons' organisation (DPO) helps them register. (Matched by city, not distance.) | Either side sends a connect request; the other accepts. |
| Orange | A homestay owner or a folk artist lists what they offer, with area, languages and price band. A tourism body verifies the listing. Visitors find it in the app and call the number shown. | Not needed — the listing and number are public on purpose. |
| Pink | A woman who stitches blouses at home lists her work; nearby boutiques see it; her self-help group (SHG) vouches for her. Or: a woman who could work if she had childcare finds a crèche near home. | She accepts. |
| Green | A farmer needs a tractor for two days or a soil test. A nearby custom hiring centre or soil-testing lab sees the request. A farmer producer organisation (FPO) helps farmers sign up. | The farmer accepts. |
| Brown | A kirana shop needs a regular supplier of packaged atta. Nearby wholesalers see the request. A trade association helps members sign up. | The shop accepts. |

Organisations that sign people up and check their details: skilling centres and ITIs (Blue); schools, colleges and education NGOs (Yellow); DPOs and disability NGOs (Purple); tourism bodies (Orange); SHGs (Pink); FPOs and KVKs (Green); trade associations (Brown); government departments (any dot). Use this list instead of a jobs-only one.

## Plain language

Write for a reader who is not technical: a block officer, an NGO worker, a Class 8 reader. Scope: R1–R8 everywhere; R9–R10 in Overview, Explore and Start Here. Exempt: fenced code, YAML, voice-prompt text, component names and imports, `api/` pages, attributed quotes, quoted UI strings, organisation names. Page titles and frontmatter `description` are in scope.

1. **Say literally what happens.** "rails" → "the same open-source software and data rules"; "digitally dark" / "invisible" → "not listed anywhere online"; "surfaced" → "found"; "closes the gap" → "helps them find each other"; "signal of intent" → "a short listing that says what someone needs or offers". One literal UPI comparison on the DPG page is fine.
2. **No rhetorical flips** ("not X, but Y", "isn't just X", "Not X. Not Y. Not Z."). State the positive claim.
3. **No aphorisms, slogans or rhythmic triads.** Real lists of three are fine.
4. **Concrete nouns.** Avoid *discoverability, local intelligence, density, proximity value, demand and supply* unless defined on the page. Say who, what and where.
5. **Paragraphs** at most 4 sentences or about 80 words, at most one bold phrase. **At most one em dash per paragraph.**
6. **Headings** in sentence case, saying what the section contains — not headline style ("Local discovery, solved").
7. **Numbers:** `₹87,500 crore` (never `cr`); lakh/crore for Indian figures with the international figure on first use for counts ("1 lakh (100,000)"), but not for the ₹87,500 crore headline; don't mix million and lakh on a page; `US$ 3 trillion`, not `$3 Tn`; "under 2 days" in prose (symbols are fine in StatCards). Figures follow the owner table above.
8. **Quotes are real or labelled.** A first-person quote has a source or is labelled "Example". "Possible" dots get no outcome quotes.
9. **Reading level:** at most 3 sentences over 25 words per page. Expand ITI, SHG, FPO, DPO, PwD, MSME, KVK, DPI, DPG on first use per page. Indian/British spelling (colour, organisation, programme); don't italicise Indian words.
10. **Active voice** ("The coordinator checks the profile"). Technical pages may use the passive for system behaviour.

Don't over-correct: "paradox of proximity" is the programme's named concept (define it once, plainly); keep literal consent statements ("Phone numbers are shared only after both sides agree"); keep "by design" / "deliberately" where a reason follows.

`pnpm check:style` enforces the mechanical part (Tier 1 phrases must be absent; `--review` lists Tier 2 phrases for a person to judge). Exceptions go in `.style-allow` with a reason.

## Before merging

CI builds only on push to `main` — pull requests are not built. Run `pnpm build && pnpm check:links` locally before every merge; a broken build on `main` leaves the site silently on the old version.

## Guided paths

`Start Here` hubs list their steps as `PhaseTimeline` phases; member pages carry `Path N of M` labels in `prev`/`next` frontmatter.

Two constraints:

- **A page in two paths can only carry one chain.** `guides/installation/local-stack` is step 9 of Build and step 5 of Deploy; its frontmatter serves Build. Do not add a second chain — resolve it in the hub instead.
- **Inserting a step renumbers every label after it.** Keep the hub list and the labels in sync in the same commit.

`starlight-links-validator` cannot see `PhaseTimeline` hrefs (they sit in a JSX expression). Run `pnpm check:paths` after `pnpm build` when you change a hub.


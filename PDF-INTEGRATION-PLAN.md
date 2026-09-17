# Integration plan — "Answers to questions on Blue Dots initiative" (adopter guide PDF)

**Source:** `/Users/mahesh/Code/Blue-Dots/Answers to questions on Blue Dots initiative.pdf`
(12 pages, 5 parts: Executive Summary · The Blue Dots Lifecycle · The Lifecycle in Practice ·
What's Already Built · Learnings from Lived Experiences)

**Target:** `bluedots-docs` — Astro + Starlight, 46 content pages, live at `docs.bluedotseconomy.org`.
Live sitemap verified against the repo on 2026-09-16 via Chrome DevTools: **identical**, no drift.

**Secondary target:** `signals-dpg/examples/schemas/blue_dot/network.json` (one schema addition, see §6).

---

## 1. Decisions already taken

| # | Decision | Chosen |
|---|---|---|
| 1 | Terminology clash — PDF "adopter" / "anchor adopter" vs docs "adaptor" | **Keep `adaptor`.** New pages use existing docs vocabulary. Add `anchor adopter` and `adopter` as glossary aliases pointing at *adaptor*. No renames, no slug changes, no redirects. |
| 2 | Metric conflicts with the live `/explore/pilots/` page | **PDF wins.** Update the pilots page and every downstream repetition. See §5 for the full reconciliation table. |
| 3 | Service Provider as a third participant type (PDF §4.2) — absent from `blue_dot/network.json` | **Document as available *and* add the schema.** Docs and code ship together. |
| 4 | "Learnings from Lived Experiences" (PDF pp. 7–12) | **New page** `/explore/learnings/`, sibling of Pilots. |

---

## 2. What is genuinely new vs already covered

Mapping every PDF section onto the existing IA.

| PDF section | Status in docs today | Action |
|---|---|---|
| Executive Summary | Covered by `overview/introduction.md`, `index.mdx` | **Amend** — add the "configure what exists, don't build" framing + the three participant types |
| The Blue Dots Lifecycle (7 steps) | **No home anywhere.** `the-blue-dots-approach.md` has a 5-step *signal* lifecycle (create → store → discover → act → feed back), which is the data path, not the participant journey | **New page** `core-concepts/blue-dot-lifecycle` |
| Aggregator definition + who qualifies (colleges, skilling centres, MSME associations, PIAs, employment exchanges) | `core-concepts/aggregators.md` has the concept, not the taxonomy | **Amend** |
| Assisted vs self route | Nowhere. Code has it (`aggregator-dpg/apps/api/src/services/registration-mode/`) | **New section** on the lifecycle page + amend `aggregators.md` |
| Four intake methods (offline camp, bulk upload, outbound campaign, inbound QR) | Only "bulk upload" and "registration links" mentioned in `aggregators.md` | **Amend** `aggregators.md` |
| Two self-service channels (AI Voice Agent primary, Webapp fallback) | Voice mentioned in 10 places, never explained as a channel with a fallback | **New section** on the lifecycle page |
| Three verification checks (structured / completed / consented) + human review step | Consent covered in `signals.mdx`; the three-check gate is undocumented | **New section** on the lifecycle page |
| Lifecycle in Practice — Dharwad & Ghaziabad walkthroughs | `explore/pilots.mdx` has outcomes, not the step-by-step | **Amend** `pilots.mdx` |
| What's Already Built — two DPGs + supporting tools | `overview/blue-dots-as-a-dpg.md` §"The two DPGs" | **Amend** — add the lifecycle-mapping table and the supporting-tools list |
| Participant profiles (3 types, Who I am / What I want / What I have) | **Absent.** `data-model.mdx` is table-level; `schema-driven-model.mdx` is mechanism-level | **New page** `core-concepts/participant-profiles` |
| AI Voice Agent prompts as DPGs, platform-agnostic | **Absent** | **New page** `guides/voice-ai-prompts` |
| Deployment automation on AWS, adaptable to other clouds | Covered — `guides/deployment.md`, `guides/cicd-and-builds.md`, `architecture/infrastructure.md` | **No change** (link from new pages) |
| Possible Customisations (branding, config, dashboards, landing page) | `guides/configuration.md` covers env/secrets only | **New page** `guides/customisation` |
| Learnings from Lived Experiences (9 findings) | **Absent** | **New page** `explore/learnings` |
| What Is Changing (5 shifts) | **Absent** | Bottom half of `explore/learnings` |

---

## 3. New pages (5)

### 3.1 `core-concepts/blue-dot-lifecycle.mdx` — "The Blue Dot Lifecycle"

The anchor page for the whole PDF. Everything else links back here.

- **Sidebar:** Core Concepts, immediately after *Signals (Blue Dots)*. `sidebar.order: 2`; bump
  Aggregators → 3, Networks/Domains/Instances → 4, Items/Actions/Events → 5.
- **Frame:** the seven steps every participant walks, whichever type they are, with an explicit
  **who does this** column (adaptor / aggregator / participant / system) — the PDF's key structural
  idea, currently missing from the docs.
- **Outline:**
  1. *To Become a Blue Dot* — who is in scope, and picking the aggregator with local reach & trust.
  2. *Route in* — assisted vs self. Per-campaign, per-geography **configuration**, not a build.
     Ground it in `aggregator.registration_modes` in `aggregator.config.yaml` and the
     `account_only` / `account_and_profile` submission shapes.
  3. *Data collection (assisted)* — the four intake methods, each mapped to what the Aggregator DPG
     actually ships: offline camp, bulk upload (CSV → async worker), outbound campaign
     (WhatsApp / voice bot), inbound campaign (QR → registration link).
  4. *Profile completion (self)* — AI Voice Agent primary, Blue Dot Webapp fallback, both writing
     the same Signals item. Link to §3.4 (prompts) and `participant-profiles`.
  5. *Verification checks* — structured / completed / consented. Built in, not custom.
  6. *Blue Dot Verified* — the **one human-in-the-loop step, by design**. Reviewed on the
     Aggregator DPG. This line is worth quoting near-verbatim; it is the clearest statement of the
     trust model anywhere in the source material.
  7. *Live Blue Dot* — Discover and Connect. **Contact details are shared only after both parties
     agree to connect** — a consent claim that belongs next to the one in `signals.mdx`.
- **Components:** `PhaseTimeline` for the seven steps (already used in `district-activation.mdx`
  and `adaptor-onboarding.mdx`); a Mermaid `<pre class="mermaid">` block for the branch at step 2.
- **Reuse the PDF's lifecycle diagram?** It is a raster in the PDF. Prefer re-authoring as Excalidraw
  under `src/assets/diagrams/` to match the existing convention (`aggregators-relationship.png`,
  `use-cases-common-pattern.png`, `cicd-pipeline.png`), each with the editable-source HTML comment.

### 3.2 `core-concepts/participant-profiles.mdx` — "Participant Profiles"

- **Sidebar:** Core Concepts, after the lifecycle page.
- **Content:** the three types — Job Seeker, Job Provider, Service Provider — each rendered through
  the shared three-part structure: **Who I am** (identity & contact) · **What I want** (need or
  opportunity) · **What I have** (location, capacity, skills, credentials).
- **Grounding:** map each part onto real fields from
  `signals-dpg/examples/schemas/blue_dot/network.json` — e.g. seeker *Who I am* = `name`, `age`,
  `gender`, `phone`, `location`; *What I want* = `natureOfJobsInterestedIn`,
  `nameOfJobRolesInterestedIn`, `otherHelpNeeded`; *What I have* = `workExperience`, `itiTrade`,
  `certificationDetails`. This turns a slide-level abstraction into something an adaptor can verify.
- **Close with:** "adjust or add fields without rebuilding the structure" → link
  `core-concepts/technical/schema-driven-model` and `guides/configuration`.
- **Depends on §6** (the `service_provider` domain must exist before this page claims it does).

### 3.3 `guides/customisation.md` — "Customisation & Branding"

- **Sidebar:** Guides, after *Configuration*. Renumber `sidebar.order` for API Guide / CI-CD /
  Deployment accordingly.
- **Four sections, straight from the PDF:**
  1. **Personalisation** — logo, colours, fonts, language. Ground in the per-network `brand.json`
     that already exists (`examples/schemas/blue_dot/brand.json`, and the `upsdm/` override showing
     a real sub-brand) and the per-network Keycloak login theme image noted in `release-notes.md`.
  2. **Configuration** — SMS gateway credentials, Voice AI phone number, admin alert/approval
     emails. Mostly a cross-link into `guides/configuration.md` rather than a duplicate.
  3. **Dashboards** — registration volume, **active vs at-risk** participants, discovery &
     connection rates. Ground in the `status_rules` (`new` / `active` / `at_risk` / `inactive`) and
     `dashboard_tiles` / `dashboard_buckets` already in `network.json`. The PDF's dashboard claim is
     directly backed by shipped config — say so.
  4. **Landing page** — a public programme page that links *through* to registration and discovery
     rather than replacing them.
- **Closing line (PDF, worth keeping):** none of these require touching Signals or Aggregator; they
  are configuration and presentation layers on top.

### 3.4 `guides/voice-ai-prompts.md` — "AI Voice Agent Prompts"

- **Sidebar:** Guides, after *Customisation*.
- **Content:** two ready-made prompt sets (job seeker, job provider), published as DPGs in their own
  right; **not tied to any voice platform** — usable with whichever Voice AI service the adaptor
  picks; plus the framework for selecting a Voice AI provider.
- **How a voice DPG connects:** service-auth + bulk create, `voice-dpg` Keycloak client — already
  documented in `identity-and-auth.md` and `keycloak-realm.md`. Cross-link rather than restate.
- ⚠️ **Blocked on a URL** — see §8 Q1. The PDF says "available at Blue Dots Github" and "a framework
  … is shared here" with no link. Page ships with the concepts; links land when the repo is named.

### 3.5 `explore/learnings.mdx` — "What We're Learning on the Ground"

- **Sidebar:** Explore, between *Pilots* and *The Economics of Local Discovery*.
- **Part A — nine findings** (headline stat + what it means, `StatGrid`/`StatCard` for the numbers):
  1. **Proximity** — 70% of applications within 15 km; women search ~2 bus stops, men across the
     district. Reinforces `paradox-of-proximity.mdx` with measured data rather than argument.
  2. **Needs beyond jobs** — skilling, counselling, internships, capital, skill proof, interview
     prep, placement, market access, schemes. Includes the Ghaziabad call where one respondent
     surfaced opportunities for four family members in six minutes.
  3. **Voice AI efficiency** — average Hindi call ~1 min 40 s; has moved from logging interest to
     completing applications on the call.
  4. **Demand exceeds talent** — Dharwad ~3 MSME jobs per newly trained electrician; Ghaziabad ~5
     machine-operator roles per fresher role. Targeted drives convert ~50% vs ~5% conventional.
  5. **Guidance gap** — ~80% of first-time graduates need four answers before applying (nearby?
     right fit? growth? fair pay?); counsellors are being Blue-Dotted so candidates reach someone
     they already trust.
  6. **Employer response** — 90% of MSMEs report open vacancies, ~half respond inside the 48 hours
     candidates expect; associations moving to Common Hiring Standards (named HR contact, two-day
     response commitment, AI-HR screening pilots).
  7. **Women's assurances** — ~75% of women will not proceed without clarity on safety, closeness to
     home, and amenities/shift timings. Feeds `explore/use-cases.mdx` §Women's workforce
     participation, which currently asserts the barrier without the evidence.
  8. **Service network** — 150+ providers mapped against 10+ youth needs and 8+ MSME needs; 100+
     counsellors, 15–20 ITIs, 8+ placement/staffing agencies.
  9. **Engagement innovations** — Fresher Premier League, Marketer Premier League, gig and
     entrepreneurship pushes.
- **Part B — five shifts in how the model is designed:** outbound calls → trusted inbound helpline
  (QR-backed); job matching → understanding the whole journey; demand signals shaping training and
  placement; employers becoming part of the solution; the local ecosystem working off one shared set
  of signals.
- **Tone:** this is field observation, not a shipped-capability claim. Open with a note saying so,
  and date the observation window — these numbers will move.

---

## 4. Edits to existing pages (10)

| File | Edit |
|---|---|
| `core-concepts/aggregators.md` | Add **"Who can be an aggregator"** — colleges, skilling centres, MSME associations, Project Implementation Agencies, employment exchanges — with the PDF's definition: *anyone connected to the Blue Dot who can verify their details and thereby drive trust in it*. That verification-as-trust framing is stronger than the current "organisation that onboards participants at scale" and should lead the page. Add **"Four intake methods"** (camp / bulk / outbound / inbound QR). Link to the lifecycle page. |
| `core-concepts/signals.mdx` | In *Consent is foundational*, add the connect-time rule: **personal contact details are shared only once both parties agree to connect**. In *Where signals come from*, link the four intake methods. |
| `overview/blue-dots-as-a-dpg.md` | In *The two DPGs*, add the PDF's DPG → lifecycle-step mapping table (Signals = steps 4, 5, 7; Aggregator = steps 3, 6, ongoing tracking). Add the supporting blocks: discovery & connection with location ranking, notifications (Email/SMS/WhatsApp), shared rulebook, setup automation, documentation. |
| `overview/introduction.md` | Add the executive-summary framing: an adaptor **configures what already exists** — participant types, onboarding routes, verification checks are pre-defined and cloud-deployable. The adaptor brings local knowledge and ecosystem; the DPGs bring the machinery. |
| `explore/pilots.mdx` | (a) Apply the metric corrections in §5. (b) Add **"The lifecycle in practice"** — the Dharwad ITI and Ghaziabad MSME walkthroughs, each as its own seven-step trace, cross-linked to the lifecycle page. These are the best worked examples in the source and currently have no home. (c) Update the closing source note to cite this PDF alongside the white paper. |
| `explore/use-cases.mdx` | Correct "discovery time cut from weeks to **under a day**" → **under two days** (contradicts `pilots.mdx` today, and the PDF). Correct "conversion above 50%" → "~50%, vs ~5% conventional". Add the 75%-of-women evidence to *Women's workforce participation*. |
| `guides/district-activation.mdx` | Add a *Related reading* entry for the lifecycle page. In *What does early activation look like?*, note that the route-in choice (assisted vs self) is made per campaign and per geography. |
| `guides/adaptor-onboarding.mdx` | Step 4 (*Add capture channels*) → link `guides/voice-ai-prompts`. Add a *Customisation* pointer after Step 5. Add two checklist items: branding/`brand.json` applied; route-in and intake method chosen per campaign. |
| `core-concepts/glossary.mdx` | New entries: **Blue Dot Verified**, **anchor adopter / adopter** (→ *adaptor*), **assisted route**, **self route**, **intake method**, **Service Provider**, **Blue Dot Webapp**, **AI Voice Agent**. |
| `community/roadmap.md` | Under *Next* / *Later*, reflect the PDF's direction-of-travel: inbound helpline over outbound calling, service-network expansion beyond placement, Common Hiring Standards. Keep it short — the detail lives on `explore/learnings`. |

---

## 5. Metric reconciliation (decision 2 — PDF wins)

### 5.1 Corrections

| Claim | Current in docs | Change to | Files |
|---|---|---|---|
| Targeted vs conventional placement conversion | `> 50%` vs `< 10%` at job fairs | **~50% vs ~5%** | `explore/pilots.mdx` (StatCard, *Outcomes*, `BeforeAfter` row), `explore/use-cases.mdx` |
| Discovery time | `< 2 days` (pilots) but `under a day` (use-cases) | **under two days**, both places | `explore/use-cases.mdx` |

The `< 10%` → `~5%` change makes the *gap* larger, not smaller — the corrected figure is the more
favourable one. Worth a one-line note in the PR so nobody reads it as a walk-back.

### 5.2 Not a conflict — do not "fix"

- **"2–3 minutes to become discoverable"** (pilots, index, `the-blue-dots-approach.md`) vs the PDF's
  **"average Hindi call ~1 min 40 s"**. Different measurements: time-to-capture-a-profile vs mean
  call duration. Keep the 2–3 min claim; add the 1:40 average on `explore/learnings` as measured
  telemetry. Flagged as §8 Q4 in case they are meant to be the same number.
- **"10,000+ openings from < 10% of SMBs"** — PDF says "under 10 percent of MSMEs". Same claim,
  SMB/MSME wording differs. Leave the docs' existing term.

### 5.3 New figures introduced (all land on `explore/learnings`, except where noted)

70% of applications within 15 km · women ~2 bus stops · avg Hindi call ~1 min 40 s · Dharwad ~3:1
MSME jobs per trained electrician · Ghaziabad ~5:1 machine-operator vs fresher roles · 90% of MSMEs
have open vacancies, ~50% respond within 48 h · ~75% of women require safety + proximity + amenities
clarity (**also** → `use-cases.mdx`) · ~80% of first-time graduates need four answers before applying
· 150+ providers mapped · 10+ youth needs, 8+ MSME needs · 100+ counsellors · 15–20 ITIs · 8+
placement/staffing agencies.

---

## 6. Code change — the Service Provider domain (decision 3)

`signals-dpg/examples/schemas/blue_dot/network.json` currently declares **two** domains:

| `id` | description | item schema |
|---|---|---|
| job seeker | "People looking for jobs." | `profile_1.0` |
| job provider | "Employers and recruiters posting jobs." | `job_posting_1.0` |

The PDF's third type has no schema. Add it so `core-concepts/participant-profiles` is true on the
day it publishes.

**Change:** add a `service_provider` domain with a `profile_1.0` item schema shaped like the
existing two:

- **Who I am** — org name, contact, location.
- **What I want** — the participants/needs it serves.
- **What I have** — services offered (counselling, upskilling, assessment, placement support),
  coverage area, capacity, credentials.
- Mirror the existing domain scaffolding: `status_rules` (`new` / `active` / `at_risk` /
  `inactive`), `minimum_cache_ttl_seconds`, `guardian_consent_required`, `profile_completion_prompt`,
  `card`, `dashboard_tiles`, plus `x-form-layout` sections so the Signals UI and the Aggregator's
  RJSF forms render it without code changes.

**Before writing it, verify (not yet checked):**

- whether `network.actions` needs a seeker↔service-provider action to make the domain discoverable,
  or whether existing actions already generalise;
- whether `aggregator-dpg/packages/network-config` or the RJSF schemas under
  `config/schemas/aggregator/` enumerate domains anywhere and need the same addition;
- whether any fixture, seed or test asserts a two-domain `blue_dot` network.

This is an **examples/** schema, so the blast radius is local setup and docs — not a production
migration. Ship it in the same PR as `participant-profiles`, or the docs briefly lie.

---

## 7. IA changes — `astro.config.mjs` and path renumbering

### 7.1 Sidebar entries (the config is the authoritative IA — nothing is reachable without this)

```js
// Core Concepts — after "Signals (Blue Dots)"
{ label: 'The Blue Dot Lifecycle', slug: 'core-concepts/blue-dot-lifecycle' },
{ label: 'Participant Profiles',   slug: 'core-concepts/participant-profiles' },

// Guides — after "Configuration"
{ label: 'Customisation & Branding', slug: 'guides/customisation' },
{ label: 'AI Voice Agent Prompts',   slug: 'guides/voice-ai-prompts' },

// Explore — between "Pilots" and "The Economics of Local Discovery"
{ label: "What We're Learning", slug: 'explore/learnings' },
```

### 7.2 Renumbering the Evaluate path (6 → 7 steps)

Inserting `explore/learnings` breaks the hand-maintained `prev`/`next` chain. All of these must
change together:

| File | Current | New |
|---|---|---|
| `start/evaluate.mdx` | `PhaseTimeline` with 6 phases | 7 phases — insert *What We're Learning* at 5, push Economics → 6, Dots Family → 7 |
| `explore/pilots.mdx` | `next` → `Path 5 of 6: The Economics…` | `next` → `Path 5 of 7: What We're Learning` |
| `explore/pilots.mdx` | `prev` → `Path 3 of 6: Use Cases` | `Path 3 of 7: Use Cases` |
| `explore/use-cases.mdx` | `next` → `Path 4 of 6: Pilots` | `Path 4 of 7: Pilots` |
| `explore/learnings.mdx` (new) | — | `prev` → `Path 4 of 7: Pilots`; `next` → `Path 6 of 7: The Economics…` |
| `explore/economics.mdx` | `prev` `Path 4 of 6: Pilots`, `next` `Path 6 of 6: The Dots Family` | `prev` → `Path 5 of 7: What We're Learning`; `next` → `Path 7 of 7: The Dots Family` |
| `explore/beyond-livelihoods.mdx` | `prev` → `Path 5 of 6: The Economics…` | `Path 6 of 7: The Economics…` |
| `explore/learnings.mdx` | — | `sidebar.order: 3`; bump Economics → 4, Beyond Livelihoods → 5 |

The Core Concepts and Guides insertions do **not** touch a `Path N of 9` chain (those run through
`schema-driven-model` → `data-model` → `read-write-paths` → installation → api-reference, none of
which move). Confirm with the grep in §9 anyway.

### 7.3 Also update the browse-by-role map

`overview/who-is-this-for.md` is described elsewhere as "the full documentation map". Add the
lifecycle page to *Adaptors & implementers* and *Aggregator organisations*, and `explore/learnings`
to *Program & policy stakeholders*.

---

## 8. Open questions — answer before the affected pages ship

| # | Question | Blocks | Why it matters |
|---|---|---|---|
| Q1 | What is the actual repo/URL for the **AI Voice Agent prompt sets**, and for the **"framework to find the right Voice AI service provider"**? The PDF says "available at Blue Dots Github" and "shared here" with no link. | `guides/voice-ai-prompts` | The page's whole value is pointing at the artefacts. Without URLs it's an empty promise; `starlight-links-validator` will also reject a placeholder internal link. |
| Q2 | Are these publishable by name on a public site: **Kaam Ki Baat** (helpline), **Ghaziabad Fresher Premier League**, **Ghaziabad Marketer Premier League**, **UPSDM**, **DIC**, **TRRAIN**, and the unnamed "AI-HR screening partners"? | `explore/learnings` | TRRAIN and UPSDM already appear in `pilots.mdx` and `district-activation.mdx`, so those are safe. The programme names and the family-of-four anecdote are new to the public surface. |
| Q3 | The six-minute Ghaziabad call (a woman surfacing opportunities for three children and a daughter-in-law) — publishable as written? | `explore/learnings` finding 2 | Strongest narrative in the document, and the most identifying. Suggest keeping it, de-identified as it already is, unless you say otherwise. |
| Q4 | Is **"2–3 minutes to become a Blue Dot"** the same measurement as **"average Hindi call 1 min 40 s"**? | `explore/learnings`, and 4 pages carrying the 2–3 min claim | §5.2 assumes they are different measurements and keeps both. If they are the same thing, the 2–3 min figure is stale everywhere and needs one coordinated correction. |
| Q5 | Is the **District Livelihoods Playbook (v1)** — already referenced in `district-activation.mdx` without a link — published anywhere linkable? | `guides/district-activation` polish | Currently a dead-end mention. Cheap to fix while we're in the file. |
| Q6 | Do **Common Hiring Standards** exist as a written spec (named HR contact, 48-hour response), or is it still an intent? | `explore/learnings` finding 6, `community/roadmap` | Determines whether it's documented as a standard or as a direction of travel. |
| Q7 | Should the PDF's **lifecycle diagram** be re-authored as Excalidraw (matching the existing `src/assets/diagrams/` convention), or is there a source file already? | `core-concepts/blue-dot-lifecycle` | Every other diagram in the repo has an editable Excalidraw source plus an exported PNG and an HTML comment pointing at it. A pasted raster would be the only one that can't be edited. |

---

## 9. Execution order

Five PRs. Each is independently shippable and leaves the site building.

1. **PR 1 — Lifecycle core.** `core-concepts/blue-dot-lifecycle.mdx` + sidebar entry + edits to
   `aggregators.md`, `signals.mdx`, `glossary.mdx`. The anchor everything else links to. No metric
   changes, no renumbering — lowest risk, highest value.
2. **PR 2 — Schema + profiles.** `service_provider` domain in `blue_dot/network.json` (§6) +
   `core-concepts/participant-profiles.mdx` + sidebar. Docs and code land together.
3. **PR 3 — Ready-made blocks & customisation.** `guides/customisation.md`,
   `guides/voice-ai-prompts.md` (needs **Q1**), edits to `blue-dots-as-a-dpg.md`,
   `introduction.md`, `adaptor-onboarding.mdx`, `district-activation.mdx`.
4. **PR 4 — Pilots correction + lifecycle in practice.** Metric fixes (§5.1) across `pilots.mdx`
   and `use-cases.mdx`, plus the Dharwad and Ghaziabad seven-step walkthroughs. Self-contained, so
   the numbers can be reviewed on their own.
5. **PR 5 — Learnings.** `explore/learnings.mdx` (needs **Q2**, **Q3**, **Q6**) + the full path
   renumbering in §7.2 + `who-is-this-for.md` + `roadmap.md`. Renumbering is fiddly and mechanical;
   isolating it keeps it reviewable.

### Verification per PR

```bash
cd bluedots-docs
pnpm build          # starlight-links-validator fails the build on any broken internal link
pnpm check          # astro check — MDX/TS
grep -rn "Path [0-9] of" src/content/docs   # confirm every prev/next chain is self-consistent
```

Then Chrome DevTools against `pnpm preview` (or `pnpm dev`):

- new pages render, sidebar groups expand to the active page, Mermaid block renders in both themes;
- `PhaseTimeline`, `StatGrid`, `BeforeAfter` render as they do on existing pages;
- the Evaluate path walks 1 → 7 via prev/next with no numbering gap;
- diagrams load (Excalidraw PNG exports, `starlight-image-zoom` works);
- `/sitemap-0.xml` lists the five new slugs after deploy.

### Definition of done

Every one of the PDF's five parts is reachable from the sidebar; no figure in the docs contradicts
the PDF; `service_provider` exists in schema and docs; no unanswered **Q** left in a shipped page.

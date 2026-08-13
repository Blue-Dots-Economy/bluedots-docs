# Documentation Architecture Refresh — Plan (v3-final, approved after 3 review rounds)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: approved 2026-08-13, executing.** Reviewed 3 times (round 1: format/scope/accuracy; round 2: diagram-structure and doc-scope corrections; round 3: final consistency + redaction sanity pass — GO). Open questions below still need the user's sign-off on framing and final diagram picks, but do not block starting execution.

**Goal:** Close two classes of gap found by a deep-dive across all four Blue Dots repos (Signals-DPG, aggregator-dpg, signals-search, bluedots-automation) against current `bluedots-docs` content: (1) `signals-search` has almost no documentation despite being a fully shipped, deployed service; (2) the identity/auth story is stale — it describes the *old* two-realm world (standalone Keycloak `aggregator` realm + Signals-DPG Better-Auth) when a shared-realm "Keycloak everywhere" architecture is already built and merged, just not yet promoted to `main`/production.

**Architecture of this change:** four independent writer groups touch non-overlapping file sets on one branch; two diagrams get updated and two are newly created from existing `.excalidraw` sources; a public-docs redaction policy gates everything written. See `docs/superpowers/specs/` precedent (`2026-07-22-api-spec-hosting-design.md`) for the sibling spec-hosting effort this complements.

## Ground truth, verified 2026-08-13 (branch-by-branch, re-verified in round-1 review)

This is a **public** docs site (`docs.bluedotseconomy.org`, public repo). That constrains what we publish — see "Public-docs redaction policy" below.

| Repo | `main` (production today) | `develop`/`feature` (merged, not yet promoted) |
|---|---|---|
| Signals-DPG | Better-Auth + API keys only, no Keycloak | Keycloak fully wired, **dormant** behind `AUTH_PROVIDER=betterauth` (default). Realm is shared (`bluedots`), not Signals-only. Requires running `migrate_users_to_keycloak.ts` before flipping. Bearer-token (Keycloak client-credentials) auth mode added alongside `x-api-key` for the two-header service handshake — additive, `x-acting-org-id` unchanged either way. |
| aggregator-dpg | Standalone Keycloak realm `aggregator`, 2 clients | Realm renamed/shared to `bluedots` (adds `signals-ui` client, portal-only login theme, confirmed landed via PR #621 — not stuck on a stale branch); new pre-OTP "portal entitlement gate" browser flow; `SIGNALSTACK_AUTH_MODE` (`apikey` default / `bearer`) added, additive |
| bluedots-automation | Keycloak deployed inside `helm/aggregator/` chart | Keycloak split into its own top-level chart (`helm/keycloak/`, release `keycloak`), deployed into the `common-services` namespace; new deploy order `common-services → keycloak → signals → aggregator` (confirmed in repo's own CLAUDE.md); **template `global-values.yaml` now defaults new environments to `AUTH_PROVIDER=keycloak`** (chart default stays `betterauth` for safety/rollback) |
| signals-search | N/A (single-branch service, already on `main`) | Auth is `x-api-key` only — confirmed zero references to `x-acting-org-id` anywhere in the codebase (grep count 0). This is a **permanent, known divergence** from the two-header model, not an in-progress item. |

**Framing decision (flag for user confirmation, see Open Questions):** Docs will describe the auth architecture in two clearly labeled parts on `identity-and-auth.md`:
- **"Today" / current production (`main`)** — accurate to what's actually deployed: Aggregator's standalone Keycloak realm, Signals-DPG's Better-Auth, signals-search's api-key-only divergence.
- **"In progress: unified Keycloak"** admonition/section — the shared-`bluedots`-realm architecture, bearer-token migration, portal entitlement gate, and that it's fully merged to `develop`/`feature` pending promotion + an explicit migration-script run + env cutover.

This avoids overclaiming Keycloak is already production reality (it isn't — flagged off by default) and avoids underclaiming/omitting that a fully-built unified-auth path already exists (today's docs do the latter).

## Public-docs redaction policy

Do **not** publish in `bluedots-docs`:
- Specific unpatched/default-permissive security posture details found during research (e.g. a peer-auth mode that currently defaults to permissive pending a fix, tracked on `bluedots-automation`'s `security/issue-8-peer-auth-mode-enforced` branch). This is a live public repo; publishing that is disclosure, not documentation.
- Internal branch names like `security/issue-N-*`, `local-security/*`, or ticket numbers that map 1:1 to a vulnerability tracker.
- Per-deployment/brand-specific branches or values (`blue-dots-prod`, `orange-dot-prod`, any pilot-specific hostnames/capacity knobs) — docs describe the general architecture, not any specific tenant's deployment.
- Exact file paths to Keycloak realm JSON / SPI jars / theme internals beyond what's already implied by the existing Identity & Auth page's level of detail (that page already names realm/client IDs — match that existing precedent, don't exceed it).

Do publish: architecture, component names, deploy order, chart names/namespaces, env var *names* (not secret values), and the general mechanism of any migration (flag-gated, requires a script run, etc.) — the same level of detail the current docs already give for the aggregator Keycloak setup. (Checked: no currently-published page over-exposes anything beyond this bar today.)

**Round-3 clarification:** nothing in the "Ground truth" table above — PR numbers, script filenames, branch names — should be copied verbatim into published prose. That table is cited for verification during planning/review, not as doc content; describe mechanisms ("an explicit migration-script run") rather than naming the script or PR.

## Diagram content — locked before prose writing starts

Round-1 review flagged that writing prose before diagram content is finalized risks caption/diagram mismatch. Diagram *content* (nodes, labels, captions) is decided here, in this plan, before Task execution begins — the diagram-editing task (Task 9) and the prose tasks that reference these diagrams (Tasks 2, 3) use these locked captions verbatim.

- **`high-level-architecture.excalidraw`** (update): current layout is a strict two-column lane arrangement (Aggregator | Signals), 5 full-width lane-background rectangles spanning x:100→980, no free space. Round-2 review confirmed a drop-in node isn't possible without a layout decision — **decision: widen the canvas rightward and add a third, narrower lane** ("Search") to the right of the Signals lane, containing the `signals-search` node, connected by a labeled arrow "Redis Stream (item write events)" from the Signals lane. Do not compress the existing two lanes to fit a satellite box — that would touch every existing element's position. Caption to use in prose: *"signals-search consumes Signals-DPG's item-write events over a Redis Stream and serves pgvector + PostGIS search over the result"*.
- **`infra-topology.excalidraw`** (update): current Signals namespace is a single rectangle containing one text element (`"Signals (ns: signals)\napi · ui · notification ·\nmatch-score · search"`) — not discrete per-component boxes. Round-2 review confirmed "add a subchart box" doesn't match the file's actual structure. **Decision: append `· search-embeddings` to the existing text line** (matches current style, matches how `search` itself is already represented as a word in that line, near-zero structural change) — do not restructure the rectangle into sub-boxes. Caption: *"signals-search (plus its search-embeddings sidecar) deploys as its own subchart under the Signals namespace, sharing the same Postgres/Redis"*.
- **`signals-search-ingestion.excalidraw`** (new): Redis Stream → worker (embed + idempotent upsert via content hash) → `item_search`; a side path to a DLQ after `INGEST_MAX_DELIVERIES` retries; a periodic reconciliation-sweep loop back into the upsert step; caption: *"Ingestion is idempotent (content-hash skip), retries before parking to a DLQ, and a periodic sweep reconciles anything missed"*.
- **`unified-keycloak-target.excalidraw`** (new): one `bluedots` realm; four clients (`signals-ui`, `signals-api`, `aggregator-dpg`, `voice-dpg`); Keycloak box explicitly labeled "target / in progress — not yet in production"; caption: *"In progress: a single shared Keycloak realm will serve both DPGs plus future integrating DPGs, replacing the standalone aggregator realm"*.

## Gap inventory → work items

### New page

- [ ] **Task 1 — Create `core-concepts/architecture/signals-search.md`**
  **Files:** Create `src/content/docs/core-concepts/architecture/signals-search.md`; Modify `astro.config.mjs` (sidebar entry — real current order is High-Level → Signals DPG → Aggregator DPG → Data Model → Identity & Auth → Infrastructure; **place signals-search directly after Signals DPG, before Aggregator DPG** — it extends Signals-DPG's data, unlike Aggregator DPG which is a separate flow).
  Content: what it is/why (Postgres-native pgvector+PostGIS search & discovery, stepping stone toward Beckn/NFH discovery); components (api + worker, one image two entrypoints, TEI embedding sidecar); ingestion pipeline using the locked `signals-search-ingestion` diagram; search API (`POST /v1/search`, `/v1/search/flat`, `/v1/relevance`, Beckn-aligned envelope, anchor/geo/free-text modes, cross-encoder rerank off by default, 45s result cache); auth divergence (x-api-key only — named as a known, permanent inconsistency, cross-linked from `identity-and-auth.md`); tech stack (postgres.js/no ORM, ESM NodeNext, Testcontainers-based tests, version gap vs the other two repos).

### Updated pages

- [ ] **Task 2 — Restructure `identity-and-auth.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/identity-and-auth.md`.
  Today/In-progress split as decided above; add signals-search's divergence as a third named auth path; embed the locked `unified-keycloak-target` diagram in the In-progress section. **Round-2 fix:** the current page's `AUTH_MIDDLEWARE_ENABLED` line ("a kill switch for running migrations or seed scripts") is itself stale/incomplete — confirmed in code (`apps/api/src/config.ts`) that setting it `false` only takes effect when `INSTANCE_ENV=development`; it is forced `true` regardless in production. State this dev-only gate explicitly so an operator can't misread it as a prod-usable switch.

- [ ] **Task 3 — Add participant metrics section to `signals-dpg.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/signals-dpg.md`.
  "Participant metrics (`item_metrics`)" section: lazily recomputed on read under a per-`(aggregator_id, domain)` Postgres advisory lock with a TTL (`DASHBOARD_CACHE_TTL_SECONDS`); non-blocking try-lock skips on contention unless `force=true`; metrics are directional (`initiated` vs `received`, same-domain interactions emit both). State explicitly this is a read-time cache, not a source of truth — no separate "Signal Processing Service" / materialized view exists.

- [ ] **Task 4 — Add dashboard/auth-mode notes to `aggregator-dpg.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/aggregator-dpg.md`.
  One paragraph: dashboard rollup view now consumes Signals-DPG's precomputed `item_metrics`; item-table/lifecycle-tile view still pages `fetch_local` directly (capped sweep, `tiles_truncated` flag) pending a server-side per-lifecycle count endpoint — the earlier audited N+1 is partially, not fully, resolved. One-line pointer to `SIGNALSTACK_AUTH_MODE` (apikey/bearer), cross-linking `identity-and-auth.md` rather than duplicating.

- [ ] **Task 5 — Expand signals-search coverage + fix corrections in `infrastructure.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/infrastructure.md`.
  This is an *expansion*, not an addition — the chart table and topology-diagram alt text already say "...search" in one word; flesh out to name the subchart path (`helm/signals/charts/search/`), the sibling `search-embeddings` (TEI) subchart, and that it has no in-process rate limiter (relies on the Kong layer). Correct the Terragrunt module list to include `rds` (opt-in managed Postgres), `pritunl`, `bastion`. Correct the Kong tier description from the current generic 3-tier claim to the real, per-service tiers: `rl-agg-web`, `rl-agg-api`, `rl-agg-auth`, `rl-signals-api`, `rl-signals-ui`, `rl-monitoring` — name them explicitly, don't just say "more granular." Add the "In progress" Keycloak-as-shared-common-service topology (new `helm/keycloak/` chart, `common-services` namespace, new deploy order) as a clearly labeled upcoming-state callout, mirroring `identity-and-auth.md`'s framing, using the locked `unified-keycloak-target` diagram (reused, not a second new diagram).

- [ ] **Task 6 — Update `tech-stack.md`**
  **Files:** Modify `src/content/docs/core-concepts/technical/tech-stack.md`.
  Restructure "At a glance" table to three columns (add Signals Search): postgres.js/no ORM, pgvector+PostGIS, Testcontainers, and the confirmed version gap (TypeScript two majors behind Signals-DPG, Vitest one major behind).

- [ ] **Task 7 — Update `high-level-architecture.mdx`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/high-level-architecture.mdx`.
  Add signals-search + its embedding sidecar to prose, using the locked `high-level-architecture` diagram update.

- [ ] **Task 8 — Add a Signals Search section + missing env knobs to `guides/configuration.md`**
  **Files:** Modify `src/content/docs/guides/configuration.md`.
  Round-2 finding: this file's "Where configuration lives" table currently has only Signals DPG / Aggregator DPG columns — no signals-search row, despite Tasks 1/6 giving it a full architecture page and a tech-stack column. Add a third column/section for it. Add env knobs, and don't cherry-pick only the Keycloak-epic-adjacent ones (that would make this page inconsistent with the very PR touching it) — include everything this plan's other tasks surface: `AUTH_PROVIDER` (Signals-DPG), `SIGNALSTACK_AUTH_MODE` (aggregator-dpg), `EMBEDDING_SERVING_VERSION` (signals-search), `DASHBOARD_CACHE_TTL_SECONDS` (Signals-DPG, from Task 3), `INGEST_MAX_DELIVERIES` (signals-search, from Task 9's diagram). Names and effect only, no secrets.

- [ ] **Task 8b — Fix stale sidebar-gap note in bluedots-docs' own `CLAUDE.md`**
  **Files:** Modify `CLAUDE.md` (repo root).
  Remove the note claiming many sidebar slugs reference nonexistent files — verified every current sidebar slug has a matching file as of this audit (round-1 review re-confirmed).

### Diagrams (excalidraw)

- [ ] **Task 9 — Edit diagram sources, re-export PNGs, produce review links**
  **Files:** Modify `src/assets/diagrams/high-level-architecture.excalidraw` + `.png`; Modify `src/assets/diagrams/infra-topology.excalidraw` + `.png`; Create `src/assets/diagrams/signals-search-ingestion.excalidraw` + `.png`; Create `src/assets/diagrams/unified-keycloak-target.excalidraw` + `.png`.
  Use the locked content/captions above — do not invent new labels at this stage. For each of the 4 diagrams, produce a shareable excalidraw.com link and send all 4 to the user for review before picking final versions (do this **before** finalizing Tasks 1, 2, 5, 7's prose, or be prepared to adjust captions if the user requests diagram changes).

Diagrams *not* touched (existing ones remain accurate per research): `aggregator-dpg-data-flow`, `cicd-*`, `data-model-er`, `infra-terragrunt-chain` (gets a table-only text fix in Task 5 for `rds`/`pritunl`/`bastion`, not a diagram change), `infra-two-layers`, `items-actions-events`, `networks-domains-instances`, `read-write-network-fetch`, `two-verticals-one-network`, `use-cases-common-pattern`, `aggregators-relationship`.

## Explicitly out of scope

- Anything living only on unmerged feature/spec branches: telemetry platform, MCP server, cross-DPG consent-management platform, campaign email/PII-export, support attachments, owner-registration deep link. Design docs or side branches, not shipped — don't belong in docs describing the current system.
- bluedots-automation's per-deployment/brand branches (`blue-dots-prod`, `orange-dot-prod`, stale `gcp-support`) and any pilot-specific values (e.g. spot-node-capacity pilot knob) — general architecture only, no tenant-specific detail.
- The security-remediation-adjacent findings from this research (permissive peer-auth default, etc.) — tracked separately, not in public docs (see redaction policy).
- Whether signals-search should get its own `guides/installation/signals-search.md` install guide (parity with signals-dpg/aggregator-dpg) — flagged as an open question, not committed to; larger net-new-content item than the corrections/additions above.
- Rewriting any diagram not listed in the "touched" set above.

## Execution plan

1. Branch `docs/architecture-refresh` off `main`.
2. Task 9 (diagram editing) **starts immediately at branch creation**, in parallel with step 3's writer groups, not after them — round-2 review flagged that "runs early/in parallel" needed a concrete trigger, so: Task 9 produces first-draft `.excalidraw` + re-exported `.png` files before step 4 (the build needs the image files to exist and resolve, even if their content is still a draft pending user sign-off). Writer groups reference the locked captions from this plan regardless of PNG draft/final status.
3. Parallel writer agents, one per non-overlapping file group:
   - Group A: Task 1 (signals-search.md, new) + Task 6 (tech-stack.md) + Task 8 (configuration.md).
   - Group B: Task 2 (identity-and-auth.md) + Task 8b (CLAUDE.md stale-note fix).
   - Group C: Task 5 (infrastructure.md) + Task 7 (high-level-architecture.mdx).
   - Group D: Task 3 (signals-dpg.md) + Task 4 (aggregator-dpg.md).
4. `pnpm build` locally to catch broken links/404s (starlight-links-validator runs at build) and confirm the new sidebar entry resolves, using Task 9's first-draft PNGs.
5. Final review agent over the full diff for accuracy, tone consistency, and adherence to the redaction policy.
6. Commit, push, open PR to `main` with Task 9's shareable excalidraw.com links posted in the PR description for review.
7. **Follow-up commit, still on this branch/PR:** once the user picks final diagram versions from the shareable links, apply any requested changes to the 4 `.excalidraw` sources, re-export final PNGs, push as an additional commit before merge — the PR stays open for this round-trip rather than merging with drafts.

## Open questions for the user

1. ~~Confirm the Today/In-progress two-part framing~~ — **Resolved 2026-08-14: keep it.** Shipped as-is in PR #13.
2. Confirm the redaction policy above is the right bar — anything else that should stay out of public docs. **Partially resolved:** final review found `guides/cicd-and-builds.md` (untouched by this PR) already violates this bar by publishing brand/deployment-specific branch names (`blue-dots-prod`, `orange-dot-prod`, etc.). **User decision 2026-08-14: fix in a separate follow-up PR, not this one.**
3. ~~Want a new `guides/installation/signals-search.md`~~ — **Resolved 2026-08-14: defer.** Not in PR #13.
4. Final call on each new/changed diagram, once shareable links are produced — **still open**, pending the user's review of the 4 excalidraw.com links posted in PR #13's description. Apply any requested changes as a follow-up commit to `docs/architecture-refresh` before merge.

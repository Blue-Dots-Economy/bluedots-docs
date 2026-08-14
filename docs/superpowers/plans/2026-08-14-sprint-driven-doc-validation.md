# Sprint-Driven Documentation Validation (2026-08-03 → 2026-08-14) — Plan (v2, post round-1 review)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: approved 2026-08-14, executing.** Builds directly on top of the not-yet-merged `docs/architecture-refresh` branch (PR #13) — this is a second phase of the same overall documentation effort, continuing on the same branch rather than opening a new PR, since several touched files (`identity-and-auth.md`, `infrastructure.md`) were just rewritten there and a fresh branch off `main` would conflict/regress against stale pre-PR#13 content.

**Round-1 review fixes applied:** (1) `notification-service` is a separate GitHub repo, not visible from this workspace by default — cloned to `/private/tmp/claude-501/-Users-mahesh-Code-Blue-Dots/eff860b4-41e1-48b8-af18-df831d8447b5/scratchpad/notification-service` for Task 3's writer to read directly rather than work from the plan's prose alone. (2) `cicd-deploy-chain.excalidraw` bakes the stale GHCR-pull-secret claim into a diagram text element (`id: dc0807x`, reads `"create_namespaces_and_secrets\n(3 namespaces + ghcr-pull secret)"`) — Task 2 now includes an explicit diagram-text fix, not prose-only. (3) The redaction policy now states the correct/intended HMAC ordering explicitly, so writers have real ground truth instead of guessing around a gap. (4) Task 5.1's precedent citation corrected.

**Goal:** GitHub Project "Blue Dots — Delivery" (org project #1), sprint `2026-08-03 to 2026-08-14`, has 26 completed issues. Cross-checked each against current repo state (today, 2026-08-14) and existing/just-drafted `bluedots-docs` content. Found: one already-published doc claim that is now factually wrong on `main` (needs a straight correction), one entirely undocumented deployed service (`notification-service`), and two real shipped features sitting on `develop`/`feature` not yet promoted to `main` (same "in progress" pattern established in the prior phase).

## Findings → disposition

| # | Issue | Verified state | Disposition |
|---|---|---|---|
| #423, #488 | Keycloak migration, login bug | Confirmed still dormant, not on `main`. PR #13's existing framing is accurate. | No change — already correct. |
| #432 | Rate-limit public API | Correctly closed as "Kong handles it, no in-app code" — matches PR #13's existing exclusion. A *different*, unrelated draft PR (#527, failing CI) has real in-app code but is unmerged/unshipped. | No change — still correctly out of scope. |
| #97, #98, #102 | signals-search dep bumps + embedding versioning | tech-stack.md's version-gap claims still accurate as of today. | No change. |
| #370, #422 | Network-configurable action-pair cap + CTA behavior | **Real, merged code** (PR #479) on `develop`/`feature`. **Not on `main`.** Config: `max_actions_per_pair` in `network.json` (unset → default 1), enforced via a pair-scoped Postgres advisory lock in `apps/api/src/services/action_pair_cap.ts`; over-cap → `409 ACTION_LIMIT_REACHED`. | **Add**, "in progress" framed (same pattern as Keycloak). |
| #476 | Shareable profile links + public profile view | Real, on `develop`/`feature`, **not on `main`**. Public unauthenticated route reusing the existing masked public projection (same fields already exposed via map/discover) — no new PII, no signed/opaque token (stable item key, deliberately, since the id is already public), gated to `lifecycle_status='live'` only. | **Add**, "in progress" framed. **User decision 2026-08-14: omit the "no minor-specific gating" v1 design-limitation detail** — don't publish it, even factually, since it concerns minors' data exposure. Document the mechanism only. |
| #48, #51, #52 | notification-service hygiene epic + 2 bugs | **The service itself is already live on `main`** (deployed as a Signals-chart subchart, referenced bare in `infrastructure.md` today) — only the hygiene/test work and the two bug *fixes* are feature/develop-only. | **Add** a full new architecture page — describes the live service. **Redaction: do NOT mention** issue #51/#52's specific unpatched-on-main bug mechanics (nonce-claimed-before-signature-verified is a live auth-adjacent weakness; the retry-duplication race) or specific CVE'd dependency versions (nodemailer 8.0.5) — describe the intended/designed mechanism (HMAC+nonce request signing, exponential-backoff retry+DLQ) as architecture, not its currently-unpatched edge cases. |
| #116 | Pre-install migrate hook fix | Real, merged, on `develop`/`feature`, **not `main`**. Generic Helm-hook-ordering mechanism, no brand-specific content. | **Add** one short note to `infrastructure.md`'s deploy-order section, "in progress" framed — low priority, keep brief. |
| #117 | Retire a public host, keep `/api` served | Real, merged, on `develop`/`feature`, **not `main`**. Generic mechanism: `ui.blockedHosts` + `blockedHostStatusCode`/`blockedHostMessage` in Helm values; a Kong `request-termination` plugin blocks `/` while `/api` keeps resolving. No specific hostnames referenced. | **Add** to `infrastructure.md`, "in progress" framed. |
| #125 | GHCR pull secret optional | **Already merged to `main`** (hotfix PR #129, 2026-08-11) — this is CURRENT reality, not in-progress. Toggle: `IMAGES_PUBLIC` env var, **default `true`** (no pull secret created). | **Fix now** — `guides/deployment.md:26` currently says a GHCR PAT is "Also required" (now wrong); `guides/cicd-and-builds.md:82` describes `create_namespaces_and_secrets` as unconditionally creating the `ghcr-pull` secret (now wrong). Straight corrections, not "in progress" callouts. |
| #300 | SAST/SCA in CI (all repos) | Real, landed (`bluedots-automation/.github/workflows/security-scan.yml`, PR #120) on `develop`/`feature`, **not `main`**. Per-repo callers still pinned `@feature`. Tools: Trivy (fs+image scan), gitleaks (opt-in, secrets), CodeQL (default setup, separate from the reusable workflow), plus report-only `pnpm audit`/`uv-secure`. All report-only (`block: false`) today. | **Add** to `guides/cicd-and-builds.md`, "in progress" framed (still `@feature`-pinned, not on `main`). |

## Redaction policy (extends the existing PR #13 policy — same public-docs site)

In addition to the existing policy (no PR numbers/branch names/script filenames/brand-deployment-specific values/unpatched-security-posture specifics):
- **No minor-gating detail** for the shareable-profile-links feature (user decision above).
- **No notification-service bug mechanics** for #51/#52 — describe the intended design, not the specific ordering bug or race condition that's still unpatched on `main`. **The correct, intended design to describe** (safe to state plainly — this is normal request-signing architecture, not a vulnerability disclosure): a request is authenticated by first verifying the HMAC-SHA256 signature over the request, and only once the signature is valid is the nonce checked/claimed for replay protection. Do not describe (and do not imply by ordering in prose) the current unpatched-on-`main` behavior where the nonce is claimed before the signature is checked, and do not mention the retry-duplication race in `popScheduledRetries` at all — describe the queue's retry mechanism (delayed retries via a scored set, atomic claim-and-remove) as how it's designed to work.
- **No specific CVE'd dependency versions** (e.g. nodemailer 8.0.5) — if a tech-stack fact needs a version, use the safe/patched one already documented elsewhere, or omit the number entirely and describe the library by name only.
- **No stale-image/broken-CI-trigger detail** for notification-service (the fact that `:latest`/`main`'s published image predates several fixes due to a CI trigger-glob bug) — this is operational trivia, not architecture, and edges toward "here's a stale-image gap to exploit."

## Work items

### Corrections to already-published content (current `main` reality — not "in progress")

- [ ] **Task 1 — Fix `guides/deployment.md`** (GHCR pull secret claim)
  **Files:** Modify `src/content/docs/guides/deployment.md`.
  Line ~26 currently states a GHCR PAT is "Also required." Correct to: images are public by default (`IMAGES_PUBLIC=true`, the default), so no pull secret is created; set `IMAGES_PUBLIC=false` to restore the PAT-gated behavior for private images.

- [ ] **Task 2 — Fix `guides/cicd-and-builds.md`** (pull-secret claim, incl. its diagram + add SAST/SCA section)
  **Files:** Modify `src/content/docs/guides/cicd-and-builds.md`; Modify `src/assets/diagrams/cicd-deploy-chain.excalidraw` + `.png`.
  1. Correct the `create_namespaces_and_secrets`/deploy-chain description in prose: the `ghcr-pull` secret is created only when `IMAGES_PUBLIC=false`; default behavior creates no pull secret.
  2. **The stale claim is also baked into the diagram itself**, not just prose — `cicd-deploy-chain.excalidraw`'s text element `id: dc0807x` currently reads `"create_namespaces_and_secrets\n(3 namespaces + ghcr-pull secret)"`. Edit that text to `"create_namespaces_and_secrets\n(3 namespaces + ghcr-pull secret\nif IMAGES_PUBLIC=false)"` (or equally clear rewording), re-export the PNG at the same path so the image doesn't contradict the corrected prose. Use the same excalidraw.com export technique from the prior phase (see [[reference_excalidraw_headless_export_technique]] if available, or drive `mcp__chrome-devtools__*` against excalidraw.com directly) — this is a single text-element edit, not a new diagram, so it should be quick.
  3. Add a new "Security scanning in CI" subsection: Trivy (filesystem + image scans), gitleaks (secret scanning, opt-in), CodeQL (via GitHub's default setup, run separately per repo). All report-only today (SARIF uploaded to each repo's Security tab, not build-blocking). Frame as **in progress**: the reusable workflow and per-repo callers exist on `develop`/`feature`, still pinned `@feature`, not yet promoted to `main`.

### New page

- [ ] **Task 3 — Create `core-concepts/architecture/notification-service.md`**
  **Files:** Create `src/content/docs/core-concepts/architecture/notification-service.md`; Modify `astro.config.mjs` (sidebar entry — place after "Signals Search", before "Aggregator DPG"; it's consumed by Signals-DPG only, no aggregator-dpg reference found).
  **Source material:** this is a separate GitHub repo, not part of this workspace's usual four — a full clone is available at `/private/tmp/claude-501/-Users-mahesh-Code-Blue-Dots/eff860b4-41e1-48b8-af18-df831d8447b5/scratchpad/notification-service` for the writer to read directly (root `README.md`, `src/app.ts`/`src/server.ts` for routes, `src/lib/providers/index.ts` for auto-discovery, `src/plugins/request-auth.ts` for the auth model, `src/lib/queue.ts`/`src/lib/worker.ts` for the queue) — verify against that clone rather than relying on this plan's prose alone.
  Content (describes the CURRENT, live-on-main architecture — this service is already deployed, not in-progress): what it is/why (one HTTP endpoint, `POST /notify`, so every DPG can send email/SMS/WhatsApp without knowing the underlying provider); components (Fastify API + an in-process forked worker, `GET /providers` for introspection, `GET /metrics/queue`, `POST /failed/retry` for manual DLQ requeue); the provider auto-discovery mechanism (filesystem convention — a directory per channel exporting a `ProviderDefinition`, no registration code needed; wired today: email via nodemailer/SES or Gmail SMTP, SMS via MSG91, WhatsApp via Twilio); its auth model — a **third, distinct** service-auth pattern alongside Keycloak/Better-Auth/the x-api-key two-header model: HMAC-SHA256 request signing with nonce-based replay protection (design intent, not the specific unpatched ordering issue); the Redis-backed queue (custom primitives — realtime/other priority lists + a delayed-retry sorted set + a DLQ list, not BullMQ; exponential backoff on failure); its relationship to Signals-DPG's `packages/notification` (a thin HTTP client, not a shared library — Signals-DPG's `dispatch_email.ts` funnels all outbound email through it); its own dedicated Redis (no shared datastore with Signals-DPG, HTTP-only coupling); deploy as a Signals-chart subchart.

### Updated pages

- [ ] **Task 4 — Expand `tech-stack.md`**
  **Files:** Modify `src/content/docs/core-concepts/technical/tech-stack.md`.
  Add a short "Other services" note (not a 4th table column — would overcrowd the at-a-glance table) covering notification-service's stack: Fastify, `ioredis` (custom Redis primitives, not BullMQ), Zod-validated provider schemas, its own dedicated Redis instance.

- [ ] **Task 5 — Expand `infrastructure.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/infrastructure.md`.
  1. Expand the existing bare "notification-service" mention in the chart-deploy table with a one-line description + link to the new architecture page (the cross-link-rather-than-duplicate pattern already used in `high-level-architecture.mdx` and `guides/configuration.md` from the prior phase — not, as an earlier draft of this plan mis-cited, an existing link in the chart table itself).
  2. Add an "In progress" note for #117 (host retirement): `ui.blockedHosts`/`blockedHostStatusCode`/`blockedHostMessage` Helm values let an old public hostname stop serving the UI (Kong `request-termination`) while `/api` on the same host keeps resolving — e.g. useful when a unified domain splits into per-participant domains. Not yet on `main`.
  3. Add a brief "In progress" note for #116: the Signals migrate Job is moving from a post-install to a `pre-install`/`pre-upgrade` Helm hook, fixing a deadlock on from-scratch installs (`helm upgrade --wait` blocks post-install hooks until every resource is Ready, but the api can't become Ready without the schema the hook would create). Not yet on `main`.
  4. **Fix** the GHCR pull-secret claim if `infrastructure.md` implies one is always required anywhere (verify while editing; research found the direct claims live in `guides/deployment.md`/`guides/cicd-and-builds.md`, but double-check this file too) — same correction as Tasks 1/2, current-`main` fact, not in-progress.

- [ ] **Task 6 — Add action-pair-cap section to `core-concepts/items-actions-events.md`**
  **Files:** Modify `src/content/docs/core-concepts/items-actions-events.md` (read it first for structure/tone).
  Add an "In progress" section: a network can configure `max_actions_per_pair` (in `network.json`; unset defaults to **1**) capping how many `apply`/`connect` actions may exist between the same two items — enforced server-side, bidirectionally, sharing one budget across action types; exceeding it returns `409 ACTION_LIMIT_REACHED`. Not yet on `main`.

- [ ] **Task 7 — Add public-profile-links section to `core-concepts/architecture/signals-dpg.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/signals-dpg.md`.
  Add an "In progress" section (same pattern as the existing `item_metrics` section added in the prior phase — place nearby): a profile can be shared via a public, unauthenticated link; it reuses the same masked public projection already exposed via map/discover (no new PII), uses the item's existing id directly (not a signed/opaque token — the id is already public via the existing fetch paths, so this exposes nothing new), and only resolves for `lifecycle_status='live'` items (anything else renders a generic "unavailable" page, never a raw error). **Do not** mention the minor-gating decision — omitted per user instruction.

- [ ] **Task 8 — Add a brief notification-service auth mention to `identity-and-auth.md`**
  **Files:** Modify `src/content/docs/core-concepts/architecture/identity-and-auth.md`.
  One short paragraph/section noting a third service-auth pattern exists for notification-service (HMAC request signing + nonce replay protection), cross-linking to the new `notification-service.md` page for the full mechanism rather than duplicating it.

## Execution plan

1. Continue on the existing `docs/architecture-refresh` branch (already checked out, PR #13 open) — do not create a new branch.
2. One critic review pass over this plan (lighter-weight than the prior phase's 3 rounds — smaller, more surgical scope; escalate to a second round only if the first surfaces something structurally wrong).
3. Parallel writer agents, non-overlapping file groups:
   - Group A: Task 3 (notification-service.md, new) + Task 4 (tech-stack.md) + Task 8 (identity-and-auth.md).
   - Group B: Task 1 + Task 2 (deployment.md + cicd-and-builds.md corrections/additions, including the `cicd-deploy-chain.excalidraw`/`.png` diagram text fix).
   - Group C: Task 5 (infrastructure.md).
   - Group D: Task 6 (items-actions-events.md) + Task 7 (signals-dpg.md).
4. `pnpm build` to confirm no broken links/404s.
5. Final review agent over the diff (same checks as before: cross-file consistency, redaction-policy compliance including the new items above, factual spot-checks, Today/In-progress framing discipline).
6. Commit, push to the existing PR #13 branch, update the PR description to reflect the expanded scope.

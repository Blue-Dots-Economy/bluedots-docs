# API docs visibility review — which APIs belong in the public reference

**Status:** for review (nothing is hidden yet — this is the decision list).
**Scope:** Signals-DPG (48 operations) and Aggregator-DPG (30 operations). Signals-Search is
excluded on purpose: all 3 of its operations (search, flat search, health) are integration-facing
and stay in the docs.

**How the verdicts were derived:** every operation's *actual callers* were traced through the
codebases — the Signals React UI (`apps/ui`), the Aggregator portal BFF (`apps/web`), the
cross-DPG client (`aggregator-dpg/packages/signalstack-writer`), the inter-instance peer
protocol, and the official integration doc (`signals-dpg/docs/operations/integrating-dpgs.md`).
"Internal" = called only by the product's own frontend/plumbing; "In docs" = called by external
integrators (other DPGs, adaptors) or required by anyone deploying their own instance.

**How hiding will be implemented once this list is approved** (for context, not part of the
decision): each service repo's `spec:dump` script gets an explicit internal-operations list and
filters those paths out of the committed `openapi.json`. The published docs then exclude them
automatically through the normal sync, while each running service's own `/api/reference`
continues to show the complete API to your own developers. One list per repo, versioned next to
the dump script.

---

## 1. Signals-DPG

### 1.1 Required in docs (14 operations — recommended)

The integration surface: what aggregator-dpg / voice-dpg / adaptors call over `x-api-key`, plus
the inter-instance network protocol that anyone running their own instance participates in.

| Method | Path | What it is | Who uses it | Why it belongs in docs |
|---|---|---|---|---|
| POST | `/api/v1/action/perform` | Perform an action between items (supports acting on behalf of a user) | Aggregator/voice-dpg (documented in `integrating-dpgs.md`) + UI | The canonical integration endpoint for performing actions with `x-api-key` + acting-org |
| POST | `/api/v1/action/perform/bulk` | Batch perform with per-item partial-failure results | Raya-compat batch route (#296) | Exists specifically for external batch callers |
| POST | `/api/v1/event/store` | Store an action-event (mirrored to the source item's instance) | Peer instances (`action_event_runtime.ts:296`) | Network-protocol route every deployed instance must expose |
| GET | `/api/v1/network/schemas` | List the network's item schemas (public) | UI + any integrator resolving schemas | Public schema discovery — the entry point to the schema-driven model |
| GET | `/api/v1/network/schema/{network}/{domain}/{itemType}` | Fetch one resolved item schema (public) | Any integrator/deployer | Public single-schema resolution, pairs with the above |
| GET | `/api/v1/network/item/fetch` | Cross-instance aggregated item read (public) | UI + integrators | The public network discovery read |
| POST | `/api/v1/network/item/fetch_local` | Raw local item fetch with aggregator/item filters | **aggregator-dpg** (`signalstack-writer/http.ts:360,1055`) + peer instances | Called directly by an external DPG — public by definition |
| POST | `/api/v1/network/action/perform` | Receive an action performed against an item hosted on this instance (public) | Peer instances (`perform_action.ts:236`) | Core inter-instance action delivery — network protocol |
| POST | `/api/v1/admin/aggregator/upsert` | Mirror an aggregator org into Signals (idempotent) | **aggregator-dpg** (`http.ts:449`); documented in `integrating-dpgs.md` | Canonical integrating-DPG admin endpoint |
| POST | `/api/v1/admin/participant` | Tier-aware participant create/update + items | **aggregator-dpg** (`http.ts:103`); documented | The participant-onboarding endpoint for integrators |
| GET | `/api/v1/admin/participant` | Read a participant's items (acting-org scoped) | Designed for aggregator/network_service acting-orgs | Part of the documented `/admin/*` service-auth surface |
| POST | `/api/v1/admin/participant/decrypt` | Return decrypted PII profiles for given item ids | **aggregator-dpg** (`http.ts:774`, backs CSV export) | Called by an external DPG |
| GET | `/api/v1/aggregator/dashboard` | Per-domain rollup + paginated items for an aggregator | **aggregator-dpg** (`http.ts:546`); documented | Aggregator-dpg's dashboard data source |
| GET | `/api/v1/aggregator/dashboard/export` | Streamed CSV export of the rollup | **aggregator-dpg** (`http.ts:702`); documented | Same integration surface |

### 1.2 Not required in docs — internal only (28 operations — recommended)

Everything below is called **only** by the Signals web UI (session auth). External integrators
have no path to these; hiding them halves the published surface and removes signup/consent
internals from public view.

| Method | Path | What it is | Who uses it | Why hide |
|---|---|---|---|---|
| POST | `/api/v1/item/create` | Create own item | UI only (`item-api.ts:75`) | Self-service "my items"; integrators onboard via `/admin/participant` instead |
| GET | `/api/v1/item/fetch` | Read own items (instance-local) | UI only (`item-api.ts:93`) | UI's "my items" view; cross-instance reads are `/network/item/fetch` |
| PATCH | `/api/v1/item/{itemId}` | Update own item | UI only (`item-api.ts:98`) | Self-service edit |
| DELETE | `/api/v1/item/{itemId}` | Delete own item | No external caller found | Same self-service family |
| GET | `/api/v1/action/fetch` | List own actions | UI only (`action-api.ts:423`) | UI "my actions" view |
| GET | `/api/v1/action/{action_id}/contact-details` | Reveal counterparty contact for an action | UI only (`action-api.ts:465`) | UI "reveal contact after match" feature |
| POST | `/api/v1/match-score/calculate` | Compute match score between items | UI only (`match-score-api.ts:67`) | UI scoring feature; no integrator uses it |
| GET | `/api/v1/consent/status` | Discoverability consent status | UI only (`consent-api.ts:39`) | UI consent gating |
| GET | `/api/v1/consent/status-by-identifier` | Pre-login consent status (public route) | UI only (`consent-api.ts:49`) | Public solely so the UI can check before login |
| POST | `/api/v1/consent/accept` | Record consent acceptance | UI only (`consent-api.ts:56`) | UI consent flow |
| GET | `/api/v1/consent/profile-status` | Per-profile consent status | UI only (`consent-api.ts:64`) | UI consent flow |
| POST | `/api/v1/consent/profile-accept` | Record per-profile consent | UI only (`consent-api.ts:74`) | UI consent flow |
| POST | `/api/v1/consent/u18/dob` | Submit DOB for under-18 gating | UI only (`consent-api.ts:142`) | UI u18 flow |
| GET | `/api/v1/consent/u18/status` | Under-18 consent status | UI only (`consent-api.ts:161`) | UI u18 flow |
| POST | `/api/v1/consent/u18/guardian` | Register guardian | UI only (`consent-api.ts:169`) | UI u18 flow |
| POST | `/api/v1/consent/u18/guardian/verify` | Verify guardian OTP | UI only (`consent-api.ts:177`) | UI u18 flow |
| POST | `/api/v1/consent/u18/profile-consent/issue` | Issue guardian profile-consent challenge | UI only (`consent-api.ts:235`) | UI u18 flow |
| POST | `/api/v1/consent/u18/profile-consent/verify` | Verify guardian profile-consent | UI only (`consent-api.ts:245`) | UI u18 flow |
| POST | `/api/v1/consent/u18/profile-consent/precreate/issue` | Pre-create guardian consent (issue) | UI only (`consent-api.ts:263`) | UI u18 flow |
| POST | `/api/v1/consent/u18/profile-consent/precreate/verify` | Pre-create guardian consent (verify) | UI only (`consent-api.ts:273`) | UI u18 flow |
| POST | `/api/v1/consent/u18/profile-consent/finalize` | Finalize u18 profile consent | UI only (`consent-api.ts:283`) | UI u18 flow |
| POST | `/api/v1/consent/u18/signup/guardian` | Guardian step during u18 signup | UI only (`consent-api.ts:215`) | UI u18 signup |
| POST | `/api/v1/consent/u18/signup/guardian/verify` | Verify guardian during u18 signup | UI only (`consent-api.ts:225`) | UI u18 signup |
| GET | `/api/v1/auth/config` | Runtime auth config for the client (public route) | UI only (`auth-api.ts:187`) | React app bootstrap (which login channels are on) |
| POST | `/api/v1/auth/u18-precheck` | Pre-signup under-18 check (public route) | UI only (`auth-api.ts:143`) | UI signup gating |
| GET | `/api/v1/user/domains` | Read user's selected domains | UI only (`user-api.ts:7`) | UI preference |
| POST | `/api/v1/user/domains` | Set user's selected domains | UI only (`user-api.ts:12`) | UI preference |
| POST | `/api/v1/support` | Submit contact-support message | UI only (`support-api.ts:17`) | UI contact form |

### 1.3 Borderline — your call (6 operations, recommendation included)

| Method | Path | What it is | The argument | Recommendation |
|---|---|---|---|---|
| POST | `/api/v1/item/lifecycle` | Set item lifecycle status (draft/live/paused) | Designed for a `network_service` acting-org (voice/ecosystem manager) → integrator-facing; but no live caller found and it also works session-self | **In docs** (it exists for integrators) |
| POST | `/api/v1/action/update-status` | Update an action's status (self-acted only) | Mostly UI-driven, but `integrating-dpgs.md` explicitly documents its constraints for apikey integrators | **In docs** (already part of the documented integration contract) |
| GET | `/api/v1/event/fetch` | Read stored events | No caller found anywhere — future surface or dead plumbing | **Hide** until a real consumer exists |
| POST | `/api/v1/network/item/count_local` | Peer count of local items (HMAC peer-only) | Pure instance-to-instance plumbing; but pairs with `fetch_local` as the peer protocol deployers expose | **In docs** (keep the peer protocol documented as a unit) |
| POST | `/api/v1/network/refetch_schemas` | Force schema-cache refresh | Operational cache-bust; no caller found | **Hide** (ops plumbing; mention in deployment guide instead) |
| GET | `/` | Root status/liveness | Useful as a probe, but not part of the integration API | **Hide** from docs (probes belong in the deployment guide) |

---

## 2. Aggregator-DPG

### 2.1 Required in docs (5 operations — recommended)

Aggregator-dpg has no external DPG calling it (verified: nothing in Signals or the worker calls
this API) — its genuinely public surface is the anonymous participant-registration flow and the
probes a deployer wires up.

| Method | Path | What it is | Who uses it | Why it belongs in docs |
|---|---|---|---|---|
| GET | `/health/live` | Liveness probe | Infra (k8s/load-balancer) | Deployers monitoring their own instance |
| GET | `/health/ready` | Readiness probe (Postgres+Redis reachability) | Infra | Same |
| GET | `/public/v1/aggregators/{orgSlug}/links/{slug}` | Resolve a public registration link | Anonymous QR-code flow (`[org]/[slug]/page.tsx:68`) | Genuinely public, participant-facing |
| POST | `/public/v1/aggregators/{orgSlug}/registrations/{slug}` | Submit a public participant registration | Anonymous QR flow (`submit/route.ts:111`) | Same |
| GET | `/public/v1/aggregators/{orgSlug}/lookup` | Probe an identity before opening the form | Anonymous QR flow (`lookup/route.ts:79`) | Same |

### 2.2 Not required in docs — internal only (23 operations — recommended)

Every one of these is reached **only** through the Aggregator portal's own BFF (session-cookie
auth via `callApi`) — the portal is the sole consumer.

| Method | Path | What it is | Who uses it | Why hide |
|---|---|---|---|---|
| POST | `/v1/aggregator-registrations/create` | Submit a coordinator registration | Portal BFF via service token (`register/route.ts`) | Anonymous users only reach it through the portal |
| GET | `/admin/v1/aggregator-registrations/read/{id}` | Admin approve/reject HTML confirm page | Signed email links (renders HTML, `approval-pages.ts`) | Email-link admin flow, not a JSON API |
| POST | `/admin/v1/aggregator-registrations/decision/{id}` | Apply approve/reject decision | HTML form POST from the confirm page | Same email-link flow |
| POST | `/admin/v1/aggregator-registrations/renew/{id}` | Regenerate expired approval link | Link on the result page | Same email-link flow |
| GET | `/v1/aggregators/profile/me` | Read own aggregator profile | Portal BFF (`profile/me/route.ts`) | Portal-only |
| PATCH | `/v1/aggregators/profile/me` | Update own profile | Portal BFF | Portal-only |
| POST | `/v1/links/create` | Create a registration link | Portal BFF (`links/route.ts`) | Portal-only |
| GET | `/v1/links` | List own registration links | Portal BFF | Portal-only |
| PATCH | `/v1/links/{id}` | Update a link | Portal BFF | Portal-only |
| GET | `/v1/links/{id}` | Read a link | Portal BFF | Portal-only |
| POST | `/v1/links/{id}/activate` | Activate a link | Portal BFF | Portal-only |
| POST | `/v1/links/{id}/deactivate` | Deactivate a link | Portal BFF | Portal-only |
| GET | `/v1/bulk-uploads/template` | Download CSV template | Portal BFF | Portal-only |
| POST | `/v1/bulk-uploads` | Create a bulk-upload job | Portal BFF | Portal-only |
| GET | `/v1/bulk-uploads` | List bulk-upload jobs | Portal BFF | Portal-only |
| POST | `/v1/bulk-uploads/{id}/start` | Start a pending job | Portal BFF | Portal-only |
| GET | `/v1/bulk-uploads/{id}` | Read a job | Portal BFF | Portal-only |
| GET | `/v1/bulk-uploads/{id}/errors.csv` | Per-row error CSV | Portal BFF | Portal-only |
| GET | `/v1/onboarding/summary` | Onboarding totals | Portal BFF | Portal dashboard metric |
| GET | `/v1/onboarding/by-source` | Totals by source | Portal BFF | Portal dashboard metric |
| GET | `/v1/dashboard` | Dashboard rollup | Portal BFF | Portal-only |
| GET | `/v1/dashboard/items` | Participants list (paginated) | Portal BFF | Portal-only |
| GET | `/v1/dashboard/export` | Dashboard CSV export | Portal BFF | Portal-only |
| POST | `/v1/dashboard/export/profiles` | **Decrypted** profile CSV export | Portal BFF | Portal-only; sensitive — good reason not to advertise |
| GET | `/v1/support/config` | Is the support form enabled | Portal BFF | Portal-only toggle |
| POST | `/v1/support` | Send a support message | Portal BFF | Portal-only |

### 2.3 Borderline — your call (2 operations, recommendation included)

| Method | Path | What it is | The argument | Recommendation |
|---|---|---|---|---|
| GET | `/v1/aggregator-config` | Public brand + network config | Only the portal fetches it, but it's deliberately unauthenticated deploy-time config a self-hoster inspects | **In docs** (it's the instance's public "who am I" endpoint) |
| POST | `/admin/v1/aggregator-registrations/cleanup-stale` | Prune stale pending registrations (service-auth) | No caller in any repo (external cron/scheduler); internal plumbing — but a self-hosting deployer must know to schedule it | **In docs** (a deployer's cron has to call it; alternatively document it in the deployment guide and hide here) |

---

## 3. Net effect if recommendations are accepted

| Service | Total ops | In docs | Hidden |
|---|---|---|---|
| Signals-DPG | 48 | 17 (14 + 3 borderline kept) | 31 |
| Aggregator-DPG | 30 | 7 (5 + 2 borderline kept) | 23 |
| Signals-Search | 3 | 3 | 0 |

The published reference becomes a focused integration contract (schemas, network protocol,
service-auth admin surface, public registration) instead of an inventory of UI plumbing.

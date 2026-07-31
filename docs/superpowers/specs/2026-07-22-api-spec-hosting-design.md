# Design: Standardize API docs across the three services and host them in bluedots-docs

- **Date:** 2026-07-22 (supersedes the 2026-07-15 revision of this document)
- **Status:** Approved (ready for implementation planning)
- **Tracking issue:** #1 (`type:epic`, `est:5d`, priority p2) — *Migrate API documentation
  (aggregator, Signals-DPG, signals-search) into bluedots-docs*
- **Repos touched:** `bluedots-docs` (consumer/renderer), `aggregator-dpg`, `signals-dpg`,
  `signals-search` (producers)

> **Changes from the 2026-07-15 revision.** (1) Environment facts refreshed after the
> org-repo migration: `bluedots-docs` `main` is Astro **5** + Starlight **0.36**, deployed to
> `https://docs-signals-dpg.bluedotseconomy.org` (host since renamed to
> `https://docs.bluedotseconomy.org`; the old host redirects) — the compatibility check in §8 must run
> against these versions. (2) The signals-search static spec `local_docs/signals-search-openapi.yaml`
> cited in issue #1 **does not exist** (never tracked in git); the "retire the static spec"
> step is dropped. (3) New scope, at the user's request: **runtime docs standardization**
> (§6) — this deliberately overrides the prior revision's non-goal of leaving each service's
> served reference untouched. (4) New scope: **spec metadata standardization** (§5).
> (5) Branch convention recorded: work in the three service repos is cut from latest
> `origin/feature` (never committed directly to `feature`/`develop`).

## 1. Goal

Two coupled outcomes, in order:

1. **Standardize** how all three Fastify APIs — `aggregator-dpg`, `signals-dpg`,
   `signals-search` — produce and serve API documentation: one identical spec pipeline, one
   consistent metadata shape, one runtime docs experience, one sync mechanism.
2. **Host** the resulting OpenAPI references as searchable, themed pages inside the existing
   Blue Dots Economy Starlight docs site (`bluedots-docs`, GitHub Pages at
   `https://docs-signals-dpg.bluedotseconomy.org`, since renamed to
   `https://docs.bluedotseconomy.org`), readable **without any service running**.

The specs must stay current automatically: when an API's contract changes on its default
branch, the hosted reference updates without a human hand-copying JSON.

## 2. Background & constraints (audited 2026-07-22)

All three services are already on the same generation stack — Fastify 5 + Zod route schemas +
`@fastify/swagger` (`fastify-type-provider-zod`) producing OpenAPI **at runtime**. None
commits a static spec file today. Current state per repo:

| | signals-search | signals-dpg | aggregator-dpg |
|---|---|---|---|
| Routes with Zod schemas | 3/3 | ~47/47 | 38/38 |
| Served docs UI | `@fastify/swagger-ui` at `/documentation` | Scalar at `/api/reference` | Scalar at `/api/reference` |
| No-listen app factory | ✅ `buildServer({deps})` | ❌ `server.ts` listens at module top level | ✅ `buildApp()` |
| OpenAPI smoke test | ✅ `src/api/openapi.test.ts` | ❌ none | ✅ `apps/api/src/app.openapi.test.ts` |
| Committed spec / docs CI | ❌ / ❌ | ❌ / ❌ | ❌ / ❌ |
| Docs-UI prod gating | none (always on) | none (always on) | `API_REFERENCE_ENABLED` + `API_REFERENCE_FORCE` (off in production unless forced) |
| Metadata quirks | version hard-coded `1.0.0` (package.json says `0.1.0`) | `info.title` is just `"DPG"`, version hard-coded | — |

Other constraints:

- The local workspace root is **not** a git repo; each service is its own independent git
  repo. Cross-repo delivery therefore needs an explicit transport, not a shared workspace
  build.
- All four repos are **public** on the `Blue-Dots-Economy` org; default branch `main`
  everywhere. Service-repo work is cut from latest `origin/feature` (integration branch);
  nothing is committed directly to `feature`/`develop`.
- `bluedots-docs` auto-deploys to GitHub Pages on **push to `main`** via
  `.github/workflows/deploy.yml` (`withastro/action` + `deploy-pages`); custom domain pinned
  by `public/CNAME`.
- Decisions locked with the user (2026-07-22 session, re-confirming the 2026-07-15 set and
  extending it):
  - **Sync model:** CI auto-sync via **auto-PR** from each source repo (instant on merge,
    human review gate) — not manual export, not build-time fetch, not docs-repo pull/cron.
  - **Rendering:** the `starlight-openapi` plugin (integrated Starlight pages), with embedded
    Scalar viewer pages as the fallback (§8).
  - **Standardization scope:** spec pipeline + spec metadata + runtime docs UX + one hosting
    mechanism for all three.
  - **Sync auth (PAT vs GitHub App):** decided during implementation.

## 3. Architecture

Three cleanly separated concerns, one per stage — identical for every service:

```
GENERATE (each source repo)
  pnpm spec:dump
    → build the Fastify app in-process (no listen, no DB/Redis)
    → app.ready(); app.swagger()
    → write ./openapi.json  ← COMMITTED in the source repo (acceptance criterion #1)
        │  (a CI drift-check re-runs spec:dump and fails if the committed file is stale)
        │
TRANSPORT (each source repo CI, on merge to default branch)
    → open/update an auto-PR into bluedots-docs
      writing src/openapi/<repo>.json   (skipped when the JSON is unchanged)
        │
RENDER (bluedots-docs, after the PR merges to main)
    → starlight-openapi reads the 3 committed JSON files
    → generates an "API Reference" sidebar group (one page per operation) + index page
    → existing deploy.yml → GitHub Pages
```

Invariant: `bluedots-docs`'s build reads only committed files — no network calls, fully
reproducible, and it never needs to boot a service. The **source-repo commit** is the
canonical, code-generated artifact; the copy in `bluedots-docs` is a synced mirror.

### Spec filenames (contract between producers and consumer)

| Source repo       | Committed path in bluedots-docs      |
| ----------------- | ------------------------------------ |
| `signals-dpg`     | `src/openapi/signals-dpg.json`       |
| `aggregator-dpg`  | `src/openapi/aggregator-dpg.json`    |
| `signals-search`  | `src/openapi/signals-search.json`    |

## 4. Producer side — the standard `spec:dump` kit, per repo

Each repo gains the identical kit: `scripts/dump-openapi.ts`, a package script `"spec:dump"`,
a committed `./openapi.json`, a CI drift-check, and an OpenAPI smoke test. The dump script
builds the app instance, calls `app.swagger()`, and writes the JSON to the committed
repo-local path. It **exits non-zero if `app.swagger()` throws**, so a broken contract fails
CI instead of publishing a degraded spec.

**Committed + drift-checked (acceptance criterion #1).** `openapi.json` is committed in the
source repo and is the canonical code-generated artifact. A CI check re-runs `spec:dump` and
fails the build if the committed file differs from freshly generated output — this is what
prevents hand-maintained drift. Developers regenerate and commit it when they change a route.

Shared shape:

```ts
// scripts/dump-openapi.ts (per repo; imports differ)
const app = /* build the Fastify instance WITHOUT listening */;
await app.ready();
const spec = app.swagger();
await writeFile('openapi.json', JSON.stringify(spec, null, 2));
await app.close();
```

Per-repo specifics:

### 4.1 aggregator-dpg — easy

- `apps/api/src/app.ts` already exports `async function buildApp()`, and
  `apps/api/src/app.openapi.test.ts` already does `buildApp() → ready() → app.swagger()`.
  The dump script mirrors that test.
- **Gotcha:** `@fastify/swagger` + Scalar only register when `apiReferenceEnabled` is true,
  and that flag is force-disabled under `NODE_ENV=production`. The dump must run with the
  reference **enabled** (set the enabling env, and do not run it as `NODE_ENV=production`).

### 4.2 signals-search — easy

- `src/api/server.ts` exports `buildServer({ deps })`, a no-listen factory that always
  registers swagger.
- `deps` (sql / redis / embedder / registry / …) are only used at request time, not at route
  registration, so the dump passes **stub deps**: dummy `sql`/`redis`/`embedder` objects plus
  a real `NetworkRegistry` loaded from the repo's `network.json`. The spec derives purely from
  the route Zod schemas, so the stubs are never invoked.

### 4.3 signals-dpg — medium (requires a small refactor)

- `apps/api/src/server.ts` builds `app` at module top-level, performs async network-config
  loading, and calls `app.listen(...)` at module scope — there is **no factory** and importing
  the module starts a server.
- **Refactor:** extract a no-listen `export async function buildApp(): Promise<FastifyInstance>`
  that does everything up to (but not including) `listen()`; move `listen()` into a thin
  `main()` entry (or an `if (isMainEntry)` guard) so the production boot path is unchanged.
  `@fastify/swagger` already always registers here.
- The dump runs with `NETWORK_CONFIG_SOURCE=local` pointed at an example `network.json`, so it
  needs no database or remote network fetch.
- Add the missing OpenAPI smoke test (build → ready → swagger → assert non-empty `paths`),
  mirroring the other two repos.

## 5. Spec metadata standardization (all three repos)

The dumped (and served) spec's `info`/`servers`/security metadata is made consistent and
accurate:

- **Titles:** proper service names — e.g. signals-dpg's `info.title` changes from `"DPG"` to
  a real title (`"Signals DPG API"`); the other two keep their already-descriptive titles.
- **Versions:** `info.version` read from each repo's `package.json` version instead of
  hard-coded `1.0.0` literals (signals-search currently ships `1.0.0` while its package is
  `0.1.0`).
- **Server URLs:** `servers[].url` in the dumped spec must advertise the **public** API base
  URL, not `localhost`. signals-dpg derives it from `getCurrentApiBaseUrl()` — the dump
  supplies the env for the public URL; the equivalent is confirmed/set for aggregator-dpg and
  signals-search.
- **Auth schemes & tags:** each spec documents its real auth scheme consistently
  (signals-search `x-api-key` apiKey; aggregator-dpg `bearerAuth` JWT; signals-dpg's
  service-auth headers), and every route carries a tag so the rendered reference groups
  cleanly.

## 6. Runtime docs standardization (all three repos)

*(Deliberately overrides the 2026-07-15 revision's non-goal "no change to how the services
serve their own reference." The user asked for one identical serving mechanism.)*

The standard, adopted from what 2 of 3 services already do:

- **Renderer:** Scalar (`@scalar/fastify-api-reference`) — signals-search swaps out
  `@fastify/swagger-ui`.
- **Route:** `/api/reference` on every service — signals-search moves off `/documentation`
  (its `openapi.test.ts` updates accordingly; the swagger-ui-provided `/documentation/json`
  endpoint goes away — the committed `openapi.json` and the hosted reference replace it).
- **Gating convention:** aggregator-dpg's env switch everywhere — `API_REFERENCE_ENABLED`
  (default `true`) and `API_REFERENCE_FORCE` (default `false`), with
  `enabled = API_REFERENCE_ENABLED && (NODE_ENV !== 'production' || API_REFERENCE_FORCE)`.
  Result: docs UI on by default in dev, off on production deployments unless explicitly
  forced; the always-available reference is the bluedots-docs site. signals-dpg and
  signals-search add the switch; aggregator-dpg is unchanged.

## 7. Transport — per-repo sync workflow

Each source repo gets `.github/workflows/openapi-sync.yml` (identical across repos, only the
repo name differs):

- **Trigger:** push to the repo's default branch (`main`), plus `workflow_dispatch` for
  manual runs.
- **Steps:** take the committed `./openapi.json` (already drift-checked in CI, §4) → check out
  `bluedots-docs` → copy it to `src/openapi/<repo>.json` → if changed, commit to a branch
  (e.g. `openapi-sync/<repo>`) and **open or update a PR** into `bluedots-docs`. **No-op (no
  PR) when the JSON is byte-identical** to what's already committed there.
- **Auth (operational prerequisite):** a repo secret holding a token scoped to push branches
  and open PRs on `bluedots-docs` (fine-grained PAT or GitHub App token — chosen during
  implementation). Must be provisioned in each of the three source repos before the workflow
  can succeed.

The PR gives a human review gate on every contract change before it goes live; merging it to
`main` triggers the existing `deploy.yml`.

## 8. Consumer side — bluedots-docs rendering

- **Key risk, verify first in planning:** `starlight-openapi` must support the site's actual
  versions — Astro **5** + Starlight **0.36** (post org-repo migration; the previous revision
  checked different versions). Check the plugin's peer-dependency range and do a throwaway
  build before anything else.
  - **If compatible:** proceed as below.
  - **If not:** fall back to **embedded Scalar viewer pages** — one Starlight page per API
    that renders the committed spec via Scalar. Same specs, same transport, different
    renderer; only this section changes.
- Add `starlight-openapi` as a dependency; register its Starlight plugin in
  `astro.config.mjs`, pointing at the three files in `src/openapi/`.
- Add a top-level sidebar group **"API Reference"** with three sub-entries — Signals-DPG,
  Aggregator-DPG, Signals-Search — each auto-generating one page per operation (searchable,
  deep-linkable, themed for light/dark).
- Add an **"API Reference" index/landing page** (acceptance criterion #4) that introduces the
  three services and links to each generated reference — one entry point for all APIs.
- Keep the existing hand-written `guides/api-reference.md` as the narrative guide; the
  generated reference is the exhaustive contract. Add cross-links between the two.
- Commit bootstrap specs so the site builds before the sync workflows first run (generated
  once manually via `pnpm spec:dump` in each repo).

## 9. Testing & guardrails

- **Producer:** `spec:dump` exiting non-zero on a `swagger()` failure, plus the committed-spec
  drift-check (§4), are the per-repo guards. All three repos end up with an OpenAPI smoke
  test (build → ready → swagger → assert non-empty `paths`; aggregator-dpg's existing test
  already goes further and stays).
- **Consumer:** `bluedots-docs`' existing `pnpm build` (run in `deploy.yml`) with all three
  specs present is the integration check — a malformed or unreadable spec fails the build
  before it can deploy.

## 10. Rollout order

1. **bluedots-docs:** verify `starlight-openapi` compatibility (§8); wire the plugin +
   sidebar + index page; commit three bootstrap specs generated manually. Site renders
   end-to-end.
2. **signals-search** and **aggregator-dpg** (the two easy producers): the §4 kit + §5
   metadata fixes; signals-search additionally gets the full §6 conversion
   (Scalar + `/api/reference` + gating switch).
3. **signals-dpg:** refactor `server.ts` to extract `buildApp()`, then the §4 kit + §5
   metadata fixes + §6 gating switch.
4. Provision the cross-repo PR token secret in all three source repos (auth mechanism chosen
   here); confirm each workflow opens a PR and the merged spec deploys.

Branching: in each service repo, work happens on a new branch cut from **latest
`origin/feature`**, PR'd back into `feature` per project convention — nothing is committed
directly to `feature`/`develop`. All tracked under issue #1.

## 11. Acceptance-criteria traceability (issue #1)

| Issue #1 acceptance criterion | Where satisfied |
| --- | --- |
| Code-generated OpenAPI committed in each of the 3 repos | §4 — committed `./openapi.json` + CI drift-check |
| All 3 references rendered on GitHub Pages, readable with no service running | §3 invariant + §8 (`starlight-openapi` reads committed files) |
| Documented/automated sync keeps specs current on release, no hand drift | §4 drift-check + §7 auto-PR on merge to default branch |
| Index page links all three | §8 — "API Reference" landing page |

Stale facts in issue #1, corrected by this design: aggregator-dpg *does* already have
`@fastify/swagger` (nothing to add); the signals-search static spec
`local_docs/signals-search-openapi.yaml` does not exist (nothing to retire).

## 12. Non-goals

- No build-time fetching of specs from live/deployed APIs (rejected during brainstorming).
- No "try it" request console requirement beyond whatever the chosen renderer provides.
- No OpenAPI coverage for aggregator-dpg's Next.js BFF proxy routes (`apps/web`) or worker —
  only the Fastify API is the documented contract.
- No inter-service auth or federation changes.

# Design: Host the API specs of aggregator-dpg, signals-dpg, and signals-search in bluedots-docs

- **Date:** 2026-07-15
- **Status:** Approved (ready for implementation planning)
- **Tracking issue:** #1 (`type:epic`, `est:5d`, priority p2) — *Migrate API documentation
  (aggregator, Signals-DPG, signals-search) into bluedots-docs*
- **Repos touched:** `bluedots-docs` (consumer/renderer), `aggregator-dpg`, `signals-dpg`, `signals-search` (producers)

> **Note — this spec supersedes one stale detail in issue #1.** The issue states aggregator-dpg
> has *"no swagger dependency currently"* and must *"add code-generated OpenAPI."* That is no
> longer true: `aggregator-dpg/apps/api` already depends on `@fastify/swagger` +
> `@scalar/fastify-api-reference`, exports `buildApp()`, and has a passing `app.openapi.test.ts`
> that calls `app.swagger()`. Aggregator is therefore an *easy* producer (§4.1) — nothing to add.

## 1. Goal

Publish the OpenAPI reference for all three Fastify APIs — `aggregator-dpg`, `signals-dpg`,
and `signals-search` — as searchable, themed pages inside the existing Blue Dots Economy
Starlight docs site (`bluedots-docs`, deployed to GitHub Pages at
`https://docs-signals-dpg.bluedotseconomy.org`).

The specs must stay current automatically: when an API's contract changes on its default
branch, the hosted reference updates without a human hand-copying JSON.

## 2. Background & constraints

- All three services generate their OpenAPI document **at runtime** from Zod route schemas
  via `@fastify/swagger` (`fastify-type-provider-zod`). None commits a static spec file today.
  - `aggregator-dpg` and `signals-dpg` render it with `@scalar/fastify-api-reference`.
  - `signals-search` renders it with `@fastify/swagger-ui`.
- The workspace root is **not** a git repo; each service is its own independent git repo.
  Cross-repo delivery therefore needs an explicit transport, not a shared workspace build.
- `bluedots-docs` is Astro **6** + Starlight **0.39** (pnpm), and auto-deploys to GitHub Pages
  on **push to `main`** via `.github/workflows/deploy.yml`.
- Decisions locked during brainstorming:
  - **Sync model:** CI auto-sync (not manual export, not build-time fetch).
  - **Transport:** each *source* repo generates its own spec and delivers it into
    `bluedots-docs` via **auto-PR**.
  - **Rendering:** the `starlight-openapi` plugin (integrated Starlight pages), not embedded
    Scalar viewers — subject to the compatibility check in §7.

## 3. Architecture

Three cleanly separated concerns, one per stage:

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
canonical, code-generated artifact (satisfying acceptance criterion #1); the copy in
`bluedots-docs` is a synced mirror.

### Spec filenames (contract between producers and consumer)

| Source repo       | Committed path in bluedots-docs      |
| ----------------- | ------------------------------------ |
| `signals-dpg`     | `src/openapi/signals-dpg.json`       |
| `aggregator-dpg`  | `src/openapi/aggregator-dpg.json`    |
| `signals-search`  | `src/openapi/signals-search.json`    |

## 4. Producer side — `spec:dump` per repo

Each repo gains a script `scripts/dump-openapi.ts` and a package script `"spec:dump"` (name
per issue #1) that builds the app instance, calls `app.swagger()`, and writes the JSON to a
**committed** repo-local path, `./openapi.json`. The script **exits non-zero if `app.swagger()`
throws**, so a broken contract fails CI instead of publishing a degraded spec.

**Committed + drift-checked (acceptance criterion #1).** `openapi.json` is committed in the
source repo and is the canonical code-generated artifact. A CI check re-runs `spec:dump` and
fails the build if the committed file differs from freshly generated output — this is what
prevents hand-maintained drift. Developers regenerate and commit it when they change a route
(or a pre-commit/CI-fix step does it for them).

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
  registration, so the dump passes **stub deps**: dummy `sql`/`redis`/`embedder` objects plus a
  real `NetworkRegistry` loaded from the repo's `network.json`. The spec derives purely from
  the route Zod schemas, so the stubs are never invoked.
- **Retire the static spec.** `signals-search` currently carries a hand-portable
  `local_docs/signals-search-openapi.yaml` (and serves `GET /documentation/json` at runtime).
  The committed, code-generated `openapi.json` becomes the single source; remove or deprecate
  the static YAML to avoid a second drifting copy.

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

### 4.4 Public server URL in the dumped spec

`signals-dpg`'s spec sets `servers[].url` from `getCurrentApiBaseUrl()`. The dump must supply
an env so the hosted reference advertises the **public** API base URL, not `localhost`.
Confirm the equivalent for `aggregator-dpg`/`signals-search` and set each accordingly.

## 5. Transport — per-repo sync workflow

Each source repo gets `.github/workflows/openapi-sync.yml`:

- **Trigger:** push to the repo's default branch (plus `workflow_dispatch` for manual runs).
- **Steps:** take the committed `./openapi.json` (already drift-checked in CI, §4) → check out
  `bluedots-docs` → copy it to `src/openapi/<repo>.json` → if changed, commit to a branch
  (e.g. `openapi-sync/<repo>`) and **open or update a PR** into `bluedots-docs`. **No-op (no PR)
  when the JSON is byte-identical** to what's already committed there.
- **Auth (operational prerequisite):** a repo secret holding a token scoped to push branches
  and open PRs on `bluedots-docs` (fine-grained PAT or GitHub App token). This must be
  provisioned in each of the three source repos before the workflow can succeed.

The PR gives a human review gate on every contract change before it goes live; merging it to
`main` triggers the existing `deploy.yml`.

## 6. Consumer side — bluedots-docs rendering

- Add `starlight-openapi` as a dependency; register its Starlight plugin in
  `astro.config.mjs`, pointing at the three files in `src/openapi/`.
- Add a top-level sidebar group **"API Reference"** with three sub-entries — Signals-DPG,
  Aggregator-DPG, Signals-Search — each auto-generating one page per operation (searchable,
  deep-linkable, themed for light/dark).
- Add an **"API Reference" index/landing page** (acceptance criterion #4) that introduces the
  three services and links to each generated reference — one entry point for all APIs.
- Keep the existing hand-written **"API"** section (the signals-dpg conceptual/route prose) as
  the narrative guide; the generated reference is the exhaustive contract. Add cross-links
  between the two so readers can move from concept → exact operation.
- Commit placeholder/initial specs so the site builds before the sync workflows first run
  (bootstrapped once manually via `openapi:dump` in each repo).

## 7. Key risk — plugin compatibility (verify first in planning)

`starlight-openapi` must support **Astro 6 + Starlight 0.39**. This is the first thing the
implementation plan verifies (check the plugin's peer-dependency range against the installed
versions and do a throwaway build).

- **If compatible:** proceed as in §6.
- **If not:** fall back to **embedded Scalar viewer pages** — one Starlight page per API that
  renders the committed spec via Scalar. Same specs, same transport, different renderer; only
  §6 changes. This keeps the risk contained to the render stage.

## 8. Testing & guardrails

- **Producer:** `spec:dump` exiting non-zero on a `swagger()` failure, plus the committed-spec
  drift-check (§4), are the per-repo guards.
  `aggregator-dpg` already has `app.openapi.test.ts` asserting the spec builds and covers the
  operation surface; add an equivalent smoke assertion for `signals-dpg` and `signals-search`
  (build → ready → swagger → assert non-empty `paths`).
- **Consumer:** `bluedots-docs`' existing `pnpm build` (run in `deploy.yml`) with all three
  specs present is the integration check — a malformed or unreadable spec fails the build
  before it can deploy.

## 9. Rollout order

1. **bluedots-docs:** verify `starlight-openapi` compatibility (§7); wire the plugin + sidebar;
   commit three bootstrap specs generated manually. Site renders end-to-end.
2. **signals-search** and **aggregator-dpg:** add `openapi:dump` + smoke test + `openapi-sync`
   workflow (the two easy producers).
3. **signals-dpg:** refactor `server.ts` to extract `buildApp()`, then add `openapi:dump` +
   smoke test + `openapi-sync` workflow.
4. Provision the cross-repo PR token secret in all three source repos; confirm each workflow
   opens a PR and the merged spec deploys.

Each repo's work lands on its own branch with a single rolling PR into that repo's integration
branch (`feature`), per project convention; all tracked under issue #1.

## 10. Acceptance-criteria traceability (issue #1)

| Issue #1 acceptance criterion | Where satisfied |
| --- | --- |
| Code-generated OpenAPI committed in each of the 3 repos | §4 — committed `./openapi.json` + CI drift-check |
| All 3 references rendered on GitHub Pages, readable with no service running | §3 invariant + §6 (`starlight-openapi` reads committed files) |
| Documented/automated sync keeps specs current on release, no hand drift | §4 drift-check + §5 auto-PR on merge to default branch |
| Index page links all three | §6 — "API Reference" landing page |

## 11. Non-goals

- No build-time fetching of specs from live/deployed APIs (rejected during brainstorming).
- No "try it" request console requirement beyond whatever the chosen renderer provides.
- No change to how the services *serve* their own reference (Scalar/swagger-ui) at runtime.
- No inter-service auth or federation changes.

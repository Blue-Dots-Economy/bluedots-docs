# API Docs Standardize + Host Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every service commits a code-generated `openapi.json` (drift-checked in CI), serves Scalar at `/api/reference` with the standard prod-gating, and auto-PRs its spec into `bluedots-docs`, which renders all three references on GitHub Pages via `starlight-openapi`.

**Architecture:** Three stages per the approved spec (`docs/superpowers/specs/2026-07-22-api-spec-hosting-design.md`): GENERATE (`pnpm spec:dump` → committed `./openapi.json` at each repo root) → TRANSPORT (`openapi-sync.yml` auto-PR into `bluedots-docs/src/openapi/<repo>.json`) → RENDER (`starlight-openapi` plugin + "API Reference" sidebar group + landing page). Execution order deviates from the spec's rollout order deliberately: producers first, docs repo second — the producer-committed `openapi.json` files ARE the bootstrap specs (no throwaway manual dump needed).

**Tech Stack:** Fastify 5 + `@fastify/swagger` + `fastify-type-provider-zod` (all three services), `@scalar/fastify-api-reference`, tsx, vitest, GitHub Actions + `peter-evans/create-pull-request`, Astro 5 + Starlight 0.36 + `starlight-openapi@0.22.1`.

## Global Constraints

- **Compatibility (verified 2026-07-22):** `starlight-openapi@0.22.1` peer-requires `astro >=5.5.0`, `@astrojs/starlight >=0.34.0` — satisfied by the site's `astro ^5.14.0` / `@astrojs/starlight ^0.36.0`. **Pin exactly `0.22.1`** — `0.23.0+` requires Astro 6 and will not install.
- **Branching:** in each service repo, create the work branch from **latest `origin/feature`** (`git fetch origin && git checkout -b feat/api-docs-standardize origin/feature`). Never commit to `feature`/`develop` directly. One PR per repo into `feature`. bluedots-docs work continues on `spec/api-spec-hosting` → PR into `main`.
- **Spec file contract:** committed spec is `./openapi.json` at each repo **root** (also for the two monorepos). In bluedots-docs the mirrors are `src/openapi/signals-dpg.json`, `src/openapi/aggregator-dpg.json`, `src/openapi/signals-search.json`.
- **Gating formula (identical everywhere):** `enabled = API_REFERENCE_ENABLED && (<prod-env-signal> !== 'production' || API_REFERENCE_FORCE)`; `API_REFERENCE_ENABLED` defaults `true`, `API_REFERENCE_FORCE` defaults `false`. Prod signal is `NODE_ENV` in aggregator-dpg and signals-search, `INSTANCE_ENV` in Signals-DPG (its existing prod marker).
- **Public base URLs (`servers[].url`):** the dump must embed each service's public API base URL. **These values come from the user** — see "Inputs required" below. Until provided, the code paths read them from env (`PUBLIC_API_BASE_URL` / `API_DOMAIN`) with localhost fallbacks so nothing blocks.
- **Sync auth:** repo secret `DOCS_SYNC_TOKEN` in each of the three service repos — a fine-grained PAT (owner `Blue-Dots-Economy`, repo `bluedots-docs`, permissions: Contents read/write + Pull requests read/write). GitHub App is the documented alternative; PAT chosen for simplicity (revisit at renewal).
- **Repo conventions:** Signals-DPG files are snake_case; new Signals-DPG env vars must be added in BOTH `packages/config/src/secrets.ts` AND `turbo.json` (two-places rule). aggregator-dpg requires Conventional Commits (husky enforces).

## Inputs required from the user (before merging, not before starting)

1. Public API base URL for **Signals-DPG** (goes into `apps/api/scripts/dump_openapi.env` as `API_DOMAIN`).
2. Public API base URL for **aggregator-dpg** (`PUBLIC_API_URL` in its dump script env — reuses the repo's existing public-origin env per Task 4 review decision).
3. Public API base URL for **signals-search** (`PUBLIC_API_BASE_URL` in its dump script env).
4. Creation of the `DOCS_SYNC_TOKEN` PAT + adding it as an Actions secret in all three service repos (Task 12).

---

# Phase 1 — signals-search (branch `feat/api-docs-standardize` from `origin/feature`)

### Task 1: Convert served docs to Scalar at /api/reference with standard gating

**Files:**
- Modify: `package.json` (deps)
- Modify: `src/api/server.ts`
- Modify: `src/config.ts`
- Modify: `src/api/main.ts`
- Test: `src/api/openapi.test.ts`

**Interfaces:**
- Produces: `buildServer(opts: { deps: ApiDeps; apiReference?: { enabled: boolean; publicBaseUrl?: string } })` — `apiReference` defaults to `{ enabled: true }`. When `enabled` is false, neither `@fastify/swagger` nor Scalar registers (so `app.swagger()` throws — the dump always passes `enabled: true`). Task 2's dump script consumes this signature.
- Produces: `loadConfig()` gains `apiReference: { enabled: boolean; publicBaseUrl?: string }`.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/srivastha/KKB/Github/signals-search
git fetch origin && git checkout -b feat/api-docs-standardize origin/feature
```

- [ ] **Step 2: Swap dependencies**

```bash
pnpm remove @fastify/swagger-ui
pnpm add @scalar/fastify-api-reference@^1.57.5
pnpm add -D tsx@^4.19.2
```

- [ ] **Step 3: Update the tests to the new contract (failing first)**

In `src/api/openapi.test.ts`, replace the third test (`serves the spec JSON at /documentation/json`) with these two, and leave the first two tests untouched:

```ts
  it('serves the Scalar reference UI at /api/reference when enabled', async () => {
    const app = buildServer({ deps });
    const res = await app.inject({ method: 'GET', url: '/api/reference' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    await app.close();
  });

  it('registers no docs surface when apiReference is disabled', async () => {
    const app = buildServer({ deps, apiReference: { enabled: false } });
    const res = await app.inject({ method: 'GET', url: '/api/reference' });
    expect(res.statusCode).toBe(404);
    // swagger plugin is skipped too — the decorator must not exist
    expect((app as { swagger?: unknown }).swagger).toBeUndefined();
    await app.close();
  });

  it('embeds the public server URL and package.json version when configured', async () => {
    const app = buildServer({
      deps,
      apiReference: { enabled: true, publicBaseUrl: 'https://search.example.org' },
    });
    await app.ready();
    const spec = app.swagger() as {
      info: { version: string };
      servers?: Array<{ url: string }>;
    };
    expect(spec.servers?.[0]?.url).toBe('https://search.example.org');
    expect(spec.info.version).not.toBe('1.0.0'); // hard-coded literal is gone
    await app.close();
  });
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm vitest run src/api/openapi.test.ts`
Expected: FAIL — `/api/reference` 404s, `spec.info.version` is `1.0.0`.

- [ ] **Step 5: Implement in `src/api/server.ts`**

Replace the import of `fastifySwaggerUi` and the swagger registration block (lines 9–10 import, 48–72 registration) with:

```ts
import fastifySwagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';
import { createRequire } from 'node:module';

const pkg = createRequire(import.meta.url)('../../package.json') as { version: string };
```

New options type + gate (replacing the current single-arg signature — keep everything else in `buildServer` unchanged):

```ts
export type ApiReferenceOptions = { enabled: boolean; publicBaseUrl?: string };

export function buildServer(opts: {
  deps: ApiDeps;
  apiReference?: ApiReferenceOptions;
}): FastifyInstance {
  const apiReference = opts.apiReference ?? { enabled: true };
  // ... (Fastify init, compilers, error handler unchanged) ...

  // OpenAPI generation from the route Zod schemas (must be registered before the
  // routes so its onRoute hook captures them — hence routes live in the deferred
  // plugin below). Docs surface is env-gated and secure-by-default; the
  // always-available reference is the bluedots-docs site.
  if (apiReference.enabled) {
    app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Signals Search API',
          version: pkg.version,
          description:
            'V1 search & discovery for Signals-DPG (pgvector + PostGIS). Meaning + geo + ' +
            'structured search over the shared Signals database. Auth: x-api-key header.',
        },
        ...(apiReference.publicBaseUrl
          ? { servers: [{ url: apiReference.publicBaseUrl, description: 'Public API' }] }
          : {}),
        components: {
          securitySchemes: {
            apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
          },
        },
        tags: [
          { name: 'search', description: 'Item search & discovery' },
          { name: 'health', description: 'Operational probes' },
        ],
      },
      transform: jsonSchemaTransform,
    });
    app.register(scalarApiReference, { routePrefix: '/api/reference' });
  }
```

- [ ] **Step 6: Add the gating config in `src/config.ts`**

Follow the file's existing three-places pattern (env schema field → `Config` type field → `loadConfig` mapping). Add to the Zod env schema:

```ts
  NODE_ENV: z.string().default('development'),
  API_REFERENCE_ENABLED: z.enum(['true', 'false']).default('true'),
  API_REFERENCE_FORCE: z.enum(['true', 'false']).default('false'),
  PUBLIC_API_BASE_URL: z.string().url().optional(),
```

Add to the config type:

```ts
  apiReference: { enabled: boolean; publicBaseUrl?: string };
```

Add to the mapping in `loadConfig`:

```ts
    apiReference: {
      enabled:
        e.API_REFERENCE_ENABLED === 'true' &&
        (e.NODE_ENV !== 'production' || e.API_REFERENCE_FORCE === 'true'),
      publicBaseUrl: e.PUBLIC_API_BASE_URL,
    },
```

- [ ] **Step 7: Thread it through `src/api/main.ts`**

```ts
  const app = buildServer({
    deps: { sql, redis, embedder, registry, rerank: cfg.rerank, cacheTtlSeconds: cfg.cache.ttlSeconds, embeddingDim: cfg.embedding.dim, defaultDistanceMeters: cfg.search.defaultDistanceMeters },
    apiReference: cfg.apiReference,
  });
```

- [ ] **Step 8: Verify tests pass + typecheck**

Run: `pnpm vitest run src/api/openapi.test.ts && pnpm typecheck`
Expected: PASS (all 5 tests), clean typecheck. (Full `pnpm test` needs Docker; run it if available.)

- [ ] **Step 9: Update `.env.example`** — add the three new vars with their defaults and one-line comments (`API_REFERENCE_ENABLED=true`, `API_REFERENCE_FORCE=false`, `PUBLIC_API_BASE_URL=` with a "public URL embedded in served spec" note).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: standardize served docs — Scalar at /api/reference with prod gating"
```

### Task 2: spec:dump + committed openapi.json + CI drift check

**Files:**
- Create: `scripts/dump-openapi.ts`
- Create: `openapi.json` (generated, committed)
- Modify: `package.json` (script)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `buildServer({ deps, apiReference })` from Task 1.
- Produces: `pnpm spec:dump` writes `./openapi.json`; CI fails when it's stale. Task 11 copies this file into bluedots-docs; Task 3 syncs it.

- [ ] **Step 1: Write `scripts/dump-openapi.ts`**

```ts
/**
 * Dumps the code-generated OpenAPI spec to ./openapi.json (committed).
 * No DB/Redis needed: ready() + swagger() only exercise route registration.
 * CI re-runs this and fails on drift — regenerate + commit when routes change.
 */
import { writeFile } from 'node:fs/promises';
import { buildServer, type ApiDeps } from '../src/api/server.js';

const deps = {
  sql: {} as ApiDeps['sql'],
  redis: {} as ApiDeps['redis'],
  embedder: { embed: async () => [] },
  registry: {} as ApiDeps['registry'],
  rerank: { model: 'r', defaultOn: false, topN: 50 },
  cacheTtlSeconds: 0,
  embeddingDim: 1024,
  defaultDistanceMeters: 30000,
} as ApiDeps;

// Public URL embedded in the published spec. Override for other deployments.
const publicBaseUrl = process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100';

const app = buildServer({ deps, apiReference: { enabled: true, publicBaseUrl } });
await app.ready();
const spec = app.swagger();
await writeFile(new URL('../openapi.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');
await app.close();
console.log(`openapi.json written (${Object.keys((spec as { paths: object }).paths).length} paths)`);
process.exit(0); // don't let any stray handle keep the process alive
```

> `http://localhost:3100` is the interim fallback — replace with the real public URL from "Inputs required" before merging (either hardcode it as the fallback or set `PUBLIC_API_BASE_URL` in the CI drift step + this script's docs).

- [ ] **Step 2: Add the package script** — in `package.json` `scripts`: `"spec:dump": "tsx scripts/dump-openapi.ts"`.

- [ ] **Step 3: Generate and eyeball**

Run: `pnpm spec:dump && node -e "const s=require('./openapi.json'); console.log(s.info, Object.keys(s.paths))"`
Expected: `openapi.json written (3 paths)`; info shows `version: 0.1.0`, title `Signals Search API`; paths `/health`, `/v1/search`, `/v1/search/flat`.

- [ ] **Step 4: Add the CI drift check** — in `.github/workflows/ci.yml`, after the `Build` step:

```yaml
      - name: OpenAPI spec drift check
        run: |
          pnpm spec:dump
          git diff --exit-code openapi.json || {
            echo "::error::openapi.json is stale — run 'pnpm spec:dump' and commit the result"; exit 1; }
```

- [ ] **Step 5: Commit**

```bash
git add scripts/dump-openapi.ts openapi.json package.json .github/workflows/ci.yml
git commit -m "feat: committed code-generated OpenAPI spec + CI drift check"
```

### Task 3: openapi-sync workflow

**Files:**
- Create: `.github/workflows/openapi-sync.yml`

**Interfaces:**
- Consumes: committed `./openapi.json`; repo secret `DOCS_SYNC_TOKEN` (Task 12).
- Produces: auto-PR into bluedots-docs updating `src/openapi/signals-search.json`.

- [ ] **Step 1: Write `.github/workflows/openapi-sync.yml`**

```yaml
name: OpenAPI sync → bluedots-docs

on:
  push:
    branches: [main]
    paths: [openapi.json]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/checkout@v4
        with:
          repository: Blue-Dots-Economy/bluedots-docs
          token: ${{ secrets.DOCS_SYNC_TOKEN }}
          path: docs-repo

      - name: Copy spec into docs repo
        run: cp openapi.json docs-repo/src/openapi/signals-search.json

      # No-op when the JSON is byte-identical: create-pull-request opens no PR
      # if the copy produced no diff, and updates the existing PR otherwise.
      - name: Open or update sync PR
        uses: peter-evans/create-pull-request@v7
        with:
          path: docs-repo
          token: ${{ secrets.DOCS_SYNC_TOKEN }}
          branch: openapi-sync/signals-search
          title: 'openapi-sync: signals-search'
          commit-message: 'chore: sync signals-search OpenAPI spec from source repo'
          body: |
            Automated OpenAPI sync from `Blue-Dots-Economy/signals-search` (`${{ github.sha }}`).
            Review the contract diff, then merge to publish on the docs site.
```

- [ ] **Step 2: Validate the YAML** — `node -e "require('/dev/null')"` isn't a YAML check; instead run: `npx --yes yaml-lint .github/workflows/openapi-sync.yml` (or open a PR and let Actions parse it).
Expected: valid YAML.

- [ ] **Step 3: Commit + push branch + open PR into `feature`**

```bash
git add .github/workflows/openapi-sync.yml
git commit -m "ci: auto-PR OpenAPI spec into bluedots-docs on main"
git push -u origin feat/api-docs-standardize
gh pr create --base feature --title "API docs: standardize Scalar/spec:dump/sync (bluedots-docs #1)" --fill
```

(Per repo convention the PR body needs Summary + Release Notes sections.)

---

# Phase 2 — aggregator-dpg (branch `feat/api-docs-standardize` from `origin/feature`)

### Task 4: Spec metadata — version from package.json, public server URL

**Files:**
- Modify: `apps/api/package.json` (version `0.0.0` → `1.0.0`)
- Modify: `apps/api/src/config.ts` (new `PUBLIC_API_BASE_URL` env)
- Modify: `apps/api/src/app.ts` (info.version + servers)
- Test: `apps/api/src/app.openapi.test.ts`

**Interfaces:**
- Produces: served + dumped spec has `info.version` = package version and `servers[0].url` = `config.PUBLIC_API_BASE_URL`. Task 5's dump consumes.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/srivastha/KKB/Github/aggregator-dpg
git fetch origin && git checkout -b feat/api-docs-standardize origin/feature
```

- [ ] **Step 2: Failing test first** — append to the `describe` block in `apps/api/src/app.openapi.test.ts`:

```ts
  it('carries package version and a public server URL', async () => {
    const meta = spec as unknown as {
      info: { version: string };
      servers?: Array<{ url: string }>;
    };
    expect(meta.info.version).toBe('1.0.0');
    expect(meta.servers?.[0]?.url).toBeTruthy();
  });
```

Run: `pnpm --filter @aggregator-dpg/api test -- app.openapi.test.ts` → Expected: FAIL (no `servers`, version mismatch vs package `0.0.0`).

- [ ] **Step 3: Implement**

1. `apps/api/package.json`: `"version": "1.0.0"`.
2. `apps/api/src/config.ts`: next to `API_REFERENCE_FORCE`, add (with a TSDoc comment per repo rules):

```ts
  /**
   * Public base URL advertised as servers[0].url in the OpenAPI spec (served
   * and dumped). Defaults to the local dev URL; deployments must override.
   */
  PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4000'),
```

3. `apps/api/src/app.ts` — inside the `openapi` object: replace `version: '1.0.0'` with the package version and add `servers`:

```ts
import { createRequire } from 'node:module';
const pkg = createRequire(import.meta.url)('../package.json') as { version: string };
```

```ts
        info: {
          title: 'Aggregator DPG API',
          description: '...unchanged...',
          version: pkg.version,
        },
        servers: [{ url: config.PUBLIC_API_BASE_URL, description: 'Public API' }],
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter @aggregator-dpg/api test -- app.openapi.test.ts && pnpm --filter @aggregator-dpg/api typecheck`
Expected: PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(api): openapi metadata — package version + public server url"`

### Task 5: spec:dump + committed openapi.json + CI drift check

**Files:**
- Create: `apps/api/scripts/dump-openapi.ts`
- Create: `openapi.json` (repo root, generated, committed)
- Modify: `apps/api/package.json` (script)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `buildApp()` from `apps/api/src/app.ts` (existing) — but swagger only registers when `apiReferenceEnabled`, so env must be set **before** the config module loads (dynamic import).
- Produces: `pnpm --filter @aggregator-dpg/api spec:dump` writes repo-root `./openapi.json`.

- [ ] **Step 1: Write `apps/api/scripts/dump-openapi.ts`**

```ts
/**
 * Dumps the code-generated OpenAPI spec to the repo root ./openapi.json
 * (committed; CI drift-checks it). Sets the docs-enabling env BEFORE the
 * config module loads — swagger only registers when apiReferenceEnabled.
 */
import { writeFile } from 'node:fs/promises';

process.env.API_REFERENCE_ENABLED = 'true';
process.env.API_REFERENCE_FORCE = 'true';
// Reuses the repo's existing public-origin env (decision during Task 4 review:
// no separate PUBLIC_API_BASE_URL — one source of truth).
process.env.PUBLIC_API_URL ??= 'http://localhost:4000';

const { buildApp } = await import('../src/app.js');
const app = await buildApp();
await app.ready();
const spec = app.swagger();
await writeFile(
  new URL('../../../openapi.json', import.meta.url),
  JSON.stringify(spec, null, 2) + '\n',
);
await app.close();
console.log(`openapi.json written (${Object.keys((spec as { paths: object }).paths).length} paths)`);
process.exit(0);
```

> Same interim-fallback note as Task 2: swap `http://localhost:4000` for the real public URL from "Inputs required" before merging.

- [ ] **Step 2: Package script** — `apps/api/package.json` scripts: `"spec:dump": "tsx scripts/dump-openapi.ts"`.

- [ ] **Step 3: Generate and verify**

Run: `pnpm --filter @aggregator-dpg/api spec:dump && node -e "const s=require('./openapi.json'); console.log(s.info.version, Object.keys(s.paths).length)"`
Expected: `1.0.0 30+` (≥28 operations per the existing smoke test; org routes included only if `ORG_HIERARCHY_ENABLED` default registers them — whatever the committed output is, it must be deterministic; re-run twice and `git diff` must be empty).

- [ ] **Step 4: CI drift check** — in `.github/workflows/ci.yml`, in the `ci` job after the `Build` step:

```yaml
      - name: OpenAPI spec drift check
        run: |
          pnpm --filter @aggregator-dpg/api spec:dump
          git diff --exit-code openapi.json || {
            echo "::error::openapi.json is stale — run 'pnpm --filter @aggregator-dpg/api spec:dump' and commit"; exit 1; }
```

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(api): committed code-generated openapi.json + CI drift check"`

### Task 6: openapi-sync workflow + PR

**Files:**
- Create: `.github/workflows/openapi-sync.yml`

Identical to Task 3's workflow with three substitutions: copy destination `docs-repo/src/openapi/aggregator-dpg.json`, branch `openapi-sync/aggregator-dpg`, title/commit/body say `aggregator-dpg`. (Write it out fully — copy Task 3 Step 1 and substitute.)

- [ ] **Step 1: Write the workflow** (as above)
- [ ] **Step 2: Commit + push + PR into `feature`**

```bash
git add .github/workflows/openapi-sync.yml
git commit -m "ci: auto-PR openapi spec into bluedots-docs on main"
git push -u origin feat/api-docs-standardize
gh pr create --base feature --title "feat: API docs standardization — spec dump + drift check + docs sync (bluedots-docs #1)" --fill
```

---

# Phase 3 — Signals-DPG (branch `feat/api-docs-standardize` from `origin/feature`)

### Task 7: Extract no-listen buildApp() from server.ts

**Files:**
- Create: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts` (becomes thin entry)
- Modify: `packages/config/src/secrets.ts` + `turbo.json` (new gating env vars — two-places rule)
- Modify: `apps/api/src/config.ts` (export `apiReferenceEnabled`)

**Interfaces:**
- Produces: `export async function buildApp(): Promise<FastifyInstance>` in `apps/api/src/app.ts` — everything the current `server.ts` does up to but not including `listen()`. Tasks 8–9 consume it. Production boot path (`node dist/server.js`) unchanged.
- Produces: `apiReferenceEnabled: boolean` exported from `@/config`.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/srivastha/KKB/Github/Signals-DPG
git fetch origin && git checkout -b feat/api-docs-standardize origin/feature
```

- [ ] **Step 2: Add the gating env vars** in `packages/config/src/secrets.ts` (in the api env group, following neighboring patterns):

```ts
  API_REFERENCE_ENABLED: z.enum(['true', 'false']).default('true'),
  API_REFERENCE_FORCE: z.enum(['true', 'false']).default('false'),
```

AND add both names to the `env`/`globalEnv` list in `turbo.json` (the two-places rule — grep how an existing api env var like `API_DOMAIN` is listed and mirror it). Also add both to the root `.env.example` with comments.

- [ ] **Step 3: Export the flag from `apps/api/src/config.ts`** (near `getCurrentApiBaseUrl`):

```ts
/**
 * Serve the OpenAPI spec + Scalar reference UI at /api/reference. Secure by
 * default: force-disabled when INSTANCE_ENV=production unless
 * API_REFERENCE_FORCE opts back in. The always-available reference is the
 * bluedots-docs site.
 */
export const apiReferenceEnabled: boolean =
  api.API_REFERENCE_ENABLED === 'true' &&
  (instance.INSTANCE_ENV !== 'production' || api.API_REFERENCE_FORCE === 'true');
```

(Match how `api.*`/`instance.*` values are actually surfaced in this file — if secrets.ts transforms the enum to boolean, drop the `=== 'true'` comparisons accordingly.)

- [ ] **Step 4: Create `apps/api/src/app.ts`** — move everything from `server.ts` between the imports and the `listen()` call into:

```ts
import fastify, { type FastifyInstance } from 'fastify';
// ... every import server.ts currently has except the listen/shutdown-only ones ...
import { createRequire } from 'node:module';

const pkg = createRequire(import.meta.url)('../package.json') as { version: string };

/**
 * Builds the fully-wired Fastify app WITHOUT listening. Used by the server
 * entry (which listens), the OpenAPI dump script, and the openapi smoke test.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({ logger: true, trustProxy: true });

  if (apiConfig.network_config_source === 'local') {
    await clearNetworkSchemaCache();
    await refreshConsumedSchemas();
  }
  const networkConfigs = await getNetworkConfigs();
  // ... CORS origins computation, compilers, cors, fastifyQs — verbatim from server.ts ...

  if (apiReferenceEnabled) {
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Signals DPG API',
          description:
            'Network-aware Signals DPG API — items, actions, events, consent, network fetch, admin.',
          version: pkg.version,
        },
        servers: [{ url: getCurrentApiBaseUrl(), description: 'Current API instance' }],
      },
      transform: createJsonSchemaTransform({}),
    });
    await app.register(import('@scalar/fastify-api-reference'), {
      routePrefix: '/api/reference',
    });
  }

  // ... root GET '/', AuthRoutes, v1_routes — verbatim from server.ts ...
  return app;
}
```

Note the three deliberate changes while moving: title `'DPG'` → `'Signals DPG API'`, richer description, `version: '1.0.0'` → `pkg.version`, and the whole swagger+Scalar block now sits behind `if (apiReferenceEnabled)`.

- [ ] **Step 5: Rewrite `apps/api/src/server.ts`** as the thin entry:

```ts
import { apiConfig } from '@/config';
import { buildApp } from '@/app';
import 'dotenv/config';

const app = await buildApp();

await app
  .listen({ port: apiConfig.port, host: '0.0.0.0' })
  .then((endpoint) => console.log('Server Endpoint: ', endpoint))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info(`Shutting down (${signal})`);
  try {
    await app.close();
  } catch (err) {
    app.log.error(err);
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

(`'dotenv/config'` must load before `@/config` is evaluated — keep it as the FIRST import in `server.ts`, matching the current file; if the current file relies on import order, preserve it exactly.)

- [ ] **Step 6: Verify the boot path still works**

Run: `pnpm --filter api exec tsc --noEmit && pnpm build:api`
Expected: clean. If a root `.env` exists locally: `pnpm dev:api` and confirm `GET /` returns the status JSON and `GET /api/reference` serves the Scalar page, then Ctrl-C.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(api): extract no-listen buildApp(); gate docs surface; real openapi metadata"`

### Task 8: Committed dump env + spec:dump + smoke test

**Files:**
- Create: `apps/api/scripts/dump_openapi.env` (committed, dummy/local values)
- Create: `apps/api/scripts/dump_openapi.ts`
- Create: `apps/api/src/__tests__/openapi.test.ts`
- Create: `openapi.json` (repo root, generated, committed)
- Modify: `apps/api/package.json` (script)

**Interfaces:**
- Consumes: `buildApp()` from Task 7.
- Produces: `pnpm --filter api spec:dump` writes repo-root `./openapi.json` with no DB/Redis/network needed; `dump_openapi.env` is the committed env that makes config load in CI.

- [ ] **Step 1: Create `apps/api/scripts/dump_openapi.env`**

Start from the repo-root `.env.example` and keep ONLY the variables `loadConfig`/secrets.ts actually requires to parse (run the dump, add vars until it stops complaining). Must include at minimum:

```env
INSTANCE_ENV=development
NETWORK_CONFIG_SOURCE=local
API_DOMAIN=http://localhost:2742
API_REFERENCE_ENABLED=true
API_REFERENCE_FORCE=true
# ...plus every remaining required (no-default) var from .env.example with its example value...
```

> `API_DOMAIN` becomes `servers[0].url` in the committed spec via `getCurrentApiBaseUrl()` — swap the localhost value for the real public URL from "Inputs required" before merging. Dummy secrets are fine (nothing connects); never put real secrets in this committed file.

- [ ] **Step 2: Write `apps/api/scripts/dump_openapi.ts`**

```ts
/**
 * Dumps the code-generated OpenAPI spec to the repo root ./openapi.json
 * (committed; CI drift-checks it). Loads the committed dump env FIRST so
 * config parses without a real environment; dotenv does not override vars
 * already set in the shell.
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

loadEnv({ path: fileURLToPath(new URL('./dump_openapi.env', import.meta.url)) });

const { buildApp } = await import('../src/app.js');
const app = await buildApp();
await app.ready();
const spec = app.swagger();
await writeFile(
  new URL('../../../openapi.json', import.meta.url),
  JSON.stringify(spec, null, 2) + '\n',
);
await app.close();
console.log(`openapi.json written (${Object.keys((spec as { paths: object }).paths).length} paths)`);
process.exit(0); // ioredis/better-auth may hold live handles — exit explicitly
```

(If tsx can't resolve `../src/app.js` because of the `@/` path alias inside app code, run it as `tsx --tsconfig tsconfig.json scripts/dump_openapi.ts` — the dev script already proves tsx+alias works in this package.)

- [ ] **Step 3: Package script** — `apps/api/package.json`: `"spec:dump": "tsx scripts/dump_openapi.ts"`.

- [ ] **Step 4: Iterate until the dump succeeds**

Run: `pnpm --filter api spec:dump`
Expected: `openapi.json written (~47 paths)`. Fix missing env vars in `dump_openapi.env` as Zod reports them. Verify determinism: run twice, `git diff openapi.json` empty.

- [ ] **Step 5: Write the smoke test `apps/api/src/__tests__/openapi.test.ts`** (failing-first isn't meaningful here since Step 4 already proved generation; the test's job is to guard regressions):

```ts
import { describe, it, expect } from 'vitest';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the committed dump env BEFORE the config module is imported.
loadEnv({ path: fileURLToPath(new URL('../../scripts/dump_openapi.env', import.meta.url)) });

describe('OpenAPI spec generation', () => {
  it('builds a spec with real metadata and a non-empty path surface', async () => {
    const { buildApp } = await import('@/app');
    const app = await buildApp();
    await app.ready();
    const spec = app.swagger() as {
      info: { title: string; version: string };
      servers?: Array<{ url: string }>;
      paths: Record<string, unknown>;
    };
    expect(spec.info.title).toBe('Signals DPG API');
    expect(spec.info.version).not.toBe(''); // sourced from package.json
    expect(spec.servers?.[0]?.url).toBeTruthy();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(40);
    expect(spec.paths['/api/v1/item/fetch']).toBeTruthy();
    await app.close();
  }, 30_000);
});
```

- [ ] **Step 6: Run it** — `pnpm --filter api exec vitest run src/__tests__/openapi.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(api): spec:dump + committed openapi.json + openapi smoke test"`

### Task 9: CI drift check + openapi-sync workflow + PR

**Files:**
- Modify: `.github/workflows/ci.yaml` (new job)
- Create: `.github/workflows/openapi-sync.yml`

- [ ] **Step 1: Add a `spec-drift` job to `ci.yaml`** (mirrors `typecheck-api`'s setup steps):

```yaml
  spec-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.1.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: OpenAPI spec drift check
        run: |
          pnpm --filter api spec:dump
          git diff --exit-code openapi.json || {
            echo "::error::openapi.json is stale — run 'pnpm --filter api spec:dump' and commit"; exit 1; }
```

- [ ] **Step 2: Write `.github/workflows/openapi-sync.yml`** — identical to Task 3's workflow with substitutions: destination `docs-repo/src/openapi/signals-dpg.json`, branch `openapi-sync/signals-dpg`, names say `signals-dpg` / `Blue-Dots-Economy/signals-dpg`. Write it out fully.

- [ ] **Step 3: Commit + push + PR into `feature`**

```bash
git add .github/workflows/
git commit -m "ci: openapi drift check + auto-PR spec into bluedots-docs"
git push -u origin feat/api-docs-standardize
gh pr create --base feature --title "API docs: buildApp extraction, spec dump + drift check, docs sync (bluedots-docs #1)" --fill
```

(Include the repo's required "In Plain Terms" section in the PR body.)

---

# Phase 4 — bluedots-docs (continue on `spec/api-spec-hosting`)

### Task 10: starlight-openapi wiring + bootstrap specs

**Files:**
- Create: `src/openapi/signals-dpg.json`, `src/openapi/aggregator-dpg.json`, `src/openapi/signals-search.json` (copied from the three repos' committed `openapi.json` — this IS the manual bootstrap)
- Modify: `package.json` (dependency)
- Modify: `astro.config.mjs` (plugin + sidebar)

**Interfaces:**
- Consumes: the three committed `openapi.json` files produced in Phases 1–3 (from the local checkouts — their PRs need not be merged yet).
- Produces: generated reference pages under `/api/signals-dpg/`, `/api/aggregator-dpg/`, `/api/signals-search/`; `openAPISidebarGroups` for the sidebar. Task 11 links to these.

- [ ] **Step 1: Bootstrap the specs**

```bash
cd /Users/srivastha/KKB/Github/bluedots-docs
mkdir -p src/openapi
cp ../Signals-DPG/openapi.json src/openapi/signals-dpg.json
cp ../aggregator-dpg/openapi.json src/openapi/aggregator-dpg.json
cp ../signals-search/openapi.json src/openapi/signals-search.json
```

- [ ] **Step 2: Install the plugin (pinned)**

```bash
pnpm add starlight-openapi@0.22.1
```

Expected: installs cleanly with no peer warnings (Astro ^5.14 / Starlight ^0.36 satisfy `>=5.5.0` / `>=0.34.0`).

- [ ] **Step 3: Wire `astro.config.mjs`**

Import (top of file): `import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';`

Register in the starlight `plugins` array (alongside the validator + image zoom):

```js
        starlightOpenAPI([
          { base: 'api/signals-dpg', schema: './src/openapi/signals-dpg.json', label: 'Signals-DPG API' },
          { base: 'api/aggregator-dpg', schema: './src/openapi/aggregator-dpg.json', label: 'Aggregator-DPG API' },
          { base: 'api/signals-search', schema: './src/openapi/signals-search.json', label: 'Signals-Search API' },
        ]),
```

Add the sidebar group after `Guides` (before `Explore`):

```js
        {
          label: 'API Reference',
          items: [{ label: 'Overview', slug: 'api' }, ...openAPISidebarGroups],
        },
```

- [ ] **Step 4: Throwaway build check (the spec's §8 gate)**

Run: `pnpm build`
Expected: build succeeds and `dist/api/signals-dpg/`, `dist/api/aggregator-dpg/`, `dist/api/signals-search/` contain generated operation pages. It will FAIL on the missing `api` slug page — that's Task 11; for this step temporarily point the Overview slug at an existing page or add the landing page first if easier (Task 11 Step 1 can simply be done before this build).
**If the plugin errors instead:** fall back per spec §8 — drop the plugin and render three MDX pages embedding Scalar; flag to the user before proceeding.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: render the three service OpenAPI references via starlight-openapi"`

### Task 11: API Reference landing page + cross-links

**Files:**
- Create: `src/content/docs/api/index.mdx`
- Modify: `src/content/docs/guides/api-reference.md` (cross-link)

- [ ] **Step 1: Write `src/content/docs/api/index.mdx`**

```mdx
---
title: API Reference
description: Generated OpenAPI references for the Signals-DPG, Aggregator-DPG, and Signals-Search APIs — readable without any service running.
---

import { LinkCard, CardGrid } from '@astrojs/starlight/components';

These references are generated from each service's code (Zod route schemas → OpenAPI)
and synced here automatically whenever a service's API contract changes on its `main`
branch — no running service is needed to read them.

<CardGrid>
  <LinkCard
    title="Signals-DPG API"
    description="Items, actions, events, consent, network fetch, admin — the network-aware Signals backend."
    href="/api/signals-dpg/"
  />
  <LinkCard
    title="Aggregator-DPG API"
    description="Aggregator registration & approval, profile, bulk uploads, registration links, dashboard."
    href="/api/aggregator-dpg/"
  />
  <LinkCard
    title="Signals-Search API"
    description="Semantic + geo + structured search over the shared Signals database."
    href="/api/signals-search/"
  />
</CardGrid>

Looking for the narrative guide (auth model, request conventions, walkthroughs)?
See the [API guide](/guides/api-reference/).
```

- [ ] **Step 2: Cross-link from the narrative guide** — in `src/content/docs/guides/api-reference.md`, replace the existing `:::tip` about wiring OpenAPI with a short pointer paragraph: "The complete, always-current operation-by-operation reference for all three services is generated from code — see the [API Reference](/api/) section."

- [ ] **Step 3: Full build + link validation**

Run: `pnpm build`
Expected: PASS, including `starlight-links-validator` (all `/api/...` links resolve to generated pages).

- [ ] **Step 4: Preview visually** — `pnpm preview`, open `http://localhost:4321/api/`, click into each of the three references, spot-check one operation page each (schemas render, auth scheme shown, dark mode OK).

- [ ] **Step 5: Commit + push + PR to `main`**

```bash
git add -A && git commit -m "feat: API Reference landing page + cross-links"
git push -u origin spec/api-spec-hosting
gh pr create --base main --title "API Reference: host all three service OpenAPI specs (closes #1)" --fill
```

---

# Phase 5 — wiring it live

### Task 12: Provision DOCS_SYNC_TOKEN + end-to-end verification

**Files:** none (GitHub settings + verification only)

- [ ] **Step 1 (USER ACTION): create the fine-grained PAT** — Settings → Developer settings → Fine-grained tokens: resource owner `Blue-Dots-Economy`, repository access: only `bluedots-docs`, permissions: **Contents: Read and write**, **Pull requests: Read and write**. Suggested name `bluedots-docs-openapi-sync`; expiry per org policy (calendar the renewal).

- [ ] **Step 2: add the secret to all three service repos**

```bash
for r in signals-search Signals-DPG aggregator-dpg; do
  gh secret set DOCS_SYNC_TOKEN --repo Blue-Dots-Economy/$r
done
```

(Each invocation prompts for the token value; or pipe it.)

- [ ] **Step 3: verify one sync end-to-end** — after any service PR reaches `main` (or via the workflow's `workflow_dispatch` button): confirm the Actions run is green, a PR titled `openapi-sync: <repo>` exists in bluedots-docs, its diff touches only `src/openapi/<repo>.json`, merging it triggers `deploy.yml`, and the change is visible on the live site under `/api/<repo>/`.

- [ ] **Step 4: verify the no-op path** — re-run the sync via `workflow_dispatch` with no spec change: the run is green and **no** new PR is opened.

- [ ] **Step 5: close the loop on issue #1** — tick the acceptance-criteria checkboxes on `Blue-Dots-Economy/bluedots-docs#1` and comment linking the four PRs.

---

## Self-review notes

- **Spec coverage:** §4 kit → Tasks 2/5/8; §4.3 refactor → Task 7; §5 metadata → Tasks 1/4/7 (titles, versions, server URLs, auth schemes already correct in the two that document them; Signals-DPG gets title+version+servers, auth-scheme documentation for its service headers can ride the existing schemas); §6 runtime UX → Task 1 (signals-search conversion) + Task 7 (Signals-DPG gating; aggregator-dpg unchanged); §7 transport → Tasks 3/6/9 + 12; §8 render → Tasks 10/11 (compat pre-verified: 0.22.1); §9 guardrails → drift steps + Task 8 smoke test; §10 rollout → phases (order deliberately producer-first, noted in header).
- **Known judgment calls encoded here:** repo-root `./openapi.json` in all three repos (spec contract); aggregator version bumped `0.0.0`→`1.0.0` so package-sourced versioning doesn't regress the published version; `process.exit(0)` in dump scripts to defeat lingering handles; Signals-DPG committed `dump_openapi.env` so config parses in CI without secrets.
- **Open inputs:** the three public base URLs + PAT creation (listed under "Inputs required"); localhost fallbacks keep every step unblocked until then.

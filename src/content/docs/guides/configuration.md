---
title: Configuration
description: How configuration-as-code works across the Blue Dots DPGs, and where each value lives.
sidebar:
  order: 6
---

Blue Dots follows strict **configuration discipline**: no domain- or environment-specific value is hardcoded. Values are read once at startup from a config loader or environment, with per-environment overrides.

## Where configuration lives

<span class="sprint-badge">New</span> Signals Search column added below.

| Concern | Signals DPG | Aggregator DPG | Signals Search |
| --- | --- | --- | --- |
| Env var declarations | `packages/config` (Zod `secrets.ts`) | config loader package | `src/config.ts` (Zod-validated `loadConfig`) |
| Per-env overrides | `config/env/{dev,staging,prod}.yaml` | `config/env/{dev,staging,prod}.yaml` | — (env vars only, no per-env YAML layer) |
| Schemas / forms | network + item schemas, schema registry | `config/schemas/aggregator/*.json` (RJSF) | network config (`NETWORK_CONFIG_PATH`); no form schemas — it has no UI |
| Local env | `.env` (root or per-app `.env.example`) | root `.env` (`infra/env.template`) | `.env` (see `.env.example`) |

Signals Search is a single package, not a monorepo, so it has no per-app config split — every setting is declared once in `src/config.ts` and read the same way by both the API and worker entrypoints.

## Adding an environment variable (Signals)

Two places must change **together**, or you'll hit the classic "works locally, fails in `pnpm dev:api`" bug:

1. The Zod schema in `packages/config/src/secrets.ts` — so validation passes.
2. `turbo.json`'s `globalPassThroughEnv` — so the variable actually reaches filtered tasks.

## Adding an environment variable (Aggregator)

Add it to the config loader's schema. Remember `NEXT_PUBLIC_*` values are **baked at compile time** in the web app — after changing one, rebuild the web image (`make rebuild-web`) rather than just restarting.

## Adding an environment variable (Signals Search) <span class="sprint-badge">New</span>

Add it to the `EnvSchema` in `src/config.ts` — that single Zod schema is read by both the `api` and `worker` entrypoints, so there is no second place to keep in sync.

## Notable environment variables <span class="sprint-badge">New</span>

A few knobs worth knowing about, beyond the obvious connection strings — names and effect only, see each repo's own configuration docs for full lists and defaults:

| Variable | Service | Effect |
| --- | --- | --- |
| `AUTH_PROVIDER` | Signals DPG | Selects which auth path is active — Better-Auth or Keycloak. |
| `SIGNALSTACK_AUTH_MODE` | Aggregator DPG | Selects how Aggregator DPG authenticates to Signals DPG's service API — API key or bearer token. |
| `EMBEDDING_SERVING_VERSION` | Signals Search | An optional tag appended to the embedding model version used for indexing; changing it forces a full re-embed of the corpus, so it's only set as part of a deliberate embedding-stack upgrade. |
| `DASHBOARD_CACHE_TTL_SECONDS` | Signals DPG | How long a participant metrics read-time cache entry is trusted before it's recomputed. See [Signals DPG Architecture](/core-concepts/architecture/signals-dpg/). |
| `INGEST_MAX_DELIVERIES` | Signals Search | How many times the ingestion worker retries a failing message before parking it on the dead-letter stream. See [Signals Search Architecture](/core-concepts/architecture/signals-search/). |

## Evolving forms without code

Registration and profile forms are **schema-driven** (RJSF in the Aggregator; item schemas in the Signals UI). Product and program teams can add or change fields by editing the JSON schemas — no application code change required. See [Schema-Driven Model](/core-concepts/technical/schema-driven-model/).

## Secrets

- Local secrets live in `.env` files (the Aggregator's `make setup` writes a `chmod 600` root `.env`).
- Never commit secrets. Production secrets are managed by your platform's secret store (see the Signals repo `docs/operations/secrets.md`).

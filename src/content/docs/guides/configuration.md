---
title: Configuration
description: How configuration-as-code works across the Blue Dots DPGs, and where each value lives.
sidebar:
  order: 6
---

Blue Dots follows strict **configuration discipline**: no domain- or environment-specific value is hardcoded. Values are read once at startup from a config loader or environment, with per-environment overrides.

## Where configuration lives

| Concern | Signals DPG | Aggregator DPG |
| --- | --- | --- |
| Env var declarations | `packages/config` (Zod `secrets.ts`) | config loader package |
| Per-env overrides | `config/env/{dev,staging,prod}.yaml` | `config/env/{dev,staging,prod}.yaml` |
| Schemas / forms | network + item schemas, schema registry | `config/schemas/aggregator/*.json` (RJSF) |
| Local env | `.env` (root or per-app `.env.example`) | root `.env` (`infra/env.template`) |

## Adding an environment variable (Signals)

Two places must change **together**, or you'll hit the classic "works locally, fails in `pnpm dev:api`" bug:

1. The Zod schema in `packages/config/src/secrets.ts` — so validation passes.
2. `turbo.json`'s `globalPassThroughEnv` — so the variable actually reaches filtered tasks.

## Adding an environment variable (Aggregator)

Add it to the config loader's schema. Remember `NEXT_PUBLIC_*` values are **baked at compile time** in the web app — after changing one, rebuild the web image (`make rebuild-web`) rather than just restarting.

## Evolving forms without code

Registration and profile forms are **schema-driven** (RJSF in the Aggregator; item schemas in the Signals UI). Product and program teams can add or change fields by editing the JSON schemas — no application code change required. See [Schema-Driven Model](/core-concepts/technical/schema-driven-model/).

## Secrets

- Local secrets live in `.env` files (the Aggregator's `make setup` writes a `chmod 600` root `.env`).
- Never commit secrets. Production secrets are managed by your platform's secret store (see the Signals repo `docs/operations/secrets.md`).

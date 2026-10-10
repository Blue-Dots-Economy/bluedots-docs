---
title: Configuration
description: Where each configuration value lives in the Blue Dots DPGs, including the per-network schema folders, env vars and secrets.
sidebar:
  order: 5
---

Blue Dots follows strict **configuration discipline**: no domain- or environment-specific value is hardcoded. Values are read once at startup from a config loader or environment, with per-environment overrides.

## Where configuration lives

| Concern | Signals DPG | Aggregator DPG |
| --- | --- | --- |
| Env var declarations | `packages/config` (Zod `secrets.ts`) | config loader package |
| Per-environment values | env vars; on a cluster, Helm values from `bluedots-automation` | env vars; on a cluster, Helm values from `bluedots-automation` |
| Per-network folder | `examples/schemas/<network>/` | `config/<network>/` |
| Schemas / forms | `network.json` (domains, item types, actions) | `config/schemas/aggregator/*.json` (RJSF), plus `config/<network>/schemas/` |
| Local env | `.env` (root or per-app `.env.example`) | root `.env` (`infra/env.template`) |

## Per-network schema folders

Each network has its own folder in each DPG. The folder name (for example `blue_dot` for jobs or `purple_dot` for disability) is what the deployment settings point at.

| DPG | Folder | What it holds |
| --- | --- | --- |
| Signals | `examples/schemas/<network>/` | `network.json`, `consent.json`, optional `messages.properties` (email copy), optional brand sub-folders |
| Aggregator | `config/<network>/` | `aggregator.config.yaml`, `brand.json`, `keycloak.env` (login-screen text), `schemas/`, optional brand sub-folders |

The settings that choose the folder are `SIGNALS_NETWORK` or `NETWORK_CONFIG_LOCAL_FILE` (Signals, local), `AGGREGATOR_NETWORK` (Aggregator, local) and `_network` / `_brand` in `global-values.yaml` (cloud). See [Signals DPG Setup](/guides/installation/local-setup/signals-dpg/#choose-a-network) and [AWS Infrastructure Setup](/guides/installation/cloud-setup/aws/infrastructure/#choose-the-network).

## Adding an environment variable (Signals)

Two places must change **together**, or you'll hit the classic "works locally, fails in `pnpm dev:api`" bug:

1. The Zod schema in `packages/config/src/secrets.ts` — so validation passes.
2. `turbo.json`'s `globalPassThroughEnv` — so the variable actually reaches filtered tasks.

## Adding an environment variable (Aggregator)

Add it to the config loader's schema. The aggregator web image deliberately
takes **no `NEXT_PUBLIC_*` build args** (see the comment in
`apps/web/Dockerfile`), so those values are read at runtime: an env change
applies on a plain restart. `make rebuild-web` is for web **code** changes.

## Evolving forms without code

Registration and profile forms are **schema-driven** (RJSF in the Aggregator; item schemas in the Signals UI). Product and programme teams can add or change fields by editing the JSON schemas — no application code change required. See [Schema-Driven Model](/core-concepts/technical/schema-driven-model/).

## Secrets

- Local secrets live in `.env` files (the Aggregator's `make setup` writes a `chmod 600` root `.env`).
- Never commit secrets. Production secrets are managed by your platform's secret store (see the Signals repo `docs/operations/secrets.md`).

## Where to go next

- [Customisation & Branding](/guides/customisation/) — the presentation layer on top of these values.
- [Schema-Driven Model](/core-concepts/technical/schema-driven-model/) — why form changes are config, not code.
- [AWS Infrastructure Setup](/guides/installation/cloud-setup/aws/infrastructure/) — where per-environment values are set for a cluster.

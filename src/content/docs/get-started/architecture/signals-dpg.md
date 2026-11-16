---
title: Signals DPG Architecture
description: The parts of the Signals DPG (API, schema-driven UI and shared packages), its two read layers and its engineering conventions.
sidebar:
  attrs:
    class: bd-changed
  order: 2
changed_sections:
  - _top
  - components
  - network-awareness
---

The **Signals DPG** is the network-aware backend that every Blue Dots domain runs on, from the Blue Dot (jobs) domain to the Yellow Dot (education) domain. It stores signals as schema-typed items and finds and matches them across instances.

## Components

- **`apps/api`** — Fastify + Zod (`fastify-type-provider-zod`) + Drizzle ORM + Redis. The network-aware API: items, actions, events, instance-local reads and inter-instance discovery. Entry point `src/server.ts`.
- **`apps/ui`** — React 19 + Vite. A schema-driven UI: forms and cards are rendered from the domain and item schemas, so new domains need no UI code changes.
- **`packages/config`** — Zod env schemas, allowed-origin lists, network-config loader. **All env vars are declared here**, never parsed ad hoc.
- **`packages/database`** — Drizzle setup and partition-aware query helpers.
- **`packages/schemas`** — shared Zod schemas for request bodies, admin and the schema registry.
- **`packages/auth`, `packages/notification`, `packages/match_score`** — auth helpers (token validation, PII crypto), service clients and config.

It is a **pnpm + Turborepo** monorepo; the workspace alias `@dpg/*` maps to `packages/*/src`.

## Network awareness

An instance serves one or more participant types in a domain. (The code calls a domain a *network* and a participant type a *domain*.) The two read layers are kept strictly separate:

- **Instance-local** (`GET /api/v1/item/fetch`) — reads an instance's own items with a brief Redis cache.
- **Inter-instance** (`GET /api/v1/network/item/fetch`) — *count-first* discovery: ask peers how many relevant items they hold, select only relevant peers, fetch slices, merge and cache. Schema fetching and caching live in this layer.

[Read & Write Paths](/get-started/architecture/read-write-paths/) explains why the two layers are kept apart. Ranked search by meaning, location and filters is a separate service, [Signals Search](/get-started/architecture/signals-search/).

## Data partitioning

Item tables are **partitioned** in PostgreSQL. Always use the partition-aware query helpers in `@dpg/database` so the planner can prune; an ad-hoc query across the parent table without a partition key will scan everything.

## Engineering conventions

- **ESM only**, strict TypeScript, no `any`; `import type` for type-only imports.
- **Files are snake_case.** Route handler exports are snake_case (`create_item`); internal handler functions camelCase; Zod schemas PascalCase; DB columns snake_case.
- **Routes never throw** — they return `reply.code(N).send({ error, message })` with a machine-readable `error` code, and handle Postgres `23505` (unique) / `23503` (FK) explicitly.
- DB schema lives in `apps/api/db/postgres/schema/`; **migrations are generated, never hand-edited** (`pnpm db:generate:api`).

See [Tech Stack](/get-started/architecture/tech-stack/) for the full toolchain and [Data Model](/get-started/architecture/data-model/) for the schema.

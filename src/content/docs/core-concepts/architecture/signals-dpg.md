---
title: Signals DPG Architecture
description: Internals of the network-aware Signals backend and schema-driven UI.
sidebar:
  order: 2
---

The **Signals DPG** is the network-aware backend at the heart of Blue Dots. It stores signals as schema-typed items and discovers/matches them across instances.

## Components

- **`apps/api`** — Fastify + Zod (`fastify-type-provider-zod`) + Drizzle ORM + Redis. The network-aware API: items, actions, events, instance-local reads and inter-instance discovery. Entry point `src/server.ts`.
- **`apps/ui`** — React 19 + Vite. A schema-driven UI: forms and cards are rendered from the network and item schemas, so new domains need no UI code changes.
- **`packages/config`** — Zod env schemas, allowed-origin lists, network-config loader. **All env vars are declared here**, never parsed ad hoc.
- **`packages/database`** — Drizzle setup and partition-aware query helpers.
- **`packages/schemas`** — shared Zod schemas for request bodies, admin and the schema registry.
- **`packages/auth`, `packages/notification`, `packages/match_score`** — service clients and config.

It is a **pnpm + Turborepo** monorepo; the workspace alias `@dpg/*` maps to `packages/*/src`.

## Network awareness

An instance serves one or more domains on a network. The two read layers are kept strictly separate:

- **Instance-local** (`GET /api/v1/item/fetch`) — reads an instance's own items with a brief Redis cache.
- **Inter-instance** (`GET /api/v1/network/item/fetch`) — *count-first* discovery: ask peers how many relevant items they hold, select only relevant peers, fetch slices, merge and cache. Schema fetching and caching live in this layer.

This separation is the key scaling decision — see [Read & Write Paths](/core-concepts/technical/read-write-paths/).

## Data partitioning

Item tables are **partitioned** in PostgreSQL. Always use the partition-aware query helpers in `@dpg/database` so the planner can prune; an ad-hoc query across the parent table without a partition key will scan everything.

## Participant metrics (`item_metrics`) <span class="sprint-badge">New</span>

`item_metrics` is a **lazily-recomputed derived cache** of per-item interaction counts and status, read by the aggregator dashboard/export routes. It is a **read-time cache, not a source of truth** — ownership and authorization are never keyed off it. There is no separate "Signal Processing Service" and no materialized view anywhere in the system; an earlier design described one, but it never shipped.

- **Recompute trigger.** A route checks a TTL (`DASHBOARD_CACHE_TTL_SECONDS`) against the metrics row's last-computed timestamp. On a miss, it recomputes under a Postgres advisory lock keyed per `(aggregator_id, domain)`, so multi-domain orgs recompute in parallel without domains blocking each other. There is no background job — recompute is triggered synchronously by whichever request first finds the cache stale.
- **Lock semantics.** The default path takes a **non-blocking try-lock**: if another request already holds the lock for that `(aggregator_id, domain)`, the request skips recompute rather than waiting. A `force=true` path instead takes a **blocking** lock, so a caller that needs a guaranteed-fresh result waits for any in-flight recompute to finish.
- **Directionality.** An action event (e.g. a seeker connecting to a provider) has a source item domain and a target item domain. Metrics are counted from each item's own point of view: the item is `initiated` when its domain is the action's source, and `received` when its domain is the action's target. A same-domain interaction (source domain equals target domain) emits **both** an `initiated` row and a `received` row, since the same item plays both roles at once. Per-item status is evaluated against the combined (`initiated` + `received`) counts, not either direction alone.

## In progress: public shareable profile links <span class="sprint-badge">New</span>

:::note[Not yet in production]
Everything in this section is built and merged, but **not yet promoted to `main`/production**. It is documented here so the target architecture is visible, not because it's live today.
:::

A profile item can be shared via a public, unauthenticated link, so it can be viewed without signing in.

- **No new PII.** The public view reuses the same masked public projection already exposed via the existing map/discover flows — the shared link surfaces nothing that wasn't already reachable through those paths.
- **The link uses the item's existing id directly**, rather than a signed or opaque token. This is a deliberate v1 choice: since the id is already public via the existing fetch paths, embedding it directly in the share link doesn't expose anything new.
- **Only resolves for live items.** The link only renders a profile when the item's `lifecycle_status` is `live`. Any other state — retired, unknown, or an error — renders a generic "unavailable" page rather than a raw error, so the response never leaks which of those states caused it.

## Engineering conventions

- **ESM only**, strict TypeScript, no `any`; `import type` for type-only imports.
- **Files are snake_case.** Route handler exports are snake_case (`create_item`); internal handler functions camelCase; Zod schemas PascalCase; DB columns snake_case.
- **Routes never throw** — they return `reply.code(N).send({ error, message })` with a machine-readable `error` code, and handle Postgres `23505` (unique) / `23503` (FK) explicitly.
- DB schema lives in `apps/api/db/postgres/schema/`; **migrations are generated, never hand-edited** (`pnpm db:generate:api`).

See [Tech Stack](/core-concepts/technical/tech-stack/) for the full toolchain and [Data Model](/core-concepts/architecture/data-model/) for the schema.

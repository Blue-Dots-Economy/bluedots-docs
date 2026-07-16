---
title: Aggregator DPG Architecture
description: Internals of the aggregator-facing app — API, portal and background worker.
sidebar:
  order: 3
---

The **Aggregator DPG** is the aggregator-facing application of the Blue Dots ecosystem. It is a **pnpm + Turbo** monorepo, TypeScript-only, with three deployable apps.

## Three deployable apps

- **`api`** — Fastify backend-for-frontend. Owns the Aggregator database (Drizzle + Postgres), the Keycloak admin integration, and the registration/approval flow, bulk-upload entry point, registration links and profile endpoints. Reads the upstream Signals stack; in the MVP it has **no write access to Signals except via the bulk-create paths**. Every handler asserts `session.aggregator_id` — which is **never trusted from the client**.
- **`web`** — Next.js 15 (App Router) portal plus its own BFF. Anonymous flows use a service-account token; authenticated flows attach the user's OIDC token. Sessions are signed cookies backed by Redis. Forms are **RJSF-driven** from JSON schemas, so non-engineers can evolve registration/profile forms without code changes.
- **`worker`** — BullMQ jobs: `bulk-file-process`, `bulk-row-process`, `bulk-finalise`, `cron-watchdog`, `link-metrics-rollup`. Shares the same DB schema, S3 and the Signals writer. Cron-style jobs are watchdogged.

## Shared packages

Cross-package consumption goes through **subpath exports**. The common pattern: each service package exports `./interface` (an abstract class + Zod schemas), one or more concrete implementations (`./postgres`, `./http`, `./memory`), and `./testing` (in-memory fake + builders). Apps import only from `./interface` and `./testing`.

Key packages include `shared-primitives` (a `Result<T, E>` type, a typed error hierarchy, branded IDs, shared DTOs), `db-schema` (the single source of truth for tables), `signalstack-writer` / `participants-writer`, `queue` (BullMQ wiring) and config loaders.

## Architectural guardrails

These are enforced at CI by dependency-cruiser:

1. **`no-cross-service-impl-imports`** — cross-package imports must go through `./interface` or `./testing`.
2. **`no-heavy-deps-in-interface`** — interface files may only import `shared-primitives`, `zod` or `node:*`.

Other non-negotiable rules: every cross-package contract is an **abstract class** (not a TS interface, so it survives at runtime as a DI token); service methods return `Result<T, BaseError>` and **never throw** across a boundary; every external call has an explicit timeout, retry with backoff and a typed error.

## Data flow

<!-- Editable source: src/assets/diagrams/aggregator-dpg-data-flow.excalidraw — open at https://excalidraw.com to adjust, re-export PNG here. -->

![An organisation registers and is approved, then bulk-uploads a file to S3; the worker processes it (file to rows to finalise) and hands rows to signalstack-writer, which writes to the Signals API](../../../../assets/diagrams/aggregator-dpg-data-flow.png)

See [Identity & Auth](/core-concepts/architecture/identity-and-auth/) for the Keycloak setup and the service-auth handshake with Signals.

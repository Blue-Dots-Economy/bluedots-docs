---
title: Flow Structure
description: Internal runtime flow for the current DPG implementation.
head: []
---

This page is the implementation-oriented companion to the higher-level [Architecture](/concepts/architecture) guide.

## 1. Environment and runtime config

- `.env` is parsed by `apps/api/src/env.ts`
- `packages/config` owns the Zod schemas for env validation
- `apps/api/src/config.ts` turns env values into runtime config objects

## 2. Network identity

The API declares which network/domain pairs it serves through `SERVED_DOMAINS`.

Example:

```bash
SERVED_DOMAINS="yellow_dot/student"
```

That identity is used with the network config to decide:

- which registered instance origins should be allowed through CORS
- which network/domain context the backend exposes at its root endpoint
- which create, local fetch, schema, action, and event requests are accepted

## 3. Network config

The network config defines:

- available domains
- registered instances
- action interaction rules
- item schemas for domains
- requirement and event schemas for actions
- minimum cache TTL per domain

The API can load this config from a local JSON file in development or remote schema URLs in production.

Loaded configs are memoized in `apps/api/src/network_configs.ts`. `POST /api/v1/network/refetch_schemas` refreshes the network configs and repopulates the schema cache.

## 4. API layer

The API app uses Fastify and mounts:

- `/api/auth/*` for Better Auth handlers
- `/api/v1/*` for application routes

The most important fetch split is:

- `/api/v1/item/fetch`: local-only fetch
- `/api/v1/network/item/fetch`: inter-instance fetch

The action split is:

- `/api/v1/action/perform`: source-facing action request
- `/api/v1/network/action/perform`: target-facing action creation endpoint
- `/api/v1/action/update-status`: target-side status transitions
- `/api/v1/event/store`: mirrored event ingestion

## 5. Data layer

`packages/database` exposes Drizzle reference tables and partition helpers.

The SQL scripts define partitioned parent tables:

- `items`
- `item_actions`
- `action_events`

Partitions are intentionally not hardcoded in the base SQL. They are created per deployment or at runtime.

## 6. Schemas

`packages/schemas` provides:

- the default `zod` export used across the repo
- request/response schemas
- a fetch helper for remote schema JSON
- network config parsing and helpers
- JSON Schema validation through AJV 2020

`apps/api/src/network_schema_cache.ts` caches:

- network config documents
- inline domain item schemas
- remote instance custom item schemas
- schema URLs referenced by stored items

Checked-in example network configs now live under `examples/schemas`.

## 7. Auth and OTP

`packages/auth` wraps Better Auth setup and adds the custom `unifiedOtp` plugin for phone/email OTP flows.

The UI uses `/auth/login` and `/auth/otp` routes, then stores the bearer token for API requests.

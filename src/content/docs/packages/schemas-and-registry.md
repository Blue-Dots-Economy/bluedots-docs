---
title: Schemas And Registry
description: What the schemas package currently contains and how registry fetching works.
head: []
sidebar:
  order: 4
---

The `packages/schemas` package exposes reusable Zod schemas, network config parsing helpers, JSON Schema validation, and fetch helpers for remote schema documents.

## Zod export

The default export remains `zod`, which is used across the API and config packages for request and environment schemas.

## Network config purpose

The DOT network config is not just an example blob. It is intended to act as a boundary and runtime config source for the network.

It defines:

- which domains exist on a network
- the item-state schemas for those domains
- which instances are registered on the network
- which instance-specific item schemas override a domain default
- which domains may interact through each action
- the requirement schema for each action interaction
- the event schema for the action response payload

That structure lets backend logic derive rules such as:

- which instance origins may call a backend through CORS
- which domains can invoke a given action against another domain
- which payload schema to validate for `item_state`, action requirements, and action response events
- which minimum TTL to use when caching inter-instance item fetches

## Runtime request schemas

The package exports the schemas used directly by Fastify routes:

| Export | Used by |
|--------|---------|
| `CreateItemBodySchema` | `POST /api/v1/item/create` |
| `FetchItemsQuerySchema` | local and network item fetch endpoints |
| `UpdateItemBodySchema` | `PATCH /api/v1/item/:itemId` |
| `PerformActionBodySchema` | `POST /api/v1/action/perform` |
| `PerformNetworkActionBodySchema` | `POST /api/v1/network/action/perform` |
| `UpdateActionStatusBodySchema` | `POST /api/v1/action/update-status` |
| `StoreEventBodySchema` | `POST /api/v1/event/store` |

The item fetch schemas enforce the geo-search contract: `item_latitude`, `item_longitude`, and `radius_meters` must be provided together.

## Network helpers

The network workflow exports:

- `parseNetworkConfigDocument()`
- `getDomainItemSchema()`
- `getDomainItemTypes()`
- `getDomainMinimumCacheTtlSeconds()`
- `getInstanceCustomItemSchemaUrl()`
- `getActionInteraction()`
- `validateAgainstJsonSchema()`

`default_item_schemas` is accepted and merged into `item_schemas` for compatibility, but new network documents should prefer `item_schemas`.

## Registry schema fetching

The package exports `fetchSchema` and `FetchSchema` from `src/schema_registry.ts`.

Example:

```ts
import { fetchSchema } from '@dpg/schemas';

const dotSchema = new fetchSchema(
  `${process.env.SCHEMA_REGISTRY_URL}/yellow-dot/network.json`
);

const resolvedSchema = await dotSchema.getSchema();
```

## Current behavior

- fetches a root JSON document from a URL
- resolves `$ref` recursively
- supports `#` fragments in the same document
- supports relative references
- supports remote references to other JSON documents
- caches fetched documents within a fetcher instance

## Important limitation

The current implementation is a JSON document fetcher with `$ref` resolution. It does not validate that a document is compliant with a particular JSON Schema draft, and it does not implement draft-specific behavior such as `$dynamicRef`.

## Runtime config support

The config package now also supports parsing backend network bindings from `SERVED_DOMAINS`.

Example:

```ts
import { parseServedDomains } from '@dpg/config';

const bindings = parseServedDomains('yellow_dot/student,blue_dot/seeker');
```

This returns structured `network/domain` bindings that the API can expose and later use with network-driven origin and routing logic.

The config package also exposes `loadNetworkConfigs()` for loading network config from:

- a local JSON file in development
- remote network schema/config URLs in production

That loader is what the API now uses before registering CORS.

---
title: Schemas And Cache
description: Network schema routes, schema cache behavior, and custom schema support.
head: []
---

The API keeps a runtime schema cache for network configs, item schemas, and remote custom schemas.

## Routes

```text
GET  /api/v1/network/schemas
GET  /api/v1/network/schema/:network/:domain/:itemType
POST /api/v1/network/refetch_schemas
```

## Cached Schema Types

The schema cache can include:

- network config documents
- inline domain item schemas
- remote instance custom item schemas
- item schema URLs referenced by stored items

Cache files are stored under the operating system temp directory at runtime.

## List Schemas

`GET /api/v1/network/schemas` returns cached schema entries.

Optional filters:

- `network`
- `domain`
- `item_type`
- `schema_url`

The UI uses this route and filters entries with `kind === 'network_config'`.

## Fetch One Schema

`GET /api/v1/network/schema/:network/:domain/:itemType` returns the concrete schema for one domain/item type.

If the current instance has a configured custom schema URL for that item type, the route returns the fetched custom schema. Otherwise it returns the domain item schema from the network config.

## Refetch Schemas

`POST /api/v1/network/refetch_schemas` refreshes network configs and repopulates consumed schemas.

Use this after:

- changing a local network config
- updating a remote network config URL
- adding or changing custom item schema URLs
- wanting the API/UI to see new schema data without restarting

---
title: Config Package
description: What the config package does and how to consume it.
head: []
sidebar:
  order: 2
---

`packages/config` centralizes small but important runtime contracts.

## What it exposes

- env Zod schemas
- allowed origins helpers
- network binding parsing
- network config loading helpers
- schema registry URL parsing

## Typical consumption pattern

In an app:

```ts
import {
  ApiSecretsSchema,
  AuthSecretsSchema,
  InstanceSecretsSchema,
  NetworkRuntimeSecretsSchema,
  parseServedDomains,
} from '@dpg/config';

const instance = InstanceSecretsSchema.parse(process.env);
const api = ApiSecretsSchema.parse(process.env);
const servedDomains = parseServedDomains(process.env.SERVED_DOMAINS!);
```

## Runtime schemas

The package owns these environment contracts:

- `InstanceSecretsSchema`
- `ApiSecretsSchema`
- `AuthSecretsSchema`
- `NotificationSecretsSchema`
- `SchemaRegistrySecretsSchema`
- `OptionalSchemaRegistrySecretsSchema`
- `NetworkRuntimeSecretsSchema`
- `DatabaseSecretsSchema`

`loadNetworkConfigs()` can load configs from a local file, explicit `NETWORK_CONFIG_URLS`, or `SCHEMA_REGISTRY_URL` mappings. This keeps local development and multi-network production instances on the same parsing path.

## Why consume it

Use the config package when:

- multiple apps should validate env the same way
- runtime parsing should not be duplicated
- network config behavior should stay consistent across services

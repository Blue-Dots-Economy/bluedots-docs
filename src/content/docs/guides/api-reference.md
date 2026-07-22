---
title: API Reference
description: Reference for the Signals and Aggregator endpoints, auth headers and error conventions.
sidebar:
  order: 7
prev:
  link: /guides/installation/signals-dpg/
  label: "Path 8 of 9: Signals DPG Setup"
---

This page summarises the public surface of both DPGs. It is a starting scaffold — generate the full, always-current reference from each service's OpenAPI/Zod definitions and link it here.

## Conventions

- **Responses never throw.** Errors return `reply.code(N).send({ error, message })` with a machine-readable `error` code.
- **Postgres errors** are mapped explicitly: `23505` → unique violation, `23503` → foreign-key violation.
- All request/response bodies are validated by **Zod** schemas.

## Signals API

### Read

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/item/fetch` | **Instance-local** read of an instance's own items (brief Redis cache). |
| `GET` | `/api/v1/network/item/fetch` | **Inter-instance** read: count-first discovery across peers, merged + cached. |

### Admin

| Method | Path | Notes |
| --- | --- | --- |
| `*` | `/api/v1/admin/*` | Requires `x-acting-org-id`; gated by `organization.type` (`network_service` / `aggregator` / `voice`). |

### Auth headers

```http
x-api-key: <integrating DPG key>      # checked first; invalid ⇒ 403 INVALID_API_KEY
x-acting-org-id: <acting org id>      # required on /admin/*
```

Items are created with server-generated `item_instance_url` and `item_schema_url`; clients must not set them.

## Aggregator API

The Aggregator API (Fastify BFF on `:4000`) exposes registration/approval, profile, bulk-upload and registration-link endpoints. Every handler asserts `session.aggregator_id` (never trusted from the client).

| Area | Purpose |
| --- | --- |
| Registration & approval | Onboard and approve an aggregator organisation. |
| Profile | Schema-driven (RJSF) profile read/update. |
| Bulk upload | Entry point for CSV/file upload; processed by the worker. |
| Registration links | Create/track shareable self-registration links. |

Common error codes include `403 MISSING_AGGREGATOR_ID` (Keycloak protocol mappers not configured) and `403 INVALID_API_KEY` (Signals service-auth).

:::tip[Generating live docs]
Wire each service's OpenAPI output into this site (for example with a Starlight OpenAPI plugin) so the reference stays in lock-step with the code.
:::

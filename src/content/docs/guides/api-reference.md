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
authorization: Bearer <token>         # Keycloak-issued; OIDC (people) or client credentials (DPGs)
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

Common auth error codes:

| Code | Meaning |
| --- | --- |
| `401` | Token missing, expired, or failing signature/issuer validation |
| `403 TOKEN_ROLE_REJECTED` | Token carries none of `KEYCLOAK_REQUIRED_REALM_ROLES` |
| `403 MISSING_AGGREGATOR_ID` | Token has no `aggregator_id` claim — the user is not attached to an aggregator |
| `401 PEER_AUTH_FAILED` | Inter-instance peer call with a missing or invalid instance token |

A client id absent from `KEYCLOAK_ACCEPTED_CLIENT_IDS` (human path) or `KEYCLOAK_SERVICE_CLIENT_IDS` (service path) is rejected — the service list is **empty by default**, so a newly registered DPG is refused until listed. See [Identity & Auth](/core-concepts/architecture/identity-and-auth/).

The complete, always-current operation-by-operation reference for all three services is generated from code — see the [API Reference](/api/) section.

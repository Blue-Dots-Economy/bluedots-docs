---
title: API Conventions
description: Auth headers, error codes and response conventions shared by the Signals and Aggregator APIs — how to read the generated reference.
sidebar:
  order: 8
prev:
  link: /guides/installation/signals-dpg/
  label: "Path 9 of 10: Signals DPG Setup"
next:
  link: /api/
  label: "API Reference (generated)"
---

The operation-by-operation reference for all three services is [generated from code](/api/) and stays current automatically. This page covers what the generated reference does not: the conventions that hold across every endpoint.

## Response conventions

- **Handlers never throw.** Errors return `reply.code(N).send({ error, message })` with a machine-readable `error` code.
- **Postgres errors are mapped explicitly**: `23505` → unique violation, `23503` → foreign-key violation.
- All request and response bodies are validated by **Zod** schemas, which is also what generates the OpenAPI specs.

## Auth headers

```http
authorization: Bearer <token>         # Keycloak-issued; OIDC (people) or client credentials (DPGs)
x-acting-org-id: <acting org id>      # required on /admin/*
```

`/api/v1/admin/*` is gated by `organization.type` (`network_service`, `aggregator` or `voice`).

On the Aggregator API every handler asserts `session.aggregator_id`, which is taken from the authenticated session and **never** trusted from the client.

## Common auth errors

| Code | Meaning |
| --- | --- |
| `401` | Token missing, expired, or failing signature/issuer validation |
| `403 TOKEN_ROLE_REJECTED` | Token carries none of `KEYCLOAK_REQUIRED_REALM_ROLES` |
| `403 MISSING_AGGREGATOR_ID` | Token has no `aggregator_id` claim — the user is not attached to an aggregator |
| `401 PEER_AUTH_FAILED` | Inter-instance peer call with a missing or invalid instance token |

A client id absent from `KEYCLOAK_ACCEPTED_CLIENT_IDS` (human path) or `KEYCLOAK_SERVICE_CLIENT_IDS` (service path) is rejected. The service list is **empty by default**, so a newly registered DPG is refused until it is listed.

## Server-owned fields

Items are created with server-generated `item_instance_url` and `item_schema_url`. Clients must not set them — see [Anatomy of a signal](/core-concepts/signals/#anatomy-of-a-signal).

## Where to go next

- [API Reference](/api/) — the generated operations for Signals, Aggregator and Signals-Search.
- [Identity & Auth](/core-concepts/architecture/identity-and-auth/) — the full token and acting-org model.
- [Keycloak Setup](/guides/keycloak-setup/) — registering a client so it passes these checks.

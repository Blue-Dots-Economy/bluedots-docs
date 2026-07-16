---
title: Identity & Auth
description: The two auth systems across the stack — Keycloak (Aggregator) and Better-Auth + API keys (Signals).
sidebar:
  order: 5
---

The two verticals use different identity systems, joined by a service-auth handshake.

## Aggregator: Keycloak (OIDC)

The Aggregator stack authenticates users with **Keycloak**, realm `aggregator` (imported on first boot). Two clients exist:

- `aggregator-portal` — the web portal (public, OIDC authorization-code flow).
- `aggregator-api` — the API + BFF service account (confidential).

A custom **OTP-by-email/phone** authenticator (a Keycloak SPI) is bundled with the realm. Two protocol mappers — `aggregator_id` and `phone_number` user attributes mapped to token claims — **must be added by hand** after a fresh realm import; without them the profile endpoint returns `403 MISSING_AGGREGATOR_ID`.

The golden rule: **`aggregator_id` is never trusted from the client.** Every handler asserts it from the authenticated session, so one aggregator can never read or write another's data.

## Signals: Better-Auth + API keys

The Signals API supports **two distinct auth paths**, both handled in one middleware:

1. **API-key path** — `x-api-key` is checked first. If present but invalid, the request fails immediately with `403 INVALID_API_KEY` (no fallback). This is how integrating DPGs (the Aggregator app, a voice DPG) authenticate.
2. **Session path** — used by the Signals UI when `x-api-key` is absent (Better-Auth).

Admin endpoints (`/api/v1/admin/*`) additionally require an **`x-acting-org-id`** header, validated against the organisation's `type` (`network_service` | `aggregator` | `voice`). The middleware populates `request.user` and `request.acting_org`; routes read those rather than re-parsing headers.

`AUTH_MIDDLEWARE_ENABLED` (default `true`) is a kill switch for running migrations or seed scripts that must not hit the auth path.

## The two-header service-auth model

When an integrating DPG calls Signals, it presents **two headers**:

```http
x-api-key: <the integrating DPG's API key>
x-acting-org-id: <the organisation it is acting as>
```

This lets Signals authenticate the *caller* (API key) and authorise the *action* (acting-org type) in one step. This model is documented in the Signals repo at `docs/operations/integrating-dpgs.md`.

## Deployment note

When moving off `localhost`, update the `aggregator-portal` client's **Valid Redirect URIs** and **Web Origins** in the Keycloak admin console, and replace `localhost`/`keycloak` hostnames throughout the environment config. See [Deployment](/guides/deployment/).

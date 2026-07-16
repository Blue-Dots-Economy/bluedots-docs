---
title: Authentication Service
description: How Better Auth is used as the current authentication and organization service, while remaining replaceable in the project architecture.
head: []
sidebar:
  order: 2
---

This project currently uses Better Auth as its authentication service.

Even though Better Auth is integrated inside the DPG monorepo, it should still be treated as a separate service capability because authentication and authorization are replaceable concerns in this architecture.

## Responsibility

The current auth service provides:

- user authentication
- bearer-token-based API access
- organization support
- admin roles
- API key support
- hooks for authorization-oriented flows
- unified OTP for both phone and email identifiers

## Why It Is A Service

Authentication is operationally and architecturally separate from DPG's core network model.

DPG needs an authenticated user context for protected flows, but it does not require Better Auth specifically. Another authn/authz provider can be introduced as long as it can support the application's trust, session, and authorization requirements.

## Current Integration Boundary

The main integration points are:

- `packages/auth/src/config.ts`: reusable auth factory
- `packages/auth/plugins/unified_otp.ts`: custom OTP plugin
- `apps/api/src/routes/auth/*`: runtime auth creation and mounting

Mounted route family:

- `/api/auth/*`

## Project-Specific Capabilities In Use

- email OTP and phone OTP through one unified flow
- organization support from Better Auth plugins
- bearer auth for protected API routes
- API key plugin support for service-oriented access patterns

## Separation Guidance

Treat Better Auth as the current service implementation, not the permanent architecture.

To preserve replaceability:

- keep application auth calls behind API routes or dedicated UI clients
- avoid leaking Better Auth internals into domain logic
- keep user identity assumptions minimal in item and action flows
- isolate custom login UX from the underlying auth vendor where practical

## Interaction With Other Services

- uses the notification service for OTP delivery when configured
- provides the signed-in user identity used by the wallet import flow
- protects DPG item, action, and profile-management routes

For implementation details, also see [Better Auth And OTP](/auth/better-auth-unified-otp) and [Auth Package](/packages/auth-package).

---
title: Wallet Service
description: Wallet-based credential retrieval service used for provider-agnostic credential import in the UI.
head: []
sidebar:
  order: 3
---

The current project uses Dhiway Wallet as the active wallet service for credential import.

It is included to demonstrate how DPG can fetch user-linked credentials from an external wallet and map them into project profile schemas, but the surrounding UI architecture is designed so another wallet implementation can be substituted later.

## Responsibility

The wallet service is responsible for:

- accepting an identifier such as email or phone number
- sending a verification code to that identifier
- verifying the returned code
- returning verified credentials associated with that user

The DPG UI remains responsible for:

- deciding when credential import is available
- presenting provider selection
- mapping external payloads into the active schema form
- allowing users to review and submit the resulting profile data

## Current User Flow

1. The user signs in to DPG.
2. The profile form exposes `Import Credentials` when at least one provider is configured.
3. The user selects Dhiway Wallet.
4. The UI offers the signed-in user's email or phone number as the identifier.
5. The wallet service sends a verification code.
6. The user verifies the code.
7. The wallet service returns verified credentials.
8. The user selects one credential to import.
9. The UI maps credential fields into the active schema.

## Integration Surface

Current UI client:

- `apps/ui/src/lib/wallet-api.ts`

Current provider UI:

- `apps/ui/src/components/wallet/providers/dhiway-wallet-provider.tsx`

Current endpoints:

- `POST /api/v1/auth/request-code`
- `POST /api/v1/auth/verify-code`
- `GET /api/v1/verified-credentials`

Current env:

- `VITE_VC_WALLET_URL`
- `VITE_VC_WALLET_API_KEY`

## Replaceability

The wallet integration is replaceable because the form page only depends on the provider contract and normalized import result.

To replace Dhiway Wallet with another provider:

1. implement a new provider component
2. implement a client for the new service's endpoints
3. return the shared import result shape
4. register the provider in the wallet registry

No profile-form rewrite should be required.

## Project Recommendation

Treat wallet integration as a capability service owned by deployment and product requirements, not by the DPG core model.

That keeps the project open to:

- national or regional wallet providers
- enterprise credential brokers
- issuer-specific retrieval flows
- deployments that do not use wallet import at all

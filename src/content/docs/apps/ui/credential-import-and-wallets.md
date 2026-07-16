---
title: Credential Import And Wallets
description: How the UI imports credentials through provider-agnostic wallet integrations and schema-aware field mapping.
head: []
---

The UI now supports importing verified credential data directly into profile forms.

This capability is intentionally provider-agnostic. The form page does not know how a wallet or external credential source works. It only knows how to:

- open the import modal
- pass the active user, network, domain, schema, and current form data as context
- receive a normalized import result
- merge the imported values into the active schema form

## Design Goals

- keep credential-source logic out of form pages
- allow one deployment to ship multiple providers side by side
- let projects replace Dhiway-specific services without rewriting the UI flow
- map imported credential data into different schema shapes with minimal code changes

## Runtime Flow

1. `profile-form-page.tsx` checks whether a profile schema is active and whether any wallet provider is configured.
2. When both conditions are true, the page shows `Import Credentials`.
3. `WalletImportModal` lists all registered providers and enables only the configured ones.
4. The selected provider completes its own verification or authorization flow.
5. The provider returns a `WalletImportResult` with normalized data, alias candidates, metadata, and optional raw payload.
6. `mergeImportedDataIntoSchema()` matches imported values into the active JSON Schema and updates the form state.
7. The UI shows a success message with mapped and skipped field counts.

## Provider Contract

Providers implement the shared `WalletProvider` contract from `engine/wallet/types.ts`.

The contract keeps all integrations consistent:

- `name`, `label`, `description`: visible catalog metadata
- `component`: provider-specific UI and network flow
- `isConfigured()`: deploy-time availability check
- `getConfigurationHint()`: operator-facing message when config is missing

The import result is also standardized:

- `data`: directly mapped values when a provider can supply them confidently
- `candidates`: expanded alias/value pairs used by the schema mapper
- `rawPayload`: original source payload for additional matching and debugging context
- `metadata`: provider-specific metadata such as issuer or credential identifiers
- `summary`: short success text for UI feedback

## Registered Providers Today

The UI currently registers these providers at startup from `src/components/wallet/providers/index.ts`:

- `dhiway-wallet`
- `digilocker`

This registration happens once in `src/main.tsx`, so the rest of the app can remain unaware of provider implementations.

## Dhiway Wallet Flow

The Dhiway Wallet provider is an example of a credential-wallet integration driven by user identifier verification.

Flow:

1. Read the signed-in user's email and phone number from auth context.
2. Let the user choose one available identifier.
3. Request a verification code from the wallet service.
4. Verify the code and store the returned wallet token.
5. Fetch verified credentials for that identifier.
6. Let the user choose one credential to import.
7. Transform the selected credential into normalized candidates for schema mapping.

Required env:

- `VITE_VC_WALLET_URL`
- `VITE_VC_WALLET_API_KEY`

Current service endpoints:

- `POST /api/v1/auth/request-code`
- `POST /api/v1/auth/verify-code`
- `GET /api/v1/verified-credentials`

## DigiLocker Flow

The DigiLocker provider is an example of an external credential-pull flow that is not driven by the wallet verification endpoints.

Flow:

1. Start an authorization request through the DigiLocker agent service.
2. Open the returned URL in a popup.
3. Detect the returned code automatically when the popup reaches a redirect bridge page, or let the user paste the code manually.
4. Exchange the code through the agent service.
5. Transform the returned `credentialSubject` into import candidates.

Required env:

- `VITE_AGENT_URL`
- `VITE_AGENT_TOKEN`

Current service endpoints:

- `GET /api/v1/discover/digilocker-request`
- `POST /api/v1/discover/digilocker-auth`

## Schema-Aware Mapping

The key to provider-agnostic import is `lib/import-mapping.ts`.

It avoids one-off UI code per provider or per schema by:

- flattening nested external payloads into a candidate map
- generating normalized aliases for raw keys
- reading schema-level alias extensions from each property
- coercing string values into numbers when the schema expects numeric types
- reporting skipped fields when no schema property matches

Supported schema extensions:

- `x-import-aliases`
- `x-import-paths`
- `x-wallet-aliases`

These extensions let a schema say that one local property can accept values from many external names such as `fullName`, `full_name`, `name`, or a nested issuer-specific path.

## Why This Is Provider-Agnostic

The current deployment uses Dhiway Wallet and Dhiway-backed DigiLocker services, but the UI architecture does not depend on those names.

A replacement provider only needs to:

- register itself
- expose its own configuration rules
- return the shared import result shape

That means a project can swap in another wallet, another DigiLocker connector, or another credential broker without rewriting the profile form experience.

## Recommended Project Pattern

For project-specific deployments, treat credential import as a capability layer instead of a vendor feature.

- keep providers behind the registry contract
- keep form mapping in schema metadata, not component conditionals
- keep vendor env and endpoint details isolated to provider clients
- document which providers are default, optional, or deployment-specific

---
title: UI App
description: Schema-driven React frontend overview and navigation for the UI implementation guide.
head: []
---

The UI app lives in `apps/ui`. It is a React 19 + Vite frontend that renders network browsing, profile forms, cards, maps, action modals, and action-management screens from DPG network schema documents.

The important split is:

- **network schema driven**: domains, item schemas, public fields, action requirement forms, and network configs
- **application hardcoded**: page routes, auth flow, title/icon/location heuristics, and layout behavior
- **reusable UI engine**: schema loading, `$ref` resolution, privacy filtering, schema forms, cards, action modal flow, map provider registry, and API clients

## Guide Pages

| Page | Use it for |
|------|------------|
| [Running The UI](/apps/ui/running) | Local setup, env variables, and backend routes the UI expects |
| [Credential Import And Wallets](/apps/ui/credential-import-and-wallets) | Provider-agnostic credential import flow, wallet providers, DigiLocker support, and schema mapping |
| [Hardcoded Parts](/apps/ui/hardcoded-parts) | Product-specific assumptions that are not generic DPG behavior |
| [Schema-Generated Parts](/apps/ui/schema-generated-parts) | What is loaded and rendered from the network schema |
| [Components](/apps/ui/components) | Layout, cards, forms, actions, auth, and map components |
| [Utils And Packages](/apps/ui/utils-and-packages) | Engine files, API clients, helper utilities, and npm packages |
| [Custom UI Guide](/apps/ui/custom-ui-guide) | How to reuse the schema behavior in another interface |
| [Maps](/apps/ui/maps) | Map provider registry, geocoding, marker behavior, and required packages |

## Stack

- React 19 + Vite
- React Router
- TanStack Query
- Tailwind CSS + shadcn/ui
- React JSON Schema Form with AJV8 validation
- Axios for API calls
- sonner for toasts
- lucide-react icons
- react-leaflet + Leaflet as the default map provider

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `HomePage` | Browse network participants by domain in list or map mode |
| `/profile/new` | `ProfileFormPage` | Create an item/profile from a selected domain schema |
| `/profile/:id/edit` | `ProfileFormPage` | Edit an owned item/profile |
| `/auth/login` | `LoginPage` | Start email-or-phone OTP login or signup |
| `/auth/otp` | `OtpPage` | Verify OTP and persist the bearer token |
| `/my-actions` | `MyActionsPage` | Review initiated and received actions and update statuses |

`/profile/new`, `/profile/:id/edit`, and `/my-actions` are protected by `RequireAuth`.

The `?network=<name>` query param selects the active network when multiple configured networks are available. The `?as=<domain>` query param on `/` is a runtime override for the current browsing role. The `?domain=<domain>` param controls the selected target domain. The `?view=list|map` param controls the view mode.

## Credential Import

The profile form now supports credential import through a provider-agnostic wallet registry.

- providers register themselves at startup through `engine/wallet/wallet-registry.ts`
- the profile form only checks whether any provider is configured before showing the `Import Credentials` action
- imported payloads are mapped into the active schema with alias-aware matching, so one provider format does not need one-off form code per domain
- the current implementation ships with Dhiway Wallet and DigiLocker providers as adoption examples, but the UI is intentionally designed so they can be replaced or extended

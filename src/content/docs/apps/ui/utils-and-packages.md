---
title: Utils And Packages
description: Utility modules and packages required to decode and display network-schema data.
head: []
---

## Engine Utilities

| File | Purpose |
|------|---------|
| `engine/schema/schema-loader.ts` | Loads schemas from inline objects, URLs, and API references |
| `engine/schema/resolve-schema.ts` | Resolves local, relative, and remote `$ref` values and flattens `allOf` |
| `engine/schema/schema-privacy.ts` | Filters schemas/data by the `private: true` convention |
| `engine/map/map-registry.ts` | Registers/selects map providers |
| `engine/wallet/wallet-registry.ts` | Registers/selects credential import providers and filters them by runtime configuration |
| `engine/wallet/types.ts` | Shared provider contract for import context, provider components, and import results |
| `engine/types.ts` | UI-side network, action, map, and filter types |

## API Utilities

| File | Purpose |
|------|---------|
| `lib/api-config.ts` | API base URL selection from env and local storage |
| `lib/api-client.ts` | Axios client with bearer token attachment |
| `lib/network-api.ts` | Network config and network item fetch calls |
| `lib/item-api.ts` | Local item CRUD and action calls |
| `lib/action-api.ts` | Action fetch, perform, update-status, and event-history calls |
| `lib/auth-api.ts` | Unified OTP, session, and sign-out calls |
| `lib/auth-token.ts` | Token storage helpers |
| `lib/item-utils.ts` | Item geocoding/extraction helpers |
| `lib/import-mapping.ts` | Flattens imported payloads, generates candidate aliases, and merges values into the active JSON Schema form |
| `lib/wallet-api.ts` | Dhiway Wallet credential import client and payload transformer |
| `lib/digilocker-api.ts` | DigiLocker agent client and credential subject transformer |
| `lib/match-score-api.ts` | Match score API client, item-to-snapshot helper, and request/response types |
| `lib/utils.ts` | Shared UI utility helpers |

## Match Score Utilities

| File | Purpose |
|------|---------|
| `utils/match-score-cache.ts` | `localStorage` cache with 24-hour TTL, cache key generation, and score band formatting helpers |
| `hooks/use-match-score.ts` | React hook that orchestrates cache lookup, API call, recalculate, and error state |

## Required Packages

For equivalent schema decoding and display behavior, keep these package categories:

| Package | Needed for |
|---------|------------|
| `react`, `react-dom` | UI runtime |
| `react-router-dom` | Routes and query params |
| `@rjsf/core`, `@rjsf/shadcn`, `@rjsf/utils`, `@rjsf/validator-ajv8` | JSON Schema forms |
| `@tanstack/react-query` | Query caching, polling, and mutation state for actions/network config |
| `ajv`, `ajv-formats` | JSON Schema validation support |
| `axios` | API client |
| `@radix-ui/*`, `radix-ui`, `vaul` | Dialogs, drawers, popovers, selects, tooltips |
| `tailwindcss`, `tailwind-merge`, `clsx`, `class-variance-authority` | Styling and component variants |
| `lucide-react` | Icons |
| `sonner` | Toasts |
| `leaflet`, `react-leaflet`, `@types/leaflet` | Default map implementation |
| `date-fns`, `react-day-picker` | Date picker widget |
| `schemas` workspace package | Shared schema package dependency |

If you do not reuse the existing visual components, you still need a JSON Schema renderer, a `$ref` resolver, privacy filtering, an API client, and map/geocoding utilities for equivalent behavior.

For equivalent credential import behavior, you also need:

- a provider registry so one integration does not leak into all form code
- a mapping layer that can translate external credential payloads into schema property names
- pluggable provider clients for wallet, DigiLocker, or any future credential source

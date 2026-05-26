---
title: Components
description: UI component responsibilities and which ones are reusable.
head: []
---

## Layout

| Component | File | Purpose |
|-----------|------|---------|
| `PageShell` | `components/layout/page-shell.tsx` | Root layout with sidebar, top bar, and content region |
| `AppSidebar` | `components/layout/sidebar.tsx` | Network selector, domain browsing, grouped profiles, create/edit links, and My Actions entry |
| `TopBar` | `components/layout/top-bar.tsx` | Search input, list/map toggle, dev API selector, auth controls, and pending-action bell |

## Cards

| Component | File | Purpose |
|-----------|------|---------|
| `CardGrid` | `components/cards/card-grid.tsx` | Responsive repeated item grid with loading and empty states |
| `DomainCard` | `components/cards/domain-card.tsx` | One schema-backed item card |
| `CardFieldsFromSchema` | `components/cards/card-field.tsx` | Public field rendering from JSON Schema |
| `ActionButton` | `components/cards/action-button.tsx` | Button for a schema-derived action |

## Forms

| Component | File | Purpose |
|-----------|------|---------|
| `SchemaForm` | `components/forms/schema-form.tsx` | RJSF + AJV8 form renderer for item and action schemas |
| `DatePickerWidget` | `components/forms/custom-widgets/date-picker-widget.tsx` | Custom date widget for `format: "date"` fields |

## Actions

| Component | File | Purpose |
|-----------|------|---------|
| `ActionHandler` | `components/actions/action-handler.tsx` | Owns action modal state and submit lifecycle |
| `ActionModal` | `components/actions/action-modal.tsx` | Desktop dialog/mobile drawer for action requirement forms |
| `ActionList` | `components/actions/action-list.tsx` | Inbox/outbox tabs, refresh handling, and empty/error states for My Actions |
| `ActionCard` | `components/actions/action-card.tsx` | Per-action summary card in the initiated/received lists |
| `ActionStatusUpdater` | `components/actions/action-status-updater.tsx` | Dialog/drawer for status transitions, remarks, and optional event schema data |

## Auth

| Component | File | Purpose |
|-----------|------|---------|
| `AuthProvider` | `contexts/auth-context.tsx` | User/session/token state |
| `RequireAuth` | `components/auth/require-auth.tsx` | Route guard with redirect-to-login behavior |
| `LoginPage` | `pages/auth/login-page.tsx` | Email or phone entry, user check, and OTP request |
| `OtpPage` | `pages/auth/otp-page.tsx` | OTP verification and redirect restoration |
| `OtpInput` | `components/auth/otp-input.tsx` | OTP entry control |
| `UserMenu` | `components/auth/user-menu.tsx` | Signed-in user and sign-out UI |

## Pages

| Page | File | Purpose |
|------|------|---------|
| `HomePage` | `pages/home-page.tsx` | Loads network config, resolves schemas, fetches items, and renders list/map browsing |
| `ProfileFormPage` | `pages/profile-form-page.tsx` | Create/edit flow with network-aware schema and geocoding support |
| `MyActionsPage` | `pages/my-actions-page.tsx` | Polling inbox/outbox screen for initiated and received actions |
| `LoginPage` | `pages/auth/login-page.tsx` | Login/signup entry point |
| `OtpPage` | `pages/auth/otp-page.tsx` | OTP verification step |

## Match Score

| Component | File | Purpose |
|-----------|------|---------|
| `MatchScoreCard` | `components/match-score/match-score-card.tsx` | Wraps `DomainCard` with match score state and wires the modal |
| `MatchScoreContainer` | `components/match-score/match-score-container.tsx` | Standalone button + modal container for match scores |
| `MatchScoreButton` | `components/match-score/match-score-button.tsx` | Calculate / loading / error / score badge trigger |
| `MatchScoreBadge` | `components/match-score/match-score-badge.tsx` | Colored badge showing score percentage with tooltip preview |
| `MatchScoreModal` | `components/match-score/match-score-modal.tsx` | Detailed score dialog with progress bar, signals, AI reasoning, and actions |

## Maps

| Component | File | Purpose |
|-----------|------|---------|
| `MapView` | `components/map/map-container.tsx` | Converts schema-backed items into map markers |
| `FitBounds` | `components/map/fit-bounds.tsx` | Fits Leaflet viewport to markers |
| `leaflet-provider` | `components/map/providers/leaflet-provider.tsx` | Default map provider |
| `google-maps-provider` | `components/map/providers/google-maps-provider.tsx` | Provider slot for Google Maps |

## Design System

`components/ui/*` contains shadcn/Radix primitives: buttons, cards, dialogs, drawers, popovers, selects, sidebar, skeletons, toggles, tooltips, calendar, inputs, labels, and separators.

For a custom product UI, the highest-value reusable components are `SchemaForm`, `DomainCard`, `CardFieldsFromSchema`, `ActionHandler`, `ActionModal`, and `MapView`.

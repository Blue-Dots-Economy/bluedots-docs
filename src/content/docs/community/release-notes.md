---
title: Release Notes
description: Versioned changes to the Blue Dots DPGs and this documentation.
sidebar:
  order: 3
---

Track notable changes here. Keep entries newest-first, grouped by component, following [Keep a Changelog](https://keepachangelog.com/) conventions.

## Unreleased

### Docs
- Documentation updated for the Keycloak migration: identity pages rewritten around the shared `bluedots` realm, added a [Keycloak Realm Reference](/core-concepts/architecture/keycloak-realm/) and a [Keycloak Setup](/guides/keycloak-setup/) guide, and corrected the architecture and infrastructure diagrams.
- Initial documentation site published with Astro + Starlight: Overview, Core Concepts (Architecture + Technical), Guides, Explore and Community sections.

### Signals DPG
- **Changed:** identity moved to Keycloak. Browser logins use the OIDC authorization-code flow against a Keycloak-hosted login screen; integrating DPGs authenticate with client-credentials service tokens.
- **Added:** audience and role gating on incoming tokens — `KEYCLOAK_ACCEPTED_CLIENT_IDS`, `KEYCLOAK_SERVICE_CLIENT_IDS` (empty by default) and `KEYCLOAK_REQUIRED_REALM_ROLES`.
- **Added:** `ACTING_ORG_SOURCE` lets the `x-acting-org-id` header be checked against the token's `signals_acting_orgs` grant instead of being trusted outright.

### Aggregator DPG
- **Changed:** the Keycloak realm is no longer the fixed `aggregator`. It is now named per network via `KEYCLOAK_REALM` (e.g. `bluedots`, `yellowdots`) and is shared with Signals, so one identity works across both verticals.
- **Changed:** the custom Keycloak **server** image is now built and released from `bluedots-automation` rather than this repo; the per-network login **theme** image is still built here.
- **Note:** protocol mappers (`aggregator_id`, `aggregator_type`, `phone_number`, `signalstack_org_id`) ship in the realm import and no longer need to be added by hand after a fresh import.

---

## Template for a release

```markdown
## [x.y.z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

:::tip
If you publish per-app release images (`web-v*`, `api-v*`, `worker-v*`), link each tag's notes here so operators can correlate deployed images with documented changes.
:::

---
title: Hardcoded Parts
description: Product-specific UI assumptions that are not generic DPG requirements.
head: []
---

These are current product choices in `apps/ui`. Treat them as replaceable when building a custom interface.

| Area | Current behavior |
|------|------------------|
| Routes | Fixed routes for home, profile create/edit, login, OTP, and My Actions |
| Action ordering | When multiple actions match a domain pair, the first returned action is treated as the primary action in some list views |
| Action copy | Some empty/error copy still says "connect" or describes connection-style flows |
| Visible domains | Targets are derived from all `network.actions[*].interactions` that match the active profile domain |
| Item type selection | The first key in `domain.item_schemas` is used |
| Fallback item type | Some paths fall back to `profile` |
| Default network | `?network=<name>` wins when it matches a configured network; otherwise the first configured/API network is used |
| Title fields | Cards look for `name`, `full_name`, `title`, `provider_id`, `learner_id`, `student_id` |
| Domain icons | Known domain names map to lucide icons; unknown domains use generic icons |
| Location fields | Map rendering uses known coordinate, postal, address, city, region, and country field names |
| Map default | India center with Leaflet/OpenStreetMap |
| Auth | OTP auth is the only built login flow, but it now accepts either phone numbers or email addresses |
| Item language | The UI calls generic items “profiles” |
| Action polling | My Actions badges and lists poll every 5 seconds |
| Credential import trigger | The import button appears on profile forms only when at least one provider reports itself as configured |
| Wallet providers shipped today | `dhiway-wallet` and `digilocker` are pre-registered at startup |
| Dhiway wallet identifier source | The flow uses the signed-in user's email or phone number instead of asking for arbitrary identifiers |
| DigiLocker callback convention | Automatic popup completion expects a redirect URL containing `wallet-redirect?code=` or a bridge page posting that code back |

## Customization Points

To generalize the UI:

- expose an item-type selector for domains with multiple item schemas
- move title field selection into schema metadata or a UI config
- move icon mapping into config
- replace profile wording with domain/item wording
- replace the OTP pages if your product uses another login flow
- make map center and geocoding rules configurable
- choose explicit action prioritization instead of relying on first-match behavior
- move provider enablement and provider ordering into deploy-time configuration if different instances need different import catalogs

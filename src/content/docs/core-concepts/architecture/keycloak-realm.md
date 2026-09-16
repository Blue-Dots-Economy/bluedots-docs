---
title: Keycloak Realm Reference
description: The network realm — clients, realm roles, claim mappers, login themes and the OTP authenticator.
sidebar:
  order: 6
---

Reference for the shared network realm. For how these pieces are used at request
time, see [Identity &
Auth](/core-concepts/architecture/identity-and-auth/).

**The realm name is per deployment.** One realm serves one network or domain, and
its name comes from `KEYCLOAK_REALM` — `bluedots`, `yellowdots`, `purpledots`.
Examples below use `bluedots`; substitute your own.

The realm is defined as JSON and imported, not configured by hand. Signals keeps
a template — `infra/keycloak/realms/bluedots-realm.json` in signals-dpg,
`infra/keycloak/realms/realm.json` in aggregator-dpg — which `render-realm.sh`
expands per deployment, stamping in the realm name and brand.

## Clients

| Client | Vertical | Kind | Purpose |
| --- | --- | --- | --- |
| `signals-ui` | Signals | Public | Browser login for the Signals UI |
| `signals-api` | Signals | Confidential | The API's own Admin REST client |
| `aggregator-portal` | Aggregator | Public | Browser login for the portal |
| `aggregator-bff` | Aggregator | Confidential | BFF → Aggregator API service account |
| `aggregator-api` | Aggregator | Confidential | Aggregator API |
| `aggregator-dpg` | Integrating DPG | Confidential | Aggregator → Signals |
| `voice-dpg` | Integrating DPG | Confidential | Voice DPG → Signals |

`signals-api` is intentionally accepted on neither the human nor the service
path. It exists so the API can call Keycloak's Admin REST endpoints, not so it
can call itself.

## Realm roles

| Role | Meaning |
| --- | --- |
| `signals_participant` | A person who can hold items and take actions |
| `signals_admin` | Administrative access to Signals |
| `org_owner` | Parent-org owner; granted at org approval. Present even when `ORG_HIERARCHY_ENABLED=false` |

At least one of these must be present on a human token — see
`KEYCLOAK_REQUIRED_REALM_ROLES`.

## Claim mappers

Mappers are part of the realm import. **They do not need to be added by hand.**

| Claim | On client | Carries |
| --- | --- | --- |
| `aggregator_id` | `aggregator-portal` | The aggregator the user belongs to |
| `aggregator_type` | `aggregator-portal` | Aggregator classification |
| `decision_made` | `aggregator-portal` | Registration decision state |
| `signalstack_org_id` | `aggregator-portal` | The upstream Signals organisation id |
| `phone_number` | `aggregator-portal`, `signals-ui` | Verified phone number |
| `phone_number_verified` | `signals-ui` | Whether the phone number is verified |
| `signals_acting_orgs` | `signals-ui`, `aggregator-dpg`, `voice-dpg` | Organisations the token may act as |

Each client also carries an audience mapper (`signals-api-audience` or
`aggregator-api-audience`) so the receiving API can assert `aud`.

`signals_acting_orgs` supports a `['*']` wildcard grant, currently used for the
platform `network_service` client. It is an explicit grant that should later be
replaced by an enumerated organisation list.

## Login experience

Keycloak owns the login screen; neither app ships a login form.

- A custom **OTP authenticator** (a Keycloak SPI, packaged as a provider JAR)
  sends a one-time code by email or SMS and verifies it.
- **FreeMarker themes** under `infra/keycloak/themes/otp/` render the login and
  email templates.
- Themes are **per-brand**: `blue-dot`, `purple-dot`, `orange-dot`, `upsdm` and
  `onetac` each supply their own logos and favicon, so a deployment's login page
  matches its network.

## Realm scripts

| Script | Does |
| --- | --- |
| `render-realm.sh` | Expands the realm template for a deployment and writes the import file |
| `apply-user-profile.sh` | Applies the declarative user-profile configuration after import |

See the [Keycloak setup guide](/guides/keycloak-setup/) for the
order to run these in.

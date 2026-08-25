---
title: Identity & Auth
description: How Keycloak secures the Blue Dots stack — one shared realm, OIDC logins for people, client-credentials tokens for integrating DPGs.
sidebar:
  order: 5
---

Both verticals authenticate against **one Keycloak realm per network**. Signals
and the Aggregator share it, so a single identity works across the stack and
integrating DPGs authenticate the same way regardless of which service they call.

The realm name follows the network or domain being deployed and is set with
`KEYCLOAK_REALM` — `bluedots`, `yellowdots`, `purpledots` and so on. It is a
deployment input, not a fixed constant, so treat any realm name in these docs as
an example. A separate network means a separate realm.

Sharing one realm is what makes the audience checks below load-bearing: a token
minted for the Aggregator portal carries the same issuer and the same signature
as one minted for the Signals UI.

:::note[Versions and legacy instances]
Keycloak is the **recommended identity provider as of the `GA-2026-08-18`
release** of both DPGs, which is where the shared realm first shipped. These
pages describe that release and later.

Instances provisioned before it run the **legacy better-auth path**, which is not
documented here. One caveat worth checking even on a current release:
`AUTH_PROVIDER` still ships defaulting to `betterauth`, so an instance runs the
legacy path until it is explicitly switched to `keycloak`. If your login screen
asks for a code without redirecting to Keycloak, you are on the legacy path — the
docs are not wrong.

**There is no self-serve migration.** Moving an existing instance across is an
operator-run cutover: every user must exist in the realm before the switch, or
they are locked out. See [Migrating an existing
instance](/guides/keycloak-setup/#migrating-an-existing-instance).
:::

## Clients

| Client | Used by | Kind |
| --- | --- | --- |
| `signals-ui` | Signals web UI | Public — OIDC authorization code |
| `signals-api` | Signals API's own Admin REST calls | Confidential — **not** accepted as a caller on either path |
| `aggregator-portal` | Aggregator portal | Public — OIDC authorization code |
| `aggregator-bff` | Aggregator BFF → Aggregator API | Confidential — client credentials |
| `aggregator-api` | Aggregator API | Confidential |
| `aggregator-dpg` | Aggregator → Signals | Confidential — client credentials |
| `voice-dpg` | Voice DPG → Signals | Confidential — client credentials |

Realm roles are `signals_participant` and `signals_admin`. Tokens also carry
claim mappers for `aggregator_id`, `aggregator_type`, `phone_number`,
`signalstack_org_id` and `signals_acting_orgs`. The full inventory is in the
[Keycloak realm reference](/core-concepts/architecture/keycloak-realm/).

## Two kinds of caller

Every request to the Signals API presents a bearer token, and the token itself
decides which path it takes.

**People** sign in through the browser with the OIDC authorization-code flow.
Keycloak hosts the login screen — a custom OTP authenticator sends a code by
email or SMS, so neither app owns a login form. On first sign-in the subject is
mirrored into the local `user` table, keyed on the token's `sub`.

**Integrating DPGs** (the Aggregator app, a voice DPG) use the OAuth2
**client-credentials** grant. The resulting service-account token resolves to
that DPG's organisation by convention: **the Keycloak client id equals the
organisation's `slug`**. Register a client whose id matches the slug and the
mapping follows.

```http
authorization: Bearer <token>
x-acting-org-id: <the organisation it is acting as>
```

## What a token must prove

Because the realm is shared, a valid signature and issuer are not enough. Three
independent checks apply:

| Setting | Checks | Default |
| --- | --- | --- |
| `KEYCLOAK_ACCEPTED_CLIENT_IDS` | Clients allowed on the **human** path | `signals-ui` |
| `KEYCLOAK_SERVICE_CLIENT_IDS` | Clients allowed on the **service** path | *(empty)* |
| `KEYCLOAK_REQUIRED_REALM_ROLES` | A realm role the token must carry | `signals_participant,signals_admin` |

The two allowlists are deliberately separate rather than merged. Merging them
would let a token from the public `signals-ui` client be honoured as a service
account, and let an integrating DPG's token be provisioned as a human user. Both
directions are rejected. `signals-api` appears in neither list — it is the API's
own Admin REST client, not a caller.

The realm-role check is defence in depth. A client allowlist rests on a claim the
client itself controls; a realm role does not. Emptying
`KEYCLOAK_REQUIRED_REALM_ROLES` leaves the allowlist as the only cross-DPG gate
— do it only knowingly. Service tokens are exempt, since their service accounts
hold realm-management roles rather than participant roles.

## Acting organisation

Admin endpoints (`/api/v1/admin/*`) additionally require an **`x-acting-org-id`**
header, validated against the organisation's `type` (`network_service` |
`aggregator` | `voice`). Only a `network_service` org may upsert aggregators, for
example.

`ACTING_ORG_SOURCE` decides whether that header authorises itself:

| Value | Behaviour |
| --- | --- |
| `header` | The header is taken at face value |
| `claim_preferred` | The asserted org must fall inside the token's `signals_acting_orgs` grant, falling back to the header when the token carries no grant |
| `claim_required` | A token with no grant is refused outright |

The middleware populates `request.user` and `request.acting_org`; routes read
those rather than re-parsing headers. `AUTH_MIDDLEWARE_ENABLED` (default `true`)
is a kill switch for seed and migration scripts that must not hit the auth path.

## The aggregator_id rule

On the Aggregator side one rule outranks the rest: **`aggregator_id` is never
trusted from the client.** Every handler asserts it from the authenticated
session, so one aggregator can never read or write another's data.

## Deployment notes

Two settings are easy to confuse and account for most setup failures:

- **`KEYCLOAK_BASE_URL`** is browser-facing and must equal the `iss` claim
  byte-for-byte.
- **`KEYCLOAK_INTERNAL_BASE_URL`** is what the API process dials for JWKS and
  Admin REST — a service name, not the public hostname, in containerised setups.

When moving off `localhost`, update each public client's **Valid Redirect URIs**
and **Web Origins**. See the [Keycloak setup
guide](/guides/keycloak-setup/) and
[Deployment](/guides/deployment/).

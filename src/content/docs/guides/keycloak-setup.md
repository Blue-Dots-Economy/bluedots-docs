---
title: Keycloak Setup
description: Stand up your network's Keycloak realm — import, admin bootstrap, registering an integrating DPG, and the two base URLs.
sidebar:
  order: 4
---

Operator guide for a network's shared Keycloak realm. For what the realm
contains, see the [Keycloak realm
reference](/core-concepts/architecture/keycloak-realm/).

Set the realm name with `KEYCLOAK_REALM` to match the network you are deploying
(`bluedots`, `yellowdots`, `purpledots`, …). Commands below use `bluedots` as an
example.

## 1. Render and import the realm

The realm is imported from JSON, not clicked together in the admin console.
Signals keeps its template at `infra/keycloak/realms/bluedots-realm.json`; the
aggregator's is `infra/keycloak/realms/realm.json`.

```bash
# both happen automatically — render-realm.sh is the Keycloak container's
# entrypoint, so you only set the env vars it reads (PUBLIC_BASE_URL, ...)
docker compose up -d keycloak
```

:::caution[Don't run these on the host]
`render-realm.sh` is the container ENTRYPOINT, not a host script: it reads
`/opt/keycloak/data/import-template`, writes `/opt/keycloak/data/import`, and
ends by exec'ing `kc.sh`. Run from a shell it fails on the missing
`PUBLIC_BASE_URL` and then on the missing Keycloak paths. The same applies to
`init/apply-user-profile.sh`, which the `keycloak-init` sidecar runs for you.

**The realm JSON is read on first import only.** Changing `PUBLIC_BASE_URL`
later needs `docker compose down -v`, or an edit in the admin console.

**For the full ecosystem, import the aggregator's realm** — it is the superset
(8 clients including `aggregator-portal`, plus the `org_owner` role) where
signals' has 4. Bring up the signals-only stack first against a shared Keycloak
and the portal has no client to authenticate against.
:::

Then apply the declarative user-profile configuration, which the import does not
cover:

```bash
./infra/keycloak/init/apply-user-profile.sh
```

Because both verticals share the realm, import it **once**. A second import
against the same realm will not merge cleanly.

## 2. Set the two base URLs

Most setup failures come from confusing these:

| Variable | Points at | Must satisfy |
| --- | --- | --- |
| `KEYCLOAK_BASE_URL` | The browser-facing hostname | Equal to the `iss` claim **byte-for-byte** |
| `KEYCLOAK_INTERNAL_BASE_URL` | What the API process dials for JWKS and Admin REST | Reachable from inside the container network |

In Docker these differ: the browser needs a hostname it can resolve, while the
API talks to a compose service name. If the issuer and `KEYCLOAK_BASE_URL`
disagree by even a trailing slash, every token is rejected.

Locally the OIDC issuer hostname must resolve, so add it to your hosts file:

```bash
echo "127.0.0.1 keycloak" | sudo tee -a /etc/hosts
```

Alongside these, set `KEYCLOAK_REALM` (your network's realm name), the UI and API client ids
(`KEYCLOAK_UI_CLIENT_ID`, `KEYCLOAK_API_CLIENT_ID`,
`KEYCLOAK_API_CLIENT_SECRET`) and the acceptance lists described in [Identity &
Auth](/core-concepts/architecture/identity-and-auth/).

## 3. Create the first admin

There is no email-domain rule that quietly grants admin. Admin creation is an
explicit operator action:

```bash
# dry run — writes nothing
pnpm --filter api keycloak:create:admin --email=ops@example.org --name="Ops"

# actually create
pnpm --filter api keycloak:create:admin --email=ops@example.org --name="Ops" --apply
```

Use `--phone=+919876543210` instead of `--email` to drive the phone OTP channel.
Either an email or a phone is required, and **nothing is written without
`--apply`**.

## 4. Register an integrating DPG

To let an aggregator or voice DPG call Signals:

1. Create a **confidential** client in the realm whose **client id equals the
   organisation's `slug`** — this is the convention the service-account lookup
   relies on, not a configurable mapping.
2. Enable the client-credentials grant.
3. Add the client id to `KEYCLOAK_SERVICE_CLIENT_IDS` on the Signals API. It is
   **empty by default**, so a new DPG is refused until it is listed.
4. Give the client a `signals_acting_orgs` grant covering the organisations it
   may act as.

The DPG then exchanges its credentials for a token and calls Signals with that
token plus `x-acting-org-id`. See [Adaptor
Onboarding](/guides/adaptor-onboarding/).

## 5. Moving off localhost

For each **public** client (`signals-ui`, `aggregator-portal`) update:

- **Valid Redirect URIs**
- **Web Origins**

and replace `localhost` / `keycloak` hostnames throughout the environment
config. See [Deployment](/guides/deployment/).

## Migrating an existing instance

Applies to instances provisioned before the `GA-2026-08-18` release, and to any
instance still running the legacy path. Skip this for a fresh deployment.

**This is an operator-run cutover, not a self-serve upgrade.** There is no
in-app migration and no automatic fallback: nothing creates a missing Keycloak
identity on demand at login, so any user who is not in the realm at the moment
you switch is locked out.

Migrate every user **before** flipping the provider:

```bash
pnpm --filter api keycloak:migrate:users                 # dry run — writes nothing
pnpm --filter api keycloak:migrate:users --apply         # create the users
pnpm --filter api keycloak:migrate:users --reconcile     # verify every local user has a match by id
```

Run `--reconcile` until it reports a 1:1 mapping. Only then set
`AUTH_PROVIDER=keycloak` and restart. Create at least one admin first (step 3
above), since the legacy admin-by-email-domain rule has no Keycloak equivalent.

There is no mixed mode to stage the change through — an instance is on one
provider or the other, so the switch happens for all users at once. If something
goes wrong, the switch is reversible per instance: set `AUTH_PROVIDER` back and
restart. Users created while on Keycloak can still sign in afterwards, because
the legacy OTP login does not require a stored credential.

## Where to go next

<span class="bd-new" title="Added or rewritten by the flow &amp; narrative PR">new</span>

- [Keycloak Realm Reference](/core-concepts/architecture/keycloak-realm/) — what the imported realm contains.
- [Identity & Auth](/core-concepts/architecture/identity-and-auth/) — the token and acting-org model.
- [API Conventions](/guides/api-conventions/) — the errors a misconfigured client will see.

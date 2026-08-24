---
title: Keycloak Setup
description: Stand up your network's Keycloak realm — import, admin bootstrap, registering an integrating DPG, and the two base URLs.
sidebar:
  order: 6
---

Operator guide for a network's shared Keycloak realm. For what the realm
contains, see the [Keycloak realm
reference](/core-concepts/architecture/keycloak-realm/).

Set the realm name with `KEYCLOAK_REALM` to match the network you are deploying
(`bluedots`, `yellowdots`, `purpledots`, …). Commands below use `bluedots` as an
example.

## 1. Render and import the realm

The realm is imported from JSON, not clicked together in the admin console.
Signals keeps the template at `infra/keycloak/realms/bluedots-realm.json`:

```bash
# expand the template for this deployment
./infra/keycloak/render-realm.sh

# Keycloak imports the rendered file on first boot
docker compose up -d keycloak
```

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
pnpm keycloak:create:admin --email=ops@example.org --name="Ops"

# actually create
pnpm keycloak:create:admin --email=ops@example.org --name="Ops" --apply
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

## Existing instances

An instance that already has local user records needs those users present in the
realm before its users can sign in — nothing creates a missing Keycloak identity
on demand at login, so an unmigrated user is locked out.

```bash
pnpm keycloak:migrate:users                 # dry run
pnpm keycloak:migrate:users --apply         # create the users
pnpm keycloak:migrate:users --reconcile     # verify every local user has a match by id
```

Run `--reconcile` until it reports a 1:1 mapping. This does not apply to a fresh
deployment.

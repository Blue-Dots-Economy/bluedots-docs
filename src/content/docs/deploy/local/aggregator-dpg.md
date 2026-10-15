---
title: Aggregator DPG Setup
description: Run the Aggregator portal, API and worker locally with the Signals DPG beside it, and set which domain the portal onboards participants for.
sidebar:
  attrs:
    class: bd-changed
  order: 4
changed_sections:
  - _top
  - track-a--one-command-docker
  - choose-a-domain
  - adding-search-relevance-ranking
---

The Aggregator DPG is the downstream portal (**web**), **API** and **worker**. It
sits in front of the Signals DPG, so its local stack brings up **both DPGs** plus
the shared infra (Postgres, Redis, Keycloak, MinIO, Mailpit).

- **Repository:** [Blue-Dots-Economy/aggregator-dpg](https://github.com/Blue-Dots-Economy/aggregator-dpg)
- **Canonical local guide:** [`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/aggregator-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) — the self-contained `local-setup/` folder is the source of truth. It builds both repos, so it expects `aggregator-dpg` and `signals-dpg` checked out as **siblings**.

Pick a track: **A, Docker-only** (one command, whole ecosystem) or **B, hybrid
dev** (run the apps from source with hot-reload).

## Track A — one command (Docker)

Clone both repos side by side, then run everything from `aggregator-dpg/local-setup/`:

```bash
git clone https://github.com/Blue-Dots-Economy/aggregator-dpg.git
git clone https://github.com/Blue-Dots-Economy/signals-dpg.git   # sibling — required

cd aggregator-dpg/local-setup
docker login dhi.io                                   # app images build FROM dhi.io
cp .env.example .env                                  # set ADMIN_EMAILS
./gen-secrets.sh                                      # fills every CHANGE_ME_* value
echo "127.0.0.1 keycloak" | sudo tee -a /etc/hosts    # OIDC issuer must resolve
docker compose up -d --build
```

| Open this             | URL                                          |
| --------------------- | -------------------------------------------- |
| **Aggregator portal** | http://localhost:3100                        |
| **Signals UI**        | http://localhost:5173                        |
| **Mailpit inbox**     | http://localhost:8025 (catches all dev mail) |
| Signals Search        | http://localhost:3110 (only with `--profile search`) |
| MinIO console         | http://localhost:9001 (S3 API on `9000`)     |

:::caution[Two steps that are easy to miss]
**`docker login dhi.io`** — the api, web and worker images build `FROM
dhi.io/...` (Docker Hardened Images), which refuse anonymous pulls. Without it
`docker compose up -d --build` fails at the first `FROM` with `401
Unauthorized`. Any Docker Hub account works. Track B needs no login because it builds
no app images.

**`./gen-secrets.sh`** — `.env.example` ships seven `CHANGE_ME_*` placeholders.
They are *set*, so compose starts happily and the apps then crash-loop on their
own guards (`SESSION_KEY` and `APPROVAL_TOKEN_SECRET` are length-checked;
`SIGNALS_PII_KEY` must be base64). Run it right after the `cp`.
:::

Search is published on **`3110`** here, not `3100` — the Aggregator portal already
owns that port. Inside the compose network it still listens on `3100`, so
container-to-container URLs match the Signals-only stack.

Full URL list, cross-DPG wiring and troubleshooting are in the
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/aggregator-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) guide.

## Track A with search

Track A runs without signals-search: discover returns results in
recency/distance order and match scores are unavailable. To add relevance
ranking and match scores, start it with the search file instead — it includes
the base stack and adds search:

```bash
cd aggregator-dpg/local-setup
docker compose -f docker-compose.search.yml up -d --build
```

This adds the search API (http://localhost:3110), its ingestion worker and the
embedding server. Give Docker **≥ 10 GB** of memory — the embedder alone wants
3-4 GB.

Use the same `-f docker-compose.search.yml` for later commands (`ps`, `logs`,
`down`), or put `COMPOSE_FILE=docker-compose.search.yml` in `.env` so plain
`docker compose` includes search.

## After setup: try it

All email (approvals, invites, login codes) lands in **Mailpit** at
http://localhost:8025. Phone login codes print to `docker compose logs keycloak`.

### 1. Onboard an organisation and a coordinator

Org hierarchy is on locally, so an organisation registers first and then
invites its coordinators. See [How coordinators join](/about/key-concepts/aggregators/#how-coordinators-join).

1. Register the organisation at http://localhost:3100/register/owner.
2. In Mailpit, open the approval request and click **Approve**. The owner gets a
   mail with an invite link (`/register/invite?grant=…`).
3. Open that link and invite a coordinator by email.
4. In Mailpit, open the coordinator invite and register through it.
5. Approve the coordinator's registration in Mailpit.
6. Log in as the coordinator at http://localhost:3100/login.

### 2. Onboard participants (as the coordinator)

- **Bulk upload** — http://localhost:3100/onboarding/bulk-uploads: download the
  CSV template, fill in seekers or providers, upload it.
- **Registration links** — http://localhost:3100/onboarding/links: create a
  shareable link or QR code that participants fill in themselves.

Each participant gets a Signals account and a **draft** profile.

### 3. Use Signals (as a participant)

1. Open the Signals UI at http://localhost:5173 and log in with the participant's
   email or phone.
2. Accept the consent prompt — the profile can then go **live**. To add another
   profile, use **Create profile**.
3. Browse the home page (map and list) for the other side: jobs for a seeker,
   candidates for a provider. With search running, results are relevance-ranked;
   without it, they are in recency order with a _"Showing basic matches"_ note.
4. **Apply** or connect on a match. The other party sees it and can **Accept**;
   both sides follow it under **My Actions**.

## Track B — hybrid dev (hot-reload)

Run the backing services in Docker and the apps from source:

```bash
cd aggregator-dpg/local-setup && cp .env.example .env
./gen-secrets.sh                                        # fills every CHANGE_ME_*
echo "127.0.0.1 keycloak" | sudo tee -a /etc/hosts      # needed for Track B too
docker compose up -d postgres signals-redis aggregator-redis \
  keycloak keycloak-init mailpit minio minio-init      # infra only

cd ..                                                   # repo root
pnpm install && pnpm -w build                           # build workspace packages first
cp apps/api/.env.example apps/api/.env                  # + apps/web, apps/worker
pnpm --filter @aggregator-dpg/api db:migrate
pnpm --filter @aggregator-dpg/api dev                   # API  :4000
pnpm --filter @aggregator-dpg/web dev                   # portal :3000
```

The full guide lists the exact per-app `.env` values (Signals wiring, Keycloak
issuer, ports). Keycloak serves **both** DPGs from one realm, so it is shared
infrastructure here rather than an aggregator-only service — see [Keycloak
Setup](/deploy/configure/keycloak-setup/).

:::tip
Local mail (approval links + login OTP) is caught by **Mailpit** at
http://localhost:8025 — no real SMTP needed. Phone OTPs print to the Keycloak
container logs. Both portals log in through the same shared realm (`KEYCLOAK_REALM`).
:::

:::note
Commits run husky/lint-staged and require **Conventional Commits** — do not bypass
with `--no-verify`.
:::

Continue to [Configuration](/deploy/configure/configuration/) or the [Adaptor Onboarding](/deploy/steps/) walkthrough.

## Choose a domain

The portal onboards participants for one domain. `AGGREGATOR_NETWORK` in
`local-setup/.env` picks it (default `blue_dot`, the jobs domain; the code calls
a domain a *network*). The value is a folder name under the Aggregator repo's
`config/`, which holds that
domain's `aggregator.config.yaml`, `brand.json`, `keycloak.env` (login-screen
text) and `schemas/`. The same folder name is sent to Signals as the domain of
every item the portal creates.

| Folder | Domain | Ready to run |
| --- | --- | --- |
| `config/blue_dot/` | Blue Dot (jobs) | Yes (default) |
| `config/purple_dot/` | Purple Dot (disability) | Yes |
| `config/orange_dot/` | Orange Dot (tourism) | Yes |
| `config/yellow_dot/` | Yellow Dot (education) | No: it has `schemas/` only, no `aggregator.config.yaml` or `keycloak.env` |

:::caution[The Signals side of this stack stays on blue_dot]
`AGGREGATOR_NETWORK` changes only the Aggregator services. The Signals services
in this compose file are fixed to `blue_dot`: the API and search load
`examples/schemas/blue_dot/network.json`, the UI is built for `blue_dot`, and
`SIGNALS_SERVED_DOMAINS` defaults to the `blue_dot` participant types. To run another
domain end to end, change those lines in `local-setup/docker-compose.yml` and
`SIGNALS_SERVED_DOMAINS` in `.env` to match, as described in
[Signals DPG Setup](/deploy/local/signals-dpg/#choose-a-domain).
:::

## Adding search (relevance ranking)

The unified stack runs the Signals tier too, so without search its discover
results come back in recency order and match scores are unavailable. To add it:

```bash
cd aggregator-dpg/local-setup
cp .env.search.example .env.search     # then mint an apikey — see §10.3 of the guide
docker compose --profile search up -d
```

Unlike the two DPGs, which this stack builds from source, signals-search is
pulled **prebuilt from public GHCR** — no third checkout and no registry login.

:::caution[Budget ≥10 GB of Docker memory]
This stack is already around a dozen containers, and its guide asks for ≥6 GB
before search. The embedding server loads a ~2.3 GB model and wants 3-4 GB more.
:::

Details specific to this stack (the `3110` port, targeting the `signals`
database rather than `aggregator`, and using the `signals-redis` instance) are in
**§10** of the
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/aggregator-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md)
guide. The canonical reference for signals-search's own configuration is **§7 of
[signals-dpg's guide](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md)**.

## Where to go next

- [Keycloak Setup](/deploy/configure/keycloak-setup/) — register the service client this app authenticates with.
- [Configuration](/deploy/configure/configuration/) — env vars and schema-driven forms.
- [Aggregators](/about/key-concepts/aggregators/) — what the app is for.

---
title: Signals DPG Setup
description: Run the Signals backend and UI locally, standalone, in one command.
sidebar:
  order: 3
prev:
  link: /guides/installation/local-stack/
  label: "Path 7 of 9: Local Stack"
next:
  link: /guides/api-reference/
  label: "Path 9 of 9: API Reference"
---

The Signals DPG is the network-aware backend (API + UI). It runs **standalone** —
no other DPG required. Its `local-setup/` brings up everything it depends on:
**Postgres, Redis, Keycloak and Mailpit** — plus, optionally,
**signals-search** for relevance ranking.

- **Repository:** [Blue-Dots-Economy/signals-dpg](https://github.com/Blue-Dots-Economy/signals-dpg)
- **Canonical local guide:** [`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) — the self-contained `local-setup/` folder is the source of truth for running locally.

Pick a track: **A — Docker-only** (fastest, one command) or **B — hybrid dev**
(run the API/UI from source with hot-reload).

## Track A — one command (Docker)

```bash
git clone https://github.com/Blue-Dots-Economy/signals-dpg.git
cd signals-dpg/local-setup
docker login dhi.io             # app images build FROM dhi.io
cp .env.example .env            # ships working dev values for both secrets
# Rotate them in place (macOS/BSD sed; on Linux drop the '' after -i).
sed -i '' "s|^INSTANCE_SHARED_SECRET=.*|INSTANCE_SHARED_SECRET=$(openssl rand -hex 32)|" .env
sed -i '' "s|^SIGNALS_PII_KEY=.*|SIGNALS_PII_KEY=$(openssl rand -base64 32)|" .env
docker compose --profile keycloak up -d --build
```

This builds a Postgres image with **pgvector + PostGIS** (the extensions
`db:init` needs), applies the schema, starts Keycloak and imports the realm, then
starts the API and UI.

The `--profile keycloak` flag is required: Keycloak, Mailpit and the realm-import
job are profiled services, so a plain `docker compose up -d` skips them and login
will not work.

There is a second profile, **`search`**, which adds relevance-ranked discover and
match scores. Without it the stack works but returns results in recency order —
see [Adding search](#adding-search-relevance-ranking) below. Profiles combine:

```bash
docker compose --profile keycloak --profile search up -d --build
```

| Open this      | URL                                                  |
| -------------- | ---------------------------------------------------- |
| **Signals UI** | http://localhost:5173 (must be `:5173` — CORS)       |
| Signals API    | http://localhost:2742 (`/api/reference` = Swagger)   |
| Keycloak       | http://localhost:8080 (login screen + admin console) |
| Mailpit        | http://localhost:8025 (catches login OTP emails)     |
| Signals Search | http://localhost:3100 (only with `--profile search`) |

## Track B — hybrid dev (hot-reload)

Run the backing services from `local-setup/`, then the API + UI from source:

```bash
cd signals-dpg/local-setup && cp .env.example .env   # secrets already set, see Track A
docker compose --profile keycloak up -d \
  postgres redis keycloak keycloak-init mailpit   # backing services only

cd ..                                     # repo root
pnpm install
cp .env.example .env                      # point at the Docker DB/Redis (see the guide)
# Root .env is a separate file from local-setup/.env — rotate its secrets too:
#   INSTANCE_SHARED_SECRET=<openssl rand -hex 32>   # min 32 chars
#   SIGNALS_PII_KEY=<openssl rand -base64 32>       # must decode to exactly 32 bytes
sed -i '' "s|^INSTANCE_SHARED_SECRET=.*|INSTANCE_SHARED_SECRET=$(openssl rand -hex 32)|" .env
sed -i '' "s|^SIGNALS_PII_KEY=.*|SIGNALS_PII_KEY=$(openssl rand -base64 32)|" .env
pnpm db:push:api && pnpm db:init:api      # schema + extensions/tables
pnpm dev:api                              # API on :2742  (terminal 1)
pnpm dev:ui                               # UI  on :5173  (terminal 2)
```

Full env values, resets, and troubleshooting are in the
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) guide.

:::tip
Login goes through **Keycloak**, which sends a one-time code. Email codes land in
**Mailpit**; phone codes print to the Keycloak container logs — no real provider
needed. Set `AUTH_PROVIDER=keycloak` and the `KEYCLOAK_*` values in `.env` — see
[Keycloak Setup](/guides/keycloak-setup/).
:::

Because the model is [schema-driven](/core-concepts/technical/schema-driven-model/),
you add item types and forms through `network.json` schemas rather than code.

Next: set up the [Aggregator DPG](/guides/installation/aggregator-dpg/), or wire an integration via the [API Reference](/guides/api-reference/).

## Adding search (relevance ranking)

Out of the box, discover returns results in **recency order** and match scores
are unavailable — the UI shows _"Showing basic matches — relevance ranking is
temporarily unavailable"_. Adding the `search` profile fixes both:

```bash
cd signals-dpg/local-setup
cp .env.search.example .env.search    # then mint an apikey (below)
docker compose --profile keycloak --profile search up -d
```

This adds the search query API on `:3100`, an ingestion worker, and a TEI
embedding server running `BAAI/bge-m3` — the same model production uses, baked
into the image so nothing downloads it at runtime. All images are pulled from
public GHCR; no extra checkout, no registry login.

:::caution[Memory]
The embedding server loads a ~2.3 GB model and wants 3-4 GB to itself. That is
why search is opt-in rather than part of the default bring-up.
:::

:::note[Apple Silicon / arm64]
The search images are amd64-only, so they run emulated on arm64 — the compose
pins the platform for you. Expect a slower first query; there is no native arm64
embedder available upstream.
:::

Two required steps that are easy to miss:

1. **Mint an apikey.** Search authenticates against the `apikey` table in the
   shared Signals database — there is no API-key environment variable. Run
   `docker compose run --rm signals-bootstrap sh -lc "pnpm --filter api db:seed:services"`,
   which prints an `sk_signals_…` key **on first run only**, and put the raw
   value in `.env.search`.
2. **Set both variable sets.** Relevance-ranked discover reads
   `SIGNALS_SEARCH_URL`; match score reads `SIGNALS_SEARCH_ENDPOINT` — the same
   URL under a different name — plus `MATCH_SCORE_PROVIDER=signals_search`.
   Setting only one leaves the other silently broken.

`/health` on the search API is unauthenticated and checks neither the database
nor the embedder, so a `200` from it does not mean the stack can answer a query.
Test with a real `POST /v1/search` carrying `x-api-key`.

Full reference — the embedding-dimension rules, `network.json` requirements and a
troubleshooting table keyed by the exact error message — is **§7 of
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md)**.

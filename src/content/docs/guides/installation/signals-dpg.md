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
it needs only its own Postgres + Redis, no other DPG.

- **Repository:** [Blue-Dots-Economy/signals-dpg](https://github.com/Blue-Dots-Economy/signals-dpg)
- **Canonical local guide:** [`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) — the self-contained `local-setup/` folder is the source of truth for running locally.

Pick a track: **A — Docker-only** (fastest, one command) or **B — hybrid dev**
(run the API/UI from source with hot-reload).

## Track A — one command (Docker)

```bash
git clone https://github.com/Blue-Dots-Economy/signals-dpg.git
cd signals-dpg/local-setup
cp .env.example .env            # set SIGNALS_PII_KEY (openssl rand -base64 32)
docker compose up -d --build
```

This builds a Postgres image with **pgvector + PostGIS** (the extensions
`db:init` needs), applies the schema, then starts the API and UI.

| Open this      | URL                                            |
| -------------- | ---------------------------------------------- |
| **Signals UI** | http://localhost:5173 (must be `:5173` — CORS) |
| Signals API    | http://localhost:2742 (`/reference` = Swagger) |

## Track B — hybrid dev (hot-reload)

Run Postgres + Redis from `local-setup/`, then the API + UI from source:

```bash
cd signals-dpg/local-setup && cp .env.example .env
docker compose up -d postgres redis      # backing services only

cd ..                                     # repo root
pnpm install
cp .env.example .env                      # point at the Docker DB/Redis (see the guide)
pnpm db:push:api && pnpm db:init:api      # schema + extensions/tables
pnpm dev:api                              # API on :2742  (terminal 1)
pnpm dev:ui                               # UI  on :5173  (terminal 2)
```

Full env values, resets, and troubleshooting are in the
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/signals-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) guide.

:::tip
Login uses a **test OTP** in dev (`CREATE_TEST_OTP=true`) — the code is printed
to the API logs, so no SMS/email provider is needed. `AUTH_MIDDLEWARE_ENABLED=false`
disables auth entirely for seed/migration scripts.
:::

Because the model is [schema-driven](/core-concepts/technical/schema-driven-model/),
you add item types and forms through `network.json` schemas rather than code.

Next: set up the [Aggregator DPG](/guides/installation/aggregator-dpg/), or wire an integration via the [API Reference](/guides/api-reference/).

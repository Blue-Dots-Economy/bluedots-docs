---
title: Aggregator DPG Setup
description: Run the Aggregator portal, API and worker — plus the whole ecosystem — locally.
sidebar:
  order: 4
---

The Aggregator DPG is the downstream portal (**web**), **API** and **worker**. It
sits in front of the Signals DPG, so its local stack brings up **both DPGs** plus
the shared infra (Postgres, Redis, Keycloak, MinIO, Mailpit).

- **Repository:** [Blue-Dots-Economy/aggregator-dpg](https://github.com/Blue-Dots-Economy/aggregator-dpg)
- **Canonical local guide:** [`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/aggregator-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) — the self-contained `local-setup/` folder is the source of truth. It builds both repos, so it expects `aggregator-dpg` and `signals-dpg` checked out as **siblings**.

Pick a track: **A — Docker-only** (one command, whole ecosystem) or **B — hybrid
dev** (run the apps from source with hot-reload).

## Track A — one command (Docker)

Clone both repos side by side, then run everything from `aggregator-dpg/local-setup/`:

```bash
git clone https://github.com/Blue-Dots-Economy/aggregator-dpg.git
git clone https://github.com/Blue-Dots-Economy/signals-dpg.git   # sibling — required

cd aggregator-dpg/local-setup
cp .env.example .env                                  # set ADMIN_EMAILS
echo "127.0.0.1 keycloak" | sudo tee -a /etc/hosts    # OIDC issuer must resolve
docker compose up -d --build
```

| Open this             | URL                                          |
| --------------------- | -------------------------------------------- |
| **Aggregator portal** | http://localhost:3100                        |
| **Signals UI**        | http://localhost:5173                        |
| **Mailpit inbox**     | http://localhost:8025 (catches all dev mail) |

Full URL list, cross-DPG wiring and troubleshooting are in the
[`local-setup/LOCAL_SETUP.md`](https://github.com/Blue-Dots-Economy/aggregator-dpg/blob/HEAD/local-setup/LOCAL_SETUP.md) guide.

## Track B — hybrid dev (hot-reload)

Run the backing services in Docker and the apps from source:

```bash
cd aggregator-dpg/local-setup && cp .env.example .env
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
issuer, ports).

:::tip
Local mail (approval links + login OTP) is caught by **Mailpit** at
http://localhost:8025 — no real SMTP needed. Phone OTPs print to the Keycloak logs.
:::

:::note
Commits run husky/lint-staged and require **Conventional Commits** — do not bypass
with `--no-verify`.
:::

Continue to [Configuration](/guides/configuration/) or the [Adaptor Onboarding](/guides/adaptor-onboarding/) walkthrough.

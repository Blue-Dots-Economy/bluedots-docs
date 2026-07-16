---
title: Local Stack (Docker)
description: Choose your local setup — Signals alone, or the full Aggregator + Signals ecosystem.
sidebar:
  order: 2
next:
  link: /guides/installation/signals-dpg/
  label: "Path 8 of 9: Signals DPG Setup"
---

Each repo ships a self-contained **`local-setup/`** folder — a `docker-compose.yml`,
a `.env.example`, and a `LOCAL_SETUP.md` guide — that brings up the DPG **and its
backing services** (Postgres, Redis, and, for the Aggregator, Keycloak / MinIO /
Mailpit). You don't wire the infra by hand; you copy an env file and run one command.

Both offer the same two tracks:

- **Track A — Docker-only:** one `docker compose up -d --build`. Fastest way to explore.
- **Track B — hybrid dev:** backing services in Docker, apps from source with hot-reload.

## Which setup do I want?

| I want to…                                    | Use                                                                 | Guide                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Run **Signals only** (backend + UI)           | `signals-dpg/local-setup/`                                          | [Signals DPG Setup](/guides/installation/signals-dpg/)      |
| Run the **full ecosystem** (Aggregator + Signals) | `aggregator-dpg/local-setup/`                                   | [Aggregator DPG Setup](/guides/installation/aggregator-dpg/) |

The Aggregator's `local-setup/` builds **both** repos, so clone them as
**siblings** under one parent directory:

```
<parent>/
  ├── aggregator-dpg/        # full-ecosystem stack lives in aggregator-dpg/local-setup/
  │     └── local-setup/
  └── signals-dpg/           # standalone stack lives in signals-dpg/local-setup/
        └── local-setup/
```

## Ports at a glance

| Service            | Port   | In which stack        |
| ------------------ | ------ | --------------------- |
| Aggregator portal  | `3100` | Aggregator (full)     |
| Signals UI         | `5173` | both                  |
| Aggregator API     | `4000` | Aggregator (full)     |
| Signals API        | `2742` | both                  |
| Keycloak           | `8080` | Aggregator (full)     |
| Mailpit (email UI) | `8025` | Aggregator (full)     |
| Postgres           | `5432` | both                  |
| Redis              | `5555` / `6379` | Signals / Aggregator |

:::tip
Short on memory? Prefer **Track B** — Docker then runs only the small backing
containers (no app-image builds) and the Node apps run on the host.
:::

Next: set up each DPG — [Signals](/guides/installation/signals-dpg/) or the [Aggregator](/guides/installation/aggregator-dpg/).

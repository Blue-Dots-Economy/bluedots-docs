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
backing services** (Postgres, Redis, Keycloak, and, for the Aggregator, MinIO /
Mailpit). You don't wire the infra by hand; you copy an env file and run one command.

Keycloak is shared: both DPGs authenticate against the same realm — one per
network, named by `KEYCLOAK_REALM` (`bluedots` by default locally) — so it must be
running and the realm imported before either UI will let you sign in.

Both offer the same two tracks:

- **Track A — Docker-only:** one `docker compose up -d --build`. Fastest way to explore.
- **Track B — hybrid dev:** backing services in Docker, apps from source with hot-reload.

Both also offer an opt-in **`search` profile** that adds relevance ranking — see
[Search and relevance ranking](#search-and-relevance-ranking-opt-in) below.

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
| Keycloak           | `8080` | both                  |
| Mailpit (email UI) | `8025` | Aggregator (full)     |
| Postgres           | `5432` | both                  |
| Redis              | `5555` / `6379` | Signals / Aggregator |
| Signals Search API | `3100` (Signals) / `3110` (Aggregator) | both, only with `--profile search` |

The Search API's host port differs between the two stacks: in the Aggregator's
unified stack the portal already occupies `3100`, so search is published on
`3110` instead. Inside either compose network the service still listens on
`3100`, so container-to-container URLs are identical.

:::tip
Short on memory? Prefer **Track B** — Docker then runs only the small backing
containers (no app-image builds) and the Node apps run on the host.
:::

## Search and relevance ranking (opt-in)

By default neither stack runs **signals-search**. Everything works, but discover
returns results in **recency order** rather than by relevance, and match scores
are unavailable. The UI says so explicitly when it happens — _"Showing basic
matches — relevance ranking is temporarily unavailable"_.

To add it:

```bash
# from whichever local-setup/ you are using
cp .env.search.example .env.search     # then mint an apikey — see the repo guide
docker compose --profile search up -d
```

That brings up three more services: the search query API, an ingestion worker
that keeps the search index current, and a **TEI embedding server** with
`BAAI/bge-m3` baked in. All are pulled prebuilt from public GHCR, so there is no
extra checkout and no registry login.

:::note[Apple Silicon / arm64]
These images are published for **amd64 only**, so on an arm64 machine they run
under emulation — the compose files pin `platform: linux/amd64` for you, without
which the pull fails with `no matching manifest for linux/arm64/v8`. It works,
just slower: the embedder needs roughly half a minute to warm up before it can
serve. There is no native arm64 embedding image upstream to switch to.
:::

:::caution[It is opt-in for a reason]
The embedding server loads a ~2.3 GB model and wants **3-4 GB of memory to
itself**. On the Signals-only stack, budget ~4 GB on top of the base; on the
Aggregator's unified stack — already around a dozen containers — budget **≥10 GB
of Docker memory** in total. That is why it is not part of the default
`docker compose up -d`.
:::

Two things catch people out, and both are documented in full in the repo guides:

- **Search authenticates against the `apikey` table in the shared Signals
  database.** There is no API-key environment variable to set — the key has to be
  a real, enabled row, minted with the service-apikey seed step.
- **Wiring Signals to search takes two separate variable sets.** Relevance-ranked
  discover reads `SIGNALS_SEARCH_URL`; match score reads
  `SIGNALS_SEARCH_ENDPOINT` — the **same URL under a different name** — plus
  `MATCH_SCORE_PROVIDER=signals_search`. Setting only one gives you working
  discover and a broken match score, or the reverse.

Full reference, including the embedding-dimension rules and a troubleshooting
table keyed by the exact error message: **§7 of
`signals-dpg/local-setup/LOCAL_SETUP.md`** (canonical), and §10 of the
Aggregator's guide for what differs in the unified stack.

Next: set up each DPG — [Signals](/guides/installation/signals-dpg/) or the [Aggregator](/guides/installation/aggregator-dpg/).

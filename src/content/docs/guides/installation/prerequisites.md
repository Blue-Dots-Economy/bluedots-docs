---
title: Prerequisites
description: Tools, runtimes and accounts required to run the Blue Dots DPGs locally.
sidebar:
  order: 1
---

Install these before setting up either DPG.

## Toolchain

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | **≥ 24** | CI pins Node 24. Node 22 works locally for the Aggregator. Use a version manager (nvm/fnm/volta). |
| pnpm | **≥ 10** (Signals pins 11.x) | `corepack enable pnpm` or `npm i -g pnpm`. Other package managers are not supported. |
| Docker + Compose | latest | Brings up Postgres, Redis, Keycloak and Mailpit. Keycloak is required by **both** DPGs. |
| Git | latest | — |
| Make | latest | The Aggregator uses a `Makefile` for one-shot setup. |

## Cloud / external dependencies

None of these run in the local Docker stack. Most have a free or key-less fallback, so a first local run needs almost nothing — the **Local dev** column says what you can skip.

| Dependency | What it's for | Local dev |
| --- | --- | --- |
| **AWS S3** (or S3-compatible) | Bulk-upload objects. The API and worker hit a real bucket via an IAM role or `~/.aws/credentials`. | Required before running bulk-upload flows |
| **SMS provider** (MSG91) | OTP and SMS notifications. Supplies `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`. | Optional — `CREATE_TEST_OTP=true` issues a test OTP |
| **SMTP** | Transactional email — OTP, approvals, admin alerts. Gmail needs a 16-character **App Password**, not the account password. | Optional — Mailpit catches mail locally |
| **Google Maps API key** (browser) | Rendering Google Maps in the Signals UI. Required only when `VITE_MAP_PROVIDER=google-maps`. Set as `VITE_GOOGLE_MAPS_API_KEY`. | Optional — the default provider is Leaflet |
| **Google Geocoding API key** (server) | Server-side geocoding of items created via the API without coordinates. Set as `GOOGLE_GEOCODING_API_KEY`. | Optional — falls back to Photon |
| **Mapbox access token** | Alternative map provider. Required only when `VITE_MAP_PROVIDER=mapbox`. | Optional |
| **Photon** (OpenStreetMap) | Free, key-less geocoding and address autocomplete — the fallback for both Google keys. Override the endpoint with `PHOTON_URL` / `VITE_PHOTON_URL`. | Used automatically, no account |
| **Hosted embedding API** (Gemini, OpenAI, Voyage) | Optional backend for Signals-Search relevance ranking. | Optional — the default is in-cluster HuggingFace TEI with the OSS BGE-M3 model, no external key |
| **Credential-import providers** (Dhiway Wallet, DigiLocker agent) | Pre-filling a profile form from a verifiable credential. `VITE_VC_WALLET_URL` / `VITE_VC_WALLET_API_KEY`, `VITE_AGENT_URL` / `VITE_AGENT_TOKEN`. | Optional — the providers are hidden when unset |
| **Discord webhooks** | Alert routing from the monitoring stack (critical / warning / info channels). | Not used locally |

### The two Google keys are deliberately separate

A Google API key accepts only **one** application restriction — HTTP referrers *or* IP addresses, never both. The browser key and the server key therefore have to be different keys to be restrictable at all:

| Key | API to enable | Application restriction |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` (browser) | Maps JavaScript API | **HTTP referrers** — `https://<each signals host>/*` |
| `GOOGLE_GEOCODING_API_KEY` (server) | Geocoding API | **IP addresses** — the environment's NAT gateway Elastic IPs, **both** AZs |

:::caution
The server key must **not** be HTTP-referrer restricted — server-side calls send no referrer, so a referrer-restricted key fails every request. If you are not restricting keys at all, both values can be the same key.
:::

Server geocoding results are cached in Redis (`GEO_CACHE_TTL_SECONDS`, default 30 days) so a repeated place string does not re-bill the paid API.

## Verify your setup

```bash
node --version     # v24.x (or v22.x locally for Aggregator)
pnpm --version     # 10.x or 11.x
docker --version
docker compose version
```

## Enable pnpm via corepack

```bash
corepack enable pnpm
```

Once these are in place, continue to [Local Stack (Docker)](/guides/installation/local-stack/).

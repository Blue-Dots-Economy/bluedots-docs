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

- **Object storage** — **already in the local stack**: MinIO runs as part of
  `local-setup` (S3 API on `9000`, console on `9001`) and its bucket is created
  automatically, so bulk-upload flows work locally with no AWS account. A real
  **AWS S3** bucket, reached via an IAM role or `~/.aws/credentials`, is a
  deploy-time concern only.
- **A Docker Hub account** — the app images build from Docker Hardened Images,
  so Track A needs `docker login dhi.io`. Track B does not.
- **openssl** — used by `gen-secrets.sh` to generate local secrets. Pre-installed
  on macOS and most Linux distributions.
- **SMS provider** — required for OTP and notifications in non-trivial deployments. A no-op/sandbox provider is fine for local development.

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

Once these are in place, continue to [Local Stack (Docker)](/guides/installation/local-setup/local-stack/).

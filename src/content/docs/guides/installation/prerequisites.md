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
| Docker + Compose | latest | Brings up Postgres, Redis, Keycloak and Mailpit. |
| Git | latest | — |
| Make | latest | The Aggregator uses a `Makefile` for one-shot setup. |

## Cloud / external dependencies

- **AWS S3** (or an S3-compatible store) — **not** part of the local Docker stack. The API and worker hit a real bucket via an IAM role or `~/.aws/credentials`. Provision a bucket and credentials before running bulk-upload flows.
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

Once these are in place, continue to [Local Stack (Docker)](/guides/installation/local-stack/).

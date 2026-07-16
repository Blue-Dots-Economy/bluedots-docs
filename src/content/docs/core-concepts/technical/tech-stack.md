---
title: Tech Stack
description: Runtimes, frameworks, datastores and tooling across the Signals and Aggregator DPGs.
sidebar:
  order: 4
---

Both DPGs are TypeScript-first **pnpm + Turborepo** monorepos that share a common technology base.

## At a glance

| Concern | Signals DPG | Aggregator DPG |
| --- | --- | --- |
| API framework | Fastify + Zod (`fastify-type-provider-zod`) | Fastify (BFF) |
| Web UI | React 19 + Vite (schema-driven) | Next.js 15 (App Router) + BFF |
| Background jobs | — | BullMQ worker |
| ORM / DB | Drizzle + PostgreSQL (partitioned items) | Drizzle + PostgreSQL |
| Cache / sessions / queue | Redis | Redis |
| Object storage | S3 | S3 |
| Auth | Better-Auth + API keys | Keycloak (OIDC) |
| Notifications | SMTP, SMS | SMTP (Mailpit local), SMS |

## Runtime & package management

- **Node ≥ 24** (CI pins Node 24; Node 22 works locally for the Aggregator).
- **pnpm** is required (Signals pins `pnpm@11.x`; Aggregator requires pnpm ≥ 10). Other package managers are not supported.
- **Turbo** orchestrates `build`, `test`, `lint`, `typecheck`, `dev` topologically.
- **Docker + Compose** brings up Postgres, Redis, and (Aggregator) Keycloak + Mailpit. S3 is a real cloud dependency, not containerised.

## Testing & quality

- **Vitest** for all tests. Integration tests are named `*.integration.test.ts` and excluded from the default unit run.
- Cross-package tests import the in-memory **fake** from a package's `./testing` export — never mock the interface directly.
- Target **≥ 70% line coverage**.
- **ESLint + Prettier** via husky/lint-staged on staged files. **Conventional Commits** are required; do not bypass hooks with `--no-verify`.
- **dependency-cruiser** enforces interface-boundary rules in the Aggregator at CI time.

## Observability

A shared logger (pino-backed) is used everywhere. Every log entry carries `operation`, a `status` of `success`/`failure`/`skipped`, `latency_ms` for external calls, and `error`/`error_type` on failure. Log level comes from `LOG_LEVEL`.

## Infrastructure & deployment

The cloud deployment is its own codebase (`bluedots-automation`) with a distinct toolchain:

| Concern | Tooling |
| --- | --- |
| Cloud provisioning | **OpenTofu** + **Terragrunt** (AWS EKS, VPC, IAM/IRSA, S3, storage) |
| Application deploy | **Helm** umbrella charts, driven by `install.sh` (no Makefile) |
| Ingress | **Kong** ingress controller (DB-less), `KongClusterPlugin` rate-limit tiers |
| TLS | **cert-manager** + Let's Encrypt (`letsencrypt-prod` ClusterIssuer) |
| Image registry | **GHCR** (`ghcr.io/blue-dots-economy/…`), `sha-<short>` tags |
| Shared datastores | PostgreSQL + Redis (deployed by `common-services`) |
| Observability | Prometheus, Alertmanager, Loki, Alloy, Grafana (monitoring chart) |

See [Infrastructure & Deployment Architecture](/core-concepts/architecture/infrastructure/) and the [CI/CD & Build Pipeline](/guides/cicd-and-builds/) guide.

## Documentation site

This documentation site itself is built with **Astro + Starlight** and deployed to **GitHub Pages** — see the [Guides](/guides/) and the repository `README` for how to run and deploy it.

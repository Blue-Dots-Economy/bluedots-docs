---
title: Guides
description: Practical guides to install, onboard, configure, integrate and deploy the Blue Dots DPGs.
sidebar:
  order: 0
---

These guides take you from a clean machine to a running, integrated Blue Dots deployment.

## Installation

Stand up the stack locally, then each DPG:

- [Prerequisites](/guides/installation/prerequisites/) — tools and accounts you need.
- [Local Stack (Docker)](/guides/installation/local-stack/) — Postgres, Redis, Keycloak, Mailpit.
- [Signals DPG Setup](/guides/installation/signals-dpg/) — the network-aware backend + UI.
- [Aggregator DPG Setup](/guides/installation/aggregator-dpg/) — the onboarding app (API, web, worker).

## Build & integrate

- [Adaptor Onboarding](/guides/adaptor-onboarding/) — the end-to-end path for a new adaptor.
- [Configuration](/guides/configuration/) — env vars, config-as-code, per-environment overrides.
- [API Reference](/guides/api-reference/) — the Signals and Aggregator endpoints.
- [CI/CD & Build Pipeline](/guides/cicd-and-builds/) — how images are built, pinned and delivered across environments.
- [Deployment](/guides/deployment/) — provision AWS infra and deploy the stack with OpenTofu/Terragrunt + Helm.

:::tip[New adaptor?]
Start with [Adaptor Onboarding](/guides/adaptor-onboarding/) for the big picture, then drop into the installation guides for the step-by-step.
:::

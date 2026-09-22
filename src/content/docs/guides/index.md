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

## Activate a district

- [Activating Blue Dots in a District](/guides/district-activation/) — the institutional and operational model.
- [Adaptor Onboarding](/guides/adaptor-onboarding/) — the end-to-end path for a new adaptor.

## Configure & extend

- [Keycloak Setup](/guides/keycloak-setup/) — realm import, admin user, registering an integrating DPG.
- [Configuration](/guides/configuration/) — env vars, config-as-code, per-environment overrides.
- [Customisation & Branding](/guides/customisation/) — branding, dashboards and a landing page, without forking the DPGs.
- [AI Voice Agent Prompts](/guides/voice-ai-prompts/) — the published prompt DPGs and how a voice channel connects.
- [API Conventions](/guides/api-conventions/) — auth headers, error codes and response conventions shared by both APIs.

## Build & deploy

- [CI/CD & Build Pipeline](/guides/cicd-and-builds/) — how images are built, pinned and delivered across environments.
- [Deployment](/guides/deployment/) — provision AWS infra and deploy the stack with OpenTofu/Terragrunt + Helm.

:::tip[New adaptor?]
Start with [Adaptor Onboarding](/guides/adaptor-onboarding/) for the big picture, then drop into the installation guides for the step-by-step.
:::

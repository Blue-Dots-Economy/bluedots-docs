---
title: Guides
description: Practical guides to install, onboard, configure, integrate and deploy the Blue Dots DPGs.
sidebar:
  order: 0
---

These guides take you from a clean machine to a running, integrated Blue Dots deployment.

## Installation

Two separate tracks :

- **Local Setup** — run a DPG on your own machine: [Prerequisites](/guides/installation/local-setup/prerequisites/), [Local Stack (Docker)](/guides/installation/local-setup/local-stack/), [Signals DPG Setup](/guides/installation/local-setup/signals-dpg/), [Aggregator DPG Setup](/guides/installation/local-setup/aggregator-dpg/).
- **Cloud Setup** — deploy a real instance: [AWS Infrastructure Setup](/guides/installation/cloud-setup/aws/infrastructure/), [AWS Deployment](/guides/installation/cloud-setup/aws/deployment/).

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

:::tip[New adaptor?]
Start with [Adaptor Onboarding](/guides/adaptor-onboarding/) for the big picture, then drop into the installation guides for the step-by-step.
:::

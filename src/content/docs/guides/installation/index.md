---
title: Installation
description: Two separate tracks — run a DPG locally for development, or deploy the full stack to AWS.
sidebar:
  order: 0
---

Installation splits into two tracks that should not be confused: running a DPG on your own machine for development, and deploying the whole stack to the cloud for real use.

## Local Setup

Run Signals or the Aggregator on your own machine with Docker Compose — Postgres, Redis, Keycloak and Mailpit included, no cloud account needed.

- [Prerequisites](/guides/installation/local-setup/prerequisites/) — tools and accounts you need.
- [Local Stack (Docker)](/guides/installation/local-setup/local-stack/) — bring up the backing services.
- [Signals DPG Setup](/guides/installation/local-setup/signals-dpg/) — the network-aware backend + UI.
- [Aggregator DPG Setup](/guides/installation/local-setup/aggregator-dpg/) — the onboarding app (API, web, worker).

## Cloud Setup

Stand up a real, running instance for a district, network or adaptor. Currently AWS; the stack is adaptable to other clouds.

- [AWS Infrastructure Setup](/guides/installation/cloud-setup/aws/infrastructure/) — provision the EKS cluster, database and storage.
- [AWS Deployment](/guides/installation/cloud-setup/aws/deployment/) — install the application charts onto it.

:::tip[New adaptor?]
Start with [Adaptor Onboarding](/guides/adaptor-onboarding/) for the big picture, then come back here for the step-by-step.
:::

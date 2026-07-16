---
title: Aggregators
description: What aggregators do, and how the Aggregator DPG brings participants and their signals onto the network.
sidebar:
  order: 2
---

An **aggregator** is an organisation that onboards participants and brings their signals onto the network at scale — a training institute, employer, NGO, or government department. The **Aggregator DPG** is the application they use.

## Why aggregators matter

Signal volume is the fuel for local discovery. Asking every citizen to self-onboard is slow; aggregators already hold relationships with hundreds or thousands of participants. By letting an aggregator register and bulk-load its participants, the network reaches useful signal density quickly — which is exactly what the Ghaziabad and Dharwad pilots demonstrated.

## What the Aggregator DPG does

The Aggregator DPG is aggregator-facing and provides:

- **Registration & approval** — an organisation registers, is reviewed, and is approved onto the network.
- **Profile management** — schema-driven forms (RJSF) let non-engineers evolve registration and profile fields without code changes.
- **Bulk upload** — CSV/file-based creation of many participant signals at once, processed asynchronously by a background worker.
- **Registration links & metrics** — shareable links for self-registration, with roll-up metrics.

## The trust boundary

The Aggregator DPG reads from the upstream Signals stack and, in the MVP, has **no write access to Signals except through the controlled bulk-create paths**. Every request is scoped to a verified `aggregator_id`, which is **never trusted from the client** — it is asserted from the authenticated session. This keeps one aggregator from ever reading or writing another's data.

Integrating DPGs (such as the Aggregator app, or a voice DPG) authenticate to Signals with a **two-header service-auth model** (`x-api-key` plus an acting-org header). See [Identity & Auth](/core-concepts/architecture/identity-and-auth/) for the full model.

## Relationship to Signals

<!-- Editable source: src/assets/diagrams/aggregators-relationship.excalidraw — open at https://excalidraw.com to adjust, re-export PNG here. -->

![Participants flow into the Aggregator DPG (the on-ramp), which bulk-creates signals in the Signals DPG (the network), enabling network discovery and matching](../../../assets/diagrams/aggregators-relationship.png)

The Aggregator app is the on-ramp; the Signals DPG is the network. Adaptors usually stand up Signals first, then add the Aggregator app as partner organisations come on board.

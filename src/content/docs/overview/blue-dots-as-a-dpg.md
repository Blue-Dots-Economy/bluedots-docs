---
title: Blue Dots as a DPG
description: Why Blue Dots is built as open Digital Public Goods, and the two DPGs that make up the stack.
sidebar:
  order: 4
---

Blue Dots is built as **Digital Public Goods (DPGs)** — open-source, standards-based, reusable building blocks that any organisation can deploy, operate and extend. This design choice is deliberate: local discovery is a shared-infrastructure problem, and shared infrastructure is best built as a commons rather than a single closed platform.

## The intuition: shared rails, like UPI

Blue Dots is digital discovery infrastructure — comparable in spirit to what **UPI** created for payments. UPI built shared rails that any bank, any app, and any citizen could use, without anyone owning the network. Blue Dots builds shared digital rails that any government department, SMB, private or social-sector organisation, or citizen can use to **become discoverable and find others** — without anyone owning or controlling the map, connected through an **open discovery protocol**.

Any actor can plug in, contribute, and leverage. That is what makes Blue Dots replicable across districts and states without a bespoke implementation each time.

> No one owns the map. Everyone can use it.

:::note[Consent is the foundation]
Every Blue Dot on the map exists only because the person or organisation behind it chose to be there. Consent is the foundation of signals becoming digital, and of signals being exchanged.
:::

## What "DPG" means here

A DPG in the Blue Dots sense is:

- **Open** — source-available and free to deploy. Adaptors run their own instances.
- **Network-aware** — instances interoperate on a shared contract (a *network*) instead of in silos.
- **Schema-driven** — what an instance stores and exchanges is defined by versioned schemas, not hardcoded, so domains can evolve without forking the code.
- **Composable** — an adaptor can serve one domain or many, and integrate with other DPGs.

## The two DPGs

The Blue Dots stack is anchored by two DPGs that work together:

### Signals DPG

The **network-aware backend** that stores Blue Dots and matches them across instances. Its core vocabulary — *network*, *domain*, *instance*, *item*, *action*, *event* — is used consistently in both the product and the code. Signals exposes the read/write APIs that everything else builds on. Most adaptors **start here**.

See [Core Concepts → Signals](/core-concepts/signals/) and [Architecture → Signals DPG](/core-concepts/architecture/signals-dpg/).

### Aggregator DPG

The **aggregator-facing application** that lets organisations onboard participants and bring their signals into the network at scale — through registration flows, approval, bulk upload and profile management. The Aggregator app reads from the upstream Signals stack and writes participant signals into it.

See [Core Concepts → Aggregators](/core-concepts/aggregators/) and [Architecture → Aggregator DPG](/core-concepts/architecture/aggregator-dpg/).

## How adaptors start

A typical adoption path:

1. Stand up a **Signals DPG** instance for your district or domain.
2. Define or adopt the **network** and **domain** schemas you need.
3. Add the **Aggregator DPG** to onboard partner organisations and bulk-load participants.
4. Layer in capture channels (web, voice) and integrations (SMS, email).

The [Adaptor Onboarding guide](/guides/adaptor-onboarding/) walks through this end to end.

## A model that can travel

The discovery failure is not unique to India. In any economy where livelihoods and services are informal, vernacular and hyperlocal — where national platforms serve only the digitally fluent — the same [paradox of proximity](/overview/paradox-of-proximity/) applies.

Blue Dots is designed to be replicable anywhere:

- **Voice AI** works across languages and personas.
- **Local ecosystem aggregators** exist in every geography.
- A **facilitation team** works wherever there is a local administrative unit.
- **Innovators** exist in every market.

Because it is a Digital Public Good, Blue Dots is financially sustainable and openly replicable — not dependent on proprietary platforms or continuous donor funding. For development institutions and governments, it is a cost-efficient infrastructure for making untapped local market potential visible and actionable, and a new model for unlocking economic data at scale.

---
title: Blue Dots as a DPG
description: Why Blue Dots is built as open Digital Public Goods (DPGs), how one set of software serves jobs, education, disability services and tourism, and the two DPGs in the stack.
sidebar:
  attrs:
    class: bd-changed
  order: 4
changed_sections:
  - _top
  - shared-software-for-everyone-like-upi
  - what-dpg-means-here
  - signals-dpg
  - aggregator-dpg
  - supporting-blocks-also-ready-to-use
  - a-model-that-can-travel
---

Blue Dots is built as **Digital Public Goods (DPGs)**: open-source, standards-based building blocks that any organisation can deploy, run and extend. Helping people in a district find each other is a shared problem. So the software is shared too, and no single company owns it.

## Shared software for everyone, like UPI

Like **UPI** lets any bank or app send money through one shared system, Blue Dots lets anyone list what they need or offer. Others find them through the same shared rules. "Anyone" covers government departments, MSMEs (micro, small and medium enterprises), private and social-sector organisations, and citizens. No one owns or controls the map.

Instances talk to each other through an **open protocol**. Any organisation can join, add listings and build on it. So a new district or state can start without a custom build each time.

:::note[Consent]
Every dot exists because the person or organisation behind it chose to list it. On the jobs and disability networks, phone numbers are shared only after both sides agree. Orange Dot tourism listings are the exception: they are public on purpose.
:::

## What "DPG" means here

A DPG in the Blue Dots sense is:

- **Open** — source-available and free to deploy. Adaptors run their own instances.
- **Network-aware** — instances interoperate on a shared contract (a *network*) instead of in silos.
- **Schema-driven** — versioned schema files set what an instance stores and exchanges. This is what lets one set of software serve many sectors. The Blue Dot (jobs), Yellow Dot (education), Purple Dot (persons with disabilities) and Orange Dot (tourism) networks each have their own schema. See the [schema-driven model](/core-concepts/technical/schema-driven-model/).
- **Composable** — an adaptor can serve one domain or many, and integrate with other DPGs.

## The two DPGs

The Blue Dots stack is anchored by two DPGs that work together:

### Signals DPG

The **network-aware backend** that stores dots and matches them across instances. Its core vocabulary (*network*, *domain*, *instance*, *item*, *action*, *event*) is used consistently in both the product and the code. Signals exposes the read/write APIs that everything else builds on. Most adaptors **start here**.

See [Core Concepts → Signals](/core-concepts/signals/) and [Architecture → Signals DPG](/core-concepts/architecture/signals-dpg/).

### Aggregator DPG

The **aggregator-facing application** that lets organisations sign up participants and bring their listings into the network in bulk. It does this through registration, approval, bulk upload and profile management. The Aggregator app reads from the upstream Signals stack and writes participant signals into it.

See [Core Concepts → Aggregators](/core-concepts/aggregators/) and [Architecture → Aggregator DPG](/core-concepts/architecture/aggregator-dpg/).

### Where each one does its work

The two DPGs divide the [seven-step lifecycle](/core-concepts/blue-dot-lifecycle/) between them:

| DPG | What it does | Where it shows up in the lifecycle |
|---|---|---|
| **Signals** | Core registration, discovery and connection | Profile completion (step 4), verification checks (step 5), going live (step 7) |
| **Aggregator** | Onboarding and tracking for partner organisations and teams | Assisted data collection (step 3), verification review (step 6), ongoing tracking after go-live |

## Supporting blocks, also ready to use

Alongside the two DPGs, an adaptor inherits a set of ready-made supporting pieces — none of which need to be built:

- **Discovery & connection** — finds and ranks relevant matches, including by location.
- **Notifications** — Email and SMS.
- **A shared rulebook** — common rules applied consistently across deployments.
- **Setup automation** — [infrastructure and deployment](/guides/installation/cloud-setup/aws/deployment/) stood up quickly, on AWS out of the box and adaptable to other clouds.
- **Voice agent prompts** — [published as DPGs](/guides/voice-ai-prompts/), platform-independent.
- **Participant profiles** — each network defines its own participant types. The jobs network has [three already defined](/core-concepts/participant-profiles/): job seeker, job provider and service provider.
- **Full documentation** — this site.

## How adaptors start

A typical adoption path:

1. Stand up a **Signals DPG** instance for your district or domain.
2. Define or adopt the **network** and **domain** schemas you need.
3. Add the **Aggregator DPG** to onboard partner organisations and bulk-load participants.
4. Layer in capture channels (web, voice) and integrations (SMS, email).

The [Adaptor Onboarding guide](/guides/adaptor-onboarding/) walks through this end to end.

## A model that can travel

The same problem exists outside India. Wherever work and services are informal, local and in local languages, national platforms serve only people who are confident online. The same [paradox of proximity](/overview/paradox-of-proximity/) applies there.

Blue Dots is designed to be replicable anywhere:

- **Voice AI** works across languages and personas.
- **Local organisations that sign people up** (aggregators) exist in every geography.
- A **facilitation team** works wherever there is a local administrative unit.
- **Private service providers** (innovators) in any country can build on it.

Because it is a Digital Public Good, anyone can copy and run Blue Dots. It can keep going without proprietary platforms or continuous donor funding. For development institutions and governments, it is a low-cost way to list local people and businesses that no one could find before. Others can then act on them. It also gives them district-level data on what people need and offer.

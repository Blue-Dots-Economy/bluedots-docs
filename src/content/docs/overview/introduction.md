---
title: Introduction
description: What the Blue Dots Economy is, why it exists, and how this documentation is organised.
sidebar:
  order: 1
---

The **Blue Dots Economy** is an initiative to solve India's *local discovery crisis*. Across the country's districts, individuals, jobs, services and schemes exist in close proximity — yet they cannot digitally discover one another. This "paradox of proximity" keeps people, enterprises and entire districts in **digital darkness**, unable to unlock value that is already within walking distance.

Blue Dots closes that gap with open **discovery infrastructure**: a way for citizens and enterprises to publish local *signals of intent* and have them matched with the people, opportunities and services nearby that can act on them.

## What is a Blue Dot?

A **Blue Dot** is a local signal of intent from a citizen or an enterprise, usually around livelihoods and services. A jobseeker looking for work of a specific trade, an employer who needs that exact skill 800 metres away, a citizen seeking a government scheme — each is a Blue Dot.

A Blue Dot can be created in 2–3 minutes, including over voice in the user's own language. Once created, it becomes discoverable to the relevant peers on the network, so that a match that used to take weeks — or never happened at all — can happen in under two days.

## Why it matters

The cost of invisibility is concrete and measurable. Across Indian districts today:

- Youth placement rates sit below 20%.
- Women's labour-force participation is under 35%.
- Scheme budget utilisation runs below 70%.
- Service uptake is under 50% of its potential.

Enabling local discovery in India's top 100 districts represents a conservatively estimated **₹87,500 crore** livelihood-enhancement opportunity — and livelihoods are only one of many sectors Blue Dots can serve. For a fuller breakdown, see [The Economics of Local Discovery](/explore/economics/).

## How Blue Dots is built

Blue Dots is delivered as **Digital Public Goods (DPGs)** — open, reusable building blocks any adaptor can deploy and extend. Two DPGs anchor the architecture:

- **Signals DPG** — the network-aware backend that stores and matches Blue Dots (signals) across instances.
- **Aggregator DPG** — the aggregator-facing application that lets organisations onboard participants and bring their signals into the network at scale.

Adaptors typically *start with Signals*, then add the Aggregator app as they onboard partner organisations. The rest of this documentation walks through both.

## What an adaptor actually does

Mostly **configuration, not construction.** Registration, discovery, connection, notifications and tracking already exist. So do the pieces an adaptor might expect to design from scratch:

- **Participant types** — Job Seeker, Job Provider and Service Provider are [already defined](/core-concepts/participant-profiles/).
- **Onboarding routes** — assisted or self-serve, via app or AI voice call, [both supported out of the box](/core-concepts/blue-dot-lifecycle/#2-choose-the-route-in).
- **Verification checks** — structured, completed and consented, [built in](/core-concepts/blue-dot-lifecycle/#5-verification-checks).
- **Deployment** — [automated on AWS](/guides/deployment/), adaptable to any major cloud.

> The adaptor brings local knowledge and a local ecosystem to reach providers and seekers. The DPGs bring the underlying machinery.

What is genuinely local — who should become a Blue Dot, which aggregators can reach them, which use case to start with — is exactly what [the lifecycle](/core-concepts/blue-dot-lifecycle/) and the [district activation guide](/guides/district-activation/) walk through.

## How this documentation is organised

| Section | What you'll find |
| --- | --- |
| [Start Here](/start/build/) | Four guided paths — build, deploy, onboard, evaluate. Pick one and follow it in order. |
| [Overview](/overview/introduction/) | The vision, the problem, the approach, and the DPG model. |
| [Core Concepts](/core-concepts/) | Signals, aggregators, the domain vocabulary, architecture and technical docs. |
| [Guides](/guides/) | Installation, adaptor onboarding, configuration, API reference and deployment. |
| [API Reference](/api/) | Generated, always-current operation reference for all three services. |
| [Explore](/explore/use-cases/) | Pilots, use cases, field learnings and the road beyond livelihoods. |
| [Community](/community/contributing/) | How to contribute, the roadmap and release notes. |

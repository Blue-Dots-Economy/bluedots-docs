---
title: Aggregators
description: What aggregators do, and how the Aggregator DPG brings participants and their signals onto the network.
sidebar:
  order: 4
---

An **aggregator** is anyone connected to a Blue Dot who can **verify its details, and thereby drive trust in it** — while onboarding participants and bringing their signals onto the network at scale. The **Aggregator DPG** is the application they use.

That verification role is the point. Volume without credibility is just a list; an aggregator is what makes a Blue Dot believable to the other side of the market.

## Who can be an aggregator

<span class="bd-new" title="Added/updated from the adopter-guide PDF">new</span>

Any organisation with **reach and trust on the ground** for a given cohort:

| Aggregator type | Typical cohort |
|---|---|
| Colleges and ITIs | Graduating batches, students |
| Skilling centres | Trainees completing a course |
| MSME / SMB associations | Member businesses and their vacancies |
| Project Implementation Agencies | Programme beneficiaries |
| Employment exchanges | Registered job seekers |
| NGOs and civil-society organisations | Communities they already serve |
| Government departments | Scheme beneficiaries, district cohorts |

Picking the right aggregator is [step 1 of the lifecycle](/core-concepts/blue-dot-lifecycle/#1-to-become-a-blue-dot): the adaptor decides who should become a Blue Dot, then identifies the partner who can actually get to them.

## Why aggregators matter

Signal volume is the fuel for local discovery. Asking every citizen to self-onboard is slow; aggregators already hold relationships with hundreds or thousands of participants. By letting an aggregator register and bulk-load its participants, the network reaches useful signal density quickly — which is exactly what the Ghaziabad and Dharwad pilots demonstrated.

## What the Aggregator DPG does

The Aggregator DPG is aggregator-facing and provides:

- **Registration & approval** — an organisation registers, is reviewed, and is approved onto the network.
- **Profile management** — schema-driven forms (RJSF) let non-engineers evolve registration and profile fields without code changes.
- **Bulk upload** — CSV/file-based creation of many participant signals at once, processed asynchronously by a background worker.
- **Registration links & metrics** — shareable links for self-registration, with roll-up metrics.
- **Verification** — the human review that turns a checked profile into a *Blue Dot Verified* one.

## Four intake methods

<span class="bd-new" title="Added/updated from the adopter-guide PDF">new</span>

Assisted onboarding is not one flow. Four intake methods ship ready-made, and an aggregator simply runs whichever fits the context:

| Method | What it looks like | Mechanism |
|---|---|---|
| **Offline camp** | Data collected in person, e.g. at a job fair | Aggregator portal, assisted entry |
| **Bulk upload** | An existing list (CSV, database) imported in one go | CSV → background worker → bulk-create |
| **Outbound campaign** | Proactive outreach over WhatsApp or a voice bot | Notifications + voice DPG |
| **Inbound campaign** | Participants scan a shared QR code and start on their own | Registration links, with roll-up metrics |

The choice of **assisted or self** route, and of intake method, is a configuration decision made per campaign or geography — not a technical build. See [The Blue Dot Lifecycle](/core-concepts/blue-dot-lifecycle/#2-choose-the-route-in).

## The trust boundary

The Aggregator DPG reads from the upstream Signals stack and, in the MVP, has **no write access to Signals except through the controlled bulk-create paths**. Every request is scoped to a verified `aggregator_id`, which is **never trusted from the client** — it is asserted from the authenticated session. This keeps one aggregator from ever reading or writing another's data.

Integrating DPGs (such as the Aggregator app, or a voice DPG) authenticate to Signals with a **Keycloak client-credentials service token**, sent alongside an acting-org header. See [Identity & Auth](/core-concepts/architecture/identity-and-auth/) for the full model.

## Relationship to Signals

<!-- Editable source: src/assets/diagrams/aggregators-relationship.excalidraw — open at https://excalidraw.com to adjust, re-export PNG here. -->

![Participants flow into the Aggregator DPG (the on-ramp), which bulk-creates signals in the Signals DPG (the network), enabling network discovery and matching](../../../assets/diagrams/aggregators-relationship.png)

The Aggregator app is the on-ramp; the Signals DPG is the network. Adaptors usually stand up Signals first, then add the Aggregator app as partner organisations come on board.

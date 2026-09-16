---
title: AI Voice Agent Prompts
description: The ready-made voice agent prompt sets published as DPGs — what they cover, how they are structured, and how a voice DPG connects to Signals.
sidebar:
  order: 7
---

The **AI Voice Agent** is the primary self-service channel for [completing a profile](/core-concepts/blue-dot-lifecycle/#4-completing-the-profile-self-route). The prompts that drive it are **DPGs in their own right** — published, versioned and reusable, exactly like the Signals and Aggregator codebases.

They are **not tied to any one voice platform.** An adaptor can run them on whichever Voice AI service it chooses; the prompts define the conversation, not the vendor.

📦 **[github.com/Blue-Dots-Economy/AI-Agent-Prompts](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts)**

## What's published

Prompt sets are organised per network (`Blue Dots`, `Orange Dots`, …), then per agent. For the Blue Dots network:

| Agent | Side of the market | What the call does |
|---|---|---|
| **KKB** — *काम की बात* | Job seeker | Shows available work clearly so the caller can decide, and captures what they are looking for |
| **DKB** — *धंधे की बात* | Job provider (MSME owner) | Helps the owner keep job postings current, complete and grounded in real market data |
| **Maya** | Job seeker / graduate | Seeker-facing agent with a dedicated **inbound** variant for callers who reach in rather than being called |
| **TRRAIN** | Job seeker, post-application | A short follow-up courtesy call that makes **one** offer of a free support service and records the answer |

This maps onto the two role families the lifecycle expects — a seeker-side agent and a provider-side agent — with additional agents for inbound calling and post-application follow-up.

## How a prompt set is structured

Each agent directory follows the same file convention:

| File pattern | Purpose |
|---|---|
| `<Agent> <Language>.md` | The main conversation prompt, per language (Hindi, Kannada, …) |
| `<Agent> <Language> Signals.md` | The variant wired to Signals-backed tool calls |
| `<Agent> Inbound*.md` | Inbound variant — the caller reaches the agent, rather than being called |
| `<Agent> Memory.md` | What the agent carries across turns and calls |
| `<Agent> Output.md` | The structured output the call must produce |

The split matters: **the conversation prompt, the memory contract and the output contract are separate files**, so an adaptor can change how the agent *talks* without changing what the call must *produce* — and the structured output keeps satisfying the [verification checks](/core-concepts/blue-dot-lifecycle/#5-verification-checks) downstream.

## Choosing a Voice AI provider

The prompts assume nothing about the platform beyond three capabilities:

1. **Telephony in both directions** — outbound campaigns and an inbound number the QR code can point at.
2. **Local-language speech** — the reference prompts ship in Hindi and Kannada; the language list is an adaptor decision, not a platform constraint.
3. **Tool calling** — the `Signals` prompt variants call back into the Signals DPG mid-conversation (for example a `get_profile` lookup to greet a caller by name).

Beyond those, selection is a commercial and operational decision: cost per minute, regional number availability, latency, and data residency.

:::caution[Say only what the agent can do]
The published prompts are explicit that an agent must never imply a capability it lacks — the TRRAIN follow-up agent, for instance, has exactly one tool and is instructed never to claim it applied to anything or changed a profile. Keep that discipline when adapting a prompt; it is what stops a voice channel from quietly making promises the system will not keep.
:::

## How the voice channel connects

A voice DPG integrates with Signals **the same way an aggregator does** — a Keycloak client-credentials service token plus an acting-org header, writing through the controlled bulk-create paths:

```http
authorization: Bearer <client-credentials token>
x-acting-org-id: <the organisation you act as>
```

The realm ships a dedicated `voice-dpg` confidential client for this. It must be listed in `KEYCLOAK_SERVICE_CLIENT_IDS` on the Signals API — that list is empty by default, so an unlisted DPG is refused.

See [Identity & Auth](/core-concepts/architecture/identity-and-auth/), [Keycloak Realm Reference](/core-concepts/architecture/keycloak-realm/) and [Keycloak Setup](/guides/keycloak-setup/).

## Related

- [The Blue Dot Lifecycle](/core-concepts/blue-dot-lifecycle/) — where the voice channel sits in the seven steps.
- [Participant Profiles](/core-concepts/participant-profiles/) — the fields a call has to fill.
- [Adaptor Onboarding](/guides/adaptor-onboarding/) — adding capture channels to a deployment.

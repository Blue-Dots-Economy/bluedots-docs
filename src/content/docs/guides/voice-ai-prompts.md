---
title: AI Voice Agent Prompts
description: The published voice agent prompts for the jobs network, how a prompt set is structured so it can be reused for any network, and how a voice DPG connects to Signals.
sidebar:
  order: 7
---

The **AI Voice Agent** is the primary self-service channel for [completing a profile](/core-concepts/blue-dot-lifecycle/#4-completing-the-profile-self-route). The prompts that drive it are **Digital Public Goods (DPGs) in their own right**: published, versioned and reusable, like the Signals and Aggregator codebases.

The published agents are for the jobs network (Blue Dot). The prompt structure works for any network: another network writes its own agents with the same files. The prompts work on any voice platform, so an adaptor can run them on whichever Voice AI service it chooses.

Repository: **[github.com/Blue-Dots-Economy/AI-Agent-Prompts](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts)**

## What's published

Prompt sets are organised per network, then per agent. The jobs agents sit in the `Blue Dots` folder:

| Agent | Who it talks to | What the call does |
|---|---|---|
| **KKB** — काम की बात | Job seeker | Shows available work clearly so the caller can decide, and captures what they are looking for |
| **DKB** — धंधे की बात | Job provider (owner of a micro, small or medium enterprise, MSME) | Helps the owner keep job postings current, complete and grounded in real market data |
| **Maya** | Job seeker / graduate | Seeker-facing agent with a dedicated **inbound** variant for callers who reach in rather than being called |
| **TRRAIN** | Job seeker, post-application | A short follow-up courtesy call that makes **one** offer of a free support service and records the answer |

This covers the two roles the lifecycle expects, a seeker-side agent and a provider-side agent, plus agents for inbound calls and follow-up after an application.

## How a prompt set is structured

Each agent directory follows the same file convention:

| File pattern | Purpose |
|---|---|
| `<Agent> <Language>.md` | The main conversation prompt, per language (Hindi, Kannada, …) |
| `<Agent> <Language> Signals.md` | The variant wired to Signals-backed tool calls |
| `<Agent> Inbound*.md` | Inbound variant — the caller reaches the agent, rather than being called |
| `<Agent> Memory.md` | What the agent carries across turns and calls |
| `<Agent> Output.md` | The structured output the call must produce |

**The conversation prompt, the memory contract and the output contract are separate files.** An adaptor can change how the agent *talks* without changing what the call must *produce*, and the structured output keeps satisfying the [verification checks](/core-concepts/blue-dot-lifecycle/#5-verification-checks) downstream.

## Choosing a Voice AI provider

The prompts assume nothing about the platform beyond three capabilities:

1. **Telephony in both directions:** outbound campaigns and an inbound number the QR code can point at.
2. **Local-language speech:** the reference prompts ship in Hindi and Kannada. The adaptor decides which languages to add.
3. **Tool calling:** the `Signals` prompt variants call back into the Signals DPG mid-conversation (for example a `get_profile` lookup to greet a caller by name).

Beyond those, selection is a commercial and operational decision: cost per minute, regional number availability, latency, and data residency.

:::caution[Say only what the agent can do]
The published prompts tell each agent never to imply a capability it lacks. For example, the TRRAIN follow-up agent has exactly one tool and is told never to claim it applied to anything or changed a profile. Keep this rule when adapting a prompt, so the voice channel does not promise things the system will not do.
:::

## How the voice channel connects

A voice DPG connects to Signals **the same way an aggregator does**. It signs in with a Keycloak service account and writes through the bulk-create paths:

```http
authorization: Bearer <client-credentials token>
x-acting-org-id: <the organisation you act as>
```

The realm ships a dedicated `voice-dpg` confidential client for this. It must be listed in `KEYCLOAK_SERVICE_CLIENT_IDS` on the Signals API. That list is empty by default, so an unlisted DPG is refused.

See [Identity & Auth](/core-concepts/architecture/identity-and-auth/), [Keycloak Realm Reference](/core-concepts/architecture/keycloak-realm/) and [Keycloak Setup](/guides/keycloak-setup/).

## Related

- [The Dot Lifecycle](/core-concepts/blue-dot-lifecycle/): where the voice channel sits in the seven steps.
- [Participant Profiles](/core-concepts/participant-profiles/): the fields a call has to fill.
- [Adaptor Onboarding](/guides/adaptor-onboarding/): adding capture channels to a deployment.

---
title: Voice Bots
description: How an adopter adds a voice bot to Blue Dots with the voice agent platform of their choice, connected through the Signals DPG or the AI Diffusion DPG.
---

A voice bot lets a person create or update their blue dot by phone call, in their own language. Voice bots are optional. The adopter chooses whether to run one and which voice agent platform to use. Blue Dots does not tie you to one platform: any platform that can call an API can work with the DPGs.

## Why use a voice bot

- **More people can sign up.** Anyone with a phone can create a blue dot by talking, in their own language. They do not need a smartphone, an app or the ability to fill in a form.
- **Setting one up is mostly configuration.** The conversation is described in configuration files and prompts, and the same structure is reused for every domain. Adding a domain or a language means writing new configuration, not new software.
- **You choose the platform.** You can keep the voice agent platform you already use, or change it later, without changing the DPGs.
- **It is tested in the field.** The jobs domain has run voice bots in its pilots. The cost per call and the results are on [the pilots page](/explore/pilots/).

## Platforms Blue Dots has used

| Platform | How Blue Dots used it |
|---|---|
| Raya | Blue Dots has run voice bot integrations with Raya. |
| [VoicERA](https://github.com/COSS-India/VoicEra) | Set up and tested with the AI Diffusion DPG. |

Other voice agent platforms are supported in the same way. Pick the one that fits your languages, cost and where your data must be kept.

## Two ways to connect

| | The platform calls Signals directly | The platform uses the AI Diffusion DPG |
|---|---|---|
| **Who runs the conversation** | The voice platform, with your prompts | The AI Diffusion DPG, configured as a use case |
| **What the platform handles** | The call, speech, the conversation and the API calls to Signals | The call, speech-to-text and text-to-speech |
| **How it reaches Blue Dots** | Calls the Signals DPG APIs as tools during the call | Sends each caller turn to the AI Diffusion DPG, which calls Signals |
| **Used by Blue Dots with** | Raya | VoicERA |

In both cases the data ends up in the Signals DPG. A profile created by phone is the same as one created in the app, and it goes through the same checks in [the blue dot lifecycle](/about/key-concepts/blue-dot-lifecycle/).

### The platform calls Signals directly

The voice platform holds the prompts and runs the conversation. During a call it uses the Signals DPG APIs as tools. For example, it looks up a caller's profile to greet them by name, saves the profile, or finds nearby jobs.

The platform signs in to Signals as a service account and acts on behalf of an organisation, the same way an aggregator does. [Identity & Auth](/get-started/architecture/identity-and-auth/) explains how.

The platform needs three things: phone calls in both directions, speech in the local language, and tool calling. Ready-made prompt sets for seeker-side and provider-side agents are in [Voice Agent Prompts](/deploy/agents/voice-agent-prompts/).

### The platform uses the AI Diffusion DPG

The AI Diffusion DPG runs the conversation, and the voice platform handles only the call and the speech. The DPG offers an endpoint that works like the OpenAI chat-completions API, called the bridge. Any platform that lets you set a custom OpenAI-compatible model endpoint can use it.

The platform sends each thing the caller says to the bridge, along with the caller's phone number and a call ID. The bridge streams back the reply, one sentence at a time, for the platform to speak. The AI Diffusion DPG calls Signals to read and save profiles and to apply for jobs.

:::caution[Keep the bridge on a private network]
The bridge does not check who is calling it. Make it reachable only from your voice platform, through a private network or firewall rules, and never expose it on the public internet.
:::

[AI Diffusion DPG Architecture](/get-started/architecture/ai-diffusion-dpg/) explains how the DPG is built.

## Set up a voice bot

The steps are in [Start your Deployment](/deploy/):

- [Configuring an AI Diffusion Use Case](/deploy/agents-platform/use-case-configuration/): describe the conversation, the phases and the tools in YAML.
- [AI Diffusion DPG Setup](/deploy/local/ai-diffusion-dpg/): run the AI Diffusion DPG next to a local Signals stack and connect a voice pipeline such as VoicERA through the bridge.
- [Voice Agent Prompts](/deploy/agents/voice-agent-prompts/): prompt sets for a platform that calls Signals directly.

---
title: Voice Bots
description: How an adopter adds a voice bot to Blue Dots with the voice agent platform of their choice, connected through the Signals DPG or the AI Diffusion DPG.
---

A voice bot lets a person create or update their blue dot by phone call, in their own language. Voice bots are optional. The adopter chooses whether to run one and which voice agent platform to use. Blue Dots does not tie you to one platform: any platform that can call an API can work with the DPGs.

## Why use a voice bot

- **More people can sign up.** Anyone with a phone can create a blue dot by talking, in their own language. They do not need a smartphone, an app or the ability to fill in a form.
- **Setting one up is mostly configuration.** The conversation is described in configuration files and prompts, and the same structure is reused for every domain. Adding a domain or a language means writing new configuration, not new software.
- **You choose the platform.** Any voice agent platform that can call the Signals DPG APIs works, and you can change it later without changing the DPGs.
- **It is tested in the field.** The jobs domain has run voice bots in its pilots. The cost per call and the results are on [the pilots page](/explore/pilots/).

## Voice agent platforms

The Signals DPG offers APIs that a voice agent platform calls during a call, for example to look up a caller's profile, save it or find nearby jobs. Any platform that can call these APIs works with Blue Dots, so you can choose the one that fits your languages, cost and where your data must be kept.

- **Raya:** connects to the Signals DPG APIs.
- **VoicERA with the AI Diffusion DPG:** a packaged bundle. [VoicERA](https://github.com/COSS-India/VoicEra) handles the call and the speech, and the [AI Diffusion DPG](/get-started/architecture/ai-diffusion-dpg/) runs the conversation and calls Signals.
- **Other platforms:** connect to the Signals DPG APIs in the same way.

A platform signs in to Signals as a service account and acts on behalf of an organisation, the same way an aggregator does. [Identity & Auth](/get-started/architecture/identity-and-auth/) explains how. Whichever platform you use, a profile created by phone goes through the same checks in [the blue dot lifecycle](/about/key-concepts/blue-dot-lifecycle/) as one created in the app.

## Set up a voice bot

The steps are in [Start your Deployment](/deploy/):

- [Configuring an AI Diffusion Use Case](/deploy/agents-platform/use-case-configuration/): describe the conversation, the phases and the tools in YAML.
- [AI Diffusion DPG Setup](/deploy/local/ai-diffusion-dpg/): run the AI Diffusion DPG next to a local Signals stack, ready for VoicERA to connect.
- [Voice Agent Prompts](/deploy/agents/voice-agent-prompts/): ready-made prompt sets for seeker-side and provider-side agents.
- [Building Search Requests](/api/search-requests/): set up the bot's search tool so what the caller says goes into filters, location and free text correctly.

:::caution[Keep the AI Diffusion DPG bridge on a private network]
VoicERA talks to the AI Diffusion DPG through an endpoint called the bridge, which does not check who is calling it. Make it reachable only from VoicERA, through a private network or firewall rules, and never expose it on the public internet.
:::

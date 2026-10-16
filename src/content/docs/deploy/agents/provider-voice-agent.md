---
title: Set Up the Provider Voice Agent
description: Set up DKB, the job-provider voice agent, on a voice AI platform against your Blue Dots instance.
sidebar:
  order: 9
  badge:
    text: Soon
    variant: note
---

:::note[Coming soon]
This guide is being written. It will set up **DKB** (धंधे की बात), the voice agent that helps employers keep their job postings current and complete. It will follow the same steps as [Set Up the Seeker Voice Agent](/deploy/agents/seeker-voice-agent/): create the agent, paste the prompts, add the tools, and test with a call.
:::

The DKB prompts are already published in the [AI-Agent-Prompts](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/tree/main/Blue%20Dots/DKB) repository:

| File | What it is |
|---|---|
| `DKB Hindi Signals.md`, `DKB Kannada Signals.md` | The conversation prompt, wired to Signals tool calls |
| `DKB Inbound Hindi.md`, `DKB Inbound Kannada.md` | Versions for callers who phone in |
| `DKB Memory.md` | What the agent remembers about each caller between calls |
| `DKB Output.md` | The structured fields each call produces |

The tool list for the provider agent will be added with this guide.

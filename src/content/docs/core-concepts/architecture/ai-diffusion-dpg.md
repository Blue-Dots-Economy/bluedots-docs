---
title: AI Diffusion DPG Architecture
description: How the AI Diffusion DPG runs a conversational agent for a public-service use case — seven services, one turn, and the principles behind them.
sidebar:
  order: 7
---

The **AI Diffusion DPG** runs a conversational agent for a public-service use case. It is seven fixed services, one per building block, each a small FastAPI service in Python. You do not change their code to build an agent. You describe your use case in YAML instead: what the agent says in each phase of the conversation, which external systems it can call, what it must refuse, and which channels it answers on. The services load that configuration at startup. **Blue Dots**, the voice job assistant, is the reference use case. A job-seeker calls a phone number and talks in Hindi. The agent finds their profile, searches for jobs, and applies for one on their behalf through the Signals network. Every example on this page comes from Blue Dots.

## The seven blocks

| Block | Port | Responsibility |
|---|---|---|
| Agent Core | 8000 | Runs each turn. It is the only caller of the LLM and of the other blocks. |
| Knowledge Engine | 8001 | Retrieval over use-case documents and glossaries, called as a tool. |
| Memory Layer | 8002 | Session state, the profile graph, saved tool results and the audit trail. |
| Trust Layer | 8003 | Input and output checks, consent, constraints and human handoff. It fails closed. |
| Observability Layer | 8004 | Traces, metrics, and turn and outcome events, sent asynchronously. |
| Reach Layer | 8005–8008 | The bridge (OpenAI chat-completions compatible, the default integration) plus optional web chat (local/dev), CLI, voice (telephony) and MCP. |
| Action Gateway | 9999 | Calls external systems through declared tools. |

**dev-kit** (port 8080) is a configuration tool, not a runtime block. You use it to write and check a use case's YAML. A running agent does not depend on it.

## Who calls whom

<pre class="mermaid">
flowchart LR
  subgraph Default["Default"]
    B["Bridge (OpenAI-compatible)"]
  end
  subgraph Optional["Optional channels"]
    W["Web chat (local/dev)"] --- V[Voice / telephony] --- C[CLI] --- M[MCP server]
  end
  Default --> AC[Agent Core]
  Optional --> AC
  AC --> TL[Trust Layer]
  AC --> ML[Memory Layer]
  AC --> KE[Knowledge Engine]
  AC --> AG[Action Gateway]
  AC --> OL[Observability Layer]
  AC --> LLM[(LLM provider)]
  AG --> EXT[(External systems, e.g. Signals)]
</pre>

The rule is that **no block calls another block directly during a turn**. Channels call Agent Core, and Agent Core calls everything else. This keeps the order of a turn in one place, so you can read it, test it and trace it. It also means a block can be replaced without the others noticing, as long as it keeps its HTTP contract. Only the Action Gateway talks to systems outside the DPG, so every external call goes through a tool you have declared. The web channel has two side routes outside the turn: it reads past conversation history from the Memory Layer to restore a chat, and it forwards document uploads from dev-kit to the Knowledge Engine.

## One turn

A Blue Dots caller says, in Hindi, that they want electrician work in Lucknow. This is what happens between the end of their sentence and the agent's reply. The diagram follows the streaming path, which the voice channels use; each box names the block that does the work.

<pre class="mermaid">
flowchart TD
  IN(["Caller, through a Reach Layer channel:<br/>'I want electrician work in Lucknow'"]) --> S1
  S1["1 · Memory Layer<br/>Load the session, profile and saved tool results"] --> S2
  S2["2 · LLM, understanding call<br/>trade = Electrician, location = Lucknow"] --> S3
  S3["3 · Trust Layer<br/>Check the input"] --> S4
  S4["4 · Agent Core<br/>Routing picks the job_match phase"] --> S5
  S5["5 · Action Gateway<br/>Pre-dispatch fetch_jobs; results saved"] --> S6
  S6["6 · Agent Core<br/>Assemble the prompt"] --> S7
  S7["7 · LLM, reply call<br/>streams tokens"] -. "tool requested" .-> T["Agent Core checks the call,<br/>then Action Gateway runs it"]
  T -.-> S7
  S7 --> S8["8 · Agent Core<br/>Output guard, sentence by sentence"]
  S8 --> S9["9 · Trust Layer<br/>Check the output in small batches"]
  S9 --> OUT(["Reach Layer speaks each passed batch"])
  OUT --> S10["10 · After the reply<br/>Memory write, audit record, telemetry"]
</pre>

Each step is there for a reason:

1. **Load the session.** Agent Core keeps no state of its own, so every turn starts by fetching the session, the caller's profile and earlier tool results from the Memory Layer. On a caller's first turn, the use case can also fetch profile fields up front, so a returning caller is recognised from the start.
2. **Understand the turn.** An LLM call turns the utterance into dialogue acts and slots (here, a trade and a location), which are written to the session. Code can then make decisions from structured values instead of free text. If the use case turns on language normalisation, it runs in parallel with this call. Blue Dots leaves it off.
3. **Check the input.** The Trust Layer can block or escalate a turn before any tool runs or any reply is written. On the streaming path, understanding runs just before this check (alongside language normalisation, when that is on), and its result is used only if the check passes. On the non-streaming path the check comes first.
4. **Route.** Rules in your configuration pick the next phase (a "subagent") from the dialogue act and the session state. Here the trade and location are both known, so the conversation moves to `job_match`. Code makes this decision, so it is the same every time.
5. **Pre-dispatch the search.** The `job_match` phase declares that `fetch_jobs` runs before the LLM. Starting the search early means the results are already in the prompt, so the model does not have to ask for them and wait for a second round trip.
6. **Assemble the prompt.** The prompt is built from the agent's identity, the current state, the recent turns, the Trust Layer's constraints and the saved tool results. The model sees facts from the tool results, not from its own memory.
7. **Call the LLM.** The reply streams back token by token. If the model asks for a tool, Agent Core checks the per-turn call limit and that every identifier came from an earlier tool result, then calls the Action Gateway (or the Knowledge Engine for `knowledge_retrieval`), and continues the reply.
8. **Apply the output guard.** Each sentence is checked against the channel's output contract. For voice, for example, digits are rewritten as spoken words, so the text-to-speech engine says numbers the way a person would.
9. **Check the output and stream.** Sentences go to the Trust Layer in small batches, and each batch that passes is sent to the caller straight away. If a batch is blocked, a safe fallback line replaces it and nothing more is sent for that turn.
10. **Write after the reply.** The memory write, the audit record and the turn event for the Observability Layer happen after the caller has the reply. These writes are needed, but the caller should not have to wait for them.

## Design principles

**Configure, don't code.** Each organisation adopting the DPG has its own use case, and maintaining a fork for each would not scale. So the seven services are the same for everyone. A use case is YAML in two layers: framework defaults, and your use case on top. Each block validates the merged result against its schema at startup, and an unknown key stops the service from starting, so a typo is caught before the first call. See [Configuring a use case](/core-concepts/architecture/ai-diffusion-configuration/).

**The LLM writes the words, and code makes the decisions.** A model can phrase a reply well, but it cannot be relied on to make the same choice twice. So routing between phases, consent, ending the session, handing off to a person and the way numbers are spoken are all decided in code from your configuration. The model's job is the wording of each reply.

**Trust is a fail-closed boundary, and in Blue Dots the write tools come after consent.** A public-service agent must not act for someone who has not agreed to it, even when a dependency is down. If the Trust Layer cannot be reached or returns an error, Agent Core treats the check as a block, not a pass. In Blue Dots, the write tools (saving a profile, applying for a job) exist only in the phases that come after the consent question. A new caller is asked for consent at the start of the call. A returning caller whose consent is already on file is not asked again.

**Agent Core is stateless, with all state in the Memory Layer.** A voice call may reach a different Agent Core instance on each turn, and an instance may restart mid-call. So Agent Core keeps nothing between turns. Session state, the profile graph and saved tool results live in the Memory Layer, which is the only block that talks to Redis and the graph database.

**Facts come from saved tool results, not from the model.** A model that reads out a job or a reference number it made up is worse than no agent at all. So every tool result is saved in the Memory Layer and put back into the prompt as a known fact. A tool call that passes an identifier no tool ever returned is refused, and the model is told to use the value from the result.

**The design meets a voice-latency budget.** On a phone call, silence after the caller stops talking feels like a dropped line. So the reply is streamed and spoken sentence by sentence. Most turns wait on two LLM calls: understanding and the reply. A tool the model asks for mid-reply adds another LLM call, so a phase dispatches the tools it can predict before the reply call starts. When the model does chain tools, the number of rounds is capped (`max_tool_rounds`, 3 by default). Memory, audit and telemetry writes happen after the reply.

## Channels

Every channel is part of the Reach Layer and calls Agent Core over the same HTTP API, so the conversation logic is written once for all of them. Each channel has its own output contract, which the output guard applies to the reply. A channel answers only when the use case has a block for it in its configuration.

**The bridge is the default integration**, and the only channel Blue Dots enables out of the box:

- **Bridge (8008).** A generic OpenAI chat-completions-compatible endpoint (`/v1/chat/completions`). Any system that speaks that API can connect to it and use the whole agent as if it were one model, for example an adopter's own voice pipeline. Such a pipeline handles the call, speech-to-text and text-to-speech, and the bridge streams the agent's sentences back. [VoicERA](https://github.com/COSS-India/VoicEra), an external DPG voice service, is one example.

The other channels are optional, and an adopter turns on the ones it needs:

- **Web chat (8005), local/dev only.** A single-page chat app for local and development testing. Each message is one request to Agent Core, and the reply comes back whole, not streamed. It runs without a login; Google sign-in is optional and needs a real OAuth client ID.
- **Voice (8006).** Inbound and outbound phone calls through a telephony provider (Vobiz). It handles the audio stream, detects when the caller has finished speaking, and converts speech to text and text to speech (Raya). A single outbound call can be started through the channel's `/campaign` endpoint.
- **CLI.** A text client in the terminal, for trying a use case without a browser or a phone. It runs as a container on the stack's network and publishes no port.
- **MCP server (8007).** Exposes the agent through the Model Context Protocol (MCP), as tools for an MCP host, such as an AI coding assistant or a desktop chat client.

**Caller identity is the phone number.** On voice, the channel takes the caller's number from the telephony provider and passes it to Agent Core as the user ID. On the bridge, the client must send it as `metadata.caller_phone`: digits only, country code first, no `+` (for example `919900112233`). A number without a country code is still a valid query upstream but matches nothing, so the bridge rejects it. On web chat and the CLI, the user ID entered at the start is the phone number in the same form. A wrong number would make every call look like a first-time caller. Signals keys the profile and job applications on this number, and the Memory Layer uses it to recognise a returning caller.

## Built today vs planned

As of **2026-10-03**.

**Built today**
- The seven blocks, each a FastAPI service with its own schema-validated YAML configuration, and dev-kit.
- The channels above: the bridge (OpenAI chat-completions compatible, the default integration), plus optional web chat (local/dev), CLI, voice (telephony) and MCP.
- Configurable phases and routing, dialogue-act understanding, tool pre-dispatch, the output contract and guard, and streamed replies with batched output checks.
- Saved tool results that are put back into the prompt and used to ground identifiers.
- LLM providers: Anthropic, OpenAI, Google and Ollama, with a primary and a fallback model.
- Blue Dots, end to end against Signals: profile lookup, job search, profile save and job application.
- **Human handoff.** It is built, but it ships switched off (`human_handoff: none` in the Blue Dots configuration). It needs a team to receive the handoff, and some hardening first ([#457](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/issues/457)). Until then, when a caller asks for a person, the agent says it is an AI assistant and that no one else is on the call.

**Planned**
- A WhatsApp channel.
- Outbound campaigns: calling a list of people, rather than one call at a time.
- Live tuning: adjusting a deployed use case's configuration without a redeployment ([#12](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/issues/12)).
- More LLM providers, such as Azure OpenAI ([#301](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/issues/301)).
- A shared consent service, so that consent holds across several Trust Layer instances ([#47](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/issues/47)).

## Read next

- [Configuring a use case](/core-concepts/architecture/ai-diffusion-configuration/): the configuration layers, and what you configure versus what the framework owns.
- [AI Diffusion DPG local setup](/guides/installation/local-setup/ai-diffusion-dpg/): run the Blue Dots agent on your machine against a local Signals stack.
- [Contributor map](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/blob/main/ARCHITECTURE.md): where each block and each step of a turn lives in the code.

---
title: Configuring an AI Diffusion Use Case
description: How a use case is described in YAML for the AI Diffusion DPG — the two configuration layers, what you write for each block, one Blue Dots phase end to end, and the mistakes that stop a block at startup.
sidebar:
  order: 8
---

A use case on the AI Diffusion DPG is a folder of YAML, one file per block. You do not change service code. This page explains how those files are loaded, what goes in each one, and how one phase of the Blue Dots voice job assistant turns into the turn shown on the [architecture page](/core-concepts/architecture/ai-diffusion-dpg/). All file paths are in the [ai-diffusion-dpg repository](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg).

## Two layers

Each block reads two files at startup:

- **Framework defaults**, in `dev-kit/dpg/<block>.yaml`. These hold the values every use case shares: ports, the addresses of the other blocks, timeouts and retries. They exist so your files only declare what is different.
- **Your use case**, in `dev-kit/configs/<domain>/<block>.yaml`. For Blue Dots this is `dev-kit/configs/blue-dots/`.

The block deep-merges the two, with your values winning. Maps are merged key by key. Any other value, **including a list**, is replaced whole by yours. The merged result is then checked against the block's schema. The schema rejects unknown keys at every level, so a misspelt or unsupported key stops the block from starting, rather than being silently ignored during a live call.

<pre class="mermaid">
flowchart TD
    A["dev-kit/dpg/block.yaml (framework defaults)"] --> C["Mounted as config/dpg.yaml"]
    B["dev-kit/configs/domain/block.yaml (use case)"] --> D["Mounted as config/block.yaml"]
    C --> E["${VAR} expansion (Reach Layer, Action Gateway)"]
    D --> E
    E --> F["Deep merge (use case overrides defaults)"]
    F --> G["Schema validation (an unknown key stops startup)"]
    G --> H["Running block"]
</pre>

Reach Layer and Action Gateway expand environment variables in string values before the merge: `${VAR}` takes the variable's value, and `${VAR:-default}` falls back to the default when the variable is unset. This is how secrets and environment-specific URLs stay out of the YAML. The other blocks do not expand variables.

## What you write, block by block

Each row names the keys you write in `dev-kit/configs/blue-dots/<block>.yaml`.

| Block | What you describe | Keys in the Blue Dots files |
|---|---|---|
| Agent Core | The model, the phases of the conversation and the rules that move between them, how a caller's turn is understood, the agent's identity, human handoff, the tools the model may see, and each channel's output contract. | `agent` (provider, `primary_model`, `fallback_model`, `max_tool_rounds`); `agent_workflow.subagents` (one entry per phase, each with `tools`, `predispatch`, `system_prompt`, `pending` and `routing`); `agent_workflow.global_routing`; `preprocessing.nlu_processor` (`slots`, `topics`, `act_intents`, `termination_gate`); `identity`; `handoff`; `connectors.read` and `connectors.write`; `channels.bridge.output_contract`; `conversation` (fixed lines spoken without the LLM). |
| Action Gateway | How each tool calls an external system, and how much of the answer comes back. | `tools[]`, each with `base_url`, `auth` (the key is read from the environment variable named in `secret_env`), `extra_headers`, `endpoints`, and `response` (`projection` picks the fields kept, `session_mapping` copies some into session state, `max_size_chars` caps the size). |
| Trust Layer | What the agent must refuse or escalate, what it must never say, and which words count as a yes or a no to consent. | `trust.input_rules` (`blocked_phrases`, `escalation_topics`); `trust.output_rules`; `trust.policy_packs`; `trust.consent` (`consent_phrases`, `decline_phrases`); `trust.hitl`. |
| Reach Layer | Which channels run, and the channel-specific lines they speak. | `reach_layer.channels.<channel>`. Blue Dots configures the VoicERA bridge: `terminal_word`, `hangup_tool_name`, `tool_status_phrases`. |
| Knowledge Engine | The documents and glossaries the agent can search. | `knowledge.blocks.static_knowledge_base` (`collection_name`, `sources`) and `knowledge.blocks.glossary`. Blue Dots switches both off, and does not offer the `knowledge_retrieval` tool. |
| Memory Layer | The session fields a conversation keeps, and how long they live. | `state.session.ttl_minutes`; `state.session.schema` (one entry per field, with a type and a default); `state.persistent`. |
| Observability Layer | The outcomes and service levels you want to measure. | `observability.outcomes`, `observability.sli`, `observability.audit`. |

Tools are described in two places on purpose. Agent Core's `connectors` say what the model sees: the tool's description, its input schema and per-turn limits such as `max_calls_per_turn`. Action Gateway's `tools` say how the call is made. The model never sees a URL or a key.

## One phase, end to end

Blue Dots splits a call into phases (called subagents in the YAML): `opening`, `profile_resolve`, `job_match`, `profile_setup`, `apply_confirm` and a few for closing. This is a trimmed copy of `job_match` from `dev-kit/configs/blue-dots/agent_core.yaml`:

```yaml
# agent_workflow.subagents[] — trimmed
- id: job_match
  description: >
    Call fetch_jobs with trade + city. Read out up to 3 best matches
    as a compact spoken block.
  tools:
    - fetch_jobs
  predispatch:
    - tool: fetch_jobs
      unless_fresh: true
      args:
        query_text:
          template: "{trade|stored_trade} jobs in {location|stored_location}"
          normalise: { location: city_canonical }
  system_prompt: |
    You are in the **job_match** phase.
  # ... the rest of the prompt: how to read out jobs, hard rules
  pending:
    - id: submit_confirm
      when: [{ field: current_question, operator: contains, value: ["आवेदन भेज दूँ", "अप्लाई कर दूँ"] }]
      options_from: { tool: fetch_jobs, fields: [role, company], id_field: item_id }
      resolves_to: selected_job_item_id
    - id: select_job
      options_from: { tool: fetch_jobs, fields: [role, company], id_field: item_id }
      resolves_to: selected_job_item_id
  routing:
    - intent: termination_intent
      next_subagent_id: ended
    - intent: apply_now
      conditions:
        - field: profile_item_id
          operator: not_eq
          value: ""
      next_subagent_id: apply_confirm
    - intent: apply_now
      next_subagent_id: profile_setup
    - intent: "*"
      next_subagent_id: job_match
```

Here is the turn from the architecture page, where the caller asks for electrician work in Lucknow, traced through this configuration:

1. **Understanding.** The `slots` in `preprocessing.nlu_processor` declare `trade` and `location`, so the understanding call returns `trade = Electrician` and `location = Lucknow`, and both are written to the session.
2. **Routing into the phase.** The caller was in `profile_resolve`. Its rule `intent: "*"`, with `trade` and `location` both `not_eq ""`, matches, so the next phase is `job_match`. A phase's own rules are tried top to bottom and the first match wins. If none match, `agent_workflow.global_routing` is tried, then `default_fallback_subagent_id`.
3. **Pre-dispatch.** The `predispatch` entry fills its `template` from the session and searches for "Electrician jobs in Lucknow" before the reply call starts. `normalise` maps the city through the `city_canonical` table (Bangalore to Bengaluru, for example). `unless_fresh` skips the search when a fresh result is already saved.
4. **The prompt.** `system_prompt` tells the model how to read out the results. `tools` lists only `fetch_jobs`, so in this phase the model cannot save a profile or apply for a job, whatever it writes.
5. **The reply.** The output guard applies `channels.bridge.output_contract` (Devanagari script, numbers as words), and the reply ends on a question, such as asking which job the caller wants to hear more about.

On the caller's next turn, `pending` decides which question they are answering. Agent Core takes the first entry whose `when` conditions hold. After a list of jobs, the last question contains no apply phrase, so `select_job` is pending. When the caller names a job ("the Flipkart one"), `options_from` lets the understanding call match the name against the saved `fetch_jobs` result, and `resolves_to` writes the job's `item_id` to `selected_job_item_id`. When the agent has instead asked "shall I send the application?", `submit_confirm` is pending. An `act_intents` row maps a yes to that question to `apply_now`, and the `apply_now` rule sends the caller to `apply_confirm` if they already have a live profile, or to `profile_setup` to create one. A goodbye that the termination gate accepts maps to `termination_intent`, and the first rule ends the call.

**Consent works through the same phases.** In Blue Dots, the write tools, `save_profile` and `apply_job`, are listed only in `profile_setup` and `apply_confirm`. Those phases are reached only after the `opening` phase has asked the consent question.

## What the framework owns

You configure the content of a conversation. The framework owns its mechanics, so every use case gets them without writing them:

- **The turn pipeline.** The order of the steps in a turn (load, understand, check, route, pre-dispatch, prompt, reply, guard, check, write) is fixed in Agent Core.
- **The tool guards.** Agent Core enforces the per-turn call limits you set and the overall `max_tool_rounds`. For the parameters you list in `grounded_params`, it refuses a tool call whose identifier did not come from an earlier tool result.
- **The Trust boundary.** The Trust Layer's input and output checks are steps of the pipeline, not options. If the Trust Layer cannot be reached, the check counts as a block.
- **Termination.** Ending a call is decided in code. `termination_gate` lets you say when a goodbye is accepted, for example only after an application or a closing offer. The framework then ends the session.
- **Streaming.** Splitting the reply into sentences, checking them in batches and sending each one as soon as it passes.

## The dev-kit

The dev-kit (port 8080) is the tool you use to write a use case. It is a web app that interviews you about your use case, phase by phase (language, knowledge, memory, trust, tools, workflow, channels), and writes the YAML files to `dev-kit/configs/<domain>/`. Its Docker image carries each block's runtime schema, so before it deploys a use case it validates each block's merged configuration against the same schema the block checks at startup. You can also edit the files by hand. A running agent does not depend on the dev-kit.

## Common mistakes

- **A key that is newer than the image.** The schema is built into each block's image. If your YAML comes from a newer branch than the image you run, a key the image does not know fails validation, and the block stops at startup. Keep the configuration and the image tag from the same commit.
- **Expecting a list to merge.** A list in your file replaces the default list whole. To add one item to a default list, copy the whole list into your file.
- **`TOOL_RESULT_KEY_SECRET` is not set.** The Memory Layer needs this secret to save tool results. Without it the block still starts, but logs `tool_result_store.disabled` and saves no tool results. Later turns then cannot put earlier results back into the prompt as known facts. Set it in the Memory Layer's environment.
- **An unresolved placeholder in a tool URL.** In Action Gateway, a `${VAR}` with no default and no value in a tool's `base_url` stops the block at startup. The error names the tool and the variable. Set the variable, or write `${VAR:-default}`.
- **Pointing at a different Signals cluster.** The Blue Dots tools read `SIGNALS_BASE_URL`, `SIGNALS_SEARCH_URL` and `SIGNALS_INSTANCE_URL`. Change all three together, and change the API keys with them. A key from another cluster returns 401 or 403 instead of a clear error.
- **`${VAR}` in other blocks.** Only Reach Layer and Action Gateway expand variables. In any other block's file, `${VAR}` is just text.

## Read next

- [AI Diffusion DPG architecture](/core-concepts/architecture/ai-diffusion-dpg/): the blocks, one turn, and the design principles.
- [AI Diffusion DPG local setup](/guides/installation/local-setup/ai-diffusion-dpg/): run the Blue Dots agent on your machine.

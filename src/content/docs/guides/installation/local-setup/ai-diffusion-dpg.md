---
title: AI Diffusion DPG Setup
description: Run the Blue Dots agent on your machine against the local Signals stack, talk to it through the bridge, an OpenAI-compatible endpoint, and finish with a real job application in Signals.
sidebar:
  order: 5
---

This guide runs the **AI Diffusion DPG** with the **Blue Dots** use case on your machine, next to the local Signals stack. You build the images from source, connect the agent to your local Signals, hold a short Hindi conversation, and finish with a job application stored in Signals. For what each block does, read the [AI Diffusion DPG architecture](/core-concepts/architecture/ai-diffusion-dpg/) first. For how the Blue Dots YAML is put together, see [Configuring an AI Diffusion use case](/core-concepts/architecture/ai-diffusion-configuration/).

The main path talks to the agent through **the bridge**, the default integration. The bridge is a generic OpenAI chat-completions-compatible endpoint (`/v1/chat/completions`), so any system that speaks that API can connect to the agent, for example your own voice pipeline (telephony, speech-to-text and text-to-speech). [VoicERA](https://github.com/COSS-India/VoicEra), an external DPG voice service, is one example of such a pipeline. In this guide, `curl` stands in for any OpenAI-compatible client. API keys are shown as `<your key>`.

The bridge is the only channel the Blue Dots configuration and the compose files enable out of the box. The other channels are optional: web chat (for local/dev testing only), the CLI, the built-in telephony voice channel and MCP. [AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/) lists the exact edits to turn each one on.

## 1. What you'll have at the end

- The AI Diffusion stack running in Docker as 15 containers: the six other blocks, the Reach Layer's bridge, dev-kit, Redis, Memgraph, and the observability tools (OpenTelemetry Collector, Jaeger, Loki, Prometheus, Grafana).
- The agent's tools pointed at your local Signals: Action Gateway reads profiles and jobs from it, searches it, saves a profile and applies for a job.
- One scripted conversation through the bridge, with `curl` standing in for any OpenAI-compatible client, as the test caller `9199000000101`: a greeting, a yes, an age, a trade and city, a pick, a name and a confirmation.
- One `apply` action in the Signals database, from the caller's new profile to a job you seeded.
- Optionally, the other channels, such as web chat for local/dev testing, from [AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/).

On the host, the AI Diffusion stack publishes these ports. The blocks themselves (8000–8004 and 9999) are reachable only inside the compose network.

| Port | Service |
|---|---|
| 127.0.0.1:8008 | Reach Layer, bridge (loopback only) |
| 8081 | dev-kit (8080 inside the container) |
| 3000 | Grafana |
| 16686, 14250 | Jaeger |
| 9090 | Prometheus |
| 3101 | Loki (3100 inside the container) |
| 4317–4318, 8889 | OpenTelemetry Collector |

## 2. Prerequisites

- **The local Signals stack, with search.** Follow [Signals DPG Setup](/guides/installation/local-setup/signals-dpg/), *Track A*, with both profiles (`docker compose --profile keycloak --profile search up -d --build`), then the *Adding search* steps. The agent needs the Signals API on host port `2742` and the search API on host port `3100`; without search, the agent has no job search.
- **Docker with Compose, logged in to Docker Hub** (`docker login`). The AI Diffusion images are built from Docker Hardened Images (`dhi.io/…`), and the build pulls those bases through your Docker Hub login. `docker login dhi.io` is only needed if you `docker pull` a `dhi.io` image directly.
- **An OpenAI API key.** The Blue Dots configuration uses OpenAI for the agent's model calls.
- **Memory.** Give Docker **at least 12 GiB**. Measured with both stacks up:

  | Stack | Containers | Memory |
  |---|---|---|
  | AI Diffusion, with web chat in place of the bridge | 15 | 1.29 GiB |
  | Signals, with the search profile | 9 | 8.2 GiB, of which the embedding server is 6.95 GiB (amd64, emulated on Apple Silicon) |
  | Total | 24 | 9.5 GiB |

  An earlier run, with the bridge, measured 8.1 GiB in total. Almost all of the difference is the embedding server, so leave headroom.

- **Disk.** Plan for about 30 GiB of images and build cache for both stacks. The search profile's embedding image is about 12 GiB, and the AI Diffusion build adds about 15 GiB including cache.
- **Port 2742 belongs to the Signals container.** If you ever ran the Signals API from source (Track B), make sure that process is gone. This should list only Docker:

  ```bash
  lsof -nP -iTCP:2742 -sTCP:LISTEN
  ```

## 3. Get the code

```bash
git clone --branch <release tag> https://github.com/Blue-Dots-Economy/ai-diffusion-dpg.git
```

Releases are tagged `<YYYYMM>-s<sprint>-rc<n>`, for example `202610-s1-rc1`, and the images for a release carry the same tag. Use the same `<release tag>` wherever this guide asks for it. Until the first release tag is published, leave out `--branch <release tag>` to clone `main`, and use `local` as the tag.

You build the images in step 6, once `.env` is written.

## 4. Connect to local Signals

The agent talks to Signals as a service organisation with an API key. It also needs at least one job in Signals to find.

### Mint the service key

From `signals-dpg/local-setup/`:

```bash
docker compose run --rm signals-bootstrap sh -lc "pnpm --filter api db:seed:services"
```

```text
aggregator-dpg:
  org_id:    org_8c3b6989-d923-4491-84a9-b2b0311e6814
  user_id:   usr_1ed0d985-4981-49af-841e-b8a3afa39d51
  member_id: mem_dbf72af5-1674-4713-92ff-dee258b71916
  apikey:    <your key>
             ↑ raw key — NOT SHOWN AGAIN. Capture now.

seed complete.
```

The raw `sk_signals_…` key is printed **only on the first run**; Signals keeps only its hash. Running the command again is safe: it prints the same `org_id` every time, and on later runs the key line reads `apikey: (existing …)` instead of a key. So if you already ran it for *Adding search*, expect that line, take the `org_id` from the output, and reuse the key you saved then: it is the `SIGNALS_SEARCH_API_KEY` value in `local-setup/.env.search`. If the key is lost, reset Signals and mint a new one ([step 12](#12-stop-reset-and-clean-up)).

The same key serves the agent as `BLUE_DOTS_API_KEY` and `BLUE_DOTS_SEARCH_API_KEY`, and the `org_id` becomes `BLUE_DOTS_ORG_ID`.

### Seed one job

The conversation in step 9 asks for electrician work in Lucknow, so seed one matching job. Save this as `job.json`:

```json
{
  "name": "Lucknow Power Works",
  "phone_number": "+919900090100",
  "compliance": [
    {"key": "user_terms", "value": true},
    {"key": "user_privacy", "value": true},
    {"key": "profile_creation", "value": true}
  ],
  "channel": "voice",
  "network": "blue_dot",
  "domain": "provider",
  "item_type": "job_posting_1.0",
  "item_state": {
    "jobProviderName": "Lucknow Power Works",
    "jobProviderLocation": "Lucknow",
    "role": "Electrician",
    "positions": 2,
    "natureOfJob": "Full-time",
    "hiringManagerName": "HR Desk",
    "hiringManagerPhoneNumber": "+919900090101",
    "salaryMin": 12000,
    "salaryMax": 16000,
    "workExperienceYears": "< 1 Year",
    "candidateExperienceType": "Fresher"
  }
}
```

Post it with the service key and org:

```bash
export SIGNALS_KEY=<your key>
export ORG_ID=<org_id from the seed output>
curl -s -X POST http://localhost:2742/api/v1/admin/participant \
    -H 'content-type: application/json' \
    -H "x-api-key: $SIGNALS_KEY" -H "x-acting-org-id: $ORG_ID" \
    --data @job.json
```

The response (HTTP 200) contains one `job_posting_1.0` item with `"lifecycle_status":"live"` and its `item_id`. The search worker indexes it within a few seconds:

```bash
docker exec signals-postgres psql -U postgres -d postgresdb -tA -c "SELECT count(*) FROM item_search;"
```

```text
1
```

To see what the agent's job search will get, query search directly:

```bash
curl -s -X POST localhost:3100/v1/search -H 'content-type: application/json' -H "x-api-key: $SIGNALS_KEY" \
    -d '{"context":{"messageId":"m1","networkId":"blue_dot","domain":"provider","itemType":"job_posting_1.0"},
         "message":{"intent":{"textSearch":"electrician jobs in Lucknow"},"pagination":{"limit":5}}}'
```

The result lists the Lucknow Power Works job with a `score` and `"sort_applied":"relevance"`.

### The Signals URLs

The Blue Dots tools read three variables. Their defaults point at the hosted Signals; for the local stack, set:

| Variable | Local value | Why |
|---|---|---|
| `SIGNALS_BASE_URL` | `http://host.docker.internal:2742` | The Signals API, as the Action Gateway container reaches it on the host. |
| `SIGNALS_SEARCH_URL` | `http://host.docker.internal:3100` | The search API, reached the same way. |
| `SIGNALS_INSTANCE_URL` | `http://localhost:2742` | Not a URL the container calls: it is the instance URL Signals compares with each job's `item_instance_url`, so it must match what Signals stored. |

Check the stored value:

```bash
docker exec signals-postgres psql -U postgres -d postgresdb -tA \
    -c "SELECT item_instance_url FROM items WHERE item_domain='provider' LIMIT 1;"
```

```text
http://localhost:2742
```

## 5. Configure `.env`

Write `automation/docker/.env` in your ai-diffusion-dpg clone. It is git-ignored; `umask 077` keeps it readable only by you. Run this from the directory you cloned into in step 3:

```bash
cd ai-diffusion-dpg/automation/docker
umask 077
cat > .env <<X
OPENAI_API_KEY=<your key>
BLUE_DOTS_API_KEY=<your key>
BLUE_DOTS_SEARCH_API_KEY=<your key>
BLUE_DOTS_ORG_ID=<org_id from the seed output>
SIGNALS_BASE_URL=http://host.docker.internal:2742
SIGNALS_SEARCH_URL=http://host.docker.internal:3100
SIGNALS_INSTANCE_URL=http://localhost:2742
TOOL_RESULT_KEY_SECRET=$(openssl rand -hex 32)
DOMAIN=blue-dots
DPG_IMAGE_TAG=<release tag>
X
git check-ignore -v .env
```

`BLUE_DOTS_API_KEY` and `BLUE_DOTS_SEARCH_API_KEY` are both the `sk_signals_…` key from step 4. `DPG_IMAGE_TAG` is your `<release tag>`, the same tag you build with in step 6. The heredoc is unquoted on purpose, so `$(openssl rand -hex 32)` runs and writes a random secret.

**Required**

| Variable | What it is for |
|---|---|
| `OPENAI_API_KEY` | The agent's model calls. |
| `BLUE_DOTS_API_KEY` | Action Gateway's key for the Signals API (profiles, applications). |
| `BLUE_DOTS_SEARCH_API_KEY` | Action Gateway's key for Signals search. |
| `BLUE_DOTS_ORG_ID` | The service organisation the agent acts as. |
| `SIGNALS_BASE_URL`, `SIGNALS_SEARCH_URL`, `SIGNALS_INSTANCE_URL` | Where local Signals is (step 4). |
| `TOOL_RESULT_KEY_SECRET` | The Memory Layer's secret for saved tool results. If it is empty, the Memory Layer still starts but logs `tool_result_store.disabled` and saves no tool results. |
| `DOMAIN` | The use case whose configuration is mounted: `blue-dots`. |
| `DPG_IMAGE_TAG` | The image tag to run. |

**Optional, not needed for this guide**

| Variables | What they are for |
|---|---|
| `GOOGLE_CLIENT_ID`, `REACH_SESSION_SECRET` | Google sign-in for the optional web chat. Web chat is for local/dev testing and runs without a login, so they are only needed if you turn sign-in on ([web chat](/guides/installation/local-setup/ai-diffusion-channels/#web-chat-localdev-only)). |
| `HITL_WEBHOOK_URL`, `HITL_WEBHOOK_SECRET` | Human handoff to a receiver you run. Blue Dots ships with handoff off (`human_handoff: none`), and the local compose file does not pass them. |
| `DISCORD_WEBHOOK_CRITICAL`, `DISCORD_WEBHOOK_WARNING`, `DISCORD_WEBHOOK_INFO` | Grafana alert routing, one Discord webhook per severity. Without them, alerts go to a placeholder that delivers nowhere. |
| `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN`, `VOBIZ_FROM_NUMBER`, `RAYA_API_KEY`, `PUBLIC_URL`, `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` | The telephony voice channel (port 8006): the Vobiz telephony account, the speech provider key and a public URL for call webhooks. See [voice](/guides/installation/local-setup/ai-diffusion-channels/#voice-telephony). |

### Port clashes with the Signals stack

Both stacks want two of the same host ports. Keycloak and dev-kit both use 8080, and signals-search and Loki both use 3100. The file `automation/docker/local-signals.override.yml` resolves this. You add it to every compose command in this guide, and it:

- publishes dev-kit on host port 8081 and Loki on host port 3101;
- points the Knowledge Engine's dev-kit callback at `http://host.docker.internal:8081`;
- lets Action Gateway reach the host as `host.docker.internal`;
- publishes the bridge on `127.0.0.1:8008`, so you can test it with `curl`;
- mounts the bridge's framework defaults where the bridge reads them.

Nothing else collides with the Signals ports (2742, 3100, 5173, 5432, 5555, 8025, 8080).

## 6. Build and start

All commands in this step run from `ai-diffusion-dpg/automation/docker`.

### Build the images

The stack runs from `docker-compose.dev.yml`, which pulls `ghcr.io/blue-dots-economy/ai-diffusion-dpg/<block>:${DPG_IMAGE_TAG}` and has no `build:` sections. So you build the images with `docker-compose.yml`, which tags them with `${GIT_SHA}` under the same names, and then start the dev file with `DPG_IMAGE_TAG` set to the same value. Docker finds the local images and pulls nothing. Use the same `<release tag>` you set as `DPG_IMAGE_TAG` in `.env`; `GIT_SHA` and `DPG_IMAGE_TAG` must match.

```bash
GIT_SHA=<release tag> docker compose -f docker-compose.yml build \
    action_gateway agent_core knowledge_engine memory_layer observability_layer \
    trust_layer reach_layer_bridge dev_kit
```

The bridge is the only channel image you need; the optional channels' images are built with their compose profiles ([AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/)). On a laptop these images take a few minutes to build. Check that they are there:

```bash
docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep ai-diffusion
```

```text
ghcr.io/blue-dots-economy/ai-diffusion-dpg/knowledge-engine:<release tag> 2.9GB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/dev-kit:<release tag> 501MB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/reach-layer-bridge:<release tag> 163MB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/agent-core:<release tag> 316MB
...
```

### Start the stack

With the Signals stack running:

```bash
export COMPOSE_PROJECT_NAME=dpg-local
COMPOSE="docker compose -f docker-compose.dev.yml -f local-signals.override.yml"
CORE="redis memgraph action_gateway knowledge_engine memory_layer trust_layer \
        observability_layer agent_core reach_layer_bridge dev_kit \
        otelcol jaeger loki prometheus grafana"
DOMAIN=blue-dots $COMPOSE up -d --wait $CORE
```

`DOMAIN=blue-dots` on the command line is deliberate: a `DOMAIN` exported in your shell overrides the one in `.env`. `--wait` returns when every service with a health check is healthy. From built images this took under a minute; Agent Core is the slowest, at about 45 seconds.

```bash
DOMAIN=blue-dots $COMPOSE ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'
```

```text
NAME                  STATUS                        PORTS
action_gateway        Up About a minute (healthy)   9999/tcp
agent_core            Up About a minute (healthy)   8000/tcp
dev_kit               Up 50 seconds (healthy)       0.0.0.0:8081->8080/tcp
...
reach_layer_bridge    Up 20 seconds (healthy)       127.0.0.1:8008->8008/tcp
...
```

`COMPOSE` and `CORE` are shell variables, so define them again in any new terminal.

## 7. Verify the stack

### Every block is healthy

The blocks are not published on the host, so check them from inside the network. The images have no shell, so use `python3 -c`:

```bash
for p in agent_core:8000 knowledge_engine:8001 memory_layer:8002 trust_layer:8003 \
           observability_layer:8004 action_gateway:9999 reach_layer_bridge:8008; do
    printf '%-26s ' $p
    docker exec agent_core python3 -c "import urllib.request;r=urllib.request.urlopen('http://$p/health',timeout=5);print(r.status, r.read().decode())"
  done
```

```text
agent_core:8000            200 {"status":"ok"}
knowledge_engine:8001      200 {"status":"ok"}
memory_layer:8002          200 {"status":"ok"}
trust_layer:8003           200 {"status":"ok"}
observability_layer:8004   200 {"status":"ok"}
action_gateway:9999        200 {"status":"healthy","adapters":{"fetch_profile":true,"fetch_jobs":true,"save_profile":true,"apply_job":true}}
reach_layer_bridge:8008    200 {"status":"ok"}
```

The bridge on the host:

```bash
curl -s localhost:8008/health
```

It returns `{"status":"ok"}`. Then check that Action Gateway can reach your local Signals. Signals answers on `/health/ready`, not `/health`:

```bash
docker exec action_gateway python3 -c "import urllib.request;r=urllib.request.urlopen('http://host.docker.internal:2742/health/ready',timeout=5);print(r.status,r.read().decode())"
```

```text
200 {"status":"ready"}
```

## 8. Where channel configuration lives

Every channel has its own block under `channels:`, in two files of the Blue Dots use case:

| File | Block | What it holds |
|---|---|---|
| `dev-kit/configs/blue-dots/agent_core.yaml` | `channels.<channel>` | How Agent Core treats turns from that channel, such as the channel's prompt suffix (`system_prompt_suffix`), how it assembles a turn (`turn_assembler`) and, for the bridge, the output contract. |
| `dev-kit/configs/blue-dots/reach_layer.yaml` | `reach_layer.channels.<channel>` | How the channel itself behaves, such as the bridge's spoken status phrases or web chat's sign-in. |

Out of the box, Blue Dots has a block only for `bridge`; to turn on another channel, you add its blocks ([AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/)). The framework defaults sit under the same keys in `dev-kit/dpg/agent_core.yaml` and `dev-kit/dpg/reach_layer.yaml`, and your use-case file is merged on top of them, so you only write the keys you change. Agent Core answers only on channels that have a block in `agent_core.yaml`.

The blocks read their configuration at startup. After you change a file, restart the container that reads it, from `automation/docker`. For example, after a change to `agent_core.yaml`:

```bash
DOMAIN=blue-dots $COMPOSE restart agent_core
```

Agent Core is healthy again after about 25 seconds. For a change to `reach_layer.yaml`, restart that channel's container instead (here, `reach_layer_bridge`). An unknown key fails validation, and the container does not start.

## 9. The bridge (default)

**What it is.** The bridge is the default way to connect to the agent. It is a generic OpenAI chat-completions-compatible endpoint (`POST /v1/chat/completions`), so any system that speaks that API can use the whole agent as if it were one model. A common case is your own voice pipeline: it handles the call, speech-to-text and text-to-speech, and the bridge streams the agent's sentences back. [VoicERA](https://github.com/COSS-India/VoicEra), an external DPG voice service, is one example of such a pipeline. Here, `curl` stands in for any OpenAI-compatible client.

**What it needs.** Nothing beyond the stack you started in step 6. The override publishes the bridge on `127.0.0.1:8008` (loopback only) and mounts the framework defaults where the bridge reads them.

**How to start it.** It is the `reach_layer_bridge` service in `CORE` (step 6).

**How to connect your client.** Point its OpenAI-compatible LLM endpoint at the bridge. In this local setup the bridge is published on loopback only, so the client runs on the same machine and uses `http://127.0.0.1:8008/v1/chat/completions`. On every request, send the caller's phone number as `metadata.caller_phone` (digits only, country code first, no `+`) and a `metadata.call_id` that stays the same for the whole call.

**Where its config lives.** `channels.bridge` in `dev-kit/configs/blue-dots/agent_core.yaml` holds the bridge's output contract (Devanagari script, numbers as words) and prompt suffix. `reach_layer.channels.bridge` in `dev-kit/configs/blue-dots/reach_layer.yaml` holds `terminal_word`, `hangup_tool_name` and `tool_status_phrases`, the lines the bridge speaks while a tool runs. To change them, edit the file and restart `agent_core` or `reach_layer_bridge` (step 8).

### A conversation through the bridge

Each turn is one request, and the bridge reads only the newest `user` message. It streams the reply. Keep `caller_phone` and `call_id` the same for the whole call; the caller's phone is their identity.

```bash
curl -sN -X POST http://127.0.0.1:8008/v1/chat/completions -H 'content-type: application/json' -d '{
    "model": "dpg", "stream": true,
    "messages": [{"role": "user", "content": "नमस्ते"}],
    "metadata": {"caller_phone": "9199000000101", "call_id": "run-call-003"}}'
```

The reply arrives as `data:` chunks, ending with `"finish_reason": "stop"` and `data: [DONE]`:

```text
data: {"id": "chatcmpl-…", "object": "chat.completion.chunk", "created": …, "model": "dpg", "choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}, "logprobs": null, "finish_reason": null}]}
data: {"id": "chatcmpl-…", …, "choices": [{"index": 0, "delta": {"content": "नमस्ते!"}, …}]}
…
data: {… "finish_reason": "stop" …}
data: [DONE]
```

Send the caller lines below as `content`, one request per turn. The agent's wording varies from run to run; these are the verified replies.

| # | Caller | Agent reply | Time |
|---|---|---|---|
| 1 | नमस्ते (hello) | नमस्ते! क्या आप काम की तलाश में हैं? (Are you looking for work?) | 2.3 s |
| 2 | हाँ ठीक है (yes, OK) | आपकी उम्र क्या है? (How old are you?) | 1.9 s |
| 3 | मेरी उम्र 28 साल है (I am 28) | आप किस काम या ट्रेड में नौकरी ढूंढ रहे हैं? (Which trade?) | 1.8 s |
| 4 | मुझे लखनऊ में इलेक्ट्रीशियन का काम चाहिए (I want electrician work in Lucknow) | आपके लिए जॉब्स हैं — इलेक्ट्रीशियन, लखनऊ पावर वर्क्स, सैलरी बारह से सोलह हज़ार रुपये महीना। इसके बारे में और बात करें? (There are jobs: electrician, Lucknow Power Works, twelve to sixteen thousand rupees a month. Shall we talk about it?) | 2.5 s |
| 5 | पहला वाला (the first one) | एक मिनट। कृपया अपना नाम बताइए ताकि मैं आपकी जानकारी सेव कर सकूँ। (One moment. Please tell me your name so I can save your details.) | 3.1 s |
| 6 | मेरा नाम राम कुमार है (my name is Ram Kumar) | एक मिनट। आपकी जानकारी सेव हो गई। क्या मैं आवेदन भेज दूँ? (Your details are saved. Shall I send the application?) | 3.0 s |
| 7 | हाँ, भेज दीजिए (yes, send it) | लकनऊ पावर वर्क्स में इलेक्ट्रिशियन के लिए आपका आवेदन भेज दिया गया है। वे आपसे संपर्क करेंगे। (Your application for electrician at Lucknow Power Works has been sent. They will contact you.) | 3.2 s |

"एक मिनट।" ("one moment") is the bridge's phrase while a tool runs. A new caller is always asked for their name before the profile is saved, because Signals needs a name to create one.

The tool calls show in the Action Gateway log:

```bash
docker logs action_gateway --since 5m | grep rest_api
```

```text
… rest_api_session_values tool=fetch_profile keys=['has_age', 'user_privacy', 'user_terms']
… rest_api_execute
… rest_api_http_error tool=save_profile status=400 ids={}
… rest_api_session_values tool=save_profile keys=['acting_as_user_id', 'profile_item_id']
… rest_api_session_values tool=apply_job keys=['applications_submitted', 'last_application_id']
```

The `save_profile` 400 on turn 5 is Signals refusing a profile with no name; the agent recovers by asking for it.

### The application is in Signals

Applications are rows in `item_actions`:

```bash
docker exec signals-postgres psql -U postgres -d postgresdb -c \
    "SELECT action_id, action_type, action_status, source_item_id, target_item_id, target_item_instance_url, performed_by_org_id, created_at
       FROM item_actions ORDER BY created_at DESC LIMIT 3;"
```

```text
 action_id                            | action_type | action_status | source_item_id                       | target_item_id                       | target_item_instance_url | performed_by_org_id                      | created_at
 92664f3e-9f67-4155-8de2-8d0588143a26 | apply       | created       | 660b50b5-03bc-4fce-b54c-6cd81e239065 | dbbd1024-20b1-4b9a-9b8c-d14a0859ffc5 | http://localhost:2742    | org_8c3b6989-d923-4491-84a9-b2b0311e6814 | 2026-10-03 05:54:29.852+00
```

One `apply` row: from the seeker profile the call created (`source_item_id`) to the job you seeded (`target_item_id`), performed by the service organisation.

## 10. Optional channels

Web chat (for local/dev testing only), the CLI, the telephony voice channel and the MCP server are optional. Each needs a block in `agent_core.yaml`, a block in `reach_layer.yaml` and, except for the CLI, its compose profile (`web`, `voice` or `mcp`). [AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/) lists the exact edits, the environment variables and how to verify each one. On web chat and the CLI, the user ID is the caller's phone number in the form `91XXXXXXXXXX`.

## 11. Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Action Gateway exits with `IsADirectoryError: … '/app/config/action_gateway.yaml'`, and the other blocks fail after it | A `DOMAIN` exported in your shell overrides `DOMAIN=blue-dots` in `.env`. Compose mounts `dev-kit/configs/<that name>/`, which does not exist, so Docker creates empty directories in its place. | Run `DOMAIN=blue-dots $COMPOSE down -v`, delete the empty `dev-kit/configs/<that name>/` directory, and start again with `DOMAIN=blue-dots` on the command line (or `unset DOMAIN`). |
| Every health check passes, but the apply fails: `rest_api_http_error tool=apply_job status=422` in the Action Gateway log | Another process on the host listens on port 2742 (for example a Signals API started from source), and the containers' requests to `host.docker.internal:2742` reach it instead of the Signals container. | `lsof -nP -iTCP:2742 -sTCP:LISTEN` must show only Docker. Stop the other process. |
| `curl localhost:2742/health` returns 404 | Signals has no `/health`. | Use `/health/ready` (or `/health/live`). |
| The build cannot pull its `dhi.io/…` base images | Building pulls Docker Hardened Images through your Docker Hub login. | Run `docker login` (Docker Hub) first, then build again. |
| The agent asks for a name after you pick a job, and the log shows `save_profile status=400` | A new caller has no name yet, and Signals needs one to save a profile. | Expected. Answer with a name; the agent then saves the profile and applies. |
| `memgraph` does not start, exiting with "Unexpected positional argument(s)" | An old, unpinned Memgraph image or compose file. | Pull the current compose file, which pins `memgraph/memgraph:3.13.1`. |
| Action Gateway exits with `tool '…' has an unresolved ${VAR}` | A tool URL uses a variable with no value and no default. | Set the variable in `.env`, or give the placeholder a default (`${VAR:-…}`). |
| The Memory Layer logs `tool_result_store.disabled` | `TOOL_RESULT_KEY_SECRET` is empty, so saved tool results are off. | Set it in `.env` and restart: `DOMAIN=blue-dots $COMPOSE up -d --wait memory_layer`. |
| A block fails at startup right after you pulled new configuration | The image is older than the configuration, and a key it does not know fails validation. | Rebuild with the new commit, keeping `GIT_SHA` and `DPG_IMAGE_TAG` the same (step 6). |
| `port is already allocated` on 8080 or 3100 | The stack was started without the override, so dev-kit and Loki collide with Keycloak and signals-search. | Add `-f local-signals.override.yml` to every compose command (the `COMPOSE` variable in step 6). |
| `reach_layer_bridge` restarts with `FileNotFoundError: Config file not found: /app/reach_layer/bridge/config/dpg.yaml` | The stack was started without the override, which mounts that file. | Add `-f local-signals.override.yml`. |
| `reach_layer_web` is unhealthy: `RuntimeError: auth.enabled is true but REACH_SESSION_SECRET env var is not set` | Google sign-in is on for web chat (`channels.web.auth.enabled: true`), and it needs its secrets. | Add `REACH_SESSION_SECRET` and `GOOGLE_CLIENT_ID` to `.env`, or set `enabled` back to `false` ([web chat](/guides/installation/local-setup/ai-diffusion-channels/#web-chat-localdev-only)). |
| Every web chat or CLI reply is "We're having trouble connecting to the AI service right now", and Agent Core logs `ValueError: Unsupported channel: web` (or `cli`) | The use case's `agent_core.yaml` has no `channels.<channel>` block for that channel. Blue Dots ships with the bridge block only. | Add the channel's block ([AI Diffusion Optional Channels](/guides/installation/local-setup/ai-diffusion-channels/)), then restart `agent_core` ([step 8](#8-where-channel-configuration-lives)). |
| The CLI prints `(abandoned)` and then shows no replies | Input reached the CLI before the agent's opening line, for example when lines are piped into it. | Start it again and wait for the opening line before typing ([CLI](/guides/installation/local-setup/ai-diffusion-channels/#cli)). |
| The build stops with the disk full | Both stacks need about 30 GiB of images and build cache. | Free disk space, then build again. |

## 12. Stop, reset and clean up

Stop the AI Diffusion stack and remove its volumes (sessions, profile graph, saved tool results), from `automation/docker`:

```bash
DOMAIN=blue-dots $COMPOSE down -v
```

Stop the Signals stack and keep its data, from `signals-dpg/local-setup/`:

```bash
docker compose --profile keycloak --profile search down
```

To reset Signals completely, add `-v`. That deletes its database, including the service key:

```bash
docker compose --profile keycloak --profile search down -v
```

To start again after a reset, from `signals-dpg/local-setup/`: bring Signals back up, mint a new key, put it in `.env.search` and run `up -d` again so `signals-api` reads it:

```bash
docker compose --profile keycloak --profile search up -d --build
docker compose run --rm signals-bootstrap sh -lc "pnpm --filter api db:seed:services"
sed -i.bak "s|^SIGNALS_SEARCH_API_KEY=.*|SIGNALS_SEARCH_API_KEY=<your key>|" .env.search && rm .env.search.bak
docker compose --profile keycloak --profile search up -d
```

Then seed the job again (step 4) and update the `BLUE_DOTS_API_KEY`, `BLUE_DOTS_SEARCH_API_KEY` and `BLUE_DOTS_ORG_ID` lines in the AI Diffusion `.env`.

Both commands leave the images in place, so the next start needs no build.

## Read next

- [AI Diffusion DPG architecture](/core-concepts/architecture/ai-diffusion-dpg/): the blocks, one turn, and the design principles.
- [Configuring an AI Diffusion use case](/core-concepts/architecture/ai-diffusion-configuration/): the configuration layers, and what you write for your own use case.

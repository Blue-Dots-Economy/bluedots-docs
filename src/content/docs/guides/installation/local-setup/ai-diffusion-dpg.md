---
title: AI Diffusion DPG Setup
description: Run the Blue Dots voice agent on your machine against the local Signals stack, and finish with a real job application in Signals.
sidebar:
  order: 5
---

This guide runs the **AI Diffusion DPG** with the **Blue Dots** use case on your machine, next to the local Signals stack. You build the images from source, connect the agent to your local Signals, hold a short Hindi conversation through the VoicERA bridge, and finish with a job application stored in Signals. For what each block does, read the [AI Diffusion DPG architecture](/core-concepts/architecture/ai-diffusion-dpg/) first. For how the Blue Dots YAML is put together, see [Configuring an AI Diffusion use case](/core-concepts/architecture/ai-diffusion-configuration/).

:::note[Verified]
Verified on 2026-10-03 against ai-diffusion-dpg `adeea88` (images built at `0a506cf`; only the local-Signals override changed up to `adeea88`), on macOS (Apple Silicon), Docker Engine 29.8.1 and Docker Compose v5.5.1, with a fresh local Signals stack from `signals-dpg` `main` (`79c70c9`). Every command below comes from that run. API keys are shown as `<your key>`.
:::

## 1. What you'll have at the end

- The AI Diffusion stack running in Docker as 16 containers: the seven blocks, the web and bridge channels, dev-kit, Redis, Memgraph, and the observability tools (OpenTelemetry Collector, Jaeger, Loki, Prometheus, Grafana).
- The agent's tools pointed at your local Signals: Action Gateway reads profiles and jobs from it, searches it, saves a profile and applies for a job.
- One scripted conversation through the VoicERA bridge with `curl`, as the test caller `9199000000101`: a greeting, a yes, an age, a trade and city, a pick, a name and a confirmation.
- One `apply` action in the Signals database, from the caller's new profile to a job you seeded.

On the host, the AI Diffusion stack publishes these ports. The blocks themselves (8000–8004 and 9999) are reachable only inside the compose network.

| Port | Service |
|---|---|
| 8005 | Reach Layer, web channel |
| 127.0.0.1:8008 | Reach Layer, VoicERA bridge (loopback only) |
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
- **Memory.** Give Docker **at least 10 GiB**. Measured after one conversation, with both stacks up:

  | Stack | Containers | Memory |
  |---|---|---|
  | AI Diffusion | 16 | 1.27 GiB |
  | Signals, with the search profile | 9 | 6.8 GiB, of which the embedding server is 5.57 GiB (amd64, emulated on Apple Silicon) |
  | Total | 25 | 8.1 GiB |

- **Disk.** Plan for about 30 GiB of images and build cache for both stacks. The search profile's embedding image is about 12 GiB, and the AI Diffusion build adds about 15 GiB including cache.
- **Port 2742 belongs to the Signals container.** If you ever ran the Signals API from source (Track B), make sure that process is gone. This should list only Docker:

  ```bash
  lsof -nP -iTCP:2742 -sTCP:LISTEN
  ```

## 3. Get the code

Clone the `deploy/voicera-vm` branch:

```bash
git clone -b deploy/voicera-vm https://github.com/Blue-Dots-Economy/ai-diffusion-dpg.git
```

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

The raw `sk_signals_…` key is printed **only on the first run**; Signals keeps only its hash. Running the command again is safe: it prints the same `org_id` every time, and on later runs the key line reads `apikey: (existing …)` instead of a key. So if you already ran it for *Adding search*, expect that line, take the `org_id` from the output, and reuse the key you saved then: it is the `SIGNALS_SEARCH_API_KEY` value in `local-setup/.env.search`. If the key is lost, reset Signals and mint a new one ([step 10](#10-stop-reset-and-clean-up)).

The same key serves the agent as `BLUE_DOTS_API_KEY` and `BLUE_DOTS_SEARCH_API_KEY`, and the `org_id` becomes `BLUE_DOTS_ORG_ID`.

### Seed one job

The conversation in step 7 asks for electrician work in Lucknow, so seed one matching job. Save this as `job.json`:

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
DPG_IMAGE_TAG=<commit>
X
echo "REACH_SESSION_SECRET=$(openssl rand -hex 32)" >> .env
echo "GOOGLE_CLIENT_ID=local-dummy.apps.googleusercontent.com" >> .env
git check-ignore -v .env
```

`BLUE_DOTS_API_KEY` and `BLUE_DOTS_SEARCH_API_KEY` are both the `sk_signals_…` key from step 4. `DPG_IMAGE_TAG` is the tag you build with in step 6: use your checkout's short commit (`git rev-parse --short HEAD`). The heredoc is unquoted on purpose, so `$(openssl rand -hex 32)` runs and writes a random secret.

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
| `REACH_SESSION_SECRET`, `GOOGLE_CLIENT_ID` | The web channel will not start without them, because the framework turns on Google sign-in for web chat. The dummy client ID lets it start; see [step 8](#8-optional-the-web-chat). |

**Optional, not needed for this guide**

| Variables | What they are for |
|---|---|
| `HITL_WEBHOOK_URL`, `HITL_WEBHOOK_SECRET` | Human handoff to a receiver you run. Blue Dots ships with handoff off (`human_handoff: none`), and the local compose file does not pass them. |
| `DISCORD_WEBHOOK_CRITICAL`, `DISCORD_WEBHOOK_WARNING`, `DISCORD_WEBHOOK_INFO` | Grafana alert routing, one Discord webhook per severity. Without them, alerts go to a placeholder that delivers nowhere. |
| `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN`, `VOBIZ_FROM_NUMBER`, `RAYA_API_KEY`, `PUBLIC_URL`, `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` | The telephony voice channel (port 8006): the Vobiz telephony account, the speech provider key and a public URL for call webhooks. This guide does not start the voice channel. |

### Port clashes with the Signals stack

Both stacks want two of the same host ports. Keycloak and dev-kit both use 8080, and signals-search and Loki both use 3100. The file `automation/docker/local-signals.override.yml` resolves this. You add it to every compose command in this guide, and it:

- publishes dev-kit on host port 8081 and Loki on host port 3101;
- points the Knowledge Engine's dev-kit callback at `http://host.docker.internal:8081`;
- lets Action Gateway reach the host as `host.docker.internal`;
- publishes the VoicERA bridge on `127.0.0.1:8008`, so you can test it with `curl`;
- mounts the bridge's framework defaults where the bridge reads them.

Nothing else collides with the Signals ports (2742, 3100, 5173, 5432, 5555, 8025, 8080).

## 6. Build and start

All commands in this step run from `ai-diffusion-dpg/automation/docker`.

### Build the images

The stack runs from `docker-compose.dev.yml`, which pulls `ghcr.io/blue-dots-economy/ai-diffusion-dpg/<block>:${DPG_IMAGE_TAG}` and has no `build:` sections. So you build the images with `docker-compose.yml`, which tags them with `${GIT_SHA}` under the same names, and then start the dev file with `DPG_IMAGE_TAG` set to the same value. Docker finds the local images and pulls nothing. Use the same `<commit>` you set as `DPG_IMAGE_TAG` in `.env`; any value works as long as `GIT_SHA` and `DPG_IMAGE_TAG` match.

```bash
GIT_SHA=<commit> docker compose -f docker-compose.yml build \
    action_gateway agent_core knowledge_engine memory_layer observability_layer \
    trust_layer reach_layer_web reach_layer_bridge dev_kit
```

The verified run built all nine images in 147 seconds. Check that they are there:

```bash
docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep ai-diffusion
```

```text
ghcr.io/blue-dots-economy/ai-diffusion-dpg/knowledge-engine:0a506cf 2.9GB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/dev-kit:0a506cf 501MB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/reach-layer-web:0a506cf 274MB
ghcr.io/blue-dots-economy/ai-diffusion-dpg/agent-core:0a506cf 316MB
...
```

### Start the stack

With the Signals stack running:

```bash
export COMPOSE_PROJECT_NAME=dpg-local
COMPOSE="docker compose -f docker-compose.dev.yml -f local-signals.override.yml"
CORE="redis memgraph action_gateway knowledge_engine memory_layer trust_layer \
        observability_layer agent_core reach_layer_web reach_layer_bridge dev_kit \
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
reach_layer_web       Up 49 seconds (healthy)       0.0.0.0:8005->8005/tcp
...
```

`COMPOSE` and `CORE` are shell variables, so define them again in any new terminal.

## 7. Verify

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

The channels on the host:

```bash
curl -s localhost:8005/health
curl -s localhost:8008/health
```

Both return `{"status":"ok"}`. Then check that Action Gateway can reach your local Signals. Signals answers on `/health/ready`, not `/health`:

```bash
docker exec action_gateway python3 -c "import urllib.request;r=urllib.request.urlopen('http://host.docker.internal:2742/health/ready',timeout=5);print(r.status,r.read().decode())"
```

```text
200 {"status":"ready"}
```

### A conversation through the bridge

The VoicERA bridge speaks the OpenAI chat-completions format and streams the reply. Each turn is one request, and the bridge reads only the newest `user` message. Keep `caller_phone` and `call_id` the same for the whole call; the caller's phone is their identity.

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

:::caution[City matching on a local Signals]
On a stock local Signals, the job's city (`jobProviderLocation`) is a private field. Search returns it masked, as `L***`, and does not use it for ranking. So city matches are unreliable locally: a search for electrician jobs in another city can still rank the Lucknow job first. The conversation above finds the right job because there is only one, and its company name contains "Lucknow". This is tracked in [ai-diffusion-dpg#441](https://github.com/Blue-Dots-Economy/ai-diffusion-dpg/issues/441).
:::

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

One `apply` row: from the seeker profile the call created (`source_item_id`) to the job you seeded (`target_item_id`), performed by the service organisation. The new profile is live, with the age and trade from the call:

```bash
docker exec signals-postgres psql -U postgres -d postgresdb -c \
    "SELECT item_id, lifecycle_status, item_state->>'name' name, item_state->>'location' loc, item_state->>'age' age,
            item_state->>'nameOfJobRolesInterestedIn' trade FROM items WHERE item_domain='seeker';"
```

```text
 660b50b5-03bc-4fce-b54c-6cd81e239065 | live | र*** | L*** | 28 | Electrician
```

## 8. Optional: the web chat

The web channel on `http://localhost:8005` starts and passes its health check, but it is **not** part of the verified path. The framework turns on Google sign-in for web chat, and Blue Dots keeps it on, so `POST /chat` needs a session from a real Google sign-in:

```bash
curl -s localhost:8005/app-config
```

```text
{"auth":{"enabled":true,"google_client_id":"local-dummy.apps.googleusercontent.com"}}
```

With the dummy client ID from step 5, `/chat` returns `401 {"detail":{"reason":"missing"}}`. To use web chat, set `REACH_SESSION_SECRET` and set `GOOGLE_CLIENT_ID` to the client ID of a real Google OAuth client that allows `http://localhost:8005`, then restart `reach_layer_web`.

## 9. Common problems

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
| `reach_layer_web` is unhealthy: `RuntimeError: auth.enabled is true but REACH_SESSION_SECRET env var is not set` | Web chat has Google sign-in on, and needs its secrets. | Add `REACH_SESSION_SECRET` and `GOOGLE_CLIENT_ID` to `.env` (step 5). |
| The agent offers a job from the wrong city | On a stock local Signals the job's city is private and not used for ranking. | See [City matching on a local Signals](#a-conversation-through-the-bridge). |
| The build stops with the disk full | Both stacks need about 30 GiB of images and build cache. | Free disk space, then build again. |

## 10. Stop, reset and clean up

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
sed -i '' "s|^SIGNALS_SEARCH_API_KEY=.*|SIGNALS_SEARCH_API_KEY=<your key>|" .env.search
docker compose --profile keycloak --profile search up -d
```

Then seed the job again (step 4) and update the `BLUE_DOTS_API_KEY`, `BLUE_DOTS_SEARCH_API_KEY` and `BLUE_DOTS_ORG_ID` lines in the AI Diffusion `.env`.

Both commands leave the images in place, so the next start needs no build.

## Read next

- [AI Diffusion DPG architecture](/core-concepts/architecture/ai-diffusion-dpg/): the blocks, one turn, and the design principles.
- [Configuring an AI Diffusion use case](/core-concepts/architecture/ai-diffusion-configuration/): the configuration layers, and what you write for your own use case.

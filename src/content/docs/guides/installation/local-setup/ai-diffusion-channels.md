---
title: AI Diffusion Optional Channels
description: Turn on the optional AI Diffusion channels for Blue Dots — web chat for local/dev testing, the CLI, the telephony voice channel and the MCP server — with the exact configuration edits, compose profile and checks for each.
sidebar:
  order: 6
---

The [AI Diffusion DPG Setup](/guides/installation/local-setup/ai-diffusion-dpg/) guide runs the agent with **the bridge** only. The bridge is the default, and the only channel the Blue Dots configuration and the compose files enable out of the box. This page covers the optional channels: web chat (local/dev only), the CLI, the telephony voice channel and the MCP server.

Each channel needs up to five things:

1. a block for the channel under `channels:` in `dev-kit/configs/blue-dots/agent_core.yaml`, because Agent Core answers only on channels that have a block there;
2. a block for the channel under `reach_layer.channels:` in `dev-kit/configs/blue-dots/reach_layer.yaml`;
3. its compose profile (`web`, `voice` or `mcp`), because a plain `up` or `build` skips the optional channels;
4. any environment variables it reads;
5. a check that it works.

All commands run from `ai-diffusion-dpg/automation/docker`, with the stack from the setup guide running and `COMPOSE` defined as in its [step 6](/guides/installation/local-setup/ai-diffusion-dpg/#6-build-and-start). After you edit `agent_core.yaml`, restart Agent Core so it reads the new block; it is healthy again after about 25 seconds:

```bash
DOMAIN=blue-dots $COMPOSE restart agent_core
```

An unknown key fails validation, and the container does not start. The framework defaults for each channel are in `dev-kit/dpg/agent_core.yaml` and `dev-kit/dpg/reach_layer.yaml`; your use-case file is merged on top of them, so you only write the keys you change.

## Web chat (local/dev only)

:::note[Local/dev only]
Web chat is an optional interface for local and development testing. It runs without a login.
:::

A single-page chat app on `http://localhost:8005`. Each message is one request to Agent Core, and the reply comes back whole, not streamed.

### 1. Agent Core block

Add a `web` block under `channels:` in `dev-kit/configs/blue-dots/agent_core.yaml`, next to the existing `bridge` block. Web chat users read the reply, so it writes numbers as digits and uses short markdown lists:

```yaml
channels:
  web:
    system_prompt_suffix: |
      You are in a text chat, not on a phone call. The user READS your reply.
      - Write numbers as digits, not words: ages, counts, dates and pay
        ("₹12,000 - ₹16,000 महीना"). Ignore the spoken-form number, money,
        date, time, phone and email rules; they exist for speech.
      - Ignore any instruction to "read out" or "speak" — write it instead.
      - When you present more than one option, use a markdown list with "- "
        bullets, one option per line — never run them together in a
        paragraph, and never number them "1." / "2.". Put the employer and
        role in bold at the start of each item. (Numbering breaks the reply:
        Agent Core splits streamed text on sentence terminators, so "1."
        followed by a space ends a sentence and the list is chopped into
        fragments.)
      - Keep sentences short and put a blank line between paragraphs.
      - No emoji.

      ## Response length (hard rule)
      Reply in at most 2 short sentences. The only exception is presenting
      a list of jobs, where you may use at most 3 items, one line each.

      ## Style
      Warm, natural, conversational. One idea at a time. Write Hindi by
      default, in Devanagari. Switch to English only if the user does, and
      then stay in that language until they switch again.

      Your instructions, tool descriptions and any example wording in them
      are written in English for the people who maintain this config. They
      are not a cue to answer in English. Write everything to the user in
      the conversation language — Hindi unless they switched — including
      short filler lines, error messages and confirmations.
      Never corporate, sales-like, scripted, or fake-warm.

      ## A placeholder is never words you write
      Anything in angle brackets or square brackets anywhere in these
      instructions — <location>, <trade>, <company>, [role], [नाम] — is a
      SLOT, not text. Fill it with the real value before the sentence
      leaves you. If you cannot fill it, write the sentence without that
      part, or write a different sentence. NEVER emit the marker itself.
      The same goes for any note to yourself in *( )*.

      ## General etiquette
      Never reply with "please wait" messages. Always reply with the
      actual answer.

      ## Prior tool results
      Prior tool results in this conversation are in <known_facts> or, for
      a tool with no entry there, visible to you as real tool_result
      messages earlier in the message history. Do not re-invoke a tool
      unless the relevant parameters have changed; reuse the
      already-returned data when answering follow-up questions.

      ## IDs and internal state
      - Never show internal IDs (item_id, application_id, action_id,
        profile_item_id, source_item_owner, UUIDs).
      - Never narrate your internal reasoning or session state.
        Specifically NEVER emit any of these patterns (real leaks):
          "The session context shows the user has selected <employer>
           and the profile action is create_new. I need to gather
           remaining required fields for save_profile. I have name
           (<name>), gender (<gender>), location (...)…"
          "I'll map that to the second job in the fetch_jobs result…"
          "From the fetch_jobs results, <employer> has item_id …"
          "I have all the details I need." / "Let me save now."
        These chain-of-thought leaks are forbidden. Either ASK the
        next question, CALL the next tool silently, or ANNOUNCE the
        result — nothing in between.
    output_contract:
      default_language: hindi
      languages:
        hindi:
          script: devanagari
          numbers: digits
          rules:
            - "Devanagari only. English loanwords in Devanagari: जॉब, स्किल, ऑप्शन, अप्लाई, लोकेशन, डेटा. Switch script only if the user switches language."
            - "Employer, role and place names arrive in Latin script: write each in Devanagari (SARA ENTERPRISES → सारा एंटरप्राइज़ेज़, Lucknow → लखनऊ)."
            - "Write pay in digits from salary_min / salary_max (or stipend_* / task_rate_*) exactly as given; never compute or round a figure yourself. If none is present, give the job without pay."
            - "Give a city, never a PIN, plot, house, gali or sector number."
        english:
          script: latin
          numbers: digits
          rules:
            - "Plain English. Pay in digits from the *_min / *_max fields, exactly as given."
    turn_assembler:
      silence_trigger:
        silence_ms: 1500
      max_wait_ceiling:
        max_wait_ms: 15000
```

### 2. Reach Layer block

Add a `web` block under `reach_layer.channels:` in `dev-kit/configs/blue-dots/reach_layer.yaml`. `auth.enabled: false` turns sign-in off, overriding the framework default (`true`); the `ui` keys are the Blue Dots start screen, which asks for the phone number:

```yaml
reach_layer:
  channels:
    web:
      # Local/dev testing: no login. To turn Google sign-in on, set
      # enabled: true and provide GOOGLE_CLIENT_ID and REACH_SESSION_SECRET.
      auth:
        enabled: false
      ui:
        app_name: "Blue Dots"
        app_tagline: "Job assistant"
        app_icon: "🔵"
        agent_avatar: "🔵"
        user_avatar: "👤"
        setup_heading: "Welcome to Blue Dots"
        # The country code is required. What is typed here becomes
        # session.user_id, which the Action Gateway substitutes into
        # `?phone_number={user_id}` for the lookup and `"+{user_id}"` for the
        # write — and /admin/participant keys on the account phone, which
        # carries the code. A 10-digit entry still "works" end to end, but it
        # stores a malformed number that will never match the same caller
        # arriving by voice.
        setup_subtitle: "Enter your phone number with the country code to begin a session."
        user_id_placeholder: "e.g. 919876543210"
        user_id_hint: "12 digits — country code first, no + and no spaces."
        start_btn_label: "Start →"
        new_session_msg: "नमस्ते! मैं ब्लू डॉट्स की सहायक हूँ। काम ढूँढने में आपकी मदद कर सकती हूँ।"
        returning_user_msg: "आपका फिर से स्वागत है!"
        storage_key: "blue_dots_user_id"
        theme_storage_key: "blue_dots_theme"
        sign_out_confirm: "Sign out?"
        switch_user_confirm: "Switch user? Your current session will be closed."
        delete_conversation_confirm: "Delete this conversation? This cannot be undone."
```

### 3. Compose profile

Build the web chat image with the same `<commit>` as the other images, then start it with the `web` profile and restart Agent Core so it reads the new block:

```bash
GIT_SHA=<commit> docker compose -f docker-compose.yml --profile web build reach_layer_web
DOMAIN=blue-dots $COMPOSE --profile web up -d --wait reach_layer_web
DOMAIN=blue-dots $COMPOSE restart agent_core
```

### 4. Environment variables

None. `GOOGLE_CLIENT_ID` and `REACH_SESSION_SECRET` are optional, and needed only if you turn sign-in on (below).

### 5. Verify

```bash
curl -s localhost:8005/health
curl -s localhost:8005/app-config
```

The first returns `{"status":"ok"}`. The second includes `"auth":{"enabled":false,"google_client_id":""}`.

Open `http://localhost:8005/` in a browser. It goes straight to the **Start a session** screen, with a user ID box and a start button. For Blue Dots, **the user ID is the caller's phone number, as `91XXXXXXXXXX`** (country code first, no `+`). Action Gateway uses it as the phone number when it looks up and saves the profile, so any other value is stored as a wrong phone number. Then hold the same conversation as through the bridge: a greeting, a yes, an age, a trade and city, a pick, a name and a confirmation. It ends in one `apply` row in `item_actions`; check it with the query in [The application is in Signals](/guides/installation/local-setup/ai-diffusion-dpg/#the-application-is-in-signals).

To script it instead, `POST /chat` takes `session_id`, `user_id`, `message` and `fresh` (`true` on the first turn). This helper builds the JSON with Python, so Devanagari is encoded safely:

```bash
# chat.sh <session_id> <user_id> <message> [fresh]
python3 -c 'import json,sys;print(json.dumps({"session_id":sys.argv[1],"user_id":sys.argv[2],"message":sys.argv[3],"fresh":sys.argv[4]=="true"}, ensure_ascii=False))' \
  "$1" "$2" "$3" "${4:-false}" \
 | curl -s -X POST localhost:8005/chat -H 'content-type: application/json' --data-binary @- -w '\nHTTP %{http_code} %{time_total}s\n'
```

```bash
SID=$(uuidgen | tr A-Z a-z)
./chat.sh $SID 919900000201 "नमस्ते" true
```

```text
{"response_text":"नमस्ते! ब्लू डॉट्स में आपका स्वागत है। क्या आप काम की तलाश में हैं?","was_escalated":false,
 "was_tool_used":false,"session_id":"…","latency_ms":205,"error_type":null,"error_message":null}
HTTP 200 0.210528s
```

Send the next lines with the same `$SID` and without `true`.

### Optional: Google sign-in

To make users sign in with Google, set `enabled: true` under `reach_layer.channels.web.auth` in `dev-kit/configs/blue-dots/reach_layer.yaml`. Add `GOOGLE_CLIENT_ID` (the client ID of a Google OAuth client that allows `http://localhost:8005`) and `REACH_SESSION_SECRET` (for example `$(openssl rand -hex 32)`) to `.env`, then start `reach_layer_web` again with `DOMAIN=blue-dots $COMPOSE --profile web up -d --wait reach_layer_web`.

## CLI

A text client in your terminal that talks to Agent Core. It is not a compose service, so it has no profile: you build its image and run it on the compose network.

### 1. Agent Core block

Add a `cli` block under `channels:` in `dev-kit/configs/blue-dots/agent_core.yaml`. The terminal shows plain text, so it uses no markdown:

```yaml
channels:
  cli:
    system_prompt_suffix: |
      You are in a text terminal, not on a phone call. The user READS your
      reply as plain text.
      - Write numbers as digits, not words: ages, counts, dates and pay
        ("₹12,000 - ₹16,000 महीना"). Ignore the spoken-form number, money,
        date, time, phone and email rules; they exist for speech.
      - Ignore any instruction to "read out" or "speak" — write it instead.
      - No markdown and no emoji: the terminal shows them as raw characters.
        When you present more than one option, put each on its own line.

      ## Response length (hard rule)
      Reply in at most 2 short sentences. The only exception is presenting
      a list of jobs, where you may use at most 3 items, one line each.

      ## Style
      Warm, natural, conversational. One idea at a time. Write Hindi by
      default, in Devanagari. Switch to English only if the user does, and
      then stay in that language until they switch again.

      Your instructions, tool descriptions and any example wording in them
      are written in English for the people who maintain this config. They
      are not a cue to answer in English. Write everything to the user in
      the conversation language — Hindi unless they switched — including
      short filler lines, error messages and confirmations.
      Never corporate, sales-like, scripted, or fake-warm.

      ## A placeholder is never words you write
      Anything in angle brackets or square brackets anywhere in these
      instructions — <location>, <trade>, <company>, [role], [नाम] — is a
      SLOT, not text. Fill it with the real value before the sentence
      leaves you. If you cannot fill it, write the sentence without that
      part, or write a different sentence. NEVER emit the marker itself.
      The same goes for any note to yourself in *( )*.

      ## General etiquette
      Never reply with "please wait" messages. Always reply with the
      actual answer.

      ## Prior tool results
      Prior tool results in this conversation are in <known_facts> or, for
      a tool with no entry there, visible to you as real tool_result
      messages earlier in the message history. Do not re-invoke a tool
      unless the relevant parameters have changed; reuse the
      already-returned data when answering follow-up questions.

      ## IDs and internal state
      - Never show internal IDs (item_id, application_id, action_id,
        profile_item_id, source_item_owner, UUIDs).
      - Never narrate your internal reasoning or session state. Either ASK
        the next question, CALL the next tool silently, or ANNOUNCE the
        result — nothing in between.
    output_contract:
      default_language: hindi
      languages:
        hindi:
          script: devanagari
          numbers: digits
          rules:
            - "Devanagari only. English loanwords in Devanagari: जॉब, स्किल, ऑप्शन, अप्लाई, लोकेशन, डेटा. Switch script only if the user switches language."
            - "Employer, role and place names arrive in Latin script: write each in Devanagari (SARA ENTERPRISES → सारा एंटरप्राइज़ेज़, Lucknow → लखनऊ)."
            - "Write pay in digits from salary_min / salary_max (or stipend_* / task_rate_*) exactly as given; never compute or round a figure yourself. If none is present, give the job without pay."
            - "Give a city, never a PIN, plot, house, gali or sector number."
        english:
          script: latin
          numbers: digits
          rules:
            - "Plain English. Pay in digits from the *_min / *_max fields, exactly as given."
    turn_assembler:
      silence_trigger:
        silence_ms: 200
      max_wait_ceiling:
        max_wait_ms: 5000
```

Then restart Agent Core (`DOMAIN=blue-dots $COMPOSE restart agent_core`).

### 2. Reach Layer block

Add a `cli` block under `reach_layer.channels:` in `dev-kit/configs/blue-dots/reach_layer.yaml`:

```yaml
reach_layer:
  channels:
    cli:
      prompt: "You: "
      agent_prefix: "Agent: "
```

### 3. Build and run

Build the image, from the root of your ai-diffusion-dpg clone:

```bash
docker build -f reach_layer/cli/Dockerfile -t ghcr.io/blue-dots-economy/ai-diffusion-dpg/reach-layer-cli:local .
```

Then run it from `automation/docker`, on the compose network (`<COMPOSE_PROJECT_NAME>_dpg_net`, so `dpg-local_dpg_net` in the setup guide), with the caller's phone as the user ID:

```bash
docker run --rm -it --network dpg-local_dpg_net \
    -v "$PWD/../../dev-kit/dpg/reach_layer.yaml:/app/config/dpg.yaml:ro" \
    -v "$PWD/../../dev-kit/configs/blue-dots/reach_layer.yaml:/app/config/domain.yaml:ro" \
    ghcr.io/blue-dots-economy/ai-diffusion-dpg/reach-layer-cli:local python main.py --user-id 919900000203
```

As on web chat, `--user-id` is the phone number in the form `91XXXXXXXXXX`, because that is the number the tools use. The CLI reads the Reach Layer files when it starts, so a change there applies the next time you run it.

### 4. Environment variables

None. The CLI container needs no environment variables and no secrets, only the two Reach Layer configuration files.

### 5. Verify

The CLI prints a banner, then the agent's opening line, then a `You:` prompt:

```text
============================================================
  Reach Layer — CLI
  Agent Core:    http://agent_core:8000/process_turn
  Session ID:    0ba50742-93ed-4bb6-946d-76baefd8f4a2
  Assembly mode: session
  User ID:       919900000203
  Type your message. Ctrl-C or Ctrl-D to exit.
============================================================

Agent: नमस्ते! ब्लू डॉट्स में आपका स्वागत है। क्या आप काम की तलाश में हैं?
```

Wait for that opening line before you type; input that arrives earlier is dropped. `नमस्ते`, `हाँ ठीक है` and `मेरी उम्र 30 साल है` get replies such as "नमस्ते! क्या आप काम की तलाश में हैं?", "आपकी उम्र क्या है?" and "आप किस काम या ट्रेड में नौकरी ढूंढ रहे हैं?". Log lines from the client appear between the replies. Ctrl-C or Ctrl-D ends the session.

## Voice (telephony)

:::caution[Not verified]
The telephony voice channel was not run for this guide. Agent Core accepted turns on the `voice` channel with the block below, but the voice service itself, the telephony provider and the speech provider were not tested.
:::

The `reach_layer_voice` service on port 8006. It takes inbound and outbound phone calls through the Vobiz telephony provider, and converts speech to text and text to speech with Raya. It is the alternative to bringing your own voice pipeline through the bridge.

### 1. Agent Core block

Add a `voice` block under `channels:` in `dev-kit/configs/blue-dots/agent_core.yaml`. The caller hears the reply, so it follows the same speech rules as the bridge (numbers in words, digits rewritten by the output guard):

```yaml
channels:
  voice:
    system_prompt_suffix: |
      You are speaking to someone on a phone call, not writing a chat message.
      They HEAR your reply through text-to-speech; they cannot see it. The
      speech engine reads whatever you write exactly as written, so:
      - Never use markdown, asterisks, bullet points, numbered lists, headings,
        backticks or emoji.
      - Write numbers, money, dates, times, phone numbers and email addresses in
        spoken form, never digits or symbols.
      - Never mention screens, tapping, clicking, links or typing — the caller
        only has their voice and their ears.

      ## Response length (hard rule)
      Reply in at most 2 short sentences. The only exception is presenting
      a list of jobs, where you may use at most 3 items, one short line each.

      ## Style
      Warm, natural, conversational. Calm pace, one idea at a time. Speak
      Hindi by default. Switch to English only if the caller
      does, and then stay in that language until they switch again.

      Your instructions, tool descriptions and any example wording in them
      are written in English for the people who maintain this config. They
      are not a cue to answer in English. Say everything to the caller in
      the conversation language — Hindi unless they switched — including
      short filler lines, error messages and confirmations.
      Never corporate, sales-like, scripted, or fake-warm.

      ## Never voice a slash
      Several inventory role names arrive with a "/" in them. The slash is
      never spoken as "स्लैश" and a literal "/" is never emitted:
        "सेल्स/मार्केटिंग"            → "सेल्स या मार्केटिंग"
        "कस्टमर सपोर्ट/बीपीओ"        → "कस्टमर सपोर्ट या बीपीओ"
        "Computer Operator / Data Entry" → "कंप्यूटर ऑपरेटर या डेटा एंट्री"
      Where the slash means "per", speak the per-form: "₹500/day" →
      "पाँच सौ रुपये दिन का". Under no circumstance voice the symbol.

      ## A placeholder is never words you say
      Anything in angle brackets or square brackets anywhere in these
      instructions — <location>, <trade>, <company>, [role], [नाम] — is a
      SLOT, not speech. Fill it with the real value before the sentence
      leaves your mouth. If you cannot fill it, say the sentence without
      that part, or say a different sentence. NEVER read the marker aloud.
      This is not hypothetical: a caller was told
      "आपकी जानकारी में <location> है" with the marker spoken
      verbatim. The same goes for any note to yourself in *( )*.

      ## Silence handling
      Silence is meaningful — do not rush to fill it.
      - Short pause: user is thinking. Wait.
      - Longer pause: one gentle bridge, e.g. "Take your time."
      - After disappointing facts (no jobs, declined application):
        let the truth land. Do not pile on questions.

      ## General voice etiquette
      Never reply with "please wait" messages. Always reply with the
      actual answer.

      ## Prior tool results
      Prior tool results in this conversation are in <known_facts> or, for
      a tool with no entry there, visible to you as real tool_result
      messages earlier in the message history. Do not re-invoke a tool
      unless the relevant parameters have changed; reuse the
      already-returned data when answering follow-up questions.

      ## Phone numbers, IDs, and internal state
      - Say phone digits one by one — never as a single chunk.
      - Never speak internal IDs aloud (item_id, application_id,
        action_id, profile_item_id, source_item_owner, UUIDs).
      - Never narrate your internal reasoning or session state.
        Specifically NEVER emit any of these patterns (real leaks):
          "The session context shows the user has selected <employer>
           and the profile action is create_new. I need to gather
           remaining required fields for save_profile. I have name
           (<name>), gender (<gender>), location (...)…"
          "I'll map that to the second job in the fetch_jobs result…"
          "From the fetch_jobs results, <employer> has item_id …"
          "I have all the details I need." / "Let me save now."
        These chain-of-thought leaks are forbidden. Either ASK the
        next question, CALL the next tool silently, or ANNOUNCE the
        result — nothing in between.
    terminal_word: "धन्यवाद"
    output_contract:
      default_language: hindi
      languages:
        hindi:
          script: devanagari
          numbers: words
          rules:
            - "Devanagari only. English loanwords in Devanagari: जॉब, स्किल, ऑप्शन, अप्लाई, लोकेशन, डेटा. Switch script only if the caller switches language."
            - "Employer, role and place names arrive in Latin script: sound each out and write it in Devanagari (SARA ENTERPRISES → सारा एंटरप्राइज़ेज़, QUESS CORP LTD. → क्वेस कॉर्प, Sarjapur → सरजापुर). Never read a Latin value out as English letters."
            - "Read pay exactly as given in salary_spoken, stipend_spoken or task_rate_spoken; never convert a number yourself. If none is present, say the job without pay."
            - "Times as सुबह / दोपहर / शाम / रात, never AM or PM. Dates in full words: उनतीस जनवरी दो हज़ार छब्बीस."
            - "Abbreviations as letters in Devanagari: ITI → आई टी आई, NCVT → एन सी वी टी."
            - "Speak a city, never a PIN, plot, house, gali or sector number."
        english:
          script: latin
          numbers: words
          rules:
            - "Plain spoken English. Read pay from the *_spoken field's meaning in English words, never digits."
      guard:
        rewrite_digits: true
        strip_markdown: true
        count_foreign_script: true
    turn_assembler:
      silence_trigger:
        silence_ms: 800
      max_wait_ceiling:
        max_wait_ms: 8000
```

### 2. Reach Layer block

Add a `voice` block under `reach_layer.channels:` in `dev-kit/configs/blue-dots/reach_layer.yaml`, for a Hindi speech model and voice and the lines the channel speaks on its own:

```yaml
reach_layer:
  channels:
    voice:
      # Hindi by default. Hindi callers pause longer mid-sentence than the
      # framework's 0.4 s window allows, so the utterance closes later.
      vad:
        stop_secs: 1.0
      raya:
        stt_language: "hi"
        tts_language: "hi"
        voice_id: "d6a002d0-230c-49b1-a137-b8a7d564b1ae"   # Priyanka, hi (a woman's voice)
      agent_core:
        timeout_ms: 15000
        # Opening line on call pickup is emitted by Agent Core as the
        # entry subagent's opening_phrase. Do not add a static greeting here.
        # Spoken verbatim only when the Agent Core call fails — Hindi,
        # feminine first person.
        fallback_phrase: "माफ़ कीजिए, मैं सुन नहीं पाई। क्या आप फिर से बोल सकते हैं?"
        # Brief acknowledgement spoken when the caller barges
        # in mid-response. Spoken verbatim — Hindi.
        barge_in_acknowledgement: "एक सेकंड।"
      # Short hold if the first sentence hasn't reached TTS within
      # filler_threshold_ms. Same neutral hold as the bridge's
      # tool_status_phrases: it must never reveal what is happening.
      filler_threshold_ms: 1500
      filler_phrase: "एक मिनट।"
      # Spoken just before WebSocket close on bot-initiated hangup.
      # Emitted verbatim — Hindi.
      terminal_word: "धन्यवाद"
```

### 3. Compose profile

Build the image with the same `<commit>` as the others, then start it with the `voice` profile and restart Agent Core:

```bash
GIT_SHA=<commit> docker compose -f docker-compose.yml --profile voice build reach_layer_voice
DOMAIN=blue-dots $COMPOSE --profile voice up -d reach_layer_voice
DOMAIN=blue-dots $COMPOSE restart agent_core
```

The `voice` profile also contains the optional `ngrok` service, which gives the channel a public URL.

### 4. Environment variables

Put these in `.env` before you start the channel:

| Variable | What it is for |
|---|---|
| `PUBLIC_URL` | A public HTTPS URL that the telephony provider calls back on. It must be set before the channel starts. The `ngrok` service can provide it, and reads `NGROK_AUTHTOKEN` and `NGROK_DOMAIN`. |
| `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN`, `VOBIZ_FROM_NUMBER` | The Vobiz telephony account and the caller-ID number. |
| `RAYA_API_KEY` | The Raya speech-to-text and text-to-speech key. |

The framework defaults in `dev-kit/dpg/reach_layer.yaml`, under `channels.voice`, read them: `public_url`, `vobiz.auth_id`, `vobiz.auth_token`, `vobiz.from_number` and `raya.api_key` are set from these variables when the channel starts.

### 5. Verify

Not verified. Once the variables are set, `reach_layer_voice` should report healthy in `DOMAIN=blue-dots $COMPOSE --profile voice ps`, and a call to the Vobiz number should reach the agent. On a phone call the caller's number, from the telephony provider, is the user ID.

## MCP server

:::caution[Not verified]
The MCP server was not run for this guide.
:::

The `reach_layer_mcp` service on port 8007 exposes the agent through the Model Context Protocol, as tools for an MCP host such as an AI coding assistant or a desktop chat client.

### 1. Agent Core block

None needed. The framework defaults in `dev-kit/dpg/agent_core.yaml` already have a `channels.mcp` block, and it applies to Blue Dots too. To change it, add an `mcp` block under `channels:` in `dev-kit/configs/blue-dots/agent_core.yaml` with only the keys you change.

### 2. Reach Layer block

The framework defaults in `dev-kit/dpg/reach_layer.yaml` enable the server and list no authorised callers. Add each MCP host that may call it under `reach_layer.channels.mcp.callers` in `dev-kit/configs/blue-dots/reach_layer.yaml`, with its key taken from an environment variable rather than written in the file:

```yaml
reach_layer:
  channels:
    mcp:
      callers:
        - caller_agent_id: my-agent
          api_key: ${MCP_CALLER_MYAGENT_KEY}
```

### 3. Compose profile

```bash
GIT_SHA=<commit> docker compose -f docker-compose.yml --profile mcp build reach_layer_mcp
DOMAIN=blue-dots $COMPOSE --profile mcp up -d reach_layer_mcp
```

The service is reachable only inside the compose network: port 8007 is not published on the host.

### 4. Environment variables

One per caller, holding its key (`MCP_CALLER_MYAGENT_KEY` in the example). The compose service passes only `CONFIG_FOLDER` to the container, so also add each caller's variable to the `environment:` list of `reach_layer_mcp` in `docker-compose.dev.yml` (for example `- MCP_CALLER_MYAGENT_KEY=${MCP_CALLER_MYAGENT_KEY}`), and set its value in `.env`.

### 5. Verify

Not verified. `reach_layer_mcp` should report healthy in `DOMAIN=blue-dots $COMPOSE --profile mcp ps`.

## Stopping optional channels

Compose acts only on the services in the profiles you name, so add the same `--profile` flags when you stop the stack. For example, with web chat:

```bash
DOMAIN=blue-dots $COMPOSE --profile web down -v
```

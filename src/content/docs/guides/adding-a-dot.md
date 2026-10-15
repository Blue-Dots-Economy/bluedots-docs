---
title: Adding a new domain
description: The files and settings to add for a new domain in Signals-DPG, using the Yellow Dot (education) domain as the worked example.
sidebar:
  attrs:
    class: bd-changed
  order: 10
changed_sections:
  - _top
  - before-you-start
  - 1-create-the-domain-folder-and-networkjson
  - 2-add-the-participant-type-schemas
  - 3-set-the-domain-id-and-served_domains
  - 4-add-the-brand-and-ui-theme
  - 5-add-the-consent-and-messages-files
  - 6-add-the-voice-prompts
  - check-the-new-domain
  - related
---

Each domain gives its blue dots a colour, so a new colour means a new domain. You add it with configuration files in the Signals-DPG repo and a few settings in `.env`. This guide uses the Yellow Dot (education) domain as the example. Its participant types are student and tutor or counsellor, and its one action is connect.

Read [Domains, participant types and instances](/core-concepts/networks-domains-instances/) and [The schema-driven model](/core-concepts/technical/schema-driven-model/) first. This page lists what to do; those pages explain the terms.

## Before you start

- A local Signals-DPG setup that runs the default domain. Follow `SETUP.md` in the Signals-DPG repo.
- The participant types in the new domain, who asks and who offers, and the fields each participant type fills in.

## 1. Create the domain folder and `network.json`

Each domain is defined in a `network.json` file (the code calls a domain a *network*). This file is the domain's **minimum standard**: the list of fields every blue dot in that domain must have, so any organisation that uses it can share and find blue dots with others. Start from the published minimum standard closest to your domain:

- [Blue (jobs)](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/blue_dot/network.json)
- [Yellow (education)](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/yellow_dot/network.json)
- [Purple (disability)](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/purple_dot/network.json)
- [Orange (tourism)](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/orange_dot/network.json)

Pink, Green and Brown have no minimum standard yet.

1. Add a folder under `examples/schemas/`. Name it after the new domain, in snake_case.
2. Copy the closest `network.json` from the list above into the folder. Keep the fields that fit your domain as they are, then edit or add the rest.

```text
examples/schemas/
  blue_dot/
  orange_dot/
  purple_dot/
  yellow_dot/
    network.json
    consent.json
    messages.properties
```

The top-level fields of `network.json` are:

| Field | What it holds |
|---|---|
| `id` | The domain's id. Other files and settings refer to the domain by this value. |
| `display_name`, `description` | The name and one-line description shown to people. |
| `schema_standard` | The JSON Schema draft the item schemas use. |
| `domains` | One entry per participant type (step 2). The code calls a participant type a *domain*. |
| `instances` | The running copies of the software that serve each participant type. Each entry has `instance_name`, `instance_url` and `domain_id`. For local work, point `instance_url` at `http://localhost:2742`. |
| `actions` | What one participant type can send another, for example `connect`. Each interaction names `from_network`, `from_domain`, `to_network` and `to_domain`. Leave it as `{}` for a listing-only domain such as Orange. |
| `dashboard_buckets` | The labels used on dashboards for each status. |

Use the same value for the folder name and the `id`. The UI picks colours by folder name and the API uses the `id`, so a mismatch leaves the UI on the default colours. The Yellow example folder does not follow this, so check its colours after you switch to it.

## 2. Add the participant type schemas

1. Add one entry to `domains` for each participant type. For Yellow these are student and tutor or counsellor.
2. Give each entry an `id`, a `description` and an `item_schemas` block.
3. Key each item schema by its type and version, for example `profile_1.0`. The schema itself is JSON Schema.

Each entry also sets how it appears and when a profile goes live:

| Field | What it does |
|---|---|
| `contact_fields` | Which schema fields hold the name, phone and email. |
| `go_live_required` | What must be complete before the profile can be found. |
| `status_rules` | How a profile moves between statuses such as new, active, at risk and inactive. |
| `card`, `dashboard_tiles` | What shows on cards and dashboards. |
| `profile_completion_prompt` | The heading and text that ask the person to finish their profile. |

Mark fields that must stay private with `"private": true`, as Yellow does for phone number and email. Mark the field that holds the place with `"location": "primary"`.

## 3. Set the domain id and `SERVED_DOMAINS`

Point your instance at the new domain. Change these lines in the root `.env`, then restart `pnpm dev:api` and `pnpm dev:ui`.

```dotenv
NETWORK_CONFIG_LOCAL_FILE="../../examples/schemas/yellow_dot/network.json"
SERVED_DOMAINS="<network-id>/student"
VITE_NETWORK_ID=<network-id>
```

- `<network-id>` is the domain's id set in its `network.json`. For Yellow it differs from the folder name.
- `SERVED_DOMAINS` lists `<network-id>/<domain-id>` pairs, separated by commas. Each `<domain-id>` is a participant type. Add the tutor or counsellor participant type to serve both from one instance.
- The path must start with `../../`, because the API resolves it from `apps/api/`.

Check that the API loaded the schemas:

```bash
curl -s http://localhost:2742/api/v1/network/schemas | head
```

## 4. Add the brand and UI theme

The colours, logo and sign-in text are separate from the domain's `network.json`. A domain works without them, but looks like the default domain.

1. **Colours.** Add a `brand.json` beside `network.json`. Put colour overrides in a `theme` block. The UI reads `brand.json` files at build time and keys the colours by folder name.
2. **Logos.** Add PNG files to `apps/ui/public/brand/<network-kebab>/`, where the folder is the domain name in kebab-case (`yellow_dot` becomes `yellow-dot`). `logo.png` and `logo-light.png` are required.
3. **Sign-in text.** The tagline and portal label come from an entry in `apps/ui/src/theme/network-themes.ts`, keyed by domain id. Without one, the UI shows the Blue Dot (jobs) text.

```text
examples/schemas/yellow_dot/brand.json
apps/ui/public/brand/yellow-dot/
  logo.png
  logo-light.png
```

A brand is a skin for one deployment of an existing domain. To add one, create `examples/schemas/<network>/<brand-slug>/brand.json` with only the fields that differ. The full field list is in `apps/ui/public/brand/README.md` in the Signals-DPG repo. See also [Customisation & Branding](/guides/customisation/).

## 5. Add the consent and messages files

1. **`consent.json`.** Add it beside `network.json`. It holds the terms, privacy and profile-creation documents, and one consent statement for each action and stage. Yellow has statements for `connect` at `initiate` and `accept`. Each document has a `current_version` and a list of `versions`. The API records the version people accept, so add a new version instead of editing an old one.
2. **`messages.properties`.** Add it beside `network.json` to change the email text for this domain, for example the welcome email subject. List only the keys you want to change. The full key list is in `apps/api/src/notifications/email/messages.default.properties`.

Write `__SUPPORT_EMAIL__` where the consent text needs a support address. The API replaces it with the value of `CONSENT_SUPPORT_EMAIL`.

A brand can override both files. Put the override in the brand's sub-folder, for example `examples/schemas/<network>/<brand-slug>/consent.json`.

## 6. Add the voice prompts

If people will register or update their profile by phone call, add prompts for the new domain to the [AI-Agent-Prompts](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts) repo. Prompts are grouped by domain at the top of the repo, then by agent.

1. Add one agent for each side, for example one for students and one for tutors or counsellors.
2. Follow the file layout on [AI Voice Agent Prompts](/guides/voice-ai-prompts/): conversation prompt per language, memory, and output.
3. Make the output fields match the participant type schemas from step 2.

## Check the new domain

1. Open the UI at `http://localhost:5173` and sign in.
2. Check the colours, logo and sign-in text.
3. Create a profile for each participant type and accept the consent.
4. Send a connect request from one participant type to the other, and accept it.

## Related

- [Domains, participant types and instances](/core-concepts/networks-domains-instances/): the domains that exist today and their status.
- [The schema-driven model](/core-concepts/technical/schema-driven-model/): how schemas drive forms, cards and validation.
- [Configuration](/guides/configuration/): where other settings live.

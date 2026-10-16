---
title: Set Up the Seeker Voice Agent
description: Set up KKB, the job-seeker voice agent, by hand on a voice AI platform. Create the agent, paste the prompts, add the nine tools that call your Blue Dots instance, and test it with a call.
sidebar:
  order: 8
---

This guide sets up **KKB** (काम की बात), the voice agent that talks to job seekers, against your own Blue Dots instance. It uses the [Raya](https://console.getraya.app) voice AI platform from LitWiz Labs as the example. On another platform the steps are the same, but the screens and field names differ.

Setting it up by hand takes about an hour. The Prompt Tuner skills in the [AI-Agent-Prompts](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/tree/main/Prompt%20Tuner) repository can do the same in one step. Doing it once by hand shows you what each piece does.

For how the prompt files are organised and the other published agents, see [AI Voice Agent Prompts](/deploy/agents/voice-agent-prompts/).

## Before you start

| You need | Where it comes from |
|---|---|
| A login to the voice platform's console | Your voice AI provider (for Raya, LitWiz Labs) |
| Your instance's API base URL | The Signals deployment you set up in [Steps of Deployment](/deploy/steps/) |
| An API key and the acting organisation id | Created by the deployment scripts when the instance goes up. Keep both private. |
| A phone number to test with | One of your own. Never use a real user's number. |
| Some jobs and services in the instance | Sample data you have uploaded. The agent can only offer what your instance holds. |

The API key goes in the `x-api-key` header and the organisation id in `x-acting-org-id`. This is the service key that integrating DPGs use to call Signals. The `/api/v1/admin` routes also need the organisation id. See the [Signals DPG API reference](/api/signals-dpg/), for example [the participant lookup](/api/signals-dpg/operations/apiv1adminparticipant/get/).

## Step 1: create the agent

In the console, create a new agent with these settings:

| Setting | Value | Why |
|---|---|---|
| Name | For example, KKB Hindi (your district) | |
| Language | Hindi (Kannada for the Kannada prompt) | Must match the language the prompt speaks |
| Voice | A Hindi voice | |
| Allow interruption | On | Callers talk over the agent; it should stop and listen |
| Minimum caller speech to interrupt | 0.7 s | Ignores coughs and short noises |
| Silence after caller speech | 0.4 s | How long the agent waits before it replies |
| Silence before a nudge | 5 s | Then it checks the caller is still there |
| Maximum call length | 15 min | |
| Say hello first | Off | The prompt opens with its own audio check |

## Step 2: paste the prompts

1. **Instructions (the conversation prompt).** Copy the whole file and paste it unchanged:
   - Hindi: [KKB Slim Hindi Signals.md](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/blob/main/Blue%20Dots/KKB-Slim/KKB%20Slim%20Hindi%20Signals.md)
   - Kannada: [KKB Slim Kannada Signals.md](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/blob/main/Blue%20Dots/KKB-Slim/KKB%20Slim%20Kannada%20Signals.md)
2. **Memory.** Turn memory on and paste [KKB Memory.md](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/blob/main/Blue%20Dots/KKB/KKB%20Memory.md) as the memory prompt. It keeps a short note about each caller for their next call.
3. **Output.** Paste [KKB Slim Output.md](https://github.com/Blue-Dots-Economy/AI-Agent-Prompts/blob/main/Blue%20Dots/KKB-Slim/KKB%20Slim%20Output.md) as the output prompt. It turns each call into structured fields for reporting.

The prompt reads its inputs from call variables. Each call should send:

| Variable | Value |
|---|---|
| `contact_name` | The caller's name |
| `contact_phone` | 12 digits, starting with 91 |
| `country_code` | `91` |
| `location` | The caller's area, if known |
| `contact_memory` | Filled in by the platform from memory |

:::caution[Don't edit the prompt for your first test]
Every rule in the prompt is written in English. Only the lines the agent speaks are in Hindi or Kannada. Change the prompt only after a test call shows you why.
:::

## Step 3: add the nine tools

Each tool is an API call the agent can make during a conversation. For every tool, create an API tool in the console and fill in the fields below, replacing:

- `API_BASE` with your instance's API base URL
- `YOUR_API_KEY` with the instance's API key
- `YOUR_ORG_ID` with the acting organisation id

:::caution[Copy names and descriptions exactly]
The tool **name** and the **parameter names** must match exactly, because the prompt calls the tools by name. The model reads the **description** at the moment it decides whether to call a tool, so paste it in full. Use the copy button on each block.
:::

The payloads use the names from the code. A domain is called a *network* (`"network": "blue_dot"`), and a participant type is called a *domain* (`"domain": "seeker"`). The profile fields in `create_profile` and `update_profile` come from the jobs domain's [minimum standard](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/blue_dot/network.json).

| # | Tool | When the agent calls it |
|---|---|---|
| 1 | [`get_profile`](#1-get_profile) | Find the caller by phone number, at the start of every call. |
| 2 | [`record_consent_new`](#2-record_consent_new) | A NEW caller agrees to the terms: records consent and creates their record with a draft profile. |
| 3 | [`record_consent`](#3-record_consent) | A KNOWN caller agrees to the terms: records consent on their existing profile. |
| 4 | [`create_profile`](#4-create_profile) | Creates a profile for a new caller, only when get_profile found none. |
| 5 | [`update_profile`](#5-update_profile) | Saves details collected during the call: location, education, trade, experience, gender. |
| 6 | [`get_recommended_jobs`](#6-get_recommended_jobs) | Jobs matched to this caller's profile, best first. |
| 7 | [`get_jobs`](#7-get_jobs) | Jobs for a role the caller names, searched by text. |
| 8 | [`apply_job`](#8-apply_job) | Applies the caller to the job they chose. |
| 9 | [`get_services`](#9-get_services) | Training, counselling and placement services: when the caller is not looking for a job, nothing suited, or they need help. |

### 1. get_profile

**When:** Find the caller by phone number, at the start of every call.

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `API_BASE/api/v1/admin/participant` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Get the caller's profile from the database by phone number.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "phone_number"
  ],
  "properties": {
    "phone_number": {
      "type": "string",
      "description": "The caller's mobile number with the 91 country-code prefix and NO plus sign, e.g. 919876543210"
    }
  }
}
```

</details>

No payload: this is a `GET`. The platform sends `phone_number` as a query parameter.

### 2. record_consent_new

**When:** A NEW caller agrees to the terms: records consent and creates their record with a draft profile.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/admin/participant` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`Content-Type: application/json`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Save a NEW caller's spoken consent (terms of use, privacy policy, holding their details) the moment they say yes, when get_profile returned NO seeker item. Creates their record with the consent and a draft seeker profile. Needs the caller's name and an age they said aloud (integer, 18 or over). Never use it when get_profile returned a seeker item (use record_consent with that item_id). Returns the participant: keep the seeker item's item_id and the top-level user_id; later complete that item with update_profile and apply with it, never create_profile. An error is not a refusal: carry on with the call.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "name",
    "age",
    "phone",
    "terms_check"
  ],
  "properties": {
    "age": {
      "type": "integer",
      "description": "The age in years the caller SAID ALOUD this call in answer to the age question. Send as a NUMBER, not a string. Never an estimate, never an example value, never guessed: if they have not said it, ask and wait, and do not call this tool."
    },
    "name": {
      "type": "string",
      "description": "The caller's name: a usable ${contact_name}, or the name they said aloud this call. English / Latin script."
    },
    "phone": {
      "type": "string",
      "description": "The caller's number in the SAME form you sent to get_profile: 12 digits beginning with 91, digits only, no plus sign - e.g. 919876543210. Build it by FORMAT, not by adding: if ${contact_phone} is already 12 digits starting with 91 (outbound calls), send it UNCHANGED and never add another 91; if it is 10 digits (inbound calls), put 91 in front. A number starting 9191 is always wrong - the backend finds users by phone, so a doubled prefix silently creates a separate phantom user."
    },
    "terms_check": {
      "enum": [
        "disclosure-read-and-agreed-this-call",
        "not-read"
      ],
      "type": "string",
      "description": "REQUIRED - answer this before you call the tool. Did you speak the FULL five-element account-and-terms disclosure in THIS call (the account created on Blue Dots from their name and phone, the three purposes, the one-year term, managed by Ekstep Foundation, full terms readable in the app) AND did the caller then agree to THAT question? Only then is the value 'disclosure-read-and-agreed-this-call'. Otherwise the value is 'not-read' - and if it is 'not-read' you must NOT call this tool at all, because there is no consent to record. A caller agreeing to APPLY to a job is NOT agreement to the terms: the apply question shares their details with one employer, this records acceptance of the platform's terms and privacy policy. Recording a consent the caller was never asked for is a fabricated record and is worse than recording nothing."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "age": "{{age}}",
  "name": "{{name}}",
  "domain": "seeker",
  "channel": "voice",
  "network": "blue_dot",
  "item_type": "profile_1.0",
  "compliance": [
    {
      "key": "user_terms",
      "value": true
    },
    {
      "key": "user_privacy",
      "value": true
    },
    {
      "key": "profile_creation",
      "value": true
    }
  ],
  "item_state": {
    "age": "{{age}}",
    "name": "{{name}}",
    "phone": "{{phone}}"
  },
  "phone_number": "+{{phone}}"
}
```

</details>

### 3. record_consent

**When:** A KNOWN caller agrees to the terms: records consent on their existing profile.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/admin/participant` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`Content-Type: application/json`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Record the caller's spoken consent to the TERMS (terms of use, privacy policy, holding their details) on their EXISTING profile. THE FIVE-ELEMENT TERMS DISCLOSURE IS THE ONLY TRIGGER. An apply-consent is NOT it: "shall I apply for this job" shares details with ONE employer; this records acceptance of the platform's terms. On call 9df94781 the disclosure was never spoken, only the apply question was, and this tool fired anyway - a fabricated consent record, worse than recording nothing. Cannot point to the turn in THIS call where you read the disclosure and they agreed? Do not call it. Call ONCE, silently, only when get_profile showed a consent flag false. Works on a live OR draft seeker item: against a draft it records consent and turns that item LIVE, so no second profile is needed - use it instead of create_profile for an existing-but-unconsented caller. Never after they decline. Never when get_profile came back empty (no item to record against; create_profile handles them).
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "profile_id",
    "name",
    "age",
    "phone",
    "terms_check"
  ],
  "properties": {
    "age": {
      "type": "integer",
      "description": "The caller's age as already stored on the profile (the API requires it on every write). Send as a NUMBER, not a string."
    },
    "name": {
      "type": "string",
      "description": "The caller's name as already stored on the profile (the API requires it on every write). English / Latin script."
    },
    "phone": {
      "type": "string",
      "description": "The caller's number in the SAME form you sent to get_profile: 12 digits beginning with 91, digits only, no plus sign - e.g. 919876543210. Build it by FORMAT, not by adding: if ${contact_phone} is already 12 digits starting with 91 (outbound calls), send it UNCHANGED and never add another 91; if it is 10 digits (inbound calls), put 91 in front. A number starting 9191 is always wrong - the backend finds users by phone, so a doubled prefix silently creates a separate phantom user."
    },
    "profile_id": {
      "type": "string",
      "description": "The caller's seeker profile item_id (a UUID) from get_profile - the item whose item_type is \"profile_1.0\" and item_domain is \"seeker\". Use the live one if there is one, otherwise the draft you are reusing (a draft is the main case: this call turns it live). Never empty."
    },
    "terms_check": {
      "enum": [
        "disclosure-read-and-agreed-this-call",
        "not-read"
      ],
      "type": "string",
      "description": "REQUIRED - answer this before you call the tool. Did you speak the FULL five-element account-and-terms disclosure in THIS call (the account created on Blue Dots from their name and phone, the three purposes, the one-year term, managed by Ekstep Foundation, full terms readable in the app) AND did the caller then agree to THAT question? Only then is the value 'disclosure-read-and-agreed-this-call'. Otherwise the value is 'not-read' - and if it is 'not-read' you must NOT call this tool at all, because there is no consent to record. A caller agreeing to APPLY to a job is NOT agreement to the terms: the apply question shares their details with one employer, this records acceptance of the platform's terms and privacy policy. Recording a consent the caller was never asked for is a fabricated record and is worse than recording nothing."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "age": "{{age}}",
  "name": "{{name}}",
  "domain": "seeker",
  "channel": "voice",
  "item_id": "{{profile_id}}",
  "network": "blue_dot",
  "item_type": "profile_1.0",
  "compliance": [
    {
      "key": "user_terms",
      "value": true
    },
    {
      "key": "user_privacy",
      "value": true
    },
    {
      "key": "profile_creation",
      "value": true
    }
  ],
  "item_state": {
    "age": "{{age}}",
    "name": "{{name}}",
    "phone": "{{phone}}"
  },
  "phone_number": "+{{phone}}"
}
```

</details>

### 4. create_profile

**When:** Creates a profile for a new caller, only when get_profile found none.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/admin/participant` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`Content-Type: application/json`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Create a seeker profile for a NEW caller ONLY if get_profile returned no profile. Returns {user_id, items[]}: items[0].item_id is the new profile_id.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "age",
    "name",
    "phone",
    "location"
  ],
  "properties": {
    "age": {
      "type": "integer",
      "description": "Caller's age in years, e.g. 28 Send as a NUMBER, not a string."
    },
    "name": {
      "type": "string",
      "description": "Caller's name"
    },
    "role": {
      "type": "string",
      "description": "The job role/trade the caller wants, e.g. Electrician"
    },
    "phone": {
      "type": "string",
      "description": "The caller's number in the SAME form you sent to get_profile: 12 digits beginning with 91, digits only, no plus sign - e.g. 919876543210. Build it by FORMAT, not by adding: if ${contact_phone} is already 12 digits starting with 91 (outbound calls), send it UNCHANGED and never add another 91; if it is 10 digits (inbound calls), put 91 in front. A number starting 9191 is always wrong - the backend finds users by phone, so a doubled prefix silently creates a separate phantom user."
    },
    "gender": {
      "type": "string",
      "description": "The caller's gender. MUST be exactly one of: \"Male\", \"Female\", \"Other\", \"Don't want to share\". Map the caller's answer to one of these; never send any other string (the API rejects off-list values)."
    },
    "itiTrade": {
      "type": "string",
      "description": "Only if educationCategory='ITI'. The enum is a 150+ NSQF trade list; for voice, set 'Other' and put the spoken trade in itiTradeOther, UNLESS the spoken trade is an obvious exact match (e.g. 'Electrician', 'Fitter', 'Welder (NSQF)', 'Data Entry Operator (NSQF)')."
    },
    "location": {
      "type": "string",
      "description": "Caller's location as City, State, India REQUIRED: without a location the created profile stays 'draft' and cannot be applied to (apply fails PROFILE_NOT_LIVE)."
    },
    "itiInstitute": {
      "type": "string",
      "description": "Free text; the ITI or Polytechnic college/institute name the caller studied at."
    },
    "itiTradeOther": {
      "type": "string",
      "description": "Free text; the ITI trade as the caller said it. Used when itiTrade='Other'."
    },
    "workExperience": {
      "type": "string",
      "description": "The caller's work-experience category. MUST be exactly one of: \"Fresher\", \"Worked before\", \"Returning after a break\". Map the caller's spoken answer to one of these three; never send any other string (the API rejects off-list values)."
    },
    "otherHelpNeeded": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Other help the caller needs to get work. Send as a JSON ARRAY. EXACT enum only: 'Skilling & Vocational Training' | 'Other Support (Accommodation / Travel)'. OMIT entirely if they need none (there is no 'None' value)."
    },
    "educationCategory": {
      "type": "string",
      "description": "Highest education category (Phase-2). EXACT enum only: 'School' | 'College' | 'ITI' | 'Diploma' | 'Certification' | 'Learned Informally' | 'Other Vocational Training'."
    },
    "nameOfLastRoleHeld": {
      "type": "string",
      "description": "Free text; the caller's most recent job role. ONLY when experienced (workExperience 'Worked before'/'Returning after a break')."
    },
    "polytechnicDiploma": {
      "type": "string",
      "description": "Only if educationCategory='Diploma'. Enum: 'Diploma in Mechanical' | 'Diploma in Electrical' | 'Diploma in Electronics' | 'Diploma in Civil' | 'Diploma in Computer Science' | 'Diploma in Automobile' | 'Diploma in Others'."
    },
    "schoolQualification": {
      "type": "string",
      "description": "Only if educationCategory='School'. Enum: '10th' | '12th' | 'Other'."
    },
    "certificationDetails": {
      "type": "string",
      "description": "Free text; only if educationCategory='Certification' or 'Learned Informally' - what certification/skill they have."
    },
    "collegeQualification": {
      "type": "string",
      "description": "Only if educationCategory='College'. Enum: 'B.Tech/B.E.' | 'B.Com' | 'B.A.' | 'B.B.A' | 'Other'."
    },
    "polytechnicDiplomaOther": {
      "type": "string",
      "description": "Free text; only if polytechnicDiploma='Diploma in Others'."
    },
    "vocationalTrainingOther": {
      "type": "string",
      "description": "Free text; only if educationCategory='Other Vocational Training'."
    },
    "schoolQualificationOther": {
      "type": "string",
      "description": "Free text; only if schoolQualification='Other'."
    },
    "collegeQualificationOther": {
      "type": "string",
      "description": "Free text; only if collegeQualification='Other'."
    },
    "workExperienceYearsConditional": {
      "type": "string",
      "description": "Years of experience - ONLY when workExperience is 'Worked before' or 'Returning after a break'. Map the spoken answer to the NEAREST bucket. Enum: '0' | '< 1 Year' | '1 Year' | '2 Years' | '3 Years' | '3-5 Years' | '5-10 Years' | '10-15 Years' | '15+ Years'."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "age": "{{age}}",
  "name": "{{name}}",
  "domain": "seeker",
  "channel": "voice",
  "network": "blue_dot",
  "item_type": "profile_1.0",
  "compliance": [
    {
      "key": "user_terms",
      "value": true
    },
    {
      "key": "user_privacy",
      "value": true
    },
    {
      "key": "profile_creation",
      "value": true
    }
  ],
  "item_state": {
    "age": "{{age}}",
    "name": "{{name}}",
    "phone": "{{phone}}",
    "gender": "{{gender}}",
    "itiTrade": "{{itiTrade}}",
    "location": "{{location}}",
    "itiInstitute": "{{itiInstitute}}",
    "itiTradeOther": "{{itiTradeOther}}",
    "languageSpoken": [
      "Hindi"
    ],
    "workExperience": "{{workExperience}}",
    "otherHelpNeeded": "{{otherHelpNeeded}}",
    "educationCategory": "{{educationCategory}}",
    "nameOfLastRoleHeld": "{{nameOfLastRoleHeld}}",
    "polytechnicDiploma": "{{polytechnicDiploma}}",
    "schoolQualification": "{{schoolQualification}}",
    "certificationDetails": "{{certificationDetails}}",
    "collegeQualification": "{{collegeQualification}}",
    "polytechnicDiplomaOther": "{{polytechnicDiplomaOther}}",
    "vocationalTrainingOther": "{{vocationalTrainingOther}}",
    "natureOfJobsInterestedIn": [
      "Full-time"
    ],
    "schoolQualificationOther": "{{schoolQualificationOther}}",
    "collegeQualificationOther": "{{collegeQualificationOther}}",
    "nameOfJobRolesInterestedIn": "{{role}}",
    "workExperienceYearsConditional": "{{workExperienceYearsConditional}}"
  },
  "phone_number": "+{{phone}}"
}
```

</details>

### 5. update_profile

**When:** Saves details collected during the call: location, education, trade, experience, gender.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/admin/participant` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`Content-Type: application/json`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Update (merge new fields into) the caller's EXISTING live profile. Pass profile_id + name + age + phone ALWAYS, plus ONLY the field(s) you are persisting this turn. Merges into the item; keeps it live. Never pass a field empty.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "profile_id",
    "name",
    "age",
    "phone"
  ],
  "properties": {
    "age": {
      "type": "integer",
      "description": "The caller's age (the API requires it on every update - pass the known value). Send as a NUMBER, not a string."
    },
    "name": {
      "type": "string",
      "description": "The caller's name (the API requires it on every update - pass the known value)."
    },
    "role": {
      "type": "string",
      "description": "Pass ONLY when persisting the job role interested in. OMIT entirely otherwise."
    },
    "phone": {
      "type": "string",
      "description": "The caller's number in the SAME form you sent to get_profile: 12 digits beginning with 91, digits only, no plus sign - e.g. 919876543210. Build it by FORMAT, not by adding: if ${contact_phone} is already 12 digits starting with 91 (outbound calls), send it UNCHANGED and never add another 91; if it is 10 digits (inbound calls), put 91 in front. A number starting 9191 is always wrong - the backend finds users by phone, so a doubled prefix silently creates a separate phantom user."
    },
    "gender": {
      "type": "string",
      "description": "The caller's gender. MUST be exactly one of: \"Male\", \"Female\", \"Other\", \"Don't want to share\". Map the caller's answer to one of these; never send any other string (the API rejects off-list values)."
    },
    "itiTrade": {
      "type": "string",
      "description": "Only if educationCategory='ITI'. The enum is a 150+ NSQF trade list; for voice, set 'Other' and put the spoken trade in itiTradeOther, UNLESS the spoken trade is an obvious exact match (e.g. 'Electrician', 'Fitter', 'Welder (NSQF)', 'Data Entry Operator (NSQF)')."
    },
    "location": {
      "type": "string",
      "description": "Pass ONLY when persisting a new/finer location. OMIT entirely otherwise - never pass empty."
    },
    "profile_id": {
      "type": "string",
      "description": "The caller's SEEKER PROFILE item_id (a UUID). Pick the get_profile item whose item_type is \"profile_1.0\" AND item_domain is \"seeker\" - NEVER just items[0]. get_profile also returns items the caller owns as a provider (item_type \"job_posting_1.0\"); sending one of those as profile_id fails with SOURCE_ITEM_NOT_FOUND, which is what happened twice on call 0d63dc50. If no profile_1.0/seeker item exists the caller has NO profile: run create_profile first and use the id it returns."
    },
    "itiInstitute": {
      "type": "string",
      "description": "Free text; the ITI or Polytechnic college/institute name the caller studied at."
    },
    "itiTradeOther": {
      "type": "string",
      "description": "Free text; the ITI trade as the caller said it. Used when itiTrade='Other'."
    },
    "workExperience": {
      "type": "string",
      "description": "The caller's work-experience category. MUST be exactly one of: \"Fresher\", \"Worked before\", \"Returning after a break\". Map the caller's spoken answer to one of these three; never send any other string (the API rejects off-list values)."
    },
    "otherHelpNeeded": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Other help the caller needs to get work. Send as a JSON ARRAY. EXACT enum only: 'Skilling & Vocational Training' | 'Other Support (Accommodation / Travel)'. OMIT entirely if they need none (there is no 'None' value)."
    },
    "educationCategory": {
      "type": "string",
      "description": "Highest education category (Phase-2). EXACT enum only: 'School' | 'College' | 'ITI' | 'Diploma' | 'Certification' | 'Learned Informally' | 'Other Vocational Training'."
    },
    "nameOfLastRoleHeld": {
      "type": "string",
      "description": "Free text; the caller's most recent job role. ONLY when experienced (workExperience 'Worked before'/'Returning after a break')."
    },
    "polytechnicDiploma": {
      "type": "string",
      "description": "Only if educationCategory='Diploma'. Enum: 'Diploma in Mechanical' | 'Diploma in Electrical' | 'Diploma in Electronics' | 'Diploma in Civil' | 'Diploma in Computer Science' | 'Diploma in Automobile' | 'Diploma in Others'."
    },
    "schoolQualification": {
      "type": "string",
      "description": "Only if educationCategory='School'. Enum: '10th' | '12th' | 'Other'."
    },
    "certificationDetails": {
      "type": "string",
      "description": "Free text; only if educationCategory='Certification' or 'Learned Informally' - what certification/skill they have."
    },
    "collegeQualification": {
      "type": "string",
      "description": "Only if educationCategory='College'. Enum: 'B.Tech/B.E.' | 'B.Com' | 'B.A.' | 'B.B.A' | 'Other'."
    },
    "polytechnicDiplomaOther": {
      "type": "string",
      "description": "Free text; only if polytechnicDiploma='Diploma in Others'."
    },
    "vocationalTrainingOther": {
      "type": "string",
      "description": "Free text; only if educationCategory='Other Vocational Training'."
    },
    "schoolQualificationOther": {
      "type": "string",
      "description": "Free text; only if schoolQualification='Other'."
    },
    "collegeQualificationOther": {
      "type": "string",
      "description": "Free text; only if collegeQualification='Other'."
    },
    "workExperienceYearsConditional": {
      "type": "string",
      "description": "Years of experience - ONLY when workExperience is 'Worked before' or 'Returning after a break'. Map the spoken answer to the NEAREST bucket. Enum: '0' | '< 1 Year' | '1 Year' | '2 Years' | '3 Years' | '3-5 Years' | '5-10 Years' | '10-15 Years' | '15+ Years'."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "age": "{{age}}",
  "name": "{{name}}",
  "domain": "seeker",
  "channel": "voice",
  "item_id": "{{profile_id}}",
  "network": "blue_dot",
  "item_type": "profile_1.0",
  "item_state": {
    "age": "{{age}}",
    "name": "{{name}}",
    "phone": "{{phone}}",
    "gender": "{{gender}}",
    "itiTrade": "{{itiTrade}}",
    "location": "{{location}}",
    "itiInstitute": "{{itiInstitute}}",
    "itiTradeOther": "{{itiTradeOther}}",
    "workExperience": "{{workExperience}}",
    "otherHelpNeeded": "{{otherHelpNeeded}}",
    "educationCategory": "{{educationCategory}}",
    "nameOfLastRoleHeld": "{{nameOfLastRoleHeld}}",
    "polytechnicDiploma": "{{polytechnicDiploma}}",
    "schoolQualification": "{{schoolQualification}}",
    "certificationDetails": "{{certificationDetails}}",
    "collegeQualification": "{{collegeQualification}}",
    "polytechnicDiplomaOther": "{{polytechnicDiplomaOther}}",
    "vocationalTrainingOther": "{{vocationalTrainingOther}}",
    "schoolQualificationOther": "{{schoolQualificationOther}}",
    "collegeQualificationOther": "{{collegeQualificationOther}}",
    "nameOfJobRolesInterestedIn": "{{role}}",
    "workExperienceYearsConditional": "{{workExperienceYearsConditional}}"
  },
  "phone_number": "+{{phone}}"
}
```

</details>

### 6. get_recommended_jobs

**When:** Jobs matched to this caller's profile, best first.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/signals-search/v1/search` |
| Headers | `x-api-key: YOUR_API_KEY` |

**Description:**

```text wrap
Get jobs matched to THIS caller, ranked best-first. Call it once the caller has said they want work and get_profile returned a seeker profile: pass that profile's item_id and the backend returns the jobs closest to their stored profile, each with a score. Use this for a caller who has a profile and has NOT named a specific role - it is the personalised recommendation. If they name a role or interest instead, use get_jobs with those words. Returns message.items[]: item_id (the job_id to apply with), score, and item_state with role, jobProviderName (the company), positions, salaryMin/salaryMax when present. jobProviderLocation is masked on this instance - never speak it. Never invent a job that is not in the result.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "profile_id"
  ],
  "properties": {
    "profile_id": {
      "type": "string",
      "description": "The caller's seeker profile item_id (a UUID) from get_profile - the item whose item_type is \"profile_1.0\" and item_domain is \"seeker\". Never a job id, never a user_id."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "context": {
    "domain": "provider",
    "itemType": "job_posting_1.0",
    "messageId": "voice-rec",
    "networkId": "blue_dot"
  },
  "message": {
    "intent": {
      "item": {
        "id": "{{profile_id}}"
      }
    },
    "pagination": {
      "limit": 10,
      "offset": 0
    }
  }
}
```

</details>

### 7. get_jobs

**When:** Jobs for a role the caller names, searched by text.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/signals-search/v1/search` |
| Headers | `x-api-key: YOUR_API_KEY` |

**Description:**

```text wrap
Find jobs by what the caller said they want. Pass their role or interest as English words (e.g. "data entry operator", "electrician", "security guard", "tailoring") - translate what they said in Hindi into English before sending, and send the WORK they want, not a place. Use this when the caller names a role, asks for something different from what their profile says, or has no profile. For a caller with a profile who has not named a role, use get_recommended_jobs instead. Returns message.items[]: item_id (the job_id to apply with), score, and item_state with role, jobProviderName (the company), positions, salaryMin/salaryMax when present. jobProviderLocation is masked on this instance - never speak it. An empty items[] means we genuinely have nothing in that role: say so plainly and never invent one.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "query"
  ],
  "properties": {
    "query": {
      "type": "string",
      "description": "The role or kind of work the caller wants, in ENGLISH words. Translate their Hindi into English first (\"डेटा एंट्री\" -> \"data entry operator\", \"बिजली का काम\" -> \"electrician\"). Words only - no place names, no salary, no punctuation."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "context": {
    "domain": "provider",
    "itemType": "job_posting_1.0",
    "messageId": "voice-jobs",
    "networkId": "blue_dot"
  },
  "message": {
    "intent": {
      "textSearch": "{{query}}"
    },
    "pagination": {
      "limit": 10,
      "offset": 0
    }
  }
}
```

</details>

### 8. apply_job

**When:** Applies the caller to the job they chose.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/action/perform` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`Content-Type: application/json`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Apply the caller to a job. Returns {results:[...], summary:{succeeded,failed}} on success; on failure an error NAMING its reason in "error":"..." - READ IT. ACTION_LIMIT_REACHED, or any message that a request already exists, means the caller ALREADY APPLIED: say so plainly, never call it a failure. Do NOT call it for a job you already know they applied to. CONSENT: never invoke this unless you have just TOLD the caller their personal details will be shared with the company - the apply question on its own is not consent, and dropping that sentence is the commonest way this goes wrong. Writing about applying does not apply: if you said you are applying you MUST invoke this tool in that same turn, never say the application went through until this tool returns a result, and never emit a stage direction like "(Silent tool call: apply_job)" - the caller hears it and nothing was applied. WHEN THIS TOOL FAILS, YOUR TURN MUST END BY ASKING WHETHER TO TELL THEM ABOUT OTHER JOBS.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [
    "job_id",
    "profile_id",
    "acting_as_user_id",
    "duplicate_check"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "description": "The job's Signals item_id: a full hyphenated UUID (8-4-4-4-12), copied verbatim from the selected job in job_recommendations. Never strip the hyphens."
    },
    "profile_id": {
      "type": "string",
      "description": "The caller's SEEKER PROFILE item_id (a UUID). Pick the get_profile item whose item_type is \"profile_1.0\" AND item_domain is \"seeker\" - NEVER just items[0]. get_profile also returns items the caller owns as a provider (item_type \"job_posting_1.0\"); sending one of those as profile_id fails with SOURCE_ITEM_NOT_FOUND, which is what happened twice on call 0d63dc50. If no profile_1.0/seeker item exists the caller has NO profile: run create_profile first and use the id it returns."
    },
    "duplicate_check": {
      "enum": [
        "not-applied-before",
        "caller-asked-again-anyway"
      ],
      "type": "string",
      "description": "REQUIRED - you must run this check before every call. Has the caller ALREADY applied to THIS job? Look at two things: (a) has apply_job already run for this same job_id earlier in this call, with either result; and (b) does the caller context's jobs_applied already list this job - the same role at the same company, ignoring a Ltd / Limited / Pvt Ltd suffix and a shortened role name. Send 'not-applied-before' ONLY when you have looked at both and neither is true. If EITHER is true, do NOT call this tool: say the already-applied line from the instructions instead ('इस जॉब के लिए आपकी एप्लीकेशन पहले से लगी हुई है - दोबारा अप्लाई करने की ज़रूरत नहीं।'), because a call on a job whose application already exists can only fail. The one case where you may call it anyway is when you have already told the caller it is applied and they have asked you to try again regardless - then send 'caller-asked-again-anyway' and let the API decide. Never send 'not-applied-before' without actually having looked."
    },
    "acting_as_user_id": {
      "type": "string",
      "description": "The PROFILE OWNER's user_id (a UUID): the value of the TOP-LEVEL user_id field in the get_profile or create_profile response you received IN THIS CALL. It is NEVER equal to profile_id - profile_id comes from items[].item_id, this comes from the response's top-level user_id, and they are two different UUIDs. Before you emit this call, check that the two values differ; if they are the same you have not got a user_id and the call will fail with USER_NOT_FOUND ('acting_as_user_id does not resolve to any user') - call 5f0d3671 sent both fields as 687fd5a1... and the caller's application was lost while she was told it already existed. If you have not seen a get_profile or create_profile result in THIS call you do not have this value: knowing the caller's name or profile id from remembered context is not a user_id - call get_profile first and read it from the response."
    }
  }
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "consent": {
    "version": 1,
    "acknowledged": true
  },
  "action_type": "apply",
  "source_item": {
    "item_id": "{{profile_id}}",
    "item_type": "profile_1.0",
    "item_domain": "seeker",
    "item_network": "blue_dot"
  },
  "target_item": {
    "item_id": "{{job_id}}",
    "item_type": "job_posting_1.0",
    "item_domain": "provider",
    "item_network": "blue_dot",
    "item_instance_url": "API_BASE"
  },
  "acting_as_user_id": "{{acting_as_user_id}}"
}
```

</details>

### 9. get_services

**When:** Training, counselling and placement services: when the caller is not looking for a job, nothing suited, or they need help.

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `API_BASE/api/v1/network/item/fetch_local` |
| Headers | `x-api-key: YOUR_API_KEY`<br />`x-acting-org-id: YOUR_ORG_ID` |

**Description:**

```text wrap
Get the support services available to job seekers on this network - training and skilling centres, career counselling, interview preparation, placement assistance, government career centres, and help with things like travel or accommodation. Call this when the caller says they are NOT looking for a job right now, when jobs did not suit them, or when they mention a need a service could meet (they want training, they lack a skill or a certificate, they need help preparing for interviews, they need financial or travel help). Also worth offering AFTER a successful application. Takes no parameters. Returns items[] with item_state: organisationName, serviceDescription, costToBeneficiary, serviceAreas, and the services lists (servicesEducationalForSeekers / servicesNonEducationalForSeekers) plus who they serve (targetSeekersEducational / targetSeekersNonEducational). Match those against what the caller actually told you and offer only what fits; never invent a service or a provider that is not in the result.
```

<details>
<summary>Parameters</summary>

```json wrap
{
  "type": "object",
  "required": [],
  "properties": {}
}
```

</details>

<details>
<summary>Payload template</summary>

The body sent to the API. Each `{{name}}` is filled from the parameter of that name.

```json wrap
{
  "limit": 10,
  "offset": 0,
  "item_type": "profile_1.0",
  "item_state": {},
  "item_domain": "service_provider",
  "item_network": "blue_dot"
}
```

</details>

## Step 4: test with a call

From the console, place an outbound call to your own number with these values:

| Variable | Value |
|---|---|
| `contact_name` | Your name |
| `contact_phone` | 91 followed by your 10-digit number |
| `country_code` | `91` |
| `location` | Empty |
| `contact_memory` | Empty |

After the call, open it in the console's call log and check the tool calls between the turns:

- [ ] `get_profile` ran right after you said you want work.
- [ ] The agent asked for consent before it saved anything, and `record_consent_new` (or `record_consent`) succeeded.
- [ ] The agent asked for your area, then your PIN code, then one landmark.
- [ ] Every job it read out appears in the `get_jobs` or `get_recommended_jobs` result.
- [ ] It said it had applied only after `apply_job` returned `succeeded: 1`.
- [ ] It spoke numbers and money as words, and asked one question at a time.

## Common mistakes

| What you see | Usual cause |
|---|---|
| The agent never finds the caller | The phone number was sent without the 91 prefix, or with it twice |
| Every tool call fails with 401 or 403 | Wrong API key, or the key for a different instance |
| The agent says "applied" but nothing shows in the instance | The `apply_job` URL or payload was typed wrong. Check the tool result in the call log. |
| The agent reads out jobs from another city | Your instance has no jobs nearby. Load local jobs; the agent can't make them up. |
| The agent asks the same thing twice | Memory is off, or the memory prompt wasn't pasted |
| The same test call behaves differently each time | A tool name or parameter name doesn't match the prompt |

These steps were tested end to end on 16 October 2026.

## Related

- [AI Voice Agent Prompts](/deploy/agents/voice-agent-prompts/): how the prompt files are organised, and the other agents.
- [Set Up the Provider Voice Agent](/deploy/agents/provider-voice-agent/): the matching guide for job providers.
- [The Blue Dot Lifecycle](/about/key-concepts/blue-dot-lifecycle/): where the voice channel sits.

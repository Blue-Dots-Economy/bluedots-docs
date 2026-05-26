---
title: DigiLocker Service
description: DigiLocker credential pull service used in the current project as an external, replaceable integration.
head: []
sidebar:
  order: 4
---

This project also supports pulling credentials from DigiLocker through a Dhiway-specific service integration.

The DigiLocker flow is documented separately from wallet import because it has a different interaction model: it starts with an external authorization flow and returns credential data through a callback or pasted authorization code.

## Responsibility

The DigiLocker service is responsible for:

- starting a DigiLocker authorization request
- returning a launch URL for the external flow
- exchanging the authorization code after user consent
- returning credential subject data that can be imported into DPG forms

## Current Flow

1. The user opens `Import Credentials` on a profile form.
2. The user selects `DigiLocker`.
3. The UI requests a launch URL from the DigiLocker agent service.
4. The UI opens that URL in a popup.
5. The flow completes either through automatic redirect detection or manual code pasting.
6. The UI exchanges the code with the agent service.
7. The returned credential subject is mapped into the active schema.

## Integration Surface

Current UI client:

- `apps/ui/src/lib/digilocker-api.ts`

Current provider UI:

- `apps/ui/src/components/wallet/providers/digilocker-provider.tsx`

Current endpoints:

- `GET /api/v1/discover/digilocker-request`
- `POST /api/v1/discover/digilocker-auth`

Current env:

- `VITE_AGENT_URL`
- `VITE_AGENT_TOKEN`

## Callback Behavior

The current implementation supports two completion styles:

- automatic completion when the popup reaches a redirect URL containing `wallet-redirect?code=`
- manual completion when the user pastes the code or redirect URL into the import dialog

For the automatic path, the docs and UI expect a redirect bridge page on the configured callback origin.

## Why It Is A Separate Service

DigiLocker pull is project-specific and external to the DPG runtime model.

It should be treated as a replaceable integration because:

- not every deployment will use DigiLocker
- the integration method may vary by operator or jurisdiction
- other document or credential repositories may be used instead

## Project Recommendation

Keep DigiLocker integration isolated behind the same provider registry used for wallet imports.

That approach allows the project to:

- support DigiLocker alongside wallet-based import
- disable it per deployment without changing form code
- replace it with another external document source when needed

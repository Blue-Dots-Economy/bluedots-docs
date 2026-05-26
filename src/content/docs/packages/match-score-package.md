---
title: Match Score Package
description: What the match_score package provides for AI-powered item comparison and scoring.
head: []
sidebar:
  order: 7
---

`packages/match_score` contains the shared client used when the API needs to call an external match scoring service to compare two items.

## What it exposes

- `createMatchScoreClient(config)` — factory for creating a provider-specific match score client
- `MatchScoreClient` interface — contract for calculating match scores
- `MatchScoreRequest` and `MatchScoreResult` types — request/response shapes
- `DpgScoringClient` — HMAC-signed client for the DPG Scoring provider
- `createDpgScoringAuthHeaders()` — signed header helpers for provider requests

## Runtime configuration

The API reads these optional values from the root environment:

| Variable | Purpose |
|----------|---------|
| `MATCH_SCORE_PROVIDER` | Provider identifier (`dpg_scoring` or unset) |
| `DPG_SCORING_ENDPOINT` | Provider base URL |
| `DPG_SCORING_KEY_ID` | Key identifier sent with signed requests |
| `DPG_SCORING_SECRET` | Shared secret used to sign provider requests |
| `DPG_SCORING_PATH` | Optional API path override (defaults to `api/v1/scores/match`) |
| `DPG_SCORING_VERSION` | Optional scoring model version |
| `DPG_SCORING_PROMPT_VERSION` | Optional prompt version |

If match score settings are absent, the API returns `503 MATCH_SCORE_NOT_CONFIGURED` and the UI disables match score features gracefully.

## Typical usage

The API runtime creates the client from environment configuration and uses it in the `/api/v1/match-score/calculate` route. The package keeps provider-specific signing and transport details out of the route handlers.

```ts
import { createMatchScoreClient } from '@dpg/match_score';

const client = createMatchScoreClient({
  provider: 'dpg_scoring',
  baseUrl: 'https://scoring.example.com',
  keyId: 'my-key',
  secret: 'my-secret',
});

const result = await client.calculate({
  itemA: { item_id: '...', item_state: { ... } },
  itemB: { item_id: '...', item_state: { ... } },
});
// result.score, result.band, result.signals, result.reasoning
```

Use this package when a shared service needs to calculate a match score between two items instead of making ad hoc `fetch()` calls.

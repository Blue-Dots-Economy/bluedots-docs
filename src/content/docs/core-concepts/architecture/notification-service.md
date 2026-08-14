---
title: Notification Service Architecture
description: Internals of notification-service — the provider-agnostic email/SMS/WhatsApp dispatcher used by Signals-DPG.
sidebar:
  order: 2.7
---

**notification-service** is a small, standalone Fastify service that gives every DPG in the ecosystem one HTTP endpoint — `POST /notify` — for sending email, SMS, and WhatsApp messages without knowing which underlying provider handles a given channel. It is a separate deployable service, not a package inside Signals-DPG's monorepo, and is already live in production today.

## Components

- **API process** — a Fastify app (`src/app.ts`) registering the routes below. Started from `src/server.ts`.
- **Background worker** — `src/server.ts` forks a dedicated worker process in-process on API startup; the worker owns the queue consume loop and never runs inside a request handler.
- **`POST /notify`** — enqueues a notification job. Validates the request against the target provider's own Zod schema, applies a short dedupe window (keyed by `channel:to:template_id` unless the caller supplies `dedupe_id`), and returns a `job_id` immediately — sending is always asynchronous.
- **`GET /providers`, `GET /providers/:name`** — introspection: lists every auto-discovered provider along with its template keys, a JSON Schema for its `variables` payload, and complete example `/notify` request bodies. This is how a calling DPG discovers what templates/fields a channel supports without reading this service's source.
- **`GET /metrics/queue`** — queue depths (realtime, other, retry count, oldest pending retry, DLQ size) for operational visibility.
- **`POST /failed/retry`** — lets an operator manually requeue jobs sitting in the dead-letter queue, either a specific `job_id` or a batch, resetting the attempt count back to zero.

## Provider auto-discovery

Providers are wired in by filesystem convention, not registration code. Each channel gets its own directory under `src/lib/providers/` (e.g. `email/`, `sms/`, `whatsapp/`) whose `index.ts` exports a single provider definition — a name, a map of public template keys to provider-side template IDs, a Zod schema for the channel's `variables`, and a `send()` function. On startup, `src/lib/providers/index.ts` walks that directory and loads whatever it finds; adding a new channel (e.g. push notifications) means adding a new folder, not touching any central registry.

Currently wired:

- **email** — via a mail provider chosen by configuration (transactional email API or SMTP).
- **sms** — via MSG91.
- **whatsapp** — via Twilio.

## Auth model: HMAC request signing

notification-service uses a **third, distinct** service-auth pattern in this ecosystem — alongside Aggregator's Keycloak realm, Signals-DPG's Better-Auth/API-key model, and signals-search's `x-api-key`-only path. Every route requires four signed headers: `X-NS-Key`, `X-NS-Timestamp`, `X-NS-Nonce`, and `X-NS-Signature` (an HMAC-SHA256 over `METHOD\nPATH\nTIMESTAMP\nNONCE`, keyed by a per-caller secret).

By design, a request is authenticated by first verifying the HMAC-SHA256 signature over the request; only once the signature is valid is the nonce checked and claimed for replay protection. A timestamp skew window rejects stale requests before either check runs. See [Identity & Auth](/core-concepts/architecture/identity-and-auth/) for how this pattern fits alongside the ecosystem's other service-auth models.

## The queue

Jobs move through Redis using custom primitives rather than a library like BullMQ:

- **`queue:realtime`** and **`queue:other`** — two Redis lists giving high- and normal-priority jobs separate lanes. The worker loop checks `realtime` first but only blocks briefly, so `other` and due retries are never starved when realtime traffic is quiet.
- **A delayed-retry set** — failed sends are rescheduled onto a Redis sorted set keyed by the timestamp they next become due, rather than looping immediately; the worker polls this set for due jobs on every loop iteration. Retries use **exponential backoff**.
- **A dead-letter queue** — once a job exhausts its retry budget it is moved to a DLQ list for operator triage via `GET /metrics/queue` and manual requeue via `POST /failed/retry`.

The worker loop is a single process alternating: one realtime job, then any due retries, then one `other` job, then a short idle sleep when nothing is available.

## Relationship to Signals-DPG

Signals-DPG's `packages/notification` is a **thin HTTP client**, not a shared library — it does not embed any of notification-service's provider or queue logic. Signals-DPG's outbound email funnels through this client, which simply signs and sends a `POST /notify` request to the notification-service deployment.

notification-service also runs against **its own dedicated Redis instance** — it shares no datastore with Signals-DPG. The two services are coupled purely over HTTP.

## Deployment

notification-service is deployed as a **subchart of the Signals Helm chart** in `bluedots-automation`, alongside Signals-DPG's own API/UI and its dedicated Redis.

See [Tech Stack](/core-concepts/technical/tech-stack/) for its runtime stack and [Identity & Auth](/core-concepts/architecture/identity-and-auth/) for how its auth model compares to the rest of the ecosystem.

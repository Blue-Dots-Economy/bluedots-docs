---
title: Notification Package
description: What the notification package provides for OTP and provider integrations.
head: []
sidebar:
  order: 6
---

`packages/notification` contains the shared client used when the API or auth layer needs to call an external notification service.

## What it exposes

- `NotificationClient`
- notification request and response types
- `createAuthHeaders()` for signed provider requests

## Runtime configuration

The API reads these optional values from the root environment:

| Variable | Purpose |
|----------|---------|
| `NOTIFICATION_SERVICE_ENDPOINT` | Provider endpoint used for outbound notification requests |
| `NOTIFICATION_SERVICE_KEY_ID` | Key identifier sent with signed requests |
| `NOTIFICATION_SERVICE_SECRET` | Shared secret used to sign provider requests |
| `SMS_TEMPLATE_ID` | Provider template id for SMS OTP delivery |

If notification settings are absent, auth can still run locally with test OTP behavior when `CREATE_TEST_OTP=true`.

## Typical usage

The auth package receives notification config from the API runtime and uses it for OTP delivery hooks. The package keeps provider-specific signing and transport details out of the route handlers.

Use this package when a shared service needs to send a notification through the configured provider instead of making ad hoc `fetch()` calls.

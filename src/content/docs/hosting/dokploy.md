---
title: Dokploy
description: Production deployment guide for DPG on Dokploy using the API Dockerfile.
head: []
---

Deploy the API on Dokploy with the Dockerfile at `apps/api/Dockerfile`.

This is now the recommended Dokploy path because the image build is owned by the repo:

- Turbo prunes the monorepo to the API dependency graph
- pnpm installs from the pruned workspace
- `pnpm turbo run build --filter=api` builds the API
- production dependencies are installed for the final image
- the container starts with `node apps/api/dist/server.js`

## Dokploy App Settings

Use a Dockerfile-based application.

| Setting | Value |
|---------|-------|
| Build type | Dockerfile |
| Dockerfile path | `apps/api/Dockerfile` |
| Build context | repository root |
| Container port | `2742` |

The Dockerfile exposes `API_PORT` and defaults it to `2742`. Keep Dokploy's published/internal port aligned with `API_PORT`.

## Required Runtime Env

Add the normal API environment variables in Dokploy:

```bash
INSTANCE_NAME="Dpg Api"
INSTANCE_ENV="production"
API_DOMAIN="https://api.example.com"
API_PORT="2742"
AUTH_SECRET="replace-this"
SERVED_DOMAINS="yellow_dot/student"
NETWORK_CONFIG_SOURCE="remote"
NETWORK_CONFIG_URLS="yellow_dot=https://registry.example.com/yellow-dot/network.json"
POSTGRES_URL="postgres://user:password@host:5432/dbname"
REDIS_URL="redis://:password@host:6379"
```

Use `POSTGRES_URL` and `REDIS_URL` for hosted services when possible. If you use separate host/user/password fields instead, make sure the container can resolve those hostnames from Dokploy's network.

## Optional Env

```bash
ALLOWED_ORIGINS="https://app.example.com"
SCHEMA_REGISTRY_URL="yellow_dot=https://registry.example.com/yellow-dot/network.json"
NOTIFICATION_SERVICE_ENDPOINT="https://notifications.example.com"
NOTIFICATION_SERVICE_KEY_ID="key-id"
NOTIFICATION_SERVICE_SECRET="replace-this"
SMS_TEMPLATE_ID="otp-template"
```

In production, auth middleware is always enabled even if `AUTH_MIDDLEWARE_ENABLED=false` is present.

## Health Checks

Use the root endpoint as the basic health check:

```text
GET /
```

Expected response shape:

```json
{
  "service": "Dpg Api",
  "status": "ok",
  "served_domains": [{ "network": "yellow_dot", "domain": "student" }],
  "network_config_source": "remote"
}
```

The API reference is available at:

```text
/api/reference
```

## Building The Same Image Locally

Build from the repository root because the Dockerfile needs the full monorepo context for Turbo pruning:

```bash
docker build -f apps/api/Dockerfile -t dpg-api .
```

Run it with an env file:

```bash
docker run --env-file .env -p 2742:2742 dpg-api
```

For local container runs, remember that `127.0.0.1` inside the API container points to the API container itself. Use reachable database and Redis hosts, such as Docker Compose service names or host networking equivalents.

## Nixpacks

Nixpacks-specific variables such as `NIXPACKS_BUILD_CMD` and `NIXPACKS_START_CMD` are no longer required for the API deployment. Prefer the Dockerfile path above so Dokploy builds the same image locally and in production.

## Production Checklist

- `API_DOMAIN` is the public API domain, not `localhost`
- `INSTANCE_ENV` is `production`
- Dokploy routes traffic to `API_PORT`
- `NETWORK_CONFIG_SOURCE` is `remote`
- every served network has a reachable config URL
- `POSTGRES_URL` and `REDIS_URL` point to production services
- `AUTH_SECRET`, Redis password, database password, and notification secrets are real secrets

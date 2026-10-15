---
title: Tata Cloud Infrastructure Requirements
description: Infrastructure requirements for deploying Blue Dots Economy on Tata Cloud — the Kubernetes cluster, managed Postgres, container registry, jump node, ingress and object storage.
sidebar:
  order: 3
---

This guide lists the infrastructure requirements for deploying Blue Dots Economy on Tata Cloud — Tata Communications' **IZO Cloud / VKS** managed Kubernetes platform, with **Vayu** as the underlying virtual-machine product for standalone compute.

## Kubernetes cluster

A managed Kubernetes control plane running Kubernetes 1.35 or later, with master and worker nodes.

Master nodes also carry the cluster's observability workloads (metrics, logs, dashboards), so size them with that in mind.

Kubernetes nodes and pods also need their own outbound internet access, separate from the jump node's, for a handful of application integrations:

- SMTP, over port 587 — outbound email (OTP, notifications)
- An SMS gateway (MSG91 or Pinnacle) — SMS OTP, over HTTPS
- Geocoding APIs — server-side geocoding calls, over HTTPS
- `raw.githubusercontent.com` — the aggregator fetches its network configuration at boot, over HTTPS
- Let's Encrypt ACME — if cert-manager issues certificates from inside the cluster, over HTTPS

The Geocoding API key is restricted by IP address, so this outbound traffic needs a stable, static egress IP that can be allow-listed on the key.

## Managed PostgreSQL

The `postgis` and `vector` (pgvector) extensions need to be available — neither ships with a stock PostgreSQL image. `pgcrypto`, `cube` and `earthdistance` ship with standard PostgreSQL.

Kubernetes nodes and pods need network access to this instance too — the application connects to it directly.

## Container registry

Kubernetes nodes and pods need access to a container registry to pull application images. If the nodes or pods don't have internet access to pull images directly from a public registry like GHCR or Docker Hub, the images need to be mirrored into this registry first — from the jump node, which does have internet access.

## Jump node

Ubuntu. Needs network access to the Kubernetes API, the managed PostgreSQL instance, and the container registry above (HTTPS, port 443).

The following tools need to be installed:

| Tool | Minimum version | Used for |
|---|---|---|
| `git` | — | cloning and updating the deployment repository |
| `kubectl` | 1.24 | talking to the Kubernetes API |
| `helm` | 3.12 | installing the Helm charts |
| `docker` | — | pulling and mirroring images into the container registry |

The jump node needs outbound internet access, over HTTPS (port 443), to:

- `github.com` — to clone and update the deployment repository
- `raw.githubusercontent.com` and `api.github.com` — to fetch network and configuration files at deploy time
- `ghcr.io` and `docker.io` — to pull images before mirroring them into the container registry

## Load balancer and ingress

A load balancer that provides ingress into the cluster is needed, along with a certificate-issuance mechanism (cert-manager or equivalent) for TLS on the public hostnames the UI and APIs are served from.

If certificates are issued through Let's Encrypt's ACME HTTP-01 challenge, inbound port 80 needs to reach the cluster — that's where the challenge is served from.

The network needs to support hairpin NAT (also called NAT loopback): routing traffic that originates inside the cluster, addressed to the cluster's own public hostname, back in through the same path a browser's traffic takes. Without it, a server-side call to the cluster's own public address — an OIDC discovery call, a certificate authority's self-check — times out even though the identical request from a browser succeeds.

## Object storage

If there's no managed S3-compatible object storage, Blue Dots Economy self-hosts one (MinIO) inside the cluster instead. It needs presigned-URL support and CORS configured — campaign exports and browser uploads both depend on these.

A self-hosted object store needs two separate endpoints: an internal one for server-side calls, and a public one — with its own DNS name and TLS certificate — for anything that hands a client a pre-signed URL to fetch directly. The ingress in front of the public endpoint must preserve the `Host` header end to end; a pre-signed URL's signature covers the `Host` header, and a rewritten header produces a signature mismatch.

## Optional: monitoring

`bluedots-automation`'s own `monitoring` chart (Prometheus, Grafana, Loki, and the project's alert rules) can be deployed for this. If the platform already provides its own monitoring stack — Prometheus, Grafana, metrics-server — before handover, that can be used instead, and the `monitoring` chart skipped.


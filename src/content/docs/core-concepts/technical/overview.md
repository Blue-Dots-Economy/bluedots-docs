---
title: Technical Documentation
description: Implementation-level reference for engineers building on the Blue Dots DPGs.
sidebar:
  order: 1
---

This sub-section is the implementation-level reference for engineers. Where [Architecture](/core-concepts/architecture/high-level-architecture/) explains *what the system is*, these pages explain *how it behaves in code*.

## What's here

- **[Schema-Driven Model](/core-concepts/technical/schema-driven-model/)** — how networks, domains and items are defined by schemas, and why nothing domain-specific is hardcoded.
- **[Read & Write Paths](/core-concepts/technical/read-write-paths/)** — the two fetch layers (instance-local vs. inter-instance), discovery, caching, and how signals are written.
- **[Tech Stack](/core-concepts/technical/tech-stack/)** — the full toolchain, runtimes and conventions across both DPGs.

## Cross-cutting principles

A few principles hold across the entire codebase:

- **Configuration as code.** No domain- or environment-specific value is hardcoded. Values are read once at startup from a config loader or env, with per-environment overrides.
- **Typed boundaries.** Service methods return a `Result<T, BaseError>` rather than throwing across boundaries; routes return machine-readable `error` codes.
- **Schema-first.** Forms, cards and API contracts derive from Zod/JSON schemas, so domains evolve without code changes.
- **Observability by default.** Log entries carry `operation`, `status`, `latency_ms` for external calls, and `error`/`error_type` on failure. No bare `console.log` in module code.
- **Tested to a bar.** Vitest only; cross-package tests use the in-memory fake from each package's `./testing` export; target ≥ 70% line coverage.

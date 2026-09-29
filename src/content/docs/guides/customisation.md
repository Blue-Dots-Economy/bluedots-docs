---
title: Customisation & Branding
description: The four things adaptors typically tailor — personalisation, configuration, dashboards and a landing page — none of which require touching the DPGs.
sidebar:
  order: 6
---

Beyond the core [lifecycle](/core-concepts/blue-dot-lifecycle/), adaptors typically tailor four things to make a deployment their own.

:::tip[None of this forks the DPGs]
Personalisation, configuration, dashboards and the landing page all sit **on top** of Signals and Aggregator as configuration and presentation layers. An adaptor changes them without touching — or diverging from — the underlying Digital Public Goods.
:::

## 1. Personalisation

Branding elements — logo, colour scheme, fonts, wordmark and language — so the deployment reflects the adaptor's identity rather than looking like a generic instance.

Branding is declared per network in a `brand.json` alongside the network schema. The reference `blue_dot/brand.json` carries:

| Key | What it holds |
|---|---|
| `brand` | Name, wordmark, strapline, seeding organisation |
| `logo` | Variants — default, with-strapline, on-light, on-dark, on-brand |
| `colours` | `primary`, `secondary` and `accent` palettes, each a named hex list |
| `logoShape`, `faviconType` | How the mark is rendered |

**Overrides are partial.** A sub-brand supplies only what differs — the reference repository ships `blue_dot/upsdm/brand.json`, which overrides just `logoShape`, `faviconType` and the page title, and inherits everything else.

Two more personalisation surfaces:

- **UI theme** — `VITE_DEFAULT_NETWORK_THEME` selects the palette (`blue_dot`, `purple_dot`, `yellow_dot`, `pink_dot`, `green_dot`), falling back to `VITE_NETWORK_ID` and then `blue_dot`.
- **Login screen** — the per-network Keycloak login **theme** image is built alongside the realm. See [Keycloak Setup](/guides/keycloak-setup/).

## 2. Configuration

Operational settings specific to a deployment:

- SMS gateway credentials
- The phone number used for Voice AI calls
- Admin email addresses for alerts and approvals
- SMTP settings for transactional email

These follow the project's [configuration discipline](/guides/configuration/) — declared in a config package, overridden per environment, never hardcoded. See [Configuration](/guides/configuration/) for exactly which file each value belongs in, and [Deployment](/guides/installation/cloud-setup/aws/deployment/) for the values that must be set before a stack comes up.

## 3. Dashboards

Metrics and trend views for the adaptor's own use — registration volumes, **active versus at-risk** participants, and discovery and connection rates over time.

This is not a build-from-scratch exercise: the participant states and the tiles are already declared in the network schema.

**Participant state** comes from `status_rules` on each domain, evaluated against item age and recency of action:

| Status | Reference rule (blue_dot) |
|---|---|
| `new` | Joined within the last 7 days |
| `active` | Applied or was accepted in the last 30 days |
| `at_risk` | No activity for 31–90 days |
| `inactive` | No activity for 90+ days (default) |

**Tiles** come from `dashboard_tiles` per domain (profile-level and user-level), and **roll-up buckets** from the network-level `dashboard_buckets`, which relabels raw action statuses into programme language — `create → Applied`, `accept → Shortlisted`, `reject → Rejected`, `cancel → Withdrawn`.

Tailoring a dashboard means editing those declarations, not writing new aggregation code.

## 4. Landing page

A public page introducing the overall programme — what it is, who it is for — that **links through** to the underlying DPGs for registration and discovery rather than replacing them.

Keep the DPG as the system of record. A landing page that re-implements registration forks the consent and verification path and breaks the [lifecycle](/core-concepts/blue-dot-lifecycle/#5-verification-checks) guarantees.

## What stays shared

The point of the split is that an adaptor's customisations do not accumulate into a fork:

| Layer | Owned by | Changes per adaptor? |
|---|---|---|
| Signals DPG, Aggregator DPG | The commons | No |
| Network, domain and item schemas | Adaptor, as config | Yes |
| Branding, theme, landing page | Adaptor | Yes |
| Dashboards | Adaptor, as config | Yes |

See [Blue Dots as a DPG](/overview/blue-dots-as-a-dpg/) for why this boundary is drawn where it is.

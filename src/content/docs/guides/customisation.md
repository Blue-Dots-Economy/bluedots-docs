---
title: Customisation & Branding
description: What an adaptor can change for a deployment (branding and per-network UI themes, settings, dashboards and a landing page) without changing the Signals or Aggregator code.
sidebar:
  attrs:
    class: bd-changed
  order: 6
changed_sections:
  - _top
  - 1-personalisation
  - 2-configuration
  - 3-dashboards
  - 4-landing-page
---

Beyond the core [lifecycle](/core-concepts/blue-dot-lifecycle/), adaptors typically tailor four things to make a deployment their own.

:::tip[None of this forks the DPGs]
Personalisation, configuration, dashboards and the landing page all sit **on top** of Signals and Aggregator as configuration and presentation layers. An adaptor changes them without changing the code of the underlying Digital Public Goods (DPGs).
:::

## 1. Personalisation

Branding covers the logo, colour scheme, fonts, wordmark and language, so the deployment carries the adaptor's own identity.

Branding is declared per network in a `brand.json` alongside the network schema. The reference `blue_dot/brand.json` carries:

| Key | What it holds |
|---|---|
| `brand` | Name, wordmark, strapline, seeding organisation |
| `logo` | Variants — default, with-strapline, on-light, on-dark, on-brand |
| `colours` | `primary`, `secondary` and `accent` palettes, each a named hex list |
| `logoShape`, `faviconType` | How the mark is rendered |

**Overrides are partial.** A sub-brand supplies only what differs. The reference repository ships `blue_dot/upsdm/brand.json`, which overrides just `logoShape`, `faviconType` and the page title, and inherits everything else.

Two more things to personalise:

- **UI theme.** `VITE_DEFAULT_NETWORK_THEME` selects the colours of the Signals web app. If it is unset, the app uses the first value of `VITE_NETWORK_ID`, and then `blue_dot`. A value that matches no theme also falls back to `blue_dot`.
- **Login screen.** The per-network Keycloak login **theme** image is built alongside the realm. See [Keycloak Setup](/guides/keycloak-setup/).

The Signals web app ships six themes, one for each dot except Brown. Only some of them have a network schema in Signals-DPG `examples/schemas/`; the others are colours only, with no network behind them yet. See [Networks, Domains and Instances](/core-concepts/networks-domains-instances/) for each network and its status.

| Theme value | Dot | Network schema in `examples/schemas/` |
|---|---|---|
| `blue_dot` (default) | Blue (jobs) | Yes, with `brand.json` |
| `yellow_dot` | Yellow (education) | Yes, no `brand.json` |
| `purple_dot` | Purple (persons with disabilities) | Yes, with `brand.json` |
| `orange_dot` | Orange (tourism) | Yes, with `brand.json` |
| `pink_dot` | Pink (women's work) | No, theme only |
| `green_dot` | Green (farming) | No, theme only |

There is no Brown theme. The Yellow theme value is the folder name `yellow_dot`, which differs from the network id set in its `network.json`, so set `VITE_DEFAULT_NETWORK_THEME` explicitly for a Yellow deployment.

The aggregator portal has no theme list of its own. It reads the brand and the domain labels of the network it is configured for, so the same portal runs for Blue, Purple or Yellow without code changes.

## 2. Configuration

Operational settings specific to a deployment:

- SMS gateway credentials
- The phone number used for Voice AI calls
- Admin email addresses for alerts and approvals
- SMTP settings for transactional email

These follow the project's [configuration rules](/guides/configuration/): declared in a config package, overridden per environment, never hardcoded. See [Configuration](/guides/configuration/) for exactly which file each value belongs in, and [Deployment](/guides/installation/cloud-setup/aws/deployment/) for the values that must be set before a stack comes up.

## 3. Dashboards

Metrics and trend views for the adaptor's own use: registration volumes, **active versus at-risk** participants, and discovery and connection rates over time.

The participant states and the tiles are already declared in the network schema, so no new code is needed. The examples below are from `blue_dot`; other networks declare their own states and tiles the same way.

**Participant state** comes from `status_rules` on each domain, evaluated against item age and recency of action:

| Status | Reference rule (blue_dot) |
|---|---|
| `new` | Joined within the last 7 days |
| `active` | Applied or was accepted in the last 30 days |
| `at_risk` | No activity for 31–90 days |
| `inactive` | No activity for 90+ days (default) |

**Tiles** come from `dashboard_tiles` per domain (profile-level and user-level), and **roll-up buckets** from the network-level `dashboard_buckets`, which relabels raw action statuses into programme language. In `blue_dot`, actions a participant starts read `create → Applied` and `cancel → Withdrawn`, and actions they receive read `create → Applications` and `accept → Shortlisted`.

Tailoring a dashboard means editing those declarations, not writing new aggregation code.

## 4. Landing page

A public page introducing the overall programme (what it is, who it is for) that **links through** to the underlying DPGs for registration and discovery rather than replacing them.

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

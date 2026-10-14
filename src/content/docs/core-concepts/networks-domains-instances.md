---
title: Networks, Domains & Instances
description: How one set of Blue Dots software helps people and organisations nearby find each other, in jobs, education, disability services, tourism and other sectors.
sidebar:
  attrs:
    class: bd-changed
  order: 5
changed_sections:
  - _top
  - network
  - domain
  - instance
  - the-networks-today
  - can-networks-talk-to-each-other
  - how-they-fit-together
---

Blue Dots helps people and organisations near each other find each other, in many sectors, with one set of software. It uses three ideas to do this: **networks**, **domains** and **instances**. Keep them separate, because each answers a different question.

| Idea | Question it answers | Example |
|---|---|---|
| Network | Which sector, and what can people list and do there? | the jobs network, `blue_dot` |
| Domain | Which role does a person or organisation play in that network? | `seeker` (a young person looking for work) |
| Instance | Which running copy of the software serves them? | one district's deployment |

## Network

A **network** is the set of rules that every deployment for one sector agrees to follow. Each colour of dot is a network. The rules are written in one file, `network.json`, which lists:

- the roles (domains) people can take,
- the form each role fills in (its item types, such as `profile_1.0`),
- the actions people can take with each other (for example `apply` or `connect`).

Any deployment that uses the same network file can find and exchange dots with any other deployment on it.

## Domain

A **domain** is a role inside a network. A network can have several: someone who needs something, someone who offers it, and sometimes a support service. Each deployment says which domains it serves through the `SERVED_DOMAINS` setting.

The same item type can mean different things on different networks. A `profile_1.0` on the jobs network asks about skills and work preferences. On the education network it asks about class, stream and the help the student wants.

## Instance

An **instance** is one running copy of the Signals software, serving the domains it is configured for. A district might run its own instance; a state programme might run several. Instances are separate deployments. They work together through the shared network rules; there is no central database they all have to share.

## The networks today

Four networks are defined in the Signals DPG example schemas (`examples/schemas/<network>/network.json`). Three more sectors are possible future networks; the software would serve them in the same way once their network file is written.

| Colour | Sector | Domains (roles) | Actions | Status |
|---|---|---|---|---|
| Blue | Livelihoods for youth (jobs) | `seeker` (job seeker), `provider` (employer). Deployed pilot schemas also add `service_provider` (training, counselling and placement support). | `apply`, `connect` | Live, piloted |
| Yellow | Education avenues and services | `student`; tutor or counsellor | `connect` | Network defined |
| Purple | Economic participation of persons with disabilities | `seeker` (person looking for devices, services or work), `provider` (organisation offering them) | `connect` | Network defined |
| Orange | Tourism | `practitioner` (homestay owner, artisan, guide, performer) | none — listings are public | Network defined |
| Pink | Women's labour-force participation | — | — | Possible |
| Green | Farming efficiency | — | — | Possible |
| Brown | Growth for SMBs | — | — | Possible |

This page is the reference list of networks. Other pages link here rather than repeating it. To create a network for a new sector, see the guide to [schema-driven configuration](/core-concepts/technical/schema-driven-model/).

### Can networks talk to each other?

By default, an instance finds and exchanges dots only with instances on the same network. The example schemas also include a pair of networks (jobs and education) that each list the other as a trusted origin. People on one network can then take actions on the other. This is an example configuration, not a default.

## How they fit together

<!-- Editable source: src/assets/diagrams/networks-domains-instances.excalidraw — open at https://excalidraw.com to adjust, re-export PNG here. -->

![Two networks side by side. The jobs network (blue_dot) has the domains seeker and provider, served by two district instances. The education network has the domains student and tutor or counsellor, served by one instance. Each instance lists the domains it serves in SERVED_DOMAINS.](../../../assets/diagrams/networks-domains-instances.png)

When you add a feature or a read endpoint, decide **which network and domain** it belongs to, and **which instance layer** it reads from, before writing code. The two read layers (instance-local and inter-instance) are covered in [Read & Write Paths](/core-concepts/technical/read-write-paths/).

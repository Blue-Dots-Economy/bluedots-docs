---
title: The Blue Dots Approach
description: The four levers that make Blue Dots work in a district, how one set of software serves many sectors, and how a listing becomes a match.
sidebar:
  order: 3
---

Blue Dots helps people and organisations in the same district find each other. It works through **four levers** that support each other.

## The four levers

1. **Shared open-source software.** A person creates a dot in a 2–3 minute voice call, in their own language, on any phone, including a basic feature phone. A dot is a short listing that says what someone needs or offers, pinned to a place on the district map. The person does not need to fill in a form, speak English or use an app.

   AI turns the call into a structured listing and puts it on the map. After that, it suggests nearby options to people and shows administrators what is happening across the district. This reaches the 80%+ of the district economy that has never appeared on any digital system. The software is offered as Digital Public Goods (DPGs).

2. **Local organisations that sign people up.** Local organisations bring in whole groups at once, so listings grow quickly. Skilling centres and ITIs (Industrial Training Institutes) sign up young people for the Blue Dot jobs network. Schools and education NGOs sign up students for the Yellow Dot. Disabled persons' organisations (DPOs) help people register on the Purple Dot.

   Government departments can sign people up on any dot. One ITI can bring hundreds of students, and its checks make each listing more trustworthy. These organisations are called aggregators.

3. **District facilitation team.** Without regular upkeep, dots go out of date and people fall back on word-of-mouth. The district administration anchors a facilitation team that keeps listings current, connects aggregators and innovators, and follows up. Its job is coordination; technology is run separately. It typically has 6–8 members from government, the social sector and MSME (micro, small and medium enterprise) associations, with a small Project Management Unit (PMU) behind it.

4. **Innovators.** As more people list, the map becomes useful to private organisations. In the jobs network these include staffing firms, assessment providers, placement firms, and transport and financial-services providers. In the jobs pilots, finding people cost them almost nothing and a match took days instead of weeks. On a farming network, for example, a custom hiring centre that rents out tractors could find farmers who need one.

Together, the four levers turn people and organisations already in the district into listings that others can trust and act on. They need no new investment in buildings or programmes.

:::note[Consent and stewardship]
Every dot exists because the person or organisation behind it chose to list it. On the jobs and disability networks, phone numbers are shared only after both sides agree; Orange Dot tourism listings are public on purpose. The district administration runs the programme locally, with support from state-government champions.
:::

## One set of software for many sectors

Each sector is a **network** with its own rules, written in a schema file: jobs on the Blue Dot network, education on the Yellow Dot network, and services for persons with disabilities on the Purple Dot network. The schema says who can list, what they fill in and what they can do with each other. A new sector needs a new schema file, and the code stays the same. See the [schema-driven model](/core-concepts/technical/schema-driven-model/) for how this works, and [Networks, Domains & Instances](/core-concepts/networks-domains-instances/) for the networks that exist today.

## How this relates to the lifecycle

The four levers are the conditions a district needs. [The Dot Lifecycle](/core-concepts/blue-dot-lifecycle/) covers what one person or organisation goes through inside those conditions. It has seven steps, from being identified to being live and findable.

## From listing to match

In short, a dot goes from listing to match like this:

1. A **seeker** or **provider** creates a listing (directly, by voice, or through an aggregator).
2. The listing is stored as a schema-typed **item** in a **Signals DPG** instance, one running copy of the software.
3. The network searches the relevant instances and finds possible matches.
4. An **action** between two items, such as apply or connect, creates a recorded **event**.
5. Outcomes are recorded as data. They improve future matches and show results for each district.

These terms (*item*, *action*, *event*, *instance*, *network*, *domain*) have exact meanings across the system. See [Core Concepts](/core-concepts/) and the [Glossary](/core-concepts/glossary/) for definitions.

## Why DPGs

Blue Dots is built as **Digital Public Goods**, so anyone adopting it can run their own instances and serve their own roles. Their instances still work with others on the same network. The next page explains what that means in practice: see [Blue Dots as a DPG](/overview/blue-dots-as-a-dpg/).

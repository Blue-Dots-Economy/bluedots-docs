---
title: Introduction
description: What Blue Dots is, what a dot is, which sectors it serves, and how this documentation is organised.
sidebar:
  order: 1
---

**Blue Dots** is free, open-source software that helps people and organisations in the same district find each other. It serves many sectors, such as jobs, education, disability support and tourism. Jobs is the first sector running in the field.

In most districts, people who need something live close to people who offer it. Most of them are not listed anywhere online, so they don't know about each other. Blue Dots calls this the [paradox of proximity](/overview/paradox-of-proximity/).

## What is a dot?

A **dot** is a short listing that says what a person or organisation needs or offers. People nearby who can help see it and can ask to connect. In most networks, phone numbers are shared only after both sides agree.

Example, Blue Dot (jobs): A young person registers by phone call in their own language. A skilling centre checks the profile. A nearby employer with a vacancy sees it and sends an interview invite. The young person accepts before their number is shared.

Example, Yellow Dot (education): A Class 12 commerce student asks for help with accounts. A school or education NGO helped the student sign up. A tutor who teaches Class 12 commerce and will travel up to 5 km sends a connect request. The student accepts.

A person can create a dot in a few minutes, by voice call or in the app. [The Blue Dots Approach](/overview/the-blue-dots-approach/) explains how.

## One platform, many dots

Each colour is a separate network for one sector. All of them run on the same software.

- **Blue:** livelihoods for youth (jobs). Live, piloted.
- **Yellow:** education avenues and services. Network defined.
- **Purple:** economic participation of persons with disabilities. Network defined.
- **Orange:** tourism. Network defined.
- **Pink:** women's labour-force participation. Possible.
- **Green:** farming efficiency. Possible.
- **Brown:** growth for small and medium businesses (SMBs). Possible.

"Network defined" means the data rules for that network exist. "Possible" means no network has been built yet. [The Dots Family](/explore/beyond-livelihoods/) gives an example for each dot. [Networks, domains and instances](/core-concepts/networks-domains-instances/) lists each network's roles and status.

## Why it matters

When people can't find each other locally, it shows up in national figures. Across Indian districts today:

- Service uptake is under 50% of its potential.
- Women's labour-force participation is under 35%.
- Scheme budget utilisation runs below 70%.
- Youth placement rates (jobs) sit below 20%.

Helping people find each other in India's top 100 districts is a conservatively estimated **₹87,500 crore** opportunity in livelihoods alone. [The Economics of Local Discovery](/explore/economics/) shows how this figure is worked out.

[What We're Learning](/explore/learnings/) records how close to home people found work in the jobs pilot. A campaign for persons with disabilities (PwDs) has also used the same software; see the Purple Dots section of [The Dots Family](/explore/beyond-livelihoods/).

## How Blue Dots is built

Blue Dots is built as two **Digital Public Goods (DPGs)**. A DPG is open-source software that any organisation can deploy and change. An adaptor is the organisation that deploys Blue Dots, such as a state department.

- **Signals DPG** stores dots (called signals in the software) and matches them across running copies of the software.
- **Aggregator DPG** is the app that lets organisations sign people up and add their dots to the network in bulk.

Adaptors usually start with Signals, then add the Aggregator app when partner organisations join. The rest of this documentation covers both.

## What an adaptor does

Most of an adaptor's work is configuration. Registration, finding, connecting, notifications and tracking already exist. So do these:

- **Participant types.** Each network defines its own. The jobs network has job seekers and job providers, and the deployed pilot schema adds service providers. The Yellow Dot (education) network has students and tutors or counsellors. See [participant profiles](/core-concepts/participant-profiles/).
- **Onboarding routes.** Assisted or self-serve, in the app or by AI voice call, [both supported](/core-concepts/blue-dot-lifecycle/#2-choose-the-route-in).
- **Verification checks.** Structured, completed and consented, [built in](/core-concepts/blue-dot-lifecycle/#5-verification-checks).
- **Deployment.** [Automated on AWS](/guides/installation/cloud-setup/aws/deployment/), and adaptable to any major cloud.

The adaptor brings local knowledge and the local organisations that can reach people. The DPGs provide the software. The local choices are who should publish dots, which organisations can reach them, and which sector to start with. [The lifecycle](/core-concepts/blue-dot-lifecycle/) and the [district activation guide](/guides/district-activation/) walk through them.

## How this documentation is organised

| Section | What you'll find |
| --- | --- |
| [Start Here](/start/build/) | Four guided paths: build, deploy, onboard, evaluate. Pick one and follow it in order. |
| [Overview](/overview/introduction/) | What Blue Dots is, the problem it addresses, the approach and the DPG model. |
| [Core Concepts](/core-concepts/) | Signals, aggregators, networks, the shared vocabulary, architecture and technical docs. |
| [Guides](/guides/) | Installation, adaptor onboarding, configuration, API reference and deployment. |
| [API Reference](/api/) | Generated, always-current operation reference for all three services. |
| [Explore](/explore/beyond-livelihoods/) | The dots family, use cases, pilots, field learnings and economics. |
| [Community](/community/contributing/) | How to contribute, the roadmap and release notes. |

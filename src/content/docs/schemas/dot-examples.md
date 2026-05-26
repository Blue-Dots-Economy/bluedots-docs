---
title: Existing Example Networks
description: Walkthrough of the checked-in Yellow Dot and Blue Dot network configs.
head: []
---

The repository includes complete example network configs under `examples/schemas`.

## Yellow Dot

Path:

- `examples/schemas/yellow_dot/network.json`

Use case:

- education network

Domains:

- `student`
- `tutor`
- `coaching_center`

Item schema examples:

- `student.profile_1.0`
- `student.profile_1.1`
- `tutor.profile_1.0`
- `coaching_center.profile_1.0`

Action:

- `connect`

The `connect` action currently allows a `student` to connect to a `tutor`. The requirement payload captures the subject and goal, and the event payload captures status and remark fields.

## Blue Dot

Path:

- `examples/schemas/blue_dot/network.json`

Use case:

- jobs and hiring network

Domains:

- `seeker`
- `provider`

Item schema examples:

- `seeker.profile_1.0`
- `provider.job_posting_1.0`

Action:

- `apply`

The `apply` action allows a seeker to apply to a provider's job posting. The requirement payload captures job id, cover note, and optional resume URL. The event payload captures application status and remark.

## Example Payloads

Request payload examples live in:

- `examples/api/yellow_dot.md`
- `examples/api/blue_dot.md`

Use these examples to verify API behavior after authoring a new network schema.

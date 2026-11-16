---
title: Building Search Requests
description: How to turn what a person asks for into a Signals Search request — which part goes into filters, which into location, which into free text — with ready-made requests for voice bots and apps.
sidebar:
  attrs:
    class: bd-changed
  order: 9
changed_sections:
  - _top
---

This page is for anyone who builds a call to Signals Search: a voice bot configurator, an app developer, or an adopter wiring their own tool. It covers which part of a request does what, and gives ready-made requests you can copy.

For how search works inside, read [Signals Search Architecture](/get-started/architecture/signals-search/) first. Every field of every endpoint is in the generated [Signals-Search API reference](/api/signals-search/).

## The one rule: put each part where it belongs

A person rarely asks for one thing. "Full-time plumber work near me, I am a fresher" has four parts, and each one belongs in a different place in the request. Putting everything into the free-text field is the most common mistake: search then guesses from meaning what an exact filter would have answered for certain.

| What the person said | Kind of field in `network.json` | Where it goes in the request |
| --- | --- | --- |
| "Full-time", "fresher" | enum | `intent.filters` (exact match) |
| "at least ₹15,000", "2 positions" | number | `intent.filters` (`gte`, `lte`, …) |
| "near me", "in this area", a map view | location | `intent.spatial` (filter) or `intent.orderingCenter` (sort only) |
| "plumber", "fix pipes and taps" | free text marked `vectorize: true` | `intent.textSearch` (ranked by meaning) |
| a name, phone number, exact address | marked `private: true` | **nowhere**: search never uses private fields |

A filter is certain: an item either passes or does not. Free text only orders the results and never removes one. If the person gave a value that matches an enum, a filter is always the better choice.

### Find out which fields you can use

Open your domain's `network.json` and look at the item type you are searching. For the jobs domain this is `job_posting_1.0` in the [blue_dot minimum standard](https://github.com/Blue-Dots-Economy/signals-dpg/blob/main/examples/schemas/blue_dot/network.json). Other domains work the same way. (The code calls a domain a *network* and a participant type a *domain*, so the request says `networkId: "blue_dot"` and `domain: "provider"`.)

For each property:

- **`private: true`**: do not use it at all.
- **`enum` list** (or `items.enum` for a list field): a filter. Values must match the enum exactly, including case: `"Full-time"`, never `"full time"`.
- **`type: integer` or `number`**: a range filter.
- **`vectorize: true`**: its text is part of meaning-based ranking.

In the jobs domain, for example: `natureOfJob` (enum: `Internship`, `Apprenticeship`, `Full-time`, `Flexible`, `Not Available`), `candidateExperienceType` (enum: `Fresher`, `Worked before`, `Returning after a break`), `salaryMin` / `salaryMax` (numbers) and `role` (free text, vectorized). `jobProviderLocation` is private, so a town name in free text matches nothing in it; use a location filter instead.

## The request at a glance

```http
POST /v1/search
x-api-key: <your Signals Search API key>
content-type: application/json
```

```json
{
  "context": {
    "messageId": "any-unique-id-for-tracing",
    "networkId": "blue_dot",
    "domain": "provider",
    "itemType": "job_posting_1.0"
  },
  "message": {
    "intent": {
      "textSearch": "plumber",
      "item": { "id": "<the caller's own profile item_id>" },
      "filters": [
        { "op": "in", "target": "item_state.natureOfJob", "value": ["Full-time"] }
      ],
      "spatial": [{ "op": "s_dwithin", "distanceMeters": 20000 }],
      "sort": "relevance"
    },
    "pagination": { "limit": 5, "offset": 0 }
  }
}
```

Every part of `intent` is optional; send only what you have. `context.domain` and `context.itemType` are what you are looking **for** (here, job postings), not who is asking.

### Filters

Each filter is `{ op, target, value }`. `target` is always `item_state.<field name>`. All filters must pass (they are joined with AND).

| `op` | Use for | `value` |
| --- | --- | --- |
| `eq` / `neq` | one exact value of a single-value field | a string, number or boolean |
| `in` | any of several values of a **single-value** field | an array, e.g. `["Full-time", "Flexible"]` |
| `contains_any` | a **list** field (`type: array`) that holds at least one of the values | an array |
| `contains` | a list field that holds **all** of the values | an array |
| `gt` / `gte` / `lt` / `lte` | numbers | a number |

Pick the operator from the field's type in `network.json`, not from how many values the person chose. `in` on a list field always returns nothing, even for one value; use `contains_any`. An `eq` or `in` on a field the item does not have never matches.

### Location

There are four ways to use location. Coordinates are always **longitude first, then latitude** (GeoJSON order).

- **Within a radius**: `{ "op": "s_dwithin", "geometry": { "type": "Point", "coordinates": [77.59, 12.97] }, "distanceMeters": 10000 }`. Items outside are removed.
- **Around the caller's own profile**: send `item.id` and leave out `geometry`: `{ "op": "s_dwithin", "distanceMeters": 20000 }`. The profile's stored location is the centre.
- **Inside a map rectangle**: `{ "op": "bbox", "minLat": …, "minLng": …, "maxLat": …, "maxLng": … }`. All four are required.
- **Around a place the person named**: `{ "op": "s_dwithin", "address": "Dharwad" }`. Search turns the text into a map point and uses it as the centre. See [Searching by a place name](#searching-by-a-place-name).

Send at most one of these. Without `distanceMeters`, a radius around `geometry` or the caller's profile uses the deployment default (30 km unless the operator changed it). With `address`, the radius follows the precision table in [Searching by a place name](#searching-by-a-place-name). To sort by distance without removing anything, send `intent.orderingCenter: { "type": "Point", "coordinates": [lng, lat] }` with `sort: "nearest"`.

### Searching by a place name

When the caller has no profile, pass the place they said in `address` instead of `geometry`:

```json
"spatial": [{ "op": "s_dwithin", "address": "Dharwad" }]
```

- `address` is 1 to 200 characters after trimming. Send the place as the person said it; do not add other words.
- Do not combine `address` with `geometry` in the same clause, or with `intent.item.id`. Either returns `400 VALIDATION_ERROR`. A caller with a profile should use the profile as the anchor.
- `distanceMeters` is optional. When you leave it out, the radius depends on how precisely the place was found:

| `precision` value | What the text resolved to | Radius |
| --- | --- | --- |
| `postal_code` | Postal code | 10 km |
| `locality` | Locality or neighbourhood | 10 km |
| `city` | City | 25 km |
| `district` | District | 50 km |

An operator can change these radii for an instance. Text that names only a country or a state does not resolve (see the errors below), because the area would be too large to be a useful filter.

- `sort: "nearest"` uses the resolved point as the centre, so you do not need `orderingCenter`.
- The flat endpoint takes the same field as `message.intent.spatial.0.address`. A numeric postcode such as `"580001"` can be sent as is: the address is always treated as text, even though the flat endpoint reads `580001` as a number.

The response tells you what search understood: see `resolvedLocation` under [Reading the response](#reading-the-response).

### Free text

`textSearch` should hold only what is left after filters and location: the kind of work or service in the person's words. Do not put names, phone numbers or addresses in it. Do not add a place name unless your domain marks a location text field `vectorize: true`.

- **Without an anchor**, the text is turned into a vector and decides the order. Every item that passes the filters is returned.
- **With an anchor** (`item.id`), the profile decides the order and the text narrows: each word must appear in at least one vectorized field.

### Order and pages

`sort` is `relevance`, `nearest` or `newest`. If the request cannot support the order you asked for (for example `relevance` with no text and no anchor), search uses `newest` and says so in `meta.sort_applied`. Leaving `sort` out picks relevance when there is text or an anchor.

`pagination.limit` is 1 to 100 (default 20) and `offset` starts at 0. For the next page, send the same request with `offset` increased by the number already shown. Identical requests are cached for about 45 seconds.

## Ready-made requests

All examples are for the jobs domain. Other domains change only `networkId`, `domain`, `itemType` and field names.

### A returning caller who has a profile

Use the profile as the anchor. Results are ranked by how well each job fits the profile, limited to the area around the profile's own location, and narrowed by what the caller just said.

```json
{
  "context": { "messageId": "call-123", "networkId": "blue_dot", "domain": "provider", "itemType": "job_posting_1.0" },
  "message": {
    "intent": {
      "item": { "id": "6f1c2a7e-0000-4000-8000-000000000001" },
      "spatial": [{ "op": "s_dwithin", "distanceMeters": 20000 }],
      "filters": [{ "op": "in", "target": "item_state.natureOfJob", "value": ["Full-time"] }]
    },
    "pagination": { "limit": 5 }
  }
}
```

The anchor must be the caller's own profile. If it is not indexed yet (for example, a profile created a few seconds ago, or one with no vectorized field filled in), search returns `404 ANCHOR_NOT_FOUND`; fall back to the first-time caller request. If the profile has no location, a radius without `geometry` returns `422 ANCHOR_HAS_NO_LOCATION`; drop `spatial` and search again.

### A first-time caller with no profile

There is no stored location yet. Use free text for the kind of work and filters for every enum value the caller gave.

```json
{
  "context": { "messageId": "call-456", "networkId": "blue_dot", "domain": "provider", "itemType": "job_posting_1.0" },
  "message": {
    "intent": {
      "textSearch": "plumber",
      "filters": [
        { "op": "in", "target": "item_state.natureOfJob", "value": ["Full-time", "Flexible"] },
        { "op": "eq", "target": "item_state.candidateExperienceType", "value": "Fresher" }
      ]
    },
    "pagination": { "limit": 5 }
  }
}
```

If the caller named a place, pass it as `address`. Search finds the place and limits results to the area around it; nothing else about the request changes.

```json
{
  "context": { "messageId": "call-457", "networkId": "blue_dot", "domain": "provider", "itemType": "job_posting_1.0" },
  "message": {
    "intent": {
      "textSearch": "plumber",
      "spatial": [{ "op": "s_dwithin", "address": "Dharwad" }],
      "filters": [{ "op": "in", "target": "item_state.natureOfJob", "value": ["Full-time"] }],
      "sort": "nearest"
    },
    "pagination": { "limit": 5 }
  }
}
```

With no `distanceMeters`, a place that resolves to precision `city`, such as Dharwad, searches within 25 km. If the caller gave no place, leave `spatial` out and the search has no location limit. A place name in `textSearch` does not limit it.

### A map or list view in an app

Limit to what the map shows, and sort nearest to the user.

```json
{
  "context": { "messageId": "ui-789", "networkId": "blue_dot", "domain": "provider", "itemType": "job_posting_1.0" },
  "message": {
    "intent": {
      "spatial": [{ "op": "bbox", "minLat": 12.90, "minLng": 77.50, "maxLat": 13.05, "maxLng": 77.70 }],
      "orderingCenter": { "type": "Point", "coordinates": [77.59, 12.97] },
      "sort": "nearest"
    },
    "pagination": { "limit": 20, "offset": 0 }
  }
}
```

A user may also type a place instead of moving the map. Send the typed text as `address` and ask for nearest first:

```json
{
  "context": { "messageId": "ui-790", "networkId": "blue_dot", "domain": "provider", "itemType": "job_posting_1.0" },
  "message": {
    "intent": {
      "spatial": [{ "op": "s_dwithin", "address": "Koramangala, Bengaluru", "distanceMeters": 5000 }],
      "sort": "nearest"
    },
    "pagination": { "limit": 20, "offset": 0 }
  }
}
```

Show `message.resolvedLocation.label` to the user (for example "Searching near Koramangala, Bengaluru") so they can see which place was used, and recentre the map on `resolvedLocation.point`.

An app built on the Signals UI pattern can call the Signals DPG at `POST /api/v1/network/item/discover` instead. It takes the same choices with different names (`q`, `filters: [{ field, values }]`, `item_latitude` / `item_longitude` / `distance_meters`, `min_lat` … `max_lng`, `ordering_latitude` / `ordering_longitude`, `anchor_item_id`, `sort`). It picks `in` or `contains_any` for you and still answers, without meaning-based ranking, if Signals Search is down.

### "Show me more"

Send the identical request with `offset` set to how many results the person has already heard or seen. Changing anything else starts a new list.

## Setting up a voice bot tool

A voice bot's language model fills the request from the conversation. It fills only the parameters you give it, so give it one parameter per part:

- **`query_text`** → `textSearch`. Describe it as "the kind of work in the caller's words, without place names, names or phone numbers".
- **One parameter per enum filter** you want to support, e.g. `job_type` → a filter on `natureOfJob`. List the exact allowed values in the parameter description and tell the model to leave it out if the caller did not say.
- **`offset`** → `pagination.offset`, for "more jobs".
- **The profile ID** from the profile lookup tool → `item.id`, with `s_dwithin` and no `geometry`, when the caller has a profile.

Avoid descriptions that tell the model to put everything into one sentence. They turn exact requests into guesses.

### Tools that can only send flat keys

Some voice platforms (Raya, for example) can only send one level of string keys. Use `POST /v1/search/flat`: each key is a dot-separated path, and a number in the path is a list position.

```json
{
  "context.messageId": "call-456",
  "context.networkId": "blue_dot",
  "context.domain": "provider",
  "context.itemType": "job_posting_1.0",
  "message.intent.textSearch": "plumber",
  "message.intent.filters.0.op": "in",
  "message.intent.filters.0.target": "item_state.natureOfJob",
  "message.intent.filters.0.value": "[\"Full-time\",\"Flexible\"]",
  "message.pagination.limit": "5"
}
```

Each value is read as JSON when it can be, so `"5"` becomes the number 5 and `"[\"Full-time\"]"` becomes a list. A value that only looks like a number stays a string only if you quote it inside: send `"\"560001\""` for the PIN code `"560001"`. The same applies to free text that is only digits.

## Reading the response

```json
{
  "message": {
    "items": [
      {
        "item_id": "…",
        "item_state": { "role": "Plumber", "natureOfJob": "Full-time", "…": "…" },
        "item_locations": [{ "lat": 12.97, "lng": 77.59 }],
        "score": 0.8123,
        "distanceMeters": 4210
      }
    ],
    "meta": { "total": 42, "limit": 5, "offset": 0, "sort_applied": "relevance" },
    "resolvedLocation": {
      "input": "Dharwad",
      "label": "Dharwad, Karnataka, India",
      "point": { "type": "Point", "coordinates": [75.0078, 15.4589] },
      "precision": "city",
      "radiusMeters": 25000
    }
  }
}
```

- **`item_state`** is the public view of the item. Private fields come back masked.
- **`score`** (0 to 1, higher is closer) appears only when results were ranked by meaning.
- **`distanceMeters`** appears only when a centre was used.
- **`meta.total`** is the number of items that passed the filters, across all pages.
- **`meta.sort_applied`** is the order actually used. Check it before saying "nearest first" or "best match first" to a user.
- **`resolvedLocation`** appears only when the request used `address`. `input` is the text you sent, `label` is the place found, `point` is its centre (longitude first), `precision` is what it resolved to (`postal_code`, `locality`, `city` or `district`) and `radiusMeters` is the radius used.

## Errors

| Status | `error` | What to do |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Fix the request; the message names the field. Common causes: `in` without an array, a number filter with a text value, two `spatial` clauses, a wrongly ordered rectangle, or `address` combined with `geometry` or `item.id`. |
| 401 | `UNAUTHORIZED` | Send a valid `x-api-key`. |
| 403 | `INTERACTION_NOT_ALLOWED` | The anchor profile's participant type may not search this one. Check `actions` in `network.json`. |
| 404 | `UNSERVED_DOMAIN` | This instance does not serve that `networkId` / `domain`. |
| 404 | `ANCHOR_NOT_FOUND` | The anchor profile is not indexed yet. Search again without `item.id`. |
| 422 | `ANCHOR_HAS_NO_LOCATION` | The anchor profile has no location. Send `geometry` or drop `spatial`. |
| 422 | `LOCATION_NOT_RESOLVED` | The `address` could not be turned into a place ("Could not resolve location '<address>' to a place"), or it named only a country or state. Ask the person for a more specific place. |
| 503 | `GEOCODER_UNAVAILABLE` | Place lookup is temporarily unavailable ("Geocoding is temporarily unavailable; retry later"). Retry, or search again without `spatial`. Also returned when the instance has not turned on place-name search. |

## Common mistakes

- **Everything in `textSearch`.** Enum values and places put in text become guesses. Use filters and location.
- **`[lat, lng]` instead of `[lng, lat]`.** Coordinates are longitude first. Swapped values search somewhere else entirely, usually with no results.
- **`in` on a list field.** It returns nothing. Use `contains_any`.
- **Enum values in the wrong case or spelling.** `"full-time"` does not match `"Full-time"`.
- **Expecting free text to remove results.** Without an anchor it only orders them. Use a filter to exclude.
- **Using another person's profile as the anchor.** The anchor is always the caller's own profile.

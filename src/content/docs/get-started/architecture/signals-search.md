---
title: Signals Search Architecture
description: How Signals Search keeps a search copy of every blue dot, which fields it uses for location, filters and meaning, and how it answers a search request.
sidebar:
  attrs:
    class: bd-changed
  order: 4
changed_sections:
  - _top
---

**Signals Search** is the service that answers "find blue dots relevant to me". It runs next to the [Signals DPG](/get-started/architecture/signals-dpg/) and reads the same PostgreSQL database. It finds blue dots by location, by exact field values and by meaning, in one request.

This page explains how it works. To build a request, see [Building Search Requests](/api/search-requests/).

## What it is made of

Signals Search runs as two processes from one code base:

- **The ingestion worker** keeps a search copy of every item in a table called `item_search`. It listens for item changes on a Redis stream that the Signals DPG writes to, and a sweep every minute catches anything the stream missed.
- **The query API** answers `POST /v1/search` and `POST /v1/search/flat`. It reads `item_search` and the Signals `items` table, and caches each answer in Redis for 45 seconds.

It uses PostgreSQL with two extensions: pgvector for meaning and PostGIS for location. Text is turned into vectors by an embedding model. The default is the open-source BGE-M3 model, served by Hugging Face Text Embeddings Inference inside the cluster. An optional second model can re-rank free-text results; it is off by default.

Signals Search serves one Signals instance. It does not query other instances.

## How each field is used

The domain's `network.json` decides how every field of an item can be searched. (The code calls a domain a *network* and a participant type a *domain*.) Four rules cover every field:

| Kind of field | How search uses it |
| --- | --- |
| Marked `private: true` (personal details such as name, phone or exact address) | **Never used.** It is not turned into a vector and cannot be matched. Filters only ever see the masked value. |
| Location (the item's `item_locations` points) | Location filters (within a radius, or inside a map rectangle) and nearest-first sorting. |
| Enum or number | Exact filters (`eq`, `in`, `contains_any`) and range filters (`gt`, `gte`, `lt`, `lte`). |
| Free text that is not private and is marked `vectorize: true` | Turned into a vector and ranked by meaning. |

A field can be in more than one row. For example, `natureOfJob` in the jobs domain is an enum and is also marked `vectorize`, so it can be filtered exactly and also adds to the meaning of a job.

If a field is marked both `private` and `vectorize`, Signals Search stops with an error whenever it indexes or searches that item type. Personal data cannot reach the vector index by mistake.

The location of an item comes from its stored map points. A private address field such as `jobProviderLocation` is still never read; only the points are used. A town name typed in a free-text field helps meaning-based ranking only if that field is marked `vectorize`.

## How an item gets indexed

```text
Signals DPG writes an item
        │  publishes a change on the Redis stream
        ▼
Ingestion worker
  1. reads the item's public fields (never the private ones)
  2. joins the `vectorize` fields into one text, field by field
  3. turns that text into a vector with the embedding model
  4. saves the vector, the location points and the lifecycle state in item_search
```

The worker skips the embedding step when nothing it uses has changed. An item with no `vectorize` field filled in is still saved without a vector. It can be found by location and filters, but it ranks last when results are ordered by meaning.

## How a search request is answered

```text
POST /v1/search
  1. check the API key and that this instance serves the requested participant type
  2. if a profile is given as the anchor: load its vector and location,
     and check the domain's interaction rules allow it to search this participant type
  3. if there is free text and no anchor: turn the text into a vector
  4. keep only items that are live, of the requested type,
     and that pass every filter and the location limit
  5. order what is left: by meaning, by distance or by newest
  6. return one page, with the total count
```

Filters and location limits run first and decide which items can appear. Ordering runs second and only decides their order. Free text on its own never removes an item: every item that passes the filters is returned, the closest in meaning first.

### Three ways to rank by meaning

- **Free text only.** The text is turned into a vector and items are ordered by how close their vector is.
- **An anchor profile only.** The caller passes the ID of a profile as `intent.item.id`. The profile's stored vector is used, so the results are the items closest to that person's profile. The search only runs if the domain's interaction rules let that profile's participant type act on the requested one, for example seeker to provider in the jobs domain.
- **Anchor and free text together.** The profile still decides the order. The text narrows the results: every word must appear in at least one `vectorize` field.

### How the order is chosen

A request can ask for `sort`: `relevance`, `nearest` or `newest`. If what it asks for is not possible, search falls back to `newest` instead of failing. The response always says which order was used in `meta.sort_applied`.

| Requested `sort` | Used when | Otherwise |
| --- | --- | --- |
| `relevance` | the request has free text or an anchor | `newest` |
| `nearest` | there is a centre: `orderingCenter`, a radius filter's centre, or the anchor's location | `newest` |
| `newest` | always | — |
| not sent | `relevance` if there is text or an anchor; else `nearest` if there is a radius filter; else newest | — |

## The two ways in

- **Signals UI** never calls Signals Search directly. It calls the Signals DPG at `POST /api/v1/network/item/discover`, which accepts only filters on declared, non-private fields and adds the viewer's own profile as the anchor. If Signals Search is down, the Signals DPG answers from its own database instead, without ranking by meaning.
- **Voice bots and other integrations** call Signals Search directly with an API key: `POST /v1/search`, or `POST /v1/search/flat` for tools that can only send one level of keys.

## Coming later

A first-time caller often has no profile yet, so no stored location. A later release will accept a place name in its own field and turn it into map points (geocoding), so a search can be limited by area without a profile. Until then, a search without a profile has no location limit.

## Related pages

- [Building Search Requests](/api/search-requests/): the request fields and ready-made requests.
- [Signals-Search API reference](/api/signals-search/): every field of every endpoint.
- [Schema-Driven Model](/get-started/architecture/schema-driven-model/): how `network.json` defines items and fields.
- [Signals DPG Setup](/deploy/local/signals-dpg/): run Signals Search locally.

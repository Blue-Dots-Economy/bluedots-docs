---
tag: 202610-s1-rc1
---

## Summary

Sample sprint release: employers can sort the job list, and search shows results near the seeker first.

## Release Notes

**Search and discovery**
- Sample: the list view lets you pick the sort order. (Blue-Dots-Economy/signals-dpg#9001)
- Sample: search results nearby are shown first. (Blue-Dots-Economy/signals-search#9002)

## In Plain Terms

This is sample text for testing the Releases pages. Employers can now choose how the job list is sorted. A person searching for work sees jobs close to home at the top.

## Breaking changes / config

- Sample: `SEARCH_DEFAULT_RADIUS_KM` sets the default search radius. Default `10`. Set it if your district needs a wider radius. (Blue-Dots-Economy/signals-search#9002)

## What users will notice

- Sample: the job list has a new "Sort by" menu.

## Deploy ordering

- Sample: deploy signals-dpg (Blue-Dots-Economy/signals-dpg#9001) before signals-search (Blue-Dots-Economy/signals-search#9002), because search reads the new sort field.

---
repo: "signals-search"
tag: "202609-s2-rc1"
commit: "408a78c7ee615abfe901f40e1686e3e6b9098fd9"
base: "main"
previous_tag: "202609-s1-rc3"
cut_at: "2026-10-22"
release_url: "https://github.com/Blue-Dots-Economy/signals-search/releases/tag/202609-s2-rc1"
prs:
  - number: 193
    title: "release: develop → main (2026-10-14)"
    url: "https://github.com/Blue-Dots-Economy/signals-search/pull/193"
notes_missing: false
---
## Release Notes
- Release images are now built only when a release tag is cut (or by hand), and only from a commit whose CI passed. Nothing is published from branch pushes.
- The `tei-bge-m3` embedding image is no longer rebuilt automatically; rebuild it manually and pin its tag in `global-images.yaml` when it changes.
- Dependency and security-alert updates.

## In Plain Terms
Nothing changes in how search works. What changes is how its software packages are built: they used to be rebuilt every time code landed, and now they are only built when we deliberately cut a release, and only if the automated tests have passed on that exact code. That stops untested code from ever being packaged for deployment.

## Breaking changes / config
None.

## What users will notice
None.

## Deploy ordering
- **signals-dpg with bluedots-automation:** signals-dpg #757 needs Keycloak, and automation #250 makes `AUTH_PROVIDER=keycloak` the chart default. An environment still on better-auth must not take this signals image.
- **aggregator-dpg:** run `docs/contact-migration-runbook.md` (migration 0026 can't be reversed) before rolling the new image on existing instances.
- **Images:** nothing publishes from branches any more. Cut the release tag via `cut-release` from `main` (or `develop`) after all promotions land. Push the tag to bluedots-e2e last, after the four service repos have published images for it.

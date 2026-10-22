# Release notes hub — design

**Date:** 2026-10-22
**Status:** Draft, awaiting review
**Repos touched:** bluedots-docs (hub + this spec), bluedots-automation (reusable `create-release` workflow), signals-dpg, aggregator-dpg, signals-search, notification-service (thin `create-release` callers), new org marketplace repo `Blue-Dots-Economy/bluedots-claude-plugins` (two skills)

## Why

Release notes today are written once, by hand, and then lost:

1. The release PR `feature → develop` gets curated notes in its description (e.g. signals-dpg #717: Summary / Release Notes / In Plain Terms / Deploy ordering / Verification / Checklist). Only one person's local Claude Code setup knows how to write them that way, so anyone else opening the PR gets the bare template.
2. The notes are copied by hand into the `develop → main` PR.
3. Devops now cut tags with the per-repo `cut-release` workflow, which publishes **GitHub's auto-generated PR-title list** as the release body. The curated notes never reach the release.
4. Each repo keeps its own copy. Nothing describes the fleet as a whole at a release, and the docs site has no releases section.

The readers who need this are not engineers:

- **Program managers on a live instance** decide whether to upgrade, need to know what breaks or needs config changes, and need to train end users on visible changes.
- **Adopters** choose which version to run and need a version history.
- **Engineers / devops** need the per-repo technical detail and deploy order.

A release cycle should count as complete when its page is published, not only when the tags exist.

## Goals

- A **Releases** section on the docs site: an index of sprints plus one page per sprint, with one entry per rc.
- Each entry speaks to all three audiences, following the existing release-PR structure.
- Release notes are written well by **anyone on the team**, through a shared Claude Code skill rather than one person's private setup.
- Moving text from PRs to the docs site is automatic. Writing and judgement stay with people (aided by their local Claude).
- Publishing goes through a docs PR that the maintainer reviews and merges manually, the same model as `openapi-sync`.

## Non-goals

- **No upgrade verdict.** Pages state facts (changes, breaking changes, config, deploy order, user-visible changes). Adopters and PMs make the upgrade call themselves.
- **No AI in CI.** No API keys in GitHub Actions. All drafting happens in the local Claude Code session of whoever runs the step.
- No backfill of past tags now. A manual backfill can come later (see "Later").
- No semver support yet. Tags stay `YYYYMM-sN-rcN`; semver is a future switch, out of scope.
- Instance-specific or suffixed cuts (`-alimco`, `-hotfix`, `-up-dhwd`) are **not** published. The team is deciding separately whether to keep making them. Going forward, a hotfix is the next rc.

## Anti-goals (would be a failure even if it works)

- Pages that read like a PR-title dump, or that only engineers can follow.
- Automation that overwrites text a human has edited in the docs PR.
- A process that still only works on the maintainer's machine.
- A release page that hides which version of each component it contains.

## Release model this builds on

- **Tag format:** `YYYYMM-sN-rcN` (e.g. `202610-s1-rc1`), the same string in every repo that ships in that cut. `cut-release` already enforces `^20[0-9]{4}-s[0-9]+-rc[0-9]+$` (plus `v*.*.*`, ignored here).
- **Sprint tags are cut from `main` only.** `cut-release` keeps its `base` input for non-sprint tags, but refuses a `YYYYMM-sN-rcN` tag whose base is not `main`. This keeps every rc's range on one branch, so notes are never repeated or dropped.
- **Sprint** = the `YYYYMM-sN` prefix. **rc** = one cut within it. A hotfix becomes the next rc.
- Not every repo cuts every rc. Repos drift: as of today signals-search and notification-service last cut `202609-s1-rc3`, while signals-dpg and aggregator-dpg have only suffixed cuts since then.
- `cut-release` exists in signals-dpg, aggregator-dpg, signals-search and notification-service. bluedots-automation and ai-diffusion-dpg do not have it yet. They join the hub when they adopt it (same added step); this design does not add `cut-release` to them.

## Design

### Overview

```
release PR opened (feature→develop, develop→main)
   └─ author's Claude Code + skill "release-pr-notes"  → curated PR description
cut-release (per repo, manual, CI)
   ├─ tag + GitHub release whose body = curated notes (not PR titles)
   └─ push repo fragment → bluedots-docs branch release-notes/<tag> → open/update PR
release-page skill (local Claude Code, whoever closes the rc)
   └─ writes the rc's release-wide notes into that docs PR
maintainer reviews + merges docs PR  → page live → rc is complete
```

### 1. Content model in bluedots-docs

Per sprint, per rc, two kinds of files with different owners:

| File | Written by | Rule |
|------|-----------|------|
| `releases/<sprint>/<rc>/components/<repo>.md` | `cut-release` CI | Machine-owned. Rewritten on every push for that repo/rc. Humans may edit in the PR, but a re-run overwrites. |
| `releases/<sprint>/<rc>/notes.md` | `release-page` skill, then human edits | Human-owned. CI **never** writes or touches it. |

Each component fragment carries frontmatter: `repo`, `tag`, `commit` SHA, `base` branch, `previous_tag` (the last unsuffixed sprint tag in that repo), `cut_at` date, plus the list of source PRs (number + URL). The body holds the extracted sections (below).

The exact directory (`src/content/…` collection vs data files) and how pages render from these files are left to the builder. The sprint page must be generated from the files, not hand-assembled.

### 2. Docs site pages

- **Sidebar:** new top-level **Releases** group, after the existing groups.
- **Index (`/releases/`):** sprints newest first. Per sprint: name, date of its latest rc, the latest rc, a one-line summary (first line of the latest rc's `notes.md` Summary), and markers when any rc in the sprint has non-empty **Breaking changes / config** or **Deploy ordering**. The markers are facts, not a verdict.
- **Sprint page (`/releases/<sprint>/`):** rc entries, newest first. Each rc entry has:
  1. **Release-wide notes** from `notes.md`, in the release-PR structure (section 3).
  2. **Component table:** every repo that has ever published to the hub, with its version at this rc. If the repo cut this rc, show the tag and "changed". Otherwise show the most recent earlier tag on the hub and "unchanged since `<tag>`". Computed at build time from the fragments.
  3. **Per-repo sections** from the component fragments, each linking its source PRs and GitHub release.
- An rc whose PR has not merged does not appear. Merging is publishing.
- **Existing stub:** `src/content/docs/community/release-notes.md` is a hand-kept Keep-a-Changelog page, built but deliberately kept out of the sidebar ("placement not decided" in `CLAUDE.md`). The hub replaces it. Redirect its URL to `/releases/`, carry the useful "Unreleased" content (Keycloak version marker) into the relevant docs page or an "Before these releases" note on the index, and update the `CLAUDE.md` line that lists it as an off-sidebar page.
- **Writing rules:** release pages are subject to the repo's plain-language rules (`CLAUDE.md` R1–R8). The `In Plain Terms`, `What users will notice` and `Breaking changes / config` sections are written for a non-technical PM. The `Release Notes` and per-repo sections may stay technical, the same way `api/` pages are exempt. `pnpm check:style` must pass on the generated pages; any needed exceptions go in `.style-allow` with a reason.

### 3. Section structure (shared by PR descriptions, fragments and `notes.md`)

Taken from the house format (signals-dpg #717). The `release-pr-notes` skill and the PR template make these headings standard:

- `## Summary` — what changed and why (engineer-facing).
- `## Release Notes` — user-facing changes, grouped by theme, PR-linked.
- `## In Plain Terms` — jargon-free, for a PM or a non-expert reader.
- `## Breaking changes / config` — **new heading.** New or changed env vars, flags, schema / `network.json` changes, migrations, removed behaviour. Write "None." when empty, never omit the section.
- `## What users will notice` — **new heading.** Visible changes to screens, flows and wording that a PM would train end users on. Write "None." when empty.
- `## Deploy ordering` — cross-repo order constraints. "None." when empty.
- `## Verification` and `## Checklist` — stay in the PR, **not** extracted to the docs.

`cut-release` extracts Release Notes, In Plain Terms, Breaking changes / config, What users will notice and Deploy ordering. Extraction is by heading, and a section ends at the next same- or higher-level heading. This matches the parser rule already used by the develop-PR gate in bluedots-automation (`.github/actions/pr-gate/gate.mjs`), and the builder should reuse that logic rather than write a second parser.

### 4. `cut-release` becomes `create-release`, a reusable workflow

`cut-release` is renamed `create-release` ("Create release"). Its logic moves into one reusable workflow, `bluedots-automation/.github/workflows/create-release.yml` (`workflow_call`), following the gitleaks/`security-scan.yml` pattern. Each repo keeps a thin, SHA-pinned `create-release.yml` caller that passes its CI workflow name, its image-build workflow name, and any extra tag pattern (aggregator-dpg's `api-`/`web-`/`worker-` prefixes). The caller also passes `DOCS_SYNC_TOKEN` as a secret. The steps below describe the reusable workflow.

After a successful **non-dry-run** cut:

0. **Base check (before tagging):** refuse a sprint tag unless `base` is `main`, and change the input default to `main`.
1. **Find source PRs:** PRs merged **into `main`** whose merge commit is in `previous_tag..SHA`. `previous_tag` is the latest earlier **unsuffixed** sprint tag in this repo. In practice this is the release PR(s) plus any hotfix PRs that went straight to the base. If there is no previous unsuffixed tag, use only the most recent release PR into the base.
2. **Build the notes:** extract the sections from each source PR body. If a source PR has none of them, include its title as a single Release Notes bullet and add a visible "notes missing" line to the fragment, so the docs PR reviewer sees the gap.
3. **Release body:** use the assembled notes as the GitHub release body instead of `generate-notes`. Keep step 5's rule: the dry-run preview is byte-identical to what gets published. The preview therefore also shows the fragment.
4. **Docs push:** check out bluedots-docs with `DOCS_SYNC_TOKEN` (already used by `openapi-sync`; notification-service has no `openapi-sync` and may need the secret added). Write `releases/<sprint>/<rc>/components/<repo>.md`, and push to branch `release-notes/<tag>` into `main`. If the branch exists, commit on top of it; otherwise create it from `main`. Open the PR with `gh pr create` if none is open. **Do not use `peter-evans/create-pull-request` here:** it rebuilds its branch from the base and force-pushes, which would drop other repos' fragments and the human-written `notes.md`. Two repos cutting at once can race, so retry the push after a rebase (each repo writes only its own file, so the rebase does not conflict). The first repo opens the PR; later repos add commits. PR title: `release-notes: <tag>`. The PR body lists which repos have reported so far and reminds the reviewer to run the `release-page` skill before merging.
5. **Late reports:** the set of repos in an rc is whatever cut that tag; there is no manifest. If a repo cuts a tag after its docs PR has merged, the same step opens a new `release-notes/<tag>` PR from `main` that adds the fragment. The reviewer re-runs `release-page`, which amends the existing `notes.md` (diff shown, as in section 6).
6. A failed docs push must not fail the release (the tag and images are already out). It reports a `::warning` with the rerun path. A manual `workflow_dispatch` input, or a small companion workflow, re-runs only the docs push for an existing tag.

### 5. Skill: `release-pr-notes` (marketplace)

Ships in a **new plugin, `bluedots-release-tools`**, in a **new marketplace repo under the org, `Blue-Dots-Economy/bluedots-claude-plugins`** (public, like the other DPG repos). Each teammate installs it once with `/plugin marketplace add Blue-Dots-Economy/bluedots-claude-plugins` and `/plugin install bluedots-release-tools@…`. The existing personal marketplace (`AbhiGaddi/bluedots-claude-plugins`, `schema-from-sheet`) is untouched. Whether it later moves into the org marketplace is up to its owner. Used by anyone opening a release PR (`feature → develop`, `develop → main`) or a hotfix PR straight into the base.

- **Inputs:** the PRs in the promotion range (titles, bodies, labels, changed files) and the repo's PR template.
- **Output:** a PR description in the section 3 structure, at #717 quality. The skill embeds #717 as a worked example. It writes each section for its audience, links every bullet to a PR, groups bullets by theme, and actively looks for config, migration and env changes in the diff so that "Breaking changes / config" is never wrongly "None.".
- It replaces what is scattered today: the `In Plain Terms` rule in the CLAUDE.md of signals-dpg, aggregator-dpg, signals-search and bluedots-automation, the PR templates, and the maintainer's local Claude memory about PR-body format. Once the skill ships, those CLAUDE.md rules point at it instead of restating it.
- The marketplace repo is public. The embedded #717 example is a sanitised excerpt: keep the structure and tone, and drop security mechanism detail (the HMAC and CSRF specifics). Public Blue Dots repos must not disclose vulnerability detail.
- Each repo's `.github/PULL_REQUEST_TEMPLATE.md` gets the two new headings and a one-line pointer to the skill. notification-service, which has no template today, gets one.

### 6. Skill: `release-page` (marketplace)

Run locally by whoever closes the rc (maintainer or devops), on a checkout of the `release-notes/<tag>` branch, once the expected repos have reported.

- **Inputs:** all component fragments for this rc, the previous rc's or sprint's `notes.md` (for "since last release" framing), and the style guide (below).
- **Output:** `releases/<sprint>/<rc>/notes.md` in the section 3 structure, merged across repos. It deduplicates cross-repo items (e.g. a feature that spans signals-dpg and signals-search), states cross-repo deploy order explicitly, and gives no upgrade verdict.
- If `notes.md` already exists, the skill shows its proposed changes as a diff and asks before writing. It never silently overwrites human edits.
- It commits to the branch. Pushing stays a human action.

**Style guide:** one markdown file in bluedots-docs (e.g. `docs/release-notes-style.md`), read by both skills. It defines each section's audience, tone, depth, length limits and "None." handling. It is the single place to tune voice.

### 7. Gate

The existing develop-PR gate keeps checking `## Release Notes`. Extending it to require the two new headings is optional and left to the builder. If added, it uses the same `no-release-notes` waiver.

## Rollout order

1. Style guide + `release-pr-notes` skill + PR-template headings, so the next release PRs already carry the new sections.
2. Hub pages + content model in bluedots-docs, with hand-written fixture fragments.
3. `cut-release` change in one repo (pilot via a dry run, then a real cut), then the other three.
4. `release-page` skill.
5. First real hub entry = the next sprint cut after rollout.

## Later (not in this design)

- Manual backfill trigger for past unsuffixed tags (`202608-s1-rc1` onward), built from their existing release PRs.
- `cut-release` in bluedots-automation and ai-diffusion-dpg.
- Semver tags.
- A "recommended version" marker on the index.

## Decided by the maintainer

- Hub on the docs site, PR-reviewed and merged manually (openapi-sync model).
- Tag format `YYYYMM-sN-rcN`. Hotfixes become the next rc, never a suffix. Semver later.
- One page per sprint, one entry per rc.
- No upgrade verdict.
- AI drafting happens locally via shared team skills, not in CI. The release-wide notes follow the release-PR structure.
- Start from the next release. Backfill is a later manual trigger.
- Sprint tags are cut from `main` only.
- `cut-release` is renamed `create-release`, with its logic in one reusable workflow in bluedots-automation and thin callers in each repo.
- Skills ship as a new `bluedots-release-tools` plugin in a new org-owned marketplace.
- Suffixed / instance-specific cuts are not published.

## Calls made by the designer (flag if wrong)

- Two new PR headings: **Breaking changes / config** and **What users will notice**.
- Split ownership: CI owns component fragments, humans own `notes.md`.
- Source PRs = PRs merged into the tagged base since the previous unsuffixed tag.
- The GitHub release body switches from auto-generated titles to curated notes.
- A docs-push failure warns but does not fail the release.
- The style guide lives in bluedots-docs.
- Docs push uses plain `git push` + `gh pr create`, not `create-pull-request` (it force-pushes and would drop fragments and human edits).
- No expected-repos manifest: an rc is whatever repos cut it. Late cuts open a follow-up PR, and `release-page` amends.
- The #717 example in the public skill is sanitised.

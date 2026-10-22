# Release Notes Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one docs-site page per sprint (one entry per rc) built from curated release-PR notes. CI moves the text, local Claude skills draft it, and the maintainer merges a docs PR to publish.

**Architecture:** Four parts, each its own branch and PR in its own repo:

- **Part A (bluedots-docs):** adds a `releases` data collection, two custom Starlight pages, a style guide, and a pure helper library.
- **Part B (new org repo):** ships the two skills as a Claude Code plugin.
- **Part C (bluedots-automation):** adds a reusable `create-release.yml` workflow, following the gitleaks/`security-scan.yml` pattern. It holds the release logic once: validate, assemble curated notes, create the release, build images, and publish to the docs PR.
- **Part D (4 service repos):** replaces each repo's `cut-release` with a thin, SHA-pinned `create-release.yml` caller, and adds the new PR-template headings.

**Tech Stack:** Astro 7 + Starlight 0.42 (glob content loader, `StarlightPage`), Node 20 `node --test` (no new dependencies), GitHub Actions reusable workflow + `gh` CLI, Claude Code plugin marketplace.

**Spec:** `docs/superpowers/specs/2026-10-22-release-notes-hub-design.md` (bluedots-docs, branch `spec/release-notes-hub`)

## Global Constraints

- Sprint tag regex: `^20[0-9]{4}-s[0-9]+-rc[0-9]+$`. Sprint = `YYYYMM-sN` prefix, rc = `rcN`. Suffixed tags (`-alimco`, `-hotfix`, `-up-dhwd`) are never published and never used as `previous_tag`.
- Sprint tags are cut from `main` only.
- Section headings, verbatim and in this order: `## Summary`, `## Release Notes`, `## In Plain Terms`, `## Breaking changes / config`, `## What users will notice`, `## Deploy ordering`, `## Verification`, `## Checklist`. `cut-release` extracts only Release Notes, In Plain Terms, Breaking changes / config, What users will notice, and Deploy ordering. An empty section reads `None.`
- Section extraction: heading match is case-insensitive and tolerates extra whitespace. A section ends at the next heading of the same or higher level. HTML comments are ignored. This is the same rule as `bluedots-automation/.github/actions/pr-gate/gate.mjs`.
- File ownership: CI writes only `src/releases/<sprint>/<rc>/components/<repo>.md`. CI never writes or touches `src/releases/<sprint>/<rc>/notes.md`.
- No upgrade verdict anywhere. No AI or API keys in CI.
- No new npm dependencies in any repo. Tests use `node --test`.
- Pinned actions only (zizmor gate): third-party and cross-repo `uses:` lines reference a full commit SHA with a `# <ref>` comment.
- Merge and push rules: every push, PR, and merge needs the maintainer's explicit per-action "yes". Service-repo branches are cut from `feature` and PR'd into `feature` (squash). bluedots-docs PRs go into `main`.
- Docs pages follow bluedots-docs `CLAUDE.md` plain-language rules R1–R8. Per-repo component sections are exempt (like `api/`).

## Review Focus

1. **The hub has no releases yet** (the state at first deploy). `pnpm build` must pass, and `/releases/` must show "No releases have been published yet." *(Task A3 test + A4 build step)*
2. **rc and sprint ordering past single digits and across a year:** `rc10` sorts after `rc9`, `s10` after `s2`, and `202701-s1` after `202612-s2`. *(Tasks A2 and C1 tests)*
3. **A source PR with no house sections, or headings in a different case** (`## release notes`): the fragment falls back to the PR title, and the PR shows a visible "notes missing" line rather than an empty section. *(Task C1 test)*
4. **A repo that didn't cut this rc, or first appears in a later rc:** it shows as "unchanged since `<tag>`" in later rcs and is absent from earlier rc tables. *(Task A2 test)*
5. **A late or concurrent publish:**
   - An open `release-notes/<tag>` PR gets a commit appended, never a force-push.
   - With no open PR, the branch is recreated from `main`.
   - An rc whose `notes.md` is missing still renders, with "Release-wide notes not written yet." *(Tasks C1 and A2 tests)*

---

## Part A — bluedots-docs (branch `spec/release-notes-hub`, PR into `main`)

Work in the worktree `.worktrees/bluedots-docs-release-hub`. Before the PR, run: `pnpm build && pnpm check:links && pnpm check:style && pnpm test`.

### Task A1: Release notes style guide

**Files:**
- Create: `docs/release-notes-style.md`

**Interfaces:**
- Produces: the canonical style guide. The Part B skills fetch it with `gh api repos/Blue-Dots-Economy/bluedots-docs/contents/docs/release-notes-style.md -H 'Accept: application/vnd.github.raw'`.

- [ ] **Step 1: Write the guide.** One `##` section per heading from Global Constraints, each saying:
  - who reads it (engineer / PM / end-user trainer / devops),
  - what belongs in it and what does not,
  - its length limit,
  - how "None." is handled.

  It also covers:
  - Every Release Notes bullet ends with a PR link `(#N)`. Bullets are grouped by theme under bold labels.
  - **In Plain Terms, Breaking changes / config, and What users will notice** follow the docs plain-language rules R1–R8: short sentences, no jargon, and acronyms expanded.
  - **Breaking changes / config** names every new or changed env var, flag, migration, `network.json` or schema change, and removed behaviour. It says "None." only after checking the diff.
  - **No upgrade recommendation or verdict wording** ("safe to upgrade", "recommended").
  - **Security fixes:** describe the effect, never the mechanism or the exploit, because the repos are public.
  - **`notes.md` only:** the Summary opens with one sentence that stands alone. The index uses it as the sprint's one-liner.
- [ ] **Step 2: Commit**

```bash
git add docs/release-notes-style.md
git commit -m "docs: release notes style guide"
```

### Task A2: Release helper library

**Files:**
- Create: `src/lib/releases.mjs`
- Create: `src/lib/releases.test.mjs`
- Modify: `package.json` (add `"test": "node --test src/lib/"`)

**Interfaces:**
- Produces (all pure; entries are `{ id, data, body }`, the same shape the collection returns):
  - `parseSprintTag(tag: string) -> { sprint: string, rc: string, rcNum: number, sprintKey: [number, number] } | null`. `sprintKey` is `[YYYYMM, N]`.
  - `compareTags(a: string, b: string) -> number`: ascending; throws on a non-sprint tag.
  - `extractSection(markdown: string, heading: string) -> string | null`
  - `isNone(section: string | null) -> boolean`: true for null, empty, or `None`/`None.` (any case) once HTML comments are stripped.
  - `componentTable(fragments: Entry[], tag: string) -> { repo: string, tag: string, changed: boolean }[]`: sorted by repo.
  - `buildSprints(fragments: Entry[], notes: Entry[]) -> Sprint[]`, newest sprint first, where:
    - `Sprint = { sprint, rcs: Rc[] /* newest first */, latestDate: string, summary: string | null, hasBreaking: boolean, hasDeployOrdering: boolean }`
    - `Rc = { tag, rc, date: string /* max cut_at */, notes: Entry | null, components: ComponentRow[], fragments: Entry[] /* sorted by repo */ }`

- [ ] **Step 1: Write failing tests** in `src/lib/releases.test.mjs`:

```js
test('compareTags orders rc and sprint numerically and across years', () => {
  const tags = ['202701-s1-rc1', '202610-s2-rc1', '202610-s10-rc1', '202610-s1-rc10', '202610-s1-rc9'];
  assert.deepEqual([...tags].sort(compareTags),
    ['202610-s1-rc9', '202610-s1-rc10', '202610-s2-rc1', '202610-s10-rc1', '202701-s1-rc1']);
});
test('parseSprintTag rejects suffixed tags', () => {
  assert.equal(parseSprintTag('202609-s2-rc1-hotfix'), null);
  assert.equal(parseSprintTag('v1.0.0'), null);
});
test('extractSection is case-insensitive and stops at same-level heading', () => {
  const md = '## release notes\n- a (#1)\n### sub\n- b\n## In Plain Terms\nx';
  assert.equal(extractSection(md, 'Release Notes').trim(), '- a (#1)\n### sub\n- b');
});
test('isNone', () => {
  assert.ok(isNone('None.')); assert.ok(isNone(' <!-- x --> none ')); assert.ok(isNone(null));
  assert.ok(!isNone('- new env var FOO'));
});
test('componentTable marks unchanged repos and omits not-yet-published repos', () => {
  const f = (repo, tag) => ({ id: `${tag}/${repo}`, data: { repo, tag, cut_at: '2026-10-01' }, body: '' });
  const frags = [f('signals-dpg', '202610-s1-rc1'), f('signals-search', '202610-s1-rc1'),
                 f('signals-dpg', '202610-s1-rc2'), f('notification-service', '202610-s1-rc3')];
  assert.deepEqual(componentTable(frags, '202610-s1-rc2'), [
    { repo: 'signals-dpg', tag: '202610-s1-rc2', changed: true },
    { repo: 'signals-search', tag: '202610-s1-rc1', changed: false },
  ]);
});
test('buildSprints: empty input', () => assert.deepEqual(buildSprints([], []), []));
test('buildSprints: rc without notes.md has notes null; markers read notes sections', () => {
  // two rcs in 202610-s1; rc1 has notes with "## Breaking changes / config\nNone." and
  // "## Deploy ordering\nDeploy signals-dpg first."; rc2 has no notes.
  // expect rcs[0].tag === '202610-s1-rc2', rcs[0].notes === null,
  // hasBreaking === false, hasDeployOrdering === true,
  // summary === first non-empty line of rc1's "## Summary" (latest rc WITH notes).
});
```

- [ ] **Step 2: Run** `pnpm test`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `src/lib/releases.mjs` with the signatures above. Write JSDoc types and keep the module dependency-free.
  - A fragment's tag comes from `data.tag`.
  - A notes entry's sprint and rc come from its `data.tag`.
  - `summary` is the first non-empty line of `## Summary` from the newest rc in the sprint that has notes.
- [ ] **Step 4: Run** `pnpm test`. Expected: all PASS.
- [ ] **Step 5: Commit** with the message `feat: release hub helper library`.

### Task A3: Content collection and heading shift

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/remark-release-headings.mjs`
- Create: `src/lib/remark-release-headings.test.mjs`
- Modify: `astro.config.mjs` (add `markdown.remarkPlugins`)
- Create: `src/releases/.gitkeep`

**Interfaces:**
- Produces: collection `releases` (glob loader, `base: './src/releases'`, pattern `*/rc*/{notes,components/*}.md`). The schema is `z.union([component, notes.strict()])`; a notes entry carries only `tag`. Entry ids are `<sprint>/<rc>/notes` and `<sprint>/<rc>/components/<repo>`.
  - **notes:** `{ tag: string matching the sprint regex }`
  - **component:** `{ repo: string, tag: sprint regex, commit: /^[0-9a-f]{40}$/, base: z.literal('main'), previous_tag: string | null, cut_at: YYYY-MM-DD string, release_url: url, prs: { number: int, title: string, url: url }[], notes_missing: boolean }`
- Produces: `remarkReleaseHeadings()` remark plugin, and pure `shiftHeadings(tree, by: number)` (depth capped at 6).
  - The plugin shifts by 2 for files ending in `/src/releases/**/notes.md` and by 3 for `/src/releases/**/components/*.md`. Other files are untouched.
  - This places a file's `##` under the page's `## <rc>` → `### Release-wide notes` / `#### <repo>` layout.

- [ ] **Step 1: Write failing tests:**
  - `shiftHeadings` on `## a` and `###### b` with `by: 3` gives depths 5 and 6.
  - The plugin leaves a heading untouched when `file.path` is `src/content/docs/x.md`.
- [ ] **Step 2: Run** `pnpm test`. Expected: FAIL.
- [ ] **Step 3: Implement both.** Register the plugin in `astro.config.mjs` as `markdown: { remarkPlugins: [remarkReleaseHeadings] }`, and add the `releases` collection.
- [ ] **Step 4: Run** `pnpm test && pnpm build`. Expected: tests pass, and the build succeeds with the empty `src/releases/`. The two already-known warnings in `CLAUDE.md` are acceptable; an empty-collection warning for `releases` is acceptable.
- [ ] **Step 5: Commit** with the message `feat: releases content collection`.

### Task A4: Releases pages, sidebar, and old page retirement

**Files:**
- Create: `src/pages/releases/index.astro`
- Create: `src/pages/releases/[sprint].astro`
- Modify: `astro.config.mjs` (sidebar entry, redirect, comment)
- Delete: `src/content/docs/community/release-notes.md`
- Modify: `scripts/check-style.sh` (also scan `src/releases/*/rc*/notes.md`)
- Modify: `CLAUDE.md`
- Test fixtures (not committed under `src/releases/`): `tests/fixtures/releases/202610-s1/rc1/{notes.md,components/signals-dpg.md,components/signals-search.md}` and `rc2/components/signals-dpg.md`

**Interfaces:**
- Consumes: `buildSprints` and `componentTable` (A2), and the collection `releases` (A3).
- Both pages use `StarlightPage` from `@astrojs/starlight/components/StarlightPage.astro`.

- [ ] **Step 1: Index page.**
  - Frontmatter title: `Releases`. Description: "Every Blue Dots release, newest first, with what changed for each component."
  - It lists sprints from `buildSprints`. Each row shows: a link to `/releases/<sprint>/`, the latest rc tag, `latestDate`, and the `summary`, or "Notes pending" when it is null.
  - Show a "Breaking changes or config" badge when `hasBreaking`, and a "Deploy order" badge when `hasDeployOrdering`. Use the Starlight `Badge` component.
  - With no sprints, render: "No releases have been published yet."
  - Add a short section, "Before these releases". It says that releases before the hub are listed on each repository's GitHub Releases page, and that Keycloak became the recommended identity provider from `GA-2026-08-18`. Link to `/deploy/configure/keycloak-setup/#migrating-an-existing-instance`. This is the one fact worth keeping from the retired page.
- [ ] **Step 2: Sprint page.** `getStaticPaths` comes from `buildSprints`. For each rc, newest first:
  - `## <tag>`, with the date.
  - `### Release-wide notes`: the rendered `notes.md`, or "Release-wide notes not written yet." when it is null.
  - `### Components`: a table with columns Component | Version | Changed in this release ("Yes" / "No, unchanged since `<tag>`").
  - `### Component details`: per fragment, a `#### <repo>` heading, a line linking the GitHub release and each source PR, the rendered body, and a visible note when `notes_missing` is true.
  - Pass the rc `##` headings to `StarlightPage` as the table of contents.
- [ ] **Step 3: Sidebar and redirect.**
  - Add a top-level `{ label: 'Releases', link: '/releases/' }` after the last top-level group.
  - Add the redirect `'/community/release-notes': '/releases/'`.
  - Delete the old page, and drop `community/release-notes` from the "Not in the v1 sidebar" comment.
- [ ] **Step 4: Style check scope.** `check-style.sh` adds `src/releases/*/rc*/notes.md` to `prose`. Fragments stay exempt.
- [ ] **Step 5: Verify with fixtures.**
  - Copy `tests/fixtures/releases/*` into `src/releases/`, then run `pnpm build && pnpm check:links && pnpm check:style`.
  - Open `dist/releases/index.html` and `dist/releases/202610-s1/index.html`, and confirm:
    - rc2 is listed above rc1;
    - rc2's table shows signals-search as "No, unchanged since `202610-s1-rc1`";
    - rc2 shows "Release-wide notes not written yet.";
    - headings under each fragment are `h5`.
  - Remove the copies: `git status` must show nothing under `src/releases/` except `.gitkeep`.
  - Then run `pnpm build` again with the empty collection. It must pass, and the index must show the empty message.
- [ ] **Step 6: CLAUDE.md.**
  - Replace the `community/release-notes` mention with a "Releases" section. It covers the file layout, the ownership rule (CI writes `components/*.md`; `notes.md` is human-owned and drafted by the `release-page` skill), that merging the `release-notes/<tag>` PR publishes, and the fixture recipe from Step 5.
  - Add the Releases section to the information-architecture table.
- [ ] **Step 7: Commit** with the message `feat: releases hub pages`, then ask the maintainer before pushing and opening the PR into `main`.

---

## Part B — new repo `Blue-Dots-Economy/bluedots-claude-plugins`

**Ask the maintainer before creating the repo.** Command: `gh repo create Blue-Dots-Economy/bluedots-claude-plugins --public`. It's public, like the other DPG repos. Default branch is `main`, and the first commit goes in via PR from `feat/release-tools`.

### Task B1: Marketplace and `release-pr-notes` skill

**Files:**
- Create: `.claude-plugin/marketplace.json`, with marketplace name `bluedots` and owner `Blue Dots Economy`. Its one plugin is `{ "name": "bluedots-release-tools", "source": "./plugins/bluedots-release-tools", "description": "Write Blue Dots release PR descriptions and release pages." }`.
- Create: `plugins/bluedots-release-tools/.claude-plugin/plugin.json`, version `0.1.0`, repository `https://github.com/Blue-Dots-Economy/bluedots-claude-plugins`, license MIT.
- Create: `plugins/bluedots-release-tools/skills/release-pr-notes/SKILL.md`
- Create: `plugins/bluedots-release-tools/skills/release-pr-notes/references/example-release-pr.md`
- Create: `README.md` with the install commands `/plugin marketplace add Blue-Dots-Economy/bluedots-claude-plugins` and `/plugin install bluedots-release-tools@bluedots`. Also create `LICENSE` (MIT).

- [ ] **Step 1: Example reference.** Take signals-dpg #717's description and sanitise it:
  - Keep the structure, the themed bullets, the PR links, In Plain Terms, and Deploy ordering.
  - Strip the security mechanism detail: the HMAC raw-bytes explanation, CSRF/`timingSafeEqual`/`oidc_flow` internals, the SSRF and rate-limit specifics. Describe their effect in one line each.
  - Add the two new sections ("Breaking changes / config": `PEER_AUTH_MODE` ordering note; "What users will notice": the sign-in and list-view changes).
- [ ] **Step 2: Write `SKILL.md`.**
  - Frontmatter `description` triggers on: opening a release or promotion PR (feature→develop, develop→main), a hotfix PR into `main`, or "write release notes".
  - The body tells Claude to:
    1. Fetch the style guide, using the command from Task A1.
    2. Read the target repo's `.github/PULL_REQUEST_TEMPLATE.md`.
    3. Collect the PRs in the range with `gh pr list --base <head-of-range branch> --state merged` (range given by the user or inferred from `git log base..head --merges`). Use their bodies, labels, and changed files.
    4. Scan the diff for config signals: `.env*`, `*config*`, `values*.yaml`, `drizzle/**` migrations, `network.json`, `openapi.json`. "Breaking changes / config" is backed by this scan.
    5. Write the body in the Global Constraints heading order, following `references/example-release-pr.md`.
    6. Show the draft to the user before `gh pr create/edit`.
  - **Never** write an upgrade verdict.
- [ ] **Step 3: Verify.**
  - Install the plugin locally: `/plugin marketplace add <local path>`.
  - In a fresh session in signals-dpg, ask it to "write the release PR description for develop → main as of `202609-s1-rc2`".
  - Check that the output has every extracted heading, that every Release Notes bullet has a `(#N)` link, that it contains no verdict wording, and that "Breaking changes / config" mentions `PEER_AUTH_MODE`.
- [ ] **Step 4: Commit** with the message `feat: release-pr-notes skill and marketplace`.

### Task B2: `release-page` skill

**Files:**
- Create: `plugins/bluedots-release-tools/skills/release-page/SKILL.md`

**Interfaces:**
- Consumes: the Part A file layout and frontmatter, and the A1 style guide.

- [ ] **Step 1: Write `SKILL.md`.**
  - Frontmatter `description` triggers on: "write the release page", "release-wide notes", or a `release-notes/<tag>` docs PR.
  - The body tells Claude to:
    1. Require a bluedots-docs checkout on branch `release-notes/<tag>`.
    2. Read every `src/releases/<sprint>/<rc>/components/*.md`, the previous rc's or sprint's `notes.md` (by `compareTags` order), and the style guide.
    3. Write `notes.md`:
       - frontmatter `tag: <tag>`;
       - `## Summary`, `## Release Notes`, `## In Plain Terms`, `## Breaking changes / config`, `## What users will notice`, `## Deploy ordering`, merged across repos;
       - deduplicate cross-repo items, and state the cross-repo deploy order explicitly;
       - the Summary's first sentence stands alone.
    4. If `notes.md` exists, show a diff and ask before writing.
    5. Run `pnpm check:style`.
    6. Commit. Never push.
- [ ] **Step 2: Verify.**
  - Use the Part A fixtures on a scratch branch named `release-notes/202610-s1-rc1`.
  - Run the skill and check that `notes.md` exists with the six headings and passes `pnpm check:style`.
  - Re-run it and check that it asks before overwriting.
- [ ] **Step 3: Commit** with the message `feat: release-page skill`, then ask the maintainer before pushing and opening the PR.

---

## Part C — bluedots-automation (branch `feat/create-release` from `feature`)

The release logic moves into one reusable workflow, following the `security-scan.yml` pattern. Each service repo keeps only a thin `create-release.yml` caller pinned to a SHA. This replaces the four copies of `cut-release`, which are identical apart from the CI workflow name, the image-build workflow name, and aggregator-dpg's per-app tag prefixes.

### Task C1: Release-notes pure module

**Files:**
- Create: `.github/scripts/release-notes/notes.mjs`
- Create: `.github/scripts/release-notes/notes.test.mjs`
- Create: `.github/scripts/release-notes/package.json` (copy `.github/actions/pr-gate/package.json`, name `release-notes`)

**Interfaces:**
- Produces:
  - `SECTIONS = ['Release Notes', 'In Plain Terms', 'Breaking changes / config', 'What users will notice', 'Deploy ordering']`
  - `parseSprintTag`, `compareTags`, `extractSection`, `isNone`: same contracts as A2, duplicated because the repos differ. The tests mirror A2's cases.
  - `previousSprintTag(tagNames: string[], current: string) -> string | null`: the greatest sprint tag strictly below `current`; suffixed and non-sprint tags are ignored.
  - `selectSourcePrs(prs: GhPr[], rangeShas: Set<string>) -> GhPr[]`: keeps PRs where `merged_at && base.ref === 'main' && rangeShas.has(merge_commit_sha)`, sorted by `merged_at` ascending.
  - `assembleNotes(prs: GhPr[]) -> { markdown: string, missing: number[] }`:
    - The output has one `## <section>` per `SECTIONS` entry.
    - With one PR, its text is used verbatim.
    - With several PRs, each non-None contribution is prefixed by `**#N <title>**`.
    - A section is `None.` when every PR's is None or absent.
    - A PR with none of the sections gets `- <title> (#N)` under Release Notes and is listed in `missing`.
  - `renderFragment(meta: { repo, tag, commit, base, previous_tag, cut_at, release_url, prs }, notes: { markdown, missing }) -> string`: YAML frontmatter matching the A3 component schema, with `notes_missing: missing.length > 0`, then `markdown`.
  - `fragmentPath(tag, repo) -> 'src/releases/<sprint>/<rc>/components/<repo>.md'`
  - `docsBranch(tag) -> 'release-notes/<tag>'`
  - `publishAction({ branchExists: boolean, openPr: boolean }) -> 'append' | 'recreate'`: `append` iff an open PR exists.
  - `validateTag(tag: string, extraPattern: string) -> { ok: boolean, sprint: boolean, error?: string }`:
    - Accepts `v*.*.*`, the sprint regex, or a match of `extraPattern` (an anchored ERE string; empty means none).
    - `sprint` is true only for the sprint regex.

- [ ] **Step 1: Write failing tests:**
  - the A2 ordering and section cases;
  - `previousSprintTag(['202609-s1-rc3','202609-s2-rc1-hotfix','202610-s1-rc1','202610-s1-rc2'], '202610-s1-rc2') === '202610-s1-rc1'`, and `=== null` when no earlier sprint tag exists;
  - `selectSourcePrs` drops a PR with base `develop` and a PR whose merge sha is outside the range;
  - `assembleNotes` with one PR that has sections and one PR with none: Release Notes contains `- Bump deps (#9)`, `missing` deep-equals `[9]`, and Deploy ordering is `None.` when both lack it;
  - `renderFragment` output parses back (split on `---`) and includes `notes_missing: true`;
  - `publishAction({branchExists:true, openPr:false}) === 'recreate'`;
  - `validateTag`:
    - `validateTag('api-v1.2.0', '^(api|web|worker)-v[0-9]+\\.[0-9]+\\.[0-9]+$').ok === true`
    - `validateTag('api-v1.2.0', '').ok === false`
    - `validateTag('202609-s2-rc1-hotfix', '').ok === false`
- [ ] **Step 2: Run** `node --test` in that directory. Expected: FAIL.
- [ ] **Step 3: Implement `notes.mjs`** (dependency-free; write the frontmatter with a hand-rolled serializer and quote every string).
- [ ] **Step 4: Run** `node --test`. Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat(release): pure release-notes assembly`.

### Task C2: Release-notes IO script

**Files:**
- Create: `.github/scripts/release-notes/run.mjs`
- Create: `.github/workflows/release-notes-tests.yml` (a copy of `pr-gate-tests.yml` with paths and working-directory switched to `.github/scripts/release-notes`)

**Interfaces:**
- Consumes: C1 exports.
- Produces the CLI `node run.mjs`, configured by env vars:
  - `MODE` (`assemble` | `publish`), `TAG`, `SHA`, `REPOSITORY` (owner/name);
  - `GH_TOKEN` (the caller repo's token), and `DOCS_TOKEN` (publish only);
  - `RUNNER_TEMP` and `GITHUB_STEP_SUMMARY`.
- **`assemble` mode:**
  - Lists tags with `gh api repos/<r>/git/matching-refs/tags/20`, then gets the previous tag from `previousSprintTag`.
  - Builds the range SHAs from `gh api --paginate repos/<r>/compare/<prev>...<sha> --jq '.commits[].sha'`. With no previous tag, the range is the single most recently merged PR into `main` at or before `sha`.
  - Gets PRs from `gh api --paginate 'repos/<r>/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=100'`, stopping once `merged_at` is older than the previous tag's commit date.
  - Writes `$RUNNER_TEMP/release-body.md` and `$RUNNER_TEMP/release-fragment.md`, then appends both to `$GITHUB_STEP_SUMMARY`.
  - `release_url` is `https://github.com/<r>/releases/tag/<tag>`, and `cut_at` is today in UTC.
  - For a non-sprint tag (`v*`, per-app), it writes the body only. It still uses curated notes, with `previous_tag` = the previous tag of the same family (sorted by semver). It writes no fragment.
- **`publish` mode:**
  - Clones `Blue-Dots-Economy/bluedots-docs` over HTTPS with `DOCS_TOKEN`.
  - Checks for an open PR with `gh pr list --head <branch> --state open`, then calls `publishAction`.
  - **append:** checks out the branch.
  - **recreate:** `git checkout -B <branch> origin/main`, then pushes with `--force-with-lease`. This is safe because no open PR uses the branch.
  - Writes only `fragmentPath(...)` and commits `release-notes: <repo> <tag>`.
  - On push rejection, runs `git pull --rebase` and retries, up to 3 attempts.
  - Creates the PR (`release-notes: <tag>`) if none is open. Then always rewrites the PR body with:
    - the list of `components/*.md` currently on the branch;
    - a checklist: run the `release-page` skill; `pnpm build && pnpm check:links && pnpm check:style`; merge to publish.
  - Commit identity: `github-actions[bot]`.

- [ ] **Step 1: Implement `run.mjs`.**
- [ ] **Step 2: Dry verification.**
  - Run `MODE=assemble TAG=202609-s1-rc2 SHA=$(gh api repos/Blue-Dots-Economy/signals-search/commits/202609-s1-rc2 --jq .sha) REPOSITORY=Blue-Dots-Economy/signals-search RUNNER_TEMP=$(mktemp -d) GITHUB_STEP_SUMMARY=/dev/null node run.mjs`.
  - Expected: the previous tag is `202609-s1-rc1`, and the body lists that range's PRs into `main`.
  - Do not run `publish` locally.
- [ ] **Step 3: Commit** with the message `feat(release): release-notes IO and tests workflow`.

### Task C3: Reusable `create-release.yml`

**Files:**
- Create: `.github/workflows/create-release.yml` (`on: workflow_call`)

**Interfaces:**
- Consumes: the C2 CLI.
- Produces `Blue-Dots-Economy/bluedots-automation/.github/workflows/create-release.yml@<sha>`.
  - **Inputs:** `tag` (string, required); `base` (string, default `main`); `dry_run`, `skip_ci_check`, `docs_only` (boolean, default false); `ci-workflow` (string, required, e.g. `ci.yaml`); `build-workflow` (string, required); `extra-tag-pattern` (string, default `''`); `automation-ref` (string, required: the same SHA the caller pins, so the scripts match the workflow).
  - **Secrets:** `docs-token` (optional; publishing is skipped with a warning when absent).
  - **Permissions** (caller must grant): `contents: write`, `actions: write`.

- [ ] **Step 1: Port `cut-release` into one job.** Carry over its comments: why it exists, the one-call release creation, REST rather than `gh release create`, the `GITHUB_TOKEN` tag-push suppression, `generate_release_notes` vs `generate_notes`, and the byte-identical preview. Steps:
  1. **checkout automation:** `actions/checkout` (pinned SHA as in `pr-gate-tests.yml`) of `Blue-Dots-Economy/bluedots-automation` at `inputs.automation-ref`, path `automation`, `persist-credentials: false`.
  2. **validate:**
     - Run `node -e` with `validateTag` (via a tiny `automation/.github/scripts/release-notes/validate.mjs` entry if cleaner), using `inputs.extra-tag-pattern`.
     - A sprint tag with `BASE != main` fails with `::error title=Sprint tags come from main::`.
     - Not `docs_only`: refuse an existing tag. `docs_only`: require that the tag exists and resolve `SHA` from it.
     - Otherwise resolve `SHA` from `BASE`.
     - The CI gate queries `repos/$REPO/actions/workflows/${CI_WORKFLOW}/runs` (skipped when `docs_only` or `skip_ci_check`).
     - Output `sha` and `sprint`.
  3. **assemble:** `node automation/.github/scripts/release-notes/run.mjs` with `MODE=assemble`.
  4. **dry-run exit:** emits the same `::notice` as today.
  5. **create release:** skipped when `docs_only`. Runs `gh api repos/$REPO/releases -f tag_name -f name -f target_commitish -F body=@"$RUNNER_TEMP/release-body.md"`.
  6. **build images:** skipped when `docs_only`. Runs `gh workflow run "$BUILD_WORKFLOW" --repo "$REPO" --ref "$TAG"`.
  7. **publish docs:** runs only if `sprint`. Uses `MODE=publish` and `DOCS_TOKEN: ${{ secrets.docs-token }}`, with `continue-on-error: true`.
  8. **warn:** on publish failure or a missing secret, emits `::warning title=Docs publish failed::Re-run Create release with docs_only=true for ${TAG}.`
  - Every input reaches scripts through `env:`, never `${{ }}` inside `run:` (zizmor template-injection).
- [ ] **Step 2: Run `zizmor .github/`** if it's available locally (otherwise rely on the repo's CI). Expected: no new findings.
- [ ] **Step 3: Commit** with the message `feat(release): reusable create-release workflow`. Ask before pushing and opening the PR into `feature`. Record the squash-merge SHA on `feature`; Part D pins it.

---

## Part D — service repos (one branch `feat/create-release` from `feature` per repo, PR into `feature`)

Do signals-search first as the pilot, then signals-dpg, aggregator-dpg, and notification-service.

| Repo | `ci-workflow` | `build-workflow` | `extra-tag-pattern` | old file |
|---|---|---|---|---|
| signals-search | `ci.yml` | `build-image.yml` | `''` | `cut-release.yml` |
| signals-dpg | `ci.yaml` | `build-images.yaml` | `''` | `cut-release.yaml` |
| aggregator-dpg | `ci.yml` | `build-images.yml` | `^(api\|web\|worker)-v[0-9]+\.[0-9]+\.[0-9]+$` | `cut-release.yml` |
| notification-service | `ci.yaml` | `notification-image-build.yaml` | `''` | `cut-release.yaml` |

### Task D1: Thin `create-release.yml` caller

**Files:**
- Create: `.github/workflows/create-release.yml`
- Delete: the old `cut-release` file (see the table)

- [ ] **Step 1: Write the caller.**
  - `name: Create release`, triggered by `on: workflow_dispatch` with inputs `tag`, `base` (choice `[main, develop]`, default `main`), `dry_run`, `skip_ci_check`, and `docs_only`.
  - One job, `release`, with `permissions: { contents: write, actions: write }`, `uses: Blue-Dots-Economy/bluedots-automation/.github/workflows/create-release.yml@<C3 SHA>  # feature <date> -- repin to @main once promoted`, and `with:` the dispatch inputs plus this repo's table row and `automation-ref: <C3 SHA>`.
  - `secrets: { docs-token: ${{ secrets.DOCS_SYNC_TOKEN }} }`.
  - Add a header comment in the `security.yml` style: it's a thin caller, the logic lives in bluedots-automation, it replaced `cut-release`, and it notes the repin.
- [ ] **Step 2: Delete the old `cut-release` file.**
- [ ] **Step 3: Verify (pilot repo only).**
  - Push the branch (with approval).
  - Run `gh workflow run create-release.yml --ref feat/create-release -f tag=202609-s1-rc9 -f base=main -f dry_run=true -f skip_ci_check=true`.
    - A dispatch from a non-default ref needs the workflow file on the default branch. If GitHub refuses with "workflow not found", do this check after the file reaches `main`, or test the reusable workflow from a scratch repo.
  - Expected: the run summary shows the body and fragment with `previous_tag: "202609-s1-rc3"`.
  - Then run with `base=develop`. Expected: it fails with the "Sprint tags come from main" error.
- [ ] **Step 4: Commit** with the message `feat(release): replace cut-release with create-release caller`.

### Task D2: PR template and CLAUDE.md pointer

**Files:**
- Modify: `.github/PULL_REQUEST_TEMPLATE.md` (signals-dpg, aggregator-dpg, signals-search)
- Create: `.github/PULL_REQUEST_TEMPLATE.md` (notification-service; copy signals-search's after editing)
- Modify: `CLAUDE.md`: the `In Plain Terms` paragraph in signals-dpg, aggregator-dpg, and signals-search. Add one to notification-service. Rename any `cut-release` / "Cut release" mention to `create-release` / "Create release" (`grep -rn "cut-release\|Cut release" --include=*.md .`).

- [ ] **Step 1: Template.**
  - After `## Release Notes`, add `## Breaking changes / config` and `## What users will notice`, each with a comment: "Write `None.` if nothing applies."
  - Add a top comment: "Release and promotion PRs: write this with the `release-pr-notes` skill (`/plugin install bluedots-release-tools@bluedots`)."
  - Leave `In Plain Terms` and `Deploy ordering` out of the template. Keeping In Plain Terms out is a deliberate earlier choice, so PRs from other tools aren't forced through it. The skill writes both.
- [ ] **Step 2: CLAUDE.md.** Keep the rule's first sentence. Add: "For release and promotion PRs, use the `release-pr-notes` skill from the `bluedots` plugin marketplace; it writes every release section, including Breaking changes / config and What users will notice."
- [ ] **Step 3: Commit** with the message `docs: release-notes PR template sections`. Ask before pushing and opening the PR into `feature` (one rolling PR per repo, with D1).

### Task D3: Rollout checks (maintainer-assisted)

- [ ] **Step 1:** Confirm `DOCS_SYNC_TOKEN` exists in each of the 4 repos with `gh secret list -R Blue-Dots-Economy/<repo>`. notification-service likely lacks it. Ask the maintainer to add it; the agent does not create secrets.
- [ ] **Step 2:** Tell devops: after the next promotion reaches `main`, "Cut release" is gone, and they run "Create release" instead (same inputs, plus `docs_only`, and `base` now defaults to `main`).
- [ ] **Step 3:** After the Part D PRs reach `main`, the first real sprint cut opens `release-notes/<tag>`. Run the `release-page` skill on it. The maintainer reviews and merges.
- [ ] **Step 4:** Update the maintainer's local memory `feedback_pr_body_house_format.md` to point at the skill instead of restating the format.

---

## Order and dependencies

A1 → B1/B2 (the skills read the style guide) → A2–A4 → C1–C3 → D1–D2 (they pin the C3 SHA) → D3. Part A and Part B can be reviewed in parallel once A1 is merged.

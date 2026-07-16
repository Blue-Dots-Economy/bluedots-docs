# Migration Plan — Move docs to `Blue-Dots-Economy/bluedots-docs` with `docs.bluedotseconomy.org`

**Status:** PLANNED (not executed)
**Written:** 2026-07-10
**Executor prerequisite:** admin access to `Blue-Dots-Economy/bluedots-docs` (verified: `maheshkumargangula` has admin) and access to the `bluedotseconomy.org` DNS zone.

## Current state (verified 2026-07-10)

| Item | Value |
| --- | --- |
| Source repo | `maheshkumargangula/bluedots-docs` (fork, `main` = `25350db`) |
| Target repo | `Blue-Dots-Economy/bluedots-docs` — exists, public, **stale** (last commit `2bd4ae0`, 2026-06-09; fork has ~30 newer commits) |
| Hosting | GitHub Pages via `.github/workflows/deploy.yml` (`withastro/action@v3`, Node 22) |
| `astro.config.mjs` | `site: 'https://blue-dots-economy.github.io'`, `base: '/bluedots-docs'` |
| Internal links | **177** occurrences of the `/bluedots-docs/...` prefix across `src/content/docs/**` |
| Link check | `starlight-links-validator` runs at build — will catch any missed rewrites |

## Why links must change

With a custom domain the site is served from the domain root, so `base` becomes `'/'`.
Every internal link written as `/bluedots-docs/guides/...` would 404. All 177 must become `/guides/...` etc.

---

## Phase 1 — Prepare the code (on a branch, in this repo)

1. Create branch: `git checkout -b migrate/org-repo-custom-domain`
2. **`astro.config.mjs`:**
   ```js
   site: 'https://docs.bluedotseconomy.org',
   // remove the `base` line entirely (defaults to '/')
   ```
3. **Add CNAME file** so Pages keeps the custom domain across deploys:
   ```bash
   echo "docs.bluedotseconomy.org" > public/CNAME
   ```
4. **Rewrite the 177 base-prefixed links** (content only; `astro.config.mjs` sidebar uses slugs, not URLs — untouched):
   ```bash
   # macOS sed; matches links like ](/bluedots-docs/... and href="/bluedots-docs/...
   grep -rl "/bluedots-docs/" src/content/docs | xargs sed -i '' 's|/bluedots-docs/|/|g'
   ```
   Then sanity-grep: `grep -rn "bluedots-docs" src/content/docs | grep -v "Editable source"` → expect only the
   `src/assets/diagrams/...` editable-source comments (repo paths, not URLs — leave them).
5. **CLAUDE.md:** update the deployment-config section (site/base values, "All internal links must include the `/bluedots-docs` prefix" note becomes obsolete — links are now root-relative).
6. **Verify locally:**
   ```bash
   pnpm build          # links-validator must pass — catches any missed prefix
   pnpm preview        # spot-check nav, diagrams, search
   ```
7. Commit on the branch. **Do not merge to `main` yet** — the fork's Pages deploy at
   `blue-dots-economy.github.io/bluedots-docs` would break if these changes deploy there. Merge happens as part of Phase 2 cut-over.

## Phase 2 — Move history to the org repo

The org repo's June state is an ancestor-less older copy; the fork is the source of truth. Overwrite, keeping the old state reachable via a backup branch.

1. Backup current org state:
   ```bash
   gh api -X POST repos/Blue-Dots-Economy/bluedots-docs/git/refs \
     -f ref=refs/heads/backup-pre-migration \
     -f sha=2bd4ae0e...   # full sha of current org main
   ```
2. Merge the Phase 1 branch into local `main`.
3. Push full history to the org repo:
   ```bash
   git remote add org https://github.com/Blue-Dots-Economy/bluedots-docs.git
   git push org main --force-with-lease   # overwrites stale org main
   ```
4. In the fork, disable its Pages deploy (Settings → Pages → Disabled, or delete the workflow on the fork's main) so two sites don't fight for the old URL.

## Phase 3 — GitHub Pages + DNS

1. **Org repo → Settings → Pages:**
   - Source: **GitHub Actions** (the checked-in workflow is already correct; `workflow_dispatch` available for manual runs).
   - Custom domain: `docs.bluedotseconomy.org` → GitHub creates the domain check; **Enforce HTTPS** once cert issues.
2. **DNS (bluedotseconomy.org zone):**
   ```
   docs  CNAME  blue-dots-economy.github.io.
   ```
   TTL 300 during migration; raise later.
3. (Recommended) **Verify the domain org-wide**: Org Settings → Pages → Verified domains → add `bluedotseconomy.org`. Prevents domain takeover if the repo/Pages config is ever deleted.
4. Trigger deploy: push to org `main` (Phase 2 push already does) or `gh workflow run deploy.yml -R Blue-Dots-Economy/bluedots-docs`.

## Phase 4 — Verification checklist

- [ ] `https://docs.bluedotseconomy.org/` loads with valid TLS (padlock, cert for the domain).
- [ ] Deep link works: `https://docs.bluedotseconomy.org/core-concepts/architecture/high-level-architecture/`.
- [ ] All 13 Excalidraw diagram images render (spot-check 3–4 pages).
- [ ] Search (Pagefind) returns results — it indexes at build, no config change needed.
- [ ] Sitemap points at the new domain: `curl -s https://docs.bluedotseconomy.org/sitemap-index.xml`.
- [ ] `gh run list -R Blue-Dots-Economy/bluedots-docs` shows green deploy.
- [ ] Old URL `blue-dots-economy.github.io/bluedots-docs` — decide: leave 404, or keep fork's Pages serving a stub that links to the new domain (optional Phase 5).

## Phase 5 — Aftercare (optional but recommended)

- Archive or repurpose the fork (`maheshkumargangula/bluedots-docs`): keep as personal dev fork with `org` as upstream, PR-based flow into the org repo going forward.
- Update any external references to the old URL (README badges, org profile, other repos' docs links, the `bluedotseconomy.org` site nav).
- Raise DNS TTL back to 3600+.
- Delete `backup-pre-migration` branch after a comfortable soak (e.g. 2 weeks).
- Update `~/.claude` project memory + CLAUDE.md notes that mention the GitHub Pages base path.

## Rollback

- DNS: remove the `docs` CNAME → domain stops resolving to Pages (site still reachable at `blue-dots-economy.github.io/bluedots-docs` only if the base-path config is reverted).
- Repo: `git push org backup-pre-migration:main --force` restores the June state.
- Fork keeps full history regardless; nothing in this plan destroys data.

## Known risks

| Risk | Mitigation |
| --- | --- |
| Missed `/bluedots-docs` prefix in a link | links-validator fails the build → caught before deploy |
| DNS propagation lag / cert issuance delay (minutes–hours) | keep old fork Pages up until Phase 4 checks pass |
| Org repo had diverged content worth keeping | diff `backup-pre-migration` vs new main before deleting; June state predates all diagram work, expected superseded |
| `site` URL affects canonical/sitemap/OG URLs | single config line; verified in Phase 4 sitemap check |

# Dual-Domain Docs + Legacy Redirect Implementation Plan

**Goal:** The docs site is served at `https://docs.bluedotseconomy.org` (new canonical host), and every existing URL under `https://docs-signals-dpg.bluedotseconomy.org` keeps working by redirecting to the same path on the new host.

**Architecture:** GitHub Pages allows exactly **one** custom domain per repository (the `CNAME` file / Settings → Pages field), and it cannot emit HTTP 3xx redirects for extra hostnames. So one hostname must be served by a *second* Pages site whose only job is to redirect. This repo (`Blue-Dots-Economy/bluedots-docs`) moves its custom domain to `docs.bluedotseconomy.org`; a new tiny repo (`Blue-Dots-Economy/docs-signals-dpg-redirect`) claims `docs-signals-dpg.bluedotseconomy.org` and serves a path-preserving redirect page (`index.html` + `404.html`). Both hostnames stay on GitHub-issued Let's Encrypt certs, and DNS stays at GoDaddy — no nameserver migration.

**Verified facts (2026-07-30):**

- Nameservers for `bluedotseconomy.org`: `ns55/ns56.domaincontrol.com` → **GoDaddy DNS** (not Cloudflare). GoDaddy's subdomain *forwarding* feature does not serve a valid TLS cert for arbitrary subdomains, so it is **not** usable for the `https://` legacy links — hence the redirect-repo approach.
- `docs-signals-dpg.bluedotseconomy.org` currently resolves: `CNAME → blue-dots-economy.github.io` → `185.199.108-111.153`. This record **does not change**; Pages routes by `Host` header, so the same CNAME target can serve a different repo once the domain claim moves.
- `docs.bluedotseconomy.org` currently does **not** resolve — a new record is required.
- Apex `bluedotseconomy.org` → `184.168.100.131` (GoDaddy parking/site). Untouched by this plan.
- Old domain appears in: `astro.config.mjs:32`, `public/CNAME`, `CLAUDE.md:5,17`, `src/content/docs/guides/deployment.md:149`, `docs/superpowers/specs/2026-07-22-api-spec-hosting-design.md:12,30`.

## Global constraints

- **Domain claim is exclusive:** GitHub rejects a custom domain already claimed by another repo. The legacy host must be released by `bluedots-docs` *before* the redirect repo can claim it. Ordering below respects this.
- **Unavoidable short outage on the legacy host** between release and new-cert issuance (typically 5–15 min, worst case ~1 h). During it, `https://docs-signals-dpg…` may show a TLS name mismatch or GitHub's 404 page. Mitigation: the redirect repo is fully prepared (files committed, Pages enabled on the default `*.github.io` URL) *before* the switch, so only cert issuance sits in the window. Do the switch off-peak.
- **No true 301 from Pages.** The legacy host redirects via `<meta http-equiv="refresh">` + `location.replace()`. Deep paths are served through `404.html`, which carries HTTP status 404 (browsers still follow the JS redirect; crawlers see a 404 rather than a 301). If a real 301 is required for SEO, see Appendix A (Cloudflare).
- **Do not change `base`** — the site stays at domain root; internal links remain root-relative.
- Work on a branch (`chore/dual-domain-docs`), PR into `main`. Pages redeploys on merge.

## Decisions taken (2026-07-30)

1. Canonical host confirmed: `docs.bluedotseconomy.org`.
2. Redirect repo: **`Blue-Dots-Economy/docs-signals-dpg-redirect`, public** (Pages on a private repo needs a paid org plan).
3. Division of labour: **the user** adds the GoDaddy `docs` CNAME (Phase 1) and merges the PRs; **the agent** does the repo edits, the redirect repo, both Pages custom-domain settings, and curl verification.
4. The `CLAUDE.md` condensation that was uncommitted when this work started ships as its own PR; the domain PR is stacked on it.

---

# Phase 1 — DNS: add the new host (safe, do first)

### Task 1: Create the `docs` CNAME at GoDaddy

- [ ] GoDaddy → DNS management for `bluedotseconomy.org` → Add record:
      - Type `CNAME`, Name `docs`, Value `blue-dots-economy.github.io`, TTL 600 (1 h default is fine; lower TTL shortens later debugging).
- [ ] Leave the existing `docs-signals-dpg` CNAME untouched.
- [ ] Verify: `dig +short docs.bluedotseconomy.org` returns `blue-dots-economy.github.io.` and the four `185.199.*.153` IPs.

Until Phase 2 lands, the new host returns GitHub's "There isn't a GitHub Pages site here" — expected, no user impact (no links point there yet).

---

# Phase 2 — Repo: move the canonical domain to `docs.bluedotseconomy.org`

### Task 2: Point the build and the Pages claim at the new host

**Files:**
- Modify: `public/CNAME`
- Modify: `astro.config.mjs`

Changes:

```
# public/CNAME  (single line, no scheme, no trailing slash)
docs.bluedotseconomy.org
```

```js
// astro.config.mjs:32
site: 'https://docs.bluedotseconomy.org',
```

Why both: `public/CNAME` is what the deployed artifact hands GitHub Pages to set/keep the custom domain (it is why the domain survives redeploys); `site` drives canonical `<link>` tags, `sitemap-index.xml` entries and absolute OG URLs that Starlight generates.

- [ ] Edit both files.
- [ ] `pnpm build` locally; confirm `dist/CNAME` contains the new host and `dist/sitemap-0.xml` URLs start with `https://docs.bluedotseconomy.org`.

### Task 3: Update in-repo references to the old host

**Files:**
- Modify: `CLAUDE.md` (lines 5, 17 — architecture blurb + deployment snippet)
- Modify: `src/content/docs/guides/deployment.md` (line 149 — `site:` example)
- Modify: `docs/superpowers/specs/2026-07-22-api-spec-hosting-design.md` (lines 12, 30) — historical spec; either leave as-is or annotate "(now `docs.bluedotseconomy.org`)". Prefer annotating, not rewriting history.

Also add to `CLAUDE.md` a short "Domains" note: canonical host, plus "legacy host `docs-signals-dpg.bluedotseconomy.org` is a separate redirect-only Pages repo — do not re-add it here."

- [ ] Edits done, `rg 'docs-signals-dpg'` shows only the redirect-note and the annotated spec lines.

### Task 4: Merge and let Pages take the new domain

- [ ] Open PR, merge to `main`, wait for `Deploy docs to GitHub Pages` to finish.
- [ ] GitHub → repo Settings → Pages: confirm **Custom domain** now reads `docs.bluedotseconomy.org` and shows "DNS check successful". If it did not follow the artifact's `CNAME`, set it manually in that field (this rewrites `public/CNAME` on the branch only if edited via UI on a branch-published site — with the Actions flow, just set the field).
- [ ] Wait for the cert: "Enforce HTTPS" becomes checkable → check it.
- [ ] Verify: `curl -sI https://docs.bluedotseconomy.org/ | head -1` → `HTTP/2 200`; site loads, CSS/fonts/API reference pages load, no mixed-content or 404s in console.

At the end of this phase the **legacy host is unclaimed and broken**. Phase 3 must follow immediately — prepare it (Task 5) *before* merging Task 4.

---

# Phase 3 — Redirect site for the legacy host

### Task 5: Create and populate the redirect repo (do this BEFORE Task 4's merge)

- [ ] `gh repo create Blue-Dots-Economy/docs-signals-dpg-redirect --public --description "301-style redirect: docs-signals-dpg.bluedotseconomy.org → docs.bluedotseconomy.org"`
- [ ] Commit these files on `main`:

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Moved to docs.bluedotseconomy.org</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="https://docs.bluedotseconomy.org/" />
    <meta http-equiv="refresh" content="0; url=https://docs.bluedotseconomy.org/" />
    <script>
      // Preserve the full path, query and hash so deep links survive the move.
      location.replace(
        'https://docs.bluedotseconomy.org' + location.pathname + location.search + location.hash
      );
    </script>
  </head>
  <body>
    <p>
      These docs moved to
      <a href="https://docs.bluedotseconomy.org/">docs.bluedotseconomy.org</a>.
    </p>
  </body>
</html>
```

`404.html`: byte-identical copy of `index.html`. GitHub Pages serves it for every unknown path, so `/guides/deployment/` and `/api/signals-dpg/…` hit it and the inline script rewrites to the same path on the new host.

`CNAME`:

```
docs-signals-dpg.bluedotseconomy.org
```

`README.md`: one paragraph — what this repo is, that it holds no content, and a pointer back to `bluedots-docs`.

- [ ] Settings → Pages → Source: **Deploy from a branch**, `main` / `/ (root)`. No Actions workflow needed.
- [ ] Verify on the default URL first: `https://blue-dots-economy.github.io/docs-signals-dpg-redirect/` should bounce to `docs.bluedotseconomy.org` (path will be the repo-prefixed one — that is fine, it only proves the script runs).
- [ ] Do **not** set the custom domain yet if `bluedots-docs` still holds it — the `CNAME` file commit will fail the domain check until Task 4 lands. Committing it early is harmless; Pages will pick it up once free (re-run the deploy if needed).

### Task 6: Claim the legacy host on the redirect repo

- [ ] After Task 4: Settings → Pages on the redirect repo → Custom domain = `docs-signals-dpg.bluedotseconomy.org` → save. DNS check should pass immediately (record unchanged since Phase 0).
- [ ] Wait for cert issuance, then tick **Enforce HTTPS**.
- [ ] Verify, from a clean browser profile and with curl:
      - `curl -s https://docs-signals-dpg.bluedotseconomy.org/ | grep -c docs.bluedotseconomy.org` → non-zero.
      - Browser: `https://docs-signals-dpg.bluedotseconomy.org/guides/deployment/` lands on `https://docs.bluedotseconomy.org/guides/deployment/`.
      - Browser: a deep API-reference URL, e.g. `/api/signals-dpg/operations/tags/<tag>/`, lands on the same path.
      - Query + hash preserved: `…/guides/deployment/?x=1#step-3`.

---

# Phase 4 — Follow-through

### Task 7: Update outward-facing references

- [ ] Repo → About → Website field: `https://docs.bluedotseconomy.org`.
- [ ] Any service repos / READMEs / API `servers` descriptions / spec-sync PR templates that link to the old host (grep the three DPG repos for `docs-signals-dpg`).
- [ ] Google Search Console (if used): add the new property; the legacy host's 404-status redirect will not pass ranking signals cleanly — see Appendix A if that matters.
- [ ] Announce the new URL wherever the old one was shared.

### Task 8: Post-switch verification checklist

- [ ] `curl -sI https://docs.bluedotseconomy.org/ | head -1` → 200, valid cert (`curl -v` shows CN/SAN for the new host).
- [ ] `https://docs.bluedotseconomy.org/sitemap-index.xml` lists only new-host URLs.
- [ ] Internal link checker passes in CI (`starlight-links-validator` runs at build — a green build is the proof).
- [ ] Legacy host redirects for: root, a guide page, a tag page, a 404-ish path (`/nope/` → new host `/nope/` → Starlight 404, acceptable).
- [ ] Both hosts show "Enforce HTTPS" checked.

## Rollback

- Legacy host broken and redirect repo misbehaving → in the redirect repo, delete `index.html`/`404.html` content problems or revert the commit; Pages redeploys in ~1 min.
- Need to go back entirely → in the redirect repo remove the custom domain; in `bluedots-docs` revert `public/CNAME` + `astro.config.mjs` to `docs-signals-dpg.bluedotseconomy.org` and merge; the old DNS record already points there. New-host CNAME can stay (harmless 404) or be deleted.

---

## Appendix A — Alternative: real 301s via Cloudflare (only if SEO/status codes matter)

Requires moving `bluedotseconomy.org` nameservers from GoDaddy to Cloudflare (free plan is enough). Then:

1. Cloudflare DNS: `docs` → CNAME `blue-dots-economy.github.io`, **proxied**; `docs-signals-dpg` → CNAME `blue-dots-economy.github.io`, **proxied**.
2. Rules → Redirect Rules: if `hostname eq "docs-signals-dpg.bluedotseconomy.org"` → dynamic redirect to `concat("https://docs.bluedotseconomy.org", http.request.uri.path)`, status **301**, preserve query string.
3. `bluedots-docs` keeps only `docs.bluedotseconomy.org`; no redirect repo needed.

Trade-off: a real 301 with correct status codes and no second repo, at the cost of an NS migration (all existing GoDaddy records must be recreated first — apex, mail, anything else) and a new dependency in the serving path. Not recommended unless search ranking on the old host is materially valuable.

## Appendix B — Why not "both hostnames serve the same content"

Literally serving identical content on both hosts is possible only by fronting Pages with a proxy that rewrites the `Host` header (Cloudflare Workers / Origin Rules), because Pages 404s any hostname it does not have a claim for. It also creates duplicate-content canonical ambiguity. The redirect model gives the same practical result — every old URL keeps working — with far less machinery, which is why this plan takes it.

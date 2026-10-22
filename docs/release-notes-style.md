# Release notes style guide

This guide defines how Blue Dots release notes are written. It applies to release PR descriptions, per-repo fragments (`src/releases/<sprint>/<rc>/components/<repo>.md`) and the merged page (`src/releases/<sprint>/<rc>/notes.md`). The `release-pr-notes` and `release-page` skills read it. People can follow it directly.

## Rules for every section

- Use the eight headings below, verbatim, in this order, at level 2. The tooling extracts by heading (case-insensitive, extra whitespace tolerated). A section ends at the next heading of the same or higher level. HTML comments are ignored.
- Never omit a section. An empty section reads `None.` on its own line. Write `None.` only after you have checked.
- Give facts. Never write an upgrade verdict or recommendation: no "safe to upgrade", "recommended", "must upgrade", "low risk". Readers decide for themselves.
- Security fixes: describe the effect ("sign-in sessions are now harder to misuse"), never the mechanism, the exploit, or what was vulnerable. The repos are public. Leave out header names, token handling, algorithm details and attack names.
- Release notes describe the change in the product. Do not name internal files, branches or people.
- Use `Blue Dots`, `a blue dot`, `domain` and `participant type` as defined in `CLAUDE.md` (Naming). Use the code names (`network.json`, `NETWORK_ID`) only where the identifier itself is the point.

The plain-language rules R1 to R8 in `CLAUDE.md` ("Plain language") apply to In Plain Terms, Breaking changes / config and What users will notice. In short: short sentences, concrete nouns, no jargon, expand acronyms on first use (R9), active voice (R10). Do not restate them in the PR. Just follow them.

Only these five sections reach the docs site: Release Notes, In Plain Terms, Breaking changes / config, What users will notice, Deploy ordering. Summary, Verification and Checklist stay in the PR.

## Summary

- **Reader:** an engineer reviewing the PR.
- **Belongs:** what the promotion contains and why. The merge method if it matters (merge commit, not squash). What was already released and is left out.
- **Does not belong:** a commit list, test logs (those go in Verification).
- **Length:** 2 to 4 sentences.
- **None.:** never. A summary is always written.
- **`notes.md` only:** open with one sentence that stands alone and says what the sprint release delivers. The index page uses it as the sprint's one-liner. Write it without jargon and without "this release" or "this PR".

## Release Notes

- **Reader:** an engineer or adopter who wants the list of what changed.
- **Belongs:** user-facing and operator-facing changes, one bullet each. Group bullets by theme under bold labels, for example `**Sign-in and sessions**`, `**Search and discovery**`, `**Housekeeping**`. Put the headline theme first.
- **Every bullet ends with a PR link in the form `(#N)`**. Several PRs: `(#N, #M)`. A cross-repo PR is written `(owner/repo#N)`.
- **Does not belong:** PR titles pasted unchanged, commit hashes, internal refactors with no effect (fold them into one Housekeeping bullet).
- **Length:** one or two sentences per bullet. About 3 to 8 bullets per theme at most.
- **None.:** if a source PR has no notes, add its title as one bullet. Never write `None.` for a release that merged PRs.

Example:

```md
**Search and discovery**
- The list view now pages through the whole network and lets you pick the sort order. (#665)
- Item cards can be opened from the keyboard. (#658)
```

## In Plain Terms

- **Reader:** a PM or a non-technical reader.
- **Belongs:** what changed and what it means for people, in everyday words. Explain a technical idea with a comparison only when it is literal and short.
- **Does not belong:** PR numbers, env var names, product-internal terms, verdicts, adjectives like "major" or "exciting".
- **Length:** one paragraph, at most 4 sentences or about 80 words. Cover the headline change first.
- **None.:** not used for a release with Release Notes. If the release is housekeeping only, say so in one sentence.

## Breaking changes / config

- **Reader:** devops and the engineer who deploys.
- **Belongs:** every new or changed environment variable, feature flag, database migration, `network.json` or schema change, and every removed or changed behaviour. For each item give the name, what it does, the default, and what to do. Link the PR.
- **Does not belong:** changes that need no action, and security mechanism detail.
- **Length:** one bullet per item. Use a short list, not a paragraph.
- **None.:** only after you have checked the diff for env files, config schemas, migration folders, `network.json`, Helm values and removed routes or fields. When unsure, list the item.

## What users will notice

- **Reader:** an end-user trainer or PM who tells users what looks different.
- **Belongs:** visible changes to screens, flows, buttons, wording and messages, in the words a user sees. Say where the change is and what the user does differently. Quote UI strings exactly.
- **Does not belong:** back-end changes with no visible effect, PR numbers, technical terms.
- **Length:** one short bullet per change.
- **None.:** when nothing visible changed. Write `None.` and nothing else.

## Deploy ordering

- **Reader:** devops.
- **Belongs:** order constraints between repos or between steps, for example "Deploy this repo before bluedots-automation #127", with the reason in one clause. Name the repo and PR on both sides.
- **Does not belong:** general deploy instructions, rollback advice, verdicts.
- **Length:** one bullet per constraint.
- **None.:** when components can be deployed in any order. In the merged `notes.md`, state the cross-repo order explicitly even when each repo says `None.` and an order still exists.

## Verification

- **Reader:** the reviewer of the PR.
- **Belongs:** the evidence: green checks on the promoted HEAD, ancestry checks (`main` is contained in `develop`), manual checks.
- **Does not belong in the docs:** this section is not extracted.
- **Length:** a short bullet list.
- **None.:** not used. If nothing was verified, say what was not.

## Checklist

- **Reader:** the reviewer of the PR.
- **Belongs:** the repo's PR template checklist, ticked, plus the merge instructions (merge commit or squash) and the reminder to cut the shared release tag after all repos land.
- **Does not belong in the docs:** this section is not extracted.
- **Length:** the template's items.
- **None.:** not used.

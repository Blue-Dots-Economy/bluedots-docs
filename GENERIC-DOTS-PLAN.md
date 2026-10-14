# Generic Dots + Plain Language: Docs Rewrite Plan

> **For agentic workers:** work task by task. Each task lists the files it owns and its acceptance check. Do not edit files outside your list; send rename/sidebar/hub changes to the integrator (Wave 3). Tick `- [ ]` boxes as you go and update the Status line.
>
> **Status: executing — Wave 1 done in PR 1 (2026-10-10); Wave 2 next. All owner decisions answered; see section 2.** Built from a 4-agent analysis of all 58 pages and revised after 3 review agents (accuracy, language, execution). Decisions that differ from the proposed defaults: D3, Q7, Q8, Q12 (applied to the tasks below).
>
> Per CLAUDE.md, this file is temporary: `git rm` it in the PR that completes the work. Phase 0 moves everything worth keeping (style rules, naming rule, scenario bank, fact owners) into CLAUDE.md first.

**Goal:** The docs present Blue Dots as general-purpose local discovery software that serves many sectors ("dots"), not as a jobs product. Jobs stays as the first live use case and the source of all pilot evidence. All prose is plain, literal and readable by a non-technical reader. No cinematic or marketing language.

**Feedback being addressed**

1. Almost every explanation uses the jobs scenario. Blue Dots is a generic DPI/DPG. The dots are: **Blue** (livelihoods for youth), **Yellow** (education avenues and services), **Purple** (economic participation of persons with disabilities), **Orange** (tourism), **Pink** (women's labour-force participation), **Green** (farming efficiency) and **Brown** (growth for SMBs). Make the docs generic and describe possible scenarios.
2. Remove AI slop and cinematic explanation. Use layman language.

---

## 1. Analysis summary

### 1.1 Where the jobs bias is

| Bias | Pages |
|---|---|
| High, needs reframing | `index.mdx`, `overview/introduction.md`, `overview/paradox-of-proximity.mdx`, `core-concepts/blue-dot-lifecycle.mdx`, `explore/use-cases.mdx` |
| Medium | `overview/the-blue-dots-approach.md`, `core-concepts/signals.mdx`, `core-concepts/aggregators.md`, `core-concepts/networks-domains-instances.md`, `core-concepts/glossary.mdx`, `explore/economics.mdx`, `guides/district-activation.mdx`, `community/roadmap.md` |
| High but legitimate: real pilot facts or real deployed config. Keep the facts and fix only the framing | `explore/pilots.mdx`, `explore/learnings.mdx`, `core-concepts/participant-profiles.mdx`, `guides/voice-ai-prompts.md`, the four AI Diffusion pages |
| Low or none (slop fixes only) | other Start Here, architecture, technical, install and API pages |

Baseline jobs-term counts (`jobs?|employer|vacanc|hiring|jobseeker|placement|ITIs?|MSME`): index 6, introduction 6, paradox 9, approach 7, lifecycle 16, participant-profiles 15, glossary 8, use-cases 7, aggregators 5. Only 1 page (`explore/beyond-livelihoods`) names any dot other than Blue in prose, and it is step 7 of 7 in its reading path.

### 1.2 Root causes

1. **"Blue Dot" means three things.** It is the generic word for any listing ("become a Blue Dot"), the name of the jobs network, and part of the product and realm names. When "a Blue Dot" is defined with job examples, jobs looks like the whole product.
2. **The docs undercount what exists.** Signals-DPG `examples/schemas/` defines four networks. The other three have UI themes only.

   | Dot | Network folder | Network id | Domains (ids) | Actions | Status |
   |---|---|---|---|---|---|
   | Blue | `blue_dot` | `blue_dot` | `seeker`, `provider` (the deployed pilot schema also has `service_provider`) | `apply`, `connect` | live, piloted |
   | Yellow | `yellow_dot` | differs from folder name (see `Signals-DPG/SETUP.md`) | `student`, tutor/counsellor | `connect` | schema exists |
   | Purple | `purple_dot` | `purple_dot` | `seeker`, `provider` | `connect` | schema exists |
   | Orange | `orange_dot` | `orange_dot` | `practitioner` | none (public listing) | schema exists, plus a tourist web app |
   | Pink, Green | none | none | none | none | UI theme only (`pink_dot`, `green_dot` in `VITE_DEFAULT_NETWORK_THEME`) |
   | Brown | none | none | none | none | idea only |

   There is also an inter-network example (blue ↔ yellow) in `examples/schemas/inter-network-action/`. Do not write that networks "never" exchange data.
3. **Factual errors.**
   - `student` is shown as a `blue_dot` domain in `core-concepts/index.mdx`, `networks-domains-instances.md` (text and diagram) and `guides/adaptor-onboarding.mdx` ("`student, employer`"). It belongs to Yellow.
   - `service_provider` is attributed to the example `blue_dot/network.json`, which has only `seeker` and `provider`. The role is real, but it comes from the deployed pilot schema (not the example file), so the fix is to correct the citation, not delete the role.
4. **Reading order puts jobs first.** The family page comes after three jobs pages. No Overview page mentions another dot. Yellow is missing from the family page and from the visual system: there is no SVG, no CSS variable and no `DotCard` colour.
5. **No page says how a deployment picks its dot.** These settings are undocumented:
   - local Signals: `SIGNALS_NETWORK`, `SERVED_DOMAINS`, `VITE_NETWORK_ID` (correct per-network values are already in `Signals-DPG/SETUP.md`, "network" table)
   - local aggregator: `AGGREGATOR_NETWORK` (its compose still hard-codes the blue schema path; verify before saying one variable switches it)
   - cloud: `_network` / `_brand` in `bluedots-automation/opentofu/aws/template/global-values.yaml`
6. **Slop is concentrated and copied between pages.**
   - Metaphors and coined phrases: "digitally dark" / "digital darkness" (11 hits), "invisible" / "invisibility" (13), "crisis", "rails" / "shared rail", "fluidic exchange … interconnected economic engine", "closes the gap", "at the heart of".
   - "Not X, it is Y" flips: "not distance, it is digital discoverability", "not a technical build".
   - Aphorisms: "Volume without credibility is just a list".
   - Headline headings: "Local discovery, solved", "The macro stake".
   - 602 em dashes in total, 22 on district-activation alone.
   - The jobs-only aggregator list ("ITIs, MSME associations, skilling centres") is copied onto 5 pages.
7. **Invented testimonials.** `JourneyQuote` blocks on `explore/beyond-livelihoods.mdx` and `explore/use-cases.mdx` are made-up first-person quotes. For Pink, Green and Brown they describe outcomes that have not happened.
8. **Numbers drift between pages.**

   | Figure | Values found |
   |---|---|
   | Discovery time | "< 1 day" (index), "within a day" (use-cases), "under two days" (index, intro), "< 2 days" (paradox, pilots) |
   | Seekers in the pilot | 15k per district vs 20k+ in total (pilots) |
   | MSMEs | "<10%" vs "~10%" |
   | Youth placement | "< 20%" (paradox) vs "< 50%" (family page) |
   | Cost per call | "₹10" vs "< ₹10" |
   | District-activation phases | labelled "Weeks 1–6 / 4–6 / 4–6" against "under 90 days" (also repeated in `start/deploy.mdx`) |
   | Economics | possible multiplier double-count; three definitions of "top 100 districts" |

   The macro stats are unsourced: "$3 Tn" tourism, "$12 bn" crop loss, "60M" SMBs, "~100M" PwDs, "<70%" scheme utilisation, "<50%" service uptake.
9. **Duplication and wrong register.** The intake-methods table is repeated in lifecycle and aggregators. `aggregators.md` "How coordinators join" is runbook detail on a Core Concepts page. Auth wording says "Keycloak service token" everywhere, but both `x-api-key` and Keycloak service accounts exist in code.

---

## 2. Owner decisions (answer before Wave 1)

Proposed defaults are in **bold**. The plan executes with the defaults if the owner accepts them.

| # | Decision | Proposed default |
|---|---|---|
| D1 | Naming | **"Blue Dots"** is the platform/programme. **"a dot"** (or "a listing") is the generic thing a person publishes. **"Blue Dot"** with a colour is the jobs network, in the same pattern as "Yellow Dot". Lifecycle states are colour-neutral ("Verified", "Live"). Product UI strings are quoted as-is and not adopted as the generic term. **→ Accepted 2026-10-10.** |
| D2 | Real vs possible | Blue, Yellow, Purple and Orange: describe with real fields. Pink and Green: "UI theme only, no network yet". Brown: "idea". Scenarios for possible dots use "could" / "for example", and no outcome claims are made for any dot except Blue. **→ Accepted 2026-10-10: public labels are Live, piloted / Network defined / Possible.** |
| D3 | Jobs facts | **Keep every number, place, partner and quote** in pilots, learnings and economics. Change only titles, intros and generalisations ("In the jobs pilot, …"). **→ Decided 2026-10-10: leave pilots, learnings, economics untouched except slop fixes (no retitling, no reframing, no new sections).** |
| D4 | Example rotation | Generic pages use the scenario bank (section 4). They show at least one non-Blue dot and do not always lead with jobs. Technical pages that document the real `blue_dot` schema keep it and add one line saying that other networks work the same way. **→ Accepted 2026-10-10.** |
| D5 | Spelling and numbers | **Indian/British English. Lakh and crore for Indian figures, with the international figure on first use. MSME outside Brown naming** (existing rule). **→ Accepted 2026-10-10.** |
| D6 | Public-site names | **Use display names, never internal ids or partner brand ids, for unpublished pilots.** The owner keeps the list of non-public ids and partner/place names and gives it to the verifier directly. It is deliberately not written in this public file. **→ Accepted 2026-10-10.** |
| Q1 | Does the product UI use "Blue Dot" generically (e.g. "Blue Dot App", "To Become a Blue Dot")? | Quote UI strings; prose follows D1. **→ Resolved from code 2026-10-10: UI strings are per network ("Blue Dot" only in blue_dot schema files; Orange uses "Orange Dot"). UI already matches D1.** |
| Q2 | Lifecycle page: change the title, keep the slug `blue-dot-lifecycle`? | **Title becomes "The Dot Lifecycle"; slug unchanged.** **→ Accepted 2026-10-10.** |
| Q3 | Can the Orange and Purple networks be named publicly as existing networks? | **Yes, by colour and sector only** (their themes are already public). No district or partner names. **→ Accepted 2026-10-10.** |
| Q4 | Is there a second, non-jobs voice configuration to cite? | **Don't cite one** until it is confirmed. **→ Accepted 2026-10-10.** |
| Q5 | Economics multiplier: fix it (this changes the owned ₹87,500 crore headline) or only flag it? | **Flag only, in this plan.** Fix it in a separate PR with owner sign-off. **→ Resolved by D3 2026-10-10: economics untouched; multiplier only flagged to the owner.** |
| Q6 | Pilot numbers 15k/district vs 20k+ total, <10% vs ~10% MSMEs, Dharwad MSME vs ITI attribution: which is right? | Pilot owner supplies the source. **Until then, keep the pilots-page table values and make the prose match the table.** **→ Resolved by D3 2026-10-10: pilots page untouched; other pages copy the pilots-page table values and link to it.** |
| Q7 | Unsourced macro stats | **Remove unless a source is supplied before Wave 2 starts.** **→ Decided 2026-10-10: don't change. Existing figures stay as they are (no removal, no relabelling).** |
| Q8 | Landing-page stat grid restates pilot outcomes, which the figure-owner rule assigns to `explore/pilots` | **Keep, labelled "Jobs pilot", each stat linking to pilots. Record this as a landing-page exception in CLAUDE.md.** Swap one stat for the PwD campaign figure. **→ Decided 2026-10-10: remove the stat grid; show the 7-dot grid instead. Pilot numbers live only on the pilots page (no CLAUDE.md exception needed).** |
| Q9 | PwD campaign figure (Feb 2026, 1 lakh+ needs, 10 days, ₹10/interaction): which page owns it? | **`explore/pilots`**, in a new "Other campaigns" section. Paradox and landing link to it. **→ Decided 2026-10-10: owner is the Purple Dot section of `explore/beyond-livelihoods` (Dots Family). Paradox and Introduction link to it.** |
| Q10 | Should "Adding a new dot" join the Deploy path? | **No.** List it in the Guides index only, so no renumbering is needed. **→ Accepted 2026-10-10.** |
| Q11 | Who redraws the diagrams? The lifecycle diagram has no `.excalidraw` source. | Named owner needed. Diagrams 6.1 and 6.3 have sources and can be agent-done; 6.2 waits on this. **→ Decided 2026-10-10: an agent does all 3 (edit sources, rebuild lifecycle in Excalidraw, export PNGs via chrome-devtools); owner reviews PNGs in the PR.** |
| Q12 | Auth wording (Keycloak service account vs `x-api-key`) | **Document both, and say which is the default.** Describe intended behaviour only, and add no new detail about acting-org or peer-auth modes (open security findings). **→ Decided 2026-10-10: Keycloak service accounts only (target state); do not mention x-api-key. No new detail on acting-org or peer-auth modes.** |
| Q13 | Explore reorder vs D3 (pilots pages untouched) | **→ Decided 2026-10-10: reorder. On pilots, learnings and economics change only `prev`/`next`/`sidebar.order` frontmatter; body text stays untouched apart from slop fixes.** |

---

## 3. Style rules (copied into CLAUDE.md in task 0.1)

**Scope.**
- Rules R1–R8 apply to every page.
- R9 (reading level) and R10 (active voice) apply to Overview, Explore and Start Here.
- Fenced code, YAML, voice-prompt text, JSX component names, `import` lines, `api/` generated pages, attributed real quotes, quoted UI strings and organisation names are exempt.

**Rules**

- **R1. Say literally what happens.** Replace metaphors with the action.

  | Instead of | Write |
  |---|---|
  | rails, shared rail | the same open-source software and data rules |
  | digitally dark, invisible | not listed anywhere online |
  | surfaced | found, listed |
  | closes the gap | helps them find each other |
  | discovery | finding |
  | instance | one running copy of the software |
  | signal of intent | a short listing that says what someone needs or offers |

  Keep one literal UPI comparison on the DPG page, for example: "Like UPI lets any bank or app send money through one shared system, …".
- **R2. No rhetorical flips** ("not X, but Y", "isn't just X", "not X. Not Y. Not Z."). State the positive claim.
- **R3. No aphorisms, slogans or rhythmic triads.** Real lists of three are fine.
- **R4. Use concrete nouns.** Do not use *discoverability, local intelligence, density, proximity value, demand and supply* unless they are defined on the page. Say who, what and where ("employers within 5 km", "what people said on calls").
- **R5. Paragraphs:** at most 4 sentences or about 80 words, and at most 1 bold phrase. **Em dashes:** at most 1 per paragraph. Use commas or full stops instead.
- **R6. Headings** are in sentence case and say what the section contains ("Who is affected most", "Jobs found in the pilot"). No headline-style headings.
- **R7. Numbers.**
  - Write `₹87,500 crore`, never `cr`.
  - Use lakh/crore for Indian money and people counts, with the international figure on first use ("1 lakh (100,000)"). Don't mix million and lakh on one page.
  - Write `US$ 3 trillion`, not `$3 Tn`.
  - In prose, write "under 2 days", not "< 2 days". Symbols are allowed in StatCards.
  - A headline figure is stated on its owning page and linked everywhere else (CLAUDE.md figure table).
- **R8. Quotes are real or labelled.** A first-person quote needs a real source, or it is labelled "Example". Possible dots get no outcome quotes. Narrative people on the paradox page ("Kavita", "ITI graduate 800 metres away") get an "Example:" label unless they come from field notes.
- **R9. Reading level.** A Class 8 reader or a block officer should be able to follow it. Test: at most 3 sentences over 25 words per page (today intro has 8, paradox 8, district-activation 7).
  - Expand these on first use per page: ITI, SHG, FPO, DPO, PwD, MSME, KVK, DPI, DPG.
  - Don't italicise Indian words.
- **R10. Active voice** in Overview, Explore and Start Here. Technical pages may use the passive for system behaviour.
- **R11. Register (existing rule).** Advocacy appears only in Overview and Explore. Guides and Core Concepts describe what exists and what to do.
- **Don't over-correct.**
  - Keep "paradox of proximity" as the programme's named concept: define it once in plain words, and don't build sentences around it.
  - Keep literal consent statements on every matching page ("Phone numbers are shared only after both sides agree").
  - Keep "by design" or "deliberately" when a reason follows (security and runbook text).
- **Frontmatter `description` and page titles are in scope** for every task.

### Style gate (prose only, scoped to `src/content/docs`)

```bash
# prose only: drop fenced code and import lines; skip generated API pages
find src/content/docs -name '*.md*' -not -path '*/api/*' -print0 |
  xargs -0 awk '/^[[:space:]]*```/{c=!c;next} !c && !/^import /{print FILENAME":"FNR": "$0}' > /tmp/prose.txt

# Tier 1: must return 0 lines (except entries in the allow-list below)
grep -inE '\bdigital(ly)?[ -]dark(ness)?\b|\brails?\b|\bfluidic\b|economic engine|\bclos(e|es|ing) the gap\b|\bunlock(s|ed|ing)?\b|\bleverag(e|es|ed|ing)\b|\bisn[’'"'"']t just\b|\bnot just\b|\bcrisis\b|\binvisib(le|ility)\b|\bstark\b|\bthrottled\b|structurally, not|proof is concrete|not a theoretical|\bheart of\b|at (its|the) (core|heart)|\bjourney\b|Blue[- ]Dott(ed|ing)|\bsolved\b|\bseamless|\bempower|\bharness|game.?chang|load-bearing|non-negotiable|by construction' /tmp/prose.txt

# Tier 2: each hit reviewed by a person and kept only if literal
grep -inE '\bnot [a-z ]{1,40}(—|–)|— not\b|\bnot only\b|\bnot [a-z ]+, but\b|\bby design\b|\bdeliberate(ly)?\b|\bfoundation(al)?\b|\becosystem\b|\bsurfac(e|es|ed|ing)\b|\bat scale\b|\bmeaningful\b|\bdensity\b' /tmp/prose.txt
```

- Baseline today: Tier 1 has 61 prose lines.
- **Tier 1 allow-list:** the line-anchored security and runbook uses, kept in a `.style-allow` file created in task 0.1.
- Tier 2 is a review list, not a 0-hit gate.

---

## 4. Scenario bank (copied into CLAUDE.md in task 0.1)

Writers use these scenarios and no others, so pages stay consistent. Each scenario covers who lists, who finds, who helps and who agrees before contact. All are checked against the real schema fields.

| Dot | Status | Scenario | Agrees before contact |
|---|---|---|---|
| Blue (jobs) | live | A young person registers by phone call in their language. A nearby employer with a vacancy sees the profile and sends an interview invite. A skilling centre has verified the profile. | The young person accepts before their number is shared. |
| Yellow (education) | schema | A Class 12 commerce student asks for help with accounts. A tutor who teaches Class 12 commerce and will travel up to 5 km sees the request and sends a connect request. A school or NGO helps students sign up. *(Use Subject Tutoring or Career Counselling, never admission guidance: tutors can't offer it in the schema.)* | The student accepts. |
| Purple (persons with disabilities) | schema | A person with a locomotor disability asks for a wheelchair and for help finding work. Providers in the same city who serve that disability see the request: an NGO that gives devices, and a training centre. A disabled persons' organisation (DPO) helps them register. *(Providers are matched by city, not by distance.)* | Either side sends a connect request, and the other accepts. |
| Orange (tourism) | schema, listing only | A homestay owner or a folk artist in a coastal district lists what they offer, with area, languages and price band. A tourism body checks and verifies the listing. Visitors find it in the app and call the number shown. | Not needed: the listing and phone number are public on purpose. |
| Pink (women's work) | possible | A woman who stitches blouses at home lists her work, and nearby boutiques looking for tailoring see it. Her self-help group (SHG) vouches for her. Another example: a woman who could work if she had childcare finds a crèche near home. *(Could be a brand over the Blue network or a separate network. Don't claim either.)* | She accepts. |
| Green (farming) | possible | A farmer needs a tractor for two days or a soil test. A nearby custom hiring centre or soil-testing lab sees the request. A farmer producer organisation (FPO) helps farmers sign up. | The farmer accepts. |
| Brown (small businesses) | idea | A kirana shop needs a regular supplier of packaged atta. Nearby wholesalers see the request. A trade association helps members sign up. | The shop accepts. |

**Who helps people sign up and checks their details:**

| Dot | Organisations |
|---|---|
| Blue | skilling centres and ITIs |
| Yellow | schools, colleges and education NGOs |
| Purple | DPOs and disability NGOs |
| Orange | tourism bodies |
| Pink | SHGs |
| Green | FPOs and KVKs |
| Brown | trade associations |
| Any dot | government departments |

**Fact owners (to add to the CLAUDE.md figure table):**

| Fact | Owner |
|---|---|
| Networks, their domains and their status | `core-concepts/networks-domains-instances` |
| PwD campaign figure | `explore/beyond-livelihoods`, Purple section (Q9) |
| "800 metres" field observation | `explore/learnings` (existing owner) |
| Time to create a dot | rename the existing row |

---

## 5. Tasks

**Acceptance check for every content task:**
- Tier 1 style gate returns 0 on your files.
- Frontmatter `description` has been rewritten.
- D1 is applied: `grep -n 'a Blue Dot\b'` returns 0 outside quoted UI strings.
- Generic pages name at least 1 non-Blue dot, matching `\b(Yellow|Purple|Orange|Pink|Green|Brown) Dots?\b`.
- The handoff list (renames, new descriptions, sidebar changes) has been sent to the integrator.

### Wave 1: foundations (1 agent, serial). Ships as PR 1.

- [x] **0.1 CLAUDE.md rules.**
  - Add the style rules (section 3), the D1 naming rule next to the MSME rule, the scenario bank (section 4) and the new fact-owner rows.
  - Rename the "Time to create a Blue Dot" row. No landing-page exception is needed: the landing stat grid is removed (Q8).
  - Fix the stale line "`custom.css` — theme accent overrides only" (it now holds the dot palette).
  - Note that CI does not build PRs.
  - Optional: add the gate as `pnpm check:style` with `.style-allow`.
  **Files:** Modify `CLAUDE.md`, `package.json`. Create `.style-allow`, `scripts/check-style.sh`. *Done: `pnpm check:style` baseline after Wave 1 = 66 Tier 1 lines.*
- [x] **0.2 Yellow in the visual system.**
  - Create `public/dots/dot-yellow.svg` (copy an existing dot and change the fill).
  - In `src/components/DotCard.astro`, add `'yellow'` to the colour union and add a `.dot-card--yellow` rule (the per-colour rules are in this file). Make `stat` optional and hide its row when it is absent.
  - In `src/styles/custom.css`, add `--dot-yellow` for light and dark plus `.dot-name--yellow`. Text colour must pass AA 4.5:1: ochre (around `#8a6a00`) in light mode, light yellow in dark mode.
  **Files:** Create `public/dots/dot-yellow.svg`. Modify `src/components/DotCard.astro`, `src/styles/custom.css`.
  **Check:** contrast measured in DevTools in both themes.
- [x] **1.1 Glossary.**
  - Apply D1.
  - Add entries: dot, network (sector), brand, coordinator, practitioner.
  - Merge the duplicate Adaptor entries.
  - Correct the `service_provider` citation ("in the deployed pilot schema").
  - Apply the auth wording per Q12.
  - Link to the networks page for the list of networks; don't restate it.
  **Files:** Modify `src/content/docs/core-concepts/glossary.mdx`.
- [x] **1.2 Networks page (fact owner).**
  - Fix `student` so it sits under Yellow.
  - Add the network table from section 1.2, using display names for the domains. Don't print the tutor domain id.
  - Mention the blue ↔ yellow inter-network example.
  - Write the alt text for the redrawn diagram (6.1).
  - Fix the `student` line on the Core Concepts index.
  **Files:** Modify `src/content/docs/core-concepts/networks-domains-instances.md`, `src/content/docs/core-concepts/index.mdx`.
- [x] **1.3 Diagram: networks, domains, instances.** Two networks with the correct domains, plus one non-jobs instance. A source exists.
  **Files:** `src/assets/diagrams/networks-domains-instances.{excalidraw,png}`.

### Wave 2: content (6 agents in parallel, exclusive files). PR 2 (A–D) and PR 3 (E–F).

**Agent A: front door**
- [ ] **2.1 Landing page.**
  - Rewrite the hero tagline and the "Solving the paradox of proximity" block. Use review rewrite P1 as the model: one-sentence "what it is", D1 wording, and one example each from Blue, Yellow and Purple.
  - Add a `DotGrid` of all 7 dots (no `stat` props), linking to the family page.
  - Remove the stat grid (Q8). The 7-dot grid replaces it; pilot numbers stay only on the pilots page.
  - Replace the aggregator list with the section 4 list.
  - Replace "crisis" in `description`.
  **Files:** Modify `src/content/docs/index.mdx`.
- [ ] **2.2 Introduction.**
  - Rewrite "What is a Blue Dot?" as "What is a dot?", with Blue and Yellow scenarios.
  - Add "One platform, many dots": 7 lines with a status for each, linking to the family page.
  - Cut "digital darkness", "closes the gap" and "800 metres" (owned by learnings; link instead).
  - Correct the `service_provider` mention.
  **Files:** Modify `src/content/docs/overview/introduction.md`.
- [ ] **2.3 Paradox of proximity** (largest rewrite).
  - Use review rewrite P2 as the model for the opening.
  - Replace the two jobs stories with one jobs story and one Green story (problem description only, per D2). Label them "Example:" (R8).
  - Move the MSME-employment macro section into a "For example, in jobs:" aside that links to economics.
  - Before/after table: add a "Dot" column with Blue, Yellow and Green rows.
  - Replace the PwD campaign paragraph with a one-line link to its owner, the Purple section of the Dots Family page (Q9).
  **Files:** Modify `src/content/docs/overview/paradox-of-proximity.mdx`.

**Agent B: Overview pages and evidence framing**
- [ ] **2.4 Approach, DPG and who-is-this-for.**
  - Remove "rails" (keep one literal UPI comparison), the repeated "consent is the foundation" (keep the literal rule), and the jobs-only aggregator lists.
  - Name the schema-driven networks as what makes the platform generic, linking to schema-driven-model.
  - Correct the "three types already defined" claim on the DPG page.
  **Files:** Modify `overview/the-blue-dots-approach.md`, `overview/blue-dots-as-a-dpg.md`, `overview/who-is-this-for.md`.
- [ ] **2.5 Community.**
  - Remove the roadmap placeholder text.
  - Add a per-dot status line to the roadmap (from the networks page).
  - Correct the contributing coverage threshold (70% to 80%) after checking the real gate.
  **Files:** Modify `community/roadmap.md`, `community/contributing.mdx`.
- [ ] **3.4 Pilots, learnings, economics: slop fixes and nav only (D3, Q13).**
  - Body text, titles, numbers, places, partners and quotes stay as they are.
  - Fix only Tier 1 style-gate hits (e.g. "measured rather than argued", "to Blue-Dot" verb, flips).
  - Set `prev`/`next`/`sidebar.order` frontmatter per the chain table below.
  - Flag (don't fix) the number issues to the owner in the PR description: 15k/district vs 20k+ total, <10% vs ~10% MSMEs, Dharwad MSME vs ITI attribution, possible economics multiplier double-count.
  **Files:** Modify `explore/pilots.mdx`, `explore/learnings.mdx`, `explore/economics.mdx`.

**Agent C: family page and use cases**
- [ ] **3.1 The Dots Family.**
  - Title becomes "The Dots Family"; keep the slug `beyond-livelihoods`.
  - Use review rewrite P3 as the model intro, with the status table.
  - Add Yellow. Give each dot a scenario from the bank and a status.
  - Remove the invented `JourneyQuote` testimonials. Keep only sourced quotes, labelled "Example" where needed (R8).
  - Keep the existing sector figures unchanged (Q7). Yellow is new and has no figure: leave its `stat` empty.
  - Add the PwD campaign figure (Feb 2026, 1 lakh+ needs in 10 days, ₹10 per interaction) to the Purple section; this page now owns it (Q9).
  - Fix Purple "within 5 km" to "in the same city".
  - Point the "adding a sector" steps to the new guide (5.4).
  **Files:** Modify `src/content/docs/explore/beyond-livelihoods.mdx`.
- [ ] **3.3 Use cases.**
  - One section per dot, using the bank's wording. Blue comes first only because it is live.
  - Apply the same `JourneyQuote` rule.
  - Fix "within a day".
  - Keep the existing percentages unchanged (Q7).
  - Update the family-page link text.
  - Set chain frontmatter.
  **Files:** Modify `src/content/docs/explore/use-cases.mdx`.

**Explore chain (agents B and C apply this to their own pages; the integrator updates the hub):**

| Page | prev | next |
|---|---|---|
| beyond-livelihoods | paradox-of-proximity "Path 2 of 7" | use-cases "Path 4 of 7" |
| use-cases | beyond-livelihoods "Path 3 of 7" | pilots "Path 5 of 7" |
| pilots | use-cases | learnings "Path 6 of 7" |
| learnings | pilots | economics "Path 7 of 7" |
| economics | learnings | `next: false` |

Update `sidebar.order` to match.

**Agent D: Core Concepts**
- [ ] **4.1 Signals.** Generic definition with Blue and Yellow scenarios. Remove the "not X, it's Y" flips. Link "fraction of survey cost" to economics.
  **Files:** Modify `core-concepts/signals.mdx`.
- [ ] **4.2 Lifecycle.**
  - Title "The Dot Lifecycle" (Q2) and colour-neutral states.
  - Generic participant types plus a per-network table using real ids (Blue `seeker`/`provider`; Yellow `student`/tutor-counsellor; Purple `seeker`/`provider`; Orange `practitioner`, listing only).
  - Keep one "nothing to build" sentence.
  - Fix the circular "adaptor checks with the aggregator" line.
  - Keep the intake-methods table here.
  - Write the alt text for 6.2.
  **Files:** Modify `core-concepts/blue-dot-lifecycle.mdx`.
- [ ] **4.3 Participant profiles.**
  - Framing paragraph: this page documents the Blue (jobs) schema; other networks define their own fields. Add a short table of real Yellow, Purple and Orange fields.
  - Correct the `service_provider` citation.
  - Fix the flip and the tip title.
  **Files:** Modify `core-concepts/participant-profiles.mdx`.
- [ ] **4.4 Aggregators.**
  - Use the section 4 list.
  - Replace the duplicate intake table with a link to lifecycle.
  - Move "How coordinators join" to `core-concepts/architecture/aggregator-dpg.md`.
  - Auth wording per Q12.
  - Fix "non-negotiable" on the receiving page, and add one line there: "the same portal onboards participants for any network the deployment serves".
  **Files:** Modify `core-concepts/aggregators.md`, `core-concepts/architecture/aggregator-dpg.md`.
- [ ] **4.5 Items, actions, events.** Show `connect` on Yellow next to `apply` on Blue. Note that Orange has no actions. Write the alt text for 6.3.
  **Files:** Modify `core-concepts/items-actions-events.md`.
- [ ] **4.6 Diagrams:**
  - Fix the `apply`-only label in `items-actions-events` (source exists).
  - Check `use-cases-common-pattern.excalidraw` for jobs labels.
  **Files:** `src/assets/diagrams/items-actions-events.*`, `src/assets/diagrams/use-cases-common-pattern.*`.

**Agent E: Guides and technical**
- [ ] **5.1 District activation.**
  - Steps are generic, with jobs as the worked example.
  - Fix the phase week labels to match "under 90 days".
  - Remove the flips and the "Not the technology. Not the mobilisation…" triad.
  - Cut em dashes to R5.
  **Files:** Modify `guides/district-activation.mdx`.
- [ ] **5.2 Adaptor onboarding, customisation, voice prompts.**
  - Fix the "`student, employer`" domains example.
  - Auth wording per Q12.
  - Customisation: list the per-network UI themes as they exist and note which have schemas.
  - Voice prompts:
    - Intro: "the published agents are for the jobs network; the prompt structure works for any network".
    - Drop the 📦 emoji.
    - Rename the "Side of the market" column.
  **Files:** Modify `guides/adaptor-onboarding.mdx`, `guides/customisation.md`, `guides/voice-ai-prompts.md`.
- [ ] **5.3 Network selection, documented.**
  - schema-driven-model gets a "Choosing a network" section that links to the networks page, plus the line "the same `profile_1.0` has different fields on each network".
  - Signals setup and local-stack get `SIGNALS_NETWORK` = folder name, `SERVED_DOMAINS` and `VITE_NETWORK_ID` = network id (e.g. Yellow's network id differs from its folder name), plus the consent/messages files. Source: `Signals-DPG/SETUP.md`.
  - Aggregator setup gets `AGGREGATOR_NETWORK` (verify the hard-coded schema path first).
  - AWS infrastructure names `_network` / `_brand`.
  - configuration.md gets the per-network schema folder.
  **Files:** Modify `core-concepts/technical/schema-driven-model.mdx`, `guides/installation/local-setup/signals-dpg.md`, `guides/installation/local-setup/local-stack.md`, `guides/installation/local-setup/aggregator-dpg.md`, `guides/installation/cloud-setup/aws/infrastructure.md`, `guides/configuration.md`.
- [ ] **5.5 AI Diffusion pages: intro framing only.**
  - One paragraph: the examples are the live jobs voice configuration, and other networks use the same structure.
  - Leave the YAML unchanged.
  - Replace GitHub issue numbers with a plain description.
  **Files:** Modify `core-concepts/architecture/ai-diffusion-dpg.md`, `core-concepts/architecture/ai-diffusion-configuration.md`, `guides/installation/local-setup/ai-diffusion-dpg.md`, `guides/installation/local-setup/ai-diffusion-channels.md`.
- [ ] **5.6 Technical cleanups.**
  - Remove repeats: "key scaling decision", "by construction".
  - Fix datastore wording: data-model "do not share tables" vs high-level "Shared across both verticals". Make them agree.
  - Remove "load-bearing" (identity-and-auth), "the key to the whole delivery pipeline" (cicd) and the prerequisites flip.
  - Installation index: add the AI Diffusion pages to the list without changing the Path chain.
  - Guides index: fix the stray space.
  **Files:** Modify `core-concepts/architecture/signals-dpg.md`, `core-concepts/technical/read-write-paths.md`, `core-concepts/architecture/data-model.mdx`, `core-concepts/architecture/high-level-architecture.mdx`, `core-concepts/architecture/identity-and-auth.md`, `guides/cicd-and-builds.md`, `guides/installation/local-setup/prerequisites.md`, `guides/installation/index.md`, `guides/index.md`.

**Agent F: new guide and lifecycle diagram**
- [ ] **5.4 New guide: "Adding a new dot".**
  - Worked example: Yellow. Steps: network folder and `network.json` → domain schemas → network id and `SERVED_DOMAINS` → brand → consent/messages → voice prompts.
  - Use real file names from Signals-DPG and display names for domains.
  - Send the sidebar entry to the integrator.
  **Files:** Create `src/content/docs/guides/adding-a-dot.md`.
- [ ] **6.2 Lifecycle diagram** (agent-owned, Q11; export PNG via chrome-devtools, owner reviews in the PR).
  - Re-create the source first, because no `.excalidraw` exists.
  - Remove "Job Fairs" and the programme labels, and use colour-neutral states.
  **Files:** Create `src/assets/diagrams/blue-dot-lifecycle.excalidraw`. Modify `blue-dot-lifecycle.png`.

### Wave 3: integrator (1 agent)

- [ ] **7.0 Sidebar, hubs, renames.**
  - Apply every handoff: the Explore reorder (Paradox → Dots Family → Use Cases → Pilots → Learnings → Economics, matching the chain table), and the label renames (`Signals (Blue Dots)`, `The Blue Dot Lifecycle`, `Pilots — Ghaziabad & Dharwad`, `Beyond Livelihoods: The Dots Family`).
  - Add the new guide's sidebar entry.
  - In all `start/*.mdx` hubs, update titles and `focus:` text, apply the aggregator lists, and fix slop ("rails" ×2, "digital invisibility", "reinforcing levers", "the design idea everything hangs on", "onboarding journey").
  - Evaluate hub: set the order to match the chain, add the ₹87,500 crore "jobs network only" label, and cite the PwD campaign as evidence.
  - Deploy hub: keep "under 90 days" in sync with 5.1.
  - Fix "Blue Dot Lifecycle" / "Blue Dot Verified" link text on pages no agent owned (sweep with `grep -rn 'Blue Dot Lifecycle\|Blue Dot Verified\|become a Blue Dot'`).
  **Files:** Modify `astro.config.mjs`, `src/content/docs/start/*.mdx`, plus the sweep hits.

### Wave 4: verification (reviewer and verifier agents)

- [ ] **8.1** Tier 1 style gate = 0 lines (allow-list only). Tier 2 list reviewed.
- [ ] **8.2** Every generic page (index, overview/*, top-level core-concepts except participant-profiles, use-cases, family page) names at least 1 non-Blue dot. Jobs terms on generic pages appear only inside a labelled Blue example. Re-run the baseline counts from section 1.1.
- [ ] **8.3** Owned figures (`10,000`, `2 days`, `₹10`, `87,500`, `20%`, `50%`, `800 metres`, `1 lakh`): every hit outside the owning page links to it.
- [ ] **8.4** `grep -rn "Path [0-9]* of 7" src/content/docs` gives a contiguous 2–7 sequence that matches the `start/evaluate.mdx` order. (`check:paths` does not check labels.)
- [ ] **8.5** `pnpm build && pnpm check:links` passes. CI does not build PRs, so run this locally for every PR.
- [ ] **8.6** Chrome DevTools on `pnpm dev`:
  - Check pages: landing, introduction, paradox, family page (7 cards, Yellow AA contrast in light and dark), lifecycle, the new guide.
  - No console errors on these pages.
  - Every sidebar link returns 200.
- [ ] **8.7** Redaction: the verifier greps for the owner's non-public id list (D6), branch names, PR/issue numbers and security specifics. The result must be 0.
- [ ] **8.8** `git rm GENERIC-DOTS-PLAN.md` in PR 3.

## 6. PR slicing

The site deploys on every merge to `main`, and PRs are not built in CI. Build each PR locally.

1. **PR 1 Foundations:** Wave 1 (CLAUDE.md rules, Yellow assets, `DotCard`, glossary and networks fixes, diagram 1.3) plus this plan. It is safe to merge alone because it only corrects facts.
2. **PR 2 Narrative switch** (agents A–D plus the integrator): merge it as one unit, so the site never shows half-old and half-new naming. Use one commit per task.
3. **PR 3 Guides and technical** (agents E–F, Wave 4 checks, delete this plan): merge it soon after PR 2.

## 7. Agent team summary

| Wave | Agents | Parallel? | Blocks on |
|---|---|---|---|
| 0 | owner | — | — |
| 1 | W1 | serial | owner decisions |
| 2 | A, B, C, D, E, F | yes, exclusive files | Wave 1 merged |
| 3 | Integrator | serial | Wave 2 handoffs |
| 4 | Reviewer, verifier | yes | Wave 3 |

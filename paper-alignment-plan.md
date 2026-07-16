# Docs Improvement Plan — Aligning with *The Blue Dots^AI Economy* Paper

> Source: `The Blue Dots^AI Economy Paper.pdf` (36 pp.). This plan maps the paper's
> frameworks onto the existing Starlight docs. **Status: not yet executed.**
>
> **Naming decision (locked):** "Blue Dots^AI" remains the umbrella brand for the whole
> discovery infrastructure. The color-coded family (Pink/Purple/Orange/Green/Brown) is
> introduced as personas/sectors riding the *same shared rails* — not separate systems.

## Context

The docs are technically solid (Architecture, Technical, Installation are complete and
accurate) but were written independently of this paper. They miss the paper's most
distinctive conceptual, economic, and operational frameworks. This plan enriches the
**narrative/conceptual/explore** layers and leaves the **technical core untouched**.

## The 5 big gaps

1. **Color-coded "Dots" taxonomy** (paper Appendix 5) — entirely absent. Blue=youth
   livelihoods, Pink=women, Purple=PwDs, Orange=tourism, Green=agriculture, Brown=SMBs.
2. **The real 4 reinforcing levers** (pp. 3, 8, 14–15) — docs' levers are product-framed
   and omit the **District Facilitation Team** and **Innovators** ecosystem levers.
3. **Economics derivation** (Appendix 4) — docs cite ₹90,000 cr with no methodology;
   paper says **₹87,500 cr** with a 3-step model + research citations.
4. **Activation/governance model** (Appendix 3) — absent. <3-month, 3-stage adoption;
   Jobs Facilitation Centre; Collector champion + Mission Director sponsor.
5. **Richer pilot evidence** (pp. 12–13) — missing scale numbers, named proof, and
   UP + Karnataka scaling momentum.

Plus missing framings: **UPI rails analogy**, "**digitally dark** / ~80% of district
economy," **consent as the foundation** of every dot, the **inequality** angle, and
**global replicability**.

## Work items

### Priority 1 — Conceptual alignment
- **A.** New page **"The Dots Family"** (Core Concepts or Explore): color taxonomy as
  personas on shared rails. Table: color → who → problem → stat.
- **B.** Rewrite `overview/the-blue-dots-approach.md`: replace four levers with the
  paper's ecosystem levers (Shared Digital Rails · Local Ecosystem Aggregators ·
  District Facilitation Team · Innovators). Keep signal→match lifecycle as a subsection.
- **C.** Rewrite `overview/paradox-of-proximity.md`: fix figure to ₹87,500 cr, add
  "digitally dark" / "~80% of district economy" framing, align before/after table.

### Priority 2 — Evidence & economics
- **D.** New page **"The Economics of Local Discovery"** (Explore): full Appendix 4
  derivation (4.7M pop → ~70k workers → ₹700 cr → ×1.5 → ₹1,050 cr → 50× → ₹87,500 cr),
  caveats, citations (Moretti 2010, Bartik 2019, Chaurey & Nayyar 2022, Jena 2017).
- **E.** Strengthen `explore/pilots.md`: 7-row before/after table, 15,000–20,000 seekers
  in 2 weeks, Jobs Facilitation Centre, named proof (Shri Abhinav Gopal, IAS, CDO
  Ghaziabad), UP + Karnataka scaling.

### Priority 3 — Operational / governance
- **F.** New guide **"Activating Blue Dots in a District"**: <3-month, 3-stage model
  (Setup / Activate / Drive Outcomes), use-case selection, government ownership model,
  90-day success definition. Complements developer-facing `adaptor-onboarding.md`.

### Priority 4 — Framings woven throughout
- **G.** UPI rails analogy → `overview/blue-dots-as-a-dpg.md`.
- **H.** Consent principle → DPG page + `core-concepts/signals.md`.
- **I.** Inequality angle + global replicability → new/expanded Overview content.
- **J.** Persona quotes/journeys → `explore/use-cases.md`.

### Cleanup
- `astro.config.mjs`: add new pages to sidebar.
- Reconcile ₹90,000 → ₹87,500 everywhere (index.mdx, paradox, introduction).
- Keep "Blue Dots" umbrella brand consistent while introducing the color family.

## Out of scope (leave untouched)
Architecture (5 files), Technical (4 files), Installation guides (4 files), API
reference, data model, identity/auth — orthogonal to the paper, already solid.

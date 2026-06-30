---
name: tlc-generative-engine-optimization
description: "Generative Engine Optimization (GEO) specialist — the technical, on-page publishing work that makes a given page or site discoverable, understandable, trustworthy, quotable, and fresh for AI answer engines (Google AI Overviews, ChatGPT Search, Bing Copilot, Perplexity). Use when asked to 'optimize this page/site for GEO', 'optimize for AI search / answer engines', 'get my page cited by ChatGPT/Perplexity', 'improve AI visibility/citability', 'write an llms.txt', 'add citation-ready structure or schema for AI answers', 'otimizar para busca com IA', or to audit/create/improve a codebase for generative search. Do NOT use for AI-driven SEO content strategy or programmatic pages at scale (use ai-seo), classic keyword/SERP ranking (use seo), accessibility (use web-accessibility), or multi-area site audits (use web-quality-audit)."
metadata:
  version: '1.0.0'
  author: Fernando Paladini - github.com/paladini
license: MIT
---

# GEO Specialist

Expert in Generative Engine Optimization — making pages discoverable, understandable, trustworthy, quotable, and fresh for AI answer engines.

## Philosophy

Treat GEO as **documentation quality, not a trick**. AI engines cite pages they can parse, trust, and quote. The work is the same as writing clearly for humans: correct metadata, honest structured data, authoritative prose, stable URLs. Never promise rankings or AI citations — those are engine decisions outside your control. Do the technical work well; citations follow as a byproduct.

## When to use / not use

**Use this skill** when the goal is making a specific page or site more visible, citable, or understandable to AI answer engines — technically and at the page level.

**Do NOT use** for:

- AI-driven content strategy or programmatic pages at scale → use `ai-seo`
- Classic keyword/SERP ranking work → use `seo`
- Accessibility audits → use `web-accessibility`
- Multi-area site health audits → use `web-quality-audit`

## The Six GEO Pillars

Load `references/pillars-and-workflow.md` for the full deep-dive. Summary:

| #   | Pillar             | Core check                                                                      |
| --- | ------------------ | ------------------------------------------------------------------------------- |
| 1   | **Discoverable**   | robots.txt allows AI crawlers; sitemap exists; canonical tags correct; HTTPS    |
| 2   | **Understandable** | Semantic HTML; page title matches H1; language declared; one topic per page     |
| 3   | **Useful**         | Content answers a specific question; content in static HTML (not JS-only)       |
| 4   | **Trustworthy**    | Author bio; citations/sources linked; publication + update dates visible; HTTPS |
| 5   | **Quotable**       | One answer per section; short-answer paragraph before elaboration; FAQ schema   |
| 6   | **Fresh**          | `dateModified` in JSON-LD and meta; content reviewed when topic changes         |

## Operating Modes

### Mode 1 — Create (new GEO-ready page)

1. Plan page structure: one topic, one H1, question-based H2s/H3s.
2. Apply `templates/page-metadata.html` (canonical, hreflang, meta description).
3. Add `templates/techarticle.jsonld` (or `faqpage.jsonld` for FAQ pages).
4. Write content in the quotable outline pattern (`templates/quotable-article-outline.md`): short direct answer → supporting detail → sources.
5. Update `robots.txt` to allow AI crawlers (`templates/robots-ai-crawlers.txt`).
6. Add or update `llms.txt` if the site wants to guide AI agents (`templates/llms.txt`).
7. Run the GEO page checklist (in `references/pillars-and-workflow.md`).

### Mode 2 — Audit (score an existing page or site)

1. Crawl check: read `robots.txt` — are `OAI-SearchBot` and `BingBot` allowed?
2. Structured data: validate all JSON-LD against the Rich Results Test and Schema Markup Validator.
3. Pillar sweep: for each of the six pillars, mark pass / partial / fail.
4. Produce a **prioritized findings table** (Pillar → Finding → Severity → Fix).
5. Identify quick wins (metadata, schema, robots) vs. content rewrites.

### Mode 3 — Improve (apply fixes)

1. Apply fixes in severity order: blockers first (crawl access, broken schema), then quick wins (metadata, dates), then content improvements.
2. Re-validate structured data after every schema change.
3. After changes, point to measurement tools (see `references/measurement-and-tools.md`) so the user can track AI visibility over time.

## Guardrails

- **Never promise** that changes will cause a specific AI engine to cite the page. Citation is an engine decision.
- **Structured data must match visible page content exactly.** Mismatches violate Google's policies and can suppress the page.
- **`llms.txt` is optional.** It is a community convention, not a crawler-control file, and not a citation guarantee. Recommend it only when the site wants to guide AI agent navigation.
- **`robots.txt` is the only authoritative crawler-control file.** `llms.txt` has no effect on crawling.
- **Do not add `noindex` or `Disallow` for AI crawlers** unless the user explicitly wants to block AI indexing.
- Prefer primary platform documentation (Google Search Central, Bing Webmaster Tools, Schema.org) over third-party summaries.

## Examples

### Example 1 — Audit request

**User:** "Can you audit my blog for AI search visibility?"

**Actions:**

1. Check `robots.txt` → `OAI-SearchBot` is missing a `Disallow` but also missing an explicit `Allow` — confirm default is allow.
2. Validate JSON-LD on the homepage → `datePublished` is missing, `author` has no `url`.
3. Run pillar sweep → Trustworthy: partial (no author bio page); Quotable: fail (no FAQ schema on FAQ page).
4. Return findings table with three priority tiers.

**Result:** Prioritized list: fix `techarticle.jsonld`, add author bio, add `FAQPage` schema. Clear, actionable, no ranking promises.

### Example 2 — Create request

**User:** "Create a new GEO-optimized article page for my Next.js blog."

**Actions:**

1. Draft `<head>` from `templates/page-metadata.html`.
2. Generate `templates/techarticle.jsonld` filled with real title, author, dates.
3. Structure content using `templates/quotable-article-outline.md`: direct-answer intro, H2/H3 sections, sources list.
4. Confirm `robots.txt` allows `OAI-SearchBot`.
5. Run checklist — all eight items pass.

**Result:** Ready-to-deploy page with correct metadata, valid schema, and citation-ready prose.

### Example 3 — llms.txt request

**User:** "Write an llms.txt for my documentation site."

**Actions:**

1. Inventory the three or four most useful pages for an AI agent.
2. Apply `templates/llms.txt` format: H1 site name → blockquote description → `## Key pages` with Markdown links → optional `## Technical files`.
3. Remind the user that `llms.txt` is not a crawler-control file and doesn't guarantee citations.

**Result:** A concise, standards-compliant `llms.txt` with honest caveats.

## Troubleshooting

| Symptom                                              | Likely cause                                                             | Fix                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Rich Results Test shows no schema                    | JSON-LD is in a JS-rendered `<script>` tag loaded after DOMContentLoaded | Move JSON-LD to a static `<script type="application/ld+json">` in server-rendered HTML |
| Schema validation error: "required property missing" | `datePublished`, `author`, or `headline` absent                          | Add all required fields; check Schema.org/TechArticle for the full list                |
| `OAI-SearchBot` not crawling                         | `User-agent: *` `Disallow: /` in `robots.txt` blocks all bots            | Add explicit `Allow: /` for `OAI-SearchBot` above the wildcard rule                    |
| `llms.txt` not picked up by agents                   | File not at `https://example.com/llms.txt` (must be root)                | Move file to domain root; verify it returns `Content-Type: text/plain`                 |
| Content visible in browser but not cited             | Content rendered by client-side JS only                                  | Render content server-side so crawlers receive it in the initial HTML response         |

## References and Templates

Load these files on demand — only when the task requires the detail.

| File                                    | Load when                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `references/pillars-and-workflow.md`    | You need the full pillar deep-dive, four-step page workflow, or the eight-item GEO page checklist |
| `references/measurement-and-tools.md`   | User asks how to measure GEO results, which tools to use, or what to track after publishing       |
| `templates/page-metadata.html`          | Creating or fixing `<head>` metadata (canonical, hreflang, meta description, open graph)          |
| `templates/techarticle.jsonld`          | Adding TechArticle structured data to an article page                                             |
| `templates/faqpage.jsonld`              | Adding FAQPage structured data to a FAQ section                                                   |
| `templates/robots-ai-crawlers.txt`      | Updating `robots.txt` for AI crawler controls (OAI-SearchBot, GPTBot, BingBot)                    |
| `templates/llms.txt`                    | Writing or updating the site's `llms.txt`                                                         |
| `templates/quotable-article-outline.md` | Structuring article content for AI citation                                                       |

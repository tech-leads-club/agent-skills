# GEO Measurement and Tools

**Important caveat up front:** No tool can tell you whether a specific AI engine will cite your page. Citation is an engine decision based on query context, competitive alternatives, and internal quality signals you cannot inspect. These tools measure _inputs_ (crawl access, valid schema, visibility reports) — not guaranteed outputs.

---

## Tool Overview

### 1. Google Search Console (GSC)

**Purpose:** Monitor whether Google can crawl and index your pages; see AI Overviews impressions (when available in your region).

**What to check:**

- Coverage report → confirm pages are indexed, no "Excluded" surprises.
- URL Inspection → test a specific URL for crawlability and structured data rendering.
- Performance → look for AI Overview impressions (appears as a separate feature type in some regions).

**Access:** [search.google.com/search-console](https://search.google.com/search-console)

---

### 2. Bing Webmaster Tools

**Purpose:** Monitor Bing indexing; access Bing-specific AI performance reports.

**What to check:**

- Bing AI Performance report — shows impressions from Bing Copilot and Bing AI answers (available in Bing Webmaster Tools under "Reports").
- Bing AI Visibility Insights — shows which pages appear in Bing AI-generated answers.
- URL Inspection → confirm BingBot can crawl and render your page.

**Access:** [bing.com/webmasters](https://www.bing.com/webmasters)

---

### 3. Rich Results Test

**Purpose:** Validate JSON-LD structured data in the context of a live URL.

**What to check:**

- Paste a URL → confirm schema type is detected → confirm no errors or warnings.
- Run after every JSON-LD change before publishing.

**Access:** [search.google.com/test/rich-results](https://search.google.com/test/rich-results)

---

### 4. Schema Markup Validator

**Purpose:** Validate raw JSON-LD snippets against Schema.org types without requiring a live URL.

**Use this for:** Validating schema during development before the page is published.

**Access:** [validator.schema.org](https://validator.schema.org)

---

### 5. IJONIS AI Visibility Checker / geo-lint

**Purpose:** Check whether a page meets common GEO signals (crawl access, structured data presence, content structure).

**What to check:**

- Run geo-lint against your URL to get a pass/fail report per GEO signal.
- Use as a quick diagnostic, not as a guarantee of citation.

**Access:** [ijonis.com](https://ijonis.com) or via the `geo-lint` CLI if available.

---

### 6. PageSpeed Insights / Lighthouse

**Purpose:** Verify Core Web Vitals and page rendering — slow or JS-only-rendered pages are harder for AI crawlers to process reliably.

**What to check:**

- Run Lighthouse with the "SEO" and "Best Practices" categories.
- Confirm structured data is detected in the "SEO" section.
- Confirm no render-blocking scripts prevent content from loading in the initial HTML.

**Access:** [pagespeed.web.dev](https://pagespeed.web.dev)

---

### 7. GoAccess (Server Log Analysis)

**Purpose:** Confirm AI crawlers are actually visiting your pages by reading server access logs.

**What to check:**

- Filter for `OAI-SearchBot`, `GPTBot`, `BingBot`, `PerplexityBot` in access logs.
- Confirm crawl frequency and which pages are being fetched.

**Use this for:** Verifying that allowing crawlers in `robots.txt` is actually resulting in crawl visits.

---

### 8. promptfoo / OneGlanse (Prompt Monitoring)

**Purpose:** Test whether your page is cited when specific questions are asked to AI answer engines.

**What to check:**

- Set up test prompts that match your page's topic and target queries.
- Run periodically to see if citations appear and which competitors are cited instead.

**Important:** These tools show current citation behavior — not a guarantee that your changes caused a specific outcome. Citation can change without any action on your part.

---

## Measurement Checklist (6 items)

Run after publishing GEO changes to set up ongoing visibility tracking.

- [ ] **Google Search Console verified** — site is verified; submit updated sitemap.
- [ ] **Bing Webmaster Tools verified** — site is verified; check AI Performance report baseline.
- [ ] **Rich Results Test passed** — all JSON-LD on the page shows no errors.
- [ ] **Crawler visits confirmed** — server logs show at least one crawl from `OAI-SearchBot` or `BingBot` within two weeks of publishing.
- [ ] **Baseline prompt test recorded** — run 3–5 representative queries in ChatGPT Search and Perplexity; note whether the page is cited (yes/no baseline, not a target).
- [ ] **Review date set** — schedule a content review for time-sensitive pages (quarterly for most; monthly for pricing/API docs).

---

## What to Expect (Realistic Timelines)

| Signal                  | Typical time to appear after publishing |
| ----------------------- | --------------------------------------- |
| Google indexing         | 1 day – 2 weeks                         |
| Bing indexing           | 1 day – 2 weeks                         |
| AI Overview appearance  | Weeks to months; not guaranteed         |
| ChatGPT Search citation | No reliable timeline; engine-controlled |
| Perplexity citation     | No reliable timeline; engine-controlled |

Changes to robots.txt, structured data, and content quality improve the _conditions_ for citation. They do not schedule it.

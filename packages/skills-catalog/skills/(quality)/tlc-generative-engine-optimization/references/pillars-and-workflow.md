# GEO Pillars, Workflow, and Checklist

## The Six GEO Pillars

GEO = making a page **Discoverable → Understandable → Useful → Trustworthy → Quotable → Fresh** for AI answer engines.

---

### 1. Discoverable

AI engines can only cite pages they can crawl and index.

**Checks:**

- `robots.txt` allows AI search crawlers:
  - `OAI-SearchBot` — OpenAI's search indexer (controls ChatGPT Search citations)
  - `GPTBot` — OpenAI's training crawler (separate; can block independently)
  - `BingBot` — Bing's crawler (used by both Bing Copilot and Bing AI Overviews)
  - `Googlebot` — Google (used for Google AI Overviews)
- XML sitemap exists and is linked from `robots.txt` or submitted via Google Search Console / Bing Webmaster Tools.
- `<link rel="canonical">` is set and matches the preferred URL.
- Page is served over HTTPS with a valid certificate.
- No `<meta name="robots" content="noindex">` unless intentionally blocking the page.

**Note:** `OAI-SearchBot` (search indexing) and `GPTBot` (training data) are separately controllable. Many sites block `GPTBot` for training but want to allow `OAI-SearchBot` for search visibility. These are different `User-agent` entries in `robots.txt`.

---

### 2. Understandable

AI engines must parse the page's structure and topic clearly.

**Checks:**

- Semantic HTML: use `<article>`, `<section>`, `<h1>`–`<h3>`, `<p>`, `<ul>` appropriately.
- Page has exactly one `<h1>` that matches (or closely paraphrases) the `<title>` tag.
- The `lang` attribute is set on `<html>` (e.g., `lang="en"`).
- Page covers one focused topic — avoid mixing unrelated subjects.
- Key content is in static server-rendered HTML, not JavaScript-only rendering.

---

### 3. Useful

Content must answer a specific question or fulfill a specific need.

**Checks:**

- The page answers a clearly defined question a person (or agent) would actually ask.
- Content is original and substantive — not a thin page duplicating what's already everywhere.
- The most important answer is in the first `<p>` or the opening of the relevant `<section>`, not buried under navigation or promotional content.
- All key content is in static HTML; avoid content that only appears after JS execution, login walls, or cookie-consent dismissal.

---

### 4. Trustworthy

AI engines weight pages they can attribute to a credible, verifiable source.

**Checks:**

- Author name is visible on the page and links to an author bio page.
- Publication date (`datePublished`) and last-modified date (`dateModified`) are visible to readers.
- Claims are backed by linked sources (outbound links to primary references).
- Page does not make unsubstantiated superlatives ("the best", "guaranteed", "always").
- JSON-LD `author`, `publisher`, and date fields are filled with real values — not placeholders.

---

### 5. Quotable

AI answers pull short, self-contained paragraphs. Structure content to be that paragraph.

**Checks:**

- Each H2/H3 section starts with a 1–3 sentence direct answer before elaborating.
- The direct-answer paragraph is self-contained — it makes sense read in isolation.
- FAQ sections use `FAQPage` JSON-LD schema so engines can surface individual Q&A pairs.
- Avoid starting sections with "In this article, we will…" or "As mentioned above…" — these phrases don't stand alone.
- Lists of steps use numbered `<ol>`; lists of options use `<ul>`. AI engines quote lists accurately.

---

### 6. Fresh

AI engines prefer content that is kept up to date.

**Checks:**

- `dateModified` in JSON-LD is updated whenever the content changes (not just the layout or typos).
- `<meta property="article:modified_time">` mirrors `dateModified`.
- A review schedule exists for time-sensitive content (e.g., pricing pages, API docs, compatibility tables).
- Outdated claims are removed or flagged with the date they were accurate.

---

## Four-Step GEO Page Workflow

Use this sequence when creating or improving a page from scratch.

**Step 1 — Structure**

- Choose a single focused topic.
- Draft question-based headings (H2s that mirror what a user would type into a search bar).
- Outline sections: intro answer → supporting detail → examples → sources.

**Step 2 — Write for quotes**

- Open each section with a direct, self-contained answer sentence.
- Follow with supporting detail and examples.
- Close with a sources / further-reading list.

**Step 3 — Add signals**

- Apply `page-metadata.html` template (canonical, hreflang, meta description).
- Add appropriate JSON-LD: `TechArticle` for articles, `FAQPage` for FAQ sections.
- Check `robots.txt` — confirm AI crawlers are allowed.
- Add or update `llms.txt` if appropriate.

**Step 4 — Validate and measure**

- Run Rich Results Test on all JSON-LD.
- Run the GEO Page Checklist below.
- After publishing, set up measurement (see `measurement-and-tools.md`).

---

## GEO Page Checklist (8 items)

Run before declaring a page GEO-ready.

- [ ] **robots.txt** — `OAI-SearchBot` and `BingBot` are allowed (not blocked by wildcard `Disallow`).
- [ ] **Canonical** — `<link rel="canonical">` is set and correct.
- [ ] **Title / H1 alignment** — `<title>` and `<h1>` match or closely paraphrase each other.
- [ ] **JSON-LD valid** — structured data passes Rich Results Test with no errors; all required fields present.
- [ ] **Author + dates visible** — author name, `datePublished`, and `dateModified` are readable on the page.
- [ ] **Static content** — key content is in server-rendered HTML, not JS-only.
- [ ] **Direct-answer openings** — each H2/H3 section opens with a self-contained answer paragraph.
- [ ] **Sources linked** — factual claims link to primary sources.

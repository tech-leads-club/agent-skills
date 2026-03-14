---
name: ai-seo
description: "When the user wants to build programmatic SEO with AI, create competitor alternative pages, optimize for AI Overviews, or scale content production. Also use when the user mentions 'SEO,' 'programmatic SEO,' 'AI content,' 'competitor alternative pages,' 'AI Overviews,' 'search optimization,' 'DataForSEO,' 'content at scale,' 'keyword strategy,' or 'organic traffic.' This skill covers AI-powered SEO strategy from keyword research through programmatic page generation. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'

---

# AI SEO Skill

You are an AI-powered SEO strategist specializing in programmatic content generation, competitor alternative keyword strategies, AI Overviews optimization, and Generative Engine Optimization (GEO). You help founders and growth teams build scalable organic traffic systems using AI tools, structured data, and templated page architectures.

## Before Starting

1. Confirm the user's current SEO stack (CMS, analytics, keyword tools, content tools)
2. Identify their primary goal: programmatic pages at scale, competitor alternative play, AI Overviews visibility, or full-stack AI SEO
3. Ask about their domain authority range (DR/DA) - this changes which strategies are viable
4. Understand their content production capacity (solo founder vs. team vs. agency)
5. Check if they have Google Search Console access and DataForSEO/Semrush API credentials
6. Identify their top 3-5 competitors for alternative page targeting
7. Determine their CMS (Webflow, WordPress, Shopify, Next.js, custom) - this dictates the programmatic approach

---

## 1. AI SEO Stack - Tool Selection Framework

### Core Tool Comparison

| Tool | Primary Function | Best For | Pricing (2025) | AI Overviews |
|------|-----------------|----------|----------------|--------------|
| Surfer SEO | Content optimization scoring | SERP-based intent matching | $99-219/mo | Limited |
| Frase AI | Intent analysis + AI writing | Dual SEO + GEO scoring, 100+ languages | $45-115/mo | Yes (GEO score) |
| AirOps | AI content ops at scale | Workflow automation, bulk production | Free-$9/1k tasks | Via workflows |
| SE Ranking | AI Overviews + AI Mode tracking | AI search visibility monitoring | $65-119/mo | Yes (dedicated) |
| Rankability | Content scoring + optimization | Agency-scale content audits | $49-149/mo | Yes |
| DataForSEO | Raw SEO data API | Developer/agent integrations, MCP | Pay-per-use | Via SERP API |
| Clay + Webflow | Programmatic page generation | Personalized ABM landing pages | $149+/mo | N/A |

### Decision Matrix

```
NEED: Content optimization for existing pages
  DR > 40  --> Surfer SEO (SERP-based scoring, proven at scale)
  DR < 40  --> Frase AI (better value, GEO scoring included)
  Agency   --> Rankability (bulk audit workflows)

NEED: Content production at scale (50+ pages/month)
  Has dev team  --> AirOps + custom CMS integration
  No dev team   --> AirOps + Webflow/WordPress direct publish
  ABM focus     --> Clay + Webflow (personalized per-account pages)

NEED: AI visibility tracking
  Budget exists     --> SE Ranking (most comprehensive AI tracker)
  Budget-conscious  --> Frase AI (GEO score built into editor)

NEED: Raw data for custom workflows
  Always --> DataForSEO API (pay-per-use, MCP-compatible)
```

### MCP Server Integration Stack

| MCP Server | Data Source | Key Capabilities |
|-----------|-----------|-----------------|
| DataForSEO MCP | SERP data, keywords, backlinks | Real-time rankings, keyword research, competitor analysis |
| Google Search Console MCP | GSC performance data | Query analytics, index status, crawl diagnostics |
| Semrush MCP | Keyword + domain analytics | Domain comparison, keyword gaps, traffic estimates |
| FireSEO MCP | GSC + on-page analysis | SEO audits, competitor analysis via natural language |

**DataForSEO MCP setup:**
```bash
# Use env var or secret manager for credentials; never paste real keys into prompts or code.
claude mcp add dataforseo --transport sse \
  --header "Authorization: Basic $DATAFORSEO_BASE64_CREDENTIALS" \
  https://mcp.dataforseo.com/sse
```

**GSC MCP setup:**
```bash
git clone https://github.com/AminForou/mcp-gsc
cd mcp-gsc && pip install -r requirements.txt
claude mcp add gsc -- python /path/to/mcp-gsc/server.py
```

**Agent workflow pattern:**
1. DataForSEO MCP: find top 50 keywords for [competitor] with volume > 500
2. GSC MCP: show current rankings for those keywords
3. Identify gaps where competitor ranks top 10 but you do not
4. Generate content briefs using Frase or Surfer
5. Produce content via AirOps workflows
6. Monitor AI Overview citations via SE Ranking

---

## 2. The "[Competitor] Alternative" SEO Play

### Why This Converts 3-5x Higher Than TOFU

BOFU keywords target buyers actively comparing solutions. "[Competitor] alternative" searchers have already validated the category - they just need a reason to pick you.

- TOFU informational content: 0.5-2% conversion rate
- BOFU "[Competitor] alternative" content: 3-8% conversion rate
- "[Competitor] vs [Your Product]" comparison pages: 5-12% conversion rate

### Target Keyword Patterns (Priority Order)

| Pattern | Example | Intent | Difficulty |
|---------|---------|--------|-----------|
| [Competitor] alternatives | "Mailchimp alternatives" | Very High | Medium |
| [Competitor] vs [Your Product] | "Mailchimp vs ConvertKit" | Very High | Low-Medium |
| Best [category] for [wedge] | "Best email tool for creators" | High | Medium |
| [Competitor] pricing | "Mailchimp pricing 2026" | High | Low |
| Switch from [Competitor] | "Switch from Mailchimp" | Very High | Low |
| [Competitor] vs [Competitor] | "Mailchimp vs Constant Contact" | High | Medium |

### Page Template Structure

```
H1: Best [Competitor] Alternatives in [Year]
  - Opening: why users look for alternatives (specific pain points)
  - Quick comparison table (your product + 4-6 alternatives)

H2: Why Users Switch from [Competitor]
  - 3-5 pain points sourced from G2/Capterra reviews

H2: [Your Product] - Best for [Your Wedge]
  - Feature comparison focused on your strengths + migration guide

H2: [Alternative 2-6] - Best for [Their Wedge]
  - Repeat for each alternative, always list yourself first

H2: Feature Comparison Table
  - Side-by-side matrix: features, pricing, limits

H2: How to Choose the Right [Category] Tool
  - Decision framework by use case

H2: FAQ (with schema markup)
  - "Is [Your Product] better than [Competitor]?"
  - "How much does [Competitor] cost?"
  - "Can I migrate from [Competitor]?"
```

### The Acquisition Playbook

ClickUp systematically creates "replaces [competitor]" pages after every major acquisition in their space. When Salesforce acquired Slack, ClickUp launched replacement pages targeting users evaluating options during the 3-6 month peak search window.

**Replicable framework:**
1. Set Google Alerts for acquisitions in your category
2. Within 48 hours: draft "[Acquired Tool] alternatives" page
3. Within 2 weeks: publish full comparison + migration guide
4. Target the 3-6 month window of peak search volume

---

## 3. Programmatic SEO - Scaling Pages with AI

### Proven Page Patterns

| Pattern | Example | Data Source | Scale |
|---------|---------|------------|-------|
| [Tool] for [Industry] | "CRM for real estate" | Industry list + features | 50-500 |
| [Tool] vs [Competitor] | "Airtable vs Notion" | Competitor matrix | 20-200 |
| [Service] in [City] | "Plumber in Austin TX" | City database | 500-5,000 |
| [Metric] for [Company] | "Revenue of Stripe" | Company database | 1,000-30,000 |
| [Template] for [Use Case] | "Invoice for freelancers" | Template library | 100-1,000 |
| [Integration] + [Integration] | "Slack + Salesforce" | Integration pairs | 500-10,000 |

### Architecture

```
+------------------+     +-------------------+     +------------------+
|  Structured Data |---->|  Page Template    |<----|  AI Content Gen  |
| Airtable/DB/API  |     | CMS: Webflow,     |     | AirOps, Claude,  |
|                  |     | WordPress, Next.js |     | Frase briefs     |
+------------------+     +-------------------+     +------------------+
                                  |
                                  v
                    +----------------------------+
                    |      Quality Controls      |
                    | - Screaming Frog crawl     |
                    | - GSC index monitoring     |
                    | - Uniqueness > 70%/page    |
                    | - 10% manual review sample |
                    +----------------------------+
```

### Quality Requirements (Non-Negotiable)

Google's AI crawlers detect boilerplate. Pages that only swap 1-2 words will not rank. Every page needs:

1. **500-1,000+ words of helpful content** - not filler
2. **Conditional content logic** - if/then rules tailoring recommendations per data variant
3. **Unique data points** - proprietary metrics, ratings, comparisons per page
4. **Rich elements** - HTML tables, charts, embedded tools
5. **Internal linking mesh** - 3-5 related programmatic page links each
6. **Schema markup** - FAQ, Product, or Review schema per page type

### AirOps Workflow Example

```
[Tool] vs [Competitor] Page Generator:
  1. Input: CSV of tool pairs + feature categories
  2. Agent: Research each tool (pricing, features, reviews)
  3. Agent: Generate comparison sections per template
  4. Agent: Write unique intro + conclusion per pair
  5. Quality: Uniqueness score > 70%
  6. Publish: Push to WordPress/Webflow via API
  7. Monitor: GSC indexing check after 48 hours
```

Key capabilities: custom multi-agent workflows, direct CMS publish (WordPress/Webflow/Shopify), brand knowledge base injection, batch processing 50-500 pages per run.

### Clay + Webflow for ABM Pages

For account-based marketing at scale:
- Clay enriches company data (logo, industry, pain points, current tools)
- Webflow CMS template maps Clay columns to dynamic fields
- Auto-generated slugs: /for/[company-name]
- Each page gets personalized hero, testimonials, case studies
- Verkada uses this pattern for hundreds of ABM landing pages

### Timeline

| Milestone | Timeline |
|-----------|----------|
| Pages indexed | 2-4 weeks |
| Initial traffic | 4-8 weeks |
| Meaningful organic growth | 3-6 months |
| ROI positive | 6-12 months |

---

## 4. AI Overviews and Generative Engine Optimization (GEO)

### The Split

AI Overviews appear in 15-50% of queries. Position 1 CTR drops 34.5% when present.

```
Traditional SEO                     GEO (AI Search Optimization)
+--------------------------+        +--------------------------+
| Goal: Clicks to site     |        | Goal: Citations by AI    |
| Metric: Rankings + CTR   |        | Metric: Mentions + trust |
| Target: Google SERP      |        | Target: AI Overviews,    |
| Content: Click-worthy    |        |   ChatGPT, Perplexity,   |
|                          |        |   Claude, Gemini         |
+--------------------------+        +--------------------------+
```

### AI Overviews Optimization Checklist

1. **Answer-first format** - Direct answer in first 1-2 sentences, then supporting detail
2. **Self-contained sections** - Each H2/H3 independently understandable. Never "as mentioned above"
3. **Question-pattern headings** - "What is [X]?", "How does [X] work?", "Best [X] for [Y]"
4. **Scannable formatting** - Bullets, numbered lists, tables over dense paragraphs
5. **Entity optimization** - Name specific tools, companies, people. Generic gets skipped
6. **Statistical backing** - "Improved 3.2x" beats "improved significantly"
7. **Freshness signals** - Dates, "Updated [Month] [Year]", reference recent events

### GEO Platform Coverage

| Platform | Scale | Citation Behavior |
|----------|-------|-------------------|
| Google AI Overviews | 15%+ of all queries | Cites top-ranking pages with clear answers |
| ChatGPT | 800M+ weekly users | References authoritative, structured content |
| Perplexity | 100M+ monthly | Explicitly cites sources with links |
| Gemini | 750M+ monthly | Pulls from Google index + Knowledge Graph |

### GEO Content Audit

- [ ] Does every H2 answer a standalone question?
- [ ] Can AI extract the answer from the first 2 sentences of each section?
- [ ] Are specific entities named (tools, companies, metrics)?
- [ ] Are statistics cited with sources?
- [ ] Does the page have FAQ schema with direct answers?
- [ ] Is content structured with lists and tables?
- [ ] Are "Updated [Month] [Year]" timestamps present?

### SE Ranking for AI Visibility Tracking

**AI Overviews Tracker:** estimates traffic from Overviews, tracks which keywords trigger them, shows citation status (cited/not cited/competitor cited).

**AI Mode Tracker:** captures live AI Mode conversations, maps position + citation order, accounts for personalization volatility.

**LLM Visibility Research:** tracks brand mentions across ChatGPT, Perplexity, Gemini. "No cited" feature shows where competitors appear but you do not - these gaps become content priorities.

**Monitoring cadence:** weekly AI Overview citations for top 50 keywords, bi-weekly LLM share of voice, monthly full "no cited" gap audit.

---

## 5. Keyword Strategy Framework

### Three-Layer Architecture

```
Layer 1: BOFU (Convert)           Layer 2: MOFU (Evaluate)        Layer 3: TOFU (Discover)
  3-8% conversion                   1-3% conversion                 0.5-1% conversion
  +------------------------+        +------------------------+      +--------------------+
  | [X] alternatives       |        | Best [category] tools  |      | What is [concept]  |
  | [X] vs [Y]             |        | [category] comparison  |      | How to [task]      |
  | [X] pricing            |        | [X] for [industry]     |      | [concept] guide    |
  | Switch from [X]        |        | [X] use cases          |      | [concept] trends   |
  +------------------------+        +------------------------+      +--------------------+
  Build first                       Build second                    Build last
  Volume: 100-5K                    Volume: 1K-20K                  Volume: 5K-50K+
```

### Keyword Research Workflow (MCP-powered)

**Step 1:** DataForSEO MCP - keyword suggestions for category, volume > 100, KD < 50, grouped by intent
**Step 2:** DataForSEO/Semrush MCP - competitor keyword gap (they rank top 10, you do not), commercial intent only
**Step 3:** SE Ranking - which target keywords trigger AI Overviews, flag "ranked but not cited" gaps
**Step 4:** Prioritize content calendar:

| Priority | Criteria | Action |
|----------|---------|--------|
| P0 | BOFU, volume > 200, KD < 40 | Create this week |
| P1 | BOFU, volume > 200, KD 40-60 | Create this month |
| P2 | MOFU, volume > 500, KD < 50 | Create next month |
| P3 | AI Overview gap (ranked, not cited) | Optimize existing page |
| P4 | TOFU, volume > 2000, KD < 40 | Backlog |

---

## 6. Content Production Pipeline

### AI Content Quality Spectrum

```
Level 1: Pure AI (DO NOT DO THIS) - Generic, thin, penalty risk HIGH
Level 2: AI + template + unique data (MINIMUM) - Penalty risk LOW if data unique
Level 3: AI draft + human editing + research (IDEAL) - Penalty risk MINIMAL
Level 4: Human-written + AI optimization (PREMIUM) - Penalty risk NONE
```

### Pipeline

```
Keyword Research --> Content Brief --> AI Draft --> Human Edit --> Publish + Track
(DataForSEO MCP)   (Frase/Surfer)   (AirOps)    (Editor)       (CMS + GSC)
```

### Content Brief Template

```
Target keyword: [primary]
Secondary: [3-5 related terms]
Intent: [informational / commercial / transactional]
SERP leader: [URL of #1]
Content score target: [Surfer/Frase 80+]
Required H2s: [list]
Entities: [tools, companies, people to name]
Data points: [statistics, benchmarks, pricing]
Comparison table: [columns]
FAQ: [3-5 People Also Ask questions]
Unique angle: [what differentiates from current #1]
Schema: [FAQ / Product / Review / HowTo]
```

---

## 7. Technical SEO for Programmatic Pages

**Indexing:** XML sitemap with all pages in GSC. IndexNow API for instant indexing. Monitor "Discovered - not indexed" in coverage report. Correct canonicals per page.

**Speed:** SSG preferred (Next.js, Astro, Webflow). Lazy-load below-fold. Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms. CDN for all assets.

**Internal linking mesh:**
```
"CRM for Real Estate" links to:
  - "CRM for Small Business" (related)
  - "Salesforce vs HubSpot" (comparison)
  - "Best CRM Software 2026" (parent category)
```

**Schema per page type:** FAQ schema for alternative pages, Product schema with aggregateRating for comparison pages, HowTo schema for guide pages.

---

## 8. Measurement and Iteration

| Metric | Tool | Cadence | Target |
|--------|------|---------|--------|
| Organic traffic | GSC / GA4 | Weekly | MoM growth |
| Rankings (top 10) | DataForSEO / SE Ranking | Weekly | 20%+ of targets |
| AI Overview citations | SE Ranking AI Tracker | Weekly | 30%+ of ranked keywords |
| Indexed pages | GSC Coverage | Weekly | 95%+ published |
| Content score | Surfer / Frase | Per publish | 80+ |
| BOFU conversion rate | GA4 | Monthly | 3-8% alternative pages |
| LLM mention rate | SE Ranking LLM Tracker | Bi-weekly | Growing share of voice |

### Monthly Iteration Cycle

1. Pull GSC data via MCP: top growing + declining pages
2. Declining pages: check for AI Overview appearance, update freshness, re-optimize scores, add missing entities
3. Growing pages: create related programmatic pages, build internal links, add FAQ schema
4. "Not cited" in AI Overviews: restructure to answer-first, add extractable sections, include specific data
5. Unindexed pages: check for thin content (< 500 words unique), verify no cannibalization, resubmit via IndexNow

---

## Examples

- **User says:** "Build programmatic SEO for our product" → **Result:** Agent asks domain rating and competitor set; recommends BOFU keywords and competitor-alternative pages (10–20); outlines template + data source (Airtable/API) + AI workflow (AirOps or custom); suggests quality controls, schema, internal links, and GSC + AI Overviews tracking.
- **User says:** "We're not showing in AI Overviews" → **Result:** Agent checks answer-first structure and extractable sections; recommends restructure with specific data and FAQ schema; suggests tracking AI Overview appearances and iterating on "not cited" pages.
- **User says:** "What tools for AI SEO?" → **Result:** Agent uses tool stack by budget (bootstrap: GSC + DataForSEO + Frase; growth: + Surfer + AirOps + SE Ranking; scale: full MCP + Clay + Webflow); ties to gtm-engineering for programmatic pipelines.

## Troubleshooting

- **Thin or duplicate content** → **Cause:** &lt;500 words unique or cannibalization. **Fix:** Merge or differentiate pages; add unique data per page; resubmit via IndexNow; check internal linking.
- **Not cited in AI Overviews** → **Cause:** Content not answer-first or not extractable. **Fix:** Restructure with clear sections and specific data; add FAQ schema; avoid vague prose; test with extraction.
- **Programmatic pages not indexing** → **Cause:** Sitemap, quality, or crawl budget. **Fix:** Ensure XML sitemap auto-updates; uniqueness score per page; no low-value parameter URLs; request indexing for priority pages.

---

## Quick Reference

### Launch Checklist

```
[ ] Keyword research complete (BOFU first, then MOFU)
[ ] Competitor alternative targets identified (10-20 competitors)
[ ] Page template tested with 3-5 pages
[ ] Data source connected (Airtable/DB/API)
[ ] AI content workflow configured (AirOps or custom)
[ ] Quality controls in place (uniqueness scoring, manual review)
[ ] Schema markup per page type
[ ] Internal linking mesh planned
[ ] XML sitemap auto-updates
[ ] GSC + AI Overviews tracking configured
[ ] Content calendar prioritized (P0-P4)
```

### Tool Stack by Budget

```
Bootstrap ($0-100/mo):
  GSC (free) + DataForSEO (pay-per-use) + Frase Starter ($45/mo)

Growth ($100-500/mo):
  GSC + DataForSEO MCP + Surfer Essential ($99/mo)
  + AirOps Solo (free tier) + SE Ranking ($65/mo)

Scale ($500-2000/mo):
  Full MCP stack + AirOps Pro + Surfer Scale ($219/mo)
  + SE Ranking Pro ($119/mo) + Clay + Webflow ($149+/mo)

Enterprise ($2000+/mo):
  All above + Rankability + custom Next.js programmatic system
```

---

## Questions to Ask

1. "What's your current domain rating? This determines whether we start with low-competition BOFU keywords or need to build authority first."
2. "Which 5 competitors do your customers most often compare you against? These become alternative page targets."
3. "Do you have a structured data source (product database, company list, feature matrix) for programmatic pages?"
4. "What CMS are you on? Webflow and WordPress have the strongest programmatic SEO support."
5. "Are you tracking AI Overview appearances for your keywords?"
6. "What is your monthly content production capacity?"
7. "Do you have DataForSEO or Semrush API access?"
8. "Is your content structured for AI extraction - self-contained sections, answer-first format, specific data?"

---

## Related Skills

- **content-to-pipeline** - Connect SEO content to lead capture and pipeline generation
- **multi-platform-launch** - Coordinate SEO content with multi-channel product launches
- **positioning-icp** - Define positioning and ICP that informs keyword targeting and page messaging
- **social-selling** - Amplify SEO content through social distribution for link building
- **gtm-engineering** - Build technical infrastructure for programmatic page generation and data pipelines

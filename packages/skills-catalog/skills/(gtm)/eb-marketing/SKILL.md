---
name: eb-marketing
description: "Full-stack marketing execution skill. Website audits, copywriting analysis, email sequences, social media calendars, ad campaigns, funnel optimization, competitive intelligence, landing page CRO, launch playbooks, SEO audits, brand voice analysis, and client proposals. Use when the user mentions marketing audit, copywriting, email marketing, social media strategy, ad campaign, funnel analysis, competitor analysis, landing page, product launch, SEO, brand voice, marketing proposal, content calendar, growth marketing, conversion optimization, CRO, ROAS, CTR, open rates, or any marketing execution task. Complements the founder skill (strategy) with hands-on marketing execution."
---

# Marketing Execution Skill

You are a comprehensive marketing analysis and content generation system. You help entrepreneurs, agency builders, and solopreneurs analyze websites, generate marketing content, audit funnels, create client proposals, and build marketing strategies.

---

## Business Type Detection

Before running any analysis, detect the business type. This classification shapes every analysis focus.

| Business Type | Detection Signals | Analysis Focus |
|---|---|---|
| **SaaS/Software** | Free trial CTA, pricing tiers, feature pages, "login" link, API docs | Trial-to-paid conversion, onboarding, feature differentiation, churn signals |
| **E-commerce** | Product listings, cart, checkout, product categories, reviews | Product pages, cart abandonment, upsells, reviews, AOV optimization |
| **Agency/Services** | Case studies, portfolio, "work with us", testimonials, contact forms | Trust signals, case studies, positioning, lead qualification |
| **Local Business** | Address, phone number, hours, "near me", Google Maps embed | Local SEO, Google Business Profile, reviews, NAP consistency |
| **Creator/Course** | Lead magnets, email capture, course listings, community links | Email capture rate, funnel design, testimonials, content quality |
| **Marketplace** | Two-sided messaging, buyer/seller flows, listing pages | Supply/demand balance, trust mechanisms, network effects |

---

## Available Commands

| Command | Description | Output | Reference File |
|---|---|---|---|
| `audit <url>` | Full marketing audit with weighted scoring | MARKETING-AUDIT.md | `references/audit-frameworks.md` |
| `copy <url>` | Copywriting analysis with framework-based rewrites | COPY-SUGGESTIONS.md | `references/content-creation.md` |
| `emails <topic/url>` | Email sequence generation (7 types) | EMAIL-SEQUENCES.md | `references/templates.md` |
| `social <topic/url>` | 30-day social media content calendar | SOCIAL-CALENDAR.md | `references/content-creation.md` |
| `ads <url>` | Ad campaign generation across platforms | AD-CAMPAIGNS.md | `references/benchmarks.md` |
| `funnel <url>` | Conversion funnel analysis and optimization | FUNNEL-ANALYSIS.md | `references/audit-frameworks.md` |
| `competitors <url>` | Competitive intelligence report | COMPETITOR-REPORT.md | `references/audit-frameworks.md` |
| `landing <url>` | Landing page CRO analysis (7-point framework) | LANDING-CRO.md | `references/audit-frameworks.md` |
| `launch <product>` | 8-week launch playbook | LAUNCH-PLAYBOOK.md | `references/templates.md` |
| `seo <url>` | Technical SEO audit | SEO-AUDIT.md | `references/audit-frameworks.md` |
| `brand <url>` | Brand voice analysis and guidelines | BRAND-VOICE.md | `references/content-creation.md` |
| `proposal <client>` | Client proposal with 3-tier pricing | CLIENT-PROPOSAL.md | `references/templates.md` |

---

## Command Routing

### audit — Full Marketing Audit

The flagship command. Launches 5 parallel analysis tracks and produces a unified report.

**Analysis Tracks:**
1. **Content & Messaging** -- Copy quality, value props, clarity, persuasion
2. **Conversion Optimization** -- CTAs, forms, friction, social proof, urgency
3. **SEO & Discoverability** -- On-page SEO, technical SEO, content structure
4. **Competitive Positioning** -- Differentiation, market awareness, alternatives pages
5. **Brand & Trust** -- Brand consistency, trust signals, social proof
6. **Growth & Strategy** -- Pricing, referral, retention, expansion opportunities

**Weighted Scoring:**

```
Marketing Score = (
    Content_Score      * 0.25 +
    Conversion_Score   * 0.20 +
    SEO_Score          * 0.20 +
    Competitive_Score  * 0.15 +
    Brand_Score        * 0.10 +
    Growth_Score       * 0.10
)
```

See `references/audit-frameworks.md` for detailed scoring rubrics per category.

### copy — Copywriting Analysis

Analyzes existing copy, scores it on 5 dimensions (Clarity, Persuasion, Specificity, Emotion, Action), and generates optimized alternatives using PAS, AIDA, Before-After-Bridge, and 4U frameworks. Produces 10+ headline alternatives, 5+ CTA alternatives, and at least 5 before/after rewrites. See `references/content-creation.md` for frameworks.

### emails — Email Sequence Generation

Generates complete, ready-to-send email sequences. Selects from 7 sequence types based on context:

| Sequence Type | Emails | Duration | Goal |
|---|---|---|---|
| Welcome | 5-7 | 14 days | Build trust, deliver value, introduce product |
| Nurture | 6-8 | 12+ days | Educate, build authority, overcome objections |
| Launch | 8-12 | 14 days | Build anticipation, drive purchases |
| Re-engagement | 3-4 | 10 days | Win back attention or clean list |
| Onboarding | 5-7 | 10 days | Drive activation, reduce churn |
| Cart Abandonment | 3-4 | 7 days | Recover lost sales |
| Cold Outreach | 3-5 | 21 days | Book meetings, start conversations |

See `references/templates.md` for full email templates and `references/benchmarks.md` for open/click rate benchmarks.

### social — Social Media Calendar

Generates a complete 30-day content calendar with platform-specific posts, hooks, hashtags, and repurposing strategy. Content mix: 40% educational, 20% behind-the-scenes, 15% social proof, 15% engagement, 10% promotional. See `references/content-creation.md` for hook formulas and platform specs.

### ads — Ad Campaign Generation

Generates complete campaigns across Google, Meta, LinkedIn, and TikTok with full copy variations, audience targeting, budget recommendations, and creative specs. Includes 10 ad copy angles and 3-stage retargeting funnel (40/35/25 budget split). See `references/benchmarks.md` for ROAS and CPA benchmarks.

### funnel — Conversion Funnel Analysis

Maps the complete conversion path, identifies drop-off points, quantifies friction, and recommends optimizations with revenue impact estimates using Revenue-Per-Visitor calculations. Covers 8 funnel types. See `references/audit-frameworks.md` for funnel benchmarks.

### competitors — Competitive Intelligence

Identifies competitors across 3 tiers (direct, indirect, aspirational), analyzes messaging/pricing/features/SEO/social presence/reviews, produces SWOT analysis, and recommends steal-worthy tactics and alternative page strategy. See `references/audit-frameworks.md` for methodology.

### landing — Landing Page CRO

7-point CRO framework analysis: Hero Section (25%), Value Proposition (20%), Social Proof (15%), Features/Benefits (15%), Objection Handling (10%), Call-to-Action (10%), Footer (5%). Includes form audit, mobile audit, page speed impact, and A/B test hypotheses. See `references/audit-frameworks.md`.

### launch — Launch Playbook

8-week tactical plan: Weeks 1-2 Foundation, Weeks 3-4 Audience Building, Weeks 5-6 Pre-Launch Intensification, Week 7 Launch Week (day-by-day), Week 8 Post-Launch. Includes email sequences, social posts, partner coordination, and metrics dashboard. See `references/templates.md`.

### seo — SEO Audit

Comprehensive on-page SEO checklist (title tags, meta descriptions, headings, images, internal links, URL structure), E-E-A-T content quality assessment, keyword analysis, technical SEO check (robots.txt, sitemap, canonicals, Core Web Vitals), content gap analysis, featured snippet opportunities, and schema markup audit. See `references/audit-frameworks.md`.

### brand — Brand Voice Analysis

Maps brand voice along 4 dimensions (Formal/Casual, Serious/Playful, Technical/Simple, Reserved/Bold), identifies brand archetype (Authority, Innovator, Friend, Rebel, Guide), performs vocabulary analysis, consistency audit across channels, competitor voice comparison, and generates Do's/Don'ts guidelines with copy samples. See `references/content-creation.md`.

### proposal — Client Proposal Generation

Generates a complete client-ready proposal with executive summary, situation analysis, strategy (3 phases), scope of work, timeline, 3-tier pricing (Good-Better-Best), ROI projection, team intro, case studies, next steps, and follow-up sequence. See `references/templates.md`.

---

## Scoring System

All scored outputs use this grading scale:

| Score Range | Grade | Meaning |
|---|---|---|
| 85-100 | A | Excellent -- minor optimizations only |
| 70-84 | B | Good -- clear opportunities for improvement |
| 55-69 | C | Average -- significant gaps to address |
| 40-54 | D | Below average -- major overhaul needed |
| 0-39 | F | Critical -- fundamental marketing issues |

---

## Output Standards

All outputs must follow these rules:
1. **Actionable over theoretical** -- Every recommendation must be specific enough to implement
2. **Prioritized** -- Always rank by impact (High/Medium/Low)
3. **Revenue-focused** -- Connect every suggestion to business outcomes
4. **Example-driven** -- Include before/after copy examples, not just advice
5. **Client-ready** -- Reports should be presentable to clients without editing

---

## Cross-Skill Integration

Commands build on each other:
- `audit` produces comprehensive analysis that informs all other commands
- `proposal` references audit results if available for data-backed proposals
- `copy` benefits from `brand` voice guidelines if run first
- `emails` uses insights from `funnel` analysis if available
- `ads` uses `competitors` intelligence for competitive ad angles
- `social` aligns with `emails` for multi-channel consistency
- `landing` incorporates `audit` findings for deeper CRO analysis

---

## File References

Detailed frameworks, formulas, benchmarks, and templates are in the `references/` directory:
- `references/audit-frameworks.md` -- Scoring rubrics, weighted formulas, audit methodologies
- `references/content-creation.md` -- Copywriting frameworks, social media specs, brand archetypes
- `references/benchmarks.md` -- Industry benchmarks, ROAS, CPA, conversion rates
- `references/templates.md` -- Email sequences, proposal template, launch checklist, content calendar

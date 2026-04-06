# Audit Frameworks & Scoring Rubrics

Consolidated scoring rubrics, weighted formulas, and audit methodologies for all marketing analysis commands.

---

## 1. Full Marketing Audit Scoring

### Composite Marketing Score (0-100)

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

### Category 1: Content & Messaging (25% weight)

Score each dimension 0-10, average them for the category score, then multiply by 10 for 0-100 scale.

**Headline Clarity (0-10)**
- 9-10: Crystal clear + compelling. Passes 5-second test. Specific outcome stated.
- 7-8: Clear but generic. Visitor understands what you do but not why you're different.
- 5-6: Somewhat unclear. Requires reading subheadline or body to understand.
- 3-4: Confusing. Jargon-heavy or abstract.
- 0-2: No clear headline or completely vague.

**Value Proposition Strength (0-10)**
- 9-10: Unique + proven with numbers/outcomes/timeframes. Clearly answers "why you over alternatives?"
- 7-8: Clear but unproven. Good messaging without supporting evidence.
- 5-6: Generic. Could apply to any competitor.
- 3-4: Unclear. Visitor can't identify the unique value.
- 0-2: Missing entirely.

**Copy Persuasion (0-10)**
- 9-10: Highly persuasive + natural. Benefits over features, customer language, emotional triggers, logical proof, proactive objection handling.
- 7-8: Good but room to improve. Some feature-focused language remains.
- 5-6: Informational, not persuasive. Describes but doesn't sell.
- 3-4: Feature-focused. Lists capabilities without connecting to outcomes.
- 0-2: Poor or missing copy.

**Content Depth (0-10)**
- 9-10: Comprehensive + well-organized. Full coverage of product, use cases, educational content.
- 7-8: Good coverage with some gaps.
- 5-6: Surface-level. Basic product info without depth.
- 3-4: Thin content. Barely enough to inform decisions.
- 0-2: Minimal content.

**CTA Effectiveness (0-10)**
- 9-10: Compelling + well-placed. Value-driven text, multiple placement points, clear primary vs secondary.
- 7-8: Clear but generic ("Get Started" without value context).
- 5-6: Present but weak. Generic text, poor placement.
- 3-4: Confusing or buried below fold.
- 0-2: Missing or broken.

### Category 2: Conversion Optimization (20% weight)

**CTA Strategy (0-10)**
- Primary vs secondary CTA clarity
- Button text (value-driven vs generic "Submit")
- Placement and frequency across pages
- Visual hierarchy -- does the CTA stand out?
- Mobile CTA accessibility
- First-person language ("Start My Trial" > "Start Your Trial")

**Social Proof (0-10)**
- Customer testimonials with names, photos, companies, and specific results
- Client logos / "trusted by" section
- Case studies with specific numbers
- Metrics ("10,000+ users", "$2.4B processed")
- Third-party reviews (G2, Capterra, Trustpilot badges)
- Media mentions or awards
- Placement near decision points (close to CTAs)
- Specificity of numbers (use "11,847" not "10,000+")

**Friction Analysis (0-10, higher = less friction)**
- Steps to convert (fewer = better)
- Form field count (each additional field reduces conversion ~7%)
- Account creation requirements (allow guest/preview)
- Payment options (credit card + PayPal + Apple Pay)
- Page load speed
- Information architecture clarity
- Progress indicators on multi-step forms

**Trust Signals (0-10)**
- Security badges (SSL, payment security)
- Privacy policy and terms visibility
- Money-back guarantee or free trial
- Contact information accessibility
- Professional design quality
- Specific trust signals near conversion points

**Urgency & Scarcity (0-10)**
- Appropriate (not manipulative) urgency
- Limited-time offers or promotions
- Social proof urgency ("X people viewing")
- Waitlist or capacity messaging
- Seasonal or event-based urgency

### Category 3: SEO & Discoverability (20% weight)

**Page Structure (0-10, 25% of SEO)**
- Title tag: exists, 50-60 chars, keyword near beginning, brand name, unique, compelling
- Meta description: exists, 150-160 chars, includes keyword and CTA, unique
- H1: exactly one per page, contains keyword, differs from title
- H2-H6: logical hierarchy, no skipping levels, descriptive, keywords in subheadings
- Image alt text: descriptive, includes keywords naturally, decorative images have empty alt=""
- URL structure: readable, keywords, under 75 chars, hyphens, lowercase, clean

**Crawlability & Indexability (0-10, 20% of SEO)**
- robots.txt accessible and properly configured
- XML sitemap exists with all important pages
- No accidental noindex tags
- Canonical tags present and correct
- No broken internal links

**Performance (0-10, 15% of SEO)**
- LCP under 2.5s (Good), 2.5-4.0s (Needs Work), over 4.0s (Poor)
- FID under 100ms (Good), 100-300ms (Needs Work), over 300ms (Poor)
- CLS under 0.1 (Good), 0.1-0.25 (Needs Work), over 0.25 (Poor)
- TTFB under 200ms (Good), 200-500ms (Needs Work), over 500ms (Poor)
- FCP under 1.8s (Good), 1.8-3.0s (Needs Work), over 3.0s (Poor)

**Content Architecture (0-10, 20% of SEO)**
- Navigation clear and logical
- Key pages within 2-3 clicks
- Internal linking with descriptive anchor text (3-10 per 1,000 words)
- Content freshness and depth
- Topic cluster structure (pillar + cluster content)

**Schema & Tracking (0-10, 20% of SEO)**
- Organization schema, Website schema, Product/Service schema
- FAQ schema, Review/Rating schema, BreadcrumbList schema
- Article schema on blog posts
- Google Analytics/GA4, Google Tag Manager
- Meta Pixel, LinkedIn Insight Tag
- Cookie consent mechanism

### Category 4: Competitive Positioning (15% weight)

**Positioning Clarity (0-10)** -- Can you distinguish them from competitors in 10 seconds?
**Pricing Competitiveness (0-10)** -- Transparent, competitive, matching buyer expectations?
**Feature Messaging (0-10)** -- Differentiating features prominently communicated?
**Market Awareness (0-10)** -- Comparison pages, alternatives pages, "why us" content?
**Content Authority (0-10)** -- Thought leadership depth: blog, guides, case studies, research?

### Category 5: Brand & Trust (10% weight)

**Brand Consistency (0-10)** -- Visual + messaging consistency across all pages.
**Trust Architecture (0-10)** -- About page quality, contact info, social proof placement, privacy/security.
**Authority Signals (0-10)** -- Thought leadership, media mentions, awards, community presence.

### Category 6: Growth & Strategy (10% weight)

**Pricing Strategy (0-10)** -- Transparent, free tier/trial, Good-Better-Best structure, value-aligned metric, expansion paths.
**Acquisition Channels (0-10)** -- Channel diversity: content, SEO, social, paid, referral, partnerships.
**Retention & Expansion (0-10)** -- Onboarding, community, upgrade paths, newsletter, help center.

---

## 2. Landing Page CRO 7-Point Framework

Weighted scoring for landing page conversion rate optimization.

| Section | Weight | Focus |
|---|---|---|
| Hero Section | 25% | First screen. 80% of conversion decisions begin here. |
| Value Proposition | 20% | WHY someone should convert. 4U test: Useful, Urgent, Unique, Ultra-specific. |
| Social Proof | 15% | Evidence others trust and benefit. |
| Features & Benefits | 15% | Feature-to-benefit translation. |
| Objection Handling | 10% | FAQ, risk reversals, guarantees. |
| Call-to-Action | 10% | CTA button copy, placement, design. |
| Footer & Secondary | 5% | Final CTA, contact info, trust badges repeated. |

### Hero Section Checklist
- [ ] Headline visible within 2 seconds of page load
- [ ] Headline communicates primary benefit (not feature), under 10 words
- [ ] Subheadline expands with specificity
- [ ] Primary CTA above the fold, contrasting color, action-oriented text
- [ ] Hero image/video supports message (not generic stock)
- [ ] Trust badges or social proof visible above fold
- [ ] Page loads under 3 seconds
- [ ] No navigation competing with CTA (for dedicated landing pages)

### Copy Scoring (5 dimensions, 1-10 each, average x10 for 0-100)
1. **Clarity** -- Can a visitor understand the offer in 5 seconds?
2. **Urgency** -- Is there a reason to act NOW?
3. **Specificity** -- Concrete numbers, timeframes, outcomes?
4. **Proof** -- Claims backed by evidence, data, testimonials?
5. **Action Orientation** -- Does copy drive toward a specific next step?

### Landing Page Conversion Benchmarks

| Page Type | Primary Goal | Good CR | Great CR |
|---|---|---|---|
| Lead Capture | Email/form submission | 5-10% | 15%+ |
| SaaS Signup | Free trial or freemium | 3-7% | 10%+ |
| E-commerce Product | Add to cart / Purchase | 2-4% | 5%+ |
| Webinar Registration | Register for event | 20-30% | 40%+ |
| App Download | Install app | 10-15% | 20%+ |
| Waitlist | Join waitlist | 15-25% | 35%+ |
| Consultation Booking | Schedule a call | 5-10% | 15%+ |
| Nonprofit Donation | Make a donation | 2-5% | 8%+ |

### Form Optimization Rules
- Every additional field reduces conversion ~7%
- Lead capture: 3-5 fields max
- Use inline/floating labels (not placeholder-only)
- Button text matches value proposition ("Get My Free Guide" > "Submit")
- Inline validation with specific error messages
- Break long forms into steps with progress indicator
- Mark optional fields, not required ones
- Enable browser auto-fill for standard fields

### Page Speed to Conversion Impact

| Load Time | Conversion Impact |
|---|---|
| 0-2 seconds | Baseline (optimal) |
| 2-3 seconds | -7% conversion rate |
| 3-5 seconds | -20% conversion rate |
| 5-8 seconds | -35% conversion rate |
| 8+ seconds | -50%+ conversion rate |

### A/B Test Hypothesis Format
"If we [CHANGE], then [METRIC] will [IMPROVE/INCREASE] because [REASON]."

---

## 3. Funnel Analysis Framework

### 8 Funnel Types

| Funnel Type | Business Model | Typical Steps | Key Metric |
|---|---|---|---|
| Lead Gen | Services, agencies, B2B | Landing -> Form -> Thank you -> Nurture -> Sales call | Lead-to-close rate |
| SaaS Trial | SaaS products | Homepage -> Pricing -> Signup -> Onboarding -> Upgrade | Trial-to-paid rate |
| SaaS Demo | Enterprise SaaS | Homepage -> Features -> Demo request -> Sales call -> Close | Demo-to-close rate |
| E-commerce | Online stores | Product page -> Cart -> Checkout -> Upsell -> Thank you | Cart-to-purchase rate |
| Webinar | Courses, coaches, SaaS | Opt-in -> Confirmation -> Reminder -> Live -> Offer -> Checkout | Webinar-to-sale rate |
| Application | Premium services | Info page -> Application -> Review -> Interview -> Accept | Application-to-accept rate |
| Community | Memberships | Landing -> Free trial/preview -> Engage -> Paid membership | Free-to-paid rate |
| Content | Media, publishers | Blog -> Email capture -> Nurture -> Premium -> Subscribe | Reader-to-subscriber rate |

### Page-by-Page Scoring (5 dimensions, 0-10 each)

| Dimension | What to Evaluate |
|---|---|
| Clarity | Is the purpose of this page immediately obvious? |
| Continuity | Does it logically continue from the previous step? |
| Motivation | Does it give enough reason to take the next action? |
| Friction | How easy is it to complete the desired action? (10 = frictionless) |
| Trust | Are there adequate trust signals for this stage? |

### Revenue-Per-Visitor Calculation

```
RPV = Monthly Revenue / Monthly Visitors

Example:
  10,000 visitors/month x 2% conversion x $100 AOV = $20,000/month
  RPV = $20,000 / 10,000 = $2.00 per visitor

  Improve conversion from 2% to 2.5%:
  10,000 x 2.5% x $100 = $25,000/month
  Revenue lift = $5,000/month = $60,000/year
```

### Revenue Impact Formula

```
Current Monthly Traffic x Conversion Rate Improvement x Average Deal Value
= Estimated Monthly Revenue Lift

Impact Levels:
  High Impact:   >$5,000/mo or >20% improvement (clear evidence from audit)
  Medium Impact: $1,000-$5,000/mo or 5-20% improvement (industry benchmarks)
  Low Impact:    <$1,000/mo or <5% improvement (incremental optimization)
```

### Funnel Conversion Benchmarks

| Funnel Type | Good | Great | Elite |
|---|---|---|---|
| Lead Gen (form) | 3-5% | 5-10% | 10-20% |
| SaaS Free Trial | 2-5% | 5-10% | 10-15% |
| Trial to Paid | 10-15% | 15-25% | 25-40% |
| E-commerce (browse to buy) | 1-3% | 3-5% | 5-8% |
| Cart to Purchase | 50-60% | 60-70% | 70-80% |
| Webinar Registration | 20-40% | 40-55% | 55-70% |
| Webinar Attendance | 30-40% | 40-55% | 55-65% |
| Webinar to Sale | 2-5% | 5-10% | 10-20% |
| Cold Email Reply | 3-5% | 5-10% | 10-20% |
| Demo to Close | 15-25% | 25-40% | 40-60% |

### Funnel Stage Key Metrics

```
Traffic Metrics:
  Monthly Visitors: [estimated or ask]
  Traffic Sources: organic %, paid %, referral %, direct %, social %

Conversion Metrics:
  Visitor -> Lead:         benchmark 2-5%
  Lead -> MQL:             benchmark 15-30%
  MQL -> Opportunity:      benchmark 30-50%
  Opportunity -> Customer: benchmark 20-40%
  Overall Visitor -> Customer: benchmark 0.5-3%

Revenue Metrics:
  Average Order Value (AOV)
  Customer Lifetime Value (LTV)
  Customer Acquisition Cost (CAC)
  LTV:CAC Ratio: target 3:1 or higher
  Revenue Per Visitor (RPV)
```

### Optimization Prioritization Matrix

| Priority | Impact | Effort | When to Implement |
|---|---|---|---|
| P1 (Do Now) | High (>10% lift) | Low (<1 day) | This week |
| P2 (Plan) | High (>10% lift) | Medium (1-5 days) | This month |
| P3 (Schedule) | Medium (5-10% lift) | Low (<1 day) | This month |
| P4 (Backlog) | Medium (5-10% lift) | High (5+ days) | This quarter |
| P5 (Nice to Have) | Low (<5% lift) | Any | When resources allow |

### Stage-Specific Expected Lifts

**Top of Funnel (Awareness -> Interest):**
- Headline A/B testing: 10-30% lift
- Social proof placement: 5-15% lift
- Page speed optimization: 5-20% lift
- Exit-intent popup with lead magnet: 2-5% of exiting visitors

**Middle of Funnel (Interest -> Consideration):**
- Case study and testimonial pages: 10-20% lift
- Feature comparison pages: 5-15% lift
- Interactive product demos: 15-30% lift
- Retargeting email sequences: 10-25% lift

**Bottom of Funnel (Consideration -> Purchase):**
- Pricing page redesign: 10-25% lift
- Checkout friction reduction: 5-15% lift
- Risk reversal (guarantees, trials): 10-20% lift
- Urgency and scarcity elements: 5-15% lift
- Cart abandonment recovery: 5-15% of abandoned carts

**Post-Purchase (Retention and Expansion):**
- Onboarding email sequence: 10-20% reduction in churn
- Upsell/cross-sell on thank-you page: 5-15% of AOV
- Referral program: 5-15% new customers
- NPS survey at 30 days: identifies at-risk customers

---

## 4. Competitor Analysis Methodology

### 3 Competitor Tiers

| Category | Definition | How to Find | Count |
|---|---|---|---|
| Direct Competitors | Same product, same audience, same market | Search product category keywords, check page 1 rankings | 3-5 |
| Indirect Competitors | Different product, same problem solved | Search for the problem being solved | 2-3 |
| Aspirational Competitors | Market leaders the brand aspires to become | Industry leaders, category creators | 1-2 |

### Discovery Methods
1. **Keyword-Based:** Search "[product category] software/service", "[brand] alternatives", "[brand] vs"
2. **Site-Based:** Check comparison pages, footer links, integrations pages, blog mentions
3. **Review Platform:** G2, Capterra, Trustpilot -- top-rated in same category
4. **Social/Community:** Reddit recommendations, Twitter conversations, LinkedIn follows

### SWOT Analysis Template

```
COMPETITOR: [Name]
URL: [url]

STRENGTHS:
  - [Specific strength with evidence]
  - [Specific strength with evidence]

WEAKNESSES:
  - [Specific weakness with evidence]
  - [Specific weakness with evidence]

OPPORTUNITIES (for the target to exploit):
  - [Based on competitor weakness]
  - [Based on market gap]

THREATS (competitor advantages to watch):
  - [Threat with potential impact]
  - [Threat with potential impact]
```

### Feature Comparison Matrix Format

| Feature Category | Feature | Target | Comp A | Comp B | Comp C |
|---|---|---|---|---|---|
| Core | [Feature 1] | Full | Full | Partial | No |
| Core | [Feature 2] | Full | Full | Full | Full |
| Advanced | [Feature 3] | No | Full | No | Full |
| Integration | [Feature 4] | Full | Full | No | Partial |

Use: **Full**, **Partial**, **No**, or **Beta** to categorize.

### Positioning Map Axes
- X-axis: Perceived simplicity <--> Perceived power
- Y-axis: Perceived affordability <--> Perceived premium

Adjust axes based on what matters most in the specific industry.

### Alternative Page Strategy Template

```
PAGE: [Target] vs [Competitor Name]
URL: /vs/[competitor-name]

Sections:
  1. Quick comparison table (features, pricing, ratings)
  2. Where [Target] wins (3-4 advantages with evidence)
  3. Where [Competitor] wins (honest, builds trust)
  4. Who [Target] is best for (ideal customer profile)
  5. Customer switching stories
  6. Migration guide or switching offer
  7. FAQ about switching
  8. CTA: "Try [Target] free"
```

---

## 5. SEO Audit Methodology

### On-Page SEO Checklist

**Title Tag:** Exists, 50-60 chars, primary keyword near beginning, brand name, unique, compelling click-worthy.

**Meta Description:** Exists, 150-160 chars, includes keyword naturally, has CTA, unique per page.

**Heading Hierarchy:** Exactly one H1 with keyword, logical H2->H3 nesting (no skipping), descriptive subheadings, secondary keywords in H2s/H3s.

**Image Optimization:** Descriptive alt text on all images, descriptive filenames (not IMG_001.jpg), WebP format preferred, compressed, lazy loading for below-fold, responsive srcset, decorative images with empty alt="".

**Internal Linking:** 3-10 links per 1,000 words, descriptive anchor text (not "click here"), deep links to specific pages, contextually relevant, no broken links.

**URL Structure:** Human-readable, contains keywords, under 75 chars, hyphens between words, all lowercase, clean (no unnecessary parameters), consistent trailing slashes.

### E-E-A-T Content Quality Assessment

| Dimension | Strong | Present | Weak | Missing |
|---|---|---|---|---|
| **Experience** | Personal anecdotes, case studies, screenshots, specific hands-on details | Some real-world examples | Generic examples only | No evidence of experience |
| **Expertise** | Author bio with credentials, deep content, accurate data, proper terminology | Basic expertise shown | Superficial coverage | No expertise signals |
| **Authoritativeness** | Real author bylines, about page, awards, backlinks from authorities, media mentions | Some authority signals | Minimal recognition | No authority signals |
| **Trustworthiness** | HTTPS, privacy policy, contact info, reviews, security badges, sourced claims | Basic trust elements | Missing key elements | Trust concerns |

### Core Web Vitals Revenue Impact

- Sites passing all Core Web Vitals: 24% fewer page abandonments
- 100ms decrease in LCP: 1.1% increase in conversion rates
- Reducing CLS by 0.1: 15% decrease in bounce rate
- Pages loading in 2s: 9% bounce rate vs 5s: 38% bounce rate

### Schema Markup Priority

| Schema Type | Applicable To | Priority |
|---|---|---|
| Organization | Homepage, About page | High |
| WebSite + SearchAction | Homepage | High |
| Product | Product pages | High |
| FAQ | FAQ sections | High |
| Article | Blog posts | Medium |
| BreadcrumbList | All pages with breadcrumbs | Medium |
| Review/AggregateRating | Reviews, testimonials | Medium |
| LocalBusiness | Local businesses | High (if local) |
| HowTo | Tutorial content | Low |
| Event | Event pages | Low (if applicable) |

### Content Gap Analysis Template

| Missing Topic | Search Volume | Competition | Content Type Needed | Priority |
|---|---|---|---|---|
| [Topic] | High/Med/Low | High/Med/Low | Blog/Guide/Tool/Page | 1-5 |

Scoring: High volume + Low competition + High business value = Highest priority

### Featured Snippet Optimization

- **Paragraph snippet:** Answer in 40-60 words. Question as H2/H3, concise answer immediately after.
- **List snippet:** Ordered/unordered lists with H2 containing target query.
- **Table snippet:** HTML tables with clear headers.
- **Video snippet:** Descriptive title and timestamps.

---

## 6. Brand Voice Scoring

### 4 Voice Dimensions (1-10 scale each)

**Dimension 1: Formal <--> Casual**

| Signal | Formal (1-3) | Casual (7-10) |
|---|---|---|
| Contractions | Avoids ("do not", "cannot") | Uses freely ("don't", "can't") |
| Sentence structure | Complex, longer | Short, punchy |
| Vocabulary | Professional, industry-standard | Conversational, everyday |
| Greetings | "Dear valued customer" | "Hey there!" |
| Pronouns | Third person ("the company") | First/second ("we", "you") |
| Humor | Rare or absent | Frequent, natural |
| Slang | Never | Occasionally or frequently |

**Dimension 2: Serious <--> Playful**

| Signal | Serious (1-3) | Playful (7-10) |
|---|---|---|
| Tone | Authoritative, measured | Light-hearted, fun |
| Metaphors | Rare, conservative | Creative, unexpected |
| Exclamation marks | Rare | Frequent |
| Emoji | Never | Sometimes or often |
| Wordplay/puns | Never | Enjoys them |
| Error messages | "An error has occurred" | "Oops! Something went sideways" |

**Dimension 3: Technical <--> Simple**

| Signal | Technical (1-3) | Simple (7-10) |
|---|---|---|
| Jargon | Uses freely | Avoids or explains |
| Acronyms | Uses without definition | Spells out on first use |
| Detail level | In-depth | High-level overviews |
| Audience assumption | Expert | General |
| Data/statistics | Frequent, detailed | Occasional, simplified |
| Examples | Complex, domain-specific | Simple, relatable analogies |

**Dimension 4: Reserved <--> Bold**

| Signal | Reserved (1-3) | Bold (7-10) |
|---|---|---|
| Claims | Hedged ("we believe", "may help") | Direct ("we guarantee", "the best") |
| Opinions | Neutral, balanced | Strong, opinionated |
| Competitive references | Avoids mentioning | Directly compares |
| Personality | Understated | Distinctive, memorable |
| Promises | Conservative | Ambitious |
| Controversy | Avoids | Embraces when aligned |

### Consistency Scoring (0-10)
Assess voice consistency across all channels: homepage, about page, blog, social media, email, product pages. Flag channels where voice noticeably diverges.

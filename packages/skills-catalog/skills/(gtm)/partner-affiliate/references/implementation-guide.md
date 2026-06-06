## 5. Marketplace and Directory Strategy

Building a marketplace or listing in partner marketplaces creates compounding distribution. Salesforce AppExchange has over 7,000 apps with 10M+ installs. Atlassian Marketplace has 5,000+ integrations and pushed $4B in lifetime sales by 2024.

### Marketplace Decision Framework

| Strategy                     | When to Use                                                          | Expected Outcome                                  | Investment Level                           |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| List on partner marketplaces | You integrate with established platforms                             | Inbound leads from marketplace discovery          | Low - marketing asset creation             |
| Build your own marketplace   | You are a platform with 10+ integrations                             | Partner ecosystem creates competitive moat        | High - engineering + partner management    |
| App store listing            | Your product extends a major platform (Salesforce, HubSpot, Shopify) | Distribution through the platform's customer base | Medium - listing development + maintenance |

### Marketplace Listing Optimization

| Element     | Best Practice                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Title       | Include the primary use case, not just your product name. "[Product]: [Use Case] for [Platform]" |
| Description | Lead with the outcome, not the feature. First 160 characters appear in search results.           |
| Screenshots | Show the integration in action within the partner platform, not your standalone UI               |
| Reviews     | Proactively ask joint customers to leave reviews within 7 days of integration activation         |
| Categories  | List in every relevant category the marketplace allows. More categories = more discovery.        |
| Pricing     | Free tier or free trial converts 3-5x better than paid-only listings                             |

### Building Your Own Integration Directory

If you have 5+ integrations, build a public integration directory. This serves three purposes: SEO (integration pages rank for "[partner] + [your category]" searches), social proof (prospects see their stack is supported), and partner recruitment (potential partners see the ecosystem and want to join).

**Minimum viable integration directory structure:**

```
/integrations (landing page with search/filter)
  /integrations/[partner-name] (individual integration page)
    - What it does (2-3 sentences)
    - How it works (data flow diagram)
    - Setup instructions (link to docs)
    - Joint customer quote
    - CTA: "Connect [Partner] to [Your Product]"
```

---

## 6. Partner Recruitment and Activation

### The Recruitment Funnel

Most partner programs fail at activation, not recruitment. Signing partners is easy. Getting them to generate their first referral is hard. Focus your energy on activation metrics, not partner count.

| Stage          | Target Metric                                               | Benchmark                                    |
| -------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Identified     | Total addressable partner list                              | 100-500 potential partners                   |
| Recruited      | Partners who signed up                                      | 30-40% of identified                         |
| Onboarded      | Partners who completed setup (tracking link, portal access) | 60-70% of recruited                          |
| Activated      | Partners who generated first referral or lead               | 20-30% of onboarded                          |
| Performing     | Partners generating 3+ referrals per quarter                | 10-15% of activated                          |
| Top performers | Partners in top 10% by revenue                              | 2-5 partners driving 50%+ of partner revenue |

**The 80/20 rule holds: expect 10-20% of partners to drive 80%+ of partner-sourced revenue.**

### Recruitment Channels by Partner Type

| Partner Type                   | Best Recruitment Channel                   | Approach                                                            |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| Existing customers             | In-app prompt + email campaign             | "You already get results, earn by sharing"                          |
| Content creators / influencers | Direct outreach based on content alignment | "We love your content on [topic], here is how we can work together" |
| Complementary SaaS companies   | Crossbeam overlap analysis + warm intro    | "We share 47 customers, let us formalize this"                      |
| Consultants / agencies         | Industry events + LinkedIn outreach        | "Your clients already need this, earn recurring revenue"            |
| System integrators             | RFP responses + executive networking       | "We want you in our recommended implementation partners"            |

### Activation Sequence

The first 14 days after signup determine whether a partner will ever generate revenue. Use an automated sequence to drive first action.

| Day | Action                                                                 | Channel        | Goal                                |
| --- | ---------------------------------------------------------------------- | -------------- | ----------------------------------- |
| 0   | Welcome email with portal login and quick-start guide                  | Email          | Confirm setup                       |
| 1   | Video walkthrough: "Generate your first referral in 10 minutes"        | Email + portal | Show the path to first commission   |
| 3   | Share top-performing partner case study                                | Email          | Social proof that the program works |
| 5   | Check-in: "Have you shared your link yet?" with templated social posts | Email          | Reduce friction to first share      |
| 7   | Partner manager intro (for Tier 2+) or chatbot check-in (Tier 1)       | Email/Slack    | Personal touch or automated nudge   |
| 14  | "First 30 days" milestone email with program tips                      | Email          | Reinforce commitment                |
| 30  | Performance review: celebrate wins or re-engage dormant partners       | Email + call   | Retain or reactivate                |

---

## 7. Co-Marketing Playbook

### Joint Campaign Types by Investment Level

| Campaign Type               | Investment       | Expected Leads          | Timeline   | Best For                             |
| --------------------------- | ---------------- | ----------------------- | ---------- | ------------------------------------ |
| Joint blog post             | Low ($0-500)     | 50-200                  | 1-2 weeks  | Building initial co-marketing muscle |
| Guest newsletter swap       | Low ($0)         | 100-500                 | 1 week     | Audience cross-pollination           |
| Joint webinar               | Medium ($500-2K) | 200-1,000 registrations | 3-4 weeks  | Lead generation with email capture   |
| Co-authored research report | High ($2K-10K)   | 500-2,000               | 6-8 weeks  | Thought leadership and top-of-funnel |
| Joint product launch        | High ($5K-20K)   | 1,000-5,000             | 8-12 weeks | Major integration announcements      |

### Joint Webinar Execution Checklist

| Week   | Task                                                                          | Owner          |
| ------ | ----------------------------------------------------------------------------- | -------------- |
| Week 1 | Agree on topic, target audience, and lead split                               | Both partners  |
| Week 1 | Create shared project doc with roles, timeline, and promotion plan            | Lead partner   |
| Week 2 | Draft webinar content, slides, and speaker prep                               | Content owners |
| Week 2 | Build registration page with UTM tracking for each partner                    | Marketing ops  |
| Week 3 | Launch promotion: email (3 sends each), social (5+ posts each), in-app banner | Both partners  |
| Week 3 | Run dry-run rehearsal                                                         | Speakers       |
| Week 4 | Host webinar, monitor chat, capture questions                                 | Both partners  |
| Week 4 | Send recording + follow-up sequence to registrants                            | Both partners  |
| Week 5 | Share lead lists (with consent), analyze conversion data                      | Marketing ops  |

### Co-Marketing Budget Allocation

For Integration and Solution tier partners, allocate a quarterly co-marketing budget. Split investment based on expected return.

| Activity                            | % of Co-Marketing Budget | Expected ROI                                      |
| ----------------------------------- | ------------------------ | ------------------------------------------------- |
| Joint webinars                      | 30%                      | Highest lead volume per dollar                    |
| Co-authored content (blogs, guides) | 25%                      | SEO value compounds over time                     |
| Joint paid campaigns                | 20%                      | Fast results, requires optimization               |
| Event sponsorship (joint booth)     | 15%                      | Relationship-building, hard to attribute directly |
| Partner swag and incentives         | 10%                      | Activation and loyalty                            |

---

## 8. Attribution: Partner-Sourced vs. Partner-Influenced

Getting attribution right is the difference between a partner program that gets executive buy-in and one that gets defunded.

### Definitions

| Type               | Definition                                                                                                            | Tracking Method                                                         | Commission Impact                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Partner-sourced    | Partner brought the lead. First-touch from partner referral link, deal registration, or co-sell intro.                | Referral link click, deal registration form, Crossbeam-flagged overlap  | Full commission paid                                 |
| Partner-influenced | Partner helped close an existing lead. Joined a demo, shared a case study, answered objections, provided a reference. | CRM activity logging, partner-tagged touchpoints, co-sell meeting notes | Partial commission (25-50% of sourced rate) or bonus |

### Attribution Decision Tree

```
Did the partner introduce the lead?
  |
  +--> YES: Was the lead in your CRM before partner contact?
  |      |
  |      +--> NO --> PARTNER-SOURCED (100% credit)
  |      +--> YES --> Was the lead actively engaged with sales?
  |              |
  |              +--> NO (dormant/stale) --> PARTNER-SOURCED (100% credit)
  |              +--> YES (active opp) --> PARTNER-INFLUENCED (partial credit)
  |
  +--> NO: Did the partner contribute to the deal?
         |
         +--> YES (demo, reference, co-sell) --> PARTNER-INFLUENCED (partial credit)
         +--> NO --> NO PARTNER CREDIT
```

### Attribution Windows

| Event Type                    | Lookback Window                                                    | Rationale                                    |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| Referral link click to signup | 90 days                                                            | Cookie-based, covers longer B2B sales cycles |
| Deal registration to close    | 120 days                                                           | Protects partner investment in the pipeline  |
| Partner-influenced touchpoint | 90 days before close                                               | Must be within active deal cycle             |
| Renewal attribution           | Partner retains credit for customer lifetime if ongoing engagement | Incentivizes partner retention involvement   |

### Metrics to Track

| Metric                     | Definition                                                           | Target Benchmark                        |
| -------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Partner-sourced revenue    | Revenue from deals where partner was first touch                     | 15-30% of total revenue at maturity     |
| Partner-influenced revenue | Revenue from deals where partner contributed but was not first touch | 10-20% of total revenue                 |
| Partner-sourced pipeline   | Open pipeline from partner referrals                                 | 2-3x of partner-sourced revenue target  |
| Partner attach rate        | % of deals with at least one partner touchpoint                      | 30-50% at maturity                      |
| Partner activation rate    | % of signed partners who generated at least one lead                 | 20-30%                                  |
| Average partner revenue    | Revenue per active partner per quarter                               | Varies by tier - track trend            |
| Time to first referral     | Days from partner signup to first qualified lead                     | Under 30 days for referral partners     |
| Partner-sourced win rate   | Close rate on partner-sourced deals vs. direct                       | Partner-sourced should be 1.5-2x higher |

---

## 9. Channel Conflict Management

Channel conflict kills partner programs faster than bad economics. Prevent it with clear rules, not retroactive arbitration.

### Common Conflict Types

| Conflict Type            | Description                                           | Prevention                                                      |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------- |
| Partner vs. direct sales | Your sales team and a partner pursue the same account | Deal registration system with 14-day first-mover protection     |
| Partner vs. partner      | Two partners claim the same deal                      | Account mapping via Crossbeam, territory or vertical assignment |
| Pricing conflict         | Partner offers discount your direct channel does not  | Minimum Advertised Price (MAP) policy, consistent pricing tiers |
| Lead ownership dispute   | Unclear who sourced vs. influenced a deal             | CRM-integrated attribution with timestamped touchpoints         |

### Rules of Engagement Template

Publish these rules in your partner portal and review them during every partner onboarding call.

**Deal Registration Rules:**

1. Partner must register deals within 14 days of first customer contact
2. Registration expires after 120 days if no signed contract. Partner can re-register once.
3. First valid registration wins. Timestamp in the PRM system is authoritative.
4. Direct sales team checks deal registration before engaging any account
5. Disputes escalated to partner manager within 48 hours, resolved within 5 business days

**Account Protection Rules:**

1. Solution partners (Tier 3) receive quarterly protected account lists (max 50 accounts)
2. Protected accounts are excluded from direct outbound for the quarter
3. Protection requires active pipeline movement - stale protected accounts lose protection at quarterly review
4. No partner can protect more than 50 accounts simultaneously

**Pricing Rules:**

1. All partners sell at published pricing. No unauthorized discounts.
2. Partners may offer their own services (implementation, consulting) at any price
3. Bundle pricing with partner services requires approval from partner manager
4. MAP violations result in written warning (first), commission hold (second), program removal (third)

---

## 10. AI-Specific Partnership Models

### Partnership Categories in the AI Stack

| Partnership Type          | Your Role         | Partner Role                               | Revenue Model                                | Example                                                     |
| ------------------------- | ----------------- | ------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Model provider            | Application layer | Provides underlying AI model               | API usage fees, revenue share on model costs | Your app uses OpenAI/Anthropic, negotiate volume pricing    |
| Data partner              | Application layer | Provides training or enrichment data       | Data licensing, per-query pricing            | Your AI product uses industry-specific data sets            |
| Infrastructure partner    | Application layer | Provides compute/hosting                   | Cloud credits, co-sell referrals             | Joint GTM with AWS, GCP, or Azure                           |
| Vertical solution partner | Platform          | Builds vertical solutions on your platform | Revenue share on vertical customers          | Partner builds "AI for healthcare billing" on your platform |
| Distribution partner      | Application layer | Embeds your AI in their product            | Per-seat or per-API-call embed pricing       | CRM vendor embeds your AI writing assistant                 |

### AI Partnership Pricing Models

| Model                      | Structure                                                | When to Use                           | Risk                                          |
| -------------------------- | -------------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| Per-API-call revenue share | Partner earns % of API revenue from their referred users | High-volume, low-ACV integrations     | Revenue unpredictability                      |
| Flat referral fee          | Fixed payment per referred customer                      | Simple referral relationships         | Under-compensates for high-value referrals    |
| Recurring revenue share    | Partner earns % of customer MRR for lifetime             | Deep integration partnerships         | Margin compression on thin-margin AI products |
| Outcome-based split        | Revenue shared based on measurable outcome delivered     | Joint solutions with quantifiable ROI | Complex attribution and measurement           |
| Embed licensing            | Partner pays per-seat or per-call to embed your AI       | OEM/white-label relationships         | Partner controls the customer relationship    |

### AI-Specific Partnership Considerations

| Factor                     | Impact on Partnership Design                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model cost passthrough     | AI products have variable COGS. Commission structures must account for model API costs. A 30% revenue share on a product with 40% model costs leaves 30% gross margin. |
| Data sharing agreements    | AI partnerships often require data exchange. Define data ownership, usage rights, and privacy compliance upfront.                                                      |
| Model version dependencies | Partner integrations may depend on specific model versions. Establish SLAs for model change notifications (minimum 30 days).                                           |
| Accuracy guarantees        | Partners selling your AI solution need confidence in output quality. Provide accuracy benchmarks by use case.                                                          |
| Compliance requirements    | Enterprise AI partnerships require SOC2, GDPR, and increasingly AI-specific compliance (EU AI Act). Build compliance into the partner onboarding checklist.            |

---

## 11. Partner Program Operations

### PRM Tool Selection

| Tool Category                   | Options                                          | Purpose                                                               |
| ------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Partner Relationship Management | PartnerStack, Allbound, Channeltivity, Impartner | Central hub for partner portal, deal registration, content sharing    |
| Account Mapping                 | Crossbeam, Reveal                                | Identify overlapping customers and prospects between you and partners |
| Attribution Tracking            | Impact.com, PartnerStack, FirstPromoter          | Track referrals, clicks, conversions, and commission payouts          |
| Co-Selling Coordination         | Crossbeam, Tackle (for cloud marketplaces)       | Coordinate joint selling on specific accounts                         |
| Partner Enablement              | WorkRamp, Seismic, partner portal                | Training, certification, asset distribution                           |

### Quarterly Business Review (QBR) Template

Run QBRs with Tier 2 and Tier 3 partners quarterly. Keep them to 45 minutes.

| Section                      | Time   | Content                                                           |
| ---------------------------- | ------ | ----------------------------------------------------------------- |
| Performance review           | 10 min | Revenue sourced, pipeline generated, deals closed, leads referred |
| Account mapping update       | 10 min | New overlapping accounts, joint opportunity identification        |
| Co-marketing review          | 10 min | Campaigns run, results, next quarter plan                         |
| Product roadmap preview      | 5 min  | Upcoming features relevant to the partnership                     |
| Action items and commitments | 10 min | Specific deliverables with owners and deadlines                   |

### Partner Program Maturity Model

| Stage      | Timeline     | Partner Count    | Revenue Contribution | Key Activities                                                                  |
| ---------- | ------------ | ---------------- | -------------------- | ------------------------------------------------------------------------------- |
| Foundation | Months 0-6   | 5-20 partners    | Under 5% of revenue  | Launch affiliate program, sign first integration partners, build partner portal |
| Growth     | Months 6-18  | 20-100 partners  | 5-15% of revenue     | Tier structure live, co-marketing running, deal registration working            |
| Scale      | Months 18-36 | 100-500 partners | 15-30% of revenue    | Dedicated partner team, marketplace live, partner-sourced pipeline predictable  |
| Ecosystem  | 36+ months   | 500+ partners    | 30%+ of revenue      | Self-sustaining ecosystem, partners recruit partners, network effects compound  |

---

## 12. Implementation Playbook

### Phase 1: Foundation (Weeks 1-4)

- [ ] Define partner program thesis: why partners, what type, what value exchange
- [ ] Choose affiliate/PRM platform based on revenue stage and partner type
- [ ] Design commission structure for Tier 1 (referral) partners
- [ ] Create partner agreement (legal review required)
- [ ] Build partner portal with signup, tracking dashboard, and asset library
- [ ] Create onboarding email sequence (7-email series over 30 days)
- [ ] Identify and recruit first 10 partners from existing customers and network

### Phase 2: Activation (Weeks 5-8)

- [ ] Launch automated onboarding sequence for all new partners
- [ ] Host first "partner kickoff" webinar or group onboarding session
- [ ] Create partner marketing kit: email templates, social copy, one-pagers, banners
- [ ] Track activation metrics: time to first referral, portal login rate, asset usage
- [ ] Run first joint campaign with highest-potential partner
- [ ] Set up attribution tracking and validate with test referrals

### Phase 3: Integration Partners (Weeks 9-16)

- [ ] Run Crossbeam or manual account mapping with top 5 complementary products
- [ ] Score potential integration partners using the prioritization model
- [ ] Initiate technical integration with top-scoring partner
- [ ] Design Tier 2 commission structure for integration partners
- [ ] Plan first co-marketing campaign (joint webinar or content)
- [ ] Create integration listing page on your website

### Phase 4: Scale (Months 4-6)

- [ ] Launch tiered partner structure (Tier 1, 2, 3) with clear progression criteria
- [ ] Build partner recruitment engine: inbound (marketplace listings, partner page SEO) + outbound (targeted outreach)
- [ ] Implement deal registration and channel conflict rules
- [ ] Run first quarterly business review with top partners
- [ ] Analyze partner-sourced vs. partner-influenced revenue
- [ ] Create partner advisory board with top 5 performing partners
- [ ] Set 12-month targets for partner-sourced revenue as a percentage of total

---

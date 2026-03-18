---
name: sales-motion-design
description: "When the user wants to choose between PLG and sales-led, design a sales motion, optimize time-to-first-value, or build a value-before-purchase experience. Also use when the user mentions 'PLG,' 'product-led growth,' 'sales-led,' 'sales motion,' 'free trial,' 'freemium,' 'self-serve,' 'demo-first,' 'time-to-first-value,' 'TTFV,' or 'agent-led sales.' This skill covers sales motion selection, value delivery design, and go-to-market motion architecture. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'
---

# Sales Motion Design

You are a go-to-market strategist specializing in sales motion architecture,
product-led growth, and value delivery design. You help founders and GTM leaders
choose the right sales motion, optimize time-to-first-value, and build
value-before-purchase experiences that convert.

## Before Starting

Gather these inputs from the user before making recommendations:

1. **Product type** - SaaS, API, marketplace, hardware, services
2. **Average deal size** - Monthly or annual contract value
3. **Product complexity** - Can a user get value without human help?
4. **Current motion** - What they do today (if anything)
5. **Team size** - Headcount available for sales, CS, marketing
6. **Target buyer** - Developer, operator, executive, SMB owner
7. **Funding stage** - Bootstrapped, seed, Series A+, profitable
8. **Current CAC and payback** - If known
9. **Biggest bottleneck** - Pipeline, conversion, expansion, churn

If the user skips inputs, make reasonable assumptions and state them explicitly.

---

## 1. The Motion Selection Matrix

Choose your primary motion based on two axes: price and complexity.

```
                     PRODUCT COMPLEXITY
                 Low                    High
           +------------------+-------------------+
           |                  |                   |
    Low    |   PURE PLG       |  PLG + SALES      |
    Price  |                  |    HYBRID          |
           |  Self-serve      |  Self-serve +      |
    (<$500 |  No touch        |  Sales assist      |
     /mo)  |  Freemium/trial  |  PQL triggers      |
           |                  |                   |
           +------------------+-------------------+
           |                  |                   |
    High   | SALES-ASSISTED   |  SALES-LED        |
    Price  |    PLG            |                   |
           |                  |  AE-driven        |
   (>$500  |  Try-then-buy    |  Demo-first       |
    /mo)   |  Usage triggers  |  Procurement      |
           |  CS handoff      |  Multi-thread     |
           |                  |                   |
           +------------------+-------------------+
```

### Decision criteria beyond price x complexity

| Signal                              | Points to PLG | Points to Sales-Led |
| ----------------------------------- | ------------- | ------------------- |
| Buyer can self-evaluate product     | Yes           | No                  |
| Time to first value < 15 min        | Yes           | No                  |
| Multiple stakeholders in decision   | No            | Yes                 |
| Compliance/security review needed   | No            | Yes                 |
| Product requires config/integration | No            | Yes                 |
| Network effects drive adoption      | Yes           | No                  |
| User and buyer are same person      | Yes           | No                  |
| Average deal cycle > 30 days        | No            | Yes                 |
| Product is horizontal (broad use)   | Yes           | No                  |
| Product is vertical (niche use)     | No            | Yes                 |

**Scoring**: 7+ PLG signals = pure PLG. 4-6 = hybrid. 0-3 = sales-led.

---

## 2. Motion Archetypes in Detail

### 2A. Pure PLG

**When it works**: Low price, low complexity, user = buyer, fast TTFV.

**Examples**: Notion, Canva, Calendly, Loom, Figma early days.

**Conversion funnel**:

```
Visit -> Sign up -> Activate -> Engage -> Convert -> Expand
                                                      |
                                            (product handles all)
```

**Key metrics and benchmarks**:
| Metric | Median | Top Quartile |
|-------------------------------|----------------|----------------|
| Visitor to sign-up | 2-5% | 8-12% |
| Free to paid (freemium) | 3-5% | 6-8% |
| Free to paid (opt-in trial) | 18% | 25%+ |
| Free to paid (opt-out trial) | 49% | 60%+ |
| Time to first value | < 5 min | < 2 min |
| Net revenue retention | 110% | 120%+ |
| CAC payback (months) | 6-9 | < 6 |

**Opt-in vs opt-out**: Opt-out (card required) shows 49% conversion but fewer
sign-ups. Opt-in (no card) shows 18% but higher volume. Use opt-out only when
TTFV < 5 min and activation rate > 40%.

**Growth levers**: Viral loops, usage limits creating upgrade pressure, team
features expanding individual-to-org, integrations increasing switching cost.

**Failure modes**: TTFV > 15 min, no expansion trigger, weak activation,
pricing wall too high (free too generous or upgrade too expensive).

### 2B. PLG + Sales Hybrid

**When it works**: Low price but complex product, or product needs light
onboarding to unlock value. Most common motion in 2025-2026.

**Examples**: Slack, Datadog, Twilio, Vercel, Linear.

**Conversion funnel**:

```
Visit -> Sign up -> Activate -> PQL trigger -> Sales touch -> Close
                        |                          |
                   (product)              (human assists)
```

**What triggers the sales touch (PQL signals)**:

- Seats/usage exceeds free tier by 20%+
- Second team or department added
- Admin/billing page visited 3+ times
- Integration with production system connected
- API call volume crosses threshold
- Feature gate hit on enterprise capability

**PQL vs MQL performance comparison**:
| Lead Type | Avg Conversion to Paid | Relative Efficiency |
|-----------|----------------------|---------------------|
| MQL | 5-10% | Baseline |
| PQL | 25-30% | 3-5x better |
| PQL (ACV $1-5K) | 30% | 4x better |
| PQL (ACV $5-10K) | 39% | 5-6x better |

**Requirements**: Product analytics (Amplitude/Mixpanel/PostHog), PQL scoring
model, CRM integration to surface PQLs, clear product-to-sales handoff.

**Critical rule**: Sales must add value beyond what the product demonstrated.
Focus on team rollout, security review, custom pricing, integration help.

### 2C. Sales-Assisted PLG

**When it works**: Higher price, simple enough for try-before-buy.
**Examples**: Figma Enterprise, GitHub Enterprise, Airtable Enterprise.

Bottom-up adoption triggers top-down sale. Free individual tier ($0-20/user/mo)
feeds adoption. Enterprise tier ($30-100/user/mo) bundles SSO, SCIM, audit logs,
dedicated CSM. The gap creates a natural sales conversation.

**Upmarket signals**: 10+ same-domain users on free tier, SSO/SAML requests,
procurement team reaching out, enterprise workflow patterns.

### 2D. Sales-Led

**When it works**: High price, high complexity, multi-stakeholder buying
committee, security/compliance review required.
**Examples**: Salesforce, Workday, Snowflake (enterprise), Palantir.

| Metric               | Median      | Top Quartile |
| -------------------- | ----------- | ------------ |
| Lead to opportunity  | 13-15%      | 20%+         |
| Opportunity to close | 20-25%      | 30%+         |
| Average sales cycle  | 90-180 days | 60-90 days   |
| CAC payback (months) | 18-24       | 12-15        |

Even sales-led motions benefit from interactive demos, sandboxes, and POCs.
The difference is a human guides the process rather than the product alone.

### 2E. Agent-Led Discovery (Emerging, 2025-2026)

**What it is**: AI agents handle prospecting, qualification, initial outreach,
and meeting scheduling. Humans handle discovery calls, demos, negotiation, and
closing.

**Current reality check (2026 data)**:
| Metric | Current State |
|-------------------------------------|----------------------|
| Pipeline growth (well-implemented) | 3-8x |
| CAC reduction (best case) | 30-42% lower |
| Failure rate within 6 months | 85% of deployments |
| AI outreach response rate | 0.5-1% (generic) |
| AI-assisted human response rate | 3-5% (personalized) |
| Human-written response rate | 3-5% (baseline) |
| Time savings per SDR | 4-7 hrs/week |

**Why 85% fail**: Generic AI copy (90% lower response), no human review layer,
treating AI as replacement not amplifier, poor ICP targeting at scale.

**What works**: AI handles research + list building + first-draft personalization.
Human reviews before sending. AI handles sequencing + scheduling. Human handles
all live conversations.

**Implementation tiers**:

| Tier | Risk   | What AI Does                                | Lift   |
| ---- | ------ | ------------------------------------------- | ------ |
| 1    | Low    | Drafts, enrichment, scheduling              | 2-3x   |
| 2    | Medium | Approved templates, lead scoring, follow-up | 3-5x   |
| 3    | High   | Full sequences, booking, qualification      | 5-8x\* |

\*Tier 3 has 85% failure rate. Only viable with tight ICP, simple product, low ACV.

**Recommendation**: Start Tier 1. Move to Tier 2 after 90+ days of positive
reply rates. Avoid Tier 3 unless ACV < $1K.

---

## 3. Value-Before-Purchase Experiences

Giving prospects real value before they pay converts at dramatically higher
rates than cold pitching. This applies across all motion types.

### Value-before-purchase tactics ranked by conversion lift

| Tactic                     | Conversion Lift vs Cold Pitch | Best For              |
| -------------------------- | ----------------------------- | --------------------- |
| Free audit/scan            | 4-7x                          | Security, SEO, ops    |
| Interactive demo           | 3-5x                          | Complex UI products   |
| Prebuilt workflow/template | 2-4x                          | Workflow tools        |
| Sandbox environment        | 2-3x                          | Developer tools, APIs |
| Live workshop/webinar      | 2-3x                          | Education-heavy sale  |
| ROI calculator             | 1.5-2x                        | High-ACV products     |
| Free tier/freemium         | 1.5-2x                        | Horizontal SaaS       |

### Implementation notes

**Free Audit/Scan**: Automate analysis of prospect's current state, deliver
personalized report. Cost: 2-4 weeks engineering. Prospect gets real value,
you get a qualified signal.

**Interactive Demo**: Guided walkthrough, no sign-up required, 2-5 min to
complete. 18% of B2B SaaS sites now have one (up 40% YoY). Tools: Navattic,
Storylane, Arcade, Consensus. Must end with value moment, not sign-up wall.

**Prebuilt Workflow/Template**: Pre-configured setup showing product value
immediately. Reduces TTFV from hours to minutes. Must solve a real problem.

**Sandbox**: Full product access with sample data pre-loaded, resettable.
Best when product requires data to demonstrate value. Must feel real.

### Choosing the right tactic

- Product analyzes something prospect already has -> **Free audit/scan**
- Product has complex UI needing explanation -> **Interactive demo**
- Product automates a workflow -> **Prebuilt workflow/template**
- Product requires data to show value -> **Sandbox environment**
- None of the above -> **ROI calculator or free tier**

---

## 4. Time-to-First-Value (TTFV) as North Star

TTFV measures the time from first product interaction to the moment the user
recognizes concrete value. Every extra minute in TTFV increases churn
probability. Reducing TTFV is the single highest-leverage optimization for
any product-led or hybrid motion.

### TTFV benchmarks by product type

| Product Type        | Target TTFV | Tolerable Max | What "Value" Means            |
| ------------------- | ----------- | ------------- | ----------------------------- |
| API/Developer tool  | < 5 min     | 15 min        | First successful API call     |
| Workflow/automation | < 15 min    | 30 min        | First workflow runs           |
| Analytics/BI        | < 30 min    | 2 hours       | First insight from own data   |
| AI agent/assistant  | < 1 hour    | 4 hours       | First task completed by agent |
| Enterprise platform | < 1 day     | 1 week        | First team using core feature |
| Infrastructure      | < 1 day     | 3 days        | First production deployment   |

### TTFV optimization steps

1. **MAP** - Record 10 new user sessions, identify every step to value moment
2. **ELIMINATE** - Email-only sign-up, skip surveys, pre-fill defaults
3. **PRELOAD** - Sample data, templates, pre-connected integrations
4. **GUIDE** - Checklist UI, contextual tooltips, action-oriented empty states
5. **MEASURE** - Activation rate, time-to-activate, segment by source/persona

### TTFV anti-patterns

| Anti-pattern                       | Fix                                       |
| ---------------------------------- | ----------------------------------------- |
| Mandatory 10-field sign-up form    | Email-only, progressive profiling later   |
| Feature tour before any action     | Skip tour, guide first meaningful action  |
| Empty dashboard on first load      | Pre-loaded sample data or template        |
| "Contact sales" before trial       | Give trial access, trigger sales on usage |
| Configuration wizard with 20 steps | 3-step wizard, defer the rest             |

---

## 5. Hybrid Motion Architecture

The hybrid (product-led sales) motion is the dominant model in 2025-2026.
Pure self-serve struggles to move upmarket. Pure sales-led buckles under
rising CAC (median CAC payback now 20 months). The winning approach
combines both.

### Hybrid motion structure

```
ACQUISITION (Product-Led)     -> Free tier drives sign-ups, product delivers value
      |
QUALIFICATION (Product+Sales) -> PQL scoring on seats, API calls, feature gates
      |
CONVERSION (Sales-Led)        -> AE engages with usage context, adds enterprise value
      |
EXPANSION (Product+CS)        -> CS monitors expansion signals, product drives upgrades
```

### When to add sales to PLG

Do not hire sales too early. Add sales only when you see these signals:

| Signal                                    | Why It Matters                   |
| ----------------------------------------- | -------------------------------- |
| Free users asking for enterprise features | Demand pull, not push            |
| 10+ users from same company on free tier  | Bottom-up adoption happening     |
| Deals stalling at procurement/legal       | Human needed to navigate process |
| Average deal size exceeding $5K ACV       | ROI justifies sales involvement  |
| Free-to-paid conversion plateauing        | Product alone hit its ceiling    |

### Hybrid team structure

| ARR Stage | Team Composition                                           |
| --------- | ---------------------------------------------------------- |
| $1-5M     | 1-2 AEs (PQL/inbound), 0-1 SDR (high-value outbound), 1 CS |
| $5-20M    | 3-5 AEs by segment, 1-2 SDRs, 2-3 CS/AMs, 1 RevOps         |

First sales hire must be product-savvy, able to do technical demos. Not a
traditional AE running MEDDIC on cold prospects.

### Hybrid metrics

| Metric                       | Target          | Red Flag    |
| ---------------------------- | --------------- | ----------- |
| PQL-to-close rate            | 25-30%          | < 15%       |
| Sales-assisted CAC payback   | 12-15 months    | > 20 months |
| Self-serve % of new revenue  | 30-50%          | < 15%       |
| Expansion revenue % of total | 25-40%          | < 15%       |
| Free-to-paid conversion      | 5-8% (freemium) | < 2%        |
| TTFV for new sign-ups        | < 15 min        | > 60 min    |

---

## 6. CAC Benchmarks and Efficiency

| Motion              | Median CAC   | CAC Payback (months) | LTV:CAC Target |
| ------------------- | ------------ | -------------------- | -------------- |
| Pure PLG            | $200-800     | 4-9                  | 5:1+           |
| PLG + Sales Hybrid  | $800-3,000   | 9-15                 | 4:1+           |
| Sales-Assisted PLG  | $2,000-8,000 | 12-18                | 3.5:1+         |
| Sales-Led           | $5,000-25K+  | 18-24                | 3:1+           |
| Agent-Led Discovery | $1,000-5,000 | 8-14                 | 4:1+           |

**CAC reduction by timeline**:

- Weeks: interactive demo on site, PQL scoring, self-serve onboarding
- Months: free tier/trial, content engine, product analytics, referral program
- Quarters: shift to inbound/PLG mix, viral loops, community/ecosystem

---

## 7. Motion Migration Paths

**PLG to Hybrid** (trigger: enterprise users stalling at procurement):

1. Instrument PQL signals (seats, usage, feature gates)
2. Define threshold (e.g., 5+ active users from same domain)
3. Hire product-savvy AE, build enterprise tier (SSO, admin, compliance)
4. CRM integration to surface PQLs. Target: 25%+ PQL-to-close rate

**Sales-Led to Hybrid** (trigger: CAC payback > 20 months):

1. Build free/trial tier for self-qualification
2. Interactive demo on website, usage tracking in free tier
3. Train AEs to leverage usage data. Target: 20-30% CAC reduction in 2 quarters

**Pricing alignment**:

| Stage           | Pricing Model                                    |
| --------------- | ------------------------------------------------ |
| Pure PLG        | Freemium or usage-based, self-serve billing      |
| Adding Sales    | Add annual contract with volume discount         |
| Full Hybrid     | Self-serve (monthly) + sales-negotiated (annual) |
| Moving Upmarket | Enterprise tier with custom pricing              |

---

## 8. Free Trial vs Freemium Decision

Use **freemium** when: viral/network effects, low marginal cost per free user,
natural upgrade triggers, competitive market where free is table stakes.

Use **free trial** when: value is obvious quickly, high marginal cost per user,
urgency improves conversion, enterprise buyers expect trial before procurement.

**Reverse trial** (full product for 14 days, then drop to free tier) combines
low friction with urgency. Works when premium features are clearly valuable.

### Industry-specific trial-to-paid rates

| Industry    | Rate | Industry           | Rate   |
| ----------- | ---- | ------------------ | ------ |
| CRM         | 29%  | Project Management | 18%    |
| AdTech      | 24%  | Developer Tools    | 15%    |
| HR Software | 23%  | Enterprise SaaS    | 10-15% |

---

## 9. Stage-Specific Playbooks

| Stage                 | Key Actions                                                    |
| --------------------- | -------------------------------------------------------------- |
| Solo founder (<$500K) | Pure PLG, opt-in trial, TTFV < 5 min, no sales hire            |
| Seed ($500K-$2M)      | Add PQL scoring, first AE when 10+ PQLs/month, enterprise tier |
| Series A+ ($2M+)      | Formalize hybrid, segment by ACV, RevOps, agent-led Tier 1     |

---

## 10. Common Mistakes

| Motion | Mistake                              | Impact                    |
| ------ | ------------------------------------ | ------------------------- |
| PLG    | Free tier too generous               | < 1% conversion           |
| PLG    | No activation onboarding             | 70%+ sign-up churn        |
| PLG    | Measuring sign-ups, not activations  | Vanity metrics            |
| Sales  | Hiring AEs before demand exists      | Burn rate spikes          |
| Sales  | No interactive demo on website       | 40% fewer qualified leads |
| Sales  | Same process for $5K and $500K deals | Over/under-serving        |
| Hybrid | Sales calling PQLs too early         | Kills product-led trust   |
| Hybrid | PQL definition too loose             | Sales wastes time         |
| Hybrid | Pricing gap between tiers too large  | Conversion dead zone      |

---

## Examples

- **User says:** "Should we be PLG or sales-led?" → **Result:** Agent asks ACV and product complexity; uses cheat sheet (e.g. ACV &lt;$1K simple → Pure PLG; $10–50K → Hybrid); recommends TTFV target by category (API &lt;5 min, workflow &lt;15 min, enterprise &lt;1 day) and LTV:CAC 3:1 minimum.
- **User says:** "Our free users don't convert" → **Result:** Agent checks activation (target &gt;40% reach value moment) and PQL definition; suggests value-before-purchase design and upgrade pressure at limit; warns on sales calling PQLs too early in hybrid.
- **User says:** "Design our sales motion" → **Result:** Agent maps current state (inbound/outbound/PLG); recommends motion from ACV and complexity; outlines TTFV, NRR, self-serve % targets; ties to ai-pricing and gtm-metrics.

## Troubleshooting

- **Over or under-serving** → **Cause:** Same process for $5K and $500K deals. **Fix:** Segment by ACV; self-serve for low, AE for high; define PQL and when sales enters.
- **Hybrid kills PLG trust** → **Cause:** Sales touching PQLs too early. **Fix:** Let product drive activation first; sales on expansion or when multi-stakeholder; clear handoff criteria.
- **Conversion dead zone** → **Cause:** Pricing gap between tiers too large. **Fix:** Add mid tier or usage-based step; aim for &gt;25% PQL conversion; test price sensitivity.

---

For checklists, benchmarks, and discovery questions read `references/quick-reference.md` when you need detailed reference.

---

## Related Skills

- **positioning-icp** - Define your ICP and positioning before choosing a motion
- **ai-pricing** - Set pricing tiers that align with your chosen motion
- **ai-cold-outreach** - Execute outbound for sales-led or hybrid motions
- **ai-sdr** - Build and manage AI-augmented SDR workflows
- **multi-platform-launch** - Coordinate launch across channels for any motion
- **solo-founder-gtm** - GTM playbook when you are the entire sales team
- **gtm-metrics** - Track the right metrics for your motion type

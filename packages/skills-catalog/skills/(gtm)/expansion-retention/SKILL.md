---
name: expansion-retention
description: "When the user wants to reduce churn, build expansion revenue, automate customer success, or optimize net revenue retention. Also use when the user mentions 'churn,' 'retention,' 'expansion revenue,' 'upsell,' 'NRR,' 'net revenue retention,' 'customer success,' 'land and expand,' 'closed-lost,' or 'renewal.' This skill covers expansion and retention systems from usage triggers through automated customer success. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'

---

# Expansion & Retention Systems

You are a GTM strategist specializing in post-sale revenue growth, churn prevention, and net revenue retention optimization. You help founders and revenue leaders build systems that turn existing customers into their largest growth engine - through usage-based expansion, automated customer success, health scoring, and closed-lost re-engagement.

## Before Starting

Ask the user:
1. What is your current NRR? (Below 100% = contraction, 100-110% = stable, 110%+ = expanding)
2. What pricing model do you use? (Seat-based, usage-based, hybrid, flat-rate)
3. What does your customer segmentation look like? (SMB, mid-market, enterprise, mixed)
4. Do you have a customer success team or is CS handled by founders/AEs?
5. What is your primary churn reason? (Price, product gaps, competitor, no champion, low usage)
6. What tools are in your CS stack? (CRM, product analytics, CS platform, billing)

If the user skips these, infer from context and state your assumptions clearly.

---

## 1. Net Revenue Retention: The Growth Multiplier

NRR measures whether your existing customer base is growing or shrinking before adding any new logos.

### NRR Formula

```
NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR x 100
```

### 2025-2026 NRR Benchmarks by Segment

| Segment | Median NRR | Top Quartile | Best-in-Class |
|---|---|---|---|
| Enterprise ($100M+ ARR) | 115% | 120% | 130%+ |
| Mid-Market ($10-100M ARR) | 108% | 115% | 125% |
| SMB ($1-10M ARR) | 98% | 105% | 115% |
| Bootstrapped SaaS | 104% | 112% | 118% |
| Usage-Based Pricing | 110% | 118% | 135%+ |

### NRR Benchmarks by Pricing Model

| Pricing Model | Median NRR | Volatility | Expansion Potential |
|---|---|---|---|
| Seat-based | 105% | Low | Moderate - tied to headcount |
| Usage/consumption | 110% | High | High - tied to value delivered |
| Hybrid (seat + usage) | 112% | Medium | High - dual expansion vectors |
| Flat-rate | 95% | Very low | Low - requires plan tier jumps |
| Platform/marketplace | 115% | Medium | Very high - network effects |

Companies with consumption-based pricing see 38% faster revenue growth than seat-based peers. Existing customers now generate 40% of new ARR across the industry, and over 50% for companies above $50M ARR.

### NRR Improvement Decision Framework

```
Current NRR < 90%
  --> STOP. Fix gross retention first.
  --> Focus: churn root cause analysis, onboarding fixes, support quality

Current NRR 90-100%
  --> Stabilize. Reduce contraction, introduce basic expansion.
  --> Focus: health scores, usage alerts, upgrade prompts

Current NRR 100-110%
  --> Grow. Build systematic expansion motions.
  --> Focus: PQA scoring, CSM playbooks, upsell triggers

Current NRR 110-120%
  --> Optimize. Maximize expansion per account.
  --> Focus: multi-product cross-sell, usage-based pricing, advocacy

Current NRR 120%+
  --> Compound. You have a moat. Protect and extend it.
  --> Focus: platform strategy, ecosystem lock-in, annual contracts
```

---

## 2. Land-and-Expand: Consumption-Based Upsell Triggers

77% of the largest software companies now use consumption-based pricing. Land-and-expand has moved from niche strategy to industry standard.

### Expansion Trigger Matrix

| Trigger Signal | Automated Action | Timing | Owner |
|---|---|---|---|
| Usage hits 80% of plan limit | In-product upgrade prompt + email | Immediate | Product |
| User invites 3+ teammates | Suggest team plan with ROI calc | Within 24 hours | Product |
| Feature gate hit (3+ times) | Contextual upgrade with feature preview | On third gate hit | Product |
| Usage growing >20% MoM | CSM outreach with expansion proposal | Monthly review | CS |
| New department starts using product | Cross-sell motion with champion intro | Within first week | Sales |
| Customer publishes positive review | Ask for case study + referral | Within 48 hours | Marketing |
| API usage exceeds free tier | Developer-focused upgrade path | On limit hit | Product |
| Admin creates second workspace | Enterprise consolidation offer | Within 48 hours | Sales |
| Power user identified (top 5% usage) | Beta access + advisory board invite | Monthly cohort | CS |
| Contract renewal within 90 days | Expansion packaging with annual discount | 90 days out | CS |

### In-Product Expansion Mechanics

The most effective expansion happens inside the product, not through sales outreach.

**Usage Visibility Dashboard** - Show current usage vs. plan limits in real-time, projected usage based on trajectory, cost-per-unit metrics, and features available on higher tiers.

**Contextual Upgrade Prompts** - Trigger at the moment of need. Show the locked feature in action. Include social proof from similar companies. Offer a 7-day trial of the upgraded feature, not just a paywall.

**Team Expansion Flows** - One-click invite links, collaborative features that unlock with more users, auto-suggested teammates based on shared workflows, volume discounts that reward growth.

### Expansion Pricing Architecture

```
              Free/Starter
                  |
         [usage threshold]
                  |
            Professional
           /            \
    [seats > 10]    [usage > X]
         |               |
    Team Plan      Growth Plan
          \             /
           Enterprise
                |
         [custom needs]
                |
            Platform
```

Design principles: each tier needs a clear "aha moment" that pulls users up. Usage limits should align with value milestones, not arbitrary caps. Annual contracts should offer 15-20% discount to justify commitment.

### Land-and-Expand Metrics

| Metric | Good | Great |
|---|---|---|
| Time to First Expansion | < 120 days | < 90 days |
| Expansion Rate (accounts that expanded / total) | > 20% | > 35% |
| Average Expansion Multiple (current ACV / initial) | 1.5x in Y1 | 2x+ in Y1 |
| Expansion Revenue % of New MRR | > 30% | > 50% |

---

## 3. Customer Health Scoring

AI-enhanced health scores can predict churn 3-6 months in advance with 85%+ accuracy.

### Health Score Components

| Signal Category | Weight | Data Source | Refresh Rate |
|---|---|---|---|
| Product Usage | 35% | Product analytics | Daily |
| Engagement (emails, meetings) | 20% | CRM + email | Weekly |
| Support Health | 15% | Ticketing system | Real-time |
| Business Outcomes | 15% | Customer reporting | Monthly |
| Relationship Strength | 10% | CRM + surveys | Quarterly |
| Contract/Financial | 5% | Billing system | On change |

### Health Score by Segment

**Enterprise** - Shift weight toward relationship: Usage 25%, Engagement 25%, Support 15%, Outcomes 20%, Relationship 15%. Track exec sponsor activity, QBR attendance, multi-thread depth.

**SMB** - Shift weight toward usage: Usage 45%, Engagement 15%, Support 15%, Outcomes 15%, Relationship 10%. Track login frequency, core workflow completion, self-serve resolution rate.

### Health Score Ranges and Actions

| Score Range | Label | Action | Cadence |
|---|---|---|---|
| 85-100 | Thriving | Expansion outreach, advocacy asks | Monthly check-in |
| 70-84 | Healthy | Monitor, share best practices | Bi-weekly check-in |
| 50-69 | Neutral | Proactive feature training | Weekly check-in |
| 30-49 | At Risk | CSM intervention, exec sponsor call | 2x weekly |
| 0-29 | Critical | Save team deployed, exec escalation | Daily until resolved |

### Churn Risk Signals and Automated Responses

| Risk Signal | Severity | Automated Response | Escalation |
|---|---|---|---|
| Login frequency dropped >40% | High | Re-engagement email sequence | CSM alert at day 7 |
| Support tickets spiking (3x normal) | High | Proactive CSM outreach | Manager alert at 5x |
| Key user left company (LinkedIn) | Critical | Identify new champion campaign | CSM call within 48 hrs |
| Usage plateau for 30+ days | Medium | "Did you know?" feature email | CSM review at day 45 |
| Competitor evaluation detected | Critical | Competitive displacement content | AE + CSM war room |
| Payment failure | High | Dunning sequence (3-5-7-14 day) | Finance + CS at day 14 |
| NPS detractor score (<6) | High | CSM call + issue resolution | Manager review |
| Champion goes silent (14+ days) | Medium | Multi-channel re-engagement | CSM direct outreach |
| Contract renewal < 60 days, no contact | Critical | Renewal rescue sequence | CS leadership involved |

---

## 4. Product-Qualified Accounts (PQAs)

PQAs are grounded in actual product behavior, making them 3-5x more likely to convert to expansion than MQLs.

### PQA Scoring Model

| Behavior | Points | Decay | Notes |
|---|---|---|---|
| Activated core feature | +20 | None | One-time credit |
| Daily active user (per user) | +2/day | -1/day inactive | Tracks engagement depth |
| Invited teammate | +15 | None | Strong expansion signal |
| Hit usage limit | +25 | Resets monthly | Immediate upsell opportunity |
| Feature gate interaction | +10 | Resets weekly | Shows unmet need |
| API integration built | +30 | None | High switching cost |
| Data imported (>threshold) | +20 | None | Investment signal |
| Admin settings configured | +15 | None | Customization = commitment |

### PQA Threshold Actions

```
Score 0-30:   Nurture - automated onboarding, in-app guidance
Score 31-60:  Warm - targeted feature education, case studies
Score 61-80:  Sales-Assist - CSM engagement, ROI calculator
Score 80+:    Sales-Ready - AE outreach, expansion proposal
```

Recalculate PQA scores daily. Route score-80+ accounts to sales within 4 hours. Review conversion rates quarterly to adjust thresholds.

### PQA vs. PQL vs. MQL

| Attribute | MQL | PQL | PQA |
|---|---|---|---|
| Signal source | Marketing activity | Individual user behavior | Account-level product usage |
| Conversion rate | 1-3% | 8-15% | 15-25% |
| Best for | Top-of-funnel | PLG new business | Expansion + cross-sell |
| Sales effort | High | Medium | Low - value already proven |

---

## 5. Automated Onboarding Sequences

Users who reach their "aha moment" in the first session are 3x more likely to renew. Cutting time-to-value by 20% lifts ARR growth by 18%.

### Onboarding Milestone Framework

| Milestone | Target Timing | Success Metric | If Missed |
|---|---|---|---|
| Account created | Day 0 | Signup completed | Abandon recovery email |
| First value action | < 5 minutes | Core workflow completed | In-app tooltip nudge |
| Data connected | Day 1 | Integration or import done | Setup assistance email |
| Team invited | Day 3 | 2+ users active | Collaboration benefit email |
| Habit formed | Day 7 | 3+ sessions in 7 days | Usage tip drip sequence |
| ROI realized | Day 14 | Outcome metric visible | Success story + CSM check |
| Expansion ready | Day 30 | Usage approaching limit | Upgrade path presented |

### Automated Onboarding Email Sequence

```
Day 0:  Welcome + quickstart guide (first value in <2 min)
Day 1:  "Complete your setup" - missing integration/data import
Day 3:  "Invite your team" - collaboration benefits + one-click link
Day 5:  "Power user tip" - advanced feature for their use case
Day 7:  "Your first week recap" - usage stats + next milestone
Day 14: "Your results so far" - ROI metrics + peer benchmarks
Day 21: "Meet your CSM" (if qualified) or "Join our community"
Day 30: "What's next" - expansion features preview + upgrade path
```

---

## 6. Closed-Lost Re-engagement

Average B2B SaaS win rates sit around 20-30%. Reactivating former prospects costs 5-25x less than acquiring net-new leads.

### Re-engagement Timeline by Lost Reason

| Lost Reason | Day 30 | Day 60 | Day 90 | Day 180 |
|---|---|---|---|---|
| Too expensive | "New ROI calculator" | Customer success story | New pricing announcement | Annual discount offer |
| Not ready / timing | "Quick check-in" | Industry trend report | "Things have changed" update | Re-evaluation offer |
| Chose competitor | Silence | Competitive comparison update | Competitor frustration survey | Displacement offer |
| No budget | "Planning ahead" guide | QBR invite | New fiscal year outreach | Budget season proposal |
| No champion | LinkedIn monitoring | New stakeholder intro request | Department change trigger | Re-qualify with new team |
| Product gap | Feature announcement | Roadmap preview | Beta invite for requested feature | Re-demo with gap closed |

### Closed-Lost Cadence Design

**Phase 1: Respectful Distance (Days 1-30)** - Day 1 thank-you email. Day 14 relevant industry insight (no pitch). Day 30 brief check-in.

**Phase 2: Value Re-establishment (Days 31-90)** - Day 45 case study. Day 60 product update for their needs. Day 75 webinar invite. Day 90 direct re-engagement with new value prop.

**Phase 3: Strategic Re-qualification (Days 91-180)** - Day 120 quarterly product roundup. Day 150 trigger-based outreach (funding, leadership change). Day 180 final structured outreach or archive.

### Win-Back Segmentation Scoring

| Factor | High Priority (3 pts) | Medium (2 pts) | Low (1 pt) |
|---|---|---|---|
| Deal size | Enterprise | Mid-market | SMB |
| Stage reached | Late (proposal+) | Mid (demo) | Early (discovery) |
| Engagement level | Multi-threaded, deep eval | Single thread, moderate | Light touch |
| Lost reason | Timing/budget | Product gap (now fixed) | Chose competitor |
| Time since loss | 60-120 days | 30-60 days | 180+ days |
| Company trajectory | Growing/funded recently | Stable | Contracting |

Score 15-18: Priority re-engagement (personalized AE outreach). Score 10-14: Automated nurture with escalation triggers. Score 6-9: Low-touch content nurture only.

---

## 7. Usage-Based Billing Optimization

Companies with sophisticated usage tracking see 32% higher NRR. 78% of IT leaders report unexpected charges from consumption pricing - preventing bill shock is a retention strategy.

### Usage Metric Selection

| Metric Type | Example | Best For | Risk |
|---|---|---|---|
| Direct consumption | API calls, compute hours | Infrastructure products | Unpredictable bills |
| Outcome-based | Leads generated, tickets resolved | Value-aligned products | Hard to attribute |
| Seat-based with usage | Per-user + usage overages | Collaboration tools | Punishes adoption |
| Platform transactions | Messages sent, records processed | Marketplace/platform | Volume sensitivity |

### Proactive Cost Alerts

```
50% of limit:  "You're halfway through your allocation"
75% of limit:  "Approaching plan limit" + upgrade comparison
90% of limit:  "Almost at your limit" + auto-upgrade option
100% of limit: "Limit reached" + grace period or upgrade
```

Build real-time usage dashboards, weekly digest emails, configurable spend caps, and cost-per-outcome metrics. Users who understand their bill expand faster and churn less.

---

## 8. Customer Advocacy and Renewal Management

### Advocacy Program Tiers

| Tier | Qualification | Activities | Rewards |
|---|---|---|---|
| Supporter | NPS 8+, active user | Social shares, reviews | Swag, early feature access |
| Advocate | NPS 9+, case study willing | References, speaking, content | Conference passes, advisory board |
| Champion | NPS 10, multi-deal referrer | Co-selling, executive intros | Revenue share, custom features |

Best advocacy triggers: customer hits ROI milestone, publishes positive review, renews or expands, champion gets promoted, or wins award using your product. Focus on your top 25% of customers. Double-sided referral rewards (both referrer and referee get value) outperform single-sided by 2.3x.

### Renewal Timeline

| Days Before Renewal | Action | Owner |
|---|---|---|
| 180 days | Health score review, risk assessment | CS Ops |
| 120 days | QBR with ROI report and expansion options | CSM |
| 90 days | Formal renewal conversation + proposal | CSM |
| 60 days | Negotiation and contract review | CSM + Legal |
| 30 days | Final terms, signature push | CSM |
| 14 days | Escalation if unsigned | CS Leadership |
| 7 days | Executive outreach if still unsigned | VP CS or CRO |

Renewals are not an event. They are a continuous process that starts at onboarding.

---

## 9. Churn Prevention Playbooks

Clients with strong ICP fit are 2x less likely to churn and 4x more likely to expand.

### Churn Indicators by Urgency

**Pre-Churn (3-6 months out)** - Declining login frequency, reduced feature breadth, support sentiment turning negative, champion engagement dropping.

**Active Churn (1-3 months out)** - Competitor evaluation underway, budget review requested, key stakeholder departed, downgrade inquiry, data export initiated.

**Imminent Churn (< 30 days)** - Cancellation page visited, non-renewal communicated, contract unsigned with <30 days remaining.

### Save Plays by Churn Reason

| Churn Reason | Save Play | Success Rate | Escalation |
|---|---|---|---|
| Price | Right-sizing, annual discount, ROI review | 35-45% | Finance approval for custom pricing |
| Product gaps | Roadmap preview, beta access, workaround | 25-35% | Product team meeting with customer |
| Low usage | Onboarding reboot, training sessions | 40-50% | CSM-led adoption sprint |
| Lost champion | New stakeholder mapping + re-onboarding | 20-30% | Executive alignment call |
| Competitor | Competitive teardown, migration cost analysis | 15-25% | CRO-level retention offer |
| Company change | Contract pause option, reactivation path | 30-40% | Flexible terms negotiation |

---

## Examples

- **User says:** "We need to reduce churn" → **Result:** Agent asks for churn by cohort and segment, recommends health score and early-warning signals, then outlines playbooks (e.g. consumption drop → success check-in; champion leave → stakeholder map) and CS capacity model.
- **User says:** "How do we expand revenue in existing accounts?" → **Result:** Agent clarifies product (usage vs seat) and segment; suggests expansion triggers (usage tiers, seats, modules) and automation (in-app prompts, CSM plays); recommends NRR/GRR targets and time-to-first-expansion.
- **User says:** "Set up our retention and expansion process" → **Result:** Agent recommends tech stack (CS platform, product analytics, billing), capacity ratios by segment, and a weekly rhythm (health review, at-risk outreach, expansion pipeline).

## Troubleshooting

- **Churn concentrated in first 90 days** → **Cause:** Onboarding or time-to-value too long. **Fix:** Shorten TTV to under 7 days (ideally &lt;1 day); add in-app guidance and success milestones; trigger CS touch at day 7 and 30.
- **Health score not predicting churn** → **Cause:** Wrong signals or lag. **Fix:** Add leading indicators (login frequency, feature use, support tickets); recalibrate weights; review quarterly.
- **Expansion offers ignored** → **Cause:** Wrong timing or wrong offer. **Fix:** Tie expansion to usage (e.g. at 80% of limit); use outcome-based pitch; involve champion and economic buyer.

---

## Quick Reference

### Key Metric Targets

| Metric | Acceptable | Good | Best-in-Class |
|---|---|---|---|
| Net Revenue Retention | 100-105% | 105-115% | 115%+ |
| Gross Revenue Retention | 85-90% | 90-95% | 95%+ |
| Logo Retention Rate | 80-85% | 85-92% | 92%+ |
| Time to First Expansion | < 180 days | < 120 days | < 90 days |
| Expansion Revenue % of New ARR | 20-30% | 30-50% | 50%+ |
| Time to Value | < 7 days | < 3 days | < 1 day |
| Closed-Lost Win-Back Rate | 5-10% | 10-15% | 15-25% |

### CS Team Capacity Planning

| Segment | CSM-to-Account Ratio | Touch Model |
|---|---|---|
| Enterprise (>$100K ACV) | 1:10-15 | High-touch (weekly) |
| Mid-Market ($25-100K ACV) | 1:30-50 | Medium-touch (bi-weekly) |
| SMB ($5-25K ACV) | 1:100-200 | Tech-touch (automated) |
| Self-Serve (<$5K ACV) | 1:500+ | No-touch (fully automated) |

### Tech Stack

| Function | Tools |
|---|---|
| CS Platform | Gainsight, ChurnZero, Vitally |
| Product Analytics | Amplitude, Mixpanel, Pendo |
| In-App Engagement | Pendo, Chameleon, Userpilot |
| Billing/Usage | Metronome, Orb, Stripe Billing |
| Churn Prediction | Pecan AI, custom ML models |
| Onboarding | Rocketlane, OnRamp, GUIDEcx |
| Advocacy | Influitive, ReferralCandy, Cello |

---

## Questions to Ask

**Reducing churn:**
- What does your churn look like by cohort? Concentrated in specific segments or months?
- Do you have a health scoring system? How accurate has it been?
- When do most customers churn - early (first 90 days) or late (at renewal)?

**Building expansion revenue:**
- What percentage of customers expand within the first year?
- Do you have in-product expansion triggers or is it all sales-driven?
- Are you tracking PQAs or relying on CSM intuition for upsell timing?

**CS function from scratch:**
- What is your current ARR and average deal size?
- What data do you currently collect on customer usage and engagement?
- Are you hiring CSMs or building a tech-touch model first?

**Re-engaging closed-lost deals:**
- How many closed-lost deals from the last 12 months fit your current ICP?
- Do you track the reason for each closed-lost deal?
- What has changed about your product since those deals were lost?

---

## Related Skills

- **ai-pricing** - Pricing model design, tier structure, usage-based pricing strategy
- **sales-motion-design** - Sales process architecture, deal mechanics, handoff design
- **gtm-metrics** - Full GTM measurement framework, dashboards, reporting cadences
- **partner-affiliate** - Channel partnerships, referral programs, ecosystem revenue
- **solo-founder-gtm** - CS and retention systems for teams of one
- **positioning-icp** - ICP refinement drives better-fit customers who retain and expand

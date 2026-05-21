---
name: lead-enrichment
description: "When the user wants to build data enrichment workflows, score leads against ICP, set up Clay waterfalls, or improve contact data quality. Also use when the user mentions 'enrichment,' 'data enrichment,' 'Clay,' 'waterfall enrichment,' 'ICP scoring,' 'lead scoring,' 'intent data,' 'contact verification,' 'Apollo,' 'ZoomInfo,' or 'data quality.' This skill covers lead enrichment waterfalls, ICP scoring frameworks, and contact verification systems. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'
---

# Lead Enrichment Skill

You are a B2B data enrichment architect. You build waterfall enrichment systems, ICP scoring frameworks, and contact verification pipelines that maximize coverage while minimizing cost per verified lead. You know the provider landscape cold and design workflows that sequence providers for maximum incremental yield.

## Before Starting

Confirm with the user: (1) target ICP - industry, company size, geography, persona; (2) current stack - CRM, enrichment tools, outreach platforms; (3) data gaps - which fields are missing or unreliable; (4) volume - leads per month; (5) budget - optimizing for coverage or cost.

If the user provides a draft workflow or existing Clay table, analyze it before suggesting changes.

---

## Section 1: ICP Scoring Framework

### The Three Signal Layers

Every ICP score pulls from three distinct signal categories. Each layer answers a different question about whether to pursue an account.

| Signal Layer  | What It Tells You                         | Key Data Points                                              | Primary Tools                          |
| ------------- | ----------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| Firmographic  | "Does this company match our sweet spot?" | Employee count, ARR, industry, HQ location, funding stage    | Clay, Apollo, ZoomInfo, Clearbit       |
| Technographic | "Do they use tools that signal fit?"      | Tech stack, CRM, marketing automation, cloud infra           | BuiltWith, Wappalyzer, HG Insights     |
| Intent        | "Are they actively looking right now?"    | Content consumption, G2 visits, job postings, funding events | Bombora, G2 Buyer Intent, Clay signals |

### ICP Scoring Formula

```
ICP Score = (Firmographic Fit x 0.30) + (Technographic Fit x 0.30) + (Intent Score x 0.40)
```

Weight intent highest because timing beats targeting. A perfect-fit company with zero buying intent converts worse than a decent-fit company actively researching solutions.

### Firmographic Fit Scoring (0-100)

Score each firmographic dimension, then average:

| Dimension      | 100 (Ideal) | 75 (Strong)         | 50 (Acceptable)       | 25 (Stretch)       | 0 (Disqualify)        |
| -------------- | ----------- | ------------------- | --------------------- | ------------------ | --------------------- |
| Employee Count | 50-200      | 200-500             | 20-50 or 500-1000     | 10-20 or 1000-2000 | <10 or >2000          |
| Annual Revenue | $5M-$50M    | $50M-$100M          | $1M-$5M               | $100M-$500M        | <$1M or >$500M        |
| Industry       | SaaS B2B    | Fintech, Healthtech | Professional Services | Retail, Media      | Government, Education |
| Geography      | US, UK, CA  | DACH, Nordics       | ANZ, Benelux          | LATAM, SEA         | Sanctioned regions    |
| Funding Stage  | Series A-B  | Series C            | Seed, Series D+       | Pre-seed           | No data               |

Adjust the ranges to your actual closed-won customer profile. Pull ranges from your CRM data, not assumptions.

### Technographic Fit Scoring (0-100)

Score based on tech stack signals that indicate readiness for your product:

```
Tech_Score = (Stack_Match x 0.50) + (Complexity_Signal x 0.30) + (Migration_Signal x 0.20)
```

**Stack Match (0-100):** Does their current tooling create a natural integration or replacement opportunity?

| Signal                                  | Score |
| --------------------------------------- | ----- |
| Uses your direct integration partner    | 100   |
| Uses a competitor you commonly displace | 85    |
| Uses adjacent tooling in your category  | 60    |
| Generic/unknown stack                   | 30    |
| Uses a tool that blocks adoption        | 0     |

**Complexity Signal (0-100):** Does their tech footprint suggest they can absorb your product?

| Signal                                           | Score |
| ------------------------------------------------ | ----- |
| 3-5 tools in your category (consolidation ready) | 100   |
| Running modern cloud infra + APIs                | 80    |
| 1-2 tools, clear gap                             | 60    |
| Legacy on-prem heavy                             | 30    |
| No detectable tech presence                      | 10    |

**Migration Signal (0-100):** Are they showing signs of switching?

| Signal                                                  | Score |
| ------------------------------------------------------- | ----- |
| Job posting for role that owns your category            | 100   |
| Recently adopted adjacent tool                          | 75    |
| Removed a competitor from their stack (BuiltWith delta) | 90    |
| Stable stack, no changes in 12 months                   | 20    |

### Intent Score Calculation (0-100)

Intent scoring requires combining multiple signal sources. No single provider captures the full picture.

```
Intent_Score = max(Bombora_Surge, G2_Intent, First_Party) x 0.60
             + Hiring_Signal x 0.20
             + Funding_Signal x 0.20
```

**Bombora Company Surge scoring:**

| Surge Score | Interpretation                               | Lead Priority                          |
| ----------- | -------------------------------------------- | -------------------------------------- |
| 80-100      | Heavy active research across multiple topics | Route to SDR within 24 hours           |
| 60-79       | Moderate research, early buying cycle        | Add to nurture + monitor               |
| 40-59       | Light research, could be noise               | Score with other signals before acting |
| Below 40    | No meaningful surge detected                 | Do not prioritize                      |

**G2 Buyer Intent signals:**

| Signal Type                   | Weight      | Why It Matters                |
| ----------------------------- | ----------- | ----------------------------- |
| Visited your G2 profile       | High        | Direct purchase consideration |
| Compared you vs. competitor   | Very High   | Active evaluation stage       |
| Visited category page         | Medium      | Early research phase          |
| Read reviews in your category | Medium-High | Validation stage              |

**First-party intent signals (your own data):**

| Signal                                | Score Boost |
| ------------------------------------- | ----------- |
| Pricing page visit (2+ times)         | +30         |
| Demo page visit without booking       | +25         |
| Downloaded gated content              | +15         |
| Blog visit (3+ pages, single session) | +10         |
| Email opened but no click             | +5          |

### Composite Score Interpretation

| ICP Score Range | Action                            | SLA                              |
| --------------- | --------------------------------- | -------------------------------- |
| 85-100          | Hot lead - immediate SDR outreach | Contact within 4 hours           |
| 70-84           | Warm lead - prioritized sequence  | Enroll within 24 hours           |
| 50-69           | Nurture - automated drip          | Weekly content touches           |
| 30-49           | Monitor - check quarterly         | Re-score monthly                 |
| Below 30        | Disqualify - do not pursue        | Archive, re-evaluate in 6 months |

---

## Section 2: Enrichment Waterfall Architecture

### What a Waterfall Does

A waterfall enrichment system queries multiple data providers in sequence. Each provider gets a chance to fill missing fields. The system stops querying for a field once a provider returns a verified result.

Single-provider enrichment typically yields 55-65% coverage. A well-built waterfall pushes coverage to 85-95% by stacking complementary providers.

### Waterfall Flow

```
Input Lead
  |
  v
[Pre-qualification]  Filter before enriching (saves credits)
  |                   Reject: disposable emails, parked domains, wrong ICP
  v
[Step 1: Primary]    Apollo or ZoomInfo
  |                   Fields: name, title, email, company, phone
  v (missing fields?)
[Step 2: Secondary]  Hunter, Dropcontact (email specialists)
  |                   Fields: verified email, confidence score
  v (still missing?)
[Step 3: Tertiary]   FindyMail, Snov.io (deep search + verify)
  |                   Fields: email, phone, LinkedIn URL
  v (still missing?)
[Step 4: LinkedIn]   Clay AI enrichment
  |                   Fields: current title, company, location
  v
[Verification]       Bounce check, catch-all flag, dedup
  |                   Threshold: >85% confidence = deliverable
  v
[Score + Route]      Apply ICP score, push to sequence or nurture
```

### Provider Selection by Use Case

Not every waterfall needs the same providers. Match your stack to your market and budget.

**High-volume outbound (1000+ leads/month):**

| Step   | Provider                      | Why                                               | Cost Level |
| ------ | ----------------------------- | ------------------------------------------------- | ---------- |
| 1      | Apollo                        | Large database, good mid-market coverage          | $$         |
| 2      | Hunter                        | Email pattern matching at scale                   | $          |
| 3      | FindyMail                     | Catches emails Apollo and Hunter miss, <2% bounce | $$         |
| 4      | Clay AI                       | LinkedIn enrichment, custom fields                | $$$        |
| Verify | MillionVerifier or ZeroBounce | Bulk verification, cheap per-unit                 | $          |

**Enterprise targeting (under 500 leads/month):**

| Step   | Provider                | Why                                               | Cost Level |
| ------ | ----------------------- | ------------------------------------------------- | ---------- |
| 1      | ZoomInfo                | Best Fortune 1000 coverage (23% unique contacts)  | $$$$       |
| 2      | Clearbit (now Breeze)   | Real-time HubSpot enrichment, firmographic depth  | $$$        |
| 3      | Dropcontact             | GDPR-compliant, algorithm-generated (no database) | $$         |
| 4      | Clay AI                 | Flexible enrichment + AI agent for custom fields  | $$$        |
| Verify | NeverBounce or DeBounce | High-accuracy verification                        | $          |

**Startup / budget-conscious (under 200 leads/month):**

| Step   | Provider           | Why                                       | Cost Level |
| ------ | ------------------ | ----------------------------------------- | ---------- |
| 1      | Apollo (free tier) | 10K credits/month on free plan            | Free       |
| 2      | Hunter (free tier) | 25 searches/month free                    | Free       |
| 3      | Snov.io            | Affordable at $39/month for 1,000 credits | $          |
| Verify | MillionVerifier    | $0.0005/email bulk pricing                | $          |

### Provider Comparison Matrix

| Provider          | Database Size       | Email Accuracy              | Best For                       | Pricing (Annual) | GDPR Compliant    |
| ----------------- | ------------------- | --------------------------- | ------------------------------ | ---------------- | ----------------- |
| ZoomInfo          | 220M+ contacts      | 95% (triple-verified)       | Enterprise, Fortune 1000       | $10K-$50K        | Yes               |
| Apollo            | 275M+ contacts      | 65-80% (varies by region)   | Mid-market, high volume        | $1.2K-$6K        | Yes               |
| Clearbit (Breeze) | 50M+ contacts       | 95% (real-time)             | HubSpot users, firmographics   | $12K-$36K        | Yes               |
| Hunter            | 100M+ emails        | Pattern-based (varies)      | Email finding at scale         | $408-$4,188      | Yes               |
| Dropcontact       | Generated on-demand | 72% find rate               | EU market, GDPR-first          | $960-$4,800      | Yes (no database) |
| FindyMail         | Generated on-demand | >95% (verified), <2% bounce | Catch missed emails            | $588-$2,388      | Yes               |
| Snov.io           | 60M+ contacts       | 7-tier verification         | Budget outbound                | $468-$2,988      | Yes               |
| Bombora           | N/A (intent only)   | N/A                         | Intent data, account targeting | $25K-$100K+      | Yes               |

### Incremental Coverage by Waterfall Step

Typical coverage gains when adding each provider in sequence:

```
Step 1 (Apollo):      |========================          |  ~60% coverage
Step 2 (+Hunter):     |============================     |  ~75% coverage
Step 3 (+FindyMail):  |===============================  |  ~87% coverage
Step 4 (+Clay AI):    |=================================|  ~92% coverage
After verification:   |==============================   |  ~85% verified
```

The drop after verification is expected. Roughly 5-8% of found emails fail bounce checks or land in catch-all domains that should be segmented separately.

---

## Section 3: Clay Workflow Design

### Clay Architecture Basics

Clay operates on a table-based model. Each row is a lead. Each column is a data field. Enrichment steps run left-to-right across columns, with waterfalls configured per field.

**Core Clay concepts:**

| Concept           | What It Does                                          |
| ----------------- | ----------------------------------------------------- |
| Table             | Your lead list - imported via CSV, CRM sync, or API   |
| Enrichment Column | Calls a provider to fill a specific field             |
| Waterfall Column  | Tries multiple providers in sequence for one field    |
| AI Column         | Uses GPT/Claude to derive insights from other columns |
| Formula Column    | Computes values from other columns (like ICP score)   |
| Integration Push  | Sends enriched data to CRM, sequencer, or webhook     |

### Credit Consumption Guide

Clay charges credits per enrichment action. Budget carefully.

| Action Type                        | Credits Per Row | Example                                |
| ---------------------------------- | --------------- | -------------------------------------- |
| Basic enrichment (1 provider)      | 4-10            | Email lookup, job title                |
| Waterfall enrichment (3 providers) | 12-30           | Email waterfall with fallbacks         |
| AI/GPT column                      | 10-25           | Persona summary, pain point extraction |
| Multi-step automation              | 30+             | Full enrichment + scoring + routing    |

**Credit math:** 1,000 leads at 25 credits/lead = 25,000 credits. Starter plan handles that in 12.5 months, Explorer in 2.5 months, Pro in 0.5 months. Pre-filter aggressively to avoid burning credits on unqualified leads.

### Clay Pricing (2026)

| Plan       | Price/Mo | Credits/Mo | Per Credit |
| ---------- | -------- | ---------- | ---------- |
| Free       | $0       | 100        | N/A        |
| Starter    | $149     | 2,000      | $0.075     |
| Explorer   | $349     | 10,000     | $0.035     |
| Pro        | $800     | 50,000     | $0.016     |
| Enterprise | Custom   | Custom     | Custom     |

### Sample Clay Table Structure

Build your enrichment workflow in this column order:

```
Col A: Company Domain        (input)
Col B: Contact Name          (input or enrichment)
Col C: LinkedIn URL          (Apollo waterfall)
Col D: Verified Email        (email waterfall: Apollo > Hunter > FindyMail)
Col E: Job Title             (Apollo or ZoomInfo)
Col F: Employee Count        (Clearbit or Clay built-in)
Col G: Industry              (Clearbit or Clay built-in)
Col H: Tech Stack            (BuiltWith via Clay)
Col I: Bombora Surge Score   (Bombora integration or manual import)
Col J: Firmographic Score    (Formula: weighted average of F, G, geography)
Col K: Technographic Score   (Formula: based on H match rules)
Col L: Intent Score          (Formula: based on I + hiring + funding signals)
Col M: ICP Score             (Formula: J*0.30 + K*0.30 + L*0.40)
Col N: AI Personalization    (AI column: generate first-line based on B, E, H)
Col O: Routing               (Formula: if M > 85 then "hot" elif M > 70 then "warm")
```

### Credit Governance Rules

1. **Pre-qualify before enriching** - domain check + firmographic filter before spending on email waterfall
2. **Cap per campaign** - no single campaign burns more than 40% of monthly credits
3. **Alert at 75%** - Slack/email alert when usage crosses 75% of monthly allowance
4. **Audit weekly** - credits spent vs. leads enriched vs. leads qualified (target >60% qualification)
5. **90-day re-enrichment** - re-enrich stale contacts before including in new campaigns

---

## Section 4: Contact Verification Pipeline

Unverified cold email lists carry 10-30% invalid addresses. Sending to bad addresses destroys sender reputation within a few campaigns. Google, Yahoo, and Microsoft now enforce bounce rates under 2% and spam complaints under 0.3%.

### Verification Pipeline Steps

| Step | Check               | Action                                              | Cost           |
| ---- | ------------------- | --------------------------------------------------- | -------------- |
| 1    | Syntax validation   | Remove malformed addresses (missing @, double dots) | Free           |
| 2    | DNS/MX lookup       | Verify domain has valid mail server                 | Free           |
| 3    | SMTP verification   | Confirm mailbox exists at provider                  | Provider-based |
| 4    | Catch-all detection | Flag domains that accept all addresses              | Provider-based |
| 5    | Role account check  | Flag info@, support@, admin@, sales@                | Provider-based |
| 6    | Confidence scoring  | Assign final deliverability score                   | Computed       |

### Confidence Score Thresholds

| Confidence | Classification         | Action                                                  |
| ---------- | ---------------------- | ------------------------------------------------------- |
| >0.85      | Deliverable            | Safe to send. Include in sequences.                     |
| 0.70-0.85  | Risky                  | Send in small batches. Monitor bounce rate per batch.   |
| 0.50-0.69  | Catch-all/Unverifiable | Segment separately. Maximum 50 per day. Watch closely.  |
| <0.50      | Invalid/High Risk      | Reject. Do not send. Re-enrich with alternate provider. |

### Catch-All Domain Handling

Catch-all domains accept every email sent to them, even addresses that do not exist. They create silent deliverability decay because campaigns appear sent but never reach decision-makers.

**Rules for catch-all addresses:**

- Never mix catch-all addresses into your primary sending pool
- Send catch-all segments from a separate sending domain
- Limit to 20-50 catch-all sends per domain per day
- Track reply rates separately; if reply rate drops below 1%, stop sending to that domain
- Re-verify catch-all addresses every 30 days

### Verification Tool Comparison

| Tool            | Verification Method      | Catch-All Detection | Bulk Speed | Pricing       |
| --------------- | ------------------------ | ------------------- | ---------- | ------------- |
| MillionVerifier | SMTP + proprietary       | Yes                 | 1M/hour    | $0.0005/email |
| ZeroBounce      | SMTP + AI scoring        | Yes                 | 100K/hour  | $0.008/email  |
| NeverBounce     | SMTP + real-time API     | Yes                 | 50K/hour   | $0.008/email  |
| DeBounce        | SMTP + disposable detect | Yes                 | 500K/hour  | $0.001/email  |
| Bouncer         | SMTP + toxicity check    | Yes                 | 200K/hour  | $0.005/email  |

### Deliverability Protection Checklist

Before sending any enriched list to outreach:

- [ ] All emails verified within the last 7 days
- [ ] Bounce rate on verification under 2%
- [ ] Catch-all addresses segmented into separate pool
- [ ] Role accounts (info@, support@) removed or deprioritized
- [ ] Sending domain has SPF, DKIM, and DMARC configured
- [ ] Sending domain warmed for at least 14 days
- [ ] Daily send volume does not exceed 50 per inbox per day (cold)
- [ ] Spam complaint rate on prior campaigns under 0.3%

---

## Section 5: Performance Benchmarks

### Expected Conversion Lift from Enrichment

| Metric                         | Before Waterfall | After Waterfall | Improvement |
| ------------------------------ | ---------------- | --------------- | ----------- |
| Email coverage rate            | 55-65%           | 85-95%          | +30-40%     |
| Email bounce rate              | 7-15%            | <2% (verified)  | -70-85%     |
| Connect rate (cold call)       | 4-6%             | 8-12%           | +80-100%    |
| Pipeline generated             | Baseline         | +37%            | Significant |
| Meeting-to-customer conversion | Baseline         | +27%            | Significant |
| MQL-to-SQL rate (with intent)  | 8-12%            | 15-25%          | +80-100%    |

### Cost-Per-Verified-Lead Benchmarks

| Approach                        | Cost Per Lead | Coverage     | Quality     |
| ------------------------------- | ------------- | ------------ | ----------- |
| Single provider (Apollo)        | $0.05-$0.15   | 60%          | Medium      |
| Two-step waterfall              | $0.15-$0.35   | 78%          | Medium-High |
| Three-step waterfall            | $0.30-$0.60   | 88%          | High        |
| Full waterfall + verification   | $0.50-$1.00   | 92% verified | Very High   |
| Full waterfall + intent scoring | $1.50-$3.00   | 92% + scored | Premium     |

### ROI Calculation Framework

```
Cost:  Clay Pro ($800) + Apollo ($99) + FindyMail ($49) + MillionVerifier ($25) = $973/mo
Yield: 2,000 enriched > 1,840 verified (92%) > 1,012 ICP-qualified (55%)
       > 30 meetings (3%) > 12 opps (40%) > 3 closed-won (25%) at $15K ACV = $45K/mo
ROI:   $45,000 / $973 = 46x
```

Adjust conversion rates for your actual pipeline. The framework matters more than the sample numbers.

---

## Section 6: Compliance

### Compliance by Region

| Requirement       | US (CAN-SPAM/CCPA)  | EU (GDPR)           | UK (UK GDPR)        |
| ----------------- | ------------------- | ------------------- | ------------------- |
| B2B email consent | Opt-out model       | Legitimate interest | Legitimate interest |
| Data source docs  | Recommended         | Required            | Required            |
| Right to erasure  | CCPA: Yes           | Required            | Required            |
| Data retention    | Disclosure required | Define and enforce  | Define and enforce  |

### Provider Notes

- **Dropcontact** generates contacts algorithmically without a database (GDPR-native)
- **Apollo, ZoomInfo, Clearbit** are compliant as platforms; you own your usage basis
- **Clay** is compliant, but third-party providers accessed through Clay may not be. Verify each.
- **Bombora** cooperative data is compliant; downstream outreach must follow local regulations

### Safe Enrichment Practices

1. Document your legal basis (legitimate interest for B2B is standard)
2. Track which provider sourced each contact
3. Honor opt-out and erasure requests within 30 days
4. Do not enrich or contact individuals who have previously opted out
5. Review provider DPAs annually

---

## Examples

- **User says:** "Set up lead enrichment for our outbound" → **Result:** Agent asks budget and volume; recommends waterfall tier (e.g. Clay + Apollo for $200–1K/mo); outlines steps: import → pre-filter → waterfall → verify (confidence &gt;0.85) → score → route to SDR/sequence; suggests CRM push and 90-day re-enrich.
- **User says:** "Our email bounce rate is high" → **Result:** Agent checks verification (MillionVerifier, NeverBounce) and confidence threshold; recommends catch-all segment and list hygiene; suggests &lt;2% bounce target and re-verification before each campaign.
- **User says:** "Which enrichment tools should we use?" → **Result:** Agent uses Quick Reference budget tiers; maps providers (Apollo, Clay, ZoomInfo, Clearbit, etc.); recommends primary/secondary/tertiary order and when to add intent (Bombora, G2).

## Troubleshooting

- **Low email coverage after waterfall** → **Cause:** Weak providers or wrong order. **Fix:** Put best provider first; add LinkedIn/FindyMail as fallback; target &gt;85% coverage; track per-provider fill rate.
- **ICP score not predicting meetings** → **Cause:** Wrong weights or stale data. **Fix:** Recalibrate firmographic/technographic/behavioral weights; ensure intent signals fresh; A/B test score bands (e.g. &gt;85 hot, 70–84 warm).
- **Credits burning too fast** → **Cause:** Enriching everyone or wrong filters. **Fix:** Pre-filter by domain, industry, geo; set confidence threshold (e.g. 0.85 outreach, 0.50 nurture); cap credits per qualified lead (&lt;50).

---

For checklists, benchmarks, and discovery questions read `references/quick-reference.md` when you need detailed reference.

---

## Related Skills

- **positioning-icp** - Define the ICP that enrichment scores against. Start here if ICP is undefined.
- **ai-cold-outreach** - Use enriched data in personalized cold email sequences. Enrichment feeds outreach.
- **ai-sdr** - Automate SDR workflows that consume enriched, scored leads.
- **gtm-engineering** - Build the technical infrastructure (APIs, webhooks, CRM integrations) that connects enrichment to the rest of the stack.
- **solo-founder-gtm** - Budget-optimized enrichment for founders doing their own outbound.

---
name: positioning-icp
description: "When the user wants to define their ideal customer profile, position an AI product, build messaging architecture, or validate product-market fit. Also use when the user mentions 'ICP,' 'ideal customer profile,' 'positioning,' 'PMF,' 'product-market fit,' 'messaging,' 'buyer persona,' 'enrichment signals,' 'market positioning,' or 'competitive positioning.' This skill covers market positioning, ICP definition, messaging architecture, and PMF validation for AI-native products. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'
---

# Positioning, ICP & Messaging Architecture for AI Products

You are an expert in AI product positioning, ICP definition, messaging architecture, and product-market fit validation. You combine April Dunford's positioning methodology with modern enrichment-signal-driven ICP building, outcome-focused messaging frameworks, and the reality that PMF in AI markets is perishable and must be revalidated quarterly. You understand the 2025-2026 buyer shift where business function leaders (not IT) now drive AI purchasing decisions, and you help founders translate technical capabilities into business outcomes that close deals.

## Before Starting

Gather this context before building any positioning, ICP, or messaging deliverable:

- What does the product actually do today? Get a one-paragraph description of the core capability, not the vision.
- Who are the current best customers? Ask for 3-5 accounts that renewed, expanded, or had the shortest sales cycles.
- What alternatives do prospects use before finding this product? Includes manual processes, spreadsheets, competitors, and internal tools.
- What is the current pricing model? Seat-based, usage-based, outcome-based, or hybrid.
- What is the primary sales motion? PLG, sales-led, community-led, or hybrid. Average deal size and sales cycle length.
- Who signs the contract today? Job title and department of the actual economic buyer.
- When was the last time the ICP or positioning was updated? If more than 90 days ago for an AI product, flag it as overdue.
- What is the current Sean Ellis score? If unknown, flag PMF validation as a prerequisite.

---

## 1. Positioning Stack for AI Products

AI products face a unique positioning challenge: the technology layer moves faster than the market layer. A positioning statement that worked 90 days ago may already be stale because model capabilities shifted, a competitor launched a similar feature, or buyer expectations evolved.

### The Four-Layer Positioning Stack

Build positioning from the bottom up. Each layer must hold before the next one works.

```
+--------------------------------------------------+
|  ALTERNATIVE FRAMING                              |
|  "The [Competitor] alternative that [key diff]"   |
+--------------------------------------------------+
|  PROOF VECTOR                                     |
|  Quantified evidence the wedge delivers results   |
+--------------------------------------------------+
|  WEDGE                                            |
|  The specific capability gap you exploit           |
+--------------------------------------------------+
|  CATEGORY                                         |
|  The market context buyers already understand      |
+--------------------------------------------------+
```

### Layer Definitions

| Layer               | Purpose                                              | AI Product Example                                           |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Category            | Anchors the buyer in a known market                  | "AI-powered customer support automation"                     |
| Wedge               | The specific gap between what exists and what you do | "Resolves billing disputes end-to-end without human handoff" |
| Proof Vector        | Evidence that the wedge works                        | "47% reduction in support escalations at Series B+ fintechs" |
| Alternative Framing | Captures high-intent search traffic                  | "The Intercom alternative for AI-first support teams"        |

### Positioning Statement Template

For [target ICP segment] who [situation or trigger], [product name] is the [category] that [wedge/key differentiator], unlike [primary alternative], which [limitation of alternative]. We prove this with [proof vector].

### Common Positioning Mistakes in AI

| Mistake                                            | Why It Fails                                            | Fix                                                                       |
| -------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Leading with the model                             | "Powered by GPT-4o" tells buyers nothing about outcomes | Lead with the business result the model enables                           |
| Category creation too early                        | Pre-revenue companies burning cash educating a market   | Anchor in an existing category, then differentiate                        |
| Feature parity claims                              | "We also have AI" is not a position                     | Find the wedge where you are 10x better on one axis                       |
| Positioning for engineers when selling to business | Technical jargon in messaging to VP-level buyers        | If the pitch includes a model name, you are selling to the wrong audience |
| Static positioning in a dynamic market             | Set-and-forget positioning from 6+ months ago           | Revalidate every 90 days minimum                                          |

---

## 2. Defining ICP with Enrichment Signals

Build your ICP from three signal layers, not gut feel. Modern ICP definition combines historical win data with real-time enrichment signals to create a living profile that adapts as the market shifts.

### The Three Signal Layers

| Signal Layer  | What It Tells You                 | Example Signals                                                                   | Tools                                                            |
| ------------- | --------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Firmographic  | Company shape and context         | Employee count, revenue range, industry vertical, geography, funding stage        | Clay, Apollo, ZoomInfo, Clearbit                                 |
| Technographic | Technical readiness and stack fit | Current tools, API usage, cloud provider, data infrastructure maturity            | BuiltWith, Wappalyzer, HG Insights, Slintel                      |
| Intent        | Active buying behavior            | Content consumption, job postings, funding events, competitor research, G2 visits | Bombora, G2 Buyer Intent, Clay signals, LinkedIn Sales Navigator |

### ICP Scoring Model

Keep firmographic/technographic fit and intent as separate dimensions. Collapsing them into a single score hides whether an account is a good fit but not ready, or a bad fit that is actively searching.

**Fit Score (0-100)**

```
Fit Score = (Firmographic Match * 0.4) + (Technographic Match * 0.35) + (Behavioral Fit * 0.25)
```

| Component           | Weight | Scoring Criteria                                                                                                                |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Firmographic Match  | 40%    | Industry vertical (25pts), employee range (25pts), revenue range (25pts), geography (15pts), funding stage (10pts)              |
| Technographic Match | 35%    | Uses complementary tools (30pts), has API/integration infrastructure (25pts), cloud-native stack (25pts), data maturity (20pts) |
| Behavioral Fit      | 25%    | Historical deal velocity (30pts), expansion rate (30pts), retention rate (25pts), NPS/satisfaction (15pts)                      |

**Intent Score (0-100)**

```
Intent Score = (Third-Party Intent * 0.35) + (First-Party Signals * 0.40) + (Trigger Events * 0.25)
```

| Component           | Weight | Scoring Criteria                                                                                                                |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Third-Party Intent  | 35%    | Bombora topic surges (30pts), G2 category research (30pts), competitor page visits (20pts), review site activity (20pts)        |
| First-Party Signals | 40%    | Website visits to pricing/demo pages (30pts), content downloads (20pts), email engagement (25pts), product signup/trial (25pts) |
| Trigger Events      | 25%    | New funding round (30pts), key hire in target dept (25pts), tech stack change (25pts), competitor churn signal (20pts)          |

### ICP Prioritization Matrix

```
                    High Intent
                        |
         NURTURE        |        ACTIVATE
     (Good fit,         |     (Good fit,
      not ready yet)    |      ready now)
                        |
  ----------------------+----------------------
                        |
         DISQUALIFY     |        MONITOR
     (Poor fit,         |     (Poor fit but
      not ready)        |      showing intent)
                        |
                    Low Intent

         Low Fit                    High Fit
```

- **ACTIVATE (High Fit + High Intent)**: Route to sales immediately. These accounts match your ICP and are actively looking. Target response time: under 4 hours.
- **NURTURE (High Fit + Low Intent)**: Enroll in targeted content sequences. They will convert when a trigger event hits.
- **MONITOR (Low Fit + High Intent)**: Watch for ICP drift. If multiple "low fit" accounts convert, your ICP definition needs updating.
- **DISQUALIFY (Low Fit + Low Intent)**: Do not spend resources. Revisit only during quarterly ICP refresh.

### Enrichment Waterfall Architecture

Sequential enrichment checks multiple data providers until verified contact data is found. Stop at the first provider that returns high-confidence results to minimize cost.

```
Step 1: Clay (primary enrichment)
  |
  +--> Confidence >= 0.85? --> ACCEPT, stop
  |
  +--> Confidence < 0.85? --> Continue
  |
Step 2: Apollo (secondary)
  |
  +--> Confidence >= 0.85? --> ACCEPT, stop
  |
  +--> Confidence < 0.85? --> Continue
  |
Step 3: ZoomInfo (tertiary)
  |
  +--> Confidence >= 0.85? --> ACCEPT, stop
  |
  +--> Confidence < 0.85? --> Continue
  |
Step 4: BetterContact (verification layer)
  |
  +--> SMTP + catch-all validation
  +--> Final confidence score assigned
  +--> Confidence >= 0.50? --> ACCEPT with flag
  +--> Confidence < 0.50? --> REJECT
```

**Confidence Thresholds**

| Score Range | Action                                     | Expected Deliverability     |
| ----------- | ------------------------------------------ | --------------------------- |
| 0.85 - 1.00 | Accept, route to outreach                  | 95%+ deliverable            |
| 0.70 - 0.84 | Accept with verification flag              | 85-94% deliverable          |
| 0.50 - 0.69 | Accept for nurture only, do not cold email | 70-84% deliverable          |
| Below 0.50  | Reject, do not use                         | Below 70%, high bounce risk |

### ICP Definition Workflow

1. **Export your best 20-50 customers** by NRR, deal velocity, or LTV
2. **Run firmographic enrichment** to find common patterns (industry, size, stage)
3. **Run technographic enrichment** to find stack commonalities
4. **Analyze intent signals** that preceded closed-won deals
5. **Build the scoring model** with weights derived from your data, not assumptions
6. **Test against your pipeline** to see if the model would have predicted your last 10 wins
7. **Set a 90-day review cadence** because in AI markets, your ICP drifts quarterly

---

## 3. Competitive Positioning in Fast-Moving AI Markets

### The Competitor Alternative SEO Play

"[Competitor] alternative" keywords carry extremely high purchase intent. Prospects searching these terms have already identified their problem and are actively evaluating solutions. These keywords often rank faster than category keywords because competition is lower.

**Execution Checklist**

| Step | Action                                                                                                                     | Tool                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1    | List top 10 direct competitors and adjacent tools                                                                          | Manual + G2 category pages    |
| 2    | Build keyword set: "[competitor] alternative," "[competitor] vs [you]," "[competitor] pricing," "switch from [competitor]" | Ahrefs, Semrush, or SEO agent |
| 3    | Create dedicated landing pages for top 5 competitors                                                                       | CMS or static site            |
| 4    | Structure each page: pain point, feature comparison table, proof vector, CTA                                               | Template below                |
| 5    | Build supporting content: migration guides, comparison blog posts                                                          | Content team or AI-assisted   |
| 6    | Track rankings weekly and iterate copy based on conversion data                                                            | Search console + analytics    |

**Competitor Landing Page Structure**

```
1. Headline: "Looking for a [Competitor] alternative?"
2. Pain acknowledgment: Why buyers leave [Competitor]
3. Comparison table: Feature-by-feature with honest gaps noted
4. Proof vector: Case study or metric from a switcher
5. Migration section: "Switch in under 30 minutes"
6. CTA: Free trial or demo, low commitment
```

### Competitive Intelligence Cadence

| Frequency     | Action                                                                        | Owner                            |
| ------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| Weekly        | Monitor competitor pricing pages, changelog, job postings                     | GTM Ops or AI agent              |
| Monthly       | Review G2/Capterra new reviews for competitor sentiment shifts                | Product Marketing                |
| Quarterly     | Full competitive audit: positioning, messaging, new features, pricing changes | Product Marketing + Sales        |
| Trigger-based | Competitor raises funding, launches major feature, changes pricing            | Alert-driven, immediate response |

### Positioning Against Different Competitor Types

| Competitor Type        | Positioning Strategy             | Key Message                                                         |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------- |
| Incumbent (enterprise) | Speed and simplicity             | "Get results in days, not months of implementation"                 |
| Direct AI competitor   | Depth on your wedge              | "We do [specific thing] 10x better because [proof]"                 |
| DIY/internal tools     | Total cost of ownership          | "Your team spends 40hrs/month maintaining what we do automatically" |
| Open-source            | Support, reliability, compliance | "Production-ready with SOC2, SLA, and dedicated support"            |
| Platform bundling AI   | Specialization                   | "We are purpose-built for [use case], not a checkbox feature"       |

---

## 4. Messaging Architecture

### The Capability-to-Outcome Translation Framework

AI products chronically over-index on technical capabilities in their messaging. The fix is systematic translation from what the product does to what the buyer gets.

**The Translation Test**

If your messaging includes a model name, you are selling to engineers.
If your messaging includes a business outcome, you are selling to buyers.

| Technical Capability                  | Business Outcome                                                           | Buyer Cares About                     |
| ------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| "Uses RAG with vector embeddings"     | "Answers customer questions with 94% accuracy using your own docs"         | Accuracy, self-service deflection     |
| "Fine-tuned LLM on your data"         | "New reps ramp 40% faster with AI coaching trained on your top performers" | Time-to-productivity, revenue per rep |
| "Real-time inference at 50ms latency" | "Fraud blocked before the transaction completes"                           | Loss prevention, customer trust       |
| "Multi-modal AI pipeline"             | "Process invoices, receipts, and contracts without manual data entry"      | Time savings, error reduction         |

### Three-Tier Messaging Architecture

Build messaging at three altitudes. Each tier serves a different audience and context.

```
+----------------------------------------------------------+
|  TIER 1: Strategic Narrative (CEO, Board, Press)          |
|  "Why this category matters now"                          |
|  One paragraph. No product features.                      |
+----------------------------------------------------------+
|  TIER 2: Value Proposition (VP/Director Buyer)            |
|  "What changes for your team when you adopt this"         |
|  3-5 bullet points. Business outcomes with proof.         |
+----------------------------------------------------------+
|  TIER 3: Feature Messaging (Evaluator/Champion)           |
|  "How it works and why the approach is better"            |
|  Detailed. Technical where appropriate. Comparison-ready. |
+----------------------------------------------------------+
```

| Tier   | Audience                  | Length      | Content                              | Where Used                              |
| ------ | ------------------------- | ----------- | ------------------------------------ | --------------------------------------- |
| Tier 1 | C-suite, press, investors | 1 paragraph | Market shift + your role in it       | Homepage hero, pitch deck slide 1, PR   |
| Tier 2 | VP/Director buyers        | 3-5 bullets | Business outcomes + proof points     | Sales deck, product pages, case studies |
| Tier 3 | Evaluators, champions     | Detailed    | Features, architecture, integrations | Docs, comparison pages, technical blog  |

### Messaging Validation Checklist

Run every piece of messaging through these five checks:

| Check           | Question                                           | Pass Criteria                                                                        |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Specificity     | Does it include a number or named outcome?         | "Reduces support tickets by 40%" passes. "Improves efficiency" fails.                |
| Differentiation | Could a competitor say the exact same thing?       | If yes, rewrite until only you can claim it.                                         |
| Buyer language  | Does it use words your buyers actually say?        | Pull language from sales call transcripts and G2 reviews, not marketing brainstorms. |
| Proof           | Is there evidence backing the claim?               | Customer quote, case study metric, or third-party validation required.               |
| Altitude match  | Is the message at the right tier for the audience? | Tier 1 messages in a technical doc fail. Tier 3 messages in a board deck fail.       |

---

## 5. The Buyer Shift: Business Leaders as AI Buyers

### Who Buys AI in 2025-2026

AI purchasing has shifted decisively from IT departments to business function leaders. Organizations that align leadership around AI priorities are nearly twice as likely to report above-average growth. This means your ICP, messaging, and sales motion must target the business buyer, not the CTO.

| Signal                  | 2022-2023                                | 2025-2026                                          |
| ----------------------- | ---------------------------------------- | -------------------------------------------------- |
| Primary buyer           | CTO / VP Engineering                     | VP Ops, VP Sales, VP CX, CFO                       |
| Evaluation criteria     | Technical architecture, model benchmarks | Time-to-value, ROI, workflow fit                   |
| Purchase justification  | "Innovation budget"                      | "Headcount savings" or "revenue lift"              |
| Decision timeline       | 6-12 month evaluation                    | 30-90 day pilot-to-purchase                        |
| Success metric          | Model accuracy, uptime                   | Pipeline generated, tickets deflected, hours saved |
| Procurement involvement | Minimal                                  | Heavy, focused on measurable ROI                   |

### Implications for GTM

| GTM Element  | Old Approach (Selling to IT)      | New Approach (Selling to Business)         |
| ------------ | --------------------------------- | ------------------------------------------ |
| Demo         | Show the architecture diagram     | Show the workflow before/after             |
| Case study   | "Reduced inference latency by 3x" | "Sales team closes 28% more deals"         |
| Pricing page | Per-API-call pricing              | Outcome-based or per-workflow pricing      |
| Sales deck   | Technical deep-dive               | Business case with ROI calculator          |
| Champion     | Senior engineer                   | Director/VP in the buying department       |
| Content      | Technical blog posts, docs        | ROI guides, industry benchmarks, playbooks |
| Trial        | API sandbox                       | Pre-configured workflow template           |

### Mapping Your Messaging to the New Buyer

For every message, ask: "Would a VP of [department] forward this to their CFO to justify the purchase?" If the answer is no, the message is at the wrong altitude.

---

## 6. Perishable PMF: Quarterly Revalidation

### Why AI PMF Expires

In AI markets, PMF is not a milestone you reach and keep. Model capabilities evolve monthly, buyer expectations shift as they interact with better AI systems elsewhere, and new competitors launch weekly. Companies that validated PMF six months ago may already be losing it.

The data confirms this: only 5% of generative AI projects deliver real business value, often because teams validate once and assume the signal holds. Continuous revalidation is the fix.

### The 90-Day PMF Revalidation Cadence

Run this cycle every quarter. Each component takes 1-2 weeks. Total cycle: 4-6 weeks, leaving buffer before the next one starts.

| Week | Action                    | Method                                                                     | Output                                              |
| ---- | ------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| 1    | Sean Ellis Survey         | Survey active users: "How disappointed would you be without this product?" | PMF score (target: 40%+ "very disappointed")        |
| 2    | Cohort Retention Analysis | Compare Day 7/30/90 retention across monthly cohorts                       | Retention trend (improving, flat, declining)        |
| 3    | Competitive Audit         | Review top 5 competitors for positioning, pricing, feature changes         | Competitive delta report                            |
| 4    | ICP Refresh               | Analyze last quarter's wins/losses for ICP drift                           | Updated ICP scoring weights                         |
| 5-6  | Synthesis + Action        | Combine all signals into positioning/messaging/ICP updates                 | Updated positioning doc, revised ICP, new messaging |

### Sean Ellis Score Benchmarks for AI Products

| Score     | Interpretation                                         | Action                                                       |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Below 20% | No PMF. The product is not solving a real problem yet. | Pivot or narrow the ICP dramatically.                        |
| 20-30%    | Weak signal. Some users get value, most do not.        | Identify the segment where score is highest and focus there. |
| 30-40%    | Approaching PMF. Close but the wedge needs sharpening. | Double down on the highest-scoring use case.                 |
| 40-50%    | PMF achieved. Growth investments are justified.        | Scale the sales motion, expand the team.                     |
| 50-60%    | Strong PMF. Best-in-class for early stage.             | Optimize unit economics, begin adjacent expansion.           |
| 60%+      | Exceptional. Rare even among successful companies.     | Defend the position, expand the category.                    |

### PMF Decay Warning Signs

| Signal                                                | What It Means                                         | Response                                              |
| ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Sean Ellis score drops 5+ points quarter-over-quarter | Core value perception weakening                       | Re-interview churned users, check competitor launches |
| Day-30 retention drops below previous cohort          | New users getting less value                          | Audit onboarding flow, check if ICP shifted           |
| Win rate declining while pipeline grows               | Positioning attracting wrong audience                 | Tighten ICP definition, update qualification criteria |
| Sales cycle lengthening                               | Buyer confidence dropping or competition increasing   | Update proof vectors, add new case studies            |
| NPS drops while usage stays flat                      | Users staying out of switching cost, not satisfaction | Urgent: interview detractors, ship fixes              |

### AI Pricing Model Landscape (Context for PMF)

Pricing directly affects PMF signals. The wrong model creates churn even when the product delivers value.

| Model                 | When to Use                        | Risk                                                 | 2025-2026 Trend                                                  |
| --------------------- | ---------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Per-seat              | Simple products, predictable usage | 40% lower margins, 2.3x higher churn vs. usage-based | Declining (dropped from 21% to 15% in 12 months)                 |
| Usage-based           | API products, variable workloads   | Revenue unpredictability, customer budget anxiety    | Growing (59% of software companies increasing usage share)       |
| Outcome-based         | High-confidence ROI delivery       | Hard to measure, requires attribution infrastructure | Emerging (30%+ enterprise SaaS incorporating outcome components) |
| Hybrid (base + usage) | Most AI products in 2025-2026      | Complexity in pricing page and sales conversations   | Dominant (surged from 27% to 41%)                                |

> Cross-reference: See **ai-pricing** skill for detailed pricing strategy frameworks, willingness-to-pay research methods, and pricing page optimization.

---

## 7. April Dunford's Positioning Framework Applied to AI

The "Obviously Awesome" methodology provides the most battle-tested positioning process. Here it is adapted for AI product realities.

### The 10-Step Process (AI-Adapted)

| Step | Action                                                | AI-Specific Consideration                                                 |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | List your competitive alternatives                    | Include "doing nothing" and "building internally with open-source models" |
| 2    | List features unique to your product                  | Focus on workflow-level differences, not model-level differences          |
| 3    | Map features to value themes                          | Translate every technical feature to a business outcome                   |
| 4    | Identify who cares most about that value              | Business function leaders, not IT, in most cases                          |
| 5    | Find the market context that makes your value obvious | Category must be one the buyer already budgets for                        |
| 6    | Layer in relevant trends                              | AI adoption in their function, competitor AI moves, regulatory changes    |
| 7    | Capture positioning in a document                     | Use the four-layer stack (Category, Wedge, Proof, Alternative)            |
| 8    | Test with sales team                                  | If sales cannot repeat the positioning naturally, simplify                |
| 9    | Test with 5 prospects                                 | Watch for confusion, misattribution, or "so what?" reactions              |
| 10   | Set 90-day review date                                | AI markets shift too fast for annual positioning cycles                   |

---

## 8. Implementation Playbook

### Week 1-2: Discovery and Data Pull

- [ ] Export top 20-50 customers by NRR, deal velocity, or LTV
- [ ] Run firmographic + technographic enrichment via Clay or Apollo
- [ ] Analyze intent signals that preceded last 10 closed-won deals
- [ ] Interview 5 best customers: "Why did you buy? What alternatives did you consider?"
- [ ] Pull competitor positioning from their homepage, G2, and recent funding announcements

### Week 3: Build ICP and Scoring Model

- [ ] Define firmographic, technographic, and behavioral fit criteria with weights
- [ ] Build intent scoring model with third-party, first-party, and trigger components
- [ ] Back-test model against last quarter's wins and losses
- [ ] Set up enrichment waterfall in Clay with confidence thresholds
- [ ] Document ICP in a single-page reference sheet the sales team can use

### Week 4: Positioning and Messaging

- [ ] Complete the four-layer positioning stack
- [ ] Write Tier 1 narrative (one paragraph, no features)
- [ ] Write Tier 2 value propositions (3-5 bullets with proof)
- [ ] Write Tier 3 feature messaging (detailed, comparison-ready)
- [ ] Run the five-check validation on every message
- [ ] Build competitor comparison pages for top 3 alternatives

### Week 5-6: Validate and Ship

- [ ] Test messaging with 5 prospects in discovery calls
- [ ] Run Sean Ellis survey if PMF score is unknown
- [ ] Update website, sales deck, and outreach sequences
- [ ] Brief sales team on new positioning and ICP criteria
- [ ] Set 90-day calendar reminder for revalidation cycle

---

## Examples

- **User says:** "Define our ICP and positioning" → **Result:** Agent gathers best customers, alternatives, pricing, and sales motion; builds four-layer positioning stack (Category, Wedge, Proof Vector, Alternative Framing); outputs ICP with firmographic + behavioral criteria and suggests 90-day revalidation.
- **User says:** "Our messaging doesn't convert" → **Result:** Agent asks who signs the contract and what stalls deals; runs "Would a VP forward this to CFO?" test; suggests messaging tiers (narrative, value props, features) and proof vectors; recommends A/B tests.
- **User says:** "How do we score and prioritize leads?" → **Result:** Agent recommends Fit + Intent weights (e.g. Firmographic 40%, Technographic 35%, Behavioral 25%); defines ACTIVATE threshold (high fit + high intent, respond &lt;4 hr); ties to lead-enrichment for data.

## Troubleshooting

- **Positioning feels stale** → **Cause:** AI market moves fast; 90-day cadence not followed. **Fix:** Revalidate every 90 days; update category/wedge if competitors or model capabilities changed; refresh proof vectors.
- **ICP too broad** → **Cause:** "Everyone" or many segments. **Fix:** Pick 1–2 segments where you win most; use enrichment signals to narrow; document who is NOT a fit.
- **Sean Ellis score unknown** → **Cause:** PMF not measured. **Fix:** Run 40% "very disappointed" survey; if below threshold, flag PMF as prerequisite before scaling GTM.

---

For checklists, benchmarks, and discovery questions read `references/quick-reference.md` when you need detailed reference.

---

## Related Skills

| Skill                 | When to Cross-Reference                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| ai-pricing            | When building pricing models, willingness-to-pay analysis, or packaging tiers   |
| sales-motion-design   | When designing the sales process that operationalizes your positioning          |
| ai-cold-outreach      | When translating positioning into cold email/LinkedIn sequences                 |
| ai-sdr                | When building AI-powered SDR workflows that use ICP scoring                     |
| lead-enrichment       | When implementing enrichment waterfalls and data quality workflows              |
| multi-platform-launch | When launching across channels and need consistent positioning                  |
| ai-seo                | When building competitor alternative pages and bottom-funnel content            |
| gtm-engineering       | When automating ICP scoring, enrichment, and routing in your stack              |
| solo-founder-gtm      | When a solo founder needs to prioritize positioning work with limited resources |
| gtm-metrics           | When measuring the downstream impact of positioning and ICP changes on pipeline |

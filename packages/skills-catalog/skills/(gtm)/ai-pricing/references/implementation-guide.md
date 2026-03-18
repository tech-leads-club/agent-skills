## BYOK (Bring Your Own Key) Pricing

BYOK lets customers plug in their own LLM API keys. You charge for your software layer while the customer pays the model provider directly. This decouples your pricing from volatile model costs.

### BYOK Decision Framework

| Factor             | BYOK Wins                                                         | Managed Model Wins                           |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| Customer type      | Enterprise with existing model contracts, developers              | SMB, non-technical buyer                     |
| Model preference   | Customer insists on specific provider (compliance, existing deal) | Customer trusts your model selection         |
| Margin goal        | Higher software margin (no COGS on model costs)                   | Higher total revenue (markup on model usage) |
| Pricing simplicity | Customer comfortable with two bills                               | Customer wants one price for everything      |
| Support burden     | Lower (model issues go to provider)                               | Higher (you own the full stack)              |
| Switching cost     | Lower (customer can swap your tool, keep model)                   | Higher (bundled = stickier)                  |
| Data sensitivity   | Customer needs data to stay in their cloud/account                | Customer trusts your data handling           |

### BYOK Pricing Structure

| Component        | What You Charge                                       | Example                                            |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Software license | Monthly/annual fee for your platform                  | $49-299/mo per seat or workspace                   |
| Model costs      | Nothing (customer pays provider directly)             | Customer pays OpenAI/Anthropic/Google              |
| Premium features | Add-on fees for orchestration, analytics, fine-tuning | $99/mo for advanced routing, $199/mo for analytics |
| Support tier     | Tiered support pricing                                | Free community, $99/mo priority, custom enterprise |

**Real BYOK examples:**

- JetBrains AI: BYOK available for AI chat and agents, supports Anthropic, OpenAI, and compatible providers
- OpenRouter: 5% usage fee on provider costs when routing through your own keys
- Cursor: BYOK option lets developers use their own API keys, lower subscription tier

### When NOT to Offer BYOK

- Your product's value depends on model fine-tuning or custom training
- Your target market is non-technical (they will not manage API keys)
- Your margin model requires model cost markup
- You need to guarantee response quality (BYOK means variable model behavior)
- Your product uses multi-model routing as a core feature

## Margin Management for AI Products

AI products have fundamentally different economics than traditional SaaS. Traditional SaaS runs 80-85% gross margins because the marginal cost of serving one more customer is near zero. AI products incur real compute costs for every request.

### Margin Landscape

| Company Stage                  | Typical Gross Margin | Target                              | Notes                                   |
| ------------------------------ | -------------------- | ----------------------------------- | --------------------------------------- |
| Early AI startup (unoptimized) | 25-40%               | Survive, prove value                | Bessemer calls these "Supernovas"       |
| Growth AI company (optimizing) | 50-65%               | Get to 60%+ for fundraising         | Active model routing, caching, batching |
| Mature AI company              | 65-75%               | Approach traditional SaaS territory | Custom models, full optimization stack  |
| Traditional SaaS benchmark     | 80-90%               | The target AI companies grow toward | Minimal marginal cost per user          |

**Key data point:** 84% of companies reported AI infrastructure costs cutting gross margins by more than 6 percentage points (Mavvrik AI Cost Governance Report 2025).

### Unit Economics You Must Track

| Metric                        | Definition                                  | Target                         | How to Calculate                                       |
| ----------------------------- | ------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| CPT (Cost Per Task)           | Total AI cost to complete one unit of work  | Varies by task                 | Model cost + compute + orchestration / tasks completed |
| CPR (Cost Per Resolution)     | Cost to achieve one customer outcome        | Less than 30% of price charged | All AI costs for resolved outcomes / resolutions       |
| CPAM (Cost Per Active Member) | AI spend per active user per month          | Less than 20% of ARPU          | Total AI infrastructure / monthly active users         |
| Token efficiency              | Tokens consumed per task vs. minimum needed | Optimize continuously          | Actual tokens / minimum viable tokens                  |
| Model cost ratio              | AI model costs as % of revenue              | Less than 25% at scale         | Total model API spend / revenue                        |

### The Margin Improvement Stack

Seven levers to improve AI product margins, ordered by typical impact.

| Lever                       | Margin Impact                              | Implementation Effort | How It Works                                                                            |
| --------------------------- | ------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------- |
| Model routing               | 50-98% cost reduction on routed tasks      | Medium                | Route simple tasks to cheaper/smaller models, reserve frontier models for complex tasks |
| Prompt caching              | 45-80% reduction on repeated prompts       | Low                   | Cache common prompt prefixes; Anthropic caching costs 90% less, OpenAI 50% less         |
| Batch processing            | 50% cost reduction on batch-eligible tasks | Low                   | Use batch APIs for non-real-time work; guaranteed 50% savings on most providers         |
| Fine-tuned small models     | 60-80% cost reduction vs. frontier models  | High                  | Train task-specific small models that match frontier quality on narrow tasks            |
| Prompt optimization         | 20-40% token reduction                     | Low-Medium            | Shorter prompts, better few-shot examples, structured outputs                           |
| Response caching            | 30-60% reduction on repeated queries       | Low                   | Cache identical or near-identical requests; semantic caching for similar queries        |
| Infrastructure optimization | 10-30% compute cost reduction              | Medium-High           | Spot instances, reserved capacity, multi-region routing for cost                        |

### Model Routing in Practice

```
INCOMING REQUEST
      |
      v
  CLASSIFIER (lightweight model or rules)
      |
      +--> Simple task (FAQ, classification, extraction)
      |    Route to: Small model (Haiku, GPT-4o-mini, Gemini Flash)
      |    Cost: $0.0001-0.001 per request
      |
      +--> Medium task (summarization, drafting, analysis)
      |    Route to: Mid-tier model (Sonnet, GPT-4o)
      |    Cost: $0.001-0.01 per request
      |
      +--> Complex task (reasoning, multi-step, creative)
           Route to: Frontier model (Opus, o1, Gemini Ultra)
           Cost: $0.01-0.10 per request

RESULT: 70-80% of tasks route to cheapest tier
        Average cost drops 60-80%
```

### Margin Improvement Roadmap

| Phase                | Timeline      | Actions                                                         | Expected Margin   |
| -------------------- | ------------- | --------------------------------------------------------------- | ----------------- |
| 1. Foundation        | Month 1-2     | Implement prompt caching, batch processing, basic monitoring    | +5-10 points      |
| 2. Routing           | Month 2-4     | Add model routing, response caching, prompt optimization        | +10-20 points     |
| 3. Custom models     | Month 4-8     | Fine-tune small models for top 3 tasks, deploy custom inference | +10-15 points     |
| 4. Full optimization | Month 6-12    | Semantic caching, dynamic routing, infrastructure optimization  | +5-10 points      |
| **Cumulative**       | **12 months** | **Full stack deployed**                                         | **+30-45 points** |

### Cost Projection Model

For a B2B AI product processing 50M tokens/month per enterprise customer:

| Scenario                                | Monthly Cost | Gross Margin (at $2K MRR) | Optimization Level |
| --------------------------------------- | ------------ | ------------------------- | ------------------ |
| Unoptimized (frontier model only)       | $500-2,000   | 0-75%                     | None               |
| Basic optimization (caching + batching) | $200-800     | 60-90%                    | Foundation         |
| Full routing + caching                  | $50-200      | 90-97%                    | Intermediate       |
| Custom models + full stack              | $20-100      | 95-99%                    | Advanced           |

**Key insight:** AI compute costs are falling roughly 10x every 3 years. A company surviving on 50% gross margin today could see margins expand toward 70%+ as cost per unit falls, even without internal optimization.

## Pricing Tier Design

### The Three-Tier Framework

Most AI products should launch with three tiers. Fewer creates a "take it or leave it" problem. More creates decision paralysis.

| Element      | Starter / Free                    | Pro / Growth                       | Enterprise                                      |
| ------------ | --------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Purpose      | Acquisition, trial, self-serve    | Core revenue driver                | Expansion, high-value accounts                  |
| Pricing      | Free or $0-49/mo                  | $49-499/mo                         | Custom ($500-5,000+/mo)                         |
| Usage limits | Hard caps, limited features       | Generous allocation, most features | Unlimited or custom, all features               |
| Support      | Community, docs, email            | Priority email, chat               | Dedicated CSM, phone, SLA                       |
| Security     | Basic (shared infra)              | SOC 2, SSO                         | SOC 2, SSO, SAML, audit logs, custom deployment |
| Contract     | Monthly, no commitment            | Monthly or annual                  | Annual or multi-year                            |
| Target buyer | Individual, small team, evaluator | Growing team, department           | Procurement, IT, C-suite                        |

### Pricing Page Design Principles

- Lead with the value metric, not the feature list
- Highlight the Pro tier (the one you want most buyers to pick)
- Show annual pricing by default (higher LTV), monthly as option
- Include a calculator for usage-based components
- Enterprise = "Contact us" (never show a fixed price for enterprise)
- Free tier should be generous enough to prove value but limited enough to create upgrade pressure

### Feature Gating Strategy

| Gate Type        | How It Works                               | Example                                                     |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Usage cap        | Limit volume of the core action            | 100 resolutions/mo on Starter, 1,000 on Pro                 |
| Feature gate     | Lock advanced capabilities to higher tiers | Basic analytics on Starter, custom dashboards on Pro        |
| Quality gate     | Restrict model quality or speed            | Standard models on Starter, frontier models on Pro          |
| Support gate     | Limit support access by tier               | Community on Free, priority on Pro, dedicated on Enterprise |
| Integration gate | Limit connections to other tools           | 3 integrations on Starter, unlimited on Pro                 |
| Team gate        | Limit collaboration features               | 1 user on Starter, 10 on Pro, unlimited on Enterprise       |

## How Pricing Shapes Your GTM Organization

The pricing model you choose reshapes your entire go-to-market motion. Pricing is not just a finance decision. It determines how you hire, how you comp sales, and how you structure customer success.

### Pricing Model to GTM Motion Map

| Pricing Model          | Sales Motion                    | Rep Profile                              | Comp Structure                         | CS Model                         |
| ---------------------- | ------------------------------- | ---------------------------------------- | -------------------------------------- | -------------------------------- |
| Self-serve consumption | Product-led growth              | No traditional reps; growth/product team | N/A or usage-based bonuses             | Tech-touch, in-app               |
| Per-seat (copilot)     | Sales-assisted                  | Traditional AE, land-and-expand          | Quota on new ARR + expansion           | Pooled CSM, seat expansion focus |
| Outcome-based (agent)  | Consultative sale               | Solution engineer + AE hybrid            | Quota on ARR + outcome volume bonus    | High-touch, value realization    |
| Hybrid (base + usage)  | Sales-assisted to enterprise    | AE for enterprise, PLG for SMB           | Quota on committed ARR + usage overage | Tiered (tech-touch to dedicated) |
| BYOK + platform fee    | Developer-led, community-driven | Developer advocates + enterprise AE      | Quota on platform ARR                  | Community + enterprise CSM       |

### Sales Compensation Design by Pricing Model

**Consumption / usage-based:**

- Comp on committed annual spend (not actual usage)
- Overage/expansion bonus (10-20% of expansion revenue)
- Clawback risk if customer downsizes within 6-12 months
- AE role often merges with account management (AE owns full lifecycle)

**Outcome-based:**

- Comp on minimum commit + projected outcome volume
- Bonus tied to customer value realization (if customer hits usage milestones)
- Longer sales cycles = higher base salary ratio (60/40 base/variable vs. 50/50)
- Requires reps who can quantify ROI and run business cases

**Hybrid:**

- Comp on committed platform fee (the predictable component)
- Expansion bonus for usage/outcome growth above baseline
- Quota split: 70% new logo, 30% expansion (or separate expansion team)
- Works with traditional AE + CSM split

### Organizational Structure Impact

```
CONSUMPTION PRICING                    OUTCOME PRICING
+-----------------------+              +-----------------------+
| Growth / PLG Team     |              | Solutions AE          |
| (owns self-serve)     |              | (owns full cycle)     |
+-----------+-----------+              +-----------+-----------+
            |                                      |
+-----------v-----------+              +-----------v-----------+
| Usage Analytics       |              | Onboarding Specialist |
| (monitors expansion)  |              | (drives value quickly) |
+-----------+-----------+              +-----------+-----------+
            |                                      |
+-----------v-----------+              +-----------v-----------+
| Account Mgmt / CSM   |              | Customer Success Mgr  |
| (prevent churn, grow) |              | (measure outcomes)    |
+-----------------------+              +-----------------------+

PER-SEAT PRICING                       HYBRID PRICING
+-----------------------+              +-----------------------+
| Traditional AE        |              | SMB: PLG / self-serve |
| (land new logos)      |              | Enterprise: AE team   |
+-----------+-----------+              +-----------+-----------+
            |                                      |
+-----------v-----------+              +-----------v-----------+
| CSM (pooled)          |              | Tiered CSM            |
| (drive seat expansion)|              | (tech-touch to high)  |
+-----------------------+              +-----------------------+
```

## Pricing Migration Strategy

If you are moving from an existing pricing model (typically per-seat) to a new model (usage, outcome, hybrid), you need a migration plan that does not destroy existing revenue.

### Migration Playbook

| Phase                 | Duration     | Actions                                                                                             |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| 1. Analysis           | 2-4 weeks    | Audit current revenue by customer, model new pricing against existing base, identify winners/losers |
| 2. Design             | 2-4 weeks    | Build the new model, set migration paths, create grandfathering rules                               |
| 3. Internal launch    | 2 weeks      | Train sales and CS, update billing systems, prepare materials                                       |
| 4. Existing customers | 3-6 months   | Roll out new pricing at renewal, grandfather current pricing for 6-12 months                        |
| 5. New customers      | Immediate    | All new customers on new pricing from day one                                                       |
| 6. Full migration     | 12-18 months | Convert all grandfathered customers, retire old model                                               |

### Grandfathering Rules

- Lock existing customers at current pricing until next renewal
- At renewal, offer choice: migrate to new model or accept 10-15% price increase on old model
- Never force migration mid-contract
- Provide a savings calculator showing how new model benefits high-usage customers
- Set a hard sunset date for old pricing (12-18 months out)

## Competitive Pricing Analysis Framework

### Positioning Matrix

```
                    HIGH PRICE
                        |
     Premium/Enterprise |  Outcome-Based
     (Harvey, Glean)    |  (Sierra, Intercom Fin)
                        |
  LOW VALUE ------------|------------ HIGH VALUE
                        |
     Commodity/API      |  Value Leader
     (Open-source,BYOK) |  (Mid-tier SaaS + AI)
                        |
                    LOW PRICE
```

### Competitive Response Playbook

| Competitor Move          | Your Response                                            | Do NOT                                   |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------- |
| Drops price 30%+         | Hold price, emphasize ROI and outcomes                   | Race to the bottom                       |
| Launches free tier       | Add a free tier if you do not have one, make it generous | Ignore it hoping it goes away            |
| Moves to outcome pricing | Evaluate your outcome measurability, test with segment   | Copy without clear outcome attribution   |
| Bundles AI into platform | Unbundle and show superior depth in your niche           | Try to out-bundle a platform player      |
| Offers BYOK              | Decide based on your archetype (see BYOK section)        | Offer BYOK reactively without a strategy |

## Anti-Patterns in AI Pricing

| Anti-Pattern                                | Why It Fails                                                    | What to Do Instead                                                 |
| ------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Per-seat pricing for agents                 | Agents replace humans; per-seat penalizes the buyer for success | Use outcome or workflow pricing                                    |
| Flat monthly fee with unlimited AI usage    | Margins collapse as power users scale                           | Add usage caps or hybrid model                                     |
| Pricing anchored to model costs             | Model costs change rapidly; you reprice constantly              | Use credits to abstract model costs                                |
| Free tier with no upgrade pressure          | Users never convert; you fund their usage forever               | Set clear usage limits that create natural friction                |
| Enterprise-only pricing (no self-serve)     | Misses bottoms-up adoption; slower sales cycles                 | Add a self-serve tier for discovery and small teams                |
| Outcome pricing without outcome attribution | Disputes over what counts as "resolved" or "qualified"          | Define outcomes precisely in contract with measurement methodology |
| Charging per token to non-technical buyers  | Buyer cannot predict or understand their bill                   | Use credits, tasks, or outcomes instead                            |

## Pricing Experimentation

### What to Test and How

| Test               | Method                                  | Duration    | Success Metric                    |
| ------------------ | --------------------------------------- | ----------- | --------------------------------- |
| Price point        | A/B test on pricing page                | 4-8 weeks   | Conversion rate, ARPU             |
| Tier structure     | Cohort test (new customers only)        | 8-12 weeks  | Tier distribution, expansion rate |
| Charge metric      | Segment test (e.g., SMB vs. mid-market) | 12-16 weeks | NRR, gross margin, churn          |
| Credit packaging   | A/B test on credit bundles              | 4-8 weeks   | Credit utilization, upgrade rate  |
| Annual vs. monthly | Default annual with monthly option      | 8-12 weeks  | Annual mix, LTV                   |

### Pricing Review Cadence

- **Monthly:** Track unit economics (CPT, CPR, CPAM), margin trends, usage patterns
- **Quarterly:** Review tier distribution, expansion rates, competitive landscape
- **Semi-annually:** Evaluate charge metric fit, consider model changes
- **Annually:** Full pricing review, publish updated pricing (if changing publicly)

---

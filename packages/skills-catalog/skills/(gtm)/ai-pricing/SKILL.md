---
name: ai-pricing
description: "When the user wants to price an AI product, choose a charge metric, design pricing tiers, or optimize margins. Also use when the user mentions 'AI pricing,' 'usage-based pricing,' 'consumption pricing,' 'outcome pricing,' 'BYOK,' 'bring your own key,' 'per-seat pricing,' 'pricing tiers,' 'AI margins,' 'cost per token,' or 'pricing model.' This skill covers pricing strategy, packaging, and margin management for AI-native products. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'

---

# AI Pricing Skill

You are an AI product pricing strategist. You help founders, product leaders, and GTM teams choose the right charge metric, design pricing tiers, set margin targets, and build packaging that scales with customer value. You ground every recommendation in the economics unique to AI products - where compute costs are variable, margins start lower than traditional SaaS, and the pricing model you pick reshapes your entire GTM motion.

## Before Starting

- Ask what type of AI product is being priced (copilot, agent, AI-enabled service, API/platform)
- Clarify the target buyer persona (developer, business user, enterprise procurement, SMB founder)
- Understand current pricing if migrating from an existing model (per-seat, flat-rate, free)
- Ask about the underlying AI cost structure (which models, average tokens per task, hosting setup)
- Determine the primary value metric the customer cares about (time saved, tasks completed, revenue generated)
- Ask about competitive landscape and what alternatives cost the buyer today
- Understand the sales motion (self-serve, sales-assisted, enterprise) as it constrains pricing design
- Check if there are existing contracts or commitments that limit pricing changes

## The Three Charge Metrics

Every AI pricing decision starts with choosing your charge metric. This is the unit of value you bill for. Get this wrong and everything downstream breaks.

| Charge Metric | What You Bill For | Real Examples | Best When | Watch Out For |
|---|---|---|---|---|
| Consumption | Per token, per API call, per compute minute, per credit | OpenAI API ($0.01/1K tokens), AWS Bedrock (per-token), Anthropic API | Technical buyer wants granular control; platform/API play | Customers afraid to use product; unpredictable bills kill adoption |
| Workflow | Per automation run, per agent task, per document processed | n8n (per workflow run), Jasper (per content piece), DocuSign (per envelope) | Clear time-saving value per task; easy to define boundaries | Must define task boundaries precisely; scope creep erodes margins |
| Outcome | Per resolved ticket, per qualified lead, per successful match | Intercom Fin ($0.99/resolution), Sierra (per completed outcome), Salesforce Agentforce ($2/conversation) | Maximum value alignment; outcome is measurable and attributable | You absorb cost variability; must define "success" precisely |

### Decision Framework: Picking Your Charge Metric

```
START HERE
    |
    v
Can the customer measure a specific business outcome
from your product? (resolved ticket, qualified lead, closed deal)
    |
   YES --> Is the outcome clearly attributable to YOUR product
    |      (not shared with other tools)?
    |          |
    |         YES --> OUTCOME-BASED pricing
    |          |      Charge per resolved ticket, per qualified lead
    |         NO  --> WORKFLOW pricing
    |                 Charge per task/run (shared attribution = charge for the work)
    |
   NO --> Does the customer perform discrete, countable tasks?
    |      (document processed, image generated, report created)
    |          |
    |         YES --> WORKFLOW pricing
    |          |      Charge per task, per run, per document
    |         NO  --> CONSUMPTION pricing
                      Charge per token, per API call, per credit
```

### Credit Systems: The Abstraction Layer

Credits sit between raw consumption and the customer. They let you change underlying costs without repricing. 126% growth in credit-model adoption among SaaS companies from end of 2024 to end of 2025.

**How credits work in practice:**

| Component | Example |
|---|---|
| Credit unit | 1 credit = 1 standard task |
| Simple task | 1 credit (e.g., summarize email) |
| Medium task | 3 credits (e.g., draft response) |
| Complex task | 10 credits (e.g., full research report) |
| Monthly package | Starter: 500 credits, Pro: 2,000 credits, Enterprise: custom |

**When to use credits vs. direct metering:**

| Use Credits When | Use Direct Metering When |
|---|---|
| Multiple task types with different costs | Single task type (API calls, resolutions) |
| You need pricing flexibility as models change | Buyer expects transparent per-unit cost |
| Bundling features across product lines | Developer audience wants raw metrics |
| You want to avoid exposing token economics | Open-source or API-first positioning |

**Salesforce Agentforce credit example:**
- 20 Flex Credits = 1 action
- $500 buys 100,000 credits
- Case Management: 3 actions = 60 credits = $0.30 per case
- Field Service Scheduling: 6 actions = 120 credits = $0.60 per appointment
- Credits mask underlying model costs and let Salesforce adjust compute allocation without repricing

## Three Product Archetypes and Their Pricing

Your product archetype determines the pricing model, target margin, and GTM motion. Most AI products fall into one of three categories.

### Archetype Comparison

| Dimension | Copilot (Augment Human) | Agent (Replace Human Task) | AI-Enabled Service |
|---|---|---|---|
| What it does | Assists a human doing their job | Autonomously completes a defined task | Delivers a service with AI at the core |
| Pricing model | Per-seat or per-seat + credits | Outcome or workflow pricing | Project fee, monthly retainer, or per-deliverable |
| Target gross margin | 70-80% | 50-65% | 60-75% |
| Example | GitHub Copilot ($19/seat/mo), Microsoft 365 Copilot ($30/seat/mo) | Intercom Fin ($0.99/resolution), Sierra (per outcome) | Jasper (content plans), Harvey (legal AI) |
| Value story | "Your team does more with less effort" | "This work gets done without a human" | "Expert-level output, fraction of the cost" |
| Buyer | Department head, IT procurement | Operations leader, CFO | Founder, agency owner, department head |
| Sales motion | Self-serve to sales-assisted | Sales-assisted to enterprise | Sales-assisted to high-touch |
| Expansion lever | More seats, more usage per seat | More task types, more volume | More deliverables, more workflows |

### Copilot Pricing Deep Dive

Per-seat works for copilots because the value unit is the empowered human. The human is still in the loop, and you are billing for their enhanced capability.

**Per-seat pricing tiers (copilot template):**

| Tier | Price | Includes | Target |
|---|---|---|---|
| Individual | $15-25/seat/mo | Core AI features, usage cap | Individual contributor, freelancer |
| Team | $25-50/seat/mo | Collaboration, higher caps, integrations | Team of 5-50 |
| Enterprise | Custom ($40-100/seat/mo) | SSO, audit logs, unlimited usage, SLA | 50+ seats, procurement involved |

**GitHub Copilot pricing evolution (real example):**
- Free tier: 2,000 code completions + 50 chat messages/month
- Pro: $10/mo (unlimited completions, 300 premium requests)
- Pro+: $39/mo (1,500 premium requests, agent mode)
- Business: $19/seat/mo (org management, policy controls)
- Enterprise: $39/seat/mo (knowledge bases, fine-tuning)

### Agent Pricing Deep Dive

Agents replace human tasks. The pricing should reflect the value of the completed work, not the number of humans using the tool. Per-seat makes no sense here because the whole point is fewer humans doing the work.

**Outcome pricing design (agent template):**

| Step | Action | Example |
|---|---|---|
| 1. Define outcome | What counts as "done"? | Ticket fully resolved without human handoff |
| 2. Set price per outcome | Anchor to human cost / 3-10x | Human agent costs $15/ticket, charge $0.99-2.00 |
| 3. Set minimum commit | Monthly floor for revenue predictability | 50 resolutions/mo minimum |
| 4. Add volume tiers | Discount at scale, protect margin | 1-500: $0.99, 501-2000: $0.79, 2000+: $0.59 |
| 5. Define non-outcome | What happens when it fails? | Handoff to human = no charge |

**Real outcome pricing examples:**

| Company | Outcome | Price | Human Equivalent Cost |
|---|---|---|---|
| Intercom Fin | Resolved support conversation | $0.99/resolution | $5-15/ticket (human agent) |
| Sierra | Completed customer interaction | Per-outcome (custom) | $8-25/interaction |
| Salesforce Agentforce | Conversation handled | $2/conversation | $5-15/conversation |

### AI-Enabled Service Pricing Deep Dive

AI-enabled services look like agencies or consultancies but run on AI infrastructure. The buyer cares about the output quality and speed, not the technology underneath.

**Service pricing template:**

| Model | Structure | Best For |
|---|---|---|
| Monthly retainer | $2K-25K/mo for defined scope | Ongoing content, support, analysis |
| Per-project | $5K-50K per project | One-time deliverables (audit, migration) |
| Per-deliverable | $50-500 per unit | Scalable output (reports, designs, content) |
| Retainer + overage | Base fee + per-unit above cap | Predictable base with growth upside |

## Hybrid Pricing Model Design

Pure pricing models have weaknesses. Consumption scares buyers. Per-seat misses expansion. Outcome puts all risk on you. Hybrid models combine elements to balance predictability, expansion, and margin protection.

**The hybrid formula:**

```
Platform Fee (predictable base) + Usage/Outcome Component (grows with value)
= Revenue that scales with customer success
```

**Industry adoption:** Hybrid pricing surged from 27% to 41% of B2B companies in 12 months (Growth Unhinged 2025 State of B2B Monetization). Pure per-seat dropped from 21% to 15% in the same period.

### Hybrid Model Patterns

| Pattern | Structure | Example | When to Use |
|---|---|---|---|
| Base + consumption | Platform fee + per-unit overage | $99/mo + $0.05/API call over 10K | API/platform products with variable usage |
| Base + credits | Platform fee + credit allocation | $199/mo includes 1,000 credits, $0.15/credit after | Multi-feature products with different cost profiles |
| Base + outcome | Platform fee + per-outcome | $499/mo + $0.99/resolved ticket | Agent products with measurable outcomes |
| Seat + consumption | Per-seat + usage cap/overage | $30/seat/mo + credits for AI actions | Copilots with heavy AI features |
| Commitment + burst | Annual commit + on-demand pricing | $50K/yr commit + pay-as-you-go above | Enterprise deals needing budget predictability |

### Designing Your Hybrid Model

```
STEP 1: Set the platform fee
  - Covers your fixed costs (infra, support, maintenance)
  - Creates revenue predictability
  - Typically 30-50% of expected total revenue per customer

STEP 2: Choose the variable component
  - Match to your charge metric (consumption, workflow, outcome)
  - Set included usage in the base (the "free" allocation)
  - Price overage at 1.2-2x your unit cost

STEP 3: Design tier breaks
  - 3 tiers is the standard (Starter, Pro, Enterprise)
  - Each tier increases the included allocation 3-5x
  - Enterprise gets custom pricing and volume discounts

STEP 4: Add commitment incentives
  - Annual commit = 15-25% discount over monthly
  - Multi-year commit = additional 5-10% discount
  - Prepaid credits = 10-20% bonus credits
```

### Hybrid Pricing Example (AI Support Agent)

| Component | Starter | Pro | Enterprise |
|---|---|---|---|
| Monthly platform fee | $199/mo | $599/mo | Custom |
| Included resolutions | 200/mo | 1,000/mo | Custom |
| Overage per resolution | $1.29 | $0.89 | $0.49-0.69 |
| Channels | Chat only | Chat + email | All channels |
| SLA | Best effort | 99.5% uptime | 99.9% + dedicated CSM |
| Annual discount | 15% | 20% | Negotiated |


For hybrid pricing, BYOK, margin management, tier design, GTM impact, migration, competitive analysis, anti-patterns, and experimentation read `references/implementation-guide.md`.

## Examples

- **User says:** "How should we price our AI product?" → **Result:** Agent asks product type (copilot/agent/service), buyer, and value metric; runs charge-metric decision tree (consumption/workflow/outcome); recommends 1/3–1/10 of human equivalent cost; suggests 3 tiers and BYOK if enterprise demands it.
- **User says:** "Our margins are too low" → **Result:** Agent asks CPT and tier mix; applies margin levers (model choice, caching, tier design, usage caps); recommends monthly unit-economics tracking and quarterly tier review.
- **User says:** "Should we offer BYOK?" → **Result:** Agent runs BYOK decision framework (enterprise demand, margin, support); recommends managed-first then BYOK tier if needed; ties to gtm-engineering for billing.

## Troubleshooting

- **Customers afraid to use (usage-based)** → **Cause:** Unpredictable bills or no ceiling. **Fix:** Add caps, alerts, or hybrid (base + usage); show savings vs human equivalent; offer annual prepay for predictability.
- **Wrong charge metric** → **Cause:** Value diffuse or customer can't measure. **Fix:** Switch to workflow or outcome if measurable; or simplify to seat/capacity; revalidate with win/loss and willingness-to-pay.
- **Migration from old pricing** → **Cause:** Contract lock-in or fear. **Fix:** Use 6-phase migration playbook; grandparent existing; communicate 90+ days ahead; track retention by cohort.

---


For checklists, benchmarks, and discovery questions read `references/quick-reference.md` when you need detailed reference.

---

## Related Skills

| Skill | Relationship to AI Pricing |
|---|---|
| positioning-icp | ICP determines willingness-to-pay and which charge metric resonates |
| sales-motion-design | Pricing model dictates the sales motion, comp structure, and org design |
| solo-founder-gtm | Solo founders need the simplest viable pricing; start with one tier and iterate |
| gtm-metrics | Unit economics (CPT, CPR, CPAM) feed directly into pricing decisions |
| expansion-retention | Pricing structure determines expansion levers (usage growth, tier upgrades, new products) |
| gtm-engineering | Billing infrastructure must support the chosen pricing model (metering, credits, invoicing) |

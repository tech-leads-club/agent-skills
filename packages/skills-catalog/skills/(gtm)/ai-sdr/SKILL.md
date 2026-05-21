---
name: ai-sdr
description: "When the user wants to deploy AI sales development reps, automate sales qualification, build signal-to-action routing, or design AI agent architecture for sales. Also use when the user mentions 'AI SDR,' 'AI sales agent,' 'automated qualification,' 'signal routing,' 'sales automation,' '11x,' 'Artisan,' 'AiSDR,' 'AI BDR,' or 'autonomous sales.' This skill covers AI SDR deployment, qualification automation, and agent architecture for sales development. Do NOT use for technical implementation, code review, or software architecture."
metadata:
  original_author: Chad Boyda / agent-gtm-skills
  modified_by: Felipe Rodrigues - github.com/felipfr
  source: https://github.com/chadboyda/agent-gtm-skills
  version: '1.0.0'
---

# AI SDR Skill

You are an AI SDR deployment strategist. You help founders and GTM teams design, deploy, and optimize AI-powered sales development systems. You combine signal-based targeting, automated qualification, multi-channel sequencing, and human-in-the-loop handoffs to build pipeline that converts.

## Before Starting

Before giving AI SDR advice, establish:

1. **Current sales motion** - Inbound-led, outbound-led, product-led, or hybrid?
2. **Team size** - Solo founder, small team (2-5), or scaled org (10+)?
3. **ICP clarity** - Do they have a defined ICP with firmographic + behavioral criteria?
4. **Tech stack** - CRM (HubSpot, Salesforce, Pipedrive), enrichment tools, sending infrastructure?
5. **Budget range** - Bootstrap ($500-1K/mo), growth ($1K-5K/mo), or scale ($5K+/mo)?
6. **Volume targets** - How many qualified meetings per month do they need?
7. **Data quality** - Clean CRM data vs. starting from scratch?

If any of these are unclear, ask before proceeding. Bad inputs produce bad AI SDR outputs.

---

## Section 1: AI SDR Landscape (2025-2026)

### What AI SDRs Actually Do

AI SDRs automate the repetitive work of sales development:

- List building and lead enrichment
- ICP scoring and qualification
- Personalized email/LinkedIn/SMS generation
- Multi-step sequence execution
- Meeting booking and calendar coordination
- Reply classification and routing
- CRM logging and data hygiene

They do NOT replace humans at conversion points. The handoff model matters more than the automation model.

### Platform Comparison Table

```
+---------------+------------+-----------------+---------------------------+------------------+
| Platform      | Price/mo   | Best For        | Key Differentiator        | Channels         |
+---------------+------------+-----------------+---------------------------+------------------+
| 11x (Alice)   | $5K-10K    | Enterprise      | Full autonomous agent     | Email, LinkedIn  |
|               |            | outbound        | with brand voice learning | Phone             |
+---------------+------------+-----------------+---------------------------+------------------+
| Artisan (Ava) | $2.4K-7.2K | Mid-market      | Built-in enrichment +     | Email, LinkedIn  |
|               |            | teams           | brand-safe personalization|                  |
+---------------+------------+-----------------+---------------------------+------------------+
| AiSDR         | $900-2.5K  | HubSpot-native  | Managed service, GTM      | Email, LinkedIn, |
|               |            | teams           | support included          | SMS              |
+---------------+------------+-----------------+---------------------------+------------------+
| Relevance AI  | Custom     | Custom agent    | Drag-and-drop agent       | Any (API-based)  |
|               |            | builders        | builder with full API     |                  |
+---------------+------------+-----------------+---------------------------+------------------+
| Clay          | $149-800   | Data + enrich   | 75+ provider waterfall,   | Feeds into any   |
|               |            | workflows       | Claygent AI research      | sending tool     |
+---------------+------------+-----------------+---------------------------+------------------+
| Instantly     | $30-97     | Cold email      | 450M+ lead database,      | Email            |
|               |            | at scale        | built-in warmup network   |                  |
+---------------+------------+-----------------+---------------------------+------------------+
| Smartlead     | $39-94     | Deliverability- | Unlimited mailboxes,      | Email            |
|               |            | focused sending | AI warmup engine          |                  |
+---------------+------------+-----------------+---------------------------+------------------+
| Salesforge    | $48-96     | Multi-channel   | Agent Frank for LinkedIn  | Email, LinkedIn  |
|               |            | sequences       | + email combined          |                  |
+---------------+------------+-----------------+---------------------------+------------------+
```

### Platform Selection Decision Framework

```
START
  |
  v
Do you need a full autonomous agent (minimal human involvement)?
  |
  YES --> Budget > $5K/mo?
  |         |
  |         YES --> 11x (Alice/Julian)
  |         NO  --> Artisan (Ava)
  |
  NO --> Do you want to build custom agent workflows?
          |
          YES --> Relevance AI (or n8n + LLM)
          NO  --> Do you need enrichment + list building?
                    |
                    YES --> Clay (feed into any sender)
                    NO  --> Do you need a managed AI SDR service?
                              |
                              YES --> AiSDR (especially if HubSpot)
                              NO  --> Instantly or Smartlead (sending layer only)
```

### Key Metrics Benchmarks

```
+-------------------------------+-------------+-------------+
| Metric                        | Human SDR   | AI SDR      |
+-------------------------------+-------------+-------------+
| Prospects contacted/day       | 50-80       | 1,000+      |
| Cold email reply rate         | 5-8%        | 8-12%       |
| Cost per meeting booked       | $800-1,500  | $150-400    |
| Meetings booked/month         | 12-20       | 30-60       |
| Meeting show rate             | 75-85%      | 65-75%      |
| Lead-to-opportunity rate      | 20-25%      | 15-20%      |
| Ramp time                     | 3-6 months  | 2-4 weeks   |
| Annual cost (fully loaded)    | $75K-120K   | $12K-36K    |
+-------------------------------+-------------+-------------+
```

Important: AI SDRs win on volume and cost. Human SDRs win on conversion quality and complex deal navigation. The best teams combine both.

---

## Section 2: The 4-Week AI SDR Deployment Program

### Week 1: Foundation (Signal Setup + List Building)

**Day 1-2: ICP Definition and Signal Configuration**

Define your ICP with scoring criteria:

```
TIER 1 (Score 80-100) - Auto-enroll in sequence
  - Company size: 50-500 employees
  - Revenue: $5M-50M ARR
  - Industry: SaaS, fintech, e-commerce
  - Tech stack: Uses Salesforce/HubSpot + Slack
  - Hiring signal: Posted SDR/AE roles in last 90 days
  - Funding signal: Raised Series A-C in last 12 months

TIER 2 (Score 50-79) - Review before enrolling
  - Meets 3 of 5 firmographic criteria
  - Has at least 1 intent signal
  - No disqualifying factors

TIER 3 (Score 0-49) - Nurture or disqualify
  - Meets fewer than 3 criteria
  - No intent signals detected
```

**Day 3-4: Enrichment Waterfall Setup**

Build a Clay table (or equivalent) with cascading data providers:

```
Step 1: Apollo         --> Email + phone + title
Step 2: Clearbit       --> Firmographics + tech stack
Step 3: ZoomInfo       --> Direct dials + org chart
Step 4: Hunter.io      --> Email verification
Step 5: Claygent       --> Custom web scraping for last-mile data
Step 6: BuiltWith      --> Technology signals
Step 7: LinkedIn Sales  --> Social proximity + mutual connections
        Navigator
```

Target: 80%+ email match rate across your ICP list. If you are below 60% after the waterfall, your source list quality is the problem.

**Day 5: Build Initial Prospect List**

- Pull 500 ICP-scored prospects into your enrichment workflow
- Score each prospect against your tier criteria
- Tag with relevant signals (funding, hiring, tech adoption, content engagement)
- Export Tier 1 prospects (target: 150-200) for Week 2 sequencing

### Week 2: Content (Sequence Creation + Personalization)

**Day 6-7: Persona-Based Email Variants**

Create 3 email variants per buyer persona. Each variant needs:

```
VARIANT STRUCTURE:
  Subject line    --> Pain-point or signal-based (no clickbait)
  Opening line    --> Personalized to signal or recent event
  Value prop      --> One specific outcome, with number if possible
  Social proof    --> Name-drop a similar company or metric
  CTA             --> Low-friction ask (reply, 15-min call, resource)
  Length           --> 50-125 words (5-10 lines max)
```

Example persona matrix:

```
+------------------+--------------------+---------------------+--------------------+
| Persona          | Variant A          | Variant B           | Variant C          |
+------------------+--------------------+---------------------+--------------------+
| VP Sales         | Pipeline velocity  | Rep productivity    | Competitive intel  |
|                  | angle              | angle               | angle              |
+------------------+--------------------+---------------------+--------------------+
| Head of RevOps   | Data accuracy      | Process automation  | Reporting/         |
|                  | angle              | angle               | attribution angle  |
+------------------+--------------------+---------------------+--------------------+
| Founder/CEO      | Revenue growth     | Cost reduction      | Market timing      |
|                  | angle              | angle               | angle              |
+------------------+--------------------+---------------------+--------------------+
```

**Day 8-9: AI Personalization Layer**

For each prospect, generate a personalized opening line using:

- Recent LinkedIn post or article they published
- Company news (funding, product launch, expansion)
- Hiring patterns that indicate pain points
- Mutual connections or shared communities
- Tech stack signals that indicate fit

Personalization formula: [Signal observation] + [Relevance to their role] + [Bridge to your value]

**Day 10: Conditional Branching Logic**

Build sequences with conditional paths:

```
                    Email 1 (Day 0)
                         |
              +----------+----------+
              |                     |
         Opens (no reply)      No open
              |                     |
         Email 2 (Day 3)      Email 2b (Day 4)
         [deeper value]       [new subject line]
              |                     |
         +----+----+          +-----+-----+
         |         |          |           |
      Reply    No reply    Opens      No open
         |         |          |           |
      Route to  LinkedIn    Email 3    Sequence
      human     touch       (Day 7)    ends
                (Day 5)       |
                   |       Reply?
                Reply?        |
                   |     +----+----+
              +----+     |         |
              |    |   Route    Final
           Route  Email 4  to     email
           to   (Day 10) human   (Day 14)
           human  break-up         |
                   email        Archive
```

### Week 3: Launch (Sending Infrastructure + Go-Live)

**Day 11-12: Domain and Mailbox Setup**

Infrastructure requirements:

```
DOMAIN SETUP:
  - Purchase 5-10 secondary domains (variations of primary)
  - Example: getacme.com, acmehq.io, tryacme.com, useacme.co
  - Set up SPF, DKIM, and DMARC records for each
  - Create 2-3 mailboxes per domain
  - Total: 10-30 sending mailboxes

WARMUP PROTOCOL:
  - Day 1-7:   5 emails/day per mailbox (warmup only)
  - Day 8-14:  10 emails/day (mix of warmup + real)
  - Day 15-21: 20 emails/day (mostly real sends)
  - Day 22-28: 30-40 emails/day (full volume)
  - NEVER exceed 50 emails/day per mailbox
```

Compliance requirements (2025+ enforcement):

- SPF, DKIM, DMARC properly configured
- One-click unsubscribe header included
- Spam complaint rate below 0.3%
- Bounce rate below 2%
- Google, Yahoo, and Microsoft all enforce these rules now

**Day 13: Sending Platform Configuration**

Choose your sending layer:

```
+-------------------+-------------------+-------------------+
| Feature           | Instantly         | Smartlead         |
+-------------------+-------------------+-------------------+
| Warmup network    | 4.2M+ accounts    | AI-adaptive       |
| Mailbox limit     | Unlimited         | Unlimited         |
| Lead database     | 450M+ contacts    | No built-in DB    |
| Reply handling    | AI Reply Agent    | Unibox            |
| IP rotation       | Automatic (SISR)  | Manual config     |
| Starting price    | $30/mo            | $39/mo            |
| Best for          | All-in-one        | Deliverability    |
|                   | outbound          | optimization      |
+-------------------+-------------------+-------------------+
```

**Day 14-15: Soft Launch**

- Launch to Tier 1 prospects only (100-150 contacts)
- Monitor deliverability metrics hourly for the first 24 hours
- Check inbox placement (use GlockApps or mail-tester.com)
- Watch for bounce rates above 2% and pause if triggered
- Target: 95%+ delivery rate before expanding volume

### Week 4: Optimize (Measure + Iterate)

**Day 16-18: A/B Testing Framework**

Test one variable at a time:

```
PRIORITY TEST ORDER:
  1. Subject lines     --> Impact on open rate
  2. Opening lines     --> Impact on reply rate
  3. CTA type          --> Impact on positive reply rate
  4. Send timing       --> Impact on open + reply
  5. Sequence length   --> Impact on total conversion
  6. Personalization   --> Impact on reply sentiment
     depth
```

Minimum sample size: 100 sends per variant before drawing conclusions.

**Day 19-20: Reply Sentiment Analysis**

Classify all replies into categories:

```
POSITIVE (route to human immediately):
  - "Tell me more"
  - "Can you send details?"
  - "Let's set up a call"
  - Meeting booked via CTA

NEUTRAL (AI follow-up, then route):
  - "Not now, maybe later"
  - "Send me more info"
  - "Who else do you work with?"

NEGATIVE (remove from sequence):
  - "Not interested"
  - "Remove me"
  - "Wrong person"

OBJECTION (AI handles with playbook):
  - "We already have a solution"
  - "No budget right now"
  - "Need to talk to my team"
```

**Day 21: ICP Scoring Adjustment**

Review first 3 weeks of data and adjust:

- Which firmographic traits correlate with positive replies?
- Which signals predicted meetings booked?
- Which personas converted at the highest rate?
- Which Tier 2 prospects should be upgraded or downgraded?

Recalibrate scoring weights based on actual conversion data, not assumptions.

---

For signal-to-action routing, agent architecture, qualification, human handoff, cost/ROI, and failure modes read `references/implementation-guide.md` when designing or debugging an AI SDR deployment.

---

## Examples

- **User says:** "Set up an AI SDR" → **Result:** Agent asks pipeline need, CRM, and budget; recommends platform (11x, Artisan, AiSDR) and 4-week program; outlines 30-second checklist (ICP, enrichment 80%+, 3 email variants, signal-to-action, sending, handoff, CRM, reply classification); sets speed-to-lead (P0 &lt;5 min, reply handoff &lt;5 min).
- **User says:** "Our AI SDR reply rate is low" → **Result:** Agent checks instruction stack (messaging, personalization, sequence); suggests A/B on first line and CTA; verifies enrichment and signal quality; ties to ai-cold-outreach and lead-enrichment.
- **User says:** "When to use AI SDR vs human SDR?" → **Result:** Agent maps use cases (volume, qualification, handoff); recommends AI for list build, sequences, reply classification; human for first close, complex deals, and handoff triggers; suggests 4-week ramp and weekly optimization.

## Troubleshooting

- **Low meeting conversion** → **Cause:** Weak qualification or wrong handoff. **Fix:** Define qualification criteria and handoff triggers; ensure positive-reply-to-handoff &lt;5 min; train on objection handling; review reply sentiment accuracy.
- **Deliverability issues** → **Cause:** Warmup, volume, or authentication. **Fix:** Run deliverability checklist (SPF, DKIM, DMARC, unsubscribe, bounce &lt;2%, warmup 14–28d, &lt;50/mailbox); test inbox placement (GlockApps, mail-tester).
- **Tool swap didn't help** → **Cause:** Instruction stack or context missing. **Fix:** Document ICP scoring, messaging framework, personalization rules, sequence logic; ensure persistent context and feedback loop; fix architecture before changing tools.

---

For checklists, speed-to-lead targets, deliverability checklist, and discovery questions read `references/quick-reference.md`.

---

## Related Skills

- **ai-cold-outreach** - Deep dive on cold email copywriting, deliverability, and multi-channel sequencing
- **lead-enrichment** - Detailed enrichment waterfall design, data provider selection, and Clay workflows
- **sales-motion-design** - End-to-end sales motion architecture from first touch to close
- **gtm-engineering** - Technical GTM infrastructure, API integrations, and workflow automation
- **solo-founder-gtm** - Lean AI SDR deployment for founders doing everything themselves
- **gtm-metrics** - Pipeline metrics, attribution modeling, and ROI tracking frameworks

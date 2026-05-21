# RFC Creator

A skill for AI coding agents that helps create structured Request for Comments (RFC) documents for proposing significant changes and driving stakeholder decisions.

## What It Does

This skill guides AI agents to create well-structured RFCs that include:

- **Mandatory sections**: Background, Assumptions, Decision Criteria, Options Considered, Action Items, Outcome
- **Recommended sections**: Relevant Data, Pros/Cons comparison, Cost estimates, Resources
- **RACI model**: Driver, Approver, Contributors, Informed — clearly separating who decides from who advises

The skill automatically adapts to:

- **RFC type**: Technical/Architecture, Process/Workflow, Product/Feature, Vendor Selection, Policy/Compliance
- **Context provided**: If you give rich context, it generates immediately; if not, it asks targeted questions
- **User's language**: Automatically generates the RFC in the same language as your request (for example, English, Portuguese, or Spanish)

## RFC vs TDD — Which One Do You Need?

| Question                                                              | Use     |
| --------------------------------------------------------------------- | ------- |
| Should we do X at all? Which option?                                  | **RFC** |
| We've decided on X — how do we build it?                              | **TDD** |
| Need alignment from leadership or multiple teams before acting        | **RFC** |
| Need to document implementation architecture for the engineering team | **TDD** |

When an RFC is approved, you often create a TDD next to plan the implementation.

## How to Use

### Basic Usage

Just ask the agent to write an RFC:

**English:**

```
Write an RFC for migrating our database from MySQL to PostgreSQL
```

**Portuguese:**

```
Escreva um RFC para migrar nosso banco de dados para PostgreSQL
```

**Spanish:**

```
Escribe un RFC para migrar nuestra base de datos a PostgreSQL
```

### With Rich Context (faster — skips questions)

```
Write an RFC for replacing our current logging infrastructure with OpenTelemetry.
We have 3 options: self-hosted Grafana stack, Datadog, or Honeycomb.
Main concern is cost and vendor lock-in. Decision needs approval from @CTO and @SRE-Lead by end of Q1.
```

### Interactive Workflow

If you provide minimal context, the skill will ask:

1. **Topic & impact**: What is being proposed and how broadly it affects systems/teams
2. **Urgency**: Whether there's a deadline or this is open-ended
3. **Options**: Whether you already have alternatives in mind or need help structuring them

Then it validates mandatory fields before generating the document.

## Examples

### Example 1: Vendor/Tool Selection

**Your request:**

```
Write an RFC comparing self-hosted Kafka vs Amazon MSK vs Confluent Cloud for our event streaming needs
```

**What happens:**

1. Agent asks for decision deadline and who approves
2. Agent identifies this as a Vendor Selection RFC → adds cost comparison and lock-in risk focus
3. Agent ensures Decision Criteria are defined before listing options
4. Agent generates RFC with comparison matrix across all three options

**Result:** An RFC with:

- Background (current event streaming setup and why it needs to change)
- Assumptions (e.g., "traffic will not exceed 50k events/sec in 12 months")
- Decision Criteria (cost, operational burden, vendor lock-in, team expertise — with weights)
- Options: Self-hosted Kafka / Amazon MSK / Confluent Cloud + "Do Nothing"
- Options Comparison Matrix
- Action Items (PoC timeline, security review, cost approval)
- Outcome (placeholder for the approved decision)

### Example 2: Process Change

**Your request:**

```
I need an RFC to propose changing our on-call rotation from weekly to bi-weekly shifts
```

**What happens:**

1. Agent identifies this as a Process/Workflow RFC
2. Agent asks for data backing the proposal (e.g., burnout reports, incident patterns)
3. Agent generates RFC focused on team impact and adoption plan

**Result:** An RFC with:

- Background (current rotation pain points with data)
- Assumptions (e.g., "team size stays at 8 engineers")
- Decision Criteria (engineer wellbeing, response time SLA, coverage gaps)
- Options: Bi-weekly / Monthly / Tooling-assisted rotation + Do Nothing
- Action Items (pilot with one team, measure for 60 days)

### Example 3: Architecture Decision

**Your request:**

```
Draft an RFC for moving from our monolith to microservices
```

**What happens:**

1. Agent identifies HIGH impact → ensures Approvers are named
2. Agent asks for data: What specific pain points does the monolith cause?
3. Agent enforces "Do Nothing" option to honestly assess the cost of not changing

**Result:** An RFC with:

- Background (scaling limits, deployment coupling, team velocity data)
- Assumptions (e.g., "we have budget for platform engineering investment in H2")
- Decision Criteria (scalability, team autonomy, time to market, operational complexity)
- Options: Full microservices / Modular monolith / Strangler fig pattern / Do Nothing
- Comparison Matrix (effort, risk, reversibility, team impact)

## What the Agent Will Ask (if context is missing)

**About the proposal:**

- What are you proposing and why now?
- What happens if you don't make this decision?

**About assumptions:**

- What are you taking for granted for this proposal to work?
- What would need to be true for your preferred option to succeed?

**About decision criteria:**

- What matters most when choosing between options?
- Are there any hard requirements that would disqualify an option?
- How do you weigh speed vs cost vs risk?

**About stakeholders:**

- Who is driving this proposal?
- Who must approve before anything moves forward?
- Who should be consulted vs just kept informed?

**About options:**

- What alternatives did you consider?
- Have you thought about keeping the status quo?

## The Generated RFC

Every RFC includes:

1. **Header & Metadata** — Impact (HIGH/MEDIUM/LOW), Status, Driver, Approver, Contributors, Informed, Due Date
2. **Background** — Current state, problem/opportunity, why now, cost of inaction
3. **Assumptions** — Explicit assumptions with confidence levels (High/Medium/Low) and invalidation triggers
4. **Decision Criteria** — Prioritized criteria with weights (Must-have / High / Medium / Low), defined _before_ options
5. **Options Considered** — Each option with description, pros, cons, and effort/risk/cost estimate
6. **Options Comparison Matrix** — Side-by-side view across all options and criteria
7. **Action Items** — Concrete tasks with owners and due dates for after the decision
8. **Outcome** — Placeholder to be filled when the decision is made, including rationale and follow-up

## Tips for Best Results

### 1. Name your approvers upfront

The most common reason RFCs stall is unclear ownership. Telling the agent who needs to approve avoids placeholder `@TBD` entries that nobody acts on.

```
Write an RFC for adopting a monorepo. Approver is @VP-Engineering, contributors are @Frontend-Lead and @Backend-Lead.
```

### 2. Bring data, even rough data

RFCs with quantified problems get approved faster. Even rough numbers help:

```
Our current CI pipeline takes ~45 minutes. We're spending roughly 20% of engineering time
waiting on builds. Write an RFC for switching to a faster CI provider.
```

### 3. List your options explicitly

If you already know the alternatives, name them. The agent won't invent bad options just to fill the template.

```
Write an RFC comparing GitHub Actions, CircleCI, and Buildkite for our CI needs.
```

### 4. State your constraints upfront

```
Write an RFC for our logging solution. Must be SOC 2 compliant. Budget is under $2k/month.
Team has no Kubernetes experience.
```

These become your Must-have Decision Criteria automatically.

### 5. Use your language

The skill detects your language automatically:

- **English**: "Write an RFC for..."
- **Portuguese**: "Escreva um RFC para..."
- **Spanish**: "Escribe un RFC para..."

## Language Support

| Language   | Example Trigger                              |
| ---------- | -------------------------------------------- |
| English    | "Write an RFC for migrating to PostgreSQL"   |
| Portuguese | "Escreva um RFC para migrar para PostgreSQL" |
| Spanish    | "Escribe un RFC para migrar a PostgreSQL"    |

All section headers and content are automatically generated in the detected language.

## What Makes This Skill Different

### 1. Decision Criteria Before Options

Most RFC templates list options first and criteria last — which makes it easy to pick criteria that justify the preferred option after the fact. This skill enforces criteria _before_ options, which produces decisions that hold up to scrutiny.

### 2. Explicit Assumptions with Invalidation Triggers

Every assumption has a confidence level and a trigger that would invalidate it. This turns assumptions from invisible time bombs into tracked risks, and gives teams a clear signal for when to revisit a decision.

### 3. "Do Nothing" as a First-Class Option

The status quo is always an option. Including it honestly forces the team to articulate the true cost of inaction — and sometimes reveals the change isn't worth the effort.

### 4. RACI-based Stakeholder Model

Driver / Approver / Contributors / Informed separates "who decides" from "who advises" from "who is notified." This prevents both design-by-committee and decisions made without the right people in the room.

### 5. Lifecycle-Aware

The RFC tracks status (NOT STARTED → IN PROGRESS → COMPLETE) and the Outcome section is explicitly left as a placeholder during drafting — to be filled in after the Approvers decide. Decisions are dated and signed, creating an audit trail.

## Common Use Cases

### Good use cases for an RFC

- Adopting a new technology, framework, or vendor
- Changing a major architectural pattern (e.g., monolith → microservices)
- Proposing a new engineering process or policy
- Deprecating a system or API
- Making a build-vs-buy decision
- Resolving a significant technical disagreement across teams
- Proposing a budget change requiring leadership approval

### Not ideal for an RFC

- Implementing something already decided (use a **TDD** instead)
- Bug fixes or minor code changes
- One-team decisions with a single approver and low impact
- Exploratory spikes (document findings in a separate write-up first)

## Output Example Structure

```markdown
# RFC: Adopt OpenTelemetry for Distributed Tracing

| Field        | Value                         |
| ------------ | ----------------------------- |
| Impact       | HIGH                          |
| Status       | IN PROGRESS                   |
| Driver       | @platform-lead                |
| Approver     | @vp-engineering, @sre-lead    |
| Contributors | @backend-lead, @frontend-lead |
| Informed     | @engineering-all              |
| Due Date     | 2026-04-15                    |

## Background

[Current observability gaps, cost of incidents without tracing...]

## Assumptions

| #   | Assumption                               | Confidence | Invalidation Trigger  |
| --- | ---------------------------------------- | ---------- | --------------------- |
| 1   | Team can dedicate 2 sprints to migration | Medium     | If Q2 roadmap changes |

## Decision Criteria

| Priority | Criterion        | Weight    |
| -------- | ---------------- | --------- |
| 1        | Vendor-neutral   | Must-have |
| 2        | Cost < $3k/mo    | High      |
| 3        | Team familiarity | Medium    |

## Options Considered

### Option 1: OpenTelemetry + Grafana Tempo ⭐ (Recommended)

### Option 2: Datadog APM

### Option 3: Do Nothing

## Options Comparison

[Matrix across all options and criteria]

## Action Items

[Tasks with owners and due dates]

## Outcome

[To be filled after decision]
```

## Troubleshooting

### The agent keeps asking questions

This is by design — the skill won't generate a shallow RFC. Answer the questions to get a document that will hold up in a stakeholder review. If you want to skip ahead, provide the missing information directly:

```
Driver is @me, Approver is @cto. Assumptions: team has capacity in Q2.
Decision criteria: cost first, then operational simplicity.
```

### I want fewer options

Two options are the minimum — one is not a choice, it's an announcement. If you only see one viable path, make the second option "Do Nothing" and argue honestly why it's worse.

### The RFC is too long

Specify the scope upfront:

```
Write a concise RFC for a LOW impact decision — just Background, two options, and Action Items.
```

### I need to update a decision that was made

RFCs are historical records. Instead of editing the Outcome of a past RFC, write a new RFC that references the original and proposes a change. This preserves the audit trail.

## Next Steps After Creating an RFC

1. **Share** with Contributors for feedback (set a comment deadline)
2. **Present** to Approvers in a review meeting
3. **Record** the decision in the Outcome section with rationale
4. **Notify** Informed parties of the decision
5. **Create a TDD** if the approved option requires implementation planning
6. **Archive** the RFC where the team can find it later (Confluence, Notion, GitHub)

## Support

For issues or questions about this skill, refer to the main [agent-skills repository](https://github.com/tech-leads-club/agent-skills).

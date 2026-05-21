---
name: create-rfc
description: Creates structured Request for Comments (RFC) documents for proposing and deciding on significant changes. Use when the user says "write an RFC", "create a proposal", "I need to propose a change", "draft an RFC", "document a decision", or needs stakeholder alignment before making a major technical or process decision. Do NOT use for TDDs/implementation docs (use technical-design-doc-creator instead), README files, or general documentation.
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: '1.0.0'
---

# RFC Creator

You are an expert in creating Request for Comments (RFC) documents that clearly communicate proposals, capture alternatives considered, and drive structured decision-making across teams.

## When to Use This Skill

Use this skill when:

- User asks to "write an RFC", "create an RFC", "draft a proposal", or "write a request for comments"
- User needs to propose a significant change and gather stakeholder feedback
- A major architectural, process, or product decision needs to be documented before acting
- User wants to align multiple teams or approvers before committing to a direction
- User asks to "document a decision" or "get buy-in" on a proposal
- User needs to compare options and record the chosen direction with rationale

Do NOT use for:

- Technical Design Documents focused on implementation (use `technical-design-doc-creator`)
- Simple meeting notes or summaries
- README files or API documentation

## Language Adaptation

**CRITICAL**: Always generate the RFC in the **same language as the user's request**. Detect the language automatically and generate all content in that language.

- Keep technical terms in English when appropriate (e.g., "API", "RFC", "rollback", "stakeholder")
- Company/product names remain in original language
- Use natural, professional language for the target language

## RFC vs TDD

| Aspect       | RFC                              | TDD                                |
| ------------ | -------------------------------- | ---------------------------------- |
| **Purpose**  | Propose + decide                 | Design + plan implementation       |
| **Audience** | Broad stakeholders, leadership   | Engineering team                   |
| **Focus**    | Should we do X? Which option?    | How do we build X?                 |
| **Output**   | Decision + rationale             | Architecture + implementation plan |
| **Timing**   | Before committing to a direction | After direction is decided         |

Use RFC when the **decision itself** needs alignment. Use TDD when the decision is made and you need to document the **implementation approach**.

## Interactive Workflow

### Step 1: Gather Context (if not provided)

If the user provides no context, use **AskQuestion** to collect basic information:

```json
{
  "title": "RFC Information",
  "questions": [
    {
      "id": "rfc_topic",
      "prompt": "What is the topic or change you want to propose?",
      "options": [{ "id": "free_text", "label": "I'll describe it below" }]
    },
    {
      "id": "rfc_impact",
      "prompt": "What is the estimated impact of this change?",
      "options": [
        { "id": "high", "label": "HIGH - affects multiple teams, systems, or users" },
        { "id": "medium", "label": "MEDIUM - affects one team or system" },
        { "id": "low", "label": "LOW - limited scope, easily reversible" }
      ]
    },
    {
      "id": "rfc_urgency",
      "prompt": "Is there a due date or urgency?",
      "options": [
        { "id": "urgent", "label": "Yes, we need a decision soon" },
        { "id": "planned", "label": "Part of planned roadmap" },
        { "id": "open", "label": "No fixed deadline" }
      ]
    },
    {
      "id": "rfc_options",
      "prompt": "Do you have options/alternatives in mind?",
      "options": [
        { "id": "yes", "label": "Yes, I have 2+ options to compare" },
        { "id": "one", "label": "I have a preferred option, need to document alternatives" },
        { "id": "no", "label": "No, need help structuring options" }
      ]
    }
  ]
}
```

### Step 2: Validate Mandatory Fields

**MANDATORY fields — ask if missing**:

- RFC title (clear, action-oriented)
- Background / context (what is the current state and why this matters)
- Driver (who is proposing / responsible for the decision)
- Approver(s) (who needs to approve)
- Impact level (HIGH / MEDIUM / LOW)
- At least 1 explicit assumption (with confidence level)
- At least 2 decision criteria (with weights), stated before options
- At least 2 options considered (including "do nothing" when relevant)
- Recommended option with rationale tied back to the decision criteria

If any of these are missing, ask IN THE USER'S LANGUAGE before generating the document.

### Step 3: Detect RFC Type and Tailor Sections

| RFC Type                   | Additional Focus Areas                                |
| -------------------------- | ----------------------------------------------------- |
| **Technical/Architecture** | System impact, migration path, technical risks        |
| **Process/Workflow**       | Team impact, adoption plan, rollback if process fails |
| **Product/Feature**        | User impact, metrics, go/no-go criteria               |
| **Vendor/Tool Selection**  | Cost comparison, lock-in risk, evaluation criteria    |
| **Policy/Compliance**      | Regulatory requirements, audit trail, enforcement     |

### Step 4: Generate RFC Document

Generate the RFC in Markdown following the templates below.

### Step 5: Offer Next Steps

After generating, offer:

```
RFC Created: "[Title]"

Sections included:
- Mandatory: Header & Metadata, Background, Assumptions, Decision Criteria, Options Considered, Action Items, Outcome
- Recommended: Relevant Data, Pros/Cons comparison, Cost estimate, Resources

Suggested next steps:
- Share with Contributors for feedback
- Set a decision deadline
- Schedule a review meeting with Approvers
- Link related Jira/Linear tickets

Would you like me to:
1. Add more options to compare?
2. Create a follow-up technical design doc (TDD) for implementation details?
3. Publish this to Confluence?
```

## Document Structure

### Mandatory Sections

1. **Header & Metadata**
2. **Background**
3. **Assumptions**
4. **Decision Criteria**
5. **Options Considered** (minimum 2)
6. **Action Items**
7. **Outcome**

### Recommended Sections

8. **Relevant Data** — metrics, research, evidence
9. **Pros and Cons** (per option)
10. **Estimated Cost** (effort/complexity/monetary)
11. **Resources** — links, references, prior art

---

## Section Templates

Read `references/section-templates.md` when generating an RFC document. It contains complete Markdown templates for all 11 sections (7 mandatory + 4 recommended) with examples and "if missing" prompts for each field.

---

## RFC Quality Checklist

Before finalizing, verify:

- [ ] **Title**: Clear, action-oriented, specific (not "RFC about the database")
- [ ] **Impact**: Assessed as HIGH / MEDIUM / LOW with justification
- [ ] **Background**: Current state + problem + why now + cost of inaction
- [ ] **Assumptions**: Explicit, with confidence levels and invalidation triggers
- [ ] **Decision Criteria**: Defined _before_ options, with weights; Must-haves identified
- [ ] **Data**: At least some evidence supporting the need for change
- [ ] **Options**: Minimum 2 options (including "do nothing" for significant changes)
- [ ] **Options evaluated against criteria**: Not just pros/cons in isolation
- [ ] **Pros/Cons**: Honest assessment, not just selling one option
- [ ] **Cost**: Effort estimate for each option (even if rough)
- [ ] **RACI**: Driver, Approver(s), Contributors, Informed all identified
- [ ] **Action Items**: Concrete next steps after the decision
- [ ] **Outcome**: Left as placeholder to be filled when decision is made

---

## Common Anti-Patterns to Avoid

### Predetermined Conclusion Disguised as RFC

**BAD**:

```
We should use Kubernetes. Here are some reasons. Option 2 is to not use Kubernetes (obviously wrong).
```

**GOOD**:

```
Option 1: Adopt Kubernetes — [genuine pros and cons]
Option 2: Stick with Docker Compose — [genuine pros and cons]
Option 3: Move to managed container platform (ECS/Cloud Run) — [genuine pros and cons]
```

### Vague Background

**BAD**:

```
Our current deployment process has some issues.
```

**GOOD**:

```
Our current deployment process requires 45 minutes of manual steps and has caused 3 production incidents in the past quarter due to human error. The team spends ~8 hours/week on deployment-related tasks.
```

### Missing "Do Nothing" Option

Always include the status quo as an option for significant changes — it forces honest evaluation of whether action is truly needed.

### No Decision Criteria (or criteria defined after options)

**BAD**: Presenting options first, then listing criteria — which looks like the criteria were chosen to justify a preferred option.

**GOOD**: Define criteria with weights _before_ listing options. Then evaluate each option against them explicitly. The recommendation section should reference which criteria drove the decision.

### Hidden or Unstated Assumptions

**BAD**:

```
We'll migrate to the new system over 6 months.
```

**GOOD**:

```
Assumption: The team has 2 engineers available for migration work in Q3.
Confidence: Medium. Invalidated if Q3 headcount changes.
```

Unstated assumptions become invisible time bombs. When the RFC outcome stops working six months later, no one can tell whether the decision was wrong or whether a hidden assumption was invalidated.

---

## Output Summary Format

After generating the RFC:

```
RFC Created: "[Title]"

Impact: HIGH / MEDIUM / LOW
Status: NOT STARTED

Sections included:
- Header & Metadata (Driver, Approver, Due Date)
- Background (current state, problem, why now)
- N options compared with pros/cons and cost estimates
- Action Items (M tasks identified)
- Outcome (placeholder — to be filled after decision)

Suggested next steps:
- Share with Contributors listed for feedback
- Set the decision meeting for [Due Date]
- Update Status to IN PROGRESS

Would you like me to add anything else?
```

---

## Important Notes

- **RFC is for decisions, not implementation** — once the RFC is decided, create a TDD for the implementation plan
- **Honest options are critical** — a one-sided RFC undermines trust and produces bad decisions
- **"Do nothing" is always an option** — helps assess whether change is truly worth it
- **Outcome section is filled after the fact** — leave as placeholder during drafting
- **Language adaptation** — always write in the user's language
- **Respect user's context** — if the user provides rich context, use it; don't ask for what's already given
- **Be concise in options** — focus on the decision factors, not implementation details
- **RFCs age** — date everything; decisions made without context become confusing later

## Example Prompts that Trigger This Skill

### English

- "Write an RFC for migrating our database from MySQL to PostgreSQL"
- "I need an RFC to propose moving from monolith to microservices"
- "Create a request for comments on our on-call rotation policy"
- "Draft an RFC comparing self-hosted vs managed Kafka"
- "I need to get approval to adopt a new design system"

### Portuguese

- "Escreva um RFC para migrar nosso banco de dados"
- "Preciso de um RFC para propor a adoção de uma nova ferramenta"
- "Crie um Request for Comments sobre nossa política de on-call"
- "Quero documentar a decisão de trocar de provedor de cloud"

### Spanish

- "Escribe un RFC para migrar nuestra infraestructura a la nube"
- "Necesito un RFC para proponer un cambio en el proceso de deploy"
- "Crea un Request for Comments sobre la adopción de un nuevo framework"

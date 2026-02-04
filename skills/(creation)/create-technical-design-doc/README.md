# Technical Design Doc Creator

A skill for AI coding agents that helps create comprehensive Technical Design Documents (TDDs) following industry standards.

## What It Does

This skill guides AI agents to create well-structured Technical Design Documents that include:

- **Mandatory sections**: Context, Problem Statement, Scope, Technical Solution, Risks, Implementation Plan
- **Critical sections**: Security (for payments/auth), Monitoring, Rollback Plan, Testing Strategy
- **Optional sections**: Success Metrics, Glossary, Alternatives Considered, Dependencies, Performance Requirements, and more

The skill automatically adapts to:

- **Project size**: Small (< 1 week), Medium (1-4 weeks), Large (> 1 month)
- **Project type**: Integration, Feature, Refactor, Infrastructure, Payment, Auth, Data migration
- **User's language**: Automatically generates TDD in Portuguese, English, or Spanish based on your request

## How to Use

### Basic Usage

Simply ask the AI agent to create a TDD:

**English:**

```
Create a TDD for Stripe payment integration
```

**Portuguese:**

```
Crie um TDD para integração com Stripe
```

**Spanish:**

```
Crea un TDD para integración con Stripe
```

### Interactive Workflow

The skill will guide you through an interactive process:

1. **Initial Questions**: Project name, size, type, and context clarity
2. **Mandatory Information**: Problem statement, scope, technical approach
3. **Critical Sections**: Security, monitoring, rollback (if applicable)
4. **Optional Sections**: Success metrics, glossary, alternatives, etc.

### Examples

#### Example 1: Payment Integration

**Your Request:**

```
Create a TDD for integrating Stripe payments into our subscription system
```

**What Happens:**

1. Agent asks about project size and type
2. Agent requests: problem statement, scope, technical approach
3. Agent identifies this is a payment system → **Security section becomes MANDATORY**
4. Agent asks for: security requirements, monitoring metrics, rollback plan
5. Agent generates comprehensive TDD with all required sections

**Result:** A complete TDD with:

- Context and problem statement
- In-scope/out-of-scope features
- Architecture diagram
- API contracts
- Security considerations (PCI DSS compliance, encryption, PII handling)
- Testing strategy
- Monitoring & observability
- Rollback plan
- Implementation timeline

#### Example 2: Simple Feature

**Your Request:**

```
Write a design doc for adding user profile pictures
```

**What Happens:**

1. Agent identifies this as a small feature
2. Agent asks for basic information
3. Agent generates streamlined TDD with essential sections only

**Result:** A focused TDD with:

- Context
- Problem statement
- Scope (in/out)
- Technical solution (file upload, storage, API endpoints)
- Risks
- Implementation plan
- Testing strategy

#### Example 3: Migration Project

**Your Request:**

```
Crie um TDD para migração do banco de dados PostgreSQL para MongoDB
```

**What Happens:**

1. Agent detects Portuguese language → generates TDD in Portuguese
2. Agent identifies this as a migration project
3. Agent requests: migration strategy, data mapping, rollback plan
4. Agent offers migration plan section

**Result:** A TDD in Portuguese with:

- Contexto (Context)
- Definição do Problema (Problem Statement)
- Escopo (Scope)
- Solução Técnica (Technical Solution)
- Plano de Migração (Migration Plan)
- Plano de Rollback (Rollback Plan)
- Estratégia de Testes (Testing Strategy)

## What to Expect

### The Agent Will Ask Questions

The skill is designed to gather complete information. Expect questions like:

**For Problem Statement:**

- What problem are we solving?
- Why is this important now?
- What happens if we don't solve it?

**For Scope:**

- What WILL be delivered in V1?
- What will NOT be included (out of scope)?

**For Technical Approach:**

- What are the main components?
- How does data flow through the system?
- What APIs will be created/modified?

**For Payment/Auth Projects:**

- How will you handle authentication?
- What encryption will be used?
- What PII is collected?
- Any compliance requirements (GDPR, PCI DSS)?

**For Production Systems:**

- How will you monitor this?
- What metrics matter?
- How will you rollback if something fails?

### The Generated TDD

The TDD will include:

1. **Header & Metadata**: Tech Lead, Team, Epic link, Status, Dates
2. **Context**: Background, domain, stakeholders
3. **Problem Statement**: Specific problems with quantified impact
4. **Scope**: Clear in-scope and out-of-scope items
5. **Technical Solution**: Architecture, data flow, APIs, database changes
6. **Risks**: Risk matrix with impact, probability, and mitigation
7. **Implementation Plan**: Phased breakdown with estimates
8. **Security** (if applicable): Authentication, encryption, compliance
9. **Testing Strategy**: Unit, integration, E2E test plans
10. **Monitoring & Observability**: Metrics, alerts, dashboards
11. **Rollback Plan**: Triggers and steps for reverting changes
12. **Optional sections**: Success metrics, glossary, alternatives, dependencies, etc.

## Tips for Best Results

### 1. Provide Context Early

Instead of:

```
Create a TDD for Stripe
```

Try:

```
Create a TDD for integrating Stripe payments. We need to support subscriptions,
handle webhooks, and comply with PCI DSS. This is for our SaaS product.
```

### 2. Be Specific About Scope

The agent will ask, but you can provide upfront:

```
Create a TDD for user authentication. In scope: email/password, JWT tokens,
password reset. Out of scope: OAuth, 2FA, social login (those are V2).
```

### 3. Mention Project Size

```
Create a TDD for the database migration project. This is a large project
(expected 2 months).
```

### 4. Specify Critical Requirements

For payment/auth systems, mention security requirements:

```
Create a TDD for Stripe integration. We need PCI DSS compliance, webhook
signature validation, and encrypted storage of payment method tokens.
```

### 5. Use Your Language

The skill automatically detects your language. Just write naturally:

- **English**: "Create a TDD for..."
- **Portuguese**: "Crie um TDD para..."
- **Spanish**: "Crea un TDD para..."

## Language Support

The skill supports multiple languages:

| Language   | Example Trigger                           |
| ---------- | ----------------------------------------- |
| English    | "Create a TDD for Stripe integration"     |
| Portuguese | "Crie um TDD para integração com Stripe"  |
| Spanish    | "Crea un TDD para integración con Stripe" |

All section headers and content are automatically translated to match your language.

## Integration with Other Skills

### Confluence Publishing

After generating a TDD, the agent will offer to publish it to Confluence:

```
Would you like me to publish this TDD to Confluence?
- I can create a new page in your space
- Or update an existing page
```

### Jira Integration

The TDD includes a metadata section for Epic/Ticket links. You can manually add these or ask the agent to help create Jira tickets.

## What Makes This Skill Different

### 1. Industry Standards

Follows patterns from:

- Google Design Docs
- Amazon PR-FAQ (Working Backwards)
- RFC Pattern
- ADR (Architecture Decision Records)
- SRE Book (Monitoring, Rollback, SLOs)
- PCI DSS & OWASP (Security)

### 2. Architecture-Focused, Not Implementation

The TDD documents **decisions and contracts**, not code:

✅ **Includes**: API contracts, data schemas, architecture diagrams, strategies
❌ **Avoids**: CLI commands, code snippets, framework-specific implementation

### 3. Adaptive to Project Size

- **Small projects**: Essential sections only (7-9 sections)
- **Medium projects**: Mandatory + critical sections (11-13 sections)
- **Large projects**: All sections (up to 20 sections)

### 4. Mandatory Sections Enforcement

The agent will **insist** on completing mandatory sections before finalizing the TDD. You can't skip:

- Problem Statement
- Scope
- Technical Solution
- Risks
- Implementation Plan

### 5. Critical Sections for Specific Project Types

- **Payment/Auth**: Security section is MANDATORY
- **Production**: Monitoring and Rollback are MANDATORY
- **Integration**: Dependencies and Security are highly recommended

## Common Use Cases

### ✅ Good Use Cases

- New feature development
- External API integration
- System migration or refactoring
- Infrastructure changes
- Payment/billing system design
- Authentication/authorization system
- Data processing pipelines

### ❌ Not Ideal For

- Bug fixes (too small)
- Code refactoring without architectural changes
- Documentation updates
- Simple configuration changes

## Example Output Structure

```
# TDD - [Project Name]

## Metadata
- Tech Lead: @Name
- Team: Name1, Name2
- Status: Draft
- Created: 2026-02-04

## Context
[Background and domain description]

## Problem Statement & Motivation
[Specific problems with impact]

## Scope
### ✅ In Scope
[What will be delivered]

### ❌ Out of Scope
[What won't be included]

## Technical Solution
[Architecture, APIs, data flow, database changes]

## Risks
[Risk matrix with mitigation]

## Implementation Plan
[Phased breakdown with estimates]

## Security Considerations
[Authentication, encryption, compliance]

## Testing Strategy
[Unit, integration, E2E tests]

## Monitoring & Observability
[Metrics, alerts, dashboards]

## Rollback Plan
[Triggers and steps]

[Additional optional sections...]
```

## Troubleshooting

### The Agent Keeps Asking Questions

**This is normal!** The skill is designed to gather complete information. Answer the questions to get a comprehensive TDD.

### I Want to Skip a Section

Mandatory sections cannot be skipped. For optional sections, you can say:

```
Skip the Alternatives Considered section for now
```

### The TDD is Too Detailed

For small projects, specify the size:

```
This is a small project (< 1 week), keep it simple
```

### The TDD is Missing Something

Tell the agent what's missing:

```
Add a section on performance requirements
```

## Next Steps After Creating a TDD

1. **Review**: Check all sections are complete
2. **Share**: Get feedback from team members
3. **Approve**: Get sign-off from stakeholders
4. **Implement**: Use the TDD as a guide during development
5. **Update**: Keep the TDD updated as the project evolves

## Support

For issues or questions about this skill, refer to the main [agent-skills repository](https://github.com/tech-leads-club/agent-skills).

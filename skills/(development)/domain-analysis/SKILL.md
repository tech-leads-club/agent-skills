---
name: domain-analysis
description: Identifies subdomains and suggests bounded contexts in any codebase following DDD Strategic Design. Use when analyzing domain boundaries, identifying business subdomains, assessing domain cohesion, mapping bounded contexts, or when the user asks about DDD strategic design, domain analysis, or subdomain classification.
---

# Subdomain Identification & Bounded Context Analysis

This skill analyzes codebases to identify subdomains (Core, Supporting, Generic) and suggest bounded contexts following Domain-Driven Design Strategic Design principles.

## When to Use

Apply this skill when:

- Analyzing domain boundaries in any codebase
- Identifying Core, Supporting, and Generic subdomains
- Mapping bounded contexts from problem space to solution space
- Assessing domain cohesion and detecting coupling issues
- Planning domain-driven refactoring
- Understanding business capabilities in code

## Core Principles

### Subdomain Classification

**Core Domain**: Competitive advantage, highest business value, requires best developers

- Indicators: Complex business logic, frequent changes, domain experts needed

**Supporting Subdomain**: Essential but not differentiating, business-specific

- Indicators: Supports Core Domain, moderate complexity, business-specific rules

**Generic Subdomain**: Common functionality, could be outsourced

- Indicators: Well-understood problem, low differentiation, standard functionality

### Bounded Context

An explicit linguistic boundary where domain terms have specific, unambiguous meanings.

- Primary nature: Linguistic boundary, not technical
- Key rule: Inside boundary, all Ubiquitous Language terms are unambiguous
- Goal: Align 1 subdomain to 1 bounded context (ideal)

## Analysis Process

### Phase 1: Extract Concepts

Scan codebase for business concepts (not infrastructure):

1. **Entities** (domain models with identity)
   - Patterns: `@Entity`, `class`, domain models
   - Focus: Business concepts, not technical classes

2. **Services** (business operations)
   - Patterns: `*Service`, `*Manager`, `*Handler`
   - Focus: Business logic, not technical utilities

3. **Use Cases** (business workflows)
   - Patterns: `*UseCase`, `*Command`, `*Handler`
   - Focus: Business processes, not CRUD

4. **Controllers/Resolvers** (entry points)
   - Patterns: `*Controller`, `*Resolver`, API endpoints
   - Focus: Business capabilities, not technical routes

### Phase 2: Group by Ubiquitous Language

For each concept, determine:

**Primary Language Context**

- What business vocabulary does this belong to?
- Examples:
  - `Subscription`, `Invoice`, `Payment` → Billing language
  - `Movie`, `Video`, `Episode` → Content language
  - `User`, `Authentication` → Identity language

**Linguistic Boundaries**

- Where do term meanings change?
- Same term, different meaning = different bounded context
- Example: "Customer" in Sales vs "Customer" in Support

**Concept Relationships**

- Which concepts naturally belong together?
- Which share business vocabulary?
- Which reference each other?

### Phase 3: Identify Subdomains

A subdomain has:

- Distinct business capability
- Independent business value
- Unique vocabulary
- Multiple related entities working together
- Cohesive set of business operations

**Common Domain Patterns**:

- Billing/Subscription: Payments, invoices, plans
- Content/Catalog: Media, products, inventory
- Identity/Access: Users, authentication, authorization
- Analytics: Metrics, dashboards, insights
- Notifications: Messages, alerts, communications

**Classify Each Subdomain**:

Use this decision tree:

```
Is it a competitive advantage?
  YES → Core Domain
  NO → Does it require business-specific knowledge?
        YES → Supporting Subdomain
        NO → Generic Subdomain
```

### Phase 4: Assess Cohesion

**High Cohesion Indicators** ✅

- Concepts share Ubiquitous Language
- Concepts frequently used together
- Direct business relationships
- Changes to one affect others in group
- Solve same business problem

**Low Cohesion Indicators** ❌

- Different business vocabularies mixed
- Concepts rarely used together
- No direct business relationship
- Changes don't affect others
- Solve different business problems

**Cohesion Score Formula**:

```
Score = (
  Linguistic Cohesion (0-3) +    // Shared vocabulary
  Usage Cohesion (0-3) +         // Used together
  Data Cohesion (0-2) +          // Entity relationships
  Change Cohesion (0-2)          // Change together
) / 10

8-10: High Cohesion ✅
5-7:  Medium Cohesion ⚠️
0-4:  Low Cohesion ❌
```

### Phase 5: Detect Low Cohesion Issues

**Rule 1: Linguistic Mismatch**

- Problem: Different business vocabularies mixed
- Example: `User` (identity) + `Subscription` (billing) in same service
- Action: Suggest separation into different bounded contexts

**Rule 2: Cross-Domain Dependencies**

- Problem: Tight coupling between domains
- Example: Service A directly instantiates entities from Domain B
- Action: Suggest interface-based integration

**Rule 3: Mixed Responsibilities**

- Problem: Single class handles multiple business concerns
- Example: Service handling both billing and content
- Action: Suggest splitting by subdomain

**Rule 4: Generic in Core**

- Problem: Generic functionality in core business logic
- Example: Email sending in billing service
- Action: Extract to Generic Subdomain

**Rule 5: Unclear Boundaries**

- Problem: Cannot determine which domain concept belongs to
- Example: Entity with relationships to multiple domains
- Action: Clarify boundaries, possibly split concept

### Phase 6: Map Bounded Contexts

For each subdomain identified, suggest bounded context:

**Bounded Context Characteristics**:

- Name reflects Ubiquitous Language
- Contains complete domain model
- Has explicit integration points
- Clear linguistic boundary

**Integration Patterns**:

- Shared Kernel: Shared model between contexts (use sparingly)
- Customer/Supplier: Downstream depends on upstream
- Conformist: Downstream conforms to upstream
- Anti-corruption Layer: Translation layer between contexts
- Open Host Service: Published interface for integration
- Published Language: Well-documented integration protocol

## Output Format

### Domain Map

For each domain/subdomain:

```markdown
## Domain: {Name}

**Type**: Core Domain | Supporting Subdomain | Generic Subdomain

**Ubiquitous Language**: {key business terms}

**Business Capability**: {what business problem it solves}

**Key Concepts**:

- {Concept} (Entity|Service|UseCase) - {brief description}

**Subdomains** (if applicable):

1. {Subdomain} (Core|Supporting|Generic)
   - Concepts: {list}
   - Cohesion: {score}/10
   - Dependencies: → {other domains}

**Suggested Bounded Context**: {Name}Context

- Linguistic boundary: {where terms have specific meaning}
- Integration: {how it should integrate with other contexts}

**Dependencies**:

- → {OtherDomain} via {interface/API}
- ← {OtherDomain} via {interface/API}

**Cohesion Score**: {score}/10
```

### Cohesion Matrix

```markdown
## Cross-Domain Cohesion

| Domain A | Domain B | Cohesion | Issue              | Recommendation          |
| -------- | -------- | -------- | ------------------ | ----------------------- |
| Billing  | Identity | 2/10     | ❌ Direct coupling | Use interface           |
| Content  | Billing  | 6/10     | ⚠️ Usage tracking  | Event-based integration |
```

### Low Cohesion Report

```markdown
## Issues Detected

### Priority: High

**Issue**: {description}

- **Location**: {file/class/method}
- **Problem**: {what's wrong}
- **Concepts**: {involved concepts}
- **Cohesion**: {score}/10
- **Recommendation**: {suggested fix}

### Priority: Medium

{similar format}
```

### Bounded Context Map

```markdown
## Suggested Bounded Contexts

### {ContextName}Context

**Contains Subdomains**:

- {Subdomain1} (Core)
- {Subdomain2} (Supporting)

**Ubiquitous Language**:

- Term: Definition in this context

**Integration Requirements**:

- Consumes from: {OtherContext} via {pattern}
- Publishes to: {OtherContext} via {pattern}

**Implementation Notes**:

- Separate persistence
- Independent deployment
- Explicit API boundaries
```

## Best Practices

### Do's ✅

- Focus on business language, not code structure
- Let Ubiquitous Language guide boundaries
- Measure cohesion objectively
- Identify clear integration points
- Classify every subdomain (Core/Supporting/Generic)
- Look for linguistic boundaries first

### Don'ts ❌

- Don't group by technical layers
- Don't force single global model
- Don't ignore linguistic differences
- Don't couple domains directly
- Don't create contexts by architecture
- Don't eliminate all dependencies (some are necessary)

## Analysis Checklist

**For Each Concept**:

- [ ] What business language does it belong to?
- [ ] What domain/subdomain is it part of?
- [ ] Is it Core, Supporting, or Generic?
- [ ] What other concepts does it relate to?
- [ ] Are dependencies within same domain?
- [ ] Any linguistic mismatches?

**For Each Domain**:

- [ ] What is the Ubiquitous Language?
- [ ] What are the key concepts?
- [ ] What are the subdomains?
- [ ] Which is the Core Domain?
- [ ] What are cross-domain dependencies?
- [ ] Is internal cohesion high?
- [ ] Are boundaries clear?

**For Cohesion Analysis**:

- [ ] Calculate cohesion scores
- [ ] Identify low cohesion areas
- [ ] Map cross-domain dependencies
- [ ] Flag linguistic mismatches
- [ ] Note tight coupling
- [ ] Suggest boundary clarifications

## Quick Reference

### Subdomain Decision Tree

```
Analyze business capability
└─ Is it competitive advantage?
   ├─ YES → Core Domain
   └─ NO → Is it business-specific?
      ├─ YES → Supporting Subdomain
      └─ NO → Generic Subdomain
```

### Cohesion Quick Check

```
Same vocabulary? → High linguistic cohesion
Used together? → High usage cohesion
Direct relationships? → High data cohesion
Change together? → High change cohesion

All high → Strong subdomain candidate
Mix of high/low → Review boundaries
All low → Likely wrong grouping
```

### Bounded Context Signals

```
Clear boundary signs:
✅ Distinct Ubiquitous Language
✅ Concepts have unambiguous meaning
✅ Different meanings across contexts
✅ Clear integration points

Unclear boundary signs:
❌ Same terms with same meanings everywhere
❌ Concepts used identically across system
❌ No clear linguistic differences
❌ Tight coupling everywhere
```

## Anti-Patterns to Avoid

**Big Ball of Mud**

- Everything connected to everything
- No clear boundaries
- Mixed vocabularies
- Prevention: Explicit bounded contexts

**All-Inclusive Model**

- Single model for entire business
- Impossible global definitions
- Creates conflicts
- Prevention: Embrace multiple contexts

**Mixed Linguistic Concepts**

- Different vocabularies in same context
- Example: User/Permission with Forum/Post
- Prevention: Keep linguistic associations

## Notes

- This is strategic analysis, not tactical implementation
- Focus on WHAT domains exist, not HOW to implement
- Some cross-domain dependencies are normal
- Low cohesion doesn't always mean "bad," it means "needs attention"
- Generic Subdomains naturally have lower cohesion
- Always validate with domain experts when possible

## Validation Criteria

Good domain identification has:

- ✅ Clear boundaries with distinct Ubiquitous Language
- ✅ High internal cohesion within domains
- ✅ Explicit cross-domain dependencies
- ✅ Business alignment with capabilities
- ✅ Actionable recommendations for issues

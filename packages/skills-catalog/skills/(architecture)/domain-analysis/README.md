# Subdomain Identification Skill

A Agent Skill for identifying subdomains and suggesting bounded contexts in any codebase following Domain-Driven Design (DDD) Strategic Design principles.

## What This Skill Does

This skill analyzes codebases to:

1. **Extract business concepts** from code (entities, services, use cases, controllers)
2. **Group concepts by Ubiquitous Language** (business vocabulary)
3. **Identify subdomains** and classify them as Core, Supporting, or Generic
4. **Assess cohesion** within and across domains
5. **Detect low cohesion issues** and coupling problems
6. **Suggest bounded contexts** with clear linguistic boundaries
7. **Provide actionable recommendations** for domain separation

## When the Agent Uses This Skill

The agent automatically applies this skill when you:

- Ask to analyze domain boundaries
- Request subdomain identification
- Need help with DDD strategic design
- Want to assess domain cohesion
- Ask about bounded contexts
- Discuss domain-driven refactoring
- Inquire about business capabilities in code

## Key Features

### Generic & Portable

This skill is designed to work with **any codebase** in any language:

- No framework-specific assumptions
- Language-agnostic principles
- Focuses on business concepts, not technical implementation
- Can analyze monoliths, microservices, or hybrid architectures

### DDD Strategic Design Foundation

Based on proven Domain-Driven Design principles:

- **Problem Space**: Identifies subdomains (Core, Supporting, Generic)
- **Solution Space**: Suggests bounded contexts with clear boundaries
- **Ubiquitous Language**: Primary driver for boundary detection
- **Cohesion Analysis**: Objective metrics for domain relationships

### Actionable Output

Provides concrete, actionable analysis:

- Domain maps with cohesion scores
- Cross-domain cohesion matrices
- Low cohesion issue reports with priorities
- Bounded context suggestions with integration patterns
- Clear recommendations for improvement

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Complete analysis process (6 phases)
- Subdomain classification rules
- Cohesion assessment framework
- Low cohesion detection rules
- Output format templates
- Best practices and anti-patterns

### EXAMPLES.md (Practical Examples)

Real-world examples across different domains:

- E-Commerce Platform
- Healthcare System
- SaaS Project Management Tool
- Streaming Video Platform
- Common patterns and solutions
- Quick analysis template

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Decision trees for classification
- Cohesion scoring shortcuts
- Red flags and signals
- Integration pattern guide
- Common mistakes to avoid
- Key questions for assessment

## Usage Examples

### Example 1: Analyze Entire Codebase

```
User: "Analyze the domains in this codebase and suggest bounded contexts"

Agent: [Uses skill to:]
1. Extract all business concepts
2. Group by Ubiquitous Language
3. Identify subdomains
4. Calculate cohesion scores
5. Detect issues
6. Suggest bounded contexts
```

### Example 2: Check Specific Module

```
User: "Is the billing module properly separated from other domains?"

Agent: [Uses skill to:]
1. Analyze billing module concepts
2. Check cross-domain dependencies
3. Assess linguistic cohesion
4. Flag coupling issues
5. Recommend improvements
```

### Example 3: Classify Subdomain

```
User: "Should our recommendation engine be Core or Supporting?"

Agent: [Uses skill to:]
1. Ask: Is it competitive advantage?
2. Assess business differentiation
3. Check complexity & change frequency
4. Classify using decision tree
5. Explain classification
```

## Core Concepts

### Subdomain Types

**Core Domain**

- Your competitive advantage
- What makes your business unique
- Requires best developers and domain experts
- Example: Netflix's recommendation algorithm

**Supporting Subdomain**

- Essential but not differentiating
- Business-specific but not unique
- Supports the Core Domain
- Example: Custom inventory management rules

**Generic Subdomain**

- Common functionality
- Could be outsourced or purchased
- Well-understood solutions
- Example: User authentication, email sending

### Cohesion Scoring

The skill uses a 10-point cohesion scale:

```
Score = Linguistic (0-3) + Usage (0-3) + Data (0-2) + Change (0-2)

8-10: High Cohesion ✅ (Strong subdomain candidate)
5-7:  Medium Cohesion ⚠️ (Review boundaries)
0-4:  Low Cohesion ❌ (Wrong grouping, needs separation)
```

### Bounded Context

An explicit linguistic boundary where all domain terms have specific, unambiguous meanings:

- Primary driver: **Business language**, not technical architecture
- Goal: Align 1 Subdomain to 1 Bounded Context
- Integration: Use interfaces, events, or APIs between contexts
- Size: As big as needed to express complete Ubiquitous Language

## Key Principles

1. **Language Over Architecture**: Bounded contexts are linguistic boundaries, not technical ones
2. **Business Over Technical**: Focus on business capabilities, not code structure
3. **Cohesion is Measurable**: Use objective metrics, not gut feeling
4. **Context is King**: Same term can mean different things in different contexts
5. **Integration is Necessary**: Some cross-domain dependencies are normal and healthy

## Anti-Patterns Detected

The skill identifies common mistakes:

- **Big Ball of Mud**: Everything connected to everything
- **All-Inclusive Model**: Trying to create single global model
- **Mixed Linguistic Concepts**: Different vocabularies in same context
- **Cross-Domain Tight Coupling**: Direct entity references between domains
- **Generic in Core**: Infrastructure concerns in business logic
- **Unclear Boundaries**: Cannot determine which domain owns concept

## Integration Patterns

The skill suggests appropriate integration patterns:

- **Domain Events**: For decoupled, eventual consistency
- **API/Interface**: For synchronous integration with clear contract
- **Anti-Corruption Layer**: For protecting from external systems
- **Published Language**: For stable, documented integration
- **Customer/Supplier**: For clear upstream/downstream relationships

## Installation

This skill is installed at the project level in your agent's skills directory:

```
.{agent}/skills/subdomain-identification/
```

Where `{agent}` is your agent's directory (e.g., `.cursor/`, `.claude/`, `.agent/`, `.github/`, `.opencode/`).

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The agent will automatically discover and use it when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Domains

If your project has specific domain patterns, create a project-level reference:

```
.{agent}/skills/subdomain-identification/
└── project-domains.md  # Document project-specific patterns
```

Link to it from your analysis requests.

### For Framework-Specific Analysis

Add framework-specific patterns to help the skill:

```markdown
## Framework: NestJS

**Entity Pattern**: `@Entity()` decorator
**Service Pattern**: `@Injectable()` classes ending in `Service`
**Controller Pattern**: `@Controller()` decorator
**Use Case Pattern**: Classes ending in `UseCase`
```

## Validation

To verify the skill works correctly, try:

```
User: "What subdomains can you identify in this codebase?"
```

The agent should:

1. Read the SKILL.md file
2. Follow the 6-phase analysis process
3. Output domain maps and cohesion matrices
4. Provide actionable recommendations

## References

This skill is based on:

- **Domain-Driven Design** by Eric Evans
- **Implementing Domain-Driven Design** by Vaughn Vernon
- Strategic Design principles from the DDD community

## License

This skill can be used, modified, and shared freely. It's designed to be portable across any codebase or organization.

## Contributing

To improve this skill:

1. Add more examples to `EXAMPLES.md`
2. Expand the quick reference with new patterns
3. Add language/framework-specific detection patterns
4. Document new anti-patterns or red flags
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: DDD Strategic Design Theory

---

## Quick Start

To use this skill immediately:

```
User: "Analyze domains in my codebase"
User: "Identify subdomains and suggest bounded contexts"
User: "Check cohesion between [DomainA] and [DomainB]"
User: "Is [concept] Core, Supporting, or Generic?"
```

The agent will automatically apply this skill and provide comprehensive analysis.

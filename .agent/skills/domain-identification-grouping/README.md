# Domain Identification and Grouping Skill

A skill for grouping architectural components into logical domains (business areas) to prepare for creating domain services in a service-based architecture.

## What This Skill Does

This skill analyzes codebases to:

1. **Identify business domains** based on component responsibilities and business capabilities
2. **Group components into domains** by analyzing functionality and relationships
3. **Validate domain groupings** to ensure components fit well
4. **Refactor namespaces** to align component namespaces with identified domains
5. **Create domain maps** visualizing domain structure and component groupings
6. **Document domain boundaries** and relationships
7. **Prepare for domain services** extraction in service-based architecture

## When to Use This Skill

This skill is applied when you:

- Ask to group components into logical domains
- Request domain identification for service-based architecture
- Need help creating component domains
- Want to analyze which components belong to which domains
- Ask about domain grouping or organization
- Plan to create domain services
- Discuss component-to-domain mapping

## Key Features

### Business-Focused Domain Identification

This skill focuses on **business capabilities**, not technical layers:

- Groups components by business vocabulary and capabilities
- Identifies domains based on what the business does
- Ensures domains represent distinct business areas
- Requires collaboration with business stakeholders

### Multiple Identification Strategies

Uses multiple approaches to identify domains:

1. **Business Capability Analysis**: What business capabilities does the system provide?
2. **Vocabulary Analysis**: What business language do components use?
3. **Relationship Analysis**: Which components are frequently used together?
4. **Stakeholder Collaboration**: What do business experts say?

### Namespace Refactoring

Aligns component namespaces with identified domains:

- Identifies components needing namespace changes
- Suggests target namespaces for domain alignment
- Creates refactoring plans with priorities
- Ensures clear domain boundaries in code structure

### Domain Validation

Validates domain groupings before proceeding:

- Checks cohesion within domains
- Verifies domain boundaries are clear
- Ensures all components are assigned
- Gets stakeholder validation

## Files Included

### SKILL.md (Main Skill)

The primary skill file containing:

- Domain identification methodology
- Component grouping process
- Domain validation framework
- Namespace refactoring guidance
- Domain mapping techniques
- Output format templates
- Implementation notes for different languages
- Fitness function examples

### QUICK-REFERENCE.md (Quick Lookup)

Fast reference for common scenarios:

- Domain identification strategies
- Component grouping guidelines
- Namespace refactoring patterns
- Domain validation checklist
- Output template

### README.md (This File)

Complete documentation including:

- What the skill does
- When to use it
- Usage examples
- Core concepts
- Integration with other skills

## Usage Examples

### Example 1: Identify Domains

```
User: "Group components into logical domains"

The skill will:
1. Analyze component responsibilities
2. Identify business domains
3. Group components into domains
4. Create domain map
5. Suggest namespace refactoring
```

**Output**:

```markdown
## Identified Domains

1. **Customer Domain** (ss.customer)
   - Customer Profile
   - Billing Payment
   - Billing History
   - Support Contract

2. **Ticketing Domain** (ss.ticket)
   - Ticket Maintenance
   - Ticket Assignment
   - Ticket Routing
   - Knowledge Base
   - Survey

3. **Reporting Domain** (ss.reporting)
   - Ticket Reports
   - Expert Reports
   - Financial Reports
```

### Example 2: Domain Assignment

```
User: "Which domain should the billing components belong to?"

The skill will:
1. Analyze billing component functionality
2. Check relationships with other components
3. Identify appropriate domain
4. Recommend domain assignment
```

**Output**:

```markdown
## Domain Assignment

**Billing Payment Component**:

- Current: ss.billing.payment
- Functionality: Customer billing and payment processing
- Relationships: Used with Customer Profile, Support Contract
- **Recommendation**: Customer Domain (ss.customer.billing.payment)

**Reasoning**: Billing is customer-related functionality, not a separate domain
```

### Example 3: Namespace Refactoring

```
User: "What namespace refactoring is needed to align components with domains?"

The skill will:
1. Compare current namespaces to identified domains
2. Identify misaligned components
3. Suggest namespace changes
4. Create refactoring plan
```

**Output**:

```markdown
## Namespace Refactoring Plan

### Customer Domain Alignment

| Component        | Current            | Target                      | Action        |
| ---------------- | ------------------ | --------------------------- | ------------- |
| Billing Payment  | ss.billing.payment | ss.customer.billing.payment | Add .customer |
| Billing History  | ss.billing.history | ss.customer.billing.history | Add .customer |
| Support Contract | ss.supportcontract | ss.customer.supportcontract | Add .customer |
```

## Core Concepts

### Domain Definition

A **domain** is a logical grouping of components that:

- Represents a distinct business capability or area
- Contains related components that work together
- Has clear boundaries and responsibilities
- Can become a domain service in service-based architecture

**Examples**:

- **Customer Domain**: Customer management, billing, support
- **Ticketing Domain**: Ticket processing, knowledge base, surveys
- **Reporting Domain**: Reports and analytics

### Component Domain Relationship

**One-to-Many**: A single domain contains multiple components

```
Domain: Customer
├── Component: Customer Profile
├── Component: Billing Payment
├── Component: Billing History
└── Component: Support Contract
```

### Domain Manifestation

Domains are physically manifested through **namespace structure**:

**Before Domain Alignment**:

```
services/billing/payment
services/customer/profile
```

**After Domain Alignment**:

```
services/customer/billing/payment
services/customer/profile
```

All customer-related functionality grouped under `.customer` domain.

## How to Use

### Quick Start

Request analysis of your codebase:

```
"Group components into logical domains"
"Identify component domains for service-based architecture"
"Create domain groupings from components"
"Analyze which components belong to which domains"
```

### Step-by-Step Usage

#### 1. Identify Domains

Start by identifying business domains:

```
User: "What domains exist in this codebase?"
```

This will:

- Analyze component responsibilities
- Identify business capabilities
- Identify distinct business domains
- Validate with component relationships

#### 2. Group Components

Assign components to domains:

```
User: "Group all components into their appropriate domains"
```

This will:

- Analyze each component's functionality
- Check component relationships
- Assign components to domains
- Handle edge cases

#### 3. Validate Groupings

Ensure components fit well:

```
User: "Do the component domain assignments make sense?"
```

This will:

- Check cohesion within domains
- Verify domain boundaries
- Ensure all components assigned
- Flag any issues

#### 4. Refactor Namespaces

Align namespaces with domains:

```
User: "What namespace refactoring is needed for domain alignment?"
```

This will:

- Compare current vs target namespaces
- Identify components needing refactoring
- Create refactoring plan
- Prioritize work

### Advanced Usage

#### Stakeholder Collaboration

Include business stakeholders:

```
User: "Identify domains and validate with product owner"
```

#### Custom Domain Rules

Specify domain rules:

```
User: "Group components into domains, ensuring billing stays in Customer domain"
```

#### Domain Size Analysis

Analyze domain sizes:

```
User: "Are any domains too large or too small?"
```

## Output Format

The skill generates structured output:

### Domain Identification Report

```markdown
## Domain Identification

### Domain: Customer (ss.customer)

**Business Capability**: Manages customer relationships, billing, and support

**Components**:

- Customer Profile
- Billing Payment
- Billing History
- Support Contract

**Component Count**: 4
**Total Size**: ~15,000 statements (18% of codebase)

**Domain Cohesion**: ✅ High

- Components share customer-related vocabulary
- Components frequently used together
- Direct relationships between components
```

### Component Domain Assignment Table

```markdown
## Component Domain Assignment

| Component          | Current Namespace     | Assigned Domain | Target Namespace            |
| ------------------ | --------------------- | --------------- | --------------------------- |
| Customer Profile   | ss.customer.profile   | Customer        | ss.customer.profile         |
| Billing Payment    | ss.billing.payment    | Customer        | ss.customer.billing.payment |
| Ticket Maintenance | ss.ticket.maintenance | Ticketing       | ss.ticket.maintenance       |
```

### Namespace Refactoring Plan

```markdown
## Namespace Refactoring Plan

### Priority: High

**Customer Domain Alignment**

**Components to Refactor**:

1. Billing Payment: `ss.billing.payment` → `ss.customer.billing.payment`
2. Billing History: `ss.billing.history` → `ss.customer.billing.history`

**Steps**:

1. Update namespace declarations
2. Update import statements
3. Update directory structure
4. Run tests
5. Update documentation
```

### Domain Map Visualization

```markdown
## Domain Map

Customer Domain (ss.customer)
├── Customer Profile
├── Billing Payment
├── Billing History
└── Support Contract

Ticketing Domain (ss.ticket)
├── Ticket Maintenance
├── Ticket Assignment
└── Ticket Routing
```

## Integration with Other Skills

This skill is part of a decomposition pattern sequence:

1. **Component Identification & Sizing** → Understand what you have
2. **Component Dependency Analysis** → Assess coupling
3. **Common Domain Component Detection** → Find duplicates
4. **Component Flattening** → Remove orphaned classes
5. **Domain Identification & Grouping** (this skill) → Group into domains
6. **Service Boundary Recommendation** → Plan service extraction

Use this skill after flattening components and before creating domain services.

## Installation

This skill is installed at the project level:

```
skills/domain-identification-grouping/
```

This means it's:

- **Shared with the repository**: Anyone cloning this repo gets the skill
- **Version controlled**: Changes are tracked in git
- **Project-specific**: Can be customized for this codebase

The skill will be automatically discovered and used when appropriate based on the description in the frontmatter.

## Customization

### For Project-Specific Domains

Document your project's domain structure:

```
skills/domain-identification-grouping/
└── project-domains.md  # Document project-specific domains
```

### For Framework-Specific Analysis

Add framework-specific patterns:

```markdown
## Framework: NestJS

**Domain Pattern**: `@Module()` decorator groups domain components
**Domain Structure**: `modules/[domain]/[component]/`
**Example**: `modules/customer/billing/`
```

### Custom Domain Rules

Modify domain rules in SKILL.md:

```markdown
## Custom Domain Rules

For this project:

- Billing always belongs to Customer domain
- Reporting is always a separate domain
- Admin functionality grouped under Admin domain
```

## Fitness Functions

After creating domains, create automated checks:

### Domain Namespace Governance

```javascript
// Ensure components belong to correct domain
function validateDomainNamespaces(components, domainRules) {
  const violations = []

  components.forEach((comp) => {
    const domain = identifyDomain(comp.namespace)
    const expectedDomain = domainRules[comp.name]

    if (domain !== expectedDomain) {
      violations.push({
        component: comp.name,
        currentDomain: domain,
        expectedDomain: expectedDomain,
      })
    }
  })

  return violations
}
```

### Domain Boundary Enforcement

```javascript
// Prevent cross-domain direct dependencies
function enforceDomainBoundaries(components) {
  const violations = []

  components.forEach((comp) => {
    comp.imports.forEach((imp) => {
      const importedDomain = identifyDomain(imp)
      const componentDomain = identifyDomain(comp.namespace)

      if (importedDomain !== componentDomain && importedDomain !== 'shared') {
        violations.push({
          component: comp.name,
          importsFrom: imp,
          issue: 'Cross-domain direct dependency',
        })
      }
    })
  })

  return violations
}
```

## Best Practices

### Do's ✅

- Collaborate with business stakeholders to identify domains
- Group components by business capability, not technical layers
- Ensure domains represent distinct business areas
- Validate domain boundaries with stakeholders
- Refactor namespaces to align with domains
- Create clear domain documentation
- Use business language in domain names
- Aim for 3-7 domains (not too many, not too few)

### Don'ts ❌

- Don't create domains based on technical layers
- Don't force components into domains where they don't fit
- Don't skip stakeholder validation
- Don't create too many small domains
- Don't create domains that are too large (monolithic)
- Don't ignore components that don't fit (analyze why)
- Don't skip namespace refactoring

## Common Domain Patterns

### Typical Domains in Business Applications

- **Customer Domain**: Customer management, profiles, relationships
- **Product Domain**: Product catalog, inventory, pricing
- **Order Domain**: Order processing, fulfillment
- **Billing Domain**: Invoicing, payments, transactions
- **Reporting Domain**: Reports, analytics, dashboards
- **Admin Domain**: User management, configuration
- **Shared Domain**: Common functionality (login, notification)

### Domain Size Guidelines

- **Small Domain**: 2-4 components
- **Medium Domain**: 5-8 components
- **Large Domain**: 9-15 components
- **Too Large**: >15 components (consider splitting)

## Troubleshooting

### Components Don't Fit Any Domain

**Issue**: Some components don't clearly belong to any domain

**Solution**:

- Analyze component functionality more deeply
- Check if component is truly domain-specific
- Consider if component belongs to Shared domain
- May need to create new domain or split component

### Too Many/Few Domains

**Issue**: Identified too many or too few domains

**Solution**:

- Aim for 3-7 domains typically
- Too many: Consider merging related domains
- Too few: Consider splitting large domains
- Validate with stakeholders

### Namespace Refactoring Too Complex

**Issue**: Refactoring seems too difficult

**Solution**:

- Break into smaller steps
- Refactor one domain at a time
- Use automated refactoring tools
- Update tests incrementally

## References

This skill is based on:

- **Software Architecture: The Hard Parts** by Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani
- **Create Component Domains Pattern** (Chapter 5)
- **Fundamentals of Software Architecture** by Mark Richards & Neal Ford
- **Domain-Driven Design** by Eric Evans

## Contributing

To improve this skill:

1. Add language-specific domain patterns
2. Expand framework-specific domain detection
3. Add more domain identification strategies
4. Document new anti-patterns or red flags
5. Share real-world case studies

## Version

**Version**: 1.0.0  
**Created**: 2026-02-05  
**Based on**: Create Component Domains Pattern from "Software Architecture: The Hard Parts"

---

## Quick Start

To use this skill immediately:

```
User: "Group components into logical domains"
User: "Identify component domains for service-based architecture"
User: "Create domain groupings from components"
User: "Analyze which components belong to which domains"
```

This skill will automatically be applied to provide comprehensive domain identification and grouping analysis.

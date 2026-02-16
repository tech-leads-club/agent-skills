---
name: domain-identification-grouping
description: Groups components into logical domains for service-based architecture. Use when creating component domains, grouping components by business functionality, planning domain services, analyzing component relationships, or when the user asks about domain grouping, component domains, or domain identification.
---

# Domain Identification and Grouping

This skill groups architectural components into logical domains (business areas) to prepare for creating domain services in a service-based architecture.

## How to Use

### Quick Start

Request analysis of your codebase:

- **"Group components into logical domains"**
- **"Identify component domains for service-based architecture"**
- **"Create domain groupings from components"**
- **"Analyze which components belong to which domains"**

### Usage Examples

**Example 1: Domain Identification**

```
User: "Group components into logical domains"

The skill will:
1. Analyze component responsibilities and relationships
2. Identify business domains based on functionality
3. Group components into domains
4. Create domain diagrams
5. Suggest namespace refactoring for domain alignment
```

**Example 2: Domain Analysis**

```
User: "Which domain should the billing components belong to?"

The skill will:
1. Analyze billing component functionality
2. Check relationships with other components
3. Identify appropriate domain (e.g., Customer or Financial)
4. Recommend domain assignment
```

**Example 3: Domain Refactoring**

```
User: "What namespace refactoring is needed to align components with domains?"

The skill will:
1. Compare current component namespaces to identified domains
2. Identify misaligned components
3. Suggest namespace changes
4. Create refactoring plan
```

### Step-by-Step Process

1. **Identify Domains**: Analyze business capabilities and component relationships
2. **Group Components**: Assign components to appropriate domains
3. **Validate Groupings**: Ensure components fit well in their domains
4. **Refactor Namespaces**: Align component namespaces with domains
5. **Create Domain Map**: Visualize domain structure and component groupings

## When to Use

Apply this skill when:

- After identifying, sizing, and analyzing component dependencies
- Before creating domain services (Pattern 6)
- When planning service-based architecture migration
- Analyzing component relationships and business alignment
- Preparing for domain-driven design implementation
- Grouping components for better organization

## Core Concepts

### Domain Definition

A **domain** is a logical grouping of components that:

- Represents a distinct business capability or area
- Contains related components that work together
- Has clear boundaries and responsibilities
- Can become a domain service in service-based architecture

**Examples**:

- **Customer Domain**: Customer profile, billing, support contracts
- **Ticketing Domain**: Ticket creation, assignment, routing, completion
- **Reporting Domain**: Ticket reports, expert reports, financial reports

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
services/billing/history
services/customer/profile
services/supportcontract
```

**After Domain Alignment**:

```
services/customer/billing/payment
services/customer/billing/history
services/customer/profile
services/customer/supportcontract
```

Notice how all customer-related functionality is grouped under `.customer` domain.

## Analysis Process

### Phase 1: Identify Business Domains

Analyze the codebase to identify distinct business domains:

1. **Examine Component Responsibilities**
   - Read component names and descriptions
   - Understand what each component does
   - Identify business capabilities

2. **Look for Business Language**
   - Group components by business vocabulary
   - Example: "billing", "payment", "invoice" → Financial domain
   - Example: "customer", "profile", "contract" → Customer domain

3. **Identify Domain Boundaries**
   - Where do business concepts change?
   - What are the distinct business areas?
   - How do components relate to business capabilities?

4. **Collaborate with Business Stakeholders**
   - Validate domain identification with product owners
   - Ensure domains align with business understanding
   - Get feedback on domain boundaries

**Example Domain Identification**:

```markdown
## Identified Domains

1. **Ticketing Domain** (ss.ticket)
   - Ticket creation, assignment, routing, completion
   - Customer surveys
   - Knowledge base

2. **Customer Domain** (ss.customer)
   - Customer profile
   - Billing and payment
   - Support contracts

3. **Reporting Domain** (ss.reporting)
   - Ticket reports
   - Expert reports
   - Financial reports

4. **Admin Domain** (ss.admin)
   - User maintenance
   - Expert profile management

5. **Shared Domain** (ss.shared)
   - Login
   - Notification
```

### Phase 2: Group Components into Domains

Assign each component to an appropriate domain:

1. **Analyze Component Functionality**
   - What business capability does it support?
   - What domain vocabulary does it use?
   - What other components does it relate to?

2. **Check Component Relationships**
   - Which components are frequently used together?
   - What are the dependencies between components?
   - Do components share data or workflows?

3. **Assign to Domain**
   - Place component in domain that best fits its functionality
   - Ensure component aligns with domain's business language
   - Verify component relationships support domain grouping

4. **Handle Edge Cases**
   - Components that don't fit clearly: Analyze more deeply
   - Components that fit multiple domains: Choose primary domain
   - Shared components: May belong to Shared domain

**Example Component Grouping**:

```markdown
## Component Domain Assignment

### Ticketing Domain (ss.ticket)

- Ticket Shared (ss.ticket.shared)
- Ticket Maintenance (ss.ticket.maintenance)
- Ticket Completion (ss.ticket.completion)
- Ticket Assign (ss.ticket.assign)
- Ticket Route (ss.ticket.route)
- KB Maintenance (ss.ticket.kb.maintenance)
- KB Search (ss.ticket.kb.search)
- Survey (ss.ticket.survey)

### Customer Domain (ss.customer)

- Customer Profile (ss.customer.profile)
- Billing Payment (ss.customer.billing.payment)
- Billing History (ss.customer.billing.history)
- Support Contract (ss.customer.supportcontract)

### Reporting Domain (ss.reporting)

- Reporting Shared (ss.reporting.shared)
- Ticket Reports (ss.reporting.tickets)
- Expert Reports (ss.reporting.experts)
- Financial Reports (ss.reporting.financial)
```

### Phase 3: Validate Domain Groupings

Ensure components fit well in their assigned domains:

1. **Check Cohesion**
   - Do components in domain share business language?
   - Are components frequently used together?
   - Do components have direct relationships?

2. **Verify Boundaries**
   - Are domain boundaries clear?
   - Do components belong to only one domain?
   - Are there components that don't fit anywhere?

3. **Assess Completeness**
   - Are all components assigned to a domain?
   - Are domains cohesive and well-formed?
   - Do domains represent distinct business capabilities?

4. **Get Stakeholder Validation**
   - Review domain groupings with product owners
   - Ensure domains align with business understanding
   - Get feedback on domain boundaries

**Validation Checklist**:

- [ ] All components assigned to a domain
- [ ] Domains have clear boundaries
- [ ] Components fit well in their domains
- [ ] Domains represent distinct business capabilities
- [ ] Stakeholders validate domain groupings

### Phase 4: Refactor Namespaces for Domain Alignment

Align component namespaces with identified domains:

1. **Compare Current vs Target Namespaces**
   - Current: `services/billing/payment`
   - Target: `services/customer/billing/payment`
   - Change: Add `.customer` domain node

2. **Identify Refactoring Needed**
   - Which components need namespace changes?
   - What domain nodes need to be added?
   - Are there components already aligned?

3. **Create Refactoring Plan**
   - List components needing namespace changes
   - Specify target namespace for each
   - Prioritize refactoring work

4. **Execute Refactoring**
   - Update component namespaces
   - Update imports/references
   - Verify all references updated

**Example Namespace Refactoring**:

```markdown
## Namespace Refactoring Plan

### Customer Domain Alignment

| Component        | Current Namespace   | Target Namespace            | Action        |
| ---------------- | ------------------- | --------------------------- | ------------- |
| Billing Payment  | ss.billing.payment  | ss.customer.billing.payment | Add .customer |
| Billing History  | ss.billing.history  | ss.customer.billing.history | Add .customer |
| Customer Profile | ss.customer.profile | ss.customer.profile         | No change     |
| Support Contract | ss.supportcontract  | ss.customer.supportcontract | Add .customer |

### Ticketing Domain Alignment

| Component      | Current Namespace | Target Namespace         | Action      |
| -------------- | ----------------- | ------------------------ | ----------- |
| KB Maintenance | ss.kb.maintenance | ss.ticket.kb.maintenance | Add .ticket |
| KB Search      | ss.kb.search      | ss.ticket.kb.search      | Add .ticket |
| Survey         | ss.survey         | ss.ticket.survey         | Add .ticket |
```

### Phase 5: Create Domain Map

Visualize domain structure and component groupings:

1. **Create Domain Diagram**
   - Show domains as boxes
   - Show components within each domain
   - Show relationships between domains

2. **Document Domain Structure**
   - List domains and their components
   - Describe domain responsibilities
   - Note domain boundaries

3. **Create Domain Inventory**
   - Table of domains and components
   - Component counts per domain
   - Size metrics per domain

**Example Domain Map**:

```markdown
## Domain Map
```

┌─────────────────────────────────────┐
│ Ticketing Domain (ss.ticket) │
├─────────────────────────────────────┤
│ • Ticket Shared │
│ • Ticket Maintenance │
│ • Ticket Completion │
│ • Ticket Assign │
│ • Ticket Route │
│ • KB Maintenance │
│ • KB Search │
│ • Survey │
└─────────────────────────────────────┘
│
│ uses
▼
┌─────────────────────────────────────┐
│ Customer Domain (ss.customer) │
├─────────────────────────────────────┤
│ • Customer Profile │
│ • Billing Payment │
│ • Billing History │
│ • Support Contract │
└─────────────────────────────────────┘

````

## Output Format

### Domain Identification Report

```markdown
## Domain Identification

### Domain: Customer (ss.customer)

**Business Capability**: Manages customer relationships, billing, and support contracts

**Components**:
- Customer Profile (ss.customer.profile)
- Billing Payment (ss.customer.billing.payment)
- Billing History (ss.customer.billing.history)
- Support Contract (ss.customer.supportcontract)

**Component Count**: 4
**Total Size**: ~15,000 statements (18% of codebase)

**Domain Cohesion**: ✅ High
- Components share customer-related vocabulary
- Components frequently used together
- Direct relationships between components

**Boundaries**:
- Clear separation from Ticketing domain
- Clear separation from Reporting domain
- Shared components (Notification) used by all domains
````

### Component Domain Assignment Table

```markdown
## Component Domain Assignment

| Component          | Current Namespace     | Assigned Domain | Target Namespace                  |
| ------------------ | --------------------- | --------------- | --------------------------------- |
| Customer Profile   | ss.customer.profile   | Customer        | ss.customer.profile (no change)   |
| Billing Payment    | ss.billing.payment    | Customer        | ss.customer.billing.payment       |
| Ticket Maintenance | ss.ticket.maintenance | Ticketing       | ss.ticket.maintenance (no change) |
| KB Maintenance     | ss.kb.maintenance     | Ticketing       | ss.ticket.kb.maintenance          |
| Reporting Shared   | ss.reporting.shared   | Reporting       | ss.reporting.shared (no change)   |
```

### Namespace Refactoring Plan

```markdown
## Namespace Refactoring Plan

### Priority: High

**Customer Domain Alignment**

**Components to Refactor**:

1. Billing Payment: `ss.billing.payment` → `ss.customer.billing.payment`
2. Billing History: `ss.billing.history` → `ss.customer.billing.history`
3. Support Contract: `ss.supportcontract` → `ss.customer.supportcontract`

**Steps**:

1. Update namespace declarations in source files
2. Update import statements in dependent components
3. Update directory structure
4. Run tests to verify changes
5. Update documentation

**Expected Impact**:

- All customer-related components aligned under `.customer` domain
- Clearer domain boundaries
- Easier to identify domain components
```

### Domain Map Visualization

```markdown
## Domain Map

### Domain Structure
```

Customer Domain (ss.customer)
├── Customer Profile
├── Billing Payment
├── Billing History
└── Support Contract

Ticketing Domain (ss.ticket)
├── Ticket Shared
├── Ticket Maintenance
├── Ticket Completion
├── Ticket Assign
├── Ticket Route
├── KB Maintenance
├── KB Search
└── Survey

Reporting Domain (ss.reporting)
├── Reporting Shared
├── Ticket Reports
├── Expert Reports
└── Financial Reports

Admin Domain (ss.admin)
├── User Maintenance
└── Expert Profile

Shared Domain (ss.shared)
├── Login
└── Notification

```

### Domain Relationships

```

Ticketing Domain
│ uses
├─→ Shared Domain (Login, Notification)
└─→ Customer Domain (Customer Profile)

Customer Domain
│ uses
└─→ Shared Domain (Login, Notification)

Reporting Domain
│ uses
├─→ Ticketing Domain (Ticket data)
├─→ Customer Domain (Customer data)
└─→ Shared Domain (Login)

```

```

## Analysis Checklist

**Domain Identification**:

- [ ] Analyzed component responsibilities
- [ ] Identified business capabilities
- [ ] Identified distinct business domains
- [ ] Validated domains with stakeholders

**Component Grouping**:

- [ ] Assigned each component to a domain
- [ ] Analyzed component relationships
- [ ] Ensured components fit domain vocabulary
- [ ] Handled edge cases (shared components, unclear assignments)

**Domain Validation**:

- [ ] Checked cohesion within domains
- [ ] Verified domain boundaries are clear
- [ ] Ensured all components assigned
- [ ] Validated with stakeholders

**Namespace Refactoring**:

- [ ] Compared current vs target namespaces
- [ ] Identified components needing refactoring
- [ ] Created refactoring plan
- [ ] Prioritized refactoring work

**Domain Mapping**:

- [ ] Created domain diagram
- [ ] Documented domain structure
- [ ] Created domain inventory table
- [ ] Documented domain relationships

## Implementation Notes

### For Node.js/Express Applications

Domains typically organized in `services/` directory:

```
services/
├── customer/              ← Customer Domain
│   ├── profile/
│   ├── billing/
│   │   ├── payment/
│   │   └── history/
│   └── supportcontract/
├── ticket/                ← Ticketing Domain
│   ├── shared/
│   ├── maintenance/
│   ├── assign/
│   └── route/
└── reporting/             ← Reporting Domain
    ├── shared/
    ├── tickets/
    └── experts/
```

### For Java Applications

Domains identified by package structure:

```
com.company.customer       ← Customer Domain
├── profile
├── billing
│   ├── payment
│   └── history
└── supportcontract

com.company.ticket         ← Ticketing Domain
├── shared
├── maintenance
├── assign
└── route
```

### Domain Identification Strategies

**Strategy 1: Business Capability Analysis**

- Identify what business capabilities the system provides
- Group components by capability
- Example: "Customer Management" capability → Customer Domain

**Strategy 2: Vocabulary Analysis**

- Identify business vocabulary used by components
- Group components sharing same vocabulary
- Example: Components using "billing", "payment", "invoice" → Financial Domain

**Strategy 3: Relationship Analysis**

- Identify components frequently used together
- Group components with strong relationships
- Example: Components that share data/workflows → Same Domain

**Strategy 4: Stakeholder Collaboration**

- Work with product owners/business analysts
- Use their understanding of business areas
- Validate domain boundaries with them

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
        namespace: comp.namespace,
      })
    }
  })

  return violations
}
```

### Domain Boundary Enforcement

```javascript
// Prevent components from accessing other domains directly
function enforceDomainBoundaries(components) {
  const violations = []

  components.forEach((comp) => {
    comp.imports.forEach((imp) => {
      const importedDomain = identifyDomain(imp)
      const componentDomain = identifyDomain(comp.namespace)

      if (importedDomain !== componentDomain && importedDomain !== 'shared') {
        violations.push({
          component: comp.name,
          domain: componentDomain,
          importsFrom: imp,
          importedDomain: importedDomain,
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

### Don'ts ❌

- Don't create domains based on technical layers (services, controllers, models)
- Don't force components into domains where they don't fit
- Don't skip stakeholder validation
- Don't create too many small domains (aim for 3-7 domains)
- Don't create domains that are too large (monolithic domains)
- Don't ignore components that don't fit (analyze why)
- Don't skip namespace refactoring (critical for clarity)

## Common Domain Patterns

### Typical Domains in Business Applications

- **Customer Domain**: Customer management, profiles, relationships
- **Product Domain**: Product catalog, inventory, pricing
- **Order Domain**: Order processing, fulfillment, shipping
- **Billing Domain**: Invoicing, payments, financial transactions
- **Reporting Domain**: Reports, analytics, dashboards
- **Admin Domain**: User management, system configuration
- **Shared Domain**: Common functionality (login, notification, utilities)

### Domain Size Guidelines

- **Small Domain**: 2-4 components
- **Medium Domain**: 5-8 components
- **Large Domain**: 9-15 components
- **Too Large**: >15 components (consider splitting)

## Next Steps

After creating component domains:

1. **Apply Create Domain Services Pattern** - Extract domains to separate services
2. **Plan Service Extraction** - Create migration plan for domain services
3. **Implement Domain Services** - Move domains to separately deployed services
4. **Monitor Domain Boundaries** - Use fitness functions to enforce boundaries

## Notes

- Domains should represent business capabilities, not technical layers
- Domain identification requires collaboration with business stakeholders
- Namespace refactoring is critical for domain clarity
- Domains prepare the codebase for service-based architecture
- Well-formed domains make service extraction easier
- Domain boundaries should be clear and well-documented

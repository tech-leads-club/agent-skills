# Domain Identification & Grouping - Quick Reference

## Domain Definition

**Domain** = Logical grouping of components representing a distinct business capability

**Key Characteristics**:

- Represents business area, not technical layer
- Contains related components
- Has clear boundaries
- Can become domain service

## Domain Identification Strategies

### 1. Business Capability Analysis

```
What business capabilities does the system provide?
→ Each capability = Potential domain
```

### 2. Vocabulary Analysis

```
What business language do components use?
→ Components sharing vocabulary = Same domain
```

### 3. Relationship Analysis

```
Which components are frequently used together?
→ Related components = Same domain
```

### 4. Stakeholder Collaboration

```
What do business experts say?
→ Their understanding = Domain boundaries
```

## Component-to-Domain Assignment

### Decision Process

```
Analyze component:
├─ What business capability does it support?
├─ What domain vocabulary does it use?
├─ What other components does it relate to?
└─ Assign to domain that best fits
```

### Edge Cases

- **Unclear assignment**: Analyze more deeply, check relationships
- **Multiple domains**: Choose primary domain, document secondary
- **Shared functionality**: May belong to Shared domain

## Namespace Refactoring

### Pattern

**Before**: `services/billing/payment`  
**After**: `services/customer/billing/payment`

**Rule**: Add domain node to namespace

### Refactoring Steps

1. Update namespace declarations
2. Update import statements
3. Update directory structure
4. Run tests
5. Update documentation

## Domain Validation

### Checklist

- [ ] All components assigned to a domain
- [ ] Domains have clear boundaries
- [ ] Components fit domain vocabulary
- [ ] Domains represent distinct capabilities
- [ ] Stakeholders validate groupings

### Cohesion Check

```
High Cohesion ✅:
- Components share business language
- Components used together
- Direct relationships

Low Cohesion ❌:
- Different vocabularies
- Rarely used together
- No relationships
```

## Domain Size Guidelines

| Size      | Component Count | Notes                  |
| --------- | --------------- | ---------------------- |
| Small     | 2-4             | May need consolidation |
| Medium    | 5-8             | Ideal size             |
| Large     | 9-15            | Monitor for splitting  |
| Too Large | >15             | Consider splitting     |

## Common Domain Patterns

### Typical Domains

- **Customer**: Customer management, profiles, billing
- **Product**: Catalog, inventory, pricing
- **Order**: Processing, fulfillment
- **Billing**: Invoicing, payments
- **Reporting**: Reports, analytics
- **Admin**: User management, config
- **Shared**: Common functionality

### Domain Count

**Ideal**: 3-7 domains  
**Too Many**: >10 domains (consider merging)  
**Too Few**: <3 domains (consider splitting)

## Output Template

```markdown
## Domain: [Name] ([namespace])

**Business Capability**: [what it does]

**Components**:

- Component 1
- Component 2

**Component Count**: X
**Total Size**: Y statements (Z% of codebase)

**Domain Cohesion**: ✅ High / ⚠️ Medium / ❌ Low

**Boundaries**:

- Clear separation from [Domain A]
- Clear separation from [Domain B]
```

## Quick Analysis Steps

1. **Identify** → Analyze components, find business capabilities
2. **Group** → Assign components to domains
3. **Validate** → Check cohesion, boundaries, completeness
4. **Refactor** → Align namespaces with domains
5. **Map** → Create domain visualization

## Decision Tree

```
Identify domains
├─ Analyze component responsibilities
├─ Identify business capabilities
├─ Group by vocabulary/relationships
└─ Validate with stakeholders

Assign components
├─ Analyze functionality
├─ Check relationships
├─ Assign to domain
└─ Handle edge cases

Refactor namespaces
├─ Compare current vs target
├─ Identify changes needed
├─ Create refactoring plan
└─ Execute refactoring
```

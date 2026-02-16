# Quick Reference Card

## Decision Trees

### Subdomain Classification

```
┌─────────────────────────────────────────┐
│ Is it a competitive advantage?         │
│ Does it differentiate the business?    │
└─────────────┬───────────────────────────┘
              │
         YES  │  NO
      ┌───────┴────────┐
      ▼                ▼
┌──────────┐    ┌─────────────────────────┐
│   CORE   │    │ Is it business-specific?│
│  DOMAIN  │    │ Requires domain knowledge?
└──────────┘    └────────┬────────────────┘
                         │
                    YES  │  NO
                 ┌───────┴──────┐
                 ▼              ▼
          ┌────────────┐  ┌─────────┐
          │ SUPPORTING │  │ GENERIC │
          │ SUBDOMAIN  │  │SUBDOMAIN│
          └────────────┘  └─────────┘
```

### Bounded Context Detection

```
┌──────────────────────────────────┐
│ Same term, different meaning?   │
└────────────┬─────────────────────┘
             │
        YES  │  NO
     ┌───────┴──────┐
     ▼              ▼
┌─────────┐   ┌────────────┐
│DIFFERENT│   │    SAME    │
│CONTEXTS │   │  CONTEXT   │
└─────────┘   └────────────┘

Examples:
• "Customer" in Sales vs Support → DIFFERENT
• "Product" everywhere same → SAME (but verify!)
```

## Cohesion Scoring

### Quick Score

```
Linguistic (0-3):
└─ Same vocabulary?
   3 = All terms shared
   2 = Most terms shared
   1 = Some terms shared
   0 = Different vocabulary

Usage (0-3):
└─ Used together?
   3 = Always used together
   2 = Frequently together
   1 = Sometimes together
   0 = Rarely together

Data (0-2):
└─ Direct relationships?
   2 = Direct entity relationships
   1 = Indirect relationships
   0 = No relationships

Change (0-2):
└─ Change together?
   2 = Always change together
   1 = Sometimes together
   0 = Independently

Total: X / 10
```

### Interpretation

```
8-10 ✅ HIGH
     └─ Strong subdomain candidate
     └─ Good bounded context boundary

5-7  ⚠️ MEDIUM
     └─ Review boundaries
     └─ May need refinement

0-4  ❌ LOW
     └─ Wrong grouping
     └─ Needs separation
```

## Red Flags

### Linguistic Issues

```
❌ User + Subscription in same service
   → Identity mixed with Billing

❌ Movie + Invoice in same context
   → Content mixed with Billing

❌ Authentication + Content in same module
   → Generic mixed with Core

✅ Subscription + Invoice + Payment together
   → All Billing language
```

### Coupling Issues

```
❌ Direct entity import across domains
   import { User } from '@identity/entities'

❌ Service dependency across domains
   constructor(subscriptionService: SubscriptionService)

❌ Shared database tables across domains
   FOREIGN KEY(user_id) REFERENCES users(id)

✅ Interface-based integration
   constructor(billingApi: IBillingApi)

✅ Event-based communication
   eventBus.publish(new OrderPlaced(...))

✅ Value object sharing
   class Order { customerId: CustomerId }
```

## Common Subdomains

### Generic (can outsource)

```
• Authentication/Authorization
• Email/SMS sending
• File storage
• Logging/Monitoring
• Caching
• Search indexing (basic)
```

### Supporting (business-specific)

```
• Inventory management
• Order fulfillment
• Content moderation
• User notifications
• Reporting/Analytics
• Invoice generation
```

### Core (competitive advantage)

```
• Recommendation algorithm (unique)
• Pricing strategy (custom)
• Matching algorithm (proprietary)
• Risk assessment (specialized)
• Forecasting model (custom)
```

## Integration Patterns

### When to Use Each

```
SHARED KERNEL
├─ Use: Rarely, small value objects only
├─ Example: Money, Address, Email
└─ Warning: Creates coupling

CUSTOMER/SUPPLIER
├─ Use: Clear upstream/downstream
├─ Example: Order → Shipping
└─ Pattern: API contract

ANTI-CORRUPTION LAYER
├─ Use: Protecting from external systems
├─ Example: Legacy system integration
└─ Pattern: Translation layer

DOMAIN EVENTS
├─ Use: Multiple consumers, eventual consistency
├─ Example: OrderPlaced → [Billing, Shipping]
└─ Pattern: Pub/Sub

OPEN HOST SERVICE
├─ Use: Published API for others
├─ Example: Payment gateway API
└─ Pattern: REST/GraphQL API
```

## Analysis Checklist

### Per Concept

```
□ Business language identified?
□ Domain assigned?
□ Subdomain assigned?
□ Core/Supporting/Generic classified?
□ Related concepts identified?
□ Dependencies mapped?
□ Linguistic mismatches checked?
```

### Per Domain

```
□ Ubiquitous Language defined?
□ Key concepts listed?
□ Subdomains identified?
□ Core Domain identified?
□ Cross-domain dependencies mapped?
□ Internal cohesion assessed?
□ Boundaries validated?
```

### Per Bounded Context

```
□ Linguistic boundary clear?
□ Contains complete model?
□ Integration points defined?
□ No mixed vocabularies?
□ Size appropriate (Mozart Principle)?
□ Not driven by architecture?
□ Not driven by team structure?
```

## Size Guidelines

### Too Small

```
❌ Gaping holes in Ubiquitous Language
❌ Incomplete business capability
❌ Too many integration points
❌ Fragments of concepts

Example:
- ProductContext (only Product)
- InventoryContext (only Stock)
- PricingContext (only Price)
→ Should be: CatalogContext
```

### Just Right

```
✅ Complete Ubiquitous Language
✅ Full business capability
✅ Clear integration points
✅ Cohesive concepts

Example:
CatalogContext
├── Product
├── Category
├── Inventory
└── Pricing
```

### Too Large

```
❌ Multiple vocabularies mixed
❌ Multiple business capabilities
❌ Low internal cohesion
❌ Muddy boundaries

Example:
BusinessContext
├── Order (order language)
├── Product (catalog language)
├── User (identity language)
└── Payment (billing language)
→ Should be: 4 separate contexts
```

## Common Mistakes

### Mistake 1: Grouping by Technical Layer

```
❌ WRONG:
- ControllerContext
- ServiceContext
- RepositoryContext

✅ RIGHT:
- OrderContext (all layers for orders)
- ProductContext (all layers for products)
```

### Mistake 2: Sharing Entities Directly

```
❌ WRONG:
class Order {
  user: User;  // Full entity from Identity
}

✅ RIGHT:
class Order {
  customerId: CustomerId;  // Value object
}
```

### Mistake 3: One Size Fits All

```
❌ WRONG: Force all domains to have same size

✅ RIGHT: Size based on Ubiquitous Language
- Small domain: 3-5 concepts (if complete)
- Medium domain: 6-15 concepts
- Large domain: 16+ concepts (if cohesive)
```

### Mistake 4: Technical Boundaries

```
❌ WRONG: Bounded contexts for:
- Frontend vs Backend
- Microservice per entity
- One context per database

✅ RIGHT: Linguistic boundaries:
- Where terms have specific meanings
- Where business capabilities are distinct
```

## Key Questions

### For Subdomain Classification

```
1. Does this provide competitive advantage?
2. Is it business-specific or generic?
3. Is it essential to core business?
4. Could we outsource it?
5. How often does it change?
6. Does it require domain experts?
```

### For Bounded Context Definition

```
1. Does this term have different meanings elsewhere?
2. Can we define all terms unambiguously here?
3. Is this a complete business capability?
4. Are all concepts linguistically related?
5. Where do we translate between contexts?
6. What are the integration points?
```

### For Cohesion Assessment

```
1. Do these concepts share vocabulary?
2. Are they used together frequently?
3. Do changes affect them together?
4. Do they solve the same business problem?
5. Are they in the same lifecycle?
6. Do they have direct relationships?
```

## Signal Words

### Core Domain Signals

```
"competitive advantage"
"unique to our business"
"our secret sauce"
"what makes us different"
"complex business rules"
"needs domain experts"
```

### Supporting Signals

```
"necessary but standard"
"business-specific"
"supports core operations"
"moderate complexity"
"internal tool"
```

### Generic Signals

```
"could buy this"
"standard functionality"
"well-known solution"
"common to all businesses"
"infrastructure"
```

### Low Cohesion Signals

```
"mixed concerns"
"different vocabularies"
"unrelated concepts"
"tight coupling"
"unclear boundary"
"linguistic mismatch"
```

---
name: coupling-analysis
description: Analyzes coupling in a codebase following the three-dimensional model from "Balancing Coupling in Software Design" (Vlad Khononov). Use when evaluating architectural quality, identifying problematic dependencies, understanding integration strength between modules, or getting recommendations to improve modularity.
---

# Coupling Analysis Skill

You are an expert software architect specializing in coupling analysis. You analyze codebases following the **three-dimensional model** from _Balancing Coupling in Software Design_ (Vlad Khononov):

1. **Integration Strength** — _what_ is shared between components
2. **Distance** — _where_ the coupling physically lives
3. **Volatility** — _how often_ components change

The guiding balance formula:

```
BALANCE = (STRENGTH XOR DISTANCE) OR NOT VOLATILITY
```

A design is **balanced** when:

- Tightly coupled components are close together (high strength + low distance = cohesion)
- Distant components are loosely coupled (low strength + high distance = loose coupling)
- Stable components (low volatility) can tolerate stronger coupling

## When to Use

Apply this skill when the user:

- Asks to "analyze coupling", "evaluate architecture", or "check dependencies"
- Wants to understand integration strength between modules or services
- Needs to identify problematic coupling or architectural smell
- Wants to know if a module should be extracted or merged
- References concepts like connascence, cohesion, or coupling from Khononov's book
- Asks why changes in one module cascade to others unexpectedly

## Process

### PHASE 1 — Context Gathering

Before analyzing code, collect:

**1.1 Scope**

- Full codebase or a specific area?
- Primary level of abstraction: methods, classes, modules/packages, services?
- Is git history available? (useful to estimate volatility)

**1.2 Business context** — ask the user or infer from code:

- Which parts are the business "core" (competitive differentiator)?
- Which are infrastructure/generic support (auth, billing, logging)?
- What changes most frequently according to the team?

This allows classifying **subdomains** (critical for volatility):
| Type | Volatility | Indicators |
|------|-----------|------------|
| **Core subdomain** | High | Proprietary logic, competitive advantage, area the business most wants to evolve |
| **Supporting subdomain** | Low | Simple CRUD, core support, no algorithmic complexity |
| **Generic subdomain** | Minimal | Auth, billing, email, logging, storage |

---

### PHASE 2 — Structural Mapping

**2.1 Module inventory**

For each module, record:

- Name and location (namespace/package/path)
- Primary responsibility
- Declared dependencies (imports, DI, HTTP calls)

**2.2 Dependency graph**

Build a directed graph where:

- Nodes = modules
- Edges = dependencies (A → B means "A depends on B")
- Note: the flow of _knowledge_ is OPPOSITE to the dependency arrow
  - If A → B, then B is _upstream_ and exposes knowledge to A (downstream)

**2.3 Distance calculation**

Use the encapsulation hierarchy to measure distance. The nearest common ancestor determines distance:

| Common ancestor level  | Distance | Example                        |
| ---------------------- | -------- | ------------------------------ |
| Same method/function   | Minimal  | Two lines in same method       |
| Same object/class      | Very low | Methods on same object         |
| Same namespace/package | Low      | Classes in same package        |
| Same library/module    | Medium   | Libs in same project           |
| Different services     | High     | Distinct microservices         |
| Different systems/orgs | Maximum  | External APIs, different teams |

**Social factor**: If modules are maintained by different teams, increase the estimated distance by one level (Conway's Law).

---

### PHASE 3 — Integration Strength Analysis

For each dependency in the graph, classify the **Integration Strength** level (strongest to weakest):

#### INTRUSIVE COUPLING (Strongest — Avoid)

Downstream accesses implementation details of upstream that were _not designed for integration_.

**Code signals**:

- Reflection to access private members
- Service directly reading another service's database
- Dependency on internal file/config structure of another module
- Monkey-patching of internals (Python/Ruby)
- Direct access to internal fields without getter

**Effect**: Any internal change to upstream (even without changing public interface) breaks downstream. Upstream doesn't know it's being observed.

---

#### FUNCTIONAL COUPLING (Second strongest)

Modules implement interrelated functionalities — shared business logic, interdependent rules, or coupled workflows.

**Three degrees (weakest to strongest)**:

**a) Sequential (Temporal)** — modules must execute in specific order

```python
connection.open()   # must come first
connection.query()  # depends on open
connection.close()  # must come last
```

**b) Transactional** — operations must succeed or fail together

```python
with transaction:
    service_a.update(data)
    service_b.update(data)  # both must succeed
```

**c) Symmetric (strongest)** — same business logic duplicated in multiple modules

```python
# Module A
def is_premium_customer(c): return c.purchases > 1000

# Module B — duplicated rule! Must stay in sync
def qualifies_for_discount(c): return c.purchases > 1000
```

Note: symmetric coupling does NOT require modules to reference each other — they can be fully independent in code yet still have this coupling.

**General signals of Functional Coupling**:

- Comments like "remember to update X when changing Y"
- Cascading test failures when a business rule changes
- Duplicated validation logic in multiple places
- Need to deploy multiple services simultaneously for a feature

---

#### MODEL COUPLING (Third level)

Upstream exposes its internal domain model as part of the public interface. Downstream knows and uses objects representing the upstream's internal model.

**Code signals**:

```python
# Analysis module uses Customer from CRM directly
from crm.models import Customer  # CRM's internal model

class Analysis:
    def process(self, customer_id):
        customer = crm_repo.get(customer_id)  # returns full Customer
        status = customer.status  # only needs status, but knows everything
```

```typescript
// Service B consuming Service A's internal model via API
interface CustomerFromServiceA {
  internalAccountCode: string; // internal detail exposed
  legacyId: number; // unnecessary internal field
  // ... many fields Service B doesn't need
}
```

**Degrees** (via static connascence):

- _connascence of name_: knows field names of the model
- _connascence of type_: knows specific types of the model
- _connascence of meaning_: interprets specific values (magic numbers, internal enums)
- _connascence of algorithm_: must use same algorithm to interpret data
- _connascence of position_: depends on element order (tuples, unnamed arrays)

---

#### CONTRACT COUPLING (Weakest — Ideal)

Upstream exposes an _integration-specific model_ (contract), separate from its internal model. The contract abstracts implementation details.

**Code signals**:

```python
class CustomerSnapshot:  # integration DTO, not the internal model
    """Public integration contract — stable and intentional."""
    id: str
    status: str  # enum converted to string
    tier: str    # only what consumers need

    @staticmethod
    def from_customer(customer: Customer) -> 'CustomerSnapshot':
        return CustomerSnapshot(
            id=str(customer.id),
            status=customer.status.value,
            tier=customer.loyalty_tier.display_name
        )
```

**Characteristics of good Contract Coupling**:

- Dedicated DTOs/ViewModels per use case (not the domain model)
- Versionable contracts (V1, V2)
- Primitive types or simple value types
- Explicit contract documentation (OpenAPI, Protobuf, etc.)
- Patterns: Facade, Adapter, Anti-Corruption Layer, Published Language (DDD)

---

### PHASE 4 — Volatility Assessment

For each module, estimate volatility based on:

**4.1 Subdomain type** (preferred) — see table in Phase 1

**4.2 Git analysis** (when available):

```bash
# Commits per file in the last 6 months
git log --since="6 months ago" --format="" --name-only | sort | uniq -c | sort -rn | head -20

# Files that change together frequently (temporal coupling)
# High co-change = possible undeclared functional coupling
```

**4.3 Code signals**:

- Many TODO/FIXME → area under evolution (higher volatility)
- Many API versions (V1, V2, V3) → frequently changing area
- Fragile tests that break constantly → volatile area
- Comments "business rule: ..." → business logic = probably core

**4.4 Inferred volatility**

Even a supporting subdomain module may have high volatility if:

- It has Intrusive or Functional coupling with core subdomain modules
- Changes in core propagate to it frequently

---

### PHASE 5 — Balance Score Calculation

For each coupled pair (A → B):

**Simplified scale (0 = low, 1 = high)**:

| Dimension  | 0 (Low)                      | 1 (High)           |
| ---------- | ---------------------------- | ------------------ |
| Strength   | Contract coupling            | Intrusive coupling |
| Distance   | Same object/namespace        | Different services |
| Volatility | Generic/Supporting subdomain | Core subdomain     |

**Maintenance effort formula**:

```
MAINTENANCE_EFFORT = STRENGTH × DISTANCE × VOLATILITY
```

(0 in any dimension = low effort)

**Classification table**:

| Strength | Distance | Volatility | Diagnosis                                                        |
| -------- | -------- | ---------- | ---------------------------------------------------------------- |
| High     | High     | High       | 🔴 **CRITICAL** — Global complexity + high change cost           |
| High     | High     | Low        | 🟡 **ACCEPTABLE** — Strong but stable (e.g. legacy integration)  |
| High     | Low      | High       | 🟢 **GOOD** — High cohesion (change together, live together)     |
| High     | Low      | Low        | 🟢 **GOOD** — Strong but static                                  |
| Low      | High     | High       | 🟢 **GOOD** — Loose coupling (separate and independent)          |
| Low      | High     | Low        | 🟢 **GOOD** — Loose coupling and stable                          |
| Low      | Low      | High       | 🟠 **ATTENTION** — Local complexity (mixes unrelated components) |
| Low      | Low      | Low        | 🟡 **ACCEPTABLE** — May generate noise, but low cost             |

---

### PHASE 6 — Analysis Report

Structure the report in sections:

#### 6.1 Executive Summary

```
CODEBASE: [name]
MODULES ANALYZED: N
DEPENDENCIES MAPPED: N
CRITICAL ISSUES: N
MODERATE ISSUES: N

OVERALL HEALTH SCORE: [Healthy / Attention / Critical]
```

#### 6.2 Dependency Map

Present the annotated graph:

```
[ModuleA] --[INTRUSIVE]-----------> [ModuleB]
[ModuleC] --[CONTRACT]------------> [ModuleD]
[ModuleE] --[FUNCTIONAL:symmetric]-> [ModuleF]
```

#### 6.3 Identified Issues (by severity)

For each critical or moderate issue:

```
ISSUE: [descriptive name]
────────────────────────────────────────
Modules involved: A → B
Coupling type: Functional Coupling (symmetric)
Connascence level: Connascence of Value

Evidence in code:
  [snippet or description of found pattern]

Dimensions:
  • Strength:   HIGH  (Functional - symmetric)
  • Distance:   HIGH  (separate services)
  • Volatility: HIGH  (core subdomain)

Balance Score: CRITICAL 🔴
Maintenance: High — frequent changes propagate over long distance

Impact: Any change to business rule [X] requires simultaneous
        update in [A] and [B], which belong to different teams.

Recommendation:
  → Extract shared logic to a dedicated module that both can
    reference (DRY + contract coupling)
  → Or: Accept duplication and explicitly document the coupling
    (if volatility is lower than it appears)
```

#### 6.4 Positive Patterns Found

```
✅ [ModuleX] uses dedicated integration DTOs — contract coupling well implemented
✅ [ServiceY] exposes only necessary data via API — minimizes model coupling
✅ [PackageZ] encapsulates its internal model well — low implementation leakage
```

#### 6.5 Prioritized Recommendations

**High priority** (high impact, blocking evolution):

1. ...

**Medium priority** (improve architectural health): 2. ...

**Low priority** (incremental improvements): 3. ...

---

## Quick Reference: Pattern → Integration Strength

| Pattern found                        | Integration Strength       | Action                               |
| ------------------------------------ | -------------------------- | ------------------------------------ |
| Reflection to access private members | Intrusive                  | Refactor urgently                    |
| Reading another service's DB         | Intrusive                  | Refactor urgently                    |
| Duplicated business logic            | Functional (symmetric)     | Extract to shared module             |
| Distributed transaction / Saga       | Functional (transactional) | Evaluate if cohesion would be better |
| Mandatory execution order            | Functional (sequential)    | Document protocol or encapsulate     |
| Rich domain object returned          | Model coupling             | Create integration DTO               |
| Internal enum shared externally      | Model coupling             | Create public contract enum          |
| Use-case-specific DTO                | Contract coupling          | ✅ Correct pattern                   |
| Versioned public interface/protocol  | Contract coupling          | ✅ Correct pattern                   |
| Anti-Corruption Layer                | Contract coupling          | ✅ Correct pattern                   |

## Quick Heuristics

**For Integration Strength**:

- "If I change an internal detail of module X, how many other modules need to change?"
- "Was the integration contract designed to be public, or is it accidental?"
- "Is there duplicated business logic that must be manually synchronized?"

**For Distance**:

- "What's the cost of making a change that affects both modules?"
- "Do teams maintaining these modules need to coordinate deployments?"
- "If one module fails, does the other stop working?"

**For Volatility**:

- "Does this module encapsulate competitive business advantage?"
- "Does the business team frequently request changes in this area?"
- "Is there a history of many refactors in this area?"

**For Balance**:

- "Do components that need to change together live together in the code?"
- "Are independent components well separated?"
- "Where is there strong coupling with volatile and distant components?" (→ this is the main problem)

## Known Limitations

- **Volatility** is best estimated with real git data rather than static analysis alone
- **Symmetric functional coupling** requires semantic code reading — static analysis tools generally don't detect it
- **Organizational distance** (different teams) requires user input
- **Dynamic connascence** (timing, value, identity) is hard to detect without runtime observation
- Analysis is a starting point — business context always refines the conclusions

## Book References

These concepts are based on _Balancing Coupling in Software Design_ by Vlad Khononov (Addison-Wesley).

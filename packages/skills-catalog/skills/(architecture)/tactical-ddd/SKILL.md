---
name: tactical-ddd
description: Detects anemic domain models, validates and refactors them into rich domain models, and enforces tactical DDD patterns (Entities, Value Objects, Aggregates, Domain Services, Domain Events). Use when the user asks to validate, review, or check domain models or DDD code; detect anemia; refactor domain objects; improve encapsulation; or mentions terms like "anemic model", "rich domain", "aggregate", "value object", "domain event", "ubiquitous language", "is this good DDD", "does this follow DDD", or "check my domain". Do NOT use for module/service boundary design or architectural decomposition (use modular-design-principles), strategic DDD context mapping, or non-domain code (DTOs, controllers, infrastructure adapters).
---

# Tactical DDD — Rich Domain Modeling

## Workflow

Determine the user's intent first:

| Intent | Phases to run |
|--------|--------------|
| "validate / review / check / is this correct?" | Phase 1 + 2 only → report findings, ask before refactoring |
| "fix / refactor / improve / clean up" | Phase 1 + 2 + 3 |
| "how should I design / model this?" | Load [reference.md](reference.md) directly |

### Phase 1 — Detect
Load [detection.md](detection.md) and scan the target code for anemia signals. Produce a severity score and list of affected classes.

### Phase 2 — Assess
For each affected class, determine the correct building block:

| Has unique identity tracked over time? | Has invariants tying multiple objects? | → Building Block |
|----------------------------------------|----------------------------------------|-----------------|
| Yes | — | **Entity** |
| No | — | **Value Object** |
| Yes (root) + children with shared invariants | Yes | **Aggregate** |
| Operation spans multiple Aggregates/doesn't belong to any | — | **Domain Service** |

Prefer Value Objects over Entities. Prefer small Aggregates over large ones.

**If intent was validate/review**: stop here. Report findings using the output format below. Ask "Would you like me to apply these fixes?" before proceeding.

### Phase 3 — Refactor
Load [refactoring.md](refactoring.md) for step-by-step moves. Apply in this order:
1. Replace setter chains with a single expressive method
2. Move service logic into the Aggregate that owns it
3. Add business guards at the top of each method
4. Publish a Domain Event after each successful state change
5. Replace primitive types with Value Objects

For deep pattern questions (boundary design, event modeling, service vs. entity decision), load [reference.md](reference.md).

---

## Quick Anemia Signals (scan first)

```
public setX() / public setY()        → behaviour should be encapsulated
service.doX(entity, ...)              → logic likely belongs in entity
entity.setA(); entity.setB(); ...     → setter chain = missing intent method
no domain methods beyond getters      → pure data bag
```

---

## Golden Rules

1. **Behaviour with data** — Objects own both state and the operations that change it
2. **Ubiquitous Language** — Method names come from the domain, not CRUD (`commitTo`, not `setStatus`)
3. **Small Aggregates** — Root + Value Objects by default; add child Entities only for true invariants
4. **One transaction = one Aggregate** — Cross-Aggregate rules use eventual consistency via Domain Events
5. **Reference by ID** — Never hold object references to other Aggregates
6. **Value Objects first** — Use Entities only when individual identity is essential
7. **Domain Services sparingly** — Excessive services → anemic model
8. **Protect invariants** — The Aggregate is the last line of defence; never trust the caller

---

## Output Format

When reviewing code, report:

```
## Anemia Diagnosis: <ClassName>

Severity: [None | Mild | Moderate | Severe]

Issues:
- <description of problem>

Recommended refactoring:
- <specific move from refactoring.md>
```

When refactoring, show a before/after diff for each class touched.

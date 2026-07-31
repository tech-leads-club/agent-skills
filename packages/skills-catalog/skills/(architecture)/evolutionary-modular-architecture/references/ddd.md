# DDD Reference — Strategic + Tactical

Strategic design defines the boundaries (always applied). Tactical design fills them with rich models, applied **in proportion** to each subdomain's value.

## Table of Contents

1. Strategic: subdomain classification
2. Strategic: bounded contexts & ubiquitous language
3. Strategic: context integration patterns
4. Strategic: cohesion check
5. Tactical: building blocks
6. Tactical: golden rules
7. Tactical intensity by subdomain (avoid over-engineering)

---

## 1. Strategic: subdomain classification

Classify every subdomain — it tells you where to invest depth.

- **Core** — competitive advantage, highest value, most complex. Best people, full tactical DDD.
- **Supporting** — essential and business-specific, but not differentiating. Moderate depth.
- **Generic** — solved problem you consume (often wraps an external service). Minimal depth.

Decision: competitive advantage? → Core. Else business-specific? → Supporting. Else → Generic.

## 2. Strategic: bounded contexts & ubiquitous language

A bounded context is a linguistic boundary where each term has one unambiguous meaning. Aim for 1 subdomain ≈ 1 bounded context. Watch for the same word meaning different things in different contexts (e.g., "ticket" as a unit of work vs. a set of payments) — that is a real boundary signal, not an accident. Group by business language, never by technical layer.

## 3. Strategic: context integration patterns

How contexts relate (pick deliberately):

- **Anti-Corruption Layer (ACL)** — translate an external/legacy model into your domain model so it cannot pollute you. Use for every external system (see `acl-and-communication.md`).
- **Customer/Supplier** — downstream depends on upstream; upstream considers downstream needs.
- **Conformist** — downstream conforms to upstream's model (no leverage to negotiate).
- **Open Host Service** — a published interface others integrate against.
- **Published Language** — a well-documented shared schema (e.g., domain events).
- **Shared Kernel** — a small shared model; use sparingly and only when intentional (P19).

## 4. Strategic: cohesion check

High cohesion (keep together): shared vocabulary, used together, direct relationships, change together. Low cohesion (review boundary): mixed vocabularies, rarely used together, no relationship. Some cross-context dependency is normal; Generic subdomains naturally have lower cohesion.

## 5. Tactical: building blocks

- **Entity** — identity tracked over time; rich behavior (methods in the ubiquitous language, e.g. `approve()`, not `setStatus()`).
- **Value Object** — defined by attributes, immutable, no identity (e.g. `Money`, `Cnpj`, `DueDate`). Prefer VOs over entities.
- **Aggregate** — a root entity + children with shared invariants; external access only through the root. Keep aggregates small.
- **Domain Event** — an immutable fact (`module.aggregate.action`); serializable payload; reference by id.
- **Domain Service** — an operation that spans aggregates or belongs to none. Use sparingly; too many services means an anemic model.

## 6. Tactical: golden rules

1. Behavior with data — objects own state and the operations that change it.
2. Ubiquitous language in method names — not CRUD.
3. Small aggregates — root + value objects by default; add child entities only for true invariants.
4. One transaction = one aggregate — cross-aggregate rules use eventual consistency via domain events.
5. Reference by id — never hold object references to other aggregates.
6. Value objects first — entities only when identity is essential.
7. Protect invariants — the aggregate is the last line of defense; never trust the caller.

## 7. Tactical intensity by subdomain (avoid over-engineering)

Apply tactical depth in proportion. Forcing rich models where there is no invariant is abstraction for its own sake.

| Subdomain type | Tactical intensity | What it looks like |
| --- | --- | --- |
| Core | Full | Rich aggregate, VOs, protected invariants, domain events |
| Supporting | Moderate | A few VOs and a small aggregate where a real rule exists |
| Generic | Minimal | Thin model / pure state holder; often just wraps an external service via ACL |

"Not anemic" applies most strongly to the Core. A Generic context that only forwards to an external provider has no behavior to encapsulate — a lean model there is correct, not a smell. Anemia is a problem only when behavior that belongs in the model is scattered into services. Ref: Evans (2003); Vernon (2013).

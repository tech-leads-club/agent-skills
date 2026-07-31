---
name: evolutionary-modular-architecture
description: Guides design and implementation of evolutionary modular-monolith platforms with DDD (strategic + tactical), flat-by-aggregate organization, an Anti-Corruption Layer for vendor independence, a transactional outbox for events, smart resilience (backoff with jitter, circuit breakers, idempotency), and a polished architecture HTML document with elegant SVG diagrams. Use when designing a platform or backend, defining bounded contexts, organizing modules and folders, choosing monolith vs microservices, decoupling from an external service (ERP, storage, AI), making calls resilient, adding real-time push, picking a 2026 TypeScript stack (Nx, NestJS, React), or producing an architecture document or diagram. Also triggers on 'modular monolith', 'bounded contexts', 'flat-by-aggregate', 'ports and adapters', 'architecture diagram'. Do NOT use for simple CRUD, NestJS-only deep implementation (use nestjs-modular-monolith), or pure domain-model review (use tactical-ddd).
license: CC-BY-4.0
metadata:
  author: Felipe Rodrigues - github.com/felipfr
  version: 1.0.0
---

# Evolutionary Modular Architecture

Design and build platforms as an **evolutionary modular monolith**: strong logical boundaries from day one (DDD bounded contexts, flat-by-aggregate modules, an Anti-Corruption Layer around every external system, event-driven communication, resilience by default) while keeping physical boundaries (separate deploys, separate databases) as a later, optional step. Start simple, evolve granularity only when the product and the team justify it — never reverse-engineer microservices from hype.

## When to use this skill

- Designing a new platform, backend, or service from scratch.
- Defining bounded contexts and a context map for a domain.
- Deciding how to organize a module's folders and files.
- Choosing between monolith, modular monolith, and microservices.
- Integrating with (or decoupling from) an external vendor: ERP, ticketing, storage, payment, AI, identity, durable-workflow engine.
- Making external/inter-module calls resilient.
- Adding real-time server-to-client updates.
- Picking a modern (2026) full-stack TypeScript stack.

## When NOT to use it

- Simple CRUD with a handful of endpoints — framework defaults are enough.
- Deep, NestJS-specific implementation detail — prefer `nestjs-modular-monolith`.
- Reviewing or refactoring a single domain model for anemia — prefer `tactical-ddd`.

---

## The one rule that governs everything

**Separate the logical boundary (always strong) from the physical boundary (evolutionary).** Modules, contracts, state ownership, and the Anti-Corruption Layer are non-negotiable from day one. Whether a module is its own deploy or its own database is an **operational** decision made later — never a structural prerequisite. This is what lets the system start as one deploy and grow without a rewrite.

A useful mental image: the house has well-divided rooms (modules). Inside each room things sit out in the open, grouped by what they are for (flat-by-aggregate) — not buried in nested drawers (technical-layer folders). The floor plan (boundaries) is what matters most.

---

## Core model (load the matching reference when you go deep)

| Topic | What it covers | Reference |
| --- | --- | --- |
| Principles | 10 modular (P1–P10) + 9 structural (P11–P19) + conflict hierarchy | `references/principles.md` |
| DDD | Strategic (subdomains, context map, integration patterns) + tactical (rich aggregates, intensity by subdomain) | `references/ddd.md` |
| Module internals | Flat-by-aggregate, suffixes, depth, flat vs subdomain test, scaffolding | `references/flat-by-aggregate.md` |
| Communication | Ports & Adapters / ACL, events + transactional outbox, SSE real-time | `references/acl-and-communication.md` |
| Resilience | Backoff + full jitter, circuit breaker, retry budget, idempotency, bulkhead, timeouts | `references/resilience.md` |
| Stack 2026 | Frontend, backend, data, observability, durable workflow, decisions | `references/stack-2026.md` |
| Architecture doc | Building the elegant, self-contained HTML architecture document with SVG diagrams | `references/architecture-doc.md` + `assets/architecture-template.html` |
| Validation | Deterministic checks for structure and module boundaries | `scripts/validate-structure.mjs`, `scripts/validate-boundaries.mjs` |

Do not load all references at once. Read a reference only when the current phase needs it (the workflow below states when).

---

## Workflow

Use this whether you are **designing** a new system or **reviewing** an existing one. Move through phases in order; each has an exit criterion. State assumptions explicitly; if the domain is unclear, ask before guessing.

### Phase 0 — Frame the scope

Confirm: is this a new platform, a new module in an existing one, or a review? Confirm the runtime/stack constraints (default target is the 2026 TypeScript stack — see `references/stack-2026.md`). Default to **one deploy** (modular monolith) unless a hard constraint says otherwise.

Exit: scope and constraints written down.

### Phase 1 — Domain discovery (DDD strategic)

Read `references/ddd.md`. Identify subdomains from the business language, classify each as **Core**, **Supporting**, or **Generic**, and find the ubiquitous language of each. Do not group by technical layer. If multiple bounded-context interpretations exist, present them — do not pick silently.

Exit: a list of candidate bounded contexts, each classified, with one-line responsibility and key aggregates.

### Phase 2 — Boundaries & context map

Draw the context map: which contexts exist, how they relate (Customer/Supplier, Conformist, Open Host Service, Published Language, Shared Kernel, Anti-Corruption Layer), and which are Core. Decide **state ownership**: one database is fine, but each module is the **sole writer of its own tables** — no foreign keys across module boundaries; reference other contexts by id. Keep aggregates cohesive (do not over-split a transactional Core).

Exit: context map + table-ownership map (one module = its tables).

### Phase 3 — Module internals (flat-by-aggregate)

Read `references/flat-by-aggregate.md`. Inside each module, organize by **aggregate**, not by technical layer: 1 business concept = 1 folder; technical layers become file **suffixes** (`.entity.ts`, `.service.ts`, `.controller.ts`). Keep depth ≤ 2 (flat) or ≤ 3 (subdomain-based). The Clean Architecture **dependency rule still holds** (presentation → application → domain ← infrastructure) — it is just expressed by suffixes and co-location, not by layer folders. Use the 6-criteria test to decide flat vs subdomain-based; default to flat.

Exit: a folder layout per module and a flat-vs-subdomain decision with rationale.

### Phase 4 — Communication & Anti-Corruption Layer

Read `references/acl-and-communication.md`. Every external system goes **behind a Port + Adapter (ACL)** — including internal services owned by other teams. The domain defines ports in its own language; adapters translate the external model in and out. Between internal modules: **synchronous only inside an aggregate** (one ACID transaction); **events via the transactional outbox** across modules, with idempotent consumers. Add SSE for server-to-client real-time when the UX needs push.

Exit: list of ports + adapters; list of domain events with the `module.aggregate.action` naming; sync-vs-async decisions.

### Phase 5 — Resilience

Read `references/resilience.md`. Wrap every external/inter-service call: **timeout → circuit breaker → retry (capped exponential backoff + full jitter)**. Only retry idempotent operations (require an idempotency key for writes). Cap retries with a budget (~10% of traffic), trip the breaker on a sliding-window error rate, and give every breaker a named fallback. Add durable execution only when a long-running, multi-step process must survive restarts.

Exit: a resilience policy applied to each adapter, plus idempotency keys for writes.

### Phase 6 — Stack & evolution

Read `references/stack-2026.md`. Choose the concrete stack and call out the trade-offs (runtime, API style, cache, real-time transport). Then state the **evolution path**: stage 1 (modular monolith + clear boundaries, with events/outbox already in place) is the current state; promote a module to its own app/database only when its own metrics justify it.

Exit: stack table + evolution note.

### Phase 7 — Document the architecture (HTML)

Produce a polished, self-contained HTML architecture document with elegant hand-drawn-style SVG diagrams. Read `references/architecture-doc.md` and start from `assets/architecture-template.html`: copy the template, keep its CSS and visual system intact, and replace the placeholder content. Build the standard sections (overview, domains, principles, monolith map, bounded contexts, ACL, communication, front-to-back, modules, resilience, real-time, evolution, stack) and number diagrams sequentially ("Diagram N — ..."). Preserve the visual identity: palette, Lato + JetBrains Mono fonts, rounded rectangles, arrow markers, soft gradients, and italic captions. The output is one HTML file that opens directly in a browser — no build step.

Exit: a single self-contained HTML file with consistent diagrams and working in-page navigation.

---

## Decision rules (cheat sheet)

- **Subdomain class:** competitive advantage → Core; business-specific but not differentiating → Supporting; solved problem you consume → Generic.
- **Tactical intensity:** full (rich aggregates, VOs, invariants, events) in **Core**; moderate in **Supporting**; minimal in **Generic** (forcing richness where there is no invariant is over-engineering). Details in `references/ddd.md`.
- **Flat vs subdomain:** flat by default (depth 2). Go subdomain-based (depth 3) only when 4+ of 6 criteria hold: different personas, authorization, execution model, scaling, deployment, failure isolation. Details in `references/flat-by-aggregate.md`.
- **Sync vs event:** sync inside one aggregate (atomicity matters); event via outbox across modules (tolerates eventual consistency).
- **Durable execution:** add it only for long-running, multi-step, must-resume processes — not for ordinary requests.

## Hard rules (non-negotiable)

- Each module **writes only its own tables**; cross-context links are by id, validated in code (`enforce-module-boundaries`).
- **No direct cross-module imports** — communicate via facade/contract or event.
- **Every external system sits behind a port + ACL** — no vendor model leaks into the domain.
- **Retry only idempotent operations**; writes carry an idempotency key.
- **Modular principles (P1–P10) beat structural ones (P11–P19).** If co-locating would force a cross-module entity import, use a facade + DTO; if splitting an aggregate would break a transaction, keep it together.

---

## Automated checks

Make the principles executable instead of relying on review. Run these in CI and before merge (both are zero-dependency Node ESM scripts; pass the libs/packages root, or let them autodetect):

- `node scripts/validate-structure.mjs [root]` — enforces flat-by-aggregate (P11–P17): no technical-layer folders, no single-file folders (except `__test__/`), depth ≤ 3, no README inside aggregates.
- `node scripts/validate-boundaries.mjs [root]` — enforces modular boundaries (P1, P3, P8): no deep cross-module imports (only via barrel/facade), no duplicate or unprefixed entity names, no cross-context relations.

Both exit non-zero on violation and print the offending paths. Treat structural failures as blocking; treat boundary findings as blocking once the team adopts the convention.

---

## Examples

### Example 1: Design a new platform

User says: "Desenhe a arquitetura de uma plataforma de contas a pagar que lança no ERP do cliente."
Actions:
1. Phase 1 — discover subdomains; classify (e.g., Payables and Operations as Core; Documents/Audit/Gamification as Supporting; Identity/Notifications as Generic).
2. Phase 2 — context map + one-database, table-per-module ownership.
3. Phase 3 — flat-by-aggregate layout per module.
4. Phase 4 — ERP/ticketing/storage behind ports + ACL; events via outbox; SSE for the operator queue.
5. Phase 5 — resilience policy on the ERP adapter (idempotency key = payment id).
6. Phase 6 — 2026 stack + evolution note (one deploy now).
Result: a context map, module layouts, a port/adapter list, a resilience policy, and a stack + evolution plan — each grounded in the matching reference.

### Example 2: Organize a module

User says: "Como organizo o módulo de billing?"
Actions: read `references/flat-by-aggregate.md`; propose `billing/subscription/`, `billing/invoice/`, `billing/payment/` with co-located files and `__test__/`; run the 6-criteria test (billing = flat). Result: a flat folder tree with rationale and the dependency rule preserved via suffixes.

### Example 3: Decouple from a vendor

User says: "Não quero ficar preso ao OMIE."
Actions: read `references/acl-and-communication.md`; define `ErpLedgerPort` in domain language; implement `OmieAdapter`; translate the OMIE model at the boundary; show that swapping ERPs means swapping the adapter. Result: a port interface + adapter plan; the domain never imports vendor types.

---

## Anti-patterns / red flags

- ❌ Microservices or many databases from day one ("it feels big" is not a reason).
- ❌ Technical-layer folders (`core/service/`, `http/controller/`, `persistence/entity/`) inside a module — that is the legacy pattern flat-by-aggregate replaces.
- ❌ A module reading or writing another module's tables.
- ❌ Vendor SDK types leaking into the domain (no ACL).
- ❌ Retrying non-idempotent writes; retries without backoff + jitter; retries with no budget.
- ❌ Splitting a cohesive transactional Core into event-coupled fragments.
- ❌ Forcing rich tactical DDD on a Generic subdomain that has no invariants.

## Reference guide

| Load this file | When |
| --- | --- |
| `references/principles.md` | You need the exact principle text, or to resolve a structural-vs-modular conflict. |
| `references/ddd.md` | Phase 1–2: classifying subdomains, drawing the context map, deciding tactical intensity. |
| `references/flat-by-aggregate.md` | Phase 3: laying out a module; flat vs subdomain; scaffolding; facades; tests. |
| `references/acl-and-communication.md` | Phase 4: ports/adapters/ACL, events + outbox, SSE. |
| `references/resilience.md` | Phase 5: backoff/jitter, circuit breaker, idempotency, bulkhead, durable execution. |
| `references/stack-2026.md` | Phase 0/6: concrete stack choices and trade-offs. |
| `references/architecture-doc.md` + `assets/architecture-template.html` | Phase 7: producing the HTML architecture document and its diagrams. |
| `scripts/validate-structure.mjs`, `scripts/validate-boundaries.mjs` | Validation: enforcing structure and module boundaries in CI or before merge. |

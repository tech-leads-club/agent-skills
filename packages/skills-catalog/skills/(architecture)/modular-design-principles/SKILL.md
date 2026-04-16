---
name: modular-design-principles
description: >
  Technology-agnostic guidance for modular systems: bounded contexts, clear boundaries,
  composability, state isolation, explicit contracts, failure containment, scaffolding workflows,
  split/merge criteria, sub-units inside a context, and compliance review signals. Use when
  designing or reviewing module structure, service boundaries, package layout, cross-cutting
  dependencies, "how should we split this?", modularity assessments, coupling between domains,
  greenfield context design, or architecture discussions without assuming a specific framework,
  language, or repository layout. Do NOT use for executing the full Patterns 1–5 repo
  decomposition pipeline or per-pattern inventories (use modular-decomposition), phased
  extraction roadmaps as the main deliverable (use decomposition-planning-roadmap), or
  end-to-end legacy migration strategy (use legacy-migration-planner).
---

# Modular Design Principles

Use this skill when reasoning about **structure and boundaries** in any codebase. It intentionally avoids framework names, folder conventions, and tooling — map principles to your stack locally.

## What to load

| Task | Where |
|------|--------|
| Principles table + violations + workflows (this file) | `SKILL.md` |
| Per-principle definition, agent rules, abstract examples | `references/principles.md` |

---

## Layered mental model

- **Composition roots** (applications, hosts, runners): wire modules together; keep orchestration thin.
- **Modules / bounded contexts**: cohesive units of behavior and data ownership; each should be understandable and testable on its own.
- **Shared kernels** (use sparingly): only stable, truly cross-cutting concepts; resist turning them into a grab-bag of “everything everyone needs.”

How you physically lay this out (mono repo, multi repo, packages, libraries) is a **delivery choice**, not the definition of modularity. The principles below still apply.

---

## The ten principles

| # | Principle | Intent |
|---|-----------|--------|
| 1 | **Well-defined boundaries** | A small, stable **public surface**; everything else is internal. Consumers depend on contracts, not internals. |
| 2 | **Composability** | Modules can be used alone or combined without special knowledge of each other’s internals. |
| 3 | **Independence** | No hidden shared mutable state across boundaries; each module should be testable in isolation (with fakes or test doubles at the edges). |
| 4 | **Individual scale** | Resources (compute, storage, rate limits, batch size) can be tuned **per module** where it matters, without rewriting others. |
| 5 | **Explicit communication** | Cross-module interaction uses **documented contracts** (APIs, events, messages, shared types) — not incidental coupling. |
| 6 | **Replaceability** | Dependencies on other modules are expressed through **interfaces or protocols** so implementations can change. |
| 7 | **Deployment independence** | Modules do not assume they share a process, host, or release cadence unless that is an explicit architectural decision. |
| 8 | **State isolation** | Each module **owns** its persistent state and naming; no silent sharing of the same logical data store or ambiguous global names across boundaries. |
| 9 | **Observability** | Each module can be diagnosed on its own: logs, metrics, traces, health — attributable to the unit that emitted them. |
| 10 | **Fail independence** | Failures are **contained** (timeouts, bulkheads, circuit breaking, idempotency) so one module’s outage does not blindly cascade. |

**Principle 8** is often the hardest: ambiguous ownership of data or names is a frequent source of “works until it doesn’t” integration bugs.

For **depth** (rules for agents + abstract examples per principle), load `references/principles.md`.

---

## Typical violations (stated abstractly)

1. **Colliding concepts** — the same name or schema for different things in different modules, or duplicate “global” definitions that diverge over time.
2. **Reach-through persistence** — one module reading or writing another module’s tables, buckets, or documents **without** going through an agreed contract.
3. **Centralized data ownership** — a single persistence layer that registers and exposes **all** stores for **all** modules, encouraging hidden coupling.
4. **Logic at the edge** — business rules in transport adapters (HTTP handlers, UI, CLI) instead of domain/application code.
5. **Edge talking to storage directly** — adapters depending on low-level persistence APIs instead of use cases or application services.
6. **Unscoped transactions** — writes that span boundaries without clear transaction ownership and failure semantics.
7. **Leaky exports** — repositories, internal services, or implementation types exposed as the module’s public API.
8. **Facades that aren’t thin** — “public” entry points that embed querying, mapping, or policy instead of delegating to the right layer inside the module.

---

## Creating a bounded context (workflow)

Use when introducing a **new** cohesive area of the system (greenfield module or extracted domain).

1. **Scope and language** — Name the context; list core nouns/verbs (**ubiquitous language**). Reject vague names that collide with other contexts.
2. **Responsibilities** — What decisions happen **only** here? What is explicitly *out* of scope?
3. **State ownership** — Which facts are **authoritative** in this context? Where are they stored conceptually (even if storage tech is undecided)?
4. **Public contract** — Operations and/or events other contexts may use. Version or evolve this contract intentionally.
5. **Integrations** — For each neighbor: sync call, async message, shared read model, or batch sync? Document **consistency** (immediate, eventual) and **failure** behavior.
6. **Invariants and lifecycles** — What must always be true inside this boundary? What starts/completes a lifecycle?
7. **Isolation check** — Can you test core behavior **without** spinning up unrelated contexts (fakes at ports)?
8. **Observability** — How will you trace a request or job through **this** context with clear identifiers?

**Cross-module interaction** (while designing): prefer the **minimal** contract; define **timeouts**, **retries**, **idempotency** for async; avoid “temporary” direct store access as a shortcut.

---

## When to split or merge

**Default:** **fewer boundaries** until real pain appears — “flat is often better” than premature fragmentation. Splitting adds coordination, versioning, and operational cost.

### Six-criteria test (favor split when several are true)

| # | Criterion | Question |
|---|-----------|----------|
| 1 | **Language** | Do the sub-areas use **different vocabulary** or conflicting definitions of the same word? |
| 2 | **Rate of change** | Do parts **change on different cadences** or for unrelated reasons (most edits touch one side)? |
| 3 | **Scale / SLO** | Do parts need **different** throughput, latency, or availability targets? |
| 4 | **Consistency** | Do they need **different transaction boundaries** (cannot share one atomic write model cleanly)? |
| 5 | **Ownership** | Would **different teams** or clear ownership lines reduce conflict and review churn? |
| 6 | **Pain signal** | Is there **observable** integration pain: ripple effects, fear of change, unclear who owns a bug? |

**Cohesion / coupling (qualitative).** Favor **high cohesion** inside a module and **low, explicit coupling** between modules. If the only motivation is “files got big” or “folder aesthetics,” **merge or wait**.

### When to merge or not split yet

- Boundaries are **artificial** (same language, same lifecycle, constant cross-calls).
- Splitting would **duplicate** logic or data without a clear **single writer** rule.
- Team is not ready to **own** contracts, versioning, and ops for extra units.

### Decision prompts (short)

- Would separation **reduce** accidental coupling more than it **increases** coordination cost?
- Is there a natural **ubiquitous language** boundary, or only a technical seam?

---

## Sub-units inside a bounded context

Sometimes one outer boundary is right, but inside it there are **named sub-areas** (subdomains, feature areas). Principles still apply **within** the context.

**Ownership**

- Each sub-unit should **own** its slice of model and persistence concerns where possible — avoid one mega registration layer that wires **every** store and repository for **every** sub-unit in one place (encourages reach-through and hidden coupling).

**Cross-sub-unit access**

- Prefer **internal application APIs** or **thin internal facades** (same context, explicit surface) over peers importing each other’s storage types directly.
- For async flows, prefer **enriched payloads** so handlers do not **chat** across sub-units for data that could travel with the event/command.

**Shared kernel inside the context**

- Small, stable shared types or enums can live in a **narrow shared area** — but resist a growing “utils” dump that becomes the real coupling point.

**Anti-pattern:** A single “persistence” or “data” sub-module that becomes the **only** place that knows about all tables/documents for all sub-units, and everyone else reaches through it — same problems as cross-context reach-through, **inside** the boundary.

---

## Architecture compliance pass

Use for **reviews** or **audits** without assuming tooling. Treat items as **signals**, not proof — confirm with domain experts.

### Dependency and API signals

- **Inbound vs outbound:** Dependencies should align with your chosen architecture (e.g. domain at the center, adapters outside). **Inward** leaks of infrastructure types into core logic are a smell.
- **Public surface:** Can you list **exported** operations/events/types without including storage or internal services? If not, boundaries are leaky.
- **Neighbor imports:** Types or clients from **module A** used in **module B** — are they only **contract** types, or persistence/implementation types?

### Persistence and data signals

- **Reach-through:** References to another context’s **physical** data (schema, collection, bucket name) outside an agreed contract.
- **Naming collisions:** Same logical name for different things, or shared global IDs without a documented mapping rule.
- **Transaction ownership:** Writes that span contexts without a clear **saga**, **outbox**, or **single-owner** rule and documented failure cases.

### Operational signals

- **Blame:** Incidents where “we don’t know which module owns this row/behavior” → ownership or observability gap.
- **Cascades:** One dependency’s slowdown or failure takes down unrelated user journeys → missing **timeouts**, **bulkheads**, or **degradation** paths.

### Severity heuristic (for reporting)

| Tier | Meaning |
|------|--------|
| **P0** | Data corruption risk, security boundary violation, or cross-context persistence with no contract |
| **P1** | Unclear ownership, leaky public API, missing failure semantics at boundaries |
| **P2** | Observability gaps, composability smells, tech debt that increases future coupling |

**Maturity note:** Scoring is **qualitative** unless the team defines numeric gates. Use trends: fewer P0/P1 over time, clearer contracts.

---

## Quick checklist (before proposing structure)

- [ ] Public API is minimal; internals are not exported casually.
- [ ] Names and storage ownership are unambiguous per module.
- [ ] No cross-module persistence shortcuts without an explicit contract.
- [ ] Business rules sit behind a clear application/domain layer, not only in adapters.
- [ ] Cross-module calls have explicit failure and timeout behavior.
- [ ] Observability can answer “which module failed and why?” without spelunking.
- [ ] If the context has sub-units: each has clear ownership; no monolithic “registers everything” persistence grab-bag.

---

## Relationship to stack-specific skills

When a project has **concrete conventions** (framework modules, DI, repository patterns, folder layout, codegen, CI checks), prefer those documents for **how** to implement. Use **this** skill for **why** boundaries exist and **what** good modular design optimizes for — so stack-specific advice stays aligned with the same principles.

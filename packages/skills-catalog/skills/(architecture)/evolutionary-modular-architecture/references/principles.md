# Principles Reference

19 principles: 10 **modular** (the foundation) + 9 **structural** (internal organization). Modular principles always win conflicts with structural ones.

## Table of Contents

1. Modular principles (P1–P10)
2. Structural principles (P11–P19)
3. Conflict hierarchy

---

## 1. Modular principles (P1–P10)

These define the foundation. Criticality noted where it matters most.

- **P1 — Well-Defined Boundaries (High).** Each module has clear responsibilities and exposes only a public facade from `index`. Never import another module's internal classes; never share database entities.
- **P2 — Composability (Medium).** Modules are building blocks; the same modules compose into different apps (monolith today, dedicated apps later) via dependency injection.
- **P3 — Independence (High).** Modules build, test, and deploy in isolation. Communicate via interfaces/events, never direct method calls into another module. No shared mutable state.
- **P4 — Individual Scale (Medium).** A module can scale on its own resource needs (e.g., a worker app) without forcing others to scale.
- **P5 — Explicit Communication (High).** All inter-module communication uses well-defined contracts (interfaces, DTOs, versioned events). No assumptions about another module's internals.
- **P6 — Replaceability (Medium).** Modules and external dependencies sit behind interfaces and can be swapped without touching consumers. Never export concrete classes as the module API.
- **P7 — Deployment Independence (Medium).** Modules do not dictate deployment; deployment logic lives in apps. Environment variables carry deploy-specific config.
- **P8 — State Isolation (CRITICAL).** Each module owns its state. Prefix entities with the module name (`BillingPlan`, not `Plan`). One shared database is acceptable, but **never** share tables, never put foreign keys across module boundaries, never read another module's repository. Reference other contexts by id.
- **P9 — Observability (High).** Per-module logs, metrics, tracing, health, and correlation ids. Do not mix module concerns in telemetry.
- **P10 — Fail Independence (High).** A failure in one module does not cascade. Use circuit breakers, timeouts, retries with backoff, and graceful degradation.

## 2. Structural principles (P11–P19)

These define how code is organized **inside** each module — optimized for humans and for AI agents (the discovery cost of a concept turns directly into tokens and tool calls).

- **P11 — Co-location by Aggregate (High).** One business concept = one folder. Production files of that concept (entity, repository, service, controller/resolver, DTO, types) live together. Unit tests live in `<aggregate>/__test__/`. Never split by technical layer.
- **P12 — Suffixes > Folders (Medium).** Use `.types.ts`, `.dto.ts`, `.constants.ts` suffixes — not `types/` subfolders. `user.types.ts`, not `types/user.ts`.
- **P13 — Depth ≤ 2–3 (High).** Flat packages: depth 2 (`module/aggregate/file`). Subdomain-based: depth 3 (`module/subdomain/aggregate/file`). `shared/` is exempt.
- **P14 — Folder Only if ≥ 2–3 Cohesive Files (Medium).** No single-file folder; use a suffix instead. Exception: `__test__/` is a sanctioned semantic folder even with one file.
- **P15 — Aggregate Limits (Medium).** ~15 files in one aggregate = review signal; ~25+ = strong split candidate (split into sub-aggregates or promote to subdomain).
- **P16 — AI-Flat Optimization (Medium).** Flat structure minimizes discovery cost — `ls module/` reveals the domain, not the framework (Screaming Architecture).
- **P17 — No README in Aggregate (Low).** README only at the package root; never inside aggregate/subdomain business folders.
- **P18 — Service as Default Unit (Medium).** Services group an aggregate's actions; sub-types (state machine, validator, calculator) use suffixes (`.state-machine.service.ts`), not folders. A distinct "use-case" construct is unnecessary in NestJS without strict layer separation — co-location already provides the focus.
- **P19 — Intentional Shared Kernel is Legitimate (Medium).** For behavior-less ORM entities, a documented shared kernel is an accepted DDD pattern when sharing is justified by cross-subdomain reads, ownership is centralized and documented (JSDoc), and the entity is a pure state holder. The anti-pattern is the **accidental** shared kernel (entities with no clear owner). Ref: Vernon, *Implementing DDD* (2013), ch. 3; Evans, *DDD* (2003), ch. 14.

## 3. Conflict hierarchy

**Modular (P1–P10) prevails over structural (P11–P19).** When structural convenience would break a modular boundary, modular wins.

| Conflict | Resolution |
| --- | --- |
| Co-locating files (P11) would require a cross-module entity import | Use facade + DTO (P1, P5) — do not import entities |
| Splitting an aggregate (P15) would break a transactional boundary | Keep it together (P8); split by subdomain instead |
| Flat depth (P13) vs subdomain isolation (P3) | Subdomain layout at depth 3 is allowed when P3/P4 justify it |
| Suffix preference (P12) vs shared test helpers | `__test__/` is exempt |

Rule of thumb: if obeying P11–P19 would break P1, P5, or P8, stop and use the modular pattern.

**Make it executable.** `scripts/validate-structure.mjs` enforces the structural principles (P11–P17) and `scripts/validate-boundaries.mjs` enforces boundaries and state isolation (P1, P3, P8). Run both in CI.

---

Sources: Modular Monolith (Grzybek; Drotbohm / Spring Modulith); the 10 modular principles (Arquiteturas Modulares whitepaper, TechLeads.club; Ghemawat et al., HotOS 2023); structural principles validated in production (flat-by-aggregate refactor, fakeflix).

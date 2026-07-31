# Flat-by-Aggregate Reference

How to organize a module internally. The goal: minimize discovery cost while preserving the Clean Architecture dependency rule.

## Table of Contents

1. The principle
2. Why flat (AI-era discovery cost)
3. Flat package structure (depth 2)
4. Subdomain-based structure (depth 3)
5. Flat vs subdomain: the 6-criteria test
6. Facades and public API
7. Tests
8. Dependency rule, expressed as suffixes
9. Validate it

---

## 1. The principle

**1 business concept = 1 folder.** All production files of an aggregate live together; technical layers become file **suffixes**, not folders. `ls module/` reveals the domain (Screaming Architecture), not the framework.

- ✅ `package/billing/subscription/subscription.{entity,repository,service,controller,types}.ts`
- ❌ `package/billing/core/service/` + `package/billing/persistence/entity/` (legacy technical layers)

## 2. Why flat (AI-era discovery cost)

Code is now read by humans and by AI agents (Cursor, Claude Code, Codex). Depth and indirection turn directly into more tokens, more tool calls, and higher error probability. Keeping a concept in one folder cuts that cost sharply — practical estimates report 30–50% fewer tokens on read/refactor tasks. It also speeds human onboarding (one mental model: "1 concept = 1 folder") and makes PR review's structural checks automatable. This is a modern application of established patterns — Modular Monolith, Bounded Context, Screaming Architecture (R. Martin), Vertical Slice (Bogard), Package by Feature — not a replacement for them.

## 3. Flat package structure (depth 2)

Use for a single cohesive domain (3–8 aggregates). Examples: billing, identity, notifications.

```
package/<module>/
├── <aggregate>/
│   ├── <aggregate>.entity.ts
│   ├── <aggregate>.repository.ts
│   ├── <aggregate>.service.ts
│   ├── <aggregate>.controller.ts        # or .resolver.ts for GraphQL
│   ├── <aggregate>.types.ts
│   ├── <aggregate>.dto.ts
│   └── __test__/
│       └── <aggregate>.service.spec.ts
├── shared/persistence/                  # connection/datasource only — zero domain repos
├── <module>.module.ts
├── <module>.facade.ts
├── config.ts
└── index.ts                             # exports facade + module only
```

## 4. Subdomain-based structure (depth 3)

Use when a module has multiple subdomains with independent scaling/failure needs (10+ aggregates). Examples: content (management/catalog), analytics (ingestion/aggregation/reporting).

```
package/<module>/
├── <subdomain>/
│   ├── <aggregate>/
│   │   ├── <aggregate>.entity.ts
│   │   ├── <aggregate>.repository.ts
│   │   ├── <aggregate>.service.ts
│   │   └── __test__/
│   ├── <subdomain>.module.ts            # registers its own repos + services
│   └── <subdomain>.facade.ts            # pure delegation, exported to siblings
├── shared/
│   ├── contract/                        # queue/event payload types
│   ├── enum/
│   └── persistence/                     # connection only — zero repos
├── <module>.module.ts                   # composes subdomains
├── <module>.facade.ts                   # composes subdomain facades
└── index.ts
```

Rules: each subdomain owns its repositories; `shared/persistence` holds only the connection; cross-subdomain reads go through the sibling's **internal facade**, never its repositories.

## 5. Flat vs subdomain: the 6-criteria test

Default to **flat**. Go subdomain-based only when **4+ of 6** hold:

1. Different user personas (admin vs customer)?
2. Different authorization models?
3. Different execution model (REST vs queue vs GraphQL)?
4. Different scaling characteristics (read-heavy vs write-heavy, CPU vs I/O)?
5. Could it be deployed independently?
6. Can it fail in isolation?

Decision matrix: high cohesion + low coupling → strong subdomain candidate; high cohesion + high coupling → keep flat (coupling means they belong together); low cohesion → refactor first, do not split.

Red flags (do NOT split): "it feels big"; "to make code easier to find" (use aggregate naming, not layer folders); tightly coupled features; matching the org chart.

Aggregate-level: a single aggregate over ~25 files → split into sub-aggregates within the same package; a flat package over ~8 aggregates with low coupling → consider subdomains.

## 6. Facades and public API

Pattern is always **Facade → Service → Repository**. The facade only delegates (no querying, mapping, or business logic). The package `index` exports only the facade and the module class — never services, repositories, controllers, or entities.

## 7. Tests

Unit tests in `<aggregate>/__test__/<file>.spec.ts` (next to the aggregate, not beside production files). End-to-end tests centralized per flow in `__test__/e2e/<flow>.e2e-spec.ts`.

## 8. Dependency rule, expressed as suffixes

Clean Architecture's dependency rule is preserved without layer folders. Within one aggregate folder:

- `<x>.controller.ts` (presentation) depends on
- `<x>.service.ts` (application — the **default unit**, P18) depends on
- `<x>.entity.ts` + the repository **interface** (domain)
- `<x>.repository.ts` (infrastructure) **implements** the domain interface

Dependencies still point inward toward the domain; the layers are just suffixes in the same folder instead of separate directories.

## 9. Validate it

Make the layout self-enforcing: run `node scripts/validate-structure.mjs [root]` to catch technical-layer folders, single-file folders, depth violations, and stray READMEs (P11–P17); run `node scripts/validate-boundaries.mjs [root]` to catch deep cross-module imports and duplicate/unprefixed entities (P1, P3, P8). Wire both into CI.

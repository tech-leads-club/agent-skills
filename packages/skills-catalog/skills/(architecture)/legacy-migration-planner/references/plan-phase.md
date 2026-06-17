# Plan Phase — Detailed Methodology

This reference contains the step-by-step process for the PLAN phase. The PLAN phase MUST NOT begin until the RESEARCH phase is fully complete with all four output files written.

Every decision in this phase must trace back to evidence from the RESEARCH output files. If you find yourself making a decision without evidence, stop and go back to RESEARCH.

## Step 5: Define Migration Direction

### 5.1 — Direction Assessment

Based on RESEARCH findings, determine which migration direction applies. This is NOT a choice you make — it is determined by evidence.

| Direction | Evidence That Points Here |
|-----------|--------------------------|
| **Decomposition** (monolith → services) | High coupling ratios across domains, deployment bottlenecks cited in CI/CD config, scaling constraints in infrastructure config, team autonomy requirements stated by user |
| **Consolidation** (services → modular monolith) | Excessive inter-service communication found in integration catalog, operational overhead in infrastructure config, data consistency issues across services, small team stated by user |
| **Cross-stack** (language/framework change) | EOL/deprecated stack in dependency inventory, target stack specified by user, performance/ecosystem gaps documented in stack research |
| **Modernization in-place** (same stack, better architecture) | Stack is current but architecture has issues (circular deps, no domain boundaries, scattered data access) |
| **Hybrid** | Combination of above — document which direction applies to which domain |

### 5.2 — Direction Documentation

In `00-roadmap.md`, document the chosen direction with explicit evidence:

```markdown
## Migration Direction: {Direction}

**Rationale**: Based on the following RESEARCH findings:
- {Finding 1 — reference to research/file.md}
- {Finding 2 — reference to research/file.md}
- {Finding 3 — reference to research/file.md}

**User-confirmed constraints**:
- {Any constraints the user provided}
```

If the direction is ambiguous, ASK THE USER. Present the evidence for each option and let them decide. Never choose a direction without sufficient evidence.

## Step 6: Design Seams and Facades

Load `references/strangler-fig-patterns.md` for pattern details.

### 6.1 — Seam Identification

A seam is a boundary where you can intercept and redirect behavior without modifying the legacy code. For each domain identified in RESEARCH:

1. **API seams** — HTTP routes, GraphQL resolvers, gRPC service definitions. Reference the exact route definitions with `file:line`.
2. **Event seams** — Message queue producers/consumers, event emitters, webhooks. Reference with `file:line`.
3. **Data seams** — Database access points where reads/writes can be intercepted. Reference the ORM models or query locations with `file:line`.
4. **UI seams** — Component boundaries, route-level splits, micro-frontend mount points. Reference with `file:line`.

### 6.2 — Facade Layer Design

For each seam, define the facade/router that will enable incremental migration:

```markdown
## Seam: {Name}

**Type**: API | Event | Data | UI
**Location**: `file:line`
**Current behavior**: {What it does today — referenced}
**Facade approach**: {How to intercept — pattern from strangler-fig-patterns.md}
**Routing mechanism**: Feature flag | API gateway | Proxy | Event interceptor
**Rollback mechanism**: {How to instantly revert to legacy behavior}
```

### 6.3 — Dependency Order

Determine the migration order based on dependency analysis from RESEARCH:

1. Domains with **zero incoming dependencies** from other domains can be migrated first (leaf nodes).
2. Domains that **many others depend on** should be migrated last (core/shared).
3. Shared database tables require special handling — document the dual-write or data sync strategy.

Produce a dependency graph showing the migration order.

## Step 7: Per-Domain Migration Plans

For each bounded context identified in RESEARCH, create a dedicated file: `./migration-plan/domains/XX-domain-{name}.md`.

### Domain File Template

Every domain file must follow this structure:

```markdown
# Domain: {Name}

## Current State

**Modules**: {List with file:line refs}
**Responsibility**: {One sentence}
**Dependencies**:
- Depends on: {Other domains, with file:line refs to import statements}
- Depended on by: {Other domains that import from this one}
**Data stores**: {Tables/collections with file:line refs to models}
**External integrations**: {APIs, queues, etc. with file:line refs}

## Target State

**Architecture**: {Target structure}
**Technology**: {Stack — verified via web search in RESEARCH, cite stack-research.md}
**Key changes**:
- {Change 1 — what moves where}
- {Change 2}

## Migration Steps

### Step 1: {Action}
**Pattern**: {Reference to strangler-fig-patterns.md section}
**Seam**: {Reference to seam identified in Step 6}
**What changes**: {Specific description}
**Files affected**: {file:line list}
**Testing**: {Strategy from testing-safety-nets.md}
**Rollback**: {How to revert this specific step}
**Success criteria**: {Measurable metrics}

### Step 2: {Action}
...

## Risks Specific to This Domain

| Risk | Impact | Mitigation | Evidence |
|------|--------|------------|----------|
| {Risk} | {Level} | {Strategy} | {file:line or research ref} |

## Dependencies on Other Domains

**Must complete before this domain**:
- {Domain X} — because {reason with evidence}

**Blocks these domains**:
- {Domain Y} — because {reason with evidence}
```

### Writing Guidelines for Domain Files

- Each file should be self-contained enough for another agent to execute the migration for that domain without needing to read all other domain files.
- Cross-references to other domain files are fine, but the core context must be in-file.
- Keep each file under 300 lines. If a domain is too complex, split it into sub-domains.
- Every `file:line` reference must have been actually read during RESEARCH. Never fabricate references.

## Step 8: Consolidated Roadmap

Write `./migration-plan/00-roadmap.md` as the master document that ties everything together.

### Roadmap Template

```markdown
# Migration Roadmap

## Executive Summary

**Current state**: {1-2 sentences with evidence refs}
**Target state**: {1-2 sentences}
**Migration direction**: {Direction from Step 5}
**Estimated domains**: {Count}
**Critical risks**: {Top 3 from risk-assessment.md}

## Migration Direction Rationale

{From Step 5.2}

## Phase Sequence

### Phase 0: Safety Net Setup
**Duration estimate**: {Based on codebase size from RESEARCH}
**Goal**: Establish characterization tests and monitoring before any migration begins.
**Details**: See `references/testing-safety-nets.md` for methodology.
**Domains affected**: All
**Success criteria**: {Measurable}

### Phase 1: {First domain(s) to migrate}
**Domains**: {List — leaf nodes from dependency analysis}
**Why first**: {Evidence — lowest coupling, no incoming dependencies}
**Plan files**: `domains/01-domain-{name}.md`
**Dependencies**: Phase 0 complete
**Success criteria**: {Measurable}

### Phase 2: {Next domain(s)}
...

### Phase N: Legacy Decommission
**Goal**: Remove legacy code paths after all domains are migrated and validated.
**Prerequisites**: All domains at 100% traffic on new paths for minimum 30 days.
**Rollback**: Feature flags preserved for 60 days post-decommission.

## Cross-Domain Concerns

### Shared Database Tables
| Table | Accessed By | Strategy | Reference |
|-------|------------|----------|-----------|
| {table} | {domains} | Dual-write / facade | {domain file ref} |

### Shared Authentication / Session
{How auth is handled during migration — cite research}

### Observability
{Monitoring strategy to compare old vs new behavior during migration}

## Risk Summary

{Top risks from risk-assessment.md with cross-references to domain-specific mitigations}

## Open Questions

{Any unresolved items that need user input before execution can begin}
```

## Plan Completion Checklist

Before declaring the plan complete, verify ALL of the following:

- [ ] Migration direction is documented with evidence
- [ ] Every seam is identified with `file:line` refs
- [ ] Facade/router layer is designed for each seam
- [ ] Domain migration order is determined by dependency analysis
- [ ] Every domain has its own plan file in `./migration-plan/domains/`
- [ ] Every domain file includes: current state, target state, steps, testing, rollback, success criteria
- [ ] Consolidated roadmap ties all domains into a phased sequence
- [ ] Cross-domain concerns (shared DB, auth, observability) are addressed
- [ ] No unreferenced claims exist in any output file
- [ ] Open questions are listed for the user
- [ ] All technology recommendations were verified via web search

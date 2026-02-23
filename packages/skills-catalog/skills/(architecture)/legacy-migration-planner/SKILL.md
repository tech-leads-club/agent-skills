---
name: legacy-migration-planner
description: Use when planning legacy system migrations, codebase modernization, monolith decomposition, microservices consolidation, cross-language rewrites, or framework upgrades. Invoke for strangler fig pattern, incremental migration strategy, or refactoring roadmaps.
license: CC-BY-4.0
metadata:
  author: Felipe Rodrigues - github.com/felipfr
  version: 1.0.0
---

# Legacy Migration Planner

Senior migration architect that produces comprehensive, evidence-based migration plans using the Strangler Fig pattern. You create plans — you do not implement them. Other agents or developers execute the plan you produce.

## Core Principles

These are non-negotiable. Violating any of these invalidates your output.

1. **Never assume.** If you encounter an acronym, term, pattern, or technology you are not 100% certain about, stop and either research it (web search, context7) or ask the user. Say "I don't know what X means — can you clarify?" rather than guessing.
2. **Always cite evidence.** Every claim in your output must reference either a specific `file:line` from the user's codebase or a verified external URL. No unreferenced assertions.
3. **Always research before recommending.** Before suggesting any technology, pattern, or approach, use web search and context7 (when available) to verify it is current, maintained, and appropriate. Never recommend based solely on training data.
4. **Minimize token consumption.** Write output files per domain. Never dump entire file contents — reference by `file:line` ranges. Keep each output file focused on one bounded context.
5. **Direction-agnostic.** This skill handles ANY migration direction: monolith to microservices, microservices to modular monolith, microfrontends to SPA, cross-language, cross-framework, or any combination.

## Workflow

Every engagement follows two mandatory phases. Never skip RESEARCH. Never start PLAN without completing RESEARCH.

```
RESEARCH (mandatory)                    PLAN (mandatory)
├─ 1. Codebase deep analysis            ├─ 5. Define migration direction
├─ 2. Domain/bounded context mapping    ├─ 6. Design seams and facades
├─ 3. Stack research (web + context7)   ├─ 7. Per-domain migration files
└─ 4. Risk and dependency mapping       └─ 8. Consolidated roadmap
│                                        │
└─ Output: ./migration-plan/research/   └─ Output: ./migration-plan/domains/
```

### RESEARCH Phase

Load `references/research-phase.md` for detailed instructions.

1. **Analyze the codebase** — Read the project structure, entry points, configuration files, and dependencies. Map every module and its responsibility. Cite every finding as `file:line`.
2. **Identify bounded contexts** — Group related modules into candidate domains. Load `references/assessment-framework.md` for the domain identification method.
3. **Research current and target stacks** — Use web search and context7 to gather up-to-date documentation on both the current stack and the target stack (if migrating cross-framework/language). Document version compatibility, migration guides, and known pitfalls.
4. **Map risks and dependencies** — Identify integration points, shared databases, circular dependencies, and external service couplings. Load `references/assessment-framework.md` for the risk matrix method.

Output: Write findings to `./migration-plan/research/` with one file per concern (e.g., `dependency-map.md`, `domain-candidates.md`, `stack-research.md`, `risk-assessment.md`).

### PLAN Phase

Load `references/plan-phase.md` for detailed instructions.

5. **Define migration direction** — Based on RESEARCH findings, determine the appropriate strategy. Load `references/strangler-fig-patterns.md` for pattern selection.
6. **Design seams and facades** — Identify where to cut the system. Define the facade/router layer that will enable incremental migration. Load `references/frontend-backend-strategies.md` for stack-specific patterns.
7. **Write per-domain migration plans** — One file per bounded context in `./migration-plan/domains/`. Each file contains: current state (with file:line refs), target state, migration steps, testing strategy (load `references/testing-safety-nets.md`), rollback plan, and success metrics.
8. **Write consolidated roadmap** — `./migration-plan/00-roadmap.md` with phase sequencing, dependencies between domains, risk mitigation timeline, and success criteria.

## Output Structure

```
./migration-plan/
├── 00-roadmap.md                    # Consolidated roadmap, phases, timeline
├── research/
│   ├── dependency-map.md            # Module dependencies with file:line refs
│   ├── domain-candidates.md         # Identified bounded contexts
│   ├── stack-research.md            # Current + target stack analysis
│   └── risk-assessment.md           # Risk matrix with mitigations
└── domains/
    ├── 01-domain-{name}.md          # Per-domain migration plan
    ├── 02-domain-{name}.md
    └── ...
```

## Reference Guide

Load references based on the current phase and need. Do not preload all references.

| Topic                   | Reference                                   | Load When                                                |
| ----------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Research methodology    | `references/research-phase.md`              | Starting RESEARCH phase                                  |
| Plan methodology        | `references/plan-phase.md`                  | Starting PLAN phase                                      |
| Strangler Fig patterns  | `references/strangler-fig-patterns.md`      | Choosing migration pattern, designing seams              |
| Assessment and risks    | `references/assessment-framework.md`        | Mapping dependencies, scoring risks, identifying domains |
| Testing strategies      | `references/testing-safety-nets.md`         | Designing safety nets for each domain                    |
| Stack-specific patterns | `references/frontend-backend-strategies.md` | Frontend or backend migration specifics                  |

## Constraints

### MUST DO

- Research every technology recommendation via web search before including it
- Use context7 for library documentation when available
- Cite `file:line` for every codebase observation
- Ask the user when encountering unknown terms, acronyms, or ambiguous requirements
- Produce one output file per domain to keep context manageable
- Include rollback strategy for every migration step
- Validate that current stack versions match what is actually in the codebase (package.json, requirements.txt, etc.)

### MUST NOT DO

- Guess the meaning of acronyms, internal terms, or business logic
- Recommend technologies without web search verification
- Write implementation code (this skill produces plans, not code)
- Assume migration direction without evidence from RESEARCH
- Skip the RESEARCH phase or combine it with PLAN
- Reference files or lines that were not actually read
- Include unreferenced claims in any output file

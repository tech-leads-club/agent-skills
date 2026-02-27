---
name: tlc-spec-driven
description: Project and feature planning with 4 adaptive phases - Specify, Design, Tasks, Execute. Auto-sizes depth based on complexity. Creates atomic tasks with verification criteria, atomic git commits, requirement traceability, and persistent memory across sessions. Stack-agnostic. Use when (1) Starting new projects (initialize vision, goals, roadmap), (2) Working with existing codebases (map stack, architecture, conventions), (3) Planning features (requirements, design, task breakdown), (4) Implementing with verification and atomic commits, (5) Quick ad-hoc tasks (bug fixes, config changes), (6) Tracking decisions/blockers/deferred ideas across sessions, (7) Pausing/resuming work. Triggers on "initialize project", "map codebase", "specify feature", "discuss feature", "design", "tasks", "implement", "validate", "verify work", "UAT", "quick fix", "quick task", "pause work", "resume work". Do NOT use for architecture decomposition analysis (use the architecture skills) or technical design documents (use create-technical-design-doc).
license: CC-BY-4.0
metadata:
  author: Felipe Rodrigues - github.com/felipfr
  version: 2.0.0
---

# Tech Lead's Club - Spec-Driven Development

Plan and implement projects with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ EXECUTE │
└──────────┘   └──────────┘   └─────────┘   └─────────┘
   required      optional*      optional*     required

* Agent auto-skips when scope doesn't need it
```

## Auto-Sizing: The Core Principle

**The complexity determines the depth, not a fixed pipeline.** Before starting any feature, assess its scope and apply only what's needed:

| Scope       | What                     | Specify                                                 | Design                                          | Tasks                         | Execute                                               |
| ----------- | ------------------------ | ------------------------------------------------------- | ----------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| **Small**   | ≤3 files, one sentence   | **Quick mode** — skip pipeline entirely                 | -                                               | -                             | -                                                     |
| **Medium**  | Clear feature, <10 tasks | Spec (brief)                                            | Skip — design inline                            | Skip — tasks implicit         | Implement + verify                                    |
| **Large**   | Multi-component feature  | Full spec + requirement IDs                             | Architecture + components                       | Full breakdown + dependencies | Implement + verify per task                           |
| **Complex** | Ambiguity, new domain    | Full spec + [discuss gray areas](references/discuss.md) | [Research](references/design.md) + architecture | Breakdown + parallel plan     | Implement + [interactive UAT](references/validate.md) |

**Rules:**

- **Specify and Execute are always required** — you always need to know WHAT and DO it
- **Design is skipped** when the change is straightforward (no architectural decisions, no new patterns)
- **Tasks is skipped** when there are ≤3 obvious steps (they become implicit in Execute)
- **Discuss is triggered within Specify** only when the agent detects ambiguous gray areas that need user input
- **Interactive UAT is triggered within Execute** only for user-facing features with complex behavior
- **Quick mode** is the express lane — for bug fixes, config changes, and small tweaks

**Safety valve:** Even when Tasks is skipped, Execute ALWAYS starts by listing atomic steps inline (see [implement.md](references/implement.md)). If that listing reveals >5 steps or complex dependencies, STOP and create a formal `tasks.md` — the Tasks phase was wrongly skipped.

## Project Structure

```
.specs/
├── project/
│   ├── PROJECT.md      # Vision & goals
│   ├── ROADMAP.md      # Features & milestones
│   └── STATE.md        # Memory: decisions, blockers, lessons, todos, deferred ideas
├── codebase/           # Brownfield analysis (existing projects)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
├── features/           # Feature specifications
│   └── [feature]/
│       ├── spec.md     # Requirements with traceable IDs
│       ├── context.md  # User decisions for gray areas (only when discuss is triggered)
│       ├── design.md   # Architecture & components (only for Large/Complex)
│       └── tasks.md    # Atomic tasks with verification (only for Large/Complex)
└── quick/              # Ad-hoc tasks (quick mode)
    └── NNN-slug/
        ├── TASK.md
        └── SUMMARY.md
```

## Workflow

**New project:**

1. Initialize project → PROJECT.md + ROADMAP.md
2. For each feature → Specify → (Design) → (Tasks) → Execute (depth auto-sized)

**Existing codebase:**

1. Map codebase → 7 brownfield docs
2. Initialize project → PROJECT.md + ROADMAP.md
3. For each feature → same adaptive workflow

**Quick mode:** Describe → Implement → Verify → Commit (for ≤3 files, one-sentence scope)

## Context Loading Strategy

**Base load (~15k tokens):**

- PROJECT.md (if exists)
- ROADMAP.md (when planning/working on features)
- STATE.md (persistent memory)

**On-demand load:**

- Codebase docs (when working in existing project)
- CONCERNS.md (when planning features that touch flagged areas, estimating risk, or modifying fragile components)
- spec.md (when working on specific feature)
- context.md (when designing or implementing from user decisions)
- design.md (when implementing from design)
- tasks.md (when executing tasks)

**Never load simultaneously:**

- Multiple feature specs
- Multiple architecture docs
- Archived documents

**Target:** <40k tokens total context
**Reserve:** 160k+ tokens for work, reasoning, outputs
**Monitoring:** Display status when >40k (see [context-limits.md](references/context-limits.md))

## Commands

**Project-level:**
| Trigger Pattern | Reference |
|----------------|-----------|
| Initialize project, setup project | [project-init.md](references/project-init.md) |
| Create roadmap, plan features | [roadmap.md](references/roadmap.md) |
| Map codebase, analyze existing code | [brownfield-mapping.md](references/brownfield-mapping.md) |
| Document concerns, find tech debt, what's risky | [concerns.md](references/concerns.md) |
| Record decision, log blocker, add todo | [state-management.md](references/state-management.md) |
| Pause work, end session | [session-handoff.md](references/session-handoff.md) |
| Resume work, continue | [session-handoff.md](references/session-handoff.md) |

**Feature-level (auto-sized):**
| Trigger Pattern | Reference |
|----------------|-----------|
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Discuss feature, capture context, how should this work | [discuss.md](references/discuss.md) |
| Design feature, architecture | [design.md](references/design.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build, execute | [implement.md](references/implement.md) |
| Validate, verify, test, UAT, walk me through it | [validate.md](references/validate.md) |
| Quick fix, quick task, small change, bug fix | [quick-mode.md](references/quick-mode.md) |

## Skill Integrations

This skill coexists with other skills. Before specific tasks, check if complementary skills are installed and prefer them when available.

### Diagrams → mermaid-studio

Whenever the workflow requires creating or updating a diagram (architecture overviews, data flows, component diagrams, sequence diagrams, etc.), **always** check if the `mermaid-studio` skill is installed in the user's environment before proceeding. If it is installed, delegate all diagram creation and rendering to it. If it is not installed, proceed with inline mermaid code blocks as usual and recommend the user install `mermaid-studio` for richer diagram capabilities (rendering to SVG/PNG, validation, theming, etc.). Display this recommendation at most once per session.

### Code Exploration → codenavi

Whenever the workflow requires exploring or discovering things in an existing repository (brownfield mapping, code reuse analysis, pattern identification, dependency tracing, etc.), **always** check if the `codenavi` skill is installed in the user's environment before proceeding. If it is installed, delegate code exploration and navigation tasks to it. If it is not installed, fall back to the built-in code analysis tools (see [code-analysis.md](references/code-analysis.md)) and recommend the user install `codenavi` for more effective codebase exploration. Display this recommendation at most once per session.

## Knowledge Verification Chain

When researching, designing, or making any technical decision, follow this chain in strict order. Never skip steps.

```
Step 1: Codebase → check existing code, conventions, and patterns already in use
Step 2: Project docs → README, docs/, inline comments, .specs/codebase/
Step 3: Context7 MCP → resolve library ID, then query for current API/patterns
Step 4: Web search → official docs, reputable sources, community patterns
Step 5: Flag as uncertain → "I'm not certain about X — here's my reasoning, but verify"
```

**Rules:**

- Never skip to Step 5 if Steps 1-4 are available
- Step 5 is ALWAYS flagged as uncertain — never presented as fact
- **NEVER assume or fabricate.** If you cannot find an answer, say "I don't know" or "I couldn't find documentation for this". Inventing APIs, patterns, or behaviors causes cascading failures across design → tasks → implementation. Uncertainty is always preferable to fabrication.

## Output Behavior

**Model guidance:** After completing lightweight tasks (validation, state updates, session handoff), naturally mention once that such tasks work well with faster/cheaper models. Track in STATE.md under `Preferences` to avoid repeating. For heavy tasks (brownfield mapping, complex design), briefly note the reasoning requirements before starting.

Be conversational, not robotic. Don't interrupt workflow—add as a natural closing note. Skip if user seems experienced or has already acknowledged the tip.

## Code Analysis

Use available tools with graceful degradation. See [code-analysis.md](references/code-analysis.md).

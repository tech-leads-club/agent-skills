---
name: tlc-spec-driven
description: Project and feature planning with 4 phases - Specify, Design, Tasks, Implement+Validate. Creates atomic tasks with verification criteria and maintains persistent memory across sessions. Stack-agnostic. Use when (1) Starting new projects (initialize vision, goals, roadmap), (2) Working with existing codebases (map stack, architecture, conventions), (3) Planning features (requirements, design, task breakdown), (4) Implementing with verification, (5) Tracking decisions/blockers across sessions, (6) Pausing/resuming work. Triggers on "initialize project", "map codebase", "specify feature", "design", "tasks", "implement", "pause work", "resume work".
metadata:
  author: github.com/felipfr
  version: "1.0.0"
---

# Tech Lead's Club - Spec-Driven Development

Plan and implement projects with precision. Granular tasks. Clear dependencies. Right tools.

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌───────────────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ IMPLEMENT+VALIDATE│
└──────────┘   └──────────┘   └─────────┘   └───────────────────┘
```

## Project Structure

```
.specs/
├── project/
│   ├── PROJECT.md      # Vision & goals
│   ├── ROADMAP.md      # Features & milestones
│   └── STATE.md        # Memory between sessions
├── codebase/           # Brownfield analysis (existing projects)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   └── INTEGRATIONS.md
└── features/           # Feature specifications
    └── [feature]/
        ├── spec.md
        ├── design.md
        └── tasks.md
```

## Workflow

**New project:**

1. Initialize project → PROJECT.md
2. Create roadmap → ROADMAP.md
3. Specify features → existing workflow

**Existing codebase:**

1. Map codebase → 6 brownfield docs
2. Initialize project → PROJECT.md + ROADMAP.md
3. Specify features → existing workflow

## Context Loading Strategy

**Base load (~15k tokens):**

- PROJECT.md (if exists)
- ROADMAP.md (when planning/working on features)
- STATE.md (persistent memory)

**On-demand load:**

- Codebase docs (when working in existing project)
- spec.md (when working on specific feature)
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
| Record decision, log blocker | [state-management.md](references/state-management.md) |
| Pause work, end session | [session-handoff.md](references/session-handoff.md) |
| Resume work, continue | [session-handoff.md](references/session-handoff.md) |

**Feature-level:**
| Trigger Pattern | Reference |
|----------------|-----------|
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Design feature, architecture | [design.md](references/design.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build | [implement.md](references/implement.md) |
| Validate, verify, test | [validate.md](references/validate.md) |

**Tools:**
| Trigger Pattern | Reference |
|----------------|-----------|
| Code analysis, search patterns | [code-analysis.md](references/code-analysis.md) |

## Output Behavior

**Model guidance:** After completing lightweight tasks (validation, state updates, session handoff), naturally mention once that such tasks work well with faster/cheaper models. Track in STATE.md under `Preferences` to avoid repeating. For heavy tasks (brownfield mapping, complex design), briefly note the reasoning requirements before starting.

Be conversational, not robotic. Don't interrupt workflow—add as a natural closing note. Skip if user seems experienced or has already acknowledged the tip.

## Code Analysis

Use available tools with graceful degradation. See [code-analysis.md](references/code-analysis.md).

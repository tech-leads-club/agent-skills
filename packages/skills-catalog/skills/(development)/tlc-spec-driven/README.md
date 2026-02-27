<p align="center">
  <img src="https://img.shields.io/badge/Skill-TLC%20Spec--Driven-blue?style=for-the-badge" alt="skill badge" />
  <img src="https://img.shields.io/badge/Stack-Agnostic-green?style=for-the-badge" alt="stack agnostic" />
  <img src="https://img.shields.io/badge/Version-2.0.0-purple?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🎯 TLC Spec-Driven</h1>

<p align="center">
  <strong>Plan and implement projects with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.</strong>
</p>

<p align="center">
  <em>From the <a href="https://github.com/tech-leads-club">Tech Lead's Club</a> community</em>
</p>

<p align="center">
  <strong>Author:</strong> <a href="https://github.com/felipfr">Felipe Rodrigues</a> · 
  <a href="https://linkedin.com/in/felipfr">LinkedIn</a>
</p>

## ✨ What Is This Skill?

**TLC Spec-Driven** transforms how AI agents approach software projects. Instead of a rigid, bureaucratic pipeline, it uses **4 adaptive phases** that auto-size based on complexity — applying full rigor for complex features and skipping ceremony for simple ones:

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ EXECUTE │
└──────────┘   └──────────┘   └─────────┘   └─────────┘
   required      optional*      optional*     required

* Agent auto-skips when scope doesn't need it
```

**The complexity is in the system, not in your workflow.** You talk naturally — the skill decides how deep to go:

| Scope                               | What happens                                                      |
| ----------------------------------- | ----------------------------------------------------------------- |
| **Small** (≤3 files)                | Quick mode — describe → implement → verify → commit               |
| **Medium** (clear feature)          | Specify → Execute (design and tasks inline)                       |
| **Large** (multi-component)         | Full pipeline with formal design and task breakdown               |
| **Complex** (ambiguity, new domain) | Full pipeline + gray area discussion + research + interactive UAT |

## 🚀 Quick Start

### Installation

```bash
npx @tech-leads-club/agent-skills install -s tlc-spec-driven
```

### First Commands

| What You Want           | Say This                                      |
| ----------------------- | --------------------------------------------- |
| Start a new project     | `"Initialize project"` or `"Setup project"`   |
| Work with existing code | `"Map codebase"` or `"Analyze existing code"` |
| Plan a feature          | `"Specify feature [name]"`                    |
| Quick bug fix           | `"Quick fix: [description]"`                  |
| Resume previous work    | `"Resume work"` or `"Continue"`               |

> 💬 **Natural Conversation, Not Commands**
>
> These are trigger phrases, not strict commands. The skill works through **natural conversation** — talk to your agent like you would to a colleague. Say things like _"I want to build an authentication system"_ or _"Fix the login button, it returns 401"_. The agent understands context and intent, not just keywords.

## 📁 Project Structure

The skill creates a `.specs/` directory to organize all project documentation:

```
.specs/
├── project/
│   ├── PROJECT.md      # Vision, goals, tech stack, constraints
│   ├── ROADMAP.md      # Milestones, features, status tracking
│   └── STATE.md        # Persistent memory: decisions, blockers, learnings, todos, deferred ideas
│
├── codebase/           # Brownfield analysis (existing projects only)
│   ├── STACK.md        # Technology stack and dependencies
│   ├── ARCHITECTURE.md # Patterns, data flow, code organization
│   ├── CONVENTIONS.md  # Naming, style, coding patterns
│   ├── STRUCTURE.md    # Directory layout and modules
│   ├── TESTING.md      # Test frameworks and patterns
│   ├── INTEGRATIONS.md # External services and APIs
│   └── CONCERNS.md     # Tech debt, risks, fragile areas
│
├── features/           # Feature specifications
│   └── [feature-name]/
│       ├── spec.md     # Requirements with traceable IDs (FEAT-01, AUTH-02...)
│       ├── context.md  # User decisions for gray areas (only when needed)
│       ├── design.md   # Architecture and components (only for large/complex)
│       └── tasks.md    # Atomic tasks with dependencies (only for large/complex)
│
└── quick/              # Ad-hoc tasks (quick mode)
    └── NNN-slug/
        ├── TASK.md     # Description + verification
        └── SUMMARY.md  # What was done + commit
```

## 🔄 The Four Adaptive Phases

### Specify (always)

**Goal:** Capture WHAT to build with testable, traceable requirements.

The agent acts as a thinking partner — not an interviewer. It asks clarifying questions, challenges vagueness, and captures requirements with traceable IDs:

```markdown
### P1: User Login ⭐ MVP

**User Story:** As a user, I want to log in so that I can access my account.

| Requirement ID | Acceptance Criteria                                                            |
| -------------- | ------------------------------------------------------------------------------ |
| AUTH-01        | WHEN user enters valid credentials THEN system SHALL authenticate and redirect |
| AUTH-02        | WHEN user enters invalid credentials THEN system SHALL display error message   |
| AUTH-03        | WHEN user is already logged in THEN system SHALL redirect to dashboard         |
```

**Discuss gray areas (auto-triggered):** When the spec has ambiguous, user-facing decisions (layout preferences, interaction patterns, error handling style), the agent automatically asks the user about them — creating a `context.md` that locks those decisions before design. This is NOT a separate phase — it only happens within Specify when ambiguity is detected.

### Design (when needed)

**Goal:** Define HOW to build it. Architecture, components, what to reuse.

**Skipped when:** The change is straightforward — no architectural decisions, no new patterns. For simple features, design happens inline during Execute.

**Includes research:** Before designing with unfamiliar tech, the agent follows the **Knowledge Verification Chain** (codebase → project docs → Context7 MCP → web search → flag uncertain). It **never assumes or fabricates** — if it can't find documentation, it says so.

**Output:** `design.md` with architecture diagrams, component definitions, and integration points.

### Tasks (when needed)

**Goal:** Break into GRANULAR, ATOMIC tasks with clear dependencies.

**Skipped when:** There are ≤3 obvious steps. In that case, tasks are listed inline at the start of Execute.

**Safety valve:** If listing inline steps reveals >5 steps or complex dependencies, the agent STOPS and creates a formal `tasks.md` — acknowledging that the Tasks phase was wrongly skipped.

| ❌ Vague Task | ✅ Atomic Tasks                   |
| ------------- | --------------------------------- |
| "Create form" | T1: Create email input component  |
|               | T2: Add email validation function |
|               | T3: Create submit button          |
|               | T4: Add form state management     |

Each task includes: What (deliverable), Where (file path), Depends on (prerequisites), Reuses (existing code), Requirement (traceable ID), Done when (verifiable criteria), Commit (message format).

### Execute (always)

**Goal:** Implement one task at a time. Verify. Commit. Repeat.

Every task follows the same cycle:

```
Plan → Implement → Verify → Commit → Next
```

**Key principles:**

- **Surgical changes** — Only touch required files
- **No scope creep** — If it's not in the task, don't touch it. Capture ideas in STATE.md as Deferred Ideas
- **Verify before commit** — Check all "Done when" criteria
- **Atomic git commits** — One task = one commit, following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

```
feat(auth): add email validation to login form

refactor(api): extract token refresh logic into service

fix(cart): prevent negative quantity on item decrement
```

**Feature-level validation** happens after all tasks complete — including acceptance criteria checks, code quality review, and optionally interactive UAT for complex user-facing features.

## ⚡ Quick Mode

For small tasks (bug fixes, config changes, tweaks ≤3 files) that don't need the full pipeline:

```
You: Quick fix: login button returns 401 because token refresh skips expired check

Agent: Quick Task: Fix token refresh expired check
       Files: src/services/auth.ts
       Approach: Add expiry validation before refresh attempt
       Verify: Login with expired token returns new session, not 401

       [Implements...]

       ✅ Done. Committed: fix(auth): add expiry check to token refresh
```

**Guardrails:** Max 3 files, max 1 hour, no design decisions, no new dependencies. If any of these are exceeded, the agent recommends the full pipeline.

## 📋 Complete Command Reference

These trigger patterns help the agent recognize your intent, but you don't need to use them verbatim. Speak naturally — the agent understands variations and context.

### Project-Level

| Trigger Pattern                              | Description                                           |
| -------------------------------------------- | ----------------------------------------------------- |
| `Initialize project`, `Setup project`        | Create PROJECT.md with vision, goals, and constraints |
| `Create roadmap`, `Plan features`            | Create ROADMAP.md with milestones and features        |
| `Map codebase`, `Analyze existing code`      | Create 7 brownfield docs for existing projects        |
| `Document concerns`, `Find tech debt`        | Identify and document codebase risks                  |
| `Record decision`, `Log blocker`, `Add todo` | Add entries to STATE.md                               |
| `Pause work`, `End session`                  | Create handoff for session continuity                 |
| `Resume work`, `Continue`                    | Load previous state and continue                      |

### Feature-Level (auto-sized)

| Trigger Pattern                           | Description                             |
| ----------------------------------------- | --------------------------------------- |
| `Specify feature`, `Define requirements`  | Create spec.md with requirement IDs     |
| `Discuss feature`, `How should this work` | Capture user decisions for gray areas   |
| `Design feature`, `Architecture`          | Create design.md with architecture      |
| `Break into tasks`, `Create tasks`        | Create tasks.md with atomic breakdown   |
| `Implement task`, `Build`, `Execute`      | Execute specific task with verification |
| `Validate`, `Verify work`, `UAT`          | Feature-level validation and testing    |
| `Quick fix`, `Quick task`, `Bug fix`      | Express lane for small changes          |

## 🔁 Workflow Examples

### Starting a New Project

```
You: Initialize project

Agent: I'll help you set up your project. Let me ask a few questions:
       1. What are you building?
       2. Who is it for and what problem does it solve?
       ...

You: [Answer questions]

Agent: ✅ Created .specs/project/PROJECT.md
       Next: Would you like to create a roadmap? Say "Create roadmap"
```

### Working with an Existing Codebase

```
You: Map codebase

Agent: I'll analyze your existing codebase and document:
       - Technology stack, Architecture patterns, Coding conventions
       - Project structure, Testing infrastructure, External integrations
       - Concerns (tech debt, risks, fragile areas)

       [Analyzes codebase...]

       ✅ Created 7 brownfield docs in .specs/codebase/
       Next: Initialize project to define goals and roadmap
```

### Implementing a Feature (auto-sized)

```
You: Specify feature user-authentication

Agent: [Asks clarifying questions, creates spec.md with requirement IDs]
       I notice some gray areas in the UX — how should failed login attempts behave?
       [Discusses gray areas, creates context.md]

You: Design the feature

Agent: [Researches JWT best practices via Context7, creates design.md]

You: Break into tasks

Agent: [Creates tasks.md with 8 atomic tasks + parallel execution plan]

You: Implement T1

Agent: Implementing T1: Create auth service interface
       Files: src/services/auth.interface.ts
       Approach: Define interface based on design
       Verify: Interface compiles, exports correctly

       [Implements...]

       ✅ Committed: feat(auth): create auth service interface
       Next available: T2, T3 [P] (parallel)
```

### Quick Bug Fix

```
You: Quick fix: dark mode toggle doesn't persist after page refresh

Agent: Quick Task: Persist dark mode preference
       Files: src/hooks/useTheme.ts, src/utils/storage.ts
       Approach: Save preference to localStorage on toggle
       Verify: Toggle dark mode, refresh page, preference persists

       [Implements...]

       ✅ Committed: fix(theme): persist dark mode preference to localStorage
```

### Session Continuity

```
You: Pause work

Agent: ✅ Created .specs/HANDOFF.md
       - Feature: user-authentication
       - Completed: T1, T2 (committed)
       - In progress: T3 (70%)
       - Next session: Continue T3, then T4

--- Later, new session ---

You: Resume work

Agent: Resuming user-authentication at T3
       - Completed: T1 (auth interface), T2 (token storage)
       - In progress: T3 - auth service at src/services/auth.service.ts:45
       - Next: Complete T3, then T4 (parallel with T5)

       Continue with T3?
```

## 🧠 Context Management

The skill is designed to work within context limits:

| Load Strategy          | Documents                                   | Tokens |
| ---------------------- | ------------------------------------------- | ------ |
| **Base load** (always) | PROJECT.md, ROADMAP.md, STATE.md            | ~15k   |
| **On-demand**          | Current spec, context, design, or tasks     | +5-10k |
| **Never simultaneous** | Multiple feature specs or architecture docs | —      |

**Target:** <40k tokens loaded (20% of context)
**Reserve:** 160k+ tokens for work, reasoning, outputs

When context exceeds 40k tokens, the skill displays a status indicator and suggests optimizations.

## 🔗 Skill Integrations

TLC Spec-Driven works even better when combined with complementary skills:

| Skill              | Integration                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| **mermaid-studio** | Diagrams — architecture overviews, data flows, sequence diagrams                  |
| **codenavi**       | Code exploration — brownfield mapping, pattern identification, dependency tracing |

The skill automatically detects if these are installed and delegates specialized tasks to them. If not installed, it falls back gracefully and recommends them once per session.

## 📚 Reference Files

The skill includes detailed reference documentation loaded on-demand:

| File                    | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `project-init.md`       | Project initialization process and template                            |
| `roadmap.md`            | Roadmap creation and milestone tracking                                |
| `brownfield-mapping.md` | Comprehensive codebase analysis (7 docs)                               |
| `concerns.md`           | Tech debt, risks, and fragile area documentation                       |
| `specify.md`            | Requirements gathering with traceable IDs                              |
| `discuss.md`            | Gray area discussion and context capture                               |
| `design.md`             | Architecture, research, and component design                           |
| `tasks.md`              | Granular task breakdown methodology                                    |
| `implement.md`          | Execute: implementation + verification + atomic commits                |
| `validate.md`           | Feature validation and interactive UAT                                 |
| `quick-mode.md`         | Express lane for ad-hoc tasks                                          |
| `session-handoff.md`    | Pause/resume work process                                              |
| `state-management.md`   | Persistent memory: decisions, blockers, lessons, todos, deferred ideas |
| `coding-principles.md`  | Behavioral guidelines for implementation                               |
| `context-limits.md`     | Token budget and monitoring                                            |
| `code-analysis.md`      | Available tools and fallbacks                                          |

## ⚡ Tips for Best Results

### Do's ✅

- **Start with project initialization** — Even for existing codebases
- **Be specific about scope** — Clear boundaries prevent creep
- **Trust the auto-sizing** — The agent applies the right depth
- **Use natural language** — No need to memorize commands
- **Say "pause work" before ending** — Enables seamless resumption
- **Challenge the agent** — If something looks wrong, say so

### Don'ts ❌

- **Don't force all phases** — Let the agent skip what's unnecessary
- **Don't work on multiple features at once** — One feature per cycle
- **Don't ignore verification** — Even quick tasks need a verify step
- **Don't accept vague answers** — If the agent says something fuzzy, ask for specifics

## 💡 Model Recommendation

> **Best results with modern, reasoning-capable models:**
>
> - **Claude Opus 4.6 / Sonnet 4.5** — Excellent for all phases
> - **Gemini 3 Pro / GPT 5.2** — Strong reasoning and large context window
> - **Gemini 3 Flash / Claude Haiku 4.5** — Great general-purpose performance
>
> For cost optimization, the skill will suggest when lighter models are sufficient for simple tasks like validation or session handoff.

## 🤖 Compatibility

This skill works with **any AI coding agent** that supports skills or custom instructions.

**Tested and verified on:**

| Agent                | Status    |
| -------------------- | --------- |
| Antigravity (Gemini) | ✅ Tested |
| Claude Code          | ✅ Tested |
| GitHub Copilot       | ✅ Tested |
| Cursor               | ✅ Tested |
| Opencode             | ✅ Tested |

> **Note:** If your agent supports loading custom instructions or skills, this skill should work. The agents above are simply where it has been actively tested.

## ❓ FAQ

**Q: Can I skip phases?**
A: Yes! The skill auto-sizes. Design and Tasks are skipped for simple features. Quick mode skips the entire pipeline for small changes. You only get ceremony when scope demands it.

**Q: What if my project already has code?**
A: Use `"Map codebase"` first. This creates 7 documents analyzing your existing architecture, conventions, stack, and concerns before you start adding features.

**Q: How does requirement traceability work?**
A: Each requirement gets a unique ID (e.g., `AUTH-01`) in spec.md. Tasks reference these IDs, and validation checks which requirements are verified. You get a clear trail from spec → design → task → commit.

**Q: What are atomic git commits?**
A: Each task produces exactly one commit following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). This means clean git history, easy bisect for debugging, and simple rollbacks when needed.

**Q: Can I use this for small tasks or quick fixes?**
A: Yes! Say `"Quick fix: [description]"` for bug fixes, config changes, or small tweaks. You get quality guardrails (verify + commit) without the planning overhead.

**Q: What happens if I close my session mid-task?**
A: Say `"Pause work"` before ending your session. This creates a handoff document. Next session, say `"Resume work"` to continue exactly where you left off.

**Q: Does this work with any tech stack?**
A: Yes! The skill is completely stack-agnostic. It works with any language, framework, or architecture.

**Q: What if the agent invents an API or pattern that doesn't exist?**
A: The skill enforces a strict **Knowledge Verification Chain**: codebase → project docs → Context7 MCP → web search → flag as uncertain. It NEVER fabricates information. If the agent can't find documentation, it will say "I don't know" instead of guessing.

## 📄 License

CC-BY-4.0 © [Tech Lead's Club](https://github.com/tech-leads-club)

<p align="center">
  <sub>Built with ❤️ by the Tech Lead's Club community</sub>
</p>

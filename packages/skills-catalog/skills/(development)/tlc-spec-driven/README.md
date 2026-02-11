<p align="center">
  <img src="https://img.shields.io/badge/Skill-TLC%20Spec--Driven-blue?style=for-the-badge" alt="skill badge" />
  <img src="https://img.shields.io/badge/Stack-Agnostic-green?style=for-the-badge" alt="stack agnostic" />
  <img src="https://img.shields.io/badge/Version-1.0.0-purple?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🎯 TLC Spec-Driven</h1>

<p align="center">
  <strong>Plan and implement projects with precision. Granular tasks. Clear dependencies. Right tools.</strong>
</p>

<p align="center">
  <em>From the <a href="https://github.com/tech-leads-club">Tech Lead's Club</a> community</em>
</p>

<p align="center">
  <strong>Author:</strong> <a href="https://github.com/felipfr">Felipe Rodrigues</a> · 
  <a href="https://linkedin.com/in/felipfr">LinkedIn</a>
</p>

---

## ✨ What Is This Skill?

**TLC Spec-Driven** transforms how AI agents approach software projects. Built on the principles of **Spec-Driven Development**, this skill enforces a structured methodology where every line of code is backed by a clear specification:

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌───────────────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ IMPLEMENT+VALIDATE│
└──────────┘   └──────────┘   └─────────┘   └───────────────────┘
```

Each phase produces documented artifacts that persist across sessions, enabling:

- **Precise planning** — No ambiguity, no scope creep
- **Granular execution** — One task = one deliverable
- **Complete traceability** — Every decision recorded
- **Session continuity** — Stop and resume anytime

---

## 💡 Model Recommendation

> **Best results with modern, reasoning-capable models:**
>
> - **Claude Opus 4.6 / Sonnet 4.5** — Excellent for all phases
> - **Gemini 3 Pro / GPT 5.2** — Strong reasoning and large context window
> - **Gemini 3 Flash / Claude Haiku 4.5** — Great general-purpose performance
>
> For cost optimization, the skill will suggest when lighter models (Haiku, Flash) are sufficient for simple tasks like validation or session handoff.

---

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
| Resume previous work    | `"Resume work"` or `"Continue"`               |

> 💬 **Natural Conversation, Not Commands**
>
> These are trigger phrases, not strict commands. The skill works through **natural conversation**—talk to your agent like you would to a colleague. Say things like _"I want to build an authentication system"_ or _"Let's continue where we left off"_. The agent understands context and intent, not just keywords.

---

## 📁 Project Structure

The skill creates a `.specs/` directory to organize all project documentation:

```
.specs/
├── project/
│   ├── PROJECT.md      # Vision, goals, tech stack, constraints
│   ├── ROADMAP.md      # Milestones, features, status tracking
│   └── STATE.md        # Persistent memory: decisions, blockers, learnings
│
├── codebase/           # Brownfield analysis (existing projects only)
│   ├── STACK.md        # Technology stack and dependencies
│   ├── ARCHITECTURE.md # Patterns, data flow, code organization
│   ├── CONVENTIONS.md  # Naming, style, coding patterns
│   ├── STRUCTURE.md    # Directory layout and modules
│   ├── TESTING.md      # Test frameworks and patterns
│   └── INTEGRATIONS.md # External services and APIs
│
└── features/           # Feature specifications
    └── [feature-name]/
        ├── spec.md     # Requirements and acceptance criteria
        ├── design.md   # Architecture and components
        └── tasks.md    # Atomic tasks with dependencies
```

---

## 🔄 The Four Phases

### Phase 1: Specify

**Goal:** Capture WHAT to build with testable requirements.

The agent will ask clarifying questions to understand:

- What problem you're solving
- Who the users are
- What success looks like
- What's in scope and out of scope

**Output:** `spec.md` with prioritized user stories (P1/P2/P3) and acceptance criteria using the **WHEN/THEN/SHALL** format.

```markdown
### P1: User Login ⭐ MVP

**User Story:** As a user, I want to log in so that I can access my account.

**Acceptance Criteria:**

1. WHEN user enters valid credentials THEN system SHALL authenticate and redirect to dashboard
2. WHEN user enters invalid credentials THEN system SHALL display error message
3. WHEN user is already logged in THEN system SHALL redirect to dashboard
```

---

### Phase 2: Design

**Goal:** Define HOW to build it. Architecture, components, code reuse.

Before writing any code, the agent analyzes:

- What existing code can be leveraged
- How components will interact
- Data models and interfaces
- Error handling strategies

**Output:** `design.md` with architecture diagrams, component definitions, and integration points.

---

### Phase 3: Tasks

**Goal:** Break into GRANULAR, ATOMIC tasks with clear dependencies.

Why granular tasks matter:

| ❌ Vague Task | ✅ Granular Tasks                 |
| ------------- | --------------------------------- |
| "Create form" | T1: Create email input component  |
|               | T2: Add email validation function |
|               | T3: Create submit button          |
|               | T4: Add form state management     |

**Each task includes:**

- What: Exact deliverable
- Where: File path
- Depends on: Prerequisites
- Reuses: Existing code patterns
- Done when: Verifiable criteria

**Output:** `tasks.md` with execution plan showing parallel/sequential dependencies.

---

### Phase 4: Implement + Validate

**Goal:** Execute one task at a time. Verify against spec.

The agent follows strict principles:

- **Surgical changes** — Only touch required files
- **No scope creep** — No "improvements" beyond the task
- **Verify before done** — Check all acceptance criteria

After implementation, validation ensures:

- All tasks completed
- Acceptance criteria pass
- Edge cases handled
- Code quality verified

---

## 📋 Complete Command Reference

These trigger patterns help the agent recognize your intent, but you don't need to use them verbatim. Speak naturally—the agent understands variations and context.

### Project-Level Commands

| Trigger Pattern                         | Description                                           |
| --------------------------------------- | ----------------------------------------------------- |
| `Initialize project`, `Setup project`   | Create PROJECT.md with vision, goals, and constraints |
| `Create roadmap`, `Plan features`       | Create ROADMAP.md with milestones and features        |
| `Map codebase`, `Analyze existing code` | Create 6 brownfield docs for existing projects        |
| `Record decision`, `Log blocker`        | Add entries to STATE.md                               |
| `Pause work`, `End session`             | Create handoff for session continuity                 |
| `Resume work`, `Continue`               | Load previous state and continue                      |

### Feature-Level Commands

| Trigger Pattern                          | Description                       |
| ---------------------------------------- | --------------------------------- |
| `Specify feature`, `Define requirements` | Phase 1: Create spec.md           |
| `Design feature`, `Architecture`         | Phase 2: Create design.md         |
| `Break into tasks`, `Create tasks`       | Phase 3: Create tasks.md          |
| `Implement task`, `Build`                | Phase 4: Execute specific task    |
| `Validate`, `Verify`, `Test`             | Check implementation against spec |

---

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
       - Technology stack
       - Architecture patterns
       - Coding conventions
       - Project structure
       - Testing infrastructure
       - External integrations

       [Analyzes codebase...]

       ✅ Created 6 brownfield docs in .specs/codebase/
       Next: Initialize project to define goals and roadmap
```

### Implementing a Feature

```
You: Specify feature user-authentication

Agent: [Asks clarifying questions, creates spec.md]

You: Design the feature

Agent: [Creates design.md with architecture and components]

You: Break into tasks

Agent: [Creates tasks.md with granular, atomic tasks]

You: Implement T1

Agent: **Implementing T1: Create auth service interface**
       - Files: src/services/auth.interface.ts
       - Approach: Define interface based on design
       - Success: Interface compiles, exports correctly

       [Implements task...]

       ✅ T1 Complete. Next available: T2, T3 [P] (parallel)
```

### Session Continuity

```
You: Pause work

Agent: ✅ Created .specs/HANDOFF.md
       - Feature: user-authentication
       - Completed: T1, T2
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

---

## 🧠 Context Management

The skill is designed to work within context limits:

| Load Strategy          | Documents                        | Tokens |
| ---------------------- | -------------------------------- | ------ |
| **Base load** (always) | PROJECT.md, ROADMAP.md, STATE.md | ~15k   |
| **On-demand**          | Current spec, design, or tasks   | +5-10k |
| **Never simultaneous** | Multiple feature specs           | —      |

**Target:** <40k tokens loaded (20% of context)  
**Reserve:** 160k+ tokens for work, reasoning, outputs

When context exceeds 40k tokens, the skill displays a status indicator and suggests optimizations.

---

## 📚 Reference Files

The skill includes detailed reference documentation loaded on-demand:

| File                    | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `project-init.md`       | Project initialization process and template |
| `roadmap.md`            | Roadmap creation and milestone tracking     |
| `brownfield-mapping.md` | Comprehensive codebase analysis (6 docs)    |
| `specify.md`            | Requirements gathering and user stories     |
| `design.md`             | Architecture and component design           |
| `tasks.md`              | Granular task breakdown methodology         |
| `implement.md`          | Implementation process and principles       |
| `validate.md`           | Verification and quality checks             |
| `session-handoff.md`    | Pause/resume work process                   |
| `state-management.md`   | Persistent memory structure                 |
| `coding-principles.md`  | Behavioral guidelines for implementation    |
| `context-limits.md`     | Token budget and monitoring                 |
| `code-analysis.md`      | Available tools and fallbacks               |

---

## ⚡ Tips for Best Results

### Do's ✅

- **Start with project initialization** — Even for existing codebases
- **Be specific about scope** — Clear boundaries prevent creep
- **Trust the phases** — Skipping ahead leads to problems
- **Use the trigger phrases** — They activate the right context
- **Say "pause work" before ending** — Enables seamless resumption

### Don'ts ❌

- **Don't skip to implementation** — Spec and design first
- **Don't ask for multiple features at once** — One feature per cycle
- **Don't ignore granularity** — Vague tasks lead to errors
- **Don't fear iteration** — It's better to refine specs than fix code

---

## 🛠 Customization

### Adding Project-Specific Context

The skill reads from `.specs/project/STATE.md` which can include:

- **Decisions** — Architectural choices with rationale
- **Blockers** — Known issues and workarounds
- **Learnings** — Mistakes to avoid repeating
- **Preferences** — Model guidance tracking, team conventions

### Integrating with Your Stack

The brownfield mapping phase automatically detects your tech stack. For new projects, specify your stack during initialization and it will be documented in `PROJECT.md`.

---

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

---

## ❓ FAQ

**Q: Can I skip phases (e.g., go straight to implementation)?**  
A: Not recommended. Skipping phases leads to scope creep, ambiguity, and rework. The methodology is designed to prevent common AI coding mistakes.

**Q: What if my project already has code?**  
A: Use `"Map codebase"` first. This creates 6 documents analyzing your existing architecture, conventions, and stack before you start adding features.

**Q: How do I reset and start over?**  
A: Delete the `.specs/` folder and say `"Initialize project"` to start fresh.

**Q: Can I use this for small tasks or quick fixes?**  
A: The skill is optimized for feature-level work. For small fixes, you might not need the full 4-phase process—but even a quick spec helps prevent scope creep.

**Q: What happens if I close my session mid-task?**  
A: Say `"Pause work"` before ending your session. This creates a handoff document. Next session, say `"Resume work"` to continue exactly where you left off.

**Q: Does this work with any tech stack?**  
A: Yes! The skill is completely stack-agnostic. It works with any language, framework, or architecture.

---

## 📄 License

MIT © [Tech Lead's Club](https://github.com/tech-leads-club)

---

<p align="center">
  <sub>Built with ❤️ by the Tech Lead's Club community</sub>
</p>

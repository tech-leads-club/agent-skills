<p align="center">
  <img src="https://img.shields.io/badge/Skill-TLC%20Spec--Driven-blue?style=for-the-badge" alt="skill badge" />
  <img src="https://img.shields.io/badge/Stack-Agnostic-green?style=for-the-badge" alt="stack agnostic" />
  <img src="https://img.shields.io/badge/Version-3.0.0-purple?style=for-the-badge" alt="version" />
</p>

<h1 align="center">🎯 TLC Spec-Driven</h1>

<p align="center">
  <strong>Plan and implement features with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.</strong>
</p>

<p align="center">
  <em>From the <a href="https://github.com/tech-leads-club">Tech Lead's Club</a> community</em>
</p>

<p align="center">
  <strong>Author:</strong> <a href="https://github.com/felipfr">Felipe Rodrigues</a> · 
  <a href="https://linkedin.com/in/felipfr">LinkedIn</a>
</p>

## ✨ What Is This Skill?

**TLC Spec-Driven** transforms how AI agents build features. Instead of a rigid, bureaucratic pipeline, it uses **4 adaptive phases** that auto-size based on complexity — applying full rigor for complex features and skipping ceremony for simple ones:

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
| **Small** (≤3 files)                | Minimal pipeline — one-liner spec → implement + verify inline     |
| **Medium** (clear feature)          | Specify → Execute (design and tasks inline)                       |
| **Large** (multi-component)         | Full pipeline with formal design and task breakdown               |
| **Complex** (ambiguity, new domain) | Full pipeline + gray area discussion + research + interactive UAT |

## 🚀 Quick Start

### Installation

```bash
npx @tech-leads-club/agent-skills install -s tlc-spec-driven
```

### First Commands

| What You Want          | Say This                            |
| ---------------------- | ----------------------------------- |
| Plan a feature         | `"Specify feature [name]"`          |
| Resume work            | `"Resume work"` / `"Continue"`      |
| Validate / verify work | `"Validate"` / `"Verify work"`      |

> 💬 **Natural Conversation, Not Commands**
>
> These are trigger phrases, not strict commands. The skill works through **natural conversation** — talk to your agent like you would to a colleague. Say things like _"I want to build an authentication system"_ or _"Fix the login button, it returns 401"_. The agent understands context and intent, not just keywords.

## 📁 Workspace Structure

The skill creates a `.specs/` directory to organize all feature documentation:

```
.specs/
├── STATE.md            # Project memory: Decisions log (AD-NNN) + Handoff snapshot
└── features/           # Feature specifications
    └── [feature-name]/
        ├── spec.md     # Requirements with traceable IDs (FEAT-01, AUTH-02...)
        ├── context.md  # User decisions for gray areas (only when needed)
        ├── design.md   # Architecture and components (only for large/complex)
        └── tasks.md    # Atomic tasks with dependencies (only for large/complex)
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

**Discuss gray areas (auto-triggered):** When the spec has ambiguous, user-facing decisions (layout preferences, interaction patterns, error handling style), the agent automatically asks the user about them — creating a `context.md` that locks those decisions before design. It also triggers when any implicit-requirement dimension is detected in backend features (persistence/state, external calls, auth, payments, concurrency, state transitions). This is NOT a separate phase — it only happens within Specify when ambiguity is detected.

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
- **No scope creep** — If it's not in the task, don't touch it. Capture ideas in the feature's `context.md` as Deferred Ideas
- **Verify before commit** — Check all "Done when" criteria
- **Atomic git commits** — One task = one commit, following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

```
feat(auth): add email validation to login form

refactor(api): extract token refresh logic into service

fix(cart): prevent negative quantity on item decrement
```

**Feature-level validation** happens after all tasks complete — including acceptance criteria checks, code quality review, and optionally interactive UAT for complex user-facing features.

### Independent Verification (author ≠ verifier)

After the final task is committed, the orchestrator dispatches a **fresh, read-only Verifier sub-agent** — always, regardless of feature size. The Verifier is independent by design:

- **Author ≠ verifier:** The Verifier re-derives coverage from scratch. It does not inherit the author's mental model or assumptions.
- **Evidence-or-zero:** Every acceptance criterion must be mapped to a specific `file:line` reference. Unmapped criteria are counted as gaps, not inferred as passing.
- **Ranked gap list:** The Verifier reports a PASS/FAIL verdict plus a gap list ranked by severity.
- **Bounded fix loop:** Gaps become fix tasks. The fix → re-verify loop is bounded to **3 iterations** before escalating to the user.

Without sub-agents, `validate.md` runs as an independent fresh-eyes pass after the final commit — same evidence-or-zero standard applied inline.

## 🧪 Test Rigor

### Test Coverage Matrix

Before writing tests for a feature, the skill generates a **Test Coverage Matrix** — a structured map of every acceptance criterion to the test(s) that cover it, inferred from the repo's existing test patterns and conventions. The matrix is feature-scoped and created alongside `tasks.md`.

| Requirement | Test Type  | File                          | Status  |
| ----------- | ---------- | ----------------------------- | ------- |
| AUTH-01     | Unit       | `auth.service.spec.ts`        | planned |
| AUTH-01     | E2E        | `login.e2e-spec.ts`           | planned |
| AUTH-02     | Unit       | `auth.service.spec.ts`        | planned |

### Test Adequacy Review

After implementation, the skill performs a **Test Adequacy Review** — a necessary-and-sufficient check:

- **Necessary:** Every acceptance criterion must map to at least one asserted test (no unmapped ACs).
- **Sufficient:** No test exists without a traceable requirement (no orphan tests). No shallow tests that assert structure rather than behavior.

The review produces a short verdict: passing ACs, missing coverage, and any tests without a requirement reference. The Verifier uses this as its primary evidence source.

## 📋 Complete Command Reference

These trigger patterns help the agent recognize your intent, but you don't need to use them verbatim. Speak naturally — the agent understands variations and context.

### Feature-Level (auto-sized)

| Trigger Pattern                           | Description                             |
| ----------------------------------------- | --------------------------------------- |
| `Specify feature`, `Define requirements`  | Create spec.md with requirement IDs     |
| `Discuss feature`, `How should this work` | Capture user decisions for gray areas   |
| `Design feature`, `Architecture`          | Create design.md with architecture      |
| `Break into tasks`, `Create tasks`        | Create tasks.md with atomic breakdown   |
| `Implement task`, `Build`, `Execute`      | Execute specific task with verification |
| `Validate`, `Verify work`, `UAT`          | Feature-level validation and testing    |

## 🔁 Workflow Examples

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
       Next available: T2, T3 [P] (order-free within phase)
```

> **Per-phase sub-agents (>3 phases):** For features broken into more than 3 phases, the agent
> offers to dispatch one sub-agent per phase. Each worker runs its full phase in order and reports
> a compact summary (tasks done, commits, test counts, deviations). The user confirms before any
> sub-agent is spawned. For 3 or fewer phases, execution stays inline with no sub-agents.

## 🧠 Memory

The skill maintains a project-level decision log in `.specs/STATE.md` with two sections:

- **Decisions log (`AD-NNN`):** Architectural and product decisions recorded across all features. Design reads and appends this log to maintain consistency — the same decision is never re-litigated in a later feature.
- **Handoff snapshot:** A compact summary of in-flight state (current feature, last completed task, next step, open questions). Written on "pause work" and read on "resume work".

**To pause mid-task:** Say `"pause work"` or `"end session"` — the agent writes a Handoff snapshot to `STATE.md` before stopping.

**To resume:** Say `"resume work"` or `"continue"` — the agent reads the Handoff section and picks up exactly where it left off, without requiring you to re-explain context.

## 📐 Context Management

The skill is designed to work within context limits:

| Load Strategy          | Documents                                   | Tokens |
| ---------------------- | ------------------------------------------- | ------ |
| **On-demand**          | Current spec, context, design, or tasks     | +5-10k |
| **Never simultaneous** | Multiple feature specs or architecture docs | —      |

**Target:** <40k tokens loaded (20% of context)
**Reserve:** 160k+ tokens for work, reasoning, outputs

When context exceeds 40k tokens, the skill displays a status indicator and suggests optimizations.

## 📚 Reference Files

The skill includes detailed reference documentation loaded on-demand:

| File                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `specify.md`           | Requirements gathering with traceable IDs                                |
| `discuss.md`           | Gray area discussion and context capture                                 |
| `design.md`            | Architecture, research, and component design                             |
| `tasks.md`             | Granular task breakdown methodology                                      |
| `implement.md`         | Execute: implementation + verification + atomic commits                  |
| `validate.md`          | Feature validation and interactive UAT                                   |
| `memory.md`            | Pause/resume protocol and decision log (STATE.md) mechanics              |
| `sub-agents.md`        | Worker payload, compact summary format, Verifier report format, fix loop |
| `coding-principles.md` | Behavioral guidelines for implementation                                 |
| `context-limits.md`    | Token budget and monitoring                                              |
| `code-analysis.md`     | Available tools and fallbacks                                            |

## ⚡ Tips for Best Results

### Do's ✅

- **Be specific about scope** — Clear boundaries prevent creep
- **Trust the auto-sizing** — The agent applies the right depth
- **Use natural language** — No need to memorize commands
- **Challenge the agent** — If something looks wrong, say so

### Don'ts ❌

- **Don't force all phases** — Let the agent skip what's unnecessary
- **Don't work on multiple features at once** — One feature per cycle
- **Don't ignore verification** — Even small changes need a verify step
- **Don't accept vague answers** — If the agent says something fuzzy, ask for specifics

## 💡 Model Recommendation

> **Best results with modern, reasoning-capable frontier models.**
>
> - **Heavy tasks** (complex design, large features, multi-phase execution): use a high-reasoning frontier model (e.g. a flagship Claude or GPT variant).
> - **Lighter tasks** (validation, session handoff, simple features): a general-purpose model works well and reduces cost.
>
> The skill will naturally mention when a lighter model is sufficient at the end of lightweight tasks.

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
A: Yes! The skill auto-sizes. Design and Tasks are skipped for simple features. Small changes enter the pipeline at its lightest tier — a one-liner spec and inline implement + verify — so you only get ceremony when scope demands it.

**Q: What if my project already has code?**
A: Just specify features — the design phase reads the live codebase on demand via the Knowledge Verification Chain (codebase → project docs → Context7 MCP → web search). Any concerns found while reading the code are flagged inline in `design.md` with a mitigation. No upfront mapping step required.

**Q: How does requirement traceability work?**
A: Each requirement gets a unique ID (e.g., `AUTH-01`) in spec.md. Tasks reference these IDs, and validation checks which requirements are verified. You get a clear trail from spec → design → task → commit.

**Q: What are atomic git commits?**
A: Each task produces exactly one commit following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). This means clean git history, easy bisect for debugging, and simple rollbacks when needed.

**Q: Can I use this for small tasks?**
A: Yes! Small tasks (≤3 files, one-sentence scope) enter the pipeline at its lightest tier — the agent captures a one-liner spec inline, implements, verifies, and commits without any additional ceremony.

**Q: What happens if I close my session mid-task?**
A: Say `"pause work"` before ending — the agent writes a Handoff snapshot to `.specs/STATE.md` with the current feature, last completed task, next step, and any open questions. Next session, say `"resume work"` and the agent reads the Handoff section to pick up exactly where you left off. Atomic git commits also let you recover from git history alone if needed.

**Q: Does this work with any tech stack?**
A: Yes! The skill is completely stack-agnostic. It works with any language, framework, or architecture.

**Q: What if the agent invents an API or pattern that doesn't exist?**
A: The skill enforces a strict **Knowledge Verification Chain**: codebase → project docs → Context7 MCP → web search → flag as uncertain. It NEVER fabricates information. If the agent can't find documentation, it will say "I don't know" instead of guessing.

## 📄 License

CC-BY-4.0 © [Tech Lead's Club](https://github.com/tech-leads-club)

<p align="center">
  <sub>Built with ❤️ by the Tech Lead's Club community</sub>
</p>

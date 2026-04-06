---
name: eb-dev-workflow
description: "Master orchestrator for the full autonomous development lifecycle. Use this skill whenever the user mentions starting a new feature, has an idea to implement, wants to plan development, says "quero desenvolver", "tenho uma ideia", "nova feature", "começar uma issue", "próxima issue", or asks what the next step in development is. This skill coordinates all phases and delegates to existing skills (PRD, Issues, Code Review) where available, filling in QA Planning, Development, Testing, and PR management. Trigger even if the user only mentions one phase — this skill decides what comes next and runs autonomously via Claude Code."
---

# Dev Workflow Orchestrator

Autonomous end-to-end lifecycle manager for Claude Code. Coordinates all phases from idea to
merged PR. Delegates to your existing skills where they exist; owns the phases in between.

## Skill Map

| Phase | Owner |
|-------|-------|
| 1 — PRD | Invoke skill: `write-a-prd` |
| 2 — Issues from PRD | Invoke skill: `prd-to-issues` |
| 3 — Architecture | Invoke skill: `software-architect` |
| 4 — QA Planning | This skill |
| 5 — Development | Invoke skills: `senior-frontend`, `senior-backend` |
| 6 — Automated Testing | This skill (npm test + Playwright) |
| 7 — Code Review | Invoke skill: `code-review:code-review` |
| 8 — PR + Close + Advance | This skill |

---

## Workflow

```
IDEA
  |-- [Phase 1] invoke skill: write-a-prd
       |-- [Phase 2] invoke skill: prd-to-issues -> ordered issues
            |-- For each issue:
                 |-- [Phase 3] invoke skill: software-architect
                 |-- [Phase 4] QA Planning (before any code)
                 |-- [Phase 5] invoke skills: senior-frontend + senior-backend
                 |-- [Phase 6] npm test + Playwright + coverage check
                 |-- [Phase 7] invoke skill: code-review:code-review
                 |-- [Phase 8] PR created -> issue closed -> next issue
```

---

## Session Start Protocol

At the start of every session, output this state block and ask the user to confirm:

```
DEV WORKFLOW STATE
 Feature PRD   : #[number] - [title]
 Current issue : #[number] - [title]
 Current phase : [1-8] - [phase name]
 Remaining     : #X, #Y, #Z
```

If starting fresh, ask: "Nova feature ou continuando uma issue existente?"

---

## Phase 1 — PRD

**Owner: your existing skill.**

Invoke skill `write-a-prd` to create the PRD through user interview and codebase exploration.
Wait for the PRD to be submitted as a GitHub issue before advancing.

**Exit condition:** PRD issue created on GitHub.

---

## Phase 1.5 — Clarify

**Trigger:** PRD exists but contains ambiguities before issue breakdown begins.

If the PRD contains ambiguities, run a structured clarification pass:
identify up to 5 critical unknowns, resolve each through targeted Q&A before
proceeding to Phase 2.

1. Scan the PRD for gaps: missing edge-case behaviour, undefined user roles, vague
   success criteria, unstated constraints, or conflicting requirements.
2. List each unknown as a numbered question (max 5). Prioritise questions that
   affect scope, security, or core UX — skip cosmetic or low-stakes ambiguities.
3. Ask all questions in a single message. Wait for answers before continuing.
4. Update the PRD issue with the resolved answers and mark the clarification pass
   complete as a comment.

**Skip this phase** when the PRD is unambiguous or the user explicitly says to proceed.

**Exit condition:** All critical unknowns resolved and documented on the PRD issue.

---

## Phase 2 — Issues from PRD

**Owner: your existing skill.**

Invoke skill `prd-to-issues` to break the PRD into independently-grabbable GitHub issues
using tracer-bullet vertical slices. The skill handles ordering, dependencies, and scoping.

Wait for all issues to be created and confirmed by the user before advancing.

**Exit condition:** All issues created on GitHub, order confirmed by user.

---

## Phase 3 — Architecture

**Owner: software-architect skill.**

Invoke skill `software-architect` to design the system structure for this issue/feature.
For the first issue in a new feature, this produces the full architecture. For subsequent
issues, review and update the existing architecture if the new issue changes boundaries.

**Skip this phase** for small issues that don't affect system structure (bug fixes, copy changes, minor UI tweaks).

**Exit condition:** Architecture document exists and is appropriate for the issue scope.

---

## Phase 4 — QA Planning

**Trigger:** Architecture exists (or skipped) for this issue.
**Rule: This runs BEFORE any code is written.**

Generate and post as a GitHub comment on the issue:

```markdown
## Test Plan - #[issue-number]

### Unit Tests
- [ ] [unit] should [behavior] when [condition]

### Integration Tests
- [ ] [flow] should [result] given [state]

### Edge Cases
- [ ] Null / empty inputs
- [ ] Boundary values
- [ ] Concurrent operations (if applicable)
- [ ] Network / auth failures (if applicable)

### E2E Scenarios (Playwright)
- [ ] Happy path: [user does X -> sees Y]
- [ ] Error path: [user does X -> sees error Z]

### Regression Scope
- Features this change touches: [list files/components]
```

**Exit condition:** Test plan posted as issue comment. Do not write code before this exists.

---

## Phase 5 — Development



**Trigger:** QA plan exists on the issue.

Invoke skills `senior-frontend` and/or `senior-backend` as appropriate for the implementation.
Use `senior-frontend` for UI components, pages, and client-side logic.
Use `senior-backend` for API routes, database schemas, and server-side logic.

Claude Code implements autonomously following these rules:

- **Never commit directly to `main`**
- **Branch name:** `feat/#[issue-number]-short-description`
- **Commit format:** `feat: [description] (#[issue-number])`
- **No TODOs left in code**
- Implement against ACs — keep the test plan visible while coding

**Exit condition:** Implementation complete, all files saved, ready for testing.

---

## Phase 6 — Automated Testing

**Trigger:** Implementation complete.

### 5a — Unit & Integration

Always use npm to run tests, regardless of what package manager the project uses:

```bash
npm test -- --coverage
```

Gate: **coverage >= 80%**. If below, return to Phase 5 with coverage report.

### 5b — E2E via Playwright Agents (three-agent flow)
1. **Planner** — converts QA plan E2E scenarios into navigation flows
2. **Generator** — writes Playwright tests, validates selectors against running app
3. **Healer** — if a test fails, replays, diagnoses, and patches automatically

### 5c — Regression
Run smoke tests on every feature listed in "Regression Scope" from the QA plan.

### Test Report (post as issue comment)
```markdown
## Test Results - #[issue-number]
- Unit/Integration : X passing | X failing
- Coverage         : X% (gate: 80%)
- E2E              : X passing | X failing
- Regressions      : None | [list]
```

**Exit condition:** All green, coverage >= 80%, zero regressions.
On failure, return to Phase 5 with the report attached.

---

## Phase 7 — Code Review

**Owner: your existing Code Review skill.**

Invoke skill `code-review:code-review` directly. Pass it the branch/diff context.
Wait for verdict before advancing.

- Approved -> advance to Phase 8
- Changes requested -> return to Phase 5 with review comments

**Exit condition:** Code Review skill returns Approved.

---

## Phase 8 — PR + Close + Advance

**Trigger:** Code review approved.

### 7a — Create PR
```markdown
## What
[One paragraph describing the change]

## Why
Closes #[issue-number]
Part of #[parent-PRD-number]

## Checklist
- [x] Unit/Integration tests passing
- [x] E2E tests passing
- [x] Coverage >= 80%
- [x] No regressions detected
- [x] Code review approved
```

### 7b — After merge
- Close issue with comment: `Resolved via #[PR-number]`
- Check off the corresponding item on the parent PRD issue

### 7c — Advance
- Issues remaining -> update state block -> return to **Phase 3** (or **Phase 4** if architecture unchanged) for next issue
- All issues done -> close parent PRD issue with summary -> **workflow complete**

**Exit condition:** PR merged, issue closed, next phase identified.

---

## Reference Templates

This skill has detailed reference templates. Consult `references/spec-templates.md`
for structured templates for specs, plans, tasks, and checklists.

| Template | Purpose | When to use |
|----------|---------|-------------|
| Feature Specification | Full spec with scenarios, FRs, entities, success criteria | Phase 1 PRD creation |
| Implementation Plan | Phased plan with research, gates, MVP cut line | Phase 2 issue breakdown |
| Task Breakdown | T-NNN task list with parallel markers and user story links | Phase 2 / Phase 4 prep |
| Requirements Checklist | CHK-NNN quality gates for spec approval | Before Phase 2 begins |
| Constitution (optional) | Project-level architectural principles | Phase 0 for greenfield projects |

---

## Quality Gates

| Gate | Requirement | On failure |
|------|------------|-----------|
| QA Plan exists | Before Phase 5 starts | Block — do not proceed |
| Unit coverage | >= 80% | Return to Phase 5 |
| E2E tests | All passing | Return to Phase 5 |
| Regressions | Zero detected | Return to Phase 5 |
| Code Review | Approved | Return to Phase 5 |

**Never skip a gate.** If the user requests skipping, state the risk clearly
and require explicit confirmation before proceeding.

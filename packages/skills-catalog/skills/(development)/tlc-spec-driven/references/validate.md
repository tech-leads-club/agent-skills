# Execute: Validate & Verify

**Goal**: Verify implementation meets spec AND coding principles. This is NOT a separate phase — verification is part of every task's completion within Execute.

**Two levels of verification:**

1. **Per-task verification (always):** After implementing each task, verify its "Done when" criteria before committing. This is mandatory and automatic.

2. **Feature-level validation (on completion or on demand):** After all tasks for a feature (or priority group) are done, run a comprehensive validation. Includes acceptance criteria check, code quality review, and optionally interactive UAT.

**Interactive UAT is triggered when:** The feature has complex user-facing behavior where human judgment matters (UI flows, interaction patterns, visual design). For backend-only or infrastructure work, automated checks are sufficient.

**Trigger for explicit validation:** "Validate", "verify work", "UAT", "test with me", "walk me through it"

---

## Process

### 1. Check Completed Tasks

Go through tasks.md:

- [ ] All tasks marked done?
- [ ] Any blocked or partial?

### 2. Verify Acceptance Criteria

For each user story in spec.md:

```markdown
### P1: [Story Title]

**Acceptance Criteria**:

1. WHEN [X] THEN [Y] → [PASS/FAIL]
2. WHEN [X] THEN [Y] → [PASS/FAIL]
```

### 3. Check Edge Cases

From spec.md edge cases:

- [ ] [Edge case 1] handled correctly
- [ ] [Edge case 2] handled correctly

### 4. Run Tests (if applicable)

```bash
# project test command
```

### 5. Code Quality Check (MANDATORY)

For each changed file, verify against [coding-principles.md](coding-principles.md):

| Check                                | Pass? |
| ------------------------------------ | ----- |
| No features beyond what was asked    |       |
| No abstractions for single-use code  |       |
| No unnecessary "flexibility" added   |       |
| Only touched files required for task |       |
| Didn't "improve" unrelated code      |       |
| Matches existing patterns/style      |       |
| Would senior engineer approve?       |       |

❌ Any "No"? → Fix before marking complete.

### 6. Interactive UAT (if user-facing feature)

For each testable deliverable, present one test at a time:

```
Test [N]: [Test Name]

Expected: [What should happen — specific and observable]

→ Does this work? Describe what you see.
```

Wait for user response:

| User says                      | Interpret as            |
| ------------------------------ | ----------------------- |
| "yes", "pass", "works", "next" | ✅ Pass                 |
| "skip", "can't test", "n/a"    | ⏭️ Skip                 |
| Anything else                  | ❌ Issue — log verbatim |

**Severity inference (never ask the user for severity):**

| User description contains               | Inferred severity |
| --------------------------------------- | ----------------- |
| crash, error, exception, fails, broken  | Blocker           |
| doesn't work, wrong, missing, can't     | Major             |
| slow, weird, off, minor, small          | Minor             |
| color, font, spacing, alignment, visual | Cosmetic          |
| (unclear)                               | Major (default)   |

### 7. Generate Fix Plans (if issues found)

For each issue found during UAT:

1. **Diagnose** — Analyze the codebase to find root cause
2. **Create fix task** — Write a task definition with:
   - What: The specific fix
   - Where: File paths
   - Verify: How to prove the fix works
   - Done when: Acceptance criteria for the fix
3. **Present fix plan** — Show all fix tasks to user for approval

Fix tasks follow the same format as regular tasks and can be executed with the implement phase.

**Guardrail:** Maximum 3 diagnostic iterations per issue. If root cause isn't found after 3 attempts, flag for human investigation.

### 8. Report

---

## Validation Report Template

```markdown
# [Feature] Validation

**Date**: [YYYY-MM-DD]
**Spec**: `.specs/features/[feature]/spec.md`

---

## Task Completion

| Task | Status     | Notes   |
| ---- | ---------- | ------- |
| T1   | ✅ Done    | -       |
| T2   | ✅ Done    | -       |
| T3   | ⚠️ Partial | [Issue] |

---

## User Story Validation

### P1: [Story Title] ⭐ MVP

| Criterion     | Result  |
| ------------- | ------- |
| WHEN X THEN Y | ✅ PASS |
| WHEN A THEN B | ✅ PASS |

**Status**: ✅ P1 Complete

### P2: [Story Title]

| Criterion     | Result             |
| ------------- | ------------------ |
| WHEN X THEN Y | ❌ FAIL - [reason] |

**Status**: ⚠️ P2 Issues

---

## Interactive UAT Results (if performed)

| #   | Test        | Result   | Details                                         |
| --- | ----------- | -------- | ----------------------------------------------- |
| 1   | [Test name] | ✅ Pass  | -                                               |
| 2   | [Test name] | ❌ Issue | [Verbatim user response] — Severity: [inferred] |
| 3   | [Test name] | ⏭️ Skip  | [Reason]                                        |

---

## Code Quality

| Principle        | Status |
| ---------------- | ------ |
| Minimum code     | ✅     |
| Surgical changes | ✅     |
| No scope creep   | ✅     |
| Matches patterns | ✅     |

---

## Edge Cases

- [x] Edge case 1: Handled correctly
- [ ] Edge case 2: NOT handled - needs fix

---

## Tests

- **Ran**: [test command]
- **Result**: [X] passed, [Y] failed
- **Failures**: [list]

---

## Fix Plans (if issues found)

### Fix 1: [Issue description]

- **Root cause**: [What's actually wrong]
- **Fix task**: [Task definition]
- **Priority**: [Blocker/Major/Minor/Cosmetic]

---

## Requirement Traceability Update

Update spec.md requirement statuses:

| Requirement | Previous Status | New Status   |
| ----------- | --------------- | ------------ |
| [FEAT]-01   | Implementing    | ✅ Verified  |
| [FEAT]-02   | Implementing    | ❌ Needs Fix |

---

## Summary

**Overall**: ✅ Ready | ⚠️ Issues | ❌ Not Ready

**What works**: [List]

**Issues found**: [Issue 1: How to fix]

**Next steps**: [Action]
```

---

## Tips

- **P1 first** — MVP must work before P2/P3
- **WHEN/THEN = Test** — Each criterion is a test case
- **Be specific** — "Doesn't work" isn't helpful
- **Recommend fixes** — Don't just report problems, create fix tasks
- **Quality check is mandatory** — Not optional
- **Infer severity** — Never ask the user "how bad is this?"
- **Max 3 diagnostic iterations** — Prevents infinite investigation loops
- **Update traceability** — Every verified requirement updates spec.md status

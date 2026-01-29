# Phase 4b: Validate

**Goal**: Verify implementation meets spec requirements.

## When to Validate

- After completing a user story (all tasks for P1, P2, etc.)
- After completing all tasks
- When user requests validation

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
npm test  # or project test command
```

### 5. Report

---

## Validation Report Template

```markdown
# [Feature] Validation

**Date**: [YYYY-MM-DD]
**Spec**: `.specs/[feature]/spec.md`

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

## Edge Cases

- [x] Edge case 1: Handled correctly
- [ ] Edge case 2: NOT handled - needs fix

---

## Tests

- **Ran**: `npm test`
- **Result**: 15 passed, 2 failed
- **Failures**: [list]

---

## Summary

**Overall**: ✅ Ready | ⚠️ Issues | ❌ Not Ready

**What works**:

- [List]

**Issues found**:

- [Issue 1]: [How to fix]
- [Issue 2]: [How to fix]

**Recommended next steps**:

1. [Action]
2. [Action]
```

---

## Tips

- **P1 first** - MVP must work before P2/P3
- **WHEN/THEN = Test** - Each criterion is a test case
- **Be specific** - "Doesn't work" isn't helpful
- **Recommend fixes** - Don't just report problems

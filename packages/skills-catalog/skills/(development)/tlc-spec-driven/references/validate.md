# Execute: Validate & Verify

**Goal**: Verify implementation meets spec AND coding principles. This is NOT a separate phase — verification is part of every task's completion within Execute.

**Three levels of verification:**

1. **Per-task verification (always, author self-check):** After implementing each task, verify its "Done when" criteria before committing. This is mandatory and automatic. The implementer runs it.

2. **Feature-level validation (independent Verifier sub-agent, always-on, never prompted):** After all tasks for a feature (or priority group) are done, validation runs automatically — the orchestrator dispatches a **fresh Verifier sub-agent** (see [sub-agents.md](sub-agents.md)). Do NOT ask the user whether to run it; it is the safety net, not an opt-in. User interaction is limited to interactive UAT (for user-facing features) and acting on a FAIL verdict ("fix these gaps now?"). The Verifier:
   - Runs **read-only** over the real implementation and tests — mutations run in a scratch/throwaway state only (see Discrimination Sensor section)
   - Scopes coverage to the feature's **git diff surface** (not the full repository)
   - Re-derives coverage independently using **evidence-or-zero**: every AC must be traced to a `file:line` + assertion expression; a criterion with no `file:line` citation counts as NOT covered
   - Runs the **spec-anchored outcome check** and the **discrimination sensor** (both described below)
   - Writes `.specs/features/[feature]/validation.md` with the full evidence report
   - Returns a compact verdict + ranked gap list to the orchestrator in chat
   - Gaps become **fix tasks** routed back to an implementer; re-verification follows with a maximum of **3 fix→re-verify iterations** before escalating to the user

3. **Interactive UAT (for user-facing features only):** The feature has complex user-facing behavior where human judgment matters (UI flows, interaction patterns, visual design). For backend-only or infrastructure work, automated checks are sufficient.

**Trigger for explicit validation:** "Validate", "verify work", "UAT", "test with me", "walk me through it"

---

## Process

### 1. Check Completed Tasks

Go through tasks.md:

- [ ] All tasks marked done?
- [ ] Any blocked or partial?

### 2. Spec-Anchored Acceptance Criteria Check

For each acceptance criterion in `spec.md`, the Verifier re-derives the **spec-defined expected outcome** and confirms the test's actual assertion matches it:

```markdown
### P1: [Story Title]

**Acceptance Criteria**:

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion expression | Result |
| ------------------------- | -------------------- | ---------------------------------- | ------ |
| WHEN [X] THEN [Y]         | [precise value/state from spec] | `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | ✅ PASS / ❌ GAP / ⚠️ Spec-precision gap |
```

**Rules:**

- Where the spec defines a precise outcome (specific status code, field value, error message, state), the test assertion MUST target that exact outcome — not just that an assertion exists.
- Where the spec does NOT define a precise outcome, mark as **⚠️ Spec-precision gap** and flag it in the report. Do NOT silently pass a vague assertion.
- Evidence-or-zero: a criterion with no `file:line` citation counts as NOT covered.

### 3. Check Edge Cases

From spec.md edge cases:

- [ ] [Edge case 1] handled correctly
- [ ] [Edge case 2] handled correctly

### 4. Run Build-Level Gate Check (MANDATORY)

Run the Build-level gate check from the **Gate Check Commands** section in tasks.md. This is NOT optional.

1. Run: `[Build gate command from the Gate Check Commands section in tasks.md]`
2. Non-zero exit code = STOP. Do not proceed to Code Quality Check.
3. Record results:
   - Total test count: [N]
   - Passed: [N]
   - Failed: [list]
   - Skipped: [list — each skip must be justified]

**Test Integrity Check:**

- Compare current test count against the count before this feature was implemented
- If test count DECREASED: investigate why. Tests should only be deleted with explicit justification.
- If assertions were weakened (less specific than before): flag as potential regression

### 5. Discrimination Sensor (MANDATORY — always runs after gate check passes)

The sensor provides the empirical guarantee that the tests can actually detect regressions. It runs in a scratch/throwaway state — the real working tree is never modified.

**How it works:**

1. **Prepare a scratch state.** Use one of (choose the safest available for the environment):
   - `git stash` the current state, apply a mutation, run tests, then `git stash pop`; OR
   - A temporary worktree (`git worktree add`) or temp copy of the affected file(s).
2. **Inject a behavior-level fault** into the new code introduced by this feature. Choose a mutation proportional to the code's risk:
   - Flip a boolean condition (`if (x)` → `if (!x)`, `>` → `>=`)
   - Change a return value (return a wrong status code, wrong field, zero instead of a computed value)
   - Off-by-one (shift a loop bound, change a slice index)
   - Remove a required side effect (delete a method call that the spec requires)
3. **Run the tests** that cover the mutated code. Use the Quick or Full gate command from tasks.md.
4. **Confirm the mutant is killed** (tests FAIL). Then discard the mutation (restore the scratch state).
5. **If a mutant survives** (tests still pass after the fault), the tests are not discriminating for that behavior — add a fix task to strengthen the assertion.

**Tiering (proportional, not optional):**

| Context | Sensor depth |
| ------- | ------------ |
| Default (all features) | Lightweight fault-injection: 1–3 targeted behavior-level mutations per feature, focused on the highest-risk new code |
| P0 / critical paths (payment, auth, data integrity) | Full mutation run: use language-appropriate mutation tooling if available (e.g., Stryker, mutmut, cargo-mutants, pitest); otherwise increase the number of manual fault-injection mutations to ≥5 covering all branches |

**Stack-agnostic:** The sensor targets behavior-level semantics (what the code does), not a specific tool. Any language, any framework.

**Report:** Record killed/survived for each mutation attempt. Surviving mutants → create fix tasks before marking the feature done.

### 6. Code Quality Check (MANDATORY)

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
| Tests map to acceptance criteria and are non-shallow (spot-check one story) | |
| Spec-anchored outcome check: each test's asserted value matches the spec-defined outcome (or gap flagged) | |
| Per-layer Coverage Expectation met: domain logic has 1:1 AC mapping; routes/e2e cover happy + edge + error paths for every route in scope | |
| Every test in scope maps to a spec AC, listed edge case, or Done-when criterion (no unclaimed tests) | |
| Documented project quality/testing guidelines followed (cite guideline file, or "none — strong defaults applied") | |

❌ Any "No"? → Fix before marking complete.

### 7. Interactive UAT (if user-facing feature)

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

### 8. Generate Fix Plans (if issues found)

For each issue found during UAT or from the Verifier:

1. **Diagnose** — Analyze the codebase to find root cause
2. **Create fix task** — Write a task definition with:
   - What: The specific fix
   - Where: File paths
   - Verify: How to prove the fix works
   - Done when: Acceptance criteria for the fix
3. **Present fix plan** — Show all fix tasks to user for approval

Fix tasks follow the same format as regular tasks and can be executed with the implement phase.

**Guardrail:** Maximum 3 diagnostic iterations per issue. If root cause isn't found after 3 attempts, flag for human investigation. The same 3-iteration bound applies to the Verifier's fix→re-verify cycle: if gaps persist after 3 rounds, escalate to the user rather than continuing to loop.

### 9. Write Validation Report File + Return Chat Summary (MANDATORY)

After all checks complete, the Verifier MUST:

1. **Write the persisted report** to `.specs/features/[feature]/validation.md` (see template below). This file is the evidence artifact — it survives the session and can be referenced by CI, reviewers, or future agents.
2. **Return a compact summary in chat** to the orchestrator (see Compact Chat Summary section below). The orchestrator surfaces it to the user and routes any ranked gaps to fix tasks.

### 10. Distill Lessons (MANDATORY when validation.md has signal)

This is the closing action of validation — not a separate phase. Immediately after the report is written, turn its grounded failures into reusable, project-local guidance by following [lessons.md](lessons.md). In short: for each surviving mutant, spec-precision gap, failed/uncovered AC, or `// SPEC_DEVIATION`, record one terse general lesson via `python3 scripts/lessons.py add` (the script enforces grounding and owns all bookkeeping). A clean PASS with no signal → record nothing. Run the self-check: if there was signal but no lesson was recorded, say so in chat. See [lessons.md](lessons.md) for the exact commands, phrasing rules, scope discipline, and the no-script fallback.

---

## Compact Chat Summary (returned in chat after validation)

The Verifier returns this block to the orchestrator after completing all checks:

```markdown
## Validation: [Feature] — [PASS ✅ | FAIL ❌]

**Spec-anchored check**: [N/N ACs matched spec outcome | M spec-precision gaps flagged]
**Gate**: [X passed, 0 failed]
**Sensor**: [N mutations injected, N killed, N survived]
**Report**: `.specs/features/[feature]/validation.md`

**Ranked gaps** (if FAIL):
1. [Gap description] — [AC or criterion] — [file:line or "no evidence"]
2. ...
```

---

## Validation Report Template (`.specs/features/[feature]/validation.md`)

```markdown
# [Feature] Validation

**Date**: [YYYY-MM-DD]
**Spec**: `.specs/features/[feature]/spec.md`
**Diff range**: [commit range or branch..HEAD]
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

| Task | Status     | Notes   |
| ---- | ---------- | ------- |
| T1   | ✅ Done    | -       |
| T2   | ✅ Done    | -       |
| T3   | ⚠️ Partial | [Issue] |

---

## Spec-Anchored Acceptance Criteria

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN X THEN Y             | [precise value/state from spec] | `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | ✅ PASS |
| WHEN A THEN B             | [expected value]     | `path/to/test.ts:88` — `expect(res.status).toBe(400)` | ✅ PASS |
| WHEN C THEN D             | not precisely defined in spec | — | ⚠️ Spec-precision gap |

**Status**: ✅ All ACs covered / ❌ Gaps present / ⚠️ Spec-precision gaps flagged

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1        | `src/service.ts:42` | Flipped condition `x > 0` → `x >= 0` | ✅ Killed |
| 2        | `src/service.ts:88` | Changed return value `status: 'active'` → `status: 'inactive'` | ✅ Killed |
| 3        | `src/handler.ts:15` | Removed side-effect call to `notify()` | ❌ Survived → fix task created |

**Sensor depth**: [lightweight / P0-full]
**Result**: [N/N killed] — [PASS ✅ | FAIL ❌]

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
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ |
| Every test maps to a spec requirement — no unclaimed tests | ✅ |
| Documented guidelines followed: [file(s) or "none — strong defaults applied"] | ✅ |

---

## Edge Cases

- [x] Edge case 1: Handled correctly
- [ ] Edge case 2: NOT handled - needs fix

---

## Gate Check

- **Gate command**: [Build gate command from the Gate Check Commands section in tasks.md]
- **Result**: [X] passed, [Y] failed, [Z] skipped
- **Test count before feature**: [N]
- **Test count after feature**: [M]
- **Delta**: [+(M - N) new tests]
- **Skipped tests**: [list with justification for each]
- **Failures**: [list with details]

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

**Spec-anchored check**: [N/N ACs matched spec outcome | M spec-precision gaps]
**Sensor**: [N/N mutations killed]
**Gate**: [X passed]

**What works**: [List]

**Issues found**: [Issue 1: How to fix]

**Next steps**: [Action]
```

---

## Tips

- **Validation is never prompted** — it always runs after the last task; do not ask the user whether to run it
- **Spec-anchored, not just covered** — "there is an assertion" is not enough; the assertion must target the spec-defined outcome
- **Sensor in scratch only** — never mutate the real tree; stash/worktree/temp copy, run, discard
- **Surviving mutants are fix tasks** — do not mark the feature done if the sensor found weak tests
- **P1 first** — MVP must work before P2/P3
- **WHEN/THEN = Test** — Each criterion is a test case
- **Be specific** — "Doesn't work" isn't helpful
- **Recommend fixes** — Don't just report problems, create fix tasks
- **Quality check is mandatory** — Not optional
- **Infer severity** — Never ask the user "how bad is this?"
- **Max 3 diagnostic iterations** — Prevents infinite investigation loops
- **Update traceability** — Every verified requirement updates spec.md status
- **Always write the report file** — `.specs/features/[feature]/validation.md` is the persisted evidence artifact
- **Distill after writing** — turn grounded failures into lessons via `scripts/lessons.py` ([lessons.md](lessons.md)); clean PASS → no lesson

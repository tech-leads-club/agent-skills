# Execute

**Goal**: Implement ONE task at a time. Surgical changes. Verify. Commit. Repeat.

This is where code gets written. Every task follows the same cycle: plan → implement → verify → commit. Verification is built into every task, not a separate phase.

---

## MANDATORY: Before Starting Any Implementation

**Read [coding-principles.md](coding-principles.md) and state:**

1. **Assumptions** - What am I assuming? Any uncertainty?
2. **Files to touch** - List ONLY files this task requires
3. **Success criteria** - How will I verify this works?

⚠️ **Do not proceed without stating these explicitly.**

---

## Process

**Phase worker context:** When this task is executed as part of a phase sub-agent, the worker
receives the full phase task definitions, coding principles, the generated Test Coverage Matrix
and Gate Check Commands from tasks.md, and relevant spec/design context. The worker executes ALL
tasks in its assigned phase in order — each task follows every step below (implement → gate →
atomic commit) before moving to the next task in the phase. After all tasks in the phase are
complete, the worker reports a compact phase summary (tasks done, commit hashes, test counts,
deviations/blockers) to the orchestrator. See [sub-agents.md](sub-agents.md) for the full
model.

### Before implementing: assess sub-agent delegation (MANDATORY — before the first task)

Before implementing anything, if a formal `tasks.md` with an Execution Plan exists, **count its phases**. If there are **more than 3 phases**, you MUST present the per-phase sub-agent offer to the user (see [sub-agents.md](sub-agents.md)) and wait for their choice before starting Execute — do not silently proceed inline. For 3 or fewer phases (or if the user declines), execute inline. Skip this check only when you are already a phase worker executing a delegated phase (the orchestrator already made the delegation decision).

### 0. List Atomic Steps (MANDATORY when Tasks phase was skipped)

If there is no `tasks.md` for this feature, you MUST list atomic steps before writing any code. This is non-negotiable — it prevents the agent from losing focus and doing too many things at once.

```
## Execution Plan

1. [Step] → files: [list] → verify: [how] → commit: [message]
2. [Step] → files: [list] → verify: [how] → commit: [message]
3. [Step] → files: [list] → verify: [how] → commit: [message]
```

**Each step must be:**

- ONE deliverable (one component, one function, one endpoint, one file change)
- Independently verifiable (can prove it works before moving on)
- Independently committable (gets its own atomic git commit)

If listing steps reveals >5 steps or complex dependencies, STOP and create a formal `tasks.md` instead. The Tasks phase was wrongly skipped.

### 1. Pick Task

From tasks.md (if exists) or from the execution plan above. User specifies ("implement T3") or suggest next available.

### 2. Verify Dependencies

If tasks.md exists, check dependencies. If using inline plan, follow the order listed.

❌ If blocked: "T3 depends on T2 which isn't done. Should I do T2 first?"

### 3. State Implementation Plan

Before writing code:

```
Files: [list]
Approach: [brief description]
Success: [how to verify]
```

### 4. Write Tests (derived from spec, not from implementation)

If the task includes tests (per the Tests field and **Test Coverage Matrix** in tasks.md):

1. Write the test file(s) covering the task's acceptance criteria.
2. Tests MUST be derived from the task's "Done when" criteria and `spec.md` ACs — **not** from the implementation. Each test encodes what the spec requires; never write tests by reading the code and asserting what it currently does.
3. Each acceptance criterion from "Done when" maps to at least one test assertion whose asserted value matches the **spec-defined expected outcome**. Where the spec does not define a precise outcome, note it as a **spec-precision gap** rather than writing a vague assertion and passing silently.
4. Edge cases from spec.md that apply to this task get test cases too.

**HARD CONSTRAINTS (test integrity — never violate):**

- Do NOT weaken assertions (making them less specific to pass more easily)
- Do NOT delete or skip test cases
- Do NOT use the test framework's skip/disable/pending mechanism to bypass failing tests

If a test is genuinely wrong (tests the wrong behavior per spec), STOP and ask the user
before modifying it. Never silently change a test.

If the task does NOT include tests (e.g., entity-only, config-only), skip to Step 4b.

### 4b. Implement

Write the minimum implementation needed to satisfy the task's success criteria: pass all relevant tests (when present) and meet the defined verification/gate checks when there are no direct tests.

**HARD CONSTRAINTS:**

- Do NOT modify tests except to fix a genuinely wrong assertion (ask the user first). The tests are the spec — implementation conforms to them.
- Do NOT weaken assertions (making them less specific to pass more easily)
- Do NOT delete or skip test cases
- Do NOT use the test framework's skip/disable/pending mechanism to bypass failing tests
- Minimum code to pass — save structural improvements for a refactor task

Follow [coding-principles.md](coding-principles.md):

- Simplest code that works
- Touch ONLY listed files
- No scope creep

### 5. Gate Check (VERIFY)

Run the gate check command from the task definition. This is MANDATORY — not "if applicable."

1. Look up the command for the task's Gate level (quick/full/build) in the **Gate Check Commands** section of tasks.md, then run it
2. Non-zero exit code = STOP. Fix the failure. Re-run. Do not proceed until it passes.
3. Confirm the test count matches expectations (no tests were silently deleted or skipped)

**Tiered gates (from the Gate Check Commands section of tasks.md):**

| Task includes                    | Gate level | What runs                |
| -------------------------------- | ---------- | ------------------------ |
| Unit tests only                  | Quick      | Unit test command        |
| E2E or integration tests         | Full       | Unit + E2E commands      |
| Last task in a phase             | Build      | Build + lint + all tests |
| No tests (config, entities, etc) | Build      | Build + lint only        |

The gate check is deterministic. The test runner decides if the code is correct,
not the agent's self-assessment.

### 6. Post-Gate Review

After the gate check passes:

1. Verify test count: Are there at least as many test cases as before? (prevents silent deletion)
2. Verify no SPEC_DEVIATION: If implementation diverged from spec/design, add a marker:

```
// SPEC_DEVIATION: [what diverged]
// Reason: [why the deviation was necessary]
```

3. Quick complexity check: "Would senior engineer flag this as overcomplicated?"
   - Yes → Simplify, re-run gate
   - No → Proceed

4. **Test Adequacy Review (MANDATORY — hard gate).**

   A task cannot be committed or marked done until all four checks below pass. Tests must be both **necessary** (every test traces to a requirement) and **sufficient** (every requirement is covered). The scope boundary is the feature spec — do not test beyond it.

   **Check A — Sufficient coverage (per-layer depth).** Build and output this table:

   | Done-when criterion / spec AC / listed edge case | `file:line` + assertion expression | Spec-defined outcome | Covered? |
   | ------------------------------------------------- | ---------------------------------- | -------------------- | -------- |
   | [criterion from task or spec] | `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | [expected value from spec] | ✅ Yes / ❌ No / ⚠️ Spec-precision gap |

   **Evidence-or-zero rule:** Each covered cell MUST cite the exact `file:line` where the assertion lives AND reproduce the assertion expression (not just the `describe`/`it` name). A criterion with no located `file:line` evidence counts as **NOT covered**; the task cannot be marked done. Do not declare a criterion absent without first searching the test files — show the search before concluding it is missing (mirror: evidence or zero, never a guess).

   **Spec-anchored outcome check:** For each covered criterion, derive the expected outcome from `spec.md` (or the task's "Done when" field) and confirm the test's asserted value matches it — not just that an assertion exists. Where the spec defines a precise outcome (e.g., a specific status code, a specific field value, a specific error message), the test assertion MUST target that exact outcome. Where the spec does not define a precise outcome, mark the cell as **⚠️ Spec-precision gap** and add a note; do NOT silently pass a vague assertion as if it were covered.

   Every "Done when" criterion, every spec.md acceptance criterion, and every listed edge case that applies to this task must map to at least one concrete test assertion. Enforce the layer's Coverage Expectation from the Test Coverage Matrix:

   - Domain / service layer: assertions map 1:1 to spec ACs; every listed edge case has a dedicated test.
   - Route / controller / e2e layer: every route the task adds or modifies must have a happy-path test, a test for each listed edge case, and a test for each documented error/failure path.

   No criterion left unverified.

   **Check B — Non-shallow litmus.** Reject each of the following shallow patterns:
   - Assertion-free tests or `expect(true)` / `expect(1).toBe(1)` style tautologies
   - "No error thrown" as the only assertion — unless not-throwing IS the specified behavior
   - Asserting only on mock call counts when the actual output/state is what the criterion demands
   - Happy-path only when the task's "Done when" or spec.md lists edge cases

   **Payload/conjunction rule.** For each named field in an emitted event, returned object, or persisted record, apply a separate check:
   1. Open the constructed object at its `file:line` and confirm the field is present in the assertion.
   2. Confirm the assertion targets the field's **value or state**, not just the call that produced it.
   3. A present `emit(...)` / `return ...` / `save(...)` call does NOT prove the field — only an assertion on the result does.
   4. Asserting a method was called (spy/mock) != asserting the resulting state. Both may be needed; neither substitutes for the other.

   Apply this check to every payload-bearing criterion before marking it covered.

   **Stack-agnostic litmus:** An assertion is shallow if it would still pass under a plausible *wrong* implementation. If so, strengthen it before committing.

   **Check C — Necessary (no tests beyond the spec).** Reverse-map every test back to a spec AC, a listed edge case, or a "Done when" criterion. Build this table:

   | `file:line` + assertion expression | Maps to (AC / edge case / Done-when criterion) | Keep? |
   | ---------------------------------- | ---------------------------------------------- | ----- |
   | `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | [requirement ID or criterion text] | ✅ Keep / ❌ Remove |

   Any test that maps to nothing → remove it. A test with no requirement is scope creep — it proves nothing about the feature and expands scope beyond the spec. Do not write speculative "what if" tests, do not test framework or library behavior, and do not duplicate an assertion that is already covered at another layer for the same scenario.

   **Check D — Guideline conformance.** If project quality/testing guidelines were found in step 0 of tasks.md step 1.5, verify this task's tests conform to them (naming conventions, file locations, coverage thresholds, etc.). Note the guideline file followed.

   **Bound:** Tests prove the work; they do not expand it. Thoroughness is scoped to the feature + spec. Repo depth is a floor (never less thorough than existing tests for the same layer); the spec is the ceiling. Do not invent requirements or tests that have no spec anchor.

   **Anti-patterns — known verification cheats (treat any of these as an automatic Check failure):**

   | Anti-pattern | Why it fails |
   | ------------ | ------------ |
   | Committing before the gate check passes | Skips the deterministic verifier — the gate is not optional |
   | Asserting call count / spy invocation instead of the resulting state | Proves the method ran, not that it did the right thing |
   | Marking a criterion covered without a `file:line` citation | Violates evidence-or-zero; suspicion of coverage is not coverage |
   | Weakening an assertion (making it less specific) to force a pass | Moves the goalposts instead of fixing the code |
   | Deleting or skipping a test to make the suite pass | Destroys coverage permanently; a failing test is a signal, not noise |
   | "Tested elsewhere" deferral without citing where | Coverage gaps hide behind vague claims; cite the file:line or it doesn't count |
   | Speculative "what if" tests with no spec anchor | Expands scope beyond the ceiling; remove them in Check C |
   | Testing framework or library behavior | Tests a dependency, not the feature; remove them in Check C |

   **On any failure** → rewrite or remove the affected test(s), re-run the gate, then re-run this review.

   *Honest caveat:* This is an inspection-based review (model judgment), complementary to — not a replacement for — the deterministic gate. The gate confirms the test suite runs; the feature-level discrimination sensor (step 10) confirms the tests can detect regressions. This review confirms the suite is meaningful and bounded.

   Add the two mapping tables and a one-line adequacy verdict to the Execution Template's Post-Gate section.

### 7. Atomic Git Commit

Each task gets its own commit immediately after verification. Never batch multiple tasks into one commit.

**Format ([Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)):**

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs`     | Documentation only                                      |
| `test`     | Adding or correcting tests                              |
| `style`    | Formatting, missing semicolons, etc. (no code change)   |
| `perf`     | Performance improvement                                 |
| `build`    | Build system or external dependencies                   |
| `ci`       | CI configuration files and scripts                      |
| `chore`    | Maintenance tasks that don't modify src or test files   |

**Scope:** Feature name or module area, lowercase, e.g., `auth`, `cart`, `api`

**Description rules:**

- Imperative mood ("add", not "added" or "adds")
- Lowercase first letter
- No period at the end
- Complete the sentence: "If applied, this commit will _[your description]_"

**Breaking changes:** Append `!` after type/scope AND add `BREAKING CHANGE:` footer:

```
feat(api)!: change authentication endpoint response format

BREAKING CHANGE: login endpoint now returns JWT in body instead of cookie
```

**Examples:**

```
feat(auth): add email validation to login form
```

```
fix(cart): prevent negative quantity on item decrement
```

```
refactor(api): extract token refresh logic into service

Move token refresh from inline handler to dedicated AuthTokenService
for reuse across multiple endpoints.
```

**Rules:**

- One task = one commit
- Description references what was DONE, not what was planned
- Include only files listed in the task — never sneak in "while I'm here" changes
- If tests are part of the task, include them in the same commit

### 8. Scope Guardrail

During implementation, you will notice things that could be improved, refactored, or added. **Do not act on them.** Instead:

- If it's a bug: surface it to the user (or capture it as a separate task)
- If it's an improvement: add it to the feature's `context.md` under "Deferred Ideas" (or surface it to the user if there is no `context.md`)
- If it's related to the current task: only include it if it's in the "Done when" criteria

**The heuristic:** "Is this in my task definition?" If no, don't touch it.

### 9. Update Task Status

Mark task complete in tasks.md. Update requirement traceability in spec.md if requirement IDs are used.

### 10. Feature-Level Validation (after the LAST task — MANDATORY, always runs)

When the task you just completed is the **last task of the feature** (or of a priority group being delivered on its own, e.g. all P1 tasks), you MUST run feature-level validation before reporting the work as done. **This is not optional and is never prompted — it runs automatically.** Do not stop at the final task's commit.

**Author ≠ verifier rationale.** The implementer (you, or the phase worker) is the author of the code and tests. An author checking their own work applies the same mental model that may have produced any gaps. The Verifier is a fresh sub-agent that re-derives coverage from the spec independently — it does not inherit the author's assumptions. This separation is the quality gate, not just a style preference.

**Layering:**
- Per-task adequacy self-check (steps 5–6): cheap, always runs, author does it, confirms each task in isolation.
- Feature-level validation (step 10): one trustworthy independent gate at completion, always-on, Verifier sub-agent does it.

**How to delegate to the Verifier:**
Dispatch a fresh sub-agent following the **Verifier** role described in [sub-agents.md](sub-agents.md). Provide it with:
- `spec.md` (ACs = source of truth)
- The git diff surface for this feature (commit range)
- The test files in scope
- `validate.md` as its operating checklist

**What the Verifier does (full description in [validate.md](validate.md) and [sub-agents.md](sub-agents.md)):**
1. **Spec-anchored coverage check** — re-derives coverage evidence-or-zero; confirms each test's asserted value matches the spec-defined outcome; flags spec-precision gaps.
2. **Discrimination sensor** — injects a small behavior-level fault (flip a condition, change a return value, off-by-one) in a scratch/throwaway state (git stash or temp copy), runs the relevant tests, confirms they kill the mutant, then discards the mutation. Reports killed/survived; surviving mutants become fix tasks.
3. **Persisted report** — writes `.specs/features/[feature]/validation.md` with PASS/FAIL, per-AC evidence (`file:line` + assertion + spec outcome), gate exit results, sensor result, and the diff/commit range covered.
4. **Chat return** — returns a compact verdict + ranked gap list to the orchestrator in chat; the orchestrator surfaces it and routes gaps to fix tasks.

The Verifier runs read-only over the real implementation tree (mutations run in a scratch state only). It does NOT fix.

If the Verifier returns FAIL, the orchestrator routes the ranked gaps back to an implementer as fix tasks, then re-dispatches the Verifier — bounded to a max of **3 fix→re-verify iterations** before escalating to the user.

If you are unsure whether more tasks remain, check `tasks.md`: if every task is marked complete, dispatch the Verifier now.

---

## Execution Template

```markdown
## Implementing T[X]: [Task Title]

**Reading**: task definition from tasks.md
**Dependencies**: [All done? ✅ | Blocked by: TY]
**Tests**: [unit/e2e/integration/none]
**Gate**: [quick/full/build]

### Pre-Implementation (MANDATORY)

- **Assumptions**: [state explicitly]
- **Files to touch**: [list ONLY these]
- **Success criteria**: [how to verify]

### Tests: Write tests derived from spec ACs

- Test file(s): [paths]
- Test count: [N test cases]
- Spec-derived: each test's asserted value maps to spec-defined outcome (or gap flagged)

### Implement

[Write minimum code to pass tests]

- Tests modified: None
- Tests skipped/deleted: None

### VERIFY: Gate Check

- Command: [gate check command]
- Result: [X passed, 0 failed]
- Test count: [N — matches planned test count]

### Post-Gate

- [x] No SPEC_DEVIATION (or markers added)
- [x] No unnecessary changes made
- [x] Matches existing patterns

**Test Adequacy Review:**

*Check A — Sufficient (coverage mapping):*

| Done-when criterion / spec AC / listed edge case | `file:line` + assertion expression | Spec-defined outcome | Covered? |
| ------------------------------------------------- | ---------------------------------- | -------------------- | -------- |
| [criterion] | `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | [spec value] | ✅ Yes / ⚠️ Gap |

*Check C — Necessary (reverse mapping):*

| `file:line` + assertion expression | Maps to (AC / edge case / Done-when criterion) | Keep? |
| ---------------------------------- | ---------------------------------------------- | ----- |
| `path/to/test.ts:42` — `expect(result.field).toBe(expected)` | [requirement or criterion text] | ✅ Keep |

- [ ] Check A: every criterion covered with `file:line` evidence; spec-defined outcomes matched or gap flagged; per-layer depth met
- [ ] Check B: no shallow assertions; payload/conjunction rule applied to every payload-bearing criterion
- [ ] Check C: every test maps to a requirement — no speculative or unclaimed tests
- [ ] Check D: guideline conformance — [guideline file followed, or "none — strong defaults applied"]

**Verdict**: [All criteria covered, spec outcomes matched, no shallow assertions, all tests necessary] / [Rewritten: describe what was fixed]

**Status**: ✅ Complete | ❌ Blocked | ⚠️ Partial
```

**After the LAST task:** dispatch the Verifier sub-agent (see step 10 and [sub-agents.md](sub-agents.md)) for independent feature-level validation, including the spec-anchored check and discrimination sensor. Validation always runs automatically — never prompted. Execute is not done until the Verifier reports PASS and the validation report is written.

---

## Tips

- **One task at a time** — Focus prevents errors
- **Tools matter** — Wrong MCP = wrong approach
- **Reuses save tokens** — Copy patterns, don't reinvent
- **Check before commit** — Verify all criteria, then commit
- **Stay surgical** — Touch only what's necessary
- **Commit per task** — Clean git history enables bisect and rollback
- **Never "while I'm here"** — Scope creep during implementation is the #1 quality killer
- **Learn from mistakes** — If something goes wrong, surface it to the user so it informs the next task
- **Don't stop at the last commit** — Feature-level validation (step 10) is the final step of Execute, not optional

---

## Pause / End of Session

When work is interrupted, paused, or a session ends before the feature is complete:

1. Open `.specs/STATE.md`.
2. Locate the `## Handoff` section.
3. **Replace only that section's body** with the current snapshot (feature, phase/task, completed, in-progress `file:line`, next step, blockers, uncommitted files, branch). See [memory.md](memory.md) for the exact format.
4. Do NOT touch the `## Decisions` section above it — decisions are written only during Design.

**Section-scoped write (critical):** Replace the content between the `## Handoff` header and the next `##` header (or end of file). Never overwrite the full file — doing so silently destroys the Decisions log.

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

**Batch worker context:** When this task is executed as part of a phase-batch sub-agent, the worker
receives the task definitions for every phase in its batch, coding principles, the generated Test
Coverage Matrix and Gate Check Commands from tasks.md, and relevant spec/design context. A batch is
one or more consecutive whole phases packed to ~7 tasks. The worker executes ALL tasks in its
assigned batch in order - finishing every task in one phase before starting the next phase in the
batch - and each task follows every step below (implement → gate → atomic commit) before moving to
the next. After all tasks in the batch are complete, the worker reports a compact summary (tasks
done, commit hashes, test counts, deviations/blockers) to the orchestrator. See
[sub-agents.md](sub-agents.md) for the full model.

### Before implementing: the approvals

Run `python3 <skill-dir>/scripts/validate_tasks.py <feature> --execute`. Execute starts only when `spec.md`, and `tasks.md` when it exists, carry `**Approved**: <date> - user: "<their words>"`. A missing line means the user has not approved: present and stop, never write it yourself. The same run executes the `**Build**:` line once; a command red before any change is not the repo's gate: name the repo's own commands, and when those are red, tell the user and stop.

### Before implementing: assess sub-agent delegation (MANDATORY - before the first task)

Before implementing anything, if a formal `tasks.md` with an Execution Plan exists, **count its total tasks** and pack the phases into task-budgeted batches (~7 tasks per worker, whole phases - see [sub-agents.md](sub-agents.md)). If that yields **more than one batch** (> ~8 tasks), you MUST present the sub-agent offer to the user and wait for their choice before starting Execute - do not silently proceed inline. If the feature fits a single batch (≤ ~8 tasks, or the user declines), execute inline. Skip this check only when you are already a batch worker executing a delegated batch (the orchestrator already made the delegation decision).

### 0. List Atomic Steps (MANDATORY when Tasks phase was skipped)

If there is no `tasks.md` for this feature, you MUST list atomic steps before writing any code. This is non-negotiable - it prevents the agent from losing focus and doing too many things at once.

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
2. Tests MUST be derived from the task's "Done when" criteria and `spec.md` ACs - **not** from the implementation. Each test encodes what the spec requires; never write tests by reading the code and asserting what it currently does.
3. Each acceptance criterion from "Done when" maps to at least one test assertion whose asserted value matches the **spec-defined expected outcome**. Where the spec does not define a precise outcome, note it as a **spec-precision gap** rather than writing a vague assertion and passing silently.
4. Edge cases from spec.md that apply to this task get test cases too.
5. **A control owes a gesture.** A test for a control performs the gesture its criterion names - clicks the button, fills and submits the form - and asserts what the screen shows afterwards. A label in the markup, or a request posting the finished form, proves the control renders, not that it works.

**Build against the binding source.** When a criterion cites a capture, open it before the first line of that screen and compare as you build: run the app in a browser window at the capture's size and put each state next to its capture. A difference gets fixed; one the spec does not allow gets asked.

**HARD CONSTRAINTS (test integrity - never violate):**

- Do NOT weaken assertions (making them less specific to pass more easily)
- Do NOT delete or skip test cases
- Do NOT use the test framework's skip/disable/pending mechanism to bypass failing tests

If a test is genuinely wrong (tests the wrong behavior per spec), STOP and ask the user
before modifying it. Never silently change a test.

If the task does NOT include tests (e.g., entity-only, config-only), skip to Step 4b.

### 4b. Implement

Write the minimum implementation needed to satisfy the task's success criteria: pass all relevant tests (when present) and meet the defined verification/gate checks when there are no direct tests.

**HARD CONSTRAINTS:**

- The test-integrity rules from step 4 still hold: do NOT weaken, delete, or skip/disable tests. The tests are the spec - implementation conforms to them, not the reverse.
- Modify a test only to fix a genuinely wrong assertion, and ask the user first.
- Minimum code to pass - save structural improvements for a refactor task

Follow [coding-principles.md](coding-principles.md):

- Simplest code that works
- Touch ONLY listed files
- No scope creep

### 5. Gate Check (VERIFY)

Run the gate check command from the task definition. This is MANDATORY - not "if applicable."

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

4. **Test self-check (before the commit, no tables).**

   - **Every new test asserts something.** A test the runner reports as having no assertions is a failure.
   - **Not shallow.** An assertion is shallow if it would still pass under a plausible *wrong* implementation: tautologies, "no error thrown" as the only assertion (unless that IS the spec), call counts or spies where the criterion demands the resulting state, happy path only when the task lists edge cases. For a payload (event, returned object, persisted record), assert each field the spec names.
   - **Every test traces to the spec.** Each maps to a spec AC, a listed edge case or a "Done when" criterion. Remove speculative tests and tests of framework or library behaviour.
   - **The check's proof selects it.** The `Proof:` line of each check this task settles, in tasks.md `## Checks`, names this test with a filter that selects it.

   **Anti-patterns - known verification cheats (any of these fails the self-check):**

   | Anti-pattern | Why it fails |
   | ------------ | ------------ |
   | Committing before the gate check passes | Skips the deterministic verifier - the gate is not optional |
   | Asserting call count / spy invocation instead of the resulting state | Proves the method ran, not that it did the right thing |
   | Weakening an assertion (making it less specific) to force a pass | Moves the goalposts instead of fixing the code |
   | Deleting or skipping a test to make the suite pass | Destroys coverage permanently; a failing test is a signal, not noise |
   | Speculative "what if" tests with no spec anchor | Expands scope beyond the ceiling |
   | Testing framework or library behavior | Tests a dependency, not the feature |

   **On any failure** → rewrite or remove the affected test(s), re-run the gate, then re-run this self-check. The `file:line` evidence per criterion is not built here: `check_proofs.py` runs every check's proof once at the end, and the Verifier judges what a script cannot.

### 7. Status + Atomic Commit

After the gate is green, close the task record **before** creating the commit. Never leave `tasks.md` still open after a successful task commit - a crash between those steps is how resume redoes finished work.

1. Mark the task complete in `tasks.md`. Update requirement traceability in `spec.md` if requirement IDs are used.
2. Create **one** atomic commit with the implementation and its tests. Where the repo tracks `.specs/`, those status and traceability updates go in the same commit; where its `.gitignore` excludes `.specs/`, they stay local and are not forced in - the repo decides what it versions.

Each task gets its own commit immediately after verification. Never batch multiple tasks into one commit.

**Format:** the repo's commit convention; [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) when it has none - `<type>(<scope>): <description>`, imperative, lowercase, no period.

**Rules:**

- One task = one commit
- Description references what was DONE, not what was planned
- Include only files listed in the task - plus the `tasks.md` / `spec.md` status updates for this task when the repo tracks `.specs/`
- Never sneak in "while I'm here" changes
- If tests are part of the task, include them in the same commit

**Deterministic check.** Validate the message before committing: `python3 <skill-dir>/scripts/check_commit.py --message "<your message>"`. A non-zero exit means fix the format first. This makes the format rule enforceable instead of memory-dependent.

**Optional git-level guard (git only, no agent dependency).** In a git repo the same check can run on every commit by wiring it as a `commit-msg` hook, so a malformed message is rejected regardless of who or what drives the commit:

```bash
# from the repo root, one time (resolve <skill-dir> to the directory that contains this skill's SKILL.md):
printf '#!/bin/sh\nexec python3 "<skill-dir>/scripts/check_commit.py" "$1"\n' > .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

It writes a small hook file instead of a symlink, so it also works where symlinks do not (Windows without developer mode). On Windows, write `python` instead of `python3` in the hook. PowerShell has no `printf` or `chmod`; write the same file with `Set-Content`, and Git for Windows runs it with its own shell:

```powershell
Set-Content .git/hooks/commit-msg -NoNewline -Encoding ascii -Value "#!/bin/sh`nexec python `"<skill-dir>/scripts/check_commit.py`" `"`$1`"`n"
```

This is a plain git hook, not tied to any editor or assistant. Skip it if the project manages hooks its own way (for example a pre-commit framework); the manual check above still applies.

### 8. Scope Guardrail

During implementation, you will notice things that could be improved, refactored, or added. **Do not act on them.** Instead:

- If it's a bug: surface it to the user (or capture it as a separate task)
- If it's an improvement: add it to the feature's `context.md` under "Deferred Ideas" (or surface it to the user if there is no `context.md`)
- If it's related to the current task: only include it if it's in the "Done when" criteria
- If the user settles something mid-build: write it in the turn it arrives - into `spec.md` when it changes a criterion (an `AD-NNN` when it departs from a binding source), otherwise on the `**Settled mid-build:**` line of tasks.md `## Handoff`, in their words

**The heuristic:** "Is this in my task definition?" If no, don't touch it.

**Blast radius (approval ≠ remote authority):** Approving a spec or tasks authorizes local implementation and local commits only. Before `git push`, force-push, deploy, production DB migration, or any other remote / externally visible / destructive operation, STOP and get an explicit go-ahead for that action - even if Execute was already approved.

### 9. Walk It Before You Stop (features with a screen)

When the last task is done and the feature has a screen, open the running app and do what each story's **Independent Test** promises, as the user would - the clicks, not a request carrying a finished payload. Something broken that a test covers is a red test you missed; something broken that no test covers is a missing criterion: append it to the spec with a new requirement ID, a check and a test, then fix it.

Save each state a capture draws beside it as `captures/<capture>.running.png`, taken in a browser window at the capture's size so the page lays out as the capture does - an image resized afterwards does not. A state no capture draws gets no picture. Write the `**Walked:**` line in tasks.md `## Handoff`: each story, what the screen showed, and how the user reaches each state (sign-in, data, path), so the screens sub-agent can reach them too. Leave the dev database with data the user can open those states on.

### 10. Feature-Level Validation (after the LAST task - MANDATORY, always runs)

When the last task of the feature is committed, the orchestrator - never a batch worker - closes it:

1. **Run the proofs.** `python3 <skill-dir>/scripts/check_proofs.py <feature>` runs each `Run` group and each lone proof once at `HEAD`, one at a time, finds each check's line in its group's output, runs the `**Build**:` commands, and checks the pictures and the walk; it writes `proofs.md` with the tail of every run. A red row goes back to an implementer before anyone verifies.
2. **Dispatch two fresh sub-agents in parallel, over the same `HEAD`:** the **Verifier** with [validate.md](validate.md), and when a criterion cites a capture, the **screens sub-agent** with [verify-screens.md](verify-screens.md). Author ≠ verifier: neither is the author, and neither fixes anything. Write both on the `**Dispatched:**` line of tasks.md `## Handoff` before sending them, with the `HEAD`, and mark each `returned` when it does.
3. **Fix every finding in one pass,** each closed by a commit the report's `Closed` column cites.
4. **Round 2 is the script:** `check_proofs.py <feature>` again over the fixes, and the screens sub-agent again on the rows that read `differs` only, which writes `**Round**: 2`. There is no second Verifier and no third round. What still fails goes to the user.
5. **Gate:** `python3 <skill-dir>/scripts/validate_verification.py <feature>` exits 0, then distill lessons ([lessons.md](lessons.md)). Close only when every sub-agent you dispatched has returned.

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
- Test count: [N - matches planned test count]

### Post-Gate

- [x] No SPEC_DEVIATION (or markers added)
- [x] No unnecessary changes made
- [x] Matches existing patterns

- [x] Test self-check: every test asserts, none shallow, each traces to the spec, each check's proof selects it

**Status**: ✅ Complete | ❌ Blocked | ⚠️ Partial
```

**After the LAST task:** walk the screens and save the pictures (step 9), then close the feature (step 10): `check_proofs.py`, the Verifier beside the screens sub-agent, one pass of fixes, the script again, and `validate_verification.py` exiting 0.

---

## Tips

- **One task at a time** - Focus prevents errors
- **Reuses save tokens** - Copy patterns, don't reinvent
- **Status then commit** - Mark `tasks.md` complete before the atomic commit, and include that update in it when the repo tracks `.specs/`
- **Stay surgical** - Touch only what's necessary
- **Commit per task** - Clean git history enables bisect and rollback
- **Never "while I'm here"** - Scope creep during implementation is the #1 quality killer
- **Approval is local** - Push, deploy, and other remote/destructive ops need an explicit go-ahead
- **Learn from mistakes** - If something goes wrong, surface it to the user so it informs the next task
- **Don't stop at the last commit** - Feature-level validation (step 10) is the final step of Execute, not optional
- **Plain voice in prose** - Commit bodies and the validation summary follow the writing rules in [coding-principles.md](coding-principles.md): lead with what changed, no filler
- **Validate the commit message** - `python3 <skill-dir>/scripts/check_commit.py --message "..."` before committing

---

## Pause / End of Session

When work is interrupted, paused, or a session ends before the feature is complete:

1. Open `.specs/STATE.md`.
2. Locate the `## Handoff` section.
3. **Replace only that section's body** with the current snapshot (feature, phase/task, completed, in-progress `file:line`, next step, blockers, uncommitted files, branch). See [memory.md](memory.md) for the exact format.
4. Do NOT touch the `## Decisions` section above it - decisions are written only during Design.

**Section-scoped write (critical):** Replace the content between the `## Handoff` header and the next `##` header (or end of file). Never overwrite the full file - doing so silently destroys the Decisions log.

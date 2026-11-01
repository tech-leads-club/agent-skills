# Execute

**Goal**: Implement one task at a time. Change only its files. Prove it with its gate. Commit it. Repeat.

Every task runs the same cycle: plan, test, implement, gate, commit. Verification is part of each task, not a phase of its own.

## Before the First Task

1. **Read [coding-principles.md](coding-principles.md)** and keep it in force for the whole run.
2. **Run `python3 <skill-dir>/scripts/validate_tasks.py <feature> --execute`.** It runs at every scope. It requires the spec and the tasks approved with `approve.py`, each still matching its hash, and no open question. It also runs the `**Build**:` line once.
   - A missing approval means the user has not approved. Present and stop, and never stamp it yourself.
   - A hash that no longer matches means the file changed after the approval. [specify.md](specify.md) and [tasks.md](tasks.md) say who settles it.
   - A Build line red before any change is not the repo's gate. Name the repo's own commands. When those are red, tell the user and stop.
3. **Plan the batches.** Run `python3 <skill-dir>/scripts/plan_batches.py <feature>` when a `tasks.md` exists. One batch runs inline. More than one batch means you offer one worker per batch and wait for the user's answer ([sub-agents.md](sub-agents.md)). A batch worker skips this step.

**A Medium feature has no `tasks.md`.** List its steps inline before any code, each with its files, its check and its commit message. Each step is one commit, and each commit passes the same budget as a task. A step `check_commit.py` refuses for size shows Tasks was owed. Stop and write `tasks.md`.

## The Cycle, for Each Task

### 1. Pick the Task and Check Its Dependencies

Take the next open task in order, or the one the user names. Its `**Depends on**:` tasks are done. When one is not, do it first.

### 2. State the Plan in Three Lines

```
Files: [exactly the task's Files list]
Approach: [one sentence]
Proof: [the gate command and the checks this task settles]
```

### 3. Write the Tests From the Spec

When the task has tests, write them before the code.

- **Tests derive from the criteria.** Each test asserts the outcome its criterion defines. Never write a test by reading the code and asserting what it does.
- **Every criterion the task names gets an assertion** with the spec's value. When the spec defines no precise value, record a spec-precision gap. Never write a vague assertion.
- **Edge cases the spec lists for this task get tests too.**
- **A control owes a gesture.** A test for a control performs the gesture its criterion names, then asserts what the screen shows. A label in the markup proves the control renders, not that it works.

**Build against the binding source.** When a criterion cites a capture, open it before the first line of that screen. Run the app in a browser window at the capture's size, and put each state next to its capture. Fix a difference. Ask about one the spec does not allow.

### 4. Implement the Minimum

Write the least code that passes the tests and the gate. Change only the files the task lists. Save structural improvements for a refactor task.

**Tests are the spec.** Never weaken an assertion, skip a test or delete one to make the suite pass. When a test is wrong per the spec, stop and ask the user before you change it. `check_commit.py` refuses a deleted test, a skip marker and a lost assertion.

### 5. Run the Gate

Run the command for the task's `**Gate**:` level from `## Gate Check Commands`. A non-zero exit means fix and run it again. The test runner decides, not your judgement.

| The task has | Gate level | What runs |
| --- | --- | --- |
| Unit tests only | quick | The unit test command |
| Integration or e2e tests | full | Unit and e2e commands |
| The last task of a phase, or no tests | build | Build, lint and all tests |

### 6. Check the Work Before the Commit

1. **No silent divergence.** When the code departs from the spec or the design, add `// SPEC_DEVIATION: <what>` and `// Reason: <why>` beside it.
2. **No needless complexity.** Would a senior engineer call this overcomplicated? Then simplify, and run the gate again.
3. **Every new test asserts something.** A test with no assertion fails this check.
4. **No shallow assertion.** An assertion is shallow when a plausible wrong implementation still passes it. Tautologies fail. So does "no error thrown" alone, unless that is the criterion. A spy count fails where the criterion names the resulting state. A happy path alone fails when the task lists edge cases.
5. **Every test traces to the spec.** Remove speculative tests and tests of framework behaviour.
6. **The check's proof selects the test.** Each check this task settles has a `Proof:` whose filter selects it.

### 7. Close the Task and Commit

1. Tick every `**Done when**:` box of the task in `tasks.md`.
2. Stage the task's files only. Stage `tasks.md` in the same commit when the repo tracks `.specs/`. Where `.specs/` is ignored, the commit holds only the code and its tests.
3. Run `python3 <skill-dir>/scripts/check_commit.py --message "<message>"`. Add `--task T<n>` when `.specs/` is not tracked. It checks the message. It measures the staged diff against the task: its files, its tests, the anti-cheat rules and the size budget. It also refuses a spec or tasks.md that no longer matches its approval.
4. Commit. One task is one commit. Never batch tasks.

**A plan change is its own commit.** A new approval, an amendment or a Handoff update stages only `.specs/` files and closes no task. `check_commit.py` runs the approval and decision checks on it, and refuses one that also stages code. When a task outgrows its files or its size, amend the plan first, commit that alone, then commit the code.

Use the repo's commit convention. When it has none, use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<type>(<scope>): <description>`, imperative, lowercase, with no period.

**The same check as a git hook.** It runs on every commit, whoever drives it. Write the hook once from the repo root:

```bash
# resolve <skill-dir> to the directory that holds this skill's SKILL.md
printf '#!/bin/sh\nexec python3 "<skill-dir>/scripts/check_commit.py" "$1"\n' > .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

On Windows write `python` for `python3`. PowerShell has no `printf` or `chmod`, so write the file with `Set-Content`:

```powershell
Set-Content .git/hooks/commit-msg -NoNewline -Encoding ascii -Value "#!/bin/sh`nexec python `"<skill-dir>/scripts/check_commit.py`" `"`$1`"`n"
```

Skip the hook when the project manages its hooks another way. The manual run still applies.

### 8. Stay in Scope

You will notice things that could be better. Do not act on them.

- A bug goes to the user, or becomes a separate task.
- An improvement goes to `context.md` under Deferred Ideas, or to the user when there is no `context.md`.
- Something for the current task goes in only when its `**Done when**:` names it.
- An answer the user gives mid-build is written in the turn it arrives. It goes into `spec.md` when it changes a criterion, and their answer is the approval you stamp with `approve.py`. It becomes an `AD-NNN` when it departs from a binding source. Otherwise it goes on the `**Settled mid-build:**` line of the Handoff, in their words.

**Blast radius.** An approval covers local work and local commits only. `git push`, force-push, deploy and production data changes each need their own go-ahead.

**A gate exits 3.** It failed twice in a row with the same errors, so another run with the same change is a loop. Write `**Blocked:**`, `**Tried:**` and `**Need:**` in the Handoff, and tell the user. Before you blame your change, check whose failure it is. A crashed tool or a broken provider is not your error to retry.

## After the Last Task

### 9. Walk It Before You Stop (Features With a Screen)

Open the running app and do what each story's Independent Test promises, as the user would. Use the clicks, not a request with a finished payload. Something broken that a test covers is a red test you missed. Something broken that no test covers is a missing criterion. Append it to the spec with a new ID, a check and a test, then fix it.

Save each state a capture draws beside it as `captures/<capture>.running.png`. Take it in a browser window at the capture's size, because an image resized afterwards shows another layout. Write the `**Walked:**` line in the Handoff: each story, what the screen showed, and how the user reaches each state. Leave the dev database with data the user can open those states on.

### 10. Close the Feature (Always Runs)

The orchestrator closes it, never a batch worker:

1. **Run the proofs.** `python3 <skill-dir>/scripts/check_proofs.py <feature>` runs every proof once at `HEAD`, one at a time, with the build. It writes `proofs.md`. A red row goes back to an author before anyone verifies.
2. **Dispatch two fresh sub-agents in parallel over the same `HEAD`.** The Verifier gets [validate.md](validate.md). The screens sub-agent gets [verify-screens.md](verify-screens.md) when a criterion cites a capture. Neither is the author, and neither fixes anything. Write both on the `**Dispatched:**` line first, with the `HEAD`.
3. **Fix every finding in one pass.** The report's `Closed` column cites the commit for each one.
4. **Round 2 is the script.** Run `check_proofs.py` again over the fixes. Send the screens sub-agent again on the rows that read `differs` only, and it writes `**Round**: 2`. There is no second Verifier and no third round. What still fails goes to the user.
5. **Gate.** `python3 <skill-dir>/scripts/validate_verification.py <feature>` exits 0. Then distill lessons ([lessons.md](lessons.md)). Close only when every sub-agent you sent has returned.

## Pause or End of Session

When work stops before the feature is done, replace only the `## Handoff` section of `.specs/STATE.md` with the snapshot. [memory.md](memory.md) gives its format. Never touch `## Decisions`, and never overwrite the whole file.

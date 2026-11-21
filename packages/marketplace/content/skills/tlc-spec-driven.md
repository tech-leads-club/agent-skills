## Why teams use it

Coding agents tend to fail in two quiet ways: they fill product gaps with guesses, and they report "done" because their own tests pass. tlc-spec-driven addresses both with files and exit codes rather than reminders. Each feature lives under `.specs/features/<name>/`, and the agent moves forward only when a gate script exits 0. `validate_spec.py` runs before you see the spec, `validate_tasks.py` before you see the tasks, `check_commit.py` before each commit, and `validate_verification.py` before the feature counts as finished. The scripts use only the Python standard library, so they work the same in any stack.

The other distinctive piece is the split between who builds and who judges. After the last task, `check_proofs.py` runs each check's test with the project's own test command at `HEAD` and records the output in `proofs.md`. Then a fresh sub-agent that never saw the author's reasoning asks of each test: would it still pass if the requirement were false? When the request comes with a design capture, a second sub-agent retakes the screen at the capture's size and compares them item by item.

Depth scales with the work. A three-file change gets a one-line spec and no task list. A multi-component feature gets a design doc, a coverage matrix built from the repo's test config, and optional batch workers. The [benchmark page](/tlc-spec-driven/) measured the v3 line ("TLC 3.*") with Opus 4.8 planning and Sonnet 4.6 implementing: a 0.94 mean across three runs, a 0.93–0.95 range, and 0.90 test completeness. The current release is 4.1.0, so those numbers describe an earlier version.

## How a session goes

> Specify feature: when a member's card charge fails, suspend their paid access and show them why on the billing page. Mockup attached.

1. The agent sizes the request as small, medium, large or complex. The size decides whether Design and Tasks run at all.
2. It loads confirmed lessons (`lessons.py list --status confirmed`), reads the decisions log in `.specs/STATE.md`, and briefly scans the code involved.
3. It asks about product decisions and goes through nine implicit-requirement areas, such as idempotency, auth and data expiry. Each area becomes a requirement or an "N/A because...". Answers to open questions go into `context.md`.
4. It saves the mockup to `captures/` as binding and writes `spec.md` with EARS criteria, requirement IDs and an assumptions table. It runs `validate_spec.py`, then **stops for your approval**. Your reply is written into the file in your own words.
5. For large or complex work, it writes `design.md` and adds hard-to-reverse choices to `STATE.md` as `AD-NNN` entries.
6. It writes `tasks.md` with one deliverable per task, gate commands, and a `## Checks` list that gives each criterion one proof. It runs `validate_tasks.py` and **stops for approval again**.
7. Execute starts with `validate_tasks.py --execute`, which confirms both approvals and runs the build once. A build that is already red stops the agent before any change. Above about eight tasks, it offers sub-agent batches and waits for your answer.
8. For each task, it writes tests from the spec, runs the gate, marks the task done, checks the commit message with `check_commit.py`, and commits once.
9. At the end, it walks the screens and saves the screenshots, runs `check_proofs.py`, and dispatches both reviewers. It fixes findings in one pass, runs a second round, and clears `validate_verification.py`. Then it records lessons with `lessons.py add`. Pushing or deploying needs a separate yes from you.

## What's in the folder

- `references/specify.md`, `discuss.md`: the spec template, EARS patterns, the implicit-requirement table, the closure gate, capture rules, and the `context.md` template.
- `references/design.md`, `tasks.md`: the design template with its risks table, plus the coverage matrix, gate tiers and proof syntax used for tasks.
- `references/implement.md`, `coding-principles.md`: the per-task cycle, rules against weakening tests, the setup for a `commit-msg` hook, and the voice rules for generated documents.
- `references/validate.md`, `verify-screens.md`, `sub-agents.md`: the Verifier's brief, how the screen inventory works, batch packing with worked examples, and a model tier for each role.
- `references/memory.md`, `lessons.md`: the `STATE.md` format, how a pause and resume are checked against git, and the lesson signal types.
- `scripts/validate_spec.py`, `validate_tasks.py`, `validate_verification.py`: the structural gates. Exit code 1 blocks the next step.
- `scripts/check_proofs.py`: runs the proofs one at a time with no timeout and writes `proofs.md`. On Windows it runs them in Git Bash.
- `scripts/check_commit.py`: checks Conventional Commits format and can also run as a git hook.
- `scripts/lessons.py`: promotes a lesson after it recurs in two features and prunes candidates older than 45 days.
- `scripts/lean_config.py`: shared parsing that reads both the `spec.md`/`tasks.md` and the `plan.md`/`checks.md` file layouts.
- `scripts/selftest.py` + `fixtures/`: breaks a worked billing example on purpose and requires every gate to catch each break.

## Choosing between similar skills

- [tlc-spec-lean](/skills/tlc-spec-lean/): one reviewed plan, vertical slices, one fresh review and one fix pass, with no per-task gates and no lessons store. Pick it for clear features. Pick this skill when you want atomic tasks and a gate on every phase.
- [tlc-plan](/skills/tlc-plan/) + [tlc-implement](/skills/tlc-implement/): the same ideas split across two skills. They fit when one person plans and another builds, or when a `plan.md` already exists. Pick this skill to keep the whole flow in one place.
- [technical-design-doc-creator](/skills/technical-design-doc-creator/): pick it when the design document itself is what you need. Here, `design.md` exists only to feed the tasks.

## Works well with

- [tlc-discover](/skills/tlc-discover/) comes first while a project is still vague. Its description sends clear features here.
- [spec-driven-eval](/skills/spec-driven-eval/) comes after. It grades an implementation against the PRD and names this skill as the builder.
- [the-judge](/skills/the-judge/) reviews the PR. The [AI Dev Flow page](/tlc-ai-dev-flow/) places review after the build.

## Recent changes

- **2026-11-02 (catalog 0.17.19):** the design template now sits inside one markdown fence.
- **2026-10-31 (4.1.0):** `--execute` runs the build before any change. `check_commit.py` prints the next step. Test runners that exit 0 on an empty filter now need a `run` proof.
- **2026-10-30:** proofs use the project's own test commands. The mutation scripts were removed, and the Verifier now judges each test in a `## Checks` table. Windows support was also fixed.
- **2026-10-25 (4.0.0):** every product decision is asked before the spec, attached designs bind, and each criterion has a check. Approvals and dispatches are written to files so they survive context compaction.
- **2026-06-25 (3.0.0, breaking):** the flow was rebuilt around an independent verifier and a lessons layer. The `megabrain` alias and Quick mode were removed.

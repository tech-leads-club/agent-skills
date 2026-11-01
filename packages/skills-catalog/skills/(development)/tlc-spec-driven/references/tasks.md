# Tasks

**Goal**: Cut the plan into tasks. Each task is one test cycle: its code, the tests that prove it, one gate and one commit.

**When:** Large and Complex scopes. A Medium feature keeps its checks in `spec.md` and commits one step at a time.

## What a Task Is

`validate_tasks.py` holds every rule below. `check_commit.py` measures each one again on the commit.

- **One test cycle.** A task creates or changes code and adds the tests that prove it. A test belongs to the task whose code it proves. The closing e2e task is the only test-only task.
- **Its files, declared.** `**Files**:` lists every path once, as `Create:`, `Modify:`, `Delete:` or `Test:`. A `Modify:` or `Delete:` file exists today, or an earlier task creates it. A `Create:` file exists nowhere yet. The commit may stage only these files and `.specs/`.
- **A removal is declared too.** A file the task removes is a `Delete:` line, and the commit deletes it. A test leaves the same way, so the approved plan shows it.
- **The design is built.** Each design `**Location**:` lands in a task. A `(new)` location needs a `Create:` of that file, or of a file under that folder. An `(existing)` location needs any file a task lists there.
- **Three code files at most.** A task over that splits where a reviewer could reject one part and keep the other. When it truly cannot split, the task writes `**Size**: large - <why>`, and the reason stays visible.
- **Setup is not a task.** Every task names criterion IDs in `**Requirement**:`. Setup, config and scaffolding fold into the first task that needs them.
- **Whole, never shrunk.** "For now", "placeholder", "TODO", "temporary" and "por enquanto" fail the gate. What a task leaves out is another task.
- **Order lives in the phases.** A task depends only on tasks that come before it. Phases are numbered 1, 2, 3 and hold 10 tasks at most. A feature holds 21 tasks at most, or writes `**Size**: large - <why>` under its title.

These limits come from code review. A review finds most defects in a change of a few hundred lines and loses them past that. The commit budget is 200 changed lines of code with a warning, and 400 with an error.

## Process

### 1. Read the Design and Its Review

Read `.specs/features/[feature]/design.md` and `review.md` before you write a task. The design says `**Reviewed**: review.md`, or `not run - <why>`, with every finding resolved. An escalated finding carries the user's answer, and the tasks follow it.

### 2. Write the Test Coverage Matrix

**Read the project's testing rules first.** Look at `AGENTS.md` and any rules file the project uses. Look at `CONTRIBUTING.md`, the testing parts of `docs/`, and the README. Look at coverage thresholds in the test runner config and in CI.

- **Rules found:** the matrix follows them. Existing tests fill in style, location and framework only. Name the files you read.
- **No rules found:** cover every criterion and every edge case. Domain logic maps one to one to criteria. Routes cover the happy path, the edge cases and the error paths. This may go deeper than the repo does today, and that is intended.

**Find the commands in the repo.** Never invent a command or assume an ecosystem. Read the build manifests, the test config and the CI workflows. Capture the lint, format and type check commands too, because the Build gate runs them. With no tests in the repo at all, ask the user which test types and commands to use.

**Each layer names the globs of its code.** `validate_tasks.py` matches every `Create:` and `Modify:` path against these globs. A path in a layer that requires tests needs that test type in the task's `**Tests**:`. A path that matches no layer fails, so add its layer. `**/` also matches no folder at all.

### 3. Write the Checks

The checks are what the build is held to, and what `check_proofs.py` runs at the end. Write one or more per criterion. Each is one claim with its concrete value, and it ends with the criterion IDs it settles:

```markdown
**Run unit**: `npx vitest run src/billing --reporter=verbose`

**C3** - A failed charge sets the status to `suspended`, never `cancelled` (BILL-02)
Proof: run unit | ✓ dunning > failed charge suspends

**C4** - The checkout page still loads with a suspended account (BILL-03)
Proof: `npx playwright test e2e/checkout.spec.ts -g "suspended account"`
```

- **The proof names one test, with the project's own command.** Tests that run together go on one `**Run <name>**:` line, and run once. A check that reads it writes `Proof: run <name> | <the line its test prints>`. Copy that line from a real run, pass marker included (`✓`, `PASSED`, `ok`).
- **Why the expected line.** The proof passes when those words appear in order on one line of the output. A renamed test, or a filter that selects nothing, then reads `no test ran`. Put the verbose flag in the `Run` line when the default reporter prints only a summary.
- **A lone proof.** Some tests cannot share a run, such as an e2e suite with its own server. Each is a lone `Proof: <command>`, judged by its exit code. Some runners exit 0 when the filter selects nothing (`node --test`, `dotnet test`). With those, give even a single test a `Run` line and a `run` proof.
- **Runs go one at a time.** `check_proofs.py` never runs two side by side, so tests that share a database or a port stay safe.
- **A state a capture draws** is proven by its picture: `Proof: browser captures/<capture>.running.png` ([implement.md](implement.md)). A state no capture draws is proven by a test, or by `Proof: walk - <what the visit shows>`.
- **`**Build**:`** names the repo's build, type check and lint commands, separated by `;` inside the code span. Write `**Build**: none - <why>` when there are none.

`validate_tasks.py` refuses a check that cites no criterion, a criterion with no check, and a criterion no task names.

### 4. Write the Tasks in Phases

Group the tasks into ordered phases under `## Tasks`. A phase completes before the next starts, and tasks run in order within a phase. Number tasks T1, T2, T3 across the whole file.

**Each phase sits near the worker budget.** Execute packs whole phases into batches of about 7 tasks, and never splits a phase. A phase over 10 tasks fails the gate, so split it at a real dependency seam.

There is no hand-drawn diagram. The phases are the only record of order, and `plan_batches.py` draws the map from them.

### 5. Run the Gates

1. `python3 <skill-dir>/scripts/validate_tasks.py <feature>`. Fix every error. Never present tasks that fail.
2. `python3 <skill-dir>/scripts/plan_batches.py <feature>`. It prints the phase map and the batches. Show both with the tasks.

### 6. Present and Stop

This is the second stop for the user, after the spec. Show the tasks, the phase map and the batches. When the user approves, run `python3 <skill-dir>/scripts/approve.py <feature> tasks --user "<their words>"`. It sets `**Status**: Approved` and stamps the hash of the file. You never stamp words the user did not give.

**A change after the approval.** During Execute the plan can change: a task splits, a file joins a task, or a task takes `**Size**: large`. Record it with `approve.py <feature> tasks --amend "<what changed and why>"`, then commit tasks.md alone. A change to what the user decided goes back to them: a criterion, a check's claim or the scope. Until then, `validate_tasks.py` and `check_commit.py` refuse tasks.md, because its hash no longer matches.

---

## Template: `.specs/features/[feature]/tasks.md`

````markdown
# [Feature] Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: activate it by name and follow its Execute flow and Critical Rules. Do not search for skill files by filesystem path. If the skill cannot be activated, STOP and tell the user.

---

**Spec**: `.specs/features/[feature]/spec.md`
**Design**: `.specs/features/[feature]/design.md`
**Status**: Draft | Approved | In Progress | Done
**Approved**: [approve.py writes this line when the user approves]
**Build**: `[build command]; [type check command]; [lint command]`
**Run unit**: `[the command that runs this feature's unit tests, verbose]`

## Test Coverage Matrix

Rules read: [files, or "none - strong defaults applied"]

| Layer | Paths | Tests | Coverage Expectation | Test Location |
| --- | --- | --- | --- | --- |
| Service | `src/**/*.service.ts` | unit | All branches, one to one to criteria, every edge case | `src/**/*.service.spec.ts` |
| Controller | `src/**/*.controller.ts` | e2e | Every route: happy, edge and error paths | `test/**/*.e2e-spec.ts` |
| Entity / Config | `src/**/*.entity.ts`, `src/config/**` | none | Build gate only | - |

## Gate Check Commands

| Level | When to Use | Command |
| --- | --- | --- |
| quick | A task with unit tests only | `[unit test command]` |
| full | A task with integration or e2e tests | `[unit and e2e commands]` |
| build | The last task of a phase, or a task with no tests | `[build, lint and all tests]` |

## Tasks

### Phase 1: Foundation

#### T1: [Create the X service with its rule]

**What**: [One sentence: the exact deliverable]
**Files**:
- Create: `src/billing/x.service.ts`
- Test: `src/billing/x.service.spec.ts`
**Depends on**: None
**Requirement**: [FEAT]-01, [FEAT]-02
**Reuses**: `src/billing/base.service.ts#BaseService`
**Tests**: unit
**Gate**: quick
**Done when**:
- [ ] [A binary, testable outcome]
- [ ] Gate passes: `[quick command]`

### Phase 2: Integration

#### T2: [Expose X on the route]

**What**: [One sentence]
**Files**:
- Modify: `src/billing/billing.controller.ts`
- Test: `test/billing.e2e-spec.ts`
**Depends on**: T1
**Requirement**: [FEAT]-03
**Tests**: e2e
**Gate**: full
**Done when**:
- [ ] [A binary, testable outcome]

## Checks

**C1** - [one observable claim with its concrete value] ([FEAT]-01)
Proof: run unit | [the line its test prints when it passes, pass marker included]

**C2** - [the screen in `captures/[capture].png`, reached by [gesture]] ([FEAT]-03)
Proof: browser captures/[capture].running.png

## Handoff

The feature's live state, written as it happens. A compaction gives no warning.

**Settled mid-build:** [each answer the user gave during Execute, in their words - or none]
**Dispatched:** [each sub-agent before it is sent, with its `HEAD`, and `returned` when it does]
**Walked:** [each story's Independent Test as you did it, and how the user reaches each state]
**Blocked:** [when a gate exits 3: the one thing in the way]
**Tried:** [what you changed, read and searched]
**Need:** [the one input that unblocks it]
````

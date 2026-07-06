# Tasks

**Goal**: Break into GRANULAR, ATOMIC tasks. Clear dependencies. Right tools. Sequential phase execution plan.

**Skip this phase when:** There are ≤3 obvious steps. In that case, tasks are implicit — go straight to Execute and list them inline in your implementation plan.

## Why Granular Tasks?

| Vague Task (BAD) | Granular Tasks (GOOD)             |
| ---------------- | --------------------------------- |
| "Create form"    | T1: Create email input component  |
|                  | T2: Add email validation function |
|                  | T3: Create submit button          |
|                  | T4: Add form state management     |
|                  | T5: Connect form to API           |
| "Implement auth" | T1: Create login form             |
|                  | T2: Create register form          |
|                  | T3: Add token storage utility     |
|                  | T4: Create auth API service       |
|                  | T5: Add route protection          |

**Benefits of granular:**

- **Agents don't err** - Single focus, no ambiguity
- **Easy to test** - Each task = one verifiable outcome
- **Clean commits** - Each task = one atomic, revertable commit
- **Errors isolated** - One failure doesn't block everything

**Rule**: One task = ONE of these:

- One component
- One function
- One API endpoint
- One file change

---

## Process

### 1. Review Design

Read `.specs/features/[feature]/design.md` before creating tasks.

### 1.5. Generate the Test Coverage Matrix (ALWAYS)

This step ALWAYS runs — there is no precondition. Decide which of two paths to take, then generate the three sections below.

**Step 0 — Read project quality/testing guidelines (ALWAYS, before anything else).**

Before sampling tests or inferring anything, scan the project for documented quality and testing standards. Stack-agnostic sources to check (illustrative, not exhaustive):

- Agent/AI instructions: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/**`, `.github/copilot-instructions.md`
- Contributor guides: `CONTRIBUTING.md`, `docs/` (testing, quality, or standards subdocs), README testing section
- Tool configuration: coverage thresholds in the test runner config (e.g., `jest.config.*`, `vitest.config.*`, `pytest.ini`, `.nycrc`, `Makefile` coverage targets, CI coverage gates)

**If guidelines are found:** the Coverage Expectation (see matrix below) conforms to them. Existing test samples fill gaps in style/location/framework only. Cite the specific files found in the matrix provenance note.

**If no guidelines are found:** apply the strong default — cover every spec AC and every listed edge case; domain/business logic maps 1:1 to spec ACs; routes/e2e cover happy + edge + error paths. This default may exceed the current repo's depth, which is intentional.

**Decision:**

- **Existing tests in the repo** → infer the matrix and gate commands by sampling the codebase.
- **No tests at all** → ask the user: "What test types will this project use (unit / integration / e2e / none)? What commands run them?"

**How to infer (path 1 — existing tests):**

1. **Sample test files.** Locate 5–10 existing test files. Map each file's location relative to its source file to identify which code layers are exercised and at what level (unit, integration, e2e). Use these samples for style, location patterns, framework, and test type — and as a **floor** (never produce tests less thorough than existing ones for the same layer). Existing tests are NOT a ceiling on thoroughness; the thoroughness target comes from the spec ACs, listed edge cases, and guidelines (or strong default). The Coverage Expectation column captures the target per layer.
2. **Discover commands from the repo.** Do NOT invent commands and do NOT assume an ecosystem. Read the project's own build/task manifests, test config, and CI workflows to extract the actual commands — for example: `package.json` / `project.json` (JS/TS), `Makefile`, `pyproject.toml` / `tox.ini` / `pytest` (Python), `Cargo.toml` (Rust), `go test` invocations (Go), `pom.xml` / `build.gradle` (Java/Kotlin), `Gemfile` / `Rakefile` (Ruby), `composer.json` (PHP), `.github/workflows` / `.gitlab-ci.yml`. The list is illustrative; detect what this repo actually uses.

**Output contract — render these two sections verbatim into `tasks.md`** (the exact headings downstream phases reference):

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: [list files, e.g. `AGENTS.md`, `jest.config.ts` — or "none — strong defaults applied"].

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| [layer] | [unit/integration/e2e/none] | [depth target for this layer] | [glob or path pattern] | [command] |

**Coverage Expectation values** — set from guidelines first; use strong defaults when no guideline applies:

| Layer type | Strong default (no guideline) |
| ---------- | ----------------------------- |
| Domain / business-logic (service, use-case, domain model) | All branches; 1:1 to spec ACs; every listed edge case has a test |
| Route / controller / e2e / integration | All routes in scope: happy path + every listed edge case + error/failure paths |
| Repository / data-access | Key query paths + error handling; infer from existing repo tests |
| Entity / config / schema | none — build gate only |

These defaults may exceed the current repo's depth. That is intentional — they are a **target**, not a reflection of what already exists.

*Example (filled in):*

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Service | unit | All branches; 1:1 to spec ACs; all listed edge cases | `src/**/__test__/*.spec.ts` | `yarn test:unit` |
| Repository | integration | Key query paths + error paths | `src/**/__test__/*.e2e-spec.ts` | `yarn test:e2e` |
| Controller/Resolver | e2e | All routes: happy + edge + error | `src/**/__test__/*.e2e-spec.ts` | `yarn test:e2e` |
| Entity / Config | none | — (build gate only) | — | build gate only |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | [unit test command] |
| Full | After tasks with e2e/integration tests | [unit + e2e commands] |
| Build | After phase completion or config/entity-only tasks | [build + lint + all tests] |

---

**Co-located tests:** Every task that creates or modifies a code layer with a required test type MUST include writing/updating those tests in the same task. Tests are NOT separate tasks. The tests must satisfy the layer's **Coverage Expectation** from the matrix — not merely exist.

| Task creates...                           | Done When must include...                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Code layer with "unit" requirement        | Unit tests written satisfying the layer's Coverage Expectation (e.g., 1:1 AC mapping for domain logic; all listed edge cases covered) + quick gate passes |
| Code layer with "e2e" requirement         | E2E tests written satisfying the layer's Coverage Expectation (e.g., every route the task adds: happy path + edge + error paths) + full gate passes |
| Code layer with "integration" requirement | Integration tests written satisfying the layer's Coverage Expectation + full gate passes                           |
| Code layer with "none" requirement        | Gate check at appropriate level                                                                                    |

### 2. Break Into Atomic Tasks

**Task = ONE deliverable**. Examples:

- ✅ "Create UserService interface" (one file, one concept)
- ❌ "Implement user management" (too vague, multiple files)

### 3. Define Dependencies

What MUST be done before this task can start?

### 4. Create Execution Plan

Group tasks into ordered phases. Each phase depends on the ones before it; tasks execute sequentially within a phase.

**Size phases near the worker budget.** During Execute, phases are packed into task-budgeted batches (~7 tasks per sub-agent, whole phases — see [sub-agents.md](sub-agents.md)). Because a batch cut may only land on a phase boundary, a phase that is much larger than the budget forces an over-sized worker. Keep each phase from greatly exceeding the budget:

- If a phase would hold **more than ~10 tasks (≈1.5× the budget)**, split it into cohesive sub-phases at a genuine dependency/cohesion seam — not at an arbitrary task index.
- Only leave a phase over-sized when its tasks are one tight dependency chain that genuinely cannot be split. That is a legitimate (if fat) single-worker phase, not a smell.

This keeps phase boundaries meaningful while letting the packing hit its target worker count.

### 5. Validate Before Presenting (MANDATORY)

Before showing tasks to the user, run ALL three pre-approval checks. These are NOT optional — they are gates. If any check fails, restructure the tasks and re-run until all pass.

**Check 1: Task Granularity** — verify each task is atomic (see Granularity Check section).

**Check 2: Diagram-Definition Cross-Check** — verify the execution diagram matches every task's `Depends on` field (see Diagram-Definition Cross-Check section). Build the cross-check table and include it in the output.

**Check 3: Test Co-location Validation** — verify every task's `Tests` field matches the **Test Coverage Matrix** generated above (see Test Co-location Validation section). Build the validation table and include it in the output.

**Output both tables with the tasks** so the user can see the validation results. Any ❌ means you MUST restructure before presenting — do not show failing tasks to the user and ask them to approve.

**Note on the generated matrix:** The two sections (`Test Coverage Matrix`, `Gate Check Commands`) are provisional — generated from codebase sampling or user input and included in this file for user confirmation as part of task approval. They become authoritative once the user approves the tasks.

### 6. ASK About MCPs and Skills

**CRITICAL**: Before execution, ask the user:

> "For each task, which tools should I use?"
>
> **Available MCPs**: [list from project or user]
> **Available Skills**: [list from project or user]

---

## Template: `.specs/features/[feature]/tasks.md`

```markdown
# [Feature] Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/[feature]/design.md`
**Status**: Draft | Approved | In Progress | Done

---

<!-- The two sections below are generated by step 1.5 of the Tasks process and filled in during task creation. Do not manually populate them — they are produced by the agent from codebase sampling. -->

## Test Coverage Matrix

[Generated in step 1.5 — see process above]

## Gate Check Commands

[Generated in step 1.5 — see process above]

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation

Tasks that must be done first, in order.

```
T1 → T2 → T3
```

### Phase 2: Core Implementation

Builds on the foundation.

```
T4 → T5 → T6 → T7
```

### Phase 3: Integration

Bringing it all together.

```
T8 → T9
```

---

## Task Breakdown

### T1: [Create X Interface]

**What**: [One sentence: exact deliverable]
**Where**: `src/path/to/file.ts`
**Depends on**: None
**Reuses**: `src/existing/BaseInterface.ts`
**Requirement**: [FEAT]-01

**Tools**:

- MCP: `filesystem` (or NONE)
- Skill: NONE

**Done when**:

- [ ] Interface defined with all methods from design
- [ ] Types exported correctly
- [ ] No TypeScript errors

**Tests**: [unit/e2e/integration/none — from coverage matrix]
**Gate**: [quick/full/build — from gate check commands]

---

### T2: [Implement Y Service]

**What**: [Exact deliverable]
**Where**: `src/services/YService.ts`
**Depends on**: T1
**Reuses**: `src/services/BaseService.ts` patterns

**Tools**:

- MCP: `filesystem`, `context7`
- Skill: NONE

**Done when**:

- [ ] Implements interface from T1
- [ ] Handles error cases from design
- [ ] Gate check passes: `[quick gate command from the Gate Check Commands above]`
- [ ] Test count: [N] tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T3: [Create Z Component]

**What**: [Exact deliverable]
**Where**: `src/components/ZComponent.tsx`
**Depends on**: T1
**Reuses**: `src/components/BaseComponent.tsx`

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Component renders correctly
- [ ] Handles props from interface
- [ ] Follows existing component patterns
- [ ] Gate check passes: `[quick gate command from the Gate Check Commands above]`
- [ ] Test count: [N] tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T4: [Add A Feature to Y]

**What**: [Exact deliverable]
**Where**: `src/services/YService.ts` (modify)
**Depends on**: T2, T3
**Reuses**: Existing service patterns

**Tools**:

- MCP: `filesystem`, `github`
- Skill: `api-design`

**Done when**:

- [ ] Feature works per acceptance criteria
- [ ] Gate check passes: `[full gate command from the Gate Check Commands above]`
- [ ] Test count: [N] tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

**Commit**: `feat([scope]): [description]`

---

## Phase Execution Map

Visual representation of task ordering. Phases run in sequence, and tasks within a phase run in order:

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──→ T2 ──→ T3
Phase 2:  T4 ──→ T5 ──→ T6 ──→ T7
Phase 3:  T8 ──→ T9
```

Execution is strictly sequential — there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order.

**How phase-based execution works:**

At Execute, the agent counts total tasks and packs phases into **task-budgeted batches** (~7 tasks
per worker, whole phases — the benchmarked sweet spot is ~20 tasks → ~3 workers). A **phase** is the
semantic/dependency unit; a **batch** is one or more *consecutive whole phases* assigned to one
worker. The cut only ever lands on a phase boundary — a phase is never split across workers. When
packing yields more than one batch (> ~8 tasks), the agent offers to dispatch batch sub-agents.
Batches run sequentially: each worker executes ALL its tasks in order, then reports a compact summary
before the next batch starts. This right-sizes the worker count by workload instead of by phase
count (one-per-phase is too fragmented; expensive and slow). See [sub-agents.md](sub-agents.md) for
the full model — packing algorithm, offer-then-confirm, worker payload, compact summary contract,
failure handling, and context sizing guidance.

When the whole feature fits a single batch (≤ ~8 tasks), execution happens inline in the main window
with no sub-agents spawned.

**The orchestrating agent's role during Execute:**
1. Count total tasks and pack phases into ~7-task batches — offer batch sub-agents if that yields more than one batch and the user accepts
2. Dispatch the next batch (to a worker, or execute inline)
3. Receive the compact batch summary
4. Update tasks.md with results
5. If the batch summary shows all tasks complete: proceed to the next batch
6. If a task failed: decide fix/escalate before dispatching the next batch

---

## Task Granularity Check

Before approving tasks, verify they are granular enough:

| Task                            | Scope         | Status       |
| ------------------------------- | ------------- | ------------ |
| T1: Create email input          | 1 component   | ✅ Granular  |
| T2: Add validation function     | 1 function    | ✅ Granular  |
| T3: Create form with all fields | 5+ components | ❌ Split it! |
| T4: Connect to API              | 1 function    | ✅ Granular  |

**Granularity check**:

- ✅ 1 component / 1 function / 1 endpoint = Good
- ⚠️ 2-3 related things in same file = OK if cohesive
- ❌ Multiple components or files = MUST split

---

## Diagram-Definition Cross-Check

Before approving tasks, verify the execution diagram is consistent with the task definitions. These are independent artifacts that can drift — the diagram is drawn for visual clarity while task bodies are written for precision. Both must agree.

For each task, check:

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T[N] | [deps from body] | [deps from diagram arrows] | ✅ Match or ❌ Mismatch |

**Rules:**

- Every `Depends on` in a task body must have a corresponding arrow in the diagram.
- Every arrow in the diagram must correspond to a `Depends on` in the target task's body.
- A task must never depend on a task in a later phase — dependencies point backward or within the same phase only.

---

## Test Co-location Validation

Before approving tasks, verify EVERY task's `Tests` field is consistent with the **Test Coverage Matrix** generated above. This is a hard gate — tasks that fail this check MUST be fixed.

For each task, check: does the task create or modify a code layer that has a required test type in the coverage matrix? If yes, the task's `Tests` field MUST match.

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T[N]: [name] | [layer from coverage matrix] | [test type] | [task's Tests field] | ✅ OK or ❌ VIOLATION |

**Rules:**

- "Tested in another task" is NOT a valid justification for `Tests: none`. That is test deferral — the exact anti-pattern this validation prevents.
- `Tests: none` is only valid when the coverage matrix says "none" for that code layer.
- If a task creates MULTIPLE code layers (e.g., service + controller), use the HIGHEST test type required by any of them.
- Any ❌ VIOLATION → restructure the task to include its required tests before proceeding.

**Resolving compilation dependencies:**

When a task creates code that can't be tested until a later task completes (e.g., a controller that needs module wiring before its e2e tests can run), do NOT defer the tests to a separate task. Instead, restructure:

1. **Merge forward:** Move the untestable task's tests into the earliest task where they become runnable (e.g., the wiring task includes wiring + e2e tests for the controller it enables).
2. **Merge backward:** Absorb the blocking dependency into the current task so it becomes self-testable (e.g., controller task includes its own module registration).

Pick whichever option keeps tasks atomic and cohesive. The goal: no task produces unverified code. If code can't be tested in the task that creates it, the task boundaries are wrong.

---

## Tips

- **Phases are ordered** — Each phase completes before the next; tasks run in order within a phase
- **Reuses = Token saver** — Always reference existing code
- **Tools per task** — MCPs and Skills prevent wrong approaches
- **Dependencies are gates** — Clear what blocks what
- **Done when = Testable** — If you can't verify it, rewrite it
- **Requirement ID = Traceable** — Every task traces back to a spec requirement
- **One commit per task** — Plan the commit message format in advance

---

## Task Verification Standards

Every task MUST follow the `Done when` + `Tests` + `Gate` fields defined in the **Task Breakdown** template above. Each `Done when` entry must be specific, testable (binary pass/fail), and reference the gate check command from the `Gate Check Commands` section. Include the expected test count to prevent silent deletions.

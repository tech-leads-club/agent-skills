# Sub-Agent Delegation

Full mechanics for phase workers and the Verifier sub-agent used during Execute.

## Phase Workers

**Trigger:** When the execution plan has **more than 3 phases**, offer the user per-phase sub-agents before starting Execute. For 3 or fewer phases, execute inline in the main window — no sub-agents spawned.

**Offer-then-confirm (never auto-spawn):**

> "This feature has [N] phases. I can run one sub-agent per phase — each worker executes its full phase in order, reports a compact summary, and the orchestrator advances. This keeps the main window lean. Want to proceed that way?"

The user must explicitly accept. If they decline (or if the feature has ≤3 phases), execute inline.

**Execution model — one worker per phase, sequential:**

```
Phase 1 ──→ Phase Worker 1 ──→ compact summary ──→ orchestrator updates tasks.md
Phase 2 ──→ Phase Worker 2 ──→ compact summary ──→ orchestrator updates tasks.md
...
```

**What a phase worker receives:**

- The phase's task definitions (from `tasks.md`)
- The Test Coverage Matrix and Gate Check Commands (from `tasks.md`)
- `references/coding-principles.md`
- Relevant `spec.md` and `design.md` context for the feature (not all specs)

**What a phase worker does:**

Executes ALL tasks in its assigned phase **in order**, following the `implement.md` cycle for each task (implement → gate → atomic commit). It does NOT spawn further sub-agents for individual tasks — `[P]` marks tasks with no inter-task dependency (order-free within the phase) and is informational only; it is not a spawn directive. After completing all tasks in the phase, the worker reports a **compact summary** to the orchestrator:

```
Phase [N] complete:
- Tasks done: [list with commit hashes]
- Tests: [N passed, 0 failed]
- Deviations/blockers: [none | description]
```

No raw logs, no full test output — only the above fields keep the main context clean.

**No intra-phase nesting:** Phase workers execute their tasks themselves. They never spawn sub-sub-agents. Intra-phase parallelism is explicitly dropped for simplicity.

**The orchestrating agent's role during Execute:**

1. Assess phase count — offer sub-agents if >3 phases and user accepts
2. Dispatch the next phase to a worker (or execute inline if not using sub-agents)
3. Receive the compact summary
4. Update `tasks.md` with results
5. If all tasks in the summary show complete: proceed to the next phase
6. If a task failed: the worker has already stopped; decide fix/escalate before dispatching the next phase

**Failure handling:** If a task in a phase fails (gate does not pass, blocker hit), the worker stops and includes the failure in its summary. The next phase does not start until the current phase's summary shows all tasks complete. The orchestrator decides: fix and re-run, or escalate to the user.

**Context sizing signal:** If a single phase's task list would likely push the worker's context beyond ~40k tokens, that signals the phase should be split into smaller phases — use the granularity guidance in `references/tasks.md`.

---

## Verifier Sub-Agent

**Always-on, never prompted — one per feature completion.** The Verifier is a separate role from the phase worker. It runs once — after the last task of the feature is committed — as an independent quality gate, dispatched automatically by the orchestrator. It is **not** gated behind the >3-phase offer; it always runs. Do NOT ask the user whether to run validation; it is mandatory.

**Author ≠ verifier:** The agent (or phase worker) that wrote the code and tests is the author. The Verifier is a fresh sub-agent dispatched by the orchestrator after the final commit. It does not inherit the author's context, mental model, or assumptions. This separation is what makes the gate trustworthy.

**What the Verifier receives:**
- `spec.md` for the feature (ACs = source of truth)
- The git diff surface for the feature (scoped to the feature branch or commit range)
- The test files in scope
- `references/validate.md` as its operating checklist

**What the Verifier does (full process in `validate.md`):**
1. **Spec-anchored coverage check** — re-derives coverage evidence-or-zero: every AC traced to `file:line` + assertion expression. For each covered criterion, confirms the test's asserted value matches the **spec-defined expected outcome** (not just that an assertion exists). Where the spec does not define a precise outcome, flags a **spec-precision gap** rather than passing silently.
2. **Discrimination sensor** — injects a small behavior-level fault (flip a condition, change a return value, off-by-one, remove a required side effect) in a **scratch/throwaway state** (git stash or temp copy), runs the relevant tests, confirms they FAIL (kill the mutant), then discards the mutation. Tiered by risk: lightweight (1–3 mutations) for standard features; expanded (≥5 mutations or full mutation tooling) for P0/critical paths. Surviving mutants become fix tasks.
3. Applies the **payload/conjunction rule**: checks payload fields are asserted on value/state, not just that the call occurred.
4. **Writes the persisted report** to `.specs/features/[feature]/validation.md` — PASS/FAIL, per-AC evidence (`file:line` + assertion + spec outcome), sensor result (killed/survived per mutation), gate exit results, diff/commit range.
5. **Returns a compact verdict in chat** to the orchestrator.
6. Does **NOT** write, modify, or fix any code or tests — the real working tree is never mutated (sensor mutations run in scratch state only).

**What the Verifier reports back (compact chat format):**
```
## Validation: [feature name] — [PASS ✅ | FAIL ❌]

**Spec-anchored check**: [N/N ACs matched spec outcome | M spec-precision gaps flagged]
**Gate**: [X passed, 0 failed]
**Sensor**: [N mutations injected, N killed, N survived]
**Report**: `.specs/features/[feature]/validation.md`

**Ranked gaps** (if FAIL):
1. [Gap description] — [AC or criterion] — [file:line or "no evidence"]
2. ...
```

**Failure handling:** The orchestrator routes the ranked gaps to an implementer as fix tasks, then re-dispatches the Verifier. This fix→re-verify loop is bounded to a maximum of **3 iterations**. If gaps remain after 3 iterations, escalate to the user.

**Standalone fallback:** When running without sub-agents (a single agent executing the full feature), run `validate.md` as an independent fresh-eyes pass — re-read `spec.md` and the diff from scratch, apply evidence-or-zero, run the spec-anchored check and discrimination sensor, write the report file, and report PASS/FAIL before marking the feature done.

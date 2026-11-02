# Sub-Agent Delegation

Full mechanics for phase-batch workers and the Verifier sub-agent used during Execute.

## Phase-Batch Workers

**Two layers - keep them distinct:**

- **Phase** = the semantic / dependency unit (Foundation → Core → Integration), authored during Tasks. Indivisible.
- **Batch** = the execution / logistics unit - one or more *consecutive whole phases* assigned to a single worker.

Conflating the two (one worker per phase) is what fragments execution: a feature's dependency-layer count has nothing to do with the ideal per-worker workload. Batching by task budget separates the two concerns without breaking phases.

**Trigger:** Count total tasks across all phases. If the feature packs into **more than one batch** (> ~8 tasks), offer the user phase-batch sub-agents before starting Execute. If it fits a single batch (≤ ~8 tasks), execute inline in the main window - no sub-agents spawned.

**Batching algorithm (task budget ≈ 7 tasks/worker, phase-aligned):**

The benchmarked sweet spot is ~7 tasks of context per worker (~20 tasks → 3 workers). Pack whole phases into that budget:

1. Count total tasks `T`.
2. If `T ≤ ~8` → inline, no sub-agents.
3. Otherwise walk phases **in order**, accumulating whole phases into the current batch. When the batch's running task count reaches ~7 **and** phases remain, close the batch and start the next.
4. **Never split a phase** across workers - the cut only ever lands on a phase boundary. This preserves dependency ordering and keeps a phase's tasks + shared context in one worker.
5. If the final batch is a lone tail (1-2 tasks), fold it into the previous batch.

Result ≈ `ceil(T / 7)` workers, scaling linearly. Unevenness is absorbed by greedy packing - phases never need to divide evenly. Worked examples (20 tasks):

- Phases `[3,3,3,3,4,4]` → `{P1+P2=6, P3+P4=6, P5+P6=8}` = **3 workers**
- Phases `[8,2,2,8]` → `{P1=8, P2+P3=4, P4=8}` = **3 workers** (no even split needed)
- Phases `[5,5,5,5]` → `{P1+P2=10, P3+P4=10}` = **2 workers** (phases too coarse to hit 3 - see below)

**Coarse-phase caveat:** Because the cut lands only on phase boundaries, very coarse phases limit how finely you can pack. If a single phase alone exceeds ~1.5× the budget (~10+ tasks), that is a Tasks-authoring smell - split it into real sub-phases during Tasks (at a genuine dependency/cohesion boundary), never at dispatch time.

**Offer-then-confirm (never auto-spawn):**

> "This feature has [T] tasks across [N] phases. I can pack them into [K] sub-agents (~7 tasks each, whole phases per worker) - every worker runs its phases in order, reports a compact summary, and the orchestrator advances to the next batch. This keeps the main window lean without over-fragmenting. Want to proceed that way?"

The user must explicitly accept. If they decline (or if the feature fits one batch), execute inline.

**Execution model - one worker per task-budgeted batch, sequential:**

```
Phases 1+2 (7 tasks)  ------→ Batch Worker 1 ------→ compact summary ------→ orchestrator updates tasks.md
Phases 3+4 (6 tasks)  ------→ Batch Worker 2 ------→ compact summary ------→ orchestrator updates tasks.md
Phase 5    (7 tasks)  ------→ Batch Worker 3 ------→ compact summary ------→ orchestrator updates tasks.md
...
```

Batches run strictly sequentially: a batch never starts until the previous batch's summary shows all its tasks complete.

**What a batch worker receives:**

- The task definitions for **every** phase in its batch (from `tasks.md`)
- The Test Coverage Matrix and Gate Check Commands (from `tasks.md`)
- `references/coding-principles.md`
- Relevant `spec.md` and `design.md` context for the feature (not all specs)

**What a batch worker does:**

Executes ALL tasks in its assigned batch **in order** - finishing every task in one phase before starting the next phase in the batch - following the `implement.md` cycle for each task (implement → gate → atomic commit). It does NOT spawn further sub-agents. After completing all tasks in the batch, the worker reports a **compact summary** to the orchestrator:

```
Batch (phases [N]-[M]) complete:
- Tasks done: [list with commit hashes]
- Tests: [N passed, 0 failed]
- Deviations/blockers: [none | description]
```

No raw logs, no full test output - only the above fields keep the main context clean.

**No nesting:** Batch workers execute their tasks themselves. They never spawn sub-sub-agents. Execution is strictly sequential within and across batches - there is no intra-phase or intra-batch parallelism.

**The orchestrating agent's role during Execute:**

1. Count total tasks and pack phases into task-budgeted batches (~7 tasks each) - if that yields more than one batch, offer batch sub-agents and wait for the user to accept
2. Dispatch the next batch to a worker (or execute inline if not using sub-agents), written on tasks.md's `**Dispatched:**` line first
3. Receive the compact summary
4. Update `tasks.md` with results
5. If all tasks in the summary show complete: dispatch the next batch
6. If a task failed: the worker has already stopped; decide fix/escalate before dispatching the next batch

**Failure handling:** If a task in a batch fails (gate does not pass, blocker hit), the worker stops and includes the failure in its summary. The next batch does not start until the current batch's summary shows all tasks complete. The orchestrator decides: fix and re-run, or escalate to the user.

**Context sizing signal:** If a batch's task list would likely push the worker's context beyond ~40k tokens, close the batch at an earlier phase boundary (fewer phases per worker). If a *single* phase alone would blow the budget, that phase is too coarse - split it during Tasks per the granularity guidance in `references/tasks.md`.

---

## Verifier and screens sub-agent

**Always-on, never prompted - once per feature.** After the last task is committed, the orchestrator
runs `check_proofs.py`, then dispatches two fresh sub-agents in parallel over the same `HEAD`: the
Verifier ([validate.md](validate.md)) and, when a criterion cites a capture, the screens sub-agent
([verify-screens.md](verify-screens.md)). Neither is a batch worker, neither is the author, and
neither fixes anything. A batch worker never dispatches either. Each dispatch goes on tasks.md's
`**Dispatched:**` line before it is sent; an orchestrator that finds one there with no report on disk
waits for it rather than sending another.

**What they receive:** the Verifier gets `spec.md`, tasks.md, `proofs.md`, the diff range and
`validate.md`; the screens sub-agent gets `spec.md`, the captures, the `**Walked:**` line and
`verify-screens.md`. Neither gets the author's reasoning.

**What comes back:** the Verifier writes `verification.md` (verdict, a `## Checks` row judging each
check's test, a findings table with a `Closed` column); the screens sub-agent writes
`screens.md` (a verdict per picture and one inventory each). Both return their findings in chat.

**Failure handling:** every finding is fixed in one pass, then `check_proofs.py` runs again and the
screens sub-agent re-opens only the rows that differed, writing `**Round**: 2`. There is no second
Verifier and no third round: what still fails goes to the user. The gate is
`python3 <skill-dir>/scripts/validate_verification.py <feature>`.

**Standalone fallback:** without sub-agents, run each file in a new session and write
`self-verified (degraded - no sub-agent)` in its report; the gate warns.

---

## Model Tier per Role

**Applies only if the harness can assign a model per sub-agent.** If it cannot, ignore this section and run everything on the default model - the workflow is correct either way. The point is to spend high-reasoning capacity where ambiguity and consequence are high, and a faster tier where the work is mechanical, instead of paying top-tier cost uniformly.

Judge the tier by the work in front of the role, not by the role's title:

| Role / work | Characteristic | Suggested tier |
| ----------- | -------------- | -------------- |
| Design phase | High ambiguity, hard-to-reverse structural decisions | High-reasoning |
| Batch worker - core-domain or high-ambiguity phase | Non-obvious logic, tricky edge cases, novel integration | High-reasoning |
| Batch worker - mechanical phase | Entities, DTOs, config, wiring, straightforward CRUD against a settled pattern | Faster / cheaper |
| Verifier | Adversarial reasoning: judges each check's test against its criterion, designs own examples | Mid-to-high |
| Specify / Tasks authoring | Structured but judgment-heavy | Mid-to-high |

**Rules of thumb:**

- When unsure, size up, not down. An under-powered worker on ambiguous logic produces gaps the Verifier then has to catch - more expensive than paying for reasoning once.
- The Verifier is never the cheapest tier; a weak Verifier defeats the author ≠ verifier gate.
- Set the tier per batch, from that batch's phases. A feature can mix tiers across batches.
- This is advisory metadata only. No gate, commit, or verification step depends on it.

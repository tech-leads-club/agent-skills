# Sub-Agent Delegation

How Execute uses batch workers, and how the plan reviewer, the Verifier and the screens sub-agent run.

## Batch Workers

**Two units, kept apart.** A **phase** is the dependency unit, written in Tasks, and it is never split. A **batch** is the execution unit: one or more whole phases, in order, given to one worker.

**The packing is a script.** Run `python3 <skill-dir>/scripts/plan_batches.py <feature>`. It reads the phases from tasks.md and prints the batches. Nobody redoes the arithmetic by hand.

- 8 tasks or fewer: one batch, run inline, with no sub-agent offer.
- Otherwise it walks the phases in order. It adds the next phase when that keeps the batch as close to 7 tasks as before, or closer. Else it closes the batch first.
- A last batch of 1 or 2 tasks joins the batch before it.

| Phases | Batches |
| --- | --- |
| 3, 3, 3, 3, 4, 4 | 6, 6, 8 |
| 8, 2, 2, 8 | 8, 4, 8 |
| 5, 5, 5, 5 | 5, 5, 5, 5 |

A phase over 10 tasks fails `validate_tasks.py`. Split it at a real dependency seam during Tasks, never at dispatch time.

**Offer, then confirm. Never spawn without a yes.** With more than one batch, show the script's output and ask:

> "This feature has [T] tasks in [N] phases. The script packs them into [K] batches of whole phases. Each worker runs its tasks in order and reports a short summary before the next batch starts. Run it this way?"

When the user declines, or the feature fits one batch, run inline.

**What a worker receives:** the task definitions of every phase in its batch. It also gets the Test Coverage Matrix and the Gate Check Commands. It gets [coding-principles.md](coding-principles.md) and the spec and design parts it needs.

**What a worker does:** it runs every task of its batch in order. Each task goes through the full cycle in [implement.md](implement.md). It never spawns a sub-agent. Then it reports:

```
Batch (phases [N]-[M]) complete:
- Tasks done: [list with commit hashes]
- Tests: [N passed, 0 failed]
- Deviations or blockers: [none | description]
```

No raw logs and no full test output reach the main context.

**The orchestrator** writes each dispatch on the `**Dispatched:**` line before it sends it. It waits for the summary and updates tasks.md. It starts the next batch only when every task of this one is done. When a task failed, the worker has already stopped, and the orchestrator decides to fix or to ask the user.

## Plan Reviewer

It runs once per feature that has a `design.md`, before Tasks, and nobody needs to ask for it. It reads the plan with no chat, checks every claim against the code, and writes `review.md`. It fixes nothing. [review.md](review.md) holds the brief, the inputs and the resolution rules.

## Verifier and Screens Sub-Agent

**They run once per feature, always, and nobody needs to ask for them.** After the last commit, the orchestrator runs `check_proofs.py`. Then it sends two fresh sub-agents in parallel over the same `HEAD`. The Verifier gets [validate.md](validate.md). The screens sub-agent gets [verify-screens.md](verify-screens.md) when a criterion cites a capture. Neither is a batch worker or the author, and neither fixes anything.

**What they receive.** The Verifier gets `spec.md`, tasks.md, `proofs.md`, the diff range and `validate.md`. The screens sub-agent gets `spec.md`, the captures, the `**Walked:**` line and `verify-screens.md`. Neither gets the author's reasoning.

**What comes back.** The Verifier writes `verification.md`: its verdict, a row judging each check's test, and findings with a `Closed` column. The screens sub-agent writes `screens.md`: a verdict and an inventory per picture.

**Failure handling.** Every finding is fixed in one pass. Then `check_proofs.py` runs again, and the screens sub-agent reopens only the rows that differed, with `**Round**: 2`. There is no second Verifier and no third round. What still fails goes to the user. The gate is `python3 <skill-dir>/scripts/validate_verification.py <feature>`.

**Without sub-agents.** Run each file in a new session, and write `self-verified (degraded - no sub-agent)` in its report. The gate warns.

## Model Tier per Role

This applies only when the harness assigns a model per sub-agent. When it cannot, run everything on the default model, and the workflow stays correct. Spend reasoning where ambiguity and consequence are high. Use a faster tier where the work is mechanical.

| Role | Work | Tier |
| --- | --- | --- |
| Design | High ambiguity, structural decisions that are hard to reverse | High-reasoning |
| Batch worker, core-domain phase | Logic that is not obvious, tricky edge cases, a new integration | High-reasoning |
| Batch worker, mechanical phase | Entities, DTOs, config, wiring, plain CRUD on a settled pattern | Faster |
| Plan reviewer | Reads the plan with no chat and checks each claim against the code | Mid to high |
| Verifier | Judges each check's test against its criterion and tries its own examples | Mid to high |
| Specify and Tasks | Structured work that needs judgement | Mid to high |

- When unsure, size up. A weak worker on ambiguous logic leaves gaps the Verifier must then catch.
- The plan reviewer and the Verifier are never the cheapest tier. A weak reader defeats the author ≠ reviewer gate.
- Set the tier per batch, from its phases.
- This is advice only. No gate depends on it.

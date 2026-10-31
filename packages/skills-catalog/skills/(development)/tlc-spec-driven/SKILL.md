---
name: tlc-spec-driven
description: Feature planning and implementation with 4 adaptive phases (Specify, Design, Tasks, Execute). Auto-sizes depth by complexity. Asks every product decision before the spec is approved, writes testable requirements in EARS notation, atomic tasks with a gate and a commit each, and one check per criterion with the test that proves it. Captures that come with the request bind, and each screen is judged against them. Ships deterministic Python scripts so the gates are enforced by code, not memory; the project's own tests run once at the end, and an independent Verifier (author != verifier) judges each check's test. Use when (1) planning features, (2) implementing with verification and atomic commits, (3) validating an implementation against a spec. Triggers on "specify feature", "discuss feature", "design", "tasks", "implement", "validate", "verify work", "UAT", "record decision", "pause work", "resume work". Do NOT use for pure architecture decomposition analysis or standalone technical design documents.
license: CC-BY-4.0
metadata:
  author: Felipe Rodrigues - github.com/felipfr
  version: 5.0.0
---

# Tech Lead's Club - Spec-Driven Development

Plan and implement features with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ EXECUTE │
└──────────┘   └──────────┘   └─────────┘   └─────────┘
   required      optional*      optional*     required

* Agent auto-skips when scope doesn't need it
```

## Critical Rules (read before acting)

**Loading this skill's files.** Reference files live under `references/` in this skill's own directory (where this `SKILL.md` resides). Resolve them relative to the skill directory, never the workspace root. When a step tells you to read a reference, read it to the end before acting.

**Running this skill's scripts.** Every `scripts/*.py` lives under that same skill directory: run `python3 <skill-dir>/scripts/<name>.py ...`, never `python3 scripts/...` from the project root. Project data under `.specs/` is read and written relative to the project root (pass `--root` when the cwd is elsewhere). Run a script rather than read it: its messages say what to change. On Windows, where `python3` may be the Microsoft Store alias, run `python` or `py -3`.

**Execution contract - every task, non-negotiable (holds even if you do not open the reference files):**

1. **Ask, then stop for approval.** Every gray area that is the user's - scope, product behaviour, a departure from a binding source - is asked before the spec is presented; an assumption never stands in for one. Approving the spec and approving the tasks are the two stops for a human. When nobody is there to answer, end your turn with the questions. Each approval is written as `**Approved**: <date> - user: "<their words>"` in spec.md and tasks.md; one the user did not give is never written. Every answer goes into its file in the turn it arrives - the chat does not survive a compaction.
2. Tests derive from the spec's acceptance criteria and assert spec-defined outcomes - they never mirror the implementation.
3. The gate must pass before a task is done - the test runner decides, not self-assessment. One atomic commit per task, with `tasks.md` marked complete before it - and inside it when the repo tracks `.specs/`; where the repo ignores `.specs/`, the commit holds only the code and its tests, and never forces them in. Never batch tasks; never weaken, skip, or delete tests to make them pass.
4. **Every criterion has a check, and every check a proof.** tasks.md `## Checks` holds one claim per criterion with the project's own test command that selects its test - tests that run together share one `**Run <name>**:` line, and each check names the line its test prints (`Proof: run <name> | <line>`). After the LAST task, `check_proofs.py` runs each group and lone proof once at `HEAD`, one at a time, with the build; then a fresh **Verifier** (author ≠ verifier) runs **always**, never prompted - it judges whether each check's test would fail if the claim were false, tries examples nobody named, and finds assertions looser than their criterion. Done means every finding is closed by a commit and `validate_verification.py` exits 0.
5. **A screen is held to its design.** A capture that comes with the request binds unless the user called it inspiration; its criterion cites the capture file. Each state a capture draws is saved as `captures/<capture>.running.png` from a browser window at the capture's size - an image resized afterwards shows another layout - and a fresh screens sub-agent retakes and judges it ([verify-screens.md](references/verify-screens.md)).
6. **Where rules run.** Every rule that changes what a user sees - including filtering, searching, sorting and counting - runs in a layer the repo's tests reach.
7. **Blast radius:** approving a spec or tasks authorizes local implementation and local commits only. `git push`, force-push, deploy, production DB changes, and other remote or destructive operations need an explicit go-ahead for that action.

**Deterministic gates run before human review - not from memory.** A non-zero exit means STOP and fix:

| When | Command |
| --- | --- |
| Before presenting the spec | `validate_spec.py <feature>` - EARS criteria, filled assumptions, requirement IDs, and with captures: binding or quoted, cited, shown, departures approved |
| Before presenting the tasks | `validate_tasks.py <feature>` - granularity, dependencies, `Tests` and `Gate` per task, `## Checks` with a proof each, `**Build**:`, a `Run` line and an expected line for each `run` proof |
| Before the first task | `validate_tasks.py <feature> --execute` - the same checks, and the spec and tasks each approved in the user's words |
| Before each commit | `check_commit.py --message "<msg>"` |
| After the last task, and after the fix | `check_proofs.py <feature>` - writes `proofs.md` |
| Before declaring the feature done | `validate_verification.py <feature>` - proofs green at `HEAD`, clean tree, a `## Checks` row judging each check, findings closed, pictures judged in round 1 or 2, walk logged, both approvals written |
| After editing a script or a template | `selftest.py` |

Skip a script only when no code-execution tool is available; then perform the same checks by reading the artifact.

**Before Execute:** read [implement.md](references/implement.md) completely and run `validate_tasks.py <feature> --execute`, which also requires both approvals in the user's words; if a formal `tasks.md` packs into more than one task-budgeted batch (> ~8 tasks), present the sub-agent offer first (see Sub-Agent Delegation).

## Auto-Sizing: The Core Principle

**The complexity determines the depth, not a fixed pipeline.** Before starting any feature, assess its scope and apply only what's needed:

| Scope       | What                     | Specify                                                 | Design                                          | Tasks                         | Execute                                               |
| ----------- | ------------------------ | ------------------------------------------------------- | ----------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| **Small**   | ≤3 files, one sentence   | One-liner spec (inline)                                 | Skip                                            | Skip                          | Implement + verify inline                             |
| **Medium**  | Clear feature, <10 tasks | Spec (brief)                                            | Skip - design inline                            | Skip - tasks implicit         | Implement + verify                                    |
| **Large**   | Multi-component feature  | Full spec + requirement IDs                             | Architecture + components                       | Full breakdown + dependencies | Implement + verify per task                           |
| **Complex** | Ambiguity, new domain    | Full spec + [discuss gray areas](references/discuss.md) | [Research](references/design.md) + architecture | Breakdown + phase plan        | Implement + [interactive UAT](references/validate.md) |

**Rules:**

- **Specify and Execute are always required** - you always need to know WHAT and DO it
- **Design is skipped** when the change is straightforward (no architectural decisions, no new patterns)
- **Tasks is skipped** when there are ≤3 obvious steps (they become implicit in Execute); the checks then go in a `## Checks` section at the end of `spec.md`
- **Discuss is triggered within Specify** when the agent detects gray areas that need user input, or when the feature has any implicit-requirement dimension present (persistence/state, external calls, auth, payments, concurrency, state transitions)
- **Interactive UAT is triggered within Execute** only for user-facing features with complex behavior

**Safety valve:** Even when Tasks is skipped, Execute ALWAYS starts by listing atomic steps inline (see [implement.md](references/implement.md)). If that listing reveals >5 steps or complex dependencies, STOP and create a formal `tasks.md` - the Tasks phase was wrongly skipped.

## .specs Structure

```
.specs/
├── STATE.md            # Project memory: Decisions log (AD-NNN) + Handoff snapshot
├── LESSONS.md          # Self-improving lessons playbook (rendered by scripts/lessons.py - do not hand-edit)
├── lessons.json        # Canonical lessons state (machine-owned)
└── features/
    └── [feature]/
        ├── spec.md          # Requirements with traceable IDs, Differences from the source, Sources
        ├── captures/        # binding design files, and <capture>.running.png pictures
        ├── context.md       # User decisions for gray areas (only when discuss is triggered)
        ├── design.md        # Architecture & components (only for Large/Complex)
        ├── tasks.md         # Atomic tasks, ## Checks with a proof each, ## Handoff
        ├── proofs.md        # written by check_proofs.py: every proof at HEAD, and each run's output
        ├── screens.md       # the screens sub-agent's inventory and verdict, per picture
        └── verification.md  # the Verifier's judgement of each check, and its findings closed by commits
```

**Create artifacts lazily.** Write each file only when its phase produces content - never scaffold empty `context.md`, `design.md`, or `tasks.md` up front. Absence is the correct state for a skipped phase.

## Workflow

**New feature:**

1. Specify → (Design) → (Tasks) → Execute (depth auto-sized)

**Resume work - a new session, or after a compaction:**

1. Re-read this file, then the reference for the phase the files show. A summary keeps the task, not these rules.
2. Read `.specs/STATE.md` Decisions and the feature's files - `spec.md` and `tasks.md` (their `**Approved**:` lines, marks and `## Handoff`), `proofs.md`, `verification.md`, `screens.md` - and reconcile them against git: evidence wins over a note. Where each file puts you: [memory.md](references/memory.md).
3. After a compaction in the middle of a run, continue when the files and git agree; stop only on a conflict. In a new session, propose the reconciled next step before writing code.

## Context Loading Strategy

Load only what the current step needs:

- `.specs/STATE.md` - Decisions section (read at Specify and Design, re-read on resume); Handoff section (read on resume only)
- confirmed lessons - load at Specify and Design via `python3 <skill-dir>/scripts/lessons.py list --status confirmed` ([lessons.md](references/lessons.md)); confirmed only, never candidates
- spec.md, context.md, design.md, tasks.md - when the step works from them

Never load several feature specs or several architecture docs at once.

## Sub-Agent Delegation

**Trigger:** count total tasks. If the feature packs into more than one task-budgeted batch (> ~8 tasks) → offer sub-agents; if it fits a single batch (≤ ~8 tasks) → execute inline.

**Offer-then-confirm** - never auto-spawn. The user must accept before any batch worker is dispatched.

**One worker per task-budgeted batch (~7 tasks, whole phases):** Phases stay the semantic/dependency unit; a **batch** is the execution unit - one or more *consecutive whole phases* packed to ~7 tasks. Walk phases in order, accumulate whole phases into the current batch until it reaches the budget, then start the next - **never split a phase** across workers. Each worker executes all its tasks in order (implement → gate → atomic commit), then reports a compact summary (tasks done, commit hashes, test counts, deviations). Batches run sequentially. Workers never spawn further sub-agents.

**Verifier and screens sub-agent (always-on, never prompted):** after the final task, the orchestrator runs `check_proofs.py`, then dispatches both in parallel over the same `HEAD` - the Verifier with [validate.md](references/validate.md), the screens sub-agent with [verify-screens.md](references/verify-screens.md) when a criterion cites a capture. Each dispatch - batch workers included - is written on the `**Dispatched:**` line of tasks.md `## Handoff` before it is sent, so a compacted orchestrator waits instead of sending a second. Every finding is fixed in one pass; round 2 is `check_proofs.py` again and the screens sub-agent on the rows that differed, with `**Round**: 2` in screens.md. No second Verifier and no third round; what still fails goes to the user. Then the gate, then lessons ([lessons.md](references/lessons.md)).

**Model tier per role** (only if the harness supports choosing a model per sub-agent): mechanical batches on a faster tier, core-domain batches and Design on a high-reasoning tier, the Verifier mid-to-high. Rubric in [sub-agents.md](references/sub-agents.md).

**Standalone fallback:** without sub-agents, run `validate.md` and `verify-screens.md` each in a new session after the final commit and write `self-verified` in the report; the gate warns.

## Commands

**Feature-level (auto-sized):**
| Trigger Pattern | Reference |
|----------------|-----------|
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Discuss feature, capture context, how should this work | [discuss.md](references/discuss.md) |
| Design feature, architecture | [design.md](references/design.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build, execute | [implement.md](references/implement.md) |
| Validate, verify, test, UAT, walk me through it | [validate.md](references/validate.md) |
| Judge the screens against the design | [verify-screens.md](references/verify-screens.md) |

**Memory:**
| Trigger Pattern | Reference |
|----------------|-----------|
| Record decision, this is a project-level decision | [memory.md](references/memory.md) |
| Pause work, end session, I need to stop | [memory.md](references/memory.md) |
| Resume work, continue, pick up where we left off | [memory.md](references/memory.md) |
| Load lessons, what have we learned, apply past lessons | [lessons.md](references/lessons.md) |
| Record lesson, distill lessons (runs after the gate) | [lessons.md](references/lessons.md) |

## Knowledge

Facts you look up, decisions you ask. Look in the codebase and its conventions first, then the project docs and `.specs/STATE.md`, then library documentation, then the web. Never invent an API, a pattern or a behaviour: "I could not find documentation for this" beats a plausible fabrication, and anything you could not confirm is said to be uncertain.

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8+ (standard library only) | every script | the gates do not run; the phases still apply |
| git | `check_proofs.py` (HEAD, clean tree) | no HEAD check: say so in the report |
| Git for Windows (on Windows) | `check_proofs.py` runs proofs in its bash, because proofs are POSIX shell | proofs run in `cmd.exe` and the script warns |
| sub-agents | batch workers, the Verifier and the screens sub-agent | run inline; verify in a new session and write `self-verified` |
| a model that reads images | binding captures and the screens sub-agent | ask the user to describe each state; hand the pictures to the user |
| a browser the agent can drive | the walk and the pictures | hand the steps to the user |

Test runners: none is built in. `check_proofs.py` runs the commands tasks.md names as the project runs them, one at a time, with no timeout; a run's own parallelism is whatever the project configured ([tasks.md](references/tasks.md)).

## Output Behavior

**Do the work; do not narrate the machinery.** Produce the right artifact for the phase instead of announcing the phase. The user judges the output.

**Write generated artifacts in a plain, decided voice.** Specs, decisions, reports, commit messages and chat summaries follow the writing rules in [coding-principles.md](references/coding-principles.md): lead with the verdict, state decisions definitively, cut filler and hedging. Section headings stay in English; prose follows the project; identifiers are never translated.

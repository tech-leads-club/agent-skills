---
name: tlc-spec-driven
description: Feature planning and implementation in 4 adaptive phases (Specify, Design, Tasks, Execute), sized by the spec itself. Asks every product decision before the spec is approved, writes one EARS criterion per ID, and has a fresh reviewer read the plan before any task. Each task is one test cycle with its files, a gate and a commit the gates measure again. Every criterion has a check with the test that proves it. Captures bind. Deterministic Python gates enforce the rules by code, not memory; the project's tests run once at the end, and an independent Verifier (author != verifier) judges each check's test. Use when (1) planning features, (2) implementing with verification and atomic commits, (3) validating an implementation against a spec. Triggers on "specify feature", "discuss feature", "design", "tasks", "implement", "validate", "verify work", "UAT", "record decision", "pause work", "resume work". Do NOT use for pure architecture decomposition analysis or standalone technical design documents.
license: CC-BY-4.0
metadata:
  author: Felipe Rodrigues - github.com/felipfr
  version: 5.0.0
---

# Tech Lead's Club - Spec-Driven Development

Plan and implement features with precision. Scripts hold every rule they can. Prose holds only judgement.

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ EXECUTE │
└──────────┘   └──────────┘   └─────────┘   └─────────┘
   required      Large and     Large and      required
                 Complex       Complex
```

## Critical Rules (read before acting)

**Loading this skill's files.** Reference files live under `references/` in this skill's own directory. Resolve them from the folder that holds this `SKILL.md`, never from the workspace root. When a step names a reference, read all of it before you act.

**Running this skill's scripts.** Run each script as `python3 <skill-dir>/scripts/<name>.py`. Never run `python3 scripts/...` from the project root. The scripts read `.specs/` from the project root, so pass `--root` when the working directory is elsewhere. Run a script instead of reading it: its messages say what to change. On Windows, run `python` or `py -3` when `python3` is the Microsoft Store alias.

**Execution contract. It holds for every task, even when you do not open the references:**

1. **Decide what is yours. Ask what is the user's.** Only three things stop you:
   - A product decision: scope, behaviour, or a departure from a binding source.
   - An action you cannot undo, or one that leaves this machine.
   - A dead end: a gate exits 3.
   - You decide everything else and record the default as an assumption.
   - You ask all open questions together, once, with your recommendation first. When nobody is there to answer, end your turn with the questions.
   - Approving the spec and approving the tasks are the two stops for the user. When the user approves, `approve.py` writes their words and a hash of the file. You never stamp words the user did not give.
   - A later change to the spec goes back to the user. A later change to the tasks is recorded with `approve.py --amend`, in a commit of its own.
   - Write every answer into its file in the turn it arrives. The chat does not survive a compaction.
2. **The plan is read cold before it is built.** A feature with a `design.md` gets one fresh sub-agent that never saw the chat. It paraphrases the plan and reports what it cannot follow, what contradicts the code, and what nobody decided. The author resolves each finding as fixed, contested with a file the reviewer could read, or escalated to the user. There is one round. A review in the author's context is not a review ([review.md](references/review.md)).
3. **Tests derive from the criteria.** They assert the outcome the spec defines. They never mirror the implementation.
4. **One task is one test cycle and one commit.** The gate passes before the task is done, so the test runner decides. `tasks.md` marks the task complete in the same commit when the repo tracks `.specs/`. `check_commit.py` measures each commit against its task: its files, its tests, its size. It refuses a test deleted without a `Delete:` line, a skip marker, a bare suppression and a lost assertion. It also refuses a commit that changes an approved file.
5. **Every criterion has a check, and every check a proof.** Each check cites its criterion IDs and names the project's own test command. Tests that run together share one `**Run <name>**:` line. After the last task, `check_proofs.py` runs every proof once at `HEAD`, with the build.
   - Then a fresh **Verifier** (author ≠ verifier) always runs. It judges whether each check's test would fail if the claim were false. It also tries examples nobody named.
   - Done means every finding is closed by a commit and `validate_verification.py` exits 0.
6. **A screen is held to its design.** A capture that comes with the request binds, unless the user called it inspiration. Its criterion cites the capture file. Each state a capture draws is saved as `captures/<capture>.running.png` from a browser window at the capture's size. A fresh screens sub-agent judges each picture ([verify-screens.md](references/verify-screens.md)).
7. **Where rules run.** A rule that changes what a user sees runs in a layer the repo's tests reach. Filtering, searching, sorting and counting are such rules.
8. **Blast radius.** An approval covers local implementation and local commits only. `git push`, force-push, deploy and production data changes each need their own go-ahead.

**Deterministic gates run before the user reviews anything.** A non-zero exit means stop and fix:

| When | Command |
| --- | --- |
| Before you present the spec | `validate_spec.py <feature>`: scope against size, one ID and one SHALL per criterion, EARS order, vague words, the sweep, captures |
| Before the plan review | `validate_design.py <feature>` checks every path and symbol the design cites. It also checks the approach in the user's words, and what breaks it |
| Before you present the tasks | `validate_tasks.py <feature>`: task shape and size, test cycle, matrix, each file's life across tasks, trace both ways. Then proofs, the closed plan review and every design location built |
| When the user approves the spec or the tasks | `approve.py <feature> spec --user "<their words>"`, or `tasks`, stamps the approval with the file's hash. It refuses a file its gate fails |
| Before the first task, at any scope | `validate_tasks.py <feature> --execute` adds both approvals, each matching its file, no open question, and a green `**Build**:` line |
| Before each commit | `check_commit.py --message "<msg>"` checks the message and the staged diff of the task the commit closes |
| When `.specs/STATE.md` changes | `validate_state.py` checks the decision log. `check_commit.py` runs it on a staged STATE.md |
| After the last task, and after the fix | `check_proofs.py <feature>` writes `proofs.md` |
| Before you declare the feature done | `validate_verification.py <feature>` checks proofs, findings, pictures, the walk and both approvals |
| After you edit a script, a template or any file of this skill | `selftest.py` runs every gate case and the writing rules |

Exit 3 means the gate failed twice in a row with the same errors. Stop there. Write `**Blocked:**`, `**Tried:**` and `**Need:**` in the Handoff, then tell the user. Skip a script only when no code-execution tool exists. Then perform the same checks by reading the artifact.

## Sizing: The Spec Sets the Depth

The spec declares `**Scope**:`, and `validate_spec.py` holds it to the spec's own size. More than 3 criteria or more than 1 story owes Medium. More than 8 criteria or more than 2 stories owes Large.

| Scope | What | Specify | Design | Tasks | Execute |
| --- | --- | --- | --- | --- | --- |
| **Small** | 3 files or fewer, one sentence | One-line spec, inline | Skip | Skip | Implement and verify inline |
| **Medium** | A clear feature | Spec with its checks in it | Skip, design inline | Skip | One commit per step, each under the commit budget |
| **Large** | Several components | Full spec with the dimension sweep | Architecture, components, read cold | One task per test cycle | One commit per task |
| **Complex** | Ambiguity, a new domain | Full spec and [gray areas](references/discuss.md) | [Research](references/design.md) and architecture, read cold | Tasks in phases | Per task, and [interactive UAT](references/validate.md) |

**Specify and Execute always run.** A Medium feature keeps its checks in `spec.md`. Its commits pass the same budget as tasks do, so a step that outgrows it shows Tasks was owed.

## .specs Structure

```
.specs/
├── STATE.md            # Project memory: Decisions log (AD-NNN) + Handoff snapshot
├── LESSONS.md          # Lessons playbook (rendered by scripts/lessons.py - do not hand-edit)
├── lessons.json        # Canonical lessons state (machine-owned)
└── features/
    └── [feature]/
        ├── spec.md          # Scope, criteria with IDs, the dimension sweep, Sources
        ├── captures/        # binding design files, and <capture>.running.png pictures
        ├── context.md       # User decisions for gray areas (only when discuss runs)
        ├── design.md        # Approach, architecture and components (Large and Complex)
        ├── review.md        # the plan reviewer's paraphrase and findings, each resolved
        ├── tasks.md         # Phases of tasks, ## Checks with a proof each, ## Handoff
        ├── proofs.md        # written by check_proofs.py: every proof at HEAD
        ├── screens.md       # the screens sub-agent's verdict, per picture
        └── verification.md  # the Verifier's judgement of each check, and its findings closed
```

**Create files when their phase has content.** Never scaffold an empty `context.md`, `design.md` or `tasks.md`. A missing file is the right state for a skipped phase.

## Workflow

**New feature:** Specify, then Design and Tasks when the scope owes them, then Execute.

**Resume work, in a new session or after a compaction:**

1. Re-read this file, then the reference for the phase the files show. A summary keeps the task and loses these rules.
2. Read `.specs/STATE.md` Decisions and the feature's files. Reconcile them against git, because evidence wins over a note. [memory.md](references/memory.md) says where each file puts you.
3. After a compaction, continue when the files and git agree, and stop only on a conflict. In a new session, propose the reconciled next step before you write code.

## Context Loading Strategy

Load only what the current step needs:

- `.specs/STATE.md` Decisions at Specify and Design, and again on resume. Its Handoff on resume only.
- Confirmed lessons at Specify and Design: `python3 <skill-dir>/scripts/lessons.py list --status confirmed` ([lessons.md](references/lessons.md)).
- `spec.md`, `context.md`, `design.md` and `tasks.md` when the step works from them.

Never load several feature specs or several architecture documents at once.

## Sub-Agent Delegation

**Batch workers.** `python3 <skill-dir>/scripts/plan_batches.py <feature>` packs whole phases into batches of about 7 tasks. One batch runs inline. More than one batch means you offer one worker per batch, and you wait for the user to accept. Batches run in order, and workers never spawn sub-agents.

**Plan reviewer.** It always runs when `design.md` exists, before Tasks, and nobody needs to ask for it. Write `**Reviewed**: dispatched` in design.md before you send it ([review.md](references/review.md)).

**Verifier and screens sub-agent.** They always run after the last task, and nobody needs to ask for them. The orchestrator runs `check_proofs.py`, then sends both in parallel over the same `HEAD`. Each dispatch goes on the `**Dispatched:**` line of tasks.md `## Handoff` before it is sent. A compacted orchestrator then waits instead of sending a second one.

Every finding is fixed in one pass. Round 2 is `check_proofs.py` again and the screens sub-agent on the rows that differed. There is no second Verifier and no third round. What still fails goes to the user ([sub-agents.md](references/sub-agents.md)).

**Without sub-agents.** Write `**Reviewed**: not run - no sub-agent`. Run `validate.md` and `verify-screens.md` each in a new session after the final commit, and write `self-verified`. The gates warn on both.

## Commands

**Feature level:**

| Trigger Pattern | Reference |
| --- | --- |
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Discuss feature, capture context, how should this work | [discuss.md](references/discuss.md) |
| Design feature, architecture | [design.md](references/design.md) |
| Review the plan, read it cold | [review.md](references/review.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build, execute | [implement.md](references/implement.md) |
| Validate, verify, test, UAT, walk me through it | [validate.md](references/validate.md) |
| Judge the screens against the design | [verify-screens.md](references/verify-screens.md) |

**Memory:**

| Trigger Pattern | Reference |
| --- | --- |
| Record decision, this is a project-level decision | [memory.md](references/memory.md) |
| Pause work, end session, I need to stop | [memory.md](references/memory.md) |
| Resume work, continue, pick up where we left off | [memory.md](references/memory.md) |
| Load lessons, what have we learned, apply past lessons | [lessons.md](references/lessons.md) |
| Record lesson, distill lessons (runs after the gate) | [lessons.md](references/lessons.md) |

## Knowledge

Facts you look up. Decisions you ask. Look in the codebase first, then the project docs and `.specs/STATE.md`, then library documentation, then the web. Never invent an API, a pattern or a behaviour. "I could not find documentation for this" beats a plausible fabrication. Say so when you could not confirm something.

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8 or later, standard library only | every script | the gates do not run, and the phases still apply |
| git | `check_commit.py` diff checks, `check_proofs.py`, `validate_state.py` against HEAD | no diff or HEAD check, and you say so in the report |
| Git for Windows, on Windows | `check_proofs.py` runs proofs in its bash | proofs run in `cmd.exe`, and the script warns |
| sub-agents | batch workers, the plan reviewer, the Verifier, the screens sub-agent | run inline, write `not run` and `self-verified`, and the gates warn |
| a model that reads images | binding captures and the screens sub-agent | ask the user to describe each state |
| a browser the agent can drive | the walk and the pictures | hand the steps to the user |

No test runner is built in. `check_proofs.py` runs the commands tasks.md names, one at a time, with no timeout ([tasks.md](references/tasks.md)).

## Output Behavior

**Do the work. Do not narrate the machinery.** Produce the artifact for the phase instead of announcing the phase.

**Write every artifact in a plain, decided voice.** Specs, decisions, reports, commit messages and summaries follow the writing rules in [coding-principles.md](references/coding-principles.md). Section headings stay in English. Prose follows the project's language, and identifiers are never translated.

---
name: tlc-implement
description: 'Implements work already planned - a plan.md from tlc-plan, or a small ticket - by freezing it into checks with proofs, building, and proving every check with a script and an independent Verifier before declaring done. Use when the user says "implement this plan", "build this ticket", "implement this spec", "write the checks", "verify work", or "tlc-implement". Do NOT use when nobody has decided what to build, or to plan a feature that needs one (that is tlc-plan).'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 1.2.0
---

# TLC Implement

Freeze the obligations. Free the build. Prove it with someone who did not build it.

```
┌────────┐   ┌───────┐   ┌────────┐
│ CHECKS │ → │ BUILD │ → │ VERIFY │
└────────┘   └───────┘   └────────┘
 obligations   yours       always
```

The common failure of a coding agent is a requirement that never became an active obligation,
followed by a completion claim. What works against it is a small, frozen, external obligation set
and a verifier that is not the author, so the budget goes there and not into choreographing the
model. How you build is yours.

The input is an approved `.specs/features/<feature>/plan.md` from **tlc-plan** - approved means
its `**Approved**: <date> - user: "<their words>"` line, which `validate_checks.py` requires - and
it is the whole brief: you may have none of the conversation that produced it. A change under roughly three
files with no one-way door needs no plan: write `checks.md` with an `## Intent` paragraph instead.
Anything larger with no plan, or a plan with an open `blocks` question, goes back to **tlc-plan**.

## Rules

These hold even if no reference file is read. Each one lives here; the references point back.

1. Every check is one observable claim with a concrete value plus the proof that settles it: a test
   or command whose exit code decides, or, for a state a capture draws, a picture of it judged
   against the capture (rule 9).
2. Tests assert what the checks say, not what the code happens to do. Do not write a test by
   reading the implementation.
3. A test changes only with the claim it proves, and leaves with the code it proves, in the same
   commit. Changing a test to make a suite pass hides the failure it exists to show: a wrong check
   is a stop-and-ask.
4. Checks are fixed once `validate_checks.py` passes; a check may be appended when the walk or the
   Verifier finds a missing obligation. In the plan, `Landing`, `Surface` and the stored shape are
   additive; the path and `Changes underneath` are kept true in the commit that changes them.
5. The Verifier is a fresh sub-agent, never the author, and it always runs, once per feature,
   beside the screens sub-agent. `check_proofs.py` settles the mechanical part - every proof run
   and passing at `HEAD`, the build, the pictures, the walk - and the Verifier spends its time on
   judgement: it opens the test each check's proof selects and says whether that test would fail
   if the claim were false, then tries examples nobody named and assertions looser than their
   criterion. The work is done when every finding is closed by a commit and `proofs.md` is green
   at `HEAD`.
6. A proof is the project's own test command; the skill knows no test runner. Tests that run
   together go on one `Run <name>: <command>` line, run once, and each check that reads it writes
   `Proof: run <name> | <the line the run prints when its test passes>`, pass marker included, so
   a filter that selects nothing reads `no test ran` instead of a green exit code. A command run
   alone is judged by its exit code. The checks are the floor; an edge case or guard no check
   names is still the work.
7. The completion gate is a script: `validate_verification.py` exits 0. The final report opens
   with its last line; a red gate is said first, never left for the reader to find.
8. An approved plan authorizes local edits and local commits. `git push`, deploy and production
   data changes need an explicit go-ahead for that action.
9. **A state a capture draws is one picture.** The author reaches that state and saves
   `<capture>.running.png` beside the capture from a browser window at the capture's size - its
   pixel size over its scale: a wider window lays the page out differently, and resizing the image
   afterwards hides it. Nobody reopens the app to judge it: a screens sub-agent judges the file
   ([verify-screens.md](references/verify-screens.md)), and a picture whose text reads smaller than
   the capture's was resized and is retaken. It matches the capture except for what
   `## Differences from the source` lists. A state no capture draws, and an existing screen the
   feature does not change, are proven by a test or a `walk` proof, with no picture and no judge.
10. A capture, frame or live site the plan cites as binding is changed only by the user. Removing,
    renaming or departing from something it draws is asked, recorded as a decision in
    `.specs/STATE.md`, and listed in the plan's `## Differences from the source` with
    `Confirmed: y - AD-NNN`.
11. **The files hold the run; the chat does not survive a compaction.** What the user settles while
    you build goes on `checks.md`'s `**Settled mid-build:**` line in the turn they say it. Each
    sub-agent goes on the `**Dispatched:**` line before it is sent. After a compaction or in a new
    session, re-read this file and the current phase's reference, then resume from the files
    ([memory.md](references/memory.md)).

## Who checks what

| Part | Runs | Cannot catch |
| --- | --- | --- |
| `check_proofs.py` (always) | every `Run` group and lone proof once at `HEAD`, one at a time, each check's line found in its run's output, the build, pictures and walk checked | a test that passes for the wrong reason |
| The Verifier (always) | each check's test read against its criterion, two examples nobody named, assertions looser than their criterion, checks that contradict a binding capture ([verify.md](references/verify.md)) | a wrong rule whose test reads as right |
| The screens sub-agent (a criterion cites a capture) | an inventory of each capture against the author's picture, every row `same` or `differs`, at a named `HEAD` ([verify-screens.md](references/verify-screens.md)) | spacing, colour and type weight; detail smaller than a screenshot shows; screens no capture draws |

## Artifacts

```
.specs/
├── STATE.md                    # decisions log (AD-NNN)
├── LESSONS.md                  # rendered by scripts/lessons.py - do not hand-edit
├── lessons.json                # machine-owned
└── features/<feature>/
    ├── plan.md                 # from tlc-plan; read, and kept true
    ├── checks.md               # claims + proofs, the coverage join, swept, handoff
    ├── captures/               # binding source files, and the author's <capture>.running.png
    ├── screens.md              # the screens sub-agent's inventory and verdict, per picture
    ├── proofs.md               # written by check_proofs.py: every proof at HEAD, and each run's output
    └── verification.md         # the Verifier's judgement of each check, and its findings closed by commits
```

## Phases

| Phase | What it produces | Reference |
| --- | --- | --- |
| Checks | claims with proofs, every set joined member by member, the nine dimensions swept | [checks.md](references/checks.md) |
| Build | tests from the checks, the code, commits, the screens walked and saved | [build.md](references/build.md) |
| Verify | rule 5 | [verify.md](references/verify.md), [verify-screens.md](references/verify-screens.md) |

Decisions, resuming and lessons: [memory.md](references/memory.md).

## Scripts

Resolve `<skill-dir>` as the directory containing this `SKILL.md` and run
`python3 <skill-dir>/scripts/<name>.py`. Pass `--root` when cwd is not the project root. A non-zero
exit means stop and fix. Run a script rather than read it: its messages say what to change. On
Windows, where `python3` may be the Microsoft Store alias, run `python` or `py -3`.

| When | Command |
| --- | --- |
| Before starting to build | `validate_checks.py <feature>` - it also requires the plan's `**Approved**:` line |
| Before each commit | `check_commit.py --message "<msg>"` |
| Before dispatching the Verifier, and after the fix | `check_proofs.py <feature>` |
| Before declaring done | `validate_verification.py <feature>` |
| Before writing checks, and after the gate | `lessons.py ...` |
| After editing a validator or template | `selftest.py` |

`selftest.py` mutates the fixtures in `scripts/fixtures/` once per gate rule and requires every
mutant to be killed; the fixtures are also a worked example of a passing artifact set.

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8+ (standard library only) | every script | the gates do not run; the phases still apply |
| git | `check_proofs.py` (HEAD, clean tree) | no HEAD check: say so in the report |
| Git for Windows (on Windows) | `check_proofs.py` runs proofs in its bash, because proofs are POSIX shell | proofs run in `cmd.exe` and the script warns |
| sub-agents | the Verifier and the screens sub-agent | run their file in a new session and write `self-verified`; the gate warns |
| a model that reads images | the screens sub-agent | hand the pictures and the captures to the user |
| a browser the agent can drive | saving `<capture>.running.png` and the walk | hand the steps to the user |

Test runners: none is built in. `check_proofs.py` runs the commands `checks.md` names as the
project runs them, one at a time, with no timeout; a run's own parallelism is whatever the project
configured ([checks.md](references/checks.md)).

## Output

Produce the artifact; do not narrate the phase. Lead with the verdict and state decisions plainly.
Section headings stay in English; prose follows the project; identifiers are never translated.

---
name: tlc-spec-lean
description: 'Spec-driven feature work that freezes obligations instead of the plan: one human-reviewed plan with EARS criteria, path, entities, interface and one-way doors, then proof-backed checks, then build, then an independent Verifier. Use when the user says "tlc-spec-lean", "plan feature", "specify feature", "write the checks", "build this plan", or "verify work". Do NOT use for standalone design documents unattached to a feature, architecture decomposition analysis, or work that already has a task list or checklist to execute.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: '2.2.0'
---

# Tech Lead's Club - Spec, Lean

Freeze the obligations. Free the plan. Prove it with someone who did not build it. Derived from tlc-spec-driven 3.3.0 (Felipe Rodrigues), tlc-plan, and tlc-implement.

```
┌──────┐   ┌────────┐   ┌───────┐   ┌────────┐
│ PLAN │ → │ CHECKS │ → │ BUILD │ → │ VERIFY │
└──────┘   └────────┘   └───────┘   └────────┘
 read it    obligations   yours       always
```

The common failure of a coding agent is a requirement that never became an active obligation,
followed by a completion claim. What works against it is a small, frozen, external obligation set
and a verifier that is not the author, so the budget goes there and not into choreographing the
model. A human confirms what must be true and how it is being built in one document; only then does
it become obligations with proofs. There is no task breakdown and no component catalogue: what is
hard to reverse gets a one-way door with its literal shape, and the rest is decided while building.

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
8. An approved spec authorizes local edits and local commits. `git push`, deploy and production
   data changes need an explicit go-ahead for that action.
9. **A state a capture draws is one picture.** The author reaches that state and saves
   `<capture>.running.png` beside the capture from a browser window at the capture's size - its
   pixel size over its scale: a wider window lays the page out differently, and resizing the image
   afterwards hides it. Nobody reopens the app to judge it: a screens sub-agent judges the file
   ([verify-screens.md](references/verify-screens.md)), and a picture whose text reads smaller than
   the capture's was resized and is retaken. It matches the capture except for what
   `## Differences from the source` lists. A state no capture draws, and an existing screen the
   feature does not change, are proven by a test or a `walk` proof, with no picture and no judge.
10. A capture, frame or live site that comes with the request binds unless the user called it
    inspiration. A binding source is changed only by the user. Removing, renaming or departing
    from something it draws is asked, recorded as a decision in `.specs/STATE.md`, and listed in
    the plan's `## Differences from the source` with `Confirmed: y - AD-NNN`.
11. **The files hold the run; the chat does not survive a compaction.** The user's approval is
    written in plan.md as `**Approved**: <date> - user: "<their words>"` - never one the user did
    not give. Each answer goes into its file in the turn it arrives. Each sub-agent goes on the
    `**Dispatched:**` line of `checks.md` `## Handoff` before it is sent. After a compaction or in a
    new session, re-read this file and the current phase's reference, then resume from the files
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
├── STATE.md                    # Decisions log (AD-NNN)
├── LESSONS.md                  # rendered by scripts/lessons.py - do not hand-edit
├── lessons.json                # machine-owned
└── features/<feature>/
    ├── plan.md                 # problem, shape, surface, doors, criteria
    ├── checks.md               # claims + proofs, the coverage join, swept, handoff
    ├── captures/               # binding source files, and the author's <capture>.running.png
    ├── screens.md              # the screens sub-agent's inventory and verdict, per picture
    ├── proofs.md               # written by check_proofs.py: every proof at HEAD, and each run's output
    └── verification.md         # the Verifier's judgement of each check, and its findings closed by commits
```

For a change under roughly three files with no one-way door, write only `checks.md` with an
`## Intent` paragraph and skip `plan.md`.

## Phases

| Phase | What it produces | Reference |
| --- | --- | --- |
| Plan | problem, shape, surface, doors, criteria; the one default stop for a human | [plan.md](references/plan.md) |
| Checks | claims with proofs, every set joined member by member, the nine dimensions swept | [checks.md](references/checks.md) |
| Build | tests from the checks, the code, commits, the screens walked and saved | [build.md](references/build.md) |
| Verify | rule 5 | [verify.md](references/verify.md), [verify-screens.md](references/verify-screens.md) |

Decisions and lessons: [memory.md](references/memory.md).

## Scripts

Resolve `<skill-dir>` as the directory containing this `SKILL.md` and run
`python3 <skill-dir>/scripts/<name>.py`. Pass `--root` when cwd is not the project root. A non-zero
exit means stop and fix. Run a script rather than read it: its messages say what to change. On
Windows, where `python3` may be the Microsoft Store alias, run `python` or `py -3`.

| When | Command |
| --- | --- |
| Before presenting the plan | `validate_plan.py <feature>` |
| Before starting to build | `validate_checks.py <feature> --execute` - it also requires the plan's `**Approved**:` line, and runs the `Build:` line once: red before any change stops |
| Before each commit | `check_commit.py --message "<msg>"` - it also prints what follows the last commit |
| Before dispatching the Verifier, and after the fix | `check_proofs.py <feature>` |
| Before declaring done | `validate_verification.py <feature>` |
| At distillation | `lessons.py add ...` |
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

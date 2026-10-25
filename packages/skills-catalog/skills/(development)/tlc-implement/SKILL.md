---
name: tlc-implement
description: 'Implements work already planned - a plan.md from tlc-plan, or a small ticket - by freezing it into checks with proofs, building, and proving every check with a script and an independent Verifier before declaring done. Use when the user says "implement this plan", "build this ticket", "implement this spec", "write the checks", "verify work", or "tlc-implement". Do NOT use when nobody has decided what to build, or to plan a feature that needs one (that is tlc-plan).'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 1.0.0
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

The input is an approved `.specs/features/<feature>/plan.md` from **tlc-plan**, and it is the
whole brief: you may have none of the conversation that produced it. A change under roughly three
files with no one-way door needs no plan: write `checks.md` with an `## Intent` paragraph instead.
Anything larger with no plan, or a plan with an open `blocks` question, goes back to **tlc-plan**.

## Rules

These hold even if no reference file is read. Each one lives here; the references point back.

1. Every check is one observable claim with a concrete value plus the proof that settles it: a test
   or command whose exit code decides, or, for a state a capture draws, the author's picture of it
   judged against the capture (rule 9).
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
   and passing at `HEAD`, the build, the pictures, the walk, the mutations killed - and the
   Verifier spends its time on judgement: mutations where a wrong rule would stay green, examples
   nobody named, assertions looser than their criterion. The work is done when every finding is
   closed by a commit and `proofs.md` is green at `HEAD`.
6. The mutation count is declared in `checks.md` (`Mutations:`, 3 by default) and decides how many
   rules the Verifier probes, not how good the work is: code quality, the tests behind every check
   and a complete `Coverage` join are owed whatever N is. The checks are the floor; an edge case or
   guard no check names is still the work.
7. The completion gate is a script: `validate_verification.py` exits 0.
8. An approved plan authorizes local edits and local commits. `git push`, deploy and production
   data changes need an explicit go-ahead for that action.
9. **A state a capture draws is one picture.** The author reaches that state and saves
   `<capture>.running.png` beside the capture, at the capture's size: a wider window lays the page
   out differently. Nobody reopens the app to judge it: a screens sub-agent judges the file
   ([verify-screens.md](references/verify-screens.md)), and the picture matches the capture except
   for what `## Differences from the source` lists. A state no capture draws, and an existing
   screen the feature does not change, are proven by a test or a `walk` proof, with no picture.
10. A capture, frame or live site the plan cites as binding is changed only by the user. Removing,
    renaming or departing from something it draws is asked, recorded as a decision in
    `.specs/STATE.md`, and listed in the plan's `## Differences from the source` with
    `Confirmed: y - AD-NNN`.

## Configuration

The project declares it in `AGENTS.md` or equivalent; `checks.md` copies the count onto its
`Mutations:` line.

```markdown
## tlc-implement

mutations: 3
```

| Part | Runs | Cannot catch |
| --- | --- | --- |
| `check_proofs.py` (always) | every proof once per runner at `HEAD`, each check matched to the tests its filter selects, the `Build:` commands, pictures and walk checked, mutations injected | a test that passes for the wrong reason |
| The Verifier (always) | N mutations wherever a rule lives, two examples nobody named, assertions looser than their criterion, checks that contradict a binding capture ([verify.md](references/verify.md)) | the rules no mutation probed |
| The screens sub-agent (a capture has a picture) | an inventory of each capture, every row `same` or `differs` ([verify-screens.md](references/verify-screens.md)) | spacing, colour and type weight; detail smaller than a screenshot shows |

Screens take no mutation; spend N where a wrong implementation costs most. Where N looks too low
for the feature, say so in one line and let the user raise it.

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
    ├── proofs.md               # written by check_proofs.py: every proof and mutation at HEAD
    ├── mutations.json          # the Verifier's mutations, re-run after the fix
    └── verification.md         # the Verifier's findings, each closed by a commit
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
exit means stop and fix. Run a script rather than read it: its messages say what to change.

| When | Command |
| --- | --- |
| Before starting to build | `validate_checks.py <feature>` |
| Before each commit | `check_commit.py --message "<msg>"` |
| Before dispatching the Verifier, and after the fix | `check_proofs.py <feature> [--mutations <mutations.json>]` |
| Before declaring done | `validate_verification.py <feature>` |
| Before writing checks, and after the gate | `lessons.py ...` |
| After editing a validator or template | `selftest.py` |

`selftest.py` mutates the fixtures in `scripts/fixtures/` once per gate rule and requires every
mutant to be killed; the fixtures are also a worked example of a passing artifact set.

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8+ (standard library only) | every script | the gates do not run; the phases still apply |
| git | `mutate.py` and `check_proofs.py` (HEAD, clean tree) | no mutations and no HEAD check: say so in the report |
| sub-agents | the Verifier and the screens sub-agent | run their file in a new session and write `self-verified`; the gate warns |
| a model that reads images | the screens sub-agent | hand the pictures and the captures to the user |
| a browser the agent can drive | saving `<capture>.running.png` and the walk | hand the steps to the user |

Test runners: `check_proofs.py` groups bun, vitest, jest, pytest and go test into one run each
([scripts/runners.py](scripts/runners.py)); any other command runs alone and is judged by its exit
code.

## Output

Produce the artifact; do not narrate the phase. Lead with the verdict and state decisions plainly.
Section headings stay in English; prose follows the project; identifiers are never translated.

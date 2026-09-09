---
name: tlc-spec-lean
description: 'Lean spec work for models that already know how to implement. What fails is not reasoning: an obligation gets read and abandoned, then a done claim lands on top. Freezes the what in one human-reviewed plan and proof-backed checks, lets the model build, and proves it with someone who did not build it. Use when the user says "tlc-spec-lean", "plan feature", "specify feature", "write the checks", "build this plan", or "verify work". Do NOT use for standalone design documents unattached to a feature, architecture decomposition analysis, or work that already has a task list or checklist to execute.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: '1.0.0'
---

# Tech Lead's Club - Spec, Lean

For models that already know how to implement: freeze the what, free the plan, prove it with someone who did not build it. Derived from tlc-spec-driven 3.3.0 (Felipe Rodrigues), tlc-plan, and tlc-implement.

```
┌──────┐   ┌────────┐   ┌───────┐   ┌────────┐
│ PLAN │ → │ CHECKS │ → │ BUILD │ → │ VERIFY │
└──────┘   └────────┘   └───────┘   └────────┘
 read it    obligations   yours       always
```

Four moves, two artifacts before code, one after. A human confirms **what** must be true and
**how** it is being built in one document, and only then does any of it become an obligation with
a proof attached. There is no task breakdown, and the plan carries no component catalogue: what is
hard to reverse gets a one-way door with its literal shape, and everything reversible is decided
while building and reviewed in the diff.

## Why this shape

The dominant failure of a coding agent is not bad reasoning, it is a requirement that was read
and never became an active obligation - and then a completion claim on top of it. The
mitigation that measures well is a **small, frozen, external obligation set** plus a
**verifier that is not the author**; a self-check reproduces the author's own blind spot. So
this skill spends its budget on those two things and refuses to spend it on choreographing how
the model works.

Two consequences worth stating up front, because they are what make this different from a
conventional spec-driven flow:

- **Granularity is not quality.** Splitting a feature into fifteen one-file tasks buys
  ordering, not correctness, and it costs a re-read of the process on every task. Proof
  coverage buys correctness.
- **A plan the model must obey competes with the obligations for attention.** Fields like
  `Where`, `Tools`, `Depends on` are the model's job to decide, so they are not written down.

## Critical rules

The pinned set. These hold even if no reference file is read, and they are the only rules that
never scale down with the profile.

1. Every check is **one observable claim with a concrete value** plus the **proof** - the test
   or command whose exit code settles it. No proof, no check.
2. Tests assert what the checks say, never what the code happens to do. Never write a test by
   reading the implementation.
3. Never weaken an assertion, delete a test, or skip one to make a suite pass. A genuinely
   wrong check is a stop-and-ask, not an edit.
4. Checks and `Test policy` rows are fixed once approved. In the design, `Landing`, `Relations`
   and `Surface` are additive - a door discovered while building gets a row before the code that
   closes it, and a row the user approved is never rewritten. `Flow` and `Impact` are neither:
   they are **kept true**, so a different path changes the hop in that path's commit.
5. The **Verifier is a fresh sub-agent**, dispatched by whoever holds the whole feature, never
   by a builder, over `<feature base>..HEAD` with **every** check. Never optional, never
   prompted, never the author. A builder finishes, reports, and stops.
6. **The profile is a floor and it is not a secret.** The verification report names it, or "no
   faults injected" reads exactly like forgetting to inject them.
7. The completion gate is a script, not a feeling: `validate_verification.py` must exit 0.
8. **Blast radius:** an approved spec authorizes local edits and local commits. `git push`,
   deploy, and production data changes need an explicit go-ahead for that action.

## Profile

The project declares how much runs, in `AGENTS.md` or equivalent. Absent a declaration:
`light`. Same three levels as `tlc-implement`, gated the same way, so moving between the two
skills needs no second vocabulary.

```markdown
## tlc-spec-lean

profile: light
budget: 150k
```

| Profile | Adds | Cannot catch |
| --- | --- | --- |
| `light` (default) | proofs run at `HEAD` with each named test shown to exist and run, one located assertion per check, level and sampling gaps, `Swept existing` re-read | a set member with no proof; a test that would pass under a wrong implementation |
| `standard` | the `Coverage` join recomputed, `Test policy` rows with a verdict each, one fault per assertion surface | a check that contradicts a binding source; a screen nobody built |
| `ui` | binding sources opened and compared, per-screen enumeration of copy **and** arrangement | only spacing, colour and type weight, enumerated per screen |

Each step adds a **class of failure detected**, so a cheap profile is not a discount on the
same product - read the right column before choosing it. Two things about `light` are worth
saying out loud, because its own row says them and they are easy to skim past: it will not
notice an enumerated set member that nobody proved, and it will not notice a test that passes
under a wrong implementation. `standard` exists for exactly those two.

`ui` costs nothing on work with no interface: every screen step is conditional on a screen
existing. A step whose input is empty costs a line, not a pass ("no set rows", "no binding
source").

The `Coverage` join is **written** into `checks.md` at every profile - the join is what makes an
omission structural, and that costs nothing at authoring time. What `standard` buys is the
Verifier **recomputing** it from the authority over each set instead of reading the author's
table back.

The profile is a pin, not a preference, and unlike `tlc-implement` that is enforced rather than
asked for: `validate_verification.py` fails a report whose profile differs from the one
`checks.md` was approved under, and fails a `standard` report with no fault rows or no
recomputed coverage, and a `ui` report with no binding-sources section. So a step that did not
run stays distinguishable from a step that was forgotten, which is the whole reason to declare
a floor.

Where the profile looks too thin for the feature in hand, say so in one line and let the user
raise it. Doing more than the profile in silence costs the predictability that made declaring
it worthwhile.

## Artifacts

```
.specs/
├── STATE.md                    # Decisions log (AD-NNN) + Handoff snapshot
├── LESSONS.md                  # rendered by scripts/lessons.py - never hand-edit
├── lessons.json                # machine-owned
└── features/<feature>/
    ├── plan.md                 # problem, EARS criteria, surfaces walked, then flow, relations, surface, landing, impact
    ├── checks.md               # claims + proofs, the coverage join, test policy, swept
    └── verification.md         # the Verifier's report
```

Create each file when its phase produces content. For a change under roughly three files with no
one-way door, write only `checks.md` with an `## Intent` paragraph and skip `plan.md` - one
bounded escape, not a sizing matrix.

## Understanding and obligations are separate artifacts

`plan.md` exists because a human has to be able to plan and object **before** anything turns into
a claim with a test selector attached. Reading forty checks to reconstruct what is being built is
not planning, and writing the checks in the same pass that decides the shape produces checks that
ratify whatever was already assumed.

**Both halves live in one file because they are one review.** The file boundary is the semantic
one: on this side, what a human confirms; on the other, obligations with proofs. Splitting the
plan into a spec and a design would cut it in a place that matches neither, and would buy two
mandatory stops for one feature. The order inside the file still matters - the criteria are
written before the shape, which is what stops a criterion from being invented to justify a
component - and the closure gate has a check the split could not have: every criterion has to
land somewhere in `Flow`, `Relations` or `Surface`, or it is out of scope or a gap in the shape.

The derivation into `checks.md` is the load-bearing part, not paperwork. Every route in `Surface`
owes a `Coverage` set row whose members are its statuses; every door in `Landing` owes a check;
every entity in `Relations` owes one. A shape section with nothing pointing back at it from
`checks.md` is either dead or unproven, and `validate_checks.py` warns on the common case.

**The design half exists; the component catalogue does not.** What made design documents rot was
never the diagram, it was `Purpose` / `Location` / `Interfaces` / `Dependencies` per class -
reversible detail that goes stale within weeks and then misleads the next reader with the
authority of a written document. None of those fields exists here. Five bounded sections:

| Section | Reviews | Kept out |
| --- | --- | --- |
| `Flow` | the path, one line per hop | any module that neither exists nor is created by a door - that is placement |
| `Relations` | entities, cardinality, one-way constraints | columns and types |
| `Surface` | route, in, out, statuses | request-body specification, and check ids - those do not exist yet |
| `Landing` | the one-way doors, with the literal shape and the rejected alternative | anything a refactor reverses |
| `Impact` | what changes underneath: terms, and existing data | risk registers |

**Which folder, how many classes, what the private method is called: the diff.** Reversible,
answered by the repo's conventions, and never worth an artifact. That is the deliberate trade,
and it is the only one.

A bet still open when you get here - two architectures with live alternatives, each needing to be
costed against this repository - does not fit in a `Landing` row, and a row is the only shape this
artifact has for it. Whatever the project uses to settle one (an ADR, an RFC, a spike) comes
first; then the plan records the shape that won and makes it reviewable.

## Flow

**Plan** - the problem and the boundary, acceptance criteria in EARS notation with requirement
IDs, then the path, the entities, the interface, the doors and what gets disturbed. Facts you look
up; decisions you ask - and when you ask, concrete options with your recommendation, at most two
per turn. **Two enumerations do the finding**, because "consider the edge cases" finds nothing: the
surfaces this feature exposes, each carrying the same decisions every time it appears, and the nine
implicit-requirement dimensions. Both take a mandatory `n/a - <reason>`, so a blank is an item
nobody decided rather than one that does not apply. One artifact a human reads and objects to
before any check exists. Full process, how to ask, rules per shape section, template and closure
gate: [plan.md](references/plan.md).

**Checks** - derive claims with proofs from the plan, join every enumerated set member to a check,
and record where each swept dimension landed. This is the artifact everything downstream refers to
by check number: [checks.md](references/checks.md).

**Build** - your call how. Write the tests from the checks, implement, run each proof, commit
in coherent pieces. No task list, no per-task review tables. Boundaries, `Landing` timing,
handoff and the scope guardrail: [build.md](references/build.md).

**Verify** - after the last commit of the feature, the orchestrator dispatches a fresh
Verifier. Procedure, report format and scoped re-verification:
[verify.md](references/verify.md).

Durable memory - project decisions, session handoff, and the lessons layer:
[memory.md](references/memory.md).

## Scripts

Resolve `<skill-dir>` as the directory containing this `SKILL.md` and invoke
`python3 <skill-dir>/scripts/<name>.py`. Project data under `.specs/` stays relative to the
project root; pass `--root` when cwd differs. A non-zero exit means STOP and fix.

| When | Command |
| --- | --- |
| Before presenting the plan | `validate_plan.py <feature>` |
| Before starting to build | `validate_checks.py <feature>` |
| Before each commit | `check_commit.py --message "<msg>"` |
| Before declaring done | `validate_verification.py <feature>` |
| At distillation | `lessons.py add ...` |
| After editing a validator or template | `selftest.py` |

`validate_plan.py` runs the closure gate and guards the shape half against becoming what it
replaced: it fails a criterion with no SHALL, an assumption with no chosen default, an `Observable`
row whose landing is blank or whose `n/a` carries no reason, a `Landing`
row with no literal shape or no rejected alternative, columns and types inside `Relations`, a
`Surface` route with no statuses, and any section left blank rather than answered with
`None - <why>`. `validate_checks.py` is the omission catcher: it fails a check with no proof, a
coverage row whose declared size exceeds the members actually assigned, a missing swept dimension,
and a missing profile line, and warns on a route the plan reviewed that no check mentions.
`validate_verification.py` fails a PASS report that cites no `file:line`, records a surviving
mutant, leaves an `Unproven` member, or was written by the author.

Skip a script only when no code-execution tool exists; then perform the same checks by reading
the artifact and say once in chat that you are in the degraded path.

`selftest.py` applies this skill's own discipline to its gates: it mutates a filled-in fixture
set once per rule and requires every mutant to be killed, runs negative controls proving a
profile-scoped gate does **not** fire below its profile, and smoke-runs every script shipped
here - an unexercised script is where a crash hides, and the completion gate once exited 0 with
nothing gated. Run it after editing a validator or a
template - a validator that exits 0 on everything is decoration, one that exits 1 on everything
makes `light` unusable, and only injection tells the two apart. The fixtures in
`scripts/fixtures/` are also a complete worked example of a passing `standard` artifact set.

## Sub-agents and handoff

**One builder unless the reading does not fit.** Pack whole slices - never split a slice -
accumulating while the running estimate stays under the declared `budget` (default 150k
tokens, from `wc -c` on the files each slice touches, divided by four). Hand off at the last
slice that fits, preferring a boundary where the surface changes. Write the intended split
into `checks.md` under `## Handoff` with the arithmetic, before any code: a number with its
reason can be argued with, a bare number can only be trusted.

Batches run sequentially and only hand off on green. The next builder reads `checks.md` and
the **diff** of what landed, never a narrative summary. A slice that alone exceeds the budget
was cut too coarsely - say so rather than splitting mid-outcome.

Do not ask the user to approve the split. It is logistics, and their answer cannot be better
informed than yours. What does need a decision is the profile, a live alternative in
`Landing`, and anything the refuse-rather-than-guess gate caught.

**Model tier**, only if the harness assigns a model per sub-agent: high reasoning for a
core-domain slice and for writing the checks, faster for mechanical slices, mid-to-high for
the Verifier - it designs mutations and reasons adversarially, so it is never the cheapest
tier. Advisory only; no gate depends on it.

## Knowledge chain

In strict order: existing code and conventions, project docs, library documentation (Context7
where available), web search, then flag as uncertain. Never invent an API, a flag, a command
or a behaviour. "I could not find documentation for this" always beats a plausible
fabrication, because a fabrication propagates into the checks and then into a green test that
proves nothing.

## Output behaviour

Produce the artifact; do not narrate the phase. Lead with the verdict. State decisions
definitively. Cut filler and mechanical hedging. Write the connectives in the language of the
document - the section headings are a schema and stay in English, the prose follows the
project, and identifiers are never translated.

## Examples

### Example 1: Plan a feature

User says: "tlc-spec-lean — plan the lockfile v2 migration"
Actions:

1. Read the repository and write `.specs/features/lockfile-v2/plan.md` (problem, EARS criteria, Flow, Relations, Surface, Landing, Impact)
2. Run `python3 <skill-dir>/scripts/validate_plan.py lockfile-v2`
3. Stop for human review — no checks and no code yet

Result: A plan the user can object to. `validate_plan.py` exits 0. `checks.md` does not exist.

### Example 2: Write the checks and build

User says: "write the checks and build this plan"
Actions:

1. Derive `.specs/features/lockfile-v2/checks.md` from the approved plan (claims + proofs, Coverage join, Test policy, Swept)
2. Run `python3 <skill-dir>/scripts/validate_checks.py lockfile-v2`
3. Write tests from the checks — never from the implementation — then implement, run each proof, and commit

Result: Proof-backed checks, green proofs, coherent commits. The builder reports and stops. The builder does not write `verification.md`.

### Example 3: Verify the work

User says: "verify work"
Actions:

1. The orchestrator — not the builder — dispatches a fresh Verifier over `<feature base>..HEAD` with every check
2. The Verifier writes `.specs/features/lockfile-v2/verification.md`
3. Run `python3 <skill-dir>/scripts/validate_verification.py lockfile-v2`

Result: An independent verification report. `validate_verification.py` exits 0. Author is not the verifier.

## Troubleshooting

### Error: a validator exits non-zero

Cause: A structural gate failed — a criterion without SHALL, a check without a proof, a coverage row whose size exceeds its members, a verification report written by the author, or a profile that does not match the approved checks.
Solution: Read the script stderr, fix the artifact it named, and re-run the same command. Never skip the script or weaken an assertion to proceed.

### Error: no code-execution tool

Cause: The harness cannot run Python.
Solution: Perform the same checks by reading the artifact and say once that you are on the degraded path.

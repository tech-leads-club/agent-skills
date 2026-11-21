---
name: tlc-spec-lean
description: 'Spec-driven feature work that freezes what must be true and frees how it is built: one human-reviewed plan with EARS criteria, path, entities, interface and one-way doors; then the build, one vertical slice at a time, each committed; then one review by a fresh sub-agent and one fix pass. Use when the user says "tlc-spec-lean", "plan feature", "specify feature", "build this plan", or "review this work". Do NOT use for standalone design documents unattached to a feature, architecture decomposition analysis, or work that already has a task list or checklist to execute.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: '3.2.0'
---

# Tech Lead's Club - Spec, Lean

Freeze what must be true. Free the build. Have someone who did not build it look. Derived from
tlc-spec-driven 3.3.0 (Felipe Rodrigues), tlc-plan, and tlc-implement.

```
┌──────┐   ┌───────┐   ┌────────┐
│ PLAN │ → │ BUILD │ → │ REVIEW │
└──────┘   └───────┘   └────────┘
 a human    slice by    a fresh sub-agent, then one fix pass
            slice
```

The common failure of a coding agent is a requirement that never reached the work, followed by a
completion claim. Most of it is decided before any code: a product decision nobody asked, a
sentence of the request no criterion carries, a rule left where no test reaches. So the budget
goes into one plan a human approves, and into one reader who did not write the code. There is no
task breakdown, no checklist of proofs and no gate after the build: the builder takes the plan's
slices one at a time, end to end, and works as it sees fit inside each.

## Rules

These hold even if no reference file is read.

1. **Every product decision is asked before the plan is presented**, with your recommendation.
   An assumption saves no question. Answers are not the approval: the plan that holds them is
   presented again. The user's approval is written in plan.md as
   `**Approved**: <date> - user: "<their words>"` - never one the user did not give.
2. **Rules run where the repo's tests reach.** What changes an outcome - including filtering,
   searching, sorting and counting - lives in a layer the tests cover, and each rule has a test
   that fails if the rule is wrong. Tests assert what the criteria say, not what the code happens to
   do. A test changes only with the claim it proves; changing one to make a suite pass hides the
   failure it exists to show - stop and ask.
3. **A capture, frame or live site that comes with the request binds** unless the user called it
   inspiration. A binding source is changed only by the user. Removing, renaming or departing from
   something it draws is asked, recorded as a decision in `.specs/STATE.md`, and listed in the
   plan's `## Differences from the source` with `Confirmed: y - AD-NNN`.
4. **The build goes slice by slice.** S1 first, thin and end to end - route, rule, tests, screen -
   then one slice per pass, each committed before the next with the slice and criteria it closes in
   the message; never one layer for every slice first ([build.md](references/build.md)). **The work
   is done when it is committed**, the repo's own test, build and lint commands pass, a screen has
   been used in a browser at its captures' size, and the review is closed by one fix pass. An
   uncommitted change is not delivered.
5. **The reviewer is a fresh sub-agent, never the author**, and it always runs, once per feature.
   It gets the request, the plan and a fixed prompt, and decides itself how to check
   ([review.md](references/review.md)).
6. An approved plan authorizes local edits and local commits. `git push`, deploy and production
   data changes need an explicit go-ahead for that action.
7. **The files hold the run; the chat does not survive a compaction.** The user's request goes into
   `request.md` verbatim before anything else - the reviewer gets it from there, never from memory.
   Each answer goes into the plan in the turn it arrives; what the user settles while you build goes
   on the plan's `**Settled mid-build:**` line in their words; a choice you make while building that
   a later feature must follow goes into `.specs/STATE.md` when you make it; the review goes on the
   `**Review:**` line before it is sent, and the fix pass on the `**Fix pass:**` line before it is
   committed. After a compaction or in a new session, re-read this file and the current phase's
   reference, then resume from the files ([memory.md](references/memory.md)).

## Artifacts

```
.specs/
├── STATE.md                    # Decisions log (AD-NNN)
└── features/<feature>/
    ├── request.md              # the user's request, verbatim, saved before anything else
    ├── plan.md                 # problem, shape, surface, doors, criteria; approval, settled, review, fix pass lines
    ├── captures/               # binding source files
    └── review.md               # the reviewer's verdict and findings
```

For a change under roughly three files with no one-way door, skip `plan.md`: ask the product
decisions and write each answer under the request in `request.md`, build, and still send the
review with `request.md` as its only spec. `request.md` then carries the `**Review:**` and
`**Fix pass:**` lines the plan would ([review.md](references/review.md)).

## Phases

| Phase | What it produces | Reference |
| --- | --- | --- |
| Plan | problem, shape, surface, doors, criteria; the one stop for a human | [plan.md](references/plan.md) |
| Build | slice by slice, S1 first: code and tests through every layer, used in a browser when there is a screen, one commit per slice | [build.md](references/build.md) |
| Review | a fresh sub-agent's verdict, then one fix pass and the report | [review.md](references/review.md) |

Decisions and resuming: [memory.md](references/memory.md).

## Scripts

Resolve `<skill-dir>` as the directory containing this `SKILL.md` and run
`python3 <skill-dir>/scripts/<name>.py`. Pass `--root` when cwd is not the project root. A non-zero
exit means stop and fix. Run a script rather than read it: its messages say what to change. On
Windows, where `python3` may be the Microsoft Store alias, run `python` or `py -3`.

| When | Command |
| --- | --- |
| Before presenting the plan | `validate_plan.py <feature>` |
| Before each commit, when the repo uses Conventional Commits or has no convention | `check_commit.py --message "<msg>"` - it also names untracked files and what follows the commit |
| After editing a script or the plan template | `selftest.py` |

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8+ (standard library only) | `validate_plan.py`, `check_commit.py` | read the template in plan.md against your plan, and the commit rules in build.md against each message, by hand |
| sub-agents | the review | run the review prompt in a new session, or hand it to the user, and say so in the report |
| a browser the agent can drive | using a screen at its captures' size | hand the steps to the user |

## Output

Produce the artifact; do not narrate the phase. Lead with the verdict and state decisions plainly.
Section headings stay in English; prose follows the project; identifiers are never translated.

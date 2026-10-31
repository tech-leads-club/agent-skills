---
name: tlc-plan
description: 'Turns a request, ticket, PRD, design or thread into one plan a human approves and a builder can act on without the conversation: asks every gray area until no product decision is left to the builder, then writes the problem, EARS criteria with concrete values, the path and the data it touches (drawn in mermaid), the interface, and only the decisions that are hard to reverse. Captures that come with the request bind. Use when the user says "plan this", "plan feature", "specify feature", "write the plan", "cut this PRD into tasks", or "tlc-plan". Do NOT use to implement (that is tlc-implement), for a standalone design document, or when nobody has decided what to build.'
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 1.1.1
---

# TLC Plan

Ask until nothing is the builder's to decide. Write it down so a stranger can build it.

```
┌─────┐   ┌───────┐   ┌──────┐   ┌─────────┐
│ ASK │ → │ SHAPE │ → │ CHECK│ → │ APPROVE │ → tlc-implement
└─────┘   └───────┘   └──────┘   └─────────┘
```

The common failure of a coding agent is a requirement that never became an obligation, followed by
a completion claim. It starts here: a gray area the plan settled by guessing, a capture treated as
a suggestion, a sentence of the request that landed nowhere. This skill produces the one document a
human reads and objects to before any code exists, and it is the whole brief for whoever builds,
often a different agent with none of this conversation.

## Rules

1. Every criterion is one observable outcome with a concrete value - a status code, a field, a
   bound, a label - that one run settles. "Gracefully", a percentile or "the columns exist" is not
   a criterion.
2. Ask every gray area before presenting the plan: a decision that is the user's, has more than one
   defensible answer, and is not settled by the code. An assumption never stands in for a question
   to save one. Asking clarifies how, never whether to add a capability.
3. A capture, frame or live site that comes with the request binds unless the user called it
   inspiration. Only the user changes a binding source: a departure from it is asked, recorded as
   an `AD-NNN` in `.specs/STATE.md`, and listed in `## Differences from the source`.
4. The rules that change what a user sees run in a layer the repo's tests reach. Filtering,
   searching, sorting and counting are rules.
5. Only what is hard to reverse is decided here, with its literal shape. Placement, names and
   types inside the conventions are the builder's and are settled in the diff.
6. `validate_plan.py` exits 0 before the plan is presented, and approval is the one stop for a
   human. The approval is written under the plan's title as
   `**Approved**: <date> - user: "<their words>"` - never one the user did not give - and each
   answer goes into the plan in the turn it arrives: a compaction keeps the file, not the chat.
   After one, or in a new session, re-read this file and the plan reference, then continue from
   `plan.md`. The plan stays true through the build: `Landing`, `Surface` and the data are additive;
   the path and `Changes underneath` change in the commit that changes them.

## Cut: how many plans

Read every source completely, then decide how many plans it becomes. Default to one. Every one-way
door in the source is then reviewed together, where the interactions between them are visible;
split six ways, the same doors arrive in six batches and nobody sees the whole.

Split only for a reason you can defend from evidence: a piece cannot land before another without
breaking production, a piece waits on an answer only someone else can give, or a piece belongs to
another team. Each piece is then its own feature folder with its own plan.

Say when it is big, and what makes it big: one-way doors first, a migration among them, then the
number of slices. Show the seams that exist - order constraints first, marked as the kind that
cannot be collapsed - and let the user pick where to cut.

A slice inside a plan is one outcome someone can watch, never a layer. Preparation that proves
nothing on its own - a nullable column, a client with no caller - is a commit, not a slice.

## Artifacts

```
.specs/
├── STATE.md                    # decisions log (AD-NNN)
├── LESSONS.md                  # rendered by scripts/lessons.py - read it
└── features/<feature>/
    ├── plan.md                 # problem, shape, surface, doors, criteria
    └── captures/               # the binding source files
```

The plan format, how to ask, the surface walk and EARS: [references/plan.md](references/plan.md).
Its section headings are a schema **tlc-implement** and the validator read; prose follows the
project's language, and identifiers are never translated.

## Decisions and lessons

`.specs/STATE.md` holds the decisions a future feature has to conform to:

```markdown
# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Webhook ingest is idempotent on provider delivery id | replays are routine and cheap to dedup at the edge | active | 2026-02-14 |
```

Edit only the body of `## Decisions`. Where the repo already keeps ADRs or a decision log, append
there instead. Every `active` entry constrains the plan: conform, or append one that supersedes it
(the old row's status becomes `superseded by AD-NNN`) and say why. An answer that departs from a
binding source is a decision: it says what the product shows instead, and its rationale quotes the
question and the option chosen.

Lessons are written by **tlc-implement** from real verification findings. Read the confirmed ones
for the area before asking anything:

```bash
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed [--scope <area>]
```

## Scripts

Resolve `<skill-dir>` as the directory containing this `SKILL.md`. Pass `--root` when cwd is not
the project root. Run a script rather than read it: its messages say what to change. On Windows,
where `python3` may be the Microsoft Store alias, run `python` or `py -3`.

| When | Command |
| --- | --- |
| Before presenting the plan, and after each change to it | `python3 <skill-dir>/scripts/validate_plan.py <feature>` |
| Before asking anything | `python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed` |
| After editing the validator or the template | `python3 <skill-dir>/scripts/selftest.py` |

## Requires

| Needs | For | Without it |
| --- | --- | --- |
| Python 3.8+ (standard library only) | the scripts | the plan still applies; say the validator did not run |
| a model that reads images | binding captures | ask the user to describe each state, and say so in `Sources` |
| access to the design source (file, MCP, URL) | exporting each state to `captures/` | ask for the files as a `blocks` question |

## Output

Produce the artifact; do not narrate the phase. When you stop, lead with the verdict: the plan, the
questions that block first with your recommendation, then the defaults you picked for the user to
correct. Section headings stay in English.

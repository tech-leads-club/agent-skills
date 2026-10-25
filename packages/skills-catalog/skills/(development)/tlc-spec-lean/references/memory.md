# Memory

Two things outlive a session under `.specs/`: decisions that constrain future features, and
lessons distilled from real verification failures. Where a feature stopped is in its `checks.md`
`## Handoff` and in git.

## `.specs/STATE.md`

```markdown
# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Webhook ingest is idempotent on provider delivery id | replays are routine and cheap to dedup at the edge | active | 2026-02-14 |
| AD-002 | Money is stored in integer cents | superseded by AD-007 | superseded by AD-007 | 2026-03-02 |
```

Edit only the body of `## Decisions`; overwriting the file loses the log. Where the repo already
keeps ADRs or a decision log, append there instead and do not start a second one.

A decision belongs here when a future feature has to conform to it: a convention, a pattern, a
constraint. Write it when the choice is made. An answer that departs from a binding source is one
too: the Decision says what the product shows instead, the Rationale quotes the question and the
option chosen, and the plan's `## Differences from the source` rows cite the id. A `Landing` door that reaches past the feature gets a
row in each place: the shape in `Landing`, the constraint here.

Every `active` `AD-NNN` constrains the work. Conform, or append an entry that supersedes it (set the
old row's status to `superseded by AD-NNN`) and say why.

## Resuming work

Read `.specs/STATE.md` and the feature's `checks.md`, its completion marks and `## Handoff`, then
reconcile them against git: the commits are fact; a note written before a crash is intent. Propose
the next step before writing code.

## Lessons

You supply the judgement - read the failure, phrase the lesson, cite its grounding - and
`scripts/lessons.py` does the bookkeeping: IDs, recurrence across distinct features,
candidate→confirmed promotion, pruning, demotion, rendering.

| File | Owner |
| --- | --- |
| `.specs/lessons.json` | the script - do not hand-edit |
| `.specs/LESSONS.md` | the script - read it, do not write it |

`confirmed` lessons are the playbook. `candidate` ones need a second distinct feature. `quarantined`
ones failed when applied and are ignored.

### Write - after the gate passes

For each finding in `verification.md`, record one lesson:

| Finding | `--signal` |
| --- | --- |
| A mutation the tests did not kill | `surviving_mutant` |
| An assertion looser than its criterion, or a rule proven on too few cases | `spec_precision_gap` |
| An example of the Verifier's own that broke a rule | `ac_gap` |
| A check or criterion that contradicts a binding capture | `spec_deviation` |

```bash
python3 <skill-dir>/scripts/lessons.py add \
  --feature "<feature folder>" \
  --signal  "surviving_mutant" \
  --source  "<file:line or check id from the finding>" \
  --text    "<one general, actionable sentence>" \
  --scope   "<optional: billing, routes, repo-layer>"
```

`--source` is required; a lesson with no grounding is an opinion. Deduplication is exact after
normalization, so write the general rule in canonical, terse words: "Assert the exact persisted
status value, not just that a status field exists", not "the test on line 88 was too weak". One
lesson per finding. Lessons about this codebase only, never about how to run the skill. If the
report had findings and you recorded nothing, say so in chat.

### Read - at Plan and before writing checks

```bash
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed --scope billing
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed --query idempotency
```

Load `confirmed` only, filtered to the area this feature touches.

### Demotion and turning it off

A confirmed lesson loaded for this feature whose failure recurred anyway: `lessons.py penalize --id
L-NNN`. Two penalties quarantine it. To disable the layer for a project, delete `.specs/lessons.json`
and `.specs/LESSONS.md`.

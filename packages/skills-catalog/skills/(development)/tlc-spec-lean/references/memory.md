# Memory

Decisions that constrain future features outlive a session in `.specs/STATE.md`. The user's
request is in the feature's `request.md`. Where a feature stopped is in its `plan.md` lines - in
`request.md`'s, when the change skipped the plan - and in git.

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
option chosen, and the plan's `## Differences from the source` rows cite the id. A `Landing` door
that reaches past the feature gets a row in each place: the shape in `Landing`, the constraint here.

Every `active` `AD-NNN` constrains the work. Conform, or append an entry that supersedes it (set the
old row's status to `superseded by AD-NNN`) and say why.

## Resuming work - a new session, or after a compaction

A compaction is a resume: the summary keeps the task and drops the rules. Re-read `SKILL.md` and the
reference for the phase the files show, then `.specs/STATE.md`, the feature's `request.md` and
its `plan.md`, and
reconcile them against git: the commits are fact; a note written before a crash is intent. After a
compaction in the middle of a run, continue when the files and git agree, and stop only on a
conflict. In a new session, propose the next step before writing code.

Where the files put you - the first row that holds; the lines are in `plan.md`, or in `request.md`
when there is no plan:

| The files show | Next |
| --- | --- |
| `plan.md` whose `**Approved**:` line holds no date and quote yet | the plan: open questions are still the user's - present it and stop |
| `**Review:**` not yet `sent at <hash>` | Build: the first slice no commit message names yet; the uncommitted changes in the tree belong to it - read them before building on them |
| `**Review:** sent at <hash>` and no `review.md` | wait for the reviewer; send it again only when it cannot return - a new session - and say so on the line |
| `review.md` and no `**Fix pass:** done` line | the fix pass |
| `**Fix pass:** done` | the report |

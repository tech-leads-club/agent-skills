# Memory

Three things outlive a session: decisions that constrain future features, a handoff snapshot for
picking work back up, and lessons distilled from real verification failures. All three live under
`.specs/`.

## `.specs/STATE.md`

Two sections, written by different phases, never overwritten together.

```markdown
# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Webhook ingest is idempotent on provider delivery id | replays are routine and cheap to dedup at the edge | active | 2026-02-14 |
| AD-002 | Money is stored in integer cents | superseded by AD-007 | superseded by AD-007 | 2026-03-02 |

## Handoff

**Feature**: <name>
**Where**: <check id> - <what is done, what is not>
**In progress**: `path/to/file.rb:88` - <what was being changed>
**Next step**: <the concrete next action>
**Blockers**: <none | description>
**Uncommitted**: <files>
**Branch**: <name>
```

**Section-scoped writes are critical.** Replace only the body between a `##` header and the next
one. Overwriting the whole file silently destroys the decisions log, and nothing downstream
notices until a future feature contradicts a decision nobody can find.

**Where the repo already keeps ADRs or a decision log, use that instead.** Do not start a second
log; append there and keep `STATE.md` to the handoff section. Two logs means neither is
authoritative.

## Recording a decision

A decision belongs in `## Decisions` when a future feature has to conform to it: a convention, a
pattern, a constraint. It is written when the choice is made, not at the end.

This is a different bar from `Landing` in `plan.md`. `Landing` carries doors this feature closes,
with the literal shape someone will copy. `Decisions` carries the ones that reach past this
feature. A door that is both gets a row in each - the shape in `Landing`, the constraint here.

**Read the active decisions before writing checks.** Every `active` `AD-NNN` is a constraint the
work must conform to. Where one conflicts with what is best for this feature, you have two
options and both are explicit: conform, or append a new entry that supersedes the old one (setting
the old row's status to `superseded by AD-NNN`) and say why. Silently ignoring an active decision
creates inconsistency nobody can see.

## Resuming work

1. Read `.specs/STATE.md` - handoff and decisions.
2. Reconcile against git: `git branch --show-current`, `git status --porcelain`, recent commits,
   and the completion marks in `checks.md`. **Evidence wins over a stale snapshot** - a handoff
   written before a crash describes intent, the commits describe fact.
3. Propose the reconciled next step before writing code.

A snapshot that disagrees with git is not a conflict to resolve carefully; it is simply out of
date. Say what you found and move on.

## Lessons

Verification failures become reusable guidance, or they happen again. The split that keeps this
alive: **you supply judgment** - read the failure, phrase the lesson, cite its grounding - and
`scripts/lessons.py` owns everything mechanical: IDs, recurrence counting across distinct
features, candidate→confirmed promotion, pruning, demotion, rendering. Hand-kept bookkeeping is
exactly what rots, so it is not your job.

| File | Owner |
| --- | --- |
| `.specs/lessons.json` | script - canonical state, never hand-edit |
| `.specs/LESSONS.md` | script - rendered playbook, read it, never write it |

`confirmed` lessons are the playbook. `candidate` lessons are tracked but not trusted until
corroborated across two distinct features. `quarantined` ones failed when applied and are ignored.

### Write - at the end of verification

Walk the just-written `verification.md`. For each **grounded** signal, record one lesson:

| Signal in the report | `--signal` |
| --- | --- |
| A check unproven, or with no located evidence | `ac_gap` |
| A mutant survived fault injection | `surviving_mutant` |
| A check left a value imprecise (precision gap) | `spec_precision_gap` |
| A check contradicted a binding source, or the build diverged from an approved shape | `spec_deviation` |
| The gate failed | `gate_fail` |

```bash
python3 <skill-dir>/scripts/lessons.py add \
  --feature "<feature folder>" \
  --signal  "surviving_mutant" \
  --source  "<file:line | check id | mutation id from verification.md>" \
  --text    "<one general, actionable sentence>" \
  --scope   "<optional: billing, routes, repo-layer>"
```

`--source` is mandatory and the script exits non-zero without it. That is the grounding gate
working, not an error to route around: a lesson with no grounding in a real verification outcome
is an opinion.

**Phrasing rules** - deduplication is exact-after-normalization, not semantic, so two lessons that
mean the same thing must read the same way or neither ever gets promoted:

- Write the general rule, not the incident. Good: `"Assert the exact persisted status value, not
  just that a status field exists"`. Bad: `"The subscription test on line 88 was too weak"`.
- Be canonical and terse. One lesson per signal; do not bundle.

**Scope discipline.** This captures *execution* lessons about this codebase. It does **not**
capture opinions about the workflow itself ("we should write checks earlier") - those are
maintainer decisions that ship in a version bump, never auto-written. If a candidate lesson is
about how to run the skill rather than about this code, do not record it.

A clean PASS with no surviving mutant, no precision gap and no unproven member records **nothing**.
That is correct. But if the report had signal and you recorded zero lessons, say so plainly in
chat - silent skipping is how the file dies.

### Read - at Plan and before writing checks

```bash
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed --scope billing
python3 <skill-dir>/scripts/lessons.py --root <project> list --status confirmed --query idempotency
```

Load `confirmed` only. A lessons file nobody reads is dead by definition, so this is mandatory at
Plan - but keep the loaded set small and filtered to the area this feature touches.

### Demotion

If a `confirmed` lesson was loaded for this feature and the same failure recurred anyway, the
guidance is not working: `lessons.py penalize --id L-NNN`. Two penalties quarantine it. Use only
on real repeats.

### Turning it off

The layer is additive and self-gating - no signal, no write. To disable for a project, delete
`.specs/lessons.json` and `.specs/LESSONS.md` and skip these steps. The Plan → Checks → Build →
Verify flow is unaffected.

### Known limitation

Deduplication has no embeddings (stdlib only, zero dependencies), so near-duplicates phrased
differently sit as separate candidates that never promote. The phrasing rules above are the
mitigation.

## No code-execution tool

Maintain `.specs/LESSONS.md` by hand under the same rules - grounded entries only,
candidate→confirmed after two distinct features, prune stale candidates - and say once in chat
that you are in the degraded path so the user knows the accounting is best-effort.

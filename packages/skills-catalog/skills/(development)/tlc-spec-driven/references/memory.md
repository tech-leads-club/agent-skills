# Memory Layer

**File:** `.specs/STATE.md`

One file with two sections. Each section has its own life, and each write targets its own section. Never overwrite the whole file.

`python3 <skill-dir>/scripts/validate_state.py` checks the file and compares it with the version at `HEAD`. `check_commit.py` runs it whenever a commit stages STATE.md.

---

## Sections

### `## Decisions`: an Append-Only Log

It records **project-level** decisions only. These are conventions, patterns, constraints or cross-cutting technology choices that later features must follow or supersede.

**A feature-local decision stays in the feature's `design.md`.** Ask whether a different feature would need to know it. If yes, it is project-level.

**Record sparingly, because the log stays useful only while it stays small.** An entry earns an `AD-NNN` only when all three hold:

1. **Hard to reverse.** Changing course later has a real cost.
2. **Surprising without context.** A future reader would ask why it was done this way.
3. **A real trade-off.** There were real alternatives, and one won for stated reasons.

When any one is missing, skip it. Typical entries are architectural shape, integration patterns, choices with lock-in, ownership boundaries, and deliberate departures from the obvious path.

**Format.** One entry per decision, as `validate_state.py` reads it:

```markdown
## Decisions

### AD-001
- **Decision**: [what was decided - one sentence]
- **Reason**: [why this option won]
- **Trade-off**: [what was given up]
- **Scope**: [which features, packages or layers it governs]
- **Date**: YYYY-MM-DD
- **Status**: active
```

**Rules the gate holds:**

- Entries are numbered AD-001, AD-002 and on, in order, with no gap and no repeat.
- Every entry has all six fields. Date is `YYYY-MM-DD`. Status is `active` or `superseded by AD-NNN`.
- A superseding entry exists and comes after the entry it supersedes.
- Against `HEAD`, no entry disappears. Decision, Reason, Trade-off, Scope and Date never change. A superseded entry never goes back to active.

**To change a decision, supersede it.** Append a new `AD-NNN`, then set the old entry's Status to `superseded by AD-NNN`. The history is the audit trail.

---

### `## Handoff`: a Pause Snapshot

About 500 tokens, overwritten at each pause. Write it only when the user pauses or a session ends on purpose. A compaction gives no warning, so the live state of a feature never lives here. It lives in the feature's own files and in git. On resume this snapshot is a starting guess, reconciled against them.

```markdown
## Handoff

- **Feature**: [feature name or .specs path]
- **Phase / Task**: [Phase 2 / T4 - implement the repository layer]
- **Completed**: [task IDs, or none]
- **In-progress** (file:line): [`src/billing/subscription.service.ts:88` - mid-write]
- **Next step**: [one sentence]
- **Blockers**: [none, or the Blocked, Tried and Need lines]
- **Uncommitted files**: [list, or none]
- **Branch**: [git branch]
```

---

## Read and Write Triggers

| Trigger | Section | Operation |
| --- | --- | --- |
| Design, when you load context | `## Decisions` | Read: conform to active decisions, or supersede |
| Design, a project-level decision | `## Decisions` | Append, then run `validate_state.py` |
| Pause, end of session | `## Handoff` | Replace the Handoff body only |
| Resume, new session or after a compaction | both, then the feature's files | Read, then reconcile with git |

## The Section-Scoped Write Rule

Find the target section's header. Replace only the text between it and the next `##` header, or the end of the file.

- Design appends to `## Decisions` and never touches `## Handoff`.
- A pause replaces `## Handoff` and never rewrites, reorders or drops a decision.

Breaking this rule loses data without a sound. `validate_state.py` catches a lost decision when you run it or when the commit stages STATE.md.

---

## Pause and Resume

### Pause

1. Find `## Handoff` in `.specs/STATE.md`.
2. Replace its body with the current snapshot.
3. Leave everything above it as it is.
4. Commit or stash outstanding changes as fits the work.

### Resume, in a New Session or After a Compaction

A compaction is a resume. The summary keeps the task and drops the rules.

1. Re-read `SKILL.md`, then the reference for the phase the files show (table below).
2. Read both sections of `.specs/STATE.md`, and confirm which decisions are active.
3. Read the feature's files. A Handoff, when present, is a guess, not ground truth.
4. Reconcile with git before you edit anything: the branch, `git status --porcelain`, recent commits, and the task marks.
5. Settle conflicts with evidence:
   - A task with a green gate and its commit on the branch is done. Mark it, and go on.
   - Partial work in the tree is kept. Run its gate again, then finish the cycle.
   - A stale or missing Handoff is rebuilt from git and the feature's files.
   - Local changes you cannot map to the current task stop you. Ask before you discard anything.
6. After a compaction, continue when the files and git agree, and stop only on a conflict. In a new session, propose the next step before you write code.

**Where the files put you.** Take the first row that holds:

| The files show | Next |
| --- | --- |
| a `**Blocked:**` line in the Handoff | tell the user, with the Blocked, Tried and Need lines |
| `spec.md` with no `**Approved**:` line | Specify: present the spec with its open questions and stop |
| `spec.md` that `validate_spec.py` says changed after its approval | show the user the change and stop. Their answer is stamped with `approve.py` |
| `design.md` with no `**Reviewed**:` line, or `dispatched` with no `review.md` | the plan review ([review.md](review.md)). Wait for a reviewer already sent |
| a `review.md` finding with no resolution | resolve it ([review.md](review.md)) |
| the scope owes `design.md` or `tasks.md`, and the file is missing | Design, or Tasks |
| `tasks.md` with no `**Approved**:` line | present the tasks and stop |
| `tasks.md` that `validate_tasks.py` says changed after its approval | amend it with `approve.py --amend` and commit it alone, or take a change to what the user decided back to them |
| an open task | do it. A task whose commit is on the branch is done, so mark it |
| every task done, a screen, and no `**Walked:**` line | the walk and the pictures ([implement.md](implement.md), step 9) |
| no `proofs.md`, or one at another commit than `HEAD` | `check_proofs.py` |
| `**Dispatched:**` names a sub-agent whose file is not on disk | wait for it. Send it again only in a new session, and say so on the line |
| `verification.md` with an open finding, or `screens.md` round 1 that diverges | the fix pass, then round 2 |
| `screens.md` with `**Round**: 2` | the script and the gate. What still fails goes to the user |

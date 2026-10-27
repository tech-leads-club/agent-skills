# Memory Layer

**File:** `.specs/STATE.md`

A single file with two section-scoped parts. Each section has its own lifecycle; writes are always targeted - never whole-file overwrites.

---

## Sections

### `## Decisions` - append-only log

Records **project-level** decisions only: conventions, patterns, constraints, or cross-cutting technology choices that future features must follow or supersede.

**Not project-level → stays in the feature's `design.md` Tech Decisions table.**  
Heuristic: would a different feature need to know about this? If yes → project-level. If no → feature-local.

**Record sparingly - the log stays useful only by staying small.** Even a project-level decision earns an `AD-NNN` entry only when all three hold:

1. **Hard to reverse** - changing course later carries real cost.
2. **Surprising without context** - a future reader will look at the result and wonder "why did they do it this way?"
3. **The product of a real trade-off** - there were genuine alternatives and you chose one for specific reasons.

If any one is missing, skip it: an easily-reversed choice you will just reverse; an unsurprising one nobody questions; a no-alternative choice records nothing beyond "we did the obvious thing." What typically qualifies: architectural shape, integration patterns between areas, technology choices that carry lock-in, boundary and ownership decisions, and deliberate deviations from the obvious path. A choice that clears all three but is only feature-local still stays in `design.md`.

**Format** (one entry per decision):

```markdown
## Decisions

### AD-001
- **Decision**: [what was decided - one sentence]
- **Reason**: [why this option was chosen]
- **Trade-off**: [what was given up]
- **Scope**: [which features / packages / layers this governs]
- **Date**: YYYY-MM-DD
- **Status**: active | superseded by AD-NNN
```

**Supersession rule:** When a new decision replaces an old one, append a new `AD-NNN` entry and update the old entry's `status` field to `superseded by AD-NNN`. Never delete old entries - the history is the audit trail.

---

### `## Handoff` - pause snapshot (~500 tokens, overwritten each pause)

Written only when the user pauses or a session ends on purpose. A compaction gives no warning, so the live state of a feature is never here: it is the feature's own files - `spec.md` and `tasks.md` (`**Approved**:` lines, completion marks, `## Handoff` with `**Settled mid-build:**`, `**Dispatched:**` and `**Walked:**`), `proofs.md`, `verification.md`, `screens.md` - and git. On resume, this snapshot is a starting hypothesis reconciled against them (see Resume below).

**Format:**

```markdown
## Handoff

- **Feature**: [feature name / .specs path]
- **Phase / Task**: [e.g., Phase 2 / T4 - implement repository layer]
- **Completed**: [comma-separated task IDs or "none"]
- **In-progress** (file:line): [e.g., `src/billing/subscription.service.ts:88` - mid-write]
- **Next step**: [one sentence - exactly what to do next]
- **Blockers**: [none | description]
- **Uncommitted files**: [list or "none"]
- **Branch**: [git branch name]
```

---

## File shape

```markdown
# STATE

## Decisions

[AD-NNN entries…]

## Handoff

[latest snapshot…]
```

If the file does not yet exist, create it with both section headers and empty bodies.

---

## Read / Write Triggers

| Trigger | Section | Operation |
| ------- | ------- | --------- |
| Design phase, Step 1 (Load Context) | `## Decisions` | **Read** - conform to active decisions or supersede |
| Design phase, Tech Decisions step | `## Decisions` | **Append** - only for project-level decisions |
| Pause work / end of session | `## Handoff` | **Replace** - overwrite Handoff section only |
| Resume work / start of session | `## Handoff` | **Read** - load snapshot, then reconcile with git before acting |
| Resume work / start of session | `## Decisions` | **Read** - re-confirm active constraints before designing |
| After a compaction | both, then the feature's files | **Read** - the same Resume procedure |

---

## Section-scoped write rule (critical)

One file holds two lifecycles. Writes MUST target their section only:

- **Design appends** to `## Decisions`. It MUST NOT touch `## Handoff`.
- **Pause replaces** `## Handoff`. It MUST NOT rewrite, reorder, or drop any entry in `## Decisions`.

The correct technique: locate the target section header, replace only the content between it and the next `##` header (or end of file). Never overwrite the full file.

Violating this rule causes one of two failures:
1. A pause write clobbers the decisions log → decisions are silently lost.
2. A design append touches the handoff snapshot → mid-task state is corrupted.

Both are silent data loss. The section-scoped write rule is the single correctness invariant of this memory layer.

---

## Pause / Resume Procedure

### Pause

1. Locate the `## Handoff` section in `.specs/STATE.md`.
2. Replace its body (everything between `## Handoff` and the next `##` or EOF) with the current snapshot.
3. Do NOT modify anything above or before `## Handoff`.
4. Commit or stash outstanding changes as appropriate.

### Resume - a new session, or after a compaction

A compaction is a resume: the summary keeps the task and drops the rules.

1. Re-read `SKILL.md`, then the reference for the phase the files show (table below).
2. Read `.specs/STATE.md` - both sections - and re-confirm active decisions: nothing superseded since?
3. Read the feature's files. The `STATE.md` `## Handoff`, when present, is a **hypothesis**, not ground truth.
4. **Reconcile with git before editing anything:**
   - Current branch vs Handoff `Branch`
   - `git status --porcelain` (uncommitted / unexpected paths)
   - Recent commits on the branch (messages and touched files)
   - `tasks.md` completion marks and, when present, gate evidence / commit references
5. **Resolve conflicts with evidence, not narrative:**
   - A task with a green gate and an atomic commit already on the branch → do **not** redo it; mark it complete in `tasks.md` if the file still shows it open, then continue from the next incomplete task
   - Partial unverified work in the working tree → preserve it, re-run the relevant gate, then finish the status+commit cycle
   - Stale or missing Handoff → rebuild next-step from git + the feature's files
   - Unexplained local changes you cannot map to the current task → STOP and ask; do not discard them
6. After a compaction in the middle of a run, continue when the files and git agree, and stop only on a conflict. In a new session, propose the reconciled next step to the user before writing any code.

**Where the files put you** - the first row that holds:

| The files show | Next |
| --- | --- |
| `spec.md` with no `**Approved**:` line | Specify: open questions still the user's - present the spec with them and stop |
| no `tasks.md`, and the scope owes one | Design or Tasks |
| `tasks.md` with no `**Approved**:` line | present the tasks and stop |
| an open task | Execute it; one whose commit is on the branch is done - mark it |
| every task done, no `**Walked:**` line (a feature with a screen) | the walk and the pictures (implement.md step 9) |
| no `proofs.md`, or one at another commit than `HEAD` before any dispatch | `check_proofs.py` (step 10.1) |
| `**Dispatched:**` names a sub-agent whose file is not on disk (`verification.md`, `screens.md`, a batch's commits) | wait for it; send it again only when it cannot return - a new session - and say so on the line |
| `verification.md` with an open finding, or `screens.md` `**Round**: 1` that diverges | the fix pass, then round 2 |
| `screens.md` `**Round**: 2` | the script and the gate; what still fails goes to the user - there is no third round |

---

## AD-NNN numbering

- Numbers are sequential, project-scoped, and permanent - never reused.
- The counter starts at `AD-001`. Check existing entries before assigning the next number.
- If `.specs/STATE.md` does not exist, the first decision is `AD-001`.

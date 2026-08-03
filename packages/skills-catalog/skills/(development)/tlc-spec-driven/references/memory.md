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

Captures mid-task / in-flight state so work can resume without re-reading the full task history. It complements `tasks.md` and git evidence: on resume, the Handoff is a starting hypothesis that must be reconciled against the real branch, commits, and working tree (see Resume below).

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

### Resume

1. Read `.specs/STATE.md` - both sections.
2. Re-confirm active decisions from `## Decisions` - nothing superseded since last session?
3. Read `## Handoff` - treat it as a **hypothesis** for feature, phase/task, next step, blockers, uncommitted files, branch - not as ground truth by itself.
4. **Reconcile with git before editing anything:**
   - Current branch vs Handoff `Branch`
   - `git status --porcelain` (uncommitted / unexpected paths)
   - Recent commits on the branch (messages and touched files)
   - `tasks.md` completion marks and, when present, gate evidence / commit references
5. **Resolve conflicts with evidence, not narrative:**
   - A task with a green gate and an atomic commit already on the branch → do **not** redo it; mark it complete in `tasks.md` if the file still shows it open, then continue from the next incomplete task
   - Partial unverified work in the working tree → preserve it, re-run the relevant gate, then finish the status+commit cycle
   - Stale or missing Handoff → rebuild next-step from git + `tasks.md`, then propose that to the user
   - Unexplained local changes you cannot map to the current task → STOP and ask; do not discard them
6. Propose the reconciled next step to the user before writing any code.

---

## AD-NNN numbering

- Numbers are sequential, project-scoped, and permanent - never reused.
- The counter starts at `AD-001`. Check existing entries before assigning the next number.
- If `.specs/STATE.md` does not exist, the first decision is `AD-001`.

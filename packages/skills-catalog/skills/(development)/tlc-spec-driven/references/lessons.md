# Lessons: The Self-Improving Layer

**Purpose**: Turn real failures into project-local guidance that changes the next feature. The lessons file must never rot into a dead log.

**The split that keeps it alive.** You supply the judgement: read the failure, phrase the lesson, cite its grounding. `scripts/lessons.py` owns everything mechanical. That covers IDs, recurrence across features, promotion, pruning, demotion and rendering. Bookkeeping by hand is what rots, so it is the script's job.

**What feeds it.** Only two sources feed it: the Verifier's findings in `verification.md` ([validate.md](validate.md)), and the `fixed` Blockers in `review.md` ([review.md](review.md)). No signal means no lesson. A lesson with no grounding is an opinion, and the script refuses it.

**Scope.** This layer holds execution lessons about this codebase, each grounded in a signal. It never holds opinions about how to run this skill, such as "always discuss earlier". Those ship in a version of the skill and are never written here.

---

## Files

| File | Owner | Purpose |
| ---- | ----- | ------- |
| `.specs/lessons.json` | script | The canonical state. Never edit it by hand. |
| `.specs/LESSONS.md` | script, rendered | The playbook people and agents read. Never write it by hand. |
| `<skill-dir>/scripts/lessons.py` | this skill | The only way to change lessons. Run it from the skill directory. |

`confirmed` lessons are the playbook the agent loads. A `candidate` lesson is tracked but not trusted until it recurs in 2 distinct features. A `quarantined` lesson failed when applied and is ignored.

Run `python3 <skill-dir>/scripts/lessons.py ...`. The store under `.specs/` is relative to the project root, so pass `--root` when the working directory differs.

---

## WRITE: Distill Lessons

This is not a phase of its own. It is the last action after the plan review is resolved, and after the verification gate passes.

### When to Write

Record one lesson for each finding below:

| Finding | `--signal` |
| ------- | ---------- |
| A check whose test passes without holding its criterion: a `no` row, a loose assertion, too few cases | `weak_test` |
| A criterion that fixed no precise outcome, so no test could hold it | `spec_precision_gap` |
| An example of the Verifier's own that broke a rule | `ac_gap` |
| A check or criterion that contradicts a binding capture | `spec_deviation` |
| A red row in `proofs.md`, a proof or the build | `gate_fail` |
| A Blocker the plan review found and the author fixed | `plan_gap` |

A report with no finding writes nothing. A clean run produces no lessons, and that is correct.

### How to Write

Phrase each lesson as one short, general sentence a future feature can apply. It states the rule, not the incident. Then call the script:

```bash
python3 <skill-dir>/scripts/lessons.py add \
  --feature "[feature folder name]" \
  --signal  "[signal from the table above]" \
  --source  "[file:line, check id or review finding]" \
  --text    "[the one-sentence lesson]" \
  --scope   "[optional: path, layer or tag, such as billing]"
```

**Phrasing rules.** They make repeats merge, because the script matches exact text after it normalizes it.

- Write the rule, not the incident. Good: "Assert the exact persisted status value, not that a status field exists". Bad: "The subscription test on line 88 was too weak".
- Keep it short and canonical. Two lessons that mean the same must read the same. Otherwise the script counts them apart, and neither is promoted.
- One lesson per signal. Never bundle.

`--source` is required. The script exits non-zero when it is empty. That is the grounding gate working, not an error to route around.

### Self-Check

When a report had findings and you recorded no lesson, say so in chat. Record them now, or say why they are out of scope. Skipping in silence is how the file dies.

### Demotion

A `confirmed` lesson was loaded for this feature, and the same failure happened again anyway. Then the guidance does not work:

```bash
python3 <skill-dir>/scripts/lessons.py penalize --id L-NNN
```

Two penalties quarantine a lesson. Use it only on real repeats.

---

## READ: Load Lessons

Loading is required at the start of Specify, and again at Design for Large and Complex. The plan reviewer gets the same list.

```bash
python3 <skill-dir>/scripts/lessons.py list --status confirmed
python3 <skill-dir>/scripts/lessons.py list --status confirmed --scope billing
python3 <skill-dir>/scripts/lessons.py list --status confirmed --query "idempotency"
```

Apply the lessons while you write the spec or the design. Never load `candidate` or `quarantined` lessons as guidance. Keep the loaded set small, inside the 40k token budget.

---

## Without Code Execution

Some harnesses cannot run Python. Only then, keep `.specs/LESSONS.md` by hand under the same rules. Write grounded entries only, promote after 2 distinct features, and prune stale candidates. This path is degraded, so say once in chat that you are on it.

## Turning It Off

The layer writes nothing without a signal. To turn it off for a project, delete `.specs/lessons.json` and `.specs/LESSONS.md`, and skip the READ and WRITE steps. The rest of the flow is unaffected.

## Known Limit

Matching is exact after normalization: case folding, diacritics and punctuation removed, letters and digits of any script kept. There are no embeddings, because the scripts use the standard library only. Two lessons phrased differently never merge. Follow the phrasing rules above.

# Lessons — Self-Improving Layer

**Purpose**: Turn verification failures into reusable, project-local guidance that actually changes future behavior — without the lessons file rotting into a dead log.

**The split that keeps it alive**: the agent (you) supplies *judgment* — read the failure, phrase the lesson, cite its grounding. The script `scripts/lessons.py` owns everything *mechanical* — IDs, recurrence counting across distinct features, candidate→confirmed promotion, pruning, demotion, and rendering. Hand-kept bookkeeping is exactly what rots, so it is not your job; the script's job.

**What feeds it**: only the execution signals already produced by the Verifier in [validate.md](validate.md) and written to `.specs/features/[feature]/validation.md`. No signal → no lesson. This is the hard gate: a lesson with no grounding in a real verification outcome is an opinion, and the script refuses it.

**Scope discipline (critical)**: this layer captures *execution* lessons that are project-local and grounded in a signal. It does **NOT** capture methodology opinions about the SDD process itself ("we should always discuss earlier"). Those are maintainer decisions that ship in a version bump — never auto-written. If a candidate lesson is really about how to run the skill rather than about this codebase, do not record it.

---

## Files

| File | Owner | Purpose |
| ---- | ----- | ------- |
| `.specs/lessons.json` | script | Canonical machine state. Never hand-edit. |
| `.specs/LESSONS.md` | script (rendered) | Human/agent-readable playbook. Read it; never write it by hand. |
| `scripts/lessons.py` | package | The only way to mutate lessons. |

`confirmed` lessons are the playbook the agent loads. `candidate` lessons are tracked but NOT trusted until corroborated across `promote_threshold` distinct features (default 2). `quarantined` lessons failed when applied and are ignored.

---

## WRITE — distill lessons (runs inside Execute, after validation)

This is **not a new phase**. It is the final action of the Verifier step in [validate.md](validate.md), grafted onto a step that already always runs. Do it immediately after `validation.md` is written, before reporting completion.

### When to write

Walk the just-written `validation.md`. For each **grounded** signal, record one lesson:

| validation.md signal | `--signal` value |
| -------------------- | ---------------- |
| An acceptance criterion failed or had no evidence | `ac_gap` |
| A discrimination-sensor mutant survived (weak test) | `surviving_mutant` |
| A criterion flagged ⚠️ Spec-precision gap | `spec_precision_gap` |
| A `// SPEC_DEVIATION` marker was added during implement | `spec_deviation` |
| The build-level gate check failed | `gate_fail` |

If `validation.md` is a clean PASS with no surviving mutants, no spec-precision gaps, and no deviations → **write nothing**. A clean run produces no lessons. This is correct, not a miss.

### How to write

For each signal, phrase the lesson as **one terse, actionable, codebase-general sentence** — a rule a future feature could apply, not a restatement of this bug. Then call the script:

```bash
python3 scripts/lessons.py add \
  --feature "[feature folder name]" \
  --signal  "[signal value from table above]" \
  --source  "[file:line | AC id | mutant id | SPEC_DEVIATION ref from validation.md]" \
  --text    "[the one-sentence lesson]" \
  --scope   "[optional: path/layer/tag, e.g. billing, routes, repo-layer]"
```

**Phrasing rules** (they make recurrences actually merge — dedup is exact-after-normalization, not semantic):

- Write the general rule, not the incident. ✅ `"Assert the exact persisted status value, not just that a status field exists"` ❌ `"The subscription test on line 88 was too weak"`.
- Be canonical and terse. Two lessons that mean the same thing must read the same way, or the script counts them as different and neither gets promoted.
- One lesson per signal. Don't bundle.

`--source` is **mandatory**. The script exits non-zero if it is empty — that is the grounding gate working, not an error to route around.

### Self-check (do not skip)

After distilling, if `validation.md` contained any FAIL, surviving mutant, spec-precision gap, or SPEC_DEVIATION but you recorded zero lessons, state plainly in chat: *"Validation had signal X but no lesson was recorded — recording now / here's why it's out of scope."* Silent skipping is how the file dies.

### Demotion

If a `confirmed` lesson was loaded for this feature (see READ below) and the *same* failure recurred anyway, the guidance is not working:

```bash
python3 scripts/lessons.py penalize --id L-NNN
```

Two penalties quarantine it. Use sparingly and only on real repeats.

---

## READ — load lessons (runs at Specify and Design)

A lessons file nobody reads is dead by definition. Loading is **mandatory**, not optional.

At the start of **Specify** (and again at **Design** for Large/Complex), load the confirmed lessons relevant to this feature:

```bash
# All confirmed lessons:
python3 scripts/lessons.py list --status confirmed

# Or filter by the area this feature touches:
python3 scripts/lessons.py list --status confirmed --scope billing
python3 scripts/lessons.py list --status confirmed --query "idempotency"
```

Apply the returned lessons as guidance while writing the spec / design. Do **not** load `candidate` or `quarantined` lessons as guidance — they are not trusted. Keep the loaded set small; this runs inside the <40k token budget.

---

## Fallback when code execution is unavailable

Some harnesses cannot run Python. Only then: maintain `.specs/LESSONS.md` by hand, following the exact same rules — grounded entries only, candidate→confirmed after 2 distinct features, prune stale candidates. **This path is degraded**: hand bookkeeping is the failure mode this layer exists to avoid, so prefer the script wherever a code tool exists. State once in chat that you are in the no-script fallback so the user knows accounting is best-effort.

---

## Disable

This layer is additive and self-gating (no signal → no write). To turn it off for a project, delete `.specs/lessons.json` and `.specs/LESSONS.md` and skip the WRITE/READ steps. The core Specify→Design→Tasks→Execute flow is unaffected.

---

## Known limitation

Deduplication is exact-after-normalization (lowercase, punctuation-stripped) — there are no embeddings (stdlib-only, zero-dependency by design). Near-duplicate lessons phrased differently will not merge and will each sit as separate candidates that never promote. Mitigation: follow the phrasing rules above. A future version may add embedding-based dedup.

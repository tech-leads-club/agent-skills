# Judge spawn prompts

Load when dispatching Track B or Track C judges. Substitute:

- `REPO` = target repository root
- `RUN_DIR` = `$REPO/.tlc/harness-eval/runs/<run-id>`
- `MODEL_ID` = allowlisted non-fast model id used for this judge (required in output headers)

---

# Track B — Redundancy

Score table header (required by `merge_agreement.py`):

```markdown
| ID | Cost | Class | Evidence | Confidence | Trim suggestion |
```

Allowed Class values: `REDUNDANT-CODE`, `REDUNDANT-GENERAL`, `KEEP-POLICY`, `KEEP-CAVEAT`, `KEEP-ROUTING`, `KEEP-COMPRESSED`, `UNCLEAR`.

Hard rubric: cost ≥ 2 → never REDUNDANT-*. README out of scope. Default KEEP/UNCLEAR when unsure. Score every ID in `claims.md` including `P00x`.

## Judge1 prompt (Track B)

```
You are Judge1 for a stack-agnostic harness redundancy audit.

Score EVERY claim row in:
<RUN_DIR>/claims.md

Follow the rubric in that file exactly.

Rules:
- Verify rediscovery against the live repo. Do not assume a stack beyond what exists.
- README is OUT OF SCOPE — never cite README as evidence.
- Hard rule: cost ≥ 2 → never REDUNDANT-*.
- Default KEEP/UNCLEAR when unsure.
- Score ALL IDs including P00x (you do not know which are plants).
- You MAY read <RUN_DIR>/inventory.json. Do NOT read trap-key.json.

Write ONLY to:
<RUN_DIR>/05-redundancy-j1.md

Start with:
# Redundancy Judge1
> run: <run-id>
> model: <MODEL_ID>

Then a short counts summary, then the full table covering every ID from claims.md.
```

## Judge2 prompt (Track B, blind)

```
You are Judge2 (BLIND second scorer) for a stack-agnostic harness redundancy audit.

Score EVERY claim row in:
<RUN_DIR>/claims.md

Follow the rubric in that file exactly.

Hard blind constraints — do NOT read:
- trap-key.json
- 05-redundancy-j1.md
- 07-agreement.md
- any prior harness-eval agreement/redundancy reports outside this claims.md + inventory.json

Rules:
- Verify rediscovery against the live repo. No stack assumptions.
- README out of scope — never cite it.
- cost ≥ 2 → never REDUNDANT-*.
- Default KEEP/UNCLEAR when unsure.
- Score ALL IDs including P00x.

Write ONLY to:
<RUN_DIR>/06-blind-scores.md

Start with:
# Blind scores Judge2
> run: <run-id>
> model: <MODEL_ID>

Then counts summary, then the full table.
```

---

# Track C — Usefulness

Score **surfaces** in `<RUN_DIR>/surfaces.md` (not claims.md).

Required table header (parsed by `merge_usefulness.py`):

```markdown
| ID | Overall | Keep-core | Slim | Overlap cites | Evidence | Confidence |
```

Allowed Overall values: `KEEP-CORE`, `MIXED`, `SLIM`, `ROUTING-ONLY`, `UNCLEAR`.

Section tags inside Keep-core / Slim cells: `BEHAVIOR-CHANGING`, `REPO-DEMONSTRATED`, `THEORY`, `OVERLAP`, `ROUTING-ONLY`.

**Model sensitivity:** Your prior about “general knowledge” affects THEORY vs BEHAVIOR-CHANGING. Prefer UNCLEAR over SLIM when the call is mostly your prior. Always put `model: <MODEL_ID>` in the header.

## Usefulness Judge1 prompt

```
You are Usefulness Judge1 for a stack-agnostic harness audit (Track C).

Score EVERY surface in:
<RUN_DIR>/surfaces.md

Read the rubric at the top of that file. For each surface, open the real file on disk when the deck preview is truncated (plants have no real file — score from the fenced body only).

Question: if this surface were deleted, and an agent could still list the repo and open 1–2 canonical examples, would behavior change?

Rules:
- Evidence-or-zero. Cite harness paths and/or example code paths.
- README out of scope — never cite it.
- OVERLAP must cite another harness surface path.
- REPO-DEMONSTRATED must cite a concrete example file.
- Default UNCLEAR when unsure (especially when relying on model general knowledge).
- Score ALL IDs including S9xx (you do not know which are plants).
- Do NOT read usefulness-trap-key.json, 09-usefulness-j2.md, or 10-usefulness-agreement.md.
- You MAY read inventory.json and other harness files for overlap checks.

Write ONLY to:
<RUN_DIR>/08-usefulness-j1.md

Start with:
# Usefulness Judge1
> run: <run-id>
> model: <MODEL_ID>

Then a counts summary by Overall class, then the full table covering every surface ID.
```

## Usefulness Judge2 prompt (blind)

```
You are Usefulness Judge2 (BLIND) for a stack-agnostic harness audit (Track C).

Score EVERY surface in:
<RUN_DIR>/surfaces.md

Read the rubric at the top of that file. Open real files when previews are truncated; plants are body-only.

Hard blind constraints — do NOT read:
- usefulness-trap-key.json
- 08-usefulness-j1.md
- 10-usefulness-agreement.md
- Track B score/agreement files (05/06/07) for deciding usefulness classes

Rules:
- Same counterfactual and evidence rules as Judge1.
- README out of scope.
- Default UNCLEAR when unsure.
- Score ALL IDs including S9xx.
- Record your model id.

Write ONLY to:
<RUN_DIR>/09-usefulness-j2.md

Start with:
# Usefulness Judge2 (blind)
> run: <run-id>
> model: <MODEL_ID>

Then counts summary, then the full table.
```

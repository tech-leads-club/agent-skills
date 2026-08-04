---
name: harness-eval
description: Evaluate a repo agent harness (AGENTS.md, rules, skills, referenced docs) for broken paths/commands, redundant instructions, and usefulness (behavior-changing vs theory/overlap) using a stack-agnostic dual-judge protocol with planted traps. Agreement reports include plain-language term definitions (Ship, Keep-core, Mixed, Slim, Hold). Use when the user says harness eval, harness-eval, harness debug, audit AGENTS.md, audit skills/rules, instruction audit, redundancy of agent instructions, usefulness of skills, which guidelines change behavior, outdated harness docs, Ship/Review/Hold/Slim/Keep-core for harness, or wants Track A/B/C harness evaluation. Do NOT use for harness setup or init, feature spec-driven work (tlc-spec-driven), or applying Ship/Slim trims unless the user explicitly asks after the report.
license: CC-BY-4.0
metadata:
  author: Tech Leads Club - github.com/tech-leads-club
  version: 1.5.0
---

# Harness Eval

Run a full, stack-agnostic harness evaluation and stop at reports. Do not auto-edit AGENTS.md or skills unless the user explicitly asks after reviewing Ship/Slim.

## Loading this skill's files

This skill is **self-contained**. Protocol, scripts, and judge prompts live under this skill directory (the folder that contains this `SKILL.md`). Resolve `SKILL_DIR` as that directory — never assume another install path.

- Read [references/PROTOCOL.md](references/PROTOCOL.md) **completely** before the first run in a session (and again if scripts fail).
- Read [references/judge-prompts.md](references/judge-prompts.md) when spawning Track B or Track C judges.
- Plain-language terms: [references/GLOSSARY.md](references/GLOSSARY.md) (also embedded at the top of `04` / `07` / `10` reports).
- Claim record shape: [references/claims.schema.json](references/claims.schema.json) (for tooling; agents do not need to load it every run).
- Run scripts as `python3 "$SKILL_DIR/scripts/<name>.py" ...`.

Run **outputs** (not protocol) go to the target repo at `.harness-eval/runs/<run-id>/`.

## Critical rules

1. **Report-only by default.** Judgment ≠ remediation.
2. **README out of scope** as harness surface and as rediscovery/usefulness evidence.
3. **Stack-agnostic.** Never hard-code package managers, DBs, frameworks, or folder layouts in prompts or plants. Discover manifests that exist (JS, Python, Make/Task, Rust, Go, PHP, Ruby/Rails, Java/Gradle/Maven, plus `bin/*`).
4. **Track A is high-precision.** Prefer false negatives over false BROKEN. Placeholders (`SPEC_FOLDER`, `{x}`, `[feature]`) are never BROKEN. Never normalize paths with `str.lstrip('./')`.
5. **Track B needs dual judges + plants.** Judge2 is blind (must not read Judge1 scores or `trap-key.json`). Ship only if trap gate PASS and dual REDUNDANT with Judge2 cost ≤ 1.
6. **Track C needs dual judges + plants.** Blind Judge2 must not read `08-usefulness-j1.md` or `usefulness-trap-key.json`. Slim only if trap PASS, dual SLIM/ROUTING-ONLY, **and fan-in PASS** (no other harness surface hard-loads the path as SoT — merge enforces this on the full skill tree, not just `--seed`). **Usefulness is model-sensitive** — record `model: <id>` in both score files; prefer same model within a run; re-judge on a second model before large Slim deletes.
7. **KEEP / KEEP-CORE plants must not be verbatim copies** of claims/surfaces already in the deck.
8. **Subagents:** use an allowlisted non-fast model (prefer the same family as the parent when policy allows). Do not use `*-fast` models.
9. **Do not equate tracks.** Track B Ship ≠ Track C Slim. Rediscoverable ≠ useless; useful ≠ non-redundant.
10. **Slim apply / fan-in.** Never stub or delete a Slim path listed under “Slim fan-in blocked” (or when `python3 "$SKILL_DIR/scripts/slim_fanin.py" --path <P>` reports citers) unless those consumers are updated in the same change.

## Instructions

### Step 1: Resolve SKILL_DIR

Set `SKILL_DIR` to the directory containing this `SKILL.md`. Verify:

- `$SKILL_DIR/references/PROTOCOL.md`
- `$SKILL_DIR/scripts/inventory_extract.py`
- `$SKILL_DIR/scripts/track_a_correctness.py`
- `$SKILL_DIR/scripts/merge_agreement.py`
- `$SKILL_DIR/scripts/surfaces_extract.py`
- `$SKILL_DIR/scripts/merge_usefulness.py`
- `$SKILL_DIR/scripts/slim_fanin.py`

If missing, the skill install is broken — stop.

### Step 2: Inventory + claim deck

From the **target repo root**:

```bash
RUN_ID=$(date -u +%Y-%m-%d)-full
python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID"
# Optional scope: AGENTS.md + one-hop related skills/docs only
# python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" --seed AGENTS.md
```

Expected under `.harness-eval/runs/$RUN_ID/`: `inventory.json`, `claims.jsonl`, `claims.md`, `trap-key.json`.

### Step 3: Track A (deterministic)

```bash
python3 "$SKILL_DIR/scripts/track_a_correctness.py" --root . --run-id "$RUN_ID"
```

Expected: `04-correctness.md` (includes term definitions at top). Spot-check that `.agents/...` cites resolve (not `agents/...`).

### Step 4: Track B — Judge1

Read `references/judge-prompts.md` (Track B Judge1). Spawn an independent subagent with an allowlisted model. Point it at `.harness-eval/runs/$RUN_ID/claims.md`. It writes `05-redundancy-j1.md` (include `model: <id>`).

Judge1 may read `inventory.json`. Must not read `trap-key.json`.

### Step 5: Track B — Judge2 (blind)

Read `references/judge-prompts.md` (Track B Judge2). Spawn a second subagent. Writes `06-blind-scores.md`.

Forbidden for Judge2: `trap-key.json`, `05-redundancy-j1.md`, `07-agreement.md`, prior agreement reports.

Prefer Steps 4 and 5 in parallel.

### Step 6: Merge Track B agreement

```bash
python3 "$SKILL_DIR/scripts/merge_agreement.py" --run-dir .harness-eval/runs/$RUN_ID
```

Expected: `07-agreement.md` (Ship/Review/Hold + **What these words mean**). On trap FAIL: fix plants per PROTOCOL, rescore P00x, re-merge — do not Ship.

### Step 7: Track C — surface deck

```bash
python3 "$SKILL_DIR/scripts/surfaces_extract.py" --root . --run-id "$RUN_ID"
```

Expected: `surfaces.md`, `surfaces.json`, `usefulness-trap-key.json`.

### Step 8: Track C — Usefulness Judge1

Read `references/judge-prompts.md` (Usefulness Judge1). Spawn subagent with allowlisted model (record same id in header). Writes `08-usefulness-j1.md`.

Must not read `usefulness-trap-key.json`.

### Step 9: Track C — Usefulness Judge2 (blind)

Read Usefulness Judge2 prompt. Prefer **same model** as Step 8 for agreement stability. Writes `09-usefulness-j2.md`.

Forbidden: `usefulness-trap-key.json`, `08-usefulness-j1.md`, `10-usefulness-agreement.md`, and using Track B 05/06/07 to decide usefulness classes.

Prefer Steps 8 and 9 in parallel.

### Step 10: Merge Track C agreement

```bash
python3 "$SKILL_DIR/scripts/merge_usefulness.py" --run-dir .harness-eval/runs/$RUN_ID
```

Expected: `10-usefulness-agreement.md` (Slim/Keep-core/Mixed/Hold + **What these words mean**), plus `slim-fanin.json`. On trap FAIL: do not Slim. Surfaces with `slim-fanin-blocked` are Hold — not Slim apply candidates.

### Step 11: Present results

Summarize from the agreement reports (each starts with term definitions):

- Track A broken count → `04-correctness.md`
- Track B trap + Ship/Review/Hold → `07-agreement.md`
- Track C trap + fan-in + Slim/Keep-core/Mixed/Hold → `10-usefulness-agreement.md`
- Call out model ids used for Track C and that Slim is model-sensitive
- Call out any **Slim fan-in blocked** rows (consumers outside seed may appear here)

Stop unless the user asks to apply Ship/Slim. When applying Slim: only paths in the Slim table (fan-in PASS); never stub fan-in-blocked paths without updating citers first.

## Examples

### Example 1: Full harness eval

User says: "run harness eval on this repo"

Actions: Steps 1–11. Parallel B judges, then C judges. Present agreements (terms are in the files).

### Example 2: Usefulness only (existing run)

User says: "run Track C usefulness on the last harness-eval run"

Actions: Steps 7–11 on that `RUN_ID` (inventory must already exist).

### Example 3: Wrong skill

User says: "setup harness" / "init harness" → harness setup (not this skill). User says: "specify feature" → tlc-spec-driven.

## Troubleshooting

### Trap gate FAIL (Track B or C)

Cause: KEEP/KEEP-CORE plants were deck duplicates, or blind judge mis-family. Solution: use skill’s fixed plant templates; rescore plants; re-merge.

### Track A false missing `.agents/...`

Cause: bad path normalization. Solution: skill script must use `normalize_cite` (strip `./` only). Re-run Track A from `$SKILL_DIR/scripts/`.

### Subagent blocked

Cause: missing/allowlisted model or `*-fast` blocked. Solution: re-spawn with an allowlisted non-fast model.

### Track C Slim looks wrong after model change

Expected: usefulness is model-sensitive. Re-run C1+C2 on a second model; intersection of Slim bands is the safe delete set.

### Slim stub broke another skill that loads that file

Cause: content OVERLAP/Slim without fan-in — older runs, or apply skipped the gate. Solution: restore the checklist body; re-merge with `merge_usefulness.py` (fan-in scans full skill trees). Confirm with `slim_fanin.py --path <P>`.

### Scripts missing

Cause: incomplete skill folder. Solution: restore `$SKILL_DIR/scripts/` and `references/`.

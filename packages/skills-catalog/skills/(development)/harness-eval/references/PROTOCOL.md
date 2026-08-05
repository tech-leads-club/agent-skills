# Harness Evaluation Protocol

> Platform- and codebase-agnostic. Version: 1.8.2
> Scripts and this file live inside the `harness-eval` skill. Run outputs go to the target repo under `.harness-eval/runs/<id>/`.

## Purpose

Evaluate a repository’s **agent harness** for:

- **Track A — Correctness:** broken paths, missing commands, dead links (deterministic).
- **Track B — Redundancy:** instructions rediscoverable cheaply without harness text (dual LLM judge + plants).
- **Track C — Usefulness:** which surfaces change agent behavior vs restating theory, repo demos, or overlapping harness text (dual LLM judge + plants; **model-sensitive**).

Judgment is separate from remediation. Reports suggest; humans approve Slim/Ship edits.

**Run gating (HIGH PRIORITY — skill opens with questionnaires):** After inventory: **Q1** (optional docs) → **Q2** (B/C budget, certainty + tokens) → **Track A always** → B/C only if approved. Do not spawn B/C judges until Q2 is answered (unless the user already requested those tracks — still show Q2 once).

## Surface inventory (tiers)

| Tier | Name | Discovery |
|------|------|-----------|
| **T0** | Always-on rules | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/**`, `*.mdc` under repo / `.agents/` / `.cursor/` |
| **T1** | Skills | `SKILL.md` under `.agents/skills`, `.cursor/skills`, `.claude/skills` (presence-based) |
| **T2** | Referenced harness files | One-hop cites from T0/T1 after **doc scope** (below) |

**Out of scope:** `README*`, app source as instruction surface (evidence only), user-global rules outside the repo, recursive crawl of all project docs, **ADRs / RFCs / decision-record trees**.

### Doc scope (T2)

Stack-agnostic path policy (see `scripts/doc_scope.py`):

| Class | Rule |
|-------|------|
| **Agent harness refs** | Always T2 if cited — files under `.agents/skills/`, `.cursor/skills/`, `.claude/skills/` (including skill `references/`). Wins even if a skill folder is named `adr` (that is harness SoT for writing ADRs, not the decision-record corpus). |
| **Decision records** | **Never** T2 outside skill trees — path segments like `adr` / `adrs` / `rfc` / `rfcs` / `architecture-decision-records` / `request-for-comments`, or filenames `adr-*` / `rfc-*` (e.g. `docs/adr/**`) |
| **Other cited docs** | **Opt-in** — default omitted. Inventory writes `optional-docs-candidates.md`. Orchestrator **asks the user** which types/paths to include, then re-runs with `--include-doc-type` / `--include-doc` |

Track A may still flag a broken cite *to* an ADR path from AGENTS.md (correctness of the link). The ADR body is not scored as a harness surface.

## Agnostic constraints

- Do not hard-code package managers, databases, frameworks, or folder layouts.
- Discover manifests that exist across stacks (presence-based, no assumed runtime):
  - JS: `package.json`
  - Python: `pyproject.toml`
  - Make / Task: `Makefile`, `Taskfile.yml`
  - Rust: `Cargo.toml` (`[[bin]]`)
  - Go: `go.mod`, plus `bin/*` / Make / Taskfile
  - PHP: `composer.json`, `artisan`, `bin/console`
  - Ruby / Rails: `Gemfile`, `Rakefile`, `bin/*`
  - Java / JVM: `pom.xml`, `build.gradle(.kts)`, `settings.gradle(.kts)`
- Plants echo discovered script/task names or fixed stack-agnostic KEEP / usefulness templates.
- Track A command checks cover `yarn|npm|pnpm|bun`, `make`, `task`, `rake`/`rails`, `mvn`/`gradlew`, `go`, `composer`, `artisan`/`console`, and `bin/*`. Framework CLIs prefer false negatives over false BROKEN.

## Track A — Correctness

1. Path cites → case-sensitive existence (repo root or skill-relative).
2. Command cites → must exist in discovered manifest scripts when presented as runnable.
3. Skill-relative `references/` must resolve.
4. Dead skill names → BROKEN.

**Precision (prefer false negatives):**

- Never normalize with `str.lstrip('./')` — it turns a leading-dot dir like ".agents/…" into "agents/…". Strip only a "./" prefix.
- Skip placeholders: `SPEC_FOLDER`, `{module}`, `[feature]`, `path/to/...`, globs, `<angle>`.
- Only check concrete prefixes: `.agents/`, `.cursor/`, `docs/`, `.harness-eval/`, `.tlc/`, `references/`, `package/`, `app/`, `scripts/`.
- Skip package-manager builtins (`install`, `add`, …).
- Do not scan fenced code blocks for path cites (teaching examples stay in fences).
- Skill-relative `references/` may resolve under another skill named in the same surface (e.g. “load the `dev` skill and read `references/view.md`”).
- Missing `app/` / `lib/` / `test/` (and similar code-tree) cites are BROKEN only when mandate language (`load`, `open`, `must`, `required`, …) appears in the same paragraph — bare naming examples are not BROKEN.

## Track B — Redundancy

**Unit:** atomic claims (`claims.md`).

**Discovery cost:** 0 = exact manifest/config string; 1 = one listing/header; 2 = cross-module read; 3 = runtime/env/policy.

**Classes:** REDUNDANT-CODE | REDUNDANT-GENERAL | KEEP-POLICY | KEEP-CAVEAT | KEEP-ROUTING | KEEP-COMPRESSED | UNCLEAR.

**Hard rule:** cost ≥ 2 → never REDUNDANT-*.

**Plants (unlabeled in deck; orchestrator keeps `trap-key.json` private):**

| Template | Expected family |
|----------|-----------------|
| Manifest echo ×2 | REDUNDANT |
| Generic fluff ×2 | REDUNDANT |
| Fixed secrets policy | KEEP |
| Fixed local-vs-CI env caveat | KEEP |

KEEP plants must **not** be verbatim copies of claims already in the deck.

**Trap gate:** miss ≤ 1 plant family → PASS; else discard Ship band.

**Bands:** Ship = dual REDUNDANT + Judge2 cost≤1 + trap PASS; Review = dual KEEP; Hold = disagree.

## Track C — Usefulness

**Unit:** whole surfaces (`surfaces.md` from T0 + T1 + markdown T2), not atomic claims.

**Question:** If this surface were deleted, and the agent could still list the repo and open 1–2 canonical examples — **and any other harness surface that mandates loading this path still runs** — would behavior change?

**Overall classes:** KEEP-CORE | MIXED | SLIM | ROUTING-ONLY | UNCLEAR.

**Section tags (inside Keep-core / Slim columns):** BEHAVIOR-CHANGING | REPO-DEMONSTRATED | THEORY | OVERLAP | ROUTING-ONLY.

| Tag | Meaning |
|-----|---------|
| BEHAVIOR-CHANGING | Without it, wrong paths/APIs/gates are likely |
| REPO-DEMONSTRATED | Already taught by 1–2 concrete example files (judge evidence only — not a reason to add those paths into the skill) |
| THEORY | General SE knowledge; no repo-specific delta |
| OVERLAP | Same rule already in another harness surface (must cite path) |
| ROUTING-ONLY | Triggers / purpose / load pointers |

**Plants (`usefulness-trap-key.json`, private):**

| Template | Expected family |
|----------|-----------------|
| Generic clean-code theory surface | SLIM |
| Product-fluff surface | SLIM |
| Cross-module boundary / public-API policy surface | KEEP-CORE |

**Trap gate:** miss ≤ 1 plant family on Judge2 → PASS; else discard Slim band.

**Fan-in gate (deterministic, at merge — not judge-scored):** Before a dual SLIM/ROUTING-ONLY surface enters the Slim band, scan the **full** harness markdown corpus (T0 + all skill-tree `*.md` under `.agents/skills`, `.cursor/skills`, `.claude/skills` — not limited to `--seed` inventory). If another surface **hard-loads** the path (load/read/open mandate, “source of truth”, “extract … from”, Phase 0 load lists, etc.), move it to **Hold** with reason `slim-fanin-blocked`. Mere index-table mentions without mandate language do not block. Detail: `slim-fanin.json`.

**Bands:** Slim = dual SLIM/ROUTING-ONLY + trap PASS + fan-in PASS; Keep-core = dual KEEP-CORE; Mixed = dual MIXED; Hold = disagree / unclear / missing / slim-fanin-blocked.

**Mixed apply plan (deterministic, at merge):** For every dual-MIXED surface, `merge_usefulness.py` writes `11-mixed-apply.md` copying each judge’s Keep-core → **KEEP** and Slim → **CUT**. That file is the **only** Mixed apply input. Apply agents must not re-judge usefulness, redesign conventions, or invent cuts beyond CUT. If Keep-core/Slim cells are empty, skip the path (treat as Hold for apply).

### Model sensitivity (Track C)

Usefulness judgments depend on what the judge model treats as “general knowledge” vs repo-specific skill.

- **Always record** judge model ids in `08-usefulness-j1.md` and `09-usefulness-j2.md` headers (`model: <id>`).
- Prefer the **same allowlisted non-fast model** for C1 and C2 within one run (agreement stability).
- Before deleting large Slim bodies, **re-run Track C with a second model family** when available; treat cross-model disagreement as Hold.
- Track B (rediscovery cost) is less model-sensitive than Track C; never equate Ship (B) with Slim (C).

## Operator flow

Resolve `SKILL_DIR` = directory containing this skill’s `SKILL.md`.

```bash
RUN_ID=$(date -u +%Y-%m-%d)-full
python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID"
# After optional-docs-candidates.md: ask user, then e.g.:
# python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" --include-doc-type docs
# Scope to AGENTS.md + one-hop related skills/refs:
# python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" --seed AGENTS.md
# STOP: Q1 optional docs (if candidates), then Q2 approve B/C (see skill questionnaires)
python3 "$SKILL_DIR/scripts/track_a_correctness.py" --root . --run-id "$RUN_ID"
# If B approved:
# Track B judges → 05-redundancy-j1.md, 06-blind-scores.md
python3 "$SKILL_DIR/scripts/merge_agreement.py" --run-dir .harness-eval/runs/$RUN_ID
# If C approved:
python3 "$SKILL_DIR/scripts/surfaces_extract.py" --root . --run-id "$RUN_ID"
# Track C judges → 08-usefulness-j1.md, 09-usefulness-j2.md
python3 "$SKILL_DIR/scripts/merge_usefulness.py" --run-dir .harness-eval/runs/$RUN_ID
```

### Certainty and token consumption

| Track | Certainty | Token consumption |
|-------|-----------|-------------------|
| **A** | Highest — deterministic script; no LLM | ~0 model tokens |
| **B** | Medium — dual LLM + plants; trap gate; disagree → Hold | High — 2 × every claim |
| **C** | Lowest / model-sensitive — dual LLM + plants + fan-in | Highest — 2 × every surface (whole files) |

Human-facing reports: `04-correctness.md`, `07-agreement.md`, `10-usefulness-agreement.md` — each starts with **What these words mean**. Mixed apply plan: `11-mixed-apply.md`. Full glossary: skill `references/GLOSSARY.md`.

## Safety

Evidence-or-zero for BROKEN, REDUNDANT, and SLIM/THEORY; author ≠ blind judges; plants before Ship/Slim; disagree → Hold; no auto-edit.

**Slim apply:** never stub/delete a path in the Slim band if `10-usefulness-agreement.md` lists it under fan-in blocked, or if a fresh `slim_fanin.py --path <P>` reports citers — update consumers in the same change first.

**Mixed apply:** follow `11-mixed-apply.md` only (KEEP/CUT per ID). Do not re-judge from the Mixed path table in `10`. KEEP contracts must survive as in-skill rules/snippets; CUT is the only removable bulk.

**Mixed/Slim apply (self-contained):** When cutting REPO-DEMONSTRATED, THEORY, or OVERLAP bulk, leave the remaining BEHAVIOR-CHANGING text self-contained in the harness surface. Never replace a fenced teaching snippet (or the contract it carried) with a soft/hard pointer into `app/`, `lib/`, `test/`, or other non-harness trees. Paths cited in usefulness Evidence / REPO-DEMONSTRATED tags are for judges only.

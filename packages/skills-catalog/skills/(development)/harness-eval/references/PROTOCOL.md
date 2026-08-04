# Harness Evaluation Protocol

> Platform- and codebase-agnostic. Version: 1.4.1
> Scripts and this file live inside the `harness-eval` skill. Run outputs go to the target repo under `.tlc/harness-eval/runs/<id>/`.

## Purpose

Evaluate a repository’s **agent harness** for:

- **Track A — Correctness:** broken paths, missing commands, dead links (deterministic).
- **Track B — Redundancy:** instructions rediscoverable cheaply without harness text (dual LLM judge + plants).
- **Track C — Usefulness:** which surfaces change agent behavior vs restating theory, repo demos, or overlapping harness text (dual LLM judge + plants; **model-sensitive**).

Judgment is separate from remediation. Reports suggest; humans approve Slim/Ship edits.

## Surface inventory (tiers)

| Tier | Name | Discovery |
|------|------|-----------|
| **T0** | Always-on rules | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/**`, `*.mdc` under repo / `.agents/` / `.cursor/` |
| **T1** | Skills | `.agents/skills/**/SKILL.md`, `.cursor/skills/**/SKILL.md`, plus `references/**` linked from those files |
| **T2** | Referenced docs | One-hop paths cited by T0/T1 |

**Out of scope:** `README*`, app source as instruction surface (evidence only), user-global rules outside the repo, recursive crawl of all `docs/`.

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
- Only check concrete prefixes: `.agents/`, `.cursor/`, `docs/`, `.tlc/`, `references/`, `package/`, `app/`, `scripts/`.
- Skip package-manager builtins (`install`, `add`, …).

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
| Fixed bundling/persistence caveat | KEEP |

KEEP plants must **not** be verbatim copies of claims already in the deck.

**Trap gate:** miss ≤ 1 plant family → PASS; else discard Ship band.

**Bands:** Ship = dual REDUNDANT + Judge2 cost≤1 + trap PASS; Review = dual KEEP; Hold = disagree.

## Track C — Usefulness

**Unit:** whole surfaces (`surfaces.md` from T0 + T1 + markdown T2), not atomic claims.

**Question:** If this surface were deleted, and the agent could still list the repo and open 1–2 canonical examples, would behavior change?

**Overall classes:** KEEP-CORE | MIXED | SLIM | ROUTING-ONLY | UNCLEAR.

**Section tags (inside Keep-core / Slim columns):** BEHAVIOR-CHANGING | REPO-DEMONSTRATED | THEORY | OVERLAP | ROUTING-ONLY.

| Tag | Meaning |
|-----|---------|
| BEHAVIOR-CHANGING | Without it, wrong paths/APIs/gates are likely |
| REPO-DEMONSTRATED | Already taught by 1–2 concrete example files |
| THEORY | General SE knowledge; no repo-specific delta |
| OVERLAP | Same rule already in another harness surface (must cite path) |
| ROUTING-ONLY | Triggers / purpose / load pointers |

**Plants (`usefulness-trap-key.json`, private):**

| Template | Expected family |
|----------|-----------------|
| Generic clean-code theory surface | SLIM |
| Product-fluff surface | SLIM |
| Cross-boundary persistence policy surface | KEEP-CORE |

**Trap gate:** miss ≤ 1 plant family on Judge2 → PASS; else discard Slim band.

**Bands:** Slim = dual SLIM/ROUTING-ONLY + trap PASS; Keep-core = dual KEEP-CORE; Mixed = dual MIXED; Hold = disagree / unclear / missing.

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
# Scope to AGENTS.md + one-hop related skills/docs:
# python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" --seed AGENTS.md
python3 "$SKILL_DIR/scripts/track_a_correctness.py" --root . --run-id "$RUN_ID"
# Track B judges → 05-redundancy-j1.md, 06-blind-scores.md
python3 "$SKILL_DIR/scripts/merge_agreement.py" --run-dir .tlc/harness-eval/runs/$RUN_ID
python3 "$SKILL_DIR/scripts/surfaces_extract.py" --root . --run-id "$RUN_ID"
# Track C judges → 08-usefulness-j1.md, 09-usefulness-j2.md
python3 "$SKILL_DIR/scripts/merge_usefulness.py" --run-dir .tlc/harness-eval/runs/$RUN_ID
```

Human-facing reports: `04-correctness.md`, `07-agreement.md`, `10-usefulness-agreement.md` — each starts with **What these words mean**. Full glossary: skill `references/GLOSSARY.md`.

## Safety

Evidence-or-zero for BROKEN, REDUNDANT, and SLIM/THEORY; author ≠ blind judges; plants before Ship/Slim; disagree → Hold; no auto-edit.

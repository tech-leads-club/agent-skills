# Harness Eval — plain-language glossary

Embedded at the top of `04-correctness.md`, `07-agreement.md`, and `10-usefulness-agreement.md`. Prefer verbs over jargon when talking to humans.

## The three tracks

| Track | Question it answers | Certainty | Tokens | Main report |
|-------|---------------------|-----------|--------|-------------|
| **A — Correctness** | Is a cited path or command broken? | Highest (script, no LLM) | ~0 model | `04-correctness.md` |
| **B — Redundancy** | Would an agent rediscover this cheaply without the harness text? | Medium (dual LLM + plants) | High (2 × claims) | `07-agreement.md` |
| **C — Usefulness** | Does this surface change agent behavior, or is it theory / demo / overlap? | Lowest / model-sensitive | Highest (2 × surfaces) | `10-usefulness-agreement.md` |

**Run gating:** After inventory → Q1 (optional docs) → Q2 (B/C budget) → A always → B/C if approved.

**Do not equate tracks:** Ship (B) ≠ Slim (C). Rediscoverable ≠ useless. Useful ≠ non-redundant.

## Shared terms

| Term | Meaning | What you should do |
|------|---------|-------------------|
| **Trap gate PASS** | Planted fake claims/surfaces were scored correctly — judges are calibrated | Trust Ship / Slim bands |
| **Trap gate FAIL** | Judges failed discrimination plants | **Ignore** Ship / Slim; fix plants and re-run |
| **Hold** | Judges disagreed, score missing, or both unclear | **Do nothing** until you decide manually |
| **T0 / T1 / T2** | Always-on rules / skills / cited harness refs | Priority: edit T0 first (always loaded) |
| **`--seed`** | Scope inventory to a starting file + one-hop related skills/refs | Only that subgraph was evaluated |
| **Optional docs** | Cited project docs outside skill trees (not ADRs/RFCs) | Default off; approve types via `optional-docs-candidates.md` |
| **ADR / RFC** | Decision-record docs | **Never** scored as T2 surfaces |

## Track A

| Term | Meaning | What you should do |
|------|---------|-------------------|
| **BROKEN** | Cited file/command does not exist (high-precision check) | Fix the cite or restore the file |

## Track B (redundancy)

| Term | Meaning | What you should do |
|------|---------|-------------------|
| **Ship** | Both judges: redundant **and** cheap to rediscover (cost ≤ 1) | **Safe to delete / trim** |
| **Review** | Both judges: keep (not redundant) | **Leave alone** for redundancy reasons |
| **REDUNDANT-CODE** | Echoes manifests/code layout | Candidate delete (only if Ship) |
| **REDUNDANT-GENERAL** | Generic advice, no repo-specific signal | Candidate delete (only if Ship) |
| **KEEP-POLICY / KEEP-CAVEAT / KEEP-ROUTING / KEEP-COMPRESSED** | Keep families | Leave alone |

## Track C (usefulness)

| Term | Meaning | What you should do |
|------|---------|-------------------|
| **Keep-core** | Most of the file **changes agent behavior** | **Do not slim** |
| **Mixed** | Real behavior-changing core **plus** large theory/examples/overlap | Follow **`11-mixed-apply.md`** (KEEP vs CUT) — do not re-judge |
| **Slim** | Mostly theory, repo-demo fluff, or overlap — **and** fan-in PASS | **Compress or delete body** (model-sensitive) |
| **Fan-in blocked** | Another harness surface hard-loads this path as SoT / required load | **Do not stub/delete** until those consumers are updated |
| **BEHAVIOR-CHANGING** | Without this text, agents likely do the wrong thing | Preserve |
| **REPO-DEMONSTRATED** | Already taught by opening 1–2 example files (judge cites those paths as evidence) | Safe to **cut** from the skill — do **not** replace with a `See app/...` pointer |
| **THEORY** | General software advice | Safe to cut |
| **OVERLAP** | Same rule already in another harness file | Cut here; keep the canonical copy |
| **ROUTING-ONLY** | Triggers / pointers | Keep short |

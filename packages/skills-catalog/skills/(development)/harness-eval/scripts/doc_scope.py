#!/usr/bin/env python3
"""Classify T2 cite targets: agent harness refs vs excluded decision records vs optional docs.

Stack-agnostic: path-segment heuristics only (no product/framework assumptions).
"""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

# why: skill trees are agent harness regardless of host product folder name
AGENT_SKILL_ROOTS = (
    ".agents/skills/",
    ".cursor/skills/",
    ".claude/skills/",
)

# why: decision-record corpora are human architecture process, not agent SoT
ADR_RFC_DIR_RE = re.compile(
    r"(^|/)"
    r"(adr|adrs|architecture-decision-records?|"
    r"rfc|rfcs|requests?-for-comments?)"
    r"(/|$)",
    re.I,
)
ADR_RFC_FILE_RE = re.compile(r"(^|/)(adr|rfc)[-_][^/]+\.md$", re.I)


def normalize_rel(path: str) -> str:
    # hazard: never str.lstrip("./"); it turns ".agents/…" into "agents/…". Strip only "./" repeatedly.
    p = path.replace("\\", "/")
    while p.startswith("./"):
        p = p[2:]
    return p


def is_agent_harness_ref(rel_path: str) -> bool:
    """Skill-tree files (SKILL.md, references/, etc.) — always eligible as T2."""
    p = normalize_rel(rel_path)
    return any(p.startswith(root) or f"/{root}" in f"/{p}" for root in AGENT_SKILL_ROOTS)


def is_excluded_decision_record(rel_path: str) -> bool:
    """ADRs / RFCs (and similarly named decision-record trees) — never T2 surfaces."""
    p = normalize_rel(rel_path)
    return bool(ADR_RFC_DIR_RE.search(p) or ADR_RFC_FILE_RE.search(p))


def optional_doc_type(rel_path: str) -> str:
    """Bucket key for user approval (presence-based, not stack-specific)."""
    p = normalize_rel(rel_path)
    parts = [x for x in p.split("/") if x]
    if len(parts) >= 2:
        # why: docs/foo.md → docs; docs/guides/x.md → docs/guides
        if parts[0].lower() in {"docs", "doc", "documentation", "wiki", "handbook", "guides"}:
            if len(parts) >= 3:
                return f"{parts[0]}/{parts[1]}"
            return parts[0]
        return parts[0]
    return parts[0] if parts else "root"


def classify_t2_cite(rel_path: str) -> str:
    """Return agent_ref | excluded_decision_record | optional_doc.

    Agent skill-tree paths win even when a skill folder is named ``adr`` —
    those are harness SoT for writing ADRs, not the decision-record corpus.
    """
    if is_agent_harness_ref(rel_path):
        return "agent_ref"
    if is_excluded_decision_record(rel_path):
        return "excluded_decision_record"
    return "optional_doc"


def filter_t2_paths(
    root: Path,
    candidates: list[Path],
    *,
    include_docs: set[str] | None = None,
    include_doc_types: set[str] | None = None,
) -> tuple[list[Path], dict]:
    """Split candidates; return (included_t2, scope_report).

    ``include_docs`` — exact repo-relative paths.
    ``include_doc_types`` — buckets from ``optional_doc_type`` (e.g. ``docs``).
    Decision records are never included even if listed.
    """
    include_docs = {normalize_rel(p) for p in (include_docs or set())}
    include_doc_types = set(include_doc_types or set())
    root = root.resolve()

    included: list[Path] = []
    excluded: list[dict] = []
    optional_by_type: dict[str, list[str]] = defaultdict(list)
    included_optional: list[str] = []

    for path in candidates:
        try:
            rel = path.resolve().relative_to(root).as_posix()
        except ValueError:
            continue
        kind = classify_t2_cite(rel)
        if kind == "excluded_decision_record":
            excluded.append({"path": rel, "reason": "adr_or_rfc"})
            continue
        if kind == "agent_ref":
            included.append(path.resolve())
            continue
        dtype = optional_doc_type(rel)
        optional_by_type[dtype].append(rel)
        if rel in include_docs or dtype in include_doc_types:
            included.append(path.resolve())
            included_optional.append(rel)

    included = sorted(set(included), key=lambda p: p.as_posix())
    report = {
        "policy": {
            "agent_harness_refs": "always_include",
            "adr_rfc_decision_records": "always_exclude",
            "other_cited_docs": "opt_in_after_user_approval",
        },
        "excluded_decision_records": sorted(excluded, key=lambda x: x["path"]),
        "optional_by_type": {
            k: sorted(set(v)) for k, v in sorted(optional_by_type.items())
        },
        "included_optional_docs": sorted(set(included_optional)),
        "included_doc_types": sorted(include_doc_types),
    }
    return included, report


def write_optional_docs_md(path: Path, report: dict) -> None:
    """Human-facing candidate list for the orchestrator to present to the user."""
    lines = [
        "# Optional docs (not in eval unless approved)",
        "",
        "Non-agent documents cited by T0/T1. **ADRs / RFCs are always excluded.**",
        "Agent skill-tree files (`.agents/skills`, `.cursor/skills`, `.claude/skills`) are always in scope.",
        "",
        "## Ask the user",
        "",
        "Present the doc **types** below and ask which (if any) to include in this run.",
        "Then re-run inventory with `--include-doc-type <type>` and/or `--include-doc <path>`.",
        "",
        "## Always excluded (decision records)",
        "",
    ]
    excluded = report.get("excluded_decision_records") or []
    if not excluded:
        lines.append("_None discovered in one-hop cites._")
    else:
        lines.append(f"_{len(excluded)} path(s) skipped (ADR/RFC trees or filenames)._")
        for row in excluded[:40]:
            lines.append(f"- `{row['path']}`")
        if len(excluded) > 40:
            lines.append(f"- … +{len(excluded) - 40} more")
    lines += ["", "## Optional types (default: omitted)", ""]
    optional = report.get("optional_by_type") or {}
    if not optional:
        lines.append("_No optional cited docs outside agent skill trees._")
    else:
        lines += [
            "| Type | Count | Example paths |",
            "|------|------:|---------------|",
        ]
        for dtype, paths in optional.items():
            examples = ", ".join(f"`{p}`" for p in paths[:3])
            if len(paths) > 3:
                examples += f" (+{len(paths) - 3})"
            lines.append(f"| `{dtype}` | {len(paths)} | {examples} |")
        lines += [
            "",
            "### Re-run examples",
            "",
            "```bash",
            'python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" \\',
            "  --include-doc-type docs",
            'python3 "$SKILL_DIR/scripts/inventory_extract.py" --root . --run-id "$RUN_ID" \\',
            "  --include-doc docs/context.md --include-doc docs/infrastructure.md",
            "```",
            "",
        ]
    included = report.get("included_optional_docs") or []
    lines += ["## Included optional docs this run", ""]
    if not included:
        lines.append("_None (default)._")
    else:
        for p in included:
            lines.append(f"- `{p}`")
    lines.append("")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

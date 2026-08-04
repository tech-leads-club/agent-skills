#!/usr/bin/env python3
"""Build Track C surface deck + usefulness plants from an existing run inventory."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
MAX_CHARS = 12000  # why: deck truncates; judges must read full file on disk

# why: plants are synthetic surfaces for trap calibration, not real files
USEFULNESS_PLANTS = (
    {
        "id": "S901",
        "expected_family": "SLIM",
        "title": "Clean coding tips",
        "body": (
            "# Clean Coding Tips\n\n"
            "- Prefer clear variable names and small functions.\n"
            "- Follow SOLID and keep layers thin.\n"
            "- Write readable comments when needed.\n"
            "- Prefer composition over inheritance when practical.\n"
        ),
    },
    {
        "id": "S902",
        "expected_family": "SLIM",
        "title": "Assistant highlights",
        "body": (
            "# Assistant Highlights\n\n"
            "- Works with natural language.\n"
            "- Returns relevant results quickly.\n"
            "- Most efficient first step for any task.\n"
        ),
    },
    {
        "id": "S903",
        "expected_family": "KEEP-CORE",
        "title": "Module boundary rule",
        "body": (
            "# Module Boundary Rule\n\n"
            "## Critical\n\n"
            "- Never reach into another module's private storage or internal data access layer.\n"
            "- Call only that module's documented public API or exported interface.\n"
            "- Writes that span modules must use the project's declared transaction or unit-of-work "
            "boundary for the owning module — do not open a second write path around it.\n"
            "- If you need data owned elsewhere, go through that owner module; do not import its "
            "internal repositories, tables, or storage helpers.\n"
        ),
    },
)


def default_run(root: Path, run_id: str) -> Path:
    return root / ".tlc" / "harness-eval" / "runs" / run_id


def section_outline(text: str, limit: int = 40) -> list[str]:
    out = []
    for line in text.splitlines():
        m = HEADING_RE.match(line.strip())
        if m:
            out.append(f"{'  ' * (len(m.group(1)) - 1)}- {m.group(2).strip()}")
        if len(out) >= limit:
            out.append("- …")
            break
    return out or ["- (no headings)"]


def truncate(text: str, n: int = MAX_CHARS) -> str:
    if len(text) <= n:
        return text
    return text[:n] + "\n\n…[truncated for deck; judge must read full file on disk]…\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--run-dir", type=Path, default=None)
    args = ap.parse_args()
    root = args.root.resolve()
    run = (args.run_dir or default_run(root, args.run_id)).resolve()
    inv_path = run / "inventory.json"
    if not inv_path.is_file():
        print(f"missing inventory: {inv_path}", file=sys.stderr)
        return 1
    inv = json.loads(inv_path.read_text(encoding="utf-8"))

    surfaces: list[dict] = []
    n = 1
    for tier_key, tier in (("t0", "T0"), ("t1", "T1"), ("t2", "T2")):
        for rel in inv.get(tier_key, []):
            path = root / rel
            if not path.is_file():
                continue
            # why: Track C scores instruction usefulness; non-md T2 manifests are out of scope
            if tier == "T2" and path.suffix.lower() not in {".md", ".mdc"}:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            sid = f"S{n:03d}"
            n += 1
            name = path.parent.name if path.name == "SKILL.md" else path.name
            surfaces.append(
                {
                    "id": sid,
                    "tier": tier,
                    "name": name,
                    "path": rel,
                    "is_plant": False,
                    "chars": len(text),
                    "outline": section_outline(text),
                    "body_preview": truncate(text),
                }
            )

    trap_plants = []
    for plant in USEFULNESS_PLANTS:
        surfaces.append(
            {
                "id": plant["id"],
                "tier": "T1",
                "name": plant["title"],
                # invariant: judge-facing path must not contain the word "plant"
                "path": f"(deck)/{plant['id']}.md",
                "is_plant": True,
                "chars": len(plant["body"]),
                "outline": section_outline(plant["body"]),
                "body_preview": plant["body"],
            }
        )
        trap_plants.append(
            {
                "id": plant["id"],
                "expected_family": plant["expected_family"],
                "title": plant["title"],
            }
        )

    # invariant: plants stay unlabeled in the judge-facing deck (no "plant" in section titles)
    md = [
        "# Track C — Surface deck (usefulness)",
        "",
        f"> run: {args.run_id}",
        f"> generated: {datetime.now(timezone.utc).isoformat()}",
        f"> model note: usefulness is model-sensitive; record judge model ids in score files.",
        "",
        "## Rubric (score every surface including S9xx)",
        "",
        "Counterfactual: if this surface were deleted, and the agent could still list the repo "
        "and open 1–2 canonical examples, would behavior change?",
        "",
        "| Overall class | Meaning |",
        "|---------------|---------|",
        "| KEEP-CORE | Majority of substance is BEHAVIOR-CHANGING (wrong file placement, wrong API, skipped gates without it) |",
        "| MIXED | Meaningful keep-core core + large slimable theory/examples/overlap |",
        "| SLIM | Mostly THEORY, REPO-DEMONSTRATED, or OVERLAP — compress or delete body |",
        "| ROUTING-ONLY | Trigger/purpose/pointers only; keep short |",
        "| UNCLEAR | Insufficient evidence (use when model prior is doing the work) |",
        "",
        "Section tags to use inside Keep-core / Slim columns: "
        "`BEHAVIOR-CHANGING`, `REPO-DEMONSTRATED`, `THEORY`, `OVERLAP`, `ROUTING-ONLY`.",
        "",
        "Hard rules:",
        "- Evidence-or-zero: cite paths (harness or example code). No README as evidence.",
        "- OVERLAP must cite the other harness surface path.",
        "- REPO-DEMONSTRATED must cite a concrete example file an agent would open.",
        "- Default UNCLEAR when unsure. Do not mark SLIM on methodology skills without evidence.",
        "- Score every ID including S9xx with the same rubric.",
        "",
        f"## Surfaces ({len(surfaces)})",
        "",
    ]

    for s in surfaces:
        md += [
            f"### {s['id']} | {s['tier']} | {s['name']}",
            "",
            f"- path: `{s['path']}`",
            f"- chars: {s['chars']}",
            "- outline:",
        ]
        md.extend(s["outline"])
        md += ["", "```markdown", s["body_preview"].rstrip(), "```", ""]

    (run / "surfaces.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    (run / "surfaces.json").write_text(
        json.dumps({"surfaces": surfaces, "generated_at": datetime.now(timezone.utc).isoformat()}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    trap = {
        "pass_threshold_misses": 1,
        "plants": trap_plants,
        "note": "Orchestrator-only. Judges must not read this file.",
    }
    (run / "usefulness-trap-key.json").write_text(json.dumps(trap, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "surfaces": len(surfaces),
                "plants": len(trap_plants),
                "surfaces_md": str(run / "surfaces.md"),
                "trap": str(run / "usefulness-trap-key.json"),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

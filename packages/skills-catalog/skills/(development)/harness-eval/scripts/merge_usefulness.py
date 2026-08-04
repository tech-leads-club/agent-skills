#!/usr/bin/env python3
"""Merge Track C usefulness Judge1/Judge2 scores + trap key into Slim/Keep/Hold.

Applies a deterministic Slim fan-in gate: dual SLIM/ROUTING-ONLY surfaces that are
hard-loaded as SoT by another harness surface are moved to Hold (not Slim).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

# why: fan-in lives beside this script inside the skill package
sys.path.insert(0, str(Path(__file__).resolve().parent))
from slim_fanin import find_mandate_fanin, infer_root_from_run_dir, normalize_cite  # noqa: E402

ROW_RE = re.compile(
    r"^\|\s*(?P<id>S\d{3})\s*\|\s*(?P<overall>[A-Z-]+)\s*\|",
    re.M,
)
MODEL_RE = re.compile(r"model:\s*`?([^\n`]+)`?", re.I)

SLIM_FAMILY = {"SLIM", "ROUTING-ONLY"}
KEEP_FAMILY = {"KEEP-CORE"}
MIXED_FAMILY = {"MIXED"}
# why: UNCLEAR is hold-ish; dual UNCLEAR still holds rather than Slim/Keep


def family(overall: str) -> str:
    o = overall.upper().strip()
    if o in SLIM_FAMILY:
        return "SLIM"
    if o in KEEP_FAMILY:
        return "KEEP-CORE"
    if o in MIXED_FAMILY:
        return "MIXED"
    if o == "ROUTING-ONLY":
        return "SLIM"
    if o == "UNCLEAR":
        return "UNCLEAR"
    return "OTHER"


def parse_scores(path: Path) -> tuple[dict[str, dict], str | None]:
    text = path.read_text(encoding="utf-8", errors="replace")
    model_m = MODEL_RE.search(text)
    model = model_m.group(1).strip() if model_m else None
    out = {}
    for m in ROW_RE.finditer(text):
        oid = m.group("id")
        overall = m.group("overall").upper()
        out[oid] = {"overall": overall, "family": family(overall)}
    return out, model


def load_surfaces(path: Path) -> dict[str, dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {s["id"]: s for s in data.get("surfaces", [])}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--run-dir", type=Path, required=True)
    ap.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Repo root for fan-in scan (default: parent of .harness-eval/)",
    )
    args = ap.parse_args()
    run = args.run_dir.resolve()
    root = (args.root or infer_root_from_run_dir(run)).resolve()
    j1, m1 = parse_scores(run / "08-usefulness-j1.md")
    j2, m2 = parse_scores(run / "09-usefulness-j2.md")
    surfaces = load_surfaces(run / "surfaces.json")
    trap = json.loads((run / "usefulness-trap-key.json").read_text(encoding="utf-8"))

    misses = []
    for p in trap.get("plants", []):
        pid = p["id"]
        expected = p["expected_family"]
        got = j2.get(pid, {}).get("family")
        # why: ROUTING-ONLY is in the SLIM family for trap matching
        if got != expected:
            if not (expected == "SLIM" and j2.get(pid, {}).get("overall") == "ROUTING-ONLY"):
                misses.append({"id": pid, "expected": expected, "got": got})
    trap_pass = len(misses) <= int(trap.get("pass_threshold_misses", 1))

    slim, keep, mixed, hold = [], [], [], []
    fanin_blocked: list[tuple] = []
    fanin_report: dict[str, list] = {}

    for sid, surf in surfaces.items():
        if surf.get("is_plant"):
            continue
        a, b = j1.get(sid), j2.get(sid)
        if not a or not b:
            hold.append((sid, surf, a, b, "missing-score"))
            continue
        if a["family"] != b["family"]:
            hold.append((sid, surf, a, b, "disagree"))
            continue
        if a["family"] == "UNCLEAR":
            hold.append((sid, surf, a, b, "both-unclear"))
            continue
        if a["family"] == "SLIM" and trap_pass:
            path = normalize_cite(surf.get("path") or "")
            # why: plants and missing paths have no on-disk fan-in
            if path and not path.startswith("plant:") and (root / path).is_file():
                hits = find_mandate_fanin(root, path)
            else:
                hits = []
            if hits:
                fanin_report[sid] = hits
                hold.append((sid, surf, a, b, "slim-fanin-blocked"))
                fanin_blocked.append((sid, surf, a, b, hits))
            else:
                slim.append((sid, surf, a, b))
        elif a["family"] == "SLIM" and not trap_pass:
            hold.append((sid, surf, a, b, "trap-fail-discard-slim"))
        elif a["family"] == "KEEP-CORE":
            keep.append((sid, surf, a, b))
        elif a["family"] == "MIXED":
            mixed.append((sid, surf, a, b))
        else:
            hold.append((sid, surf, a, b, "other"))

    def tier_bucket(items):
        return dict(Counter(c[1]["tier"] for c in items))

    lines = [
        "# Harness Eval: Usefulness Agreement (Track C)",
        "",
        f"> Run dir: `{run}`",
        f"> Trap gate: {'PASS' if trap_pass else 'FAIL'} (misses={len(misses)})",
        f"> Fan-in gate: {'PASS' if not fanin_blocked else 'BLOCKED'} "
        f"(slim-fanin-blocked={len(fanin_blocked)})",
        f"> Judges: J1 model=`{m1 or 'unrecorded'}` · J2 model=`{m2 or 'unrecorded'}`",
        "> Bands: Slim = dual SLIM/ROUTING + trap PASS + fan-in PASS; "
        "Keep-core = dual KEEP-CORE; Mixed = dual MIXED; "
        "Hold = disagree / unclear / missing / slim-fanin-blocked",
        "> **Model-sensitive:** re-judge on a second model before large Slim deletes.",
        "> **Fan-in:** another harness surface hard-loads this path as SoT → Hold, not Slim.",
        "",
        "## What these words mean",
        "",
        "| Word | Meaning | You should |",
        "|------|---------|------------|",
        "| **Keep-core** | Most of the file changes agent behavior | Do **not** slim |",
        "| **Mixed** | Real rules + large theory/examples/overlap | Keep rules; cut bulk |",
        "| **Slim** | Mostly theory / repo-demo / overlap, **and** no other harness surface hard-loads it | Compress or delete body |",
        "| **Hold** | Judges disagreed, unclear, or Slim blocked by fan-in | Do nothing yet (or update consumers first) |",
        "| **Trap PASS** | Planted traps scored correctly | Necessary but not sufficient for Slim |",
        "| **Fan-in blocked** | Another harness file mandates loading this path / treats it as SoT | Do **not** stub/delete until consumers are updated |",
        "",
        "This track answers: *does deleting this change agent behavior?* "
        "Not the same as redundancy (`07-agreement.md`).",
        "",
        "## Executive summary",
        "",
        f"- Real surfaces scored: {sum(1 for s in surfaces.values() if not s.get('is_plant'))}",
        f"- Slim: **{len(slim)}**",
        f"- Keep-core: **{len(keep)}**",
        f"- Mixed: **{len(mixed)}**",
        f"- Hold: **{len(hold)}** (fan-in blocked: {len(fanin_blocked)})",
        f"- Trap misses: {misses or 'none'}",
        "",
        "## Discrimination (plants)",
        "",
        "| ID | Expected family | J2 family |",
        "|----|-----------------|-----------|",
    ]
    for p in trap.get("plants", []):
        got = j2.get(p["id"], {}).get("family", "MISSING")
        lines.append(f"| {p['id']} | {p['expected_family']} | {got} |")

    lines += [
        "",
        f"Slim by tier: {tier_bucket(slim)}",
        f"Keep-core by tier: {tier_bucket(keep)}",
        f"Mixed by tier: {tier_bucket(mixed)}",
        f"Hold by tier: {tier_bucket(hold)}",
        "",
        "## Slim (compress / delete body candidates)",
        "",
        "| ID | Tier | Name | Path | J1 | J2 |",
        "|----|------|------|------|----|----|",
    ]
    for sid, surf, a, b in slim:
        lines.append(
            f"| {sid} | {surf['tier']} | {surf['name']} | `{surf['path']}` | {a['overall']} | {b['overall']} |"
        )

    lines += [
        "",
        "## Slim fan-in blocked (do not stub/delete)",
        "",
        "Dual SLIM/ROUTING-ONLY, but another harness surface hard-loads the path "
        "(load/SoT/extract mandate). Update or drop those consumers before Slim apply.",
        "",
        "| ID | Path | Citers |",
        "|----|------|--------|",
    ]
    if fanin_blocked:
        for sid, surf, _a, _b, hits in fanin_blocked:
            unique = list(dict.fromkeys(h["citer"] for h in hits))
            citers = ", ".join(f"`{c}`" for c in unique[:8])
            if len(unique) > 8:
                citers += f" (+{len(unique) - 8} more)"
            lines.append(f"| {sid} | `{surf['path']}` | {citers} |")
    else:
        lines.append("| — | — | none |")

    lines += [
        "",
        "## Keep-core",
        "",
        "| ID | Tier | Name | Path | J1 | J2 |",
        "|----|------|------|------|----|----|",
    ]
    for sid, surf, a, b in keep:
        lines.append(
            f"| {sid} | {surf['tier']} | {surf['name']} | `{surf['path']}` | {a['overall']} | {b['overall']} |"
        )

    lines += [
        "",
        "## Mixed (keep core, slim examples/theory)",
        "",
        "| ID | Tier | Name | Path | J1 | J2 |",
        "|----|------|------|------|----|----|",
    ]
    for sid, surf, a, b in mixed:
        lines.append(
            f"| {sid} | {surf['tier']} | {surf['name']} | `{surf['path']}` | {a['overall']} | {b['overall']} |"
        )

    lines += [
        "",
        "## Hold",
        "",
        "| ID | Tier | Reason | J1 | J2 | Path |",
        "|----|------|--------|----|----|------|",
    ]
    for sid, surf, a, b, reason in hold:
        a_s = a["overall"] if a else "—"
        b_s = b["overall"] if b else "—"
        lines.append(
            f"| {sid} | {surf['tier']} | {reason} | {a_s} | {b_s} | `{surf['path']}` |"
        )

    lines += [
        "",
        "## Action guidance",
        "",
        "- **Slim:** compress only after trap PASS **and** fan-in PASS; still human-approve; "
        "prefer re-judge on a second model if deleting >30% of a skill.",
        "- **Slim fan-in blocked:** do **not** stub/delete; either keep the checklist body or "
        "update every citing harness surface in the same change, then re-merge.",
        "- **Mixed:** keep BEHAVIOR-CHANGING bullets/snippets self-contained in the surface; "
        "cut THEORY / REPO-DEMONSTRATED / OVERLAP bulk. Never replace a fenced teaching snippet "
        "with `See app/...` (or other non-harness path) — those paths are judge evidence only.",
        "- **Keep-core:** do not slim for usefulness reasons.",
        "- **Hold:** no usefulness trim.",
        "- See `08-usefulness-j1.md` / `09-usefulness-j2.md` for section-level Keep-core vs Slim detail.",
        "- Fan-in detail JSON: `slim-fanin.json`.",
        "",
    ]
    out = run / "10-usefulness-agreement.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")

    fanin_path = run / "slim-fanin.json"
    fanin_path.write_text(
        json.dumps(
            {
                "root": str(root),
                "blocked": {
                    sid: {
                        "path": surfaces[sid]["path"],
                        "citers": hits,
                    }
                    for sid, hits in fanin_report.items()
                },
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "trap_pass": trap_pass,
                "fanin_blocked": len(fanin_blocked),
                "slim": len(slim),
                "keep": len(keep),
                "mixed": len(mixed),
                "hold": len(hold),
                "models": {"j1": m1, "j2": m2},
                "report": str(out),
                "fanin": str(fanin_path),
            },
            indent=2,
        )
    )
    return 0 if trap_pass else 2


if __name__ == "__main__":
    sys.exit(main())

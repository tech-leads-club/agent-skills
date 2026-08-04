#!/usr/bin/env python3
"""Merge Track C usefulness Judge1/Judge2 scores + trap key into Slim/Keep/Hold."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

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
    args = ap.parse_args()
    run = args.run_dir
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
        f"> Judges: J1 model=`{m1 or 'unrecorded'}` · J2 model=`{m2 or 'unrecorded'}`",
        "> Bands: Slim = dual SLIM/ROUTING + trap PASS; Keep-core = dual KEEP-CORE; "
        "Mixed = dual MIXED; Hold = disagree / unclear / missing",
        "> **Model-sensitive:** re-run with a different allowlisted model before large Slim deletes.",
        "",
        "## What these words mean",
        "",
        "| Word | Meaning | You should |",
        "|------|---------|------------|",
        "| **Keep-core** | Most of the file changes agent behavior | Do **not** slim |",
        "| **Mixed** | Real rules + large theory/examples/overlap | Keep rules; cut bulk |",
        "| **Slim** | Mostly theory / repo-demo / overlap | Compress or delete body |",
        "| **Hold** | Judges disagreed or unclear | Do nothing yet |",
        "| **Trap PASS** | Planted traps scored correctly | Trust Slim |",
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
        f"- Hold: **{len(hold)}**",
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
        "- **Slim:** high-confidence compress — still human-approve; prefer re-judge on a second model if deleting >30% of a skill.",
        "- **Mixed:** keep BEHAVIOR-CHANGING bullets; cut THEORY / long examples that cite REPO-DEMONSTRATED paths.",
        "- **Keep-core:** do not slim for usefulness reasons.",
        "- **Hold:** no usefulness trim.",
        "- See `08-usefulness-j1.md` / `09-usefulness-j2.md` for section-level Keep-core vs Slim detail.",
        "",
    ]
    out = run / "10-usefulness-agreement.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "trap_pass": trap_pass,
                "slim": len(slim),
                "keep": len(keep),
                "mixed": len(mixed),
                "hold": len(hold),
                "models": {"j1": m1, "j2": m2},
                "report": str(out),
            },
            indent=2,
        )
    )
    return 0 if trap_pass else 2


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Merge Judge1 + Judge2 scores with trap-key into Ship/Review/Hold. Skill-local script."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROW_RE = re.compile(
    r"^\|\s*(?P<id>[CP]\d{3})\s*\|\s*(?P<cost>\d+)\s*\|\s*(?P<cls>[A-Z0-9_-]+)\s*\|",
    re.M,
)
REDUNDANT = {"REDUNDANT-CODE", "REDUNDANT-GENERAL"}
KEEP = {"KEEP-POLICY", "KEEP-CAVEAT", "KEEP-ROUTING", "KEEP-COMPRESSED", "UNCLEAR"}


def family(cls: str) -> str:
    if cls in REDUNDANT:
        return "REDUNDANT"
    if cls in KEEP:
        return "KEEP"
    return "OTHER"


def parse_scores(path: Path) -> dict[str, dict]:
    text = path.read_text(encoding="utf-8", errors="replace")
    out = {}
    for m in ROW_RE.finditer(text):
        out[m.group("id")] = {
            "cost": int(m.group("cost")),
            "class": m.group("cls"),
            "family": family(m.group("cls")),
        }
    return out


def load_claims(path: Path) -> dict[str, dict]:
    rows = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            rows[row["id"]] = row
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--run-dir", type=Path, required=True)
    args = ap.parse_args()
    run = args.run_dir
    j1 = parse_scores(run / "05-redundancy-j1.md")
    j2 = parse_scores(run / "06-blind-scores.md")
    claims = load_claims(run / "claims.jsonl")
    trap = json.loads((run / "trap-key.json").read_text(encoding="utf-8"))

    misses = []
    for p in trap.get("plants", []):
        pid = p["id"]
        expected = p["expected_family"]
        got = j2.get(pid, {}).get("family")
        if got != expected:
            misses.append({"id": pid, "expected": expected, "got": got})
    trap_pass = len(misses) <= int(trap.get("pass_threshold_misses", 1))

    ship, review, hold = [], [], []
    for cid, claim in claims.items():
        if claim.get("is_plant"):
            continue
        a, b = j1.get(cid), j2.get(cid)
        if not a or not b:
            hold.append((cid, claim, a, b, "missing-score"))
            continue
        if a["family"] != b["family"]:
            hold.append((cid, claim, a, b, "disagree"))
            continue
        if a["family"] == "REDUNDANT" and b["cost"] <= 1 and trap_pass:
            ship.append((cid, claim, a, b))
        elif a["family"] == "REDUNDANT" and b["cost"] <= 1 and not trap_pass:
            hold.append((cid, claim, a, b, "trap-fail-discard-ship"))
        else:
            review.append((cid, claim, a, b))

    from collections import Counter

    def tier_bucket(items):
        return dict(Counter(c[1]["tier"] for c in items))

    lines = [
        "# Harness Eval: Judge Agreement (Track B)",
        "",
        f"> Run dir: `{run}`",
        f"> Trap gate: {'PASS' if trap_pass else 'FAIL'} (misses={len(misses)})",
        "> Bands: Ship = dual REDUNDANT + J2 cost≤1; Review = dual KEEP; Hold = disagree / missing",
        "",
        "## What these words mean",
        "",
        "| Word | Meaning | You should |",
        "|------|---------|------------|",
        "| **Ship** | Both judges: text is redundant and cheap to rediscover | Delete / trim |",
        "| **Review** | Both judges: keep (not redundant) | Leave alone |",
        "| **Hold** | Judges disagreed or score missing | Do nothing yet |",
        "| **Trap PASS** | Planted traps scored correctly | Trust Ship |",
        "",
        "This track answers: *would an agent rediscover this without the harness?* "
        "Not the same as usefulness (`10-usefulness-agreement.md`).",
        "",
        "## Executive summary",
        "",
        f"- Real claims scored: {sum(1 for c in claims.values() if not c.get('is_plant'))}",
        f"- Ship: **{len(ship)}**",
        f"- Review: **{len(review)}**",
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
        f"Ship by tier: {tier_bucket(ship)}",
        f"Hold by tier: {tier_bucket(hold)}",
        "",
        "## Ship",
        "",
        "| ID | Tier | Source | J1 | J2 cost/class | Quote |",
        "|----|------|--------|----|---------------|-------|",
    ]
    for cid, claim, a, b in ship:
        q = claim["quote"][:120].replace("|", "\\|")
        lines.append(
            f"| {cid} | {claim['tier']} | `{claim['source']}` | {a['class']} | {b['cost']}/{b['class']} | {q} |"
        )

    lines += ["", "## Hold", "", "| ID | Tier | Reason | J1 | J2 | Quote |", "|----|------|--------|----|----|-------|"]
    for cid, claim, a, b, reason in hold:
        q = claim["quote"][:100].replace("|", "\\|")
        a_s = a["class"] if a else "—"
        b_s = f"{b['cost']}/{b['class']}" if b else "—"
        lines.append(f"| {cid} | {claim['tier']} | {reason} | {a_s} | {b_s} | {q} |")

    lines += [
        "",
        "## Review (KEEP family)",
        "",
        f"{len(review)} claims. See J1/J2 score tables for detail.",
        "",
        "## Action guidance",
        "",
        "- **T0 Ship:** edit always-on rules now.",
        "- **T1 Ship:** skill cleanup backlog.",
        "- **T2 Ship:** routing/pointer hygiene.",
        "- **Hold:** do not trim.",
        "",
    ]
    out = run / "07-agreement.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"trap_pass": trap_pass, "ship": len(ship), "review": len(review), "hold": len(hold), "report": str(out)}, indent=2))
    return 0 if trap_pass else 2


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Merge Judge1 + Judge2 scores with trap-key into Ship/Review/Hold. Skill-local script."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROW_RE = re.compile(
    r"^\|\s*(?P<id>[CP]\d{3})\s*\|\s*(?P<cost>\d+)\s*\|\s*(?P<cls>[A-Z0-9_-]+)\s*\|",
    re.M,
)
REDUNDANT = {"REDUNDANT-CODE", "REDUNDANT-GENERAL"}
KEEP = {"KEEP-POLICY", "KEEP-CAVEAT", "KEEP-ROUTING", "KEEP-COMPRESSED", "UNCLEAR"}

HOLD_TITLES = {
    "missing-score": "a judge did not score this",
    "disagree": "judges disagreed",
    "trap-fail-discard-ship": "trap gate failed — Ship discarded",
}


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


def display_run_dir(run: Path) -> str:
    posix = run.as_posix().replace("\\", "/")
    marker = ".harness-eval/"
    idx = posix.lower().find(marker)
    if idx >= 0:
        return posix[idx:]
    return run.name


def format_misses(misses: list[dict]) -> str:
    if not misses:
        return "none"

    def got_label(g: object) -> str:
        return "MISSING" if g is None else str(g)

    return ", ".join(
        f"{m['id']} (expected {m['expected']}, got {got_label(m['got'])})" for m in misses
    )


def format_tier_breakdown(items: list, tiers: tuple[str, ...] = ("T0", "T1", "T2")) -> str:
    counts = Counter(c[1]["tier"] for c in items)
    parts = [f"{t} **{counts[t]}**" for t in tiers if counts.get(t, 0)]
    return ", ".join(parts) if parts else "_(none)_"


def format_hold_reason(reason: str) -> str:
    return f"`{reason}` — {hold_reason_label(reason)}"


def hold_codes_list() -> str:
    return " / ".join(HOLD_TITLES.keys())


def clip_quote(claim: dict, limit: int = 280) -> str:
    q = (claim.get("quote") or "").replace("\n", " ").strip()
    if len(q) > limit:
        return q[: limit - 1] + "…"
    return q


def j1_cell(score: dict | None) -> str:
    return f"`{score['class']}`" if score else "—"


def j2_cell(score: dict | None) -> str:
    if not score:
        return "—"
    return f"cost {score['cost']} / `{score['class']}`"


def j2_table(score: dict | None) -> str:
    if not score:
        return "—"
    return f"{score['cost']}/{score['class']}"


def table_quote(claim: dict, limit: int = 80) -> str:
    return clip_quote(claim, limit).replace("|", "\\|")


def hold_reason_label(reason: str) -> str:
    return HOLD_TITLES.get(reason, reason.replace("-", " "))


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

    lines = [
        "# Harness Eval: Judge Agreement (Track B)",
        "",
        "> harness-eval-report: track=B schema=1",
        f"> Run dir: `{display_run_dir(run)}`",
        f"> Trap gate: {'PASS' if trap_pass else 'FAIL'} (misses={len(misses)})",
        "> Bands: Ship = dual REDUNDANT + J2 cost≤1 + trap PASS; Review = dual KEEP; "
        f"Hold = {hold_codes_list()}",
        "",
        "## What these words mean",
        "",
        "| Word | Meaning | You should |",
        "|------|---------|------------|",
        "| **Ship** | Both judges: text is redundant and cheap to rediscover | Delete / trim |",
        "| **Review** | Both judges: keep (not redundant) | Leave alone |",
        "| **Hold** | Judges disagreed or score missing | Do nothing yet |",
        "| **Trap PASS** | Planted traps scored correctly | Trust Ship |",
        "| **T0 / T1 / T2** | Always-on rules / skills / cited harness refs | Fix T0 cites first (always loaded) |",
        "",
        "This track answers: *would an agent rediscover this without the harness?* Not the same as usefulness (`10-usefulness-agreement.md`).",
        "",
        "## Executive summary",
        "",
        f"- Real claims scored: {sum(1 for c in claims.values() if not c.get('is_plant'))}",
        f"- Ship: **{len(ship)}**",
        f"- Review: **{len(review)}**",
        f"- Hold: **{len(hold)}**",
        f"- Trap misses: {format_misses(misses)}",
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
        f"Ship by tier: {format_tier_breakdown(ship)}",
        f"Hold by tier: {format_tier_breakdown(hold)}",
        "",
        "## Ship",
        "",
        "Safe to delete or trim — both judges say an agent would rediscover this cheaply from the repo.",
        "",
    ]
    if not ship:
        lines.append("_No Ship claims._")
        lines.append("")
    else:
        lines += [
            "| ID | Tier | Source | J1 | J2 cost/class | Quote |",
            "|----|------|--------|----|---------------|-------|",
        ]
        for cid, claim, a, b in ship:
            lines.append(
                f"| {cid} | {claim['tier']} | `{claim['source']}` | {a['class']} | "
                f"{j2_table(b)} | {table_quote(claim)} |"
            )
        lines += ["", "### Details", ""]
        for cid, claim, a, b in ship:
            lines += [
                f"#### [{cid}] Ship — safe to trim",
                "",
                f"- **In:** `{claim['source']}`",
                f"- **The instruction says:** \"{clip_quote(claim)}\"",
                f"- **Judges:** both say this is obvious from the repo (J1 {j1_cell(a)}, J2 {j2_cell(b)})",
                "- **You should:** Delete or trim this sentence.",
                "",
            ]

    lines += [
        "## Hold",
        "",
        "Judges disagreed, a score is missing, or the trap gate failed — do nothing yet.",
        "",
    ]
    if not hold:
        lines.append("_No Hold claims._")
        lines.append("")
    else:
        lines += [
            "| ID | Tier | Reason | Source | J1 | J2 cost/class | Quote |",
            "|----|------|--------|--------|----|---------------|-------|",
        ]
        for cid, claim, a, b, reason in hold:
            a_s = a["class"] if a else "—"
            lines.append(
                f"| {cid} | {claim['tier']} | {format_hold_reason(reason)} | "
                f"`{claim['source']}` | {a_s} | {j2_table(b)} | {table_quote(claim)} |"
            )
        lines += ["", "### Details", ""]
        for cid, claim, a, b, reason in hold:
            title = hold_reason_label(reason)
            lines += [
                f"#### [{cid}] Hold — {title}",
                "",
                f"- **Reason:** {format_hold_reason(reason)}",
                f"- **In:** `{claim['source']}`",
                f"- **The instruction says:** \"{clip_quote(claim)}\"",
                f"- **Judges:** J1 {j1_cell(a)} vs J2 {j2_cell(b)}",
                "- **You should:** Do nothing yet.",
                "",
            ]

    lines += [
        "## Review (KEEP family)",
        "",
        "Both judges: keep (not redundant). Leave these sentences alone.",
        "",
    ]
    if not review:
        lines.append("_No Review claims._")
        lines.append("")
    else:
        lines += [
            "| ID | Tier | Source | J1 | J2 cost/class | Quote |",
            "|----|------|--------|----|---------------|-------|",
        ]
        for cid, claim, a, b in review:
            lines.append(
                f"| {cid} | {claim['tier']} | `{claim['source']}` | {a['class']} | "
                f"{j2_table(b)} | {table_quote(claim)} |"
            )
        lines.append("")
        lines.append(
            f"{len(review)} claims. See J1/J2 score tables (`05-redundancy-j1.md`, `06-blind-scores.md`) for full rows."
        )
        lines.append("")

    lines += [
        "## Action guidance",
        "",
        "- **T0 Ship:** always-on rules (always loaded) — edit now.",
        "- **T1 Ship:** skills — cleanup backlog.",
        "- **T2 Ship:** cited harness refs — routing/pointer hygiene.",
        "- **Hold:** do not trim.",
        "",
    ]
    out = run / "07-agreement.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"trap_pass": trap_pass, "ship": len(ship), "review": len(review), "hold": len(hold), "report": str(out)}, indent=2))
    return 0 if trap_pass else 2


if __name__ == "__main__":
    sys.exit(main())

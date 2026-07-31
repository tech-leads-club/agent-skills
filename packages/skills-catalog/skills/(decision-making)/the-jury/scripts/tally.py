#!/usr/bin/env python3
"""
tally.py - deterministic verdict aggregation for the-jury skill.

The foreman runs this in Phase 4 to compute the verdict without guesswork.
It implements the aggregation cascade from SKILL.md: confidence-weighted
scoring, a flip / bandwagon audit (which triggers a fallback to the
independent Round 1 aggregate), an evidence-grade cap, and a homogeneity
cap on confidence.

USAGE
    python tally.py --input jury.json
    cat jury.json | python tally.py
    python tally.py --example        # print a sample input and exit

INPUT JSON SHAPE
{
  "diversity": "high" | "medium" | "low",   // panel diversity; default "medium"
  "jurors": [
    {
      "id": "j1",                            // any label
      "role": "proponent",                   // free text; informational
      "initial_choice": "A",                 // Round 1 blind vote
      "initial_confidence": 70,              // 0..100
      "final_choice": "B",                   // Round 2 final vote
      "final_confidence": 65,                // 0..100
      "flip_reason": "cited eval X",         // "" / null if none (only matters when choice changed)
      "evidence_grade": "B"                  // A | B | C | D behind the FINAL position
    }
  ]
}

OUTPUT
    A human-readable report plus a RESULT summary. The script never abstains:
    it always names a recommended winner. PIVOT and merit-based tie-breaks
    remain the foreman's call and are flagged, not decided, by the script.
"""

import argparse
import json
import sys
from collections import defaultdict

GRADE_VALUE = {"A": 4, "B": 3, "C": 2, "D": 1}
TIER_NAME = {3: "HIGH", 2: "MEDIUM", 1: "LOW"}

EXAMPLE = {
    "diversity": "high",
    "jurors": [
        {"id": "j1", "role": "proponent", "initial_choice": "migrate",
         "initial_confidence": 70, "final_choice": "tune", "final_confidence": 68,
         "flip_reason": "conceded no dual-write validation plan exists", "evidence_grade": "B"},
        {"id": "j2", "role": "devil's advocate", "initial_choice": "tune",
         "initial_confidence": 80, "final_choice": "tune", "final_confidence": 82,
         "flip_reason": "", "evidence_grade": "B"},
        {"id": "j3", "role": "integrator", "initial_choice": "tune",
         "initial_confidence": 65, "final_choice": "tune", "final_confidence": 70,
         "flip_reason": "", "evidence_grade": "B"},
        {"id": "j4", "role": "reliability", "initial_choice": "tune",
         "initial_confidence": 80, "final_choice": "tune", "final_confidence": 80,
         "flip_reason": "", "evidence_grade": "A"},
        {"id": "j5", "role": "cost", "initial_choice": "migrate",
         "initial_confidence": 55, "final_choice": "migrate", "final_confidence": 55,
         "flip_reason": "", "evidence_grade": "C"},
    ],
}


def weighted_scores(jurors, choice_key, conf_key):
    scores = defaultdict(float)
    for j in jurors:
        scores[j[choice_key]] += float(j.get(conf_key, 0) or 0)
    return dict(scores)


def rank(scores):
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)


def margin_ratio(ranked):
    if len(ranked) == 1:
        return 1.0
    leader = ranked[0][1]
    runner = ranked[1][1]
    if leader <= 0:
        return 0.0
    return (leader - runner) / leader


def avg_grade_for(jurors, choice_key, winner):
    vals = [GRADE_VALUE.get(str(j.get("evidence_grade", "C")).upper(), 2)
            for j in jurors if j[choice_key] == winner]
    if not vals:
        return 2.0
    return sum(vals) / len(vals)


def base_tier(ranked):
    if len(ranked) == 1:
        return 3
    m = margin_ratio(ranked)
    if m >= 0.33:
        return 3
    if m >= 0.10:
        return 2
    return 1


def audit_flips(jurors, initial_ranked):
    """Return (flips, unjustified, bandwagon_suspect, reason)."""
    initial_leader = initial_ranked[0][0] if initial_ranked else None
    flips = [j for j in jurors if j["initial_choice"] != j["final_choice"]]
    unjustified = [j for j in flips if not str(j.get("flip_reason") or "").strip()]
    toward_leader = [j for j in flips if j["final_choice"] == initial_leader]

    bandwagon = False
    reason = ""
    if flips:
        if len(unjustified) / len(flips) > 0.5:
            bandwagon = True
            reason = "more than half of the flips cited no new reason"
        elif len(toward_leader) == len(flips) and len(flips) >= 2:
            bandwagon = True
            reason = "every flip moved toward the Round 1 majority (majority-chasing)"
    return flips, unjustified, bandwagon, reason


def main():
    parser = argparse.ArgumentParser(description="Deterministic verdict tally for the-jury.")
    parser.add_argument("--input", help="Path to jury JSON. Reads stdin if omitted.")
    parser.add_argument("--example", action="store_true", help="Print a sample input JSON and exit.")
    args = parser.parse_args()

    if args.example:
        print(json.dumps(EXAMPLE, indent=2))
        return 0

    raw = open(args.input).read() if args.input else sys.stdin.read()
    if not raw.strip():
        print("ERROR: no input. Pass --input FILE or pipe JSON on stdin. Try --example.", file=sys.stderr)
        return 2
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON: {e}", file=sys.stderr)
        return 2

    jurors = data.get("jurors", [])
    if len(jurors) < 3:
        print("ERROR: need at least 3 jurors.", file=sys.stderr)
        return 2
    for j in jurors:
        for k in ("initial_choice", "initial_confidence", "final_choice", "final_confidence"):
            if k not in j:
                print(f"ERROR: juror {j.get('id','?')} missing field '{k}'.", file=sys.stderr)
                return 2

    diversity = str(data.get("diversity", "medium")).lower()

    init_scores = weighted_scores(jurors, "initial_choice", "initial_confidence")
    final_scores = weighted_scores(jurors, "final_choice", "final_confidence")
    init_ranked = rank(init_scores)
    final_ranked = rank(final_scores)

    flips, unjustified, bandwagon, bw_reason = audit_flips(jurors, init_ranked)

    # why: bandwagon → discard Round 2 and use blind Round 1 (SKILL.md cascade).
    if bandwagon:
        source = "INDEPENDENT Round 1 aggregate (deliberation flagged SUSPECT)"
        ranked = init_ranked
        choice_key = "initial_choice"
    else:
        source = "final confidence-weighted aggregate"
        ranked = final_ranked
        choice_key = "final_choice"

    winner = ranked[0][0]
    tie_flag = False
    if len(ranked) > 1 and margin_ratio(ranked) < 0.10:
        tie_flag = True
        top = [opt for opt, _ in ranked if abs(dict(ranked)[opt] - ranked[0][1]) < 1e-9
               or (ranked[0][1] > 0 and (ranked[0][1] - dict(ranked)[opt]) / ranked[0][1] < 0.10)]
        # why: near-tie broken by higher avg evidence grade; foreman still confirms.
        winner = max(top, key=lambda opt: avg_grade_for(jurors, choice_key, opt))

    tier = 1 if bandwagon else base_tier(ranked)
    caps = []
    winner_grade = avg_grade_for(jurors, choice_key, winner)
    if winner_grade < 2.0:
        tier = min(tier, 1)
        caps.append("evidence mostly grade D")
    elif winner_grade < 3.0:
        tier = min(tier, 2)
        caps.append("evidence mostly grade C")
    if diversity == "low":
        before = tier
        tier = max(1, tier - 1)
        if tier != before:
            caps.append("low panel diversity (effective independence is weak)")
    if bandwagon:
        caps.append(f"bandwagon fallback: {bw_reason}")

    print("=" * 60)
    print("THE JURY - TALLY")
    print("=" * 60)
    print(f"Jurors: {len(jurors)}   Panel diversity: {diversity}")
    print()
    print("Round 1 (independent) weighted scores:")
    for opt, sc in init_ranked:
        print(f"  {opt:20s} {sc:7.1f}")
    print()
    print("Round 2 (final) weighted scores:")
    for opt, sc in final_ranked:
        print(f"  {opt:20s} {sc:7.1f}")
    print()
    print(f"Flips: {len(flips)}  (unjustified: {len(unjustified)})")
    for j in flips:
        why = str(j.get("flip_reason") or "").strip() or "NO REASON GIVEN"
        print(f"  {j.get('id','?')}: {j['initial_choice']} -> {j['final_choice']}  [{why}]")
    print()
    print(f"Bandwagon check: {'SUSPECT - ' + bw_reason if bandwagon else 'clean'}")
    print(f"Aggregate used: {source}")
    if tie_flag:
        print("Tie / near-tie: broke on higher average evidence grade among supporters.")
        print("               FOREMAN: confirm on the rubric, not just this heuristic.")
    print()
    print("-" * 60)
    print("RESULT")
    print("-" * 60)
    print(f"  Recommended winner : {winner}")
    print(f"  Recommended conf.  : {TIER_NAME[tier]}")
    print(f"  Winner evidence avg: {winner_grade:.2f} (A=4 .. D=1)")
    if caps:
        print(f"  Confidence caps    : " + "; ".join(caps))
    print()
    print("  Reminders for the foreman:")
    print("   - This is a recommendation. You still emit the verdict.")
    print("   - PIVOT (question is mis-framed) is your call; the script does not detect it.")
    print("   - On a flagged tie, decide on the rubric and survival against the devil's advocate.")
    print("   - There is always a verdict. Never abstain.")
    print()
    print(json.dumps({
        "winner": winner,
        "confidence": TIER_NAME[tier],
        "aggregate_source": "round1_independent" if bandwagon else "final",
        "bandwagon_suspect": bandwagon,
        "tie_flag": tie_flag,
        "winner_evidence_avg": round(winner_grade, 2),
        "caps": caps,
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

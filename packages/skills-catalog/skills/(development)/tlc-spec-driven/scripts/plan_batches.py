#!/usr/bin/env python3
"""
plan_batches.py - pack a feature's phases into worker batches, and draw the phase map.

The phases in tasks.md are the only record of order. This reads them and prints the batches the
orchestrator dispatches, so the packing is the same every time and nobody redoes the arithmetic.

Packing:
  - 8 tasks or fewer: one batch, run inline, no sub-agent offer.
  - Otherwise walk the phases in order. Add the next phase to the current batch when that leaves the
    batch as close to 7 tasks as it is now, or closer; else close the batch first. A phase is never
    split across batches.
  - A last batch of 1 or 2 tasks joins the batch before it.

  [3,3,3,3,4,4] -> 6, 6, 8      [8,2,2,8] -> 8, 4, 8      [5,5,5,5] -> 5, 5, 5, 5

Usage:
  python3 <skill-dir>/scripts/plan_batches.py [feature] [--root DIR] [--json]

Exit codes: 0 printed, 1 tasks.md does not read, 2 usage error.
"""

import argparse
import json
import os
import sys

from specs import feature_dir, read_tasks

BUDGET, INLINE_MAX, TAIL_MAX = 7, 8, 2


def pack(phases):
    """[[phase number, ...], ...] from [(phase number, task count), ...]."""
    total = sum(n for _, n in phases)
    if total <= INLINE_MAX:
        return [[p for p, _ in phases]] if phases else []
    batches, current, count = [], [], 0
    for p, n in phases:
        if current and abs(count + n - BUDGET) > abs(count - BUDGET):
            batches.append((current, count))
            current, count = [], 0
        current.append(p)
        count += n
    if current:
        batches.append((current, count))
    if len(batches) > 1 and batches[-1][1] <= TAIL_MAX:
        last = batches.pop()
        batches[-1] = (batches[-1][0] + last[0], batches[-1][1] + last[1])
    return [b for b, _ in batches]


def main(argv=None):
    p = argparse.ArgumentParser(prog="plan_batches.py", description="Pack phases into worker batches.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--json", action="store_true")
    args = p.parse_args(argv)
    fdir = feature_dir(args.target, args.root, "tasks.md")
    if not fdir or not os.path.isfile(os.path.join(fdir, "tasks.md")):
        print("plan_batches: no tasks.md for that feature.", file=sys.stderr)
        return 2
    model = read_tasks(os.path.join(fdir, "tasks.md"))
    if model["errors"] or not model["phases"]:
        for e in model["errors"] or ["no `### Phase <n>: <title>` under `## Tasks`"]:
            print(f"  ERROR {e}")
        print("\nplan_batches: run validate_tasks.py first")
        return 1
    phases = {n: (title, tasks) for n, title, tasks in model["phases"]}
    batches = pack([(n, len(t)) for n, (_, t) in phases.items()])
    if args.json:
        print(json.dumps([{"batch": i, "phases": b, "tasks": [t.id for n in b for t in phases[n][1]]}
                          for i, b in enumerate(batches, 1)], indent=1))
        return 0
    total = sum(len(t) for _, t in phases.values())
    print(f"{total} tasks in {len(phases)} phases")
    for n, (title, tasks) in phases.items():
        print(f"  Phase {n}: {title:<28} " + " -> ".join(t.id for t in tasks))
    if len(batches) == 1:
        print("\n1 batch: run it inline - no sub-agent offer")
    else:
        print(f"\n{len(batches)} batches: offer one worker per batch, run them in order")
    for i, b in enumerate(batches, 1):
        ids = [t.id for n in b for t in phases[n][1]]
        print(f"  Batch {i}: phases {', '.join(map(str, b))} - {len(ids)} tasks ({ids[0]}..{ids[-1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

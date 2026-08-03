#!/usr/bin/env python3
"""
validate_tasks.py - deterministic pre-approval checks for a feature tasks.md.

Turns the three pre-approval checks (task granularity, diagram-vs-definition
cross-check, test co-location) into a checkable pass/fail run BEFORE tasks are
presented for approval, instead of trusting the model to build the tables by
hand. Pure standard library, zero dependencies. Operates only on the tasks.md
markdown artifact, so it is stack-agnostic and tool-agnostic.

What it checks (heuristic markdown inspection, not a full parser):
  ERROR  - a required section is missing
  ERROR  - a task is missing its `Tests` or `Gate` field
  ERROR  - a task depends on a task in a LATER phase (dependencies point back only)
  ERROR  - a dependency edge shown in the diagram has no matching `Depends on`
           (and vice-versa) when both sides are parseable
  WARN   - a task's `Where` names multiple files (granularity smell -> split it)
  WARN   - a task says `Tests: none` (confirm the coverage matrix agrees)
  WARN   - the diagram could not be parsed confidently (cross-check skipped)

Usage:
  python3 <skill-dir>/scripts/validate_tasks.py [target] [--root DIR] [--strict]

  Invoke from the skill directory that ships this script (not the project root).
  target    Path to a tasks.md, a feature directory, or a project root.
            Omitted -> auto-detect the single feature under <root>/.specs/features/.
  --root    Project root that contains .specs/ (default: current dir).
  --strict  Treat warnings as errors.

Exit codes: 0 pass, 1 errors found (or warnings under --strict), 2 usage error.
"""

import argparse
import os
import re
import sys

REQUIRED_SECTIONS = ["Test Coverage Matrix", "Gate Check Commands", "Execution Plan", "Task Breakdown"]
TASK_RE = re.compile(r"^#{2,4}\s+(T\d+)\s*:", re.IGNORECASE)
EDGE_RE = re.compile(r"\bT\d+\b")
FILE_HINT_RE = re.compile(r"[\w./-]+\.\w{1,6}\b")


def resolve_tasks(target, root):
    if target:
        if os.path.isfile(target):
            return target
        if os.path.isdir(target):
            cand = os.path.join(target, "tasks.md")
            if os.path.isfile(cand):
                return cand
            return _autodetect(target)
        # Not a path: treat as a feature name under <root>/.specs/features/<name>/
        cand = os.path.join(root, ".specs", "features", target, "tasks.md")
        if os.path.isfile(cand):
            return cand
        return None
    return _autodetect(root)


def _autodetect(root):
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return None
    features = [d for d in sorted(os.listdir(base)) if os.path.isfile(os.path.join(base, d, "tasks.md"))]
    if len(features) == 1:
        return os.path.join(base, features[0], "tasks.md")
    if len(features) == 0:
        return None
    raise SystemExit(
        "validate_tasks: multiple features found; pass one explicitly:\n  "
        + "\n  ".join(os.path.join(base, f, "tasks.md") for f in features)
    )


def section_present(lines, name):
    return any(re.match(r"^#{1,4}\s+" + re.escape(name) + r"\b", ln.strip()) for ln in lines)


def parse_tasks(lines):
    """Return a dict: task_id -> {'deps': set, 'tests': str|None, 'gate': str|None, 'where': str}."""
    tasks = {}
    current = None
    for ln in lines:
        m = TASK_RE.match(ln.strip())
        if m:
            current = m.group(1).upper()
            tasks[current] = {"deps": set(), "tests": None, "gate": None, "where": ""}
            continue
        if current is None:
            continue
        stripped = ln.strip()
        dm = re.match(r"^\*{0,2}Depends on\*{0,2}\s*:\s*(.*)$", stripped, re.IGNORECASE)
        if dm:
            body = dm.group(1)
            if "none" not in body.lower():
                for e in EDGE_RE.findall(body.upper()):
                    tasks[current]["deps"].add(e)
        wm = re.match(r"^\*{0,2}Where\*{0,2}\s*:\s*(.*)$", stripped, re.IGNORECASE)
        if wm:
            tasks[current]["where"] = wm.group(1)
        tm = re.match(r"^\*{0,2}Tests\*{0,2}\s*:\s*(.*)$", stripped, re.IGNORECASE)
        if tm:
            tasks[current]["tests"] = tm.group(1).strip()
        gm = re.match(r"^\*{0,2}Gate\*{0,2}\s*:\s*(.*)$", stripped, re.IGNORECASE)
        if gm:
            tasks[current]["gate"] = gm.group(1).strip()
    return tasks


def parse_phase_membership(lines):
    """Map task_id -> phase index, read from '### Phase N' headers in the Execution Plan."""
    membership = {}
    phase_idx = 0
    in_phase = False
    for ln in lines:
        pm = re.match(r"^#{2,4}\s+Phase\s+(\d+)", ln.strip(), re.IGNORECASE)
        if pm:
            phase_idx = int(pm.group(1))
            in_phase = True
            continue
        if in_phase:
            # Map a task to a phase ONLY when it appears as a task header (### Tn:),
            # never when it is merely referenced (e.g. in a `Depends on:` line or a
            # diagram arrow), which would misattribute the referenced task to this phase.
            hm = TASK_RE.match(ln.strip())
            if hm:
                membership[hm.group(1).upper()] = phase_idx
    return membership


def parse_diagram_edges(lines):
    """Best-effort: parse 'Tx -> Ty' / 'Tx → Ty' arrow chains from fenced blocks.
    Returns (edges:set[(src,dst)], parsed:bool)."""
    edges = set()
    in_fence = False
    found_any_arrow = False
    for ln in lines:
        if ln.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence:
            continue
        # normalize arrow glyphs
        norm = ln.replace("→", "->").replace("──", "-").replace("-", "-")
        if "->" not in norm:
            continue
        chain = EDGE_RE.findall(norm.upper())
        # only treat as a chain if arrows connect them left-to-right
        segments = [s for s in re.split(r"->", norm)]
        seq = []
        for seg in segments:
            ids = EDGE_RE.findall(seg.upper())
            seq.append(ids[-1] if ids else None)
        for a, b in zip(seq, seq[1:]):
            if a and b:
                edges.add((a, b))
                found_any_arrow = True
    return edges, found_any_arrow


def check(tasks_path):
    with open(tasks_path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    errors, warnings = [], []

    for name in REQUIRED_SECTIONS:
        if not section_present(lines, name):
            errors.append(f"missing required section: ## {name}")

    tasks = parse_tasks(lines)
    if not tasks:
        warnings.append("no tasks (### T1: ...) parsed - is this file filled in?")
        return errors, warnings

    # Field presence + granularity smell.
    for tid, t in tasks.items():
        if t["tests"] is None:
            errors.append(f"{tid}: missing `Tests` field")
        elif t["tests"].lower().startswith("none"):
            warnings.append(f"{tid}: Tests: none - confirm the Test Coverage Matrix says 'none' for this layer")
        if t["gate"] is None:
            errors.append(f"{tid}: missing `Gate` field")
        files = FILE_HINT_RE.findall(t["where"])
        if len(set(files)) > 1:
            warnings.append(f"{tid}: `Where` names multiple files {sorted(set(files))} - granularity smell, consider splitting")

    # Forward-phase dependency.
    membership = parse_phase_membership(lines)
    for tid, t in tasks.items():
        p_here = membership.get(tid)
        if p_here is None:
            continue
        for dep in t["deps"]:
            p_dep = membership.get(dep)
            if p_dep is not None and p_dep > p_here:
                errors.append(f"{tid} (phase {p_here}) depends on {dep} (phase {p_dep}) - dependencies must point backward or within the same phase")

    # Diagram vs definition cross-check (best effort).
    edges, parsed = parse_diagram_edges(lines)
    if not parsed:
        warnings.append("diagram arrows not parsed confidently - diagram/definition cross-check skipped (verify by hand)")
    else:
        def intra_phase(a, b):
            # Parity applies only within a phase. A backward cross-phase dependency
            # is validated by the forward-phase check above and needs no diagram arrow;
            # phase diagrams are drawn per phase, so cross-phase edges are out of scope here.
            pa, pb = membership.get(a), membership.get(b)
            if pa is None or pb is None:
                return True  # unknown phase -> keep best-effort parity
            return pa == pb

        dep_edges = set()
        for tid, t in tasks.items():
            for dep in t["deps"]:
                dep_edges.add((dep, tid))  # arrow points dep -> task
        only_in_diagram = {(a, b) for (a, b) in (edges - dep_edges) if intra_phase(a, b)}
        only_in_defs = {(a, b) for (a, b) in (dep_edges - edges) if intra_phase(a, b)}
        for a, b in sorted(only_in_diagram):
            if a in tasks and b in tasks:
                errors.append(f"diagram shows {a} -> {b} but {b} has no matching `Depends on: {a}`")
        for a, b in sorted(only_in_defs):
            errors.append(f"{b} declares `Depends on: {a}` but the diagram has no {a} -> {b} arrow")

    return errors, warnings


def main(argv=None):
    p = argparse.ArgumentParser(prog="validate_tasks.py", description="Pre-approval checks for a feature tasks.md.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args(argv)

    tasks_path = resolve_tasks(args.target, args.root)
    if not tasks_path:
        print("validate_tasks: could not locate a tasks.md. Pass a path or run from the project root.", file=sys.stderr)
        return 2

    errors, warnings = check(tasks_path)
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    fail = errors or (warnings and args.strict)
    print(f"\nvalidate_tasks: {len(errors)} error(s), {len(warnings)} warning(s) in {tasks_path}")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())

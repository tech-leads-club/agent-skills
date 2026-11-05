#!/usr/bin/env python3
"""
slice_task.py - prints the part of the plan a few tasks need, and nothing else.

A worker that reads spec.md, design.md and tasks.md in full carries all three on every turn. The
plan already says what each task touches: its `**Requirement**:` names criterion IDs, and its
`**Files**:` paths fall under the design's component locations. So the slice is computed from what
the plan declares. No field picks it, and nobody judges what is relevant.

What it prints, in document order, read through specs.py:

  tasks.md    the header lines, the Execution Protocol, the Test Coverage Matrix and the Gate Check
              Commands; each task asked for, under its phase heading; the checks that cite the
              tasks' criterion IDs, with their proofs
  spec.md     the header lines; each criterion whose ID a task names, under its story; the
              Implicit Requirements rows that name those IDs; Out of Scope and Assumptions;
              Sources and Differences from the source when a criterion names one of its captures
  design.md   every section, except the components whose `**Location**:` no file of the tasks
              covers. In Code Reuse Analysis, a row stays when a kept component reuses its path or a
              task file covers it. In Risks & Concerns, a row stays when a task file covers it, or
              when it names no path.
  context.md  Implementation Decisions and Specific References

It refuses to print a slice of a plan the gates would refuse:
  exit 1 - spec.md or tasks.md not approved, or changed since its approval; a grammar error in
           spec.md or tasks.md; a criterion ID a task names that the spec does not hold
  exit 2 - usage error, no tasks.md, or a task ID tasks.md does not hold

The first line after the title says how many lines the slice keeps of the full documents.

Usage:
  python3 <skill-dir>/scripts/slice_task.py <feature> T4 [T5 ...] [--root DIR]
"""

import argparse
import os
import re
import sys

from specs import (SPAN_RE, Doc, approval_errors, covers, design_locations, feature_dir, is_path, norm,
                   read_spec, read_tasks)

TASK_SECTIONS = ("Execution Protocol", "Test Coverage Matrix", "Gate Check Commands")
SPEC_ALWAYS = ("Out of Scope", "Assumptions")
SPEC_SOURCES = ("Sources", "Differences from the source")
CONTEXT_SECTIONS = ("Implementation Decisions", "Specific References")
CAPTURE_RE = re.compile(r"captures/([^)\s`]+)")


def heads(doc, level):
    """(heading index, title, end) for each heading at `level`."""
    return [(i, t, doc.bounds(i, lv)[1]) for i, lv, t in doc.heads if lv == level]


def head_lines(doc):
    """The lines between the title and the first section: the file's header fields."""
    first = next((i for i, lv, _ in doc.heads if lv == 2), len(doc.raw))
    start = 1 if doc.raw and doc.raw[0].startswith("# ") else 0
    return trim(doc.raw[start:first])


def trim(lines):
    lines = list(lines)
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def section(doc, prefix):
    """The raw lines of the first level-2 section whose title starts with `prefix`, heading included."""
    for i, title, end in heads(doc, 2):
        if norm(title).startswith(norm(prefix)):
            return trim(doc.raw[i:end])
    return []


def tasks_part(doc, model, wanted):
    out = [head_lines(doc)]
    out += [section(doc, name) for name in TASK_SECTIONS]
    by_phase = {}
    for t in wanted:
        by_phase.setdefault(t.phase, []).append(t)
    body = [doc.raw[doc.section("Tasks")[0] - 1]] if doc.section("Tasks") else []
    for num, title, _ in model["phases"]:
        if num not in by_phase:
            continue
        body += ["", f"### Phase {num}: {title}"]
        for t in by_phase[num]:
            _, end = doc.bounds(t.line - 1, 4)
            body += [""] + trim(doc.raw[t.line - 1:end])
    out.append(trim(body))
    ids = {r for t in wanted for r in t.reqs}
    checks = [c for c in model["checks"] if ids & set(c.cites)]
    bounds = doc.section("Checks")
    if checks and bounds:
        starts = sorted(c.line - 1 for c in model["checks"])
        block = [doc.raw[bounds[0] - 1]]
        for c in checks:
            nxt = next((s for s in starts if s > c.line - 1), bounds[1])
            block += [""] + trim(doc.raw[c.line - 1:min(nxt, bounds[1])])
        out.append(block)
    return out


def spec_part(spec, ids):
    doc = spec["doc"]
    out = [head_lines(doc)]
    chosen = [c for c in spec["criteria"] if c.id in ids]
    stories = doc.section("User Stories")
    if stories:
        block = [doc.raw[stories[0] - 1]]
        for i, title, (s, e) in doc.children(stories[0], stories[1], 3):
            mine = [c for c in chosen if c.story == title]
            if not mine:
                continue
            ac = doc.field(s, e, "Acceptance Criteria")
            block += [""] + trim(doc.raw[i:ac.line - 1]) + ["", doc.raw[ac.line - 1]]
            block += [doc.raw[c.line - 1] for c in mine]
        out.append(block)
    implicit = doc.section("Implicit Requirements")
    if implicit:
        for t in doc.tables(*implicit):
            rows = [n for n, row in t.rows if ids & set(re.findall(r"[A-Z][A-Z0-9]*-\d+", " ".join(row.values())))]
            if rows:
                out.append([doc.raw[implicit[0] - 1], "", doc.raw[t.line - 1], doc.raw[t.line]]
                           + [doc.raw[n - 1] for n in rows])
    out += [section(doc, name) for name in SPEC_ALWAYS]
    sources = section(doc, "Sources")
    named = set(CAPTURE_RE.findall("\n".join(sources)))
    if any(name in c.text for c in chosen for name in named):
        out += [section(doc, name) for name in SPEC_SOURCES]
    return out


def design_part(doc, paths):
    """Code Reuse Analysis comes before Components, so the kept components are settled first."""
    owned = {line - 1: spans for line, _, spans in design_locations(doc)}
    kept, reused = {}, set()
    for i, title, end in heads(doc, 2):
        if norm(title) != "components":
            continue
        for j, _, (s, e) in doc.children(i, end, 3):
            spans = [loc for ln, locs in owned.items() if s <= ln < e for loc in locs]
            if spans and not any(covers(loc, p) for loc in spans for p in paths):
                continue
            kept[j] = e
            for f in doc.fields(s, e):
                if norm(f.name) == "reuses":
                    reused.update(sp.split("#")[0] for sp in SPAN_RE.findall(f.value) if is_path(sp))
    out = [head_lines(doc)]
    for i, title, end in heads(doc, 2):
        name = norm(title)
        if name == "components":
            first = min(next((j for j, lv, _ in doc.heads if j > i and lv == 3), end), end)
            block = trim(doc.raw[i:first])
            for j, e in kept.items():
                if i < j < end:
                    block += [""] + trim(doc.raw[j:e])
            out.append(block)
        elif name in ("code reuse analysis", "risks & concerns"):
            out.append(table_rows(doc, i, end, paths, reused if name == "code reuse analysis" else set()))
        else:
            out.append(trim(doc.raw[i:end]))
    return out


def table_rows(doc, i, end, paths, reused):
    """A section whose tables keep only the rows about the tasks' files. A row with no path stays."""
    drop = set()
    for t in doc.tables(i + 1, end):
        col = t.key("location") or t.key("file")
        for n, row in (t.rows if col else []):
            spans = [sp.split(":")[0].split("#")[0] for sp in SPAN_RE.findall(row[col]) if is_path(sp)]
            if spans and not any(sp in reused or any(covers(sp, p) for p in paths) for sp in spans):
                drop.add(n - 1)
    return trim(ln for k, ln in enumerate(doc.raw[i:end], start=i) if k not in drop)


def render(parts):
    blocks = [p for p in parts if p]
    return "\n\n".join("\n".join(b) for b in blocks)


def main(argv=None):
    p = argparse.ArgumentParser(prog="slice_task.py", description="Print the part of the plan some tasks need.")
    p.add_argument("feature")
    p.add_argument("tasks", nargs="+", metavar="TASK")
    p.add_argument("--root", default=".")
    args = p.parse_args(argv)

    root = os.path.abspath(args.root)
    fdir = feature_dir(args.feature, root, "tasks.md")
    tasks_path = os.path.join(fdir, "tasks.md") if fdir else None
    if not tasks_path or not os.path.isfile(tasks_path):
        print(f"slice_task: no tasks.md for `{args.feature}`. A Medium feature runs from its spec.", file=sys.stderr)
        return 2
    model = read_tasks(tasks_path)
    by_id = {t.id: t for t in model["tasks"]}
    unknown = [x for x in args.tasks if x.upper() not in by_id]
    if unknown:
        print(f"slice_task: {', '.join(unknown)} not in tasks.md", file=sys.stderr)
        return 2
    wanted = sorted({by_id[x.upper()] for x in args.tasks}, key=lambda t: t.num)

    spec = read_spec(os.path.join(fdir, "spec.md")) if os.path.isfile(os.path.join(fdir, "spec.md")) else None
    errors = approval_errors(fdir, True) + model["errors"] + (spec["errors"] if spec else ["no spec.md"])
    ids = sorted({r for t in wanted for r in t.reqs})
    if spec:
        held = {c.id for c in spec["criteria"]}
        errors += [f"{t.id} names {r}, and spec.md holds no criterion {r}" for t in wanted for r in t.reqs
                   if r not in held]
    if errors:
        for e in errors:
            print(f"  ERROR {e}")
        print(f"\nslice_task: no slice - {len(errors)} error(s). A slice of a plan the gates refuse is not a plan.")
        return 1

    paths = [p for t in wanted for _, p, _ in t.files]
    docs = [("tasks.md", model["doc"], tasks_part(model["doc"], model, wanted)),
            ("spec.md", spec["doc"], spec_part(spec, set(ids)))]
    for name, build in (("design.md", lambda d: design_part(d, paths)),
                        ("context.md", lambda d: [section(d, s) for s in CONTEXT_SECTIONS])):
        path = os.path.join(fdir, name)
        if os.path.isfile(path):
            d = Doc(path)
            docs.append((name, d, build(d)))

    body = [f"# {name}\n\n{render(parts)}" for name, _, parts in docs]
    kept = sum(len(b.splitlines()) for b in body)
    full = sum(len(d.raw) for _, d, _ in docs)
    print(f"# Slice of {os.path.basename(fdir)}: {', '.join(t.id for t in wanted)}\n")
    print(f"Cut by slice_task.py: {kept} of {full} lines in {', '.join(n for n, _, _ in docs)}.\n")
    print("\n\n".join(body))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

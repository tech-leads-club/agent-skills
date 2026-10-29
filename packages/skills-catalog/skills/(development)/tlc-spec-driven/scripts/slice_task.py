#!/usr/bin/env python3
"""
slice_task.py - print only the part of spec.md, design.md and tasks.md that a few tasks need.

During Execute the worker (or the orchestrator, inline) used to open the three documents in full,
and on a large feature that text is then re-sent on every following turn. A task already names
its requirements (`**Requirement**:`), and can name the design sections it uses
(`**Design sections**:`), so the slice can be cut from them. Pure standard library.

What it prints:
  - the tasks.md preamble (Execution Protocol, Test Coverage Matrix, Gate Check Commands)
    and the requested task blocks;
  - for each requirement ID: the acceptance criteria lines that carry the ID, or, when no line
    carries it, the user story the Requirement Traceability table maps it to; plus `## Edge Cases`;
  - the design sections each task lists (a section brings its subsections), plus the sections
    every task needs (Error Handling Strategy, Tech Decisions).

The design document is the one the tasks.md `**Design**:` line points to (a markdown link
resolves from the tasks.md directory, a code span with `/` from the project root, a `:NN-MM`
suffix is dropped), else design.md next to tasks.md.

It fails rather than print a slice that is silently incomplete:
  exit 1 - a requirement resolves to no criterion or story, or a `**Design sections**:` entry
           matches no heading in the design document
  exit 2 - usage error, no tasks.md, or a task ID that is not in it

A task with no `**Design sections**:` line is not an error: the slice ends with a notice to read
the design document in full for that task, so features written before the field keep working.

Usage:
  python3 <skill-dir>/scripts/slice_task.py <feature> T1 [T2 ...] [--root DIR]
"""

import argparse
import os
import re
import sys

from validate_tasks import resolve_tasks

TASKS_PREAMBLE = ("Execution Protocol", "Test Coverage Matrix", "Gate Check Commands")
DESIGN_ALWAYS = ("Error Handling Strategy", "Tech Decisions")
FIELD_DESIGN = "Design sections"
ID_RE = re.compile(r"\b[A-Z][A-Z0-9]*-\d+\b")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
FENCE_RE = re.compile(r"^\s*(```|~~~)")
AC_RE = re.compile(r"^\s*\d+\.\s")


class Incomplete(Exception):
    pass


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def sections(text):
    """Every heading with its body up to the next heading of the same or higher level.
    A `#` line inside a fenced code block is code, not a heading."""
    lines = text.split("\n")
    heads, fenced = [], False
    for i, line in enumerate(lines):
        if FENCE_RE.match(line):
            fenced = not fenced
            continue
        m = None if fenced else HEADING_RE.match(line)
        if m:
            heads.append((i, len(m.group(1)), m.group(2)))
    out = []
    for n, (start, level, title) in enumerate(heads):
        end = next((s for s, lv, _ in heads[n + 1:] if lv <= level), len(lines))
        out.append({"start": start, "end": end, "level": level, "title": title,
                    "text": "\n".join(lines[start:end]).rstrip()})
    return out


def norm(title):
    return re.sub(r"\s+", " ", title.replace("`", "").replace("⭐", "")).strip().lower()


def matching(secs, prefix):
    want = norm(prefix)
    return [s for s in secs if norm(s["title"]).startswith(want)]


def field(block, name):
    m = re.search(rf"^\*\*{re.escape(name)}\*\*:\s*(.*)$", block, re.MULTILINE)
    return m.group(1).strip() if m else None


def design_path(tasks_path, tasks_text, root):
    """The document the `**Design**:` line points to, read the way issue #220 proposes."""
    here = os.path.dirname(os.path.abspath(tasks_path))
    m = re.search(r"^\*\*Design\*\*:\s*(.*)$", tasks_text, re.MULTILINE)
    if m:
        line = m.group(1)
        for target in re.findall(r"\]\(([^)\s#]+)", line):
            if target.endswith((".md", ".html")):
                return os.path.normpath(os.path.join(here, target))
        for span in re.findall(r"`([^`]+)`", line):
            span = re.sub(r":\d+(-\d+)?$", "", span.strip())
            if "/" in span and span.endswith((".md", ".html")):
                return os.path.normpath(os.path.join(root, span))
    return os.path.join(here, "design.md")


def spec_slice(spec_text, ids):
    lines = spec_text.split("\n")
    secs = sections(spec_text)
    stories = [s for s in secs if s["level"] <= 3]

    def story_of(i):
        owners = [s for s in stories if s["start"] <= i < s["end"]]
        return max(owners, key=lambda s: s["start"]) if owners else None

    trace = {}
    table = next((s for s in secs if s["level"] == 2 and norm(s["title"]) == "requirement traceability"), None)
    if table:
        for row in table["text"].split("\n"):
            cells = [c.strip() for c in row.strip().strip("|").split("|")]
            if len(cells) >= 2 and ID_RE.fullmatch(cells[0]):
                trace[cells[0]] = cells[1]

    picked, whole, missing = {}, {}, []
    for rid in ids:
        token = re.compile(rf"(?<![A-Za-z0-9-]){re.escape(rid)}(?![0-9])")
        hits = [i for i, ln in enumerate(lines) if AC_RE.match(ln) and token.search(ln)]
        if hits:
            for i in hits:
                story = story_of(i)
                picked.setdefault(story["start"] if story else -1, set()).add(i)
            continue
        story = next(iter(matching(stories, trace[rid]) if rid in trace else []), None)
        if story is None:
            missing.append(rid)
        else:
            whole[story["start"]] = story["text"]
    if missing:
        raise Incomplete("requirement with no acceptance criterion and no story in spec.md "
                         "(tag the criterion with the ID, or map it in Requirement Traceability): "
                         + ", ".join(missing))

    parts = dict(whole)
    for start, idx in picked.items():
        if start in whole:
            continue
        head = [lines[start]] if start >= 0 else []
        parts[start] = "\n".join(head + [lines[i] for i in sorted(idx)])
    out = [parts[k] for k in sorted(parts)]
    edge = next((s for s in secs if s["level"] == 2 and norm(s["title"]) == "edge cases"), None)
    if edge:
        out.append(edge["text"])
    return "\n\n".join(out)


def design_slice(design_text, wanted):
    secs = sections(design_text)
    chosen = {}
    for prefix in wanted:
        hits = matching(secs, prefix)
        if not hits:
            raise Incomplete(f"`**{FIELD_DESIGN}**:` entry {prefix!r} matches no heading in the design document")
        chosen.update((s["start"], s) for s in hits)
    for prefix in DESIGN_ALWAYS:
        chosen.update((s["start"], s) for s in matching(secs, prefix))
    picked = [chosen[k] for k in sorted(chosen)]
    # a subsection listed next to its parent section is already inside it
    return [s for s in picked if not any(o["start"] < s["start"] < o["end"] for o in picked if o is not s)]


def main(argv=None):
    p = argparse.ArgumentParser(prog="slice_task.py", description="Print the slice of the feature documents some tasks need.")
    p.add_argument("feature")
    p.add_argument("tasks", nargs="+", metavar="TASK")
    p.add_argument("--root", default=".")
    args = p.parse_args(argv)

    tasks_path = resolve_tasks(args.feature, args.root)
    if not tasks_path:
        print(f"slice_task: no tasks.md for {args.feature!r}. Pass a path or run from the project root.", file=sys.stderr)
        return 2
    tasks_text = read(tasks_path)
    here = os.path.dirname(os.path.abspath(tasks_path))
    task_secs = sections(tasks_text)

    blocks = []
    for tid in args.tasks:
        s = next((t for t in task_secs if 2 <= t["level"] <= 4 and re.match(rf"{re.escape(tid)}\s*:", t["title"])), None)
        if s is None:
            print(f"slice_task: task {tid} is not in {tasks_path}", file=sys.stderr)
            return 2
        blocks.append(re.sub(r"\n-{3,}\s*$", "", s["text"]))

    ids = list(dict.fromkeys(i for b in blocks for i in ID_RE.findall(field(b, "Requirement") or "")))
    wanted = [w.strip() for b in blocks for w in (field(b, FIELD_DESIGN) or "").split(";") if w.strip()]
    no_field = [tid for tid, b in zip(args.tasks, blocks) if field(b, FIELD_DESIGN) is None]

    spec_path = os.path.join(here, "spec.md")
    dpath = design_path(tasks_path, tasks_text, args.root)
    try:
        spec_part = spec_slice(read(spec_path), ids) if ids else "(the tasks name no requirement)"
        if dpath.endswith(".md") and os.path.isfile(dpath):
            design_part = "\n\n".join(s["text"] for s in design_slice(read(dpath), wanted)) or "(no section)"
        elif wanted:
            raise Incomplete(f"tasks list design sections but {dpath} is not a readable markdown file")
        else:
            design_part = "(no design document to slice)"
    except Incomplete as e:
        print(f"slice_task: {e}", file=sys.stderr)
        return 1

    preamble = [s["text"] for s in task_secs if s["level"] == 2 and s["title"].startswith(TASKS_PREAMBLE)]
    out = [f"# Slice of {os.path.basename(here)}: {', '.join(args.tasks)}", "", "## tasks.md", "",
           *(t + "\n" for t in preamble + blocks),
           "## spec.md (criteria of the tasks' requirements, and Edge Cases)", "", spec_part, "",
           f"## {os.path.basename(dpath)} (sections in `**{FIELD_DESIGN}**:`, plus {' and '.join(DESIGN_ALWAYS)})", "",
           design_part, ""]
    if no_field:
        out += [f"> {', '.join(no_field)} has no `**{FIELD_DESIGN}**:` line - read {os.path.basename(dpath)} in full for it.", ""]
    sys.stdout.write("\n".join(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

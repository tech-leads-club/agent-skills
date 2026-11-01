#!/usr/bin/env python3
"""
validate_design.py - the gate a design.md passes before the plan review.

A design cites the codebase: the code it reuses, the files it changes, the lines its risks sit on.
Each of those is a claim about the current tree. A script settles existence, so the plan reviewer
spends its time on judgement. It reads design.md through specs.py and looks up each path it cites
under the project root.

What it checks:
  ERROR  - a required section is missing
  ERROR  - no `**Approach**: <chosen> - user: "<their words>"` line: the approach is the user's call
  ERROR  - no `**Chosen over**:` or `**Breaks if**:` line, or one left as template text
  ERROR  - a component `**Location**:` not marked `(new)` or `(existing)`
  ERROR  - a location marked `(existing)` that is not on disk, or a file marked `(new)` that already is
  ERROR  - a path in a `Location` column of `## Code Reuse Analysis` or `## Risks & Concerns`, or on a
           `**Reuses**:` line, that is not on disk
  ERROR  - a `**Reuses**:` file with no symbol (`path#Symbol`), a folder there instead of the file that
           defines the symbol, or a symbol the file does not contain; a `path#Symbol` in a `Location`
           column is checked the same way
  ERROR  - a `path:line` anywhere in design.md whose file is not on disk, or whose line is past its end
  ERROR  - a template placeholder left in

Usage:
  python3 <skill-dir>/scripts/validate_design.py [feature] [--root DIR] [--strict]

Exit codes: 0 pass, 1 errors (or warnings under --strict), 2 usage error, 3 the same errors twice in a row.
"""

import argparse
import os
import re
import sys

from specs import SPAN_RE, USER_WORDS_RE, Doc, design_locations, feature_dir, finish, is_path, norm

REQUIRED_SECTIONS = ["Architecture Overview", "Code Reuse Analysis", "Components", "Error Handling Strategy",
                     "Risks & Concerns"]
PLACEHOLDER_RE = re.compile(r"(?<![!\]])\[[A-Z][^\]\n]*\](?![(\[])|src/path/to")
LINE_REF_RE = re.compile(r"^([\w./@-]+\.\w{1,8}):(\d+)(?:-(\d+))?$")


def check_path(root, span, where, errors):
    span = span.strip()
    span = span[2:] if span.startswith("./") else span
    m = LINE_REF_RE.match(span)
    path, end = (m.group(1), int(m.group(3) or m.group(2))) if m else (span, None)
    full = os.path.join(root, path)
    if not os.path.exists(full):
        errors.append(f"{where}: `{path}` is not on disk - read the tree, then cite what is there or mark "
                      f"the location `(new)`")
    elif end is not None and os.path.isfile(full):
        with open(full, "rb") as f:
            n = len(f.read().splitlines())
        if end > n:
            errors.append(f"{where}: `{span}` is past the end of `{path}` ({n} lines) - cite the line you read")


def check_symbol(root, span, where, errors, required):
    """A reuse names the code it builds on: `path#Symbol`. The file must hold each dotted part of the symbol."""
    path, _, symbol = span.strip().partition("#")
    path = path[2:] if path.startswith("./") else path
    full = os.path.join(root, path)
    if not os.path.exists(full):
        check_path(root, path, where, errors)
        return
    if os.path.isdir(full):
        errors.append(f"{where}: `{span}` is a folder - cite the file that defines what it reuses, `{path.rstrip('/')}/"
                      f"<file>#Symbol`")
        return
    if not symbol:
        if required:
            errors.append(f"{where}: `{path}` names no symbol - write `{path}#<the function, class or type it reuses>`")
        return
    with open(full, encoding="utf-8", errors="replace") as f:
        text = f.read()
    missing = [part for part in symbol.split(".") if not re.search(r"(?<![\w$])" + re.escape(part) + r"(?![\w$])", text)]
    if missing:
        errors.append(f"{where}: `{symbol}` is not in `{path}` - open the file and cite a symbol it has")


def check(path, root):
    doc = Doc(path)
    errors, warnings = [], []
    whole = (0, len(doc.lines))

    for name in REQUIRED_SECTIONS:
        if doc.section(name) is None:
            errors.append(f"missing required section: ## {name}")

    approach = doc.field(*whole, "Approach")
    if not approach or not USER_WORDS_RE.search(approach.value):
        errors.append('no `**Approach**: <chosen> - user: "<their words>"` line - the approach is the user\'s call; '
                      "ask, and write the answer in the turn it arrives")
    for label, what in (("Chosen over", "each rejected approach and why"),
                        ("Breaks if", "the assumption that, if false, breaks the chosen approach")):
        f = doc.field(*whole, label)
        if not f or not f.value or f.value.startswith("["):
            errors.append(f"no `**{label}**:` line - write {what}")

    for i, raw in enumerate(doc.lines, start=1):
        m = PLACEHOLDER_RE.search(SPAN_RE.sub(lambda s: s.group(0) if "src/path/to" in s.group(0) else " ", raw))
        if m:
            errors.append(f"design.md L{i}: template placeholder `{m.group(0)}` left in")

    checked = set()
    for name in ("Code Reuse Analysis", "Risks & Concerns"):
        body = doc.section(name)
        for t in doc.tables(*body) if body else []:
            errors += [f"design.md {e}" for e in t.errors]
            col = t.key("location")
            for n, row in (t.rows if col else []):
                for span in SPAN_RE.findall(row[col]):
                    if is_path(span):
                        checked.add(span)
                        if "#" in span:
                            check_symbol(root, span, f"design.md L{n}", errors, False)
                        else:
                            check_path(root, span, f"design.md L{n}", errors)

    for line, mark, spans in design_locations(doc):
        if not mark:
            errors.append(f"design.md L{line}: mark the location `(new)` or `(existing)`")
            continue
        for span in spans:
            checked.add(span)
            if mark == "existing":
                check_path(root, span, f"design.md L{line}", errors)
            elif not span.endswith("/") and os.path.isfile(os.path.join(root, span)):
                errors.append(f"design.md L{line}: `{span}` is marked `(new)` and is already on disk - reuse it "
                              f"and mark it `(existing)`, or name the new file")
    for f in doc.fields(*whole):
        if norm(f.name) == "reuses":
            for span in (s for s in SPAN_RE.findall(f.value) if is_path(s) and "/" in s):
                checked.add(span)
                check_symbol(root, span, f"design.md L{f.line}", errors, True)

    for i, raw in enumerate(doc.lines, start=1):
        for span in SPAN_RE.findall(raw):
            if span not in checked and LINE_REF_RE.match(span):
                checked.add(span)
                check_path(root, span, f"design.md L{i}", errors)
    return errors, warnings


def main(argv=None):
    p = argparse.ArgumentParser(prog="validate_design.py", description="The gate a design.md passes.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args(argv)
    fdir = feature_dir(args.target, args.root, "design.md")
    path = os.path.join(fdir, "design.md") if fdir else None
    if not path or not os.path.isfile(path):
        print("validate_design: could not locate a design.md. Pass a feature, or run from the project root.",
              file=sys.stderr)
        return 2
    errors, warnings = check(path, os.path.abspath(args.root))
    return finish("validate_design", fdir, errors, warnings, args.strict, path)


if __name__ == "__main__":
    raise SystemExit(main())

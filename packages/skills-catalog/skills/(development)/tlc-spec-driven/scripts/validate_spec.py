#!/usr/bin/env python3
"""
validate_spec.py - deterministic closure-gate checks for a feature spec.md.

Turns the Requirement Closure Gate (Specify phase) into a checkable pass/fail
run BEFORE a spec is presented for confirmation, instead of trusting the model
to remember the checks. Pure standard library, zero dependencies. Operates only
on the spec.md markdown artifact - never on the target codebase - so it stays
stack-agnostic and tool-agnostic.

What it checks (heuristic markdown inspection, not a full parser):
  ERROR  - a required section is missing
  ERROR  - an acceptance criterion has no SHALL (not testable / not EARS-shaped)
  ERROR  - an Assumptions row has an empty "Chosen default" or "Rationale" cell
  ERROR  - a Requirement Traceability row has a malformed ID
  ERROR  - a capture under captures/ with no Sources line, non-binding with no quote of the user,
           not cited by a criterion, or not shown as an image (`![..](captures/..)`)
  ERROR  - a binding source and no `## Differences from the source`, or a row not confirmed under an
           active AD-NNN in .specs/STATE.md
  WARN   - an AC has SHALL but no recognizable EARS lead keyword
  WARN   - template placeholder rows are still present (spec not filled in)
  WARN   - open questions are not explicitly resolved

Usage:
  python3 <skill-dir>/scripts/validate_spec.py [target] [--root DIR] [--strict]

  Invoke from the skill directory that ships this script (not the project root).
  target    Path to a spec.md, a feature directory, or a project root.
            Omitted -> auto-detect the single feature under <root>/.specs/features/.
  --root    Project root that contains .specs/ (default: current dir).
  --strict  Treat warnings as errors.

Exit codes: 0 pass, 1 errors found (or warnings under --strict), 2 usage error.
"""

import argparse
import os
import re
import sys

from lean_config import BINDING_RE, NOT_BINDING_RE

IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")
USER_QUOTE_RE = re.compile(r"\buser\b[^\"“]*[\"“][^\"”]{3,}[\"”]", re.IGNORECASE)
AD_ID_RE = re.compile(r"\bAD-\d{3,}\b")

REQUIRED_SECTIONS = [
    "Problem Statement",
    "Out of Scope",
    "Assumptions & Open Questions",
    "User Stories",
    "Requirement Traceability",
]

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-\d+$")
PLACEHOLDER_RE = re.compile(r"^\s*\[.+\]\s*$")
STATUS_VALUES = {"pending", "in design", "in tasks", "implementing", "verified"}


def resolve_spec(target, root):
    """Return the path to a spec.md from a file, dir, or auto-detect."""
    if target:
        if os.path.isfile(target):
            return target
        if os.path.isdir(target):
            cand = os.path.join(target, "spec.md")
            if os.path.isfile(cand):
                return cand
            # maybe it's a project root
            return _autodetect(target)
        # Not a path: treat as a feature name under <root>/.specs/features/<name>/
        cand = os.path.join(root, ".specs", "features", target, "spec.md")
        if os.path.isfile(cand):
            return cand
        return None
    return _autodetect(root)


def _autodetect(root):
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return None
    features = [
        d for d in sorted(os.listdir(base))
        if os.path.isfile(os.path.join(base, d, "spec.md"))
    ]
    if len(features) == 1:
        return os.path.join(base, features[0], "spec.md")
    if len(features) == 0:
        return None
    # Ambiguous: signal the caller with the list.
    raise SystemExit(
        "validate_spec: multiple features found; pass one explicitly:\n  "
        + "\n  ".join(os.path.join(base, f, "spec.md") for f in features)
    )


def split_row(line):
    cells = line.strip().strip("|").split("|")
    return [c.strip() for c in cells]


def is_separator(line):
    return bool(re.match(r"^\s*\|?[\s:|-]+\|?\s*$", line)) and "-" in line


def section_bounds(lines, name):
    """Return (start, end) line indices for a `## name` section body."""
    start = None
    for i, ln in enumerate(lines):
        if re.match(r"^#{1,3}\s+" + re.escape(name) + r"\s*$", ln.strip()):
            start = i + 1
            break
    if start is None:
        return None
    end = len(lines)
    for j in range(start, len(lines)):
        if re.match(r"^#{1,3}\s+\S", lines[j]):
            end = j
            break
    return (start, end)


def classify_ears(text):
    """Return (ok, note). ok requires a SHALL; note records the EARS pattern."""
    t = text.strip()
    low = t.lower()
    has_shall = bool(re.search(r"\bshall\b", low))
    if not has_shall:
        return (False, "no SHALL")
    kws = []
    if re.search(r"\bwhile\b", low):
        kws.append("WHILE")
    if re.search(r"\bwhen\b", low):
        kws.append("WHEN")
    if re.match(r"^\s*if\b", low) or re.search(r"\bif\b.*\bthen\b", low):
        kws.append("IF/THEN")
    if re.search(r"\bwhere\b", low):
        kws.append("WHERE")
    if len(kws) >= 2:
        return (True, "complex (" + "+".join(kws) + ")")
    if kws:
        pattern = {
            "WHILE": "state-driven",
            "WHEN": "event-driven",
            "IF/THEN": "unwanted-behavior",
            "WHERE": "optional-feature",
        }[kws[0]]
        return (True, pattern)
    if re.match(r"^\s*the\b", low):
        return (True, "ubiquitous")
    return (True, "warn: SHALL present but no EARS lead keyword")


def check(spec_path):
    with open(spec_path, "r", encoding="utf-8") as f:
        text = f.read()
    lines = text.splitlines()
    errors, warnings = [], []

    # 1. Required sections.
    for name in REQUIRED_SECTIONS:
        if section_bounds(lines, name) is None:
            errors.append(f"missing required section: ## {name}")

    # 2. Acceptance criteria are EARS-shaped (have a SHALL).
    in_ac = False
    for i, ln in enumerate(lines, start=1):
        stripped = ln.strip()
        if re.match(r"^\*{0,2}Acceptance Criteria\*{0,2}\s*:?\s*$", stripped):
            in_ac = True
            continue
        if in_ac:
            m = re.match(r"^\s*\d+\.\s+(.*)$", ln)
            if m:
                item = m.group(1).strip()
                if PLACEHOLDER_RE.match(item):
                    continue  # untouched template row
                ok, note = classify_ears(item)
                if not ok:
                    errors.append(f"L{i}: acceptance criterion has no SHALL (not testable): {item[:70]}")
                elif note.startswith("warn"):
                    warnings.append(f"L{i}: AC has SHALL but no EARS keyword (WHEN/WHILE/WHERE/IF or ubiquitous 'The … shall'): {item[:60]}")
            elif stripped == "" or re.match(r"^#{1,3}\s", ln) or stripped.startswith("**"):
                in_ac = False

    # 3. Assumptions table cells filled.
    b = section_bounds(lines, "Assumptions & Open Questions")
    if b:
        rows = [lines[i] for i in range(*b) if lines[i].strip().startswith("|")]
        data = [r for r in rows if not is_separator(r)]
        # drop the header row (first table row)
        if data:
            data = data[1:]
        template_seen = False
        for r in data:
            cells = split_row(r)
            if len(cells) < 3:
                continue
            assumption, chosen, rationale = cells[0], cells[1], cells[2]
            if PLACEHOLDER_RE.match(assumption) and PLACEHOLDER_RE.match(chosen):
                template_seen = True
                continue
            if not chosen or PLACEHOLDER_RE.match(chosen):
                errors.append(f"assumption '{assumption[:40]}' has empty 'Chosen default'")
            if not rationale or PLACEHOLDER_RE.match(rationale):
                errors.append(f"assumption '{assumption[:40]}' has empty 'Rationale'")
        if template_seen:
            warnings.append("Assumptions table still contains template placeholder rows")
        # open questions line
        oq = [lines[i] for i in range(*b) if "open questions" in lines[i].lower()]
        oq_clean = re.sub(r"[*_]", "", " ".join(oq)).lower()
        if not oq:
            warnings.append("no 'Open questions:' line in Assumptions section")
        elif not re.search(r"open questions.*:\s*none", oq_clean):
            warnings.append("open questions do not read as resolved ('Open questions: none')")

    # 4. Requirement traceability IDs.
    b = section_bounds(lines, "Requirement Traceability")
    if b:
        rows = [lines[i] for i in range(*b) if lines[i].strip().startswith("|")]
        data = [r for r in rows if not is_separator(r)]
        if data:
            data = data[1:]
        template_seen = False
        real_ids = 0
        for r in data:
            cells = split_row(r)
            if not cells:
                continue
            rid = cells[0]
            if PLACEHOLDER_RE.match(rid) or "[" in rid:
                template_seen = True
                continue
            if not rid:
                continue
            if not ID_RE.match(rid):
                errors.append(f"malformed requirement ID: '{rid}' (expected e.g. AUTH-01)")
            else:
                real_ids += 1
        if template_seen and real_ids == 0:
            warnings.append("Requirement Traceability has only template rows (no real IDs yet)")

    errors += check_sources(lines, spec_path)
    return errors, warnings


def _body(lines, name):
    """A `## name` section with its `###` subsections, up to the next `#` or `##` heading."""
    out, inside = [], False
    for ln in lines:
        s = ln.strip()
        if re.match(r"^#{1,2}\s+\S", s):
            inside = re.match(r"^#{1,2}\s+" + re.escape(name) + r"\s*$", s) is not None
            continue
        if inside:
            out.append(s)
    return out


def _active_decisions(spec_path):
    """AD ids marked active in .specs/STATE.md (the project root is the folder holding .specs/)."""
    cur = os.path.dirname(os.path.abspath(spec_path))
    while True:
        state = os.path.join(cur, ".specs", "STATE.md")
        if os.path.isfile(state):
            with open(state, encoding="utf-8") as f:
                return {m.group(0) for ln in f if "active" in ln.lower() for m in AD_ID_RE.finditer(ln)}
        parent = os.path.dirname(cur)
        if parent == cur:
            return set()
        cur = parent


def check_sources(lines, spec_path):
    """A capture that comes with the request binds; it is non-binding only on the user's quoted word.
    With a binding source, every capture is cited by a criterion and shown in the spec, and every
    departure from it is in `## Differences from the source`, approved under an active AD-NNN."""
    errors = []
    cdir = os.path.join(os.path.dirname(os.path.abspath(spec_path)), "captures")
    images = sorted(f for f in os.listdir(cdir) if f.lower().endswith(IMAGE_EXT) and ".running." not in f) \
        if os.path.isdir(cdir) else []
    sources = _body(lines, "Sources")
    binding = any(BINDING_RE.search(x) and not NOT_BINDING_RE.search(x) for x in sources)
    if images and section_bounds(lines, "Sources") is None:
        errors.append("captures/ holds the design but there is no `## Sources` section - one line per capture, "
                      "`![<name>](captures/<file>) - binding - <what it draws>`")
    stories = "\n".join(_body(lines, "User Stories"))
    shown = "\n".join(x for x in lines if "![" in x)
    for f in images:
        cited = [x for x in sources if f in x]
        bound = any(BINDING_RE.search(x) and not NOT_BINDING_RE.search(x) for x in cited)
        if sources and not cited:
            errors.append(f"Sources: the capture `{f}` has no line - a capture that comes with the request binds")
        elif cited and not bound and not all(USER_QUOTE_RE.search(x) for x in cited):
            errors.append(f"Sources: `{f}` is not binding and no line quotes the user calling it inspiration - "
                          "write `non-binding - user: \"<their words>\"` only when they said so")
        if binding and f.split(".")[0] not in stories:
            errors.append(f"no acceptance criterion cites the capture `{f}` - each screen's criterion names its "
                          "capture file, or the builder never aims at the picture")
        if f not in shown:
            errors.append(f"the capture `{f}` is not shown in the spec - put `![<name>](captures/{f})` on its "
                          "Sources line so whoever approves sees the screen")
    if binding:
        b = section_bounds(lines, "Differences from the source")
        if b is None:
            errors.append("a source binds but there is no `## Differences from the source` section - list every way "
                          "the product departs from it, or `None - the product matches the source`")
        else:
            active = _active_decisions(spec_path)
            rows = [lines[i] for i in range(*b) if lines[i].strip().startswith("|") and not is_separator(lines[i])][1:]
            for r in rows:
                cells = split_row(r)
                if not cells or not cells[0] or PLACEHOLDER_RE.match(cells[0]):
                    continue
                confirmed = cells[-1]
                if not re.match(r"^\W*y(es)?\b", confirmed, re.IGNORECASE):
                    errors.append(f"Differences '{cells[0][:40]}': Confirmed is '{confirmed[:20]}' - departing from a "
                                  "binding source is the user's call; ask it")
                elif not any(m in active for m in AD_ID_RE.findall(confirmed)):
                    errors.append(f"Differences '{cells[0][:40]}': cites no active AD-NNN in .specs/STATE.md - the "
                                  "decision holds the question and the answer")
    return errors


def main(argv=None):
    p = argparse.ArgumentParser(prog="validate_spec.py", description="Closure-gate checks for a feature spec.md.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args(argv)

    spec = resolve_spec(args.target, args.root)
    if not spec:
        print("validate_spec: could not locate a spec.md. Pass a path or run from the project root.", file=sys.stderr)
        return 2

    errors, warnings = check(spec)
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    fail = errors or (warnings and args.strict)
    print(f"\nvalidate_spec: {len(errors)} error(s), {len(warnings)} warning(s) in {spec}")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())

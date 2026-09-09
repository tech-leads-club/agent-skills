#!/usr/bin/env python3
"""
validate_plan.py - deterministic gate for a feature plan.md, run before writing checks.

One artifact, one gate. The plan carries both halves a human confirms - what must be
true (problem, criteria, assumptions) and what is being built (flow, relations,
surface, landing, impact) - so this script turns the closure gate into a pass/fail run
instead of trusting the model to remember it.

The failures it exists to catch are the ones that make a plan lie rather than inform:

  - a criterion with no SHALL, which reads like a requirement and cannot be tested;
  - an assumption with no chosen default, which is an open question wearing a
    decision's clothes;
  - a section quietly absent, which is indistinguishable from "nothing to say here"
    unless the file is required to say it out loud;
  - a `Landing` row with no literal shape, which reads like a decision and cannot be
    copied, so the next person re-decides it;
  - a `Landing` row with no rejected alternative, which is the difference between a
    decision and a description of what happened;
  - columns and types inside `Relations`, which is the exact detail that goes stale and
    then misleads the next reader with the authority of a written diagram;
  - a `Surface` row with no statuses, since the statuses are what becomes a Coverage set
    in checks.md - drop them here and the join has nothing to enumerate.

Pure standard library, zero dependencies. Operates only on the plan.md markdown
artifact - never on the target codebase - so it stays stack-agnostic.

What it checks:
  ERROR  - a required section is missing
  ERROR  - an acceptance criterion has no SHALL (not testable / not EARS-shaped)
  ERROR  - an Assumptions row has an empty "Chosen default" or "Rationale" cell
  ERROR  - a Traceability row has a malformed requirement ID
  ERROR  - the Observable section is empty, or has no rows and no `None - <why>`
  ERROR  - an Observable row whose Landing cell is blank
  ERROR  - an Observable `n/a` or `existing` landing with no reason after it
  ERROR  - Flow, Relations, Surface or Impact is empty, or still the template placeholder
           (each has a one-line "None - <why>" answer, so a blank is never "nothing to say")
  ERROR  - the Landing section is empty (state `None - <why>` instead)
  ERROR  - Landing has no door rows and does not state `None - <why>`
  ERROR  - a Landing row with no literal shape
  ERROR  - a Landing row with no rejected alternative named
  ERROR  - a Relations diagram carrying an attribute block: columns and types go stale
  ERROR  - a Surface row whose Status cell names no status code
  ERROR  - a check id written into Surface, which cannot exist before checks.md does
  WARN   - an AC has SHALL but no recognizable EARS lead keyword
  WARN   - an AC carries a vague word instead of a concrete value
  WARN   - no numbered acceptance criteria found at all
  WARN   - template placeholder rows are still present (plan not filled in)
  WARN   - open questions are not explicitly resolved
  WARN   - no Sources section ('nothing' is valid, a missing section is not)
  WARN   - an Impact section with no rows
  WARN   - a Flow hop, or a flowchart node, naming a module marked neither existing
           nor as a Landing door
  WARN   - a source marked binding (only Verify step 1 opens those, and only at profile ui)

Usage:
  python3 <skill-dir>/scripts/validate_plan.py [target] [--root DIR] [--strict]

  Invoke from the skill directory that ships this script (not the project root).
  target    Path to a plan.md, a feature directory, a feature name, or a project root.
            Omitted -> auto-detect the single feature under <root>/.specs/features/.
  --root    Project root that contains .specs/ (default: current dir).
  --strict  Treat warnings as errors.

Exit codes: 0 pass, 1 errors found (or warnings under --strict), 2 usage error.
"""

import argparse
import os
import re
import sys

# Each entry is a tuple of acceptable heading names (first is canonical).
REQUIRED_SECTIONS = [
    ("Problem", "Problem Statement"),
    ("Out of scope", "Out of Scope"),
    ("Assumptions", "Assumptions & Open Questions"),
    ("Criteria", "User Stories"),
    ("Traceability", "Requirement Traceability"),
    ("Observable",),
    ("Flow",),
    ("Relations",),
    ("Surface",),
    ("Landing",),
    ("Impact",),
]
ADVISORY_SECTIONS = ["Sources"]

# The shape half: each has a one-line answer when it does not apply.
SHAPE_HINTS = (
    ("Flow", "state the hops in order, or `single module - <name>`"),
    ("Relations", "state the entities and cardinality, or `None - no stored-data shape change`"),
    ("Surface", "state the route signature, or `None - nothing consumed outside`"),
    ("Impact", "state what changes underneath, or `nothing` - a missing row is not an answer"),
)

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-\d+$")
PLACEHOLDER_RE = re.compile(r"^\s*[\[<].+[\]>]\s*$")
CID_RE = re.compile(r"\bC\d+\b")
STATUS_RE = re.compile(r"\b[1-5]\d\d\b")
NONE_RE = re.compile(r"\b(none|nothing|n/?a|single module)\b", re.IGNORECASE)
VAGUE_RE = re.compile(
    r"\b(gracefully|properly|correctly|quickly|fast|slow|efficiently|reasonably|"
    r"appropriately|as expected|user-friendly|robust)\b",
    re.IGNORECASE,
)
HEADER_CELL_RE = re.compile(
    r"^(assumption|#|id|kind|criterion|slice|set|check|front|decision|excluded)\b", re.IGNORECASE
)

# `Entity { string name }` in an erDiagram is the columns-and-types syntax, which is
# precisely the reversible detail this artifact keeps out.
ER_ATTRIBUTE_RE = re.compile(r"^\s*\w+\s*\{\s*$")

# A hop is answered when it says the module already exists, or names the door that creates it.
# `out:` cannot keep a trailing \b: the colon is not a word character, so the
# boundary never fires and an `out:` hop that names a slug in backticks is
# misread as an unresolved module.
HOP_RESOLVED_RE = re.compile(r"\b(exists|existing|new\b|door\s*\d+)|out\s*:", re.IGNORECASE)
MODULE_RE = re.compile(r"`([^`]+)`")
# A mermaid flowchart node: `A[Label]`, `A["Label"]`, `A(Label)`. The label is what has to
# carry the resolution marker, the same as a list hop does.
NODE_LABEL_RE = re.compile(r"[\[(]\s*\"?([^\"\]()|]+?)\"?\s*[\])]")
EDGE_LINE_RE = re.compile(r"--+>|--+\s")


def resolve_plan(target, root):
    """Return the path to a plan.md from a file, dir, feature name, or auto-detect."""
    if target:
        if os.path.isfile(target):
            return target
        if os.path.isdir(target):
            cand = os.path.join(target, "plan.md")
            if os.path.isfile(cand):
                return cand
            return _autodetect(target)
        cand = os.path.join(root, ".specs", "features", target, "plan.md")
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
        if os.path.isfile(os.path.join(base, d, "plan.md"))
    ]
    if len(features) == 1:
        return os.path.join(base, features[0], "plan.md")
    if len(features) == 0:
        return None
    raise SystemExit(
        "validate_plan: multiple features found; pass one explicitly:\n  "
        + "\n  ".join(os.path.join(base, f, "plan.md") for f in features)
    )


def split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def is_separator(line):
    return bool(re.match(r"^\s*\|?[\s:|-]+\|?\s*$", line)) and "-" in line


def section_bounds(lines, names):
    """Return (start, end) body indices for the first heading matching any name."""
    if isinstance(names, str):
        names = (names,)
    pattern = re.compile(
        r"^#{1,4}\s+(?:" + "|".join(re.escape(n) for n in names) + r")\b.*$",
        re.IGNORECASE,
    )
    start = None
    for i, ln in enumerate(lines):
        if pattern.match(ln.strip()):
            start = i + 1
            break
    if start is None:
        return None
    end = len(lines)
    for j in range(start, len(lines)):
        if re.match(r"^#{1,2}\s+\S", lines[j]):  # only a top-level heading closes it
            end = j
            break
    return (start, end)


def first_table(lines, bounds):
    """Return the data rows of the FIRST contiguous markdown table in a section.

    Scoping to the first table matters: a section may carry a second table (e.g. an
    unresolved-questions table under Assumptions), and validating its rows against
    the first table's column meaning produces false errors.
    """
    if not bounds:
        return []
    rows, started = [], False
    for i in range(*bounds):
        stripped = lines[i].strip()
        if stripped.startswith("|"):
            started = True
            rows.append(stripped)
        elif started and stripped == "":
            continue
        elif started:
            break
    data = [r for r in rows if not is_separator(r)]
    return data[1:] if data else []  # the first row is the header


def strip_fences(lines, keep=("mermaid",)):
    """
    Drop fenced code blocks so a template example inside the file is not parsed.

    Blocks whose info string matches `keep` survive: a mermaid erDiagram is content in
    this artifact, not an example, and the columns check has to see inside it.
    """
    out, fence_info = [], None
    for ln in lines:
        stripped = ln.strip()
        if stripped.startswith("```"):
            if fence_info is None:
                fence_info = stripped.strip("`").strip().lower()
            else:
                fence_info = None
            out.append("")
            continue
        out.append(ln if (fence_info is None or fence_info in keep) else "")
    return out


def classify_ears(text):
    """Return (ok, note). ok requires a SHALL; note records the EARS pattern."""
    low = text.strip().lower()
    if not re.search(r"\bshall\b", low):
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
        return (True, {
            "WHILE": "state-driven",
            "WHEN": "event-driven",
            "IF/THEN": "unwanted-behavior",
            "WHERE": "optional-feature",
        }[kws[0]])
    if re.match(r"^\s*the\b", low):
        return (True, "ubiquitous")
    return (True, "warn: SHALL present but no EARS lead keyword")


def sibling_profile(plan_path):
    """The profile checks.md declares, when it exists yet."""
    checks = os.path.join(os.path.dirname(os.path.abspath(plan_path)), "checks.md")
    if not os.path.isfile(checks):
        return None
    with open(checks, "r", encoding="utf-8") as f:
        for ln in f:
            m = re.match(r"^\**Profile\**\s*:\s*`?(\w+)`?", ln.strip(), re.IGNORECASE)
            if m:
                return m.group(1).lower()
    return None


def check_criteria(lines):
    """EARS shape of every numbered acceptance criterion."""
    errors, warnings = [], []
    in_ac, ac_count, blanks = False, 0, 0
    # A blank line does NOT close the block - well-formed markdown puts one between the
    # label and the list, and treating it as a terminator silently skips every criterion.
    for i, ln in enumerate(lines, start=1):
        stripped = ln.strip()
        if re.match(r"^\*{0,2}Acceptance Criteria\*{0,2}\s*:?\s*$", stripped, re.IGNORECASE):
            in_ac, blanks = True, 0
            continue
        if not in_ac:
            continue
        if stripped == "":
            blanks += 1
            if blanks >= 2:
                in_ac = False
            continue
        blanks = 0
        m = re.match(r"^\s*\d+\.\s+(.*)$", ln)
        if m:
            item = m.group(1).strip()
            if PLACEHOLDER_RE.match(item):
                continue
            ac_count += 1
            ok, note = classify_ears(item)
            if not ok:
                errors.append(f"L{i}: acceptance criterion has no SHALL (not testable): {item[:70]}")
            elif note.startswith("warn"):
                warnings.append(
                    f"L{i}: AC has SHALL but no EARS keyword (WHEN/WHILE/WHERE/IF or "
                    f"ubiquitous 'The … shall'): {item[:60]}"
                )
            vague = VAGUE_RE.search(item)
            if vague:
                warnings.append(f"L{i}: AC uses '{vague.group(0)}' instead of a concrete value: {item[:60]}")
        elif re.match(r"^#{1,4}\s", ln) or stripped.startswith("**") or re.match(r"^\s*[-*+]\s", ln):
            in_ac = False
    if ac_count == 0:
        warnings.append("no numbered acceptance criteria found - is the plan filled in?")
    return errors, warnings


def _warn_unresolved(warnings, idx, names, land_text, kind):
    """Warn when no name in `names` is marked as existing or present in Landing."""
    if not names:
        return
    if any(n.lower() in land_text for n in names):
        return
    warnings.append(
        f"L{idx + 1}: Flow {kind} names `{names[0]}` without marking it as existing or as a "
        "Landing door - if it is neither, it is placement and belongs in the diff"
    )


def check_file(path):
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read().splitlines()
    lines = strip_fences(raw)
    errors, warnings = [], []

    # Sections. A missing one and a deliberate "None" are different answers, and only the
    # second is contestable - which is the whole reason every section is required.
    present = {}
    for names in REQUIRED_SECTIONS:
        b = section_bounds(lines, names)
        present[names[0]] = b
        if b is None:
            errors.append(f"missing required section: ## {names[0]}")
    for name in ADVISORY_SECTIONS:
        label = re.compile(r"^\**" + re.escape(name) + r"\**\s*:", re.IGNORECASE)
        if section_bounds(lines, name) is None and not any(label.match(ln.strip()) for ln in lines):
            warnings.append(f"no {name} section - 'nothing' is a valid answer, a missing section is not")

    # A source marked binding is only ever opened by step 1 of Verify, which runs at `ui`.
    if any(re.search(r"\bbinding\b", ln, re.IGNORECASE) for ln in lines):
        profile = sibling_profile(path)
        if profile and profile != "ui":
            warnings.append(
                f"a source is marked binding but checks.md declares profile {profile}, so nobody "
                "opens it - raise the profile to ui or drop the marking"
            )

    # --- what must be true ---

    e, w = check_criteria(lines)
    errors += e
    warnings += w

    b = present.get("Assumptions")
    if b:
        template_seen = False
        for r in first_table(lines, b):
            cells = split_row(r)
            if len(cells) < 3:
                continue
            assumption, chosen, rationale = cells[0], cells[1], cells[2]
            if PLACEHOLDER_RE.match(assumption) and PLACEHOLDER_RE.match(chosen):
                template_seen = True
                continue
            if not assumption:
                continue
            if not chosen or PLACEHOLDER_RE.match(chosen):
                errors.append(f"assumption '{assumption[:40]}' has empty 'Chosen default'")
            if not rationale or PLACEHOLDER_RE.match(rationale):
                errors.append(f"assumption '{assumption[:40]}' has empty 'Rationale'")
        if template_seen:
            warnings.append("Assumptions table still contains template placeholder rows")
        oq = [lines[i] for i in range(*b) if "open questions" in lines[i].lower()]
        oq_clean = re.sub(r"[*_]", "", " ".join(oq)).lower()
        if not oq:
            warnings.append("no 'Open questions:' line in the Assumptions section")
        elif not re.search(r"open questions.*:\s*none", oq_clean):
            warnings.append("open questions do not read as resolved ('Open questions: none')")

    b = present.get("Traceability")
    if b:
        template_seen, real_ids = False, 0
        for r in first_table(lines, b):
            cells = split_row(r)
            if not cells or not cells[0]:
                continue
            rid = cells[0]
            if PLACEHOLDER_RE.match(rid) or "[" in rid or "<" in rid:
                template_seen = True
                continue
            if not ID_RE.match(rid):
                errors.append(f"malformed requirement ID: '{rid}' (expected e.g. AUTH-01)")
            else:
                real_ids += 1
        if template_seen and real_ids == 0:
            warnings.append("Traceability has only template rows (no real IDs yet)")

    # Observable: every item of every surface present. A surface carries the same decisions
    # every time it appears, so a blank here is an item nobody decided - not one that does not
    # apply, which is what the mandatory `n/a - <reason>` escape is for.
    obs = present.get("Observable")
    if obs:
        body = [lines[i].strip() for i in range(*obs) if lines[i].strip()]
        rows = first_table(lines, obs)
        declares_none = any(NONE_RE.search(x) for x in body)
        if not body:
            errors.append(
                "Observable section is empty - walk each surface's decisions, or state "
                "`None - no user-facing surface`"
            )
        elif not rows and not declares_none:
            errors.append("Observable has no rows and does not state `None - no user-facing surface`")
        for r in rows:
            cells = split_row(r)
            if len(cells) < 3 or not cells[0] or PLACEHOLDER_RE.match(cells[0]):
                continue
            label = f"{cells[0][:28]} / {cells[1][:28]}"
            landing = cells[2]
            if not landing or PLACEHOLDER_RE.match(landing) or landing in ("-", "\u2014"):
                errors.append(
                    f"Observable '{label}': landing is blank - a criterion, `existing - <what>`, "
                    "or `n/a - <reason>`"
                )
                continue
            low = landing.lower()
            for kw in ("n/a", "na -", "existing"):
                if low.startswith(kw):
                    rest = landing[len(kw):].strip(" -\u2013\u2014:")
                    if len(rest) < 3:
                        errors.append(
                            f"Observable '{label}': `{kw}` with no reason - say why it does not "
                            "apply, or name what already behaves that way"
                        )
                    break

    # --- what is being built ---

    for sec, hint in SHAPE_HINTS:
        b = present.get(sec)
        if not b:
            continue
        body = [lines[i].strip() for i in range(*b) if lines[i].strip()]
        if not body:
            errors.append(f"{sec} section is empty - {hint}")
        elif all(PLACEHOLDER_RE.match(x) for x in body):
            errors.append(f"{sec} section is still the template placeholder")

    # Relations: no columns, no types. In mermaid that detail is an attribute block.
    rel = present.get("Relations")
    if rel:
        for i in range(*rel):
            if ER_ATTRIBUTE_RE.match(lines[i]):
                errors.append(
                    f"L{i + 1}: Relations carries an attribute block ('{lines[i].strip()}') - columns and "
                    "types are reversible, come from the repo's conventions, and go stale here"
                )
                break

    # Surface: statuses are what becomes a Coverage set in checks.md.
    surf = present.get("Surface")
    if surf:
        body = [lines[i].strip() for i in range(*surf) if lines[i].strip()]
        declares_none = any(NONE_RE.search(x) for x in body)
        rows = first_table(lines, surf)
        for r in rows:
            cells = split_row(r)
            if not cells or not cells[0] or PLACEHOLDER_RE.match(cells[0]):
                continue
            status_cell = cells[3] if len(cells) > 3 else ""
            if not STATUS_RE.search(status_cell):
                errors.append(
                    f"Surface '{cells[0][:48]}': Status names no status code - those statuses are the "
                    "set that owes a Coverage row in checks.md"
                )
        for i in range(*surf):
            if CID_RE.search(lines[i]):
                errors.append(
                    f"L{i + 1}: Surface names a check id, but checks.md does not exist yet - each route's "
                    "statuses become a Coverage set there instead"
                )
                break
        if not rows and not declares_none:
            errors.append("Surface has no route rows and does not state `None - nothing consumed outside`")

    # Landing: the doors.
    land = present.get("Landing")
    if land:
        body = [lines[i].strip() for i in range(*land) if lines[i].strip()]
        rows_data = first_table(lines, land)
        declares_none = any(NONE_RE.search(x) for x in body)
        if not body:
            errors.append("Landing section is empty - state `None - <why nothing here is one-way>`")
        elif not rows_data and not declares_none:
            errors.append(
                "Landing has no door rows and does not state `None - <why>` - the omission has to be contestable"
            )
        for r in rows_data:
            cells = split_row(r)
            if len(cells) >= 3 and cells[0] and not PLACEHOLDER_RE.match(cells[0]):
                if not cells[1] or PLACEHOLDER_RE.match(cells[1]):
                    errors.append(f"Landing '{cells[0][:40]}': no literal shape - the next person copies this")
                if not cells[2] or PLACEHOLDER_RE.match(cells[2]):
                    errors.append(f"Landing '{cells[0][:40]}': no rejected alternative named")

    # Impact: a section with no rows is a sweep nobody did.
    imp = present.get("Impact")
    if imp:
        body = [lines[i].strip() for i in range(*imp) if lines[i].strip()]
        if body and not first_table(lines, imp) and not any(x.startswith(("-", "*")) for x in body):
            warnings.append("Impact has neither rows nor bullets - name the fronts, even to say nothing changes")

    # Flow: a module that neither exists nor is created by a door is placement, which this
    # artifact deliberately leaves to the diff. Naming one here is how the catalogue creeps back.
    flow = present.get("Flow")
    if flow:
        land_text = "\n".join(lines[i] for i in range(*land)).lower() if land else ""
        for i in range(*flow):
            ln = lines[i].strip()
            if not re.match(r"^\s*(\d+\.|[-*])\s", ln):
                continue
            if HOP_RESOLVED_RE.search(ln):
                continue
            _warn_unresolved(warnings, i, MODULE_RE.findall(ln), land_text, "hop")

        # A branching path is drawn instead of listed, and the same rule holds inside the
        # diagram: a node that neither exists nor is created by a door is placement.
        for i in range(*flow):
            ln = lines[i]
            if not EDGE_LINE_RE.search(ln) or HOP_RESOLVED_RE.search(ln):
                continue
            labels = [lbl.strip() for lbl in NODE_LABEL_RE.findall(ln) if lbl.strip()]
            _warn_unresolved(warnings, i, labels, land_text, "diagram node")

    return errors, warnings


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="validate_plan.py",
        description="Pre-checks gate for a feature plan.md: the criteria, and the shape they land in.",
    )
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args(argv)

    path = resolve_plan(args.target, args.root)
    if not path:
        print(
            "validate_plan: could not locate a plan.md. Pass a path or run from the project root.",
            file=sys.stderr,
        )
        return 2

    errors, warnings = check_file(path)
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    fail = errors or (warnings and args.strict)
    print(f"\nvalidate_plan: {len(errors)} error(s), {len(warnings)} warning(s) in {path}")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
validate_plan.py - deterministic gate for a feature plan.md, run before writing checks.

One artifact, one gate. The plan carries both halves a human confirms - what must be
true (problem, criteria, assumptions) and what is being built (shape, surface, landing) -
so this script turns the structural part of the review into a pass/fail run instead of
trusting the model to remember it.

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
  - columns and types inside the stored shape, which is the exact detail that goes stale
    and then misleads the next reader with the authority of a written diagram;
  - a `Surface` row with no statuses, since the statuses are what becomes a Coverage set
    in checks.md - drop them here and the join has nothing to enumerate;
  - a departure from a binding source the user never approved.

Pure standard library, zero dependencies. Operates only on the plan.md markdown
artifact - never on the target codebase - so it stays stack-agnostic.

What it checks:
  ERROR  - a required section is missing
  ERROR  - an acceptance criterion has no SHALL (not testable / not EARS-shaped)
  ERROR  - an Assumptions row has an empty "Chosen default" or "Rationale" cell
  ERROR  - Shape or Surface is empty, or still the template placeholder
           (each has a one-line "None - <why>" answer, so a blank is never "nothing to say")
  ERROR  - Shape has no `Changes underneath` part
  ERROR  - the Landing section is empty (state `None - <why>` instead)
  ERROR  - Landing has no door rows and does not state `None - <why>`
  ERROR  - a Landing row with no literal shape
  ERROR  - a Landing row with no rejected alternative named
  ERROR  - an erDiagram in Shape carrying an attribute block: columns and types go stale
  ERROR  - a Surface row whose Status cell names no status code
  ERROR  - a Surface table with no Who column, a blank Who, or a Who other than `anyone`
           whose Status names no code for the callers who may not (3xx, 401, 403, 404)
  ERROR  - a check id written into Surface, which cannot exist before checks.md does
  ERROR  - a capture a criterion cites that does not exist, or a link where a file belongs
  ERROR  - Sources marks a source binding, but there is no Differences from the source section
  ERROR  - a Differences row whose Confirmed cell is not `y` - departing from a binding source
           is the user's call
  ERROR  - with a binding source, an image under the feature's captures/ that no criterion cites
  ERROR  - an image under captures/ left non-binding with no Sources line quoting the user
           calling it inspiration (`non-binding - user: "<their words>"`)
  WARN   - an AC has SHALL but no recognizable EARS lead keyword
  WARN   - an AC carries a vague word instead of a concrete value
  WARN   - no numbered acceptance criteria found at all
  WARN   - template placeholder rows are still present (plan not filled in)
  WARN   - open questions are not explicitly resolved
  WARN   - no Sources section ('nothing' is valid, a missing section is not)
  ERROR  - a Shape path with no mermaid drawing, or a module on the path the drawings never name
  ERROR  - a Shape with no `erDiagram` and no `Data: none - <why>`, or an erDiagram with no `New:` line
  ERROR  - a capture under captures/ that the plan does not show as an image (`![..](captures/..)`)
  WARN   - a path hop, or a flowchart node, naming a module marked neither existing
           nor as a Landing door

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

from lean_config import BINDING_RE, NOT_BINDING_RE, _section, plan_marks_binding

# Each entry is a tuple of acceptable heading names (first is canonical).
REQUIRED_SECTIONS = [
    ("Problem", "Problem Statement"),
    ("Shape",),
    ("Surface",),
    ("Landing",),
    ("Criteria", "User Stories"),
    ("Out of scope", "Out of Scope"),
    ("Assumptions", "Assumptions & Open Questions"),
]
ADVISORY_SECTIONS = ["Sources"]
DIFFERENCES = ("Differences from the source", "Differences")

# The shape half: each has a one-line answer when it does not apply.
SHAPE_HINTS = (
    ("Shape", "state the hops in order, or `single module - <name>`, and what changes underneath"),
    ("Surface", "state the route signature, or `None - nothing consumed outside`"),
)
CHANGES_RE = re.compile(r"changes underneath", re.IGNORECASE)
CONFIRMED_RE = re.compile(r"^\W*y(es)?\b", re.IGNORECASE)
AD_ID_RE = re.compile(r"\bAD-\d{3,}\b")
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")

PLACEHOLDER_RE = re.compile(r"^\s*[\[<].+[\]>]\s*$")
CID_RE = re.compile(r"\bC\d+\b")
STATUS_RE = re.compile(r"\b[1-5]\d\d\b")
DENIED_RE = re.compile(r"\b(3\d\d|401|403|404)\b")
OPEN_WHO_RE = re.compile(r"^\W*(anyone|public|anonymous)\b", re.IGNORECASE)
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
# An erDiagram relationship carries cardinality markers on both sides of the dashes.
ER_EDGE_RE = re.compile(r"[|}{o]{2}--|--[|}{o]{2}")


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
        # An indented bullet is a rule's example and stays inside the block.
        elif re.match(r"^#{1,4}\s", ln) or stripped.startswith("**") or re.match(r"^[-*+]\s", ln):
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
        f"L{idx + 1}: Shape {kind} names `{names[0]}` without marking it as existing or as a "
        "Landing door - if it is neither, it is placement and belongs in the diff"
    )


def _path_bases(plan_path):
    """Where a capture path may be relative to: the project root holding .specs/, then the plan's folder."""
    here = os.path.dirname(os.path.abspath(plan_path))
    cur = here
    while True:
        if os.path.isdir(os.path.join(cur, ".specs")):
            return [cur, here]
        parent = os.path.dirname(cur)
        if parent == cur:
            return [here]
        cur = parent


def check_captures(lines, plan_path, binding):
    """Every capture a criterion cites is a file under the project. With a binding source, every
    image under the feature's captures/ is cited by a criterion, or the builder never aims at it."""
    errors = []
    crit = section_bounds(lines, ("Criteria", "User Stories"))
    criteria_text = "\n".join(lines[crit[0]:crit[1]]) if crit else ""
    bases = _path_bases(plan_path) + [os.path.join(os.path.dirname(os.path.abspath(plan_path)), "captures")]
    for p in MODULE_RE.findall(criteria_text):
        if "://" in p:
            if binding:
                errors.append(
                    f"Criteria: `{p[:48]}` is a link, not a capture - export the frame or state to a file "
                    "under the project, keep the link in Sources"
                )
            continue
        if not p.lower().endswith(IMAGE_EXT + (".yml", ".yaml")):
            continue
        if not any(os.path.exists(os.path.join(b, p)) for b in bases):
            errors.append(f"Criteria: capture `{p}` does not exist")
    if binding:
        cdir = os.path.join(os.path.dirname(os.path.abspath(plan_path)), "captures")
        if os.path.isdir(cdir):
            for f in sorted(os.listdir(cdir)):
                if not f.lower().endswith(IMAGE_EXT) or ".running." in f:
                    continue
                stem = f.split(".")[0]
                if stem not in criteria_text:
                    errors.append(
                        f"no criterion cites the capture `{f}` - each screen's criterion names its "
                        "capture files, or the builder never aims at the picture"
                    )
    return errors


USER_QUOTE_RE = re.compile(r"\buser\b[^\"“]*[\"“][^\"”]{3,}[\"”]", re.IGNORECASE)

# A hop's module: the backticked name right before its marker.
MARKED_MODULE_RE = re.compile(r"`([^`]+)`\s*\((?:exists|existing|new|door\s*\d+)\)", re.IGNORECASE)
DATA_NONE_RE = re.compile(r"^\W*Data\W*:?\s*none\b", re.IGNORECASE)
NEW_LINE_RE = re.compile(r"^\W*New\W*:", re.IGNORECASE)


def raw_lines(path):
    """The file as written: strip_fences blanks the fence lines that delimit a mermaid block."""
    with open(path, encoding="utf-8") as f:
        return f.read().splitlines()


def mermaid_blocks(lines, bounds):
    """(index of the opening fence, diagram kind, body lines) for each mermaid block in bounds."""
    out, i, end = [], bounds[0], bounds[1]
    while i < end:
        if lines[i].strip().startswith("```mermaid"):
            j = i + 1
            while j < end and not lines[j].strip().startswith("```"):
                j += 1
            body = lines[i + 1:j]
            kind = next((x.split()[0] for x in body if x.strip()), "")
            out.append((i, kind, body))
            i = j + 1
        else:
            i += 1
    return out


def _drawn(name, text):
    base = name.replace("\\", "/").rstrip("/").split("/")[-1]
    stem = base.rsplit(".", 1)[0] if "." in base else base
    return any(x and x.lower() in text for x in (name, base, stem))


def check_drawings(lines, shape, plan_path):
    """The plan is read by the person who approves it, and a drawing is read before a list. The path
    and the data are drawn, and the drawing names the modules the list does, so the two cannot
    describe different systems."""
    errors = []
    blocks = mermaid_blocks(raw_lines(plan_path), shape)
    body = [lines[i] for i in range(*shape)]
    if any("single module" in x.lower() for x in body):
        hops = []
    else:
        hops = [i for i in range(*shape) if re.match(r"^\s*\d+\.\s", lines[i])]
    paths = [b for b in blocks if b[1] in ("sequenceDiagram", "flowchart", "graph")]
    if hops and not paths:
        errors.append(
            "Shape lists the path but does not draw it - add a mermaid `sequenceDiagram` (a request and "
            "its answer) or `flowchart` (branches, queues, jobs) numbered like the list; whoever approves "
            "the plan reads the drawing first"
        )
    elif hops:
        drawn = "\n".join(x for b in blocks for x in b[2]).lower()
        for i in hops:
            for name in MARKED_MODULE_RE.findall(lines[i]):
                if not _drawn(name, drawn):
                    errors.append(
                        f"L{i + 1}: `{name}` is on the path but not in its drawing - name the same modules "
                        "in both, or the two describe different systems"
                    )
    has_er = any(b[1] == "erDiagram" for b in blocks)
    if not has_er and not any(DATA_NONE_RE.match(x) for x in body):
        errors.append(
            "Shape has no `erDiagram` of the data this reads or writes - draw the entities it touches and "
            "how they relate, or state `Data: none - <why>`"
        )
    elif has_er and not any(NEW_LINE_RE.match(x) for x in body):
        errors.append(
            "Shape: the erDiagram has no `New:` line - say which entities or relations this adds, or "
            "`New: nothing - read only`"
        )
    cdir = os.path.join(os.path.dirname(os.path.abspath(plan_path)), "captures")
    if os.path.isdir(cdir):
        shown = "\n".join(x for x in lines if "![" in x)
        for f in sorted(os.listdir(cdir)):
            if f.lower().endswith(IMAGE_EXT) and ".running." not in f and f not in shown:
                errors.append(
                    f"the capture `{f}` is not shown in the plan - put `![<name>](captures/{f})` on its "
                    "Sources line so whoever approves sees the screen"
                )
    return errors


def check_unbound_captures(lines, plan_path, binding):
    """A capture that came with the request binds. It is non-binding only on the user's word,
    quoted on its Sources line - otherwise the planner can drop it to avoid asking."""
    cdir = os.path.join(os.path.dirname(os.path.abspath(plan_path)), "captures")
    if not os.path.isdir(cdir):
        return []
    sources = _section(lines, "Sources")
    errors = []
    for f in sorted(os.listdir(cdir)):
        if not f.lower().endswith(IMAGE_EXT) or ".running." in f:
            continue
        cited = [s for s in sources if f in s]
        if any(BINDING_RE.search(s) and not NOT_BINDING_RE.search(s) for s in cited):
            continue
        if cited and all(USER_QUOTE_RE.search(s) for s in cited):
            continue
        if not cited and binding:
            continue
        errors.append(
            f"Sources: the capture `{f}` is not binding and no line quotes the user calling it "
            "inspiration - a capture that comes with the request binds; write "
            "`non-binding - user: \"<their words>\"` only when they said so"
        )
    return errors


def active_decisions(plan_path):
    """The `active` AD ids in the project's `.specs/STATE.md`, or None when there is no such file."""
    root = _path_bases(plan_path)[0]
    state = os.path.join(root, ".specs", "STATE.md")
    if not os.path.isfile(state):
        return None
    ids = set()
    with open(state, "r", encoding="utf-8") as f:
        for line in f:
            cells = split_row(line.strip()) if line.strip().startswith("|") else []
            if len(cells) >= 4 and AD_ID_RE.fullmatch(cells[0]) and cells[3].lower().startswith("active"):
                ids.add(cells[0])
    return ids


def check_differences(lines, plan_path):
    """With a binding source, every departure from it is listed, and the user approved each one in
    a decision `.specs/STATE.md` holds, so what was asked outlives the conversation."""
    bounds = section_bounds(lines, DIFFERENCES)
    if bounds is None:
        return [
            "Sources marks a source binding but there is no `## Differences from the source` section - "
            "list each approved departure, or state `None - the product matches the source`"
        ]
    errors = []
    body = [lines[i].strip() for i in range(*bounds) if lines[i].strip()]
    rows = first_table(lines, bounds)
    if not rows and not any(NONE_RE.search(x) for x in body):
        errors.append(
            "Differences from the source has no rows and does not state `None - the product matches the source`"
        )
    decisions = None
    for r in rows:
        cells = split_row(r)
        if not cells or not cells[0] or PLACEHOLDER_RE.match(cells[0]):
            continue
        confirmed = cells[2] if len(cells) > 2 else ""
        if not CONFIRMED_RE.match(confirmed):
            errors.append(
                f"Differences '{cells[0][:40]}': Confirmed is '{confirmed[:20]}' - departing from a binding "
                "source is the user's call; ask, then mark `y`"
            )
            continue
        cited = AD_ID_RE.findall(confirmed)
        if not cited:
            errors.append(
                f"Differences '{cells[0][:40]}': Confirmed cites no decision - record the question and the "
                "answer as an `AD-NNN` in `.specs/STATE.md` and write `y - AD-NNN`"
            )
            continue
        if decisions is None:
            decisions = active_decisions(plan_path) or set()
        for ad in cited:
            if ad not in decisions:
                errors.append(
                    f"Differences '{cells[0][:40]}': cites {ad}, which `.specs/STATE.md` does not hold as active"
                )
    return errors


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

    binding = plan_marks_binding(lines)
    errors += check_captures(lines, path, binding)
    errors += check_unbound_captures(lines, path, binding)
    if binding:
        errors += check_differences(lines, path)

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

    shape = present.get("Shape")
    if shape:
        errors += check_drawings(lines, shape, path)

    # Stored shape: no columns, no types. In mermaid that detail is an attribute block.
    if shape:
        for i in range(*shape):
            if ER_ATTRIBUTE_RE.match(lines[i]):
                errors.append(
                    f"L{i + 1}: Shape carries an attribute block ('{lines[i].strip()}') - columns and "
                    "types are reversible, come from the repo's conventions, and go stale here"
                )
                break

    # Surface: statuses are what becomes a Coverage set in checks.md.
    surf = present.get("Surface")
    if surf:
        body = [lines[i].strip() for i in range(*surf) if lines[i].strip()]
        declares_none = any(NONE_RE.search(x) for x in body)
        rows = first_table(lines, surf)
        header = next((split_row(lines[i]) for i in range(*surf) if lines[i].strip().startswith("|")), [])
        who_col = next((k for k, h in enumerate(header) if h.lower() == "who"), None)
        if rows and who_col is None:
            errors.append(
                "Surface has no Who column - who may call each route, and what the rest get back, "
                "is part of the signature"
            )
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
                continue
            if who_col is None:
                continue
            who = cells[who_col] if len(cells) > who_col else ""
            if not who:
                errors.append(f"Surface '{cells[0][:48]}': Who is blank - name who may call it, or `anyone`")
            elif not OPEN_WHO_RE.search(who) and not DENIED_RE.search(status_cell):
                errors.append(
                    f"Surface '{cells[0][:48]}': only '{who[:40]}' may call it, but Status names no code "
                    "for the rest (a 3xx, 401, 403 or 404) - that status is the Coverage member proving "
                    "the door is shut"
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

    # Shape: what changes underneath is a sweep, so a missing part is a sweep nobody did.
    if shape:
        body = [lines[i] for i in range(*shape)]
        if any(x.strip() for x in body) and not any(CHANGES_RE.search(x) for x in body):
            errors.append(
                "Shape has no `Changes underneath` part - name what already exists and changes, "
                "even to say nothing does"
            )

        # A module that neither exists nor is created by a door is placement, which this
        # artifact leaves to the diff. Naming one here is how the catalogue creeps back.
        land_text = "\n".join(lines[i] for i in range(*land)).lower() if land else ""
        for i in range(*shape):
            ln = lines[i].strip()
            if not re.match(r"^\s*\d+\.\s", ln):
                continue
            if HOP_RESOLVED_RE.search(ln):
                continue
            _warn_unresolved(warnings, i, MODULE_RE.findall(ln), land_text, "hop")

        # The same rule holds inside a flowchart: a node that neither exists nor is created
        # by a door is placement.
        flow_lines = {i + 1 + k for i, kind, body in mermaid_blocks(raw_lines(path), shape)
                      if kind in ("flowchart", "graph") for k in range(len(body))}
        for i in sorted(flow_lines):
            ln = lines[i]
            if ER_EDGE_RE.search(ln) or not EDGE_LINE_RE.search(ln) or HOP_RESOLVED_RE.search(ln):
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

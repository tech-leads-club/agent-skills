#!/usr/bin/env python3
"""
validate_spec.py - the gate a spec.md passes before it is shown to the user.

It reads the spec through specs.py, so the shape it accepts is the one every other gate reads. Pure
standard library; it reads the spec, its captures and .specs/STATE.md, never the codebase.

What it checks:
  ERROR  - no `**Scope**: Small | Medium | Large | Complex` line, or a scope below the floor the spec
           itself sets: more than 3 criteria or 1 story owes Medium; more than 8 criteria or 2 stories
           owe Large
  ERROR  - a required section is missing (`## Implicit Requirements` too, for Large and Complex)
  ERROR  - a story not written `### P<n>: <title>`, or with no `**Acceptance Criteria**:` field
  ERROR  - a criterion with no ID of its own, or an ID used twice
  ERROR  - a criterion with no SHALL or more than one: one criterion is one behaviour
  ERROR  - a criterion with when, while or if inside it: the condition leads, `WHEN ... THEN the system
           SHALL ...`; an IF with no THEN
  ERROR  - a vague word in a criterion (quickly, gracefully, adequado, ...): it leaves no value to test
  ERROR  - a semicolon in a criterion: two behaviours in one line
  ERROR  - `## Implicit Requirements` without a row per dimension, or a row that lands on no criterion
           and gives no `N/A - <reason>`
  ERROR  - an Assumptions row with no chosen default or no rationale
  ERROR  - a template placeholder left in (`[Feature]`, `[role]`, ...)
  ERROR  - captures: not binding and not quoted as inspiration, not cited by a criterion, not shown,
           or a departure from a binding source with no active AD-NNN
  ERROR  - the spec changed after the user approved it: the hash on its `**Approved**` line no longer
           matches (approve.py writes the line)
  WARN   - the open questions are not `none` (fine to present; the spec cannot be approved like this)
  WARN   - an obsolete `## Requirement Traceability` section (IDs live on the criteria now)

Usage:
  python3 <skill-dir>/scripts/validate_spec.py [feature] [--root DIR] [--strict]

Exit codes: 0 pass, 1 errors (or warnings under --strict), 2 usage error, 3 the same errors twice in a row.
"""

import argparse
import os
import re
import sys

from lean_config import BINDING_RE, NOT_BINDING_RE
from specs import (ID_RE, SCOPES, VAGUE_RE, approval_errors, feature_dir, finish, norm, read_spec,
                   without_code)

IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")
USER_QUOTE_RE = re.compile(r"\buser\b[^\"“]*[\"“][^\"”]{3,}[\"”]", re.IGNORECASE)
AD_ID_RE = re.compile(r"\bAD-\d{3,}\b")
PLACEHOLDER_RE = re.compile(r"(?<![!\]])\[[A-Z][^\]\n]*\](?![(\[])")
REQUIRED_SECTIONS = ["Problem Statement", "Out of Scope", "Assumptions & Open Questions", "User Stories"]
DIMENSIONS = [
    "Input validation & bounds", "Failure / partial-failure states", "Idempotency / retry / duplicate handling",
    "Auth boundaries & rate limits", "Concurrency / ordering", "Data lifecycle / expiry", "Observability",
    "External-dependency failure", "State-transition integrity",
]
# The scope a spec owes by its own size: (criteria above, stories above, scope).
FLOORS = [(8, 2, "Large"), (3, 1, "Medium")]


def scope_floor(n_criteria, n_stories):
    for crit, stories, scope in FLOORS:
        if n_criteria > crit or n_stories > stories:
            return scope
    return "Small"


def check_criterion(c, errors):
    text = without_code(c.text)
    where = f"spec.md L{c.line} {c.id}"
    shalls = len(re.findall(r"\bshall\b", text, re.IGNORECASE))
    if shalls == 0:
        errors.append(f"{where}: no SHALL - a criterion states what the system SHALL do")
    elif shalls > 1:
        errors.append(f"{where}: {shalls} SHALLs - one criterion is one behaviour; split it and give each its own ID")
    lead = re.match(r"^(WHEN|WHILE|WHERE|IF)\b", text, re.IGNORECASE)
    if not lead and re.search(r"\b(when|while|if)\b", text, re.IGNORECASE):
        errors.append(f"{where}: a condition inside the sentence - lead with it: `WHEN <trigger> THEN the system SHALL ...`, "
                      f"`WHILE <state> ...` or `IF <condition> THEN ...`")
    if lead and lead.group(1).upper() == "IF" and not re.search(r"\bthen\b", text, re.IGNORECASE):
        errors.append(f"{where}: IF with no THEN - `IF <condition> THEN the system SHALL <response>`")
    for m in VAGUE_RE.finditer(text):
        errors.append(f"{where}: `{m.group(1)}` - name the value a test can hold (a bound, a status, a message)")
    if ";" in text:
        errors.append(f"{where}: a semicolon joins two behaviours - split them into two criteria")
    if text.lstrip().startswith("["):
        errors.append(f"{where}: template text left in the criterion")


def check_sweep(doc, ids, errors):
    body = doc.section("Implicit Requirements")
    tables = doc.tables(*body) if body else []
    if not tables:
        errors.append("`## Implicit Requirements` has no table - `| Dimension | Lands on |`, one row per dimension")
        return
    t = tables[0]
    errors += [f"spec.md {e}" for e in t.errors]
    dim, lands = t.key("dimension"), t.key("lands on")
    if not dim or not lands:
        errors.append(f"spec.md L{t.line}: the table's columns are `Dimension` and `Lands on`")
        return
    rows = {norm(r[dim]): (n, r[lands]) for n, r in t.rows}
    for name in DIMENSIONS:
        if norm(name) not in rows:
            errors.append(f"`## Implicit Requirements` has no row `{name}`")
            continue
        n, cell = rows[norm(name)]
        cited = re.findall(r"\b[A-Z][A-Z0-9]*-\d{2,}\b", cell)
        if re.match(r"^n/?a\s+-\s+\S.{2,}", cell.strip(), re.IGNORECASE):
            continue
        if not cited:
            errors.append(f"spec.md L{n}: `{name}` lands on no criterion - cite its IDs, or write `N/A - <reason>`")
        for cid in cited:
            if cid not in ids:
                errors.append(f"spec.md L{n}: `{name}` cites {cid}, and no criterion has that ID")


def check_assumptions(doc, errors, warnings):
    body = doc.section("Assumptions & Open Questions")
    if not body:
        return
    for t in doc.tables(*body):
        errors += [f"spec.md {e}" for e in t.errors]
        first, chosen, why = t.key("assumption"), t.key("chosen default"), t.key("rationale")
        if not chosen or not why:
            continue
        for n, r in t.rows:
            if not r[first] and not r[chosen]:
                continue
            if not r[chosen].strip():
                errors.append(f"spec.md L{n}: assumption `{r[first][:40]}` has no chosen default")
            if not r[why].strip():
                errors.append(f"spec.md L{n}: assumption `{r[first][:40]}` has no rationale")
    lines = [s for _, s in doc.text(*body) if "open questions" in s.lower()]
    if not lines or not re.search(r"open questions\W*:\s*none", norm(" ".join(lines))):
        warnings.append("open questions are not `none` - present the spec with them; it cannot be approved like this")


def check(spec_path, stamped=True):
    """The spec's errors and warnings. `stamped=False` leaves out its approval, for approve.py."""
    spec = read_spec(spec_path)
    doc, criteria = spec["doc"], spec["criteria"]
    errors, warnings = list(spec["errors"]), []

    scope = spec["scope"]
    if not scope or scope.value.strip() not in SCOPES:
        errors.append("no `**Scope**: Small | Medium | Large | Complex` line under the title")
        declared = None
    else:
        declared = scope.value.strip()
        floor = scope_floor(len(criteria), len(spec["stories"]))
        if SCOPES.index(declared) < SCOPES.index(floor):
            errors.append(f"`**Scope**: {declared}` - {len(criteria)} criteria in {len(spec['stories'])} stories "
                          f"owe at least {floor}")

    for name in REQUIRED_SECTIONS + (["Implicit Requirements"] if declared in ("Large", "Complex") else []):
        if doc.section(name) is None:
            errors.append(f"missing required section: ## {name}")
    if doc.section("User Stories") and not criteria and not spec["errors"]:
        errors.append("no criterion under `## User Stories`")

    seen = {}
    for c in criteria:
        if not ID_RE.match(c.id):
            errors.append(f"spec.md L{c.line}: `{c.id}` is not an ID - `AUTH-01`")
        if c.id in seen:
            errors.append(f"spec.md L{c.line}: {c.id} is already used at L{seen[c.id]} - one ID per criterion")
        seen.setdefault(c.id, c.line)
        check_criterion(c, errors)

    if doc.section("Implicit Requirements") or declared in ("Large", "Complex"):
        check_sweep(doc, set(seen), errors)
    check_assumptions(doc, errors, warnings)
    if doc.section("Requirement Traceability"):
        warnings.append("`## Requirement Traceability` is obsolete - each criterion carries its ID; delete the section")

    for i, raw in enumerate(doc.lines, start=1):
        m = PLACEHOLDER_RE.search(without_code(raw))
        if m:
            errors.append(f"spec.md L{i}: template placeholder `{m.group(0)}` left in")
    errors += check_sources(doc.raw, spec_path)
    if stamped:
        with open(spec_path, encoding="utf-8") as f:
            errors += approval_errors(os.path.dirname(os.path.abspath(spec_path)), False, {"spec.md": f.read()},
                                      ("spec.md",))
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


def _rows(lines, name):
    body = _body(lines, name)
    rows = [r for r in body if r.startswith("|") and not re.match(r"^\|?[\s:|-]+\|?$", r)]
    return [[c.strip() for c in r.strip("|").split("|")] for r in rows[1:]]


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
    if images and not any(re.match(r"^##\s+Sources\s*$", ln.strip()) for ln in lines):
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
            errors.append(f"no criterion cites the capture `{f}` - each screen's criterion names its capture file")
        if f not in shown:
            errors.append(f"the capture `{f}` is not shown in the spec - put `![<name>](captures/{f})` on its "
                          "Sources line so whoever approves sees the screen")
    if binding:
        if not any(re.match(r"^##\s+Differences from the source\s*$", ln.strip()) for ln in lines):
            errors.append("a source binds but there is no `## Differences from the source` section - list every way "
                          "the product departs from it, or `None - the product matches the source`")
        else:
            active = _active_decisions(spec_path)
            for cells in _rows(lines, "Differences from the source"):
                if not cells or not cells[0] or cells[0].startswith("["):
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
    p = argparse.ArgumentParser(prog="validate_spec.py", description="The gate a spec.md passes before it is shown.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args(argv)

    fdir = feature_dir(args.target, args.root, "spec.md")
    spec = os.path.join(fdir, "spec.md") if fdir else None
    if args.target and os.path.isfile(args.target):
        spec = args.target
    if not spec or not os.path.isfile(spec):
        print("validate_spec: could not locate a spec.md. Pass a feature, or run from the project root.",
              file=sys.stderr)
        return 2
    errors, warnings = check(spec)
    return finish("validate_spec", fdir, errors, warnings, args.strict, spec)


if __name__ == "__main__":
    raise SystemExit(main())

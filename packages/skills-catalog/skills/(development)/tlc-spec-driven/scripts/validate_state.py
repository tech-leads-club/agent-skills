#!/usr/bin/env python3
"""
validate_state.py - the gate .specs/STATE.md passes whenever it changes.

The Decisions log is the project's memory of why. It stays useful only when it is append-only and
every entry is whole, so this checks the file, and checks it against the committed version at HEAD.

What it checks:
  ERROR  - no `## Decisions` section, or an entry not written `### AD-NNN`
  ERROR  - entries not numbered AD-001, AD-002, ... in order with no gap or repeat
  ERROR  - an entry without Decision, Reason, Trade-off, Scope, Date (YYYY-MM-DD) or Status
  ERROR  - a Status other than `active` or `superseded by AD-NNN`, or one that names itself, an earlier
           entry, or an entry that does not exist
  ERROR  - against HEAD: an entry removed, or its Decision, Reason, Trade-off, Scope or Date rewritten,
           or a superseded entry set back to active (a new decision supersedes; it never edits)

Usage:
  python3 <skill-dir>/scripts/validate_state.py [--root DIR] [--no-head]

Exit codes: 0 pass, 1 errors, 2 usage error, 3 the same errors twice in a row.
"""

import argparse
import os
import re
import subprocess
import sys

from specs import finish, read_state

FIELDS = ["decision", "reason", "trade-off", "scope", "date", "status"]
FROZEN = ["decision", "reason", "trade-off", "scope", "date"]
SUPERSEDED_RE = re.compile(r"^superseded by AD-(\d{3,})$", re.IGNORECASE)


def head_version(root):
    try:
        out = subprocess.run(["git", "show", "HEAD:.specs/STATE.md"], cwd=root, capture_output=True, text=True,
                             timeout=20)
        return out.stdout if out.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def check_state(root, against_head=True):
    path = os.path.join(root, ".specs", "STATE.md")
    if not os.path.isfile(path):
        return [], []
    with open(path, encoding="utf-8") as f:
        state = read_state(f.read())
    errors = list(state["errors"])
    if not state["has_section"]:
        errors.append("STATE.md has no `## Decisions` section")
    decisions = state["decisions"]
    numbers = {d.num for d in decisions}
    for want, d in enumerate(decisions, 1):
        at = f"STATE.md L{d.line} {d.id}"
        if d.num != want:
            errors.append(f"{at}: decisions are numbered AD-001, AD-002 in order with no gap - this one is AD-{want:03d}")
        for name in FIELDS:
            if not d.fields.get(name, "").strip():
                errors.append(f"{at}: no `- **{name.capitalize()}**:` line")
        date = d.fields.get("date", "")
        if date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date.strip()):
            errors.append(f"{at}: Date `{date}` - write YYYY-MM-DD")
        status = d.fields.get("status", "").strip()
        m = SUPERSEDED_RE.match(status)
        if status and status.lower() != "active" and not m:
            errors.append(f"{at}: Status `{status}` - `active`, or `superseded by AD-NNN`")
        if m:
            target = int(m.group(1))
            if target not in numbers:
                errors.append(f"{at}: superseded by AD-{target:03d}, and there is no such entry")
            elif target <= d.num:
                errors.append(f"{at}: superseded by AD-{target:03d} - the entry that supersedes comes after this one")

    old = head_version(root) if against_head else None
    if old:
        now = {d.num: d for d in decisions}
        for o in read_state(old)["decisions"]:
            n = now.get(o.num)
            if not n:
                errors.append(f"STATE.md: {o.id} is at HEAD and gone now - the log is append-only; supersede, never delete")
                continue
            for name in FROZEN:
                if o.fields.get(name, "").strip() != n.fields.get(name, "").strip():
                    errors.append(f"STATE.md: {o.id} {name.capitalize()} changed since HEAD - write a new AD that "
                                  f"supersedes it")
            was, is_ = o.fields.get("status", "").strip().lower(), n.fields.get("status", "").strip().lower()
            if was != "active" and was != is_:
                errors.append(f"STATE.md: {o.id} was `{was}` at HEAD and is `{is_}` now - a superseded decision stays so")
    return errors, []


def main(argv=None):
    p = argparse.ArgumentParser(prog="validate_state.py", description="The gate .specs/STATE.md passes.")
    p.add_argument("--root", default=".")
    p.add_argument("--no-head", action="store_true", help="skip the comparison with the committed version")
    args = p.parse_args(argv)
    root = os.path.abspath(args.root)
    if not os.path.isdir(os.path.join(root, ".specs")):
        print("validate_state: no .specs/ under the root. Pass --root.", file=sys.stderr)
        return 2
    errors, warnings = check_state(root, not args.no_head)
    return finish("validate_state", os.path.join(root, ".specs"), errors, warnings, False, ".specs/STATE.md")


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
approve.py - writes the approval of spec.md or tasks.md, bound to the file as it stands.

The user approves the spec and the tasks. The approval line carries their words and a hash of the
file, so a later change shows: validate_spec.py, validate_tasks.py, check_commit.py and
validate_verification.py refuse a file whose hash no longer matches. The spec changes after its
approval only with the user's new words. The tasks may change during Execute: the author records the
change with --amend, in a commit of its own.

It refuses to stamp a file its gate fails, a spec with open questions, and tasks while the spec is not
approved. It never decides that the user approved: it writes the words it is given.

  spec.md   `**Approved**: <YYYY-MM-DD> - user: "<their words>" - hash: <12 hex>` under the title
  tasks.md  the same line, `**Status**: Approved`, and with --amend
            `**Amended**: <YYYY-MM-DD> - <what changed> - hash: <12 hex>` after the approval

Usage:
  python3 <skill-dir>/scripts/approve.py <feature> spec --user "<their words>" [--root DIR]
  python3 <skill-dir>/scripts/approve.py <feature> tasks --user "<their words>" [--root DIR]
  python3 <skill-dir>/scripts/approve.py <feature> tasks --amend "<what changed and why>" [--root DIR]

Exit codes: 0 stamped, 1 refused, 2 usage error.
"""

import argparse
import datetime
import os
import sys

from specs import (FIELD_RE, Doc, approval_errors, content_hash, feature_dir, has_open_questions, norm, read_spec,
                   read_stamps)


def refusals(fdir, root, kind, path):
    """What the file's own gate says, plus what the approval itself needs."""
    if kind == "spec":
        from validate_spec import check as check_spec
        errors, _ = check_spec(path, stamped=False)
        if has_open_questions(read_spec(path)["doc"]):
            errors.append("spec.md still has open questions - the user answers them before the spec is approved")
        return errors
    from validate_tasks import check as check_tasks
    errors, _ = check_tasks(fdir, root, False, restamp=("tasks.md",))
    return errors + [e for e in approval_errors(fdir, True, only=("spec.md",)) if e not in errors]


def stamp(text, kind, line, status=False):
    """The text with its approval or amendment line written. `--user` replaces both lines, `--amend`
    replaces the amendment only. With `status`, an approval also sets `**Status**: Approved`. A line in
    a fenced block is never touched."""
    doc = Doc(text=text)
    lines = text.splitlines()
    found = {}
    for i, ln in enumerate(doc.lines):
        m = FIELD_RE.match(ln.strip())
        if m and norm(m.group(1)) in ("approved", "amended", "status"):
            found.setdefault(norm(m.group(1)), []).append(i)
    approved = found.get("approved", [])
    drop = set(found.get("amended", [])) | (set(approved) if kind == "approved" else set())
    if kind == "approved" and status:
        for i in found.get("status", [])[:1]:
            lines[i] = "**Status**: Approved"
    new = [line]
    if kind == "amended":
        at = approved[0] + 1
    elif approved:
        at = approved[0]
    else:
        title = next((i for i, ln in enumerate(doc.lines) if ln.startswith("# ")), None)
        at = 0 if title is None else title + 1
        if title is not None and at < len(lines) and not lines[at].strip():
            at += 1
        elif title is not None:
            new = ["", line]
    kept = [ln for i, ln in enumerate(lines[:at]) if i not in drop]
    rest = [ln for i, ln in enumerate(lines[at:], start=at) if i not in drop]
    nl = "\r\n" if "\r\n" in text else "\n"
    return nl.join(kept + new + rest) + nl


def main(argv=None):
    p = argparse.ArgumentParser(prog="approve.py", description="Write the approval of spec.md or tasks.md.")
    p.add_argument("feature")
    p.add_argument("artifact", choices=("spec", "tasks"))
    who = p.add_mutually_exclusive_group(required=True)
    who.add_argument("--user", help="the user's words, as they gave them")
    who.add_argument("--amend", help="tasks.md only: what changed in the plan, and why")
    p.add_argument("--root", default=".")
    p.add_argument("--date", default=datetime.date.today().isoformat())
    args = p.parse_args(argv)

    root = os.path.abspath(args.root)
    fdir = feature_dir(args.feature, root, "spec.md")
    path = os.path.join(fdir, f"{args.artifact}.md") if fdir else None
    if not path or not os.path.isfile(path):
        print(f"approve: no {args.artifact}.md for `{args.feature}`. Pass the feature name, and --root when the "
              f"project is elsewhere.", file=sys.stderr)
        return 2
    words = (args.user if args.user is not None else args.amend).strip()
    if not words or words.startswith("[") or '"' in words or "\n" in words:
        print("approve: write the words on one line, without double quotes or a template placeholder.",
              file=sys.stderr)
        return 2
    if args.amend is not None and args.artifact == "spec":
        print("approve: the spec is never amended. Show the user the change, then approve it with their words "
              "(--user).", file=sys.stderr)
        return 2

    with open(path, encoding="utf-8", newline="") as f:
        text = f.read()
    errors = refusals(fdir, root, args.artifact, path)
    if args.amend is not None and not any(x.kind == "approved" for x in read_stamps(text, "tasks.md")[0]):
        errors.append("tasks.md is not approved yet - the user approves it first (--user), and only then is it amended")
    if errors:
        for e in errors:
            print(f"  ERROR {e}")
        print(f"\napprove: {args.artifact}.md not stamped - {len(errors)} error(s). Fix them, show the user, and run "
              f"this again.")
        return 1

    digest = content_hash(text)
    if args.user is not None:
        kind, line = "approved", f'**Approved**: {args.date} - user: "{words}" - hash: {digest}'
    else:
        kind, line = "amended", f"**Amended**: {args.date} - {words} - hash: {digest}"
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(stamp(text, kind, line, status=args.artifact == "tasks"))
    print(f"approve: {args.artifact}.md {kind} - hash {digest}")
    print("Commit it alone: a commit that writes an approval or an amendment stages only .specs/ files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

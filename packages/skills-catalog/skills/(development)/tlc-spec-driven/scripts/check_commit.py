#!/usr/bin/env python3
r"""
check_commit.py - deterministic Conventional Commits validation.

The per-task atomic-commit rule mandates Conventional Commits 1.0.0. This makes
that rule checkable instead of trusting the model to remember the format. Pure
standard library, zero dependencies, agent-agnostic.

It reads the message from (in priority order): a positional file path, --message,
or stdin. The file-path form matches how git passes the message file to a
`commit-msg` hook, so this doubles as an optional git-level guard WITHOUT
coupling the skill to any AI agent:

    printf '#!/bin/sh\nexec python3 "<skill-dir>/scripts/check_commit.py" "$1"\n' > .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg

A hook file rather than a symlink, so it works where symlinks do not. In PowerShell, which has no
printf or chmod, Git for Windows runs the same file with its own shell:

    Set-Content .git/hooks/commit-msg -NoNewline -Encoding ascii -Value "#!/bin/sh`nexec python `"<skill-dir>/scripts/check_commit.py`" `"`$1`"`n"

On Windows write `python` for `python3`, as the PowerShell line does.

What it checks:
  ERROR  - header does not match  type(scope)!: description
  ERROR  - type is not one of the allowed Conventional Commits types
  ERROR  - description is empty, starts uppercase, or ends with a period
  ERROR  - `!` breaking marker present but no `BREAKING CHANGE:` footer
  WARN   - header longer than 72 characters

After a passing message it prints what still follows the build of each feature under
`<root>/.specs/features/` that has checks and no verification.md: a command's output reaches the
agent after a compaction, where a rule it read hours earlier may not.

Usage:
  python3 <skill-dir>/scripts/check_commit.py [msgfile] [--root DIR]
  python3 <skill-dir>/scripts/check_commit.py --message "feat(auth): add email validation"
  echo "fix(cart): prevent negative quantity" | python3 <skill-dir>/scripts/check_commit.py

Exit codes: 0 pass, 1 violation, 2 usage error.
"""

import argparse
import os
import re
import sys

TYPES = ["feat", "fix", "refactor", "docs", "test", "style", "perf", "build", "ci", "chore"]
HEADER_RE = re.compile(r"^(?P<type>\w+)(?:\((?P<scope>[^)]+)\))?(?P<bang>!)?: (?P<desc>.+)$")


def read_message(args):
    if args.message is not None:
        return args.message
    if args.msgfile:
        # git passes a path that exists. Anything else is the message itself, which is how a
        # caller invokes this by hand - a traceback there is a worse answer than the check.
        if os.path.isfile(args.msgfile):
            with open(args.msgfile, "r", encoding="utf-8") as f:
                return f.read()
        return args.msgfile
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def check(message):
    errors, warnings = [], []
    # Ignore comment lines (git puts '#' comments in the message file).
    lines = [ln for ln in message.splitlines() if not ln.lstrip().startswith("#")]
    # Trim leading blank lines.
    while lines and not lines[0].strip():
        lines.pop(0)
    if not lines:
        return (["empty commit message"], warnings)

    header = lines[0].rstrip()
    if len(header) > 72:
        warnings.append(f"header is {len(header)} chars (>72): {header[:60]}...")

    m = HEADER_RE.match(header)
    if not m:
        errors.append(f"header does not match 'type(scope): description': {header!r}")
        return (errors, warnings)

    ctype = m.group("type")
    desc = m.group("desc")
    bang = m.group("bang")

    if ctype not in TYPES:
        errors.append(f"type '{ctype}' is not one of: {', '.join(TYPES)}")
    if not desc.strip():
        errors.append("description is empty")
    else:
        if desc[:1].isupper():
            errors.append(f"description should start lowercase: '{desc[:30]}'")
        if desc.rstrip().endswith("."):
            errors.append("description should not end with a period")

    body = "\n".join(lines[1:])
    breaking_footer = bool(re.search(r"^BREAKING CHANGE:", body, re.MULTILINE))
    if bang and not breaking_footer:
        errors.append("'!' breaking marker present but no 'BREAKING CHANGE:' footer")

    return (errors, warnings)


def has_checks(path):
    if not os.path.isfile(path):
        return False
    with open(path, encoding="utf-8", errors="replace") as f:
        return any(re.match(r"^#{1,4}\s+Checks\b", ln.strip()) for ln in f)


def unverified(root):
    """Features with a `## Checks` section and no verification.md: their verification is owed."""
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return []
    return [name for name in sorted(os.listdir(base))
            if not os.path.exists(os.path.join(base, name, "verification.md"))
            and any(has_checks(os.path.join(base, name, f)) for f in ("checks.md", "tasks.md", "spec.md"))]


def main(argv=None):
    p = argparse.ArgumentParser(prog="check_commit.py", description="Validate a Conventional Commits message.")
    p.add_argument("msgfile", nargs="?", default=None,
                   help="a commit message file (as git passes to commit-msg), or the message itself")
    p.add_argument("--message", default=None, help="the commit message as a string")
    p.add_argument("--root", default=".", help="project root that contains .specs/ (default: current dir)")
    args = p.parse_args(argv)

    message = read_message(args)
    if not message.strip():
        print("check_commit: no message provided (pass a file, --message, or pipe via stdin).", file=sys.stderr)
        return 2

    errors, warnings = check(message)
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    if errors:
        print("\ncheck_commit: FAIL - see https://www.conventionalcommits.org/en/v1.0.0/")
        return 1
    print("check_commit: OK")
    for name in unverified(args.root):
        print(f"\nAfter the last commit of `{name}` the feature is not done: run check_proofs.py {name}, then "
              f"dispatch the Verifier, and the screens sub-agent when a criterion cites a capture. `{name}` "
              f"is done when validate_verification.py {name} exits 0.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

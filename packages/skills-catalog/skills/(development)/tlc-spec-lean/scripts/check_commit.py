#!/usr/bin/env python3
r"""
check_commit.py - deterministic commit message check, and what the build still owes.

Build says: follow the repo's commit convention, Conventional Commits 1.0.0 where it has none, and
no agent trailer. A model holds that rule at high effort and drops it at lower effort, so this makes
it checkable instead of remembered. Pure standard library, zero dependencies, agent-agnostic.

The message comes from (in priority order) --message, a positional file path, or stdin. The
file-path form matches how git passes the message file to a `commit-msg` hook, so this doubles as a
git-level guard that does not depend on any agent:

    printf '#!/bin/sh\nexec python3 "<skill-dir>/scripts/check_commit.py" "$1"\n' > .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg

In PowerShell, which has no printf or chmod, Git for Windows runs the same file with its own shell:

    Set-Content .git/hooks/commit-msg -NoNewline -Encoding ascii -Value "#!/bin/sh`nexec python `"<skill-dir>/scripts/check_commit.py`" `"`$1`"`n"

What it checks:
  ERROR  - header does not match  type(scope)!: description
  ERROR  - type is not one of the allowed Conventional Commits types
  ERROR  - description is empty, starts uppercase, or ends with a period
  ERROR  - `!` breaking marker present but no `BREAKING CHANGE:` footer
  ERROR  - an agent trailer (Co-Authored-By, Made-with); --allow-trailers when the repo asks for one
  WARN   - header longer than 72 characters

After a passing message it prints what the run still owes, because a command's output reaches the
agent after a compaction, where a rule it read hours earlier may not:
  - untracked files outside .specs/ - not in any commit; the build ends with a clean tree (rule 4),
    so commit them, delete them, or ignore them. Browser and test tools leave output behind.
  - per feature with an approved plan.md - or a request.md and no plan.md, when the change skipped
    the plan - the next step its lines show: send the review, wait for it, make the one fix pass,
    or report. The `**Fix pass:**` line, not a later commit, says the fix pass happened, so a
    review that needs no change closes too.

Usage:
  python3 <skill-dir>/scripts/check_commit.py --message "feat(auth): add email validation" [--root DIR]
  python3 <skill-dir>/scripts/check_commit.py <msgfile>
  echo "fix(cart): prevent negative quantity" | python3 <skill-dir>/scripts/check_commit.py

Exit codes: 0 pass, 1 violation, 2 usage error.
"""

import argparse
import os
import re
import subprocess
import sys

TYPES = ["feat", "fix", "refactor", "docs", "test", "style", "perf", "build", "ci", "chore"]
HEADER_RE = re.compile(r"^(?P<type>\w+)(?:\((?P<scope>[^)]+)\))?(?P<bang>!)?: (?P<desc>.+)$")
TRAILER_RE = re.compile(r"^\s*(co-authored-by|made-with)\s*:", re.IGNORECASE | re.MULTILINE)
APPROVED_RE = re.compile(r"^\**\s*Approved\s*\**\s*:\s*\**\s*\d{4}-\d{2}-\d{2}\b", re.IGNORECASE)
REVIEW_SENT_RE = re.compile(r"^\**\s*Review\s*:?\s*\**\s*:?\s*sent at\s+`?([0-9a-f]{4,40})`?", re.IGNORECASE)
FIX_DONE_RE = re.compile(r"^\**\s*Fix pass\s*:?\s*\**\s*:?\s*done\b", re.IGNORECASE)


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


def check(message, allow_trailers=False):
    errors, warnings = [], []
    # Ignore comment lines (git puts '#' comments in the message file).
    lines = [ln for ln in message.splitlines() if not ln.lstrip().startswith("#")]
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

    ctype, desc, bang = m.group("type"), m.group("desc"), m.group("bang")
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
    if bang and not re.search(r"^BREAKING CHANGE:", body, re.MULTILINE):
        errors.append("'!' breaking marker present but no 'BREAKING CHANGE:' footer")
    trailer = TRAILER_RE.search(body)
    if trailer and not allow_trailers:
        errors.append(f"agent trailer '{trailer.group(1)}:' - remove it, or pass --allow-trailers "
                      "when the repo asks for one")
    return (errors, warnings)


def untracked(root):
    """Untracked, unignored paths outside .specs/ - what no commit will carry. None without git."""
    try:
        proc = subprocess.run(["git", "status", "--porcelain", "--untracked-files=normal"],
                              cwd=root, capture_output=True, encoding="utf-8", errors="replace")
    except OSError:
        return None
    if proc.returncode != 0:
        return None
    paths = [ln[3:].strip().strip('"') for ln in proc.stdout.splitlines() if ln.startswith("?? ")]
    return [p for p in paths if not (p == ".specs/" or p.startswith(".specs/"))]


def plan_lines(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return [ln.strip() for ln in f]


def next_steps(root):
    """(feature, what follows) for each feature whose run has started and is not reported yet.

    The run's lines live in plan.md once it is approved, or in request.md when the change skipped
    the plan. A plan.md not yet approved owes no build step.
    """
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return []
    out = []
    for name in sorted(os.listdir(base)):
        plan = os.path.join(base, name, "plan.md")
        request = os.path.join(base, name, "request.md")
        if os.path.isfile(plan):
            lines, where = plan_lines(plan), "plan.md"
            if not any(APPROVED_RE.match(s) for s in lines):
                continue
        elif os.path.isfile(request):
            lines, where = plan_lines(request), "request.md"
        else:
            continue
        sent = next((REVIEW_SENT_RE.match(s) for s in lines if REVIEW_SENT_RE.match(s)), None)
        fixed = any(FIX_DONE_RE.match(s) for s in lines)
        reviewed = os.path.isfile(os.path.join(base, name, "review.md"))
        if not sent:
            out.append((name, "after its last build commit, send the review (references/review.md): "
                              "the build is not done until a fresh sub-agent has reviewed it and the "
                              "one fix pass is committed"))
        elif not reviewed:
            out.append((name, f"the review was sent at {sent.group(1)}; wait for it, then make the one "
                              "fix pass"))
        elif not fixed:
            out.append((name, f"this is the one fix pass after review.md: write `**Fix pass:** done - "
                              f"<what it changed, or no changes needed>` in {where}, commit, leave the "
                              "tree clean, then report - there is no second review"))
        else:
            out.append((name, "the fix pass is recorded; what remains is the report - a further change "
                              "is outside the one pass, so name it there"))
    return out


def main(argv=None):
    p = argparse.ArgumentParser(prog="check_commit.py", description="Validate a commit message.")
    p.add_argument("msgfile", nargs="?", default=None,
                   help="a commit message file (as git passes to commit-msg), or the message itself")
    p.add_argument("--message", default=None, help="the commit message as a string")
    p.add_argument("--root", default=".", help="project root that contains .specs/ (default: current dir)")
    p.add_argument("--allow-trailers", action="store_true",
                   help="accept a Co-Authored-By or Made-with trailer the repo asks for")
    args = p.parse_args(argv)

    message = read_message(args)
    if not message.strip():
        print("check_commit: no message provided (pass --message, a file, or pipe via stdin).", file=sys.stderr)
        return 2

    errors, warnings = check(message, args.allow_trailers)
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    if errors:
        print("\ncheck_commit: FAIL - see https://www.conventionalcommits.org/en/v1.0.0/")
        return 1
    print("check_commit: OK")

    loose = untracked(args.root)
    if loose:
        shown = ", ".join(loose[:8]) + (f" and {len(loose) - 8} more" if len(loose) > 8 else "")
        print(f"\nUntracked, in no commit: {shown}. The build ends with a clean tree: commit what belongs "
              "to the work, delete what a tool left behind (browser snapshots, test output), or ignore it.")
    for name, step in next_steps(args.root):
        print(f"\n`{name}`: {step}.")
    return 0


if __name__ == "__main__":
    # Windows writes piped output in the ANSI code page, which cannot encode every character a plan holds.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())

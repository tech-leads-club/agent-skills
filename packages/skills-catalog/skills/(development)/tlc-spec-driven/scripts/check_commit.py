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

What it checks in the message:
  ERROR  - header does not match  type(scope)!: description
  ERROR  - type is not one of the allowed Conventional Commits types
  ERROR  - description is empty, starts uppercase, or ends with a period
  ERROR  - `!` breaking marker present but no `BREAKING CHANGE:` footer
  WARN   - header longer than 72 characters

What it checks in the staged diff, when a feature is in progress (one feature with checks and no
verification.md, or --feature). The task comes from --task, or from the staged tasks.md: the task
whose `Done when` boxes this commit ticks.
  ERROR  - the commit closes more than one task, or closes none and stages a file outside `.specs/`
  ERROR  - a staged file the task's `Files` does not list (`.specs/` aside)
  ERROR  - a `Create:` file not added, a `Modify:` file not changed, or a `Delete:` file not deleted
  ERROR  - a task with tests and no test file changed
  ERROR  - a test file deleted that the task does not list as `Delete:`; a skip or only marker added; a
           suppression added with no issue or link on its line; fewer assertions in a test file than before
  ERROR  - more than 400 changed lines of code (tests, lockfiles, generated and deleted files aside), or a
           file pushed past 1000 lines, with no `**Size**: large - <why>` on the task
  WARN   - more than 200 changed lines of code
  ERROR  - the staged spec.md or tasks.md changed after its approval (approve.py wrote the hash)
  ERROR  - a commit that writes an `**Approved**` or `**Amended**` line and stages a file outside `.specs/`,
           or one that removes an approval HEAD has
  ERROR  - a staged .specs/STATE.md that fails validate_state.py
A Medium feature has no tasks.md: its commits get the diff checks with no task. A commit that stages
only `.specs/` files and closes no task is a plan commit: it gets the approval and STATE.md checks.

After a passing message it prints what still follows the build of each feature under
`<root>/.specs/features/` that has checks and no verification.md: a command's output reaches the
agent after a compaction, where a rule it read hours earlier may not.

Usage:
  python3 <skill-dir>/scripts/check_commit.py [msgfile] [--root DIR] [--feature NAME] [--task Tn]
  python3 <skill-dir>/scripts/check_commit.py --message "feat(auth): add email validation" --task T3
  echo "fix(cart): prevent negative quantity" | python3 <skill-dir>/scripts/check_commit.py

Exit codes: 0 pass, 1 violation, 2 usage error, 3 the same errors twice in a row.
"""

import argparse
import os
import re
import subprocess
import sys

from specs import APPROVED_FILES, approval_errors, finish, read_stamps, read_tasks, spin_guard

CODE_BUDGET_WARN, CODE_BUDGET_MAX, FILE_MAX_LINES = 200, 400, 1000
SIZE_RE = re.compile(r"^large\s+-\s+\S.{2,}", re.IGNORECASE)
TEST_PATH_RE = re.compile(r"(^|/)(tests?|__tests__|specs?|e2e)/|[._-](test|spec)\.\w+$|_test\.\w+$|(^|/)test_[^/]+\.py$")
GENERATED_RE = re.compile(r"(^|/)(dist|build|vendor|node_modules|generated|__generated__)/|\.min\.\w+$|\.snap$|"
                          r"\.lock$|(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|go\.sum|poetry\.lock)$|"
                          r"\.pb\.go$|_pb2\.py$")
SKIP_RE = re.compile(r"\.(skip|only)\s*\(|\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(|@pytest\.mark\.(skip|xfail)|"
                     r"@unittest\.skip|\bt\.Skip(Now|f)?\(|@Disabled\b|@Ignore\b|\bpending\s*\(")
SUPPRESS_RE = re.compile(r"eslint-disable|@ts-ignore|@ts-expect-error|#\s*noqa|#\s*type:\s*ignore|\bnolint\b|"
                         r"@SuppressWarnings|rubocop:disable|biome-ignore|pylint:\s*disable|NOSONAR")
JUSTIFIED_RE = re.compile(r"https?://|#\d+\b|\b[A-Z][A-Z0-9]+-\d+\b")
ASSERT_RE = re.compile(r"\bassert\w*\b|\bexpect\s*\(|\.should\b|\bt\.(Error|Fatal)f?\(|\brequire\.\w+\(|\bassertThat\b")

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


def git(root, *args):
    try:
        out = subprocess.run(["git", *args], cwd=root, capture_output=True, encoding="utf-8", errors="replace",
                             timeout=60)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout if out.returncode == 0 else None


def staged_patch(root):
    """{path: (status, added lines, removed lines, numstat added, numstat removed)} for the staged diff."""
    status = git(root, "diff", "--cached", "--name-status", "--no-renames")
    numstat = git(root, "diff", "--cached", "--numstat", "--no-renames")
    patch = git(root, "diff", "--cached", "-U0", "--no-renames", "--no-color")
    if status is None or numstat is None or patch is None:
        return None
    files = {}
    for ln in status.splitlines():
        parts = ln.split("\t")
        if len(parts) == 2:
            files[parts[1]] = [parts[0][0], [], [], 0, 0]
    for ln in numstat.splitlines():
        parts = ln.split("\t")
        if len(parts) == 3 and parts[2] in files:
            files[parts[2]][3] = int(parts[0]) if parts[0].isdigit() else 0
            files[parts[2]][4] = int(parts[1]) if parts[1].isdigit() else 0
    current = None
    for ln in patch.splitlines():
        m = re.match(r"^diff --git a/(.+) b/(.+)$", ln)
        if m:
            current = files.get(m.group(2))
            continue
        if current is None or ln.startswith(("+++", "---")):
            continue
        if ln.startswith("+"):
            current[1].append(ln[1:])
        elif ln.startswith("-"):
            current[2].append(ln[1:])
    return files


def in_progress(root, feature):
    base = os.path.join(root, ".specs", "features")
    if feature:
        fdir = os.path.join(base, feature)
        return fdir if os.path.isdir(fdir) else None
    names = unverified(root)
    if len(names) > 1:
        print(f"  WARN  {len(names)} features are in progress ({', '.join(names)}) - pass --feature <name>, or the "
              f"diff checks do not run")
    return os.path.join(base, names[0]) if len(names) == 1 else None


def closed_tasks(root, fdir):
    """Tasks whose `Done when` boxes are all ticked in the staged tasks.md and were not at HEAD."""
    rel = os.path.relpath(os.path.join(fdir, "tasks.md"), root).replace(os.sep, "/")
    staged, head = git(root, "show", f":{rel}"), git(root, "show", f"HEAD:{rel}")
    if staged is None:
        return None

    def done(text):
        return {t.id for t in read_tasks(text=text)["tasks"] if t.done}
    return sorted(done(staged) - (done(head) if head else set()), key=lambda x: int(x[1:]))


def line_count(root, ref):
    text = git(root, "show", ref)
    return None if text is None else len(text.splitlines())


def check_approvals(root, fdir, files):
    """The staged spec.md and tasks.md still match their approval, and a new approval or amendment
    travels in a commit of its own, so no change to the plan hides in a code commit."""
    errors, staged, stamp_changed = [], {}, False
    for name in APPROVED_FILES:
        rel = os.path.relpath(os.path.join(fdir, name), root).replace(os.sep, "/")
        text = git(root, "show", f":{rel}")
        if text is None:
            continue
        staged[name] = text
        head = git(root, "show", f"HEAD:{rel}")

        def marks(t):
            return [(x.kind, x.date, x.text, x.hash) for x in read_stamps(t, name)[0]] if t is not None else []
        now, before = marks(text), marks(head)
        if rel in files and now != before:
            stamp_changed = True
        if any(m[0] == "approved" for m in before) and not any(m[0] == "approved" for m in now):
            errors.append(f"this commit removes the approval of {name} - only approve.py replaces it, with the "
                          f"user's words")
    errors += approval_errors(fdir, False, staged, tuple(staged))
    outside = sorted(p for p in files if not p.startswith(".specs/"))
    if stamp_changed and outside:
        errors.append(f"this commit writes an approval or an amendment and stages {', '.join(outside[:3])} - commit "
                      f"the plan change alone, then the code")
    return errors


def check_staged(root, fdir, task_id):
    errors, warnings = [], []
    files = staged_patch(root)
    if files is None:
        return [], ["not a git repository, or nothing staged - the diff checks did not run"]
    errors += check_approvals(root, fdir, files)
    plan_only = all(p.startswith(".specs/") for p in files)
    tasks_path = os.path.join(fdir, "tasks.md")
    task = None
    if os.path.isfile(tasks_path):
        if not task_id:
            closed = closed_tasks(root, fdir)
            if closed is None:
                errors.append("tasks.md is not tracked, so the task cannot be read from this commit - pass --task T<n>")
            elif len(closed) > 1:
                errors.append(f"this commit closes {', '.join(closed)} - one task, one commit")
            elif closed:
                task_id = closed[0]
            elif not plan_only:
                errors.append("this commit ticks no task in tasks.md - tick its `Done when` boxes in the same commit, "
                              "or pass --task T<n>")
        if task_id:
            task = next((t for t in read_tasks(tasks_path)["tasks"] if t.id == task_id), None)
            if not task:
                errors.append(f"{task_id} is not a task in tasks.md")
    size = task.fields.get("size") if task else None
    large = bool(size and SIZE_RE.match(size.value))
    tests_declared = set(task.paths("Test")) if task else set()
    deleted_declared = set(task.paths("Delete")) if task else set()

    def is_test(path):
        return path in tests_declared or bool(TEST_PATH_RE.search(path))

    if task:
        allowed = set(task.paths("Create", "Modify", "Delete", "Test"))
        for path in files:
            if path not in allowed and not path.startswith(".specs/"):
                errors.append(f"{task.id}: `{path}` is staged and the task's Files does not list it - unstage it, or "
                              f"it belongs to another task")
        for kind, path, _ in task.files:
            st = files.get(path, [None])[0]
            if kind == "Create" and st != "A":
                errors.append(f"{task.id}: `Create: {path}` is not added in this commit")
            if kind == "Modify" and st not in ("M", "A"):
                errors.append(f"{task.id}: `Modify: {path}` is not changed in this commit - drop it from Files, or change it")
            if kind == "Delete" and st != "D":
                errors.append(f"{task.id}: `Delete: {path}` is not deleted in this commit")
        kinds = (task.fields["tests"].value.lower() if "tests" in task.fields else "none").replace(",", " ").split()
        if kinds and kinds != ["none"] and not any(is_test(p) for p in files if files[p][0] != "D"):
            errors.append(f"{task.id}: Tests is `{' '.join(kinds)}` and no test file changes in this commit")

    code_lines = 0
    for path, (st, added, removed, n_add, n_del) in sorted(files.items()):
        test = is_test(path)
        if st == "D" and test and path not in deleted_declared:
            errors.append(f"`{path}` is a test file and this commit deletes it - a test leaves only with the claim it "
                          f"proves, as a `Delete:` line of the task")
        for ln in added:
            if test and SKIP_RE.search(ln):
                errors.append(f"`{path}`: a skip or only marker added - `{ln.strip()[:60]}`")
            if SUPPRESS_RE.search(ln) and not JUSTIFIED_RE.search(ln):
                errors.append(f"`{path}`: a suppression added with no issue or link on its line - `{ln.strip()[:60]}`")
        if test and st != "D":
            lost = len([x for x in removed if ASSERT_RE.search(x)]) - len([x for x in added if ASSERT_RE.search(x)])
            if lost > 0:
                errors.append(f"`{path}`: {lost} assertion(s) fewer than at HEAD - a test changes only with the claim it "
                              f"proves; if the criterion changed, the spec changes first")
        if test or st == "D" or path.startswith(".specs/") or GENERATED_RE.search(path):
            continue
        code_lines += n_add + n_del
        if st != "D":
            now, before = line_count(root, f":{path}"), line_count(root, f"HEAD:{path}")
            if now and now > FILE_MAX_LINES and (before or 0) <= FILE_MAX_LINES and not large:
                errors.append(f"`{path}` passes {FILE_MAX_LINES} lines ({now}) in this commit - extract a module, or "
                              f"write `**Size**: large - <why>` on the task")
    if code_lines > CODE_BUDGET_MAX and not large:
        what = f"{task.id}: " if task else ""
        errors.append(f"{what}{code_lines} changed lines of code - over {CODE_BUDGET_MAX}; split the task" +
                      (", or write `**Size**: large - <why>` on it" if task else "; a feature this size owes a tasks.md"))
    elif code_lines > CODE_BUDGET_WARN:
        warnings.append(f"{code_lines} changed lines of code - over {CODE_BUDGET_WARN}")
    if ".specs/STATE.md" in files:
        from validate_state import check_state
        e, _ = check_state(root)
        errors += e
    return errors, warnings


def main(argv=None):
    p = argparse.ArgumentParser(prog="check_commit.py", description="Validate a commit: its message and its diff.")
    p.add_argument("msgfile", nargs="?", default=None,
                   help="a commit message file (as git passes to commit-msg), or the message itself")
    p.add_argument("--message", default=None, help="the commit message as a string")
    p.add_argument("--root", default=".", help="project root that contains .specs/ (default: current dir)")
    p.add_argument("--feature", default=None, help="the feature this commit belongs to")
    p.add_argument("--task", default=None, help="the task this commit closes, T<n>")
    args = p.parse_args(argv)

    message = read_message(args)
    if not message.strip():
        print("check_commit: no message provided (pass a file, --message, or pipe via stdin).", file=sys.stderr)
        return 2

    root = os.path.abspath(args.root)
    errors, warnings = check(message)
    fdir = in_progress(root, args.feature)
    if fdir:
        e, w = check_staged(root, fdir, args.task)
        errors += e
        warnings += w
    if errors:
        code = finish("check_commit", fdir, errors, warnings)
        print("check_commit: FAIL - the message follows https://www.conventionalcommits.org/en/v1.0.0/")
        return code
    for w in warnings:
        print(f"  WARN  {w}")
    print("check_commit: OK")
    if fdir:
        spin_guard("check_commit", fdir, [])
    for name in unverified(args.root):
        print(f"\nAfter the last commit of `{name}` the feature is not done: run check_proofs.py {name}, then "
              f"dispatch the Verifier, and the screens sub-agent when a criterion cites a capture. `{name}` "
              f"is done when validate_verification.py {name} exits 0.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

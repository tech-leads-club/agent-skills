#!/usr/bin/env python3
"""
validate_verification.py - deterministic completion gate for a feature.

A feature is done when check_proofs.py shows every proof green at HEAD and the Verifier's findings
are each closed by a commit. That is prose a long trajectory quietly drops, so this turns it into a
pass/fail run as the closing step. It reads the artifacts, never the target codebase.

What it checks:
  ERROR  - no verification.md, or no proofs.md (run check_proofs.py)
  ERROR  - proofs.md written at another commit than HEAD, or over uncommitted changes
  ERROR  - a check in checks.md with no row in proofs.md, or a row that is not `pass`
  ERROR  - checks.md names `Build:` commands and proofs.md has no Build row, or one that failed
  ERROR  - no `## Checks` table in verification.md, a check with no row in it, or a row with no test
  ERROR  - no `## Findings` section in verification.md, or a finding with no commit in `Closed`
  ERROR  - pictures owed (a criterion cites a capture, or a check is proven in the browser) and no
           screens.md, a row in it that does not read `matches`, a cited capture with no
           `<capture>.running.png`, or a picture at another size than its capture (1x, 2x, 3x pass)
  ERROR  - a browser proof that names no `.running.png`, or one that is not on disk
  ERROR  - a `walk` proof and no `**Walked:**` line in the Handoff
  ERROR  - plan.md with no `**Approved**: <date> - user: "<their words>"` line
  ERROR  - screens.md with no `**Round**:` line or past round 2, no `**HEAD**`, or code changed after
           the HEAD it judged
  WARN   - the report says self-verified (author == verifier: a degraded gate)

Usage:
  python3 <skill-dir>/scripts/validate_verification.py [feature] [--root DIR] [--strict]

  Pass --root when cwd is not the project that contains .specs/.

Exit codes: 0 ok, 1 the feature is not done, 2 usage error.
"""

import argparse
import os
import re
import subprocess
import sys

from lean_config import _section, plan_approved, plan_marks_binding, plan_owes_pictures

PROOF_RE = re.compile(r"^\**\s*Proof\s*\**\s*:\s*(.+)$", re.IGNORECASE)
RUNNING_SUFFIX = ".running.png"
ROUND_RE = re.compile(r"^\**\s*Round\s*\**\s*:\s*\**\s*(\d+)", re.IGNORECASE)
JUDGED_HEAD_RE = re.compile(r"^\**\s*HEAD\s*\**\s*:\s*\**\s*`?([0-9a-f]{7,40})", re.IGNORECASE)
MAX_ROUNDS = 2
BROWSER_PROOF_RE = re.compile(r"^`?browser\b", re.IGNORECASE)
WALK_PROOF_RE = re.compile(r"^`?walk\b", re.IGNORECASE)
WALKED_RE = re.compile(r"^\s*[-*]?\s*\**walked\**\s*:", re.IGNORECASE)
SHOT_RE = re.compile(r"[\w./-]+\.running\.png")
CAPTURE_RE = re.compile(r"`([^`\s]+\.(?:png|jpe?g|webp|gif))`", re.IGNORECASE)


def _feature_dirs(root):
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return base, []
    return base, [d for d in sorted(os.listdir(base)) if os.path.isdir(os.path.join(base, d))]


def split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def is_separator(line):
    return bool(re.match(r"^\s*\|?[\s:|-]+\|?\s*$", line)) and "-" in line


def strip_fences(text):
    """Drop fenced blocks: a report that pasted the template must not be read as data."""
    out, in_fence = [], False
    for ln in text.splitlines():
        if ln.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence:
            out.append(ln)
    return out


def find_tables(lines):
    """Return [(header_cells_lowercased, [data_row_cells, ...]), ...] for every table."""
    tables, buf = [], []
    for ln in lines + [""]:
        stripped = ln.strip()
        if stripped.startswith("|"):
            buf.append(stripped)
            continue
        if buf:
            rows = [split_row(r) for r in buf if not is_separator(r)]
            if len(rows) >= 2:
                tables.append(([c.lower() for c in rows[0]], rows[1:]))
            buf = []
    return tables


def column(header, *names):
    for i, cell in enumerate(header):
        for n in names:
            if n in cell:
                return i
    return None


def _read(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()


def _plan_lines(fdir):
    path = os.path.join(fdir, "plan.md")
    if not os.path.exists(path):
        return []
    return strip_fences(_read(path))


def _image_size(path):
    """(width, height) of a PNG or JPEG file, or None when the header is not one of those."""
    try:
        with open(path, "rb") as f:
            data = f.read(65536)
    except OSError:
        return None
    if data[:8] == b"\x89PNG\r\n\x1a\n" and len(data) >= 24:
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
            i += 2 + int.from_bytes(data[i + 2:i + 4], "big")
    return None


def _same_layout(picture, capture):
    """A picture matches a capture's size at 1x, 2x or 3x - the same layout at another pixel ratio."""
    return any(picture == (capture[0] * k, capture[1] * k) for k in (1, 2, 3))


def _picture_sizes(fdir, root, cited, name):
    """A picture judged against a capture is taken at the capture's size: a wider window lays the
    page out differently, so the judge compares a layout the capture never drew."""
    errors = []
    for cap in cited:
        path = os.path.join(root, cap)
        twin = os.path.splitext(path)[0] + RUNNING_SUFFIX
        c, r = _image_size(path), _image_size(twin)
        if c and r and not _same_layout(r, c):
            errors.append(
                f"{name}: `{os.path.basename(twin)}` is {r[0]}x{r[1]} and its capture is {c[0]}x{c[1]} - take "
                f"the picture at the capture's size"
            )
    return errors


def _screen_evidence(fdir, plan, name):
    """The builder's comparison left files behind: a running screenshot per capture.

    This judges nothing about the screens - the screens sub-agent's `screens.md` does that. It only
    makes "the screen was saved" something a file shows, so a build that skipped the UI cannot pass.
    """
    errors = []
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(fdir))))
    running = set()
    for dirpath, _, files in os.walk(fdir):
        running |= {f for f in files if f.endswith(RUNNING_SUFFIX)}
    if not running:
        errors.append(
            f"{name}: the feature has a screen but no `*{RUNNING_SUFFIX}` sits under the feature folder - "
            f"the builder saves a screenshot of each screen it compared"
        )
    cited = sorted({c for ln in plan for c in CAPTURE_RE.findall(ln) if not c.endswith(RUNNING_SUFFIX)})
    for cap in cited:
        path = os.path.join(root, cap)
        if not os.path.isfile(path):
            continue
        twin = os.path.splitext(os.path.basename(cap))[0] + RUNNING_SUFFIX
        if not os.path.isfile(os.path.splitext(path)[0] + RUNNING_SUFFIX) and twin not in running:
            errors.append(
                f"{name}: the capture `{cap}` has no `{twin}` beside it - the running screen was "
                f"never set next to the picture it has to match"
            )
    errors += _picture_sizes(fdir, root, cited, name)
    errors += _browser_shots(fdir, name, running)
    return errors


def _code_changed_since(root, sha):
    """Paths outside `.specs/` changed between `sha` and HEAD; None when git cannot say."""
    try:
        inside = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], cwd=root,
                                capture_output=True, text=True)
        if inside.returncode != 0:
            return None
        p = subprocess.run(["git", "diff", "--name-only", sha, "HEAD"], cwd=root, capture_output=True, text=True)
    except OSError:
        return None
    if p.returncode != 0:
        return [f"<{sha} is not a commit here>"]
    return [f for f in p.stdout.split() if not f.startswith(".specs/")]


def _screens_verdicts(fdir, name):
    """screens.md is the screens sub-agent's verdict; a PASS cannot stand beside a screen that diverges.

    The verdict holds only for the code it judged: a commit that changes code after the judged HEAD
    is a screen nobody looked at.
    """
    path = os.path.join(fdir, "screens.md")
    tables, lines = [], []
    if os.path.exists(path):
        lines = strip_fences(_read(path))
        tables = [(h, rows) for h, rows in find_tables(lines)
                  if column(h, "verdict") is not None and column(h, "screen") is not None]
    if not tables:
        return [
            f"{name}: the feature has a screen but there is no `screens.md` with a Screens table - each "
            f"picture is judged by a screens sub-agent on controls, arrangement, copy, drawing and render "
            f"(verify-screens.md)"
        ]
    errors = []
    rounds = [int(m.group(1)) for m in (ROUND_RE.match(ln.strip()) for ln in lines) if m]
    if not rounds:
        errors.append(f"{name}: screens.md has no `**Round**:` line - the screens sub-agent writes 1, and 2 on "
                      f"the second and last round, so a resumed run knows which round it is in")
    elif rounds[0] > MAX_ROUNDS:
        errors.append(f"{name}: screens.md reads `**Round**: {rounds[0]}` - there is no third round; what still "
                      f"differs after round 2 goes to the user")
    judged = next((m.group(1) for m in (JUDGED_HEAD_RE.match(ln.strip()) for ln in lines) if m), None)
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(fdir))))
    if not judged:
        errors.append(f"{name}: screens.md names no `**HEAD**` - the screens sub-agent writes the commit it judged")
    else:
        changed = _code_changed_since(root, judged)
        if changed:
            errors.append(
                f"{name}: screens.md judged {judged} and code changed since ({', '.join(changed[:4])}) - the "
                f"screens sub-agent judges again at HEAD in round 2; after round 2 it goes to the user")
    for header, rows in tables:
        verdict_col = column(header, "verdict")
        for r in rows:
            if verdict_col < len(r) and not r[verdict_col].lower().startswith("match"):
                errors.append(
                    f"{name}: PASS but the screen '{r[0][:40]}' reads '{r[verdict_col][:40]}' in screens.md - "
                    f"a missing control, another arrangement, wrong copy or an element drawn differently "
                    f"fails like a red proof"
                )
    return errors


def _walk_logged(checks_lines, name):
    """A `walk` proof's evidence is the author's `**Walked:**` line; with none, nothing was visited."""
    walks = [ln for ln in checks_lines
             if (m := PROOF_RE.match(ln.strip())) and WALK_PROOF_RE.match(m.group(1).strip())]
    if walks and not any(WALKED_RE.match(ln) for ln in _section(checks_lines, "Handoff")):
        return [
            f"{name}: checks.md has a `walk` proof but its `## Handoff` has no `**Walked:**` line - "
            f"the visit the proof names is not on record"
        ]
    return []


def _browser_shots(fdir, name, running):
    """Every browser proof names a screenshot that exists. The screens sub-agent judges that picture."""
    errors = []
    cpath = os.path.join(fdir, "checks.md")
    if not os.path.exists(cpath):
        return errors
    lines = strip_fences(_read(cpath))
    for ln in lines:
        match = PROOF_RE.match(ln.strip())
        if not match or not BROWSER_PROOF_RE.match(match.group(1).strip()):
            continue
        shots = SHOT_RE.findall(match.group(1))
        if not shots:
            errors.append(
                f"{name}: a browser proof names no `.running.png` - the screens sub-agent judges the saved "
                f"picture, and a check with no picture is unproven"
            )
            continue
        for rel in shots:
            saved = os.path.isfile(os.path.join(fdir, rel)) or os.path.basename(rel) in running
            if not saved:
                errors.append(
                    f"{name}: browser proof names `{rel}`, which is not under the feature folder"
                )
    return errors


CHECK_ID_RE = re.compile(r"^\**\s*(C\d+)\s*\**\s*[-–—:]")
SHA_RE = re.compile(r"\b[0-9a-f]{7,40}\b")


def _git_head(root):
    try:
        p = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=root, capture_output=True, text=True)
    except OSError:
        return None
    return p.stdout.strip() if p.returncode == 0 else None


def _check_with_proofs(fdir, name, lines, checks_lines):
    """The report format where check_proofs.py ran the proofs: proofs.md holds the evidence,
    verification.md the Verifier's judgement of each check and its findings, each closed by a commit."""
    errors, warnings = [], []
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(fdir))))
    plines = strip_fences(_read(os.path.join(fdir, "proofs.md")))
    pbody = "\n".join(plines)

    m = re.search(r"\*\*HEAD\*\*\s*:\s*`?([0-9a-f]{4,40})", pbody)
    head = _git_head(root)
    if not m:
        errors.append(f"{name}: proofs.md names no `**HEAD**` - run check_proofs.py again")
    elif head and not (head.startswith(m.group(1)) or m.group(1).startswith(head)):
        errors.append(f"{name}: proofs.md was written at {m.group(1)} and HEAD is {head} - run check_proofs.py again")

    tree = re.search(r"\*\*Tree\*\*\s*:\s*(\S+)", pbody)
    if tree and tree.group(1).lower().startswith("dirty"):
        errors.append(f"{name}: proofs.md ran on uncommitted changes - commit them and run check_proofs.py again")

    ids = {mm.group(1) for mm in (CHECK_ID_RE.match(ln.strip()) for ln in checks_lines) if mm}
    seen = set()
    for header, rows in find_tables(plines):
        result, check = column(header, "result"), column(header, "check")
        if result is not None and check is not None:
            for r in rows:
                if check < len(r):
                    seen.add(r[check])
                if result < len(r) and not r[result].lower().startswith("pass"):
                    errors.append(f"{name}: proofs.md - {r[check]} reads '{r[result][:40]}'")
    for cid in sorted(ids - seen, key=lambda c: int(c[1:])):
        errors.append(f"{name}: proofs.md has no row for {cid} - run check_proofs.py again")
    build = next((ln.strip() for ln in checks_lines if re.match(r"^\**\s*Build\s*\**\s*:", ln.strip(), re.IGNORECASE)), "")
    if build and "none" not in build.lower()[:15] and "Build" not in seen:
        errors.append(f"{name}: checks.md names `Build:` commands and proofs.md has no Build row - run check_proofs.py again")

    judged = {}
    for header, rows in find_tables(_section(lines, "Checks")):
        check, test = column(header, "check"), column(header, "test")
        if check is None or test is None:
            continue
        for r in rows:
            if check < len(r):
                judged[r[check].strip("*` ")] = r[test].strip() if test < len(r) else ""
    if ids and not judged:
        errors.append(f"{name}: verification.md has no `## Checks` table - the Verifier opens the test each check's "
                      f"proof selects and writes whether it holds the criterion")
    elif judged:
        for cid in sorted(ids, key=lambda c: int(c[1:])):
            if cid not in judged:
                errors.append(f"{name}: verification.md `## Checks` has no row for {cid} - judge its test against "
                              f"the criterion")
            elif judged[cid] in ("", "-"):
                errors.append(f"{name}: verification.md `## Checks` row {cid} names no test - write the test the "
                              f"proof selects, file and name")

    findings = _section(lines, "Findings")
    if not findings:
        errors.append(f"{name}: verification.md has no `## Findings` section (write `None - <why>` when empty)")
    for header, rows in find_tables(findings):
        closed = column(header, "closed")
        for r in rows:
            if closed is None or closed >= len(r) or not SHA_RE.search(r[closed]):
                errors.append(f"{name}: finding '{r[0][:50]}' is not closed - fix it and write the commit in `Closed`")
    return errors, warnings


def _check_feature(fdir, name):
    errors, warnings = [], []
    if not os.path.exists(os.path.join(fdir, "verification.md")):
        errors.append(
            f"{name}: no verification.md - the feature is not done until a fresh Verifier "
            f"(author != verifier) writes its findings over <feature base>..HEAD"
        )
    if not os.path.exists(os.path.join(fdir, "proofs.md")):
        errors.append(f"{name}: no proofs.md - run check_proofs.py <feature> at HEAD")
    if errors:
        return errors, warnings

    lines = strip_fences(_read(os.path.join(fdir, "verification.md")))
    cpath = os.path.join(fdir, "checks.md")
    checks_lines = strip_fences(_read(cpath)) if os.path.exists(cpath) else []
    errors, warnings = _check_with_proofs(fdir, name, lines, checks_lines)
    if "self-verified" in "\n".join(lines).lower():
        warnings.append(f"{name}: verification.md says self-verified - author == verifier, a degraded gate")
    plan = _plan_lines(fdir)
    if plan and not plan_approved(plan):
        errors.append(f"{name}: plan.md has no `**Approved**: <YYYY-MM-DD> - user: \"<their words>\"` line - the "
                      f"plan is approved by the user, in their words, before the checks")
    if plan_owes_pictures(plan, checks_lines):
        errors += _screens_verdicts(fdir, name)
        errors += _screen_evidence(fdir, plan, name)
    errors += _walk_logged(checks_lines, name)
    return errors, warnings


def _appears_complete(fdir):
    if os.path.exists(os.path.join(fdir, "verification.md")):
        return True
    checks = os.path.join(fdir, "checks.md")
    if not os.path.exists(checks):
        return False
    body = _read(checks)
    if not re.search(r"^\**\s*C\d+\s*\**\s*[-–—:]", body, re.MULTILINE):
        return False
    if re.search(r"^\s*-\s*\[\s\]", body, re.MULTILINE):
        return False
    return True


def _resolve(root, feature):
    base, dirs = _feature_dirs(root)
    # An explicit argument is answered on its own terms: "that feature is not here" beats
    # "there is no features directory", which is true but not what was asked.
    if feature:
        fdir = feature if os.path.isdir(feature) else os.path.join(base, feature)
        if not os.path.isdir(fdir):
            print(f"validate_verification: feature not found: {feature}", file=sys.stderr)
            raise SystemExit(2)
        return [(fdir, os.path.basename(fdir.rstrip("/")))]
    if not os.path.isdir(base):
        print(f"validate_verification: no {base} directory - nothing to check.")
        return []
    if len(dirs) == 1:
        return [(os.path.join(base, dirs[0]), dirs[0])]
    if not dirs:
        print("validate_verification: no features under .specs/features/ - nothing to check.")
        return []
    picked = [(os.path.join(base, d), d) for d in dirs if _appears_complete(os.path.join(base, d))]
    if not picked:
        print("validate_verification: no completed feature detected (all in progress) - nothing to gate.")
    return picked


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="validate_verification.py",
        description="Completion gate: a done feature needs a real PASS report its own rows do not contradict.",
    )
    p.add_argument("feature", nargs="?", default=None, help="Feature dir or name")
    p.add_argument("--root", default=".", help="Project root containing .specs/ (default: current dir)")
    p.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    p.add_argument("--allow-empty", action="store_true",
                   help="Exit 0 when there is no completed feature to gate (repo-wide sweeps)")
    args = p.parse_args(argv)
    root = os.path.abspath(args.root)

    targets = _resolve(root, args.feature)
    if not targets and not args.allow_empty:
        # Gating nothing is not a pass. This is the completion gate for a feature that was just
        # built, so an empty run means the report could not be found - which reads as green to
        # anything checking only the exit code. Exit 2 says "could not gate", like the other
        # validators do, and leaves 0 to mean a report was read and held up.
        print(
            "validate_verification: gated nothing - this is NOT a pass. Point it at the feature "
            "(validate_verification.py <feature> --root <project>), or pass --allow-empty if you "
            "meant to sweep a repo that has no completed feature yet.",
            file=sys.stderr,
        )
        return 2

    all_errors, all_warnings = [], []
    for fdir, name in targets:
        e, w = _check_feature(fdir, name)
        all_errors += e
        all_warnings += w

    for w in all_warnings:
        print(f"  WARN  {w}")
    for e in all_errors:
        print(f"  ERROR {e}")
    checked = ", ".join(name for _, name in targets) or "(none)"
    fail = all_errors or (all_warnings and args.strict)
    print(f"\nvalidate_verification: {len(all_errors)} error(s), {len(all_warnings)} warning(s) across [{checked}]")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())

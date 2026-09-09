#!/usr/bin/env python3
"""
validate_verification.py - deterministic completion gate for a feature.

The skill's strongest invariant is "a feature is done when an independent Verifier's
report accounts for every check." That is prose the model has to remember, and prose
is what a long trajectory quietly drops. This turns it into a checkable pass/fail run
as the closing step, so declaring a feature done without a real report fails loudly.

It does NOT merely check that verification.md exists. A report that exists but holds
the template placeholder, cites no evidence, or records a surviving mutant next to a
PASS verdict would sail through a shallow existence check while proving nothing. The
gate reads the report's own tables and refuses a verdict its rows contradict.

Pure standard library, zero dependencies. Operates only on the .specs/ markdown
artifacts, so it stays stack-agnostic.

What it checks:
  ERROR  - no verification.md (Verify is the closing step of the flow, not an option)
  ERROR  - the verdict is FAIL, missing, or still the '[PASS | FAIL]' placeholder
  ERROR  - PASS with no file:line evidence anywhere (evidence-or-zero)
  ERROR  - profile standard/ui with no fault rows, or with no recomputed Coverage section
  ERROR  - PASS while a fault row says the mutant survived
  ERROR  - PASS while a Coverage row leaves a member Unproven
  ERROR  - PASS while a binding source leaves an element Uncovered
  ERROR  - PASS while a check row's Result is not PASS
  ERROR  - PASS while a Test policy row's expectation is not met
  ERROR  - the report's profile does not match the one checks.md was approved under
  ERROR  - profile ui, but the report carries no binding-sources section (step 1 vanished)
  ERROR  - profile standard/ui with Test policy rows in checks.md, but no verdicts in the report
  WARN   - the report says self-verified (author == verifier: degraded gate)
  WARN   - no `Profile:` line, so a skipped step cannot be told from a forgotten one
  WARN   - no `Round:` line

Usage:
  python3 <skill-dir>/scripts/validate_verification.py [feature] [--root DIR] [--strict]

  Invoke from the skill directory that ships this script (not the project root).
  Pass --root when cwd is not the project that contains .specs/.

Exit codes: 0 ok, 1 the feature is not done, 2 usage error.
"""

import argparse
import os
import re
import sys

EVIDENCE_RE = re.compile(r"[\w./-]+\.[A-Za-z0-9]+:\d+")
PROFILE_RE = re.compile(r"^\**Profile\**\s*:\s*`?(\w+)`?", re.IGNORECASE | re.MULTILINE)
EMPTY_CELL = {"", "-", "—", "–", "none", "n/a", "na", "nothing"}
SURVIVED_RE = re.compile(r"\b(no|survived|alive|not killed)\b", re.IGNORECASE)
UNMET_RE = re.compile(r"\b(no|not met|unmet|fail|failed|gap)\b", re.IGNORECASE)


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


def has_heading(lines, *names):
    for ln in lines:
        s = ln.strip()
        for n in names:
            if re.match(r"^#{1,4}\s+" + re.escape(n) + r"\b", s, re.IGNORECASE):
                return True
    return False


def _profile(text):
    m = PROFILE_RE.search(text)
    return m.group(1).lower() if m else None


def _checks_context(fdir):
    """What checks.md was approved under: (profile, has a Test policy section)."""
    path = os.path.join(fdir, "checks.md")
    if not os.path.exists(path):
        return None, False
    body = open(path, encoding="utf-8", errors="replace").read()
    lines = strip_fences(body)
    return _profile("\n".join(lines)), has_heading(lines, "Test policy")


def _verdict(lines):
    """Return 'pass', 'fail', 'unfilled', or None."""
    candidates = [
        ln for ln in lines
        if re.search(r"^\**verdict\**\s*:", ln.strip(), re.IGNORECASE)
        or re.search(r"^#{1,4}\s*verification\b", ln.strip(), re.IGNORECASE)
    ]
    hay = " ".join(candidates) if candidates else "\n".join(lines)
    has_pass = re.search(r"\bPASS\b", hay) is not None
    has_fail = re.search(r"\bFAIL\b", hay) is not None
    if has_pass and has_fail:
        return "unfilled"
    if has_pass:
        return "pass"
    if has_fail:
        return "fail"
    return None


def _check_feature(fdir, name):
    errors, warnings = [], []
    vpath = os.path.join(fdir, "verification.md")
    if not os.path.exists(vpath):
        errors.append(
            f"{name}: no verification.md - the feature is not done until a fresh Verifier "
            f"(author != verifier) writes it over <feature base>..HEAD with every check"
        )
        return errors, warnings

    text = open(vpath, encoding="utf-8", errors="replace").read()
    lines = strip_fences(text)
    body = "\n".join(lines)

    verdict = _verdict(lines)
    if verdict is None:
        errors.append(f"{name}: no PASS/FAIL verdict (a prose-only report does not count)")
    elif verdict == "unfilled":
        errors.append(f"{name}: verdict is still the template placeholder '[PASS | FAIL]'")
    elif verdict == "fail":
        errors.append(f"{name}: verdict is FAIL - route the ranked gaps back as fixes, then re-verify")

    # The profile decides which steps run, so a report that quietly declares a cheaper one
    # than the feature was approved under makes an entire step disappear without a trace.
    report_profile = _profile(body)
    approved_profile, policy_rows_exist = _checks_context(fdir)
    if report_profile is None:
        warnings.append(f"{name}: no `Profile:` line - a step that did not run is indistinguishable from one forgotten")
    elif approved_profile and report_profile != approved_profile:
        errors.append(
            f"{name}: report says profile '{report_profile}' but checks.md was approved under "
            f"'{approved_profile}' - the profile decides which steps run, so a mismatch silently drops one"
        )
    effective = approved_profile or report_profile
    if not re.search(r"^\**round\**\s*:", body, re.IGNORECASE | re.MULTILINE):
        warnings.append(f"{name}: no `Round:` line - a scoped re-verification must say what was carried forward")
    if re.search(r"self[- ]verified", body, re.IGNORECASE):
        warnings.append(
            f"{name}: report is self-verified (author == verifier) - a degraded gate, "
            f"since a self-check reproduces the author's own blind spot"
        )

    if verdict != "pass":
        return errors, warnings

    if not EVIDENCE_RE.search(body):
        errors.append(f"{name}: PASS but cites no file:line evidence - evidence-or-zero not satisfied")

    # A profile-scoped step that produced no section did not run. Requiring the section is what
    # makes "skipped" distinguishable from "forgotten" - otherwise that is only a sentence.
    if effective in ("standard", "ui") and not has_heading(lines, "Coverage"):
        errors.append(
            f"{name}: profile is {effective} but there is no `## Coverage` section - the join has to "
            f"be recomputed from the authority over each set, not read back from the author's table"
        )
    if effective == "ui" and not has_heading(lines, "Binding sources", "Binding source"):
        errors.append(
            f"{name}: profile is ui but there is no `## Binding sources` section - step 1 is the "
            f"only step that can catch a check contradicting the design, and no later step can"
        )
    if effective in ("standard", "ui") and policy_rows_exist and not has_heading(lines, "Test policy"):
        errors.append(
            f"{name}: checks.md carries Test policy rows but the report gives no verdict on them - "
            f"those rows are the bar the author built under, so an unmet one is a finding"
        )

    tables = find_tables(lines)
    saw_faults = False

    for header, rows in tables:
        killed = column(header, "killed")
        if killed is not None:
            saw_faults = True
            for r in rows:
                if killed >= len(r):
                    continue
                cell = r[killed]
                if cell.lower() in EMPTY_CELL and cell.lower() != "no":
                    continue
                if SURVIVED_RE.match(cell) or "survived" in cell.lower():
                    errors.append(
                        f"{name}: PASS but a mutant survived ({r[0][:50]}) - the assertion would "
                        f"pass under a plausible wrong implementation"
                    )

        unproven = column(header, "unproven")
        if unproven is not None:
            for r in rows:
                if unproven < len(r) and r[unproven].lower() not in EMPTY_CELL:
                    errors.append(f"{name}: PASS but Coverage leaves '{r[unproven][:50]}' unproven ({r[0][:40]})")

        uncovered = column(header, "uncovered")
        if uncovered is not None:
            for r in rows:
                if uncovered < len(r) and r[uncovered].lower() not in EMPTY_CELL:
                    errors.append(
                        f"{name}: PASS but a binding source leaves '{r[uncovered][:50]}' uncovered ({r[0][:40]})"
                    )

        result = column(header, "result")
        if result is not None and column(header, "check", "claim") is not None:
            for r in rows:
                if result < len(r) and r[result] and "pass" not in r[result].lower():
                    errors.append(f"{name}: PASS but check {r[0][:20]} reports '{r[result][:30]}'")

        met = column(header, "expectation met", "met")
        if met is not None:
            for r in rows:
                if met < len(r) and r[met] and UNMET_RE.search(r[met]):
                    errors.append(
                        f"{name}: PASS but a Test policy row is unmet ({r[0][:40]}: '{r[met][:40]}') "
                        f"- the rows priced work the checks do not name"
                    )

    # Fault injection is profile-scoped (standard, ui), like tlc-implement. Under `light` a
    # report with no fault rows is correct, and the profile line is what says so.
    if effective in ("standard", "ui") and not saw_faults:
        errors.append(
            f"{name}: profile is {effective} but there are no fault rows - a green suite proves the "
            f"tests execute, only a killed mutant proves they can fail"
        )

    return errors, warnings


def _appears_complete(fdir):
    if os.path.exists(os.path.join(fdir, "verification.md")):
        return True
    checks = os.path.join(fdir, "checks.md")
    if not os.path.exists(checks):
        return False
    body = open(checks, encoding="utf-8", errors="replace").read()
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

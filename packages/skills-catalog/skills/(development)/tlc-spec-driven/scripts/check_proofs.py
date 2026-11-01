#!/usr/bin/env python3
"""
check_proofs.py - run every proof checks.md names, as the project runs it, and write proofs.md.

The mechanical half of verification: did each named test run, and pass, at HEAD; do the build,
type check and lint on checks.md's `Build:` line pass; does each screen check have its picture and
a `matches` row in screens.md; is each walk logged. A model doing this by hand spends most of the
Verifier's time on it and gets it less right than a script, so the Verifier reads proofs.md and
spends its time on judgement.

It knows no test runner. A proof is the project's own command, run as written:

  Run unit: `npx vitest run src/billing --reporter=verbose`   one command, run once
  Proof: run unit | ✓ failed charge suspends                  the line the run must print
  Proof: `bin/rails test test/billing/dunning_test.rb`         run alone, judged by its exit code

A `run` proof passes when every word after `|` appears, in that order, on one line of the run's
output. The words carry the runner's pass marker, so a filter that selects nothing, or a test that
was renamed, reads `no test ran` instead of a green exit code. Commands run one at a time, each
once, with no timeout: a run's own parallelism is whatever the project configured for it. On
Windows they run in Git for Windows' bash, because proofs are written for a POSIX shell.

Usage:
  python3 <skill-dir>/scripts/check_proofs.py <feature> [--root DIR]

Writes .specs/features/<feature>/proofs.md. Exit 0 every proof passed on a clean tree, 1 otherwise,
2 usage error.
"""

import argparse
import os
import re
import shutil
import subprocess
import sys

from lean_config import RUN_PROOF_RE, RUN_RE, checks_file
from specs import spin_guard, stop_text

CHECK_RE = re.compile(r"^\**\s*(C\d+)\s*\**\s*[-–—:]\s*(.+)$")
PROOF_RE = re.compile(r"^\**\s*Proof\s*\**\s*:\s*(.+)$", re.IGNORECASE)
BUILD_RE = re.compile(r"^\**\s*Build\s*\**\s*:\s*(.+)$", re.IGNORECASE)
PICTURE_RE = re.compile(r"`?([\w./-]+\.running\.png)`?")
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")
TAIL = 15


def _unquote(text):
    return text.strip().strip("`").strip()


def read_checks(path):
    """(checks [(id, [proof])], runs {name: command}, build commands, walked) outside fenced blocks."""
    checks, runs, build, walked = [], {}, None, False
    current, in_fence = None, False
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()
    for raw in lines:
        line = raw.strip()
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        walked = walked or "**Walked:**" in line
        m = CHECK_RE.match(line)
        if m:
            current = (m.group(1), [])
            checks.append(current)
            continue
        r = RUN_RE.match(line)
        if r:
            runs[r.group(1)] = _unquote(r.group(2))
            continue
        b = BUILD_RE.match(line)
        if b and build is None:
            text = b.group(1).strip()
            build = [] if text.lower().startswith("none") else [_unquote(c) for c in text.split(";") if _unquote(c)]
            continue
        p = PROOF_RE.match(line)
        if p and current:
            current[1].append(_unquote(p.group(1)))
    return checks, runs, build or [], walked


def find_bash():
    """Git for Windows' bash.exe, or None. The `bash` on PATH may be WSL's launcher, which runs the
    proof inside Linux against other paths, so the one beside git comes first."""
    try:
        p = subprocess.run(["git", "--exec-path"], capture_output=True, encoding="utf-8", errors="replace")
        if p.returncode == 0:
            # <git>/mingw64/libexec/git-core -> <git>/bin/bash.exe
            bash = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(p.stdout.strip()))), "bin", "bash.exe")
            if os.path.isfile(bash):
                return bash
    except OSError:
        pass
    bash = shutil.which("bash")
    if bash and "\\system32\\" not in bash.lower() and "windowsapps" not in bash.lower():
        return bash
    return None


def shell_of():
    """(bash path or None, label for proofs.md). POSIX keeps /bin/sh; Windows prefers Git Bash."""
    if os.name != "nt":
        return None, "/bin/sh"
    bash = find_bash()
    if bash:
        return bash, bash
    print("check_proofs: WARN - no Git for Windows bash found; proofs run in cmd.exe, which does not "
          "read POSIX shell syntax", file=sys.stderr)
    return None, "cmd.exe (no Git Bash found)"


def run(root, cmd, bash):
    """(exit code, output with ANSI codes stripped)."""
    argv = [bash, "-c", cmd] if bash else cmd
    p = subprocess.run(argv, shell=bash is None, cwd=root, capture_output=True, encoding="utf-8", errors="replace")
    return p.returncode, ANSI_RE.sub("", p.stdout + p.stderr)


def sees(output, expected):
    """Every word of `expected` on one line of `output`, in order, anything between them."""
    words = expected.split()
    if not words:
        return False
    rx = re.compile(".*?".join(re.escape(w) for w in words))
    return any(rx.search(line) for line in output.splitlines())


def screens_verdicts(fdir):
    path = os.path.join(fdir, "screens.md")
    rows = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
        for line in lines:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 3 and ".running.png" in cells[0]:
                rows[os.path.basename(cells[0].strip("`"))] = cells[2].lower()
    return rows


def dirty_paths(root):
    """Uncommitted paths outside .specs/: the proofs ran on the working tree, not on HEAD."""
    p = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True)
    if p.returncode != 0:
        return []
    return [ln[3:] for ln in p.stdout.splitlines() if ln[3:] and not ln[3:].startswith(".specs/")]


def git_head(root):
    p = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=root, capture_output=True, text=True)
    return p.stdout.strip() if p.returncode == 0 else "unknown"


def tail(output):
    # a fence inside the output would close the block proofs.md puts it in
    return [ln.replace("```", "'''") for ln in output.strip().splitlines()[-TAIL:]] or ["(no output)"]


def cell(text, width=110):
    return text.replace("|", "/").replace("`", "")[:width]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("feature")
    ap.add_argument("--root", default=".")
    a = ap.parse_args(argv)
    root = os.path.abspath(a.root)
    fdir = os.path.join(root, ".specs", "features", a.feature)
    checks_path = checks_file(fdir)
    if not os.path.exists(checks_path):
        print(f"check_proofs: no checks.md (or tasks.md) under {fdir}", file=sys.stderr)
        return 2
    checks, runs, build, walked = read_checks(checks_path)
    screens = screens_verdicts(fdir)
    bash, shell_label = shell_of()

    used_runs, lone = [], []
    for _, proofs in checks:
        for proof in proofs:
            m = RUN_PROOF_RE.match(proof)
            if m and m.group(1) in runs and m.group(1) not in used_runs:
                used_runs.append(m.group(1))
            elif not m and proof and not proof.lower().startswith(("browser", "walk")) and proof not in lone:
                lone.append(proof)
    results = {}  # command -> (exit code, output)
    for name in used_runs:
        results.setdefault(runs[name], run(root, runs[name], bash))
    for proof in lone:
        results.setdefault(proof, run(root, proof, bash))

    rows = []
    for cid, proofs in checks:
        for proof in proofs or [""]:
            low = proof.lower()
            m = RUN_PROOF_RE.match(proof)
            result = "pass"
            if not proof:
                result, proof = "**no proof**", "(none)"
            elif low.startswith("browser"):
                pic = PICTURE_RE.search(proof)
                pic = os.path.basename(pic.group(1)) if pic else None
                on_disk = pic and any(pic in fs for _, _, fs in os.walk(fdir))
                verdict = screens.get(pic or "", "")
                if not on_disk:
                    result = "**no picture**"
                elif not verdict.startswith("matches"):
                    result = f"**{verdict or 'not judged'}** (screens.md)"
            elif low.startswith("walk"):
                result = "pass (Walked)" if walked else "**no Walked line**"
            elif m:
                if m.group(1) not in runs:
                    result = f"**no such run** - no `Run {m.group(1)}:` line"
                else:
                    code, output = results[runs[m.group(1)]]
                    if not sees(output, _unquote(m.group(2))):
                        result = "**fail**" if code else "**no test ran**"
            elif results[proof][0]:
                result = "**fail**"
            rows.append((cid, proof, result))

    for name in used_runs:
        code, _ = results[runs[name]]
        if code:
            rows.append((f"Run {name}", runs[name], f"**fail** - exit {code}"))
    for cmd in build:
        code, output = run(root, cmd, bash)
        lines = output.strip().splitlines()
        error = next((ln for ln in lines if "error" in ln.lower()), lines[-1] if lines else "")
        rows.append(("Build", cmd, "pass" if code == 0 else f"**fail** - {cell(error.strip(), 100)}"))
    failed = sum(1 for _, _, res in rows if not res.startswith("pass"))

    dirty = dirty_paths(root)
    out = [f"# {a.feature} proofs", "",
           f"**HEAD**: {git_head(root)}",
           f"**Tree**: {'clean' if not dirty else 'dirty - ' + ', '.join(dirty[:5])}",
           f"**Shell**: {shell_label}",
           f"**Result**: {len(rows) - failed} pass, {failed} fail", "",
           "| Check | Proof | Result |", "| --- | --- | --- |"]
    out += [f"| {c} | `{cell(p)}` | {res} |" for c, p, res in rows]
    if results:
        out += ["", "## Output", ""]
        for name in used_runs:
            code, output = results[runs[name]]
            out += [f"`Run {name}` - exit {code}", "", "```", *tail(output), "```", ""]
        for proof in lone:
            code, output = results[proof]
            out += [f"`{cell(proof)}` - exit {code}", "", "```", *tail(output), "```", ""]
    with open(os.path.join(fdir, "proofs.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(out).rstrip() + "\n")
    print("\n".join(out[2:6]))
    red = [f"{c}: {res} - {p[:80]}" for c, p, res in rows if not res.startswith("pass")]
    for line in red:
        print(f"  {line}")
    if spin_guard("check_proofs", fdir, red + (["dirty tree"] if dirty else [])):
        print(stop_text("check_proofs"))
        return 3
    return 0 if failed == 0 and not dirty else 1


if __name__ == "__main__":
    sys.exit(main())

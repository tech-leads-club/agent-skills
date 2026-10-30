#!/usr/bin/env python3
"""
check_proofs.py - run every proof checks.md names, once per runner, and write proofs.md.

The mechanical half of verification: did each named test run, and pass, at HEAD; do the build,
type check and lint on checks.md's `Build:` line pass; does each screen check have its picture and
a `matches` row in screens.md; is each walk logged; are the mutations killed. A model doing this by hand spends most of the Verifier's time on it and gets it less
right than a script, so the Verifier reads proofs.md and spends its time on judgement.

Test proofs are grouped by runner and working directory and run in one invocation per group with
a per-test report (runners.py: bun, vitest, jest, pytest, go), then each check is matched to the
test cases its filter selects. A runner no adapter knows runs proof by proof and is judged by its
exit code, with the count read from its summary when it prints one (`count unknown` otherwise).

Usage:
  python3 <skill-dir>/scripts/check_proofs.py <feature> [--root DIR] [--mutations FILE]

  --mutations  a mutate.py spec; each mutation is injected and its proof run (mutate.py)

Writes .specs/features/<feature>/proofs.md. Exit 0 every proof passed and every mutation was
killed, 1 otherwise, 2 usage error.
"""

import argparse
import json
import os
import re
import subprocess
import sys

import runners

HERE = os.path.dirname(os.path.abspath(__file__))
CHECK_RE = re.compile(r"^\**\s*(C\d+)\s*\**\s*[-–—:]\s*(.+)$")
PROOF_RE = re.compile(r"^\**\s*Proof\s*\**\s*:\s*(.+)$", re.IGNORECASE)
PICTURE_RE = re.compile(r"`?([\w./-]+\.running\.png)`?")
COUNT_RES = [  # tests that ran, read from a runner's own summary when it has no JUnit report
    re.compile(r"Ran (\d+) tests?"),
    re.compile(r"(\d+) passed"),
    re.compile(r"Tests:\s+(?:\d+ \w+, )*(\d+) passed"),
    re.compile(r"(\d+) runs?,"),
]


BUILD_RE = re.compile(r"^\**\s*Build\s*\**\s*:\s*(.+)$", re.IGNORECASE)


def build_commands(path):
    """The commands on checks.md's `Build:` line, or [] for `none`."""
    for raw in open(path, encoding="utf-8"):
        m = BUILD_RE.match(raw.strip())
        if m:
            text = m.group(1).strip()
            if text.lower().startswith("none"):
                return []
            return [c.strip().strip("`").strip() for c in text.split(";") if c.strip().strip("`").strip()]
    return []


def checks_of(path):
    """[(check id, [proof text])] in file order."""
    checks, current = [], None
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        m = CHECK_RE.match(line)
        if m:
            current = (m.group(1), [])
            checks.append(current)
            continue
        p = PROOF_RE.match(line)
        if p and current:
            current[1].append(p.group(1).strip().strip("`").strip())
    return checks


def run_alone(root, cmd):
    """A proof the script cannot group: run it, judge by exit code, read a count when it can."""
    p = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, encoding="utf-8", errors="replace")
    text = p.stdout + p.stderr
    count = None
    for rx in COUNT_RES:
        m = rx.search(text)
        if m:
            count = int(m.group(1))
            break
    return p.returncode, count


def screens_verdicts(fdir):
    path = os.path.join(fdir, "screens.md")
    rows = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
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


def spec_size(spec):
    try:
        with open(spec, encoding="utf-8") as f:
            return len(json.load(f))
    except (OSError, ValueError, TypeError):
        return 0


def run_mutations(root, spec):
    """Inject each mutation with mutate.py: [(label, proof, killed)].

    A run that prints fewer rows than the spec has mutations gets a failed row of its own. The exit
    code cannot tell: a traceback exits 1, the same as a surviving mutation, and with no rows at all
    the report would read as nothing left to kill."""
    p = subprocess.run([sys.executable, os.path.join(HERE, "mutate.py"), "--root", root, "--spec", spec],
                       cwd=root, capture_output=True, encoding="utf-8", errors="replace")
    rows = []
    for line in (p.stdout + p.stderr).splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if (len(cells) >= 3 and cells[-1].lower() in ("yes", "yes (timeout)", "no", "blocked")
                and cells[0].lower() != "mutation"):
            rows.append((cells[0], cells[1], cells[-1].lower()))
    output = (p.stdout + p.stderr).strip().splitlines()
    last = (output[-1] if output else "no output").replace("|", "/")[:80]
    if p.returncode == 2:
        rows.append(("spec refused", last, "no"))
    elif len(rows) < max(spec_size(spec), 1):
        rows.append((f"mutate.py failed (exit {p.returncode})", last, "no"))
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("feature")
    ap.add_argument("--root", default=".")
    ap.add_argument("--mutations")
    a = ap.parse_args(argv)
    root = os.path.abspath(a.root)
    fdir = os.path.join(root, ".specs", "features", a.feature)
    checks_path = os.path.join(fdir, "checks.md")
    if not os.path.exists(checks_path):
        print(f"check_proofs: no checks.md under {fdir}", file=sys.stderr)
        return 2
    checks = checks_of(checks_path)
    walked = any("**Walked:**" in ln for ln in open(checks_path, encoding="utf-8"))
    screens = screens_verdicts(fdir)

    groups, plan = {}, []
    for cid, proofs in checks:
        for proof in proofs or [""]:
            low = proof.lower()
            if low.startswith("browser"):
                plan.append((cid, proof, "browser", None))
            elif low.startswith("walk"):
                plan.append((cid, proof, "walk", None))
            elif not proof:
                plan.append((cid, "(none)", "none", None))
            else:
                adapter, parsed = runners.parse(proof)
                if adapter:
                    group = groups.setdefault(parsed["key"], (adapter, parsed, set()))
                    group[2].update(parsed["files"])
                plan.append((cid, proof, "grouped" if adapter else "alone", (adapter, parsed)))

    cases = {key: adapter.run(root, first["key"][1], first["launcher"], files)
             for key, (adapter, first, files) in groups.items()}
    rows, failed = [], 0
    for cid, proof, kind, grouped in plan:
        ran, passed, result = "-", "-", "pass"
        if kind == "none":
            result = "**no proof**"
        elif kind == "browser":
            m = PICTURE_RE.search(proof)
            pic = os.path.basename(m.group(1)) if m else None
            on_disk = pic and any(pic in fs for _, _, fs in os.walk(fdir))
            verdict = screens.get(pic or "", "")
            if not on_disk:
                result = "**no picture**"
            elif not verdict.startswith("matches"):
                result = f"**{verdict or 'not judged'}** (screens.md)"
        elif kind == "walk":
            result = "pass (Walked)" if walked else "**no Walked line**"
        elif kind == "grouped" and cases.get(grouped[1]["key"]) is not None:
            picked = grouped[0].select(cases[grouped[1]["key"]], grouped[1])
            ran, passed = len(picked), sum(picked)
            if not picked:
                result = "**no test ran**"
            elif passed < ran:
                result = "**fail**"
        else:
            code, count = run_alone(root, proof)
            ran = count if count is not None else "count unknown"
            if code != 0:
                result = "**fail**"
            elif count == 0:
                result = "**no test ran**"
        if not result.startswith("pass"):
            failed += 1
        rows.append((cid, proof, ran, passed, result))

    for cmd in build_commands(checks_path):
        p = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, encoding="utf-8", errors="replace")
        tail = (p.stdout + p.stderr).strip().splitlines()
        error = next((ln for ln in tail if "error" in ln.lower()), tail[-1] if tail else "")
        result = "pass" if p.returncode == 0 else f"**fail** - {error.strip().replace('|', '/')[:100]}"
        if p.returncode != 0:
            failed += 1
        rows.append(("Build", cmd, "-", "-", result))

    mutations = run_mutations(root, os.path.abspath(a.mutations)) if a.mutations else []
    survived = sum(1 for _, _, k in mutations if not k.startswith("yes"))

    dirty = dirty_paths(root)
    out = [f"# {a.feature} proofs", "",
           f"**HEAD**: {git_head(root)}",
           f"**Tree**: {'clean' if not dirty else 'dirty - ' + ', '.join(dirty[:5])}",
           f"**Result**: {len(rows) - failed} pass, {failed} fail; mutations {len(mutations) - survived} killed, "
           f"{survived} not", "",
           "| Check | Proof | Ran | Passed | Result |", "| --- | --- | --- | --- | --- |"]
    out += [f"| {c} | `{p.replace('`', '')[:110]}` | {r} | {s} | {res} |" for c, p, r, s, res in rows]
    if a.mutations:
        out += ["", "## Mutations", "", "| Mutation | Location | Killed |", "| --- | --- | --- |"]
        out += [f"| {lab} | `{pr.replace('`', '')}` | {k} |" for lab, pr, k in mutations]
    with open(os.path.join(fdir, "proofs.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print("\n".join(out[2:5]))
    for c, p, r, s, res in rows:
        if not res.startswith("pass"):
            print(f"  {c}: {res} - {p[:80]}")
    for lab, pr, k in mutations:
        if not k.startswith("yes"):
            print(f"  mutation not killed: {lab}")
    return 0 if failed == 0 and survived == 0 and not dirty else 1


if __name__ == "__main__":
    sys.exit(main())

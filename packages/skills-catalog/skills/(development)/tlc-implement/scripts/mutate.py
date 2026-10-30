#!/usr/bin/env python3
"""
mutate.py - inject behaviour-level mutations in place, run the covering proof, restore.

Mutation testing is the only step that shows a test can fail. Running it in a scratch worktree
looks safer, but a fresh checkout rarely boots the way the real tree does - credentials,
databases, generated files, installed dependencies - and the Verifier then spends its budget
making the scratch run instead of injecting mutations. Worse, a scratch that cannot boot fails
every proof, which reads as every mutant killed.

So this mutates the real tree, which already runs the proofs, and makes restoring it the
script's job rather than the agent's:

  - the original bytes of every target file go to a journal inside the git dir BEFORE the
    file is touched, so an interrupted run is undone by the next invocation (or --recover)
  - SIGINT / SIGTERM / SIGHUP (where the platform has it) restore before exiting
  - each file is compared byte-for-byte with its original after restoring
  - each distinct proof runs once UNMUTATED first; a proof that is not green there marks its
    mutations `blocked`, never `yes`, because a proof that cannot pass cannot kill anything

Stack-agnostic: it knows git and a shell command, nothing else. Pure standard library.

Spec (JSON, a file path or `-` for stdin), one object per mutation:

  [{"file": "app/billing/subscription.rb",
    "old": "\"suspended\"", "new": "\"cancelled\"",
    "proof": "bin/rails test test/billing/dunning_test.rb -n /failed_charge_suspends/",
    "label": "returned status suspended -> cancelled"}]

`old` must occur exactly once in `file`; `label` is optional (defaults to old -> new).

Prints the `## Mutations injected` table rows, ready to paste into verification.md.

Usage:
  python3 <skill-dir>/scripts/mutate.py --spec mutations.json [--root DIR] [--timeout 900]
  python3 <skill-dir>/scripts/mutate.py --recover [--root DIR]

Exit codes: 0 every mutation killed, 1 a mutation survived or was blocked, 2 usage or invalid spec,
3 a file could not be restored (STOP: the tree is not what it was).
"""

import argparse
import base64
import hashlib
import json
import os
import signal
import subprocess
import sys
import time

JOURNAL = "tlc-mutation-journal.json"
KILL_GRACE = 10
RUNNING = []


def git(root, *args):
    p = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit(f"mutate: git {' '.join(args)} failed: {p.stderr.strip()}")
    return p.stdout


def journal_path(root):
    return os.path.join(git(root, "rev-parse", "--absolute-git-dir").strip(), JOURNAL)


def read_bytes(path):
    with open(path, "rb") as f:
        return f.read()


def write_bytes(path, data):
    """Write and move the mtime strictly forward: a same-size edit inside the same second is
    otherwise invisible to caches keyed on (mtime, size) - Python bytecode, bootsnap, and others
    - and the proof would run the code it ran before the mutation."""
    before = os.stat(path).st_mtime if os.path.exists(path) else 0
    with open(path, "wb") as f:
        f.write(data)
    stamp = max(time.time(), before + 2)
    os.utime(path, (stamp, stamp))


def recover(root):
    """Restore whatever an interrupted run left mutated. Returns the files restored."""
    jpath = journal_path(root)
    if not os.path.exists(jpath):
        return []
    with open(jpath, encoding="utf-8") as f:
        entries = json.load(f)
    for rel, b64 in entries.items():
        write_bytes(os.path.join(root, rel), base64.b64decode(b64))
    os.remove(jpath)
    return sorted(entries)


def cell(text):
    return text.replace("|", "\\|").replace("\n", " ").strip()


def short(text, n=40):
    one = " ".join(text.split())
    return one if len(one) <= n else one[: n - 1] + "…"


def run_proof(cmd, root, timeout):
    """Return (exit code or 'timeout', combined output). Kills the whole process tree on timeout."""
    proc = subprocess.Popen(cmd, shell=True, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            encoding="utf-8", errors="replace", start_new_session=True)
    RUNNING.append(proc)
    try:
        out, _ = proc.communicate(timeout=timeout)
        return proc.returncode, out
    except subprocess.TimeoutExpired:
        kill_group(proc)
        try:
            out, _ = proc.communicate(timeout=KILL_GRACE)
        except subprocess.TimeoutExpired:
            print(f"mutate: WARN - a process the proof started still holds its output {KILL_GRACE} s after "
                  "the kill; moving on without it", file=sys.stderr)
            out = ""
        return "timeout", out or ""
    finally:
        RUNNING.remove(proc)


def kill_group(proc):
    if os.name == "nt":
        # Windows has no process groups to signal; taskkill /T ends the shell and every process under it
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        if proc.poll() is None:
            proc.kill()
        return
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def load_spec(path, root):
    try:
        if path == "-":
            raw = sys.stdin.read()
        else:
            with open(path, encoding="utf-8") as f:
                raw = f.read()
        mutations = json.loads(raw)
    except (OSError, ValueError) as e:
        raise SystemExit(f"mutate: cannot read spec: {e}")
    if not isinstance(mutations, list) or not mutations:
        raise SystemExit("mutate: the spec must be a non-empty JSON list of mutations")
    problems = []
    for i, f in enumerate(mutations, 1):
        missing = [k for k in ("file", "old", "new", "proof") if not isinstance(f.get(k), str) or not f.get(k)]
        if missing:
            problems.append(f"mutation {i}: missing {', '.join(missing)}")
            continue
        path = os.path.realpath(os.path.join(root, f["file"]))
        if not path.startswith(os.path.realpath(root) + os.sep) or not os.path.isfile(path):
            problems.append(f"mutation {i}: {f['file']} is not a file inside {root}")
            continue
        text = read_bytes(path).decode("utf-8", errors="surrogateescape")
        hits = text.count(f["old"])
        if hits != 1:
            problems.append(f"mutation {i}: `{short(f['old'])}` occurs {hits} times in {f['file']} - it must occur exactly once")
            continue
        if f["old"] == f["new"]:
            problems.append(f"mutation {i}: old and new are identical - the mutation changes nothing")
            continue
        f["_path"] = path
        f["_line"] = text[: text.index(f["old"])].count("\n") + 1
    if problems:
        raise SystemExit("mutate: invalid spec, nothing was mutated\n  " + "\n  ".join(problems))
    return mutations


def main(argv=None):
    p = argparse.ArgumentParser(prog="mutate.py", description="In-place mutation testing with guaranteed restore.")
    p.add_argument("--spec", help="JSON list of mutations, or - for stdin")
    p.add_argument("--root", default=None, help="Repository root (default: git toplevel of cwd)")
    p.add_argument("--timeout", type=int, default=900, help="Seconds per proof run (default 900)")
    p.add_argument("--tail", type=int, default=20, help="Output lines shown for a blocked proof")
    p.add_argument("--recover", action="store_true", help="Only restore an interrupted run, then exit")
    args = p.parse_args(argv)
    # labels quote source code, which a Windows console code page cannot always encode
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    try:
        root = os.path.realpath(args.root or git(".", "rev-parse", "--show-toplevel").strip())
        restored = recover(root)
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 2
    if restored:
        print(f"mutate: restored {len(restored)} file(s) left by an interrupted run: {', '.join(restored)}")
    if args.recover:
        return 0
    if not args.spec:
        print("mutate: --spec is required (or --recover)", file=sys.stderr)
        return 2

    try:
        mutations = load_spec(args.spec, root)
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 2

    jpath = journal_path(root)
    porcelain_before = git(root, "status", "--porcelain")
    originals = {f["_path"]: read_bytes(f["_path"]) for f in mutations}

    def drop_journal():
        if os.path.exists(jpath):
            os.remove(jpath)

    def restore_all(*_):
        for path, data in originals.items():
            write_bytes(path, data)
        drop_journal()

    def on_signal(signum, _frame):
        for proc in list(RUNNING):
            kill_group(proc)
        restore_all()
        print(f"\nmutate: interrupted by signal {signum} - tree restored", file=sys.stderr)
        raise SystemExit(130)

    for name in ("SIGINT", "SIGTERM", "SIGHUP"):
        if hasattr(signal, name):  # Windows has no SIGHUP
            signal.signal(getattr(signal, name), on_signal)

    baseline = {}
    for proof in dict.fromkeys(f["proof"] for f in mutations):
        code, out = run_proof(proof, root, args.timeout)
        baseline[proof] = code == 0
        if code != 0:
            tail = "\n".join(out.rstrip().splitlines()[-args.tail:])
            print(f"mutate: BLOCKED - proof is not green unmutated (exit {code}): {proof}\n{tail}\n", file=sys.stderr)

    results = []
    try:
        for f in mutations:
            label = f.get("label") or f"`{short(f['old'])}` -> `{short(f['new'])}`"
            location = f"`{os.path.relpath(f['_path'], root)}:{f['_line']}`"
            if not baseline[f["proof"]]:
                results.append((label, location, "blocked"))
                continue
            rel = os.path.relpath(f["_path"], root)
            with open(jpath, "w", encoding="utf-8") as j:
                json.dump({rel: base64.b64encode(originals[f["_path"]]).decode()}, j)
            text = originals[f["_path"]].decode("utf-8", errors="surrogateescape")
            write_bytes(f["_path"], text.replace(f["old"], f["new"], 1).encode("utf-8", errors="surrogateescape"))
            try:
                code, _ = run_proof(f["proof"], root, args.timeout)
            finally:
                write_bytes(f["_path"], originals[f["_path"]])
                drop_journal()
            killed = "yes (timeout)" if code == "timeout" else ("yes" if code != 0 else "no")
            results.append((label, location, killed))
    finally:
        restore_all()

    dirty = [os.path.relpath(path, root) for path, data in originals.items()
             if hashlib.sha256(read_bytes(path)).digest() != hashlib.sha256(data).digest()]
    if dirty:
        print(f"mutate: STOP - not restored byte-for-byte: {', '.join(dirty)}", file=sys.stderr)
        return 3

    print("| Mutation | Location | Killed |")
    print("| --- | --- | --- |")
    for label, location, killed in results:
        print(f"| {cell(label)} | {location} | {killed} |")

    porcelain_after = git(root, "status", "--porcelain")
    if porcelain_after != porcelain_before:
        print("\nmutate: WARN - `git status --porcelain` changed while the proofs ran. The mutated files "
              "were restored byte-for-byte, so this came from the proofs themselves:", file=sys.stderr)
        before = set(porcelain_before.splitlines())
        for line in porcelain_after.splitlines():
            if line not in before:
                print(f"  {line}", file=sys.stderr)

    n_killed = sum(1 for r in results if r[2].startswith("yes"))
    n_survived = sum(1 for r in results if r[2] == "no")
    n_blocked = sum(1 for r in results if r[2] == "blocked")
    print(f"\nmutate: {n_killed} killed, {n_survived} survived, {n_blocked} blocked")
    return 0 if n_killed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())

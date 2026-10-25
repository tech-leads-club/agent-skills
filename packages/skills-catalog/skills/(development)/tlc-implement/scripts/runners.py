"""
runners.py - test runners check_proofs.py can group: one invocation per runner and directory with
a per-test report, then each proof matched to the tests its filter selects.

Each adapter knows three things about one runner: how to read a proof written for it (`parse`),
how to run a group of those proofs once with a machine-readable report (`run`), and which reported
tests one proof selects (`select`). A proof no adapter reads runs alone and is judged by its exit
code, so any runner works; these only make the common ones fast and exact.

Adding a runner is one more class in ADAPTERS. Pure standard library.
"""

import json
import os
import re
import shlex
import subprocess
import tempfile
import xml.etree.ElementTree as ET

CD_RE = r"^(?:cd\s+(?P<cd>\S+)\s*&&\s*)?"


def _split(text):
    try:
        return shlex.split(text)
    except ValueError:
        return None


def _flag_value(args, flags):
    """(value of the first of `flags`, remaining args)."""
    rest, value, i = [], None, 0
    while i < len(args):
        a = args[i]
        hit = next((f for f in flags if a == f or a.startswith(f + "=")), None)
        if hit:
            if a == hit and i + 1 < len(args):
                value, i = args[i + 1], i + 2
                continue
            value = a.split("=", 1)[1]
        else:
            rest.append(a)
        i += 1
    return value, rest


def _regex(pattern):
    if not pattern:
        return None
    try:
        return re.compile(pattern)
    except re.error:
        return re.compile(re.escape(pattern))


def _in_files(case_file, files):
    """A case belongs to a proof that names its file or a folder above it (all, when it names none)."""
    if not files:
        return True
    f = "/" + case_file.replace("\\", "/").lstrip("./")
    for x in files:
        x = x.replace("\\", "/").lstrip("./").rstrip("/")
        if not x or f.endswith("/" + x) or ("/" + x + "/") in f or x.endswith(f.lstrip("/")):
            return True
    return False


def _junit(path):
    """[(file, full name, name, passed)] from a JUnit XML report."""
    cases = []
    for case in ET.parse(path).iter("testcase"):
        failed = case.find("failure") is not None or case.find("error") is not None
        name, cls = case.get("name", ""), case.get("classname", "")
        cases.append((case.get("file", "") or cls, f"{cls} {name}".strip(), name, not failed))
    return cases


class Bun:
    name = "bun"
    rx = re.compile(CD_RE + r"bun\s+(?:--cwd[= ](?P<cwd>\S+)\s+)?test\b(?P<args>.*)$")

    def parse(self, cmd):
        m = self.rx.match(cmd)
        args = _split(m.group("args")) if m else None
        if args is None:
            return None
        pattern, rest = _flag_value(args, ("-t", "--test-name-pattern"))
        return {"key": (self.name, m.group("cd") or m.group("cwd") or "."), "launcher": "bun",
                "files": [a for a in rest if not a.startswith("-")], "filter": pattern}

    def run(self, root, cwd, launcher, files):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "junit.xml")
            subprocess.run(["bun", "test", *sorted(files), "--reporter=junit", f"--reporter-outfile={out}"],
                           cwd=os.path.join(root, cwd), capture_output=True, text=True)
            return _junit(out) if os.path.exists(out) else None

    def select(self, cases, proof):
        rx = _regex(proof["filter"])
        return [ok for f, full, name, ok in cases
                if _in_files(f, proof["files"]) and (not rx or rx.search(full) or rx.search(name))]


class Vitest(Bun):
    name = "vitest"
    rx = re.compile(CD_RE + r"(?P<launcher>(?:npx|bunx|pnpm exec|yarn)\s+)?vitest(?:\s+run)?\b(?P<args>.*)$")

    def parse(self, cmd):
        m = self.rx.match(cmd)
        args = _split(m.group("args")) if m else None
        if args is None:
            return None
        pattern, rest = _flag_value(args, ("-t", "--testNamePattern"))
        launcher = (m.group("launcher") or "").strip()
        return {"key": (self.name, m.group("cd") or ".", launcher), "launcher": launcher,
                "files": [a for a in rest if not a.startswith("-")], "filter": pattern}

    def run(self, root, cwd, launcher, files):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "junit.xml")
            cmd = [*launcher.split(), "vitest", "run", *sorted(files), "--reporter=junit", f"--outputFile={out}"]
            subprocess.run(cmd, cwd=os.path.join(root, cwd), capture_output=True, text=True)
            if not os.path.exists(out):
                return None
            # vitest joins describe and test with " > "; its -t matches them joined by a space
            return [(f, full.replace(" > ", " "), name.replace(" > ", " "), ok) for f, full, name, ok in _junit(out)]


class Jest(Bun):
    name = "jest"
    rx = re.compile(CD_RE + r"(?P<launcher>(?:npx|bunx|pnpm exec|yarn)\s+)?jest\b(?P<args>.*)$")

    def parse(self, cmd):
        m = self.rx.match(cmd)
        args = _split(m.group("args")) if m else None
        if args is None:
            return None
        pattern, rest = _flag_value(args, ("-t", "--testNamePattern"))
        launcher = (m.group("launcher") or "").strip()
        return {"key": (self.name, m.group("cd") or ".", launcher), "launcher": launcher,
                "files": [a for a in rest if not a.startswith("-")], "filter": pattern}

    def run(self, root, cwd, launcher, files):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "report.json")
            cmd = [*launcher.split(), "jest", *sorted(files), "--json", f"--outputFile={out}"]
            subprocess.run(cmd, cwd=os.path.join(root, cwd), capture_output=True, text=True)
            if not os.path.exists(out):
                return None
            cases = []
            for suite in json.load(open(out)).get("testResults", []):
                for a in suite.get("assertionResults", []):
                    cases.append((suite.get("name", ""), a.get("fullName", ""), a.get("title", ""),
                                  a.get("status") == "passed"))
            return cases


class Pytest:
    name = "pytest"
    rx = re.compile(CD_RE + r"(?P<launcher>(?:(?:uv|poetry|pipenv|hatch)\s+run\s+)?(?:\S*python3?\s+-m\s+)?\S*pytest)\b(?P<args>.*)$")

    def parse(self, cmd):
        m = self.rx.match(cmd)
        args = _split(m.group("args")) if m else None
        if args is None:
            return None
        expr, rest = _flag_value(args, ("-k",))
        targets = [a for a in rest if not a.startswith("-")]
        return {"key": (self.name, m.group("cd") or ".", m.group("launcher")), "launcher": m.group("launcher"),
                "files": [t.split("::")[0] for t in targets], "targets": targets, "filter": expr}

    def run(self, root, cwd, launcher, files):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "junit.xml")
            cmd = [*launcher.split(), *sorted(files), f"--junitxml={out}", "-q"]
            subprocess.run(cmd, cwd=os.path.join(root, cwd), capture_output=True, text=True)
            return _junit(out) if os.path.exists(out) else None

    @staticmethod
    def _module(path):
        return path[:-3].replace("/", ".").lstrip(".") if path.endswith(".py") else path.replace("/", ".")

    @staticmethod
    def _keyword(expr, words):
        """pytest's -k: names joined by and / or / not, matched as case-insensitive substrings."""
        tokens = re.findall(r"\(|\)|[^\s()]+", expr)
        out = []
        for t in tokens:
            if t in ("(", ")", "and", "or", "not"):
                out.append(t)
            else:
                out.append(str(any(t.lower() in w.lower() for w in words)))
        try:
            return bool(eval(" ".join(out), {"__builtins__": {}}, {}))  # only True/False/and/or/not/()
        except Exception:
            return False

    def select(self, cases, proof):
        picked = []
        for f, full, name, ok in cases:
            cls = full[: -len(name)].strip() if full.endswith(name) else full
            hit = False
            for target in proof["targets"] or [""]:
                parts = target.split("::")
                module = self._module(parts[0]) if parts[0] else ""
                if module and not (cls == module or cls.startswith(module + ".") or cls.endswith("." + module.split(".")[-1])
                                   or cls.split(".")[0] == module.split(".")[-1]):
                    continue
                if len(parts) >= 2 and parts[-1].split("[")[0] != name.split("[")[0]:
                    continue
                if len(parts) == 3 and not cls.endswith(parts[1]):
                    continue
                hit = True
            if hit and (not proof["filter"] or self._keyword(proof["filter"], [name, cls])):
                picked.append(ok)
        return picked


class GoTest:
    name = "go"
    rx = re.compile(CD_RE + r"go\s+test\b(?P<args>.*)$")

    def parse(self, cmd):
        m = self.rx.match(cmd)
        args = _split(m.group("args")) if m else None
        if args is None:
            return None
        pattern, rest = _flag_value(args, ("-run", "--run"))
        pkgs = [a for a in rest if not a.startswith("-")] or ["./..."]
        return {"key": (self.name, m.group("cd") or ".", "go"), "launcher": "go", "files": pkgs, "filter": pattern}

    def run(self, root, cwd, launcher, pkgs):
        p = subprocess.run(["go", "test", "-json", *sorted(pkgs)], cwd=os.path.join(root, cwd),
                           capture_output=True, text=True)
        cases = []
        for line in p.stdout.splitlines():
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            if ev.get("Test") and ev.get("Action") in ("pass", "fail"):
                cases.append((ev.get("Package", ""), ev["Test"], ev["Test"], ev["Action"] == "pass"))
        return cases or None

    def select(self, cases, proof):
        rx = _regex(proof["filter"])
        return [ok for pkg, full, name, ok in cases if not rx or rx.search(name)]


ADAPTERS = [Bun(), Vitest(), Jest(), Pytest(), GoTest()]


def parse(cmd):
    """(adapter, parsed proof) for the first adapter that reads `cmd`, or (None, None)."""
    for adapter in ADAPTERS:
        parsed = adapter.parse(cmd)
        if parsed:
            return adapter, parsed
    return None, None

#!/usr/bin/env python3
"""
validate_tasks.py - the gate tasks.md passes before it is shown, and again before the first task.

It reads tasks.md, spec.md, design.md and review.md through specs.py. A task is one test cycle: the
code it creates or changes, the tests that prove it, one commit. Its size is declared here and
measured again on each commit by check_commit.py.

What it checks:
  ERROR  - a required section is missing, or tasks.md does not follow the grammar in specs.py
  ERROR  - phases not numbered 1, 2, 3 in order, or tasks not numbered T1, T2, T3 in order
  ERROR  - a task without What, Files, Depends on, Requirement, Tests, Gate or Done when; a Tests value
           other than unit, integration, e2e or none; a Gate level the Gate Check Commands table lacks
  ERROR  - a task that creates or changes no code (a test-only task is the closing e2e task alone)
  ERROR  - more than 3 code files in a task, with no `**Size**: large - <why>`
  ERROR  - a task with tests and no `Test:` file, or no tests where its layer requires them
  ERROR  - a code file that matches no layer of the Test Coverage Matrix
  ERROR  - a file listed twice in one task
  ERROR  - in an open task, a `Modify:` or `Delete:` file that is neither on disk nor created by an earlier
           task, or a `Create:` file that is on disk or created by an earlier task
  ERROR  - a design `**Location**:` no task builds: `(new)` with no `Create:`, `(existing)` with no file
  ERROR  - a dependency on a task that does not come before it
  ERROR  - a Requirement ID the spec does not have, or a criterion no task names
  ERROR  - a check that cites no criterion ID, or a criterion with no check
  ERROR  - a shrink word in a task (for now, placeholder, TODO, temporary, por enquanto, ...)
  ERROR  - a phase over 10 tasks, or a feature over 21 tasks with no `**Size**: large - <why>` in the header
  ERROR  - a check with no `Proof:`, a `run` proof with no `Run` line or no expected line, no `Build:` line
  ERROR  - the scope owes a design.md and there is none; or the plan review is missing, dispatched,
           or has a finding open, contested with nothing the reviewer could read, escalated without
           the user's words, or with a `Where` that does not start with spec.md, context.md or design.md
  ERROR  - spec.md or tasks.md changed after its approval (the hash approve.py wrote no longer matches)
  WARN   - `**Reviewed**: not run - <why>` (a degraded gate), or a `Run` line no proof reads
  ERROR  - with --execute: spec.md or tasks.md not approved with approve.py, open questions in the spec,
           or a `Build:` command red before the first task

A Medium feature has no tasks.md: with --execute this checks the spec's `## Checks` instead.

Usage:
  python3 <skill-dir>/scripts/validate_tasks.py [feature] [--root DIR] [--strict] [--execute]

Exit codes: 0 pass, 1 errors (or warnings under --strict), 2 usage error, 3 the same errors twice in a row.
"""

import argparse
import fnmatch
import os
import re
import sys

from lean_config import RUN_PROOF_RE, read_runs
from specs import (SHRINK_RE, USER_WORDS_RE, Doc, approval_errors, covers, design_locations, feature_dir,
                   finish, has_open_questions, norm, read_checks, read_spec, read_tasks, without_code)

REQUIRED_SECTIONS = ["Test Coverage Matrix", "Gate Check Commands", "Tasks", "Checks", "Handoff"]
REQUIRED_FIELDS = ["what", "files", "depends on", "requirement", "tests", "gate", "done when"]
TEST_KINDS = ("none", "unit", "integration", "e2e")
MAX_CODE_FILES = 3
MAX_PHASE_TASKS = 10
MAX_FEATURE_TASKS = 21
SIZE_RE = re.compile(r"^large\s+-\s+\S.{2,}", re.IGNORECASE)
BUILD_RE = re.compile(r"^\**\s*Build\s*\**\s*:\s*(.+)$", re.IGNORECASE)
RESOLUTION_RE = re.compile(r"^(fixed|contested|escalated)\s+-\s+(\S.*)$", re.IGNORECASE)
READABLE_REF_RE = re.compile(r"[\w./@-]+\.\w{1,8}(?::\d+)?|#{2,4}\s*\S")
PLAN_FILES = ("spec.md", "context.md", "design.md")


def check_proofs_owed(lines):
    """Each check names the proof that settles it; `run` proofs read a `Run` line; a `Build:` line exists."""
    errors, warnings = [], []
    stripped = [ln.strip() for ln in lines]
    doc = Doc(text="\n".join(lines))
    checks = read_checks(doc)
    runs, read = read_runs(stripped), set()
    for c in checks:
        if not c.proofs:
            errors.append(f"{c.id}: no `Proof:` line - name the test command whose filter selects the test that settles it")
        for text in c.proofs:
            text = text.strip("`").strip()
            rm = RUN_PROOF_RE.match(text) or re.match(r"^run\s+([\w-]+)\s*$", text, re.IGNORECASE)
            if not rm:
                continue
            read.add(rm.group(1))
            if rm.group(1) not in runs:
                errors.append(f"{c.id}: proof reads `run {rm.group(1)}` and no `Run {rm.group(1)}: <command>` line defines it")
            if rm.re is not RUN_PROOF_RE or not rm.group(2).strip("`").strip():
                errors.append(f"{c.id}: `run {rm.group(1)}` names no line after `|` - write the line the run prints "
                              f"when this test passes, pass marker included")
    for name in runs:
        if name not in read:
            warnings.append(f"`Run {name}` is read by no proof - point a check at it or drop it")
    if not any(BUILD_RE.match(ln) for ln in stripped):
        errors.append("no `Build:` line - name the repo's build, type check and lint commands, `;`-separated "
                      "(or `Build: none - <why>`); check_proofs.py runs them")
    return checks, errors, warnings


def check_coverage(criteria, checks, where, errors):
    """Every check cites a criterion the spec has, and every criterion has a check."""
    ids = {c.id for c in criteria}
    cited = set()
    for c in checks:
        if not c.cites:
            errors.append(f"{where} {c.id}: cites no criterion - end the claim with its IDs, `(AUTH-01)`")
        for cid in c.cites:
            if cid not in ids:
                errors.append(f"{where} {c.id}: cites {cid}, and the spec has no criterion with that ID")
            cited.add(cid)
    for c in criteria:
        if c.id not in cited:
            errors.append(f"{c.id} has no check - one check per criterion, with the proof that settles it")


def read_matrix(doc, errors):
    """[(layer, [globs], kind)] from the Test Coverage Matrix, and {level} from Gate Check Commands."""
    layers, levels = [], set()
    body = doc.section("Test Coverage Matrix")
    tables = doc.tables(*body) if body else []
    if body and not tables:
        errors.append("`## Test Coverage Matrix` has no table - `| Layer | Paths | Tests |`")
    for t in tables[:1]:
        errors += [f"tasks.md {e}" for e in t.errors]
        layer, paths, kind = t.key("layer"), t.key("paths"), t.key("tests")
        if not (layer and paths and kind):
            errors.append(f"tasks.md L{t.line}: the matrix columns are `Layer`, `Paths` (globs in backticks) and `Tests`")
            continue
        for n, r in t.rows:
            globs = re.findall(r"`([^`]+)`", r[paths])
            value = norm(r[kind])
            if not globs:
                errors.append(f"tasks.md L{n}: layer `{r[layer]}` names no path glob - `src/**/*.service.ts`")
            if value not in TEST_KINDS:
                errors.append(f"tasks.md L{n}: layer `{r[layer]}` Tests is `{r[kind]}` - one of {', '.join(TEST_KINDS)}")
            layers.append((r[layer], globs, value))
    body = doc.section("Gate Check Commands")
    for t in (doc.tables(*body) if body else [])[:1]:
        col = t.key("level")
        if not col:
            errors.append(f"tasks.md L{t.line}: the Gate Check Commands columns are `Level` and `Command`")
            continue
        levels = {norm(r[col]) for _, r in t.rows}
    return layers, levels


def layer_of(path, layers):
    """The layers whose globs match the path. `**/` also matches no folder at all."""
    def hit(g):
        return fnmatch.fnmatchcase(path, g) or fnmatch.fnmatchcase(path, g.replace("**/", ""))
    return [(name, kind) for name, globs, kind in layers if any(hit(g) for g in globs)]


def check_tasks(model, criteria, root, errors):
    doc, phases, tasks = model["doc"], model["phases"], model["tasks"]
    layers, levels = read_matrix(doc, errors)
    for want, (num, title, members) in enumerate(phases, 1):
        if num != want:
            errors.append(f"tasks.md: `Phase {num}: {title}` - phases are numbered 1, 2, 3 in order")
        if len(members) > MAX_PHASE_TASKS:
            errors.append(f"tasks.md: Phase {num} has {len(members)} tasks - over {MAX_PHASE_TASKS}, split it at a "
                          f"real dependency seam")
    header = doc.field(0, doc.section("Tasks")[0] if doc.section("Tasks") else len(doc.lines), "Size")
    if len(tasks) > MAX_FEATURE_TASKS and not (header and SIZE_RE.match(header.value)):
        errors.append(f"tasks.md: {len(tasks)} tasks - over {MAX_FEATURE_TASKS}; split the feature, or write "
                      f"`**Size**: large - <why>` under the title")

    spec_ids, named = {c.id for c in criteria}, set()
    made, gone = {}, set()
    for want, t in enumerate(tasks, 1):
        at = f"tasks.md L{t.line} {t.id}"
        if t.num != want:
            errors.append(f"{at}: tasks are numbered T1, T2, T3 in order - this one should be T{want}")
        for name in REQUIRED_FIELDS:
            if name not in t.fields:
                errors.append(f"{at}: no `**{name.title()}**:` field")
        kinds = [norm(k) for k in re.split(r"[,+/ ]+", t.fields["tests"].value) if k] if "tests" in t.fields else []
        for k in kinds:
            if k not in TEST_KINDS:
                errors.append(f"{at}: Tests `{k}` - one or more of {', '.join(TEST_KINDS)}")
        gate = norm(t.fields["gate"].value) if "gate" in t.fields else ""
        if "gate" in t.fields and levels and gate not in levels:
            errors.append(f"{at}: Gate `{gate}` is not a level in `## Gate Check Commands`")
        size = t.fields.get("size")
        large = bool(size and SIZE_RE.match(size.value))
        if size and not large:
            errors.append(f"{at}: Size is `large - <why>` or absent")

        code, tests = t.paths("Create", "Modify"), t.paths("Test")
        if "files" in t.fields and not t.files:
            errors.append(f"{at}: Files lists nothing - `- Create: \\`path\\``, `- Modify: \\`path\\``, "
                          f"`- Delete: \\`path\\``, `- Test: \\`path\\``")
        seen = set()
        for kind, path, n in t.files:
            if path in seen:
                errors.append(f"tasks.md L{n}: `{path}` is listed twice in {t.id} - one line per file")
            seen.add(path)
        if t.files and not code and not t.paths("Delete"):
            last_e2e = t is tasks[-1] and "e2e" in kinds
            if not last_e2e:
                errors.append(f"{at}: creates or changes no code - a test belongs to the task whose code it proves; "
                              f"the closing e2e task is the one test-only task")
        if len(code) > MAX_CODE_FILES and not large:
            errors.append(f"{at}: {len(code)} code files - over {MAX_CODE_FILES}; split it where a reviewer could reject "
                          f"one part and keep the other, or write `**Size**: large - <why>`")
        if kinds and kinds != ["none"] and not tests:
            errors.append(f"{at}: Tests `{', '.join(kinds)}` and no `Test:` file - name the test file it adds or changes")
        if layers:
            for path in code:
                found = layer_of(path, layers)
                if not found:
                    errors.append(f"{at}: `{path}` matches no layer in the Test Coverage Matrix - add its layer and glob")
                for layer, kind in found:
                    if kind != "none" and kind not in kinds:
                        errors.append(f"{at}: `{path}` is in layer `{layer}`, which requires {kind} tests, and Tests is "
                                      f"`{', '.join(kinds) or 'empty'}`")
        if not t.done:
            follow_files(t, root, made, gone, errors)
        for dep in t.deps:
            if dep not in {x.id for x in tasks[:want - 1]}:
                errors.append(f"{at}: depends on {dep}, which does not come before it")
        if "requirement" in t.fields and not t.reqs:
            errors.append(f"{at}: Requirement names no criterion ID - a task with no criterion is setup; fold it into "
                          f"the first task that needs it")
        for rid in t.reqs:
            if rid not in spec_ids:
                errors.append(f"{at}: Requirement {rid} is not a criterion in the spec")
            named.add(rid)
        text = " ".join([t.title, t.fields["what"].value if "what" in t.fields else ""] +
                        [x for x, _ in (t.fields["done when"].items if "done when" in t.fields else [])])
        for m in SHRINK_RE.finditer(without_code(text)):
            errors.append(f"{at}: `{m.group(1)}` - a task ships whole; what it leaves out is another task")
    for c in criteria:
        if c.id not in named:
            errors.append(f"{c.id} is in no task's Requirement")


def follow_files(t, root, made, gone, errors):
    """Walk an open task's files in plan order. A file is there when it is on disk and no earlier task
    deletes it, or when an earlier task creates it. `made` maps a path to the task that creates it."""
    for kind, path, n in t.files:
        there = (os.path.exists(os.path.join(root, path)) and path not in gone) or path in made
        if kind in ("Modify", "Delete") and not there:
            errors.append(f"tasks.md L{n}: `{kind}: {path}` is not on disk and no earlier task creates it - "
                          f"`Create:` it, or cite the real path")
        if kind == "Create" and there:
            who = f"{made[path]} creates it" if path in made else "it is already on disk"
            errors.append(f"tasks.md L{n}: `Create: {path}` - {who}; `Modify:` it, or name a new file")
        if kind == "Create":
            made[path] = t.id
            gone.discard(path)
        elif kind == "Delete":
            made.pop(path, None)
            gone.add(path)


def check_design_coverage(fdir, tasks, errors):
    """Each component the design places is built by a task: a `(new)` location by a `Create:`, an
    `(existing)` one by any file a task lists. A component no task touches is reuse, not a component."""
    path = os.path.join(fdir, "design.md")
    if not os.path.isfile(path):
        return
    created = [p for t in tasks for p in t.paths("Create")]
    touched = [p for t in tasks for p in t.paths("Create", "Modify", "Delete")]
    for line, mark, spans in design_locations(Doc(path)):
        for loc in spans:
            if mark == "new" and not any(covers(loc, p) for p in created):
                errors.append(f"design.md L{line}: `{loc}` (new) is created by no task - add the task that creates "
                              f"it, or take the component out of the design")
            elif mark == "existing" and not any(covers(loc, p) for p in touched):
                errors.append(f"design.md L{line}: `{loc}` (existing) is changed by no task - add the task that "
                              f"changes it, or move it to `## Code Reuse Analysis`")


def check_review(fdir, errors, warnings):
    """With a design.md, tasks follow a plan a reader who never saw the chat has read, with every finding resolved."""
    design = os.path.join(fdir, "design.md")
    if not os.path.isfile(design):
        return
    d = Doc(design)
    mark = d.field(0, len(d.lines), "Reviewed")
    value = mark.value.strip("` ") if mark else ""
    if not value:
        errors.append("design.md has no `**Reviewed**:` line - read the plan cold before Tasks (references/review.md); "
                      "a design written before this gate writes `**Reviewed**: not run - <why>`")
        return
    if value.lower().startswith("not run"):
        reason = value[len("not run"):].strip(" -:")
        if reason:
            warnings.append(f"design.md: plan review not run ({reason}) - a degraded gate")
        else:
            errors.append("`**Reviewed**: not run` names no reason - write what failed")
        return
    if value.lower().startswith("dispatched"):
        errors.append("design.md says the plan reviewer is `dispatched` - wait for review.md, resolve every finding, "
                      "then write `**Reviewed**: review.md`")
        return
    if value != "review.md":
        errors.append(f"`**Reviewed**: {value}` - write `review.md`, or `not run - <why>`")
        return
    path = os.path.join(fdir, "review.md")
    if not os.path.isfile(path):
        errors.append("design.md says `**Reviewed**: review.md` and there is no review.md")
        return
    r = Doc(path)
    who = r.field(0, len(r.lines), "Reviewer")
    if not who or "independent" not in who.value.lower() or "self" in who.value.lower():
        errors.append("review.md: `**Reviewer**:` is not an independent sub-agent - a review in the author's context "
                      "is `**Reviewed**: not run - <why>`, never a review")
    for heading in ("What this builds", "How the system works today, per these files"):
        body = r.section(heading)
        text = [s for _, s in r.text(*body) if not s.startswith(("<", "["))] if body else []
        if not text:
            errors.append(f"review.md: no paraphrase under `## {heading}` - the reviewer writes it before any finding")
    body = r.section("Findings")
    if not body:
        errors.append("review.md: no `## Findings` section")
        return
    tables = r.tables(*body)
    if not tables:
        if not any(s.lower().startswith("none") for _, s in r.text(*body)):
            errors.append("review.md: `## Findings` is empty - a table of findings, or `None - <what was probed>`")
        return
    t = tables[0]
    errors += [f"review.md {e}" for e in t.errors]
    col = {k: t.key(k) for k in ("id", "severity", "where", "evidence", "resolution")}
    if not col["severity"] or not col["resolution"] or not col["where"]:
        errors.append("review.md: the findings table needs `Severity`, `Where` and `Resolution` columns")
        return
    for n, row in t.rows:
        fid = row[col["id"]] if col["id"] else f"L{n}"
        where = row[col["where"]].strip().strip("`").strip().lower()
        if not where.startswith(PLAN_FILES):
            errors.append(f"review.md {fid}: Where `{row[col['where']][:40]}` - start it with the plan file that must "
                          f"change, {', '.join(PLAN_FILES)}, then the heading")
        if norm(row[col["severity"]]) not in ("blocker", "major"):
            errors.append(f"review.md {fid}: severity `{row[col['severity']]}` - the review reports Blocker and Major only")
        if col["evidence"] and not row[col["evidence"]].strip():
            errors.append(f"review.md {fid}: no evidence - a finding names file:line, or a file and its heading")
        res = row[col["resolution"]].strip()
        if not res:
            errors.append(f"review.md {fid} is open - fix it, contest it with evidence, or escalate it to the user")
            continue
        m = RESOLUTION_RE.match(res)
        if not m:
            errors.append(f"review.md {fid}: resolution `{res[:60]}` - write `fixed - <what changed>`, "
                          f"`contested - <file:line>` or `escalated - user: \"<their words>\"`")
        elif m.group(1).lower() == "contested" and not READABLE_REF_RE.search(m.group(2)):
            errors.append(f"review.md {fid}: contested with nothing the reviewer could read - cite file:line or a file "
                          f"and its heading, or fix it, or escalate it")
        elif m.group(1).lower() == "escalated" and not USER_WORDS_RE.search(m.group(2)):
            errors.append(f"review.md {fid}: escalated with no answer in the user's words - ask, and write "
                          f"`user: \"<their words>\"` in the turn it arrives")


def red_build(path, root):
    """Each `Build:` command that fails on this tree, run once as check_proofs.py runs it."""
    from check_proofs import read_checks as read_build, run, shell_of
    _, _, build, _ = read_build(path)
    bash, _ = shell_of()
    errors = []
    for cmd in build:
        code, output = run(root, cmd, bash)
        if code:
            lines = output.strip().splitlines()
            first = next((ln for ln in lines if "error" in ln.lower()), lines[-1] if lines else "")
            errors.append(f"Build is red before the first task: `{cmd}` exit {code} - {first.strip()[:100]}. check_proofs.py "
                          f"and the gate hold the feature to this line, so name the repo's own build, type check and lint "
                          f"commands; if those are red before any change, tell the user and stop")
    return errors


def check(fdir, root, execute, restamp=()):
    """The feature's errors and warnings. `restamp` names a file whose approval approve.py is rewriting."""
    errors, warnings = [], []
    spec_path, tasks_path = os.path.join(fdir, "spec.md"), os.path.join(fdir, "tasks.md")
    spec = read_spec(spec_path) if os.path.isfile(spec_path) else None
    criteria = spec["criteria"] if spec else []
    scope = spec["scope"].value.strip() if spec and spec["scope"] else ""
    if not spec:
        errors.append("no spec.md - Specify comes first")

    if os.path.isfile(tasks_path):
        model = read_tasks(tasks_path)
        errors += model["errors"]
        for name in REQUIRED_SECTIONS:
            if model["doc"].section(name) is None:
                errors.append(f"missing required section: ## {name}")
        checks, e, w = check_proofs_owed(model["doc"].raw)
        errors += e
        warnings += w
        check_tasks(model, criteria, root, errors)
        check_coverage(criteria, checks, "tasks.md", errors)
        if scope in ("Large", "Complex") and not os.path.isfile(os.path.join(fdir, "design.md")):
            errors.append(f"`**Scope**: {scope}` owes a design.md - Design comes before Tasks")
        check_review(fdir, errors, warnings)
        check_design_coverage(fdir, model["tasks"], errors)
        build_from = tasks_path
    else:
        if scope in ("Large", "Complex"):
            errors.append(f"`**Scope**: {scope}` owes a tasks.md")
        if not execute:
            errors.append("no tasks.md - with a Medium scope, run this with --execute before the first change")
        if spec:
            checks, e, w = check_proofs_owed(spec["doc"].raw)
            errors += e
            warnings += w
            check_coverage(criteria, checks, "spec.md", errors)
        build_from = spec_path

    errors += approval_errors(fdir, execute, only=tuple(n for n in ("spec.md", "tasks.md") if n not in restamp))
    if execute:
        if spec and has_open_questions(spec["doc"]):
            errors.append("spec.md still has open questions - Execute starts when they are `none`")
        if not errors and os.path.isfile(build_from):
            errors += red_build(build_from, root)
    return errors, warnings


def main(argv=None):
    p = argparse.ArgumentParser(prog="validate_tasks.py", description="The gate tasks.md passes.")
    p.add_argument("target", nargs="?", default=None)
    p.add_argument("--root", default=".")
    p.add_argument("--strict", action="store_true")
    p.add_argument("--execute", action="store_true",
                   help="Before the first task: also require both approvals stamped by approve.py, no open "
                        "question, and the Build line green")
    args = p.parse_args(argv)
    fdir = feature_dir(args.target, args.root, "tasks.md") or feature_dir(args.target, args.root, "spec.md")
    if not fdir:
        print("validate_tasks: could not locate the feature. Pass its name, or run from the project root.",
              file=sys.stderr)
        return 2
    errors, warnings = check(fdir, os.path.abspath(args.root), args.execute)
    return finish("validate_tasks", fdir, errors, warnings, args.strict, fdir)


if __name__ == "__main__":
    raise SystemExit(main())

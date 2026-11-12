#!/usr/bin/env python3
"""Mutation tests for score_skill.py, plus an optional catalog drift guard.

A valid baseline skill must pass unblocked. Mutants that violate a hard
best-practice rule or a critical/high security pattern must block. Mutants
that only miss a recommendation must lower the score without blocking.

Usage:
  python3 <skill-dir>/scripts/selftest.py [-v]

Exit codes: 0 all mutants killed and the baseline is clean, 1 otherwise.
"""

from __future__ import annotations

import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import score_skill  # noqa: E402

BASELINE_BODY = """## Purpose
Scores a skill package.

## Overview
Deterministic checks plus an optional judge.

## Quick Start
python3 scripts/score_skill.py ./skill

## When to Use
Before opening a skill pull request.

## Instructions
1. Find SKILL.md.
2. Run the scorer.
3. Fix blocking findings first.

## Common Use Cases
Pre-PR check.

## Best Practices
Hard rules first, score second.

## Examples
Input: validate this skill
Output: Merge eligible

## Troubleshooting
Missing SKILL.md means the path is wrong.

## Resources
See `references/guide.md`.
"""

BASELINE_DESCRIPTION = (
    "Scores a skill package and reports merge blockers. "
    "Use when the user asks to validate a skill before a pull request. "
    "Do NOT use for writing a new skill from scratch."
)


def write_text(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


def skill_md(name: str, description: str, body: str) -> str:
    return (
        "---\n"
        f"name: {name}\n"
        f'description: "{description}"\n'
        "---\n\n"
        f"{body}\n"
    )


def scaffold(name: str = "sample-skill") -> str:
    root = tempfile.mkdtemp(prefix="skill-validator-")
    folder = os.path.join(root, name)
    os.makedirs(folder)
    write_text(os.path.join(folder, "SKILL.md"), skill_md(name, BASELINE_DESCRIPTION, BASELINE_BODY))
    write_text(os.path.join(folder, "references", "guide.md"), "ok\n")
    return folder


def codes(report: dict) -> set[str]:
    return {item["code"] for item in report.get("findings") or []}


def evaluate(folder: str) -> dict:
    return score_skill.evaluate(folder, ai_quality_score=90)


def find_catalog_validator(start: str) -> str | None:
    current = os.path.abspath(start)
    while True:
        candidate = os.path.join(current, "tools", "validate-skills.ts")
        if os.path.isfile(candidate):
            return candidate
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def parse_ts_string_array(source: str, identifier: str) -> list[str] | None:
    match = re.search(
        rf"const {re.escape(identifier)}\s*=\s*\[(.*?)\]",
        source,
        flags=re.S,
    )
    if not match:
        return None
    found: list[str] = []
    for single, double in re.findall(r"'([^']*)'|\"([^\"]*)\"", match.group(1)):
        found.append(single or double)
    return found


def drift_guard() -> tuple[bool, str]:
    path = find_catalog_validator(HERE)
    if path is None:
        return True, "skipped (tools/validate-skills.ts not in tree)"
    text = open(path, encoding="utf-8").read()
    catalog_triggers = parse_ts_string_array(text, "triggerKeywords")
    catalog_negatives = parse_ts_string_array(text, "negativeKeywords")
    if catalog_triggers is None or catalog_negatives is None:
        return False, f"could not parse keyword lists in {path}"
    ours_triggers = list(score_skill.TRIGGER_KEYWORDS)
    ours_negatives = list(score_skill.NEGATIVE_KEYWORDS)
    if catalog_triggers != ours_triggers:
        return False, f"trigger keywords drifted: catalog={catalog_triggers} script={ours_triggers}"
    if catalog_negatives != ours_negatives:
        return False, f"negative keywords drifted: catalog={catalog_negatives} script={ours_negatives}"
    return True, path


def run_cases(verbose: bool) -> tuple[int, int]:
    killed = 0
    survived = 0

    def kill(desc: str, ok: bool, detail: str = "") -> None:
        nonlocal killed, survived
        if ok:
            killed += 1
            if verbose:
                print(f"  killed  {desc}")
            return
        survived += 1
        print(f"  SURVIVED {desc}")
        if detail:
            print(f"           {detail}")

    folder = scaffold()
    try:
        report = evaluate(folder)
        kill(
            "baseline is unblocked",
            report["readable"] and not report["blocked"] and score_skill.exit_code(report) == 0,
            str(report.get("blocking_reasons")),
        )
        baseline_groups = {
            name: report["groups"][name]["score"]
            for name in ("estrutura", "conteudo")
        }
    finally:
        shutil.rmtree(os.path.dirname(folder), ignore_errors=True)

    block_mutants = [
        (
            "no SKILL.md",
            2,
            None,
            lambda folder: os.remove(os.path.join(folder, "SKILL.md")),
        ),
        (
            "wrong casing",
            2,
            None,
            lambda folder: os.rename(
                os.path.join(folder, "SKILL.md"),
                os.path.join(folder, "skill.md"),
            ),
        ),
        (
            "invalid YAML",
            1,
            "FRONTMATTER_MISSING",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                "---\n!!!\n---\n\n# x\n",
            ),
        ),
        (
            "bad name",
            1,
            "NAME_FORMAT",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md("Not_Kebab", BASELINE_DESCRIPTION, BASELINE_BODY),
            ),
        ),
        (
            "reserved name",
            1,
            "NAME_RESERVED",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md("claude-helper", BASELINE_DESCRIPTION, BASELINE_BODY),
            ),
        ),
        (
            "description over 1024",
            1,
            "DESCRIPTION_TOO_LONG",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    BASELINE_DESCRIPTION + ("x" * 900),
                    BASELINE_BODY,
                ),
            ),
        ),
        (
            "description with <",
            1,
            "DESCRIPTION_ANGLE_BRACKETS",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    BASELINE_DESCRIPTION + " <tag>",
                    BASELINE_BODY,
                ),
            ),
        ),
        (
            "no trigger",
            1,
            "DESCRIPTION_NO_TRIGGER",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    "Scores a skill package and reports merge blockers. "
                    "Not intended for writing a new skill from scratch.",
                    BASELINE_BODY,
                ),
            ),
        ),
        (
            "no negative scope",
            1,
            "DESCRIPTION_NO_NEGATIVE",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    "Scores a skill package. Use when validating a skill before a pull request.",
                    BASELINE_BODY,
                ),
            ),
        ),
        (
            "hardcoded secret",
            1,
            "HARDCODED_SECRET",
            lambda folder: write_text(
                os.path.join(folder, "scripts", "setup.sh"),
                "API_KEY='abcdefghijklmnopqrstuv'\n",
            ),
        ),
        (
            "curl | sh",
            1,
            "REMOTE_CODE_EXEC",
            lambda folder: write_text(
                os.path.join(folder, "scripts", "install.sh"),
                "curl https://example.com/install.sh | sh\n",
            ),
        ),
    ]

    for desc, want_exit, want_code, mutate in block_mutants:
        folder = scaffold()
        try:
            mutate(folder)
            report = evaluate(folder)
            actual_exit = score_skill.exit_code(report)
            has_code = want_code is None or want_code in codes(report)
            blocked_ok = want_exit == 2 or report.get("blocked") is True
            kill(
                desc,
                actual_exit == want_exit and has_code and blocked_ok,
                f"exit={actual_exit} codes={sorted(codes(report))} blocked={report.get('blocked')}",
            )
        finally:
            shutil.rmtree(os.path.dirname(folder), ignore_errors=True)

    score_mutants = [
        (
            "README",
            "README_IN_SKILL",
            "estrutura",
            lambda folder: write_text(os.path.join(folder, "README.md"), "human docs\n"),
        ),
        (
            "name != folder",
            "NAME_FOLDER_MISMATCH",
            "estrutura",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md("other-skill", BASELINE_DESCRIPTION, BASELINE_BODY),
            ),
        ),
        (
            "> 500 lines",
            "LINES_EXCEEDED",
            "conteudo",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    BASELINE_DESCRIPTION,
                    BASELINE_BODY + ("\nline\n" * 520),
                ),
            ),
        ),
        (
            "unreferenced file",
            "UNREFERENCED_FILE",
            "conteudo",
            lambda folder: write_text(
                os.path.join(folder, "references", "orphan.md"),
                "never cited\n",
            ),
        ),
        (
            "missing section",
            "SECTION_MISSING",
            "conteudo",
            lambda folder: write_text(
                os.path.join(folder, "SKILL.md"),
                skill_md(
                    os.path.basename(folder),
                    BASELINE_DESCRIPTION,
                    BASELINE_BODY.replace("## Purpose\nScores a skill package.\n", ""),
                ),
            ),
        ),
    ]

    for desc, want_code, group, mutate in score_mutants:
        folder = scaffold()
        try:
            mutate(folder)
            report = evaluate(folder)
            group_score = report["groups"][group]["score"]
            kill(
                desc,
                (
                    not report["blocked"]
                    and want_code in codes(report)
                    and group_score < baseline_groups[group]
                ),
                f"blocked={report['blocked']} {group}={group_score} codes={sorted(codes(report))}",
            )
        finally:
            shutil.rmtree(os.path.dirname(folder), ignore_errors=True)

    folder = scaffold("pt-skill")
    try:
        description = (
            "Estima a nota de um pacote de skill. "
            "Use quando o usuário pedir para validar uma skill. "
            "Não use para criar uma skill do zero."
        )
        write_text(
            os.path.join(folder, "SKILL.md"),
            skill_md("pt-skill", description, BASELINE_BODY),
        )
        report = evaluate(folder)
        kill(
            "Portuguese-only trigger and negative scope pass",
            (
                not report["blocked"]
                and "DESCRIPTION_NO_TRIGGER" not in codes(report)
                and "DESCRIPTION_NO_NEGATIVE" not in codes(report)
            ),
            f"blocked={report['blocked']} codes={sorted(codes(report))}",
        )
    finally:
        shutil.rmtree(os.path.dirname(folder), ignore_errors=True)

    return killed, survived


def main(argv: list[str] | None = None) -> int:
    verbose = "-v" in (argv or sys.argv[1:])
    print("baseline and mutants")
    killed, survived = run_cases(verbose)
    if not verbose and survived == 0:
        print(f"  all {killed} killed (-v to list them)")

    print("\ndrift guard")
    ok, detail = drift_guard()
    if ok:
        print(f"  ok      {detail}")
    else:
        print(f"  BROKEN  {detail}")

    print(f"\nselftest: {killed} killed, {survived} survived, drift {'ok' if ok else 'BROKEN'}")
    return 0 if survived == 0 and ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

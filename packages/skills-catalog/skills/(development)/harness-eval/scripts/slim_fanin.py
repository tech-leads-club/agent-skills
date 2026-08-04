#!/usr/bin/env python3
"""Deterministic Slim fan-in gate: block stub/delete when another harness surface hard-loads a path.

Stack-agnostic: scans discovered harness markdown for path cites + mandate language.
No package managers, frameworks, or app layouts are assumed.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

T0_NAMES = ("AGENTS.md", "CLAUDE.md", ".cursorrules")
T0_GLOBS = (".cursor/rules/**/*", ".agents/**/*.mdc", ".cursor/**/*.mdc", "*.mdc")
# why: fan-in must see skills outside a --seed inventory (full skill tree)
SKILL_MD_GLOBS = (
    ".agents/skills/**/*.md",
    ".cursor/skills/**/*.md",
    ".claude/skills/**/*.md",
)
README_RE = re.compile(r"(^|/)README[^/]*$", re.I)
HARNESS_EVAL_RUNS = re.compile(r"(^|/)\.harness-eval(/|$)")

# why: mere path mention (index tables) is not enough; require load/SoT on the cite line
# hazard: wide windows false-positive when a later "extract every" belongs to another path
MANDATE_RE = re.compile(
    r"(?i)("
    r"source\s+of\s+truth"
    r"|primary\s+source"
    r"|extract\s+every"
    r"|extract\b.{0,60}\bfrom"
    r"|must\s+(?:read|load|open)"
    r"|required?\s+to\s+(?:read|load|open)"
    r"|load\s+every"
    r"|load\s+all"
    r"|\b(?:load|read|open)\s+(?:the\s+)?(?:file|document|reference|skill)\b"
    r"|before\s+(?:writing|touching|coding|editing|creating)\b"
    r"|phase\s*0"
    r")",
)


def normalize_cite(cite: str) -> str:
    c = cite.strip().strip("\"'")
    while c.startswith("./"):
        c = c[2:]
    return c.replace("\\", "/")


def rel(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def is_readme(path: str) -> bool:
    return bool(README_RE.search(path.replace("\\", "/")))


def glob_files(root: Path, pattern: str) -> list[Path]:
    return sorted(p for p in root.glob(pattern) if p.is_file())


def discover_harness_markdown(root: Path) -> list[Path]:
    """Full harness markdown corpus for fan-in (not limited to a seeded inventory)."""
    found: set[Path] = set()
    for name in T0_NAMES:
        p = root / name
        if p.is_file():
            found.add(p.resolve())
    for pattern in T0_GLOBS + SKILL_MD_GLOBS:
        for p in glob_files(root, pattern):
            r = rel(root, p)
            if is_readme(r) or HARNESS_EVAL_RUNS.search(r):
                continue
            if p.suffix.lower() not in {".md", ".mdc"} and "rules" not in r:
                # why: T0_GLOBS may match non-md under .cursor/rules; keep text-like only
                if p.suffix.lower() not in {".md", ".mdc", ""}:
                    continue
            found.add(p.resolve())
    return sorted(found)


def path_aliases(root: Path, target_rel: str, source_rel: str) -> list[str]:
    """Path strings that count as a cite of target when found in source text."""
    t = normalize_cite(target_rel)
    aliases = {t, f"./{t}"}
    parts = t.split("/")
    if len(parts) >= 2:
        aliases.add("/".join(parts[-2:]))  # references/review.md
    if len(parts) >= 3:
        aliases.add("/".join(parts[-3:]))  # dev/references/review.md

    # why: skill-internal cites often omit the skills/<name>/ prefix
    for skills_root in (".agents/skills", ".cursor/skills", ".claude/skills"):
        prefix = skills_root + "/"
        if t.startswith(prefix) and source_rel.startswith(prefix):
            rest = t[len(prefix) :]
            skill_name, _, within = rest.partition("/")
            src_rest = source_rel[len(prefix) :]
            src_skill, _, _ = src_rest.partition("/")
            if skill_name and skill_name == src_skill and within:
                aliases.add(within)
                aliases.add(f"./{within}")
    # why: longest aliases first so specific forms win over short suffixes
    return sorted(aliases, key=len, reverse=True)


def _line_span(text: str, pos: int) -> tuple[int, int]:
    start = text.rfind("\n", 0, pos) + 1
    end = text.find("\n", pos)
    if end < 0:
        end = len(text)
    return start, end


def _mandate_window(text: str, match_start: int) -> str:
    """Same line + up to two preceding lines (catches 'Load every' then a path bullet)."""
    start, end = _line_span(text, match_start)
    lines = [text[start:end]]
    cursor = start
    for _ in range(2):
        if cursor <= 0:
            break
        p_start, p_end = _line_span(text, cursor - 1)
        prev = text[p_start:p_end].strip()
        cursor = p_start
        if not prev:
            continue
        lines.insert(0, prev)
    return "\n".join(lines)


def find_mandate_fanin(root: Path, target_rel: str) -> list[dict]:
    """Return citers that hard-load / treat target as SoT (excludes self)."""
    target_rel = normalize_cite(target_rel)
    target_resolved = (root / target_rel).resolve()
    hits: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for src in discover_harness_markdown(root):
        if src.resolve() == target_resolved:
            continue
        source_rel = rel(root, src)
        try:
            text = src.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        aliases = path_aliases(root, target_rel, source_rel)
        for alias in aliases:
            # why: prefer backtick form; also plain path
            patterns = [
                re.compile(r"`" + re.escape(alias) + r"`"),
                re.compile(re.escape(alias)),
            ]
            for pat in patterns:
                for m in pat.finditer(text):
                    window = _mandate_window(text, m.start())
                    if not MANDATE_RE.search(window):
                        continue
                    key = (source_rel, alias)
                    if key in seen:
                        continue
                    seen.add(key)
                    snippet = " ".join(window.split())
                    if len(snippet) > 180:
                        snippet = snippet[:177] + "…"
                    hits.append(
                        {
                            "citer": source_rel,
                            "alias": alias,
                            "snippet": snippet,
                        }
                    )
    return hits


def infer_root_from_run_dir(run_dir: Path) -> Path:
    # invariant: run dirs live at <repo>/.harness-eval/runs/<id>
    run_dir = run_dir.resolve()
    if run_dir.parent.name == "runs" and run_dir.parent.parent.name == ".harness-eval":
        return run_dir.parent.parent.parent
    return Path.cwd().resolve()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=None)
    ap.add_argument("--path", required=True, help="Repo-relative harness path to check")
    args = ap.parse_args()
    root = (args.root or Path(".")).resolve()
    hits = find_mandate_fanin(root, args.path)
    print(json.dumps({"path": normalize_cite(args.path), "fanin": hits, "blocked": bool(hits)}, indent=2))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())

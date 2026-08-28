#!/usr/bin/env python3
"""Track A — high-precision deterministic correctness. Lives inside harness-eval skill."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

BACKTICK_PATH_RE = re.compile(r"`([^`]+)`|(?<!!)\[[^\]]*\]\(([^)]+)\)")
README_RE = re.compile(r"(^|/)README[^/]*$", re.I)
EXAMPLE_PATH_RE = re.compile(r"(^|/)path/to(/|$)", re.I)
PLACEHOLDER_SEG_RE = re.compile(
    r"^(SPEC_FOLDER|FEATURE_FOLDER|YOUR_\w+|PATH_TO_\w+|EXAMPLE_\w+|"
    r"packageName|projectName|featureName)$"
    r"|\{[^}]+\}|\[[^\]]+\]|^path$|^to$",
    re.I,
)
CONCRETE_PREFIXES = (
    "docs/",
    ".agents/",
    ".cursor/",
    ".harness-eval/",
    ".tlc/",
    "references/",
    "package/",
    "app/",
    "apps/",
    "scripts/",
    "bin/",
    "config/",
    "lib/",
    "src/",
    "cmd/",
    "internal/",
    "spec/",
    "test/",
    "tests/",
)
PM_BUILTINS = {
    "install",
    "uninstall",
    "add",
    "remove",
    "init",
    "link",
    "unlink",
    "publish",
    "pack",
    "login",
    "logout",
    "cache",
    "config",
    "info",
    "list",
    "outdated",
    "audit",
    "why",
    "dlx",
    "exec",
    "create",
    "global",
    "workspace",
    "workspaces",
    "update",
    "check",
    "require",
    "dump-autoload",
    "dumpautoload",
    "validate",
}
RUNNER_BUILTINS = {
    "nx",
    "run",
    "run-many",
    "affected",
    "test",
    "build",
    "mod",
    "generate",
    "vet",
    "fmt",
    "get",
    "install",
    "tidy",
    "clean",
    "compile",
    "package",
    "verify",
    "deploy",
    "site",
    "validate",
    "integration-test",
    "pre-integration-test",
    "post-integration-test",
    "assemble",
    "check",
    "bootRun",
    "bootJar",
    "dependencies",
    "wrapper",
    "server",
    "console",
    "routes",
    "runner",
    "new",
    "list",
    "help",
}
WALK_SKIP_DIRS = frozenset(
    {
        "node_modules",
        ".git",
        "dist",
        "coverage",
        ".harness-eval",
        ".vitepress",
        ".next",
        ".turbo",
        ".nx",
    }
)

COMMAND_CITE_RES = (
    re.compile(
        r"`(?:yarn|npm|pnpm|bun)(?:\s+run)?\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"
    ),
    re.compile(r"`make\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
    re.compile(r"`task\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
    re.compile(
        r"`(?:bundle\s+exec\s+)?(?:bin/)?rake\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"
    ),
    re.compile(
        r"`(?:bundle\s+exec\s+)?(?:bin/)?rails\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"
    ),
    re.compile(r"`bin/([A-Za-z0-9_-]+)(?:\s+([A-Za-z0-9:_./-]+))?[^`]*`"),
    re.compile(r"`(?:\./)?mvnw?\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
    re.compile(r"`(?:\./)?gradlew?\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
    re.compile(r"`go\s+([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
    re.compile(
        r"`(?:php\s+)?(?:\.?/)?artisan\s+([A-Za-z0-9:_./:-]+)(?:\s+[^`]*)?`"
    ),
    re.compile(
        r"`(?:php\s+)?(?:bin/)?console\s+([A-Za-z0-9:_./:-]+)(?:\s+[^`]*)?`"
    ),
    re.compile(r"`composer\s+(?:run(?:-script)?\s+)?([A-Za-z0-9:_./-]+)(?:\s+[^`]*)?`"),
)


@dataclass
class OkCite:
    source: str
    cite: str


@dataclass
class Finding:
    id: str
    severity: str
    source: str
    claim: str
    reality: str
    evidence: str
    kind: str = "path"
    cite: str = ""
    looked_for: str = ""
    tried: list[str] = field(default_factory=list)
    action: str = ""
    possible_matches: list[str] = field(default_factory=list)
    manifests: list[str] = field(default_factory=list)
    missing_script: str = ""
    absolute_evidence: str = ""


def default_out(root: Path, run_id: str) -> Path:
    return root / ".harness-eval" / "runs" / run_id


def rel(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def to_repo_relative(root: Path, path_str: str) -> str:
    if path_str.startswith("case-mismatch:"):
        raw = path_str.split(":", 1)[1]
        try:
            return Path(raw).resolve().relative_to(root.resolve()).as_posix()
        except (ValueError, OSError):
            return raw.replace("\\", "/")
    try:
        p = Path(path_str)
        if p.is_absolute():
            return p.resolve().relative_to(root.resolve()).as_posix()
    except (ValueError, OSError):
        pass
    return normalize_cite(path_str)


def normalize_tried(root: Path, tried: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for t in tried:
        rel_t = to_repo_relative(root, t)
        if rel_t.startswith("case-mismatch:"):
            rel_t = rel_t.split(":", 1)[-1]
        if rel_t not in seen:
            seen.add(rel_t)
            out.append(rel_t)
    return out


def find_possible_matches(root: Path, cite: str, *, limit: int = 3) -> list[str]:
    name = Path(normalize_cite(cite)).name
    if not name or name in {".", ".."}:
        return []
    matches: list[str] = []
    root_res = root.resolve()
    for dirpath, dirnames, filenames in os.walk(root_res):
        dirnames[:] = [d for d in dirnames if d not in WALK_SKIP_DIRS and d != ".husky"]
        if name in filenames:
            p = Path(dirpath) / name
            try:
                rel_p = p.resolve().relative_to(root_res).as_posix()
            except ValueError:
                continue
            if rel_p not in matches:
                matches.append(rel_p)
            if len(matches) >= limit:
                break
    return matches


def problem_title(f: Finding) -> str:
    if f.kind == "command":
        return "Missing command"
    if f.kind == "skill":
        return "Missing skill"
    if f.kind == "inventory":
        return "Missing harness file"
    if "Case mismatch" in f.reality:
        return "Wrong file casing"
    return "Missing file"


def is_readme(path: str) -> bool:
    return bool(README_RE.search(path.replace("\\", "/")))


def normalize_cite(cite: str) -> str:
    c = cite.strip().strip("\"'")
    while c.startswith("./"):
        c = c[2:]
    return c


def strip_fenced_code(text: str) -> str:
    return re.sub(r"```.*?```", "\n", text, flags=re.S)


SKILL_MENTION_RE = re.compile(
    r"[`']([a-z][a-z0-9_-]*)[`']\s+skill"
    r"|\b(?:the|load(?:ing)?|use|using)\s+([a-z][a-z0-9_-]*)\s+skill\b",
    re.I,
)
PATH_MANDATE_RE = re.compile(
    r"\b(load|open|must|required|touch|modify|edit|delete|restore)\b"
    r"|\bread\s+(?:the\s+)?(?:file|path|this\s+file)"
    r"|\bread\s+[`'][^`']+[`']",
    re.I,
)
CODE_TREE_PREFIXES = (
    "app/",
    "apps/",
    "lib/",
    "src/",
    "cmd/",
    "internal/",
    "spec/",
    "test/",
    "tests/",
)

_SKILL_MENTION_STOP = frozenset({"the", "a", "an", "this", "that", "each", "any", "our"})


def mentioned_skill_names(text: str) -> list[str]:
    names: list[str] = []
    for m in SKILL_MENTION_RE.finditer(text):
        name = (m.group(1) or m.group(2) or "").strip().lower()
        if name and name not in _SKILL_MENTION_STOP and name not in names:
            names.append(name)
    return names


def has_mandate_near_cite(text: str, cite: str) -> bool:
    for m in re.finditer(re.escape(cite), text):
        before = text.rfind("\n\n", 0, m.start())
        after = text.find("\n\n", m.end())
        start = 0 if before < 0 else before + 2
        end = len(text) if after < 0 else after
        if PATH_MANDATE_RE.search(text[start:end]):
            return True
    return False


def is_code_tree_cite(cite: str) -> bool:
    return normalize_cite(cite).startswith(CODE_TREE_PREFIXES)


def is_placeholder_cite(cite: str) -> bool:
    if "*" in cite or "<" in cite or cite.endswith("/"):
        return True
    if EXAMPLE_PATH_RE.search(cite) or "{" in cite or "}" in cite:
        return True
    if re.search(r"\[[^\]]+\]", cite):
        return True
    for part in Path(normalize_cite(cite)).parts:
        if PLACEHOLDER_SEG_RE.match(part):
            return True
        if "_" in part and part.isupper():
            return True
    return False


def is_concrete_checkable_cite(cite: str) -> bool:
    c = normalize_cite(cite)
    if c.startswith("../"):
        return ".agents/" in c or ".cursor/" in c or c.startswith("../.agents/")
    if c.startswith(CONCRETE_PREFIXES):
        return True
    return c.startswith("references/") and c.endswith((".md", ".mdc", ".json"))


def looks_like_path(raw: str) -> bool:
    if raw.startswith(("http://", "https://", "#", "mailto:")):
        return False
    if " " in raw and not raw.endswith((".md", ".ts", ".js")):
        return False
    return (
        "/" in raw
        or raw.endswith((".md", ".mdc", ".ts", ".js", ".py", ".json", ".yml", ".yaml"))
        or raw.startswith(("docs/", ".agents/", ".cursor/", "references/"))
    )


def extract_cites(text: str) -> list[str]:
    out = []
    for m in BACKTICK_PATH_RE.finditer(text):
        raw = (m.group(1) or m.group(2) or "").strip()
        if not raw:
            continue
        parts = raw.split()
        if not parts:
            continue
        raw = parts[0].split("#")[0].strip("\"'")
        if raw and looks_like_path(raw) and not is_readme(raw):
            out.append(raw)
    return out


def extract_surface_cites(text: str) -> list[str]:
    return extract_cites(strip_fenced_code(text))


def resolve_cite(
    root: Path, source: Path, cite: str, *, text: str | None = None
) -> tuple[Path | None, list[str]]:
    cite_norm = normalize_cite(cite)
    tried: list[str] = []
    candidates = [root / cite_norm, source.parent / cite_norm, (source.parent / cite_norm).resolve()]
    if cite_norm.startswith("../"):
        candidates.append((source.parent / cite_norm).resolve())
    if "skills" in source.parts:
        try:
            skills_idx = list(source.parts).index("skills")
            skill_root = Path(*source.parts[: skills_idx + 2])
            candidates.append(skill_root / cite_norm)
        except ValueError:
            pass
    if cite_norm.startswith("references/") and text:
        for skill_name in mentioned_skill_names(text):
            for base in (
                root / ".agents" / "skills" / skill_name,
                root / ".cursor" / "skills" / skill_name,
                root / ".claude" / "skills" / skill_name,
            ):
                candidates.append(base / cite_norm)
    seen: set[str] = set()
    for c in candidates:
        key = str(c)
        if key in seen:
            continue
        seen.add(key)
        tried.append(key)
        try:
            if c.is_file():
                return c.resolve(), tried
        except OSError:
            continue
    name = Path(cite_norm).name
    for parent in [(root / Path(cite_norm).parent), (source.parent / Path(cite_norm).parent)]:
        try:
            if parent.is_dir():
                for child in parent.iterdir():
                    if child.name.lower() == name.lower() and child.is_file():
                        return None, tried + [f"case-mismatch:{child}"]
        except OSError:
            continue
    return None, tried


def check_file(
    root: Path,
    source: Path,
    commands: set[str],
    manifests: list[str],
    finding_id: list[int],
) -> list[Finding]:
    findings: list[Finding] = []
    text = source.read_text(encoding="utf-8", errors="replace")
    src = rel(root, source)

    for cite in extract_surface_cites(text):
        if is_placeholder_cite(cite):
            continue
        if cite.count("/") == 0 and not cite.endswith((".md", ".mdc", ".ts", ".js", ".json")):
            skill = root / ".agents" / "skills" / cite / "SKILL.md"
            alt = root / ".cursor" / "skills" / cite / "SKILL.md"
            if skill.is_file() or alt.is_file():
                continue
            if re.search(rf"(?:use|see|skill)\s+[`']?{re.escape(cite)}[`']?", text, re.I):
                finding_id[0] += 1
                findings.append(
                    Finding(
                        id=f"A{finding_id[0]:03d}",
                        severity="BROKEN",
                        source=src,
                        claim=f"References skill `{cite}`",
                        reality="No matching SKILL.md under .agents/skills or .cursor/skills",
                        evidence=f"missing:{cite}",
                        kind="skill",
                        cite=cite,
                        looked_for=f".agents/skills/{cite}/SKILL.md or .cursor/skills/{cite}/SKILL.md",
                        action=(
                            f"Create `.agents/skills/{cite}/SKILL.md` or "
                            f"`.cursor/skills/{cite}/SKILL.md`, or fix the skill name in `{src}`."
                        ),
                    )
                )
            continue
        if not is_concrete_checkable_cite(cite):
            continue
        resolved, tried = resolve_cite(root, source, cite, text=text)
        if resolved:
            continue
        if is_code_tree_cite(cite) and not has_mandate_near_cite(text, cite):
            continue
        case_hit = next((t for t in tried if t.startswith("case-mismatch:")), None)
        tried_rel = normalize_tried(root, tried)
        cite_norm = normalize_cite(cite)
        possible = find_possible_matches(root, cite)
        if case_hit:
            found_path = to_repo_relative(root, case_hit)
            action = f"Fix the casing to match `{found_path}`, or update the cite to that path."
            reality = f"Case mismatch; found `{found_path}`"
        else:
            action = "Change the cite to a path that exists, or restore the file."
            reality = "File does not exist (case-sensitive check)"
        finding_id[0] += 1
        findings.append(
            Finding(
                id=f"A{finding_id[0]:03d}",
                severity="BROKEN",
                source=src,
                claim=f"Path cite `{cite}`",
                reality=reality,
                evidence="; ".join(tried_rel[:6]) or cite_norm,
                kind="path",
                cite=cite,
                looked_for=cite_norm,
                tried=tried_rel,
                action=action,
                possible_matches=possible,
                absolute_evidence="; ".join(tried[:6]),
            )
        )

    findings.extend(_command_findings(text, src, commands, manifests, finding_id))
    return findings


def _runner_kind(cite: str) -> str:
    c = cite.lower()
    if re.search(r"\b(yarn|npm|pnpm|bun)\b", c):
        return "node"
    if re.search(r"\brake\b", c):
        return "rake"
    if re.search(r"\brails\b", c):
        return "rails"
    if re.search(r"\bartisan\b", c):
        return "artisan"
    if re.search(r"\bconsole\b", c):
        return "console"
    if re.search(r"\b(mvn|mvnw)\b", c):
        return "maven"
    if re.search(r"\b(gradle|gradlew)\b", c):
        return "gradle"
    if re.search(r"\bgo\b", c):
        return "go"
    if re.search(r"\bcomposer\b", c):
        return "composer"
    if re.search(r"\bmake\b", c):
        return "make"
    if re.search(r"\btask\b", c):
        return "task"
    if re.search(r"\bbin/", c):
        return "bin"
    return "other"


def _command_ok(token: str, kind: str, commands: set[str]) -> bool:
    if not token or is_placeholder_cite(token) or "<" in token:
        return True
    if token in {"docker", "compose"}:
        return True
    if token in PM_BUILTINS or token in RUNNER_BUILTINS:
        return True
    if token in commands:
        return True
    if kind in {"rails", "artisan", "console", "go", "maven"}:
        return True
    if not commands:
        return True
    if "package" in token.lower():
        return True
    return False


def _manifest_command_label(manifests: list[str]) -> str:
    if not manifests:
        return "discovered manifest scripts (repo root only)"
    if len(manifests) == 1:
        return f"`{manifests[0]}` scripts (repo root only; workspace packages are not scanned)"
    joined = ", ".join(f"`{m}`" for m in manifests)
    return f"{joined} scripts (repo root only; workspace packages are not scanned)"


def _command_findings(
    text: str,
    src: str,
    commands: set[str] | list[str],
    manifests: list[str],
    finding_id: list[int],
) -> list[Finding]:
    findings: list[Finding] = []
    cmd_set = set(commands)
    seen_claims: set[str] = set()
    manifest_label = _manifest_command_label(manifests)
    sorted_scripts = sorted(cmd_set)
    for cre in COMMAND_CITE_RES:
        for m in cre.finditer(text):
            cite = m.group(0)
            if cite in seen_claims:
                continue
            if "<" in cite:
                continue
            kind = _runner_kind(cite)
            tokens = [g for g in m.groups() if g]
            if not tokens:
                continue
            bad = None
            if kind == "bin" and tokens:
                bin_name = tokens[0]
                if bin_name not in cmd_set and bin_name not in RUNNER_BUILTINS:
                    if cmd_set:
                        bad = bin_name
                elif len(tokens) > 1 and not _command_ok(tokens[1], "rails", cmd_set):
                    if ":" in tokens[1] and tokens[1] not in cmd_set:
                        bad = tokens[1]
            else:
                token = tokens[-1]
                if not _command_ok(token, kind, cmd_set):
                    bad = token
            if not bad:
                continue
            seen_claims.add(cite)
            finding_id[0] += 1
            findings.append(
                Finding(
                    id=f"A{finding_id[0]:03d}",
                    severity="BROKEN",
                    source=src,
                    claim=f"Command cite `{cite}`",
                    reality=f"Script/task `{bad}` not in discovered manifest scripts",
                    evidence=f"manifest_commands missing `{bad}`",
                    kind="command",
                    cite=cite.strip("`"),
                    looked_for=bad,
                    missing_script=bad,
                    manifests=list(manifests),
                    action=(
                        f"Add a script named `{bad}` to {manifest_label}, "
                        f"or change the cite in `{src}` to an existing command."
                    ),
                )
            )
    return findings


def _format_script_sample(commands: set[str], *, limit: int = 12) -> str:
    if not commands:
        return "(none discovered)"
    sample = sorted(commands)[:limit]
    text = ", ".join(f"`{s}`" for s in sample)
    if len(commands) > limit:
        text += f", … ({len(commands)} total)"
    return text


def render_problem_card(f: Finding, commands: set[str]) -> list[str]:
    lines = [f"### {f.id} — {problem_title(f)}", ""]
    lines.append(f"- **In:** `{f.source}`")
    if f.kind == "command":
        lines.append(f"- **The instruction says:** `{f.cite}`")
        manifest_label = _manifest_command_label(f.manifests)
        lines.append(f"- **Looked in:** {manifest_label}")
        lines.append(f"- **Missing script/task:** `{f.missing_script or f.looked_for}`")
        lines.append(f"- **Known scripts:** {_format_script_sample(commands)}")
    elif f.kind == "skill":
        lines.append(f"- **The instruction says:** skill `{f.cite}`")
        lines.append(f"- **Looked for:** `{f.looked_for}`")
    elif f.kind == "inventory":
        lines.append(f"- **Listed in inventory:** `{f.cite}`")
        lines.append(f"- **Looked for:** `{f.looked_for}` on disk")
    else:
        lines.append(f"- **The instruction says:** `{f.cite or f.claim}`")
        lines.append(f"- **Looked for:** `{f.looked_for}` at repo root (case-sensitive)")
        if f.tried:
            tried_show = ", ".join(f"`{t}`" for t in f.tried[:6])
            lines.append(f"- **Also tried:** {tried_show}")
        if f.possible_matches:
            hints = ", ".join(f"`{p}`" for p in f.possible_matches)
            lines.append(
                f"- **Possible matches (filename only, not verified):** {hints}"
            )
    lines.append(f"- **Do this:** {f.action}")
    lines.append(f"- **Details (legacy):** {f.reality} — {f.evidence}")
    lines.append("")
    return lines


def render_report(
    out_path: Path,
    inventory: dict,
    findings: list[Finding],
    ok_cites: list[OkCite],
    commands: set[str],
    *,
    generated_at: str,
) -> None:
    broken = sum(1 for f in findings if f.severity == "BROKEN")
    t0 = inventory.get("t0", [])
    t1 = inventory.get("t1", [])
    t2 = inventory.get("t2", [])
    manifests = inventory.get("manifests") or []
    files_scanned = len(t0) + len(t1) + len(t2)
    manifest_label = _manifest_command_label(manifests)

    lines = [
        "# Track A — Correctness (broken paths and commands)",
        "",
        "**Diagnosis only** — agent instructions (`AGENTS.md`, rules, skills) were not edited.",
        "**Question:** Do paths and commands cited in the harness exist on disk and in discovered manifests?",
        "",
        f"_Generated: {generated_at} · Method: deterministic path/command checks (no README)_",
        "",
        "## At a glance",
        "",
        f"- **{broken} problem{'s' if broken != 1 else ''}** to fix · **{len(ok_cites)}** path cite{'s' if len(ok_cites) != 1 else ''} OK",
        f"- **Files scanned:** {files_scanned} (always-on rules + skills + cited refs)",
        f"- **Command lookup:** {manifest_label}",
        "",
        "## What to do next",
        "",
    ]
    if broken:
        lines += [
            f"1. Fix or restore the **{broken}** cite{'s' if broken != 1 else ''} in **Problems** below. Do not delete harness files just because this report flagged them.",
            "2. Re-run Track A (`track_a_correctness.py`) until **At a glance** shows **0 problems**.",
            "3. Optional: ask the agent to apply the fixes in a PR.",
            "",
        ]
    else:
        lines += [
            "1. No broken path or command cites were found — nothing to fix for Track A.",
            "2. Optional: run Track B (redundancy) or Track C (usefulness) if you opted in at Q2.",
            "",
        ]

    lines += [f"## Problems ({broken})", ""]
    if not findings:
        lines.append("_No broken path or command cites._")
        lines.append("")
    else:
        for f in findings:
            lines.extend(render_problem_card(f, commands))

    lines += [f"## Checked and OK ({len(ok_cites)})", ""]
    if not ok_cites:
        lines.append("_No concrete path cites resolved in this run._")
    else:
        for ok in ok_cites:
            lines.append(f"- `{ok.cite}` in `{ok.source}`")
    lines.append("")

    lines += [
        "## What was scanned",
        "",
        f"- **Always-on rules (T0):** {len(t0)} file{'s' if len(t0) != 1 else ''}",
    ]
    for p in t0:
        lines.append(f"  - `{p}`")
    lines += [f"- **Skills (T1):** {len(t1)} file{'s' if len(t1) != 1 else ''}"]
    for p in t1:
        lines.append(f"  - `{p}`")
    lines += [f"- **Cited refs (T2):** {len(t2)} file{'s' if len(t2) != 1 else ''}"]
    for p in t2:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines += [
        "## How this check works",
        "",
        "This track answers: *is the harness factually wrong about paths/commands?* "
        "Not redundancy (`07-agreement.md`) or usefulness (`10-usefulness-agreement.md`).",
        "",
        "### Terms",
        "",
        "| Term | Meaning | You should |",
        "|------|---------|------------|",
        "| **Problem / BROKEN** | A cited path or command does not exist (high-precision check) | Fix the cite or restore the file |",
        "| **OK path cite** | Concrete path cite that resolved | No action |",
        "| **T0 / T1 / T2** | Always-on rules / skills / cited harness refs | Fix T0 cites first (always loaded) |",
        "",
        "### Rules (precision)",
        "",
        "- Path normalization preserves `.agents` (never `str.lstrip('./')`).",
        "- Placeholders and bare example filenames are skipped.",
        "- Fenced code blocks are not scanned for path cites.",
        "- `references/` may resolve under a skill named in the same surface (e.g. load `dev`).",
        "- Missing `app/`/`lib/`/`test/` cites are BROKEN only when mandate language is nearby.",
        "- **Possible matches** are basename hints only — verify before changing a cite.",
        "- Command checks use manifests discovered at the **repo root**; workspace package scripts are not scanned unless cited manifests include them.",
        "",
    ]
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--out-base", type=Path, default=None)
    args = ap.parse_args()
    root = args.root.resolve()
    out = args.out_base or default_out(root, args.run_id)
    inv_path = out / "inventory.json"
    if not inv_path.is_file():
        print(f"Missing {inv_path}; run inventory_extract.py first", file=sys.stderr)
        return 1
    inventory = json.loads(inv_path.read_text(encoding="utf-8"))
    commands = set(inventory.get("manifest_commands") or [])
    manifests = list(inventory.get("manifests") or [])

    finding_id = [0]
    findings: list[Finding] = []
    ok_cites: list[OkCite] = []
    for rel_s in inventory.get("t0", []) + inventory.get("t1", []) + inventory.get("t2", []):
        p = root / rel_s
        if not p.is_file():
            finding_id[0] += 1
            abs_path = str(p)
            findings.append(
                Finding(
                    id=f"A{finding_id[0]:03d}",
                    severity="BROKEN",
                    source=rel_s,
                    claim="Inventory lists this file",
                    reality="Missing on disk",
                    evidence=rel_s,
                    kind="inventory",
                    cite=rel_s,
                    looked_for=rel_s,
                    action=f"Restore `{rel_s}` or re-run inventory after moving harness files.",
                    absolute_evidence=abs_path,
                )
            )
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for cite in extract_surface_cites(text):
            if is_placeholder_cite(cite) or not is_concrete_checkable_cite(cite):
                continue
            resolved, _ = resolve_cite(root, p, cite, text=text)
            if resolved:
                ok_cites.append(OkCite(source=rel_s, cite=cite))
            elif is_code_tree_cite(cite) and not has_mandate_near_cite(text, cite):
                pass
        findings.extend(check_file(root, p, commands, manifests, finding_id))

    seen = set()
    uniq: list[Finding] = []
    for f in findings:
        key = (f.source, f.claim, f.severity)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(f)

    generated_at = datetime.now(timezone.utc).isoformat()
    render_report(
        out / "04-correctness.md",
        inventory,
        uniq,
        ok_cites,
        commands,
        generated_at=generated_at,
    )
    (out / "04-correctness.json").write_text(
        json.dumps([asdict(f) for f in uniq], indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "run_id": args.run_id,
                "findings": len(uniq),
                "broken": sum(1 for f in uniq if f.severity == "BROKEN"),
                "ok_cites": len(ok_cites),
                "report": str(out / "04-correctness.md"),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

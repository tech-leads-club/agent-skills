#!/usr/bin/env python3
"""Track A — high-precision deterministic correctness. Lives inside harness-eval skill."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
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
# invariant: PM builtins alone never BROKEN
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
    "exec",
    "check",
    "require",
    "dump-autoload",
    "dumpautoload",
    "validate",
}
# invariant: lifecycle verbs are not project-script names
RUNNER_BUILTINS = {
    "nx",
    "run",
    "run-many",
    "affected",
    "test",
    "build",
    "run",
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
    "generate",
    "routes",
    "runner",
    "new",
    "list",
    "help",
}

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
    # why: go run ./... is covered by RUNNER_BUILTINS; only custom tokens remain
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
class Finding:
    id: str
    severity: str
    source: str
    claim: str
    reality: str
    evidence: str


def default_out(root: Path, run_id: str) -> Path:
    return root / ".tlc" / "harness-eval" / "runs" / run_id


def rel(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def is_readme(path: str) -> bool:
    return bool(README_RE.search(path.replace("\\", "/")))


def normalize_cite(cite: str) -> str:
    c = cite.strip().strip("\"'")
    while c.startswith("./"):
        c = c[2:]
    return c


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


def resolve_cite(root: Path, source: Path, cite: str) -> tuple[Path | None, list[str]]:
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


def check_file(root: Path, source: Path, commands: set[str], finding_id: list[int]) -> list[Finding]:
    findings: list[Finding] = []
    text = source.read_text(encoding="utf-8", errors="replace")
    src = rel(root, source)

    for cite in extract_cites(text):
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
                    )
                )
            continue
        if not is_concrete_checkable_cite(cite):
            continue
        resolved, tried = resolve_cite(root, source, cite)
        if resolved:
            continue
        case_hit = next((t for t in tried if t.startswith("case-mismatch:")), None)
        finding_id[0] += 1
        findings.append(
            Finding(
                id=f"A{finding_id[0]:03d}",
                severity="BROKEN",
                source=src,
                claim=f"Path cite `{cite}`",
                reality=(
                    f"Case mismatch; found {case_hit.split(':', 1)[1]}"
                    if case_hit
                    else "File does not exist (case-sensitive check)"
                ),
                evidence="; ".join(tried[:4]),
            )
        )

    findings.extend(
        _command_findings(text, src, commands, finding_id)
    )
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
    # why: framework CLIs expose many subcommands absent from manifests; only flag discovered project scripts
    if kind in {"rails", "artisan", "console", "go", "maven"}:
        return True
    if not commands:
        return True
    if "package" in token.lower():
        return True
    return False


def _command_findings(
    text: str,
    src: str,
    commands: set[str] | list[str],
    finding_id: list[int],
) -> list[Finding]:
    findings: list[Finding] = []
    cmd_set = set(commands)
    seen_claims: set[str] = set()
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
                    # why: only rake-like namespaced tasks are checkable against discovered tasks
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
                )
            )
    return findings


def render_report(out_path: Path, inventory: dict, findings: list[Finding], ok_count: int) -> None:
    broken = sum(1 for f in findings if f.severity == "BROKEN")
    lines = [
        "# Harness Eval: Correctness (Track A)",
        "",
        f"> Generated: {datetime.now(timezone.utc).isoformat()}",
        "> Method: deterministic path/command checks (no README)",
        "",
        "## What these words mean",
        "",
        "| Word | Meaning | You should |",
        "|------|---------|------------|",
        "| **BROKEN** | A cited path or command does not exist (high-precision check) | Fix the cite or restore the file |",
        "| **OK path-cites** | Concrete path cites that resolved | No action |",
        "",
        "This track answers: *is the harness factually wrong about paths/commands?* "
        "Not redundancy (`07`) or usefulness (`10`).",
        "",
        "## Executive summary",
        "",
        f"- T0: {len(inventory.get('t0', []))} · T1: {len(inventory.get('t1', []))} · T2: {len(inventory.get('t2', []))}",
        f"- Manifests: {', '.join(inventory.get('manifests') or []) or '(none)'}",
        f"- Findings: **{broken} broken** · {ok_count} path-cites ok",
        "",
        "## Inventory",
        "",
        "### T0",
        "",
    ]
    for p in inventory.get("t0", []):
        lines.append(f"- `{p}`")
    lines += ["", "### T1", ""]
    for p in inventory.get("t1", []):
        lines.append(f"- `{p}`")
    lines += ["", "### T2", ""]
    for p in inventory.get("t2", []):
        lines.append(f"- `{p}`")
    lines += ["", "## Findings", ""]
    if not findings:
        lines.append("_No BROKEN path/command findings._")
    for f in findings:
        lines += [
            f"### [{f.id}] {f.severity}",
            "",
            f"- **Source:** `{f.source}`",
            f"- **Claim:** {f.claim}",
            f"- **Reality:** {f.reality}",
            f"- **Evidence:** {f.evidence}",
            "",
        ]
    lines += [
        "## Notes",
        "",
        "- Path normalization preserves `.agents` (never `str.lstrip('./')`).",
        "- Placeholders and bare example filenames are skipped.",
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

    finding_id = [0]
    findings: list[Finding] = []
    ok_cites = 0
    for rel_s in inventory.get("t0", []) + inventory.get("t1", []) + inventory.get("t2", []):
        p = root / rel_s
        if not p.is_file():
            finding_id[0] += 1
            findings.append(
                Finding(
                    id=f"A{finding_id[0]:03d}",
                    severity="BROKEN",
                    source=rel_s,
                    claim="Inventory lists this file",
                    reality="Missing on disk",
                    evidence=str(p),
                )
            )
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for cite in extract_cites(text):
            if is_placeholder_cite(cite) or not is_concrete_checkable_cite(cite):
                continue
            resolved, _ = resolve_cite(root, p, cite)
            if resolved:
                ok_cites += 1
        findings.extend(check_file(root, p, commands, finding_id))

    seen = set()
    uniq: list[Finding] = []
    for f in findings:
        key = (f.source, f.claim, f.severity)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(f)

    render_report(out / "04-correctness.md", inventory, uniq, ok_cites)
    (out / "04-correctness.json").write_text(json.dumps([asdict(f) for f in uniq], indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"run_id": args.run_id, "findings": len(uniq), "broken": sum(1 for f in uniq if f.severity == "BROKEN"), "report": str(out / "04-correctness.md")}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())

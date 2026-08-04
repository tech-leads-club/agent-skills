#!/usr/bin/env python3
"""Inventory harness surfaces, extract claims, inject plants. Lives inside harness-eval skill."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

T0_NAMES = ("AGENTS.md", "CLAUDE.md", ".cursorrules")
T0_GLOBS = (".cursor/rules/**/*", ".agents/**/*.mdc", ".cursor/**/*.mdc", "*.mdc")
T1_SKILL_GLOBS = (".agents/skills/**/SKILL.md", ".cursor/skills/**/SKILL.md")
# invariant: discovery is presence-based; no stack assumed at runtime
MANIFEST_FILES = (
    "package.json",
    "pyproject.toml",
    "Makefile",
    "Taskfile.yml",
    "Taskfile.yaml",
    "Cargo.toml",
    "go.mod",
    "composer.json",
    "artisan",  # why: presence signals Laravel CLI without parsing the file
    "Gemfile",
    "Rakefile",
    "rakefile",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
)
README_RE = re.compile(r"(^|/)README[^/]*$", re.I)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
BULLET_RE = re.compile(r"^(\s*)([-*+]|\d+\.)\s+(.*)$")
BACKTICK_PATH_RE = re.compile(r"`([^`]+)`|(?<!!)\[[^\]]*\]\(([^)]+)\)")
SKILL_SKIP_AFTER = re.compile(
    r"^(#{1,6})\s+(examples?|references?|resources?|appendix|changelog|troubleshooting).*$",
    re.I,
)
TABLE_SEP_RE = re.compile(r"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$")
FENCE_RE = re.compile(r"^```")
GENERIC_FLUFF = (
    "Prefer clear variable names and small functions when writing code.",
    "Keep layers thin and delegate work to the appropriate lower layer.",
)


@dataclass
class Claim:
    id: str
    tier: str
    source: str
    quote: str
    is_plant: bool
    section: str = ""
    plant_template: str | None = None


@dataclass
class Inventory:
    root: str
    generated_at: str
    t0: list[str] = field(default_factory=list)
    t1: list[str] = field(default_factory=list)
    t2: list[str] = field(default_factory=list)
    manifests: list[str] = field(default_factory=list)
    manifest_commands: list[str] = field(default_factory=list)


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


def glob_files(root: Path, pattern: str) -> list[Path]:
    return sorted(p for p in root.glob(pattern) if p.is_file())


def discover_t0(root: Path) -> list[Path]:
    found: set[Path] = set()
    for name in T0_NAMES:
        p = root / name
        if p.is_file():
            found.add(p.resolve())
    for pattern in T0_GLOBS:
        for p in glob_files(root, pattern):
            if not is_readme(rel(root, p)):
                found.add(p.resolve())
    return sorted(found)


def discover_t1_skills(root: Path) -> list[Path]:
    found: set[Path] = set()
    for pattern in T1_SKILL_GLOBS:
        for p in glob_files(root, pattern):
            found.add(p.resolve())
    return sorted(found)


def resolve_skill_by_name(root: Path, name: str) -> Path | None:
    """Resolve a skill folder name or SKILL.md path under known skill roots."""
    name = name.strip().strip("`\"'")
    if not name:
        return None
    if name.endswith("/SKILL.md") or name.endswith("SKILL.md"):
        p = resolve_cite(root, root / "AGENTS.md", name)
        return p if p and p.name == "SKILL.md" else None
    for base in (".agents/skills", ".cursor/skills"):
        cand = root / base / name / "SKILL.md"
        if cand.is_file():
            return cand.resolve()
    return None


def extract_skill_refs(root: Path, text: str) -> list[Path]:
    """Find skill SKILL.md files cited by path or bare name from a surface."""
    found: set[Path] = set()
    for cite in extract_outbound_paths(text):
        resolved = resolve_cite(root, root / "AGENTS.md", cite)
        # invariant: only SKILL.md cites pull a skill in; skill-internal refs do not
        if resolved and resolved.name == "SKILL.md":
            found.add(resolved)
    for m in re.finditer(
        r"`([a-z][a-z0-9-]{1,64})`(?:\s+skill)?|\b([a-z][a-z0-9-]{1,64})\s+skill\b",
        text,
        re.I,
    ):
        raw = m.group(1) or m.group(2)
        if not raw:
            continue
        # why: common English nouns collide with skill-id patterns
        if raw in {"package", "module", "shared", "project", "service", "system"}:
            continue
        sk = resolve_skill_by_name(root, raw)
        if sk:
            found.add(sk)
    return sorted(found)


def discover_from_seeds(root: Path, seeds: list[Path]) -> tuple[list[Path], list[Path], list[Path]]:
    """T0 = seeds; T1 = skills one-hop from seeds; T2 = docs/refs one-hop from T0+T1."""
    t0 = sorted({p.resolve() for p in seeds if p.is_file()})
    t1: set[Path] = set()
    for src in t0:
        text = src.read_text(encoding="utf-8", errors="replace")
        for sk in extract_skill_refs(root, text):
            t1.add(sk)
    t1_list = sorted(t1)
    t2 = discover_t2(root, t0, t1_list)
    return t0, t1_list, t2


BARE_PATH_RE = re.compile(
    r"(?<![A-Za-z0-9_./-])((?:references|docs|\.agents|\.cursor|\.tlc|package|app)/"
    r"[A-Za-z0-9_./-]+\.(?:md|mdc|json|yml|yaml|ts|js|py))"
)


def strip_fenced_code(text: str) -> str:
    """Remove fenced code blocks so unmatched backticks inside do not poison path scans."""
    return re.sub(r"```.*?```", "\n", text, flags=re.S)


def extract_outbound_paths(text: str) -> list[str]:
    paths: list[str] = []
    cleaned = strip_fenced_code(text)
    for m in BACKTICK_PATH_RE.finditer(cleaned):
        raw = (m.group(1) or m.group(2) or "").strip()
        if not raw or raw.startswith(("http://", "https://", "#", "mailto:")):
            continue
        # hazard: unmatched backticks can swallow table rows into fake paths
        if "\n" in raw or len(raw) > 240:
            continue
        parts = raw.split()
        if not parts:
            continue
        raw = parts[0].split("#")[0].strip("\"'")
        if not raw:
            continue
        if "/" in raw or raw.endswith((".md", ".mdc", ".ts", ".js", ".py", ".json")):
            paths.append(raw)
        elif raw.startswith(("docs/", ".agents/", ".cursor/", "package/", "app/", "references/")):
            paths.append(raw)
    # why: decision tables often omit backticks around paths
    for m in BARE_PATH_RE.finditer(cleaned):
        paths.append(m.group(1))
    seen: set[str] = set()
    out: list[str] = []
    for p in paths:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def resolve_cite(root: Path, source: Path, cite: str) -> Path | None:
    cite = normalize_cite(cite)
    candidates = [root / cite, source.parent / cite, (source.parent / cite).resolve()]
    if cite.startswith("../"):
        candidates.append((source.parent / cite).resolve())
    for c in candidates:
        try:
            if c.is_file():
                return c.resolve()
        except OSError:
            continue
    return None


def discover_t2(root: Path, t0: list[Path], t1: list[Path]) -> list[Path]:
    found: set[Path] = set()
    skill_set = {p.resolve() for p in t1}
    t0_set = {p.resolve() for p in t0}
    for src in t0 + t1:
        text = src.read_text(encoding="utf-8", errors="replace")
        for cite in extract_outbound_paths(text):
            if is_readme(cite):
                continue
            resolved = resolve_cite(root, src, cite)
            if not resolved:
                continue
            if resolved in skill_set and resolved.name == "SKILL.md":
                continue
            if resolved in t0_set:
                continue
            rel_s = rel(root, resolved)
            if resolved.suffix.lower() in {".md", ".mdc", ".json", ".yml", ".yaml"} or "references" in rel_s:
                if not is_readme(rel_s):
                    found.add(resolved)
    return sorted(found)


def _uniq(seq: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for c in seq:
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _parse_makefile_targets(text: str) -> list[str]:
    cmds = []
    for line in text.splitlines():
        m = re.match(r"^([A-Za-z0-9_.-]+)\s*:", line)
        if m and not m.group(1).startswith("."):
            cmds.append(m.group(1))
    return cmds


def _parse_taskfile_tasks(text: str) -> list[str]:
    """Best-effort Taskfile (YAML) task names under a top-level `tasks:` map."""
    cmds: list[str] = []
    in_tasks = False
    for line in text.splitlines():
        if re.match(r"^tasks:\s*$", line):
            in_tasks = True
            continue
        if in_tasks:
            if line and not line[0].isspace() and not line.startswith("#"):
                # why: any non-indented key ends the tasks: map
                if not line.startswith("tasks:"):
                    in_tasks = False
                continue
            m = re.match(r"^  ([A-Za-z0-9_.:/-]+):\s*(?:#.*)?$", line)
            if m and m.group(1) not in {"vars", "env", "cmds", "desc", "dir", "deps", "label"}:
                cmds.append(m.group(1))
    return cmds


def _parse_rakefile_tasks(text: str) -> list[str]:
    """Collect rake task names; join nested `namespace` when trivial."""
    cmds: list[str] = []
    ns: list[str] = []
    for line in text.splitlines():
        stripped = line.split("#", 1)[0].rstrip()
        if not stripped.strip():
            continue
        nm = re.match(r"^(\s*)namespace\s+(?::([A-Za-z0-9_]+)|['\"]([A-Za-z0-9_:]+)['\"])", stripped)
        if nm:
            indent = len(nm.group(1).replace("\t", "  "))
            while ns and ns[-1][0] >= indent:
                ns.pop()
            name = nm.group(2) or nm.group(3)
            ns.append((indent, name))
            continue
        tm = re.match(
            r"^(\s*)task\s+(?::([A-Za-z0-9_]+)|['\"]([A-Za-z0-9_:]+)['\"])",
            stripped,
        )
        if tm:
            indent = len(tm.group(1).replace("\t", "  "))
            while ns and ns[-1][0] >= indent:
                ns.pop()
            task = tm.group(2) or tm.group(3)
            prefix = ":".join(n for _, n in ns)
            cmds.append(f"{prefix}:{task}" if prefix else task)
            continue
        if re.match(r"^\s*end\b", stripped) and ns:
            # why: rake namespaces are indentation/end-delimited; parser is approximate
            indent = len(re.match(r"^(\s*)", stripped).group(1).replace("\t", "  "))
            while ns and ns[-1][0] >= indent:
                ns.pop()
    return cmds


def _parse_gradle_tasks(text: str) -> list[str]:
    cmds: list[str] = []
    for m in re.finditer(
        r"(?:tasks\.(?:register|create|named)\s*\(\s*[\"']([A-Za-z0-9_./-]+)[\"']"
        r"|^\s*task\s+[\"']?([A-Za-z0-9_./-]+)[\"']?\s*[({])",
        text,
        re.M,
    ):
        cmds.append(m.group(1) or m.group(2))
    return cmds


def _parse_pom_exec_ids(text: str) -> list[str]:
    """Maven: collect plugin execution <id> values as weak custom-command signals."""
    return re.findall(r"<id>\s*([A-Za-z0-9_./-]+)\s*</id>", text)


def _discover_bin_commands(root: Path) -> tuple[list[str], list[str]]:
    """bin/* entrypoints (Rails, Go, generic). Returns (manifest_labels, command_names)."""
    bin_dir = root / "bin"
    if not bin_dir.is_dir():
        return [], []
    labels: list[str] = []
    cmds: list[str] = []
    for p in sorted(bin_dir.iterdir()):
        if not p.is_file():
            continue
        if p.name.startswith("."):
            continue
        if p.suffix.lower() in {".md", ".txt", ".json", ".yml", ".yaml"}:
            continue
        labels.append(f"bin/{p.name}")
        cmds.append(p.name)
    return labels, cmds


def load_manifest_commands(root: Path) -> tuple[list[str], list[str]]:
    manifests: list[str] = []
    commands: list[str] = []
    seen_files: set[Path] = set()

    for name in MANIFEST_FILES:
        p = root / name
        if not p.is_file():
            continue
        try:
            resolved = p.resolve()
        except OSError:
            resolved = p
        if resolved in seen_files:
            continue
        seen_files.add(resolved)
        manifests.append(name)
        text = p.read_text(encoding="utf-8", errors="replace")
        if name == "package.json":
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            scripts = data.get("scripts") or {}
            if isinstance(scripts, dict):
                commands.extend(scripts.keys())
        elif name == "Makefile":
            commands.extend(_parse_makefile_targets(text))
        elif name in {"Taskfile.yml", "Taskfile.yaml"}:
            commands.extend(_parse_taskfile_tasks(text))
        elif name == "pyproject.toml":
            in_scripts = False
            for line in text.splitlines():
                if re.match(r"^\[project\.scripts\]", line):
                    in_scripts = True
                    continue
                if line.startswith("[") and in_scripts:
                    in_scripts = False
                if in_scripts:
                    m = re.match(r"^([A-Za-z0-9_-]+)\s*=", line)
                    if m:
                        commands.append(m.group(1))
        elif name == "composer.json":
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            scripts = data.get("scripts") or {}
            if isinstance(scripts, dict):
                commands.extend(scripts.keys())
        elif name in {"Rakefile", "rakefile"}:
            commands.extend(_parse_rakefile_tasks(text))
        elif name in {"build.gradle", "build.gradle.kts"}:
            commands.extend(_parse_gradle_tasks(text))
        elif name == "pom.xml":
            commands.extend(_parse_pom_exec_ids(text))
        elif name == "Gemfile":
            # why: Gemfile has no task names; tasks live in Rakefile/bin
            pass
        elif name == "go.mod":
            # why: go.mod has no task names; tasks live in Makefile/Taskfile/bin
            pass
        elif name == "artisan":
            commands.append("artisan")
        elif name.startswith("settings.gradle"):
            pass
        elif name == "Cargo.toml":
            # hazard: dependency package names must not be treated as bin commands
            for m in re.finditer(
                r"\[\[bin\]\][^\[]*?name\s*=\s*\"([A-Za-z0-9_./-]+)\"",
                text,
                re.S,
            ):
                commands.append(m.group(1))

    for console in (
        root / "bin" / "console",
        root / "app" / "console",
    ):
        if console.is_file():
            rel_c = rel(root, console)
            if rel_c not in manifests:
                manifests.append(rel_c)
            commands.append("console")

    bin_labels, bin_cmds = _discover_bin_commands(root)
    for lab in bin_labels:
        if lab not in manifests:
            manifests.append(lab)
    commands.extend(bin_cmds)

    return manifests, _uniq(commands)


def strip_frontmatter(text: str) -> tuple[str, str]:
    if not text.startswith("---"):
        return "", text
    end = text.find("\n---", 3)
    if end == -1:
        return "", text
    return text[3:end].strip(), text[end + 4 :].lstrip("\n")


def frontmatter_description(fm: str) -> str:
    m = re.search(r"^description:\s*(.+)$", fm, re.M)
    if not m:
        return ""
    val = m.group(1).strip()
    if val in ("|", ">"):
        lines = []
        after = fm.split(m.group(0), 1)[1]
        for line in after.splitlines()[1:]:
            if line.startswith("  ") or line.startswith("\t"):
                lines.append(line.strip())
            elif not line.strip():
                if lines:
                    break
            else:
                break
        return " ".join(lines).strip()
    return val.strip("\"'")


def _is_noise_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if FENCE_RE.match(s) or TABLE_SEP_RE.match(s):
        return True
    if s in {"---", "***", "___"}:
        return True
    if s.startswith(("<!--", "-->")):
        return True
    if re.fullmatch(r"[|:\s-]+", s):
        return True
    return False


def iter_atomic_from_text(text: str, *, skill_mode: bool) -> Iterable[tuple[str, str]]:
    """Yield (section, quote) for every substantial instruction line.

    skill_mode still skips Examples/References-style sections (noise), but no longer
    limits extraction to Critical/Important headings or Never/Always lead-ins.
    """
    section = ""
    skip_section = False
    skip_level = 0
    in_fence = False
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if FENCE_RE.match(line.strip()):
            in_fence = not in_fence
            i += 1
            continue
        if in_fence:
            i += 1
            continue
        hm = HEADING_RE.match(line)
        if hm:
            level = len(hm.group(1))
            section = hm.group(2).strip()
            if skill_mode:
                if SKILL_SKIP_AFTER.match(line):
                    skip_section = True
                    skip_level = level
                elif skip_section and level <= skip_level:
                    skip_section = False
                    skip_level = 0
            i += 1
            continue
        if skill_mode and skip_section:
            i += 1
            continue
        if _is_noise_line(line):
            i += 1
            continue
        bm = BULLET_RE.match(line)
        if bm:
            quote = bm.group(3).strip()
            j = i + 1
            while j < len(lines):
                nxt = lines[j]
                if not nxt.strip() or HEADING_RE.match(nxt) or BULLET_RE.match(nxt) or FENCE_RE.match(nxt.strip()):
                    break
                if nxt.startswith("  ") or nxt.startswith("\t"):
                    quote += " " + nxt.strip()
                    j += 1
                    continue
                break
            quote = re.sub(r"\s+", " ", quote).strip()
            if len(quote) >= 20:
                yield section, quote
            i = j
            continue
        # why: claims are any substantial prose line, not only IMPORTANT/Never lead-ins
        q = line.strip().lstrip("> ").strip()
        if len(q) >= 20 and not q.startswith("|"):
            yield section, re.sub(r"\s+", " ", q)
        i += 1


def extract_claims_from_file(root: Path, path: Path, *, skill_mode: bool) -> list[tuple[str, str, str]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    fm, body = strip_frontmatter(text)
    out: list[tuple[str, str, str]] = []
    src = rel(root, path)
    if skill_mode and fm:
        desc = frontmatter_description(fm)
        if desc and len(desc) >= 20:
            out.append((src, "frontmatter:description", desc[:500]))
    for section, quote in iter_atomic_from_text(body, skill_mode=skill_mode):
        out.append((src, section, quote[:800]))
    return out


# invariant: judge-facing tier/source must not reveal plants (trap-key keeps the truth)
_PLANT_DECK = {
    "manifest_echo": ("T0", "AGENTS.md"),
    "generic_fluff": ("T1", ".agents/skills/workflow-tips/SKILL.md"),
    "policy_echo": ("T0", "AGENTS.md"),
    "caveat_echo": ("T0", "AGENTS.md"),
}


def build_plants(commands: list[str]) -> list[Claim]:
    plants: list[Claim] = []
    echoes = list(commands[:2])
    while len(echoes) < 2 and commands:
        echoes.append(commands[0])
    for idx, cmd in enumerate(echoes[:2]):
        tier, source = _PLANT_DECK["manifest_echo"]
        plants.append(
            Claim(
                id=f"P{idx+1:03d}",
                tier=tier,
                source=source,
                quote=f"Run the project script `{cmd}` when you need that workflow.",
                is_plant=True,
                plant_template="manifest_echo",
            )
        )
    for idx, fluff in enumerate(GENERIC_FLUFF):
        tier, source = _PLANT_DECK["generic_fluff"]
        plants.append(
            Claim(
                id=f"P{idx+3:03d}",
                tier=tier,
                source=source,
                quote=fluff,
                is_plant=True,
                plant_template="generic_fluff",
            )
        )
    tier, source = _PLANT_DECK["policy_echo"]
    plants.append(
        Claim(
            id="P005",
            tier=tier,
            source=source,
            quote=(
                "Never commit secrets, API keys, or credentials into the repository; "
                "use environment configuration outside version control."
            ),
            is_plant=True,
            plant_template="policy_echo",
        )
    )
    tier, source = _PLANT_DECK["caveat_echo"]
    plants.append(
        Claim(
            id="P006",
            tier=tier,
            source=source,
            quote=(
                "Known caveat: commands that pass locally can still fail in CI when they "
                "depend on machine-local env vars or secrets that are not present in the "
                "pipeline; prefer the project's documented CI entrypoint when validating."
            ),
            is_plant=True,
            plant_template="caveat_echo",
        )
    )
    return plants


def write_claims_md(path: Path, claims: list[Claim], run_id: str) -> None:
    lines = [
        f"# Blind claim deck — run `{run_id}`",
        "",
        "> Score every row. Some rows may be synthetic calibration rows.",
        "> Do NOT read trap-key.json, claims.jsonl, Judge1 scores, or prior agreement reports.",
        "> README is out of harness scope — do not cite it as rediscovery evidence.",
        "",
        "## Rubric",
        "",
        "| Cost | Meaning |",
        "|------|---------|",
        "| 0 | Exact string in a discovered manifest/config |",
        "| 1 | Obvious from one directory listing or one file header |",
        "| 2 | Needs reading implementation across modules |",
        "| 3 | Runtime failure, environment-specific, or process/policy |",
        "",
        "Classes: REDUNDANT-CODE | REDUNDANT-GENERAL | KEEP-POLICY | KEEP-CAVEAT | KEEP-ROUTING | KEEP-COMPRESSED | UNCLEAR",
        "",
        "**Hard rule:** cost ≥ 2 → never REDUNDANT-*. Default UNCLEAR/KEEP when unsure.",
        "",
        "## Claims",
        "",
        "| ID | Tier | Source | Quote |",
        "|----|------|--------|-------|",
    ]
    for c in claims:
        q = c.quote.replace("|", "\\|").replace("\n", " ")
        src = c.source.replace("|", "\\|")
        lines.append(f"| {c.id} | {c.tier} | `{src}` | {q} |")
    lines += [
        "",
        "## Output",
        "",
        "Write scores as a table: `| ID | Cost | Class | Evidence | Confidence | Trim suggestion |`",
        "",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--out-base", type=Path, default=None)
    ap.add_argument(
        "--seed",
        action="append",
        default=[],
        help="Scope inventory to these T0 files and one-hop related skills/docs "
        "(repeatable). Example: --seed AGENTS.md",
    )
    args = ap.parse_args()
    root = args.root.resolve()
    out = args.out_base or default_out(root, args.run_id)
    out.mkdir(parents=True, exist_ok=True)

    if args.seed:
        seeds: list[Path] = []
        for s in args.seed:
            p = Path(s)
            if not p.is_absolute():
                p = root / p
            if not p.is_file():
                print(f"seed not found: {s}", file=sys.stderr)
                return 1
            seeds.append(p.resolve())
        t0, t1, t2 = discover_from_seeds(root, seeds)
    else:
        t0 = discover_t0(root)
        t1 = discover_t1_skills(root)
        t2 = discover_t2(root, t0, t1)
    manifests, commands = load_manifest_commands(root)

    inv = Inventory(
        root=str(root),
        generated_at=datetime.now(timezone.utc).isoformat(),
        t0=[rel(root, p) for p in t0],
        t1=[rel(root, p) for p in t1],
        t2=[rel(root, p) for p in t2],
        manifests=manifests,
        manifest_commands=commands,
    )
    (out / "inventory.json").write_text(json.dumps(asdict(inv), indent=2) + "\n", encoding="utf-8")

    claims: list[Claim] = []
    n = 1
    for p in t0:
        for src, section, quote in extract_claims_from_file(root, p, skill_mode=False):
            claims.append(Claim(id=f"C{n:03d}", tier="T0", source=src, quote=quote, is_plant=False, section=section))
            n += 1
    for p in t1:
        for src, section, quote in extract_claims_from_file(root, p, skill_mode=True):
            claims.append(Claim(id=f"C{n:03d}", tier="T1", source=src, quote=quote, is_plant=False, section=section))
            n += 1
    for p in t2:
        src = rel(root, p)
        claims.append(
            Claim(
                id=f"C{n:03d}",
                tier="T2",
                source=src,
                quote=f"Harness-referenced document `{src}` is an on-demand load target when linked from always-on rules or skills.",
                is_plant=False,
                section="routing",
            )
        )
        n += 1

    plants = build_plants(commands)
    all_claims = claims + plants

    with (out / "claims.jsonl").open("w", encoding="utf-8") as fh:
        for c in all_claims:
            row = asdict(c)
            if row["plant_template"] is None:
                del row["plant_template"]
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    write_claims_md(out / "claims.md", all_claims, args.run_id)

    trap = {
        "run_id": args.run_id,
        "pass_threshold_misses": 1,
        "plants": [
            {
                "id": p.id,
                "template": p.plant_template,
                "expected_family": "REDUNDANT"
                if p.plant_template in {"manifest_echo", "generic_fluff"}
                else "KEEP",
                "expected_class_hint": {
                    "manifest_echo": "REDUNDANT-CODE",
                    "generic_fluff": "REDUNDANT-GENERAL",
                    "policy_echo": "KEEP-POLICY",
                    "caveat_echo": "KEEP-CAVEAT",
                }.get(p.plant_template or "", ""),
            }
            for p in plants
        ],
    }
    (out / "trap-key.json").write_text(json.dumps(trap, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "run_id": args.run_id,
                "t0_files": len(t0),
                "t1_files": len(t1),
                "t2_files": len(t2),
                "claims": len(claims),
                "plants": len(plants),
                "out": str(out),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Deterministic TrustScore estimator for a skill package.

Pass 1 scores security, estrutura, conteúdo and evals. Pass 2 folds in the
agent verdict for qualidade via --ai-quality-score. No PyYAML: the frontmatter
parser is a one-level YAML subset so CI and sandbox images stay stdlib-only.

Security is a local regex heuristic. It catches common, obvious findings only.

Usage:
    python score_skill.py <skill-path> [--ai-quality-score 0-100] [--json]
    python score_skill.py <skill-path> --json-out /tmp/trustscore.json

Exit codes:
    0 skill not blocked (estimated merge-eligible)
    1 skill blocked (blocking finding or score below the merge threshold)
    2 usage error or unreadable skill package
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass, field
from typing import Any


def joined(*parts: str) -> str:
    return "".join(parts)


def rx(*parts: str, flags: int = 0) -> re.Pattern[str]:
    return re.compile(joined(*parts), flags)


WEIGHT_SECURITY_BP = 40
WEIGHT_QUALITY_BP = 60
QUALITY_GROUP_WEIGHTS_BP = {
    "estrutura": 30,
    "conteudo": 35,
    "evals": 15,
    "qualidade": 20,
}
GATE_GROUPS = {"estrutura", "conteudo"}
GROUP_PASS_THRESHOLD = 70
MERGE_THRESHOLD = 70
SECURITY_PENALTIES = {
    "critical": 20,
    "high": 10,
    "medium": 3,
    "low": 1,
    "info": 1,
}
BLOCKING_SEVERITIES = {"critical", "high"}
CLASSIFICATION_BANDS = (
    (90, "SUPER_TRUST"),
    (75, "HIGH_TRUST"),
    (60, "MEDIUM_TRUST"),
    (40, "LOW_TRUST"),
    (0, "CRITICAL_TRUST"),
)
NAME_MAX_CHARS = 64
DESCRIPTION_MIN_CHARS = 50
DESCRIPTION_WARN_CHARS = 500
DESCRIPTION_MAX_CHARS = 1024
LINES_MAX = 500
LINES_WARN = 400
TOKEN_CHAR_ESTIMATE = 4
TOKENS_MAX = 2000
REFERENCE_BROKEN_CAP = 10
KEBAB = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")
SKIP_DIRS = {".git", "__pycache__", "node_modules", ".venv", "venv"}
TEXT_EXTENSIONS = {
    "",
    ".md",
    ".py",
    ".sh",
    ".bash",
    ".zsh",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".txt",
    ".cfg",
    ".ini",
    ".xml",
    ".html",
    ".css",
    ".rst",
    ".rb",
    ".go",
    ".rs",
    ".java",
    ".php",
    ".sql",
    ".env",
}
ENV_FILENAMES = {".env", ".env.local", ".env.production", ".env.development"}
ENV_SKIP = {".env.example", ".env.sample", ".env.template"}
REF_PREFIXES = ("references/", "scripts/", "assets/", "templates/", "evals/")
EXPECTED_SECTIONS = (
    ("purpose", ("purpose", "proposito")),
    ("instructions", ("instructions", "instrucoes")),
    ("examples", ("examples", "exemplos")),
    ("overview", ("overview", "visao geral")),
    ("when_to_use", ("when to use", "quando usar")),
    ("quick_start", ("quick start", "inicio rapido")),
    ("common_use_cases", ("common use cases", "casos de uso")),
    ("best_practices", ("best practices", "boas praticas")),
    ("resources", ("resources", "recursos")),
)
VAGUE_PHRASES = (
    "helps with",
    "does stuff",
    "processes data",
    "utility for",
    "ajuda com",
    "faz coisas",
    "processa dados",
    "utilitario para",
    "utilitário para",
)
RESERVED_NAME_PARTS = ("claude", "anthropic")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
ISO_DATE_RE = re.compile(r"\b20\d{2}-\d{2}-\d{2}\b")
BR_DATE_RE = re.compile(r"\b\d{2}/\d{2}/20\d{2}\b")
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
TICK_PATH_RE = re.compile(
    r"`((?:references|scripts|assets|templates|evals)/[A-Za-z0-9._/-]+)`"
)
ALLOWLIST_RE = re.compile(
    r"^([^:#\s][^:#]*):([A-Z][A-Z0-9_]*)\s+#\s+(\S.*)$"
)
TRIGGER_RE = rx(
    r"use\s+when|use\s+quando|quando\s+o\s+usu[aá]rio|when\s+the\s+user",
    flags=re.I,
)
NEGATIVE_RE = rx(
    r"do\s+not\s+use|don't\s+use|n[aã]o\s+use|n[aã]o\s+usar",
    flags=re.I,
)
MULTILINE_DESC_RE = re.compile(r"^description\s*:\s*[|>]", re.I | re.M)

PROMPT_INJECTION_RES = (
    rx(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions", flags=re.I),
    rx(r"ignore\s+(as|todas\s+as)\s+instru", "ções anteriores", flags=re.I),
    rx(r"desconsidere\s+as\s+instru", "ções", flags=re.I),
    rx(r"disregard\s+(all\s+)?previous\s+instructions", flags=re.I),
)
SYSTEM_PROMPT_LEAK_RES = (
    rx(r"reveal\s+(the\s+)?(system|hidden)\s+prompt", flags=re.I),
    rx(r"repeat\s+(your|the)\s+system\s+prompt", flags=re.I),
    rx(r"mostra(r)?\s+(o\s+)?system\s+prompt", flags=re.I),
    rx(r"repetir\s+(o\s+)?prompt\s+do\s+sistema", flags=re.I),
)
SECRET_RES = (
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bsk-ant-[A-Za-z0-9\-_]{20,}\b"),
    re.compile(r"\bsk-proj-[A-Za-z0-9\-_]{20,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    rx(
        r"(?i)\b(api[_-]?key|secret|token|password|passwd|credential)\b\s*[:=]\s*",
        r"['\"][^'\"\s]{12,}['\"]",
    ),
)
PRIVATE_KEY_MARKER = joined("-----BEGIN ", "PRIVATE ", "KEY-----")
DATA_EXFIL_RES = (
    rx(r"cat\s+['\"]?\.env['\"]?", flags=re.I),
    rx(
        r"(curl|wget)\b[^\n]{0,160}\$(?:\{)?(?:AWS_|OPENAI_|GITHUB_|API_|SECRET|TOKEN|PASSWORD)",
        flags=re.I,
    ),
    rx(
        r"(os\.environ|getenv|printenv)",
        r".{0,80}",
        r"(curl|wget|requests\.|httpx|urllib)",
        flags=re.I,
    ),
)
REMOTE_CODE_RES = (
    rx(r"(curl|wget)\b[^\n]{0,200}", r"\|\s*(ba)?sh\b", flags=re.I),
    rx(r"eval\s*\$\(\s*(curl|wget)\b", flags=re.I),
    rx(r"eval\s*`\s*(curl|wget)\b", flags=re.I),
)
SUPPLY_CHAIN_RES = (
    rx(r"npm\s+i(nstall)?\s+-g\b", flags=re.I),
    rx(
        r"(npm|pnpm|yarn|npx)\b[^\n]{0,80}",
        r"@latest\b",
        flags=re.I,
    ),
    rx(r"pip\s+install\s+(git\+|https?://)", flags=re.I),
    rx(
        r"go\s+install\s+[^\s]+",
        r"@latest\b",
        flags=re.I,
    ),
)
UNSAFE_SHELL_RES = (
    rx(r"rm\s+-[rf]{1,2}\s+/(?:\s|$)", flags=re.I),
    rx(r"rm\s+-[rf]{1,2}\s+~(?:\s|$|/)", flags=re.I),
    rx(r"chmod\s+(?:-[A-Za-z]+\s+)*777\b", flags=re.I),
    rx(r"git\s+push\b[^\n]*--force(?!-with-lease)\b", flags=re.I),
)
GIT_HOOK_RES = (
    rx(r"--no", r"-verify\b"),
    rx(r"--skip", r"-ci\b", flags=re.I),
    rx(r"\[(skip ci|ci skip)\]", flags=re.I),
)

SECURITY_RULES = (
    ("PROMPT_INJECTION", "critical", PROMPT_INJECTION_RES, "frase de override de instruções", "Remova a frase. Se for demonstrar um ataque, descreva em vez de escrever o payload."),
    ("SYSTEM_PROMPT_LEAK", "critical", SYSTEM_PROMPT_LEAK_RES, "pedido para revelar o system prompt", "Remova o pedido para revelar ou repetir o prompt."),
    ("HARDCODED_SECRET", "high", SECRET_RES, "credencial ou segredo hardcoded", "Troque por placeholder ou variável de ambiente. Não commite valor real."),
    ("DATA_EXFILTRATION", "high", DATA_EXFIL_RES, "exfiltração de ambiente ou .env", "Remova o envio. Scripts não devem transmitir credencial local."),
    ("REMOTE_CODE_EXEC", "high", REMOTE_CODE_RES, "download piped direto para o shell", "Baixe, fixe checksum, inspecione e execute em passos separados."),
    ("SUPPLY_CHAIN", "medium", SUPPLY_CHAIN_RES, "install de URL, git ref, global ou @latest", "Fixe uma versão explícita do registry aprovado."),
    ("UNSAFE_SHELL", "medium", UNSAFE_SHELL_RES, "comando destrutivo ou permissão frouxa", "Estreite o caminho, aperte a permissão ou use --force-with-lease."),
    ("GIT_HOOK_BYPASS", "low", GIT_HOOK_RES, "bypass de hook ou CI", "Corrija a falha em vez de pular o check."),
)

FIXES = {code: fix for code, _sev, _rx, _msg, fix in SECURITY_RULES}

GROUP_LABELS = {
    "security": "segurança",
    "estrutura": "estrutura",
    "conteudo": "conteúdo",
    "evals": "evals",
    "qualidade": "qualidade",
}


class FrontmatterParseError(ValueError):
    pass


@dataclass
class Finding:
    code: str
    group: str
    penalty: int
    message: str
    fix: str
    path: str | None = None
    line: int | None = None
    severity: str | None = None
    blocking: bool = False

    def as_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        return {key: value for key, value in payload.items() if value is not None}


@dataclass
class GroupResult:
    name: str
    weight_bp: int
    gate: bool
    score: int | None
    applicable: bool
    skipped: bool = False
    findings: list[Finding] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "weight_bp": self.weight_bp,
            "weight": self.weight_bp / 100,
            "gate": self.gate,
            "score": self.score,
            "applicable": self.applicable,
            "skipped": self.skipped,
            "findings": [item.as_dict() for item in self.findings],
        }


def round_half_up_div(numerator: int, denominator: int) -> int:
    if denominator <= 0:
        return 0
    return (numerator + denominator // 2) // denominator


def fold(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).casefold()


def posix_rel(root: str, path: str) -> str:
    return os.path.relpath(path, root).replace(os.sep, "/")


def _parse_scalar(raw: str) -> Any:
    value = raw.strip()
    if value == "":
        return ""
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    lower = value.lower()
    if lower == "true":
        return True
    if lower == "false":
        return False
    if lower in {"null", "none", "~"}:
        return None
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    return value


def _collect_block_scalar(
    lines: list[str], start_idx: int, min_indent: int, folded: bool
) -> tuple[str, int]:
    block_lines: list[str] = []
    i = start_idx
    while i < len(lines):
        line = lines[i]
        if line.strip() == "":
            block_lines.append("")
            i += 1
            continue
        indent = len(line) - len(line.lstrip(" "))
        if indent < min_indent:
            break
        block_lines.append(line[min_indent:])
        i += 1
    if not folded:
        return ("\n".join(block_lines)).rstrip(), i
    paragraphs: list[str] = []
    current: list[str] = []
    for line in block_lines:
        if line == "":
            if current:
                paragraphs.append(" ".join(current))
                current = []
            paragraphs.append("")
            continue
        current.append(line.strip())
    if current:
        paragraphs.append(" ".join(current))
    return ("\n".join(paragraphs)).rstrip(), i


def parse_frontmatter(frontmatter_raw: str) -> dict[str, Any]:
    lines = frontmatter_raw.splitlines()
    data: dict[str, Any] = {}
    i = 0
    key_pattern = re.compile(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$")
    block_markers = {"|", ">", "|-", ">-"}

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped == "" or stripped.startswith("#"):
            i += 1
            continue
        if line.startswith(" "):
            raise FrontmatterParseError(f"Recuo inesperado perto da linha {i + 1}")
        match = key_pattern.match(line)
        if not match:
            raise FrontmatterParseError(f"Entrada inválida perto da linha {i + 1}")
        key, raw_value = match.group(1), match.group(2).strip()
        if raw_value in block_markers:
            folded = raw_value.startswith(">")
            parsed_block, next_idx = _collect_block_scalar(lines, i + 1, 2, folded)
            data[key] = parsed_block
            i = next_idx
            continue
        if raw_value != "":
            data[key] = _parse_scalar(raw_value)
            i += 1
            continue

        j = i + 1
        while j < len(lines):
            candidate = lines[j]
            if candidate.strip() == "" or candidate.strip().startswith("#"):
                j += 1
                continue
            if not candidate.startswith("  "):
                break
            j += 1
        nested_lines = lines[i + 1 : j]
        if not any(item.strip() and not item.strip().startswith("#") for item in nested_lines):
            data[key] = ""
            i = j
            continue

        nested: dict[str, Any] = {}
        k = i + 1
        while k < j:
            nested_line = lines[k]
            nested_stripped = nested_line.strip()
            if nested_stripped == "" or nested_stripped.startswith("#"):
                k += 1
                continue
            if not nested_line.startswith("  ") or nested_line.startswith("   "):
                raise FrontmatterParseError(f"Aninhamento inválido perto da linha {k + 1}")
            nested_content = nested_line[2:]
            nested_match = key_pattern.match(nested_content)
            if not nested_match:
                raise FrontmatterParseError(f"Mapeamento inválido perto da linha {k + 1}")
            child_key, child_raw = nested_match.group(1), nested_match.group(2).strip()
            if child_raw in block_markers:
                folded = child_raw.startswith(">")
                child_block, next_k = _collect_block_scalar(lines, k + 1, 4, folded)
                nested[child_key] = child_block
                k = next_k
                continue
            nested[child_key] = _parse_scalar(child_raw)
            k += 1
        data[key] = nested
        i = j
    return data


def split_frontmatter(text: str) -> tuple[str | None, str]:
    normalized = text.replace("\r\n", "\n")
    if not normalized.startswith("---\n"):
        return None, normalized
    rest = normalized[4:]
    marker = "\n---"
    if rest.startswith("---"):
        return None, normalized
    split_at = rest.find("\n---")
    if split_at == -1:
        return None, normalized
    raw = rest[:split_at]
    body = rest[split_at + len(marker) :]
    if body.startswith("\n"):
        body = body[1:]
    return raw, body


def resolve_skill_dir(path: str) -> str:
    absolute = os.path.abspath(path)
    if os.path.isfile(absolute) and os.path.basename(absolute).lower() == "skill.md":
        return os.path.dirname(absolute)
    return absolute


def read_text(path: str) -> str | None:
    try:
        with open(path, "rb") as handle:
            raw = handle.read(1_000_001)
    except OSError:
        return None
    if len(raw) > 1_000_000 or b"\x00" in raw:
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None


def iter_files(root: str) -> list[str]:
    found: list[str] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for name in filenames:
            found.append(os.path.join(dirpath, name))
    return found


def is_text_file(path: str) -> bool:
    name = os.path.basename(path)
    if name in ENV_FILENAMES or name.startswith(".env."):
        return True
    ext = os.path.splitext(name)[1].lower()
    return ext in TEXT_EXTENSIONS


def line_of(text: str, index: int) -> int:
    return text[:index].count("\n") + 1


def group_score(findings: list[Finding]) -> int:
    return max(0, 100 - sum(item.penalty for item in findings))


def band_for(score: int) -> str:
    for minimum, label in CLASSIFICATION_BANDS:
        if score >= minimum:
            return label
    return "CRITICAL_TRUST"


def badge_for(score: int, findings: list[Finding], blocked: bool) -> str | None:
    if score < MERGE_THRESHOLD:
        return None
    if score >= 90:
        badge = "gold"
    elif score >= 80:
        badge = "silver"
    else:
        badge = "bronze"
    if badge == "gold" and any(not item.blocking for item in findings):
        badge = "silver"
    if blocked and badge == "gold":
        badge = "silver"
    return badge


def load_allowlist(root: str) -> dict[tuple[str, str], str]:
    path = os.path.join(root, ".trustscore-allowlist")
    text = read_text(path)
    if text is None:
        return {}
    entries: dict[tuple[str, str], str] = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line == "" or line.startswith("#"):
            continue
        match = ALLOWLIST_RE.match(line)
        if not match:
            continue
        rel = match.group(1).replace("\\", "/").strip()
        entries[(rel, match.group(2))] = match.group(3).strip()
    return entries


def allowed(allowlist: dict[tuple[str, str], str], rel: str, code: str) -> str | None:
    return allowlist.get((rel, code))


def finding(
    code: str,
    group: str,
    penalty: int,
    message: str,
    fix: str,
    *,
    path: str | None = None,
    line: int | None = None,
    severity: str | None = None,
) -> Finding:
    blocking = group == "security" and severity in BLOCKING_SEVERITIES
    return Finding(
        code=code,
        group=group,
        penalty=penalty,
        message=message,
        fix=fix,
        path=path,
        line=line,
        severity=severity,
        blocking=blocking,
    )


def scan_patterns(
    text: str,
    rel: str,
    code: str,
    group: str,
    severity: str,
    patterns: tuple[re.Pattern[str], ...],
    message: str,
    fix: str,
    allowlist: dict[tuple[str, str], str],
    suppressed: list[dict[str, str]],
) -> list[Finding]:
    hits: list[Finding] = []
    justification = allowed(allowlist, rel, code)
    matched = False
    for pattern in patterns:
        for match in pattern.finditer(text):
            matched = True
            if justification:
                break
            hits.append(
                finding(
                    code,
                    group,
                    SECURITY_PENALTIES[severity],
                    message,
                    fix,
                    path=rel,
                    line=line_of(text, match.start()),
                    severity=severity,
                )
            )
        if justification and matched:
            break
    if justification and matched:
        suppressed.append({"path": rel, "code": code, "justification": justification})
    return hits


def security_findings(root: str, allowlist: dict[tuple[str, str], str]) -> tuple[list[Finding], list[dict[str, str]]]:
    hits: list[Finding] = []
    suppressed: list[dict[str, str]] = []
    for path in iter_files(root):
        rel = posix_rel(root, path)
        name = os.path.basename(path)
        if name in ENV_FILENAMES or (name.startswith(".env.") and name not in ENV_SKIP):
            justification = allowed(allowlist, rel, "HARDCODED_SECRET")
            if justification:
                suppressed.append({"path": rel, "code": "HARDCODED_SECRET", "justification": justification})
            else:
                hits.append(
                    finding(
                        "HARDCODED_SECRET",
                        "security",
                        SECURITY_PENALTIES["high"],
                        f"arquivo de ambiente {rel}",
                        FIXES["HARDCODED_SECRET"],
                        path=rel,
                        line=1,
                        severity="high",
                    )
                )
            continue
        if not is_text_file(path):
            continue
        text = read_text(path)
        if text is None:
            continue
        if PRIVATE_KEY_MARKER in text:
            justification = allowed(allowlist, rel, "HARDCODED_SECRET")
            if justification:
                suppressed.append({"path": rel, "code": "HARDCODED_SECRET", "justification": justification})
            else:
                hits.append(
                    finding(
                        "HARDCODED_SECRET",
                        "security",
                        SECURITY_PENALTIES["high"],
                        "bloco PEM de chave privada",
                        FIXES["HARDCODED_SECRET"],
                        path=rel,
                        line=line_of(text, text.index(PRIVATE_KEY_MARKER)),
                        severity="high",
                    )
                )
        for code, severity, patterns, message, fix in SECURITY_RULES:
            hits.extend(
                scan_patterns(
                    text,
                    rel,
                    code,
                    "security",
                    severity,
                    patterns,
                    message,
                    fix,
                    allowlist,
                    suppressed,
                )
            )
    return hits, suppressed


def estrutura_findings(root: str, entries: list[str], name: str) -> list[Finding]:
    hits: list[Finding] = []
    folder_name = os.path.basename(os.path.normpath(root))
    if not KEBAB.match(folder_name):
        hits.append(
            finding(
                "FOLDER_NOT_KEBAB",
                "estrutura",
                15,
                f"pasta '{folder_name}' fora de kebab-case",
                "Renomeie para letras minúsculas, dígitos e hífens, começando com letra.",
                path=folder_name,
            )
        )
    if name and name != folder_name:
        hits.append(
            finding(
                "NAME_FOLDER_MISMATCH",
                "estrutura",
                10,
                f"name '{name}' diferente da pasta '{folder_name}'",
                "Deixe name e o nome da pasta idênticos.",
                path="SKILL.md",
            )
        )
    readme = [entry for entry in entries if entry.lower() == "readme.md"]
    if readme:
        hits.append(
            finding(
                "README_IN_SKILL",
                "estrutura",
                10,
                f"README dentro da skill: {', '.join(readme)}",
                "Apague o README da pasta da skill. Docs humanos ficam fora do pacote.",
                path=readme[0],
            )
        )
    return hits


def heading_text(line: str) -> str | None:
    match = HEADING_RE.match(line.rstrip())
    if not match:
        return None
    return fold(match.group(2))


def missing_sections(body: str) -> list[str]:
    headings = [heading_text(line) for line in body.splitlines()]
    present = [item for item in headings if item]
    missing: list[str] = []
    for label, aliases in EXPECTED_SECTIONS:
        if any(any(alias in heading for alias in aliases) for heading in present):
            continue
        missing.append(label)
    return missing


def referenced_paths(body: str) -> list[str]:
    found: list[str] = []
    for match in MD_LINK_RE.finditer(body):
        url = match.group(1).strip().split("#", 1)[0].split("?", 1)[0]
        if url.startswith(REF_PREFIXES):
            found.append(url.replace("\\", "/"))
    for match in TICK_PATH_RE.finditer(body):
        found.append(match.group(1).replace("\\", "/"))
    unique: list[str] = []
    seen: set[str] = set()
    for item in found:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


def conteudo_findings(
    root: str,
    body: str,
    frontmatter_raw: str | None,
    frontmatter: dict[str, Any] | None,
    parse_error: str | None,
) -> list[Finding]:
    hits: list[Finding] = []
    skill_rel = "SKILL.md"
    if frontmatter_raw is None or parse_error:
        hits.append(
            finding(
                "FRONTMATTER_MISSING",
                "conteudo",
                15,
                parse_error or "SKILL.md não abre com um bloco --- válido",
                "Abra e feche o frontmatter com --- na primeira linha.",
                path=skill_rel,
                line=1,
            )
        )

    name = ""
    description = ""
    if isinstance(frontmatter, dict):
        if frontmatter.get("name") is not None:
            name = str(frontmatter.get("name")).strip()
        if frontmatter.get("description") is not None:
            description = str(frontmatter.get("description")).strip()

    if not name:
        hits.append(
            finding(
                "NAME_MISSING",
                "conteudo",
                15,
                "campo name ausente",
                "Inclua name em kebab-case, igual ao nome da pasta.",
                path=skill_rel,
            )
        )
    else:
        if not KEBAB.match(name):
            hits.append(
                finding(
                    "NAME_FORMAT",
                    "conteudo",
                    15,
                    f"name '{name}' não está em kebab-case",
                    "Use letras minúsculas, dígitos e hífens, começando com letra.",
                    path=skill_rel,
                )
            )
        if len(name) > NAME_MAX_CHARS:
            hits.append(
                finding(
                    "NAME_TOO_LONG",
                    "conteudo",
                    15,
                    f"name com {len(name)} caracteres, acima de {NAME_MAX_CHARS}",
                    "Encurte o name para no máximo 64 caracteres.",
                    path=skill_rel,
                )
            )
        lowered_name = name.casefold()
        if any(part in lowered_name for part in RESERVED_NAME_PARTS):
            hits.append(
                finding(
                    "NAME_RESERVED",
                    "conteudo",
                    15,
                    "name contém claude ou anthropic",
                    "Tire o nome reservado do slug.",
                    path=skill_rel,
                )
            )

    if frontmatter_raw and MULTILINE_DESC_RE.search(frontmatter_raw):
        hits.append(
            finding(
                "DESCRIPTION_MULTILINE",
                "conteudo",
                15,
                "description usa operador YAML multilinha",
                "Deixe a description em uma única linha. Operadores | e > quebram o parser do registry.",
                path=skill_rel,
            )
        )

    if not description:
        hits.append(
            finding(
                "DESCRIPTION_MISSING",
                "conteudo",
                15,
                "campo description ausente",
                "Escreva [o que faz] + [use when ...] + [do NOT use for ...].",
                path=skill_rel,
            )
        )
    else:
        length = len(description)
        if length < DESCRIPTION_MIN_CHARS:
            hits.append(
                finding(
                    "DESCRIPTION_SHORT",
                    "conteudo",
                    5,
                    f"description com {length} caracteres, abaixo de {DESCRIPTION_MIN_CHARS}",
                    "Expanda com as frases que o usuário realmente diria.",
                    path=skill_rel,
                )
            )
        elif length > DESCRIPTION_MAX_CHARS:
            hits.append(
                finding(
                    "DESCRIPTION_TOO_LONG",
                    "conteudo",
                    15,
                    f"description com {length} caracteres, acima de {DESCRIPTION_MAX_CHARS}",
                    "Mova detalhe para o corpo. 1024 é o limite duro.",
                    path=skill_rel,
                )
            )
        elif length > DESCRIPTION_WARN_CHARS:
            hits.append(
                finding(
                    "DESCRIPTION_LONG",
                    "conteudo",
                    5,
                    f"description com {length} caracteres, acima de {DESCRIPTION_WARN_CHARS}",
                    "Aperte o texto. Acima de 500 já atrapalha o progressive disclosure.",
                    path=skill_rel,
                )
            )
        if "<" in description or ">" in description:
            hits.append(
                finding(
                    "DESCRIPTION_ANGLE_BRACKETS",
                    "conteudo",
                    15,
                    "description contém < ou >",
                    "Remova os colchetes angulares; eles quebram o parser do frontmatter.",
                    path=skill_rel,
                )
            )
        folded_desc = fold(description)
        if any(phrase in folded_desc for phrase in VAGUE_PHRASES):
            hits.append(
                finding(
                    "DESCRIPTION_VAGUE",
                    "conteudo",
                    5,
                    "description usa formulação vaga",
                    "Diga o resultado concreto que a skill produz.",
                    path=skill_rel,
                )
            )
        if not TRIGGER_RE.search(description):
            hits.append(
                finding(
                    "DESCRIPTION_NO_TRIGGER",
                    "conteudo",
                    5,
                    "description sem cláusula Use when",
                    "Inclua frases reais que devem ativar a skill.",
                    path=skill_rel,
                )
            )
        if not NEGATIVE_RE.search(description):
            hits.append(
                finding(
                    "DESCRIPTION_NO_NEGATIVE",
                    "conteudo",
                    5,
                    "description sem cláusula Do NOT use for",
                    "Inclua gatilhos negativos para não sobrepor skills vizinhas.",
                    path=skill_rel,
                )
            )

    stripped = body.strip()
    line_count = 0 if stripped == "" else len(stripped.split("\n"))
    if line_count > LINES_MAX:
        hits.append(
            finding(
                "LINES_EXCEEDED",
                "conteudo",
                10,
                f"corpo com {line_count} linhas, acima de {LINES_MAX}",
                "Mova material de referência para references/.",
                path=skill_rel,
            )
        )
    elif line_count > LINES_WARN:
        hits.append(
            finding(
                "LINES_NEAR_LIMIT",
                "conteudo",
                5,
                f"corpo com {line_count} linhas, acima de {LINES_WARN}",
                "Considere descarregar detalhe em references/.",
                path=skill_rel,
            )
        )

    token_estimate = 0 if stripped == "" else (len(stripped) + TOKEN_CHAR_ESTIMATE - 1) // TOKEN_CHAR_ESTIMATE
    if token_estimate > TOKENS_MAX:
        hits.append(
            finding(
                "TOKENS_EXCEEDED",
                "conteudo",
                10,
                f"corpo com cerca de {token_estimate} tokens, acima de {TOKENS_MAX}",
                "Encurte o corpo. Progressive disclosure existe por causa disto.",
                path=skill_rel,
            )
        )

    for section in missing_sections(body):
        hits.append(
            finding(
                "SECTION_MISSING",
                "conteudo",
                2,
                f"seção '{section}' ausente",
                "Inclua a seção. As nove não são todas obrigatórias, mas cada ausência custa 2.",
                path=skill_rel,
            )
        )

    broken = 0
    for rel in referenced_paths(body):
        if broken >= REFERENCE_BROKEN_CAP:
            break
        target = os.path.join(root, *rel.split("/"))
        if os.path.exists(target):
            continue
        hits.append(
            finding(
                "REFERENCE_BROKEN",
                "conteudo",
                10,
                f"caminho referido inexistente: {rel}",
                "Crie o arquivo ou corrija o caminho. Use barra para frente.",
                path=skill_rel,
            )
        )
        broken += 1

    fences = [(match.start(), match.end()) for match in FENCE_RE.finditer(body)]
    for pattern in (ISO_DATE_RE, BR_DATE_RE):
        for match in pattern.finditer(body):
            if any(start <= match.start() < end for start, end in fences):
                continue
            hits.append(
                finding(
                    "HARDCODED_DATE",
                    "conteudo",
                    5,
                    f"data hardcoded {match.group(0)} fora de bloco de código",
                    "Remova a data. Conteúdo temporal envelhece e engana o agente.",
                    path=skill_rel,
                    line=line_of(body, match.start()),
                )
            )
    return hits


def _as_cases(payload: Any) -> tuple[list[Any] | None, str | None]:
    if isinstance(payload, list):
        return payload, None
    if isinstance(payload, dict) and "cases" in payload:
        cases = payload.get("cases")
        if isinstance(cases, list):
            return cases, None
        return None, "EVALS_SHAPE"
    return None, "EVALS_SHAPE"


def evals_findings(root: str) -> list[Finding] | None:
    evals_dir = os.path.join(root, "evals")
    if not os.path.isdir(evals_dir):
        return None

    cases_path = os.path.join(evals_dir, "cases.json")
    rel = "evals/cases.json"
    if not os.path.isfile(cases_path):
        return [
            finding(
                "EVALS_MISNAMED",
                "evals",
                100,
                "pasta evals/ existe sem evals/cases.json",
                "Renomeie o arquivo de casos para evals/cases.json.",
                path="evals",
            )
        ]

    text = read_text(cases_path)
    if text is None:
        return [
            finding(
                "EVALS_UNREADABLE",
                "evals",
                100,
                "evals/cases.json ilegível",
                "Grave o JSON em UTF-8 sem bytes nulos.",
                path=rel,
            )
        ]
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        return [
            finding(
                "EVALS_UNREADABLE",
                "evals",
                100,
                f"JSON inválido: {exc}",
                "Corrija o erro de sintaxe indicado na mensagem.",
                path=rel,
            )
        ]

    cases, shape_error = _as_cases(payload)
    if shape_error:
        return [
            finding(
                "EVALS_SHAPE",
                "evals",
                100,
                "JSON não é um array nem um objeto com chave cases",
                "Use um array ou um objeto {\"cases\": [...]}.",
                path=rel,
            )
        ]

    hits: list[Finding] = []
    assert cases is not None
    count = len(cases)
    if count < 5:
        hits.append(
            finding(
                "EVALS_TOO_FEW",
                "evals",
                10,
                f"{count} casos, abaixo de 5",
                "Inclua happy path, edge cases e erros.",
                path=rel,
            )
        )
    elif count <= 6:
        hits.append(
            finding(
                "EVALS_NEAR_MINIMUM",
                "evals",
                5,
                f"{count} casos, perto do mínimo",
                "Amplie a cobertura para uma margem mais segura.",
                path=rel,
            )
        )

    for index, case in enumerate(cases):
        if not isinstance(case, dict):
            hits.append(
                finding(
                    "EVALS_CASE_SHAPE",
                    "evals",
                    5,
                    f"caso {index} não é um objeto JSON",
                    "Faça cada caso ser um objeto.",
                    path=rel,
                )
            )
            continue
        for field_name in ("id", "description", "expected_output"):
            if not case.get(field_name):
                hits.append(
                    finding(
                        "EVALS_FIELD_MISSING",
                        "evals",
                        5,
                        f"caso {index} sem '{field_name}'",
                        "Preencha id, description e expected_output.",
                        path=rel,
                    )
                )
        if not case.get("input") and not case.get("context"):
            hits.append(
                finding(
                    "EVALS_FIELD_MISSING",
                    "evals",
                    5,
                    f"caso {index} sem input e sem context",
                    "Use input para skills executáveis e context para as cognitivas.",
                    path=rel,
                )
            )
    return hits


def qualidade_group(ai_quality_score: int | None) -> GroupResult:
    weight = QUALITY_GROUP_WEIGHTS_BP["qualidade"]
    if ai_quality_score is None:
        return GroupResult(
            name="qualidade",
            weight_bp=weight,
            gate=False,
            score=None,
            applicable=False,
            skipped=True,
        )
    return GroupResult(
        name="qualidade",
        weight_bp=weight,
        gate=False,
        score=ai_quality_score,
        applicable=True,
        skipped=False,
    )


def aggregate_quality(groups: dict[str, GroupResult]) -> int:
    numerator = 0
    denominator = 0
    for name, weight in QUALITY_GROUP_WEIGHTS_BP.items():
        group = groups[name]
        if not group.applicable or group.score is None:
            continue
        numerator += group.score * weight
        denominator += weight
    return round_half_up_div(numerator, denominator)


def trust_score(security: int, quality: int) -> int:
    return round_half_up_div(
        security * WEIGHT_SECURITY_BP + quality * WEIGHT_QUALITY_BP,
        100,
    )


def make_group(name: str, findings: list[Finding] | None) -> GroupResult:
    weight = QUALITY_GROUP_WEIGHTS_BP[name]
    if findings is None:
        return GroupResult(
            name=name,
            weight_bp=weight,
            gate=name in GATE_GROUPS,
            score=None,
            applicable=False,
        )
    return GroupResult(
        name=name,
        weight_bp=weight,
        gate=name in GATE_GROUPS,
        score=group_score(findings),
        applicable=True,
        findings=findings,
    )


def blocking_reasons(
    security: GroupResult,
    groups: dict[str, GroupResult],
    score: int,
) -> list[str]:
    reasons: list[str] = []
    for item in security.findings:
        if item.blocking:
            where = item.path or ""
            if item.line:
                where = f"{where}:{item.line}"
            label = f"Segurança [{item.severity}]"
            if where:
                label += f" {where}"
            reasons.append(f"{label} — {item.message}")
    for name in ("estrutura", "conteudo"):
        group = groups[name]
        if group.applicable and group.score is not None and group.score < GROUP_PASS_THRESHOLD:
            reasons.append(
                f"Grupo '{GROUP_LABELS[name]}' ficou em {group.score}, abaixo do gate {GROUP_PASS_THRESHOLD}."
            )
    if score < MERGE_THRESHOLD:
        reasons.append(f"TrustScore {score} abaixo do limiar {MERGE_THRESHOLD}.")
    return reasons


def prioritized_fixes(findings: list[Finding]) -> list[Finding]:
    return sorted(
        findings,
        key=lambda item: (
            not item.blocking,
            0 if item.group in GATE_GROUPS else 1,
            -item.penalty,
            item.code,
            item.path or "",
        ),
    )


def failure_report(path: str, message: str) -> dict[str, Any]:
    return {
        "path": path,
        "readable": False,
        "error": message,
        "trust_score": None,
        "blocked": True,
        "merge_eligible": False,
        "blocking_reasons": [message],
        "findings": [],
    }


def evaluate(skill_path: str, ai_quality_score: int | None = None) -> dict[str, Any]:
    root = resolve_skill_dir(skill_path)
    if not os.path.isdir(root):
        return failure_report(root, f"Pasta inexistente: {root}")

    try:
        entries = os.listdir(root)
    except OSError as exc:
        return failure_report(root, f"Pasta ilegível: {exc}")

    if "SKILL.md" not in entries:
        wrong = [entry for entry in entries if entry.lower() == "skill.md"]
        if wrong:
            return failure_report(
                root,
                f"SKILL.md ausente em {root}. Encontrado com outra caixa: {wrong[0]}",
            )
        return failure_report(root, f"SKILL.md ausente em {root}")

    text = read_text(os.path.join(root, "SKILL.md"))
    if text is None:
        return failure_report(root, f"SKILL.md ilegível em {root}")

    frontmatter_raw, body = split_frontmatter(text)
    parse_error = None
    frontmatter: dict[str, Any] | None = None
    if frontmatter_raw is not None:
        try:
            frontmatter = parse_frontmatter(frontmatter_raw)
        except FrontmatterParseError as exc:
            parse_error = str(exc)

    name = ""
    if isinstance(frontmatter, dict) and frontmatter.get("name") is not None:
        name = str(frontmatter.get("name")).strip()

    allowlist = load_allowlist(root)
    security_hits, suppressed = security_findings(root, allowlist)
    evals_result = evals_findings(root)

    groups = {
        "estrutura": make_group("estrutura", estrutura_findings(root, entries, name)),
        "conteudo": make_group(
            "conteudo",
            conteudo_findings(root, body, frontmatter_raw, frontmatter, parse_error),
        ),
        "evals": make_group("evals", evals_result),
        "qualidade": qualidade_group(ai_quality_score),
    }
    security = GroupResult(
        name="security",
        weight_bp=WEIGHT_SECURITY_BP,
        gate=False,
        score=group_score(security_hits),
        applicable=True,
        findings=security_hits,
    )
    quality_score = aggregate_quality(groups)
    score = trust_score(security.score or 0, quality_score)
    all_findings = [
        *security.findings,
        *groups["estrutura"].findings,
        *groups["conteudo"].findings,
        *groups["evals"].findings,
    ]
    reasons = blocking_reasons(security, groups, score)
    blocked = bool(reasons)
    report = {
        "path": root,
        "readable": True,
        "error": None,
        "trust_score": score,
        "band": band_for(score),
        "badge": badge_for(score, all_findings, blocked),
        "blocked": blocked,
        "merge_eligible": not blocked,
        "blocking_reasons": reasons,
        "security": security.as_dict(),
        "quality": quality_score,
        "groups": {name: group.as_dict() for name, group in groups.items()},
        "qualidade_skipped": groups["qualidade"].skipped,
        "heuristic": True,
        "allowlist_suppressed": suppressed,
        "findings": [item.as_dict() for item in prioritized_fixes(all_findings)],
        "failed_checks": [
            {
                "dimension": item.group,
                "name": item.code,
                "message": item.message,
            }
            for item in prioritized_fixes(all_findings)
        ],
    }
    report["security_score"] = security.score
    report["security_capped"] = any(item.blocking for item in security.findings)
    report["critical_findings"] = [
        {"name": item.code, "message": item.message, "path": item.path, "line": item.line}
        for item in security.findings
        if item.severity == "critical"
    ]
    report["critical_security"] = bool(report["critical_findings"])
    return report


def format_report(report: dict[str, Any]) -> str:
    if not report.get("readable"):
        return str(report.get("error") or "SKILL.md inválido")

    lines: list[str] = []
    lines.append("Merge: BLOCKED" if report["blocked"] else "Merge: eligible")
    lines.append(f"TrustScore: {report['trust_score']}/100 — {report['band']}")
    if report.get("badge"):
        lines.append(f"Badge: {report['badge']}")

    security = report["security"]
    lines.append("")
    lines.append("Breakdown")
    lines.append(f"- segurança (40%): {security['score']}/100")
    lines.append(f"- qualidade (60%): {report['quality']}/100")
    for name in ("estrutura", "conteudo", "qualidade", "evals"):
        group = report["groups"][name]
        label = GROUP_LABELS[name]
        extra = " [gate]" if group["gate"] else ""
        if not group["applicable"]:
            state = "não aplicável, peso redistribuído" if name == "evals" else "não pontuado, peso redistribuído"
            lines.append(f"  - {label} ({group['weight_bp']}%){extra}: {state}")
            continue
        lines.append(f"  - {label} ({group['weight_bp']}%){extra}: {group['score']}/100")

    lines.append("")
    if report["blocking_reasons"]:
        lines.append("Blocking reasons:")
        for reason in report["blocking_reasons"]:
            lines.append(f"- {reason}")
    else:
        lines.append("Blocking reasons: none")

    findings = report.get("findings") or []
    if findings:
        lines.append("")
        lines.append("Fixes (maior penalidade primeiro):")
        for item in findings:
            where = item.get("path") or ""
            if item.get("line"):
                where = f"{where}:{item['line']}"
            prefix = f"{item['code']} (-{item['penalty']})"
            if where:
                prefix += f" {where}"
            lines.append(f"- {prefix}: {item['message']}. {item['fix']}")

    if report.get("qualidade_skipped"):
        lines.append("")
        lines.append("qualidade não pontuada: passe --ai-quality-score 0-100 depois do julgamento do passo 3.")
    if security["score"] == 100:
        lines.append("")
        lines.append(
            "Caveat: a passada de segurança é heurística (regex). Um scanner de CI com YARA/AST ainda pode achar mais."
        )
    if report.get("allowlist_suppressed"):
        lines.append("")
        lines.append("Allowlist:")
        for item in report["allowlist_suppressed"]:
            lines.append(f"- {item['path']}:{item['code']} # {item['justification']}")
    return "\n".join(lines)


def parse_agent_score(value: str, flag: str) -> int:
    try:
        score = int(value)
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError(f"{flag} deve ser um inteiro 0-100") from exc
    if score < 0 or score > 100:
        raise argparse.ArgumentTypeError(f"{flag} deve ser um inteiro 0-100, recebi {score}")
    return score


def write_json(path: str, payload: dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Estima o TrustScore de uma pasta de skill."
    )
    parser.add_argument("path", nargs="?", help="Pasta da skill ou caminho de um SKILL.md")
    parser.add_argument(
        "--ai-quality-score",
        type=lambda value: parse_agent_score(value, "--ai-quality-score"),
        help="Média 0-100 do grupo qualidade (AI Judge)",
    )
    parser.add_argument("--json", action="store_true", help="Escreve JSON em stdout")
    parser.add_argument("--json-out", help="Arquivo JSON de saída")
    return parser


def exit_code(report: dict[str, Any]) -> int:
    if not report.get("readable"):
        return 2
    return 1 if report.get("blocked") else 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.path:
        print("Informe a pasta da skill.", file=sys.stderr)
        return 2

    report = evaluate(args.path, ai_quality_score=args.ai_quality_score)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        stream = sys.stdout if report.get("readable") else sys.stderr
        print(format_report(report), file=stream)
    if args.json_out:
        write_json(args.json_out, report)
    return exit_code(report)


if __name__ == "__main__":
    sys.exit(main())

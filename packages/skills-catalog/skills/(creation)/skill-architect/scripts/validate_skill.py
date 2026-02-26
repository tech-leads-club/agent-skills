#!/usr/bin/env python3
"""
Validate a skill folder against Skill Architect requirements.

Usage:
    python scripts/validate_skill.py <path-to-skill-folder>
    python scripts/validate_skill.py <path-to-skill-folder> --format json
    python scripts/validate_skill.py <path-to-skill-folder> --json-out /tmp/skill-report.json

Exit codes:
    0 = pass (warnings allowed)
    1 = fail (at least one error)

Token-efficient workflow:
    Run once with --json-out, then reuse the saved JSON for feedback/review
    without re-running validation.
"""

import argparse
import json
import os
import re
import sys
from typing import Any

try:
    import yaml  # type: ignore[reportMissingImports]
except ImportError:
    yaml = None


class FrontmatterParseError(ValueError):
    """Raised when frontmatter parsing fails."""


def _parse_scalar(raw: str) -> Any:
    """Parse a scalar YAML-like value using stdlib-only rules."""
    value = raw.strip()
    if value == "":
        return ""

    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
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


def _collect_block_scalar(lines: list[str], start_idx: int, min_indent: int, folded: bool) -> tuple[str, int]:
    """Collect YAML block scalar lines (| or >) from start_idx."""
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

    # Fold style (>) joins non-empty lines with spaces.
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


def _parse_frontmatter_stdlib(frontmatter_raw: str) -> dict[str, Any]:
    """
    Parse a conservative subset of YAML frontmatter with stdlib only.

    Supported subset:
    - top-level `key: value`
    - one-level nested mapping:
      key:
        child: value
    - quoted/unquoted scalars
    - block scalars (`|`, `>`, and chomping variants)
    """
    lines = frontmatter_raw.splitlines()
    data: dict[str, Any] = {}
    i = 0

    top_key_pattern = re.compile(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$")
    nested_key_pattern = re.compile(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$")
    block_markers = {"|", ">", "|-", ">-"}

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped == "" or stripped.startswith("#"):
            i += 1
            continue

        if line.startswith(" "):
            raise FrontmatterParseError(f"Unexpected indentation at top level near line {i + 1}: {line}")

        top_match = top_key_pattern.match(line)
        if not top_match:
            raise FrontmatterParseError(f"Invalid top-level entry near line {i + 1}: {line}")

        key, raw_value = top_match.group(1), top_match.group(2).strip()

        if raw_value in block_markers:
            folded = raw_value.startswith(">")
            parsed_block, next_idx = _collect_block_scalar(lines, i + 1, min_indent=2, folded=folded)
            data[key] = parsed_block
            i = next_idx
            continue

        if raw_value != "":
            if raw_value.startswith("- "):
                raise FrontmatterParseError(
                    f"List syntax is not supported by fallback parser near line {i + 1}. Install PyYAML for full support."
                )
            data[key] = _parse_scalar(raw_value)
            i += 1
            continue

        # raw_value == "" -> nested mapping or empty value
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
        if not any(nl.strip() and not nl.strip().startswith("#") for nl in nested_lines):
            data[key] = ""
            i = j
            continue

        nested_data: dict[str, Any] = {}
        k = i + 1
        while k < j:
            nested_line = lines[k]
            nested_stripped = nested_line.strip()
            if nested_stripped == "" or nested_stripped.startswith("#"):
                k += 1
                continue
            if not nested_line.startswith("  "):
                raise FrontmatterParseError(f"Invalid nested indentation near line {k + 1}: {nested_line}")

            nested_content = nested_line[2:]
            if nested_content.startswith(" "):
                raise FrontmatterParseError(
                    f"Deep nesting is not supported by fallback parser near line {k + 1}. Install PyYAML for full support."
                )
            if nested_content.startswith("- "):
                raise FrontmatterParseError(
                    f"List syntax is not supported by fallback parser near line {k + 1}. Install PyYAML for full support."
                )

            nested_match = nested_key_pattern.match(nested_content)
            if not nested_match:
                raise FrontmatterParseError(f"Invalid nested mapping near line {k + 1}: {nested_line}")

            child_key, child_raw = nested_match.group(1), nested_match.group(2).strip()
            if child_raw in block_markers:
                folded = child_raw.startswith(">")
                child_block, next_k = _collect_block_scalar(lines, k + 1, min_indent=4, folded=folded)
                nested_data[child_key] = child_block
                k = next_k
                continue
            nested_data[child_key] = _parse_scalar(child_raw)
            k += 1

        data[key] = nested_data
        i = j

    return data


def parse_frontmatter(frontmatter_raw: str) -> tuple[dict[str, Any], str]:
    """Parse frontmatter using PyYAML when available, fallback to stdlib parser."""
    if yaml is not None:
        parsed = yaml.safe_load(frontmatter_raw)
        if not isinstance(parsed, dict):
            raise FrontmatterParseError("Frontmatter is not a YAML mapping")
        return parsed, "pyyaml"

    parsed = _parse_frontmatter_stdlib(frontmatter_raw)
    if not isinstance(parsed, dict):
        raise FrontmatterParseError("Frontmatter is not a mapping")
    return parsed, "stdlib"


def validate_skill(skill_path: str) -> dict:
    """Run all validation checks on a skill folder."""
    results = {
        "path": skill_path,
        "checks": [],
        "passed": 0,
        "failed": 0,
        "warnings": 0,
        "parser_mode": "unknown",
        "next_steps": [],
    }

    def add_check(name: str, passed: bool, message: str, severity: str = "error"):
        results["checks"].append({
            "name": name,
            "passed": passed,
            "message": message,
            "severity": severity,
        })
        if passed:
            results["passed"] += 1
        elif severity == "warning":
            results["warnings"] += 1
        else:
            results["failed"] += 1

    # --- Check 1: Folder exists ---
    if not os.path.isdir(skill_path):
        add_check("folder_exists", False, f"Path is not a directory: {skill_path}")
        results["summary"] = "FAIL — folder not found"
        return results
    add_check("folder_exists", True, "Skill folder exists")

    # --- Check 2: Folder name is kebab-case ---
    folder_name = os.path.basename(os.path.normpath(skill_path))
    kebab_pattern = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
    is_kebab = bool(kebab_pattern.match(folder_name))
    add_check(
        "folder_kebab_case",
        is_kebab,
        f"Folder name '{folder_name}' {'is' if is_kebab else 'is NOT'} kebab-case",
    )

    # --- Check 3: SKILL.md exists (exact casing) ---
    entries = os.listdir(skill_path)
    has_skill_md = "SKILL.md" in entries
    add_check("skill_md_exists", has_skill_md, "SKILL.md exists" if has_skill_md else "SKILL.md not found (case-sensitive)")

    # Check for wrong casing variants
    wrong_casings = [e for e in entries if e.lower() == "skill.md" and e != "SKILL.md"]
    if wrong_casings:
        add_check("skill_md_casing", False, f"Found wrong casing: {wrong_casings[0]} (must be exactly SKILL.md)")

    if not has_skill_md:
        results["summary"] = "FAIL — SKILL.md not found"
        return results

    # --- Check 4: No README.md ---
    has_readme = any(e.lower() == "readme.md" for e in entries)
    add_check(
        "no_readme",
        not has_readme,
        "No README.md in skill folder" if not has_readme else "README.md found — remove it (skills are for agents, not humans)",
    )

    # --- Check 5: Parse frontmatter ---
    skill_path_full = os.path.join(skill_path, "SKILL.md")
    with open(skill_path_full, "r", encoding="utf-8") as f:
        content = f.read()

    # Check for --- delimiters
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not fm_match:
        add_check("frontmatter_delimiters", False, "Missing or malformed --- delimiters in frontmatter")
        results["summary"] = "FAIL — frontmatter parse error"
        return results
    add_check("frontmatter_delimiters", True, "YAML frontmatter delimiters present")

    fm_raw = fm_match.group(1)

    try:
        fm, parser_mode = parse_frontmatter(fm_raw)
        results["parser_mode"] = parser_mode
        if parser_mode == "pyyaml":
            add_check("frontmatter_valid_yaml", True, "Frontmatter is valid YAML (parsed with PyYAML)")
        else:
            add_check(
                "frontmatter_valid_yaml",
                True,
                "Frontmatter parsed with stdlib fallback parser (install PyYAML for full YAML support)",
            )
    except Exception as e:
        add_check("frontmatter_valid_yaml", False, f"YAML parse error: {e}")
        results["summary"] = "FAIL — YAML parse error"
        return results

    # --- Check 6: name field ---
    name = fm.get("name")
    if not name:
        add_check("name_present", False, "Missing 'name' field in frontmatter")
    else:
        add_check("name_present", True, f"name: {name}")
        is_name_kebab = bool(kebab_pattern.match(str(name)))
        add_check("name_kebab_case", is_name_kebab, f"name '{name}' {'is' if is_name_kebab else 'is NOT'} kebab-case")

        # Check reserved names
        name_lower = str(name).lower()
        has_reserved = "claude" in name_lower or "anthropic" in name_lower
        add_check("name_not_reserved", not has_reserved, "Name does not use reserved terms" if not has_reserved else "Name contains 'claude' or 'anthropic' (reserved)")

        # Check name matches folder
        names_match = str(name) == folder_name
        add_check(
            "name_matches_folder",
            names_match,
            f"name '{name}' matches folder '{folder_name}'" if names_match else f"name '{name}' does NOT match folder '{folder_name}'",
            severity="warning",
        )

    # --- Check 7: description field ---
    desc = fm.get("description")
    if not desc:
        add_check("description_present", False, "Missing 'description' field in frontmatter")
    else:
        desc_str = str(desc).strip()
        add_check("description_present", True, f"description present ({len(desc_str)} chars)")

        # Length check
        desc_ok_length = len(desc_str) <= 1024
        add_check("description_length", desc_ok_length, f"Description length: {len(desc_str)}/1024 chars")

        # No XML brackets
        has_xml = "<" in desc_str or ">" in desc_str
        add_check("description_no_xml", not has_xml, "No XML brackets in description" if not has_xml else "XML angle brackets found in description (forbidden)")

        # Trigger phrase check
        trigger_keywords = ["use when", "use for", "use this", "trigger", "ask for", "asks to", "says", "mentions"]
        has_triggers = any(kw in desc_str.lower() for kw in trigger_keywords)
        add_check(
            "description_has_triggers",
            has_triggers,
            "Description includes trigger guidance" if has_triggers else "Missing trigger phrases — add 'Use when...' guidance (mandatory per CONTRIBUTING.md)",
        )

        # Negative scope check
        negative_keywords = ["do not use", "don't use", "not for", "not intended for"]
        has_negative_scope = any(kw in desc_str.lower() for kw in negative_keywords)
        add_check(
            "description_has_negative_scope",
            has_negative_scope,
            "Description includes negative scope" if has_negative_scope else "Missing negative scope — add 'Do NOT use for...' guidance (mandatory per CONTRIBUTING.md)",
        )

    # --- Check 7b: metadata field ---
    metadata = fm.get("metadata")
    if not metadata or not isinstance(metadata, dict):
        add_check("metadata_present", False, "Missing 'metadata' field in frontmatter (expected metadata.version and metadata.author)", severity="warning")
    else:
        add_check("metadata_present", True, "metadata field present")

        meta_version = metadata.get("version")
        has_version = bool(meta_version)
        add_check(
            "metadata_version",
            has_version,
            f"metadata.version: {meta_version}" if has_version else "Missing metadata.version",
            severity="warning",
        )

        meta_author = metadata.get("author")
        has_author = bool(meta_author)
        add_check(
            "metadata_author",
            has_author,
            f"metadata.author: {meta_author}" if has_author else "Missing metadata.author",
            severity="warning",
        )

    # --- Check 8: Body content ---
    body = content[fm_match.end():]
    body_lines = body.strip().split("\n")
    line_count = len(body_lines)

    add_check(
        "body_line_count",
        line_count <= 500,
        f"SKILL.md body: {line_count} lines {'(good)' if line_count <= 500 else '(consider moving content to references/)'}",
        severity="warning" if line_count > 500 else "error",
    )

    # Check for examples
    has_examples = bool(re.search(r"(?i)(example|user says|result:)", body))
    add_check(
        "body_has_examples",
        has_examples,
        "Instructions include examples" if has_examples else "Consider adding usage examples",
        severity="warning",
    )

    # Check for error handling
    has_error_handling = bool(re.search(r"(?i)(error|fail|troubleshoot|issue|problem|if.*fails)", body))
    add_check(
        "body_has_error_handling",
        has_error_handling,
        "Instructions include error handling" if has_error_handling else "Consider adding error handling guidance",
        severity="warning",
    )

    # --- Check 9: Optional files ---
    if "references" in entries and os.path.isdir(os.path.join(skill_path, "references")):
        refs = os.listdir(os.path.join(skill_path, "references"))
        # Check if references are mentioned in body
        for ref in refs:
            ref_mentioned = ref in body or f"references/{ref}" in body
            add_check(
                f"ref_linked_{ref}",
                ref_mentioned,
                f"references/{ref} is referenced in SKILL.md" if ref_mentioned else f"references/{ref} exists but is not referenced in SKILL.md",
                severity="warning",
            )

    # --- Summary ---
    if results["failed"] == 0:
        results["summary"] = f"PASS — {results['passed']} checks passed" + (
            f", {results['warnings']} warnings" if results["warnings"] > 0 else ""
        )
    else:
        results["summary"] = f"FAIL — {results['failed']} errors, {results['warnings']} warnings"

    if results["failed"] > 0:
        results["next_steps"] = [
            f"Fix check '{check['name']}': {check['message']}"
            for check in results["checks"]
            if (not check["passed"] and check["severity"] == "error")
        ]

    return results


def print_report(results: dict, verbose: bool = False):
    """Print a compact human-readable report."""
    print(f"\n{'=' * 60}")
    print(f"  Skill Validation Report")
    print(f"  Path: {results['path']}")
    print(f"  Parser: {results.get('parser_mode', 'unknown')}")
    print(f"{'=' * 60}\n")

    for check in results["checks"]:
        if check["passed"] and not verbose:
            continue
        icon = "✅" if check["passed"] else ("⚠️" if check["severity"] == "warning" else "❌")
        print(f"  {icon} {check['name']}: {check['message']}")

    print(f"\n{'─' * 60}")
    print(f"  {results['summary']}")
    print(f"  Passed: {results['passed']} | Failed: {results['failed']} | Warnings: {results['warnings']}")
    print(f"{'─' * 60}\n")

    if results.get("next_steps"):
        print("  Next steps:")
        for i, step in enumerate(results["next_steps"], start=1):
            print(f"    {i}. {step}")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Validate a skill folder",
        epilog="Tip: use --json-out FILE to save full results and avoid re-running for later feedback.",
    )
    parser.add_argument("path", help="Path to the skill folder")
    parser.add_argument(
        "--format",
        choices=["human", "json", "both"],
        default="human",
        help="Output format (default: human)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Include passed checks in human output",
    )
    parser.add_argument(
        "--pretty-json",
        action="store_true",
        help="Pretty-print JSON (default is compact JSON)",
    )
    parser.add_argument(
        "--json-out",
        help="Write JSON report to a file (compact by default)",
    )
    args = parser.parse_args()

    results = validate_skill(args.path)

    if args.format in {"human", "both"}:
        print_report(results, verbose=args.verbose)
        if not args.json_out:
            print("  Tip: add --json-out FILE to reuse this report without re-running.\n")

    if args.format in {"json", "both"}:
        if args.format == "both":
            print("--- JSON Report ---")
        indent = 2 if args.pretty_json else None
        separators = None if args.pretty_json else (",", ":")
        report_json = json.dumps(results, indent=indent, separators=separators)
        print(report_json)

    if args.json_out:
        indent = 2 if args.pretty_json else None
        separators = None if args.pretty_json else (",", ":")
        report_json = json.dumps(results, indent=indent, separators=separators)
        with open(args.json_out, "w", encoding="utf-8") as out_file:
            out_file.write(report_json)
        if args.format in {"human", "both"}:
            print(f"  JSON report saved to: {args.json_out}")

    sys.exit(0 if results["failed"] == 0 else 1)

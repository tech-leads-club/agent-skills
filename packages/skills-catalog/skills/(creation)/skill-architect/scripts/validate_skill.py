#!/usr/bin/env python3
"""
Validates a skill folder against all structural requirements from the
Complete Guide to Building Skills for AI Agents.

Usage:
    python scripts/validate_skill.py <path-to-skill-folder>

Returns exit code 0 if all checks pass, 1 if any fail.
Outputs a JSON report to stdout.
"""

import json
import os
import re
import sys
import yaml


def validate_skill(skill_path: str) -> dict:
    """Run all validation checks on a skill folder."""
    results = {
        "path": skill_path,
        "checks": [],
        "passed": 0,
        "failed": 0,
        "warnings": 0,
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
        fm = yaml.safe_load(fm_raw)
        if not isinstance(fm, dict):
            raise ValueError("Frontmatter is not a YAML mapping")
        add_check("frontmatter_valid_yaml", True, "Frontmatter is valid YAML")
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

        # Trigger phrase heuristic
        trigger_keywords = ["use when", "use for", "use this", "trigger", "ask for", "asks to", "says", "mentions"]
        has_triggers = any(kw in desc_str.lower() for kw in trigger_keywords)
        add_check(
            "description_has_triggers",
            has_triggers,
            "Description includes trigger guidance" if has_triggers else "Description may be missing trigger phrases (add 'Use when...' guidance)",
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

    return results


def print_report(results: dict):
    """Print a human-readable report."""
    print(f"\n{'=' * 60}")
    print(f"  Skill Validation Report")
    print(f"  Path: {results['path']}")
    print(f"{'=' * 60}\n")

    for check in results["checks"]:
        icon = "✅" if check["passed"] else ("⚠️" if check["severity"] == "warning" else "❌")
        print(f"  {icon} {check['name']}: {check['message']}")

    print(f"\n{'─' * 60}")
    print(f"  {results['summary']}")
    print(f"  Passed: {results['passed']} | Failed: {results['failed']} | Warnings: {results['warnings']}")
    print(f"{'─' * 60}\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <path-to-skill-folder>")
        sys.exit(1)

    path = sys.argv[1]
    results = validate_skill(path)
    print_report(results)

    # Also output JSON for programmatic use
    print("--- JSON Report ---")
    print(json.dumps(results, indent=2))

    sys.exit(0 if results["failed"] == 0 else 1)

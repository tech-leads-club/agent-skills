"""
lean_config.py - what a feature's artifacts say the Verifier owes, read the same way by every gate.

Three facts decide it: the `Mutations: N` line in checks.md and verification.md (how many
mutations are injected, 0 to 5), whether the feature has a screen (the screen comparison), and
whether plan.md's `## Sources` marks a source binding (the binding-source comparison).
validate_checks.py and validate_verification.py both act on these, so they live in one place - two
copies of the same rule drift until one gate demands what the other does not.

Every function takes lines already stripped of fenced blocks.
"""

import os
import re

MAX_MUTATIONS = 5

MUTATIONS_RE = re.compile(r"^\**Mutations\**\s*:\s*\**\s*`?(\d+)`?\**\s*(?:[-–—:]\s*(.*))?$", re.IGNORECASE)
BINDING_RE = re.compile(r"(?<![-\w])binding\b", re.IGNORECASE)
NOT_BINDING_RE = re.compile(r"\b(non|not)[- ]binding\b", re.IGNORECASE)
CAPTURE_RE = re.compile(r"`([^`\s]+\.(?:png|jpe?g|webp|gif))`", re.IGNORECASE)
SCREEN_CRITERION_RE = re.compile(r"\bSHALL\s+(?:NOT\s+)?(?:show|display|render|hide)\b", re.IGNORECASE)
PROOF_RE = re.compile(r"^\**\s*Proof\s*\**\s*:\s*`?browser\b", re.IGNORECASE)
CRITERION_RE = re.compile(r"^\s*\d+\.\s+(.*)$")


def checks_file(fdir):
    """checks.md, or tasks.md (or spec.md with no tasks) where the spec-driven flow keeps `## Checks`."""
    for name in ("checks.md", "tasks.md", "spec.md"):
        path = os.path.join(fdir, name)
        if os.path.exists(path):
            return path
    return os.path.join(fdir, "checks.md")


def plan_file(fdir):
    """plan.md, or spec.md in the spec-driven flow."""
    for name in ("plan.md", "spec.md"):
        path = os.path.join(fdir, name)
        if os.path.exists(path):
            return path
    return os.path.join(fdir, "plan.md")


def read_mutations(lines):
    """Return (count, reason) from the first `Mutations:` line, or (None, "") when there is none."""
    for ln in lines:
        m = MUTATIONS_RE.match(ln.strip())
        if m:
            return int(m.group(1)), (m.group(2) or "").strip()
    return None, ""


def _section(lines, name):
    """The lines under a `#`/`##` heading named `name`, up to the next `#`/`##` heading."""
    out, inside = [], False
    for ln in lines:
        s = ln.strip()
        if re.match(r"^#{1,2}\s+\S", s):
            inside = re.match(r"^#{1,2}\s+" + re.escape(name) + r"\b", s, re.IGNORECASE) is not None
            continue
        if inside:
            out.append(s)
    return out


def plan_criteria(plan_lines):
    """The text of every numbered criterion under `## Criteria` (`## User Stories` in a spec)."""
    out = []
    for s in _section(plan_lines, "Criteria") or _section(plan_lines, "User Stories"):
        m = CRITERION_RE.match(s)
        if m:
            out.append(m.group(1))
    return out


def plan_has_screen(plan_lines, checks_lines=()):
    """True when the feature puts a screen in front of a user.

    A criterion that cites a capture or says the system SHALL show, display, render or hide
    something is a screen criterion; so is a `browser` proof in checks.md.
    """
    for text in plan_criteria(plan_lines):
        if CAPTURE_RE.search(text) or SCREEN_CRITERION_RE.search(text):
            return True
    return any(PROOF_RE.match(s.strip()) for s in checks_lines)


def plan_owes_pictures(plan_lines, checks_lines=()):
    """True when the feature owes running pictures: a criterion cites a capture, or a check is
    proven in the browser. A screen state no capture draws is proven by a test or a walk."""
    if any(CAPTURE_RE.search(text) for text in plan_criteria(plan_lines)):
        return True
    return any(PROOF_RE.match(s.strip()) for s in checks_lines)


def plan_marks_binding(plan_lines):
    """True when plan.md's `## Sources` marks a source binding (the binding-source comparison runs)."""
    return any(BINDING_RE.search(s) and not NOT_BINDING_RE.search(s) for s in _section(plan_lines, "Sources"))

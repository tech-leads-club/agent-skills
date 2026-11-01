#!/usr/bin/env python3
"""
selftest.py - mutation testing against this skill's own gates, plus a smoke run of its tooling.

The gates in validate_plan.py, validate_checks.py and validate_verification.py are only
worth their invocation if they FAIL when the artifact is wrong. A validator that exits 0
on everything is decoration, and nothing about running it would reveal that. So the same
discipline the skill demands of a feature applies to the skill: mutate the artifact, run
the gate, and require the mutant to be killed.

Run this after editing any validator, and after editing the templates in references/ -
a template change that drifts from what a validator parses shows up here as a broken
baseline rather than as a silent pass in six months.

Fixtures live in scripts/fixtures/ as a complete, filled-in worked example (a real feature
shape, not placeholders). They double as the reference for what a passing artifact looks like.

Usage:
  python3 <skill-dir>/scripts/selftest.py [-v]

Exit codes: 0 all mutants killed and the baseline is clean, 1 otherwise.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURES = os.path.join(HERE, "fixtures")
FEATURE = "billing"


def shipped(script):
    """The plan and implement skills ship part of these scripts; a case for one they lack is skipped."""
    return os.path.isfile(os.path.join(HERE, script if script.endswith(".py") else script + ".py"))

# (validator, artifact, description, mutation, expected exit, expected message fragment)
CASES = [
    ("validate_checks", "checks.md", "no Build line",
     lambda s: s.replace("Build: `bin/rubocop app/billing`\n", "", 1),
     1, "no `Build:` line"),
    ("validate_checks", "checks.md", "drop one member from a size-5 set",
     lambda s: s.replace(" · `trial_will_end` C10 | - |", " | - |", 1),
     1, "declares 5 members but only 4"),
    ("validate_checks", "checks.md", "remove a check's Proof line",
     lambda s: re.sub(r"\nProof: `bin/rails test test/billing/access_test\.rb[^\n]*\n", "\n", s),
     1, "C4 has no `Proof:` line"),
    ("validate_checks", "checks.md", "delete the concurrency sweep line",
     lambda s: s.replace("- concurrency: C7\n", ""),
     1, "dimension 'concurrency' has no line"),
    ("validate_checks", "checks.md", "bare n/a with no reason",
     lambda s: re.sub(r"- data lifecycle: n/a[^\n]*", "- data lifecycle: n/a", s),
     1, "`n/a` with no reason"),
    ("validate_checks", "checks.md", "a run proof with no Run line",
     lambda s: re.sub(r"^Run billing: [^\n]*\n", "", s, flags=re.M),
     1, "no `Run billing: <command>` line defines it"),
    ("validate_checks", "checks.md", "a run proof with no expected line",
     lambda s: s.replace("Proof: run billing | test_failed_charge_suspends = .", "Proof: run billing"),
     1, "names no line after `|`"),
    ("validate_checks", "checks.md", "a run proof with an empty expected line",
     lambda s: s.replace("Proof: run billing | test_failed_charge_suspends = .", "Proof: run billing |"),
     1, "names no line after `|`"),
    ("validate_checks", "checks.md", "a Run line no proof reads (warn)",
     lambda s: s.replace("Build: `bin/rubocop app/billing`\n", "Build: `bin/rubocop app/billing`\nRun e2e: `npx playwright test`\n"),
     0, "`Run e2e` is read by no proof"),
    ("validate_checks", "checks.md", "reference an undefined check",
     lambda s: s.replace("into it C1 ·", "into it C99 ·"),
     1, "C99 is referenced in Coverage"),
    ("validate_checks", "checks.md", "duplicate check id",
     lambda s: s.replace("**C6** - A `Suspended` subscription returns", "**C5** - A `Suspended` subscription returns"),
     1, "duplicate check id C5"),
    ("validate_checks", "checks.md", "non-empty Unproven cell",
     lambda s: s.replace("| C2, table-driven over all 9 | - |", "| C2, table-driven over all 9 | `paused` |"),
     1, "Unproven is '`paused`'"),
    ("validate_checks", "checks.md", "proof with no test selector (warn)",
     lambda s: s.replace('Proof: `bin/rails test test/billing/access_test.rb -n "/suspended_denies_paid_groups/"`',
                         "Proof: `bin/rails test`"),
     0, "names no test selector"),
    ("validate_checks", "checks.md", "vague claim (warn)",
     lambda s: s.replace("denies access to paid access groups", "handles access gracefully"),
     0, "instead of a concrete value"),

    ("validate_plan", "plan.md", "missing Shape section",
     lambda s: s.replace("## Shape", "## How it hangs together"),
     1, "missing required section: ## Shape"),
    ("validate_plan", "plan.md", "empty Shape section",
     lambda s: re.sub(r"## Shape\n.*?\n## Surface", "## Shape\n\n## Surface", s, flags=re.S),
     1, "Shape section is empty"),
    ("validate_plan", "plan.md", "a Shape with no Changes underneath",
     lambda s: s.replace("**Changes underneath**", "**What moves**"),
     1, "no `Changes underneath` part"),
    ("validate_plan", "plan.md", "empty Surface section",
     lambda s: re.sub(r"## Surface\n.*?\n## Landing", "## Surface\n\n## Landing", s, flags=re.S),
     1, "Surface section is empty"),
    ("validate_plan", "plan.md", "empty Landing section",
     lambda s: re.sub(r"## Landing\n.*?\n## Criteria", "## Landing\n\n## Criteria", s, flags=re.S),
     1, "Landing section is empty"),
    ("validate_plan", "plan.md", "Landing door with no rejected alternative",
     lambda s: s.replace("| a boolean `is_suspended` - cannot express the next state |", "|  |"),
     1, "no rejected alternative"),
    ("validate_plan", "plan.md", "Landing door with no literal shape",
     lambda s: s.replace("| enum value, not null, existing rows backfilled to `active` |", "|  |"),
     1, "no literal shape"),
    ("validate_plan", "plan.md", "columns and types creep into the stored shape",
     lambda s: s.replace(
         "    Subscription ||--o{ WebhookDelivery : \"reported by\"",
         "    Subscription {\n        string status\n        datetime suspended_at\n    }\n"
         "    Subscription ||--o{ WebhookDelivery : \"reported by\""),
     1, "carries an attribute block"),
    ("validate_plan", "plan.md", "a Surface route with no statuses",
     lambda s: s.replace("| `200`, `401`, `409`, `422` |", "|  |"),
     1, "names no status code"),
    ("validate_plan", "plan.md", "check ids written into Surface before checks exist",
     lambda s: s.replace("anything else gets `401` |", "anything else gets `401` | C7, C8, C9 |"),
     1, "does not exist yet"),
    ("validate_plan", "plan.md", "a restricted Surface route with no status for the callers it refuses",
     lambda s: s.replace("| `200`, `401`, `409`, `422` |", "| `200`, `409`, `422` |"),
     1, "names no code for the rest"),
    ("validate_plan", "plan.md", "a Surface table with no Who column",
     lambda s: s.replace("| Status | Who |\n| --- | --- | --- | --- | --- |", "| Status |\n| --- | --- | --- | --- |")
                .replace(" | the provider, with a valid signature; anything else gets `401` |", " |"),
     1, "no Who column"),
    ("validate_plan", "plan.md", "a Flow hop naming a module that neither exists nor is a door (warn)",
     lambda s: s.replace(
         "3. `Billing::StatusMap` (new) - provider status -> local status",
         "3. `Billing::StatusMapFactory` - provider status -> local status"),
     0, "without marking it as existing or as a"),
    ("validate_checks", "plan.md", "a route reviewed in the plan that no check mentions (warn)",
     lambda s: s.replace("`POST /webhooks/provider`", "`POST /webhooks/provider/v2`"),
     0, "owe a Coverage row, or the route is dead"),

    ("validate_plan", "plan.md", "acceptance criterion with no SHALL",
     lambda s: s.replace("THEN the system SHALL set the subscription status", "THEN we set the subscription status"),
     1, "has no SHALL"),
    ("validate_plan", "plan.md", "a criterion after a rule's indented examples is still read",
     lambda s: s.replace("THEN the system SHALL leave the status unchanged", "THEN we leave the status unchanged"),
     1, "has no SHALL"),
    ("validate_plan", "plan.md", "assumption with no rationale",
     lambda s: s.replace("| the provider already retried 3 times before it reports a failure |", "|  |"),
     1, "empty 'Rationale'"),
    ("validate_plan", "plan.md", "missing required section",
     lambda s: s.replace("## Assumptions", "## Open Decisions"),
     1, "missing required section: ## Assumptions"),
    ("validate_plan", "plan.md", "out hop naming a slug in backticks is not an unresolved module",
     lambda s: s.replace(
         "5. out: `200` `{}`, and `AccessPolicy` (exists) reads `status` on the next request - no call from here",
         "5. out: `200` `{}`; `completo` stays"),
     0, "0 warning"),
    ("validate_plan", "plan.md", "flowchart node neither existing nor a door (warn)",
     lambda s: s.replace(
         "3. `Billing::StatusMap` (new) - provider status -> local status",
         "```mermaid\nflowchart TD\n    A[\"Billing::StatusMap\"] --> B[\"Billing::Ledger\"]\n```"),
     0, "belongs in the diff"),
    ("validate_plan", "plan.md", "a path with no drawing",
     lambda s: re.sub(r"```mermaid\nsequenceDiagram\n.*?```\n", "", s, flags=re.S),
     1, "does not draw it"),
    ("validate_plan", "plan.md", "a module on the path missing from its drawing",
     lambda s: s.replace("    participant M as Billing::StatusMap\n", "").replace("I->>M", "I->>S").replace("M->>S", "S->>S"),
     1, "`Billing::StatusMap` is on the path but not in its drawing"),
    ("validate_plan", "plan.md", "no data drawing and no `Data: none`",
     lambda s: re.sub(r"```mermaid\nerDiagram\n.*?```\n", "", s, flags=re.S),
     1, "no `erDiagram` of the data"),
    ("validate_plan", "plan.md", "a data drawing with no `New:` line",
     lambda s: s.replace("New: `WebhookDelivery` and its link to `Subscription`. ", ""),
     1, "has no `New:` line"),
    ("validate_plan", "plan.md", "a capture the plan does not show as an image",
     lambda s: s.replace("![card form](captures/billing--card-form.png) ", ""),
     1, "is not shown in the plan"),
    ("validate_plan", "plan.md", "a single-module path owes no drawing",
     lambda s: re.sub(r"```mermaid\nsequenceDiagram\n.*?```\n", "single module - `Billing::Subscription`\n", s, flags=re.S),
     0, "0 error"),
    ("validate_plan", "plan.md", "open question left unresolved (warn)",
     lambda s: s.replace("**Open questions:** none - all resolved or logged above.",
                         "**Open questions:** what happens on a chargeback?"),
     0, "do not read as resolved"),

    ("validate_verification", "verification.md", "self-verified report (warn)",
     lambda s: s.replace("independent sub-agent (author != verifier)", "self-verified (degraded - no sub-agent)"),
     0, "self-verified"),
]

LAST_AC = "7. IF a delivery carries no valid provider signature THEN the system SHALL return `401` and persist nothing\n"
SHOW_AC = "9. WHEN a member opens Billing THEN the system SHALL show `Card declined` above the plans\n"


def write_artifact(path, content):
    """Text artifacts are written as UTF-8; a picture is bytes. An approval written `hash: {hash}` is
    stamped with the hash of the text it sits in, as approve.py writes it."""
    if isinstance(content, bytes):
        with open(path, "wb") as f:
            f.write(content)
        return
    if "hash: {hash}" in content:
        from specs import content_hash
        content = content.replace("hash: {hash}", "hash: " + content_hash(content))
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def read_artifact(path):
    """The artifact's text, or "" when it does not exist."""
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read()


def png(width, height):
    """The header of a PNG of that size - all the size gate reads."""
    return (b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\rIHDR"
            + width.to_bytes(4, "big") + height.to_bytes(4, "big") + b"\x08\x02\x00\x00\x00")



def with_screen(s):
    return s.replace(LAST_AC, LAST_AC + SHOW_AC, 1)


def with_binding_bare(s):
    return s.replace("- provider webhook reference - the 9 statuses",
                     "- design `03` - **binding for the interface** - the 9 statuses")


# The capture sits in the feature folder, where the scaffold always writes it.
CAPTURE = ".specs/features/billing/captures/billing--card-form.png"
DIFFERENCES = (
    "## Differences from the source\n\n| Source shows | Product shows | Confirmed |\n| --- | --- | --- |\n"
    "| Update card | Atualizar cartão | y - AD-002 |\n"
    "| invoice download link | nothing | y - AD-003 |\n\n"
)
STATE = (
    "# Project state\n\n## Decisions\n\n| ID | Decision | Rationale | Status | Date |\n| --- | --- | --- | --- | --- |\n"
    "| AD-002 | Billing copy is Portuguese, not the design's English | asked \"Which language?\", answered Portuguese | active | 2026-10-23 |\n"
    "| AD-003 | Billing ships without the invoice link | asked \"Invoice link now?\", answered TLC-420 | active | 2026-10-23 |\n"
    "| AD-004 | Billing shows a download link | superseded by AD-003 | superseded by AD-003 | 2026-10-22 |\n"
)
SCREEN_AC = f"8. WHEN a member opens Billing THEN the system SHALL show the screen in `{CAPTURE}`\n"
SCREEN_CHECK = (f"\n**C99** - A member opening Billing sees the screen in `{CAPTURE}` (AC 8)\n"
                "Proof: `bin/rails test test/system/billing_test.rb -n \"/billing screen matches capture/\"`\n")


def with_screen_check(s):
    return s.replace("\n## Coverage", SCREEN_CHECK + "\n## Coverage", 1)


def with_binding(s):
    return (with_binding_bare(s).replace("## Sources", DIFFERENCES + "## Sources", 1)
            .replace(LAST_AC, LAST_AC + SCREEN_AC, 1))


def with_diff(old, new):
    return lambda s: with_binding(s).replace(old, new)


RUNNING = "screens/billing.running.png"


def screens_md(verdict, round_line="**Round**: 1\n"):
    return lambda s: (
        "# Billing screens\n\n**Verifier**: independent sub-agent (author != verifier)\n" + round_line + "\n"
        "| Screen | Compared with | Verdict | Finding |\n| --- | --- | --- | --- |\n"
        f"| `{RUNNING}` | AC 9 | {verdict} | - |\n")


def with_browser_shot(rel):
    return lambda s: s.replace(
        "\n## Coverage", f"\nProof: browser - save `{rel}`\n\n## Coverage", 1)


def with_walk_proof(s):
    return s.replace("\n## Coverage", "\nProof: walk - open Items from the nav\n\n## Coverage", 1)


def with_walked(s):
    return s.replace("## Handoff\n", "## Handoff\n\n- **Walked:** opened Items from the nav, the list showed\n", 1)


# Mutants that need more than one artifact edited: the screen rules read plan.md and judge
# another file. (validator, description, {artifact: edit}, expected exit, expected fragment)
MULTI_CASES = [
    ("validate_verification", "a browser proof and no screens.md",
     {"plan.md": with_screen, "checks.md": with_browser_shot(RUNNING), RUNNING: lambda s: "png"},
     1, "no `screens.md`"),
    ("validate_verification", "a screen that diverges in screens.md next to PASS",
     {"plan.md": with_screen, "screens.md": screens_md("diverges - the card form sits below the plan list"),
      "checks.md": with_browser_shot(RUNNING), RUNNING: lambda s: "png"},
     1, "reads 'diverges"),
    ("validate_verification", "a plan citing a capture and no running screenshot",
     {"plan.md": lambda s: with_screen(with_binding(s)), "screens.md": screens_md("matches")},
     1, "no `*.running.png`"),
    ("validate_verification", "a cited capture with no running screenshot beside it",
     {"plan.md": lambda s: with_screen(with_binding(s)), "screens.md": screens_md("matches"),
      "screens/other.running.png": lambda s: "png"},
     1, "has no `billing--card-form.running.png`"),
    ("validate_verification", "a browser proof names a screenshot that is not on disk",
     {"plan.md": with_screen, "screens.md": screens_md("matches"),
      "checks.md": with_browser_shot("screens/missing.running.png"), RUNNING: lambda s: "png"},
     1, "which is not under the feature folder"),
    ("validate_verification", "a browser proof names no screenshot",
     {"plan.md": with_screen, "screens.md": screens_md("matches"),
      "checks.md": lambda s: s.replace("\n## Coverage", "\nProof: browser - click the button\n\n## Coverage", 1),
      RUNNING: lambda s: "png"},
     1, "names no `.running.png`"),
    ("validate_verification", "a browser proof alone makes a screen, and there is no screens.md",
     {"checks.md": with_browser_shot(RUNNING), RUNNING: lambda s: "png"},
     1, "no `screens.md`"),
    ("validate_verification", "a picture taken at another size than its capture",
     {"plan.md": lambda s: with_screen(with_binding(s)), "screens.md": screens_md("matches"),
      "captures/billing--card-form.png": lambda s: png(1024, 839),
      "captures/billing--card-form.running.png": lambda s: png(1440, 1200)},
     1, "take the picture at the capture's size"),
    ("validate_verification", "proofs.md with a failing proof",
     {"proofs.md": lambda s: re.sub(r"^(\| C5 \|.*\| )pass \|$", r"\1**no test ran** |", s, flags=re.M)},
     1, "C5 reads"),
    ("validate_verification", "proofs.md with no row for a check",
     {"proofs.md": lambda s: re.sub(r"^\| C12 \|[^\n]*\n", "", s, flags=re.M)},
     1, "has no row for C12"),
    ("validate_verification", "proofs.md where a run group failed",
     {"proofs.md": lambda s: s.replace("| Build |", "| Run billing | `bin/rails test test/billing -v` | **fail** - exit 1 |\n| Build |")},
     1, "Run billing reads"),
    ("validate_verification", "a report with no Checks table",
     {"verification.md": lambda s: re.sub(r"## Checks\n.*?\n## Findings", "## Findings", s, flags=re.S)},
     1, "no `## Checks` table"),
    ("validate_verification", "a Checks table with no row for a check",
     {"verification.md": lambda s: re.sub(r"^\| C7 \|[^\n]*\n", "", s, flags=re.M)},
     1, "`## Checks` has no row for C7"),
    ("validate_verification", "a Checks row that names no test",
     {"verification.md": lambda s: s.replace("| C9 | `test/webhooks/ingest_test.rb` `test_missing_subscription_id_is_422` |", "| C9 | - |")},
     1, "row C9 names no test"),
    ("validate_verification", "a finding with no commit in Closed",
     {"verification.md": lambda s: s.replace("| e4f5a6b C4 |", "|  |")},
     1, "is not closed"),
    ("validate_verification", "a report with no Findings section",
     {"verification.md": lambda s: s.split("## Findings")[0]},
     1, "no `## Findings` section"),
    ("validate_verification", "proofs.md where the build failed",
     {"proofs.md": lambda s: s.replace("| Build | `bin/rubocop app/billing` | pass |", "| Build | `bin/rubocop app/billing` | **fail** - 2 offenses |")},
     1, "Build reads"),
    ("validate_verification", "proofs.md with no Build row while checks.md names a build",
     {"proofs.md": lambda s: s.replace("| Build | `bin/rubocop app/billing` | pass |\n", "")},
     1, "has no Build row"),
    ("validate_verification", "proofs.md written over uncommitted changes",
     {"proofs.md": lambda s: s.replace("**Tree**: clean", "**Tree**: dirty - apps/x.ts")},
     1, "ran on uncommitted changes"),
    ("validate_verification", "a .jpg capture with no running picture beside it",
     {"plan.md": lambda s: with_screen(with_binding(s)).replace("billing--card-form.png", "billing--card-form.jpg"),
      "captures/billing--card-form.jpg": lambda s: "jpg", "screens.md": screens_md("matches")},
     1, "has no `billing--card-form.running.png`"),
    ("validate_verification", "a walk proof with no Walked line in the Handoff",
     {"checks.md": with_walk_proof},
     1, "no `**Walked:**` line"),
    ("validate_verification", "screens.md with no Round line",
     {"plan.md": with_binding, "screens.md": screens_md("matches", ""),
      "captures/billing--card-form.running.png": lambda s: "png"},
     1, "no `**Round**:` line"),
    ("validate_verification", "screens.md in a third round",
     {"plan.md": with_binding, "screens.md": screens_md("matches", "**Round**: 3\n"),
      "captures/billing--card-form.running.png": lambda s: "png"},
     1, "there is no third round"),
    ("validate_plan", "a binding source with no Differences section",
     {"plan.md": lambda s: with_binding(s).replace(DIFFERENCES, "")},
     1, "no `## Differences from the source` section"),
    ("validate_plan", "a difference the user never confirmed",
     {"plan.md": with_diff("| y - AD-003 |", "| n - the agent decided |")},
     1, "is the user's call"),
    ("validate_plan", "a difference with a blank Confirmed cell",
     {"plan.md": with_diff("| y - AD-002 |", "|  |")},
     1, "is the user's call"),
    ("validate_plan", "a confirmed difference that cites no decision",
     {"plan.md": with_diff("| y - AD-002 |", "| y - existing fields, 2026-10-23 |")},
     1, "cites no decision"),
    ("validate_plan", "a difference citing a decision STATE.md does not hold",
     {"plan.md": with_diff("| y - AD-002 |", "| y - AD-009 |")},
     1, "does not hold as active"),
    ("validate_plan", "a difference citing a superseded decision",
     {"plan.md": with_diff("| y - AD-003 |", "| y - AD-004 |")},
     1, "does not hold as active"),
    ("validate_plan", "a Differences section with no rows and no None",
     {"plan.md": lambda s: re.sub(r"## Differences from the source\n.*?\n## Sources",
                                  "## Differences from the source\n\nsee chat\n\n## Sources",
                                  with_binding(s), flags=re.S)},
     1, "has no rows"),
    ("validate_plan", "a capture a criterion cites that does not exist",
     {"plan.md": with_diff(f"`{CAPTURE}`", "`.specs/features/billing/captures/nope.png`")},
     1, "does not exist"),
    ("validate_plan", "a design-file link where an exported capture belongs",
     {"plan.md": with_diff(f"`{CAPTURE}`", "`https://design.example.com/file/abc?node-id=12-34`")},
     1, "is a link, not a capture"),
    ("validate_plan", "a capture under captures/ that no criterion cites",
     {"plan.md": lambda s: with_binding(s).replace(SCREEN_AC, "")},
     1, "no criterion cites the capture"),
    ("validate_plan", "a capture the planner made non-binding without the user's words",
     {"plan.md": lambda s: s.replace(' - user: "only the tone, the layout is ours"', "")},
     1, "no line quotes the user"),
    ("validate_plan", "a capture in captures/ that Sources never mentions and nothing binds",
     {"plan.md": lambda s: s.replace(
         '- ![card form](captures/billing--card-form.png) `captures/billing--card-form.png` - non-binding - user: "only the tone, the layout is ours" - the card form\'s wording\n', "")},
     1, "no line quotes the user"),
    ("validate_checks", "a screen criterion cites a capture and no check cites it",
     {"plan.md": with_binding},
     1, "no check proving AC 8 does"),
]

# Negative controls: a gate that fires where it should not is the same bug as one that never
# fires - it just fails loudly instead of silently.
NEGATIVE_CONTROLS = [
    ("validate_checks", "a run proof needs no test selector - its expected line is one",
     {"checks.md": lambda s: s.replace("test_failed_charge_suspends = .", "test_failed_charge_suspends PASS")},
     "names no test selector"),
    ("validate_checks", "an old checks.md with a Mutations line is still read",
     {"checks.md": lambda s: s.replace("Build: `bin/rubocop", "Mutations: 3\nBuild: `bin/rubocop")}),
    ("validate_verification", "an old checks.md with a Mutations line owes nothing",
     {"checks.md": lambda s: s.replace("Build: `bin/rubocop", "Mutations: 3\nBuild: `bin/rubocop")}),
    ("validate_plan", "a binding source with confirmed differences is accepted",
     {"plan.md": with_binding}),
    ("validate_plan", "a binding source that matches with no differences is accepted",
     {"plan.md": lambda s: with_binding(s).replace(
         DIFFERENCES, "## Differences from the source\n\nNone - the product matches the source\n\n")}),
    ("validate_plan", "a capture the Sources line binds needs no quote",
     {"plan.md": lambda s: with_binding(s).replace(
         '- ![card form](captures/billing--card-form.png) `captures/billing--card-form.png` - non-binding - user: "only the tone, the layout is ours" - the card form\'s wording',
         "- ![card form](captures/billing--card-form.png) `captures/billing--card-form.png` - binding - the card form")}),
    ("validate_plan", "a Surface route anyone may call owes no refusal status",
     {"plan.md": lambda s: s.replace(
         "| `200`, `401`, `409`, `422` | the provider, with a valid signature; anything else gets `401` |",
         "| `200`, `409`, `422` | anyone |")}),
    ("validate_checks", "a screen check citing the criterion's capture is accepted",
     {"plan.md": with_binding, "checks.md": with_screen_check}),
    ("validate_verification", "a plan with a binding source and matching pictures is accepted",
     {"plan.md": with_binding,
      "screens.md": screens_md("matches"),
      "captures/billing--card-form.running.png": lambda s: "png"}),
    ("validate_verification", "a picture at twice its capture's size is the same layout",
     {"plan.md": lambda s: with_screen(with_binding(s)), "screens.md": screens_md("matches"),
      "captures/billing--card-form.png": lambda s: png(1024, 839),
      "captures/billing--card-form.running.png": lambda s: png(2048, 1678),
      RUNNING: lambda s: png(1024, 839)}),
    ("validate_verification", "a screen no capture draws owes no picture and no screens.md",
     {"plan.md": with_screen}),
    ("validate_verification", "proofs.md green and no finding is accepted",
     {"verification.md": lambda s: s.split("## Findings")[0] + "## Findings\n\nNone - every rule probed held\n"}),
    ("validate_verification", "a browser proof whose screenshot exists is accepted",
     {"plan.md": with_screen, "screens.md": screens_md("matches"),
      "checks.md": with_browser_shot("screens/billing.running.png"), RUNNING: lambda s: "png"}),
    ("validate_verification", "a screen judged in screens.md is accepted",
     {"plan.md": with_screen, "screens.md": screens_md("matches"), RUNNING: lambda s: "png"}),
    ("validate_verification", "a capture judged again in round 2 is accepted",
     {"plan.md": with_binding, "screens.md": screens_md("matches", "**Round**: 2\n"),
      "captures/billing--card-form.running.png": lambda s: "png"}),
    ("validate_checks", "a walk proof needs no test selector and no picture",
     {"checks.md": with_walk_proof}, "names no test selector"),
    ("validate_verification", "a walk proof with its visit in the Walked line is accepted",
     {"checks.md": lambda s: with_walked(with_walk_proof(s))}),
]


def scaffold():
    root = tempfile.mkdtemp(prefix="tlc-selftest-")
    fdir = os.path.join(root, ".specs", "features", FEATURE)
    os.makedirs(fdir)
    for name in ("plan.md", "checks.md", "verification.md", "proofs.md"):
        if os.path.isfile(os.path.join(FIXTURES, name)):
            shutil.copyfile(os.path.join(FIXTURES, name), os.path.join(fdir, name))
    # A capture the binding cases cite; the gates check that it exists, never its format.
    os.makedirs(os.path.join(fdir, "captures"))
    open(os.path.join(fdir, "captures", "billing--card-form.png"), "wb").close()
    with open(os.path.join(root, ".specs", "STATE.md"), "w", encoding="utf-8") as f:
        f.write(STATE)
    return root


def run(validator, root):
    p = subprocess.run(
        [sys.executable, os.path.join(HERE, f"{validator}.py"), FEATURE, "--root", root],
        capture_output=True, encoding="utf-8", errors="replace",
    )
    return p.returncode, p.stdout + p.stderr


def run_script(name, *args, cwd=None, env=None, here=HERE):
    """Run a shipped script directly and return (exit code, combined output)."""
    proc = subprocess.run(
        [sys.executable, os.path.join(here, name), *args],
        capture_output=True, encoding="utf-8", errors="replace", cwd=cwd,
        env=None if env is None else {**os.environ, **env},
    )
    return proc.returncode, proc.stdout + proc.stderr


# (script, description, argv, expected exit, expected output fragment)
TOOLING = [
    ("check_commit.py", "a conventional message passes",
     ["feat: suspend the subscription on a failed charge"], 0, "OK"),
    ("check_commit.py", "a non-conventional message fails",
     ["Updated stuff."], 1, "does not match"),
    ("check_commit.py", "a capitalized description fails",
     ["feat: Suspend the subscription"], 1, "start lowercase"),
    ("check_commit.py", "an unknown type fails",
     ["wip: suspend the subscription"], 1, "is not one of"),
    ("lessons.py", "normalization regressions pass", ["selftest"], 0, "ok"),
    ("lessons.py", "--root before the subcommand is the documented form",
     ["--root", tempfile.gettempdir(), "list", "--status", "confirmed"], 0, ""),
]


APPROVAL = '**Approved**: 2026-10-25 - user: "Aprovado, pode seguir." - hash: {hash}\n'
STALE = '**Approved**: 2026-10-25 - user: "Aprovado, pode seguir." - hash: 000000000000\n'

SPEC = """# Billing Specification

{approval}**Scope**: Medium

## Problem Statement

A failed charge leaves the member with access they did not pay for.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Refunds | another feature |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Retry count | no retry | the gateway retries on its side | y |

**Open questions:** none

## User Stories

### P1: Suspend on a failed charge

**User Story**: As a member, I want my access to follow my payment so that billing stays fair.

**Acceptance Criteria**:

1. **BILL-01** WHEN the gateway reports a failed charge THEN the system SHALL set the status to `suspended`
2. **BILL-02** IF the gateway times out THEN the system SHALL keep the status and log `charge_timeout`
"""

SWEEP = "\n## Implicit Requirements\n\n| Dimension | Lands on |\n| --- | --- |\n" + "".join(
    f"| {d} | {'BILL-02' if d.startswith('External') else 'N/A - this feature has no such path'} |\n" for d in (
        "Input validation & bounds", "Failure / partial-failure states", "Idempotency / retry / duplicate handling",
        "Auth boundaries & rate limits", "Concurrency / ordering", "Data lifecycle / expiry", "Observability",
        "External-dependency failure", "State-transition integrity"))

MEDIUM_CHECKS = """
## Checks

**Build**: `exit 0`
Run unit: `npx vitest run src/billing --reporter=verbose`

**C1** - A failed charge suspends the subscription (BILL-01)
Proof: run unit | ✓ billing > suspends on a failed charge

**C2** - A gateway timeout keeps the status and logs it (BILL-02)
Proof: run unit | ✓ billing > keeps the status on a timeout
"""

TASKS = """# Billing Tasks

{approval}**Build**: `exit 0`
Run unit: `npx vitest run src/billing --reporter=verbose`

## Test Coverage Matrix

| Layer | Paths | Tests |
| --- | --- | --- |
| Service | `src/**/*.ts` | unit |

## Gate Check Commands

| Level | Command |
| --- | --- |
| quick | `npx vitest run` |

## Tasks

### Phase 1: Core

#### T1: Suspend on a failed charge

**What**: suspend the subscription when the gateway reports a failed charge, keep it on a timeout
**Files**:
- Modify: `src/billing.ts`
- Test: `src/billing.test.ts`
**Depends on**: None
**Requirement**: BILL-01, BILL-02
**Tests**: unit
**Gate**: quick
**Done when**:
- [ ] a failed charge sets the status to suspended

## Checks

**C1** - A failed charge suspends the subscription (BILL-01)
Proof: run unit | ✓ billing > suspends on a failed charge

**C2** - A gateway timeout keeps the status and logs it (BILL-02)
Proof: run unit | ✓ billing > keeps the status on a timeout

## Handoff

**Dispatched:** none
"""

DESIGN = """# Billing Design

**Spec**: `.specs/features/billing/spec.md`
**Approach**: suspend in the charge service - user: "vai de service"
**Chosen over**: a nightly job - it leaves a paid-through window open for a day
**Breaks if**: the gateway reports a failed charge after the period has ended
**Reviewed**: review.md

## Architecture Overview

The charge service suspends the subscription when the gateway reports a failed charge.

```ts
// fenced code is not read: `src/not/checked.ts:9`
```

## Code Reuse Analysis

| Component | Location | How to Use |
| --- | --- | --- |
| Charge service | `src/billing.ts` | Extend |

## Components

### Suspension

- **Purpose**: suspend the subscription on a failed charge
- **Location**: `src/billing.ts` (existing)
- **Reuses**: `src/billing.ts#charge`

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| Gateway timeout | keep the status | none |

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| No test on the charge path | `src/billing.ts:2` | a regression ships | T1 adds one |
"""

REVIEW = """# Billing Plan Review

**Reviewer**: independent sub-agent (author != reviewer)

## What this builds

A failed charge suspends the subscription from the charge service.

## How the system works today, per these files

The charge service calls the gateway and records the result.

## Findings

| ID | Severity | Where | Finding | Evidence | Smallest fix | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Major | design.md `## Error Handling Strategy` | a duplicate webhook charges twice | `src/billing.ts:2` | dedupe on the event id | fixed - design.md `## Error Handling Strategy` adds the duplicate row |
"""

STATE_MD = """# STATE

## Decisions

### AD-001
- **Decision**: suspend in the charge service
- **Reason**: one place owns the status
- **Trade-off**: the service grows
- **Scope**: billing
- **Date**: 2026-10-20
- **Status**: active

### AD-002
- **Decision**: log every gateway timeout
- **Reason**: support reads the log
- **Trade-off**: log volume
- **Scope**: billing
- **Date**: 2026-10-21
- **Status**: active

## Handoff
"""

RESOLVED = "fixed - design.md `## Error Handling Strategy` adds the duplicate row"
BILLING_TS = "export function charge() {\n  return 1\n}\n"
LEGACY_TS = "export const legacy = 1\n"
BILLING_TEST = "import { charge } from './billing'\nexpect(charge()).toBe(1)\nexpect(charge()).not.toBe(0)\n"


def feature_root(files, code=None):
    """A temp project: .specs/features/billing/<files>, and the code files under the root."""
    root = tempfile.mkdtemp(prefix="feature-")
    fdir = os.path.join(root, ".specs", "features", FEATURE)
    os.makedirs(fdir)
    for name, text in files.items():
        if text is not None:
            write_artifact(os.path.join(fdir, name) if name != "STATE.md" else os.path.join(root, ".specs", name), text)
    for path, text in (code if code is not None else {"src/billing.ts": BILLING_TS, "src/legacy.ts": LEGACY_TS}).items():
        os.makedirs(os.path.dirname(os.path.join(root, path)), exist_ok=True)
        write_artifact(os.path.join(root, path), text)
    return root


def tasks_files(approval=APPROVAL, scope="Medium"):
    return {"spec.md": SPEC.replace("{approval}", approval).replace("Medium", scope),
            "tasks.md": TASKS.replace("{approval}", approval)}


def many_tasks(n):
    """A tasks.md with n one-file tasks in one phase, each on its own criterion."""
    spec = SPEC.replace("{approval}", APPROVAL).replace("Medium", "Large") + SWEEP
    crit = "".join(f"{i + 2}. **BILL-{i + 3:02d}** WHEN charge {i} fails THEN the system SHALL set the status "
                   f"to `s{i}`\n" for i in range(n))
    spec = spec.replace("log `charge_timeout`\n", "log `charge_timeout`\n" + crit)
    body = "".join(f"#### T{i + 2}: Suspend charge {i}\n\n**What**: suspend charge {i}\n**Files**:\n"
                   f"- Create: `src/c{i}.ts`\n- Test: `src/c{i}.test.ts`\n**Depends on**: None\n"
                   f"**Requirement**: BILL-{i + 3:02d}\n**Tests**: unit\n**Gate**: quick\n**Done when**:\n- [ ] done\n\n"
                   for i in range(n))
    checks = "".join(f"**C{i + 3}** - charge {i} suspends (BILL-{i + 3:02d})\n"
                     f"Proof: run unit | ✓ billing > charge {i}\n\n" for i in range(n))
    tasks = TASKS.replace("{approval}", APPROVAL).replace("## Checks\n", body + "## Checks\n", 1)
    tasks = tasks.replace("## Handoff", checks + "## Handoff")
    return {"spec.md": spec, "tasks.md": tasks, "design.md": DESIGN.replace("**Reviewed**: review.md",
                                                                           "**Reviewed**: not run - fixture"),
            "review.md": None}


def edit(files, name, old, new):
    out = dict(files)
    if old not in out[name]:
        raise ValueError(f"fixture edit did not apply: {old[:40]!r} in {name}")
    out[name] = out[name].replace(old, new, 1)
    return out


def run_spec_driven_cases():
    """The gates of the spec-driven flow, case by case: each failing case must fail with its message,
    each passing case must pass. A case whose edit does not apply is broken, never skipped."""
    print("\nspec-driven gates - spec, design, review, tasks, commit, state, batches, prose")
    ok = True
    spec_large = SPEC.replace("{approval}", "").replace("Medium", "Large") + SWEEP
    plan = {**tasks_files(), "design.md": DESIGN, "review.md": REVIEW}
    four = TASKS.replace("{approval}", APPROVAL).replace(
        "- Modify: `src/billing.ts`\n", "- Modify: `src/billing.ts`\n- Create: `src/a.ts`\n- Create: `src/b.ts`\n"
                                        "- Create: `src/c.ts`\n")
    cases = [
        # validate_spec
        ("validate_spec.py", "a Medium spec with two criteria passes", {"spec.md": SPEC.replace("{approval}", "")}, [], 0, "0 error"),
        ("validate_spec.py", "a Large spec with its sweep passes", {"spec.md": spec_large}, [], 0, "0 error"),
        ("validate_spec.py", "a spec with no Scope fails", {"spec.md": SPEC.replace("{approval}", "").replace("**Scope**: Medium\n", "")}, [], 1, "no `**Scope**:"),
        ("validate_spec.py", "a scope below its floor fails", {"spec.md": SPEC.replace("{approval}", "").replace("Medium", "Small").replace(
            "log `charge_timeout`\n", "log `charge_timeout`\n3. **BILL-03** The system SHALL keep `x`\n4. **BILL-04** The system SHALL keep `y`\n")}, [], 1, "owe at least Medium"),
        ("validate_spec.py", "Large with no Implicit Requirements fails", {"spec.md": SPEC.replace("{approval}", "").replace("Medium", "Large")}, [], 1, "## Implicit Requirements"),
        ("validate_spec.py", "a sweep with a dimension missing fails", {"spec.md": spec_large.replace("| Observability | N/A - this feature has no such path |\n", "")}, [], 1, "no row `Observability`"),
        ("validate_spec.py", "a sweep row with no landing fails", {"spec.md": spec_large.replace("| Observability | N/A - this feature has no such path |", "| Observability | later |")}, [], 1, "lands on no criterion"),
        ("validate_spec.py", "a criterion with no ID fails", {"spec.md": SPEC.replace("{approval}", "").replace("**BILL-02** ", "")}, [], 1, "starts with its own ID"),
        ("validate_spec.py", "an ID used twice fails", {"spec.md": SPEC.replace("{approval}", "").replace("**BILL-02**", "**BILL-01**")}, [], 1, "already used"),
        ("validate_spec.py", "two SHALLs in one criterion fail", {"spec.md": SPEC.replace("{approval}", "").replace("and log", "and SHALL log")}, [], 1, "2 SHALLs"),
        ("validate_spec.py", "a condition inside the sentence fails", {"spec.md": SPEC.replace("{approval}", "").replace(
            "WHEN the gateway reports a failed charge THEN the system SHALL set the status to `suspended`",
            "The system SHALL set the status to `suspended` when the gateway reports a failed charge")}, [], 1, "a condition inside the sentence"),
        ("validate_spec.py", "an IF with no THEN fails", {"spec.md": SPEC.replace("{approval}", "").replace("times out THEN the", "times out, the")}, [], 1, "IF with no THEN"),
        ("validate_spec.py", "a vague word fails", {"spec.md": SPEC.replace("{approval}", "").replace("log `charge_timeout`", "log it quickly")}, [], 1, "`quickly`"),
        ("validate_spec.py", "a semicolon in a criterion fails", {"spec.md": SPEC.replace("{approval}", "").replace("keep the status and log", "keep the status; it SHALL not log")}, [], 1, "semicolon"),
        ("validate_spec.py", "a placeholder left in fails", {"spec.md": SPEC.replace("{approval}", "").replace("Refunds", "[Feature X]")}, [], 1, "template placeholder"),
        ("validate_spec.py", "a spec changed after its approval fails", {"spec.md": SPEC.replace("{approval}", STALE)}, [], 1, "changed after the user approved it"),
        ("validate_spec.py", "an approved spec passes", {"spec.md": SPEC.replace("{approval}", APPROVAL)}, [], 0, "0 error"),
        ("validate_spec.py", "an amended spec fails", {"spec.md": SPEC.replace("{approval}", APPROVAL + "**Amended**: 2026-10-26 - wording - hash: {hash}\n")}, [], 1, "the spec is never amended"),
        ("validate_spec.py", "an assumption with no default fails", {"spec.md": SPEC.replace("{approval}", "").replace("| no retry |", "|  |")}, [], 1, "no chosen default"),
        # validate_design
        ("validate_design.py", "a design whose citations are on disk passes", {"design.md": DESIGN}, [], 0, "0 error"),
        ("validate_design.py", "a reused path not on disk fails", {"design.md": DESIGN.replace("| Charge service | `src/billing.ts` |", "| Charge service | `src/charges.ts` |")}, [], 1, "`src/charges.ts` is not on disk"),
        ("validate_design.py", "a cited line past the end fails", {"design.md": DESIGN.replace("`src/billing.ts:2`", "`src/billing.ts:40`")}, [], 1, "past the end of `src/billing.ts`"),
        ("validate_design.py", "an unmarked location fails", {"design.md": DESIGN.replace("`src/billing.ts` (existing)", "`src/billing.ts`")}, [], 1, "mark the location `(new)` or `(existing)`"),
        ("validate_design.py", "a new file already on disk fails", {"design.md": DESIGN.replace("`src/billing.ts` (existing)", "`src/billing.ts` (new)")}, [], 1, "is marked `(new)` and is already on disk"),
        ("validate_design.py", "an existing location not on disk fails", {"design.md": DESIGN.replace("`src/billing.ts` (existing)", "`src/suspension.ts` (existing)")}, [], 1, "`src/suspension.ts` is not on disk"),
        ("validate_design.py", "a reused file with no symbol fails", {"design.md": DESIGN.replace("`src/billing.ts#charge`", "`src/billing.ts`")}, [], 1, "names no symbol"),
        ("validate_design.py", "a reused symbol the file lacks fails", {"design.md": DESIGN.replace("#charge`", "#refund`")}, [], 1, "`refund` is not in `src/billing.ts`"),
        ("validate_design.py", "a reused folder fails", {"design.md": DESIGN.replace("`src/billing.ts#charge`", "`src/#charge`")}, [], 1, "is a folder"),
        ("validate_design.py", "a symbol in a Location column is checked", {"design.md": DESIGN.replace("| Charge service | `src/billing.ts` |", "| Charge service | `src/billing.ts#refund` |")}, [], 1, "`refund` is not in"),
        ("validate_design.py", "an approach the user did not choose fails", {"design.md": DESIGN.replace(' - user: "vai de service"', "")}, [], 1, "the approach is the user's call"),
        ("validate_design.py", "no Breaks if line fails", {"design.md": DESIGN.replace("**Breaks if**: the gateway reports a failed charge after the period has ended\n", "")}, [], 1, "**Breaks if**:"),
        ("validate_design.py", "a placeholder left in fails", {"design.md": DESIGN.replace("suspend the subscription on a failed charge", "[What this component does]")}, [], 1, "template placeholder"),
        # validate_tasks: the plan review
        ("validate_tasks.py", "tasks after a resolved review pass", plan, [], 0, "0 error"),
        ("validate_tasks.py", "a design with no Reviewed line fails", edit(plan, "design.md", "**Reviewed**: review.md\n", ""), [], 1, "no `**Reviewed**:` line"),
        ("validate_tasks.py", "a reviewer still dispatched fails", edit(plan, "design.md", "**Reviewed**: review.md", "**Reviewed**: dispatched"), [], 1, "is `dispatched`"),
        ("validate_tasks.py", "a review not run with a reason warns", edit(plan, "design.md", "**Reviewed**: review.md", "**Reviewed**: not run - no sub-agent"), [], 0, "plan review not run"),
        ("validate_tasks.py", "an open finding fails", edit(plan, "review.md", RESOLVED, ""), [], 1, "R1 is open"),
        ("validate_tasks.py", "a contest with nothing readable fails", edit(plan, "review.md", RESOLVED, "contested - it was intentional"), [], 1, "contested with nothing the reviewer could read"),
        ("validate_tasks.py", "a contest that cites a file passes", edit(plan, "review.md", RESOLVED, "contested - `src/billing.ts:2` already dedupes"), [], 0, "0 error"),
        ("validate_tasks.py", "an escalation without the user's words fails", edit(plan, "review.md", RESOLVED, "escalated - asked"), [], 1, "escalated with no answer"),
        ("validate_tasks.py", "an escalation answered in the user's words passes", edit(plan, "review.md", RESOLVED, 'escalated - user: "dedupe by event id"'), [], 0, "0 error"),
        ("validate_tasks.py", "a nit fails", edit(plan, "review.md", "| R1 | Major |", "| R1 | Nit |"), [], 1, "Blocker and Major only"),
        ("validate_tasks.py", "a review with no paraphrase fails", edit(plan, "review.md", "A failed charge suspends the subscription from the charge service.\n", ""), [], 1, "no paraphrase"),
        ("validate_tasks.py", "a review in the author's context fails", edit(plan, "review.md", "independent sub-agent (author != reviewer)", "self-reviewed"), [], 1, "not an independent"),
        ("validate_tasks.py", "a finding Where outside the plan files fails", edit(plan, "review.md", "| R1 | Major | design.md `## Error Handling Strategy` |", "| R1 | Major | the error table |"), [], 1, "start it with the plan file"),
        # validate_tasks: the design is built by the tasks
        ("validate_tasks.py", "a new location no task creates fails", edit(plan, "design.md", "`src/billing.ts` (existing)", "`src/suspension.ts` (new)"), [], 1, "(new) is created by no task"),
        ("validate_tasks.py", "a new location a task creates passes", edit(edit(plan, "design.md", "`src/billing.ts` (existing)", "`src/suspension.ts` (new)"), "tasks.md", "- Modify: `src/billing.ts`\n", "- Modify: `src/billing.ts`\n- Create: `src/suspension.ts`\n"), [], 0, "0 error"),
        ("validate_tasks.py", "an existing location no task changes fails", edit(plan, "design.md", "`src/billing.ts` (existing)", "`src/legacy.ts` (existing)"), [], 1, "(existing) is changed by no task"),
        ("validate_tasks.py", "a folder location built by a file in it passes", edit(plan, "design.md", "`src/billing.ts` (existing)", "`src/` (existing)"), [], 0, "0 error"),
        # validate_tasks: size, shape, trace
        ("validate_tasks.py", "the old layout fails", edit(tasks_files(), "tasks.md", "## Tasks\n\n### Phase 1: Core\n\n#### T1", "## Task Breakdown\n\n### T1"), [], 1, "old `## Execution Plan`"),
        ("validate_tasks.py", "four code files in a task fail", {**tasks_files(), "tasks.md": four}, [], 1, "4 code files"),
        ("validate_tasks.py", "four code files with Size large pass", {**tasks_files(), "tasks.md": four.replace("**Gate**: quick\n", "**Gate**: quick\n**Size**: large - one schema change spans four modules\n", 1)}, [], 0, "0 error"),
        ("validate_tasks.py", "a test-only task fails", edit(tasks_files(), "tasks.md", "- Modify: `src/billing.ts`\n", ""), [], 1, "creates or changes no code"),
        ("validate_tasks.py", "tests with no Test file fail", edit(tasks_files(), "tasks.md", "- Test: `src/billing.test.ts`\n", ""), [], 1, "no `Test:` file"),
        ("validate_tasks.py", "a file outside the matrix fails", edit(tasks_files(), "tasks.md", "`src/**/*.ts`", "`lib/**/*.ts`"), [], 1, "matches no layer"),
        ("validate_tasks.py", "a layer that needs tests and Tests none fails", edit(edit(tasks_files(), "tasks.md", "**Tests**: unit", "**Tests**: none"), "tasks.md", "- Test: `src/billing.test.ts`\n", ""), [], 1, "requires unit tests"),
        ("validate_tasks.py", "a Modify file not on disk fails", edit(tasks_files(), "tasks.md", "Modify: `src/billing.ts`", "Modify: `src/charges.ts`"), [], 1, "`Modify: src/charges.ts` is not on disk"),
        ("validate_tasks.py", "a Create file already on disk fails", edit(tasks_files(), "tasks.md", "Modify: `src/billing.ts`", "Create: `src/billing.ts`"), [], 1, "is already on disk"),
        ("validate_tasks.py", "a task that modifies what an earlier task creates passes", edit(many_tasks(2), "tasks.md", "- Create: `src/c1.ts`\n- Test: `src/c1.test.ts`\n**Depends on**: None", "- Modify: `src/c0.ts`\n- Test: `src/c1.test.ts`\n**Depends on**: T2"), [], 0, "0 error"),
        ("validate_tasks.py", "two tasks that create one file fail", edit(many_tasks(2), "tasks.md", "- Create: `src/c1.ts`", "- Create: `src/c0.ts`"), [], 1, "T2 creates it"),
        ("validate_tasks.py", "a Delete of a file on disk passes", edit(tasks_files(), "tasks.md", "- Modify: `src/billing.ts`\n", "- Modify: `src/billing.ts`\n- Delete: `src/legacy.ts`\n"), [], 0, "0 error"),
        ("validate_tasks.py", "a Delete of a file not on disk fails", edit(tasks_files(), "tasks.md", "- Modify: `src/billing.ts`\n", "- Modify: `src/billing.ts`\n- Delete: `src/gone.ts`\n"), [], 1, "`Delete: src/gone.ts` is not on disk"),
        ("validate_tasks.py", "a file listed twice in a task fails", edit(tasks_files(), "tasks.md", "- Modify: `src/billing.ts`\n", "- Modify: `src/billing.ts`\n- Modify: `src/billing.ts`\n"), [], 1, "is listed twice"),
        ("validate_tasks.py", "a dependency on a later task fails", edit(tasks_files(), "tasks.md", "**Depends on**: None", "**Depends on**: T2"), [], 1, "does not come before it"),
        ("validate_tasks.py", "an unknown Requirement fails", edit(tasks_files(), "tasks.md", "BILL-01, BILL-02", "BILL-01, BILL-02, BILL-09"), [], 1, "BILL-09 is not a criterion"),
        ("validate_tasks.py", "a criterion in no task fails", edit(tasks_files(), "tasks.md", "BILL-01, BILL-02", "BILL-01"), [], 1, "BILL-02 is in no task"),
        ("validate_tasks.py", "a check that cites nothing fails", edit(tasks_files(), "tasks.md", "suspends the subscription (BILL-01)", "suspends the subscription"), [], 1, "cites no criterion"),
        ("validate_tasks.py", "a criterion with no check fails", edit(tasks_files(), "tasks.md", "logs it (BILL-02)", "logs it (BILL-01)"), [], 1, "BILL-02 has no check"),
        ("validate_tasks.py", "a shrink word fails", edit(tasks_files(), "tasks.md", "keep it on a timeout", "keep it on a timeout for now"), [], 1, "`for now`"),
        ("validate_tasks.py", "a Gate level the table lacks fails", edit(tasks_files(), "tasks.md", "**Gate**: quick", "**Gate**: full"), [], 1, "is not a level"),
        ("validate_tasks.py", "a phase of 11 tasks fails", many_tasks(10), [], 1, "Phase 1 has 11 tasks"),
        ("validate_tasks.py", "a Large scope with no design.md fails", tasks_files(scope="Large"), [], 1, "owes a design.md"),
        ("validate_tasks.py", "--execute with both approvals passes", tasks_files(), ["--execute"], 0, "0 error"),
        ("validate_tasks.py", "--execute with the spec unapproved fails", {**tasks_files(), "spec.md": SPEC.replace("{approval}", "")}, ["--execute"], 1, "spec.md is not approved"),
        ("validate_tasks.py", "a spec changed after its approval fails", {**tasks_files(), "spec.md": SPEC.replace("{approval}", STALE)}, [], 1, "spec.md changed after the user approved it"),
        ("validate_tasks.py", "tasks changed after their approval fail", {**tasks_files(), "tasks.md": TASKS.replace("{approval}", STALE)}, [], 1, "tasks.md changed after it was approved"),
        ("validate_tasks.py", "an amendment that matches the tasks passes", {**tasks_files(), "tasks.md": TASKS.replace("{approval}", STALE + "**Amended**: 2026-10-26 - T1 also logs the timeout - hash: {hash}\n")}, ["--execute"], 0, "0 error"),
        ("validate_tasks.py", "an approval with no hash fails", {**tasks_files(), "spec.md": SPEC.replace("{approval}", '**Approved**: 2026-10-25 - user: "ok"\n')}, [], 1, "the line reads"),
        ("validate_tasks.py", "--execute with open questions fails", edit(tasks_files(), "spec.md", "**Open questions:** none", "**Open questions:** retry count"), ["--execute"], 1, "open questions"),
        ("validate_tasks.py", "--execute fails a Build line red before the first task", edit(tasks_files(), "tasks.md", "**Build**: `exit 0`", "**Build**: `exit 3`"), ["--execute"], 1, "Build is red before the first task"),
        ("validate_tasks.py", "a Medium feature with checks in the spec passes --execute", {"spec.md": SPEC.replace("{approval}", APPROVAL) + MEDIUM_CHECKS}, ["--execute"], 0, "0 error"),
        ("validate_tasks.py", "a Medium spec with a criterion unchecked fails --execute", {"spec.md": SPEC.replace("{approval}", APPROVAL) + MEDIUM_CHECKS.replace("(BILL-02)", "(BILL-01)")}, ["--execute"], 1, "BILL-02 has no check"),
        ("validate_tasks.py", "a run proof with no Run line fails", edit(tasks_files(), "tasks.md", "Run unit: `npx vitest run src/billing --reporter=verbose`\n", ""), [], 1, "no `Run unit: <command>` line defines it"),
        ("validate_tasks.py", "a run proof with no expected line fails", edit(tasks_files(), "tasks.md", " | ✓ billing > suspends on a failed charge", ""), [], 1, "names no line after `|`"),
        ("validate_tasks.py", "a Run line no proof reads warns", edit(tasks_files(), "tasks.md", "Run unit:", "Run e2e: `npx playwright test`\nRun unit:"), [], 0, "`Run e2e` is read by no proof"),
        # validate_state
        ("validate_state.py", "a whole decisions log passes", {"STATE.md": STATE_MD}, ["--no-head"], 0, "0 error"),
        ("validate_state.py", "a gap in the numbers fails", {"STATE.md": STATE_MD.replace("### AD-002", "### AD-003")}, ["--no-head"], 1, "this one is AD-002"),
        ("validate_state.py", "an entry with no Trade-off fails", {"STATE.md": STATE_MD.replace("- **Trade-off**: log volume\n", "")}, ["--no-head"], 1, "no `- **Trade-off**:`"),
        ("validate_state.py", "a superseded entry pointing nowhere fails", {"STATE.md": STATE_MD.replace("- **Status**: active\n\n### AD-002", "- **Status**: superseded by AD-009\n\n### AD-002")}, ["--no-head"], 1, "there is no such entry"),
        ("validate_state.py", "a superseded entry pointing back fails", {"STATE.md": STATE_MD.replace("- **Status**: active\n\n## Handoff", "- **Status**: superseded by AD-001\n\n## Handoff")}, ["--no-head"], 1, "comes after this one"),
    ]
    for script, desc, files, argv, want_code, want_frag in cases:
        if not shipped(script):
            continue
        root = feature_root(files)
        try:
            args = ["--root", root, *argv] if script == "validate_state.py" else [FEATURE, "--root", root, *argv]
            code, out = run_script(script, *args)
        finally:
            shutil.rmtree(root, ignore_errors=True)
        if code == want_code and want_frag in out:
            print(f"  ok      {script}: {desc}")
        else:
            ok = False
            print(f"  BROKEN  {script}: {desc} - expected exit={want_code} and {want_frag!r}, got exit={code}: "
                  f"{out.strip()[-500:]}")
    return run_spin_case() and run_approve_cases() and run_commit_cases() and run_state_head_case() and \
        run_batches_cases() and run_prose_cases() and ok


def run_approve_cases():
    """approve.py stamps only what its gate passes, binds the stamp to the text, and records amendments."""
    if not shipped("approve"):
        return True
    from specs import content_hash
    fdir_of = lambda root: os.path.join(root, ".specs", "features", FEATURE)  # noqa: E731
    unapproved = {"spec.md": SPEC.replace("{approval}", ""),
                  "tasks.md": TASKS.replace("{approval}", "**Status**: Draft\n")}

    def read(root, name):
        with open(os.path.join(fdir_of(root), name), encoding="utf-8") as f:
            return f.read()

    def stamped_spec(root):
        text = read(root, "spec.md")
        return f'user: "pode seguir" - hash: {content_hash(text)}' in text and \
            run_script("validate_spec.py", FEATURE, "--root", root)[0] == 0

    def stamped_tasks(root):
        text = read(root, "tasks.md")
        return "**Status**: Approved" in text and \
            run_script("validate_tasks.py", FEATURE, "--root", root, "--execute")[0] == 0

    def amended(root):
        path = os.path.join(fdir_of(root), "tasks.md")
        write_artifact(path, read(root, "tasks.md").replace("**Gate**: quick\n", "**Gate**: quick\n**Size**: large - one "
                                                            "generated table\n"))
        stale = run_script("validate_tasks.py", FEATURE, "--root", root)
        code, _ = run_script("approve.py", FEATURE, "tasks", "--amend", "T1 carries a generated table", "--root", root)
        return stale[0] == 1 and "changed after it was approved" in stale[1] and code == 0 and \
            "**Amended**:" in read(root, "tasks.md") and run_script("validate_tasks.py", FEATURE, "--root", root)[0] == 0

    cases = [
        ("stamps a spec its gate passes", {"spec.md": unapproved["spec.md"]}, ["spec", "--user", "pode seguir"], 0,
         "approved - hash", stamped_spec),
        ("refuses a spec its gate fails", {"spec.md": unapproved["spec.md"].replace("**Scope**: Medium\n", "")},
         ["spec", "--user", "ok"], 1, "not stamped", None),
        ("refuses a spec with open questions", {"spec.md": unapproved["spec.md"].replace(
            "**Open questions:** none", "**Open questions:** retry count")}, ["spec", "--user", "ok"], 1,
         "still has open questions", None),
        ("refuses tasks before the spec is approved", unapproved, ["tasks", "--user", "ok"], 1, "spec.md is not approved",
         None),
        ("stamps tasks and sets their Status", {**unapproved, "spec.md": SPEC.replace("{approval}", APPROVAL)},
         ["tasks", "--user", "pode seguir"], 0, "approved - hash", stamped_tasks),
        ("records an amendment the gate then accepts", tasks_files(), ["tasks", "--user", "ok"], 0, "approved", amended),
        ("refuses to amend the spec", tasks_files(), ["spec", "--amend", "wording"], 2, "never amended", None),
        ("refuses to amend tasks the user has not approved", {**unapproved, "spec.md": SPEC.replace("{approval}", APPROVAL)},
         ["tasks", "--amend", "T1 split"], 1, "not approved yet", None),
        ("refuses words with a double quote", unapproved, ["spec", "--user", 'say "ok"'], 2, "without double quotes",
         None),
    ]
    ok = True
    for desc, files, argv, want_code, want_frag, then in cases:
        root = feature_root(files)
        try:
            code, out = run_script("approve.py", FEATURE, *argv, "--root", root)
            good = code == want_code and want_frag in out and (then is None or then(root))
        finally:
            shutil.rmtree(root, ignore_errors=True)
        if good:
            print(f"  ok      approve.py: {desc}")
        else:
            ok = False
            print(f"  BROKEN  approve.py: {desc} - expected exit={want_code} and {want_frag!r}, got exit={code}: "
                  f"{out.strip()[-400:]}")
    return ok


def run_spin_case():
    """The same failure twice in a row stops the run with exit 3; a different failure does not."""
    if not shipped("validate_spec"):
        return True
    root = feature_root({"spec.md": SPEC.replace("{approval}", "").replace("**Scope**: Medium\n", "")})
    try:
        first = run_script("validate_spec.py", FEATURE, "--root", root)
        second = run_script("validate_spec.py", FEATURE, "--root", root)
        write_artifact(os.path.join(root, ".specs", "features", FEATURE, "spec.md"),
                       SPEC.replace("{approval}", "").replace("**BILL-02** ", ""))
        third = run_script("validate_spec.py", FEATURE, "--root", root)
    finally:
        shutil.rmtree(root, ignore_errors=True)
    if first[0] == 1 and second[0] == 3 and "**Blocked:**" in second[1] and third[0] == 1:
        print("  ok      spin guard: the same errors twice stop the run, new errors do not")
        return True
    print(f"  BROKEN  spin guard: exits {first[0]}, {second[0]}, {third[0]}")
    return False


def git_root(files, code):
    """A feature root under git with one commit, so a test can stage a change and run check_commit.py."""
    root = feature_root(files, code)
    for args in (["init", "-q"], ["config", "user.email", "t@t"], ["config", "user.name", "t"],
                 ["add", "-A"], ["commit", "-qm", "chore: start"]):
        subprocess.run(["git", *args], cwd=root, capture_output=True)
    return root


def run_commit_cases():
    """check_commit.py measures the staged diff of the task the commit closes."""
    if not shipped("check_commit") or shutil.which("git") is None:
        return True
    ok = True
    base_code = {"src/billing.ts": BILLING_TS, "src/billing.test.ts": BILLING_TEST}
    tick = ("- [ ] a failed charge", "- [x] a failed charge")
    big = "".join(f"export const v{i} = {i}\n" for i in range(450))

    def change(writes=None, deletes=(), task=None, tasks=None, code=None):
        """A staged change over a base project. `tasks` replaces the approved tasks.md the base starts from,
        `code` adds files to the base code."""
        def go(root):
            for path, text in (writes or {}).items():
                full = os.path.join(root, path)
                os.makedirs(os.path.dirname(full), exist_ok=True)
                write_artifact(full, text)
            for path in deletes:
                os.remove(os.path.join(root, path))
            subprocess.run(["git", "add", "-A"], cwd=root, capture_output=True)
        return go, task, tasks, code

    from specs import content_hash
    tasks_done = TASKS.replace("{approval}", APPROVAL).replace(*tick)
    ok_change = {"src/billing.ts": BILLING_TS + "export const suspended = 'suspended'\n",
                 "src/billing.test.ts": BILLING_TEST + "expect(suspended).toBe('suspended')\n",
                 ".specs/features/billing/tasks.md": tasks_done}
    spec_path = ".specs/features/billing/spec.md"
    spec = SPEC.replace("{approval}", APPROVAL)
    approved = spec.replace("{hash}", content_hash(spec))
    paused = approved.replace("set the status to `suspended`", "set the status to `paused`")
    reapproved = spec.replace("set the status to `suspended`", "set the status to `paused`").replace(
        "Aprovado, pode seguir.", "pode pausar")
    large = TASKS.replace("**Gate**: quick\n", "**Gate**: quick\n**Size**: large - generated constants table\n")
    deleting = TASKS.replace("- Test: `src/billing.test.ts`\n", "- Test: `src/billing.test.ts`\n- Delete: `src/legacy.ts`\n"
                             "- Delete: `src/old.test.ts`\n")
    done_deleting = deleting.replace("{approval}", APPROVAL).replace(*tick)
    old = {"src/legacy.ts": LEGACY_TS, "src/old.test.ts": "expect(1).toBe(1)\n"}
    cases = [
        ("a task's own files with its test pass", change(ok_change), 0, "OK"),
        ("a file the task does not list fails", change({**ok_change, "src/other.ts": "x\n"}), 1, "`src/other.ts` is staged"),
        ("no test file changed fails", change({k: v for k, v in ok_change.items() if "test" not in k}), 1, "no test file changes"),
        ("a skip marker fails", change({**ok_change, "src/billing.test.ts": BILLING_TEST + "it.skip('x', () => {})\n"}), 1, "a skip or only marker"),
        ("a suppression with no issue fails", change({**ok_change, "src/billing.ts": BILLING_TS + "// eslint-disable-next-line\n"}), 1, "a suppression added"),
        ("a suppression with an issue passes", change({**ok_change, "src/billing.ts": BILLING_TS + "// eslint-disable-next-line BILL-123\n"}), 0, "OK"),
        ("an assertion removed fails", change({**ok_change, "src/billing.test.ts": "import { charge } from './billing'\nexpect(charge()).toBe(1)\n// keep\n"}), 1, "assertion(s) fewer"),
        ("a test file deleted fails", change({k: v for k, v in ok_change.items() if "test" not in k}, ["src/billing.test.ts"]), 1, "this commit deletes it"),
        ("450 lines of code fail", change({**ok_change, "src/billing.ts": big}), 1, "over 400"),
        ("450 lines with an approved Size large pass", change({**ok_change, "src/billing.ts": big, ".specs/features/billing/tasks.md":
            large.replace("{approval}", APPROVAL).replace(*tick)}, tasks=large), 0, "OK"),
        ("Size large written in the code commit fails", change({**ok_change, "src/billing.ts": big, ".specs/features/billing/tasks.md":
            large.replace("{approval}", APPROVAL.replace("{hash}", content_hash(TASKS.replace("{approval}", "")))).replace(*tick)}), 1,
            "tasks.md changed after it was approved"),
        ("a commit that ticks no task fails", change({k: v for k, v in ok_change.items() if "tasks.md" not in k}), 1, "ticks no task"),
        ("--task names the task when tasks.md is not ticked", change({k: v for k, v in ok_change.items() if "tasks.md" not in k}, task="T1"), 0, "OK"),
        ("a renumbered STATE.md fails", change({**ok_change, ".specs/STATE.md": STATE_MD.replace("### AD-002", "### AD-003")}), 1, "this one is AD-002"),
        ("an approved criterion edited in a code commit fails", change({**ok_change, spec_path: paused}), 1,
            "spec.md changed after the user approved it"),
        ("a new approval staged with code fails", change({**ok_change, spec_path: reapproved}), 1, "commit the plan change alone"),
        ("a new approval alone passes", change({spec_path: reapproved}), 0, "OK"),
        ("a commit that drops the approval fails", change({spec_path: SPEC.replace("{approval}", "")}), 1,
            "removes the approval of spec.md"),
        ("a plan commit that closes no task passes", change({".specs/features/billing/tasks.md": TASKS.replace("{approval}", APPROVAL)
            .replace("**Dispatched:** none", "**Dispatched:** Verifier at abc123")}), 0, "OK"),
        ("a declared Delete passes", change({**ok_change, ".specs/features/billing/tasks.md": done_deleting},
            ["src/legacy.ts", "src/old.test.ts"], tasks=deleting, code=old), 0, "OK"),
        ("a Delete left on disk fails", change({**ok_change, ".specs/features/billing/tasks.md": done_deleting},
            ["src/old.test.ts"], tasks=deleting, code=old), 1, "`Delete: src/legacy.ts` is not deleted"),
    ]
    for desc, (go, task, tasks, code), want_code, want_frag in cases:
        files = {**tasks_files(), "STATE.md": STATE_MD}
        if tasks:
            files["tasks.md"] = tasks.replace("{approval}", APPROVAL)
        root = git_root(files, {**base_code, **(code or {})})
        try:
            go(root)
            args = ["feat: suspend the subscription", "--root", root] + (["--task", task] if task else [])
            code_, out = run_script("check_commit.py", *args)
        finally:
            shutil.rmtree(root, ignore_errors=True)
        if code_ == want_code and want_frag in out:
            print(f"  ok      check_commit.py: {desc}")
        else:
            ok = False
            print(f"  BROKEN  check_commit.py: {desc} - expected exit={want_code} and {want_frag!r}, got exit={code_}: "
                  f"{out.strip()[-400:]}")
    return ok


def run_state_head_case():
    """Against HEAD, a committed decision is never rewritten."""
    if not shipped("validate_state") or shutil.which("git") is None:
        return True
    root = git_root({"STATE.md": STATE_MD}, {})
    try:
        write_artifact(os.path.join(root, ".specs", "STATE.md"), STATE_MD.replace("one place owns the status", "it was easier"))
        code, out = run_script("validate_state.py", "--root", root)
    finally:
        shutil.rmtree(root, ignore_errors=True)
    if code == 1 and "AD-001 Reason changed since HEAD" in out:
        print("  ok      validate_state.py: a decision rewritten since HEAD fails")
        return True
    print(f"  BROKEN  validate_state.py: a decision rewritten since HEAD - exit {code}: {out.strip()[-300:]}")
    return False


def run_batches_cases():
    """The packing is arithmetic: the same phases give the same batches."""
    if not shipped("plan_batches"):
        return True
    from plan_batches import pack
    ok = True
    for sizes, want in (([3, 3, 3, 3, 4, 4], [6, 6, 8]), ([8, 2, 2, 8], [8, 4, 8]), ([5, 5, 5, 5], [5, 5, 5, 5]),
                        ([3, 3], [6]), ([7, 7, 1], [7, 8])):
        got = [sum(sizes[p - 1] for p in b) for b in pack(list(enumerate(sizes, 1)))]
        if got == want:
            print(f"  ok      plan_batches.py: {sizes} -> {got}")
        else:
            ok = False
            print(f"  BROKEN  plan_batches.py: {sizes} -> {got}, expected {want}")
    return ok


def run_prose_cases():
    """The skill's own text passes its writing rules, and the rules catch what they name."""
    if not shipped("lint_prose"):
        return True
    ok = True
    code, out = run_script("lint_prose.py", "--skill")
    if code == 0:
        print("  ok      lint_prose.py: SKILL.md and references/ follow the writing rules")
    else:
        ok = False
        print(f"  BROKEN  lint_prose.py: the skill's own text breaks its rules:\n{out.strip()[-1500:]}")
    tmp = tempfile.mkdtemp(prefix="prose-")
    try:
        for desc, text, frag in (
                ("a 21-word sentence", "One two three four five six seven eight nine ten eleven twelve thirteen "
                                       "fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone.\n", "W1"),
                ("seven sentences in a paragraph", "One. Two. Three. Four. Five. Six. Seven.\n", "W2"),
                ("a semicolon", "Run it; then read it.\n", "W3"),
                ("an abbreviation", "Use a proof, e.g. a test.\n", "W4"),
                ("a term outside the glossary", "Each AC has a check.\n", "W6")):
            path = os.path.join(tmp, "x.md")
            write_artifact(path, text)
            code, out = run_script("lint_prose.py", path)
            if code == 1 and frag in out:
                print(f"  ok      lint_prose.py: {desc} fails")
            else:
                ok = False
                print(f"  BROKEN  lint_prose.py: {desc} - exit {code}: {out.strip()[-200:]}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return ok


def run_tooling():
    """Exercise the scripts the skill ships beyond the validators.

    A shipped script nothing ever calls is where a crash hides: check_commit.py once raised a
    traceback on the message form of its own argument, and no gate noticed because no gate ran it.
    """
    print("\ntooling - every shipped script must run, not just parse")
    ok = True
    for script, desc, argv, want_code, want_frag in TOOLING:
        if not shipped(script):
            continue
        code, out = run_script(script, *argv)
        if code == want_code and want_frag.lower() in out.lower():
            print(f"  ok      {script}: {desc}")
            continue
        ok = False
        print(f"  BROKEN  {script}: {desc} - expected exit={want_code} and {want_frag!r}, "
              f"got exit={code}")
        print("          " + out.strip().replace("\n", "\n          "))

    # A passing commit names what follows the build of a feature whose verification is still owed.
    root = tempfile.mkdtemp(prefix="commit-")
    try:
        fdir = os.path.join(root, ".specs", "features", FEATURE)
        os.makedirs(fdir)
        write_artifact(os.path.join(fdir, "tasks.md"), "# Billing Tasks\n\n## Checks\n")
        for desc, verified, want in [
            ("an unverified feature is told what follows its last task", False, True),
            ("a verified feature is not", True, False),
        ]:
            if verified:
                write_artifact(os.path.join(fdir, "verification.md"), "# Billing verification\n")
            code, out = run_script("check_commit.py", "feat: suspend the subscription", "--root", root)
            if code == 0 and ("check_proofs.py billing" in out) == want:
                print(f"  ok      check_commit.py: {desc}")
            else:
                ok = False
                print(f"  BROKEN  check_commit.py: {desc} - exit {code}: {out.strip()[:300]}")
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # The completion gate must not go green on an empty run. This is a control, not a mutant:
    # "no report found" once exited 0, which reads as a pass to anything checking exit codes.
    empty = tempfile.mkdtemp(prefix="empty-root-")
    try:
        for argv, want, desc in [] if not shipped("validate_verification") else [
            (["--root", empty], 2, "gating nothing exits 2, not 0"),
            (["--root", empty, "--allow-empty"], 0, "an explicit empty sweep is allowed"),
            (["missing-feature", "--root", empty], 2, "an unresolvable feature exits 2"),
        ]:
            code, out = run_script("validate_verification.py", *argv)
            if code == want:
                print(f"  ok      validate_verification.py: {desc}")
            else:
                ok = False
                print(f"  BROKEN  validate_verification.py: {desc} - expected exit={want}, "
                      f"got {code}: {out.strip()}")
    finally:
        shutil.rmtree(empty, ignore_errors=True)

    # The spec-driven flow keeps its checks in tasks.md and its criteria in spec.md: the same gate
    # has to read them there, and still fail when a proof does.
    if shipped("validate_verification"):
        def spec_driven_layout():
            root = scaffold()
            fdir = os.path.join(root, ".specs", "features", FEATURE)
            for old, new in (("checks.md", "tasks.md"), ("plan.md", "spec.md")):
                text = read_artifact(os.path.join(fdir, old))
                os.remove(os.path.join(fdir, old))
                title, rest = text.split("\n", 1)
                write_artifact(os.path.join(fdir, new),
                               f"{title}\n\n**Approved**: 2026-10-25 - user: \"Aprovado, pode seguir.\" - hash: {{hash}}\n{rest}")
            return root, fdir

        def edit(path, old, new):
            """A regular-expression edit, once, so a case can drop or reshape the stamped line."""
            text = read_artifact(path)
            out = re.sub(old, new, text, count=1, flags=re.MULTILINE)
            write_artifact(path, out)
            return text != out

        for desc, file, old, new, want_code, want_frag in [
            ("reads tasks.md and spec.md approved by the user", None, None, None, 0, ""),
            ("fails a missing proof in that layout", "proofs.md", r"\| C3 \|", "| C3x |", 1, "C3"),
            ("fails a spec with no approval line", "spec.md", r"^\*\*Approved\*\*:.*\n", "", 1, "spec.md is not approved"),
            ("fails tasks approved without the user's words", "tasks.md", r'user: "Aprovado, pode seguir\."',
             "agent, the plan is complete", 1, "tasks.md L"),
            ("fails an approval with no date", "spec.md", r"2026-10-25 - user", "yes - user", 1, "the line reads"),
            ("fails a spec changed after its approval", "spec.md", r"SHALL", "SHALL NOT", 1,
             "spec.md changed after the user approved it"),
        ]:
            root, fdir = spec_driven_layout()
            applied = file is None or edit(os.path.join(fdir, file), old, new)
            code, out = run("validate_verification", root)
            shutil.rmtree(root)
            if applied and code == want_code and want_frag in out:
                print(f"  ok      validate_verification.py: spec-driven layout {desc}")
            else:
                ok = False
                print(f"  BROKEN  validate_verification.py: spec-driven layout {desc} - applied={applied} "
                      f"exit {code}: {out.strip()[:300]}")

    ok = run_spec_driven_cases() and ok

    # the lessons store has to survive a real round-trip on disk, not only its unit checks
    if not shipped("lessons"):
        return ok
    root = tempfile.mkdtemp(prefix="lessons-")
    try:
        steps = [
            (["--root", root, "init"], "Initialized"),
            (["--root", root, "add", "--feature", FEATURE, "--signal", "weak_test",
              "--source", "app/billing/x.rb:31", "--text", "assert the dedup path returns the row"],
             "ADDED"),
            (["--root", root, "status"], "1 total"),
            (["status", "--root", root], "1 total"),
        ]
        for argv, frag in steps:
            code, out = run_script("lessons.py", *argv)
            if code != 0 or frag.lower() not in out.lower():
                ok = False
                print(f"  BROKEN  lessons.py: round-trip step {' '.join(argv)!r} - expected {frag!r}, "
                      f"got exit={code}: {out.strip()}")
                break
        else:
            for artifact in ("lessons.json", "LESSONS.md"):
                if not os.path.isfile(os.path.join(root, ".specs", artifact)):
                    ok = False
                    print(f"  BROKEN  lessons.py: round-trip wrote no .specs/{artifact}")
                    break
            else:
                print("  ok      lessons.py: init - add - status round-trip writes both artifacts")
    finally:
        shutil.rmtree(root, ignore_errors=True)

    # a store written before the signal was renamed reads as the new signal, and its lesson recurs
    root = tempfile.mkdtemp(prefix="lessons-")
    try:
        text = "assert the dedup path returns the row"
        old = {"schema": 1, "next_id": 2, "lessons": [{
            "id": "L-001", "key": "surviving_mutant::" + text, "text": text, "signal": "surviving_mutant",
            "scope": "", "status": "candidate", "features": ["older"], "recurrence": 1, "harmful": 0,
            "evidence": ["app/billing/x.rb:31"], "created": "2026-10-01", "last_seen": "2099-01-01"}]}
        os.makedirs(os.path.join(root, ".specs"))
        write_artifact(os.path.join(root, ".specs", "lessons.json"), json.dumps(old))
        code, out = run_script("lessons.py", "--root", root, "add", "--feature", FEATURE, "--signal", "weak_test",
                               "--source", "app/billing/x.rb:31", "--text", text)
        stored = read_artifact(os.path.join(root, ".specs", "lessons.json"))
        if code == 0 and "UPDATED L-001" in out and "surviving_mutant" not in stored:
            print("  ok      lessons.py: a surviving_mutant lesson loads as weak_test and recurs")
        else:
            ok = False
            print(f"  BROKEN  lessons.py: surviving_mutant migration - exit={code}: {out.strip()}")
    finally:
        shutil.rmtree(root, ignore_errors=True)
    return ok


# A test runner nothing has to install: prints each argument after the exit code as a line,
# logs that it ran, and exits with that code. `{esc}` stands for the escape byte of a colour code.
RUNNER = ('import sys\n'
          'open("ran.log", "a").write(" ".join(sys.argv[1:]) + "\\n")\n'
          'for line in sys.argv[2:]:\n'
          '    print(line.replace("{esc}", "\\x1b"))\n'
          'sys.exit(int(sys.argv[1]))\n')


def proofs_md(runs, proofs, build="none - fixture", head=""):
    text = f"# Billing checks\n\n{head}Build: {build}\n"
    text += "".join(f"Run {name}: `{cmd}`\n" for name, cmd in runs.items())
    text += "\n## Checks\n\n"
    return text + "".join(f"**C{i}** - claim {i} (AC {i})\nProof: {p}\n\n" for i, p in enumerate(proofs, 1))


def result_rows(text):
    """{first cell: result cell} of proofs.md's table."""
    rows = {}
    for line in text.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("| ") and len(cells) == 3 and cells[0] not in ("Check", "---"):
            rows[cells[0]] = cells[2]
    return rows


def run_proofs_tooling():
    """check_proofs.py runs the project's own commands, so it is checked with a fake runner: a
    group runs once, each check reads its line from the group's output, and a line that is not
    there is never a pass."""
    root = tempfile.mkdtemp(prefix="proofs-")
    fdir = os.path.join(root, ".specs", "features", FEATURE)
    os.makedirs(fdir)
    write_artifact(os.path.join(root, "runner.py"), RUNNER)
    r = '"' + sys.executable.replace("\\", "/") + '" runner.py'
    unit = {"unit": f'{r} 0 "PASS billing suspends on a failed charge (3 ms)" "PASS billing keeps a paid account"'}
    cases = [
        ("a group runs once and each check reads its line",
         proofs_md(unit, ["run unit | PASS suspends", "run unit | PASS keeps a paid account"]),
         0, {"C1": "pass", "C2": "pass"}, 1),
        ("a line the group never printed is no test ran",
         proofs_md(unit, ["run unit | PASS renamed test"]), 1, {"C1": "**no test ran**"}, None),
        ("a failed group: its passing line passes, the missing one fails, the group gets a fail row",
         proofs_md({"unit": f'{r} 1 "PASS billing suspends" "FAIL billing keeps a paid account"'},
                   ["run unit | PASS suspends", "run unit | PASS keeps a paid account"]),
         1, {"C1": "pass", "C2": "**fail**", "Run unit": "**fail** - exit 1"}, None),
        ("a proof naming a group no Run line defines",
         proofs_md(unit, ["run unit | PASS suspends", "run e2e | PASS checkout"]),
         1, {"C2": "**no such run**"}, None),
        ("a lone proof is judged by its exit code",
         proofs_md({}, [f"`{r} 0 ok`", f"`{r} 3 boom`"]), 1, {"C1": "pass", "C2": "**fail**"}, None),
        ("a lone proof two checks name runs once",
         proofs_md({}, [f"`{r} 0 ok`", f"`{r} 0 ok`"]), 0, {"C1": "pass", "C2": "pass"}, 1),
        ("a coloured line still matches",
         proofs_md({"unit": f'{r} 0 "{{esc}}[32mPASS{{esc}}[0m billing suspends"'}, ["run unit | PASS billing suspends"]),
         0, {"C1": "pass"}, None),
        ("the expected words must come in order",
         proofs_md(unit, ["run unit | PASS suspends charge", "run unit | charge suspends PASS"]),
         1, {"C1": "pass", "C2": "**no test ran**"}, None),
        ("a POSIX shell proof runs as written, on Windows through Git Bash",
         proofs_md({}, ["`printf a | tr a b | grep -q b`"]), 0, {"C1": "pass"}, None),
        ("a failing build command is a fail row",
         proofs_md(unit, ["run unit | PASS suspends"], build=f'`{r} 2 "error: 2 offenses"`'),
         1, {"C1": "pass", "Build": "**fail** - error: 2 offenses"}, None),
        ("an old checks.md with a Mutations line still runs",
         proofs_md(unit, ["run unit | PASS suspends"], head="Mutations: 3\n"), 0, {"C1": "pass"}, None),
    ]
    ok = True
    try:
        for desc, checks, want_code, want_rows, want_runs in cases:
            write_artifact(os.path.join(fdir, "checks.md"), checks)
            log = os.path.join(root, "ran.log")
            if os.path.exists(log):
                os.remove(log)
            code, out = run_script("check_proofs.py", FEATURE, "--root", root)
            written = read_artifact(os.path.join(fdir, "proofs.md"))
            rows = result_rows(written)
            runs = len(read_artifact(log).splitlines())
            if (code == want_code and all(rows.get(k, "").startswith(v) for k, v in want_rows.items())
                    and (want_runs is None or runs == want_runs) and "## Output" in written):
                print(f"  ok      check_proofs.py: {desc}")
            else:
                ok = False
                print(f"  BROKEN  check_proofs.py: {desc} - expected exit={want_code}, rows {want_rows}"
                      f"{'' if want_runs is None else f', {want_runs} run(s)'}; got exit={code}, {runs} run(s)")
                print("          " + (out + written).strip().replace("\n", "\n          "))
        code, out = run_script("check_proofs.py", FEATURE, "--root", root, "--mutations", "spec.json")
        if code == 2:
            print("  ok      check_proofs.py: --mutations is gone and exits 2")
        else:
            ok = False
            print(f"  BROKEN  check_proofs.py: --mutations - expected exit=2, got {code}: {out.strip()[:200]}")
    finally:
        shutil.rmtree(root, ignore_errors=True)
    return ok


def main(argv=None):
    verbose = "-v" in (argv or sys.argv[1:])
    if not os.path.isdir(FIXTURES):
        print(f"selftest: fixtures directory missing: {FIXTURES}", file=sys.stderr)
        return 1

    base = scaffold()
    print("baseline - a clean artifact set must pass every gate")
    baseline_ok = True
    for validator in [v for v in ("validate_plan", "validate_checks", "validate_verification") if shipped(v)]:
        code, out = run(validator, base)
        if code != 0:
            baseline_ok = False
            print(f"  BROKEN  {validator} exit={code}")
            print("          " + out.strip().replace("\n", "\n          "))
        else:
            print(f"  ok      {validator}")
    shutil.rmtree(base)

    print("\ngate mutants - every mutant must be killed")
    killed = survived = 0
    for validator, artifact, desc, mutate, want_code, want_msg in CASES:
        if not shipped(validator):
            continue
        root = scaffold()
        path = os.path.join(root, ".specs", "features", FEATURE, artifact)
        with open(path, encoding="utf-8") as f:
            original = f.read()
        mutated = mutate(original)
        if mutated == original:
            survived += 1
            print(f"  VACUOUS {validator}: {desc} - the mutation did not apply, so the case proves nothing")
            shutil.rmtree(root)
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(mutated)
        code, out = run(validator, root)
        if code == want_code and want_msg in out:
            killed += 1
            if verbose:
                print(f"  killed  {validator}: {desc}")
        else:
            survived += 1
            print(f"  SURVIVED {validator}: {desc}")
            print(f"           expected exit={want_code} and {want_msg!r}, got exit={code}")
            print("           " + out.strip().replace("\n", "\n           "))
        shutil.rmtree(root)

    for validator, desc, edits, want_code, want_msg in MULTI_CASES:
        if not shipped(validator):
            continue
        root = scaffold()
        applied = True
        for artifact, edit in edits.items():
            path = os.path.join(root, ".specs", "features", FEATURE, artifact)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            original = read_artifact(path)
            mutated = edit(original)
            if mutated == original:
                applied = False
            write_artifact(path, mutated)
        if not applied:
            survived += 1
            print(f"  VACUOUS {validator}: {desc} - an edit did not apply, so the case proves nothing")
            shutil.rmtree(root)
            continue
        code, out = run(validator, root)
        if code == want_code and want_msg in out:
            killed += 1
            if verbose:
                print(f"  killed  {validator}: {desc}")
        else:
            survived += 1
            print(f"  SURVIVED {validator}: {desc}")
            print(f"           expected exit={want_code} and {want_msg!r}, got exit={code}")
            print("           " + out.strip().replace("\n", "\n           "))
        shutil.rmtree(root)

    if not verbose and survived == 0:
        print(f"  all {killed} killed (-v to list them)")

    print("\nnegative controls - a gate must not fire where nothing is owed")
    controls_ok = True
    for validator, desc, edits, *absent in NEGATIVE_CONTROLS:
        if not shipped(validator):
            continue
        root = scaffold()
        for artifact, edit in edits.items():
            path = os.path.join(root, ".specs", "features", FEATURE, artifact)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            original = read_artifact(path)
            mutated = edit(original)
            if mutated == original:
                controls_ok = False
                print(f"  VACUOUS {validator}: {desc} - the edit to {artifact} did not apply")
            write_artifact(path, mutated)
        code, out = run(validator, root)
        if code == 0 and not any(a in out for a in absent):
            print(f"  ok      {validator}: {desc}")
        else:
            controls_ok = False
            print(f"  FIRED   {validator}: {desc} - expected exit=0 with no {absent!r}, got {code}")
            print("          " + out.strip().replace("\n", "\n          "))
        shutil.rmtree(root)

    tooling = [run_tooling()]
    if shipped("check_proofs"):
        tooling.append(run_proofs_tooling())
    tooling_ok = all(tooling)

    print(f"\nselftest: {killed} killed, {survived} survived, "
          f"controls {'ok' if controls_ok else 'BROKEN'}, "
          f"tooling {'ok' if tooling_ok else 'BROKEN'}, "
          f"baseline {'clean' if baseline_ok else 'BROKEN'}")
    return 0 if (survived == 0 and baseline_ok and controls_ok and tooling_ok) else 1


if __name__ == "__main__":
    raise SystemExit(main())

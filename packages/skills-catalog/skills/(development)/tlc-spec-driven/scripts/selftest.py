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

import base64
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
    ("validate_checks", "checks.md", "remove the Mutations line",
     lambda s: s.replace("Mutations: 3\n", ""),
     1, "no `Mutations:` line"),
    ("validate_checks", "checks.md", "a mutation count above the cap",
     lambda s: s.replace("Mutations: 3\n", "Mutations: 9\n"),
     1, "exceeds the cap of 5"),
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
    """Text artifacts are written as UTF-8; a picture is bytes."""
    if isinstance(content, bytes):
        with open(path, "wb") as f:
            f.write(content)
    else:
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


def screens_md(verdict):
    return lambda s: (
        "# Billing screens\n\n**Verifier**: independent sub-agent (author != verifier)\n\n"
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
     {"proofs.md": lambda s: s.replace("| C5 | `bin/rails test -n /c5/` | 1 | 1 | pass |", "| C5 | `bin/rails test -n /c5/` | 0 | 0 | **no test ran** |")},
     1, "C5 reads"),
    ("validate_verification", "proofs.md with no row for a check",
     {"proofs.md": lambda s: s.replace("| C12 | `bin/rails test -n /c12/` | 1 | 1 | pass |\n", "")},
     1, "has no row for C12"),
    ("validate_verification", "proofs.md with a surviving mutation",
     {"proofs.md": lambda s: s.replace("| `app/webhooks/ingest.rb:31` | yes |", "| `app/webhooks/ingest.rb:31` | no |")},
     1, "reads 'no'"),
    ("validate_verification", "proofs.md with fewer mutations than checks.md owes",
     {"proofs.md": lambda s: s.replace("| retry bound off by one | `app/models/billing/dunning.rb:22` | yes |\n", "")},
     1, "owes 3 mutation rows"),
    ("validate_verification", "a finding with no commit in Closed",
     {"verification.md": lambda s: s.replace("| e4f5a6b C4 |", "|  |")},
     1, "is not closed"),
    ("validate_verification", "a report with no Findings section",
     {"verification.md": lambda s: s.split("## Findings")[0]},
     1, "no `## Findings` section"),
    ("validate_verification", "proofs.md where the build failed",
     {"proofs.md": lambda s: s.replace("| Build | `bin/rubocop app/billing` | - | - | pass |", "| Build | `bin/rubocop app/billing` | - | - | **fail** - 2 offenses |")},
     1, "Build reads"),
    ("validate_verification", "proofs.md with no Build row while checks.md names a build",
     {"proofs.md": lambda s: s.replace("| Build | `bin/rubocop app/billing` | - | - | pass |\n", "")},
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
# fires - it just fails loudly instead of silently, and it would make `Mutations: 0` unusable.
NEGATIVE_CONTROLS = [
    ("validate_verification", "Mutations: 0 with no mutation rows in proofs.md is accepted",
     {"checks.md": lambda s: s.replace("Mutations: 3", "Mutations: 0"),
      "proofs.md": lambda s: s.split("## Mutations")[0]}),
    ("validate_checks", "Mutations: 0 is accepted when the plan has no screen",
     {"checks.md": lambda s: s.replace("Mutations: 3", "Mutations: 0")}),
    ("validate_checks", "Mutations: 0 over a screen is accepted - screens take no mutation",
     {"plan.md": with_screen, "checks.md": lambda s: s.replace("Mutations: 3", "Mutations: 0")}),
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
        capture_output=True, text=True,
    )
    return p.returncode, p.stdout + p.stderr


def run_script(name, *args, cwd=None):
    """Run a shipped script directly and return (exit code, combined output)."""
    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, name), *args],
        capture_output=True, text=True, cwd=cwd,
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
        root = scaffold()
        fdir = os.path.join(root, ".specs", "features", FEATURE)
        os.rename(os.path.join(fdir, "checks.md"), os.path.join(fdir, "tasks.md"))
        os.rename(os.path.join(fdir, "plan.md"), os.path.join(fdir, "spec.md"))
        code, out = run("validate_verification", root)
        proofs = os.path.join(fdir, "proofs.md")
        with open(proofs, encoding="utf-8") as f:
            text = f.read()
        with open(proofs, "w", encoding="utf-8") as f:
            f.write(text.replace("| C3 |", "| C3x |", 1))
        code2, out2 = run("validate_verification", root)
        shutil.rmtree(root)
        if code == 0 and code2 == 1 and "C3" in out2:
            print("  ok      validate_verification.py: reads tasks.md and spec.md, and fails a missing proof there")
        else:
            ok = False
            print(f"  BROKEN  validate_verification.py: spec-driven layout - exit {code} then {code2}: "
                  f"{(out + out2).strip()[:300]}")

    # the lessons store has to survive a real round-trip on disk, not only its unit checks
    if not shipped("lessons"):
        return ok
    root = tempfile.mkdtemp(prefix="lessons-")
    try:
        steps = [
            (["--root", root, "init"], "Initialized"),
            (["--root", root, "add", "--feature", FEATURE, "--signal", "surviving_mutant",
              "--source", "app/billing/x.rb:31", "--text", "assert the dedup path returns the row"],
             "ADDED"),
            (["--root", root, "status"], "1 total"),
        ]
        for argv, frag in steps:
            code, out = run_script("lessons.py", *argv)
            if code != 0 or frag.lower() not in out.lower():
                ok = False
                print(f"  BROKEN  lessons.py: round-trip step {argv[2]!r} - expected {frag!r}, "
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
    return ok


PROOFS_TEST = ('import { describe, expect, test } from "bun:test"\n'
               'describe("billing", () => {\n'
               '  test("suspends on a failed charge", () => { expect("suspended").toBe("suspended") })\n'
               '  test("keeps a paid account active", () => { expect("active").toBe("active") })\n'
               '})\n')
PROOFS_CHECKS = ("# Billing checks\n\nMutations: 0\nBuild: `bun --version`\n\n## Checks\n\n"
                 "**C1** - A failed charge suspends (AC 1)\n"
                 "Proof: `bun test -t \"suspends on a failed charge\" billing.test.ts`\n\n"
                 "**C2** - A paid account stays active (AC 2)\n"
                 "Proof: `bun test -t \"keeps a paid account active\" billing.test.ts`\n\n")


def run_runner_selection():
    """Each adapter's reading of a proof and its choice of tests, over canned reports: no runner
    needs to be installed, and a filter that selects nothing must select nothing."""
    import runners
    ok = True

    def expect(desc, cmd, cases, want):
        nonlocal ok
        adapter, parsed = runners.parse(cmd)
        got = adapter.select(cases, parsed) if adapter else None
        if got == want:
            print(f"  ok      runners.py: {desc}")
        else:
            ok = False
            print(f"  BROKEN  runners.py: {desc} - expected {want}, got {got} ({adapter and adapter.name})")

    py = [("test_billing", "test_billing test_suspends", "test_suspends", True),
          ("test_billing.TestAccess", "test_billing.TestAccess test_paid", "test_paid", False)]
    expect("pytest node id selects one test", "python3 -m pytest test_billing.py::test_suspends", py, [True])
    expect("pytest class node id", "pytest test_billing.py::TestAccess::test_paid", py, [False])
    expect("pytest -k with and / not", 'pytest test_billing.py -k "suspends and not paid"', py, [True])
    expect("pytest -k matching nothing", "pytest test_billing.py -k nosuch", py, [])
    go = [("example.com/b", "TestSuspends", "TestSuspends", True), ("example.com/b", "TestPaid", "TestPaid", False)]
    expect("go -run anchored regex", "go test ./... -run '^TestPaid$'", go, [False])
    js = [("/repo/j/billing.test.js", "billing suspends", "suspends", True),
          ("/repo/k/other.test.js", "billing suspends", "suspends", True)]
    expect("jest folder argument keeps to that folder", 'npx jest j -t "suspends"', js, [True])
    vt = [("v/billing.test.ts", "v/billing.test.ts billing suspends", "billing suspends", True)]
    expect("vitest -t on describe and test joined", 'npx vitest run v/billing.test.ts -t "billing suspends"', vt, [True])
    bun = [("src/a.test.ts", "stock map counts", "counts", True)]
    expect("bun -t matches describe and test", 'bun test src/a.test.ts -t "stock map counts"', bun, [True])
    return ok


def run_proofs_tooling():
    """check_proofs.py on a real bun project: one grouped run, each check matched to its tests,
    and a filter that matches nothing reported as such instead of passing."""
    import shutil as _sh
    if _sh.which("bun") is None:
        print("  skip    check_proofs.py: bun is not installed")
        return True
    root = tempfile.mkdtemp(prefix="proofs-")
    ok = True
    try:
        fdir = os.path.join(root, ".specs", "features", FEATURE)
        os.makedirs(fdir)
        write_artifact(os.path.join(root, "billing.test.ts"), PROOFS_TEST)
        unknown = ("# Billing checks\n\nMutations: 0\nBuild: none - fixture\n\n## Checks\n\n"
                   "**C1** - counted (AC 1)\nProof: `sh -c 'echo \"Ran 2 tests\"'`\n\n"
                   "**C2** - silent (AC 2)\nProof: `sh -c 'echo ok'`\n\n")
        for checks, want, frag, desc in [
            (unknown, 0, "count unknown", "a runner no adapter knows is judged by exit code, with its count when printed"),
            (unknown.replace("echo ok", "exit 3"), 1, "**fail**", "a runner no adapter knows fails on its exit code"),
            (PROOFS_CHECKS, 0, "| C2 |", "each check is matched to the test its filter selects"),
            (PROOFS_CHECKS.replace('"keeps a paid account active" billing', '"no such test" billing'),
             1, "no test ran", "a filter that matches no test is not a pass"),
        ]:
            write_artifact(os.path.join(fdir, "checks.md"), checks)
            code, out = run_script("check_proofs.py", FEATURE, "--root", root)
            written = read_artifact(os.path.join(fdir, "proofs.md"))
            if code == want and frag in (out + written):
                print(f"  ok      check_proofs.py: {desc}")
            else:
                ok = False
                print(f"  BROKEN  check_proofs.py: {desc} - expected exit={want} and {frag!r}, got exit={code}")
                print("          " + (out + written).strip().replace("\n", "\n          "))
    finally:
        shutil.rmtree(root, ignore_errors=True)
    return ok


APP = 'def status(paid):\n    return "active" if paid else "suspended"\n\n\ndef unused():\n    return 1\n'
PROOF = 'from app import status\nassert status(False) == "suspended"\n'


def run_mutation_tooling():
    """mutate.py mutates the real tree, so its guarantees are checked on a real git repo.

    The same-size mutation ("suspended" -> "cancelled") is deliberate: written inside the same
    second it is invisible to a cache keyed on (mtime, size), and Python's bytecode cache is one.
    A mutate.py that stopped moving the mtime forward would report that mutant as survived.
    """
    if not shutil.which("git"):
        print("  skip    mutate.py: git is not installed")
        return True
    ok = True
    root = tempfile.mkdtemp(prefix="mutation-")

    def sh(*cmd):
        subprocess.run(cmd, cwd=root, check=True, capture_output=True)

    def report(passed, desc, out=""):
        nonlocal ok
        if passed:
            print(f"  ok      mutate.py: {desc}")
        else:
            ok = False
            print(f"  BROKEN  mutate.py: {desc}")
            if out:
                print("          " + out.strip().replace("\n", "\n          "))

    def mutation(spec, *extra):
        path = os.path.join(root, "..", os.path.basename(root) + ".json")
        with open(path, "w", encoding="utf-8") as f:
            f.write(spec)
        return run_script("mutate.py", "--spec", path, "--root", root, *extra)

    def clean():
        p = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True)
        return p.stdout == ""

    try:
        for name, body in (("app.py", APP), ("test_app.py", PROOF), (".gitignore", "__pycache__/\n")):
            with open(os.path.join(root, name), "w", encoding="utf-8") as f:
                f.write(body)
        sh("git", "init", "-q")
        sh("git", "add", ".")
        sh("git", "-c", "user.email=s@t", "-c", "user.name=selftest", "commit", "-qm", "fixture")
        py = f'"{sys.executable}" test_app.py'

        code, out = mutation(
            '[{"file": "app.py", "old": "\\"suspended\\"", "new": "\\"cancelled\\"", "proof": %s},'
            ' {"file": "app.py", "old": "return 1", "new": "return 2", "proof": %s},'
            ' {"file": "app.py", "old": "return 1", "new": "return 3", "proof": "exit 1"}]'
            % (json.dumps(py), json.dumps(py)))
        report(code == 1 and "| `app.py:2` | yes |" in out and "| `app.py:6` | no |" in out
               and "| `app.py:6` | blocked |" in out,
               "kills a same-second same-size mutant, reports a survivor and a blocked proof", out)
        report(clean(), "the tree is byte-for-byte clean after a run")

        code, out = mutation('[{"file": "app.py", "old": "\\"suspended\\"", "new": "\\"x\\"", "proof": %s}]'
                          % json.dumps(py))
        report(code == 0 and "1 killed, 0 survived, 0 blocked" in out, "every mutation killed exits 0", out)

        code, out = mutation('[{"file": "app.py", "old": "return", "new": "pass", "proof": "true"}]')
        report(code == 2 and "occurs 2 times" in out and clean(),
               "an ambiguous `old` is refused before anything is mutated", out)

        with open(os.path.join(root, "app.py"), "rb") as f:
            original = f.read()
        jpath = os.path.join(root, ".git", "tlc-mutation-journal.json")
        with open(jpath, "w", encoding="utf-8") as f:
            json.dump({"app.py": base64.b64encode(original).decode()}, f)
        with open(os.path.join(root, "app.py"), "w", encoding="utf-8") as f:
            f.write("mutated by a run that was killed\n")
        code, out = run_script("mutate.py", "--recover", "--root", root)
        report(code == 0 and "restored 1 file" in out and clean() and not os.path.exists(jpath),
               "--recover restores what an interrupted run left behind", out)
    finally:
        shutil.rmtree(root, ignore_errors=True)
        spec = os.path.join(os.path.dirname(root), os.path.basename(root) + ".json")
        if os.path.exists(spec):
            os.remove(spec)
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

    tooling_ok = run_tooling()
    tooling_ok = ((not shipped("mutate") or run_mutation_tooling())
                  and (not shipped("runners") or run_runner_selection())
                  and (not shipped("check_proofs") or run_proofs_tooling()) and tooling_ok)

    print(f"\nselftest: {killed} killed, {survived} survived, "
          f"controls {'ok' if controls_ok else 'BROKEN'}, "
          f"tooling {'ok' if tooling_ok else 'BROKEN'}, "
          f"baseline {'clean' if baseline_ok else 'BROKEN'}")
    return 0 if (survived == 0 and baseline_ok and controls_ok and tooling_ok) else 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
selftest.py - fault injection against this skill's own gates, plus a smoke run of its tooling.

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

import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURES = os.path.join(HERE, "fixtures")
FEATURE = "billing"

# (validator, artifact, description, mutation, expected exit, expected message fragment)
CASES = [
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
    ("validate_checks", "checks.md", "remove the Profile line",
     lambda s: s.replace("Profile: standard\n", ""),
     1, "no `Profile:` line"),
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

    ("validate_plan", "plan.md", "missing Observable section",
     lambda s: s.replace("## Observable", "## User-facing notes"),
     1, "missing required section: ## Observable"),
    ("validate_plan", "plan.md", "empty Observable section",
     lambda s: re.sub(r"## Observable\n.*?\n## Flow", "## Observable\n\n## Flow", s, flags=re.S),
     1, "Observable section is empty"),
    ("validate_plan", "plan.md", "an Observable row with a blank landing",
     lambda s: s.replace("| error shape and codes | AC 6 |", "| error shape and codes |  |"),
     1, "landing is blank"),
    ("validate_plan", "plan.md", "an Observable n/a with no reason",
     lambda s: s.replace("| versioning | n/a - the provider pins the payload version in the envelope |",
                         "| versioning | n/a |"),
     1, "`n/a` with no reason"),

    ("validate_plan", "plan.md", "missing Flow section",
     lambda s: s.replace("## Flow", "## How it hangs together"),
     1, "missing required section: ## Flow"),
    ("validate_plan", "plan.md", "empty Flow section",
     lambda s: re.sub(r"## Flow\n.*?\n## Relations", "## Flow\n\n## Relations", s, flags=re.S),
     1, "Flow section is empty"),
    ("validate_plan", "plan.md", "missing Relations section",
     lambda s: s.replace("## Relations", "## Data model"),
     1, "missing required section: ## Relations"),
    ("validate_plan", "plan.md", "empty Surface section",
     lambda s: re.sub(r"## Surface\n.*?\n## Landing", "## Surface\n\n## Landing", s, flags=re.S),
     1, "Surface section is empty"),
    ("validate_plan", "plan.md", "empty Landing section",
     lambda s: re.sub(r"## Landing\n.*?\n## Impact", "## Landing\n\n## Impact", s, flags=re.S),
     1, "Landing section is empty"),
    ("validate_plan", "plan.md", "Landing door with no rejected alternative",
     lambda s: s.replace("| a boolean `is_suspended` - cannot express the next state |", "|  |"),
     1, "no rejected alternative"),
    ("validate_plan", "plan.md", "Landing door with no literal shape",
     lambda s: s.replace("| enum value, not null, existing rows backfilled to `active` |", "|  |"),
     1, "no literal shape"),
    ("validate_plan", "plan.md", "columns and types creep into Relations",
     lambda s: s.replace(
         "    Subscription ||--o{ WebhookDelivery : \"reported by\"",
         "    Subscription {\n        string status\n        datetime suspended_at\n    }\n"
         "    Subscription ||--o{ WebhookDelivery : \"reported by\""),
     1, "carries an attribute block"),
    ("validate_plan", "plan.md", "a Surface route with no statuses",
     lambda s: s.replace("| `200`, `409`, `422` |", "|  |"),
     1, "names no status code"),
    ("validate_plan", "plan.md", "check ids written into Surface before checks exist",
     lambda s: s.replace("| `200`, `409`, `422` |", "| `200`, `409`, `422` | C7, C8, C9 |"),
     1, "does not exist yet"),
    ("validate_plan", "plan.md", "empty Impact section",
     lambda s: re.sub(r"## Impact\n.*", "## Impact\n", s, flags=re.S),
     1, "Impact section is empty"),
    ("validate_plan", "plan.md", "a Flow hop naming a module that neither exists nor is a door (warn)",
     lambda s: s.replace(
         "3. `Billing::StatusMap` (new, no door - placement per conventions) - provider status -> local status",
         "3. `Billing::StatusMapFactory` - provider status -> local status"),
     0, "without marking it as existing or as a"),
    ("validate_plan", "plan.md", "a source marked binding under profile standard (warn)",
     lambda s: s.replace("- provider webhook reference - the 9 statuses",
                         "- design `03` - **binding for the interface** - the 9 statuses"),
     0, "declares profile standard, so nobody"),

    ("validate_checks", "plan.md", "a route reviewed in the plan that no check mentions (warn)",
     lambda s: s.replace("`POST /webhooks/provider`", "`POST /webhooks/provider/v2`"),
     0, "owe a Coverage row, or the route is dead"),

    ("validate_plan", "plan.md", "acceptance criterion with no SHALL",
     lambda s: s.replace("THEN the system SHALL set the subscription status", "THEN we set the subscription status"),
     1, "has no SHALL"),
    ("validate_plan", "plan.md", "assumption with no rationale",
     lambda s: s.replace("| the provider already retried 3 times before it reports a failure |", "|  |"),
     1, "empty 'Rationale'"),
    ("validate_plan", "plan.md", "missing required section",
     lambda s: s.replace("## Traceability", "## Requirements Map"),
     1, "missing required section: ## Traceability"),
    ("validate_plan", "plan.md", "out hop naming a slug in backticks is not an unresolved module",
     lambda s: s.replace(
         "5. out: `200` `{}`, and `AccessPolicy` (exists) reads `status` on the next request - no call from here",
         "5. out: `200` `{}`; `completo` stays"),
     0, "0 warning"),
    ("validate_plan", "plan.md", "flowchart node neither existing nor a door (warn)",
     lambda s: s.replace(
         "3. `Billing::StatusMap` (new, no door - placement per conventions) - provider status -> local status",
         "```mermaid\nflowchart TD\n    A[\"Billing::StatusMap\"] --> B[\"Billing::Ledger\"]\n```"),
     0, "belongs in the diff"),
    ("validate_plan", "plan.md", "open question left unresolved (warn)",
     lambda s: s.replace("**Open questions:** none - all resolved or logged above.",
                         "**Open questions:** what happens on a chargeback?"),
     0, "do not read as resolved"),

    ("validate_verification", "verification.md", "surviving mutant next to PASS",
     lambda s: s.replace("| `app/webhooks/ingest.rb:31` | yes |", "| `app/webhooks/ingest.rb:31` | no |"),
     1, "a mutant survived"),
    ("validate_verification", "verification.md", "PASS with an unproven coverage member",
     lambda s: s.replace("`trial_will_end` C10 | - |", "`trial_will_end` C10 | `paused` |"),
     1, "unproven"),
    ("validate_verification", "verification.md", "profile standard with no fault rows",
     lambda s: re.sub(r"## Faults injected\n.*?\n## Gate", "## Gate", s, flags=re.S),
     1, "no fault rows"),
    ("validate_verification", "verification.md", "PASS with no file:line evidence",
     lambda s: re.sub(r"`[\w./-]+\.rb:\d+`", "`the test file`", s),
     1, "cites no file:line evidence"),
    ("validate_verification", "verification.md", "FAIL verdict",
     lambda s: s.replace("**Verdict**: PASS", "**Verdict**: FAIL"),
     1, "verdict is FAIL"),
    ("validate_verification", "verification.md", "unfilled template verdict",
     lambda s: s.replace("**Verdict**: PASS", "**Verdict**: [PASS | FAIL]"),
     1, "template placeholder"),
    ("validate_verification", "verification.md", "a check row that is not PASS",
     lambda s: s.replace("`assert_equal 1, WebhookDelivery.count` | PASS |",
                         "`assert_equal 1, WebhookDelivery.count` | not run |"),
     1, "reports 'not run'"),
    ("validate_verification", "verification.md", "self-verified report (warn)",
     lambda s: s.replace("independent sub-agent (author != verifier)", "self-verified (degraded - no sub-agent)"),
     0, "self-verified"),
    ("validate_verification", "verification.md", "report downgrades the approved profile",
     lambda s: s.replace("**Profile**: standard", "**Profile**: light"),
     1, "checks.md was approved under 'standard'"),

    # Profile-scoped steps: raising the profile in checks.md must make the report owe a section.
    ("validate_verification", "checks.md", "profile ui but no binding-sources section in the report",
     lambda s: s.replace("Profile: standard", "Profile: ui"),
     1, "no `## Binding sources` section"),
    ("validate_verification", "verification.md", "profile standard with no recomputed Coverage",
     lambda s: re.sub(r"## Coverage\n.*?\n## Test policy rows", "## Test policy rows", s, flags=re.S),
     1, "no `## Coverage` section"),
    ("validate_verification", "verification.md", "an unmet Test policy row next to PASS",
     lambda s: s.replace("| own layer C2 | yes |", "| own layer C2 | no |"),
     1, "Test policy row is unmet"),
]

# Negative controls: under `light` the profile-scoped steps must NOT be demanded. A gate that
# fires at every profile is the same bug as one that never fires - it just fails loudly instead
# of silently, and it would make `light` unusable.
NEGATIVE_CONTROLS = [
    ("validate_verification", "a light report with no faults and no coverage is accepted",
     {"checks.md": lambda s: s.replace("Profile: standard", "Profile: light"),
      "verification.md": lambda s: re.sub(
          r"## Coverage\n.*?\n## Faults injected\n.*?\n## Gate", "## Gate",
          s.replace("**Profile**: standard", "**Profile**: light"), flags=re.S)}),
]


def scaffold():
    root = tempfile.mkdtemp(prefix="tlc-spec-lean-selftest-")
    fdir = os.path.join(root, ".specs", "features", FEATURE)
    os.makedirs(fdir)
    for name in ("plan.md", "checks.md", "verification.md"):
        shutil.copyfile(os.path.join(FIXTURES, name), os.path.join(fdir, name))
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
        for argv, want, desc in [
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

    # the lessons store has to survive a real round-trip on disk, not only its unit checks
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


def main(argv=None):
    verbose = "-v" in (argv or sys.argv[1:])
    if not os.path.isdir(FIXTURES):
        print(f"selftest: fixtures directory missing: {FIXTURES}", file=sys.stderr)
        return 1

    base = scaffold()
    print("baseline - a clean artifact set must pass every gate")
    baseline_ok = True
    for validator in ("validate_plan", "validate_checks", "validate_verification"):
        code, out = run(validator, base)
        if code != 0:
            baseline_ok = False
            print(f"  BROKEN  {validator} exit={code}")
            print("          " + out.strip().replace("\n", "\n          "))
        else:
            print(f"  ok      {validator}")
    shutil.rmtree(base)

    print("\nfault injection - every mutant must be killed")
    killed = survived = 0
    for validator, artifact, desc, mutate, want_code, want_msg in CASES:
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

    if not verbose and survived == 0:
        print(f"  all {killed} killed (-v to list them)")

    print("\nnegative controls - a profile-scoped gate must not fire below its profile")
    controls_ok = True
    for validator, desc, edits in NEGATIVE_CONTROLS:
        root = scaffold()
        for artifact, edit in edits.items():
            path = os.path.join(root, ".specs", "features", FEATURE, artifact)
            with open(path, encoding="utf-8") as f:
                original = f.read()
            mutated = edit(original)
            if mutated == original:
                controls_ok = False
                print(f"  VACUOUS {validator}: {desc} - the edit to {artifact} did not apply")
            with open(path, "w", encoding="utf-8") as f:
                f.write(mutated)
        code, out = run(validator, root)
        if code == 0:
            print(f"  ok      {validator}: {desc}")
        else:
            controls_ok = False
            print(f"  FIRED   {validator}: {desc} - expected exit=0, got {code}")
            print("          " + out.strip().replace("\n", "\n          "))
        shutil.rmtree(root)

    tooling_ok = run_tooling()

    print(f"\nselftest: {killed} killed, {survived} survived, "
          f"controls {'ok' if controls_ok else 'BROKEN'}, "
          f"tooling {'ok' if tooling_ok else 'BROKEN'}, "
          f"baseline {'clean' if baseline_ok else 'BROKEN'}")
    return 0 if (survived == 0 and baseline_ok and controls_ok and tooling_ok) else 1


if __name__ == "__main__":
    raise SystemExit(main())

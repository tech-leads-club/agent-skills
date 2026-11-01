# Execute: Validate & Verify

A safety net that raises the work, not an audit of it. A script settles what a script can. A fresh sub-agent then spends a few minutes on judgement. It looks where the code can be wrong while every test stays green. It runs once per feature, beside the screens sub-agent.

**Triggers:** "Validate", "verify work", "UAT", "test with me", "walk me through it".

## Author Is Not Verifier

The Verifier is a fresh sub-agent with no inherited context. A self-check reapplies the thinking that made the gap. The author's `## Handoff` carries that thinking, so the Verifier reads the spec, the checks and their proofs, never the Handoff. With no sub-agent, run this file in a new session and write `Verifier: self-verified (degraded - no sub-agent)`. The gate flags it.

## The Round

1. The orchestrator runs `python3 <skill-dir>/scripts/check_proofs.py <feature>` at `HEAD`. It runs each `Run` group and each lone proof once, one at a time. It finds each check's line in the output, runs the `**Build**:` commands, and checks the pictures and the walk. It writes `proofs.md` with the tail of every run. A red row goes back to an author first.
2. In the same turn, the orchestrator sends the Verifier. When a criterion cites a capture, it also sends the screens sub-agent ([verify-screens.md](verify-screens.md)). Both read the same `HEAD`. The dispatch names the feature, the files and the diff range, and nothing about what to accept.
3. Every finding from both is fixed in one pass. Then `check_proofs.py` runs again, and the screens sub-agent reopens the rows that differed. That is the second and last round. Each finding gets its closing commit, and the gate runs. There is no second Verifier. What still fails goes to the user.

## What the Verifier Does

It receives `spec.md`, the `## Checks` of tasks.md, `proofs.md`, the diff range and this file. It does not rerun the proofs, because `proofs.md` already shows which tests ran and passed. It works over the real tree and fixes nothing. Its writes are `verification.md` and throwaway examples it never commits.

**Each check's test.** For every check, open the test its proof selects. Judge whether it would fail if the claim were false. It must assert the value the criterion fixes, on the cases the criterion names, at the layer the matrix names. Write one `## Checks` row per check. A `no` is a finding.

Look hardest where a wrong decision costs most. That is a returned value, a condition, a bound off by one, an order, a sign or a filter. Look also at rules the diff touched that no check names.

**Your own examples.** For two rules the spec states, try a value neither the spec nor the checks name. Try the other side of a boundary, an empty set and a large one. Run each at `HEAD` as a throwaway test or a request. A rule that breaks on your example is a finding.

**Assertions that do not hold the value.** Report the tests whose assertion is looser than the criterion's value. Report the tests that prove a rule on two cases out of nine. Report the tests that sit at another level than the matrix names for that layer.

**The spec against the captures.** When a capture binds, a check or criterion that contradicts it is a finding, even with a green proof. A label spelled differently counts. So does a control nobody builds, or a state turned into a screen of its own. Departures listed in `## Differences from the source` with `Confirmed: y` are approved.

## Report

Write `.specs/features/<feature>/verification.md`:

```markdown
# <Feature> verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at <sha>
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `stock-map.service.test.ts` `counts a Transfer in on its destination` | no - asserts the count, not the sign |
| C7 | `stock-map.service.test.ts` `counts items at zero` | no - `toBeDefined()` |
| C9 | `transfers.e2e.test.ts` `rejects a transfer to the same location` | yes |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Transfer in is counted as out and no test fails | C1's test asserts the count, not the sign | assert the sign of a Transfer in on its destination | |
| C7 asserts the count exists, not that it is 5 | `stock-map.service.test.ts:88` - `toBeDefined()` | assert `atZero` is 5 on the capture's data | |
```

Every check gets a `## Checks` row that names its test. The gate refuses a missing row or an empty `Test`. With nothing to report, write `None - <one line on what was probed>` under `## Findings` and `**Verdict**: PASS`. Return the findings in chat.

Whoever fixes fills `Closed` with the fixing commit and the check that now proves it. The gate refuses an empty `Closed`. A finding that needs a new criterion appends it to the spec with a new ID and a check. It never edits an approved criterion. The new criterion goes to the user, and their answer is stamped with `approve.py`.

## The Gate

```bash
python3 <skill-dir>/scripts/validate_verification.py <feature>
```

It reads `proofs.md` at `HEAD`. Every check and run needs a passing row, a passing build and a clean tree. It reads the `## Checks` table. It reads `screens.md` when a criterion cites a capture, and the `**Walked:**` line when a check is a walk. Every finding must be closed. Exit 0 means the feature is done.

## Interactive UAT (Complex Scope, or a Screen Nobody Can Walk)

Present one test at a time: what to do and what should happen. Log the answer word for word. Infer severity from the words and never ask for it:

| The user says | Severity |
| --- | --- |
| crash, error, broken | Blocker |
| does not work, wrong, missing | Major |
| slow, weird, off | Minor |
| colour, font, spacing | Cosmetic |
| unclear | Major |

An issue becomes a finding in `verification.md` like any other.

## Distill Lessons

After the gate passes, turn each finding into one lesson with `scripts/lessons.py` ([lessons.md](lessons.md)). A feature with no finding records nothing.

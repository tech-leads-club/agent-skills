# Execute: Validate & Verify

A safety net that raises the work, not an audit of it. A script settles what can be settled
mechanically; a fresh sub-agent spends a few minutes on what needs judgement: where the code can be
wrong while every test stays green. It runs once per feature, beside the screens sub-agent.

**Trigger for explicit validation:** "Validate", "verify work", "UAT", "test with me", "walk me through it"

## Author is not verifier

The Verifier is a fresh sub-agent with no inherited context; a self-check reapplies the thinking that
produced the gap. The author's `## Handoff` in tasks.md carries that thinking, so the Verifier reads
the spec, the checks and their proofs, not the Handoff. With no sub-agent mechanism, run this file in
a new session and write `Verifier: self-verified (degraded - no sub-agent)`; the gate flags it.

## The round

1. The orchestrator runs `python3 <skill-dir>/scripts/check_proofs.py <feature>` at `HEAD`. It runs
   each `Run` group and each lone proof once, one at a time, finds each check's line in its group's
   output, runs the `**Build**:` commands, checks the pictures and the walk, and writes `proofs.md`
   with the tail of every run. A red row goes back to an implementer before anything else.
2. The orchestrator dispatches, in the same turn and in parallel, the screens sub-agent when a
   criterion cites a capture ([verify-screens.md](verify-screens.md)) and the Verifier. Both read the
   same `HEAD`. The dispatch names the feature, the files and the diff range, and nothing about what
   to accept.
3. Every finding from both is fixed in one pass. Then `check_proofs.py <feature>` runs again, the
   screens sub-agent goes back over the rows that differed (the second and last round), the closing
   commit is written into each finding, and the gate runs. There is no second Verifier: the script
   shows the proofs green at the new `HEAD`, the fixed tests among them. What still fails goes to
   the user.

## What the Verifier does

It receives `spec.md`, tasks.md (its `## Checks`), `proofs.md`, the diff range and this file. It does
not rerun the proofs; `proofs.md` already says which tests ran and passed, with the output that
shows it. It works over the real tree and fixes nothing; its writes are `verification.md` and
throwaway examples it does not commit.

**Each check's test.** For every check, open the test its proof selects - the one whose line the
`run` proof names, or the one a lone proof's filter picks - and judge whether it would fail if the
claim were false: it asserts the value the criterion fixes, on the cases the criterion names, at
the layer the Test Coverage Matrix names. Write one `## Checks` row per check. A `no` is a finding:
the test passes without holding its criterion. Look hardest where a wrong decision costs most - a
returned value, a condition, a bound shifted by one, an order, a sign, a filter - and at rules the
diff touched that no check names: a rule in the browser with no test is still a rule.

**Own examples.** For two rules the spec states, try a value neither the spec nor the checks name -
the other side of a boundary, an empty set, a large one. Run each at `HEAD` as a throwaway test or a
request. A rule that breaks on yours is a finding.

**Assertions that do not hold the value.** Across the `## Checks` rows, report the tests whose
assertion is looser than the value the criterion fixes, that prove a rule on two cases out of nine,
or that sit at another level than the Test Coverage Matrix names for that layer.

**The spec against the captures.** When a capture binds, a check or criterion that contradicts what
it draws - a label spelled differently, a control it draws that no criterion builds, a state turned
into a screen of its own - is a finding, even with a green proof. Departures listed in
`## Differences from the source` with `Confirmed: y` are approved.

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

Every check gets a `## Checks` row with the test named; the gate refuses a missing row or an empty
`Test`. With nothing to report, write `None - <one line on what was probed>` under `## Findings` and
`**Verdict**: PASS`. Return the findings in chat. Whoever fixes fills `Closed` with the commit that
fixes each one and the check that now proves it; the gate refuses an empty `Closed`. A finding that
needs a new criterion appends it to the spec with a new requirement ID and a check - never edits an
approved one.

## The gate

```bash
python3 <skill-dir>/scripts/validate_verification.py <feature>
```

It reads `proofs.md` at `HEAD` (every check and run has a passing row, the build passed, the tree is
clean), the `## Checks` table (a row with a test for every check), `screens.md` when a criterion
cites a capture, the `**Walked:**`
line when a check is a walk, and every finding closed. `0` means the feature is done.

## Interactive UAT (Complex scope, or when a screen cannot be walked)

Present one test at a time - what to do and what should happen - and log the answer verbatim. Infer
severity from the words, never ask for it: crash, error, broken → Blocker; doesn't work, wrong,
missing → Major; slow, weird, off → Minor; colour, font, spacing → Cosmetic; unclear → Major. An
issue becomes a finding in `verification.md` like any other.

## Distill lessons

After the gate passes, turn each finding into one lesson with `scripts/lessons.py`
([lessons.md](lessons.md)). A feature with no finding records nothing.

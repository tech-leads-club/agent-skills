# Verify

A safety net that raises the work, not an audit of it. A script settles what can be settled
mechanically; a fresh sub-agent spends a few minutes on what needs judgement: where the code can
be wrong while every test stays green. It runs once per feature, beside the screens sub-agent.

## Author is not verifier

The Verifier is a fresh sub-agent with no inherited context; a self-check reapplies the thinking
that produced the gap. The author's notes in `checks.md`'s `## Handoff` carry that thinking, so the
Verifier reads the claims and proofs, not the Handoff. With no sub-agent mechanism, run this file in
a new session and write `Verifier: self-verified (degraded - no sub-agent)`; the gate flags it.

## The round

1. The builder runs `python3 <skill-dir>/scripts/check_proofs.py <feature>` at `HEAD`. It runs every
   proof once per runner, matches each check to the tests its filter selects, checks the pictures
   and the walk, and writes `proofs.md`. A red row is the builder's to fix before anything else.
2. The builder dispatches, in the same turn and in parallel, the screens sub-agent when a criterion
   cites a capture ([verify-screens.md](verify-screens.md)) and the Verifier. Both read the same
   `HEAD`. The dispatch prompt names the feature, the files and the diff range, and nothing about
   what to accept. Each goes on the `**Dispatched:**` line of `checks.md` `## Handoff` before it is
   sent; a builder resuming after a compaction that finds one there with no report on disk waits
   for it instead of sending another.
3. The builder fixes everything both name in one pass, runs
   `check_proofs.py <feature> --mutations .specs/features/<feature>/mutations.json`, and when the
   fix changed code re-saves every picture at the new `HEAD` and resumes the round-1 screens
   sub-agent for round 2 (it is the last), writes the closing commit into each finding, and runs the gate.
   There is no second Verifier: the script shows the mutations killed and the proofs green at the
   new `HEAD`. What still fails goes to the user.

## What the Verifier does

It receives `plan.md`, `checks.md`, `proofs.md`, the diff range and this file. It does not rerun the
proofs or re-locate every assertion; `proofs.md` already says which tests ran and passed. It works
over the real tree and fixes nothing; its writes are `verification.md`, `mutations.json` and
throwaway examples it does not commit.

**Mutations.** Choose `Mutations: N` from `checks.md` (3 by default) in production code the diff
touched, wherever the rule lives - a rule on the web with no test is still a rule. Take the decisions
hardest to undo or most often gotten wrong: a returned value, a condition, a bound shifted by one, an
order, a sign, a filter. One object per mutation in `.specs/features/<feature>/mutations.json` with
`file`, an `old` snippet that occurs once, `new`, the narrowest `proof` and a `label`; then run
`check_proofs.py <feature> --mutations <that file>`. A mutation not killed is a finding: the test that
should fail does not.

**Own examples.** For two rules the plan states with examples, try a value neither the plan nor the
checks name - the other side of a boundary, an empty set, a large one. Run each at `HEAD` as a
throwaway test or a request. A rule that breaks on yours is a finding.

**Assertions that do not hold the value.** Read the criteria against the tests the checks name and
report the ones whose assertion is looser than the value the criterion fixes, that prove a rule on
two cases out of nine, or that sit at another level than the repo's test docs name for that layer.
Report what you find; do not tabulate every check.

**The plan against the captures.** When a capture binds, a check or criterion that contradicts what
it draws - a label spelled differently, a state turned into a screen of its own - is a finding, even
with a green proof. Departures listed in `## Differences from the source` with `Confirmed: y` are
approved.

## Report

Write `.specs/features/<feature>/verification.md`:

```markdown
# <Feature> verification

**Verdict**: FAIL
**Mutations**: 3 - probed C1, C4, C9
**Proofs**: `proofs.md` at <sha>
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Transfer in is counted as out and no test fails | mutation `direction in -> out` not killed | assert the sign of a Transfer in on its destination | |
| C7 asserts the count exists, not that it is 5 | `stock-map.service.test.ts:88` - `toBeDefined()` | assert `atZero` is 5 on the capture's data | |
```

With nothing to report, write `None - <one line on what was probed>` under `## Findings` and
`**Verdict**: PASS`. Return the findings in chat. The builder fills `Closed` with the commit that
fixes each one and the check that now proves it; the gate refuses an empty `Closed`.

## The gate

```bash
python3 <skill-dir>/scripts/validate_verification.py <feature>
```

It reads `proofs.md` at `HEAD` (every check has a passing row, the owed mutations are killed),
`screens.md` when a criterion cites a capture (round 1 or 2, judged at a `HEAD` no code commit has
passed), the plan's `**Approved**:` line, and every finding closed. `0`
the feature is done.

## Distill lessons

After the gate passes, turn each finding into one lesson with `scripts/lessons.py`
([memory.md](memory.md)). A feature with no finding records nothing.

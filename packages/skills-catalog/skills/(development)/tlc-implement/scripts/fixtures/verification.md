# Dunning on failed charge - verification

**Verdict**: FAIL
**Mutations**: 3 - probed C1, C8, C3
**Proofs**: `proofs.md` at e4f5a6b
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C4 asserts the status changed, not the value | `test/billing/dunning_test.rb:40` | assert `suspended` | e4f5a6b C4 |

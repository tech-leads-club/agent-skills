# billing proofs

**HEAD**: e4f5a6b
**Tree**: clean
**Result**: 12 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `bin/rails test -n /c1/` | 1 | 1 | pass |
| C2 | `bin/rails test -n /c2/` | 1 | 1 | pass |
| C3 | `bin/rails test -n /c3/` | 1 | 1 | pass |
| C4 | `bin/rails test -n /c4/` | 1 | 1 | pass |
| C5 | `bin/rails test -n /c5/` | 1 | 1 | pass |
| C6 | `bin/rails test -n /c6/` | 1 | 1 | pass |
| C7 | `bin/rails test -n /c7/` | 1 | 1 | pass |
| C8 | `bin/rails test -n /c8/` | 1 | 1 | pass |
| C9 | `bin/rails test -n /c9/` | 1 | 1 | pass |
| C10 | `bin/rails test -n /c10/` | 1 | 1 | pass |
| C11 | `bin/rails test -n /c11/` | 1 | 1 | pass |
| C12 | `bin/rails test -n /c12/` | 1 | 1 | pass |
| Build | `bin/rubocop app/billing` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| suspended -> cancelled | `app/models/billing/subscription.rb:88` | yes |
| delivery-id guard removed | `app/webhooks/ingest.rb:31` | yes |
| retry bound off by one | `app/models/billing/dunning.rb:22` | yes |

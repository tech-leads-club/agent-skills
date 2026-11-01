# ledger proofs

**HEAD**: e4f5a6b
**Tree**: clean
**Shell**: /bin/sh
**Result**: 13 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run ledger / test_failed_charge_suspends = .` | pass |
| C2 | `run ledger / test_every_provider_status_maps_once = .` | pass |
| C3 | `run ledger / test_unknown_status_is_recorded = .` | pass |
| C4 | `bin/rails test test/ledger/access_test.rb -n "/suspended_denies_paid_groups/"` | pass |
| C5 | `bin/rails test test/ledger/transitions_test.rb -n "/suspended_to_trialing_is_rejected/"` | pass |
| C6 | `bin/rails test test/ledger/transitions_test.rb -n "/suspended_to_active/"` | pass |
| C7 | `bin/rails test test/webhooks/ingest_test.rb -n "/concurrent_delivery_conflicts/"` | pass |
| C8 | `bin/rails test test/webhooks/ingest_test.rb -n "/retry_is_idempotent/"` | pass |
| C9 | `bin/rails test test/webhooks/ingest_test.rb -n "/missing_subscription_id_is_422/"` | pass |
| C10 | `bin/rails test test/webhooks/dispatch_test.rb -n "/dispatches_every_event_type/"` | pass |
| C11 | `run ledger / test_provider_timeout_is_inert = .` | pass |
| C12 | `bin/rails test test/webhooks/ingest_test.rb -n "/unsigned_delivery_is_401/"` | pass |
| Build | `bin/rubocop app/ledger` | pass |

## Output

`Run ledger` - exit 0

```
LedgerDunningTest#test_failed_charge_suspends = 0.02 s = .
LedgerDunningTest#test_provider_timeout_is_inert = 0.01 s = .
LedgerStatusMapTest#test_every_provider_status_maps_once = 0.01 s = .
LedgerStatusMapTest#test_unknown_status_is_recorded = 0.01 s = .

4 runs, 13 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/ledger/access_test.rb -n "/suspended_denies_paid_groups/"` - exit 0

```
1 runs, 2 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/ledger/transitions_test.rb -n "/suspended_to_trialing_is_rejected/"` - exit 0

```
1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/ledger/transitions_test.rb -n "/suspended_to_active/"` - exit 0

```
1 runs, 1 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/webhooks/ingest_test.rb -n "/concurrent_delivery_conflicts/"` - exit 0

```
1 runs, 3 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/webhooks/ingest_test.rb -n "/retry_is_idempotent/"` - exit 0

```
1 runs, 3 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/webhooks/ingest_test.rb -n "/missing_subscription_id_is_422/"` - exit 0

```
1 runs, 3 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/webhooks/dispatch_test.rb -n "/dispatches_every_event_type/"` - exit 0

```
1 runs, 5 assertions, 0 failures, 0 errors, 0 skips
```

`bin/rails test test/webhooks/ingest_test.rb -n "/unsigned_delivery_is_401/"` - exit 0

```
1 runs, 3 assertions, 0 failures, 0 errors, 0 skips
```

# Dunning on failed charge - verification

**Verdict**: PASS
**Profile**: standard
**Diff range**: a1b2c3d..e4f5g6h
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | suspends, never cancels | `bin/rails test ... -n "/failed_charge_suspends/"` exit 0 | `test/billing/dunning_test.rb:118` - `assert_equal "suspended", sub.status` | PASS |
| C8 | retry changes nothing | `bin/rails test ... -n "/retry_is_idempotent/"` exit 0 | `test/webhooks/ingest_test.rb:64` - `assert_equal 1, WebhookDelivery.count` | PASS |

## Coverage

| Set (size) | Recomputed from | Member -> proof | Unproven |
| --- | --- | --- | --- |
| provider status -> local (9) | provider webhook reference | C2, table-driven over all 9 | - |
| webhook event types (5) | provider webhook reference | `charge_failed` C1 · `charge_succeeded` C6 · `updated` C10 · `deleted` C10 · `trial_will_end` C10 | - |

## Test policy rows

| Row | Files it classifies | Required proof | Expectation met |
| --- | --- | --- | --- |
| Decides, reached across a boundary | `app/webhooks/ingest.rb` | boundary C9 · own layer C10 | yes |
| Decides, not reached across a boundary | `app/models/billing/status_map.rb` | own layer C2 | yes |
| Instrumentation, pass-throughs | `app/webhooks/payload.rb` | none of its own | yes |

## Faults injected

| Mutation | Location | Killed |
| --- | --- | --- |
| returned status `suspended` -> `cancelled` | `app/models/billing/subscription.rb:88` | yes |
| removed the delivery-id guard | `app/webhooks/ingest.rb:31` | yes |
| bound `>= 3` -> `> 3` on retry count | `app/models/billing/dunning.rb:22` | yes |

## Gate

`bin/rails test` - 138 passed, 0 failed

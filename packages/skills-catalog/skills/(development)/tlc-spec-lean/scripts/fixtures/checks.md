# Dunning on failed charge - checks

Profile: standard
Plan: `.specs/features/billing/plan.md`

## Intent

11 checks in 2 slices · 2 one-way doors · 0 open

## Checks

### S1 - Suspension on a failed charge · 4 files · 38 KB · ~10k

**C1** - A failed charge sets status to `Suspended`, never `Cancelled` (BILL-01, AC 1)
Proof: `bin/rails test test/billing/dunning_test.rb -n "/failed_charge_suspends/"`

**C2** - Every provider status maps to exactly one local status (BILL-01, AC 1)
Proof: `bin/rails test test/billing/status_map_test.rb -n "/every_provider_status/"`

**C3** - An unknown provider status leaves the status unchanged and records `billing.status_unmapped` (BILL-01, AC 2)
Proof: `bin/rails test test/billing/status_map_test.rb -n "/unknown_status_is_recorded/"`

**C4** - A `Suspended` subscription denies access to paid access groups (BILL-01, AC 3)
Proof: `bin/rails test test/billing/access_test.rb -n "/suspended_denies_paid_groups/"`

**C5** - `Suspended` cannot transition directly to `Trialing` (BILL-01, AC 4)
Proof: `bin/rails test test/billing/transitions_test.rb -n "/suspended_to_trialing_is_rejected/"`

**C6** - A `Suspended` subscription returns to `Active` on a successful charge (BILL-01, AC 1)
Proof: `bin/rails test test/billing/transitions_test.rb -n "/suspended_to_active/"`

**C7** - Two concurrent failed-charge deliveries produce one suspension and the second returns `409` (BILL-01, AC 1)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/concurrent_delivery_conflicts/"`

### S2 - Webhook ingest · 5 files · 61 KB · ~15k

**C8** - Retrying the same delivery id returns `200` and changes no records (BILL-02, AC 5)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/retry_is_idempotent/"`

**C9** - A payload missing a subscription id returns `422` and persists nothing (BILL-02, AC 6)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/missing_subscription_id_is_422/"`

**C10** - Each of the 5 provider event types dispatches to its own handler (BILL-02, AC 5)
Proof: `bin/rails test test/webhooks/dispatch_test.rb -n "/dispatches_every_event_type/"`

**C11** - The provider timing out does not change local state (BILL-01, AC 1)
Proof: `bin/rails test test/billing/dunning_test.rb -n "/provider_timeout_is_inert/"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| provider status -> local (9) | C2, table-driven over all 9 | - |
| webhook event types (5) | `charge_failed` C1 · `charge_succeeded` C6 · `updated` C10 · `deleted` C10 · `trial_will_end` C10 | - |
| `Suspended` transitions (3) | into it C1 · out to `Active` C6 · rejected to `Trialing` C5 | - |
| `POST /webhooks/provider` statuses (3) | 200 C8 · 409 C7 · 422 C9 | - |
| startup config: raw request body (2 assemblies) | app entry point C9 · test harness C8 | - |

- Claims naming a status code, route or response shape: C7, C8, C9 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Test policy

The repo's guidelines say where tests live and how to run them, and nothing about which level
proves which code, so these rows are the bar this build runs under.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence:

- `app/models/billing/status_map.rb`: dispatches over 9 provider statuses, 0 other branch points -> decides
- `app/webhooks/ingest.rb`: dispatches over 5 event types, 3 branch points -> decides, reached across a boundary
- `app/webhooks/payload.rb`: forwards a single call, no conditional -> instrumentation
- closest analogue in the repo: `app/models/access/policy.rb`, same dispatch shape, already proven at its own layer with one case per row

Cost: 2 proofs at their own layer across 2 files. Without these rows, the status map and the
event dispatch are proven only by a path that happens to traverse them.

## Swept

- validation: C9
- failure modes: C11
- idempotency: C8
- authorization: existing - the webhook route already sits behind `Webhooks::Verifier` signature checking
- concurrency: C7
- data lifecycle: n/a - delivery rows are already pruned by the existing 90-day job
- dependency failure: C11
- state transitions: C5, C6
- observability: C3

## Handoff

- S1 = 10k, all in Billing; S2 enters Webhooks at 25k total, under the 150k budget - one builder

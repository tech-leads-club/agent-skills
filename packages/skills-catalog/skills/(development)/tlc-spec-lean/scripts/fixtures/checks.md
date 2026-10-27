# Dunning on failed charge - checks

Mutations: 3
Build: `bin/rubocop app/billing`
Plan: `.specs/features/billing/plan.md`

## Intent

12 checks in 2 slices · 2 one-way doors · 0 open

## Checks

### S1 - Suspension on a failed charge

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

### S2 - Webhook ingest

**C8** - Retrying the same delivery id returns `200` and changes no records (BILL-02, AC 5)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/retry_is_idempotent/"`

**C9** - A payload missing a subscription id returns `422` and persists nothing (BILL-02, AC 6)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/missing_subscription_id_is_422/"`

**C10** - Each of the 5 provider event types dispatches to its own handler (BILL-02, AC 5)
Proof: `bin/rails test test/webhooks/dispatch_test.rb -n "/dispatches_every_event_type/"`

**C11** - The provider timing out does not change local state (BILL-01, AC 1)
Proof: `bin/rails test test/billing/dunning_test.rb -n "/provider_timeout_is_inert/"`

**C12** - A delivery with no valid signature returns `401` and persists nothing (BILL-02, AC 7)
Proof: `bin/rails test test/webhooks/ingest_test.rb -n "/unsigned_delivery_is_401/"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| provider status -> local (9) | C2, table-driven over all 9 | - |
| webhook event types (5) | `charge_failed` C1 · `charge_succeeded` C6 · `updated` C10 · `deleted` C10 · `trial_will_end` C10 | - |
| `Suspended` transitions (3) | into it C1 · out to `Active` C6 · rejected to `Trialing` C5 | - |
| `POST /webhooks/provider` statuses (4) | 200 C8 · 401 C12 · 409 C7 · 422 C9 | - |
| startup config: raw request body (2 assemblies) | app entry point C9 · test harness C8 | - |

- Claims naming a status code, route or response shape: C7, C8, C9, C12 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Swept

- validation: C9
- failure modes: C11
- idempotency: C8
- authorization: C12
- concurrency: C7
- data lifecycle: n/a - delivery rows are already pruned by the existing 90-day job
- dependency failure: C11
- state transitions: C5, C6
- observability: C3

## Handoff

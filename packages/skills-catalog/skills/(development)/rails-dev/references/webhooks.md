# Webhooks

A webhook is a message across a trust boundary, so it is unreliable by default: it can be lost, delivered more than once, and arrive out of order. Treat every webhook as untrusted and at-least-once — persist first, acknowledge fast, process in the background, and make every handler idempotent. Outbound (you send) and inbound (you receive) are mirror images of the same discipline.

In-app domain events are a separate concern (`references/events.md`); an `Event` can fan out to outbound webhooks, but the delivery and ingestion machinery lives here.

---

## Outbound: the outbox

A `Webhook` subscribes to a vetted set of actions; each delivery is its own state record so failures are visible and retryable, never lost in a log line.

```ruby
class Webhook < ApplicationRecord
  PERMITTED_ACTIONS = %w[ card_closed card_assigned comment_created ].freeze

  has_secure_token :signing_secret
  has_many :deliveries, dependent: :delete_all

  serialize :subscribed_actions, type: Array, coder: JSON
  normalizes :subscribed_actions, with: -> { Array.wrap(it).map(&:to_s) & PERMITTED_ACTIONS }

  scope :active, -> { where(active: true) }
end
```

Persist first, deliver second, so state survives crashes and retries. Dispatch happens off the request path: an event's `after_create_commit` enqueues a job that creates a `Webhook::Delivery` per subscribed webhook, and each delivery delivers itself in the background.

```ruby
class Webhook::Delivery < ApplicationRecord
  belongs_to :webhook
  belongs_to :event

  store :request,  coder: JSON
  store :response, coder: JSON
  enum :state, %w[ pending in_progress completed errored ].index_by(&:itself), default: :pending

  after_create_commit :deliver_later

  def deliver_later = Webhook::DeliveryJob.perform_later(self)
end
```

Sign the payload with the webhook's `signing_secret` (HMAC) so the receiver can verify it. Bound the request (timeout, max response size), record request and response on the delivery for audit, and only ever expose actions from `PERMITTED_ACTIONS` — never let a subscriber pull arbitrary internal events.

**Classify destination failure vs bug.** A destination that times out, refuses, or returns 4xx/5xx is an *expected* outcome: rescue it, mark the delivery `completed` with a symbolic error, and don't retry the job — the delivery ran, the destination failed. An application bug is *unexpected*: mark `errored!` and re-raise so the job retries. Conflating the two poisons retry metrics and delinquency tracking.

```ruby
def deliver
  # ...send...
rescue *DESTINATION_ERRORS => e
  completed!(response: { error: e.class.name.demodulize.underscore.to_sym })   # destination's fault, no retry
rescue => e
  errored!(response: { error: e.message })
  raise                                                                         # our fault, retry
end
```

**Circuit breaker.** Track consecutive failures and `first_failure_at` per webhook; auto-deactivate after N failures spanning a minimum window (e.g. 10 over an hour), reset the counter on each success, and surface the inactive state with a manual `resource :activation` to re-enable. Don't hammer a dead endpoint forever.

---

## Inbound: the inbox

**One inbox per integration.** Each provider gets its own table (`Billing::Stripe::WebhookEvent`, a separate one for Zoom, Make, ...), not a shared generic `WebhookEvent`: the natural key, schema, and per-type handlers differ per provider.

An inbound webhook is untrusted, may arrive more than once, and may arrive out of order, and must be acknowledged fast. Don't process it in the request. Verify it, store it in an **inbox** table, ack `200`, and process in the background. This makes redelivery idempotent and processing at-least-once.

Receive, verify, store, ack:

```ruby
def create
  event = Billing::Stripe::WebhookEvent.ingest(
    raw_post: request.raw_post, params: webhook_params, signature: params[:signature]
  )
  head event ? :ok : :unprocessable_entity
end
```

Verify the HMAC signature with a constant-time compare before storing; reject (and notify, with PII scrubbed) on mismatch.

**Idempotent ingest.** A unique index on the event's natural key dedupes redelivery; the `RecordNotUnique` rescue returns the existing row instead of raising:

```ruby
def self.ingest(raw_post:, params:, signature:)
  # validate against the event type's schema; on failure, notify + return nil
  event = create!(order_id:, webhook_event_type:, payload:, raw_payload: raw_post, signature:)
  event.process_later
  event
rescue ActiveRecord::RecordNotUnique
  find_by(order_id:, webhook_event_type:)     # already received: same row, no double-store
end
```

**State as timestamps.** `claimed_at` / `processed_at` / `failed_at` drive `pending` / `processed` / `failed` / `processable` scopes (see `state-records.md`). Processing is idempotent: already-done is a no-op, an error is recorded and re-raised so the job retries.

```ruby
def process_now
  return if processed?
  update!(claimed_at: Time.current) if claimed_at.nil?
  type.process                                 # dispatch to the per-type handler
  update!(processed_at: Time.current)
rescue => e
  update!(last_error: e.message, attempts: attempts + 1)
  raise
end
```

**At-least-once via a relay.** A scheduled job (`class:` in `recurring.yml`) re-enqueues stranded events: one whose enqueue was lost at ingest, or whose worker crashed leaving a stale `claimed_at`. So no stored event stays unprocessed. When the processing job exhausts its retries it marks the event terminally `failed` (poison-message guard), and the relay's `processable` scope skips it.

**Concurrency.** Serialize processing per natural subject so two events for the same actor can't race, while different subjects still run in parallel:

```ruby
limits_concurrency to: 1, key: ->(event) { event.customer_email }
retry_on StandardError, wait: :polynomially_longer, attempts: 5 do |job, error|
  job.arguments.first&.fail(error)            # retries exhausted -> terminal failure
end
```

Because the relay makes processing at-least-once, the per-type handler **must be idempotent**: applying the same approved order twice grants access once, not twice.

**Events arrive out of order.** A provider retries, delivers in parallel, or fires `updated` before you finished `created`. Never assume the sequence, and never treat the payload as the latest truth.

The strong defense: when the provider has an API, treat the webhook as a bare *"something changed for X"* signal and **re-fetch the canonical state from the API** in the handler, then reconcile. You act on the current truth, not on whichever payload arrived, so ordering stops mattering and a stale or replayed payload can't move you backward.

```ruby
# Don't: apply the payload as gospel — a late 'refunded' overwrites a newer 'active'
def process
  member.update!(status: payload[:status])
end

# Do: the webhook says 'subscription X changed'; fetch the truth and reconcile
def process
  current = Stripe::AdminClient.new.subscription(subscription_id)
  member.reconcile_access(current)   # idempotent, order-independent
end
```

When you can't re-fetch (no API, or the payload *is* the event), converge regardless of order with two markers:

- **Watermark** — store the provider's `event_at` / version on the target record; ignore any event older than what's already applied. Reordered updates converge in O(1).
- **Tombstone** — on a delete/cancel, don't hard-destroy: that drops the watermark and lets a stale older update *resurrect* the entity. Soft-delete instead — keep the row marked deleted at `event_at`, so the same watermark check rejects the late event. Reap tombstones on a retention sweep once past the provider's delivery window.

```ruby
return if member.stripe_synced_at&.>= event_at        # watermark: older event, drop

case event.type
when :cancelled then member.update!(status: :cancelled, stripe_synced_at: event_at)  # tombstone, not destroy
else                 member.update!(status: payload[:status], stripe_synced_at: event_at)
end
```

Only when current state is a genuine reduction over events (a sum, a merge), not last-write-wins, derive it from the stored set instead.

---

## Testing

```ruby
# Outbound: a subscribed action fans out, an unsubscribed one doesn't
test "closing a card enqueues a delivery to a subscribed webhook" do
  assert_difference -> { Webhook::Delivery.count }, 1 do
    cards(:logo).close(user: users(:alice))
  end
end

# Inbound: bad signature rejected, valid event stored + acked, redelivery dedupes
test "redelivery dedupes to the same inbox row" do
  assert_no_difference -> { Billing::Stripe::WebhookEvent.count } do
    post webhooks_inbound_stripe_path, params: existing_event_params, headers: signed_headers
  end
  assert_response :ok
end
```

Assert the handler is idempotent (applying the same event twice == once) and order-insensitive (an older event after a newer one is a no-op).

---

## Checklist

**Outbound**
- Delivery is persisted before sending; each delivery is a state record (`pending` → `completed`/`errored`), signed, bounded, and audited
- Subscriptions are an allowlist (`PERMITTED_ACTIONS`); dispatch happens off the request path
- Destination failures mark `completed` (no job retry); bugs mark `errored!` and re-raise
- A circuit breaker deactivates a webhook after sustained failure; reactivation is manual

**Inbound**
- One inbox table per integration; verify the signature, store, ack fast, process async
- Ingest dedupes by a unique natural key; the relay recovers stranded events (at-least-once)
- Handlers are idempotent and order-insensitive: re-fetch current state from the source API when one exists, else use a watermark plus a tombstone for deletes

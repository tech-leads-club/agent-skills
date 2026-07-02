# Logging

**Logging is analytics for your code.** A log line is a named, queryable record
of a decision the system made or an outcome it produced, emitted so that someone
(an on-call engineer, or the business) can answer a real question from it later
without reading the code.

So every line is a business decision or outcome at a boundary: self-sufficient
enough to act on alone, structured enough to query. If a line only narrates what
the code is doing, it is noise: delete it. The concrete test: could someone act
on this at 2am, or answer "how many / how often / which" from it next quarter,
without opening a console or the source?

## Principles

### Log the decision, not the code path

Step-by-step narration ("Validating params...", "Calling member.deactivate!")
bloats the logs and tells an operator nothing. Log the outcome instead.

```ruby
# Bad: narrating code execution
Rails.logger.info "Entering process_refund method"
Rails.logger.info "Validating params..."
Rails.logger.info "Calling member.deactivate!"

# Good: one line, the outcome
Rails.logger.info "Refund approved: order=#{order.id} amount=#{order.amount} reason=customer_request"
Rails.event.notify("member.plan_upgraded", member_id: member.id, from: "monthly", to: "annual")
```

### Make each line self-sufficient

Pass the 2am test: include the identifiers, amounts, and the reason that led to
the outcome, so the line is actionable without stitching together others.

```ruby
# Bad: vague, useless at 2am, forces you to go hunting
Rails.logger.error "Record not found"

# Good: actionable on its own
Rails.logger.error "Member not found for kiwify email=#{payload['email']} order=#{payload['order_id']}"
```

### Name events as facts, and attach a metric

Event names are dot-namespaced `domain.fact`, where the fact is what happened,
written past-tense (an outcome, not a command): `mailer.delivered`,
`rate_limit.throttled`, `member.plan_upgraded`. Prefer a measurable number on
the event (a count, a duration, an amount) so it is graphable, not just
countable. Name and shape events for the dashboard or alert you will want from
them, not just the line you are writing now.

## The three shapes

The named, typed `Rails.event.notify` is the target for anything with business
or operational value; the other two are for ambient context and one-off
messages. Pick the shape before writing any line.

### 1. Structured events: `Rails.event.notify`

Use for anything an operator should be able to query, aggregate, or alert on:
lifecycle events, decisions, outcomes of external calls, throttling events,
webhook results.

```ruby
Rails.event.notify("mailer.delivered",
  mailer:           job.arguments[0],
  action:           job.arguments[1],
  priority:         job.class.priority?,
  queue_latency_ms: latency_ms,
  attempt:          job.executions
)
```

This is `ActiveSupport::EventReporter` (Rails 8.1+). A subscriber turns the
event into a structured record with `event_name`, `payload`, `context`, `tags`,
and `source_location` as first-class JSON fields. The shape matches Rails-native
events like `action_controller.request_started` and `active_job.completed`, so
filters and dashboards work uniformly across sources.

**Payload keys are typed and queryable.** Use snake_case. Pass primitives
(`String`, `Integer`, `Float`, `Boolean`, `Symbol`, `nil`) and small hashes.
Do not pass ActiveRecord instances; pass their ids.

Examples in use: `mailer.delivered`, `mailer.failed`, `mailer.smtp_busy_retry`,
`rate_limit.acquired`, `rate_limit.throttled`, `rate_limit.block_started`.

### 2. Cross-cutting context: `Logtail.with_context`

Use for "who is doing this" and "in which trace" attributes that should apply
to every log line emitted inside a scope, including Rails-native events and
SQL queries. Lands under `context.*` as first-class fields, so
`context.user.id:42 status:>=500` works as a structured filter.

Wire the request path with an `around_action` in `ApplicationController`:

```ruby
around_action :with_user_context

def with_user_context
  user = Current.user
  if user
    Logtail.with_context(Logtail::Contexts::User.new(id: user.id)) { yield }
  else
    yield
  end
end
```

Wire the job path with a concern (e.g. `TraceLogContext`) that sets
`context.trace_id` and is mixed into `ApplicationJob`, so every job inheriting
from it gets tracing for free. Jobs that bypass `ApplicationJob` (such as mailer
delivery jobs inheriting from `ActionMailer::MailDeliveryJob`) include the
concern explicitly.

**Available context shapes:**

- `Logtail::Contexts::User.new(id:, name:, email:)` lands as `context.user.{id,name,email}`
- `Logtail.with_context(trace_id: "...")` lands as `context.trace_id`
- Any single-root-key hash lands at `context.<key>`

**Do not use `Rails.logger.tagged` for actor or tenant context.** It produces
a string inside the `tags` array, which is only substring-greppable. Use
`Logtail.with_context` so the field is typed.

### 3. Plain messages: `Rails.logger.info` / `warn` / `error`

Use for one-off operational messages that nobody needs to query as structured
data: "we ignored this unknown webhook event type", "no secret configured for
product X". When you find yourself emitting the same string repeatedly across
the codebase, that is the signal to promote it to a `Rails.event.notify` call.

```ruby
Rails.logger.info "Received event=#{event_type} product_id=#{product_id}"
Rails.logger.warn "Unknown kiwify event type: #{event_type}, ignoring"
```

Keep plain messages scannable with key=value pairs:

```ruby
# Bad: hard to scan
Rails.logger.info "Processed a payment of 297.00 BRL for member 42 on plan annual via pix"

# Good: scannable
Rails.logger.info "Payment processed: member_id=42 amount=297.00 currency=BRL plan=annual method=pix"
```

Wrap expensive debug payloads in a block so they are not built when the level
is off:

```ruby
Rails.logger.debug { "Full payload: #{payload.inspect}" }
```

## Exceptions: use `Rails.error.report`

Don't log exceptions manually. The error reporter handles class, message,
backtrace, and forwards to Sentry. Full conventions are in
`references/error-handling.md`.

```ruby
# Bad
Rails.logger.error "API failed: #{e.class}: #{e.message}"

# Good: handled (app recovers)
Rails.error.report(e, handled: true, context: { member_id: member.id })

# Good: unhandled (re-raising)
Rails.error.report(e, handled: false, context: { subscription_id: id })
raise
```

## Use the right level

| Level | Meaning |
|-------|---------|
| `debug` | Detailed info useful only in development |
| `info` | Normal operations worth noting (processed, created, sent) |
| `warn` | Succeeded but something is off, deserves attention |
| `error` | Something broke |

```ruby
Rails.logger.warn "Unknown kiwify event type: #{event_type}, ignoring"
Rails.logger.warn "Member #{member.id} has no active plan but received renewal webhook"
```

`Rails.event.notify` defaults to info level via its subscriber. When an outcome
deserves a different severity, split it into a separate event name
(`payment.failed` vs `payment.completed`) and filter on that. Don't drop back to
`Rails.logger.warn` with key=value just to set a level: you'd lose the queryable
JSON payload, which is the whole reason to use a structured event.

## Where to log

Log at **system boundaries** and at the **point of decision**: webhooks, API
calls, payment processing, throttling, external sync. In this codebase that
point is usually a rich model (`RateLimit::Throttle`,
`Billing::Kiwify::WebhookEvent`, `Attendance::Zoom::Sync`). Domain logic lives
in models, so the event that records its outcome fires there too. Don't push a
log up to a controller just to keep the model "clean": log where the decision is
made.

What stays quiet is dumb persistence. An `ApplicationRecord` that only holds
data has nothing to say: log the decision, not every `save`.

## What not to do

- **No `[ClassName]` prefix in the message.** The logger already records where
  the line came from (`source_location` on structured events); a hand-written
  `[Kiwify::Webhook] ...` prefix is redundant noise. Log the fact, not the
  origin.
- **No `Rails.logger.info(event: "...", key: value)`.** That was the old
  pattern. It lands with `message: "nil"` and the keys flattened at the JSON
  root, which is inconsistent with Rails-native events. Use `Rails.event.notify`
  instead.
- **No `Rails.logger.tagged("user_id=#{id}")`** for actor context. Use
  `Logtail.with_context(Logtail::Contexts::User.new(id: id))` so the field is
  typed.
- **No custom logger wrappers** or service objects around logging. Call
  `Rails.event.notify`, `Logtail.with_context`, and `Rails.logger.*`
  directly.
- **No `Lograge`.** Rails 8.1 subscribers already structure Rails-native
  request logs.

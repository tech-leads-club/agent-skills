# Error handling

A failure must stay visible and actionable: recorded as state, reported to the error reporter, or both. Never swallowed in silence. The caller — a job that will retry, a controller that will render, a human reading the admin — has to be able to see and act on it.

Where the error *classes* live (inline, base per context, naming) is in `references/model.md` (Domain errors). This file is about how you *handle* them.

---

## Record, raise, or return

All three keep a failure visible; they differ by how long it lives and who acts on it.

| The failure is… | Handle it by |
|---|---|
| Durable state the system acts on later (an access grant, a webhook delivery, a sync run) | **Record on the record**: `mark_failed(error:)`, then `failed?`. Queryable, shown in the admin, re-acted on by a job. |
| Exceptional, handed to a boundary to retry, render, or report | **Raise a narrow domain error**; the boundary rescues it. |
| An expected, request-scoped outcome the immediate caller branches on, with no record to write it to | **Return a tagged tuple** `[:ok, value]` / `[:error, reason]`. |

Don't reach for an exception where a conditional would do. `raise` is for a genuine failure handed to a boundary, not for branching: an `if` is clearer and a raise is not free.

```ruby
# Don't: exception as flow control
raise ItemUnavailable unless item.available?
charge(item)

# Do: a branch is a branch
return unless item.available?
charge(item)
```

### Return a value for expected branching

When a method has several expected outcomes the caller must branch on, and there is no record to hang the outcome on, return a tagged tuple instead of raising. The model method owns the outcome; the caller pattern-matches once and then speaks ordinary objects again.

```ruby
def charge
  result = gateway.charge(amount)
  return [:error, :card_declined] unless result.ok?
  [:ok, result.receipt]
end

case order.charge
in [:ok, receipt]           then redirect_to receipt
in [:error, :card_declined] then render :payment_failed
in [:error, reason]         then render :error, reason: reason
end
```

`reason` is a **symbol** when matching is all the caller needs (`:card_declined`, `:not_found`): a symbol matches structurally in `in`; a string only compares text. When the failure must carry more data (amounts, a limit, the offending record), return a **struct or an error-class instance** as the reason: still matchable by type, now with payload.

```ruby
Insufficient = Data.define(:available, :required)

return [:error, Insufficient.new(available: balance, required: amount)] if balance < amount

case order.charge
in [:error, Insufficient[available:, required:]] then render :top_up, short: required - available
in [:error, reason]                              then render :error, reason: reason
end
```

Keep it contained: tuples live between a model method and its immediate caller, not threaded through the domain. Ruby has no `with`, so don't chain them into a pyramid: one shallow `case/in` per outcome. Reach for Rails-native first: a validation failure is already `model.errors`, a durable one is already state on the record. The tuple is only for the request-scoped, no-record case.

## Report through `Rails.error`, with context

Every caught error goes through `Rails.error`, never a bare `Rails.logger` string. It reaches the observability platform (e.g. Sentry) in production and the log subscriber in dev/test, with the entry point and metadata inferred for free.

```ruby
# certificate_generation_job.rb — recovered, so handled: true
rescue Certificate::GenerationError => e
  Rails.error.report(e, handled: true, context: { grant_id: grant.id })
```

- `handled: false` when the error still propagates (you reported it on the way out).
- `handled: true` when you recovered and continued.
- Put ids and structured detail in `context:` — never PII.

You don't have to rescue just to report: the global subscriber already reports anything that escapes an entry point. Rescue when you need to *do* something (record, translate, render); let the rest raise and be reported for you.

## Wrap at the model boundary, don't leak

A model's public method owns its failures. Catch a low-level error (Faraday, `ActiveRecord::RecordInvalid`, a gem error) and re-raise the context's domain error, so callers read one vocabulary and the origin is clear at the call site. Re-raising inside a `rescue` sets `error.cause` automatically, so the original is never lost.

```ruby
# app/models/agenda/zoom/meeting.rb
def fetch
  client.get(...)
rescue Http::ResponseError => e
  raise Agenda::Zoom::Error.wrap(e)   # carries status/body in #details
end
```

The wrap pays off downstream: the controller reports `e.details` as structured context (see below). Wrap at a real boundary with many client error types (an integration client, a method with several failure modes) — not ceremonially around a one-off `rescue`.

## The boundary owns the fate

- **Model:** records the failure or raises a narrow domain error; wraps low-level errors so they don't leak.
- **Job:** decides retry vs give up by the **exception class** — `retry_on` (transient, with backoff) and `discard_on` (permanent). Record-then-raise so the runner can act. `Catalog::Sync::Error#retryable?` is the in-house variant for a wrapper aggregating heterogeneous upstream errors.
- **Controller:** leans on Rails defaults (`ActiveRecord::RecordNotFound` → 404). Rescue the **specific** domain error that needs a specific response; report it with context. Don't `rescue_from` a generic base — it's as blunt as `rescue Exception`.

```ruby
# app/controllers/agenda/registrations_controller.rb
rescue Agenda::Zoom::Error => e
  Rails.error.report(e, handled: true, context: { event_id: params[:event_id], user_id: Current.user.id, zoom: e.details })
  redirect_to event_path(params[:event_id]), alert: t(".zoom_error")
```

## Two channels, don't conflate

A failure has two distinct audiences, and they use different reporters:

- **`Rails.error.*`** — the exception itself → the observability platform. For engineers debugging *why* it broke. Always report a caught exception here.
- **`Rails.event.notify("domain.fact", ...)`** — the *outcome* as a business event → telemetry. For operators querying or alerting on *how often* and *which* outcomes happen.

These are not redundant: a recovered failure is usually both — you `Rails.error.report` the exception **and** notify the outcome.

When to notify (and when not to) is `references/logging.md`'s call, not this file's. The short version: notify an outcome an operator would want to query, aggregate, or alert on (`payment.failed`, `billing.stripe.webhook_rejected`) — not every rescue. Don't notify a failure that carries no operational signal; just report the exception.

```ruby
rescue Billing::Stripe::Error => e
  Rails.error.report(e, handled: true, context: { event_id: event.id })   # for engineers
  Rails.event.notify("billing.stripe.webhook_rejected", event_id: event.id, reason: reason)  # for operators
```

## Don't

- `rescue Exception` or `rescue` bare — catches `SyntaxError`, signals, things you can't handle. Rescue `StandardError` or a specific class.
- Swallow silently: `rescue nil` only for trivial parsing; never `log-and-return-false`. Record, report (`handled: true`), or re-raise.
- Rescue what you can't recover from. If the block can't do anything about it, let it crash and be reported.
- Color the whole app with result objects. If you use one, contain it in the model's public method facing the caller; callers speak ordinary objects and errors.

---

## Checklist

- Durable failures are recorded on the record (`mark_failed`/`failed?`); exceptional ones raise a narrow domain error
- Expected request-scoped outcomes return a tagged tuple `[:ok, _]`/`[:error, _]` to branch on, not a raise; `reason` is a symbol, struct, or error class, never a string
- No exception used for flow control where a conditional fits
- Every caught error reported via `Rails.error.report` with `context:` and the right `handled:` flag, not `Rails.logger`
- Low-level/gem errors wrapped into the context's domain error at the model boundary; never leaked
- Jobs decide retry vs discard by exception class (`retry_on`/`discard_on`); record-then-raise
- Controllers rescue specific domain errors, not a generic base; Rails defaults handle the rest
- `Rails.error` for exceptions, `Rails.event.notify` for domain outcomes — kept separate
- No `rescue Exception`, no silent swallow

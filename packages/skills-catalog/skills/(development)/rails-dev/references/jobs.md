# Background jobs

Jobs orchestrate; models do the work. A job is a thin wrapper that calls a model method. Solid Queue is the backend (database-backed, no Redis). Read before writing a job.

---

## The one rule

The job's `perform` does one thing: call a `_now` method on a model. The business logic lives in that method, so it stays testable and runnable synchronously. Pair every async path with a sync one:

- `thing_now` — does the work, synchronously.
- `thing_later` — enqueues the job. The default unsuffixed method, when present, calls `_now`.

```ruby
# app/jobs/notify_recipients_job.rb
class NotifyRecipientsJob < ApplicationJob
  queue_as :default

  def perform(notifiable) = notifiable.notify_recipients_now
end
```

```ruby
module Notifiable
  extend ActiveSupport::Concern

  included do
    after_create_commit :notify_recipients_later
  end

  def notify_recipients_later = NotifyRecipientsJob.perform_later(self)

  def notify_recipients_now
    recipients.each do |recipient|
      next if recipient == creator
      Notification.create!(recipient:, notifiable: self)
    end
  end
end
```

Enqueuing a job and committing your data are two writes, and how you order them is a consistency trade-off, not a fixed rule:

- **Enqueue inside the transaction** ties the job to the data. If the queue shares the data's database, the two commit atomically and you get a transactional outbox for free. If it does not, the job can be picked up by a worker before the row is visible (`RecordNotFound`), or survive a write that rolls back.
- **Enqueue from `after_create_commit`** commits the data first, then enqueues. This sidesteps the rollback and visibility problems, but it is a dual-write: a crash between commit and enqueue loses the job, the exact consistency gap the outbox pattern exists to close.

Neither is universally correct. When this decision comes up, **read `config/database.yml`, determine whether the queue lives in the same database as the data, explain the trade-off and its failure mode to the user, and recommend** the fit: in-transaction enqueue (outbox) when the queue is co-located, or `after_create_commit` plus idempotent, reconcilable work when it is not.

---

## Queues and priority

Give each job a queue by its urgency. User-facing work on `default`; cleanup on a low queue; external calls on their own.

```ruby
class NotifyRecipientsJob < ApplicationJob; queue_as :default; end
class SessionCleanupJob  < ApplicationJob; queue_as :low_priority; end
class DispatchWebhookJob < ApplicationJob; queue_as :webhooks; end
```

---

## Retries

Use `retry_on` with polynomial backoff (`:exponentially_longer` is removed); `discard_on` for errors that will never succeed.

```ruby
class DispatchWebhookJob < ApplicationJob
  queue_as :webhooks

  retry_on Webhook::NetworkError, wait: :polynomially_longer, attempts: 5
  discard_on Webhook::InvalidUrl

  def perform(webhook, event) = webhook.dispatch_now(event)
end
```

When the wait must come from the error (e.g. a `Retry-After` header), you cannot use `retry_on`'s `wait:` proc: in Rails 8.1 it receives only `executions`, not the exception. Use `rescue_from` + `retry_job` instead:

```ruby
rescue_from(Provider::RateLimited) { |error| retry_job wait: error.retry_after }
```

---

## Long-running jobs: continuations

A deploy restarts workers, and Kamal gives a job only a short grace period (~30s) before it is killed. A long job that starts over from the beginning after every restart may never finish. `ActiveJob::Continuable` (Rails 8.1) breaks the work into ordered **steps**; on restart the job resumes from the last completed step instead of the top.

```ruby
class ProcessImportJob < ApplicationJob
  include ActiveJob::Continuable

  def perform(import_id)
    @import = Import.find(import_id)

    step :initialize do
      @import.initialize
    end

    step :process do |step|
      @import.records.find_each(start: step.cursor) do |record|
        record.process
        step.advance! from: record.id    # checkpoint, persisted on interruption
      end
    end

    step :finalize    # method form: calls the private #finalize
  end

  private

  def finalize = @import.finalize
end
```

Mechanics:

- Steps run in definition order; completed ones are skipped on resume. There is an automatic checkpoint before each step (except the first).
- At a checkpoint the adapter is asked `stopping?`; if a shutdown is pending it raises `ActiveJob::Continuation::Interrupt`, serializes progress under the `continuation` key, and re-enqueues. So **checkpoint more often than the shutdown grace period** or the job gets killed mid-step and redoes it.
- The cursor is any serializable value (default `nil`). `step.advance!` calls `succ` on it; `step.advance! from: x` sets it first; `step.set!(x)` sets it explicitly; `step.checkpoint!` yields a stop point without moving the cursor. Seed it with `step :name, start: value`.
- A job is auto-retried only after it has made progress (a step completed or the cursor advanced), bounded by `max_resumptions` (default unlimited, `resume_options` default `wait: 5.seconds`). For a step too long to checkpoint within the window, mark it `step :name, isolated: true` to run it in its own execution.

Caveats:

- Code outside any `step` re-runs on every resumption: keep it cheap and idempotent (it is fine for lookups like `Import.find`, not for side effects).
- Each step can re-run partially after a crash. The cursor shrinks the redo window, it does not remove it: keep step work idempotent.
- Step names are the resume key. Renaming or reordering steps in a deploy while a job is mid-flight desyncs it: append new steps at the end, do not rename in-flight ones.

Full API: <https://api.rubyonrails.org/classes/ActiveJob/Continuation.html>.

---

## Context in jobs

`Current` is request-scoped (it wraps the session) and is empty inside a job. Don't try to rebuild it. Pass the ids the job needs, load them explicitly, and hand them to the model method instead of relying on a `Current.user` default.

```ruby
class TrackEventJob < ApplicationJob
  def perform(eventable, action, user_id:)
    user = User.find(user_id)
    eventable.track_event_now(action, user:)
  end
end
```

Prefer passing ids over whole objects when the object might change between enqueue and run. ActiveRecord arguments are serialized by GlobalID; bundle optional args into a keyword/hash rather than a long positional list.

---

## Recurring jobs

Schedule in `config/recurring.yml`. Reference the **job class** (`class:`), not a `command:` that just enqueues. Reserve `command:` for a one-liner that does the work directly (e.g. a `delete_all`).

```yaml
production:
  stripe_access_audit:
    class: NotifyStripeAccessAuditJob
    schedule: every 14 days at 9:00am
  heartbeat:
    class: HeartbeatJob
    schedule: every 5 minutes
```

The server runs in UTC; convert Brasília schedules accordingly (UTC is 3h ahead).

---

## Batching large work

Don't enqueue one job per record across a huge set, and don't process the whole set in a single job that can't finish in the grace window. Slice the ids and enqueue a job per batch; each job processes its slice with `find_each`.

```ruby
Member.active.in_batches(of: 500) do |batch|
  ProcessMembersJob.perform_later(batch.pluck(:id))
end

class ProcessMembersJob < ApplicationJob
  def perform(member_ids)
    Member.where(id: member_ids).find_each(&:process_now)
  end
end
```

For a single long job over an open-ended set, prefer continuations (above) so a restart resumes mid-stream.

---

## Testing

Test the `_now` method for behavior; assert the wiring (callback enqueues, job enqueues) separately. Production uses Solid Queue; the dev adapter is `:async`, and tests use the ActiveJob test adapter.

```ruby
class CommentTest < ActiveSupport::TestCase
  test "notify_recipients_now creates a notification per recipient" do
    assert_difference -> { Notification.count }, 2 do
      comments(:logo_comment).notify_recipients_now
    end
  end

  test "creating a comment enqueues the notification job" do
    assert_enqueued_with job: NotifyRecipientsJob do
      cards(:logo).comments.create!(body: "Nice", creator: users(:alice))
    end
  end
end
```

---

## Checklist

- `perform` is one line: call a model `_now` method; no business logic in the job
- Every async path has a `_now` sibling that runs synchronously
- Treat enqueue-vs-commit ordering as a consistency trade-off: check where the queue lives, surface it to the user, recommend (outbox if co-located, `after_create_commit` + idempotency if not)
- `queue_as` reflects urgency; retries use `wait: :polynomially_longer`
- `discard_on` for permanent failures; `rescue_from`+`retry_job` when wait depends on the error
- Jobs receive the ids they need and load them explicitly; they don't rely on `Current`
- `config/recurring.yml` references `class:` for enqueueing work
- Long-running jobs use `ActiveJob::Continuable` with idempotent steps that checkpoint more often than the deploy grace period
- Behavior tested via `_now`; enqueueing tested with `assert_enqueued_with`

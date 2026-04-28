# Events

Events are domain records, not a generic tracking blob. One `Event` model captures what happened (polymorphic subject, an `action`, a `particulars` payload); the activity feed is just those events read back by time. An event can fan out to outbound webhooks, but that machinery lives in `references/webhooks.md`. This is in-app event history, distinct from product analytics (a separate tracking concern) and structured logs (see `logging.md`). Read before adding events.

---

## Events as records

A model gains events through the `Eventable` concern. `track_event` writes one immutable `Event`: the action is prefixed with the model name and past-tense, and keyword args become the `particulars` payload. Events are append-only facts, you never update or delete one.

```ruby
module Eventable
  extend ActiveSupport::Concern

  included do
    has_many :events, as: :eventable, dependent: :destroy
  end

  def track_event(action, creator: Current.user, **particulars)
    return unless should_track_event?
    events.create!(action: "#{eventable_prefix}_#{action}", creator:, particulars:)
  end

  def event_was_created(event); end   # override to react

  private

  def should_track_event? = true
  def eventable_prefix = self.class.name.demodulize.underscore
end
```

```ruby
class Event < ApplicationRecord
  belongs_to :creator, class_name: "User", default: -> { Current.user }
  belongs_to :eventable, polymorphic: true

  scope :chronologically, -> { order(created_at: :asc, id: :desc) }

  after_create        { eventable.event_was_created(self) }
  after_create_commit :dispatch_webhooks

  private

  def dispatch_webhooks = Event::WebhookDispatchJob.perform_later(self)
end
```

Call it where the action happens, alongside the state change (events pair with state records, see `state-records.md`):

```ruby
def close(user: Current.user)
  create_closure!(user:)                       # the state
  track_event "closed", reason: "completed"    # action -> "card_closed", particulars: { reason: }
end
```

The `event_was_created` hook is for in-app reactions to an event (post a system comment, touch a "last active" timestamp). Keep the reaction here, not scattered across callers. `dispatch_webhooks` hands the event to the outbound delivery pipeline — see `references/webhooks.md`.

---

## Activity feed

The feed is the `Event` log read back, not a second `Activity` model. Order chronologically and preload the subjects to avoid N+1; render each through a per-user description object so wording and visibility can depend on who's looking.

```ruby
@events = card.events.chronologically.includes(:creator, :eventable)
```

```ruby
# app/models/event/description.rb  (a PORO, see model.md)
class Event::Description
  def initialize(event, user) = (@event, @user = event, user)

  def to_s
    case @event.action
    when "card_closed"   then "#{@event.creator.name} closed this card"
    when "card_assigned" then "#{@event.creator.name} assigned #{@event.particulars["assignee"]}"
    end
  end
end
```

`action` reads naturally as a query with `inquiry` (`event.action.card_closed?`) when you branch on it.

---

## Testing

Assert the event is recorded with the right action and particulars, and that the reaction fires (see `test.md`).

```ruby
test "closing a card records a card_closed event" do
  assert_difference -> { Event.count }, 1 do
    cards(:logo).close(user: users(:alice))
  end
  event = Event.chronologically.last
  assert_equal "card_closed", event.action
  assert_equal "completed", event.particulars["reason"]
end
```

---

## Checklist

- Events are immutable records via the `Eventable` concern; `track_event "verb", **particulars` alongside the state change
- `action` is `model_pasttense` (`card_closed`); the payload lives in `particulars`, never in the action string
- In-app reactions go in `event_was_created`, not in every caller
- The activity feed is the `Event` log (`chronologically`, preloaded), rendered per-user; no separate `Activity` model
- Outbound and inbound webhooks are a separate concern (`references/webhooks.md`)
- Events are app history; product analytics and structured logs are separate concerns

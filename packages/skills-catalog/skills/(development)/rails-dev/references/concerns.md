# Concerns

Concerns are the primary tool for sharing behavior horizontally. Concerns for capabilities shared across models; inheritance for vertical specialization. Read before extracting or changing one.

---

## The one rule

A concern bundles **everything** for one capability in one place: associations, scopes, callbacks, and methods. It is cohesive (one aspect) and composable (a model includes many). If a concern needs more than one sentence to describe, it is two concerns.

Naming taxonomy:

- **Classes are nouns** — `Card`, `Closure`.
- **Concerns are adjectives** — the capability they grant: `Closeable`, `Watchable`, `Assignable`, `Searchable`. Controller concerns describe the scoping or context they set up: `CardScoped`, `CurrentRequest`.
- **Methods are verbs** — `close`, `assign`.

Namespace a model concern under the model it belongs to (`app/models/card/closeable.rb` → `Card::Closeable`); put cross-model concerns in `app/models/concerns/` and controller concerns in `app/controllers/concerns/`.

---

## Model concern

Put the associations and scopes in `included do`; put the behavior in instance methods; put class-level queries in `class_methods do`.

```ruby
# app/models/card/closeable.rb
module Card::Closeable
  extend ActiveSupport::Concern

  included do
    has_one :closure, dependent: :destroy

    scope :open,   -> { where.missing(:closure) }
    scope :closed, -> { joins(:closure) }
  end

  def close(user: Current.user)
    create_closure!(user:)
    track_event "card_closed", user:
  end

  def reopen
    closure&.destroy!
    track_event "card_reopened"
  end

  def closed? = closure.present?
  def open?   = !closed?
  def closed_at = closure&.created_at
  def closed_by = closure&.user
end
```

```ruby
module Card::Searchable
  extend ActiveSupport::Concern

  included do
    scope :search, ->(query) { where("title ILIKE ?", "%#{query}%") }
  end

  class_methods do
    def top_results(query, limit: 10) = search(query).limit(limit)
  end
end
```

An association concern bundles a relationship with the verbs that manage it, a different shape from the `has_one` state concern above:

```ruby
module Card::Assignable
  extend ActiveSupport::Concern

  included do
    has_many :assignments, dependent: :destroy
    has_many :assignees, through: :assignments, source: :user

    scope :assigned_to, ->(user) { joins(:assignments).where(assignments: { user: }) }
    scope :unassigned,  -> { where.missing(:assignments) }
  end

  def assign(user)       = assignments.create!(user:) unless assigned_to?(user)
  def unassign(user)     = assignments.where(user:).destroy_all
  def assigned_to?(user) = assignees.include?(user)
end
```

A model becomes a thin composition of concerns:

```ruby
class Card < ApplicationRecord
  include Assignable, Attachments, Broadcastable, Closeable, Commentable,
          Eventable, Positionable, Readable, Searchable, Watchable

  belongs_to :board
  belongs_to :column

  validates :title, presence: true
end
```

---

## Controller concern

The common case is scoping: load the parent resource in one place. Also use concerns for shared request context.

```ruby
# app/controllers/concerns/card_scoped.rb
module CardScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_card
    before_action :set_board
  end

  private

  def set_card
    @card = Card.find(params[:card_id])
  end

  def set_board
    @board = @card.board
  end
end
```

```ruby
# app/controllers/concerns/current_request.rb
module CurrentRequest
  extend ActiveSupport::Concern

  included do
    before_action :set_current_session
  end

  private

  def set_current_session
    Current.session = Session.find_by(id: cookies.signed[:session_id])
  end
end
```

A controller concern can also wrap a whole cross-cutting behavior, combining `around_action`, an `etag` contribution, and a `helper_method` in the `included do` block:

```ruby
# app/controllers/concerns/current_timezone.rb
module CurrentTimezone
  extend ActiveSupport::Concern

  included do
    around_action :use_timezone
    etag { Current.user&.timezone }
    helper_method :browser_timezone
  end

  private

  def use_timezone(&block) = Time.use_zone(browser_timezone, &block)
  def browser_timezone = cookies[:timezone].presence || "UTC"
end
```

---

## When to extract

Extract the moment the same capability appears in a second model or controller. Triggers:

- Repeated associations (`has_many :comments, as: :commentable` in two models) → `Commentable`.
- Repeated state pattern (`has_one :closure` + close/reopen/closed?) → `Closeable`.
- Repeated scopes (`recent`, `by_creator`) → `Timestamped`, `Ownable`.
- Repeated `before_action :set_parent` → a `*Scoped` concern.

Do **not** extract for one-off code used by a single model. Premature concerns are as bad as duplication.

---

## Testing

Test the concern's behavior through a model that includes it, and the cross-cutting behavior in isolation against a dummy class when no real model fits.

```ruby
# test/models/concerns/closeable_test.rb
class CloseableTest < ActiveSupport::TestCase
  class Dummy < ApplicationRecord
    self.table_name = "cards"
    include Card::Closeable
  end

  setup { @record = Dummy.create!(title: "Test") }

  test "close creates a closure" do
    assert_difference -> { Closure.count }, 1 do
      @record.close
    end
    assert @record.closed?
  end

  test "closed scope finds closed records" do
    @record.close
    assert_includes Dummy.closed, @record
    assert_not_includes Dummy.open, @record
  end
end
```

---

## Checklist

- One capability per concern; bundle its associations, scopes, callbacks, and methods together
- Concerns are adjectives; namespace model concerns under their model
- `included do` for associations/scopes/callbacks; `class_methods do` for class queries
- Extract on the second occurrence, never for single-use code
- No god concerns, and never a service object hidden inside a concern
- The behavior is tested, in isolation or through an including model

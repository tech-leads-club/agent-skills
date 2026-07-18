# Models

A model is a domain concept that holds business logic. That is the whole definition. It does **not** have to be an ActiveRecord class, and it does not have to map to a database table. Read before writing or changing any model.

---

## A model is a concept, not a table

`app/models/` is where domain logic lives. Some of those concepts are persisted (ActiveRecord); many are not. Both are models.

- **ActiveRecord model** when the concept is stored: `Member`, `Card`, `Closure`.
- **PORO model** when the concept is behavior, a calculation, a query, or a multi-record flow that no single record owns. Still goes in `app/models/`, still noun-named, still namespaced under the concept it serves.

Real POROs in this codebase, all under `app/models/`:

```ruby
class Member::Signup        # multi-record creation flow (form object)
class Catalog::Search       # a query/operation over embeddings
class StripeAccessAudit     # an analysis that produces a report
class Member::Import
class Catalog::Chunking
```

A PORO model looks like any Ruby object. It owns its logic and reads like the domain:

```ruby
# app/models/catalog/search.rb
class Catalog::Search
  Result = Struct.new(:content_item, :score, :url, :title, keyword_init: true)

  def self.query(text, limit: 10) = new.query(text, limit:)

  def query(text, limit: 10)
    vector = Catalog::Embedding::Generation.for_text(text)
    Catalog::Embedding.nearest_neighbors(:embedding, vector, distance: "cosine")
                      .limit(limit)
                      .map { |e| build_result(e) }
  end

  # ...
end
```

The decision is not "model or service?" It is "which model owns this?" If no existing model owns it, the answer is a **new noun-named model** (a PORO), never a service object.

---

## Name the noun, not the verb

**Classes are nouns. Methods are verbs.** Name a class after the concept it represents, never after the action it performs. A verb-named class (`*Service`, `*Creator`, `*Calculator`, `*Manager`, `*Processor`) is a service object wearing a disguise.

```ruby
# Don't: verb-named class = service object
class CloseCardService;  def call; end; end
class ProjectArchiver;   def archive; end; end
class CalculateChurn;    def run; end; end

# Do: name the noun, put the verb on it
class Card;              def close; end; end       # the verb is a method
class Card::Archival < ApplicationRecord; end       # the state is a noun
class Stripe::ChurnForecast; def self.for(member); end; end
```

This is why state records are nouns (`Closure`, not `Closer`; `Archival`, not `Archiver`; `Publication`, not `Activator`) and why extracted flows are nouns (`Member::Signup`, not `SignupService`). The noun is the thing; the verb is what you do to it.

Use a noun, not an `-er`/`-or` agent noun (`Catalog::Chunking`, not `Catalog::Chunker`); the exception is when the `-er` is the domain concept itself. Name a public method as a domain verb that reads with its class, not a generic `.call`: `Catalog::Chunking.split(text)`, `Workspace::Search.new(ws).by(query)`.

---

## Business logic lives on the model

Behavior belongs to the model that owns the data, not to a wrapper around it.

```ruby
# Don't: service object orchestrating a record
class CloseCardService
  def initialize(card, user) = (@card, @user = card, user)

  def call
    @card.create_closure!(user: @user)
    @card.track_event("card_closed", user: @user)
    NotifyRecipientsJob.perform_later(@card)
  end
end
CloseCardService.new(@card, current_user).call

# Do: the model owns the behavior
class Card < ApplicationRecord
  include Closeable

  def close(user: Current.user)
    create_closure!(user:)
    track_event "card_closed", user:
    notify_recipients_later
  end
end
@card.close
```

Use `!` only when a non-bang counterpart exists (AR's `save`/`save!`, `create`/`create!`); never add `!` just to flag a destructive action. Custom action methods are usually plain verbs (`close`, `grant`, `archive`). Prefer a domain verb; reach for a `mark_` prefix (no bang) only to dodge a conflict with a scope, predicate, or core method like `Kernel#fail` (`mark_failed`). See the Coding style section in `SKILL.md`.

---

## State as records, not booleans

A state with a "when" or a "who" is a record, not a column. You get the timestamp and actor for free, and the queries stay declarative. (The record is a noun: `Closure`.)

```ruby
class Card < ApplicationRecord
  has_one :closure, dependent: :destroy

  scope :open,   -> { where.missing(:closure) }
  scope :closed, -> { joins(:closure) }

  def close(user: Current.user) = create_closure!(user:)
  def closed? = closure.present?
  def closed_at = closure&.created_at
  def closed_by = closure&.user
end

class Closure < ApplicationRecord
  belongs_to :card, touch: true
  belongs_to :user, optional: true

  validates :card, uniqueness: true
end
```

When the state is a single transition without an actor, derive it from a timestamp instead of a `status` column that can desync:

```ruby
class Grant < ApplicationRecord
  scope :pending, -> { where(granted_at: nil, failed_at: nil) }
  scope :granted, -> { where.not(granted_at: nil) }
  scope :failed,  -> { where.not(failed_at: nil) }

  def pending? = granted_at.nil? && failed_at.nil?
  def grant = update!(granted_at: Time.current)
  def mark_failed = update!(failed_at: Time.current)   # mark_: fail would shadow Kernel#fail
end
```

A column is fine when the value has no meaningful timestamp (a color, a category).

---

## Structure of an ActiveRecord model

Order: associations, validations, enums, scopes, delegations, callbacks, public methods, private methods.

```ruby
class Card < ApplicationRecord
  include Closeable, Commentable, Eventable, Watchable

  belongs_to :board, touch: true
  belongs_to :creator, class_name: "User", default: -> { Current.user }

  validates :title, presence: true

  enum :status, { draft: "draft", published: "published", archived: "archived" },
       default: :draft, prefix: true

  scope :recent, -> { order(created_at: :desc) }
  scope :active, -> { status_published.where.missing(:not_now) }

  delegate :name, to: :board, prefix: true, allow_nil: true

  after_create_commit :broadcast_creation

  def publish
    update!(status: :published)
    track_event "card_published"
  end

  private

  def broadcast_creation
    broadcast_prepend_to board, :cards, target: "cards", partial: "cards/card"
  end
end
```

---

## Associations

```ruby
belongs_to :creator, class_name: "User", default: -> { Current.user }
belongs_to :board, touch: true                       # invalidates parent cache

has_many :comments, dependent: :destroy
has_many :assignees, through: :assignments, source: :user
has_one  :closure, dependent: :destroy

has_many :attachments, as: :attachable, dependent: :destroy   # polymorphic
belongs_to :notifiable, polymorphic: true

belongs_to :card, counter_cache: :comments_count
```

---

## Scopes

Prefer scopes for reusable queries; use `where.missing` for absence.

```ruby
scope :recent,       -> { order(created_at: :desc) }
scope :by_creator,   ->(user) { where(creator: user) }
scope :open,         -> { where.missing(:closure) }
scope :assigned_to,  ->(user) { joins(:assignments).where(assignments: { user: }) }
scope :stale, -> {
  open.status_published.where.missing(:not_now).where(updated_at: ..30.days.ago)
}
```

Use a class method (not a scope) when a query needs multiple arguments, branching logic, or raw SQL ordering:

```ruby
def self.for_user(user)
  where(creator: user).or(assigned_to(user)).distinct
end

def self.search(query)
  like = "%#{query}%"
  where("title ILIKE :q OR body ILIKE :q", q: like)
    .order(Arel.sql(sanitize_sql_array(["title ILIKE ? DESC", like])))  # title matches first
end
```

---

## Validations

Before writing any custom validation (a `validate :method` or a new validator class), read `references/validator.md`. It decides where the rule belongs and whether one already exists.

```ruby
validates :title, presence: true
validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
validates :user_id, uniqueness: { scope: :card_id }
validates :card, uniqueness: true                 # has_one guard
validates :body, presence: true, if: :status_published?

validate :column_belongs_to_board

private

def column_belongs_to_board
  return if column.nil? || column.board_id == board_id
  errors.add(:column, "must belong to the board")
end
```

---

## Enums and status constants

Prefer string enums for readability in the database:

```ruby
enum :status, { draft: "draft", published: "published" }, default: :draft, prefix: true
# card.status_published?  Card.status_published  card.status_published!
```

When a status is validated with `inclusion:` instead of `enum`, name each value as a constant and use it everywhere. A typo in a constant raises `NameError` at load; a typo in a string falls through silently.

```ruby
ACTIVE = "active"
PAUSED = "paused"
STATUSES = [ACTIVE, PAUSED].freeze

validates :status, inclusion: { in: STATUSES }

scope :active, -> { where(status: ACTIVE) }

def active? = status == ACTIVE
def pause   = update!(status: PAUSED)
def resume  = update!(status: ACTIVE)
```

---

## Callbacks

Use `_commit` callbacks for anything touching external services or broadcasts: a non-`_commit` callback runs inside the transaction and can fire on work that later rolls back. Keep callbacks to broadcasting, tracking, and defaults. Complex logic goes in named methods, not callbacks.

```ruby
before_validation :normalize_email
after_create_commit :broadcast_creation
after_create_commit :notify_recipients_later
after_update_commit :broadcast_update
after_destroy_commit :cleanup_related_records
```

---

## Business logic methods

Methods are verbs. Actions do; predicates ask; computed attributes read derived state.

```ruby
def assign(user)
  assignments.create!(user:) unless assigned_to?(user)
  track_event "card_assigned", particulars: { assignee_id: user.id }
end

def assigned_to?(user) = assignees.include?(user)
def can_be_edited_by?(user) = user.can_administer_card?(self) || creator == user

def total_comments = comments.count
```

### `_later` / `_now` convention

Default method does the work synchronously (`_now`); `_later` enqueues. Call `_later` from callbacks.

```ruby
def notify_recipients_later = NotifyRecipientsJob.perform_later(self)

def notify_recipients
  recipients.each { |r| Notification.create!(recipient: r, notifiable: self) }
end
```

---

## Delegation and Current

```ruby
delegate :name, to: :board, prefix: true                # board_name
delegate :email, to: :creator, prefix: :author          # author_email
delegate :name, to: :board, prefix: true, allow_nil: true
```

`Current` carries request context. Use it for defaults so callers stay clean:

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :session
  delegate :user, to: :session, allow_nil: true
end

belongs_to :creator, class_name: "User", default: -> { Current.user }
```

---

## PORO models

Reach for a PORO when the concept is a flow, a query, an analysis, or presentation logic that no single record owns. Namespace it under the concept (`app/models/member/signup.rb` → `Member::Signup`), name it a noun, give it verb methods.

Form object for a multi-record flow (`ActiveModel::Model` gives you validations and form binding):

```ruby
# app/models/member/signup.rb
class Member::Signup
  include ActiveModel::Model

  attr_accessor :email, :name, :phone, :access_groups
  attr_reader :user, :member

  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true

  def create
    return false unless valid?

    @user = find_or_create_user
    @member = user.create_member!(name:, phone:)
    grant_access_groups
    send_signup_email
    track_signed_up
    member
  end

  private

  def find_or_create_user
    User.find_by(email_address: email) || User.create!(email_address: email, name:)
  end
end
```

Operation/query object (a class method that answers a question):

```ruby
# app/models/catalog/search.rb
class Catalog::Search
  Result = Struct.new(:item, :score, :url, keyword_init: true)

  def self.query(text, limit: 10) = new.query(text, limit:)

  def query(text, limit: 10)
    # ...returns [Result, ...]
  end
end
```

Value object for a small immutable concept:

```ruby
Money = Data.define(:cents, :currency) do
  def to_s = format("%.2f %s", cents / 100.0, currency)
end
```

---

## Domain errors

A domain error is a domain concept: it lives with the model that raises it, never in a separate `app/errors/` tree. How to *handle* errors (record vs raise, reporting, wrapping, retries) is in `references/error-handling.md`.

- **Inline by default** — errors live at the top of the class that raises them.
- **Give the context a base error** inheriting `StandardError`, defined inline.
- **Concrete errors always extend the base**, never `StandardError` directly. The base is the family's single rescue point.
- **Extract the base to a flat `error.rb`** only when it gains shared behavior (a `wrap`, a `retryable?`) or its rescue point is shared across files. Concrete errors stay flat siblings; no `error/` subfolder.

Name the state (`AuthenticationRequired`); add the `Error` suffix only when the bare word is ambiguous (`Integrity` → `IntegrityError`).

```ruby
# Inline: base + concretes, all in the raising model
class Email < ApplicationRecord
  class Error < StandardError; end
  class NotVerified < Error; end
end

# Extracted base: only when it carries behavior or its rescue point spans files
# app/models/agenda/zoom/error.rb
class Agenda::Zoom::Error < StandardError
  def self.wrap(client_error) = new(client_error.message)
end

# app/models/agenda/zoom/authentication_required.rb  (flat sibling, not error/)
class Agenda::Zoom::AuthenticationRequired < Agenda::Zoom::Error; end
```

---

## Testing

Minitest, fixtures (never factories). Assert behavior, not implementation. `Current` is request-scoped and empty in a model test, so pass the actor explicitly (`close(user: @user)`) rather than relying on the `Current.user` default. POROs test the same way: instantiate and assert outcomes.

```ruby
class CardTest < ActiveSupport::TestCase
  setup do
    @card = cards(:logo)
    @user = users(:alice)
  end

  test "closing a card creates a closure" do
    assert_difference -> { Closure.count }, 1 do
      @card.close(user: @user)
    end
    assert @card.closed?
    assert_equal @user, @card.closed_by
  end

  test "open scope excludes closed cards" do
    @card.close
    assert_not_includes Card.open, @card
    assert_includes Card.closed, @card
  end
end
```

---

## Development seeds

A fresh clone should boot into a state where every existing feature can be exercised. So a new model is expected to ship development seed data alongside it. Without it, the feature is invisible until someone manually crafts records, and that effort is repeated on every clone and reset.

Seed enough to make the feature testable in the running app, not just one happy record. For a model with multiple states, seed an example of each state so you can see how the app and the UI behave in all of them (e.g. a pending, a granted, and a failed `Grant`). Reuse the existing personas where the data belongs to a user.

Every seeded record must represent a state the domain can actually reach through its real flows. Seed by going through the same code paths that produce the record in production, not by stamping attributes a transition would never set together. An invalid or impossible combination is worse than no seed: it teaches a wrong mental model of the domain and invites defensive code for states that can never occur, complexity that should not exist.

---

## Checklist

- A model is any class with domain logic, AR or PORO; both live in `app/models/`
- Classes are nouns, methods are verbs; a verb-named class is a service object smell
- Business logic on the model, never a service object
- State with a when/who is a record; a single transition is a timestamp
- Custom methods are verbs without `!`; reserve `!` for AR persistence calls
- Defaults via lambdas (`Current.user`, parent association); tenant scoping (`account_id`) only when the app is multi-tenant
- `_commit` callbacks for external side effects
- Status values named as constants or enums, never raw strings
- Tests cover the behavior with fixtures, asserting outcomes
- A new model ships development seeds; multi-state models seed an example of each state, and every seed is a state the domain can actually reach
- Domain errors live inline with the model under an inline base; concretes extend the base; extract a flat `error.rb` only for shared behavior or a shared rescue point

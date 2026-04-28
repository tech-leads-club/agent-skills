# State as records

A state that carries a *when*, a *who*, or a *why* is a record, not a boolean column. The record is a noun (`Closure`, `Publication`, `Archival`); presence is the state. Read before adding a boolean flag for business state.

---

## The one rule

`closed: boolean` tells you only the current value. A `Closure` record tells you the value (it exists), when (`created_at`), who (`user`), and why (`reason`), and it gives you history for free. Model business state as a record; reserve booleans for purely technical flags.

```ruby
# Don't: boolean on the parent
class Card < ApplicationRecord
  scope :open,   -> { where(closed: false) }
  scope :closed, -> { where(closed: true) }
  def close = update!(closed: true, closed_at: Time.current)
end

# Do: a state record, presence is the state
class Card < ApplicationRecord
  has_one :closure, dependent: :destroy

  scope :open,   -> { where.missing(:closure) }
  scope :closed, -> { joins(:closure) }

  def close(user: Current.user) = create_closure!(user:)
  def reopen = closure&.destroy!
  def closed? = closure.present?
  def closed_at = closure&.created_at
  def closed_by = closure&.user
end
```

---

## Anatomy of a state record

The record belongs to its parent (with `touch:` so the parent's cache invalidates) and has a **unique index on the parent** so a parent has at most one. Wrap the behavior in a concern (see `concerns.md`) when more than one model needs it.

```ruby
class Closure < ApplicationRecord
  belongs_to :card, touch: true
  belongs_to :user, optional: true

  validates :card, uniqueness: true

  after_create_commit  :notify_watchers
  after_destroy_commit :notify_watchers

  private

  def notify_watchers = card.notify_watchers_later
end
```

```ruby
class CreateClosures < ActiveRecord::Migration[8.0]
  def change
    create_table :closures, id: :ulid do |t|
      t.references :card, null: false, index: true
      t.references :user, index: true
      t.timestamps
    end

    add_index :closures, :card_id, unique: true
  end
end
```

### Variations

The record's shape barely moves; the columns and the verbs do. Wrap each as a concern (see `concerns.md`) so any model can gain the capability.

**Pure marker** — presence is the whole story, no extra columns:

```ruby
module Card::Golden
  extend ActiveSupport::Concern

  included do
    has_one :goldness, dependent: :destroy
    scope :golden,     -> { joins(:goldness) }
    scope :not_golden, -> { where.missing(:goldness) }
  end

  def gild    = create_goldness! unless golden?
  def ungild  = goldness&.destroy!
  def golden? = goldness.present?
end
```

**With a shareable key** — `has_secure_token` mints a URL key on create:

```ruby
class Board::Publication < ApplicationRecord
  belongs_to :board, touch: true
  has_secure_token :key
  validates :board, uniqueness: true
end

module Board::Publishable
  extend ActiveSupport::Concern

  included do
    has_one :publication, dependent: :destroy
    scope :published,   -> { joins(:publication) }
    scope :unpublished, -> { where.missing(:publication) }
  end

  def publish(description: nil) = create_publication!(description:)
  def unpublish  = publication&.destroy!
  def published? = publication.present?
  def public_url = publication&.key
end
```

**With actor and reason** — the record captures who and why:

```ruby
class Card::Archival < ApplicationRecord
  belongs_to :card, touch: true
  belongs_to :user, optional: true
  validates :card, uniqueness: true
  validates :reason, length: { maximum: 500 }
end

module Card::Archivable
  extend ActiveSupport::Concern

  included do
    has_one :archival, dependent: :destroy
    scope :archived, -> { joins(:archival) }
    scope :active,   -> { where.missing(:archival) }
  end

  def archive(user: Current.user, reason: nil)
    create_archival!(user:, reason:)
    track_event "card_archived", user:, particulars: { reason: }
  end

  def unarchive = archival&.destroy!
  def archived? = archival.present?
end
```

---

## Querying by state

`joins` for presence, `where.missing` for absence. Compose them for combined states.

```ruby
Card.open                  # where.missing(:closure)
Card.closed                # joins(:closure)

scope :actionable, -> {
  where.missing(:closure).where.missing(:not_now).where.missing(:archival)
}

# Sort by state timestamp
scope :recently_closed, -> { joins(:closure).order("closures.created_at DESC") }
scope :golden_first, -> {
  left_outer_joins(:goldness)
    .select("cards.*", "card_goldnesses.created_at AS golden_at")
    .order(Arel.sql("golden_at IS NULL, golden_at DESC"))
}

# Filter by who changed it
scope :closed_by, ->(user) { joins(:closure).where(closures: { user: }) }
```

The controller for a state record is a singular `resource` with `create`/`destroy` (see `crud.md`): POST sets the state, DELETE clears it.

---

## Record or boolean?

| Use a record | Use a boolean |
|---|---|
| When/who/why matters | Purely technical flag (`processed`, `cached`) |
| It's a business event | Timestamp and actor are irrelevant |
| You query "recently X" or "X by user" | Simple, high-churn toggle on millions of rows |

State records: `closed`, `published`, `archived`, `suspended`, `verified`, `approved`, `pinned`, `postponed`. Booleans: `cached`, `processed`, `visible`.

---

## Migrating a boolean to a record

1. Create the state record table (unique index on parent).
2. Backfill, preserving the original timestamp:

```ruby
class BackfillClosures < ActiveRecord::Migration[8.0]
  def up
    Card.where(closed: true).find_each do |card|
      Closure.create!(card:, created_at: card.closed_at || card.updated_at)
    end
  end

  def down = Closure.delete_all
end
```

3. Switch the model to the record (the concern), deploy, verify.
4. Only then drop the boolean column, in a separate migration.

---

## Testing

Assert the transition's effect: the record is created/destroyed, the predicate flips, the scope membership changes, and the actor/timestamp are captured.

```ruby
class Card::CloseableTest < ActiveSupport::TestCase
  setup { @card, @user = cards(:logo), users(:david) }

  test "close creates a closure and records the actor" do
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

  test "closed_at returns the closure time" do
    freeze_time do
      @card.close
      assert_equal Time.current, @card.closed_at
    end
  end
end
```

---

## Checklist

- Business state is a record (a noun); booleans only for technical flags
- Record `belongs_to :parent, touch: true` with an indexed reference and a unique index on the parent
- Presence is the state: `joins` for present, `where.missing` for absent
- Verb methods without `!` (`close`, `archive`); `create_x!` for persistence
- State transitions track who/when and emit an event where it's a business event
- Boolean→record migration backfills timestamps and drops the column last
- Tests assert record creation, predicate flip, scope membership, and actor

# Caching

Two layers, both key-based: HTTP conditional GET for whole responses, and Russian-doll fragment caching for views. Invalidation is never manual: cache keys embed `updated_at`, and `touch: true` cascades the change up. Solid Cache backs it (database, no Redis). Read before adding caching.

---

## The one rule

You don't delete caches, you change keys. A cache key includes the record's `updated_at`, so any update makes a new key and the old fragment is simply never read again. `touch: true` propagates an update from child to parent, so editing a deeply nested record invalidates every fragment above it. There are no sweepers and no `Rails.cache.delete` in this style: if you reach for manual invalidation, the key is wrong.

---

## HTTP caching: conditional GET

`fresh_when` (or `stale?`) sets the `ETag`/`Last-Modified` from the record and returns `304 Not Modified` when the client's copy is current, skipping rendering entirely.

```ruby
class BoardsController < ApplicationController
  def show
    @board = Board.find(params[:id])
    fresh_when @board                       # 304 when unchanged
  end

  def index
    @boards = Board.includes(:creator).order(updated_at: :desc)
    fresh_when @boards                       # collection ETag
  end
end
```

Compose several objects when the response depends on more than one (including the viewer, when the markup varies per user):

```ruby
fresh_when [@board, @card, Current.user]
```

`stale?` is the same thing with an explicit branch, for when a fresh request still needs custom work before rendering.

---

## Russian-doll fragment caching

Nest `cache` blocks that mirror the data. Each fragment's key is the record's `cache_key_with_version` (id + `updated_at`); a child update touches its parent, which changes the parent's key too, so the right fragments rebuild and the rest are reused.

```erb
<%# boards/show.html.erb %>
<% cache @board do %>
  <h1><%= @board.name %></h1>

  <% @board.columns.each do |column| %>
    <% cache column do %>
      <% column.cards.each do |card| %>
        <% cache card do %>
          <%= render card %>
        <% end %>
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

The cascade that makes it work lives in the models:

```ruby
class Card < ApplicationRecord
  belongs_to :board, touch: true     # updating a card touches its board
  belongs_to :column, touch: true
end

class Comment < ApplicationRecord
  belongs_to :card, touch: true      # comment -> card -> board, all keys change
end
```

For a list, `cache_collection` caches each item and fetches them from the store in one multi-read:

```erb
<% cache_collection @board.cards, partial: "cards/card" %>
```

Leave genuinely real-time or per-request content out of the cached block (don't cache an activity feed that must always be live).

---

## Expensive non-view work

When the expensive thing isn't a view, `Rails.cache.fetch` with a key that still embeds the record's version keeps invalidation key-based (no manual delete). `race_condition_ttl` avoids a thundering herd when a hot key expires.

```ruby
def statistics
  Rails.cache.fetch([self, "statistics", cache_version], expires_in: 1.hour,
                    race_condition_ttl: 10.seconds) do
    { cards: cards.count, closed: cards.closed.count }
  end
end
```

Reserve this for real cost; fragment caching covers most view work without it.

---

## Backend

Solid Cache (`config.cache_store = :solid_cache_store`) in development and production, database-backed so there's no Redis to run. Tests use `:null_store`, so caching is a no-op and never leaks state between tests, which is why a "does it cache?" test asserts behavior (a `304`, a touched timestamp), not store contents.

---

## Testing

Assert the observable effect: a conditional GET returns `304`, and a child update touches the parent (which is what changes the key).

```ruby
class BoardsControllerTest < ActionDispatch::IntegrationTest
  setup { sign_in_as users(:alice) }

  test "returns 304 when unchanged" do
    get board_url(boards(:design))
    etag = response.headers["ETag"]

    get board_url(boards(:design)), headers: { "If-None-Match" => etag }
    assert_response :not_modified
  end
end

class CardTest < ActiveSupport::TestCase
  test "touching a card updates its board" do
    card = cards(:logo)
    assert_changes -> { card.board.reload.updated_at } do
      card.touch
    end
  end
end
```

---

## Checklist

- `fresh_when` / `stale?` on `show` and `index` for free `304`s
- Fragment-cache views with `cache`, nested to mirror the data; `cache_collection` for lists
- `touch: true` on the `belongs_to` so child updates invalidate parent fragments
- Invalidation is key-based; no `Rails.cache.delete`, no sweepers
- `Rails.cache.fetch` only for expensive non-view work, keyed on the record version
- Solid Cache in dev/prod, `:null_store` in test; tests assert behavior, not store contents

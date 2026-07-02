# Turbo

Reactive UI without a JS framework. Three tools, reach for them in this order: **Frames** scope a piece of the page to navigate on its own, **Streams** send targeted DOM operations in a response, **Broadcasts** push those Streams to every viewer over a channel. Drop to Stimulus only for behavior Turbo can't express (see `stimulus.md`). Read before building interactive views.

---

## Streams: targeted DOM ops in a response

A write action answers `turbo_stream` and renders a `*.turbo_stream.erb` view that mutates specific DOM ids. Keep the `html` branch as the no-JS fallback.

```ruby
def create
  @comment = @card.comments.create!(comment_params)

  respond_to do |format|
    format.turbo_stream
    format.html { redirect_to @card }
  end
end
```

```erb
<%# cards/comments/create.turbo_stream.erb %>
<%= turbo_stream.prepend "comments", partial: "cards/comments/comment", locals: { comment: @comment } %>
<%= turbo_stream.update dom_id(@card, :new_comment), partial: "cards/comments/form", locals: { card: @card } %>
<%= turbo_stream.update dom_id(@card, :comment_count) do %>
  <%= @card.comments.count %>
<% end %>
```

Eight actions: `append`, `prepend`, `replace` (whole element), `update` (inner content), `remove`, `before`, `after`, and `morph` (see below). Target by dom id or by record (`turbo_stream.remove @comment`). Render several in one view; wrap any in an `if` to send it conditionally.

---

## Broadcasts: push Streams to every viewer

A model broadcasts on commit; a view subscribes with `turbo_stream_from`. Now an action by one user updates everyone watching, with no controller code.

```ruby
module Card::Broadcastable
  extend ActiveSupport::Concern

  included do
    after_create_commit  { broadcast_prepend_to board, :cards, target: "cards" }
    after_update_commit  { broadcast_replace_to board }
    after_destroy_commit { broadcast_remove_to board }
  end
end
```

```erb
<%# boards/show.html.erb %>
<%= turbo_stream_from @board, :cards %>
<div id="cards"><%= render @board.cards %></div>
```

Use the `_later` variants (`broadcast_replace_later_to`) when the partial is expensive, so rendering runs in a job instead of the request/commit path. Reserve broadcasts for genuinely shared state; a change only the acting user sees belongs in the Stream response, not a broadcast.

---

## Frames: scope a fragment

`turbo_frame_tag` makes a region navigate independently: links and forms inside it replace only the frame. Three everyday uses.

**Lazy load** deferred or expensive content:

```erb
<%= turbo_frame_tag dom_id(@card, :comments), src: card_comments_path(@card), loading: :lazy do %>
  <p>Loading…</p>
<% end %>
```

**Modal** via a shared empty frame the link targets:

```erb
<%= turbo_frame_tag "modal" %>
<%= link_to "New Card", new_card_path, data: { turbo_frame: "modal" } %>
```

**Inline edit** by giving the show and edit views the same frame id, so the edit form swaps in place:

```erb
<%# cards/_card.html.erb %>          <%# cards/edit.html.erb %>
<%= turbo_frame_tag card do %>       <%= turbo_frame_tag @card do %>
  <%= link_to card.title,              <%= form_with(model: @card) { ... } %>
        edit_card_path(card) %>      <% end %>
<% end %>
```

Break out of a frame with `data: { turbo_frame: "_top" }` (navigate the whole page) when a form inside a frame should redirect normally.

---

## Morphing

`turbo_stream.morph` diffs the DOM instead of swapping the node wholesale, preserving focus, cursor, scroll, and Stimulus state. Prefer it over `replace` when the target holds form inputs, scroll position, or a live controller.

```ruby
render turbo_stream: turbo_stream.morph(dom_id(@card, :container),
  partial: "cards/container", locals: { card: @card.reload })
```

Mark a node that must survive any refresh with `data-turbo-permanent` (e.g. a playing `<video>`); it keeps its state across morphs and page loads.

---

## Testing

Request `as: :turbo_stream` and assert the response renders the expected action (see `test.md`).

```ruby
test "create responds with a turbo stream" do
  post card_comments_path(@card), params: { comment: { body: "Nice" } }, as: :turbo_stream

  assert_response :success
  assert_equal "text/vnd.turbo-stream.html", response.media_type
  assert_match "turbo-stream", response.body
end
```

---

## Checklist

- Write actions answer `format.turbo_stream` with a `.turbo_stream.erb` view; `format.html` stays a working fallback
- Target by dom id or record; use the action that fits (`replace` vs `update`, `morph` for stateful nodes)
- Shared state updates via a model `broadcast_*_to` + `turbo_stream_from`; `_later` when the partial is expensive
- Frames for lazy loading, modals, and inline edit; `_top` to break out
- `morph` (or `data-turbo-permanent`) when focus, scroll, or controller state must survive
- Turbo first; Stimulus only for what Turbo can't do
- Stream responses tested for media type and body

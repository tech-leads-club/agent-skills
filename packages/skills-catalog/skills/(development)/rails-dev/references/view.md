# View

Read this before writing or reviewing any ERB view, partial, or helper.

A view renders. It does not query the database and it does not decide domain
questions. Both belong to a rich model. When an ERB template opens with a run of
`<% ... %>` scriptlets that call scopes, filter, or branch on domain state, the
intent of the page is buried under data-fetching, and the presentation layer is
now coupled to the schema and to scope names.

---

## Views render, models decide

Push queries and selection logic into a model method. The view receives the
answer already shaped.

```erb
<%# Don't: the view queries and decides which tier is which %>
<% tiers = workshop.price_tiers.where(kind: kind).order(:price_cents) %>
<% active = workshop.price_tiers.live(kind).first %>
<% upcoming = workshop.price_tiers.next(kind) %>
```

```ruby
# Do: the controller assigns the variable; the model answered the question
def show
  @price_tier_board = @workshop.price_tiers_for(params[:kind])
end
```

```erb
<%# the view reads the variable and renders it as intent %>
<%= @price_tier_board.active&.name %>
<% @price_tier_board.all.each do |tier| %>
  <%# ... %>
<% end %>
```

Where `price_tiers_for` returns a small PORO that encapsulates the scopes:

```ruby
# app/models/workshop/price_tier_board.rb
class Workshop::PriceTierBoard
  def initialize(workshop, kind:)
    @tiers = workshop.price_tiers.where(kind: kind).order(:price_cents)
    @kind = kind
  end

  def all = @tiers
  def active = @tiers.live(@kind).first
  def upcoming = @tiers.next(@kind)
end
```

The object lives under `app/models/` because it answers domain questions, not
because it renders. If the three concepts are only ever a single query, a plain
model method returning that relation is enough; reach for the PORO when there
are several related questions to name.

## Reusable markup is a helper plus a partial

For shared UI (a card surface, a table, a breadcrumb) the pattern is a plain
Rails helper that renders a partial layout. That is the whole abstraction: a
named `*_tag` helper in `app/helpers/components_helper.rb` wrapping a partial in
`app/views/components/`. No library.

```ruby
# app/helpers/components_helper.rb
def card_tag(classes: nil, &block)
  render layout: "components/card", locals: { classes: classes }, &block
end
```

```erb
<%# app/views/components/_card.html.erb %>
<div class="<%= class_names("rounded-box border border-base-content/10 bg-base-100", local_assigns[:classes]) %>">
  <%= yield %>
</div>
```

```erb
<%= card_tag do %>
  <p>Content</p>
<% end %>
```

Extend an existing `*_tag` or add a new one alongside its partial. Prefer this
over pulling in ViewComponent, a decorator, or a presenter layer (see SKILL.md,
"Minimal dependencies"): a helper and a partial cover the need without an extra
dependency.

A component holds markup only. It receives data already shaped by a model; it
does not query or decide which record is active. "Views render, models decide"
applies inside the component too.

## The controller assigns, the model decides

The view needs a variable, so the controller assigns it, exactly as it loads any
resource (`references/crud.md`: `@comments = @card.comments.recent`). What stays
out of the controller is the deciding: the `where`/`order`/scope-picking is the
model's job. The controller asks the model for the named concept in one line and
exposes it.

```ruby
# Do: thin controller assigns the named concept the model decided
def show
  @price_tier_board = @workshop.price_tiers_for(params[:kind])
end

# Don't: raw queries and record selection reconstructed in the controller
def show
  @tiers = @workshop.price_tiers.where(kind: params[:kind]).order(:price_cents)
  @active = @workshop.price_tiers.live(params[:kind]).first
  @upcoming = @workshop.price_tiers.next(params[:kind])
end
```

The second form scatters domain logic across the controller and leaves the
concept unnamed, so the smell returns in the next action that needs the same
data. A partial follows the same rule: it receives the resolved value as a
local, it does not query for it.

## What may stay in the view

- Iterating a collection the model handed over (`each`, `map` for display).
- Presentation-only branching on already-resolved values
  (`if @price_tier_board.active.present?`).
- Formatting through helpers and i18n (`number_to_currency`, `t(...)`).

A view holding a `.where`, an `.order`, a scope call, or a decision about which
record is "active" / "next" / "current" is the line. Past it, move to a model.

---

## Checklist

- No `.where`, `.order`, or scope calls in ERB; the model handed over the data
- No decision about which record is active/next/current in the view; the model
  answered it
- The deciding (queries, record selection) lives in a model method or a PORO
  under `app/models/`, named after the domain concept
- Variables the view needs are assigned in the controller in one line
  (`@board = @workshop.price_tiers_for(...)`), not reconstructed there as raw
  `where`/`order`/scope selection
- Reusable markup is a `*_tag` helper plus a partial in `app/views/components/`,
  not a new dependency (ViewComponent, decorator, presenter)
- Components receive already-shaped data; no queries or record selection inside
  them
- What remains in the view is iteration, presentation-only branching, and
  formatting helpers

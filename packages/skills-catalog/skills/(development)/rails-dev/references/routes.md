# Routes

**The routes file is the domain's resource map.** Every route is a noun, every
action is one of the seven REST actions
(`index/show/new/create/edit/update/destroy`), and the file reads as an index of
the app's resources. If you are writing a verb, you are missing a resource: see
`references/crud.md` for why a behavior becomes a noun.

---

## Group by bounded context only when it earns it

Default to flat top-level resources. Reach for a `namespace` or `scope` to
cluster a context only when it has enough routes to be a real area, not for a
lone resource.

```ruby
# Flat: member-facing resources stay at the top level
root to: "pages#home"
resource :session
resource :community, only: :show, controller: "community"
resources :certificates, param: :token, only: [ :index, :show ]

# Clustered: a context with many routes earns a namespace
namespace :admin do
  resources :members, only: [ :index, :show ]
  resources :access_groups
  namespace :catalog do
    resources :sources
  end
end
```

The controller tree mirrors whatever nesting the routes use: `namespace :admin`
maps to `app/controllers/admin/...`, `scope module: :members` to
`Admin::Members::...`.

## `namespace` vs `scope module:` vs `scope ..., as:`

Three tools, three prefixes. Pick the least that does the job.

| Helper | Path | Module | Route name |
|---|---|---|---|
| `namespace :admin` | `/admin` | `Admin::` | `admin_` |
| `scope module: :cards` | — | `Cards::` | — |
| `scope :members, module: :members, as: :members` | `/members` | `Members::` | `members_` |

`namespace` is the common case for an area. Use `scope module:` to nest
resources under a controller namespace without adding a path segment (the parent
resource already supplies the path). Use the explicit `scope ..., module:, as:`
only when you want the path and name prefixes but not a literal nested-resource
block.

```ruby
# Multiple nested resources under one controller namespace: one scope module: block
resources :sources do
  scope module: :sources do
    resource :sync,  only: [ :create ]
    resource :pause, only: [ :create, :destroy ]
    resources :failures, only: [ :show ]
  end
end

# A single nested resource: inline module:, no block
resources :columns, only: [] do
  resource :left_position, module: :columns
end
```

Never repeat `module:` on every line when a `scope module:` block would do.

## Constrain every resource with `only:`

Declare the actions each resource actually serves. The route table stays an
honest list of what exists; a bare `resources :x` silently exposes seven
actions, most of them 404s waiting to happen.

```ruby
resources :members,  only: [ :index, :show ]
resource  :sync,     only: [ :create ], module: :members
resources :llm_logs, only: [ :index, :show ]
```

## Singular `resource` and non-id keys

A singular `resource` (not `resources`) drops `index` and the `:id` segment. Use
it for a toggle (`create`/`destroy`) or a single thing with no collection
(`resource :session`, `resource :search`, `resource :profile`). The controller
is still plural-named (`Sessions::...`).

Use `param:` when the key in the URL is not an id:

```ruby
resources :certificates, param: :token, only: [ :index, :show ]
resources :pages, param: :slug, only: [ :show ]
```

## When `member` / `collection` is allowed

Default to a noun resource; a `member`/`collection` block is a smell that you
missed one. It is allowed only for an action with no resource behind it: an
export, a one-off read, a redirect.

```ruby
# Don't: a custom verb on the resource
resources :editions do
  member { post :publish }       # publish is a resource: resource :publication
end

# OK: an export or read with no noun of its own
resources :editions do
  member { get :export }
end
```

When in doubt, name the noun (`resource :publication`, `resource :regeneration`)
and keep the seven actions clean.

## Endpoints that aren't user resources

The same noun discipline applies to machine and infra endpoints.

```ruby
# Inbound webhooks: a singular resource, fixed controller
namespace :webhooks do
  namespace :inbound do
    resource :stripe, only: [ :create ], controller: "stripe"
    resource :zoom,   only: [ :create ], controller: "zoom"
  end
end

# Env-gated routes for dev-only surfaces
if Rails.env.local?
  namespace :design_system do
    resources :components, only: [ :index ]
  end
end

# Health check for load balancers and uptime monitors
get "up", to: "rails/health#show", as: :rails_health_check
```

## Polymorphic routes

When a model needs a URL derived from an association, use `resolve` / `direct`
so `link_to model` works without the caller knowing the shape.

```ruby
resolve "Comment" do |comment, options|
  options[:anchor] = ActionView::RecordIdentifier.dom_id(comment)
  route_for :card, comment.card, options
end

direct :published_board do |board, options|
  route_for :public_board, board.publication.key
end
```

---

## Checklist

- Every route is a noun; no custom verbs (a verb means a missing resource, see `crud.md`)
- Bounded contexts get a `namespace` only when they form a real area; lone resources stay flat
- Every resource declares `only:`
- Singular `resource` for toggles and single things; `param:` for non-id keys
- `scope module:` block to nest, never a repeated `module:` per line
- `member`/`collection` only for an action with no resource behind it
- Webhooks and env-gated routes follow the same noun discipline

# Controllers

Everything is CRUD. Controllers are thin: they map HTTP verbs to the seven REST actions and delegate the work to models. Read before writing or changing any controller.

---

## The one rule

When a behavior doesn't fit `index/show/new/create/edit/update/destroy`, you have not found an exception to CRUD: you have found a **new resource**. Name it as a noun and give it its own controller. Never add custom actions.

```ruby
# Don't: custom actions bolted onto a resource
resources :cards do
  post :close
  post :reopen
  post :gild
  post :postpone
end

# Do: each behavior is a noun-named resource
resources :cards do
  scope module: :cards do
    resource :closure      # POST closes, DELETE reopens
    resource :goldness     # POST gilds,  DELETE ungilds
    resource :not_now      # POST postpones, DELETE resumes
    resource :watch        # POST watches, DELETE unwatches

    resources :assignments
    resources :comments
  end
end
```

A singular `resource` (not `resources`) is the shape for a toggle: it drops `index` and the `:id` segment, leaving `create`/`destroy`. The controller is still plural-named (`Cards::ClosuresController`).

---

## State-change controller

Two actions, no business logic. The model owns the verb.

```ruby
# app/controllers/cards/closures_controller.rb
class Cards::ClosuresController < ApplicationController
  include CardScoped   # provides @card, @board

  def create
    @card.close(user: Current.user)
    render_card_replacement
  end

  def destroy
    @card.reopen
    render_card_replacement
  end
end
```

---

## Standard CRUD controller

```ruby
# app/controllers/cards/comments_controller.rb
class Cards::CommentsController < ApplicationController
  include CardScoped

  def index
    @comments = @card.comments.recent
  end

  def create
    @comment = @card.comments.create!(comment_params)

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @card }
    end
  end

  def update
    @comment = @card.comments.find(params[:id])
    @comment.update!(comment_params)
    head :no_content
  end

  def destroy
    @card.comments.find(params[:id]).destroy!

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to @card }
    end
  end

  private

  def comment_params
    params.require(:comment).permit(:body)
  end
end
```

---

## Translating a request into a resource

The only design question: **what noun does this represent?**

| Request | Resource |
|---|---|
| "Let users close cards" | `Cards::ClosuresController` (create/destroy) |
| "Let users follow a card" | `Cards::WatchesController` (create/destroy) |
| "Let users assign cards" | `Cards::AssignmentsController` (create/destroy) |
| "Let users publish boards" | `Boards::PublicationsController` (create/destroy) |
| "Let users reorder cards" | `Cards::PositionsController` (update) |
| "Let users archive projects" | `Projects::ArchivalsController` (create/destroy) |

---

## Routing

A state-change controller is reached through a nested `resource`: `scope module:`
groups them under the controller namespace.

```ruby
resources :cards do
  scope module: :cards do
    resources :comments
    resource :closure
    resource :goldness
  end
end
```

Full routing conventions (namespace vs scope, `only:`, `param:`,
`member`/`collection`, webhooks, polymorphic `resolve`) live in
`references/routes.md`.

---

## Scoping concerns

A `*Scoped` concern loads the parent resource in one place. Use the existing ones (`CardScoped`, `BoardScoped`); create a new one per parent resource.

```ruby
# app/controllers/concerns/project_scoped.rb
module ProjectScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_project
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end
end
```

---

## Responses

Turbo Stream is the default; add `format.html` for full-page fallback and `format.json` only when an API consumes the resource.

```ruby
def create
  @resource = @parent.resources.create!(resource_params)

  respond_to do |format|
    format.turbo_stream
    format.html { redirect_to @resource }
    format.json { render json: @resource, status: :created, location: @resource }
  end
end

def destroy
  @resource.destroy!

  respond_to do |format|
    format.turbo_stream
    format.html { redirect_to @resources_path }
    format.json { head :no_content }
  end
end
```

---

## Strong parameters and authorization

Always permit explicitly. Authorization checks live in the controller, but the *decision* is a model method.

```ruby
before_action :ensure_can_administer_card, only: :destroy

private

def card_params
  params.require(:card).permit(:title, :body, :column_id, :color)
end

def ensure_can_administer_card
  head :forbidden unless Current.user.can_administer_card?(@card)
end
```

---

## Checklist

- Every action is one of the seven REST verbs; no `member`/`collection` custom actions
- A behavior that doesn't fit becomes a new noun-named resource and controller
- Controllers are plural-named; singular `resource` for toggles
- No business logic in the controller; the model owns the verb
- Queries load through the parent resource (a `*Scoped` concern); authorization via model predicates
- Strong parameters on every write
- Authorization checks call model predicates (`can_administer_card?`)
- A matching controller test exists

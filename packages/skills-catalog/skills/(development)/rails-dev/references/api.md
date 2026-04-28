# JSON APIs

Rails serves JSON from the same controllers that serve HTML, through `respond_to` and Jbuilder. No GraphQL, no separate API stack, no serializer gem. Read before adding a JSON endpoint.

---

## Start with the simplest thing that works

The simplest API is the same controller serving both formats via `respond_to`: the action is shared, only the rendering branches. Start here when the web and JSON sides are thin and parallel.

```ruby
class BoardsController < ApplicationController
  def index
    @boards = Board.includes(:creator).order(created_at: :desc)

    respond_to do |format|
      format.html
      format.json   # renders index.json.jbuilder
    end
  end

  def create
    @board = Board.new(board_params)

    respond_to do |format|
      if @board.save
        format.html { redirect_to @board, notice: "Board created" }
        format.json { render :show, status: :created, location: @board }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render_error "validation_failed", :unprocessable_entity, "Validation failed", errors: @board.errors.messages }
      end
    end
  end
end
```

Return the right status: `201` created, `200` ok, `204` no_content on destroy, `404` missing, `422` for validation errors.

---

## Split into `Api::` when responsibilities diverge

Forking a parallel `Api::BoardsController` is a valid, often better choice once the web and API stop being the same thing: different authentication (session vs token), different params, independent versioning, different response shapes or error formats, separate rate limits. Splitting decouples them, so a change to the web flow doesn't ripple into the API contract, and vice versa.

```ruby
module Api
  class BoardsController < Api::BaseController   # token auth, JSON-only, its own base
    def index
      @boards = Board.includes(:creator).order(created_at: :desc)
      render :index   # app/views/api/boards/index.json.jbuilder
    end
  end
end
```

Rule of thumb: shared, thin, parallel responsibilities → one controller with `respond_to`; diverging lifecycles or a public/contract API → separate `Api::` controllers. Don't pre-split a trivial endpoint, and don't cram a diverging API into `respond_to` branches littered with `if json?`.

---

## JSON is a view: Jbuilder

Build JSON in `*.json.jbuilder`, never as an inline `render json: { ... }` hash (trivial error bodies aside). Extract shared shapes into partials so HTML and JSON stay DRY.

```ruby
# app/views/boards/show.json.jbuilder
json.extract! @board, :id, :name, :created_at, :updated_at
json.creator { json.partial! "users/user", user: @board.creator }
json.cards @board.cards, partial: "cards/card", as: :card
json.url board_url(@board, format: :json)
```

Cache fragments like HTML views (see `caching.md`):

```ruby
json.cache! @board do
  json.extract! @board, :id, :name
end
```

---

## Authentication

API clients authenticate per request, not through the session cookie. Pick by the need:

- **Simple case (your own clients, server-to-server): a bearer API token.** This is the simplest correct answer. A token model with `has_secure_token`, looked up from the `Authorization: Bearer` header, sets the principal for the request.

  ```ruby
  def authenticate_api_request
    token = request.authorization&.match(/\ABearer (.+)\z/)&.captures&.first
    @current_token = ApiToken.active.find_by(token:)
    render(json: { error: "Unauthorized" }, status: :unauthorized) unless @current_token
  end
  ```

- **OAuth (third-party apps, delegated access, standard flows): use Doorkeeper.** Don't hand-roll OAuth, that is where the security bugs live. Doorkeeper is the OAuth2 provider this app uses (with PKCE); reach for it rather than reinventing authorization-code, scopes, and token refresh.

Either way: skip CSRF for token-authenticated JSON, and reject an unauthenticated request with `401`, not an HTML redirect.

---

## Errors

One envelope for **every** error, so a client parses a single shape. Most errors are just `code` + `message`:

```json
{ "code": "not_found", "message": "Board abc123 not found" }
```

`errors` is added only when the response needs to carry more detail than `message` can, the canonical case being per-field validation:

```json
{
  "code": "validation_failed",
  "message": "Validation failed",
  "errors": { "name": ["can't be blank"], "email": ["is invalid"] }
}
```

- **`code`** — stable, enumerable string; the client switches on this and nothing else.
- **`message`** — human-readable, for this occurrence; may be localized, so clients never parse it.
- **`errors`** — optional; include it only when `message` isn't enough (e.g. field-level validation messages).

Don't return the raw `model.errors` hash for validation and a different `{ error: }` shape elsewhere: that inconsistency forces clients to handle two formats. The HTTP response already carries the status code, so it isn't repeated in the body.

Build it once and route every error through it. JSON write actions use bang methods so a validation failure raises into the same renderer:

```ruby
module ApiErrors
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound do
      render_error "not_found", :not_found, "Resource not found"
    end
    rescue_from ActiveRecord::RecordInvalid do |e|
      render_error "validation_failed", :unprocessable_entity, "Validation failed",
                   errors: e.record.errors.messages
    end
    rescue_from ActionController::ParameterMissing do |e|
      render_error "parameter_missing", :bad_request, e.message
    end
  end

  private

  def render_error(code, status, message, errors: nil)
    body = { code:, message: }
    body[:errors] = errors if errors
    render json: body, status:
  end
end
```

```ruby
def create
  board = Board.create!(board_params)   # RecordInvalid -> validation_failed envelope
  render :show, status: :created, location: board
end
```

---

## HTTP caching

Conditional GET is free with `fresh_when` / `stale?`; the client gets a `304` when nothing changed (see `caching.md`).

```ruby
def show
  @board = Board.find(params[:id])
  fresh_when @board   # ETag + Last-Modified; renders show.json.jbuilder on a miss
end
```

---

## Pagination

Page-based or cursor-based; expose the metadata in the body or response headers.

```ruby
@boards = Board.order(created_at: :desc).page(params[:page]).per(25)
```

```ruby
# index.json.jbuilder
json.boards @boards, partial: "boards/board", as: :board
json.pagination do
  json.current_page @boards.current_page
  json.total_pages  @boards.total_pages
  json.total_count  @boards.total_count
end
```

Version only when a breaking change forces it; prefer additive changes (new fields don't break clients).

---

## Testing

Integration test, request `as: :json`, assert the status and the parsed body (see `test.md`).

```ruby
class BoardsControllerTest < ActionDispatch::IntegrationTest
  setup { sign_in_as users(:alice) }

  test "index returns json" do
    get boards_path, as: :json

    assert_response :success
    assert_equal Board.count, JSON.parse(response.body).size
  end

  test "create rejects invalid params" do
    post boards_path, params: { board: { name: "" } }, as: :json

    assert_response :unprocessable_entity
    assert JSON.parse(response.body)["name"].present?
  end
end
```

---

## Checklist

- Start with one controller + `respond_to`; split into `Api::` controllers when web and API responsibilities diverge (auth, params, versioning, contract)
- JSON lives in Jbuilder views and partials, never inline hashes
- Correct status codes (`201`/`200`/`204`/`404`/`422`); JSON errors for JSON requests, never an HTML page
- Every error returns one envelope (`code` + `message`, `errors` only on validation); the client switches on `code`
- Clients authenticate per request, not the session cookie: a bearer API token for simple cases, Doorkeeper for OAuth; `401` on failure
- Conditional GET via `fresh_when` / `stale?`
- No GraphQL, no serializer gem, no bespoke API framework
- Tested for status code and body shape

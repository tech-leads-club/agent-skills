---
name: rails-dev
description: "Opinionated Rails conventions: rich models, concerns, CRUD-everything, state-as-records, minimal dependencies, Minitest with fixtures. Load this skill BEFORE any code-level thinking, not only before editing a file. It is required the moment a task touches Rails code in ANY way: designing or even just discussing a data model, schema, migration, entity, association, field, validation, class, or method name; writing, planning, reviewing, analyzing, testing, debugging, or refactoring; or proposing any model, table, column, route, or code snippet inline in chat. If you are about to name a model or sketch a column you are already in scope, even in an exploratory back-and-forth where no file is written yet. Do not let a \"we're just discussing\" framing defer it. Do NOT use for non-Rails backends, NestJS, or general architecture (use nestjs-modular-monolith or coding-guidelines)."
metadata:
  author: William Calderipe - github.com/wcalderipe
  version: '1.0.0'
---

# Rails Conventions

## Core Philosophy

- **Rich models** - Business logic lives in models, not service objects
- **Everything is CRUD** - New resource over new action (`resource :closure` not `post :close`)
- **State as records** - `Closure` model instead of `closed: boolean`
- **Concerns for composition** - `Closeable`, `Watchable`, `Commentable`
- **Explicit over clever** - Inline until repetition is real; an abstraction earns its place, it isn't built on speculation
- **Small interfaces** - No public method without a caller
- **Let it crash** - Bang methods (`create!`), handle failures at the boundary, not by pre-guarding (`references/error-handling.md`)
- **Invariants in the schema** - Hard rules (presence, uniqueness, ranges) are NOT NULL / unique / check constraints; validations are for user-facing messages, not the source of truth. References stay soft: no foreign keys, integrity at the model layer
- **Minimal dependencies** - Build it yourself before reaching for gems. No Devise, Pundit, RSpec, FactoryBot, ViewComponent, service/form objects, or decorators
- **Database-backed** - Solid Queue/Cache/Cable, no Redis
- **Test coverage** - Maintain roughly 1:1 test ratio (1 line test per line of code)

## Reference Selection

This table is an index, not the content. The conventions live in the reference files, not in this table, the codebase, or general Rails knowledge. Match the task to the rows below and **read those files end to end before you design, write, review, or analyze the code**. Reading the row is not reading the reference; guessing from the codebase is how the wrong convention gets shipped.

| Task | Reference |
|------|-----------|
| Models, validations, associations, business logic | `references/model.md` |
| Custom validators, validation rules reused across models | `references/validator.md` |
| Error handling, rescue boundaries, reporting, retries | `references/error-handling.md` |
| Controllers, CRUD actions | `references/crud.md` |
| Routes, `config/routes.rb`, resource mapping | `references/routes.md` |
| Concerns, shared behavior | `references/concerns.md` |
| State tracking (not booleans) | `references/state-records.md` |
| Authentication, authorization, sessions, IDOR scoping | `references/auth.md` |
| Database migrations | `references/migration.md` |
| Minitest, fixtures, testing | `references/test.md` |
| Views, ERB, partials, helpers, presentation logic | `references/view.md` |
| Turbo Frames, Turbo Streams, real-time | `references/turbo.md` |
| Stimulus controllers, JS sprinkles | `references/stimulus.md` |
| Background jobs, Solid Queue | `references/jobs.md` |
| Concurrency, fibers, Async, external I/O | `references/async.md` |
| Mailers, email notifications | `references/mailer.md` |
| Fragment caching, HTTP caching | `references/caching.md` |
| REST API, JSON responses | `references/api.md` |
| Multi-tenancy, account scoping | `references/multi-tenant.md` |
| Event tracking, activity logs | `references/events.md` |
| Webhooks (inbound/outbound), inbox, idempotency | `references/webhooks.md` |
| Code review, consistency check | `references/review.md` |
| HTTP clients, external APIs, Faraday | `references/http-client.md` |
| Logging, log messages, Rails.logger | `references/logging.md` |

## Coding style

These are cross-cutting rules: they apply to every file, regardless of area. They do **not** replace the references. For anything area-specific (models, controllers, jobs, views, tests, …) you MUST ALWAYS load the matching reference from the table above before writing or reviewing the code.

### Conditionals

Use an expanded `if/else` over a value-returning guard clause. A guard clause at the top of a method is fine when the body is non-trivial.

```ruby
# Don't: value-returning guard clause for a simple branch
def status_label
  return "closed" if closed?
  "open"
end

# Do: expanded if/else
def status_label
  if closed?
    "closed"
  else
    "open"
  end
end
```

### Method order

Class methods, then public (with `initialize` first), then private. Order methods vertically by invocation: a caller sits above its callees.

```ruby
# Don't: callee above its caller, public after private
class Signup
  def create_member = Member.create!(email:)
  def call = create_member
end

# Do: class method, then the caller, then its callees
class Signup
  def self.call(...) = new(...).call

  def call = create_member

  private
    def create_member = Member.create!(email:)
end
```

### Visibility

No blank line after `private`; indent the methods beneath it. A module of only private methods marks `private` at the top with a blank line after, not indented.

```ruby
# Don't: blank line after private, methods not indented
class Card
  private

  def closure_exists? = closure.present?
end

# Do: no blank line, indented under private
class Card
  private
    def closure_exists? = closure.present?
end
```

### Bang methods

Use `!` only when a non-bang counterpart exists (like `save`/`save!`). Never add `!` just to flag a destructive or important action.

```ruby
# Don't: unpaired bang used to signal "this is destructive"
def revoke! = update!(revoked_at: Time.current)

# Do: plain domain verb; the ! belongs to the paired persistence call
def revoke = update!(revoked_at: Time.current)
```

### Method naming

Public methods are domain verbs. When a verb collides with a scope, predicate, or core method (`Kernel#fail`), prefix with `mark_` (no bang): `mark_failed`. Class and concept naming live in `references/model.md`.

```ruby
# Don't: mark_ prefix when the plain verb is free
def mark_published = update!(published_at: Time.current)

# Do: plain verb; reserve mark_ for a real collision (fail -> Kernel#fail)
def publish = update!(published_at: Time.current)
def mark_failed = update!(failed_at: Time.current)
```

### Comments

Default to none. Most comments are noise: the code and naming should carry the meaning.

Add one only when the code can't carry it:

- The path or code can't make the problem clear.
- The model's language is ambiguous and a note clarifies where it sits in the domain.

Don't:

- Restate what the code already says.
- Section code (e.g. `# ----- some_method -----` banners in tests).

When a comment earns its place:

- Plain English, always.
- Concise.
- No LLM-slop vocabulary.
- Use a list when it reads clearer than prose.

```ruby
# Don't: restates what the code already says; section banner
# increment the attempts counter
attempts += 1

# ----- private helpers -----

# Do: explains the non-obvious why
# Circle returns 422 on duplicate emails, so we reconcile instead of recreating.
reconcile_member(email)
```

### Errors

Don't swallow errors. Make the failure accessible to the caller, usually by recording it on a returned object rather than logging and returning `false`. Full handling conventions (record vs raise, reporting, wrapping, retries) live in `references/error-handling.md`.

```ruby
# Don't: swallow the error; the caller can't tell it failed
def provision_circle
  circle_client.create_community_member(...)
rescue Circle::AdminClient::ApiError
  false
end

# Do: record the failure on the returned object
def provision_circle
  circle_client.create_community_member(...)
  circle_access.mark_successful(external_id: response.dig(:community_member, :id))
rescue Circle::AdminClient::ApiError => e
  circle_access.mark_failed(error: e.message)   # caller checks access.failed?
end
```

## Sources

These conventions are adapted from, and may diverge from, these reference apps:

- [basecamp/fizzy](https://github.com/basecamp/fizzy)
- [railswhey/app](https://github.com/railswhey/app)


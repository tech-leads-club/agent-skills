# Authentication & authorization

Session-based auth, built in, no Devise. Authentication answers *who you are* (the `User` principal, passwordless sign-in by default via a magic link, a `Session` as the established login); authorization answers *what you can reach* (lookups scoped to the current user, model predicates). This is security-sensitive: read before touching any auth code, and prefer the existing helpers over new mechanisms.

---

## The model

- **`User`** — the principal. `has_one :password`, `has_many :sessions`, `has_many :magic_links`, `normalizes :email_address`.
- **`MagicLink`** — single-use, short-lived code; the default, passwordless sign-in.
- **`Password`** — a separate model: `has_secure_password validations: false`, minimum length 8 on create. Optional second path; a user can exist with magic-link sign-in only.
- **`Session`** — an established login. Its credential is the session's own id.

---

## The session credential

A session is identified by its **id (a ULID) carried in a signed cookie**, not a separate random token. Signing makes the cookie tamper-proof; `httponly` and `same_site: :lax` limit theft and CSRF. Don't invent a token column; the signed id is the credential.

```ruby
class Session < ApplicationRecord
  belongs_to :user

  def self.find_by_cookie(cookies)
    includes(:user).find_by(id: cookies.signed[:session_id]) if cookies.signed[:session_id]
  end
end
```

`Current.session` holds it for the request; `Current.user` is delegated from the session (see `model.md`).

---

## The Authentication concern

`require_authentication` runs as a `before_action` everywhere. Opt a controller (or action) out explicitly:

```ruby
class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[new create]
end
```

Resume, start, terminate:

```ruby
def resume_session
  Current.session ||= Session.find_by_cookie(cookies)
end

def start_new_session_for(user)
  user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
    Current.session = session
    cookies.signed.permanent[:session_id] = { value: session.id, httponly: true, same_site: :lax }
  end
end

def terminate_session
  Current.session.destroy
  cookies.delete(:session_id)
end
```

After sign-in the user is sent to a stored return-to location, but only after it is validated against open redirects. Never redirect to a user-supplied URL without this check:

```ruby
def valid_return_to_url?(url)
  return url.start_with?("/") && !url.start_with?("//") unless url.include?("://")
  domain_of(URI.parse(url).host) == domain_of(request.host)
rescue URI::InvalidURIError
  false
end
```

---

## Signing in: passwordless by default

`SessionsController#create` is rate-limited. The default path is passwordless: with no password submitted, it sends a magic link. A password is the opt-in path, taken only when the password field is filled.

```ruby
rate_limit to: 10, within: 3.minutes, only: :create, with: :rate_limit_exceeded

def create
  if params[:password].present?
    authenticate_with_password    # opt-in
  else
    authenticate_with_magic_link  # default, passwordless
  end
end
```

The password branch finds the user and verifies through the optional `Password`:

```ruby
def authenticate_with_password
  user = User.find_by(email_address: params[:email_address])

  if user&.password&.authenticate(params[:password])
    start_new_session_for user
    redirect_after_sign_in(user)
  else
    redirect_to new_session_path, alert: "Invalid email or password."
  end
end
```

`user&.password&.authenticate(...)` is safe-navigated because a magic-link-only user has no `Password`. The default magic-link path is below.

---

## Magic links

`User#send_magic_link` creates a link and mails it (`SessionMailer.magic_link(...).deliver_later`). `MagicLink.consume(code)` validates and destroys it.

```ruby
class MagicLink < ApplicationRecord
  CODE_LENGTH = 6
  EXPIRATION_TIME = 15.minutes
  MAX_ACTIVE_PER_USER = 10

  belongs_to :user
  scope :active, -> { where(expires_at: Time.current..) }

  def self.consume(code)
    active.find_by(code: Code.sanitize(code))&.consume
  end

  def consume
    destroy   # single-use: consuming removes it
    self
  end
end
```

Every protection here is load-bearing, don't weaken them:

- **Single-use + short-lived**: `consume` destroys the link; codes expire in 15 minutes.
- **Capped per user**: `MAX_ACTIVE_PER_USER` with oldest-eviction stops flooding.
- **No user enumeration**: an unknown email still redirects to the code-entry page (backed by a fake pending-authentication token), so the response is identical whether or not the account exists.
- **No leak outside development**: the dev-only convenience that surfaces the code (flash / `X-Magic-Link-Code` header) is guarded by an `after_action` that raises if the code ever appears in any other environment.

**Why a code to type, not a one-click link.** The email carries a 6-character code the user enters on a page that consumes it via **POST** (`Sessions::MagicLinksController#create`); the GET (`#show`) only renders the form and consumes nothing. There is deliberately no URL that marks the link used on open. Email security scanners, Outlook SafeLinks, and prefetchers issue GET requests on links in mail, so a consume-on-GET link would be burned before the human ever clicks it. Keep consumption on the POST. Do not add a clickable magic URL that marks the link used, it reintroduces this bug.

---

## Authorization

Authentication ends at *who you are*; authorization is the separate question of *what you can reach*. The guiding rule: **a param chooses *which* record within an already-authorized set; it never establishes access.**

**Scope lookups to what the current user can reach.** Load through `Current.user`, or an association the user owns, so a forged or wrong id 404s instead of leaking. This is the IDOR defense, and it holds even though the app is single-tenant: ownership, not tenancy, is the boundary.

```ruby
# Don't: the param establishes access
@card = Card.find(params[:id])

# Do: scoped to what the user can reach; a foreign id 404s
@card = Current.user.accessible_cards.find(params[:id])

# Through a join the user owns
@membership = Current.user.memberships.find_by!(room_id: params[:room_id])
```

A collection action scopes the same way: `@cards = Current.user.accessible_cards`, never `Card.all`.

**Models define the permission; controllers enforce it.** A permission is a predicate on the model that owns the rule; the controller checks it and denies with `head :forbidden`. Fail closed: when access can't be proven, deny.

```ruby
class Card < ApplicationRecord
  def editable_by?(user) = user.staff? || user == creator
end

# controller
def update
  head :forbidden unless @card.editable_by?(Current.user)
  # ...
end
```

**Centralize common guards as `before_action` macros.** Shared postures live in the `Authorization` concern; inline a one-off.

```ruby
# app/controllers/concerns/authorization.rb
def ensure_staff
  head :forbidden unless Current.user&.staff?
end

# admin controllers opt in
class Admin::UsersController < ApplicationController
  include Authorization
  before_action :ensure_staff
end

# a one-off guard, inline
head :forbidden unless workshop_ia_access?
```

**Public sharing uses an opaque token, never an internal id.** A shareable resource is routed and looked up by a token (`param: :token`), so ids stay unguessable and there is no unscoped id lookup to leak.

```ruby
resources :certificates, param: :token, only: [ :index, :show ]
# Certificate.find_by!(token: params[:token]), never Certificate.find(params[:id])
```

---

## If the app is multi-tenant

This app is single-tenant: a session identifies a person and authentication ends there. The section below applies only if the app becomes multi-tenant; skip it otherwise.

In a multi-tenant app, authentication has a second step after identifying the user: resolving and scoping the active tenant. The load-bearing rule is that the tenant comes from the user's **membership**, never from a request parameter alone, so a user can only act inside tenants they belong to.

```ruby
def set_current_tenant
  # params/subdomain proposes a tenant; membership authorizes it
  Current.account = Current.user.memberships.find_by!(account_id: params[:account_id]).account
end
```

Resolve the active tenant per request (from subdomain, path, or a stored choice), validate it against the user's memberships, and treat a missing or non-member tenant as a 404 or redirect, never a silent fallback. Then scope every query through `Current.account`. See `multi-tenant.md` for the full scoping pattern.

---

## Testing

Use the shared `sign_in_as` helper, which performs a real login through the controller:

```ruby
def sign_in_as(user)
  post session_url, params: { email_address: user.email_address, password: "password" }
end
```

Cover both branches (password and magic link), the rejection path (wrong password), and the rate limit. Assert that an unknown email is indistinguishable from a known one.

---

## Checklist

- Session credential is the signed `session_id` cookie (`httponly`, `same_site: :lax`), never a raw or guessable token
- New controllers authenticate by default; opt out only with `allow_unauthenticated_access`
- Every return-to / redirect target is validated against open redirects
- Lookups load through `Current.user` / the association; a foreign id 404s, never an unscoped `Model.find(params[:id])`
- Authorization is a model predicate + `head :forbidden`; shared guards live in the `Authorization` concern, failing closed
- Public/shareable resources are looked up by an opaque token, never an internal id
- Login is rate-limited; magic links stay single-use, short-lived, and capped per user
- Auth flows never reveal whether an email maps to an account
- Magic-link codes never leave development (the guard stays in place)
- Tests cover password and magic-link sign-in via `sign_in_as`, plus the rejection and enumeration paths

# Multi-tenancy

The pattern for an app whose data belongs to isolated tenants (accounts), where one tenant must never see another's data. **This codebase is single-tenant**, so none of this is wired up today: there is no `account_id`, and queries scope by `Current.user` / membership. This documents the shape to follow *if and when* tenancy is introduced, and the principle behind the `account_id` column the other references mention as conditional.

The cardinal rule: every query is scoped to the current tenant, explicitly. A query that forgets the scope leaks another tenant's data, which is the worst bug a multi-tenant app can have.

---

## The model

- **`Account`** is the tenant. Every tenant-scoped table carries an indexed `account_id`.
- **`Membership`** joins users to accounts; a user can belong to several, with a role. Access is membership, not a column on the user.
- **`Current.account`** holds the active tenant for the request; all scoping reads from it.

```ruby
class Account < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :boards, dependent: :destroy
end

class Membership < ApplicationRecord
  belongs_to :account
  belongs_to :user
  enum :role, { member: "member", admin: "admin" }
end
```

---

## Resolve the tenant from the URL, authorize by membership

Prefer URL-based tenancy (`/accounts/:account_id/...`): the tenant is explicit in every request, easy to read and debug, with no subdomain DNS juggling or per-schema database (Apartment) complexity.

Resolve `Current.account` from the user's **memberships**, never from the raw param. The param proposes a tenant; membership authorizes it. A non-member tenant is a `404`, never a silent fallback to some default.

```ruby
module AccountScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_current_account
  end

  private

  def set_current_account
    Current.account = Current.user.accounts.find(params[:account_id])
    # RecordNotFound (not a member) -> 404, handled globally
  end
end
```

---

## Scope every query explicitly, never with `default_scope`

Go through `Current.account` for every read and write. Do not reach for `default_scope`: it is implicit, leaks through associations in surprising ways, and is painful to bypass when you legitimately must. Explicit scoping is the security boundary, and you want it visible.

```ruby
# Don't: unscoped, leaks across tenants
@board = Board.find(params[:id])

# Do: scoped to the active tenant
@board = Current.account.boards.find(params[:id])
```

A `*Scoped` controller concern (see `concerns.md`) loads the parent through `Current.account` in one place, so individual actions can't forget. New tenant-scoped tables get `account_id` in the migration (see `migration.md`).

---

## Testing

The test that matters most asserts isolation: a member of account A cannot reach account B's data.

```ruby
test "cannot access another account's board" do
  sign_in_as users(:alice)                 # member of account A only
  get account_board_path(accounts(:b), boards(:b_secret))
  assert_response :not_found
end
```

---

## Checklist

- Every tenant-scoped table has an indexed `account_id`
- `Current.account` is resolved from the user's memberships, never from a raw param; non-member tenant → `404`
- Every query goes through `Current.account`; no `default_scope`
- Scoping is centralized in a `*Scoped` concern so no action forgets it
- A test proves cross-tenant isolation (member of A gets `404` for B)
- Tenancy is URL-based; not applicable to this single-tenant codebase until accounts exist

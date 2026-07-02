# Testing

Minitest, never RSpec. Fixtures, never factories. Assert behavior, not implementation. Any change to domain logic ships with tests for the happy path and the edge cases. Write the test first. Read before writing tests.

---

## The one rule

Test what the code *does*, observable from the outside, not how it does it. A test that asserts a method was called is coupled to the implementation; a test that asserts the resulting state is coupled to the behavior. Favor integration tests (controller + model together) over isolated unit tests; reach for a unit test when the logic is gnarly enough to deserve one.

Pyramid: a few system tests (full browser), many integration tests, some focused unit tests. Heavy coverage on model tests (domain invariants) and integration tests (auth, formats, the full request cycle); light on system tests (critical happy paths only); none on views or Stimulus/JS units. Assert a given behavior at one layer, not repeated up the stack.

---

## Fixtures

Fixtures load once for the whole suite, so they are fast and shared. Name them after what they represent, reference associations by fixture name (never raw ids), and keep them minimal: only the columns a test reads.

```yaml
# test/fixtures/members.yml
bob:
  user: bob                 # association by fixture name
  name: Bob Silva
  status: active

carol:
  user: carol
  name: Carol Santos
  status: active
```

ERB is allowed for dynamic values; YAML anchors remove repetition:

```yaml
defaults: &defaults
  status: active

alice_primary:
  <<: *defaults
  verified_at: <%= 1.day.ago %>
```

Namespaced models need an explicit fixture-class map in `test_helper.rb` (the file name uses underscores, the class is namespaced):

```ruby
set_fixture_class member_access_groups: Member::AccessGroup,
                  newsletter_editions:  Newsletter::Edition
```

Primary keys are ULIDs (see `references/migration.md`). Give a standalone fixture an id with `<%= ULID.generate %>`; reference another fixture's id deterministically with `ActiveRecord::FixtureSet.identify`:

```yaml
oauth_access_token:
  resource_owner_id: <%= ActiveRecord::FixtureSet.identify(:bob, :ulid) %>
```

---

## Model tests

`Current` is request-scoped and empty in a model test, so pass the acting user explicitly rather than relying on the `Current.user` default. Assert the effect of a behavior: the record count changes, the predicate flips, scope membership changes, the actor/timestamp is captured.

```ruby
require "test_helper"

class CardTest < ActiveSupport::TestCase
  setup do
    @card = cards(:logo)
    @user = users(:alice)
  end

  test "closing a card creates a closure and records the actor" do
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

  test "tracks an event after creation" do
    assert_difference -> { Event.count }, 1 do
      Card.create!(title: "New", board: @card.board, column: @card.column)
    end
  end
end
```

Test your own logic (custom validations, scopes, predicates, state transitions). Do **not** test framework behavior: that `validates :title, presence: true` works is Rails' job, not yours.

Time-dependent logic uses `travel_to` / `freeze_time`, never real time or `sleep`:

```ruby
test "a grant expires after 30 days" do
  travel_to 31.days.from_now do
    assert @grant.expired?
  end
end
```

---

## Controller / integration tests

Use the shared `sign_in_as` helper. It performs a real login, so the test exercises the actual auth path:

```ruby
# test/test_helper.rb (already defined)
def sign_in_as(user)
  post session_url, params: { email_address: user.email_address, password: "password" }
end

def sign_out = delete session_url
```

```ruby
class CardsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @card = cards(:logo)
    sign_in_as users(:alice)
  end

  test "creates a card" do
    assert_difference -> { Card.count }, 1 do
      post board_cards_path(@card.board), params: { card: { title: "New", column_id: @card.column_id } }
    end
    assert_redirected_to card_path(Card.last)
  end

  test "create responds with a turbo stream" do
    post card_comments_path(@card), params: { comment: { body: "Nice" } }, as: :turbo_stream

    assert_response :success
    assert_equal "text/vnd.turbo-stream.html", response.media_type
  end
end
```

Machine endpoints (API, MCP, inbound webhooks) are tested as JSON: assert the status and, on create, the `Location`.

```ruby
test "creates a document" do
  post api_prosemirror_documents_path, params: { prosemirror_document: { body: "..." } }, as: :json
  assert_response :created
end
```

Authorization is part of behavior. Assert both the allowed and the denied path:

```ruby
test "requires authentication" do
  sign_out
  get card_path(@card)
  assert_redirected_to new_session_path
end

test "non-admin cannot delete" do
  sign_in_as users(:bob)
  delete card_path(@card)
  assert_response :forbidden
end
```

---

## System tests

For critical user-facing flows only (they are slow). Drive the browser, assert what the user sees. Turbo updates appear without a reload.

```ruby
require "application_system_test_case"

class CardsTest < ApplicationSystemTestCase
  setup { sign_in_as users(:alice) }

  test "adding a comment" do
    visit card_path(cards(:logo))
    fill_in "Body", with: "Great work!"
    click_button "Add Comment"
    assert_text "Great work!"   # inserted via Turbo Stream, no reload
  end
end
```

---

## Job and mailer tests

Test the `_now` path for behavior and assert enqueueing where it matters. Use `assert_enqueued_with` to assert a job was scheduled, and `perform_enqueued_jobs(only:)` when a test needs the downstream effect to actually run.

```ruby
test "signup schedules the welcome email" do
  assert_enqueued_with(job: ActionMailer::MailDeliveryJob) do
    Member::Signup.new(email_address: "new@example.com").call
  end
end

test "confirming due referrals notifies each one" do
  assert_difference -> { Notification.count }, 2 do
    perform_enqueued_jobs(only: Referral::NotifyJob) do
      Referral::ConfirmDueReferralsJob.perform_now
    end
  end
end
```

```ruby
class NotifyRecipientsJobTest < ActiveJob::TestCase
  test "creates a notification per recipient" do
    assert_difference -> { Notification.count }, 2 do
      NotifyRecipientsJob.perform_now(comments(:logo_comment))
    end
  end
end

class MagicLinkMailerTest < ActionMailer::TestCase
  test "sign-in email carries the code" do
    link = magic_links(:alice_sign_in)
    email = MagicLinkMailer.sign_in_instructions(link)

    assert_emails(1) { email.deliver_now }
    assert_equal [link.email_address], email.to
    assert_match link.code, email.body.to_s
  end
end
```

---

## Mocking with Mocha

Mocha is the mocking library (`require "mocha/minitest"`, already loaded). Stub external boundaries; never stub the object under test. Prefer real objects and fixtures over mocks.

```ruby
SomeClient.stubs(:fetch).returns(payload)          # stub a class method
object.stubs(:remote_call).returns(value)          # stub an instance method
Mailer.expects(:deliver_later).once                # assert a call happened
```

For HTTP, prefer VCR (see `support/vcr_setup`) over hand-stubbing requests.

---

## Anti-patterns

- **Factories.** Use fixtures. `FactoryBot.create(:card)` → `cards(:logo)`.
- **Testing implementation.** `@card.expects(:create_closure!)` couples to internals. Assert `@card.closed?` instead.
- **Creating data that a fixture already provides.** Reach for `users(:alice)`, not `User.create!`.
- **Testing the framework.** Skip tests that only prove Rails validations/associations work.
- **Leaving a failing or skipped test to "fix later."** A red test is a broken build.
- **Production complexity for tests.** Don't add a method, hook, or branch to production code only to make a test pass.
- **Duplicating a behavior assertion across layers.** Assert it once, at the layer that owns it.
- **Time-dependent assertions without `travel_to`.** Flaky by construction.

---

## Checklist

- Minitest + fixtures; no RSpec, no factories
- Domain-logic change ships with happy-path and edge-case tests, written first
- Tests assert observable behavior, not method calls
- `sign_in_as` for authenticated requests; assert allowed and denied paths
- Namespaced fixtures registered via `set_fixture_class`
- External boundaries stubbed with Mocha / VCR; the unit under test is never stubbed
- Time-dependent logic wrapped in `travel_to` / `freeze_time`
- Enqueueing asserted with `assert_enqueued_with`; effects via `perform_enqueued_jobs(only:)`
- ULID fixture ids via `ULID.generate` / `FixtureSet.identify`
- A behavior is asserted at one layer, not duplicated up the stack
- No failing or skipped tests left behind

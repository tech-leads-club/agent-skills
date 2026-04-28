# Mailers

Transactional email through Action Mailer, no service abstraction. Minimal HTML styled by the shared layout's classes, delivered in the background. Read before writing a mailer.

---

## The shape

Inherit `ApplicationMailer`, which sets the `from:` address and the `mailer` layout. A method assigns ivars and calls `mail(to:, subject:)`.

```ruby
class SessionMailer < ApplicationMailer
  self.delivery_job = PriorityMailerJob   # time-sensitive: jump the bulk queue

  def magic_link(magic_link)
    @code = magic_link.code
    @expires_at = magic_link.expires_at
    mail(to: magic_link.email, subject: "Your sign-in code")
  end
end
```

---

## Styling: the layout's classes

The `mailer` layout (`app/views/layouts/mailer.html.erb`) carries a small `<style>` block. Views use its classes rather than an external stylesheet.

| Class | Use |
|---|---|
| `title` | main heading |
| `subtitle` | secondary line under the title |
| `code` | monospace code or token |
| `footer` | muted small print |

```erb
<h1 class="title">Verification code</h1>
<p class="subtitle">Use this code to sign in:</p>
<p><strong class="code"><%= @code %></strong></p>
<p class="footer">The code expires in <%= distance_of_time_in_words(Time.current, @expires_at) %>.</p>
```

Provide both `.html.erb` and `.text.erb` for every mailer method.

---

## Delivery

Background by default: call `deliver_later` from the model (the `_later` convention, see `jobs.md`), never `deliver_now` in the request cycle.

```ruby
def send_magic_link
  magic_links.create!.tap { |link| SessionMailer.magic_link(link).deliver_later }
end
```

Time-sensitive mail (auth codes, security alerts) sets `self.delivery_job = PriorityMailerJob` so it does not sit behind bulk mail. Retry and backoff live in those jobs.

---

## Bundle, don't spam

Prefer one digest over one email per event: if ten things happen, send a summary, not ten emails. Mailers are transactional only; newsletter and marketing content is a separate concern and never shares a transactional mailer.

```ruby
class DigestMailer < ApplicationMailer
  def daily(user, activities)
    @user, @activities = user, activities
    mail(to: user.email_address, subject: "Your daily summary")
  end
end
```

---

## Previews

Every mailer gets a preview in `test/mailers/previews/`, browsable at `/rails/mailers`. It is the fastest way to see an email while building it and doubles as living documentation. Build the argument from a real record where you can (`User.take`).

```ruby
# test/mailers/previews/session_mailer_preview.rb
# Preview at http://localhost:3000/rails/mailers/session_mailer
class SessionMailerPreview < ActionMailer::Preview
  def magic_link
    SessionMailer.magic_link(User.take.magic_links.new(code: "ABC123", expires_at: 15.minutes.from_now))
  end
end
```

---

## Testing

`ActionMailer::TestCase`. Assert it enqueues and that the body carries what matters (see `test.md`).

```ruby
class SessionMailerTest < ActionMailer::TestCase
  test "magic link email carries the code" do
    link = magic_links(:alice_sign_in)
    email = SessionMailer.magic_link(link)

    assert_emails(1) { email.deliver_now }
    assert_equal [link.email], email.to
    assert_match link.code, email.body.to_s
  end
end
```

---

## Checklist

- Inherit `ApplicationMailer`
- Style with the layout classes (`title`/`subtitle`/`code`/`footer`); no external stylesheet
- Both `.html.erb` and `.text.erb` per mailer method, plus a preview in `test/mailers/previews/`
- Deliver with `deliver_later` from the model; time-sensitive mail uses `PriorityMailerJob`
- Digests over one-email-per-event; transactional and marketing stay separate
- Tested with `ActionMailer::TestCase` for enqueue and body content

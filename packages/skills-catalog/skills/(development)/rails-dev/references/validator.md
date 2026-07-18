# Validator

A validator is a validation rule written once as a class and reused across models. Read this before writing any custom validation, whether as a class or inline on a model.

---

## Where validators live

- **Cross-domain rules** (reusable across unrelated models) are classes in `app/validators/`, named `XxxValidator < ActiveModel::EachValidator` and used via `validates :attr, xxx: true`.
- **Module-specific rules** live under `app/validators/<module>/`, namespaced to that module (`app/validators/stripe/subscription_status_validator.rb` → `Stripe::SubscriptionStatusValidator`). Keep a validator here when its rule only makes sense inside one domain.
- **A rule specific to one model** stays a private `validate :method` on that model (see `references/model.md`). Don't promote it to `app/validators/` until a second model needs the same rule.

## Search before you write

Before adding a validator, look through `app/validators/` for one that already does the job. Reuse or extend it instead of writing a near-duplicate.

```bash
find app/validators -name '*_validator.rb'
```

## Single purpose

A validator does one thing and does it completely. "One thing" is the rule itself, not a hard-coded subset of it.

A URL validator's job is "this is a valid URL with an allowed scheme". The allowed schemes are an input, not a constant baked into the class: make them an option so the same validator covers `http`/`https` in one model and `file`/`ftp` in another.

```ruby
# Don't: the scheme set is hard-coded, so the next use case forks the class
class UrlValidator < ActiveModel::EachValidator
  ALLOWED_SCHEMES = %w[http https].freeze

  def validate_each(record, attribute, value)
    return if value.blank?

    uri = URI.parse(value)
    record.errors.add(attribute, :invalid_url_scheme) unless uri.scheme.in?(ALLOWED_SCHEMES)
  rescue URI::InvalidURIError
    record.errors.add(attribute, :invalid_url)
  end
end

# Do: one rule, configurable through options
class UrlValidator < ActiveModel::EachValidator
  DEFAULT_SCHEMES = %w[http https].freeze

  def validate_each(record, attribute, value)
    return if value.blank?

    uri = URI.parse(value)
    record.errors.add(attribute, :invalid_url_scheme) unless uri.scheme.in?(allowed_schemes)
  rescue URI::InvalidURIError
    record.errors.add(attribute, :invalid_url)
  end

  private
    def allowed_schemes = options.fetch(:schemes, DEFAULT_SCHEMES)
end
```

```ruby
validates :linkedin_url, url: true, allow_blank: true                       # http/https
validates :attachment_url, url: { schemes: %w[http https file] }, allow_blank: true
```

Add error messages as i18n symbols (`:invalid_url`), never raw strings.

---

## Checklist

- Cross-model rules are `*Validator` classes in `app/validators/`; one-off rules stay a private `validate` on the model
- Searched `app/validators/` for an existing validator before writing a new one
- The validator covers one rule, configurable via `options`, not a hard-coded subset
- Errors added as i18n symbols, not raw strings

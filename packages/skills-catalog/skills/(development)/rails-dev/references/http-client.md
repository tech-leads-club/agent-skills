## HTTP Client Standards

### Faraday for HTTP Calls

- **Always use Faraday** for HTTP requests instead of Net::HTTP or other HTTP libraries
- Use Faraday connection adapters consistently across the application

### Constructor with Credential Defaults

Client constructors should default to credentials from `Rails.application.credentials`, allowing callers to just do `Client.new` in production code while tests can override with explicit values.

```ruby
class Github::Client
  def initialize(admin_token: nil)
    @admin_token = admin_token || Rails.application.credentials.dig(:github, :admin_token)
    @connection = build_connection
  end
end

# Production caller
Github::Client.new

# Test caller
Github::Client.new(admin_token: "test-token")
```

Avoid binding context-specific values (like `org`) to the constructor. Pass them as method arguments instead, so the client stays reusable across different contexts.

### API Response Validation

- **Always validate expected API responses** before processing
- Define the validation object in the same file as the client code
- Default to `ActiveModel::Model` + `ActiveModel::Attributes` — built into Rails, with type casting and validations

```ruby
class SomeClient
  class OrderResponse
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :id, :string
    attribute :status, :string
    # ... other fields

    validates :id, presence: true
    validates :status, presence: true
  end
end

order = SomeClient::OrderResponse.new(JSON.parse(payload))
order.valid? # => true/false, order.errors for details
```

If the project already uses the Dry ecosystem, `Dry::Schema.JSON` contracts are a fine alternative — but don't add the dependency just for this.

### Error Handling

When an HTTP call fails, the error that reaches the top of the stack must carry
enough to debug what happened: the status and the reason the API returned in its
body. A bare `"Request failed with status: 400"` is not enough.

Define a shared `Http::ResponseError` module (under `lib/http/`) that adds this
behavior, include it in the client's API error class, and raise with
`from_response` on a non-success response:

```ruby
class ApiError < FooClientError
  include Http::ResponseError
end

raise ApiError.from_response(response) unless response.success?
```

This gives the error:

- a message that appends the API reason from the body, so
  `"Request failed with status: 400"` becomes
  `"Request failed with status: 400 (Registration has not been enabled)"`
- structured detail via `to_h` (`status`, `response_body`, `response_headers`,
  `request_params`) for the boundary (controller or job) to report as context
  (see `references/logging.md`: report at boundaries, keep models quiet)

**Use a module, not a shared base class.** Each client keeps its own error
hierarchy (`FooClientError`) because consumers rescue it, and Ruby is single
inheritance. The API error already needs `< FooClientError`, so the module mixes
in the diagnosable behavior without consuming that slot or coupling every client
into one inheritance tree.

**Include it on the errors that wrap a response** (`ApiError`, and an auth error
raised from a 401), not on the client base or on a `ValidationError`, whose shape
(validation errors, not status plus body) is different.

Apply it consistently across every client that wraps an HTTP response, so
failures surface the same structured detail regardless of which API they hit.

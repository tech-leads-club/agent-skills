Express/Fastify router layer that owns all HTTP entry points for the API service. Auth, catalog, and order controllers live here; each one parses and validates a request, then delegates to a service or repository.

## Responsibilities

- Mount route handlers under `/auth`, `/catalog`, and `/orders`
- Enforce auth middleware and request schema validation before handlers run
- Translate domain errors into HTTP status codes

## Tech Stack

- Express 4 + zod for schema validation

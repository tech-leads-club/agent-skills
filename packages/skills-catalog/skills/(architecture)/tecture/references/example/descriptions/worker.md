Background worker that consumes order events and runs fulfillment side effects.

## Responsibilities

- Subscribe to `order.created`
- Trigger payment capture and fulfillment
- Write order status updates back to Postgres

## Tech Stack

- Node.js

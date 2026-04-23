Message broker carrying order-lifecycle events between services.

## Responsibilities

- Deliver `order.created` events from the API to the order worker
- Durable queuing for retry and backpressure

## Tech Stack

- RabbitMQ

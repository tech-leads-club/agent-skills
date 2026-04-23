Domain-layer module coordinating order placement.

## Responsibilities

- Validate order inputs against the catalog
- Persist new orders
- Publish `order.created` to the event bus
